import { APPLY_SUMMARY_MARKER } from "./cli";
import type { ApplySummary } from "./types";
import type { RunCheckpoint } from "@/lib/ops/types";

export interface TelegramApplyIntent {
  offerIdOrUrl: string;
}

export interface TelegramApplyJobIntent {
  mode: "status" | "list";
  jobId?: string;
}

const APPLY_PREFIX_PATTERN =
  /^(\/apply_offer\b|apply offer\b|postule\b|postuler\b|lance la candidature\b)/i;
const APPLY_STATUS_PATTERN =
  /^(\/apply_status\b|\/apply_jobs\b|apply status\b|status candidature\b|ou en est la candidature\b|où en est la candidature\b|ou en est le job candidature\b)/i;

export function parseTelegramApplyIntent(text: string): TelegramApplyIntent | null {
  const trimmed = text.trim();
  if (!trimmed || !APPLY_PREFIX_PATTERN.test(trimmed)) {
    return null;
  }

  const urlMatch = trimmed.match(/https?:\/\/\S+/i);
  if (urlMatch) {
    return { offerIdOrUrl: urlMatch[0] };
  }

  const jobOfferIdMatch = trimmed.match(/\b(c[a-z0-9]{20,})\b/i);
  if (jobOfferIdMatch) {
    return { offerIdOrUrl: jobOfferIdMatch[1] };
  }

  if (/^\/apply_offer\b/i.test(trimmed)) {
    const raw = trimmed.replace(/^\/apply_offer\b/i, "").trim();
    if (raw) return { offerIdOrUrl: raw };
  }

  return null;
}

export function parseTelegramApplyJobIntent(text: string): TelegramApplyJobIntent | null {
  const trimmed = text.trim();
  if (!trimmed || !APPLY_STATUS_PATTERN.test(trimmed)) {
    return null;
  }

  if (/^\/apply_jobs\b/i.test(trimmed)) {
    return { mode: "list" };
  }

  const match = trimmed.match(/\b(c[a-z0-9]{20,})\b/i);
  return {
    mode: "status",
    jobId: match?.[1],
  };
}

export function formatApplyJobAcknowledgement(jobId: string) {
  return [
    "Candidature lancee en arriere-plan.",
    `Job: ${jobId}`,
    "Je continue a te repondre pendant l'execution.",
    `Suivi: /apply_status ${jobId}`,
  ].join("\n");
}

export function formatApplySummaryForTelegram(summary: ApplySummary) {
  const lines = [
    summary.outcome === "succeeded"
      ? "Candidature terminee avec succes."
      : "Candidature terminee en echec.",
    `Job: ${summary.jobId}`,
    `Offre: ${summary.offerId}`,
    `Plateforme: ${summary.platform}`,
    `Profil: ${summary.profileKey.toUpperCase()} (${summary.language})`,
    `Duree: ${summary.durationSeconds}s`,
    `Artefacts: ${summary.artifacts.runtimeDir}`,
  ];

  if (summary.playbookKey) {
    lines.push(`Playbook: ${summary.playbookKey}`);
  }
  if (summary.authBranch) {
    lines.push(`Branche auth: ${summary.authBranch}`);
  }
  if (summary.blockingReasonKey && summary.outcome !== "succeeded") {
    lines.push(`Blocage: ${summary.blockingReasonKey}`);
  }
  if (summary.checkpoint?.nextAction) {
    lines.push(`Action: ${summary.checkpoint.nextAction}`);
  }

  if (summary.applicationId) {
    lines.push(`Application: ${summary.applicationId}`);
  }

  if (summary.errors.length > 0) {
    lines.push(`Erreurs: ${summary.errors.slice(0, 2).join(" | ")}`);
  }

  return lines.join("\n");
}

export function formatApplyJobStatusForTelegram(job: {
  id: string;
  status: string;
  platform: string | null;
  lastMessage: string | null;
  error: string | null;
  runtimePath: string | null;
  summary?: ApplySummary | null;
  checkpoint?: RunCheckpoint | null;
  ops?: {
    checkpoint?: RunCheckpoint | null;
  } | null;
}) {
  if (job.status === "succeeded" && job.summary) {
    return formatApplySummaryForTelegram(job.summary);
  }

  const checkpoint = job.checkpoint ?? job.ops?.checkpoint ?? job.summary?.checkpoint ?? null;

  if (job.status === "failed") {
    return [
      `Job ${job.id} en echec.`,
      job.error ?? job.lastMessage ?? "Erreur inconnue.",
      checkpoint?.blockingReasonKey ? `Blocage: ${checkpoint.blockingReasonKey}` : "",
      checkpoint?.nextAction ? `Action: ${checkpoint.nextAction}` : "",
      job.runtimePath ? `Artefacts: ${job.runtimePath}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Job ${job.id}`,
    labelForStatus(job.status),
    job.platform ? `Plateforme: ${job.platform}` : "",
    checkpoint?.authBranch ? `Branche auth: ${checkpoint.authBranch}` : "",
    job.lastMessage ?? "",
    checkpoint?.blockingReasonKey ? `Blocage: ${checkpoint.blockingReasonKey}` : "",
    checkpoint?.nextAction ? `Action: ${checkpoint.nextAction}` : "",
    job.runtimePath ? `Artefacts: ${job.runtimePath}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatApplyJobListForTelegram(
  jobs: Array<{ id: string; status: string; updatedAt: Date | string }>
) {
  if (jobs.length === 0) {
    return "Aucun job de candidature recent.";
  }

  return jobs
    .slice(0, 5)
    .map((job) => `- ${job.id} (${labelForStatus(job.status)})`)
    .join("\n");
}

export function parseApplySummaryOutput(stdout: string): ApplySummary | null {
  const markerIndex = stdout.lastIndexOf(APPLY_SUMMARY_MARKER);
  if (markerIndex === -1) return null;

  try {
    return JSON.parse(
      stdout.slice(markerIndex + APPLY_SUMMARY_MARKER.length).trim()
    ) as ApplySummary;
  } catch {
    return null;
  }
}

function labelForStatus(status: string) {
  if (status === "queued") return "En file";
  if (status === "running") return "Execution en cours";
  if (status === "waiting_email") return "Verification email en cours";
  if (status === "succeeded") return "Termine";
  if (status === "failed") return "Echec";
  return status;
}
