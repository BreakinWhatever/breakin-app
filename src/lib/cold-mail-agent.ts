import { spawnSync } from "child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

const AGENT_DIR =
  process.env.COLD_MAIL_AGENT_DIR ||
  (process.env.NODE_ENV === "production"
    ? "/opt/breakin/cold-mail-agent"
    : `${process.env.HOME}/BreakIn/cold-mail-agent`);

const TMUX_SESSION =
  process.env.COLD_MAIL_AGENT_SESSION || "breakin-cold-mail-agent";

export class AgentTaskTimeoutError extends Error {
  constructor(taskId: string, taskName: string, timeoutMs: number) {
    super(`Cold-mail agent task ${taskName}/${taskId} timed out after ${timeoutMs}ms`);
    this.name = "AgentTaskTimeoutError";
  }
}

export class AgentTaskDispatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentTaskDispatchError";
  }
}

export type TaskName =
  | "draft-initial"
  | "draft-followup"
  | "classify-reply";

export interface DispatchOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function newTaskId(): string {
  return `${Date.now()}-${randomBytes(4).toString("hex")}`;
}

/**
 * Robustly send a command to the tmux session.
 * 1. Clear any pending input with Ctrl-C
 * 2. Send the actual task command
 * 3. Submit with C-m
 */
function sendToTmux(message: string): void {
  // 1. Clear prompt first (C-c)
  spawnSync("tmux", ["send-keys", "-t", TMUX_SESSION, "C-c", "C-c"], { stdio: "ignore" });
  
  // 2. Send the message and submit
  const result = spawnSync(
    "tmux",
    ["send-keys", "-t", TMUX_SESSION, message, "C-m"],
    { stdio: "pipe" }
  );
  
  if (result.status !== 0) {
    const err = result.stderr?.toString() ?? "";
    throw new AgentTaskDispatchError(
      `tmux send-keys failed (session=${TMUX_SESSION}): ${err}`
    );
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function dispatchTask<TIn, TOut>(
  taskName: TaskName,
  input: TIn,
  options: DispatchOptions = {}
): Promise<TOut> {
  const timeoutMs = options.timeoutMs ?? 60_000;
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;

  const tasksDir = join(AGENT_DIR, "tasks");
  const resultsDir = join(AGENT_DIR, "results");
  ensureDir(tasksDir);
  ensureDir(resultsDir);

  const taskId = newTaskId();
  const taskFile = join(tasksDir, `${taskId}.json`);
  const resultFile = join(resultsDir, `${taskId}.json`);

  writeFileSync(taskFile, JSON.stringify(input, null, 2), "utf-8");

  try {
    sendToTmux(`task: ${taskName} ${taskId}`);
  } catch (error) {
    try {
      if (existsSync(taskFile)) unlinkSync(taskFile);
    } catch {}
    throw error;
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (existsSync(resultFile)) {
      // Small buffer to ensure file is fully written
      await sleep(200);
      const raw = readFileSync(resultFile, "utf-8");
      try {
        const parsed = JSON.parse(raw) as TOut;
        try {
          unlinkSync(resultFile);
        } catch {}
        try {
          unlinkSync(taskFile);
        } catch {}
        return parsed;
      } catch (e) {
        // Continue polling if JSON is incomplete/malformed
        continue;
      }
    }
    await sleep(pollIntervalMs);
  }

  throw new AgentTaskTimeoutError(taskId, taskName, timeoutMs);
}

// ---------- Typed convenience helpers ----------

export interface DraftInitialInput {
  outreachId: string;
  contact: {
    firstName: string;
    lastName: string;
    title: string;
    email: string;
  };
  company: {
    name: string;
    sector: string;
    city: string;
    country: string;
  };
  campaign: {
    id: string;
    name: string;
    targetRole: string;
    targetCity: string;
    language: string;
  };
  cvSummary: string;
}

export interface DraftFollowupInput extends DraftInitialInput {
  previousEmails: Array<{
    subject: string;
    body: string;
    sentAt: string; // ISO
  }>;
  followUpNumber: number; // 1, 2, 3...
}

export interface DraftOutput {
  subject: string;
  body: string;
}

export async function dispatchDraftInitial(
  input: DraftInitialInput
): Promise<DraftOutput> {
  return dispatchTask<DraftInitialInput, DraftOutput>(
    "draft-initial",
    input,
    { timeoutMs: 120_000 }
  );
}

export async function dispatchDraftFollowup(
  input: DraftFollowupInput
): Promise<DraftOutput> {
  return dispatchTask<DraftFollowupInput, DraftOutput>(
    "draft-followup",
    input,
    { timeoutMs: 120_000 }
  );
}

export interface ClassifyReplyInput {
  inboundEmailId: string;
  fromEmail: string;
  subject: string;
  bodyText: string;
}

export type ReplyClassification =
  | "interested"
  | "not_interested"
  | "ooo"
  | "wrong_person"
  | "pending_response"
  | "auto_reply";

export interface ClassifyReplyOutput {
  classification: ReplyClassification;
  alternateContactName: string | null;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export async function dispatchClassifyReply(
  input: ClassifyReplyInput
): Promise<ClassifyReplyOutput> {
  return dispatchTask<ClassifyReplyInput, ClassifyReplyOutput>(
    "classify-reply",
    input,
    { timeoutMs: 30_000 }
  );
}
