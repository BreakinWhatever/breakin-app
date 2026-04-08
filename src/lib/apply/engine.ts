import path from "node:path";
import { mkdir, readFile } from "node:fs/promises";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { LlmProvider } from "@/lib/scoring/llm";
import { buildApplyExecutionPlan, hasApplyAdapter } from "./adapters";
import { runApplyWithDevBrowser, detectApplyPlatform } from "./browser";
import { runApplyPlanWithDevBrowser } from "./browser-v3";
import { isApplyV3Enabled } from "./config";
import {
  appendApplyJobEvent,
  buildApplyJobArtifacts,
  persistApplyState,
  persistApplySummary,
  readApplyJobRecord,
  updateApplyJobRecord,
} from "./jobs";
import { findStoredAnswer, storeAnswerLearning } from "./learnings";
import { generateCoverLetter, answerApplicationQuestion } from "./llm";
import {
  buildApplyFlowKey,
  findApplyManifestForOffer,
  getApplyHost,
  markApplyManifestResult,
  parseApplyExecutionPlan,
} from "./manifests";
import { waitForVerificationArtifact } from "./mail";
import { buildApplyPreflightArtifacts } from "./preflight-jobs";
import { detectOfferLanguage, resolveCandidateProfile } from "./profiles";
import { selectApplyExecutionStrategy } from "./strategy";
import {
  buildAnswerLookupMaps,
  buildApplyCheckpointFromBrowserResult,
  buildApplyOpsCheckpoint,
  findOpsAnswer,
  resolveApplyOpsPlan,
} from "./ops";
import type {
  ApplyAnswer,
  ApplyExecutionPlan,
  ApplyExecutionStrategy,
  ApplyManifestStatus,
  ApplyPlatform,
  ApplyProgress,
  ApplyQuestion,
  ApplyReadiness,
  ApplyRunHooks,
  ApplySummary,
  ApplyTelemetry,
  BrowserRunResult,
  CandidateProfile,
  ProfileKey,
} from "./types";

