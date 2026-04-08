import { loadEnvConfig } from "@next/env";
import { closeSync, openSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import type { Prisma } from "../src/generated/prisma/client";

async function main() {
  loadEnvConfig(process.cwd());
  const { prisma } = await import("../src/lib/db");
  const {
    buildApplyPreflightArtifacts,
    buildApplyPreflightJobsDir,
    claimQueuedApplyPreflightJob,
    countActiveApplyPreflightJobs,
    updateApplyPreflightJobRecord,
  } = await import("../src/lib/apply/preflight-jobs");

  type UpdateApplyPreflightJobRecord = typeof updateApplyPreflightJobRecord;

  const workspaceDir = process.cwd();
  const requestedJobId = readFlag(process.argv.slice(2), "--job-id");
  const lockFile = path.join(buildApplyPreflightJobsDir(workspaceDir), ".dispatch.lock");
  const maxConcurrent = Number(process.env.APPLY_MAX_CONCURRENT_PREFLIGHT_JOBS ?? 2);

  await mkdir(path.dirname(lockFile), { recursive: true });
  const lockFd = acquireLock(lockFile);
  if (lockFd === null) {
    return;
  }

  try {
    const activeCount = await countActiveApplyPreflightJobs();
    const availableSlots = Math.max(0, maxConcurrent - activeCount);
    if (availableSlots <= 0) {
      return;
    }

    const queued = await prisma.applyPreflightJob.findMany({
      where: {
        status: "queued",
        ...(requestedJobId ? { id: requestedJobId } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: requestedJobId ? 1 : availableSlots,
    });

    if (queued.length === 0 && !requestedJobId) {
      return;
    }

    const jobs = requestedJobId && queued.length === 0
      ? await prisma.applyPreflightJob.findMany({
          where: { status: "queued" },
          orderBy: { createdAt: "asc" },
          take: availableSlots,
        })
      : queued;

    for (const job of jobs.slice(0, availableSlots)) {
      const claimed = await claimQueuedApplyPreflightJob(job.id);
      if (!claimed) continue;
      await launchJobWorker(
        workspaceDir,
        job.id,
        buildApplyPreflightArtifacts,
        updateApplyPreflightJobRecord as UpdateApplyPreflightJobRecord
      );
    }
  } finally {
    closeSync(lockFd);
    await rm(lockFile, { force: true }).catch(() => {});
  }
}

async function launchJobWorker(
  workspaceDir: string,
  jobId: string,
  buildApplyPreflightArtifacts: (workspaceDir: string, jobId: string) => {
    runtimeDir: string;
    summaryFile: string;
    stateFile: string;
    answerBundleFile: string;
    observationFile: string;
    logFile: string;
  },
  updateApplyPreflightJobRecord: ((
    jobId: string,
    data: Prisma.ApplyPreflightJobUpdateInput
  ) => Promise<unknown>)
) {
  const artifacts = buildApplyPreflightArtifacts(workspaceDir, jobId);
  await mkdir(path.dirname(artifacts.logFile), { recursive: true });

  const stdoutFd = openSync(artifacts.logFile, "a");
  const stderrFd = openSync(artifacts.logFile, "a");

  try {
    const child = spawn("npx", ["tsx", "scripts/apply-preflight-job.ts", "--job-id", jobId], {
      cwd: workspaceDir,
      env: process.env,
      detached: true,
      stdio: ["ignore", stdoutFd, stderrFd],
    });
    child.unref();

    await updateApplyPreflightJobRecord(jobId, {
      pid: child.pid ?? null,
      lastMessage: "Worker de preflight lance",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateApplyPreflightJobRecord(jobId, {
      status: "failed",
      error: message,
      lastMessage: message,
      endedAt: new Date(),
    });
  } finally {
    closeSync(stdoutFd);
    closeSync(stderrFd);
  }
}

function acquireLock(lockFile: string) {
  try {
    return openSync(lockFile, "wx");
  } catch {
    return null;
  }
}

function readFlag(argv: string[], flag: string) {
  const index = argv.indexOf(flag);
  if (index === -1) return "";
  return argv[index + 1] ?? "";
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exit(1);
});
