import {
  containsExcludedRole,
  extractCityCountry,
  isLikelyCareerUrl,
  normalizeUrl,
  parseDateLike,
  withinDays,
} from "./filters";
import type { ExtractedJob, HarvestContext } from "./types";
import { buildWorkdayJobUrl } from "./workday";

const DEFAULT_HEADERS = {
  Accept: "application/json, text/html;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
};

type JsonRecord = Record<string, unknown>;

export async function fetchAtsJobs(
  context: HarvestContext
): Promise<ExtractedJob[]> {
  const atsType = resolveAtsType(context);

  switch (atsType) {
    case "workday":
      return fetchWorkdayJobs(context);
    case "greenhouse":
      return fetchGreenhouseJobs(context);
    case "lever":
      return fetchLeverJobs(context);
    case "smartrecruiters":
      return fetchSmartRecruitersJobs(context);
    case "workable":
      return fetchWorkableJobs(context);
    case "ashby":
      return fetchAshbyJobs(context);
    default:
      return fetchGenericJobs(context);
  }
}

async function fetchWorkdayJobs(
  context: HarvestContext
): Promise<ExtractedJob[]> {
  const workdayConfig = resolveWorkdayConfig(context);
  if (!workdayConfig) {
    return fetchGenericJobs(context);
  }

  const origin = `https://${workdayConfig.tenant}.${workdayConfig.wdServer}.myworkdayjobs.com`;
  const listUrl = `${origin}/wday/cxs/${workdayConfig.tenant}/${workdayConfig.site}/jobs`;

  let offset = 0;
  const limit = 20;
  const jobs: ExtractedJob[] = [];
  const seen = new Set<string>();

  for (;;) {
    const page = (await fetchJson(listUrl, {
      method: "POST",
      body: JSON.stringify({
        appliedFacets: {},
        limit,
        offset,
        searchText: "",
      }),
      headers: {
        ...DEFAULT_HEADERS,
        "Content-Type": "application/json",
      },
    })) as JsonRecord | null;

    const postings = Array.isArray(page?.jobPostings)
      ? (page?.jobPostings as JsonRecord[])
      : [];
    if (postings.length === 0) break;

    for (const posting of postings) {
      const externalPath = stringValue(posting.externalPath);
      const title = stringValue(posting.title);
      if (!externalPath || !title) continue;

      const jobUrl = buildWorkdayJobUrl({
        origin,
        tenant: workdayConfig.tenant,
        site: workdayConfig.site,
        externalPath,
      });
      if (seen.has(jobUrl)) continue;
      seen.add(jobUrl);

      const detail = (await fetchJson(jobUrl, {
        headers: DEFAULT_HEADERS,
      })) as JsonRecord | null;
      const info = isRecord(detail?.jobPostingInfo)
        ? (detail?.jobPostingInfo as JsonRecord)
        : null;
      const description = cleanDescription(
        stringValue(info?.jobDescription) ||
          stringValue(posting.description) ||
          arrayText(info?.bulletFields)
      );
      const locationText =
        stringValue(posting.locationsText) ||
        stringValue(info?.location) ||
        stringValue(info?.locationsText);
      const text = `${title}\n${description}\n${arrayText(posting.bulletFields)}\n${locationText}`;
      if (containsExcludedRole(title)) continue;
      if (!withinDays(resolvePostedAt(posting, info), context.request.days)) continue;

      const location = extractCityCountry(text, context.company);
      jobs.push({
        url: jobUrl,
        title,
        description,
        city: location.city,
        country: location.country,
        postedAt: resolvePostedAt(posting, info),
        sourceDetails: {
          strategy: "workday-api",
        },
      });
    }

    if (postings.length < limit) break;
    offset += limit;
  }

  return jobs;
}

