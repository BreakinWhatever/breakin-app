import { loadEnvConfig } from "@next/env";
import { parseSearchCliArgs } from "../src/lib/sourcing/cli";
import {
  readSearchJobRecord,
  updateSearchJobRecord,
} from "../src/lib/sourcing/jobs";
import {
  formatSearchJobStatusForTelegram,
  formatSearchProgressForTelegram,
} from "../src/lib/sourcing/telegram";
import type { SearchProgress } from "../src/lib/sourcing/types";
import { buildSearchCheckpoint } from "../src/lib/ops/checkpoints";

interface WorkerArgs {
  jobId: string;
  chatId: number;
  replyToMessageId?: number;
  searchArgs: string[];
}

async function main() {
  loadEnvConfig(process.cwd());

  const args = parseWorkerArgs(process.argv.slice(2));
  const request = parseSearchCliArgs(args.searchArgs, process.cwd());
  const workspaceDir = process.cwd();
  const current = await readSearchJobRecord(workspaceDir, args.jobId);
  if (!current) {
    throw new Error(`Missing job record for ${args.jobId}`);
  }

  let lastNotificationAt = 0;
  let lastPhase = "queued";

  await updateSearchJobRecord(workspaceDir, args.jobId, {
    status: "running",
    startedAt: new Date().toISOString(),
    pid: process.pid,
    checkpoint: buildSearchCheckpoint({
      ...current.progress,
      phase: "starting",
      updatedAt: new Date().toISOString(),
      message: "Recherche lancee",
    }),
  });

  const { runOfferSearch } = await import("../src/lib/sourcing/engine");
  const summary = await runOfferSearch(request, {
    onProgress: async (progress) => {
      const updated = await updateSearchJobRecord(workspaceDir, args.jobId, (job) => ({
        ...job,
        status: progress.phase === "failed" ? "failed" : "running",
        progress,
        checkpoint: buildSearchCheckpoint(progress),
      }));

      if (!updated) return;
      if (!shouldNotifyProgress(progress, lastPhase, lastNotificationAt)) return;

      await sendTelegramMessage(
        args.chatId,
        formatSearchProgressForTelegram(updated),
        args.replyToMessageId
      ).catch(() => {});

      lastPhase = progress.phase;
      lastNotificationAt = Date.now();
    },
  });

  await updateSearchJobRecord(workspaceDir, args.jobId, (job) => ({
    ...job,
    status: "completed",
    endedAt: new Date().toISOString(),
    summary,
    progress: {
      ...job.progress,
      phase: "completed",
      updatedAt: new Date().toISOString(),
      offersImported: summary.offersImported,
      offersFound: summary.offersFound,
      offersScored: summary.offersScored,
      llmAssistedOffers: summary.llmAssistedOffers,
      message: "Recherche terminee",
    },
    checkpoint: buildSearchCheckpoint({
      ...job.progress,
      phase: "completed",
      updatedAt: new Date().toISOString(),
      offersImported: summary.offersImported,
      offersFound: summary.offersFound,
      offersScored: summary.offersScored,
      llmAssistedOffers: summary.llmAssistedOffers,
      message: "Recherche terminee",
    }),
  }));

  const completed = await readSearchJobRecord(workspaceDir, args.jobId);
  if (completed) {
    await sendTelegramMessage(
      args.chatId,
      formatSearchJobStatusForTelegram(completed),
      args.replyToMessageId
    ).catch(() => {});
  }
}

function parseWorkerArgs(argv: string[]): WorkerArgs {
  let jobId = "";
  let chatId = 0;
  let replyToMessageId: number | undefined;
  const searchArgs: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--job-id") {
      jobId = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (token === "--chat-id") {
      chatId = Number(argv[index + 1] ?? 0);
      index += 1;
      continue;
    }
    if (token === "--reply-to-message-id") {
      replyToMessageId = Number(argv[index + 1] ?? 0) || undefined;
      index += 1;
      continue;
    }
    searchArgs.push(token);
  }

  if (!jobId) throw new Error("Missing --job-id");
  if (!chatId) throw new Error("Missing --chat-id");

  return {
    jobId,
    chatId,
    replyToMessageId,
    searchArgs,
  };
}

function shouldNotifyProgress(
  progress: SearchProgress,
  lastPhase: string,
  lastNotificationAt: number
) {
  if (progress.phase !== lastPhase) return true;
  if (progress.phase === "crawling" && Date.now() - lastNotificationAt >= 45_000) return true;
  return false;
}

async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyToMessageId?: number
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

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

main().catch(async (error) => {
  const args = parseWorkerArgs(process.argv.slice(2));
  const workspaceDir = process.cwd();
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  await updateSearchJobRecord(workspaceDir, args.jobId, (job) => ({
    ...job,
    status: "failed",
    endedAt: new Date().toISOString(),
    error: message,
    progress: {
      ...job.progress,
      phase: "failed",
      updatedAt: new Date().toISOString(),
      message,
    },
    checkpoint: buildSearchCheckpoint({
      ...job.progress,
      phase: "failed",
      updatedAt: new Date().toISOString(),
      message,
    }),
  })).catch(() => {});
  await sendTelegramMessage(
    args.chatId,
    `Job ${args.jobId} en echec.\n${message.slice(0, 1500)}`,
    args.replyToMessageId
  ).catch(() => {});
  process.exit(1);
});
