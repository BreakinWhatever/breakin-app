import path from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import type { ApplyPlatform } from "./types";

export interface ApplySessionSnapshot {
  sessionKey: string;
  host: string;
  platform: ApplyPlatform;
  authMode: "guest_preferred" | "auth_required" | "unknown";
  storageStatePath: string;
  warmedAt: string;
  lastUsedAt: string;
}

export function buildApplySessionsDir(workspaceDir: string) {
  return path.join(workspaceDir, ".runtime", "apply-sessions");
}

export function buildApplySessionKey(
  host: string,
  platform: ApplyPlatform,
  authMode: ApplySessionSnapshot["authMode"]
) {
  return `${platform}__${authMode}__${host}`
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "_");
}

export async function acquireApplySession(input: {
  workspaceDir: string;
  host: string;
  platform: ApplyPlatform;
  authMode: ApplySessionSnapshot["authMode"];
}) {
  const sessionKey = buildApplySessionKey(input.host, input.platform, input.authMode);
  const snapshot = await readApplySessionSnapshot(input.workspaceDir, sessionKey);
  const now = new Date().toISOString();

  const value: ApplySessionSnapshot = snapshot ?? {
    sessionKey,
    host: input.host,
    platform: input.platform,
    authMode: input.authMode,
    storageStatePath: path.join(
      buildApplySessionsDir(input.workspaceDir),
      `${sessionKey}.storage-state.json`
    ),
    warmedAt: now,
    lastUsedAt: now,
  };

  value.lastUsedAt = now;
  await writeApplySessionSnapshot(input.workspaceDir, value);
  return value;
}

async function readApplySessionSnapshot(workspaceDir: string, sessionKey: string) {
  const file = buildApplySessionFile(workspaceDir, sessionKey);
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as ApplySessionSnapshot;
  } catch {
    return null;
  }
}

async function writeApplySessionSnapshot(
  workspaceDir: string,
  value: ApplySessionSnapshot
) {
  const file = buildApplySessionFile(workspaceDir, value.sessionKey);
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2));
  await rename(temp, file);
}

function buildApplySessionFile(workspaceDir: string, sessionKey: string) {
  return path.join(buildApplySessionsDir(workspaceDir), `${sessionKey}.json`);
}
