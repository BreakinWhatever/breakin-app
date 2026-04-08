import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import type { OpsDocumentRef } from "@/lib/ops/types";
import { buildApplyExecutionPlan, hasApplyAdapter } from "./adapters";
import { runApplyPreflightWithDevBrowser } from "./browser-v3";
import { isApplyPreflightEnabled } from "./config";
import { generateCoverLetter } from "./llm";
import {
  buildApplyFlowKey,
  getApplyHost,
  upsertApplyManifest,
} from "./manifests";
import {
  buildApplyPreflightArtifacts,
  createApplyPreflightJobRecord,
  findActiveApplyPreflightJobForOffer,
  persistAnswerBundle,
  persistApplyPreflightState,
  persistApplyPreflightSummary,
  readApplyPreflightJobRecord,
  updateApplyPreflightJobRecord,
} from "./preflight-jobs";
import { acquireApplySession } from "./sessions";
import { detectOfferLanguage, resolveCandidateProfile } from "./profiles";
import {
  buildAnswerLookupMaps,
  buildPreflightOpsCheckpoint,
  resolveApplyOpsPlan,
} from "./ops";
import type {
  AnswerBundle,
  ApplyManifestStatus,
  ApplyPreflightProgress,
  ApplyPreflightSummary,
  ApplyReadiness,
  ProfileKey,
} from "./types";

export async function enqueueApplyPreflightJob(
  workspaceDir: string,
  input: {
    offerId: string;
    source: string;
  }
) {
  const offer = await prisma.jobOffer.findUnique({
    where: { id: input.offerId },
  });
  if (!offer) {
    throw new Error("Offer not found");
  }

  const active = await findActiveApplyPreflightJobForOffer(offer.id);
  if (active) {
    return {
      created: false,
      offer,
      job: active,
      reason: "already_running",
    } as const;
  }

  await prisma.jobOffer.update({
    where: { id: offer.id },
    data: {
      applyReadiness: "pending_preflight",
      preflightError: null,
      applyPlatform: null,
      applyManifestStatus: null,
      applyManifestId: null,
      applyFlowKey: buildApplyFlowKey(offer.url),
    },
  });

  const job = await createApplyPreflightJobRecord(workspaceDir, input);
  return {
    created: true,
    offer,
    job,
    reason: "created",
  } as const;
}

export async function ensureOfferApplyReady(
  workspaceDir: string,
  input: {
    offerId: string;
    source: string;
    force?: boolean;
  }
) {
  const offer = await prisma.jobOffer.findUnique({
    where: { id: input.offerId },
  });
  if (!offer) {
    throw new Error("Offer not found");
  }

  if (input.force) {
    return {
      ready: true,
      offer,
      reason: "forced",
      job: null,
    } as const;
  }

  if (offer.applyReadiness === "manual_only") {
    return {
      ready: false,
      offer,
      reason: "manual_only",
      job: null,
    } as const;
  }

  if (offer.applyReadiness === "blocked") {
    return {
      ready: false,
      offer,
      reason: "blocked",
      job: null,
    } as const;
  }

  if (offer.applyReadiness === "ready" && offer.applyManifestId) {
    return {
      ready: true,
      offer,
      reason: "ready",
      job: null,
    } as const;
  }

  const queued = await enqueueApplyPreflightJob(workspaceDir, {
    offerId: offer.id,
    source: input.source,
  });
  return {
    ready: false,
    offer,
    reason: queued.reason === "already_running" ? "preflight_running" : "preflight_queued",
    job: queued.job,
  } as const;
}

export async function queueApplyPreflightForOfferUrls(
  workspaceDir: string,
  urls: string[],
  source = "import"
) {
  if (!isApplyPreflightEnabled() || urls.length === 0) {
    return [];
  }

  const offers = await prisma.jobOffer.findMany({
    where: {
      url: { in: urls },
    },
    select: {
      id: true,
    },
  });

  const { dispatchApplyPreflightJob } = await import("./preflight-dispatch");
  const results = [];
  for (const offer of offers) {
    const queued = await enqueueApplyPreflightJob(workspaceDir, {
      offerId: offer.id,
      source,
    }).catch(() => null);
    if (!queued?.job) continue;
    if (queued.created) {
      await dispatchApplyPreflightJob(workspaceDir, queued.job.id, offer.id).catch(() => null);
    }
    results.push(queued.job.id);
  }

  return results;
}

