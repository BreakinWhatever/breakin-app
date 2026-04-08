import { describe, expect, it } from "vitest";
import { selectApplyExecutionStrategy } from "@/lib/apply/strategy";

describe("selectApplyExecutionStrategy", () => {
  it("falls back to legacy mode when v3 is disabled", () => {
    expect(
      selectApplyExecutionStrategy({
        v3Enabled: false,
        platform: "workday",
        readiness: "ready",
        manifestStatus: "validated",
        plan: null,
      })
    ).toBe("legacy_generic");
  });

  it("prefers ATS adapters for supported ready platforms", () => {
    expect(
      selectApplyExecutionStrategy({
        v3Enabled: true,
        platform: "workday",
        readiness: "ready",
        manifestStatus: "validated",
        plan: null,
      })
    ).toBe("ats_adapter");
  });

  it("uses manifest strategy for validated custom plans", () => {
    expect(
      selectApplyExecutionStrategy({
        v3Enabled: true,
        platform: "generic",
        readiness: "ready",
        manifestStatus: "degraded",
        plan: {
          strategy: "manifest",
          platform: "generic",
          flowKey: "careers/apply",
          authMode: "unknown",
          buttonHints: {
            apply: ["Apply"],
            manual: [],
            guest: [],
            next: ["Next"],
            review: [],
            submit: ["Submit"],
            createAccount: [],
            login: [],
          },
          fieldHints: {
            firstName: ["First name"],
            lastName: ["Last name"],
            fullName: ["Full name"],
            email: ["Email"],
            phone: ["Phone"],
            city: ["City"],
            linkedinUrl: ["LinkedIn"],
            website: ["Website"],
            salary: ["Salary"],
            availability: ["Availability"],
            coverLetter: ["Cover letter"],
            password: ["Password"],
            confirmPassword: ["Confirm password"],
          },
          questionHints: [],
          successHints: ["thank"],
          verificationHints: [],
          errorHints: [],
          resumeUploadRequired: true,
          networkShortcut: null,
        },
      })
    ).toBe("manifest");
  });

  it("routes blocked or manual-only offers to manual", () => {
    expect(
      selectApplyExecutionStrategy({
        v3Enabled: true,
        platform: "generic",
        readiness: "manual_only",
        manifestStatus: "draft",
        plan: null,
      })
    ).toBe("manual");
  });
});
