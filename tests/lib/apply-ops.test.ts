import { describe, expect, it } from "vitest";
import { buildApplyExecutionPlan } from "@/lib/apply/adapters";
import {
  buildAnswerLookupMaps,
  findOpsAnswer,
  resolveApplyOpsPlan,
} from "@/lib/apply/ops";

describe("apply ops integration", () => {
  it("loads the Workday auth playbook and prefers existing-account sign in when visible", async () => {
    const plan = buildApplyExecutionPlan("workday", "job/apply");
    const resolved = await resolveApplyOpsPlan({
      workspaceDir: process.cwd(),
      host: "tenant.myworkdayjobs.com",
      flowKey: "job/apply",
      platform: "workday",
      plan,
      observation: {
        host: "tenant.myworkdayjobs.com",
        flowKey: "job/apply",
        currentUrl: "https://tenant.myworkdayjobs.com/job/apply",
        headings: ["Create Account"],
        buttonTexts: ["Create Account", "Sign In"],
        fieldLabels: ["Email Address", "Password", "Verify New Password"],
        requiredQuestions: [],
        authSignals: ["sign in", "password"],
        successHints: [],
        verificationHints: [],
        errorHints: [],
        resumeUploadDetected: true,
      },
    });

    expect(resolved.playbook?.key).toBe("apply/workday-auth");
    expect(resolved.plan.playbookKey).toBe("apply/workday-auth");
    expect(resolved.plan.authBranch).toBe("existing_account_sign_in");
    expect(resolved.plan.requiredFieldGroups).toContain("auth");
    expect(resolved.documents.map((document) => document.key)).toContain("ops/progress");
  });

  it("reads standard answers from ops data", async () => {
    const lookups = await buildAnswerLookupMaps(process.cwd());
    const answer = findOpsAnswer(
      {
        label: "How did you hear about us?",
      },
      lookups
    );

    expect(answer).toBe("LinkedIn");
  });

  it("uses the Ares host override to prefer sign in without observation", async () => {
    const plan = buildApplyExecutionPlan("workday", "en-us/external/job/analyst--direct-lending-r:id-1");
    const resolved = await resolveApplyOpsPlan({
      workspaceDir: process.cwd(),
      host: "aresmgmt.wd1.myworkdayjobs.com",
      flowKey: "en-us/external/job/analyst--direct-lending-r:id-1",
      platform: "workday",
      plan,
    });

    expect(resolved.plan.authMode).toBe("auth_required");
    expect(resolved.plan.authBranch).toBe("existing_account_sign_in");
    expect(resolved.authBranch).toBe("existing_account_sign_in");
    expect(resolved.plan.playbookKey).toBe("apply/workday-auth");
  });
});
