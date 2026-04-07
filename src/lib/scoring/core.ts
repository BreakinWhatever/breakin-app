import {
  DEFAULT_FINANCE_KEYWORDS,
  containsExcludedRole,
  matchesAny,
  toSearchList,
} from "@/lib/crawler/filters";

export interface OfferLike {
  id?: string;
  title: string;
  description?: string;
  city?: string;
  country?: string;
  postedAt?: string | null;
}

export interface ScoreResult {
  score: number;
  factors: string[];
  rationale: string;
}

export interface ScoreOptions {
  keywords?: string[];
  cities?: string[];
}

export function scoreByRules(
  offer: OfferLike,
  options: ScoreOptions = {}
): ScoreResult {
  const text = `${offer.title}\n${offer.description ?? ""}`;
  const locationText = `${offer.city ?? ""} ${offer.country ?? ""}`;
  const keywords = toSearchList(options.keywords, DEFAULT_FINANCE_KEYWORDS);
  const cities = options.cities ?? [];

  const factors: string[] = [];
  let score = 0;

  if (containsExcludedRole(text)) {
    return {
      score: 0,
      factors: ["excluded-role"],
      rationale: "excluded-role",
    };
  }

  const keywordHits = keywords.filter((keyword) =>
    new RegExp(keyword, "i").test(text)
  ).length;
  if (keywordHits > 0) {
    const addition = Math.min(45, 12 + (keywordHits - 1) * 6);
    score += addition;
    factors.push(`keywords:+${addition}`);
  } else {
    factors.push("keywords:+0");
  }

  if (cities.length === 0 || matchesAny(`${text}\n${locationText}`, cities)) {
    score += 20;
    factors.push("location:+20");
  } else {
    factors.push("location:+0");
  }

  const recencyScore = scoreRecency(offer.postedAt);
  score += recencyScore;
  factors.push(`recency:+${recencyScore}`);

  const seniorityScore = scoreSeniority(offer.title);
  score += seniorityScore;
  factors.push(`seniority:+${seniorityScore}`);

  const contractScore = /\b(cdi|permanent|full[- ]time)\b/i.test(text) ? 5 : 0;
  score += contractScore;
  factors.push(`contract:+${contractScore}`);

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score: boundedScore,
    factors,
    rationale: factors.join(", "),
  };
}

function scoreRecency(postedAt: string | null | undefined) {
  if (!postedAt) return 0;
  const timestamp = Date.parse(postedAt);
  if (Number.isNaN(timestamp)) return 0;
  const days = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
  if (days <= 7) return 20;
  if (days <= 14) return 12;
  if (days <= 30) return 6;
  return 0;
}

function scoreSeniority(title: string) {
  if (/\b(analyst|associate|junior|intern(ship)?|off[- ]?cycle|graduate)\b/i.test(title)) {
    return 10;
  }
  if (/\b(vp|vice president|director|senior|manager)\b/i.test(title)) {
    return 2;
  }
  return 4;
}
