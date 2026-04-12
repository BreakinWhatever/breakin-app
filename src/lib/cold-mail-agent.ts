// Cold Mail Agent IPC wrapper.
//
// Dispatches a single LLM task to the breakin-cold-mail-agent tmux session
// and waits for the result file to appear. The agent is a long-running
// interactive Claude Code session that reads task files from
// `<agentDir>/tasks/`, executes them (calling Opus or Sonnet via the
// model-selection skill), and writes results to `<agentDir>/results/`.
//
// Protocol:
//   1. Generate taskId
//   2. Write input JSON to <agentDir>/tasks/<taskId>.json
//   3. tmux send-keys -t breakin-cold-mail-agent "task: <name> <taskId>" C-m
//   4. Poll <agentDir>/results/<taskId>.json every pollIntervalMs up to timeoutMs
//   5. Read result, delete both files, return parsed JSON
//
// On timeout: throws AgentTaskTimeoutError. Caller handles retry/log/alert.
//
// Spec: docs/superpowers/specs/2026-04-09-cold-mailing-robustness-design.md
// section 5 "Agent IPC — concrete protocol".

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

function sendToTmux(message: string): void {
  const result = spawnSync(
    "tmux",
    // C-m submits reliably across Claude, Codex, and Gemini TUIs. Plain
    // "Enter" can remain buffered in Gemini's prompt line.
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
    // Cleanup on send failure so we don't leave orphan task files
    try {
      unlinkSync(taskFile);
    } catch {}
    throw error;
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (existsSync(resultFile)) {
      const raw = readFileSync(resultFile, "utf-8");
      const parsed = JSON.parse(raw) as TOut;
      try {
        unlinkSync(resultFile);
      } catch {}
      try {
        unlinkSync(taskFile);
      } catch {}
      return parsed;
    }
    await sleep(pollIntervalMs);
  }

  // Timeout — leave files in place for post-mortem debugging
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
