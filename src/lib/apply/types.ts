import type { LlmProvider } from "@/lib/scoring/llm";
import type {
  ApplyAuthBranch,
  BlockingReason,
  OpsDocumentRef,
  RunCheckpoint,
} from "@/lib/ops/types";

export type ApplyJobStatus =
  | "queued"
  | "running"
  | "waiting_email"
  | "succeeded"
  | "failed"
  | "cancelled";

export type ApplyPhase =
  | "queued"
  | "preflight_wait"
  | "preparing"
  | "context_acquire"
  | "manifest_load"
  | "opening"
  | "auth"
  | "email_verification"
  | "answering"
  | "submitting"
  | "fallback"
  | "needs_human"
  | "completed"
  | "failed";

export type ApplyPlatform =
  | "workday"
  | "greenhouse"
  | "lever"
  | "smartrecruiters"
  | "taleo"
  | "workable"
  | "ashby"
  | "generic";

export type ProfileKey = "fr" | "en";

export type ApplyReadiness =
  | "ready"
  | "pending_preflight"
  | "blocked"
  | "manual_only";

export type ApplyManifestStatus =
  | "draft"
  | "validated"
  | "degraded"
  | "broken";

export type ApplyExecutionStrategy =
  | "ats_adapter"
  | "manifest"
  | "agent_fallback"
  | "manual"
  | "legacy_generic";

export type CandidateFieldKey =
  | "firstName"
  | "lastName"
  | "fullName"
  | "email"
  | "phone"
  | "city"
  | "linkedinUrl"
  | "website"
  | "salary"
  | "availability"
  | "coverLetter"
  | "password"
  | "confirmPassword";

export interface ApplyRequest {
  offerId: string;
  source: string;
  force?: boolean;
  chatId?: string;
  replyToMessageId?: number;
  llmProvider?: LlmProvider;
}

export interface CandidateProfile {
  key: ProfileKey;
  language: ProfileKey;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  cvPath: string;
  cvFileName: string;
  accountPassword: string;
  summary: string;
  education: string[];
  experience: string[];
  skills: string[];
  languages: string[];
  linkedinUrl?: string | null;
}

export interface ApplyQuestion {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "radio";
  required: boolean;
  options: string[];
}

export interface ApplyAnswer {
  questionKey: string;
  label: string;
  answer: string;
  source: "memory" | "rules" | "llm";
}

export interface ApplyProgress {
  phase: ApplyPhase;
  updatedAt: string;
  message?: string;
  platform?: ApplyPlatform | null;
  currentUrl?: string;
  strategy?: ApplyExecutionStrategy;
  attempts: number;
  questionsPending: number;
  emailChecks: number;
}

export interface ApplyButtonHints {
  apply: string[];
  manual: string[];
  guest: string[];
  next: string[];
  review: string[];
  submit: string[];
  createAccount: string[];
  login: string[];
}

export type ApplyFieldHints = Record<CandidateFieldKey, string[]>;

export interface ApplyExecutionPlan {
  strategy: ApplyExecutionStrategy;
  platform: ApplyPlatform;
  flowKey: string;
  authMode: "guest_preferred" | "auth_required" | "unknown";
  playbookKey?: string | null;
  authBranch?: ApplyAuthBranch;
  buttonHints: ApplyButtonHints;
  fieldHints: ApplyFieldHints;
  questionHints: string[];
  successHints: string[];
  verificationHints: string[];
  errorHints: string[];
  checkpointHints?: string[];
  requiredFieldGroups?: string[];
  blockingReasonKey?: BlockingReason | null;
  resumeUploadRequired: boolean;
  networkShortcut?: {
    method: string;
    urlPattern: string;
    confidence: number;
  } | null;
}

