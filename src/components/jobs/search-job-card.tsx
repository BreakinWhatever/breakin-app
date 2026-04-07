"use client";

import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatJobTime, getSearchJobLabel, getSearchJobPercent, JobStatusBadge, ProgressBar } from "./job-progress";
import { useLatestSearchJob } from "./hooks";

export function SearchJobCard() {
  const { job } = useLatestSearchJob();

  if (!job) return null;

  const label = getSearchJobLabel(job);
  const percent = getSearchJobPercent(job);
  const tone = job.status === "completed"
    ? "success"
    : job.status === "failed"
    ? "danger"
    : "default";
  const requestLine = [
    job.request.keywords?.length ? `mots-cles: ${job.request.keywords.join(", ")}` : "",
    job.request.cities?.length ? `villes: ${job.request.cities.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Search className="size-4" />
              Job de sourcing
            </CardTitle>
            <CardDescription className="truncate">
              {requestLine || "Derniere recherche d'offres"}
            </CardDescription>
          </div>
          <JobStatusBadge label={label} tone={tone} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{job.progress.message ?? label}</span>
            <span>{percent}%</span>
          </div>
          <ProgressBar value={percent} tone={tone} />
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Societes" value={`${job.progress.companiesScraped}/${job.progress.companiesConsidered}`} />
          <Metric label="Pages" value={`${job.progress.pagesVisited}`} />
          <Metric label="Offres" value={`${job.progress.offersFound}`} />
          <Metric label="Scoring" value={`${job.progress.offersScored}`} />
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {job.progress.currentCompany && (
            <span>En cours: <span className="font-medium text-foreground">{job.progress.currentCompany}</span></span>
          )}
          <span>Maj {formatJobTime(job.progress.updatedAt)}</span>
          {job.summary?.scrapeRunId && (
            <span>Run {job.summary.scrapeRunId}</span>
          )}
        </div>

        {job.error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {job.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
