import { loadEnvConfig } from "@next/env";
import type { ApplyPreflightProgress } from "../src/lib/apply/types";

async function main() {
  loadEnvConfig(process.cwd());
  const {
    buildApplyPreflightArtifacts,
    readApplyPreflightJobRecord,
    updateApplyPreflightJobRecord,
  } = await import("../src/lib/apply/preflight-jobs");
  const { runApplyPreflightJob } = await import("../src/lib/apply/preflight");

  const jobId = readFlag(process.argv.slice(2), "--job-id");
  if (!jobId) {
    throw new Error("Missing --job-id");
  }

  const job = await readApplyPreflightJobRecord(jobId);
  if (!job) {
    throw new Error(`Preflight job not found: ${jobId}`);
  }

  await updateApplyPreflightJobRecord(jobId, {
    runtimePath: buildApplyPreflightArtifacts(process.cwd(), jobId).runtimeDir,
    pid: process.pid,
  });

  await runApplyPreflightJob(jobId, process.cwd(), {
    onProgress: async (progress) => {
      await updateApplyPreflightJobRecord(jobId, {
        status: resolveStatus(progress.phase),
        lastMessage: progress.message ?? progress.phase,
        platform: progress.platform ?? undefined,
      });
    },
  });
}

function resolveStatus(phase: ApplyPreflightProgress["phase"]) {
  if (phase === "completed") return "completed" as const;
  if (phase === "failed") return "failed" as const;
  return "running" as const;
}

function readFlag(argv: string[], flag: string) {
  const index = argv.indexOf(flag);
  if (index === -1) return "";
  return argv[index + 1] ?? "";
}

main().catch(async (error) => {
  const { updateApplyPreflightJobRecord } = await import("../src/lib/apply/preflight-jobs");
  const jobId = readFlag(process.argv.slice(2), "--job-id");
  if (jobId) {
    await updateApplyPreflightJobRecord(jobId, {
      status: "failed",
      endedAt: new Date(),
      error: error instanceof Error ? error.stack ?? error.message : String(error),
      lastMessage: error instanceof Error ? error.message : String(error),
    }).catch(() => {});
  }
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
}).finally(async () => {
  const { launchLocalApplyPreflightDispatcher } = await import("../src/lib/apply/preflight-launcher");
  await launchLocalApplyPreflightDispatcher(process.cwd()).catch(() => {});
});
