import { DEFAULT_FINANCE_KEYWORDS, DEFAULT_TARGET_CITIES } from "@/lib/crawler/filters";
import { SEARCH_SUMMARY_MARKER } from "./cli";
import type { SearchOffersInput, SearchSummary } from "./types";

export interface TelegramSearchIntent {
  mode: "strict" | "natural";
  request: Partial<SearchOffersInput>;
}

const SEARCH_PREFIX_PATTERN =
  /^(\/search_offers\b|search_offers\b|search offers\b|scrape les offres\b|cherche des offres\b|source les offres\b)/i;

const CITY_CANDIDATES = Array.from(
  new Set(
    DEFAULT_TARGET_CITIES.filter((value) => !/france|uk|united kingdom|switzerland|uae/i.test(value))
  )
);

export function parseTelegramSearchIntent(text: string): TelegramSearchIntent | null {
  const trimmed = text.trim();
  if (!trimmed || !SEARCH_PREFIX_PATTERN.test(trimmed)) {
    return null;
  }

  if (/^\/?search_offers\b/i.test(trimmed)) {
    return {
      mode: "strict",
      request: parseKeyValueSearchMessage(trimmed),
    };
  }

  return {
    mode: "natural",
    request: parseNaturalLanguageSearchMessage(trimmed),
  };
}

export function formatSearchSummaryForTelegram(summary: SearchSummary) {
  const lines = [
    "Recherche d'offres terminee.",
    `Run: ${summary.scrapeRunId ?? "n/a"}`,
    `Compagnies: ${summary.companiesScraped}/${summary.companiesConsidered}`,
    `Pages: ${summary.pagesVisited} (${summary.pagesWithErrors} erreurs)`,
    `Offres: ${summary.offersFound} trouvees, ${summary.offersImported} creees, ${summary.offersUpdated} maj`,
    `Scoring: ${summary.offersScored} offres, ${summary.llmAssistedOffers} avec LLM`,
    `Artefacts: ${summary.artifacts.outputDir}`,
  ];

  if (summary.topOffers.length > 0) {
    lines.push("");
    lines.push("Top offres:");
    for (const offer of summary.topOffers.slice(0, 5)) {
      lines.push(
        `- ${offer.matchScore ?? 0}/100 ${offer.title} @ ${offer.company} (${offer.city || offer.country})`
      );
    }
  }

  if (summary.errors.length > 0) {
    lines.push("");
    lines.push(`Erreurs: ${summary.errors.slice(0, 2).join(" | ")}`);
  }

  return lines.join("\n");
}

export function parseSearchSummaryOutput(stdout: string): SearchSummary | null {
  const markerIndex = stdout.lastIndexOf(SEARCH_SUMMARY_MARKER);
  if (markerIndex === -1) return null;

  try {
    const json = stdout
      .slice(markerIndex + SEARCH_SUMMARY_MARKER.length)
      .trim();
    return JSON.parse(json) as SearchSummary;
  } catch {
    return null;
  }
}

function parseKeyValueSearchMessage(text: string): Partial<SearchOffersInput> {
  const params = new Map<string, string>();
  const matches = text.matchAll(/([a-z_]+):(?:"([^"]*)"|'([^']*)'|(\S+))/gi);
  for (const match of matches) {
    const key = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    params.set(key, value.trim());
  }

  return {
    keywords: readList(params, ["kw", "keywords"], DEFAULT_FINANCE_KEYWORDS),
    cities: readList(params, ["cities", "city"], DEFAULT_TARGET_CITIES),
    days: readNumber(params, ["days"], 14),
    max: readNumber(params, ["max"], 200),
    companyNames: readList(params, ["company", "companies"], []),
    includeWebSearch: readBoolean(params, ["web", "web_search"], true),
    useBrowserFallback: readBoolean(params, ["browser", "browser_fallback"], true),
    score: readBoolean(params, ["score"], true),
    importToDb: readBoolean(params, ["import"], true),
    llmProvider: readProvider(params.get("llm")),
  };
}

function parseNaturalLanguageSearchMessage(text: string): Partial<SearchOffersInput> {
  const lowered = text.toLowerCase();
  const keywords = DEFAULT_FINANCE_KEYWORDS.filter((keyword) =>
    lowered.includes(keyword.toLowerCase())
  );
  const cities = CITY_CANDIDATES.filter((city) =>
    lowered.includes(city.toLowerCase())
  );

  return {
    keywords: keywords.length > 0 ? keywords : DEFAULT_FINANCE_KEYWORDS,
    cities: cities.length > 0 ? cities : DEFAULT_TARGET_CITIES,
    days: extractDays(text) ?? 14,
    max: extractMax(text) ?? 200,
    includeWebSearch: true,
    useBrowserFallback: true,
    score: true,
    importToDb: true,
    llmProvider: "auto",
  };
}

function readList(
  params: Map<string, string>,
  names: string[],
  fallback: string[]
) {
  for (const name of names) {
    const value = params.get(name);
    if (!value) continue;
    const list = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }

  return [...fallback];
}

function readNumber(params: Map<string, string>, names: string[], fallback: number) {
  for (const name of names) {
    const value = params.get(name);
    if (!value) continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
  }

  return fallback;
}

function readBoolean(params: Map<string, string>, names: string[], fallback: boolean) {
  for (const name of names) {
    const value = params.get(name);
    if (!value) continue;
    if (/^(1|true|yes|on)$/i.test(value)) return true;
    if (/^(0|false|no|off)$/i.test(value)) return false;
  }

  return fallback;
}

function readProvider(value: string | undefined) {
  if (value === "none" || value === "claude" || value === "codex" || value === "auto") {
    return value;
  }
  return "auto";
}

function extractDays(text: string) {
  const match =
    text.match(/(\d{1,3})\s*jours?/i) ??
    text.match(/(\d{1,3})\s*days?/i);
  return match ? Math.max(1, Number(match[1])) : null;
}

function extractMax(text: string) {
  const match =
    text.match(/\bmax[: ]?(\d{1,4})\b/i) ??
    text.match(/(\d{1,4})\s*offres?/i) ??
    text.match(/(\d{1,4})\s*offers?/i);
  return match ? Math.max(1, Number(match[1])) : null;
}
