import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { listSearchJobRecords } from "@/lib/sourcing/jobs";
import { buildSearchCheckpoint } from "./checkpoints";
import type { RunCheckpoint } from "./types";

interface OpsStatusJob {
  domain: "apply" | "preflight" | "search";
  id: string;
  status: string;
  updatedAt: string;
  runtimePath: string | null;
  checkpoint: RunCheckpoint | null;
  pollUrl: string | null;
}

export interface OpsStatusSnapshot {
  generatedAt: string;
  activeJobs: OpsStatusJob[];
  blockedJobs: OpsStatusJob[];
}

async function readCheckpointFromRuntime(runtimePath: string | null) {
  if (!runtimePath) return null;
  try {
    const raw = await readFile(`${runtimePath}/state.json`, "utf8");
    const parsed = JSON.parse(raw) as { checkpoint?: RunCheckpoint | null };
    return parsed.checkpoint ?? null;
  } catch {
    return null;
  }
}

export async function buildOpsStatusSnapshot(workspaceDir: string): Promise<OpsStatusSnapshot> {
  const [applyJobs, preflightJobs, searchJobs] = await Promise.all([
    prisma.applyJob.findMany({
      where: { status: { in: ["queued", "running", "waiting_email", "failed"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.applyPreflightJob.findMany({
      where: { status: { in: ["queued", "running", "failed"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    listSearchJobRecords(workspaceDir, { limit: 20 }),
  ]);

  const [applyEntries, preflightEntries] = await Promise.all([
    Promise.all(
      applyJobs.map(async (job) => ({
        domain: "apply" as const,
        id: job.id,
        status: job.status,
        updatedAt: job.updatedAt.toISOString(),
        runtimePath: job.runtimePath ?? null,
        checkpoint: await readCheckpointFromRuntime(job.runtimePath ?? null),
        pollUrl: `/api/apply-jobs/${job.id}`,
      }))
    ),
    Promise.all(
      preflightJobs.map(async (job) => ({
        domain: "preflight" as const,
        id: job.id,
        status: job.status,
        updatedAt: job.updatedAt.toISOString(),
        runtimePath: job.runtimePath ?? null,
        checkpoint: await readCheckpointFromRuntime(job.runtimePath ?? null),
        pollUrl: `/api/preflight-jobs/${job.id}`,
      }))
    ),
  ]);

  const searchEntries: OpsStatusJob[] = searchJobs.map((job) => ({
    domain: "search",
    id: job.jobId,
    status: job.status,
    updatedAt: job.progress.updatedAt,
    runtimePath: job.outputDir ?? null,
    checkpoint: job.checkpoint ?? buildSearchCheckpoint(job.progress),
    pollUrl: null,
  }));

  const all = [...applyEntries, ...preflightEntries, ...searchEntries];
  return {
    generatedAt: new Date().toISOString(),
    activeJobs: all.filter((job) => job.status === "queued" || job.status === "running" || job.status === "waiting_email"),
    blockedJobs: all.filter((job) => job.status === "failed" || job.checkpoint?.blockingReasonKey),
  };
}
