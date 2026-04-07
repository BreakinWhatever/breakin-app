import path from "node:path";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { LlmProvider } from "@/lib/scoring/llm";
import { runApplyWithDevBrowser, detectApplyPlatform } from "./browser";
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
import { waitForVerificationArtifact } from "./mail";
import { detectOfferLanguage, resolveCandidateProfile } from "./profiles";
import type {
  ApplyAnswer,
  ApplyPlatform,
  ApplyProgress,
  ApplyQuestion,
  ApplyRunHooks,
  ApplySummary,
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

  const language = detectOfferLanguage(
    offer.title,
    offer.description,
    offer.country
  ) as ProfileKey;
  const profile = await resolveCandidateProfile(language, workspaceDir);
  const platform = detectApplyPlatform(offer.url);
  const llmProvider = resolveLlmProvider(job.input);

  await emitProgress(
    jobId,
    {
      phase: "preparing",
      updatedAt: new Date().toISOString(),
      message: "Preparation de la candidature",
      platform,
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
    lastMessage: "Preparation de la candidature",
  });

  try {
    coverLetter = await generateCoverLetter(offer, profile, llmProvider, workspaceDir);
    await appendApplyJobEvent(jobId, "cover_letter", "Lettre de motivation preparee");

    let browserResult: BrowserRunResult | null = null;
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
      });

      finalUrl = browserResult.currentUrl ?? finalUrl;
      await persistApplyState(workspaceDir, jobId, {
        attempt: attempts,
        platform,
        browserResult,
        answeredQuestions,
        verificationLink,
        verificationCode,
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
    const summary: ApplySummary = {
      jobId,
      offerId: offer.id,
      source: job.source,
      platform,
      language: profile.language,
      profileKey: profile.key,
      outcome: "succeeded",
      applicationId,
      coverLetterId,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds: Math.max(
        1,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
      ),
      finalUrl,
      runtimePath: artifacts.runtimeDir,
      artifacts,
      answeredQuestions,
      errors,
    };

    await persistApplySummary(workspaceDir, summary);
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
    } as unknown as Prisma.InputJsonValue);
    await emitProgress(
      jobId,
      {
        phase: "completed",
        updatedAt: endedAt.toISOString(),
        message: "Candidature terminee",
        platform,
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
    const summary: ApplySummary = {
      jobId,
      offerId: offer.id,
      source: job.source,
      platform,
      language: profile.language,
      profileKey: profile.key,
      outcome: "failed",
      applicationId,
      coverLetterId,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds: Math.max(
        1,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
      ),
      finalUrl,
      runtimePath: artifacts.runtimeDir,
      artifacts,
      answeredQuestions,
      errors,
    };

    await persistApplySummary(workspaceDir, summary).catch(() => {});
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
}) {
  const artifacts = buildApplyJobArtifacts(input.workspaceDir, input.jobId);
  const screenshotPath = path.join(
    artifacts.screenshotDir,
    `attempt-${String(input.attempt).padStart(2, "0")}.png`
  );

  await emitProgress(
    input.jobId,
    {
      phase: input.verificationLink || input.verificationCode ? "auth" : "opening",
      updatedAt: new Date().toISOString(),
      message: `Tentative ${input.attempt}: ouverture du navigateur`,
      platform: input.platform,
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

  const result = await runApplyWithDevBrowser({
    platform: input.platform,
    url: input.offer.url,
    profile: input.profile,
    coverLetter: input.coverLetter,
    extraAnswers: input.answeredQuestions,
    verificationLink: input.verificationLink,
    verificationCode: input.verificationCode,
    screenshotPath,
  });

    await appendApplyJobEvent(
      input.jobId,
      "attempt",
      `Tentative ${input.attempt}: ${result.status}`,
      {
        message: result.message,
        currentUrl: result.currentUrl,
        questions: result.questions ?? [],
        screenshotPath,
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
