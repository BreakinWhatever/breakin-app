import type {
  BlockingReason,
  OpsDocumentRef,
  RunCheckpoint,
  ApplyAuthBranch,
} from "./types";
import type { BrowserRunResult } from "@/lib/apply/types";
import type { SearchProgress } from "@/lib/sourcing/types";

const AUTH_PATTERNS = /password|sign in|log in|connexion|verify new password|confirm password|email/i;
const IDENTITY_PATTERNS = /first name|last name|full name|email|phone|telephone|mobile|city|location/i;
const RESUME_PATTERNS = /resume|cv|upload|attachment|curriculum/i;

export function groupFieldLabels(labels: string[]) {
  const groups = new Set<string>();
  for (const label of labels) {
    if (AUTH_PATTERNS.test(label)) groups.add("auth");
    else if (RESUME_PATTERNS.test(label)) groups.add("resume");
    else if (IDENTITY_PATTERNS.test(label)) groups.add("identity");
    else groups.add("questionnaire");
  }
  return [...groups];
}

export function resolveBlockingReasonFromText(text: string): BlockingReason | null {
  const haystack = String(text || "").toLowerCase();
  if (!haystack) return null;
  if (/captcha|robot/.test(haystack)) return "manual_only_captcha";
  if (/mfa|two-factor|2fa/.test(haystack)) return "manual_only_mfa";
  if (/verify your email|verification code|check your email/.test(haystack)) {
    return "email_verification_required";
  }
  if (/sign in|log in|password|create account/.test(haystack)) return "auth_required";
  return null;
}

export function resolveBlockingReasonFromBrowserResult(
  result: BrowserRunResult | null
): BlockingReason | null {
  if (!result) return null;
  if (result.status === "needs_answers") return "additional_required_answers";
  if (result.status === "needs_email_verification") return "email_verification_required";
  if (result.status === "manual_review") return "manual_review_required";
  if (result.status === "failed") return resolveBlockingReasonFromText(result.message) ?? "worker_failed";
  return null;
}

export function buildApplyCheckpoint(input: {
  phase: string;
  status: string;
  updatedAt: string;
  message?: string;
  currentUrl?: string | null;
  playbookKey?: string | null;
  authBranch?: ApplyAuthBranch | null;
  blockingReasonKey?: BlockingReason | null;
  nextAction?: string | null;
  requiredFieldGroups?: string[];
  documents?: OpsDocumentRef[];
  metrics?: RunCheckpoint["metrics"];
}) {
  return {
    domain: "apply",
    phase: input.phase,
    status: input.status,
    updatedAt: input.updatedAt,
    message: input.message,
    currentUrl: input.currentUrl ?? null,
    currentStep: input.phase,
    playbookKey: input.playbookKey ?? null,
    authBranch: input.authBranch ?? null,
    blockingReasonKey: input.blockingReasonKey ?? null,
    nextAction: input.nextAction ?? null,
    requiredFieldGroups: input.requiredFieldGroups ?? [],
    documents: input.documents ?? [],
    metrics: input.metrics,
  } satisfies RunCheckpoint;
}

export function buildPreflightCheckpoint(input: {
  phase: string;
  status: string;
  updatedAt: string;
  message?: string;
  currentUrl?: string | null;
  playbookKey?: string | null;
  authBranch?: ApplyAuthBranch | null;
  blockingReasonKey?: BlockingReason | null;
  nextAction?: string | null;
  requiredFieldGroups?: string[];
  documents?: OpsDocumentRef[];
}) {
  return {
    domain: "preflight",
    phase: input.phase,
    status: input.status,
    updatedAt: input.updatedAt,
    message: input.message,
    currentUrl: input.currentUrl ?? null,
    currentStep: input.phase,
    playbookKey: input.playbookKey ?? null,
    authBranch: input.authBranch ?? null,
    blockingReasonKey: input.blockingReasonKey ?? null,
    nextAction: input.nextAction ?? null,
    requiredFieldGroups: input.requiredFieldGroups ?? [],
    documents: input.documents ?? [],
  } satisfies RunCheckpoint;
}

export function buildSearchCheckpoint(progress: SearchProgress): RunCheckpoint {
  return {
    domain: "search",
    phase: progress.phase,
    status: progress.phase === "failed" ? "failed" : progress.phase === "completed" ? "completed" : "running",
    updatedAt: progress.updatedAt,
    message: progress.message,
    currentUrl: progress.currentPageUrl ?? null,
    currentStep: progress.currentCompany ?? progress.phase,
    blockingReasonKey:
      progress.phase === "failed"
        ? resolveBlockingReasonFromText(progress.message || "") ?? "worker_failed"
        : null,
    nextAction: progress.phase === "failed" ? "Inspect the worker log and rerun with the last good request." : null,
    requiredFieldGroups: [],
    metrics: {
      companiesScraped: progress.companiesScraped,
      companiesConsidered: progress.companiesConsidered,
      offersFound: progress.offersFound,
      offersImported: progress.offersImported,
      pagesVisited: progress.pagesVisited,
    },
  };
}
