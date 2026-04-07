import {
  DEFAULT_FINANCE_KEYWORDS,
  containsExcludedRole,
  extractCityCountry,
  looksLikeFinanceRole,
  matchesAny,
  toSearchList,
  withinDays,
} from "./filters";
import { fetchAtsJobs } from "./ats";
import { fetchJobsWithDevBrowser } from "./browser";
import type { ExtractedJob, HarvestContext } from "./types";

export async function harvestJobsForPage(
  context: HarvestContext
): Promise<ExtractedJob[]> {
  const attempts: Array<() => Promise<ExtractedJob[]>> = [
    () => fetchAtsJobs(context),
  ];

  if (context.request.useBrowserFallback) {
    attempts.push(() => fetchJobsWithDevBrowser(context));
  }

  for (const attempt of attempts) {
    const jobs = await attempt();
    const filtered = filterExtractedJobs(jobs, context);
    if (filtered.length > 0) {
      return filtered;
    }
  }

  return [];
}

function filterExtractedJobs(jobs: ExtractedJob[], context: HarvestContext) {
  const keywords = toSearchList(
    context.request.keywords,
    DEFAULT_FINANCE_KEYWORDS
  );
  const cities = context.request.cities;

  return jobs.filter((job) => {
    const jobText = [
      job.title,
      job.description,
      job.city,
      job.country,
    ]
      .filter(Boolean)
      .join("\n");
    const companyText = [context.company.name, context.company.sector]
      .filter(Boolean)
      .join("\n");

    if (containsExcludedRole(jobText)) return false;

    const keywordMatch =
      matchesAny(jobText, keywords)
      || (matchesAny(companyText, keywords) && looksLikeFinanceRole(jobText));
    if (!keywordMatch) return false;

    if (cities.length > 0 && !matchesAny(jobText, cities)) return false;

    const location = extractCityCountry(jobText, context.company);
    job.city = job.city || location.city;
    job.country = job.country || location.country;

    return withinDays(job.postedAt, context.request.days);
  });
}
