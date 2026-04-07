"use client";

import { Bot, CheckCircle2, Clock3, Mail, TriangleAlert, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatJobTime,
  getApplyJobLabel,
  getApplyJobPercent,
  getApplyJobTone,
  isApplyJobActive,
  JobStatusBadge,
  ProgressBar,
} from "./job-progress";
import type { ApplyJobView } from "./types";

export function ApplyJobCard({
  job,
  compact = false,
}: {
  job: ApplyJobView;
  compact?: boolean;
}) {
  const tone = getApplyJobTone(job);
  const label = getApplyJobLabel(job);
  const percent = getApplyJobPercent(job);
  const events = job.events.slice(-4).reverse();
  const offerTitle = job.offer?.title ?? `Job ${job.id}`;
  const offerMeta = job.offer
    ? [job.offer.company, job.offer.city].filter(Boolean).join(" · ")
    : null;

  return (
    <Card size={compact ? "sm" : "default"}>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className={compact ? "line-clamp-2 text-sm leading-snug" : "line-clamp-2"}>
              {offerTitle}
            </CardTitle>
            <CardDescription className={compact ? "mt-1 line-clamp-2 text-xs" : "truncate"}>
              {compact
                ? offerMeta ?? `Derniere activite ${formatJobTime(job.updatedAt)}`
                : offerMeta
                  ? `${offerMeta} · Derniere activite ${formatJobTime(job.updatedAt)}`
                  : `Derniere activite ${formatJobTime(job.updatedAt)}`}
            </CardDescription>
          </div>
          <div className="shrink-0">
            <JobStatusBadge label={label} tone={tone} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="min-w-0 flex-1 truncate">{job.lastMessage ?? label}</span>
            <span>{percent}%</span>
          </div>
          <ProgressBar value={percent} tone={tone} />
        </div>

        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="uppercase tracking-wide">Plateforme</p>
            <p className="mt-1 text-sm capitalize text-foreground">
              {job.platform ?? "Detection auto"}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide">Profil</p>
            <p className="mt-1 text-sm uppercase text-foreground">
              {job.profileKey ?? "Auto"}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide">Etat</p>
            <p className="mt-1 text-sm text-foreground">
              {isApplyJobActive(job.status) ? "En direct" : formatJobTime(job.updatedAt)}
            </p>
          </div>
        </div>

        {events.length > 0 && (
          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/30 p-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                  {iconForEvent(event.type, job.status)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{event.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatJobTime(event.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {job.error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {job.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function iconForEvent(type: string, status: string) {
  if (type === "email_verified" || status === "waiting_email") {
    return <Mail className="size-4" />;
  }
  if (type === "completed" || status === "succeeded") {
    return <CheckCircle2 className="size-4 text-emerald-500" />;
  }
  if (type === "failed" || status === "failed") {
    return <XCircle className="size-4 text-destructive" />;
  }
  if (type === "cover_letter") {
    return <Bot className="size-4 text-primary" />;
  }
  if (type === "queued") {
    return <Clock3 className="size-4" />;
  }
  return <TriangleAlert className="size-4" />;
}
