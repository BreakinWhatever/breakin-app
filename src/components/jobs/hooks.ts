"use client";

import { useEffect, useState } from "react";
import type { ApplyJobView, SearchJobView } from "./types";
import { isApplyJobActive, isSearchJobActive } from "./job-progress";

const TERMINAL_APPLY_JOB_TTL_MS = 3 * 60 * 1000;

export function useLatestOfferApplyJob(offerId?: string | null) {
  const [job, setJob] = useState<ApplyJobView | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!offerId) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      if (!cancelled) {
        setLoading(true);
      }
      const response = await fetch(`/api/apply-jobs?offerId=${offerId}`, {
        cache: "no-store",
      }).catch(() => null);

      if (!response?.ok) {
        if (!cancelled) {
          setLoading(false);
          timeoutId = setTimeout(poll, 6000);
        }
        return;
      }

      const payload = await response.json().catch(() => []);
      if (cancelled) return;

      const latest = Array.isArray(payload) && payload.length > 0
        ? payload[0] as ApplyJobView
        : null;
      setJob(latest);
      setLoading(false);

      timeoutId = setTimeout(poll, latest && isApplyJobActive(latest.status) ? 2500 : 12000);
    }

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [offerId]);

  return { job, loading };
}

export function useRecentApplyJobs(trackedJobIds: string[] = []) {
  const [jobs, setJobs] = useState<ApplyJobView[]>([]);
  const [loading, setLoading] = useState(true);
  const trackedKey = trackedJobIds.join(",");

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const tracked = new Set(trackedKey ? trackedKey.split(",") : []);

    async function poll() {
      const response = await fetch("/api/apply-jobs", {
        cache: "no-store",
      }).catch(() => null);

      if (!response?.ok) {
        if (!cancelled) {
          setLoading(false);
          timeoutId = setTimeout(poll, 6000);
        }
        return;
      }

      const payload = await response.json().catch(() => []);
      if (cancelled) return;

      const recent = Array.isArray(payload) ? payload as ApplyJobView[] : [];
      const now = Date.now();
      const filtered = recent.filter((job) => {
        if (isApplyJobActive(job.status)) return true;
        if (!tracked.has(job.id)) return false;

        const terminalAt = job.endedAt ?? job.updatedAt ?? job.createdAt;
        const terminalTs = terminalAt ? new Date(terminalAt).getTime() : 0;
        if (!terminalTs || Number.isNaN(terminalTs)) return false;
        return now - terminalTs <= TERMINAL_APPLY_JOB_TTL_MS;
      });
      setJobs(filtered.slice(0, 8));
      setLoading(false);

      const hasActive = filtered.some((job) => isApplyJobActive(job.status));
      timeoutId = setTimeout(poll, hasActive || filtered.length > 0 ? 2500 : 10000);
    }

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [trackedKey]);

  return { jobs, loading };
}

export function useLatestSearchJob() {
  const [job, setJob] = useState<SearchJobView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      const response = await fetch("/api/search-jobs?limit=1", {
        cache: "no-store",
      }).catch(() => null);

      if (!response?.ok) {
        if (!cancelled) {
          setLoading(false);
          timeoutId = setTimeout(poll, 8000);
        }
        return;
      }

      const payload = await response.json().catch(() => []);
      if (cancelled) return;

      const latest = Array.isArray(payload) && payload.length > 0
        ? payload[0] as SearchJobView
        : null;
      setJob(latest);
      setLoading(false);

      timeoutId = setTimeout(poll, latest && isSearchJobActive(latest.status) ? 3000 : 15000);
    }

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { job, loading };
}