export async function runApplyJob(
  jobId: string,
  workspaceDir: string,
  hooks: ApplyRunHooks = {}
) {
  const job = await readApplyJobRecord(jobId);
  if (!job) {
    throw new Error(`Missing apply job ${jobId}`);
  }

  const offer = job.offer;
  const artifacts = buildApplyJobArtifacts(workspaceDir, jobId);
  const errors: string[] = [];
  const startedAt = new Date();
  let coverLetter = "";
  let coverLetterId: string | null = null;
  let applicationId: string | null = null;
  let finalUrl: string | null = null;
  let verificationLink: string | null = null;
  let verificationCode: string | null = null;
  let emailChecks = 0;
  let attempts = 0;
  let answeredQuestions: ApplyAnswer[] = [];
  let browserResult: BrowserRunResult | null = null;

  const language = detectOfferLanguage(
    offer.title,
    offer.description,
    offer.country
  ) as ProfileKey;
  const profile = await resolveCandidateProfile(language, workspaceDir);
  const platform = detectApplyPlatform(offer.url);
  const flowKey = offer.applyFlowKey ?? buildApplyFlowKey(offer.url);
  const host = getApplyHost(offer.url);
  const llmProvider = resolveLlmProvider(job.input);
  const latestPreflight = await prisma.applyPreflightJob.findFirst({
    where: {
      offerId: offer.id,
      status: "completed",
    },
    orderBy: {
      endedAt: "desc",
    },
  });
  const preflightJobId = latestPreflight?.id ?? null;

  const telemetry: ApplyTelemetry = {
    strategy: "legacy_generic",
    contextAcquireMs: 0,
    manifestLoadMs: 0,
    formFillMs: 0,
    submitMs: 0,
    postSubmitValidationMs: 0,
    totalMs: 0,
  };

  const manifestLoadedAt = Date.now();
  const manifest = await findApplyManifestForOffer({
    url: offer.url,
    platform,
    language,
    manifestId: offer.applyManifestId,
  });
  const manifestId = manifest?.id ?? offer.applyManifestId ?? null;
  const manifestStatus = normalizeManifestStatus(
    offer.applyManifestStatus ?? manifest?.status
  );
  let readiness = normalizeReadiness(offer.applyReadiness);
  let plan = parseApplyExecutionPlan(manifest?.plan);
  if (!plan && hasApplyAdapter(platform)) {
    plan = buildApplyExecutionPlan(platform, flowKey);
    readiness ??= "ready";
  }
  telemetry.manifestLoadMs = Date.now() - manifestLoadedAt;

  const strategy = selectApplyExecutionStrategy({
    v3Enabled: isApplyV3Enabled(),
    platform,
    readiness,
    manifestStatus,
    plan,
  });
  telemetry.strategy = strategy;
  const opsContext = await resolveApplyOpsPlan({
    workspaceDir,
    host,
    flowKey,
    platform,
    plan: plan ?? buildApplyExecutionPlan(platform, flowKey),
  });
  const runtimePlan = opsContext.plan;
  const answerLookups = await buildAnswerLookupMaps(workspaceDir);

  await emitProgress(
    jobId,
    {
      phase: strategy === "manual" ? "needs_human" : "preparing",
      updatedAt: new Date().toISOString(),
      message: strategy === "manual"
        ? "Candidature sortie du fast path"
        : "Preparation de la candidature",
      platform,
      strategy,
      attempts,
      questionsPending: 0,
      emailChecks,
    },
    hooks
  );
  await updateApplyJobRecord(jobId, {
    language,
    profileKey: profile.key,
    platform,
    lastMessage: strategy === "manual"
      ? "Candidature sortie du fast path"
      : "Preparation de la candidature",
  });

  try {
    if (strategy === "manual") {
      throw new Error(
        readiness === "manual_only"
          ? "Apply requires manual review for this site"
          : "Apply requires preflight or fallback handling"
      );
    }

    coverLetter = await resolvePreparedCoverLetter(
      workspaceDir,
      preflightJobId,
      profile.language
    ) ?? await generateCoverLetter(offer, profile, llmProvider, workspaceDir);
    await appendApplyJobEvent(jobId, "cover_letter", "Lettre de motivation preparee");

    for (attempts = 1; attempts <= 4; attempts += 1) {
      browserResult = await runBrowserAttempt({
        jobId,
        offer,
        profile,
        platform,
        coverLetter,
        answeredQuestions,
        verificationLink,
        verificationCode,
        attempt: attempts,
        workspaceDir,
        hooks,
        emailChecks,
        strategy,
        plan: runtimePlan,
        telemetry,
      });

      finalUrl = browserResult.currentUrl ?? finalUrl;
      const checkpoint = buildApplyCheckpointFromBrowserResult({
        result: browserResult,
        playbook: opsContext.playbook,
        documents: opsContext.documents,
        plan: runtimePlan,
        phase: mapBrowserResultToPhase(browserResult),
        status: mapBrowserResultToStatus(browserResult),
        updatedAt: new Date().toISOString(),
      });
      browserResult.checkpoint = checkpoint;
      browserResult.blockingReasonKey = checkpoint.blockingReasonKey ?? null;
      await persistApplyState(workspaceDir, jobId, {
        attempt: attempts,
        platform,
        strategy,
        browserResult,
        answeredQuestions,
        verificationLink,
        verificationCode,
        checkpoint,
      });

      if (browserResult.status === "submitted") {
        break;
      }

      if (browserResult.status === "needs_email_verification") {
        await updateApplyJobRecord(jobId, {
          status: "waiting_email",
          lastMessage: "Verification email en attente",
        });
        await emitProgress(
          jobId,
          {
            phase: "email_verification",
            updatedAt: new Date().toISOString(),
            message: "Verification email en attente",
            platform,
            strategy,
            attempts,
            questionsPending: 0,
            emailChecks,
          },
          hooks
        );

        emailChecks += 1;
        const artifact = await waitForVerificationArtifact({
          targetEmail: profile.email,
          providerHint: platform,
        });
        if (!artifact) {
          errors.push("Verification email not received in time");
          throw new Error("Verification email not received in time");
        }

        verificationLink = artifact.link;
        verificationCode = artifact.code;
        await updateApplyJobRecord(jobId, {
          status: "running",
          lastMessage: "Verification email recue, reprise du flow",
        });
        await appendApplyJobEvent(jobId, "email_verified", "Verification email recue", {
          link: artifact.link,
          code: artifact.code,
          subject: artifact.subject,
          from: artifact.from,
        } as unknown as Prisma.InputJsonValue);
        continue;
      }

      if (browserResult.status === "needs_answers") {
        const resolved = await resolveAnswers({
          workspaceDir,
          platform,
          questions: browserResult.questions ?? [],
          profile,
          offer,
          coverLetter,
          llmProvider,
          answerLookups,
        });
        const merged = mergeAnswers(answeredQuestions, resolved);
        if (merged.length === answeredQuestions.length) {
          errors.push(browserResult.message);
          throw new Error(browserResult.message);
        }
        answeredQuestions = merged;
        await updateApplyJobRecord(jobId, {
          status: "running",
          lastMessage: `${resolved.length} reponses supplementaires preparees`,
        });
        await emitProgress(
          jobId,
          {
            phase: "answering",
            updatedAt: new Date().toISOString(),
            message: `${resolved.length} reponses supplementaires preparees`,
            platform,
            strategy,
            attempts,
            questionsPending: browserResult.questions?.length ?? 0,
            emailChecks,
          },
          hooks
        );
        continue;
      }

      errors.push(browserResult.message);
      throw new Error(browserResult.message);
    }

    if (!browserResult || browserResult.status !== "submitted") {
      errors.push("Apply flow exited without a confirmed submission");
      throw new Error("Apply flow exited without a confirmed submission");
    }

    finalUrl = browserResult.currentUrl ?? finalUrl;
    coverLetterId = coverLetter
      ? await persistCoverLetter(offer.id, profile.language, coverLetter)
      : null;
    applicationId = await persistApplication({
      offerId: offer.id,
      companyName: offer.company,
      role: offer.title,
      coverLetterId,
      platform,
    });

    await prisma.jobOffer.update({
      where: { id: offer.id },
      data: { status: "applied" },
    });

    const endedAt = new Date();
    const checkpoint = buildApplyOpsCheckpoint({
      phase: "completed",
      status: "succeeded",
      updatedAt: endedAt.toISOString(),
      message: "Candidature terminee",
      currentUrl: finalUrl,
      playbook: opsContext.playbook,
      documents: opsContext.documents,
      plan: runtimePlan,
      metrics: {
        attempts,
        emailChecks,
        answeredQuestions: answeredQuestions.length,
      },
    });
    const summary: ApplySummary = {
      jobId,
      offerId: offer.id,
      source: job.source,
      platform,
      strategy,
      language: profile.language,
      profileKey: profile.key,
      outcome: "succeeded",
      applicationId,
      coverLetterId,
      manifestId,
      manifestStatus,
      preflightJobId,
      readiness,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds: Math.max(
        1,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
      ),
      finalUrl,
      runtimePath: artifacts.runtimeDir,
      artifacts,
      telemetry: {
        ...telemetry,
        totalMs: Math.max(1, endedAt.getTime() - startedAt.getTime()),
      },
      answeredQuestions,
      errors,
      playbookKey: runtimePlan?.playbookKey ?? null,
      authBranch: runtimePlan?.authBranch ?? null,
      blockingReasonKey: checkpoint.blockingReasonKey ?? null,
      checkpoint,
      documents: opsContext.documents,
    };

    if (manifestId) {
      await markApplyManifestResult(manifestId, "succeeded").catch(() => {});
    }

    await persistApplySummary(workspaceDir, summary);
    await persistApplyState(workspaceDir, jobId, {
      checkpoint,
      progress: {
        phase: "completed",
        updatedAt: endedAt.toISOString(),
        message: "Candidature terminee",
        platform,
        strategy,
        attempts,
        questionsPending: 0,
        emailChecks,
        currentUrl: finalUrl,
      },
    });
    await updateApplyJobRecord(jobId, {
      status: "succeeded",
      endedAt,
      application: applicationId ? { connect: { id: applicationId } } : undefined,
      language,
      profileKey: profile.key,
      platform,
      summary: summary as unknown as Prisma.InputJsonValue,
      lastMessage: "Candidature soumise avec succes",
      error: null,
    });
    await appendApplyJobEvent(jobId, "completed", "Candidature soumise avec succes", {
      applicationId,
      finalUrl,
      strategy,
    } as unknown as Prisma.InputJsonValue);
    await emitProgress(
      jobId,
      {
        phase: "completed",
        updatedAt: endedAt.toISOString(),
        message: "Candidature terminee",
        platform,
        strategy,
        attempts,
        questionsPending: 0,
        emailChecks,
      },
      hooks
    );

    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!errors.includes(message)) {
      errors.push(message);
    }

    const endedAt = new Date();
    const checkpoint = buildApplyOpsCheckpoint({
      phase: "failed",
      status: "failed",
      updatedAt: endedAt.toISOString(),
      message,
      currentUrl: finalUrl,
      playbook: opsContext.playbook,
      documents: opsContext.documents,
      plan: runtimePlan,
      blockingReasonKey:
        browserResult?.blockingReasonKey
        ?? runtimePlan?.blockingReasonKey
        ?? "worker_failed",
      metrics: {
        attempts,
        emailChecks,
        answeredQuestions: answeredQuestions.length,
      },
    });
    const summary: ApplySummary = {
      jobId,
      offerId: offer.id,
      source: job.source,
      platform,
      strategy,
      language: profile.language,
      profileKey: profile.key,
      outcome: "failed",
      applicationId,
      coverLetterId,
      manifestId,
      manifestStatus,
      preflightJobId,
      readiness,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds: Math.max(
        1,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
      ),
      finalUrl,
      runtimePath: artifacts.runtimeDir,
      artifacts,
      telemetry: {
        ...telemetry,
        totalMs: Math.max(1, endedAt.getTime() - startedAt.getTime()),
      },
      answeredQuestions,
      errors,
      playbookKey: runtimePlan?.playbookKey ?? null,
      authBranch: runtimePlan?.authBranch ?? null,
      blockingReasonKey: checkpoint.blockingReasonKey ?? null,
      checkpoint,
      documents: opsContext.documents,
    };

    if (manifestId) {
      await markApplyManifestResult(manifestId, "failed").catch(() => {});
    }

    await persistApplySummary(workspaceDir, summary).catch(() => {});
    await persistApplyState(workspaceDir, jobId, {
      checkpoint,
      progress: {
        phase: "failed",
        updatedAt: endedAt.toISOString(),
        message,
        platform,
        strategy,
        attempts,
        questionsPending: 0,
        emailChecks,
        currentUrl: finalUrl,
      },
    }).catch(() => {});
    await prisma.jobOffer.update({
      where: { id: offer.id },
      data: { status: "apply_failed" },
    }).catch(() => {});
    await updateApplyJobRecord(jobId, {
      status: "failed",
      endedAt,
      language,
      profileKey: profile.key,
      platform,
      summary: summary as unknown as Prisma.InputJsonValue,
      error: message,
      lastMessage: message,
    }).catch(() => {});
    await appendApplyJobEvent(jobId, "failed", message).catch(() => {});
    await emitProgress(
      jobId,
      {
        phase: "failed",
        updatedAt: endedAt.toISOString(),
        message,
        platform,
        strategy,
        attempts,
        questionsPending: 0,
        emailChecks,
      },
      hooks
    ).catch(() => {});
    throw error;
  }
}

