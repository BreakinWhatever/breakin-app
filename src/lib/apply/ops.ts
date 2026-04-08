import {
  findApplyPlaybook,
  normalizeOpsQuestionKey,
  readStandardAnswers,
  resolveOpsDocumentRefs,
} from "@/lib/ops";
import {
  buildApplyCheckpoint,
  buildPreflightCheckpoint,
  groupFieldLabels,
  resolveBlockingReasonFromText,
} from "@/lib/ops/checkpoints";
import type {
  ApplyPlaybook,
  BlockingReason,
  OpsDocumentRef,
  RunCheckpoint,
} from "@/lib/ops/types";
import type {
  ApplyExecutionPlan,
  ApplyPreflightObservation,
  ApplyQuestion,
  BrowserRunResult,
} from "./types";
import {
  inferAuthBranchFromObservation,
  mergePlanWithObservation,
  mergePlanWithPlaybook,
} from "./adapters";

export async function resolveApplyOpsPlan(input: {
  workspaceDir: string;
  host: string;
  flowKey: string;
  platform: ApplyExecutionPlan["platform"];
  plan: ApplyExecutionPlan;
  observation?: ApplyPreflightObservation | null;
}) {
  const playbook = await findApplyPlaybook({
    workspaceDir: input.workspaceDir,
    platform: input.platform,
    host: input.host,
    flowKey: input.flowKey,
  });
  const documents = await resolveOpsDocumentRefs(input.workspaceDir, [
    "ops/progress",
    "ops/system-map",
    ...(playbook ? [playbook.key] : []),
  ]);

  let plan = mergePlanWithPlaybook(input.plan, playbook);
  if (input.observation) {
    plan = mergePlanWithObservation(plan, {
      buttonTexts: input.observation.buttonTexts,
      fieldLabels: input.observation.fieldLabels,
      successHints: input.observation.successHints,
      verificationHints: input.observation.verificationHints,
      errorHints: input.observation.errorHints,
      resumeUploadDetected: input.observation.resumeUploadDetected,
    });
  }

  const authBranch = inferAuthBranchFromObservation(plan, playbook, {
    buttonTexts: input.observation?.buttonTexts,
    fieldLabels: input.observation?.fieldLabels,
    authSignals: input.observation?.authSignals,
  });
  const requiredFieldGroups = [
    ...(plan.requiredFieldGroups ?? []),
    ...groupFieldLabels([
      ...(input.observation?.fieldLabels ?? []),
      ...(input.observation?.requiredQuestions ?? []).map((question) => question.label),
    ]),
  ].filter(Boolean);

  const blockingReasonKey = resolveBlockingReasonKey({
    errorHints: input.observation?.errorHints ?? [],
    verificationHints: input.observation?.verificationHints ?? [],
    authSignals: input.observation?.authSignals ?? [],
  });

  return {
    playbook,
    documents,
    plan: {
      ...plan,
      authBranch,
      blockingReasonKey,
      requiredFieldGroups: dedupe(requiredFieldGroups),
    } satisfies ApplyExecutionPlan,
    authBranch,
    requiredFieldGroups: dedupe(requiredFieldGroups),
    blockingReasonKey,
    nextAction: playbook?.nextActions?.[authBranch] ?? null,
  };
}

export async function buildAnswerLookupMaps(workspaceDir: string) {
  const store = await readStandardAnswers(workspaceDir);
  const questions = Object.fromEntries(
    Object.entries(store.questions).map(([key, value]) => [
      normalizeOpsQuestionKey(key),
      value,
    ])
  );

  return {
    defaults: store.defaults,
    questions,
  };
}

export function findOpsAnswer(
  question: Pick<ApplyQuestion, "label">,
  answers: Awaited<ReturnType<typeof buildAnswerLookupMaps>>
) {
  const labelKey = normalizeOpsQuestionKey(question.label);
  return answers.questions[labelKey] ?? "";
}

export function buildPreflightOpsCheckpoint(input: {
  phase: string;
  status: string;
  updatedAt: string;
  message?: string;
  currentUrl?: string | null;
  playbook: ApplyPlaybook | null;
  documents: OpsDocumentRef[];
  authBranch: ApplyExecutionPlan["authBranch"];
  blockingReasonKey: BlockingReason | null;
  nextAction?: string | null;
  requiredFieldGroups?: string[];
}) {
  return buildPreflightCheckpoint({
    phase: input.phase,
    status: input.status,
    updatedAt: input.updatedAt,
    message: input.message,
    currentUrl: input.currentUrl,
    playbookKey: input.playbook?.key ?? null,
    authBranch: input.authBranch ?? null,
    blockingReasonKey: input.blockingReasonKey,
    nextAction: input.nextAction ?? null,
    requiredFieldGroups: input.requiredFieldGroups ?? [],
    documents: input.documents,
  });
}

export function buildApplyOpsCheckpoint(input: {
  phase: string;
  status: string;
  updatedAt: string;
  message?: string;
  currentUrl?: string | null;
  playbook: ApplyPlaybook | null;
  documents: OpsDocumentRef[];
  plan: ApplyExecutionPlan | null;
  blockingReasonKey?: BlockingReason | null;
  nextAction?: string | null;
  metrics?: RunCheckpoint["metrics"];
}) {
  return buildApplyCheckpoint({
    phase: input.phase,
    status: input.status,
    updatedAt: input.updatedAt,
    message: input.message,
    currentUrl: input.currentUrl,
    playbookKey: input.playbook?.key ?? input.plan?.playbookKey ?? null,
    authBranch: input.plan?.authBranch ?? null,
    blockingReasonKey: input.blockingReasonKey ?? input.plan?.blockingReasonKey ?? null,
    nextAction: input.nextAction ?? input.playbook?.nextActions?.[input.plan?.authBranch ?? "unknown"] ?? null,
    requiredFieldGroups: input.plan?.requiredFieldGroups ?? [],
    documents: input.documents,
    metrics: input.metrics,
  });
}

export function buildApplyCheckpointFromBrowserResult(input: {
  result: BrowserRunResult;
  playbook: ApplyPlaybook | null;
  documents: OpsDocumentRef[];
  plan: ApplyExecutionPlan | null;
  phase: string;
  status: string;
  updatedAt: string;
  message?: string;
}) {
  const blockingReasonKey = input.result.blockingReasonKey
    ?? resolveBlockingReasonKey({
      errorHints: [input.result.message],
      verificationHints: input.result.status === "needs_email_verification" ? [input.result.message] : [],
      authSignals:
        input.result.status === "needs_answers"
          ? (input.result.questions ?? []).map((question) => question.label)
          : [],
    });

  return buildApplyOpsCheckpoint({
    phase: input.phase,
    status: input.status,
    updatedAt: input.updatedAt,
    message: input.message ?? input.result.message,
    currentUrl: input.result.currentUrl ?? null,
    playbook: input.playbook,
    documents: input.documents,
    plan: input.plan,
    blockingReasonKey,
  });
}

function resolveBlockingReasonKey(input: {
  errorHints: string[];
  verificationHints: string[];
  authSignals: string[];
}) {
  const haystack = [...input.errorHints, ...input.verificationHints, ...input.authSignals].join("\n");
  return resolveBlockingReasonFromText(haystack);
}

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
