import { mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import { tmpdir } from "os";
import {
  appendHistory,
  buildAgentPrompt,
  escapeTelegramHtml,
  isAllowedChatId,
  normalizeAgentOutput,
  parseAllowedChatIds,
  parseRouterState,
  type RouterAgent,
  type RouterState,
} from "../src/lib/telegram-router";
import { buildSearchCliArgs } from "../src/lib/sourcing/cli";
import {
  formatSearchSummaryForTelegram,
  parseSearchSummaryOutput,
  parseTelegramSearchIntent,
} from "../src/lib/sourcing/telegram";

interface TelegramChat {
  id: number;
}

interface TelegramUser {
  id: number;
}

interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface CliResult {
  ok: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  error?: string;
}

interface RuntimeConfig {
  botToken: string;
  workspaceDir: string;
  stateFile: string;
  pollTimeoutSeconds: number;
  maxHistoryTurns: number;
  maxOutputChars: number;
  allowedChatIds: Set<string> | null;
  claudeBin: string;
  claudeModel?: string;
  claudeTimeoutMs: number;
  codexBin: string;
  codexModel?: string;
  codexTimeoutMs: number;
  searchCliBin: string;
  searchTimeoutMs: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildConfig(): RuntimeConfig {
  const workspaceDir = process.env.BREAKIN_WORKSPACE_DIR ?? process.cwd();

  return {
    botToken: requireEnv("TELEGRAM_BOT_TOKEN"),
    workspaceDir,
    stateFile: process.env.AGENT_ROUTER_STATE_FILE
      ?? path.join(workspaceDir, ".runtime", "telegram-router-state.json"),
    pollTimeoutSeconds: numberFromEnv("AGENT_ROUTER_POLL_TIMEOUT_SECONDS", 50),
    maxHistoryTurns: numberFromEnv("AGENT_ROUTER_MAX_HISTORY_TURNS", 12),
    maxOutputChars: numberFromEnv("AGENT_ROUTER_MAX_OUTPUT_CHARS", 3500),
    allowedChatIds: parseAllowedChatIds(process.env.TELEGRAM_ALLOWED_CHAT_IDS),
    claudeBin: process.env.CLAUDE_BIN ?? "claude",
    claudeModel: process.env.CLAUDE_MODEL,
    claudeTimeoutMs: numberFromEnv("CLAUDE_TIMEOUT_MS", 120_000),
    codexBin: process.env.CODEX_BIN ?? "codex",
    codexModel: process.env.CODEX_MODEL,
    codexTimeoutMs: numberFromEnv("CODEX_TIMEOUT_MS", 180_000),
    searchCliBin: process.env.SEARCH_CLI_BIN ?? "npx",
    searchTimeoutMs: numberFromEnv("SEARCH_TIMEOUT_MS", 15 * 60_000),
  };
}

async function loadState(stateFile: string): Promise<RouterState> {
  try {
    const raw = await readFile(stateFile, "utf8");
    return parseRouterState(raw);
  } catch {
    return parseRouterState(null);
  }
}

async function saveState(stateFile: string, state: RouterState): Promise<void> {
  await mkdir(path.dirname(stateFile), { recursive: true });
  await writeFile(stateFile, JSON.stringify(state, null, 2));
}

async function telegramApi<T>(
  botToken: string,
  method: string,
  payload: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram API ${method} failed: ${response.status} ${text}`);
  }

  const json = await response.json() as { ok: boolean; result?: T; description?: string };
  if (!json.ok || json.result === undefined) {
    throw new Error(`Telegram API ${method} failed: ${json.description ?? "unknown error"}`);
  }

  return json.result;
}

async function getUpdates(
  config: RuntimeConfig,
  offset: number
): Promise<TelegramUpdate[]> {
  return telegramApi<TelegramUpdate[]>(config.botToken, "getUpdates", {
    offset,
    timeout: config.pollTimeoutSeconds,
    allowed_updates: ["message"],
  });
}

async function sendChatAction(
  config: RuntimeConfig,
  chatId: number,
  action: "typing"
): Promise<void> {
  await telegramApi<boolean>(config.botToken, "sendChatAction", {
    chat_id: chatId,
    action,
  });
}

async function sendMessage(
  config: RuntimeConfig,
  chatId: number,
  text: string,
  replyToMessageId?: number
): Promise<void> {
  await telegramApi<boolean>(config.botToken, "sendMessage", {
    chat_id: chatId,
    text: escapeTelegramHtml(text),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_parameters: replyToMessageId ? { message_id: replyToMessageId } : undefined,
  });
}

function runCliCommand(
  bin: string,
  args: string[],
  cwd: string,
  timeoutMs: number
): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5_000).unref();
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        code: null,
        stdout,
        stderr,
        timedOut,
        error: error.message,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        ok: code === 0 && !timedOut,
        code,
        stdout,
        stderr,
        timedOut,
      });
    });
  });
}

function buildClaudeArgs(config: RuntimeConfig, prompt: string): string[] {
  const args: string[] = [];
  if (config.claudeModel) {
    args.push("--model", config.claudeModel);
  }
  args.push("-p", prompt);
  return args;
}

function buildCodexArgs(
  config: RuntimeConfig,
  prompt: string,
  outputFile: string
): string[] {
  const args = [
    "exec",
    "--full-auto",
    "-C",
    config.workspaceDir,
    "--output-last-message",
    outputFile,
    "--color",
    "never",
  ];
  if (config.codexModel) {
    args.push("-m", config.codexModel);
  }
  args.push(prompt);
  return args;
}

function shouldFallbackToCodex(result: CliResult, normalizedOutput: string): boolean {
  if (result.timedOut || !result.ok || !normalizedOutput) return true;

  const combined = `${result.stdout}\n${result.stderr}`.toLowerCase();
  return (
    combined.includes("rate limit")
    || combined.includes("too many requests")
    || combined.includes("overloaded")
    || combined.includes("timed out")
  );
}

async function runAgent(
  config: RuntimeConfig,
  agent: RouterAgent,
  prompt: string
): Promise<CliResult> {
  if (agent === "claude") {
    return runCliCommand(
      config.claudeBin,
      buildClaudeArgs(config, prompt),
      config.workspaceDir,
      config.claudeTimeoutMs
    );
  }

  const tempDir = await mkdtemp(path.join(tmpdir(), "breakin-telegram-router-"));
  const outputFile = path.join(tempDir, "codex-last-message.txt");

  try {
    const result = await runCliCommand(
      config.codexBin,
      buildCodexArgs(config, prompt, outputFile),
      config.workspaceDir,
      config.codexTimeoutMs
    );

    try {
      const lastMessage = await readFile(outputFile, "utf8");
      return {
        ...result,
        stdout: lastMessage || result.stdout,
      };
    } catch {
      return result;
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function summarizeFailure(agent: RouterAgent, result: CliResult): string {
  if (result.timedOut) return `${agent} timed out`;
  if (result.error) return `${agent} failed to start: ${result.error}`;
  if (result.code !== null) return `${agent} exited with code ${result.code}`;
  return `${agent} failed`;
}

async function handleMessage(
  config: RuntimeConfig,
  state: RouterState,
  message: TelegramMessage
): Promise<RouterState> {
  const text = message.text?.trim();
  if (!text) return state;

  const chatId = String(message.chat.id);
  if (!isAllowedChatId(chatId, config.allowedChatIds)) {
    return state;
  }

  await sendChatAction(config, message.chat.id, "typing").catch(() => {});

  const searchIntent = parseTelegramSearchIntent(text);
  if (searchIntent) {
    const searchResult = await runSearchPipeline(config, searchIntent.request);
    const reply = searchResult.reply;

    await sendMessage(config, message.chat.id, reply, message.message_id);

    let nextState = appendHistory(
      state,
      chatId,
      {
        role: "user",
        text,
        at: new Date().toISOString(),
      },
      config.maxHistoryTurns
    );

    nextState = appendHistory(
      nextState,
      chatId,
      {
        role: "assistant",
        text: reply,
        at: new Date().toISOString(),
        agent: "codex",
      },
      config.maxHistoryTurns
    );

    return nextState;
  }

  const prompt = buildAgentPrompt({
    message: text,
    history: state.chats[chatId] ?? [],
    workspaceDir: config.workspaceDir,
  });

  const claudeResult = await runAgent(config, "claude", prompt);
  const claudeOutput = normalizeAgentOutput(claudeResult.stdout, config.maxOutputChars);

  let reply = claudeOutput;
  let replyAgent: RouterAgent = "claude";

  if (shouldFallbackToCodex(claudeResult, claudeOutput)) {
    const codexResult = await runAgent(config, "codex", prompt);
    const codexOutput = normalizeAgentOutput(codexResult.stdout, config.maxOutputChars);

    if (codexResult.ok && codexOutput) {
      reply = codexOutput;
      replyAgent = "codex";
    } else {
      const details = [
        summarizeFailure("claude", claudeResult),
        summarizeFailure("codex", codexResult),
      ].join("; ");
      reply =
        `Les deux agents ont echoue. ${details}. Verifie le service VPS puis relance.`;
      replyAgent = "codex";
    }
  }

  await sendMessage(config, message.chat.id, reply, message.message_id);

  let nextState = appendHistory(
    state,
    chatId,
    {
      role: "user",
      text,
      at: new Date().toISOString(),
    },
    config.maxHistoryTurns
  );

  nextState = appendHistory(
    nextState,
    chatId,
    {
      role: "assistant",
      text: reply,
      at: new Date().toISOString(),
      agent: replyAgent,
    },
    config.maxHistoryTurns
  );

  return nextState;
}

async function runSearchPipeline(
  config: RuntimeConfig,
  request: Record<string, unknown>
) {
  const outputDir = path.join(
    config.workspaceDir,
    ".runtime",
    "source-offers",
    `telegram-${Date.now()}`
  );
  const args = buildSearchCliArgs({
    ...request,
    source: "telegram",
    outputDir,
  });

  const result = await runCliCommand(
    config.searchCliBin,
    args,
    config.workspaceDir,
    config.searchTimeoutMs
  );
  const summary = parseSearchSummaryOutput(result.stdout);

  if (result.ok && summary) {
    return { reply: formatSearchSummaryForTelegram(summary) };
  }

  const details = normalizeAgentOutput(
    [result.stderr, result.stdout, result.error]
      .filter(Boolean)
      .join("\n"),
    1500
  );

  return {
    reply: details
      ? `La recherche d'offres a echoue.\n${details}`
      : "La recherche d'offres a echoue. Verifie le pipeline de sourcing sur le VPS.",
  };
}

async function main(): Promise<void> {
  const config = buildConfig();
  let state = await loadState(config.stateFile);

  console.log(
    `[telegram-router] starting in ${config.workspaceDir} using state ${config.stateFile}`
  );

  for (;;) {
    try {
      const updates = await getUpdates(config, state.offset);

      for (const update of updates) {
        const message = update.message;
        if (!message) {
          state = {
            ...state,
            offset: update.update_id + 1,
          };
          await saveState(config.stateFile, state);
          continue;
        }

        state = await handleMessage(config, state, message);
        state = {
          ...state,
          offset: update.update_id + 1,
        };
        await saveState(config.stateFile, state);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[telegram-router] ${message}`);
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[telegram-router] fatal: ${message}`);
  process.exit(1);
});
