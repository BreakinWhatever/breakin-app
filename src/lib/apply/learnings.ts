import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ApplyAnswer, ApplyPlatform } from "./types";

interface StoredAnswer {
  label: string;
  answer: string;
  source: ApplyAnswer["source"];
  updatedAt: string;
}

type AnswerStore = Record<string, StoredAnswer>;

export function buildApplyLearningsDir(workspaceDir: string) {
  return path.join(workspaceDir, ".runtime", "apply-learnings");
}

export async function findStoredAnswer(
  workspaceDir: string,
  platform: ApplyPlatform,
  label: string
) {
  const store = await readAnswerStore(workspaceDir);
  return store[buildAnswerKey(platform, label)] ?? null;
}

export async function storeAnswerLearning(
  workspaceDir: string,
  platform: ApplyPlatform,
  label: string,
  answer: string,
  source: ApplyAnswer["source"]
) {
  const store = await readAnswerStore(workspaceDir);
  store[buildAnswerKey(platform, label)] = {
    label,
    answer,
    source,
    updatedAt: new Date().toISOString(),
  };
  await writeAnswerStore(workspaceDir, store);
}

function buildAnswerKey(platform: ApplyPlatform, label: string) {
  return `${platform}:${normalizeLabel(label)}`;
}

function normalizeLabel(label: string) {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readAnswerStore(workspaceDir: string) {
  try {
    const raw = await readFile(buildAnswerFile(workspaceDir), "utf8");
    return JSON.parse(raw) as AnswerStore;
  } catch {
    return {} satisfies AnswerStore;
  }
}

async function writeAnswerStore(workspaceDir: string, store: AnswerStore) {
  const file = buildAnswerFile(workspaceDir);
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, JSON.stringify(store, null, 2));
  await rename(temp, file);
}

function buildAnswerFile(workspaceDir: string) {
  return path.join(buildApplyLearningsDir(workspaceDir), "answers.json");
}