async function fetchGreenhouseJobs(
  context: HarvestContext
): Promise<ExtractedJob[]> {
  const boardToken =
    stringValue(recordValue(context.company.atsConfig, "boardToken")) ??
    deriveTokenFromUrl(context.pageUrl, ["job-boards", "boards"]);
  if (!boardToken) return [];

  const data = (await fetchJson(
    `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`,
    { headers: DEFAULT_HEADERS }
  )) as JsonRecord | null;
  const jobs = Array.isArray(data?.jobs) ? (data?.jobs as JsonRecord[]) : [];

  return jobs
    .map((job) => {
      const title = stringValue(job.title);
      const url = stringValue(job.absolute_url);
      const description = cleanDescription(stringValue(job.content));
      const locationText = stringValue(recordValue(job.location, "name"));
      const location = extractCityCountry(
        `${title}\n${description}\n${locationText}`,
        context.company
      );
      return {
        url: normalizeUrl(url),
        title,
        description,
        city: location.city,
        country: location.country,
        sourceDetails: {
          strategy: "greenhouse-api",
        },
      } satisfies ExtractedJob;
    })
    .filter((job) => job.url && job.title)
    .filter((job) => !containsExcludedRole(job.title));
}

async function fetchLeverJobs(
  context: HarvestContext
): Promise<ExtractedJob[]> {
  const slug =
    stringValue(recordValue(context.company.atsConfig, "slug")) ??
    deriveFirstPathSegment(context.pageUrl);
  if (!slug) return [];

  const hosts = [
    `https://api.lever.co/v0/postings/${slug}?mode=json`,
    `https://api.eu.lever.co/v0/postings/${slug}?mode=json`,
  ];

  let data: unknown = null;
  for (const url of hosts) {
    data = await fetchJson(url, { headers: DEFAULT_HEADERS });
    if (Array.isArray(data) && data.length > 0) break;
  }
  const jobs = Array.isArray(data) ? (data as JsonRecord[]) : [];

  return jobs
    .map((job) => {
      const title = stringValue(job.text);
      const url = stringValue(job.hostedUrl);
      const description = cleanDescription(
        stringValue(job.descriptionPlain) || stringValue(job.description)
      );
      const locationText = stringValue(recordValue(job.categories, "location"));
      const location = extractCityCountry(
        `${title}\n${description}\n${locationText}`,
        context.company
      );
      return {
        url: normalizeUrl(url),
        title,
        description,
        city: location.city,
        country: location.country,
        postedAt: parseDateLike(stringValue(job.createdAt)),
        sourceDetails: {
          strategy: "lever-api",
        },
      } satisfies ExtractedJob;
    })
    .filter((job) => job.url && job.title)
    .filter((job) => !containsExcludedRole(job.title))
    .filter((job) => withinDays(job.postedAt, context.request.days));
}

async function fetchSmartRecruitersJobs(
  context: HarvestContext
): Promise<ExtractedJob[]> {
  const identifier =
    stringValue(recordValue(context.company.atsConfig, "companyIdentifier")) ??
    deriveFirstPathSegment(context.pageUrl);
  if (!identifier) return [];

  const data = (await fetchJson(
    `https://api.smartrecruiters.com/v1/companies/${identifier}/postings?limit=200`,
    { headers: DEFAULT_HEADERS }
  )) as JsonRecord | null;
  const postings = Array.isArray(data?.content)
    ? (data?.content as JsonRecord[])
    : [];

  return postings
    .map((posting) => {
      const title = stringValue(posting.name);
      const url = stringValue(posting.referralUrl);
      const locationText = [
        stringValue(recordValue(posting.location, "city")),
        stringValue(recordValue(posting.location, "country")),
      ]
        .filter(Boolean)
        .join(", ");
      const location = extractCityCountry(
        `${title}\n${locationText}`,
        context.company
      );
      return {
        url: normalizeUrl(url),
        title,
        description: "",
        city: location.city,
        country: location.country,
        postedAt: parseDateLike(stringValue(posting.releasedDate)),
        sourceDetails: {
          strategy: "smartrecruiters-api",
        },
      } satisfies ExtractedJob;
    })
    .filter((job) => job.url && job.title)
    .filter((job) => !containsExcludedRole(job.title))
    .filter((job) => withinDays(job.postedAt, context.request.days));
}

