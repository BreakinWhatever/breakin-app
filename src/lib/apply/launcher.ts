import { closeSync, openSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { buildApplyJobArtifacts } from "./jobs";

export async function launchLocalApplyDispatcher(
  workspaceDir: string,
  jobId?: string
) {
  const args = ["tsx", "scripts/apply-dispatcher.ts"];
  if (jobId) {
    args.push("--job-id", jobId);
  }

  const artifacts = jobId
    ? buildApplyJobArtifacts(workspaceDir, jobId)
    : null;
  const logFile = artifacts?.logFile
    ?? path.join(workspaceDir, ".runtime", "apply-jobs", "dispatcher.log");

  await mkdir(path.dirname(logFile), { recursive: true });
  const stdoutFd = openSync(logFile, "a");
  const stderrFd = openSync(logFile, "a");

  try {
    const child = spawn("npx", args, {
      cwd: workspaceDir,
      env: process.env,
      detached: true,
      stdio: ["ignore", stdoutFd, stderrFd],
    });
    child.unref();
    return { ok: true, pid: child.pid ?? null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    closeSync(stdoutFd);
    closeSync(stderrFd);
  }
}
