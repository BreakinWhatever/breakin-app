import { closeSync, openSync } from "fs";
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
import { buildSearchArgs } from "../src/lib/sourcing/cli";
import {
  buildSearchJobLogFile,
  buildSearchJobOutputDir,
  createEmptySearchProgress,
  createSearchJobId,
  createSearchJobRecord,
  findActiveSearchJobForChat,
  listSearchJobRecords,
  readSearchJobRecord,
  updateSearchJobRecord,
} from "../src/lib/sourcing/jobs";
import { buildSearchCheckpoint } from "../src/lib/ops/checkpoints";
import {
  formatSearchJobAcknowledgement,
  formatSearchJobListForTelegram,
  formatSearchJobStatusForTelegram,
  parseTelegramSearchJobIntent,
  parseTelegramSearchIntent,
} from "../src/lib/sourcing/telegram";
import { enqueueApplyJob } from "../src/lib/apply/service";
import { launchLocalApplyDispatcher } from "../src/lib/apply/launcher";
import { listApplyJobRecords, readApplyJobRecord } from "../src/lib/apply/jobs";
import { serializeApplyJob } from "../src/lib/apply/payloads";
import {
  formatApplyJobAcknowledgement,
  formatApplyJobListForTelegram,
  formatApplyJobStatusForTelegram,
  parseTelegramApplyIntent,
  parseTelegramApplyJobIntent,
} from "../src/lib/apply/telegram";

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

  const searchJobIntent = parseTelegramSearchJobIntent(text);
  if (searchJobIntent) {
    const reply = await handleSearchJobStatus(
      config,
      chatId,
      searchJobIntent.jobId,
      searchJobIntent.mode
    );
    await sendMessage(config, message.chat.id, reply, message.message_id);
    return appendReplyToState(config, state, chatId, text, reply, "codex");
  }

  const applyJobIntent = parseTelegramApplyJobIntent(text);
  if (applyJobIntent) {
    const reply = await handleApplyJobStatus(chatId, applyJobIntent.jobId, applyJobIntent.mode);
    await sendMessage(config, message.chat.id, reply, message.message_id);
    return appendReplyToState(config, state, chatId, text, reply, "codex");
  }

  const applyIntent = parseTelegramApplyIntent(text);
  if (applyIntent) {
    const reply = await startApplyJob(
      config.workspaceDir,
      chatId,
      message.message_id,
      applyIntent.offerIdOrUrl
    );
    await sendMessage(config, message.chat.id, reply, message.message_id);
    return appendReplyToState(config, state, chatId, text, reply, "codex");
  }

  const searchIntent = parseTelegramSearchIntent(text);
  if (searchIntent) {
    const reply = await startSearchJob(
      config,
      chatId,
      message.message_id,
      searchIntent.request
    );
    await sendMessage(config, message.chat.id, reply, message.message_id);
    return appendReplyToState(config, state, chatId, text, reply, "codex");
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
  return appendReplyToState(config, state, chatId, text, reply, replyAgent);
}

async function startSearchJob(
  config: RuntimeConfig,
  chatId: string,
  replyToMessageId: number,
  request: Record<string, unknown>
) {
  const activeJob = await findActiveSearchJobForChat(config.workspaceDir, chatId);
  if (activeJob) {
    return [
      "Une recherche est deja en cours.",
      "",
      formatSearchJobStatusForTelegram(activeJob),
    ].join("\n");
  }

  const jobId = createSearchJobId();
  const outputDir = buildSearchJobOutputDir(config.workspaceDir, jobId);
  const job = await createSearchJobRecord(config.workspaceDir, {
    jobId,
    chatId,
    replyToMessageId,
    status: "queued",
    createdAt: new Date().toISOString(),
    launcher: "detached",
    outputDir,
    logFile: buildSearchJobLogFile(config.workspaceDir, jobId),
    request: {
      ...request,
      source: "telegram",
      outputDir,
    },
    progress: createEmptySearchProgress(),
    checkpoint: buildSearchCheckpoint(createEmptySearchProgress()),
  });

  const launched = await launchSearchJob(config, jobId, Number(chatId), replyToMessageId, {
    ...request,
    source: "telegram",
    outputDir,
  });

  if (!launched.ok) {
    const failed = await updateSearchJobRecord(config.workspaceDir, jobId, {
      status: "failed",
      endedAt: new Date().toISOString(),
      error: launched.error,
      progress: {
        ...createEmptySearchProgress(),
        phase: "failed",
        updatedAt: new Date().toISOString(),
        message: launched.error,
      },
      checkpoint: buildSearchCheckpoint({
        ...createEmptySearchProgress(),
        phase: "failed",
        updatedAt: new Date().toISOString(),
        message: launched.error,
      }),
    });

    return failed
      ? formatSearchJobStatusForTelegram(failed)
      : `La recherche d'offres a echoue au lancement.\n${launched.error}`;
  }

  await updateSearchJobRecord(config.workspaceDir, jobId, {
    status: "running",
    startedAt: new Date().toISOString(),
    pid: launched.pid ?? undefined,
    progress: {
      ...createEmptySearchProgress(),
      phase: "starting",
      updatedAt: new Date().toISOString(),
      message: "Worker de recherche lance",
    },
    checkpoint: buildSearchCheckpoint({
      ...createEmptySearchProgress(),
      phase: "starting",
      updatedAt: new Date().toISOString(),
      message: "Worker de recherche lance",
    }),
  });

  return formatSearchJobAcknowledgement(job);
}