export interface ApplyPreflightObservation {
  host: string;
  flowKey: string;
  currentUrl: string | null;
  headings: string[];
  buttonTexts: string[];
  fieldLabels: string[];
  requiredQuestions: ApplyQuestion[];
  authSignals: string[];
  successHints: string[];
  verificationHints: string[];
  errorHints: string[];
  resumeUploadDetected: boolean;
}

export interface AnswerBundle {
  profileKey: ProfileKey;
  language: ProfileKey;
  cvPath: string;
  coverLetters: Record<ProfileKey, string>;
  standardAnswers: Record<string, string>;
  storedAnswers: Record<string, string>;
  playbookKey?: string | null;
  documents?: OpsDocumentRef[];
  generatedAt: string;
}

export interface ApplyTelemetry {
  strategy: ApplyExecutionStrategy;
  contextAcquireMs: number;
  manifestLoadMs: number;
  formFillMs: number;
  submitMs: number;
  postSubmitValidationMs: number;
  totalMs: number;
}

export interface BrowserRunInput {
  platform: ApplyPlatform;
  url: string;
  profile: CandidateProfile;
  coverLetter: string;
  extraAnswers: ApplyAnswer[];
  plan?: ApplyExecutionPlan | null;
  verificationLink?: string | null;
  verificationCode?: string | null;
  screenshotPath: string;
}

export interface BrowserRunResult {
  status:
    | "submitted"
    | "needs_email_verification"
    | "needs_answers"
    | "manual_review"
    | "failed";
  message: string;
  currentUrl?: string | null;
  pageTextSnippet?: string | null;
  questions?: ApplyQuestion[];
  screenshotPath?: string | null;
  successSignal?: string | null;
  checkpoint?: RunCheckpoint | null;
  blockingReasonKey?: BlockingReason | null;
}

export interface ApplyArtifacts {
  runtimeDir: string;
  summaryFile: string;
  resultFile: string;
  stateFile: string;
  logFile: string;
  screenshotDir: string;
}

export interface ApplySummary {
  jobId: string;
  offerId: string;
  source: string;
  platform: ApplyPlatform;
  strategy: ApplyExecutionStrategy;
  language: ProfileKey;
  profileKey: ProfileKey;
  outcome: "succeeded" | "failed";
  applicationId: string | null;
  coverLetterId: string | null;
  manifestId?: string | null;
  manifestStatus?: ApplyManifestStatus | null;
  preflightJobId?: string | null;
  readiness?: ApplyReadiness | null;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  finalUrl: string | null;
  runtimePath: string;
  artifacts: ApplyArtifacts;
  telemetry: ApplyTelemetry;
  answeredQuestions: ApplyAnswer[];
  errors: string[];
  playbookKey?: string | null;
  authBranch?: ApplyAuthBranch | null;
  blockingReasonKey?: BlockingReason | null;
  checkpoint?: RunCheckpoint | null;
  documents?: OpsDocumentRef[];
}

export interface ApplyPreflightProgress {
  phase: "queued" | "opening" | "observing" | "planning" | "completed" | "failed";
  updatedAt: string;
  message?: string;
  platform?: ApplyPlatform | null;
  currentUrl?: string | null;
}

export interface ApplyPreflightSummary {
  jobId: string;
  offerId: string;
  host: string;
  platform: ApplyPlatform;
  flowKey: string;
  language: ProfileKey;
  profileKey: ProfileKey;
  manifestId: string | null;
  manifestStatus: ApplyManifestStatus;
  readiness: ApplyReadiness;
  runtimePath: string;
  observation: ApplyPreflightObservation | null;
  plan: ApplyExecutionPlan;
  answerBundlePath: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  errors: string[];
  playbookKey?: string | null;
  authBranch?: ApplyAuthBranch | null;
  blockingReasonKey?: BlockingReason | null;
  checkpoint?: RunCheckpoint | null;
  documents?: OpsDocumentRef[];
}

export interface ApplyRunHooks {
  onProgress?: (progress: ApplyProgress) => Promise<void> | void;
}
