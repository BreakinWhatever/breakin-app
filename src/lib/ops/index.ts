import path from "node:path";
import { readFile } from "node:fs/promises";
import type {
  ApplyPlaybook,
  ApplyPlaybookStore,
  OpsDocumentRef,
  OpsRetrievalIndex,
  StandardAnswerStore,
} from "./types";

function buildOpsDir(workspaceDir: string) {
  return path.join(workspaceDir, "ops");
}

function buildOpsFile(workspaceDir: string, relativePath: string) {
  return path.join(buildOpsDir(workspaceDir), relativePath);
}

async function readJsonFile<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function readOpsTextFile(
  workspaceDir: string,
  relativePath: string
) {
  try {
    return await readFile(buildOpsFile(workspaceDir, relativePath), "utf8");
  } catch {
    return "";
  }
}

export async function readOpsRetrievalIndex(
  workspaceDir: string
): Promise<OpsRetrievalIndex> {
  return readJsonFile(buildOpsFile(workspaceDir, "retrieval/index.json"), {
    version: 1,
    documents: [],
  });
}

export async function readStandardAnswers(
  workspaceDir: string
): Promise<StandardAnswerStore> {
  return readJsonFile(buildOpsFile(workspaceDir, "data/standard-answers.json"), {
    version: 1,
    defaults: {},
    questions: {},
  });
}

export async function readApplyPlaybookStore(
  workspaceDir: string
): Promise<ApplyPlaybookStore> {
  return readJsonFile(buildOpsFile(workspaceDir, "data/apply-playbooks.json"), {
    version: 1,
    playbooks: [],
  });
}

export async function findApplyPlaybook(input: {
  workspaceDir: string;
  platform: string;
  host?: string | null;
  flowKey?: string | null;
}) {
  const store = await readApplyPlaybookStore(input.workspaceDir);
  const host = (input.host || "").toLowerCase();
  const flowKey = (input.flowKey || "").toLowerCase();

  return (
    store.playbooks.find((playbook) => {
      if (!playbook.platforms.includes(input.platform)) return false;
      const hostMatches = !playbook.hosts
        || playbook.hosts.length === 0
        || playbook.hosts.includes("*")
        || playbook.hosts.some((candidate) => candidate.toLowerCase() === host);
      if (!hostMatches) return false;

      const flowMatches = !playbook.flowKeys
        || playbook.flowKeys.length === 0
        || playbook.flowKeys.includes("*")
        || playbook.flowKeys.some((candidate) => candidate.toLowerCase() === flowKey);
      return flowMatches;
    }) ?? null
  );
}

export async function resolveOpsDocumentRefs(
  workspaceDir: string,
  keys: string[]
): Promise<OpsDocumentRef[]> {
  const index = await readOpsRetrievalIndex(workspaceDir);
  const wanted = new Set(keys);
  return index.documents.filter((document) => wanted.has(document.key));
}

export function normalizeOpsQuestionKey(value: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildOpsFilePath(workspaceDir: string, relativePath: string) {
  return buildOpsFile(workspaceDir, relativePath);
}
