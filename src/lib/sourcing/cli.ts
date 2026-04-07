import path from "node:path";
import { DEFAULT_FINANCE_KEYWORDS, DEFAULT_TARGET_CITIES } from "@/lib/crawler/filters";
import type { SearchOffersInput, SearchSummary } from "./types";

export const SEARCH_SUMMARY_MARKER = "@@BREAKIN_SEARCH_SUMMARY@@";

const BOOLEAN_TRUE = new Set(["1", "true", "yes", "on"]);
const BOOLEAN_FALSE = new Set(["0", "false", "no", "off"]);

export function parseSearchCliArgs(
  argv: string[],
  cwd: string,
  now = new Date()
): SearchOffersInput {
  const args = new Map<string, string | boolean>();
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      args.set(rawKey, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args.set(rawKey, true);
      continue;
    }

    args.set(rawKey, next);
    index += 1;
  }

  const subcommand = positionals[0] ?? "search";
  if (subcommand !== "search") {
    throw new Error(`Unsupported subcommand '${subcommand}'. Expected 'search'.`);
  }

  const timestamp = now.toISOString().replaceAll(":", "-");
  const outputDir = resolvePath(
    cwd,
    readStringFlag(args, "output-dir") ?? path.join(".runtime", "source-offers", timestamp)
  );

  return {
    keywords: readListFlag(args, ["kw", "keywords"], DEFAULT_FINANCE_KEYWORDS),
    cities: readListFlag(args, ["cities"], DEFAULT_TARGET_CITIES),
    days: readNumberFlag(args, ["days"], 14, 1),
    max: readNumberFlag(args, ["max"], 200, 1),
    companyNames: readListFlag(args, ["company", "companies"], []),
    includeWebSearch: readBooleanFlag(args, "web-search", true),
    useBrowserFallback: readBooleanFlag(args, "browser-fallback", true),
    importToDb: !readBooleanFlag(args, "dry-run", false),
    score: !readBooleanFlag(args, "no-score", false),
    llmProvider: readLlmProvider(args),
    llmMaxOffers: readNumberFlag(args, ["llm-max"], 25, 0),
    outputDir,
    storageDir: path.join(outputDir, "crawlee"),
    source: readStringFlag(args, "source") ?? "cli",
    limitCompanies: readOptionalNumberFlag(args, ["limit-companies"]) ?? undefined,
  };
}

export function buildSearchCliArgs(request: Partial<SearchOffersInput>) {
  const args = ["tsx", "scripts/source-offers.ts", "search"];

  pushListArg(args, "kw", request.keywords);
  pushListArg(args, "cities", request.cities);
  pushStringArg(args, "days", request.days);
  pushStringArg(args, "max", request.max);
  pushListArg(args, "company", request.companyNames);
  pushBooleanArg(args, "web-search", request.includeWebSearch);
  pushBooleanArg(args, "browser-fallback", request.useBrowserFallback);
  pushBooleanArg(args, "dry-run", request.importToDb === false);
  pushBooleanArg(args, "no-score", request.score === false);
  pushStringArg(args, "llm-provider", request.llmProvider);
  pushStringArg(args, "llm-max", request.llmMaxOffers);
  pushStringArg(args, "source", request.source);
  pushStringArg(args, "output-dir", request.outputDir);
  pushStringArg(args, "limit-companies", request.limitCompanies);

  return args;
}

export function formatSearchSummaryForStdout(summary: SearchSummary) {
  return `${SEARCH_SUMMARY_MARKER}${JSON.stringify(summary)}`;
}

function readListFlag(
  args: Map<string, string | boolean>,
  names: string[],
  fallback: string[]
) {
  for (const name of names) {
    const value = args.get(name);
    if (typeof value === "string") {
      const list = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (list.length > 0) return list;
    }
  }

  return [...fallback];
}

function readStringFlag(args: Map<string, string | boolean>, name: string) {
  const value = args.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumberFlag(
  args: Map<string, string | boolean>,
  names: string[],
  fallback: number,
  min: number
) {
  const value = readOptionalNumberFlag(args, names);
  if (value === null) return fallback;
  return Math.max(min, value);
}

function readOptionalNumberFlag(
  args: Map<string, string | boolean>,
  names: string[]
) {
  for (const name of names) {
    const value = args.get(name);
    if (typeof value !== "string") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }

  return null;
}

function readBooleanFlag(
  args: Map<string, string | boolean>,
  name: string,
  fallback: boolean
) {
  const explicitNo = args.get(`no-${name}`);
  if (explicitNo === true) return false;

  const value = args.get(name);
  if (value === true) return true;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (BOOLEAN_TRUE.has(lowered)) return true;
    if (BOOLEAN_FALSE.has(lowered)) return false;
  }

  return fallback;
}

function readLlmProvider(args: Map<string, string | boolean>) {
  const value = readStringFlag(args, "llm-provider");
  if (value === "none" || value === "claude" || value === "codex" || value === "auto") {
    return value;
  }
  return "auto";
}

function resolvePath(cwd: string, target: string) {
  return path.isAbsolute(target) ? target : path.join(cwd, target);
}

function pushListArg(args: string[], key: string, values: string[] | undefined) {
  if (!values || values.length === 0) return;
  args.push(`--${key}`, values.join(","));
}

function pushStringArg(args: string[], key: string, value: unknown) {
  if (value === undefined || value === null || value === "") return;
  args.push(`--${key}`, String(value));
}

function pushBooleanArg(args: string[], key: string, enabled: boolean | undefined) {
  if (enabled === undefined) return;
  args.push(`--${key}`, enabled ? "true" : "false");
}
