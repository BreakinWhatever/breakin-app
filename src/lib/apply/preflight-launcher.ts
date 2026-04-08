import { closeSync, openSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { buildApplyPreflightArtifacts, buildApplyPreflightJobsDir } from "./preflight-jobs";

export async function launchLocalApplyPreflightDispatcher(
  workspaceDir: string,
  jobId?: string
) {
  const args = ["tsx", "scripts/apply-preflight-dispatcher.ts"];
  if (jobId) {
    args.push("--job-id", jobId);
  }

  const logFile = jobId
    ? buildApplyPreflightArtifacts(workspaceDir, jobId).logFile
    : `${buildApplyPreflightJobsDir(workspaceDir)}/dispatcher.log`;

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
