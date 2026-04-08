"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApplyJobView, SearchJobView } from "./types";

const ACTIVE_APPLY_STATUSES = new Set(["queued", "running", "waiting_email"]);
const ACTIVE_SEARCH_STATUSES = new Set(["queued", "running"]);

export function ProgressBar({
  value,
  tone = "default",
}: {
  value: number;
  tone?: "default" | "success" | "danger";
}) {
  const width = Math.min(100, Math.max(0, value));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          tone === "success" && "bg-emerald-500",
          tone === "danger" && "bg-destructive",
          tone === "default" && "bg-primary"
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function formatJobTime(value?: string | Date | null) {
  if (!value) return "a l'instant";
  return formatDistanceToNow(new Date(value), {
    addSuffix: true,
    locale: fr,
  });
}

export function isApplyJobActive(status: string) {
  return ACTIVE_APPLY_STATUSES.has(status);
}

export function hasApplyJobEnded(job: Pick<ApplyJobView, "endedAt" | "status">) {
  return Boolean(job.endedAt) || job.status === "succeeded" || job.status === "failed" || job.status === "cancelled";
}

export function isSearchJobActive(status: string) {
  return ACTIVE_SEARCH_STATUSES.has(status);
}

export function deriveOfferStatus(currentStatus: string, job?: ApplyJobView | null) {
  if (!job) return currentStatus;
  if (hasApplyJobEnded(job) && job.status === "running" && job.endedAt) {
    return "applied";
  }
  if (job.status === "succeeded") return "applied";
  if (job.status === "failed" || job.status === "cancelled") return "apply_failed";
  if (isApplyJobActive(job.status)) return "apply_requested";
  return currentStatus;
}

export function getApplyJobPercent(job: ApplyJobView) {
  if (job.status === "succeeded") return 100;
  if (job.status === "failed" || job.status === "cancelled") return 100;

  const lastPhase = getApplyPhase(job);
  if (lastPhase === "queued") return 8;
  if (lastPhase === "preflight_wait") return 12;
  if (lastPhase === "preparing") return 18;
  if (lastPhase === "context_acquire") return 28;
  if (lastPhase === "manifest_load") return 32;
  if (lastPhase === "opening") return 34;
  if (lastPhase === "auth") return 52;
  if (lastPhase === "email_verification") return 66;
  if (lastPhase === "answering") return 78;
  if (lastPhase === "submitting") return 92;
  if (lastPhase === "fallback") return 48;
  if (lastPhase === "needs_human") return 100;
  if (lastPhase === "completed") return 100;
  if (lastPhase === "failed") return 100;
  if (job.status === "waiting_email") return 66;
  return 12;
}

export function getApplyJobLabel(job: ApplyJobView) {
  if (job.status === "queued") return "En file d'attente";
  if (job.status === "waiting_email") return "Verification email";
  if (job.status === "succeeded") return "Candidature envoyee";
  if (job.status === "failed") return "Candidature en echec";
  if (job.status === "cancelled") return "Candidature annulee";

  const phase = getApplyPhase(job);
  if (phase === "preflight_wait") return "Preparation du site";
  if (phase === "preparing") return "Preparation du dossier";
  if (phase === "context_acquire") return "Chargement du contexte";
  if (phase === "manifest_load") return "Chargement du manifest";
  if (phase === "opening") return "Ouverture du site";
  if (phase === "auth") return "Connexion ou creation de compte";
  if (phase === "email_verification") return "Verification email";
  if (phase === "answering") return "Remplissage du formulaire";
  if (phase === "submitting") return "Soumission finale";
  if (phase === "fallback") return "Fallback intelligent";
  if (phase === "needs_human") return "Revue manuelle";
  if (phase === "completed") return "Candidature envoyee";
  if (phase === "failed") return "Execution interrompue";
  return "Execution en cours";
}

export function getApplyJobTone(job: ApplyJobView) {
  if (job.status === "succeeded") return "success" as const;
  if (job.status === "failed" || job.status === "cancelled") return "danger" as const;
  return "default" as const;
}

export function getSearchJobPercent(job: SearchJobView) {
  if (job.status === "completed") return 100;
  if (job.status === "failed") return 100;

  const progress = job.progress;
  if (progress.phase === "queued") return 5;
  if (progress.phase === "starting") return 10;
  if (progress.phase === "loading_companies") return 18;
  if (progress.phase === "crawling") {
    const total = Math.max(progress.companiesConsidered, 1);
    return 20 + Math.round((progress.companiesScraped / total) * 50);
  }
  if (progress.phase === "scoring") {
    const total = Math.max(progress.offersFound, 1);
    return 72 + Math.round((progress.offersScored / total) * 14);
  }
  if (progress.phase === "importing") {
    const total = Math.max(progress.offersFound, 1);
    return 88 + Math.round((progress.offersImported / total) * 10);
  }
  if (progress.phase === "completed") return 100;
  if (progress.phase === "failed") return 100;
  return 8;
}

export function getSearchJobLabel(job: SearchJobView) {
  if (job.status === "completed") return "Recherche terminee";
  if (job.status === "failed") return "Recherche en echec";

  const phase = job.progress.phase;
  if (phase === "loading_companies") return "Chargement des societes";
  if (phase === "crawling") return "Exploration des pages carrieres";
  if (phase === "scoring") return "Scoring des offres";
  if (phase === "importing") return "Import en base";
  if (phase === "completed") return "Recherche terminee";
  if (phase === "failed") return "Recherche en echec";
  return "Initialisation";
}

export function JobStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "default" | "success" | "danger";
}) {
  const className =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : tone === "danger"
      ? "bg-destructive/10 text-destructive"
      : "border-border text-foreground";

  return (
    <Badge variant={tone === "default" ? "outline" : "secondary"} className={className}>
      {label}
    </Badge>
  );
}

function getApplyPhase(job: ApplyJobView) {
  const progressEvent = [...job.events].reverse().find((event) => {
    const data = event.data;
    return Boolean(data && typeof data.phase === "string");
  });
  const phase = progressEvent?.data?.phase;
  return typeof phase === "string" ? phase : null;
}