async function runBrowserAttempt(input: {
  jobId: string;
  offer: {
    id: string;
    title: string;
    company: string;
    description: string;
    city: string;
    country: string;
    url: string;
  };
  profile: CandidateProfile;
  platform: ApplyPlatform;
  coverLetter: string;
  answeredQuestions: ApplyAnswer[];
  verificationLink: string | null;
  verificationCode: string | null;
  attempt: number;
  workspaceDir: string;
  hooks: ApplyRunHooks;
  emailChecks: number;
  strategy: ApplyExecutionStrategy;
  plan: ApplyExecutionPlan | null;
  telemetry: ApplyTelemetry;
}) {
  const artifacts = buildApplyJobArtifacts(input.workspaceDir, input.jobId);
  const screenshotPath = path.join(
    artifacts.screenshotDir,
    `attempt-${String(input.attempt).padStart(2, "0")}.png`
  );

  await mkdir(artifacts.screenshotDir, { recursive: true });

  const contextAcquireStartedAt = Date.now();
  await emitProgress(
    input.jobId,
    {
      phase:
        input.plan && input.strategy === "manifest"
          ? "context_acquire"
          : input.strategy === "agent_fallback"
          ? "fallback"
          : input.verificationLink || input.verificationCode
          ? "auth"
          : "opening",
      updatedAt: new Date().toISOString(),
      message: `Tentative ${input.attempt}: ouverture du navigateur`,
      platform: input.platform,
      strategy: input.strategy,
      attempts: input.attempt,
      questionsPending: input.answeredQuestions.length,
      emailChecks: input.emailChecks,
      currentUrl: input.offer.url,
    },
    input.hooks
  );

  await updateApplyJobRecord(input.jobId, {
    status: "running",
    lastMessage: `Tentative ${input.attempt} en cours`,
  });

  input.telemetry.contextAcquireMs += Date.now() - contextAcquireStartedAt;
  const browserStartedAt = Date.now();

  const result = input.plan && input.strategy === "manifest"
    ? await runApplyPlanWithDevBrowser({
        platform: input.platform,
        url: input.offer.url,
        profile: input.profile,
        coverLetter: input.coverLetter,
        extraAnswers: input.answeredQuestions,
        verificationLink: input.verificationLink,
        verificationCode: input.verificationCode,
        screenshotPath,
        plan: input.plan,
      })
    : await runApplyWithDevBrowser({
        platform: input.platform,
        url: input.offer.url,
        profile: input.profile,
        coverLetter: input.coverLetter,
        extraAnswers: input.answeredQuestions,
        verificationLink: input.verificationLink,
        verificationCode: input.verificationCode,
        screenshotPath,
      });

  const browserElapsedMs = Date.now() - browserStartedAt;
  input.telemetry.formFillMs += Math.round(browserElapsedMs * 0.6);
  input.telemetry.submitMs += Math.round(browserElapsedMs * 0.25);
  input.telemetry.postSubmitValidationMs += Math.max(
    1,
    browserElapsedMs
      - Math.round(browserElapsedMs * 0.6)
      - Math.round(browserElapsedMs * 0.25)
  );

  await appendApplyJobEvent(
    input.jobId,
    "attempt",
    `Tentative ${input.attempt}: ${result.status}`,
    {
      message: result.message,
      currentUrl: result.currentUrl,
      pageTextSnippet: result.pageTextSnippet,
      questions: result.questions ?? [],
      screenshotPath,
      strategy: input.strategy,
    } as unknown as Prisma.InputJsonValue
  );

  return result;
}

