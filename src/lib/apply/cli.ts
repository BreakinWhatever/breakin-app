import type { LlmProvider } from "@/lib/scoring/llm";
import type { ApplyRequest } from "./types";

export const APPLY_SUMMARY_MARKER = "@@BREAKIN_APPLY_SUMMARY@@";

export type ApplyCliCommand =
  | { type: "run"; request: ApplyRequest }
  | { type: "status"; jobId: string }
  | { type: "jobs"; status?: string }
  | { type: "retry"; jobId: string };

export function parseApplyCliArgs(argv: string[]): ApplyCliCommand {
  const [subcommand = "run", ...rest] = argv;
  const flags = parseFlags(rest);

  if (subcommand === "status") {
    const jobId = readString(flags, "job-id") ?? rest[0] ?? "";
    if (!jobId) throw new Error("Missing job id for status.");
    return { type: "status", jobId };
  }

  if (subcommand === "jobs") {
    return {
      type: "jobs",
      status: readString(flags, "status") ?? undefined,
    };
  }

  if (subcommand === "retry") {
    const jobId = readString(flags, "job-id") ?? rest[0] ?? "";
    if (!jobId) throw new Error("Missing job id for retry.");
    return { type: "retry", jobId };
  }

  if (subcommand !== "run") {
    throw new Error(`Unsupported apply subcommand '${subcommand}'.`);
  }

  const offerId = readString(flags, "offer-id") ?? readString(flags, "offer");
  if (!offerId) {
    throw new Error("Missing --offer-id for apply run.");
  }

  return {
    type: "run",
    request: {
      offerId,
      source: readString(flags, "source") ?? "cli",
      force: readBoolean(flags, "force", false),
      chatId: readString(flags, "chat-id") ?? undefined,
      replyToMessageId: readNumber(flags, "reply-to-message-id") ?? undefined,
      llmProvider: readProvider(readString(flags, "llm-provider")),
    },
  };
}

export function formatApplySummaryForStdout(summary: unknown) {
  return `${APPLY_SUMMARY_MARKER}${JSON.stringify(summary)}`;
}

function parseFlags(argv: string[]) {
  const flags = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      flags.set(rawKey, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags.set(rawKey, true);
      continue;
    }

    flags.set(rawKey, next);
    index += 1;
  }

  return flags;
}

function readString(flags: Map<string, string | boolean>, key: string) {
  const value = flags.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readBoolean(
  flags: Map<string, string | boolean>,
  key: string,
  fallback: boolean
) {
  const value = flags.get(key);
  if (value === true) return true;
  if (typeof value === "string") {
    if (/^(1|true|yes|on)$/i.test(value)) return true;
    if (/^(0|false|no|off)$/i.test(value)) return false;
  }
  return fallback;
}

function readNumber(flags: Map<string, string | boolean>, key: string) {
  const value = flags.get(key);
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function readProvider(value: string | null): LlmProvider | undefined {
  if (!value) return undefined;
  if (value === "auto" || value === "none" || value === "claude" || value === "codex") {
    return value;
  }
  return undefined;
}
