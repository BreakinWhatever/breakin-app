import type { SourceCompany } from "./types";

export const DEFAULT_FINANCE_KEYWORDS = [
  "Private Credit",
  "Private Debt",
  "Direct Lending",
  "Leveraged Finance",
  "LevFin",
  "M&A",
  "Mergers and Acquisitions",
  "Debt Advisory",
  "Transaction Services",
  "Deal Advisory",
  "Corporate Finance",
  "Investment Banking",
  "Structured Finance",
  "Restructuring",
  "Private Equity",
];

export const DEFAULT_TARGET_CITIES = [
  "Paris",
  "Ile-de-France",
  "Île-de-France",
  "London",
  "Dubai",
  "Abu Dhabi",
  "Geneva",
  "Zurich",
  "United Kingdom",
  "France",
  "Switzerland",
  "UAE",
  "United Arab Emirates",
];

const ROLE_EXCLUSION_PATTERNS = [
  /\bit\b/i,
  /\bdeveloper\b/i,
  /\bsoftware\b/i,
  /\bengineer\b/i,
  /\btechnology\b/i,
  /\bsecurity\b/i,
  /\bcyber\b/i,
  /\bdata scientist\b/i,
  /\bdevops\b/i,
  /\binfrastructure\b/i,
  /\bcybersecurity\b/i,
  /\blawyer\b/i,
  /\bcounsel\b/i,
  /\bcompliance\b/i,
  /\bparalegal\b/i,
  /\bnotaire\b/i,
  /\bhuman resources\b/i,
  /\btalent acquisition\b/i,
  /\brecruiter\b/i,
  /\baccountant\b/i,
  /\bcomptable\b/i,
  /\baudit\b/i,
  /\bmarketing\b/i,
  /\bcommunication\b/i,
  /\bbrand\b/i,
];

const LOCATION_PATTERNS: Array<{
  pattern: RegExp;
  city: string;
  country: string;
}> = [
  {
    pattern: /paris|ile[- ]de[- ]france|île[- ]de[- ]france/i,
    city: "Paris",
    country: "France",
  },
  {
    pattern: /london|united kingdom|\buk\b/i,
    city: "London",
    country: "United Kingdom",
  },
  {
    pattern: /dubai|uae|united arab emirates/i,
    city: "Dubai",
    country: "UAE",
  },
  {
    pattern: /abu dhabi/i,
    city: "Abu Dhabi",
    country: "UAE",
  },
  {
    pattern: /geneva/i,
    city: "Geneva",
    country: "Switzerland",
  },
  {
    pattern: /zurich/i,
    city: "Zurich",
    country: "Switzerland",
  },
];

export function toSearchList(values: string[] | undefined, fallback: string[]) {
  const list = (values ?? []).map((value) => value.trim()).filter(Boolean);
  return list.length > 0 ? list : [...fallback];
}

export function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^utm_/i.test(key) || key === "source") {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

export function matchesAny(text: string, patterns: string[]) {
  if (patterns.length === 0) return true;
  return patterns.some((pattern) => new RegExp(escapeRegExp(pattern), "i").test(text));
}

export function containsExcludedRole(text: string) {
  return ROLE_EXCLUSION_PATTERNS.some((pattern) => pattern.test(text));
}

export function extractCityCountry(
  text: string,
  fallback?: Pick<SourceCompany, "city" | "country">
) {
  for (const location of LOCATION_PATTERNS) {
    if (location.pattern.test(text)) {
      return { city: location.city, country: location.country };
    }
  }

  return {
    city: fallback?.city ?? "",
    country: fallback?.country ?? "",
  };
}

export function parseDateLike(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = value.trim();
  const timestamp = Date.parse(trimmed);
  if (!Number.isNaN(timestamp)) {
    return new Date(timestamp).toISOString();
  }

  const daysAgoMatch = trimmed.match(/(\d{1,2})\s+days?\s+ago/i);
  if (daysAgoMatch) {
    const date = new Date();
    date.setDate(date.getDate() - Number(daysAgoMatch[1]));
    return date.toISOString();
  }

  const frenchDaysAgoMatch = trimmed.match(/il\s+y\s+a\s+(\d{1,2})\s+jours/i);
  if (frenchDaysAgoMatch) {
    const date = new Date();
    date.setDate(date.getDate() - Number(frenchDaysAgoMatch[1]));
    return date.toISOString();
  }

  if (/posted today|aujourd'hui/i.test(trimmed)) {
    return new Date().toISOString();
  }

  return null;
}

export function withinDays(dateStr: string | null | undefined, days: number) {
  if (!dateStr) return true;
  const parsed = parseDateLike(dateStr);
  if (!parsed) return true;
  const timestamp = Date.parse(parsed);
  if (Number.isNaN(timestamp)) return true;
  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
}

export function isLikelyCareerUrl(url: string) {
  return /career|careers|jobs|job|vacan|position|recrut|opportun/i.test(url);
}

export function looksLikeFinanceRole(text: string) {
  return /\b(analyst|associate|intern(ship)?|off[- ]?cycle|investment|finance|debt|credit|m&a|acquisition|advisory|transaction|restructuring|private equity|capital markets|fund finance)\b/i.test(text);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