async function resolveAnswers(input: {
  workspaceDir: string;
  platform: ApplyPlatform;
  questions: ApplyQuestion[];
  profile: CandidateProfile;
  offer: {
    title: string;
    company: string;
    description: string;
    city: string;
    country: string;
  };
  coverLetter: string;
  llmProvider: LlmProvider | undefined;
  answerLookups: Awaited<ReturnType<typeof buildAnswerLookupMaps>>;
}) {
  const answers: ApplyAnswer[] = [];

  for (const question of input.questions) {
    const stored = await findStoredAnswer(
      input.workspaceDir,
      input.platform,
      question.label
    );
    if (stored) {
      answers.push({
        questionKey: question.key,
        label: question.label,
        answer: stored.answer,
        source: "memory",
      });
      continue;
    }

    const opsAnswer = findOpsAnswer(question, input.answerLookups);
    if (opsAnswer) {
      answers.push({
        questionKey: question.key,
        label: question.label,
        answer: opsAnswer,
        source: "rules",
      });
      await storeAnswerLearning(
        input.workspaceDir,
        input.platform,
        question.label,
        opsAnswer,
        "rules"
      );
      continue;
    }

    const ruleAnswer = resolveRuleAnswer(question, input.profile, input.coverLetter);
    if (ruleAnswer) {
      answers.push({
        questionKey: question.key,
        label: question.label,
        answer: ruleAnswer,
        source: "rules",
      });
      await storeAnswerLearning(
        input.workspaceDir,
        input.platform,
        question.label,
        ruleAnswer,
        "rules"
      );
      continue;
    }

    const llmAnswer = await answerApplicationQuestion(
      question,
      input.offer,
      input.profile,
      input.llmProvider,
      input.workspaceDir
    );
    if (!llmAnswer) continue;

    answers.push({
      questionKey: question.key,
      label: question.label,
      answer: llmAnswer,
      source: "llm",
    });
    await storeAnswerLearning(
      input.workspaceDir,
      input.platform,
      question.label,
      llmAnswer,
      "llm"
    );
  }

  return answers;
}

