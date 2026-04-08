import { readFile } from "node:fs/promises";
import type { ApplySummary, ApplyPreflightSummary } from "./types";
import type { RunCheckpoint } from "@/lib/ops/types";

async function readRuntimeState(runtimePath: string | null | undefined) {
  if (!runtimePath) return null;
  try {
    const raw = await readFile(`${runtimePath}/state.json`, "utf8");
    return JSON.parse(raw) as { checkpoint?: RunCheckpoint | null; progress?: unknown };
  } catch {
    return null;
  }
}

function parseApplySummary(summary: unknown) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return null;
  }
  return summary as ApplySummary;
}

function parsePreflightSummary(summary: unknown) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return null;
  }
  return summary as ApplyPreflightSummary;
}

export async function serializeApplyJob<T extends {
  id: string;
  runtimePath: string | null;
  summary?: unknown;
}>(job: T): Promise<T & {
  summary: ApplySummary | null;
  ops: {
    checkpoint: RunCheckpoint | null;
    playbookKey: string | null;
    authBranch: ApplySummary["authBranch"] | RunCheckpoint["authBranch"] | null;
    blockingReasonKey: ApplySummary["blockingReasonKey"] | RunCheckpoint["blockingReasonKey"] | null;
    documents: NonNullable<ApplySummary["documents"]>;
  };
}> {
  const runtimeState = await readRuntimeState(job.runtimePath);
  const summary = parseApplySummary(job.summary);
  const checkpoint = runtimeState?.checkpoint ?? summary?.checkpoint ?? null;

  return {
    ...job,
    summary,
    ops: {
      checkpoint,
      playbookKey: summary?.playbookKey ?? checkpoint?.playbookKey ?? null,
      authBranch: summary?.authBranch ?? checkpoint?.authBranch ?? null,
      blockingReasonKey: summary?.blockingReasonKey ?? checkpoint?.blockingReasonKey ?? null,
      documents: summary?.documents ?? checkpoint?.documents ?? [],
    },
  };
}

export async function serializePreflightJob<T extends {
  id: string;
  runtimePath: string | null;
  summary?: unknown;
}>(job: T): Promise<T & {
  summary: ApplyPreflightSummary | null;
  ops: {
    checkpoint: RunCheckpoint | null;
    playbookKey: string | null;
    authBranch: ApplyPreflightSummary["authBranch"] | RunCheckpoint["authBranch"] | null;
    blockingReasonKey: ApplyPreflightSummary["blockingReasonKey"] | RunCheckpoint["blockingReasonKey"] | null;
    documents: NonNullable<ApplyPreflightSummary["documents"]>;
  };
}> {
  const runtimeState = await readRuntimeState(job.runtimePath);
  const summary = parsePreflightSummary(job.summary);
  const checkpoint = runtimeState?.checkpoint ?? summary?.checkpoint ?? null;

  return {
    ...job,
    summary,
    ops: {
      checkpoint,
      playbookKey: summary?.playbookKey ?? checkpoint?.playbookKey ?? null,
      authBranch: summary?.authBranch ?? checkpoint?.authBranch ?? null,
      blockingReasonKey: summary?.blockingReasonKey ?? checkpoint?.blockingReasonKey ?? null,
      documents: summary?.documents ?? checkpoint?.documents ?? [],
    },
  };
}