async function handleSearchJobStatus(
  config: RuntimeConfig,
  chatId: string,
  requestedJobId: string | undefined,
  mode: "status" | "list"
) {
  if (mode === "list") {
    const jobs = await listSearchJobRecords(config.workspaceDir, { chatId, limit: 5 });
    return formatSearchJobListForTelegram(jobs);
  }

  const job = requestedJobId
    ? await readSearchJobRecord(config.workspaceDir, requestedJobId)
    : await findActiveSearchJobForChat(config.workspaceDir, chatId)
      ?? (await listSearchJobRecords(config.workspaceDir, { chatId, limit: 1 }))[0]
      ?? null;

  if (!job) {
    return "Aucun job de recherche trouve pour ce chat.";
  }

  return formatSearchJobStatusForTelegram(job);
}

async function startApplyJob(
  workspaceDir: string,
  chatId: string,
  replyToMessageId: number,
  offerIdOrUrl: string
) {
  const queued = await enqueueApplyJob(workspaceDir, {
    offerId: offerIdOrUrl,
    source: "telegram",
    chatId,
    replyToMessageId,
    llmProvider: "auto",
  });

  if (!queued.offer) {
    return "Offre introuvable.";
  }

  if (!queued.job) {
    if (queued.reason === "already_applied") {
      return `Cette offre est deja postulee.${queued.applicationId ? ` Application: ${queued.applicationId}` : ""}`;
    }

    return "Une candidature est deja en cours pour cette offre.";
  }

  if (!queued.created) {
    return [
      "Une candidature est deja en cours pour cette offre.",
      formatApplyJobStatusForTelegram(await serializeApplyJob(queued.job)),
    ].join("\n\n");
  }

  const launched = await launchLocalApplyDispatcher(workspaceDir, queued.job.id);
  if (!launched.ok) {
    return `La candidature n'a pas pu etre lancee.\n${launched.error}`;
  }

  return formatApplyJobAcknowledgement(queued.job.id);
}

async function handleApplyJobStatus(
  chatId: string,
  requestedJobId: string | undefined,
  mode: "status" | "list"
) {
  if (mode === "list") {
    const jobs = await listApplyJobRecords({ chatId, limit: 5 });
    return formatApplyJobListForTelegram(jobs);
  }

  const job = requestedJobId
    ? await readApplyJobRecord(requestedJobId)
    : (await listApplyJobRecords({ chatId, limit: 1 }))[0] ?? null;

  if (!job) {
    return "Aucun job de candidature trouve pour ce chat.";
  }

  return formatApplyJobStatusForTelegram(await serializeApplyJob(job));
}

async function launchSearchJob(
  config: RuntimeConfig,
  jobId: string,
  chatId: number,
  replyToMessageId: number,
  request: Record<string, unknown>
) {
  const logFile = buildSearchJobLogFile(config.workspaceDir, jobId);
  await mkdir(path.dirname(logFile), { recursive: true });

  const stdoutFd = openSync(logFile, "a");
  const stderrFd = openSync(logFile, "a");
  const args = [
    "tsx",
    "scripts/telegram-search-job.ts",
    "--job-id",
    jobId,
    "--chat-id",
    String(chatId),
    "--reply-to-message-id",
    String(replyToMessageId),
    ...buildSearchArgs(request),
  ];

  try {
    const child = spawn(config.searchCliBin, args, {
      cwd: config.workspaceDir,
      env: process.env,
      detached: true,
      stdio: ["ignore", stdoutFd, stderrFd],
    });
    child.unref();
    return {
      ok: true,
      pid: child.pid ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    closeSync(stdoutFd);
    closeSync(stderrFd);
  }
}

function appendReplyToState(
  config: RuntimeConfig,
  state: RouterState,
  chatId: string,
  userText: string,
  reply: string,
  agent: RouterAgent
) {
  let nextState = appendHistory(
    state,
    chatId,
    {
      role: "user",
      text: userText,
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
      agent,
    },
    config.maxHistoryTurns
  );

  return nextState;
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
