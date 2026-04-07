import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ApplyProgress, ApplyRequest, ApplySummary } from "./types";

export const ACTIVE_APPLY_JOB_STATUSES = ["queued", "running", "waiting_email"] as const;

export type ApplyJobRecord = Prisma.ApplyJobGetPayload<{
  include: {
    offer: true;
    application: true;
    events: {
      orderBy: { createdAt: "asc" };
    };
  };
}>;

export function buildApplyJobsDir(workspaceDir: string) {
  return path.join(workspaceDir, ".runtime", "apply-jobs");
}

export function buildApplyJobRuntimeDir(workspaceDir: string, jobId: string) {
  return path.join(buildApplyJobsDir(workspaceDir), jobId);
}

export function buildApplyJobArtifacts(workspaceDir: string, jobId: string) {
  const runtimeDir = buildApplyJobRuntimeDir(workspaceDir, jobId);
  return {
    runtimeDir,
    summaryFile: path.join(runtimeDir, "summary.json"),
    resultFile: path.join(runtimeDir, "result.json"),
    stateFile: path.join(runtimeDir, "state.json"),
    logFile: path.join(runtimeDir, "worker.log"),
    screenshotDir: path.join(runtimeDir, "screenshots"),
  };
}

export function createEmptyApplyProgress(now = new Date()): ApplyProgress {
  return {
    phase: "queued",
    updatedAt: now.toISOString(),
    attempts: 0,
    questionsPending: 0,
    emailChecks: 0,
  };
}

export async function createApplyJobRecord(
  workspaceDir: string,
  request: ApplyRequest
) {
  const created = await prisma.applyJob.create({
    data: {
      offerId: request.offerId,
      source: request.source,
      status: "queued",
      chatId: request.chatId ?? null,
      replyToMessageId: request.replyToMessageId ?? null,
      input: toJsonValue(request),
      lastMessage: "Job de candidature cree",
    },
  });

  const runtimePath = buildApplyJobRuntimeDir(workspaceDir, created.id);
  await mkdir(runtimePath, { recursive: true });
  const updated = await prisma.applyJob.update({
    where: { id: created.id },
    data: { runtimePath },
  });

  await appendApplyJobEvent(
    updated.id,
    "queued",
    "Job de candidature cree",
    toJsonValue(request)
  );

  return readApplyJobRecord(updated.id);
}

export async function readApplyJobRecord(jobId: string) {
  return prisma.applyJob.findUnique({
    where: { id: jobId },
    include: {
      offer: true,
      application: true,
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function listApplyJobRecords(options: {
  status?: string;
  chatId?: string;
  offerId?: string;
  limit?: number;
} = {}) {
  return prisma.applyJob.findMany({
    where: {
      status: options.status ?? undefined,
      chatId: options.chatId ?? undefined,
      offerId: options.offerId ?? undefined,
    },
    include: {
      offer: true,
      application: true,
      events: {
        orderBy: { createdAt: "asc" },
        take: 20,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: options.limit ?? 20,
  });
}

export async function findActiveApplyJobForOffer(offerId: string) {
  return prisma.applyJob.findFirst({
    where: {
      offerId,
      status: { in: [...ACTIVE_APPLY_JOB_STATUSES] },
    },
    include: {
      offer: true,
      application: true,
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findActiveApplyJobForChat(chatId: string) {
  return prisma.applyJob.findFirst({
    where: {
      chatId,
      status: { in: [...ACTIVE_APPLY_JOB_STATUSES] },
    },
    include: {
      offer: true,
      application: true,
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function appendApplyJobEvent(
  jobId: string,
  type: string,
  message: string,
  data?: Prisma.InputJsonValue
) {
  await prisma.applyJobEvent.create({
    data: {
      jobId,
      type,
      message,
      data,
    },
  });
}

export async function updateApplyJobRecord(
  jobId: string,
  data: Prisma.ApplyJobUpdateInput
) {
  return prisma.applyJob.update({
    where: { id: jobId },
    data,
    include: {
      offer: true,
      application: true,
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function claimQueuedApplyJob(jobId: string, pid?: number) {
  const result = await prisma.applyJob.updateMany({
    where: {
      id: jobId,
      status: "queued",
    },
    data: {
      status: "running",
      startedAt: new Date(),
      pid: pid ?? null,
      lastMessage: "Worker de candidature lance",
    },
  });

  return result.count > 0;
}

export async function countActiveApplyJobs() {
  return prisma.applyJob.count({
    where: {
      status: { in: ["running", "waiting_email"] },
    },
  });
}

export async function persistApplyState(
  workspaceDir: string,
  jobId: string,
  state: Record<string, unknown>
) {
  const file = buildApplyJobArtifacts(workspaceDir, jobId).stateFile;
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, JSON.stringify(state, null, 2));
  await rename(temp, file);
}

export async function persistApplySummary(
  workspaceDir: string,
  summary: ApplySummary
) {
  const artifacts = buildApplyJobArtifacts(workspaceDir, summary.jobId);
  await mkdir(artifacts.runtimeDir, { recursive: true });
  await Promise.all([
    writeJsonFile(artifacts.summaryFile, summary),
    writeJsonFile(artifacts.resultFile, {
      outcome: summary.outcome,
      finalUrl: summary.finalUrl,
      applicationId: summary.applicationId,
      errors: summary.errors,
      answeredQuestions: summary.answeredQuestions,
    }),
  ]);
}

async function writeJsonFile(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2));
  await rename(temp, file);
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
