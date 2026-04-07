import { isLikelyCareerUrl, normalizeUrl } from "@/lib/crawler/filters";
import type { CandidatePage, CrawlRequest, SourceCompany } from "@/lib/crawler/types";

const SEARCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
};

export async function searchCareerPagesForCompany(
  company: SourceCompany,
  request: CrawlRequest,
  maxResults = 3
): Promise<CandidatePage[]> {
  const query = buildCompanySearchQuery(company, request);
  if (!query) return [];

  const html = await fetchDuckDuckGoHtml(query);
  if (!html) return [];

  const urls = extractResultUrls(html)
    .filter((url) => shouldKeepSearchResult(url, company))
    .slice(0, maxResults);

  return urls.map((url) => ({
    url,
    discoverySource: "web" as const,
    query,
  }));
}

function buildCompanySearchQuery(company: SourceCompany, request: CrawlRequest) {
  const customQuery = readQueryFromConfig(company.atsConfig);
  if (customQuery) return customQuery;

  const fragments = [
    JSON.stringify(company.name),
    "careers jobs",
    company.sector,
    request.keywords.slice(0, 3).join(" OR "),
    request.cities.slice(0, 2).join(" OR "),
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  if (company.careerUrl) {
    try {
      const hostname = new URL(company.careerUrl).hostname.replace(/^www\./, "");
      fragments.unshift(`site:${hostname}`);
    } catch {
      // ignore bad URLs and keep the generic query
    }
  }

  return fragments.join(" ");
}

async function fetchDuckDuckGoHtml(query: string) {
  try {
    const response = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      headers: {
        ...SEARCH_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `q=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function extractResultUrls(html: string) {
  const urls: string[] = [];
  const seen = new Set<string>();
  const matches = html.matchAll(/href="([^"]+)"/gi);

  for (const match of matches) {
    const candidate = decodeDuckDuckGoHref(match[1]);
    if (!candidate) continue;
    const normalized = normalizeUrl(candidate);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    urls.push(normalized);
  }

  return urls;
}

function decodeDuckDuckGoHref(href: string) {
  if (!href) return null;
  if (href.startsWith("//duckduckgo.com/l/?")) {
    href = `https:${href}`;
  }

  try {
    const url = new URL(href);
    if (url.hostname.includes("duckduckgo.com")) {
      const uddg = url.searchParams.get("uddg");
      if (uddg) return decodeURIComponent(uddg);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function shouldKeepSearchResult(url: string, company: SourceCompany) {
  if (!/^https?:\/\//i.test(url)) return false;
  if (!isLikelyCareerUrl(url) && !isSameHost(url, company.careerUrl)) return false;
  return !/linkedin\.com|facebook\.com|instagram\.com|x\.com|twitter\.com/i.test(url);
}

function isSameHost(a: string, b: string | null) {
  if (!b) return false;
  try {
    return new URL(a).hostname.replace(/^www\./, "") === new URL(b).hostname.replace(/^www\./, "");
  } catch {
    return false;
  }
}

function readQueryFromConfig(config: unknown) {
  if (!config || typeof config !== "object" || Array.isArray(config)) return "";
  const value = Reflect.get(config, "query");
  return typeof value === "string" ? value.trim() : "";
}

