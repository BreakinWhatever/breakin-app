import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SearchOffersInput, SearchProgress, SearchSummary } from "./types";

export type SearchJobStatus = "queued" | "running" | "completed" | "failed";

export interface SearchJobRecord {
  jobId: string;
  chatId: string;
  replyToMessageId?: number;
  status: SearchJobStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  pid?: number;
  launcher: "detached";
  outputDir: string;
  logFile: string;
  request: Partial<SearchOffersInput>;
  progress: SearchProgress;
  summary?: SearchSummary;
  error?: string;
}

type SearchJobUpdater =
  | Partial<SearchJobRecord>
  | ((current: SearchJobRecord) => SearchJobRecord);

export function createSearchJobId(now = new Date()) {
  return `search-${now.getTime().toString(36)}-${randomBytes(3).toString("hex")}`;
}

export function buildSearchJobsDir(workspaceDir: string) {
  return path.join(workspaceDir, ".runtime", "search-jobs");
}

export function buildSearchJobOutputDir(workspaceDir: string, jobId: string) {
  return path.join(workspaceDir, ".runtime", "source-offers", jobId);
}

export function buildSearchJobLogFile(workspaceDir: string, jobId: string) {
  return path.join(buildSearchJobsDir(workspaceDir), `${jobId}.log`);
}

export function createEmptySearchProgress(now = new Date()): SearchProgress {
  return {
    phase: "queued",
    updatedAt: now.toISOString(),
    companiesConsidered: 0,
    companiesScraped: 0,
    pagesVisited: 0,
    pagesWithErrors: 0,
    offersFound: 0,
    offersScored: 0,
    offersImported: 0,
    llmAssistedOffers: 0,
  };
}

export async function createSearchJobRecord(
  workspaceDir: string,
  record: SearchJobRecord
) {
  await writeJobFile(workspaceDir, record);
  return record;
}

export async function readSearchJobRecord(
  workspaceDir: string,
  jobId: string
) {
  try {
    const raw = await readFile(buildSearchJobFile(workspaceDir, jobId), "utf8");
    return JSON.parse(raw) as SearchJobRecord;
  } catch {
    return null;
  }
}

export async function updateSearchJobRecord(
  workspaceDir: string,
  jobId: string,
  updater: SearchJobUpdater
) {
  const current = await readSearchJobRecord(workspaceDir, jobId);
  if (!current) return null;

  const next = typeof updater === "function"
    ? updater(current)
    : { ...current, ...updater };
  await writeJobFile(workspaceDir, next);
  return next;
}

export async function listSearchJobRecords(
  workspaceDir: string,
  options: { chatId?: string; limit?: number } = {}
) {
  const dir = buildSearchJobsDir(workspaceDir);
  let entries: string[] = [];

  try {
    entries = (await readdir(dir)).filter((entry) => entry.endsWith(".json"));
  } catch {
    return [] as SearchJobRecord[];
  }

  const withStats = await Promise.all(
    entries.map(async (entry) => {
      const file = path.join(dir, entry);
      const info = await stat(file);
      return { file, mtimeMs: info.mtimeMs };
    })
  );

  const jobs: SearchJobRecord[] = [];
  for (const item of withStats.sort((left, right) => right.mtimeMs - left.mtimeMs)) {
    const raw = await readFile(item.file, "utf8").catch(() => "");
    if (!raw) continue;
    const parsed = JSON.parse(raw) as SearchJobRecord;
    if (options.chatId && parsed.chatId !== options.chatId) continue;
    jobs.push(parsed);
    if (options.limit && jobs.length >= options.limit) break;
  }

  return jobs;
}

export async function findActiveSearchJobForChat(
  workspaceDir: string,
  chatId: string
) {
  const jobs = await listSearchJobRecords(workspaceDir, { chatId, limit: 10 });
  return jobs.find((job) => job.status === "queued" || job.status === "running") ?? null;
}

function buildSearchJobFile(workspaceDir: string, jobId: string) {
  return path.join(buildSearchJobsDir(workspaceDir), `${jobId}.json`);
}

async function writeJobFile(workspaceDir: string, record: SearchJobRecord) {
  const file = buildSearchJobFile(workspaceDir, record.jobId);
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, JSON.stringify(record, null, 2));
  await rename(temp, file);
}