async function fetchWorkableJobs(
  context: HarvestContext
): Promise<ExtractedJob[]> {
  const account =
    stringValue(recordValue(context.company.atsConfig, "clientname")) ??
    stringValue(recordValue(context.company.atsConfig, "account")) ??
    deriveFirstPathSegment(context.pageUrl);
  if (!account) return [];

  const endpoints = [
    `https://apply.workable.com/api/v3/accounts/${account}/jobs`,
    `https://apply.workable.com/api/v1/widget/accounts/${account}`,
  ];

  let jobs: JsonRecord[] = [];
  for (const endpoint of endpoints) {
    const payload = (await fetchJson(endpoint, {
      headers: DEFAULT_HEADERS,
    })) as JsonRecord | null;
    const records = Array.isArray(payload?.results)
      ? (payload?.results as JsonRecord[])
      : Array.isArray(payload?.jobs)
        ? (payload?.jobs as JsonRecord[])
        : [];
    if (records.length > 0) {
      jobs = records;
      break;
    }
  }

  return jobs
    .map((job) => {
      const title = stringValue(job.title) || stringValue(job.full_title);
      const url =
        stringValue(job.url) ||
        stringValue(job.application_url) ||
        stringValue(job.shortcode_url);
      const description = cleanDescription(
        stringValue(job.description) || stringValue(job.summary)
      );
      const locationText =
        stringValue(job.location) ||
        [
          stringValue(recordValue(job.location, "city")),
          stringValue(recordValue(job.location, "country")),
        ]
          .filter(Boolean)
          .join(", ");
      const location = extractCityCountry(
        `${title}\n${description}\n${locationText}`,
        context.company
      );
      return {
        url: normalizeUrl(url),
        title,
        description,
        city: location.city,
        country: location.country,
        postedAt: parseDateLike(
          stringValue(job.published_on) ||
            stringValue(job.publishedAt) ||
            stringValue(job.created_at)
        ),
        sourceDetails: {
          strategy: "workable-api",
        },
      } satisfies ExtractedJob;
    })
    .filter((job) => job.url && job.title)
    .filter((job) => !containsExcludedRole(job.title))
    .filter((job) => withinDays(job.postedAt, context.request.days));
}

async function fetchAshbyJobs(
  context: HarvestContext
): Promise<ExtractedJob[]> {
  const clientName =
    stringValue(recordValue(context.company.atsConfig, "clientname")) ??
    deriveAshbyClientName(context.pageUrl);
  if (!clientName) return [];

  const payload = (await fetchJson(
    `https://api.ashbyhq.com/posting-api/job-board/${clientName}?includeCompensation=true`,
    { headers: DEFAULT_HEADERS }
  )) as JsonRecord | null;
  const jobs = Array.isArray(payload?.jobs)
    ? (payload?.jobs as JsonRecord[])
    : Array.isArray(payload?.jobPostings)
      ? (payload?.jobPostings as JsonRecord[])
      : [];

  return jobs
    .map((job) => {
      const title = stringValue(job.title);
      const url =
        stringValue(job.jobUrl) ||
        stringValue(job.jobPostingUrl) ||
        stringValue(job.url);
      const description = cleanDescription(
        stringValue(job.description) ||
          stringValue(job.descriptionHtml) ||
          stringValue(job.content)
      );
      const locationText =
        stringValue(job.location) ||
        [
          stringValue(recordValue(job.location, "city")),
          stringValue(recordValue(job.location, "country")),
        ]
          .filter(Boolean)
          .join(", ");
      const location = extractCityCountry(
        `${title}\n${description}\n${locationText}`,
        context.company
      );
      return {
        url: normalizeUrl(url),
        title,
        description,
        city: location.city,
        country: location.country,
        postedAt: parseDateLike(
          stringValue(job.publishedAt) ||
            stringValue(job.createdAt) ||
            stringValue(job.updatedAt)
        ),
        sourceDetails: {
          strategy: "ashby-api",
        },
      } satisfies ExtractedJob;
    })
    .filter((job) => job.url && job.title)
    .filter((job) => !containsExcludedRole(job.title))
    .filter((job) => withinDays(job.postedAt, context.request.days));
}

