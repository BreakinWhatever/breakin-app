import type {
  ApplyButtonHints,
  ApplyExecutionPlan,
  ApplyFieldHints,
  ApplyPlatform,
  CandidateFieldKey,
} from "./types";
import type { ApplyAuthBranch, ApplyPlaybook } from "@/lib/ops/types";

const DEFAULT_BUTTON_HINTS: ApplyButtonHints = {
  apply: ["apply", "postuler", "apply now", "submit application"],
  manual: ["apply manually", "manual", "manual application"],
  guest: ["apply as guest", "guest", "continue as guest", "invite"],
  next: ["continue", "next", "suivant"],
  review: ["review", "preview"],
  submit: ["submit", "send application", "envoyer", "soumettre", "apply now"],
  createAccount: ["create account", "create profile", "register", "sign up", "creer un compte"],
  login: ["login", "log in", "sign in", "connexion"],
};

const DEFAULT_FIELD_HINTS: ApplyFieldHints = {
  firstName: ["first name", "prenom", "prénom", "given name"],
  lastName: ["last name", "surname", "nom", "family name"],
  fullName: ["full name", "name"],
  email: ["email", "e-mail"],
  phone: ["phone", "telephone", "téléphone", "mobile"],
  city: ["city", "location", "where are you based", "based in"],
  linkedinUrl: ["linkedin"],
  website: ["website", "portfolio"],
  salary: ["salary", "compensation", "remuneration", "rémunération"],
  availability: ["available start", "start date", "availability", "disponibilite", "disponibilité"],
  coverLetter: ["cover letter", "motivation", "why are you interested", "pourquoi"],
  password: ["password", "mot de passe"],
  confirmPassword: ["confirm password", "confirm your password", "confirmer le mot de passe"],
};

export const ATS_ADAPTER_PLATFORMS = new Set<ApplyPlatform>([
  "workday",
  "greenhouse",
  "lever",
  "smartrecruiters",
  "taleo",
]);

export function hasApplyAdapter(platform: ApplyPlatform) {
  return ATS_ADAPTER_PLATFORMS.has(platform);
}

export function buildApplyExecutionPlan(
  platform: ApplyPlatform,
  flowKey: string
): ApplyExecutionPlan {
  const buttonHints = cloneButtonHints(DEFAULT_BUTTON_HINTS);
  const fieldHints = cloneFieldHints(DEFAULT_FIELD_HINTS);
  let authMode: ApplyExecutionPlan["authMode"] = "unknown";

  if (platform === "workday") {
    authMode = "guest_preferred";
    buttonHints.manual.unshift("use my last application");
    buttonHints.apply.unshift("easy apply");
    buttonHints.guest.unshift("continue as guest");
  } else if (platform === "greenhouse" || platform === "lever") {
    authMode = "guest_preferred";
  } else if (platform === "smartrecruiters" || platform === "taleo") {
    authMode = "guest_preferred";
    buttonHints.guest.unshift("guest");
  } else if (platform === "workable" || platform === "ashby") {
    authMode = "unknown";
  }

  return {
    strategy: hasApplyAdapter(platform) ? "ats_adapter" : "manifest",
    platform,
    flowKey,
    authMode,
    playbookKey: null,
    authBranch: "unknown",
    buttonHints,
    fieldHints,
    questionHints: [],
    successHints: [
      "thank",
      "merci",
      "submitted",
      "application received",
      "candidature a bien ete envoyee",
      "we have received",
    ],
    verificationHints: [
      "verify your email",
      "check your email",
      "confirmation email",
      "enter code",
      "verification code",
      "confirm your email",
    ],
    errorHints: [
      "captcha",
      "robot",
      "verification required",
      "invalid file",
      "try again",
    ],
    checkpointHints: [],
    requiredFieldGroups: [],
    blockingReasonKey: null,
    resumeUploadRequired: true,
    networkShortcut: null,
  };
}

