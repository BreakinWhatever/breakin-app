"use client";

import type { ApplySummary } from "@/lib/apply/types";
import type { SearchProgress, SearchSummary } from "@/lib/sourcing/types";

export interface ApplyJobEventView {
  id: string;
  type: string;
  message: string;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ApplyJobView {
  id: string;
  offerId: string;
  applicationId?: string | null;
  source: string;
  status: string;
  language?: string | null;
  profileKey?: string | null;
  platform?: string | null;
  runtimePath?: string | null;
  summary?: ApplySummary | null;
  error?: string | null;
  lastMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  updatedAt: string;
  offer?: {
    id: string;
    title: string;
    company: string;
    city: string;
    status: string;
  } | null;
  application?: {
    id: string;
    status: string;
  } | null;
  events: ApplyJobEventView[];
}

export interface SearchJobView {
  jobId: string;
  chatId: string;
  replyToMessageId?: number;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  pid?: number;
  launcher: "detached";
  outputDir: string;
  logFile: string;
  request: {
    keywords?: string[];
    cities?: string[];
    days?: number;
    max?: number;
    includeWebSearch?: boolean;
    useBrowserFallback?: boolean;
  };
  progress: SearchProgress;
  summary?: SearchSummary;
  error?: string;
}
