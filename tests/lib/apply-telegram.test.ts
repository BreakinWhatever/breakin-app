import { describe, expect, it } from "vitest";
import {
  formatApplyJobAcknowledgement,
  formatApplyJobListForTelegram,
  formatApplyJobStatusForTelegram,
  formatApplySummaryForTelegram,
  parseApplySummaryOutput,
  parseTelegramApplyIntent,
  parseTelegramApplyJobIntent,
} from "@/lib/apply/telegram";
import { formatApplySummaryForStdout } from "@/lib/apply/cli";

describe("apply telegram helpers", () => {
  it("parses strict apply commands", () => {
    expect(parseTelegramApplyIntent("/apply_offer cm123456789012345678901")).toEqual({
      offerIdOrUrl: "cm123456789012345678901",
    });
  });

  it("parses natural language apply messages with URLs", () => {
    expect(
      parseTelegramApplyIntent("postule a cette offre https://example.com/jobs/123")
    ).toEqual({
      offerIdOrUrl: "https://example.com/jobs/123",
    });
  });

  it("parses apply job status commands", () => {
    expect(parseTelegramApplyJobIntent("/apply_jobs")).toEqual({ mode: "list" });
    expect(parseTelegramApplyJobIntent("/apply_status cmabc123def456ghi789000")).toEqual({
      mode: "status",
      jobId: "cmabc123def456ghi789000",
    });
  });

  it("formats apply telegram messages", () => {
    expect(formatApplyJobAcknowledgement("cmjob123")).toContain("cmjob123");
    expect(
      formatApplyJobListForTelegram([
        { id: "cm1", status: "running", updatedAt: "2026-04-07T12:00:00.000Z" },
      ])
    ).toContain("cm1");
    expect(
      formatApplyJobStatusForTelegram({
        id: "cm1",
        status: "running",
        platform: "workday",
        lastMessage: "Tentative 1 en cours",
        error: null,
        runtimePath: "/tmp/job",
      })
    ).toContain("workday");
  });

  it("parses marked apply summary output", () => {
    const summary = {
      jobId: "cm1",
      offerId: "offer1",
      source: "cli",
      platform: "workday",
      language: "en",
      profileKey: "en",
      outcome: "succeeded",
      applicationId: "app1",
      coverLetterId: "cl1",
      startedAt: "2026-04-07T12:00:00.000Z",
      endedAt: "2026-04-07T12:02:00.000Z",
      durationSeconds: 120,
      finalUrl: "https://example.com/thank-you",
      runtimePath: "/tmp/apply/cm1",
      artifacts: {
        runtimeDir: "/tmp/apply/cm1",
        summaryFile: "/tmp/apply/cm1/summary.json",
        resultFile: "/tmp/apply/cm1/result.json",
        stateFile: "/tmp/apply/cm1/state.json",
        logFile: "/tmp/apply/cm1/worker.log",
        screenshotDir: "/tmp/apply/cm1/screenshots",
      },
      answeredQuestions: [],
      errors: [],
    } as const;

    const parsed = parseApplySummaryOutput(
      `noise\n${formatApplySummaryForStdout(summary)}\n`
    );

    expect(parsed?.jobId).toBe("cm1");
    expect(formatApplySummaryForTelegram(summary)).toContain("workday");
  });
});
