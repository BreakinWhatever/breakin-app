import { describe, expect, it } from "vitest";
import {
  formatSearchSummaryForTelegram,
  parseSearchSummaryOutput,
  parseTelegramSearchIntent,
} from "@/lib/sourcing/telegram";
import { formatSearchSummaryForStdout } from "@/lib/sourcing/cli";

describe("sourcing telegram helpers", () => {
  it("parses strict /search_offers commands", () => {
    const parsed = parseTelegramSearchIntent(
      '/search_offers kw:"private credit,levfin" cities:"Paris,London" days:7 max:50'
    );

    expect(parsed?.mode).toBe("strict");
    expect(parsed?.request.keywords).toEqual(["private credit", "levfin"]);
    expect(parsed?.request.cities).toEqual(["Paris", "London"]);
    expect(parsed?.request.days).toBe(7);
    expect(parsed?.request.max).toBe(50);
  });

  it("parses natural language sourcing requests", () => {
    const parsed = parseTelegramSearchIntent(
      "scrape les offres private credit a Paris sur 10 jours max 30"
    );

    expect(parsed?.mode).toBe("natural");
    expect(parsed?.request.days).toBe(10);
    expect(parsed?.request.max).toBe(30);
    expect(parsed?.request.cities).toContain("Paris");
  });

  it("formats a compact telegram summary", () => {
    const summary = {
      source: "telegram",
      scrapeRunId: "run_123",
      request: {
        keywords: ["Private Credit"],
        cities: ["Paris"],
        days: 14,
        max: 200,
        includeWebSearch: true,
        useBrowserFallback: true,
      },
      companiesConsidered: 10,
      companiesScraped: 8,
      pagesVisited: 12,
      pagesWithErrors: 1,
      offersFound: 20,
      offersImported: 12,
      offersUpdated: 3,
      offersSkipped: 5,
      offersScored: 20,
      llmAssistedOffers: 4,
      startedAt: "2026-04-07T12:00:00.000Z",
      endedAt: "2026-04-07T12:05:00.000Z",
      topOffers: [
        {
          title: "Analyst",
          company: "Ardian",
          city: "Paris",
          country: "France",
          url: "https://example.com",
          matchScore: 91,
        },
      ],
      errors: ["test error"],
      artifacts: {
        outputDir: "/tmp/search",
        storageDir: "/tmp/search/crawlee",
        summaryFile: "/tmp/search/summary.json",
        offersFile: "/tmp/search/offers.json",
        csvFile: "/tmp/search/offers.csv",
      },
    };
    const message = formatSearchSummaryForTelegram(summary);

    expect(message).toContain("Recherche d'offres terminee.");
    expect(message).toContain("Ardian");
    expect(message).toContain("/tmp/search");
  });

  it("parses the marked CLI summary output", () => {
    const summary = {
      source: "cli",
      scrapeRunId: null,
      request: {
        keywords: ["Private Credit"],
        cities: ["Paris"],
        days: 14,
        max: 10,
        includeWebSearch: true,
        useBrowserFallback: true,
      },
      companiesConsidered: 1,
      companiesScraped: 1,
      pagesVisited: 1,
      pagesWithErrors: 0,
      offersFound: 1,
      offersImported: 1,
      offersUpdated: 0,
      offersSkipped: 0,
      offersScored: 1,
      llmAssistedOffers: 0,
      startedAt: "2026-04-07T12:00:00.000Z",
      endedAt: "2026-04-07T12:01:00.000Z",
      topOffers: [],
      errors: [],
      artifacts: {
        outputDir: "/tmp/search",
        storageDir: "/tmp/search/crawlee",
        summaryFile: "/tmp/search/summary.json",
        offersFile: "/tmp/search/offers.json",
        csvFile: "/tmp/search/offers.csv",
      },
    };

    const parsed = parseSearchSummaryOutput(
      `noise before\n${formatSearchSummaryForStdout(summary)}\n`
    );

    expect(parsed?.offersImported).toBe(1);
    expect(parsed?.artifacts.outputDir).toBe("/tmp/search");
  });
});
