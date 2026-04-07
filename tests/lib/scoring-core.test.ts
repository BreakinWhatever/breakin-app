import { describe, expect, it } from "vitest";
import { scoreByRules } from "@/lib/scoring/core";

describe("scoreByRules", () => {
  it("keeps a strong score for target private financing roles", () => {
    const result = scoreByRules(
      {
        title:
          "Analyst, Capital Deployment & Liquidity Management – Private Financing Solutions",
        description:
          "Private Financing Solutions platform across private credit products and investment decisions.",
        city: "London",
        country: "United Kingdom",
        postedAt: new Date().toISOString(),
      },
      {
        keywords: ["private credit", "levfin"],
        cities: ["Paris", "London"],
      }
    );

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.factors).toContain("location:+20");
  });

  it("zeros out non-target governance and operations titles", () => {
    const result = scoreByRules(
      {
        title: "Valuations Governance - Associate",
        description:
          "Role supporting a private financing platform with governance and oversight responsibilities.",
        city: "London",
        country: "United Kingdom",
        postedAt: new Date().toISOString(),
      },
      {
        keywords: ["private credit", "levfin"],
        cities: ["Paris", "London"],
      }
    );

    expect(result.score).toBe(0);
    expect(result.rationale).toBe("non-target-title");
  });
});