export async function runApplyPreflightJob(
  jobId: string,
  workspaceDir: string,
  hooks: {
    onProgress?: (progress: ApplyPreflightProgress) => Promise<void> | void;
  } = {}
) {
  const job = await readApplyPreflightJobRecord(jobId);
  if (!job) {
    throw new Error(`Missing preflight job ${jobId}`);
  }

  const offer = job.offer;
  const startedAt = new Date();
  const errors: string[] = [];

  const language = detectOfferLanguage(
    offer.title,
    offer.description,
    offer.country
  ) as ProfileKey;
  const profile = await resolveCandidateProfile(language, workspaceDir);
  const platform = inferPlatform(offer.applyPlatform, offer.url);
  const host = getApplyHost(offer.url);
  const flowKey = buildApplyFlowKey(offer.url);

  await updateApplyPreflightJobRecord(jobId, {
    language,
    profileKey: profile.key,
    platform,
    lastMessage: "Preparation du preflight",
  });
  await emitProgress(jobId, workspaceDir, {
    phase: "opening",
    updatedAt: new Date().toISOString(),
    message: "Ouverture de la page d'apply",
    platform,
    currentUrl: offer.url,
  }, hooks);

  try {
    await acquireApplySession({
      workspaceDir,
      host,
      platform,
      authMode: hasApplyAdapter(platform) ? "guest_preferred" : "unknown",
    });

    await emitProgress(jobId, workspaceDir, {
      phase: "observing",
      updatedAt: new Date().toISOString(),
      message: `Observation de ${host}`,
      platform,
      currentUrl: offer.url,
    }, hooks);

    let plan = buildApplyExecutionPlan(platform, flowKey);
    const observation = await runApplyPreflightWithDevBrowser({
      url: offer.url,
      platform,
      plan,
    }).catch(() => null);
    const opsContext = await resolveApplyOpsPlan({
      workspaceDir,
      host,
      flowKey,
      platform,
      plan,
      observation,
    });
    plan = opsContext.plan;

    await emitProgress(jobId, workspaceDir, {
      phase: "planning",
      updatedAt: new Date().toISOString(),
      message: "Construction du manifest et du bundle",
      platform,
      currentUrl: observation?.currentUrl ?? offer.url,
    }, hooks);

    const readiness = resolveReadiness(platform, observation);
    const manifestStatus = resolveManifestStatus(platform, observation);
    const manifest = await upsertApplyManifest(workspaceDir, {
      url: offer.url,
      platform,
      language,
      status: manifestStatus,
      confidence: resolveManifestConfidence(platform, observation),
      plan,
      observation,
      successSignals: plan.successHints,
      verificationSignals: plan.verificationHints,
      errorSignals: plan.errorHints,
      rawObservationSummary: observation ? toJsonValue({
        headings: observation.headings,
        buttonTexts: observation.buttonTexts.slice(0, 20),
        fieldLabels: observation.fieldLabels.slice(0, 20),
      }) : undefined,
    });
    const answerBundle = await buildAnswerBundle(workspaceDir, offer, language, opsContext);
    await persistAnswerBundle(workspaceDir, jobId, answerBundle);

    const checkpoint = buildPreflightOpsCheckpoint({
      phase: "completed",
      status: "completed",
      updatedAt: new Date().toISOString(),
      message: "Preflight termine",
      currentUrl: observation?.currentUrl ?? offer.url,
      playbook: opsContext.playbook,
      documents: opsContext.documents,
      authBranch: plan.authBranch,
      blockingReasonKey: plan.blockingReasonKey ?? null,
      nextAction: opsContext.nextAction,
      requiredFieldGroups: plan.requiredFieldGroups,
    });

    const endedAt = new Date();
    const summary: ApplyPreflightSummary = {
      jobId,
      offerId: offer.id,
      host,
      platform,
      flowKey,
      language,
      profileKey: profile.key,
      manifestId: manifest.id,
      manifestStatus,
      readiness,
      runtimePath: buildApplyPreflightArtifacts(workspaceDir, jobId).runtimeDir,
      observation,
      plan,
      answerBundlePath: buildApplyPreflightArtifacts(workspaceDir, jobId).answerBundleFile,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds: Math.max(
        1,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
      ),
      errors,
      playbookKey: plan.playbookKey ?? null,
      authBranch: plan.authBranch ?? null,
      blockingReasonKey: plan.blockingReasonKey ?? null,
      checkpoint,
      documents: opsContext.documents,
    };

    await Promise.all([
      persistApplyPreflightSummary(workspaceDir, summary),
      persistApplyPreflightState(workspaceDir, jobId, {
        progress: {
          phase: "completed",
          updatedAt: endedAt.toISOString(),
          message: "Preflight termine",
          platform,
          currentUrl: observation?.currentUrl ?? offer.url,
        },
        checkpoint,
      }),
      updateApplyPreflightJobRecord(jobId, {
        status: "completed",
        manifest: { connect: { id: manifest.id } },
        endedAt,
        summary: toJsonValue(summary),
        runtimePath: buildApplyPreflightArtifacts(workspaceDir, jobId).runtimeDir,
        lastMessage: "Preflight termine",
        error: null,
      }),
      prisma.jobOffer.update({
        where: { id: offer.id },
        data: {
          applyPlatform: platform,
          applyReadiness: readiness,
          applyManifestStatus: manifestStatus,
          applyManifestId: manifest.id,
          applyFlowKey: flowKey,
          lastPreflightAt: endedAt,
          preflightError: null,
        },
      }),
    ]);

    await emitProgress(jobId, workspaceDir, {
      progress: {
        phase: "completed",
        updatedAt: endedAt.toISOString(),
        message: "Preflight termine",
        platform,
        currentUrl: observation?.currentUrl ?? offer.url,
      },
      checkpoint,
    }, hooks);

    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!errors.includes(message)) {
      errors.push(message);
    }

    const endedAt = new Date();
    const failedCheckpoint = buildPreflightOpsCheckpoint({
      phase: "failed",
      status: "failed",
      updatedAt: endedAt.toISOString(),
      message,
      currentUrl: offer.url,
      playbook: null,
      documents: [],
      authBranch: "unknown",
      blockingReasonKey: toBlockingReason(message),
    });
    await Promise.allSettled([
      updateApplyPreflightJobRecord(jobId, {
        status: "failed",
        endedAt,
        error: message,
        lastMessage: message,
      }),
      prisma.jobOffer.update({
        where: { id: offer.id },
        data: {
          applyReadiness: "blocked",
          preflightError: message,
          lastPreflightAt: endedAt,
        },
      }),
      emitProgress(jobId, workspaceDir, {
        progress: {
          phase: "failed",
          updatedAt: endedAt.toISOString(),
          message,
          platform,
          currentUrl: offer.url,
        },
        checkpoint: failedCheckpoint,
      }, hooks),
      persistApplyPreflightState(workspaceDir, jobId, {
        progress: {
          phase: "failed",
          updatedAt: endedAt.toISOString(),
          message,
          platform,
          currentUrl: offer.url,
        },
        checkpoint: failedCheckpoint,
      }),
    ]);
    throw error;
  }
}

