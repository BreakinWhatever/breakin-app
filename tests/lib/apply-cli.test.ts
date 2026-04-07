import { describe, expect, it } from "vitest";
import { parseApplyCliArgs } from "@/lib/apply/cli";
import { detectOfferLanguage } from "@/lib/apply/profiles";

describe("apply cli helpers", () => {
  it("parses run commands", () => {
    const parsed = parseApplyCliArgs([
      "run",
      "--offer-id",
      "cm123456789012345678901",
      "--source",
      "telegram",
      "--chat-id",
      "42",
    ]);

    expect(parsed).toEqual({
      type: "run",
      request: {
        offerId: "cm123456789012345678901",
        source: "telegram",
        force: false,
        chatId: "42",
        replyToMessageId: undefined,
        llmProvider: undefined,
      },
    });
  });

  it("parses jobs commands", () => {
    expect(parseApplyCliArgs(["jobs", "--status", "running"])).toEqual({
      type: "jobs",
      status: "running",
    });
  });

  it("detects english and french offers", () => {
    expect(
      detectOfferLanguage(
        "Analyst Private Credit",
        "You will support the team on underwriting and portfolio monitoring.",
        "United Kingdom"
      )
    ).toBe("en");

    expect(
      detectOfferLanguage(
        "Analyste Private Credit",
        "Vous accompagnerez l'equipe sur l'analyse et le suivi de portefeuille.",
        "France"
      )
    ).toBe("fr");
  });
});