export async function fetchGenericJobs(
  context: HarvestContext
): Promise<ExtractedJob[]> {
  let html = "";
  try {
    const response = await fetch(context.pageUrl, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return [];
    html = await response.text();
  } catch {
    return [];
  }

  const matches = Array.from(
    html.matchAll(/<a\s+[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)
  );
  const jobs: ExtractedJob[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const href = cleanDescription(match[1]);
    const title = cleanDescription(match[2].replace(/<[^>]+>/g, " "));
    let jobUrl = "";
    try {
      jobUrl = normalizeUrl(new URL(href, context.pageUrl).toString());
    } catch {
      continue;
    }
    if (!jobUrl || seen.has(jobUrl) || !isLikelyCareerUrl(jobUrl)) continue;
    seen.add(jobUrl);

    const combined = `${title}\n${jobUrl}`;
    if (containsExcludedRole(title)) continue;

    const location = extractCityCountry(combined, context.company);
    jobs.push({
      url: jobUrl,
      title: title || jobUrl,
      description: "",
      city: location.city,
      country: location.country,
      sourceDetails: {
        strategy: "generic-html",
      },
    });
  }

  return jobs;
}

async function fetchJson(
  url: string,
  init: RequestInit
): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function resolveAtsType(context: HarvestContext) {
  if (context.company.atsType) {
    return context.company.atsType;
  }

  const lower = context.pageUrl.toLowerCase();
  if (lower.includes("myworkdayjobs.com")) return "workday";
  if (lower.includes("greenhouse.io")) return "greenhouse";
  if (lower.includes("lever.co")) return "lever";
  if (lower.includes("smartrecruiters.com")) return "smartrecruiters";
  if (lower.includes("workable.com")) return "workable";
  if (lower.includes("ashbyhq.com")) return "ashby";
  return "custom";
}

function resolveWorkdayConfig(context: HarvestContext) {
  const config = isRecord(context.company.atsConfig)
    ? (context.company.atsConfig as JsonRecord)
    : {};
  const tenant =
    stringValue(config.tenant) ?? deriveWorkdayConfigFromUrl(context.pageUrl)?.tenant;
  const site =
    stringValue(config.site) ?? deriveWorkdayConfigFromUrl(context.pageUrl)?.site;
  const wdServer =
    stringValue(config.wdServer) ??
    deriveWorkdayConfigFromUrl(context.pageUrl)?.wdServer;

  if (!tenant || !site || !wdServer) {
    return null;
  }

  return { tenant, site, wdServer };
}

function deriveWorkdayConfigFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const [tenant, wdServer] = parsed.hostname.split(".");
    const site = parsed.pathname.split("/").filter(Boolean)[0];
    if (!tenant || !wdServer || !site) return null;
    return { tenant, wdServer, site };
  } catch {
    return null;
  }
}

function deriveTokenFromUrl(url: string, markers: string[]) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const markerIndex = segments.findIndex((segment) => markers.includes(segment));
    if (markerIndex >= 0 && segments[markerIndex + 1]) {
      return segments[markerIndex + 1];
    }
    return segments[0] ?? null;
  } catch {
    return null;
  }
}

function deriveFirstPathSegment(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
  } catch {
    return null;
  }
}

function deriveAshbyClientName(url: string) {
  try {
    const parsed = new URL(url);
    const hostSegments = parsed.hostname.split(".");
    if (hostSegments.length > 2) {
      return hostSegments[0];
    }
    return deriveFirstPathSegment(url);
  } catch {
    return null;
  }
}

function resolvePostedAt(
  ...sources: Array<JsonRecord | null | undefined>
): string | null {
  for (const source of sources) {
    if (!source) continue;

    const candidates = [
      stringValue(source.postedOn),
      stringValue(source.postedDate),
      stringValue(source.postedAt),
      stringValue(source.timePosted),
      stringValue(source.startDate),
      stringValue(source.endDate),
    ];

    for (const candidate of candidates) {
      const parsed = parseDateLike(candidate);
      if (parsed) return parsed;
    }
  }

  return null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordValue(record: unknown, key: string) {
  if (!isRecord(record)) return undefined;
  return record[key];
}

function arrayText(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => {
          if (typeof item === "string") return item;
          if (isRecord(item)) {
            return Object.values(item)
              .filter((field): field is string => typeof field === "string")
              .join(" ");
          }
          return "";
        })
        .join(" ")
    : "";
}

function cleanDescription(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
