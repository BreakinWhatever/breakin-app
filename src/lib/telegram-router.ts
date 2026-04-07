export type RouterAgent = "claude" | "codex";
export type RouterRole = "user" | "assistant";

export interface RouterTurn {
  role: RouterRole;
  text: string;
  at: string;
  agent?: RouterAgent;
}

export interface RouterState {
  offset: number;
  chats: Record<string, RouterTurn[]>;
}

export interface BuildPromptOptions {
  message: string;
  history: RouterTurn[];
  now?: Date;
  workspaceDir: string;
}

export const EMPTY_ROUTER_STATE: RouterState = {
  offset: 0,
  chats: {},
};

const ANSI_PATTERN =
  // Strip common ANSI escape sequences from CLI output before sending to Telegram.
  /\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

export function parseAllowedChatIds(raw?: string): Set<string> | null {
  if (!raw) return null;

  const ids = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return ids.length > 0 ? new Set(ids) : null;
}

export function isAllowedChatId(
  chatId: string | number,
  allowedChatIds: Set<string> | null
): boolean {
  if (!allowedChatIds) return true;
  return allowedChatIds.has(String(chatId));
}

export function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, "");
}

export function truncateForTelegram(text: string, maxChars = 3500): string {
  if (text.length <= maxChars) return text;
  const suffix = "\n\n[truncated]";
  return `${text.slice(0, maxChars - suffix.length).trimEnd()}${suffix}`;
}

export function normalizeAgentOutput(text: string, maxChars = 3500): string {
  const cleaned = stripAnsi(text).replace(/\r/g, "").trim();
  if (!cleaned) return "";
  return truncateForTelegram(cleaned, maxChars);
}

export function escapeTelegramHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function appendHistory(
  state: RouterState,
  chatId: string,
  turn: RouterTurn,
  maxTurns: number
): RouterState {
  const history = [...(state.chats[chatId] ?? []), turn].slice(-maxTurns);

  return {
    ...state,
    chats: {
      ...state.chats,
      [chatId]: history,
    },
  };
}

export function parseRouterState(raw: string | null | undefined): RouterState {
  if (!raw) return EMPTY_ROUTER_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<RouterState>;

    return {
      offset: typeof parsed.offset === "number" ? parsed.offset : 0,
      chats: typeof parsed.chats === "object" && parsed.chats !== null
        ? Object.fromEntries(
            Object.entries(parsed.chats).map(([chatId, turns]) => [
              chatId,
              Array.isArray(turns)
                ? turns
                    .filter(
                      (turn): turn is RouterTurn =>
                        typeof turn === "object" &&
                        turn !== null &&
                        typeof turn.role === "string" &&
                        typeof turn.text === "string" &&
                        typeof turn.at === "string"
                    )
                    .map((turn) => ({
                      role: turn.role,
                      text: turn.text,
                      at: turn.at,
                      agent: turn.agent === "codex" ? "codex" : turn.agent === "claude" ? "claude" : undefined,
                    }))
                : [],
            ])
          )
        : {},
    };
  } catch {
    return EMPTY_ROUTER_STATE;
  }
}

export function buildAgentPrompt({
  message,
  history,
  now = new Date(),
  workspaceDir,
}: BuildPromptOptions): string {
  const trimmedHistory = history.slice(-8);
  const historyBlock = trimmedHistory.length > 0
    ? trimmedHistory
        .map((turn) => {
          const who = turn.role === "user"
            ? "User"
            : `Assistant${turn.agent ? ` (${turn.agent})` : ""}`;
          return `${who} [${turn.at}]:\n${turn.text}`;
        })
        .join("\n\n")
    : "No prior history.";

  return [
    "You are replying to a Telegram message for the BreakIn VPS agent.",
    `Current time: ${now.toISOString()}.`,
    `Workspace: ${workspaceDir}.`,
    "Use the repository instructions already present in the workspace.",
    "If the user asks you to inspect code, logs, or run the agent, do the work instead of only describing a plan unless blocked.",
    "Reply in the same language as the user's latest message.",
    "Keep the answer concise and directly sendable on Telegram.",
    "Return only the final reply, with no preamble about the tool you used.",
    "",
    "Conversation so far:",
    historyBlock,
    "",
    "Latest user message:",
    message.trim(),
  ].join("\n");
}
