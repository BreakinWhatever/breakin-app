"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isApplyJobActive } from "./job-progress";
import { ApplyJobCard } from "./apply-job-card";
import type { ApplyJobView } from "./types";

export function ApplyJobsTray({ jobs }: { jobs: ApplyJobView[] }) {
  const [dismissedJobIds, setDismissedJobIds] = useState<string[]>([]);

  const visibleJobs = jobs.filter((job) => !dismissedJobIds.includes(job.id));
  if (visibleJobs.length === 0) return null;

  const allTerminal = visibleJobs.every((job) => !isApplyJobActive(job.status));

  return (
    <Card className="fixed right-6 bottom-6 z-50 max-h-[70vh] w-[380px] shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Jobs de candidature</CardTitle>
            <p className="text-xs text-muted-foreground">
              {allTerminal ? "Derniers resultats" : "Execution en direct"}
            </p>
          </div>
          {allTerminal && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setDismissedJobIds(visibleJobs.map((job) => job.id))}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 overflow-y-auto">
        {visibleJobs.slice(0, 4).map((job) => (
          <ApplyJobCard key={job.id} job={job} compact />
        ))}
      </CardContent>
    </Card>
  );
}
