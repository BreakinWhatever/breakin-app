import path from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { buildPreflightCheckpoint } from "@/lib/ops/checkpoints";
import type { ApplyPreflightProgress, ApplyPreflightSummary } from "./types";

export type ApplyPreflightJobRecord = Prisma.ApplyPreflightJobGetPayload<{
  include: {
    offer: true;
    manifest: true;
  };
}>;

export function buildApplyPreflightJobsDir(workspaceDir: string) {
  return path.join(workspaceDir, ".runtime", "apply-preflight");
}

export function buildApplyPreflightArtifacts(workspaceDir: string, jobId: string) {
  const runtimeDir = path.join(buildApplyPreflightJobsDir(workspaceDir), jobId);
  return {
    runtimeDir,
    summaryFile: path.join(runtimeDir, "summary.json"),
    stateFile: path.join(runtimeDir, "state.json"),
    answerBundleFile: path.join(runtimeDir, "answer-bundle.json"),
    observationFile: path.join(runtimeDir, "observation.json"),
    logFile: path.join(runtimeDir, "worker.log"),
  };
}

export async function createApplyPreflightJobRecord(
  workspaceDir: string,
  input: {
    offerId: string;
    source: string;
  }
) {
  const created = await prisma.applyPreflightJob.create({
    data: {
      offerId: input.offerId,
      source: input.source,
      status: "queued",
      lastMessage: "Preflight de candidature cree",
    },
  });

  const runtimePath = buildApplyPreflightArtifacts(workspaceDir, created.id).runtimeDir;
  const job = await prisma.applyPreflightJob.update({
    where: { id: created.id },
    data: { runtimePath },
    include: {
      offer: true,
      manifest: true,
    },
  });
  await persistApplyPreflightState(workspaceDir, created.id, {
    progress: {
      phase: "queued",
      updatedAt: new Date().toISOString(),
      message: "Preflight en file",
      currentUrl: job.offer.url,
      platform: (job.platform as ApplyPreflightProgress["platform"]) ?? null,
    },
    checkpoint: buildPreflightCheckpoint({
      phase: "queued",
      status: "queued",
      updatedAt: new Date().toISOString(),
      message: "Preflight de candidature cree",
      currentUrl: job.offer.url,
      playbookKey: null,
      authBranch: "unknown",
      blockingReasonKey: null,
      requiredFieldGroups: [],
      documents: [],
    }),
  });
  return job;
}

export async function readApplyPreflightJobRecord(jobId: string) {
  return prisma.applyPreflightJob.findUnique({
    where: { id: jobId },
    include: {
      offer: true,
      manifest: true,
    },
  });
}

export async function listApplyPreflightJobRecords(options: {
  status?: string;
  offerId?: string;
  limit?: number;
} = {}) {
  return prisma.applyPreflightJob.findMany({
    where: {
      status: options.status ?? undefined,
      offerId: options.offerId ?? undefined,
    },
    include: {
      offer: true,
      manifest: true,
    },
    orderBy: { updatedAt: "desc" },
    take: options.limit ?? 20,
  });
}

export async function findActiveApplyPreflightJobForOffer(offerId: string) {
  return prisma.applyPreflightJob.findFirst({
    where: {
      offerId,
      status: { in: ["queued", "running"] },
    },
    include: {
      offer: true,
      manifest: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateApplyPreflightJobRecord(
  jobId: string,
  data: Prisma.ApplyPreflightJobUpdateInput
) {
  return prisma.applyPreflightJob.update({
    where: { id: jobId },
    data,
    include: {
      offer: true,
      manifest: true,
    },
  });
}

export async function claimQueuedApplyPreflightJob(jobId: string, pid?: number) {
  const result = await prisma.applyPreflightJob.updateMany({
    where: {
      id: jobId,
      status: "queued",
    },
    data: {
      status: "running",
      startedAt: new Date(),
      pid: pid ?? null,
      lastMessage: "Worker de preflight lance",
    },
  });

  return result.count > 0;
}

export async function countActiveApplyPreflightJobs() {
  return prisma.applyPreflightJob.count({
    where: {
      status: "running",
    },
  });
}

export async function persistApplyPreflightState(
  workspaceDir: string,
  jobId: string,
  value: { progress: ApplyPreflightProgress; checkpoint?: unknown } | ApplyPreflightProgress
) {
  const file = buildApplyPreflightArtifacts(workspaceDir, jobId).stateFile;
  const payload = "phase" in value ? { progress: value } : value;
  await writeJsonFile(file, payload);
}

export async function persistApplyPreflightSummary(
  workspaceDir: string,
  summary: ApplyPreflightSummary
) {
  const artifacts = buildApplyPreflightArtifacts(workspaceDir, summary.jobId);
  await Promise.all([
    writeJsonFile(artifacts.summaryFile, summary),
    writeJsonFile(artifacts.observationFile, summary.observation),
  ]);
}

export async function persistAnswerBundle(
  workspaceDir: string,
  jobId: string,
  bundle: unknown
) {
  const file = buildApplyPreflightArtifacts(workspaceDir, jobId).answerBundleFile;
  await writeJsonFile(file, bundle);
}

async function writeJsonFile(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  let previous: Record<string, unknown> = {};
  try {
    previous = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
  } catch {}
  const temp = `${file}.tmp`;
  const nextValue =
    value && typeof value === "object" && !Array.isArray(value)
      ? { ...previous, ...(value as Record<string, unknown>) }
      : value;
  await writeFile(temp, JSON.stringify(nextValue, null, 2));
  await rename(temp, file);
}
