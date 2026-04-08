import path from "node:path";
import { mkdir, rename, writeFile } from "node:fs/promises";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type {
  ApplyExecutionPlan,
  ApplyManifestStatus,
  ApplyPlatform,
  ApplyPreflightObservation,
} from "./types";

export type ApplySiteManifestRecord = Prisma.ApplySiteManifestGetPayload<object>;

export function buildApplyManifestsDir(workspaceDir: string) {
  return path.join(workspaceDir, ".runtime", "apply-manifests");
}

export function buildApplyManifestArtifacts(workspaceDir: string, manifestId: string) {
  const runtimeDir = path.join(buildApplyManifestsDir(workspaceDir), manifestId);
  return {
    runtimeDir,
    manifestFile: path.join(runtimeDir, "manifest.json"),
  };
}

export function buildApplyFlowKey(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname
      .split("/")
      .filter(Boolean)
      .slice(0, 4)
      .map((part) =>
        part
          .toLowerCase()
          .replace(/[0-9]{3,}/g, ":id")
          .replace(/[a-f0-9]{8,}/g, ":id")
          .replace(/[^a-z0-9:-]+/g, "-")
      );
    return parts.length > 0 ? parts.join("/") : "root";
  } catch {
    return "unknown";
  }
}

export function getApplyHost(url: string) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return "unknown";
  }
}

export async function findApplyManifestForOffer(input: {
  url: string;
  platform: ApplyPlatform;
  language: string;
  manifestId?: string | null;
}) {
  if (input.manifestId) {
    const direct = await prisma.applySiteManifest.findUnique({
      where: { id: input.manifestId },
    });
    if (direct) return direct;
  }

  return prisma.applySiteManifest.findFirst({
    where: {
      host: getApplyHost(input.url),
      platform: input.platform,
      flowKey: buildApplyFlowKey(input.url),
      language: input.language,
    },
    orderBy: [
      { lastValidatedAt: { sort: "desc", nulls: "last" } },
      { updatedAt: "desc" },
    ],
  });
}

export async function upsertApplyManifest(
  workspaceDir: string,
  input: {
    url: string;
    platform: ApplyPlatform;
    language: string;
    status: ApplyManifestStatus;
    confidence: number;
    plan: ApplyExecutionPlan;
    observation: ApplyPreflightObservation | null;
    successSignals?: string[];
    verificationSignals?: string[];
    errorSignals?: string[];
    submitHints?: Prisma.InputJsonValue;
    rawObservationSummary?: Prisma.InputJsonValue;
  }
) {
  const host = getApplyHost(input.url);
  const flowKey = buildApplyFlowKey(input.url);
  const existing = await prisma.applySiteManifest.findUnique({
    where: {
      host_platform_flowKey_language: {
        host,
        platform: input.platform,
        flowKey,
        language: input.language,
      },
    },
  });

  const manifest = existing
    ? await prisma.applySiteManifest.update({
        where: { id: existing.id },
        data: {
          status: input.status,
          confidence: input.confidence,
          plan: toJsonValue(input.plan),
          observation: toJsonValue(input.observation),
          successSignals: input.successSignals ? toJsonValue(input.successSignals) : undefined,
          verificationSignals: input.verificationSignals
            ? toJsonValue(input.verificationSignals)
            : undefined,
          errorSignals: input.errorSignals ? toJsonValue(input.errorSignals) : undefined,
          submitHints: input.submitHints ?? undefined,
          rawObservationSummary: input.rawObservationSummary ?? undefined,
          runtimePath: buildApplyManifestArtifacts(workspaceDir, existing.id).runtimeDir,
          lastValidatedAt: input.status === "validated" ? new Date() : existing.lastValidatedAt,
          consecutiveFailures: input.status === "validated" ? 0 : existing.consecutiveFailures,
        },
      })
    : await prisma.applySiteManifest.create({
        data: {
          host,
          platform: input.platform,
          flowKey,
          language: input.language,
          status: input.status,
          confidence: input.confidence,
          plan: toJsonValue(input.plan),
          observation: toJsonValue(input.observation),
          successSignals: input.successSignals ? toJsonValue(input.successSignals) : undefined,
          verificationSignals: input.verificationSignals
            ? toJsonValue(input.verificationSignals)
            : undefined,
          errorSignals: input.errorSignals ? toJsonValue(input.errorSignals) : undefined,
          submitHints: input.submitHints ?? undefined,
          rawObservationSummary: input.rawObservationSummary ?? undefined,
        },
      });

  const runtimePath = buildApplyManifestArtifacts(workspaceDir, manifest.id).runtimeDir;
  const finalManifest = manifest.runtimePath
    ? manifest
    : await prisma.applySiteManifest.update({
        where: { id: manifest.id },
        data: { runtimePath },
      });

  await persistApplyManifestArtifact(workspaceDir, finalManifest.id, {
    id: finalManifest.id,
    host,
    platform: input.platform,
    flowKey,
    language: input.language,
    status: input.status,
    confidence: input.confidence,
    plan: input.plan,
    observation: input.observation,
    successSignals: input.successSignals ?? [],
    verificationSignals: input.verificationSignals ?? [],
    errorSignals: input.errorSignals ?? [],
  });

  return finalManifest;
}

export async function markApplyManifestResult(
  manifestId: string,
  outcome: "succeeded" | "failed"
) {
  const current = await prisma.applySiteManifest.findUnique({
    where: { id: manifestId },
  });
  if (!current) return null;

  const consecutiveFailures =
    outcome === "succeeded" ? 0 : (current.consecutiveFailures ?? 0) + 1;
  const confidence =
    outcome === "succeeded"
      ? Math.min(100, (current.confidence ?? 0) + 10)
      : Math.max(5, (current.confidence ?? 0) - 15);
  const status: ApplyManifestStatus =
    outcome === "succeeded"
      ? confidence >= 60
        ? "validated"
        : "degraded"
      : consecutiveFailures >= 3
      ? "broken"
      : "degraded";

  return prisma.applySiteManifest.update({
    where: { id: manifestId },
    data: {
      confidence,
      consecutiveFailures,
      status,
      lastValidatedAt: outcome === "succeeded" ? new Date() : current.lastValidatedAt,
    },
  });
}

export function parseApplyExecutionPlan(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as ApplyExecutionPlan;
}

async function persistApplyManifestArtifact(
  workspaceDir: string,
  manifestId: string,
  value: unknown
) {
  const artifacts = buildApplyManifestArtifacts(workspaceDir, manifestId);
  await mkdir(artifacts.runtimeDir, { recursive: true });
  const temp = `${artifacts.manifestFile}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2));
  await rename(temp, artifacts.manifestFile);
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