async function buildAnswerBundle(
  workspaceDir: string,
  offer: {
    title: string;
    company: string;
    city: string;
    country: string;
    description: string;
  },
  language: ProfileKey,
  opsContext?: {
    plan?: { playbookKey?: string | null };
    documents?: OpsDocumentRef[];
  }
): Promise<AnswerBundle> {
  const profile = await resolveCandidateProfile(language, workspaceDir);
  const alternateLanguage: ProfileKey = language === "fr" ? "en" : "fr";
  const alternateProfile = await resolveCandidateProfile(alternateLanguage, workspaceDir);
  const answerLookups = await buildAnswerLookupMaps(workspaceDir);
  const [primaryCoverLetter, alternateCoverLetter] = await Promise.all([
    generateCoverLetter(offer, profile, "none", workspaceDir),
    generateCoverLetter(offer, alternateProfile, "none", workspaceDir),
  ]);

  return {
    profileKey: profile.key,
    language: profile.language,
    cvPath: profile.cvPath,
    coverLetters: {
      [language]: primaryCoverLetter,
      [alternateLanguage]: alternateCoverLetter,
    } as Record<ProfileKey, string>,
    standardAnswers: {
      email: profile.email,
      phone: profile.phone,
      city: profile.location,
      linkedin: answerLookups.defaults.linkedin || profile.linkedinUrl || "",
      salary: answerLookups.defaults.salary || "Open to discuss based on the role and market standards.",
      availability: answerLookups.defaults.availability || "Available as soon as required.",
    },
    storedAnswers: await readStoredAnswers(workspaceDir),
    playbookKey: opsContext?.plan?.playbookKey ?? null,
    documents: opsContext?.documents,
    generatedAt: new Date().toISOString(),
  };
}