export function mergePlanWithPlaybook(
  plan: ApplyExecutionPlan,
  playbook: ApplyPlaybook | null
) {
  if (!playbook) {
    return plan;
  }

  const mergedButtonHints = cloneButtonHints(plan.buttonHints);
  for (const [key, values] of Object.entries(playbook.buttonHints ?? {})) {
    if (!(key in mergedButtonHints)) continue;
    const targetKey = key as keyof ApplyButtonHints;
    mergedButtonHints[targetKey].unshift(...values);
  }

  const mergedFieldHints = cloneFieldHints(plan.fieldHints);
  for (const [key, values] of Object.entries(playbook.fieldHints ?? {})) {
    if (!(key in mergedFieldHints)) continue;
    const targetKey = key as keyof ApplyFieldHints;
    mergedFieldHints[targetKey].unshift(...values);
  }

  return {
    ...plan,
    authMode: playbook.authMode ?? plan.authMode,
    playbookKey: playbook.key,
    authBranch: playbook.defaultAuthBranch ?? plan.authBranch ?? "unknown",
    buttonHints: dedupeButtonHints(mergedButtonHints),
    fieldHints: dedupeFieldHints(mergedFieldHints),
    successHints: dedupeStrings([
      ...(playbook.successHints ?? []),
      ...plan.successHints,
    ]),
    verificationHints: dedupeStrings([
      ...(playbook.verificationHints ?? []),
      ...plan.verificationHints,
    ]),
    errorHints: dedupeStrings([
      ...(playbook.errorHints ?? []),
      ...plan.errorHints,
    ]),
    checkpointHints: dedupeStrings([
      ...(playbook.checkpointHints ?? []),
      ...(plan.checkpointHints ?? []),
    ]),
    requiredFieldGroups: dedupeStrings([
      ...(playbook.requiredFieldGroups ?? []),
      ...(plan.requiredFieldGroups ?? []),
    ]),
  };
}

export function mergePlanWithObservation(
  plan: ApplyExecutionPlan,
  input: {
    buttonTexts?: string[];
    fieldLabels?: string[];
    successHints?: string[];
    verificationHints?: string[];
    errorHints?: string[];
    resumeUploadDetected?: boolean;
  }
) {
  const mergedButtonHints = cloneButtonHints(plan.buttonHints);
  for (const label of input.buttonTexts ?? []) {
    const normalized = label.trim();
    if (!normalized) continue;
    if (/apply|postuler/i.test(normalized)) mergedButtonHints.apply.unshift(normalized);
    if (/guest|invite/i.test(normalized)) mergedButtonHints.guest.unshift(normalized);
    if (/continue|next|suivant/i.test(normalized)) mergedButtonHints.next.unshift(normalized);
    if (/review|preview/i.test(normalized)) mergedButtonHints.review.unshift(normalized);
    if (/submit|send|envoyer|soumettre/i.test(normalized)) mergedButtonHints.submit.unshift(normalized);
    if (/create account|register|sign up|compte/i.test(normalized)) {
      mergedButtonHints.createAccount.unshift(normalized);
    }
    if (/login|log in|sign in|connexion/i.test(normalized)) {
      mergedButtonHints.login.unshift(normalized);
    }
  }

  const mergedFieldHints = cloneFieldHints(plan.fieldHints);
  for (const label of input.fieldLabels ?? []) {
    const target = findFieldKey(label);
    if (!target) continue;
    mergedFieldHints[target].unshift(label.trim());
  }

  return {
    ...plan,
    buttonHints: dedupeButtonHints(mergedButtonHints),
    fieldHints: dedupeFieldHints(mergedFieldHints),
    successHints: dedupeStrings([...plan.successHints, ...(input.successHints ?? [])]),
    verificationHints: dedupeStrings([
      ...plan.verificationHints,
      ...(input.verificationHints ?? []),
    ]),
    errorHints: dedupeStrings([...plan.errorHints, ...(input.errorHints ?? [])]),
    resumeUploadRequired: input.resumeUploadDetected ?? plan.resumeUploadRequired,
  };
}

