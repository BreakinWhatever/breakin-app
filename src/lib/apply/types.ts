import type { LlmProvider } from "@/lib/scoring/llm";

export type ApplyJobStatus =
  | "queued"
  | "running"
  | "waiting_email"
  | "succeeded"
  | "failed"
  | "cancelled";

export type ApplyPhase =
  | "queued"
  | "preparing"
  | "opening"
  | "auth"
  | "email_verification"
  | "answering"
  | "submitting"
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
  attempts: number;
  questionsPending: number;
  emailChecks: number;
}

export interface BrowserRunInput {
  platform: ApplyPlatform;
  url: string;
  profile: CandidateProfile;
  coverLetter: string;
  extraAnswers: ApplyAnswer[];
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
  language: ProfileKey;
  profileKey: ProfileKey;
  outcome: "succeeded" | "failed";
  applicationId: string | null;
  coverLetterId: string | null;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  finalUrl: string | null;
  runtimePath: string;
  artifacts: ApplyArtifacts;
  answeredQuestions: ApplyAnswer[];
  errors: string[];
}

export interface ApplyRunHooks {
  onProgress?: (progress: ApplyProgress) => Promise<void> | void;
}
