"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Email {
  id: string;
  status: string;
  sentAt: string | null;
  repliedAt: string | null;
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8h to 20h

interface HeatmapCell {
  day: number; // 0=Lun, 6=Dim
  hour: number;
  sent: number;
  replied: number;
}

function getIntensityClass(count: number, max: number): string {
  if (count === 0) return "bg-muted/30";
  const ratio = count / max;
  if (ratio > 0.75) return "bg-blue-600 dark:bg-blue-500";
  if (ratio > 0.5) return "bg-blue-500 dark:bg-blue-400";
  if (ratio > 0.25) return "bg-blue-400/70 dark:bg-blue-400/50";
  return "bg-blue-300/50 dark:bg-blue-400/30";
}

interface ActivityHeatmapProps {
  campaignId?: string;
}

export default function ActivityHeatmap({ campaignId }: ActivityHeatmapProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = campaignId
      ? `?campaignId=${encodeURIComponent(campaignId)}`
      : "";
    fetch(`/api/emails${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEmails(
          (Array.isArray(data) ? data : []).filter(
            (e: Email) => e.status === "sent" && e.sentAt
          )
        );
      })
      .finally(() => setLoading(false));
  }, [campaignId]);

  const { grid, maxCount } = useMemo(() => {
    const cells: HeatmapCell[][] = Array.from({ length: 7 }, (_, day) =>
      HOURS.map((hour) => ({ day, hour, sent: 0, replied: 0 }))
    );

    for (const email of emails) {
      if (!email.sentAt) continue;
      const date = new Date(email.sentAt);
      // Convert JS day (0=Sun) to our grid (0=Mon)
      const jsDay = date.getDay();
      const gridDay = jsDay === 0 ? 6 : jsDay - 1;
      const hour = date.getHours();
      if (hour >= 8 && hour <= 20) {
        cells[gridDay][hour - 8].sent++;
        if (email.repliedAt) {
          cells[gridDay][hour - 8].replied++;
        }
      }
    }

    let max = 0;
    for (const row of cells) {
      for (const cell of row) {
        if (cell.sent > max) max = cell.sent;
      }
    }

    return { grid: cells, maxCount: max };
  }, [emails]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (emails.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Activite d&apos;envoi (heatmap)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: `auto repeat(${HOURS.length}, 1fr)` }}>
              {/* Header row: hours */}
              <div /> {/* Empty corner */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="text-center text-xs text-muted-foreground px-1"
                >
                  {h}h
                </div>
              ))}

              {/* Data rows: days */}
              {DAYS.map((dayLabel, dayIndex) => (
                <div key={`row-${dayIndex}`} className="contents">
                  <div
                    className="text-xs text-muted-foreground pr-2 flex items-center"
                  >
                    {dayLabel}
                  </div>
                  {grid[dayIndex].map((cell, hourIndex) => (
                    <Tooltip key={`${dayIndex}-${hourIndex}`}>
                      <TooltipTrigger
                        render={
                          <div
                            className={cn(
                              "size-7 rounded-sm transition-colors cursor-default",
                              getIntensityClass(cell.sent, maxCount)
                            )}
                          />
                        }
                      />
                      <TooltipContent>
                        <p className="text-xs">
                          {dayLabel} {cell.hour}h: {cell.sent} envoi
                          {cell.sent > 1 ? "s" : ""}
                          {cell.replied > 0 &&
                            `, ${cell.replied} reponse${cell.replied > 1 ? "s" : ""}`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>Moins</span>
          <div className="flex gap-0.5">
            <div className="size-3 rounded-sm bg-muted/30" />
            <div className="size-3 rounded-sm bg-blue-300/50 dark:bg-blue-400/30" />
            <div className="size-3 rounded-sm bg-blue-400/70 dark:bg-blue-400/50" />
            <div className="size-3 rounded-sm bg-blue-500 dark:bg-blue-400" />
            <div className="size-3 rounded-sm bg-blue-600 dark:bg-blue-500" />
          </div>
          <span>Plus</span>
        </div>
      </CardContent>
    </Card>
  );
}
