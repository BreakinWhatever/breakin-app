import { loadEnvConfig } from "@next/env";
import { openSync, closeSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

async function main() {
  loadEnvConfig(process.cwd());
  const { prisma } = await import("../src/lib/db");
  const {
    appendApplyJobEvent,
    buildApplyJobsDir,
    buildApplyJobArtifacts,
    claimQueuedApplyJob,
    countActiveApplyJobs,
    updateApplyJobRecord,
  } = await import("../src/lib/apply/jobs");

  const workspaceDir = process.cwd();
  const requestedJobId = readFlag(process.argv.slice(2), "--job-id");
  const lockFile = path.join(buildApplyJobsDir(workspaceDir), ".dispatch.lock");
  const maxConcurrent = Number(process.env.APPLY_MAX_CONCURRENT_JOBS ?? 2);

  await mkdir(path.dirname(lockFile), { recursive: true });
  const lockFd = acquireLock(lockFile);
  if (lockFd === null) {
    return;
  }

  try {
    const activeCount = await countActiveApplyJobs();
    const availableSlots = Math.max(0, maxConcurrent - activeCount);
    if (availableSlots <= 0) {
      return;
    }

    const queued = await prisma.applyJob.findMany({
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
      ? await prisma.applyJob.findMany({
          where: { status: "queued" },
          orderBy: { createdAt: "asc" },
          take: availableSlots,
        })
      : queued;

    for (const job of jobs.slice(0, availableSlots)) {
      const claimed = await claimQueuedApplyJob(job.id);
      if (!claimed) continue;
      await launchJobWorker(workspaceDir, job.id);
    }
  } finally {
    closeSync(lockFd);
    await rm(lockFile, { force: true }).catch(() => {});
  }
}

async function launchJobWorker(workspaceDir: string, jobId: string) {
  const artifacts = buildApplyJobArtifacts(workspaceDir, jobId);
  await mkdir(path.dirname(artifacts.logFile), { recursive: true });

  const stdoutFd = openSync(artifacts.logFile, "a");
  const stderrFd = openSync(artifacts.logFile, "a");

  try {
    const child = spawn("npx", ["tsx", "scripts/apply-job.ts", "--job-id", jobId], {
      cwd: workspaceDir,
      env: process.env,
      detached: true,
      stdio: ["ignore", stdoutFd, stderrFd],
    });
    child.unref();

    await updateApplyJobRecord(jobId, {
      pid: child.pid ?? null,
      lastMessage: "Worker de candidature lance",
    });
    await appendApplyJobEvent(jobId, "launched", "Worker de candidature lance", {
      pid: child.pid ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateApplyJobRecord(jobId, {
      status: "failed",
      error: message,
      lastMessage: message,
      endedAt: new Date(),
    });
    await appendApplyJobEvent(jobId, "failed", message);
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
