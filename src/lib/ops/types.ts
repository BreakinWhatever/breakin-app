export type OpsDomain = "apply" | "preflight" | "search" | "telegram";

export type OpsDocumentKind =
  | "progress"
  | "system_map"
  | "playbook"
  | "runbook"
  | "data";

export interface OpsDocumentRef {
  key: string;
  title: string;
  kind: OpsDocumentKind;
  path: string;
  domains: OpsDomain[];
  tags: string[];
  summary?: string;
}

export type ApplyAuthBranch =
  | "unknown"
  | "guest"
  | "create_account"
  | "existing_account_sign_in";

export type BlockingReason =
  | "unknown"
  | "auth_required"
  | "additional_required_answers"
  | "email_verification_required"
  | "manual_only_captcha"
  | "manual_only_mfa"
  | "manual_review_required"
  | "worker_failed";

export interface RunCheckpoint {
  domain: OpsDomain;
  phase: string;
  updatedAt: string;
  status?: string;
  message?: string;
  currentUrl?: string | null;
  currentStep?: string | null;
  playbookKey?: string | null;
  authBranch?: ApplyAuthBranch | null;
  blockingReasonKey?: BlockingReason | null;
  nextAction?: string | null;
  requiredFieldGroups?: string[];
  documents?: OpsDocumentRef[];
  metrics?: Record<string, string | number | boolean | null>;
}

export interface ApplyPlaybookRule {
  branch: ApplyAuthBranch;
  priority?: number;
  whenAnyButtonTextMatches?: string[];
  whenAnyFieldLabelMatches?: string[];
  whenAnyAuthSignalMatches?: string[];
}

export interface ApplyPlaybook {
  key: string;
  title: string;
  platforms: string[];
  hosts?: string[];
  flowKeys?: string[];
  authMode?: "guest_preferred" | "auth_required" | "unknown";
  defaultAuthBranch?: ApplyAuthBranch;
  checkpointHints?: string[];
  requiredFieldGroups?: string[];
  buttonHints?: Record<string, string[]>;
  fieldHints?: Record<string, string[]>;
  successHints?: string[];
  verificationHints?: string[];
  errorHints?: string[];
  authBranchRules?: ApplyPlaybookRule[];
  nextActions?: Partial<Record<ApplyAuthBranch, string>>;
}

export interface OpsRetrievalIndex {
  version: number;
  documents: OpsDocumentRef[];
}

export interface StandardAnswerStore {
  version: number;
  defaults: Record<string, string>;
  questions: Record<string, string>;
}

export interface ApplyPlaybookStore {
  version: number;
  playbooks: ApplyPlaybook[];
}