function resolveRuleAnswer(
  question: ApplyQuestion,
  profile: CandidateProfile,
  coverLetter: string
) {
  const label = normalize(question.label);
  if (!label) return "";
  if (/first name|prenom|prénom|given name/.test(label)) return profile.firstName;
  if (/last name|nom|surname|family name/.test(label)) return profile.lastName;
  if (/full name|name/.test(label)) return `${profile.firstName} ${profile.lastName}`;
  if (/email/.test(label)) return profile.email;
  if (/phone|telephone|mobile/.test(label)) return profile.phone;
  if (/linkedin/.test(label)) return profile.linkedinUrl ?? "";
  if (/city|location|where are you based|based in/.test(label)) return profile.location;
  if (/cover letter|motivation|why are you interested|pourquoi/.test(label)) return coverLetter;
  if (/salary|compensation|remuneration|rémunération/.test(label)) {
    return "Open to discuss based on the role and market standards.";
  }
  if (/availability|available start|start date|disponibilite|disponibilité/.test(label)) {
    return "Available as soon as required.";
  }
  if (/website|portfolio/.test(label)) {
    return "";
  }
  return "";
}

async function persistCoverLetter(
  offerId: string,
  language: ProfileKey,
  body: string
) {
  const created = await prisma.coverLetter.create({
    data: {
      offerId,
      language,
      title: `LM auto ${offerId}`,
      body,
    },
  });
  return created.id;
}

