import { loadEnvConfig } from "@next/env";
import type { ApplyProgress } from "../src/lib/apply/types";

async function main() {
  loadEnvConfig(process.cwd());
  const {
    buildApplyJobArtifacts,
    persistApplyState,
    readApplyJobRecord,
    updateApplyJobRecord,
  } = await import("../src/lib/apply/jobs");
  const { runApplyJob } = await import("../src/lib/apply/engine");
  const {
    formatApplyJobStatusForTelegram,
    formatApplySummaryForTelegram,
  } = await import("../src/lib/apply/telegram");

  const jobId = readFlag(process.argv.slice(2), "--job-id");
  if (!jobId) {
    throw new Error("Missing --job-id");
  }

  const job = await readApplyJobRecord(jobId);
  if (!job) {
    throw new Error(`Apply job not found: ${jobId}`);
  }

  await updateApplyJobRecord(jobId, {
    runtimePath: buildApplyJobArtifacts(process.cwd(), jobId).runtimeDir,
    pid: process.pid,
  });

  let lastPhase = "queued";
  let lastNotifiedAt = 0;
  const summary = await runApplyJob(jobId, process.cwd(), {
    onProgress: async (progress) => {
      await updateApplyJobRecord(jobId, {
        status: resolveJobStatus(progress.phase),
        lastMessage: progress.message ?? progress.phase,
        platform: progress.platform ?? undefined,
      });
      await persistApplyState(process.cwd(), jobId, {
        progress,
      });

      if (!job.chatId || !shouldNotify(progress, lastPhase, lastNotifiedAt)) {
        lastPhase = progress.phase;
        return;
      }

      const current = await readApplyJobRecord(jobId);
      if (current) {
        await sendTelegramMessage(
          current.chatId ?? "",
          formatApplyJobStatusForTelegram({
            id: current.id,
            status: current.status,
            platform: current.platform,
            lastMessage: current.lastMessage,
            error: current.error,
            runtimePath: current.runtimePath,
          }),
          current.replyToMessageId ?? undefined
        ).catch(() => {});
      }

      lastPhase = progress.phase;
      lastNotifiedAt = Date.now();
    },
  });

  const completed = await readApplyJobRecord(jobId);
  if (completed?.chatId) {
    await sendTelegramMessage(
      completed.chatId,
      formatApplySummaryForTelegram(summary),
      completed.replyToMessageId ?? undefined
    ).catch(() => {});
  }
}

function shouldNotify(
  progress: ApplyProgress,
  lastPhase: string,
  lastNotifiedAt: number
) {
  if (progress.phase !== lastPhase) return true;
  return Date.now() - lastNotifiedAt >= 60_000;
}

function resolveJobStatus(phase: ApplyProgress["phase"]) {
  if (phase === "email_verification") return "waiting_email" as const;
  if (phase === "completed") return "succeeded" as const;
  if (phase === "failed") return "failed" as const;
  return "running" as const;
}

async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyToMessageId?: number
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      reply_parameters: replyToMessageId ? { message_id: replyToMessageId } : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed: ${response.status}`);
  }
}

function readFlag(argv: string[], flag: string) {
  const index = argv.indexOf(flag);
  if (index === -1) return "";
  return argv[index + 1] ?? "";
}

main()
  .catch(async (error) => {
    const { updateApplyJobRecord } = await import("../src/lib/apply/jobs");
    const jobId = readFlag(process.argv.slice(2), "--job-id");
    if (jobId) {
      await updateApplyJobRecord(jobId, {
        status: "failed",
        endedAt: new Date(),
        error: error instanceof Error ? error.stack ?? error.message : String(error),
        lastMessage: error instanceof Error ? error.message : String(error),
      }).catch(() => {});
    }
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { launchLocalApplyDispatcher } = await import("../src/lib/apply/launcher");
    const { readApplyJobRecord } = await import("../src/lib/apply/jobs");
    const { formatApplyJobStatusForTelegram } = await import("../src/lib/apply/telegram");
    const jobId = readFlag(process.argv.slice(2), "--job-id");
    await launchLocalApplyDispatcher(process.cwd()).catch(() => {});
    if (jobId) {
      const job = await readApplyJobRecord(jobId).catch(() => null);
      if (job?.chatId && job.status === "failed") {
        await sendTelegramMessage(
          job.chatId,
          formatApplyJobStatusForTelegram({
            id: job.id,
            status: job.status,
            platform: job.platform,
            lastMessage: job.lastMessage,
            error: job.error,
            runtimePath: job.runtimePath,
          }),
          job.replyToMessageId ?? undefined
        ).catch(() => {});
      }
    }
  });