async function readStoredAnswers(workspaceDir: string) {
  const file = `${workspaceDir}/.runtime/apply-learnings/answers.json`;
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Record<string, { answer?: string }>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, value.answer ?? ""])
    );
  } catch {
    return {};
  }
}

async function emitProgress(
  jobId: string,
  workspaceDir: string,
  progress: ApplyPreflightProgress | {
    progress: ApplyPreflightProgress;
    checkpoint?: unknown;
  },
  hooks: {
    onProgress?: (progress: ApplyPreflightProgress) => Promise<void> | void;
  }
) {
  const payload = "progress" in progress ? progress : { progress };
  await hooks.onProgress?.(payload.progress);
  await persistApplyPreflightState(workspaceDir, jobId, payload).catch(() => {});
}

function inferPlatform(currentValue: string | null | undefined, url: string) {
  if (
    currentValue === "workday"
    || currentValue === "greenhouse"
    || currentValue === "lever"
    || currentValue === "smartrecruiters"
    || currentValue === "taleo"
    || currentValue === "workable"
    || currentValue === "ashby"
    || currentValue === "generic"
  ) {
    return currentValue;
  }

  if (/myworkdayjobs\.com/i.test(url)) return "workday";
  if (/greenhouse\.io/i.test(url)) return "greenhouse";
  if (/lever\.co/i.test(url)) return "lever";
  if (/smartrecruiters\.com/i.test(url)) return "smartrecruiters";
  if (/taleo\.net|tbe\.taleo/i.test(url)) return "taleo";
  if (/workable\.com/i.test(url)) return "workable";
  if (/ashbyhq\.com/i.test(url)) return "ashby";
  return "generic";
}

function resolveReadiness(
  platform: ReturnType<typeof inferPlatform>,
  observation: Awaited<ReturnType<typeof runApplyPreflightWithDevBrowser>>
): ApplyReadiness {
  const haystack = [
    ...(observation?.errorHints ?? []),
    ...(observation?.verificationHints ?? []),
    ...(observation?.authSignals ?? []),
  ].join("\n").toLowerCase();

  if (/captcha|robot|mfa|two-factor|2fa/.test(haystack)) {
    return "manual_only";
  }

  if (hasApplyAdapter(platform)) {
    return "ready";
  }

  if (observation && (observation.fieldLabels.length > 0 || observation.buttonTexts.length > 0)) {
    return "ready";
  }

  return "blocked";
}

function resolveManifestStatus(
  platform: ReturnType<typeof inferPlatform>,
  observation: Awaited<ReturnType<typeof runApplyPreflightWithDevBrowser>>
): ApplyManifestStatus {
  if (hasApplyAdapter(platform)) {
    return "validated";
  }
  if (observation && observation.fieldLabels.length > 0) {
    return "degraded";
  }
  return "draft";
}

function resolveManifestConfidence(
  platform: ReturnType<typeof inferPlatform>,
  observation: Awaited<ReturnType<typeof runApplyPreflightWithDevBrowser>>
) {
  if (hasApplyAdapter(platform)) return 85;
  if (observation && observation.fieldLabels.length > 0) return 55;
  if (observation) return 35;
  return 20;
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function toBlockingReason(message: string) {
  if (/captcha|robot/i.test(message)) return "manual_only_captcha" as const;
  if (/mfa|two-factor|2fa/i.test(message)) return "manual_only_mfa" as const;
  if (/verify|email/i.test(message)) return "email_verification_required" as const;
  return "worker_failed" as const;
}