async function persistApplication(input: {
  offerId: string;
  companyName: string;
  role: string;
  coverLetterId: string | null;
  platform: string;
}) {
  const existing = await prisma.application.findFirst({
    where: { offerId: input.offerId },
  });
  if (existing) {
    return existing.id;
  }

  const created = await prisma.application.create({
    data: {
      offerId: input.offerId,
      companyName: input.companyName,
      role: input.role,
      source: "auto",
      status: "applied",
      appliedAt: new Date(),
      coverLetterId: input.coverLetterId ?? null,
      notes: `Auto-apply via ${input.platform}`,
    },
  });
  return created.id;
}

async function emitProgress(
  jobId: string,
  progress: ApplyProgress,
  hooks: ApplyRunHooks
) {
  await hooks.onProgress?.(progress);
  await appendApplyJobEvent(jobId, "progress", progress.message ?? progress.phase, {
    phase: progress.phase,
    currentUrl: progress.currentUrl ?? null,
    attempts: progress.attempts,
    questionsPending: progress.questionsPending,
    emailChecks: progress.emailChecks,
    platform: progress.platform ?? null,
    strategy: progress.strategy ?? null,
  } as unknown as Prisma.InputJsonValue).catch(() => {});
}

function mergeAnswers(current: ApplyAnswer[], next: ApplyAnswer[]) {
  const byKey = new Map(current.map((answer) => [answer.questionKey, answer]));
  for (const answer of next) {
    byKey.set(answer.questionKey, answer);
  }
  return Array.from(byKey.values());
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveLlmProvider(input: Prisma.JsonValue | null): LlmProvider | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const value = Reflect.get(input, "llmProvider");
  if (value === "auto" || value === "none" || value === "claude" || value === "codex") {
    return value;
  }
  return undefined;
}

async function resolvePreparedCoverLetter(
  workspaceDir: string,
  preflightJobId: string | null,
  language: ProfileKey
) {
  if (!preflightJobId) return null;

  try {
    const file = buildApplyPreflightArtifacts(workspaceDir, preflightJobId).answerBundleFile;
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as {
      coverLetters?: Partial<Record<ProfileKey, string>>;
    };
    return parsed.coverLetters?.[language] ?? null;
  } catch {
    return null;
  }
}

function normalizeReadiness(value: string | null | undefined): ApplyReadiness | null {
  if (
    value === "ready"
    || value === "pending_preflight"
    || value === "blocked"
    || value === "manual_only"
  ) {
    return value;
  }
  return null;
}

function normalizeManifestStatus(value: string | null | undefined): ApplyManifestStatus | null {
  if (
    value === "draft"
    || value === "validated"
    || value === "degraded"
    || value === "broken"
  ) {
    return value;
  }
  return null;
}

function mapBrowserResultToPhase(result: BrowserRunResult) {
  if (result.status === "submitted") return "completed";
  if (result.status === "needs_email_verification") return "email_verification";
  if (result.status === "needs_answers") return "answering";
  if (result.status === "manual_review") return "needs_human";
  return "failed";
}

function mapBrowserResultToStatus(result: BrowserRunResult) {
  if (result.status === "submitted") return "succeeded";
  if (result.status === "needs_email_verification") return "waiting_email";
  if (result.status === "needs_answers") return "blocked";
  if (result.status === "manual_review") return "manual_review";
  return "failed";
}