export function inferAuthBranchFromObservation(
  plan: ApplyExecutionPlan,
  playbook: ApplyPlaybook | null,
  input: {
    buttonTexts?: string[];
    fieldLabels?: string[];
    authSignals?: string[];
  }
): ApplyAuthBranch {
  const buttonTexts = (input.buttonTexts ?? []).map((value) => value.toLowerCase());
  const fieldLabels = (input.fieldLabels ?? []).map((value) => value.toLowerCase());
  const authSignals = (input.authSignals ?? []).map((value) => value.toLowerCase());

  if (
    buttonTexts.some((value) => /guest|invite/.test(value))
    && plan.authMode === "guest_preferred"
  ) {
    return "guest";
  }

  const rules = [...(playbook?.authBranchRules ?? [])]
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));
  for (const rule of rules) {
    const buttonMatch = !rule.whenAnyButtonTextMatches
      || rule.whenAnyButtonTextMatches.some((candidate) =>
          buttonTexts.some((value) => value.includes(candidate.toLowerCase()))
        );
    const fieldMatch = !rule.whenAnyFieldLabelMatches
      || rule.whenAnyFieldLabelMatches.some((candidate) =>
          fieldLabels.some((value) => value.includes(candidate.toLowerCase()))
        );
    const signalMatch = !rule.whenAnyAuthSignalMatches
      || rule.whenAnyAuthSignalMatches.some((candidate) =>
          authSignals.some((value) => value.includes(candidate.toLowerCase()))
        );
    if (buttonMatch && fieldMatch && signalMatch) {
      return rule.branch;
    }
  }

  const visiblePasswordFields = fieldLabels.filter((value) => /password/.test(value)).length;
  if (buttonTexts.some((value) => /sign in|log in|connexion/.test(value))) {
    return "existing_account_sign_in";
  }
  if (
    buttonTexts.some((value) => /create account|register|sign up|create profile/.test(value))
    || visiblePasswordFields >= 2
  ) {
    return "create_account";
  }

  return plan.authBranch ?? "unknown";
}

function findFieldKey(label: string): CandidateFieldKey | null {
  const normalized = label.toLowerCase();
  for (const [key, hints] of Object.entries(DEFAULT_FIELD_HINTS) as Array<[CandidateFieldKey, string[]]>) {
    if (hints.some((hint) => normalized.includes(hint.toLowerCase()))) {
      return key;
    }
  }
  return null;
}

function cloneButtonHints(input: ApplyButtonHints): ApplyButtonHints {
  return {
    apply: [...input.apply],
    manual: [...input.manual],
    guest: [...input.guest],
    next: [...input.next],
    review: [...input.review],
    submit: [...input.submit],
    createAccount: [...input.createAccount],
    login: [...input.login],
  };
}

function cloneFieldHints(input: ApplyFieldHints): ApplyFieldHints {
  return {
    firstName: [...input.firstName],
    lastName: [...input.lastName],
    fullName: [...input.fullName],
    email: [...input.email],
    phone: [...input.phone],
    city: [...input.city],
    linkedinUrl: [...input.linkedinUrl],
    website: [...input.website],
    salary: [...input.salary],
    availability: [...input.availability],
    coverLetter: [...input.coverLetter],
    password: [...input.password],
    confirmPassword: [...input.confirmPassword],
  };
}

function dedupeButtonHints(input: ApplyButtonHints): ApplyButtonHints {
  return {
    apply: dedupeStrings(input.apply),
    manual: dedupeStrings(input.manual),
    guest: dedupeStrings(input.guest),
    next: dedupeStrings(input.next),
    review: dedupeStrings(input.review),
    submit: dedupeStrings(input.submit),
    createAccount: dedupeStrings(input.createAccount),
    login: dedupeStrings(input.login),
  };
}

function dedupeFieldHints(input: ApplyFieldHints): ApplyFieldHints {
  return {
    firstName: dedupeStrings(input.firstName),
    lastName: dedupeStrings(input.lastName),
    fullName: dedupeStrings(input.fullName),
    email: dedupeStrings(input.email),
    phone: dedupeStrings(input.phone),
    city: dedupeStrings(input.city),
    linkedinUrl: dedupeStrings(input.linkedinUrl),
    website: dedupeStrings(input.website),
    salary: dedupeStrings(input.salary),
    availability: dedupeStrings(input.availability),
    coverLetter: dedupeStrings(input.coverLetter),
    password: dedupeStrings(input.password),
    confirmPassword: dedupeStrings(input.confirmPassword),
  };
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(value.trim());
  }
  return result;
}
