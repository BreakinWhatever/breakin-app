import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BasicCrawler, Configuration, Dataset, RequestQueue } from "crawlee";
import { detectContractType } from "@/lib/offers";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  cleanText,
  normalizeUrl,
  toSearchList,
  DEFAULT_FINANCE_KEYWORDS,
  DEFAULT_TARGET_CITIES,
} from "@/lib/crawler/filters";
import { harvestJobsForPage } from "@/lib/crawler";
import type { CandidatePage, CrawlRequest, SourceCompany } from "@/lib/crawler/types";
import { mergeScores, assessOfferWithLlm } from "@/lib/scoring/llm";
import { scoreByRules } from "@/lib/scoring/core";
import { searchCareerPagesForCompany } from "./web-search";
import type {
  PageAttempt,
  PersistableOffer,
  SearchOffersInput,
  SearchSummary,
} from "./types";

interface CrawlUserData {
  company: SourceCompany;
  pageUrl: string;
  discoverySource: CandidatePage["discoverySource"];
  query?: string;
}

export async function runOfferSearch(input: SearchOffersInput): Promise<SearchSummary> {
  const startedAt = new Date();
  const request = buildCrawlRequest(input);
  const artifacts = {
    outputDir: input.outputDir,
    storageDir: input.storageDir,
    summaryFile: path.join(input.outputDir, "summary.json"),
    offersFile: path.join(input.outputDir, "offers.json"),
    csvFile: path.join(input.outputDir, "offers.csv"),
  };

  await mkdir(input.outputDir, { recursive: true });

  const companies = await loadCompanies(input, request);
  const crawlConfig = new Configuration({
    purgeOnStart: false,
    storageClientOptions: {
      localDataDirectory: input.storageDir,
      persistStorage: true,
    },
  });

  const queue = await RequestQueue.open(`offers-${startedAt.getTime()}`, {
    config: crawlConfig,
  });
  const dataset = await Dataset.open<Record<string, unknown>>(
    `offers-pages-${startedAt.getTime()}`,
    { config: crawlConfig }
  );

  const offerMap = new Map<string, PersistableOffer>();
  const attempts: PageAttempt[] = [];
  const errors: string[] = [];
  const scrapedCompanyIds = new Set<string>();
  const expandedCompanies = new Set<string>();
  let scrapeRunId: string | null = null;

  try {
    const run = await prisma.scrapeRun.create({
      data: {
        source: buildRunSource(input, request),
        status: "running",
      },
    });
    scrapeRunId = run.id;

    for (const company of companies) {
      if (company.careerUrl) {
        await enqueueCandidatePage(queue, {
          url: company.careerUrl,
          discoverySource: "registry",
        }, company);
      } else if (request.includeWebSearch) {
        expandedCompanies.add(company.id);
        const pages = await searchCareerPagesForCompany(company, request);
        for (const page of pages) {
          await enqueueCandidatePage(queue, page, company);
        }
      }
    }

    const crawler = new BasicCrawler({
      requestQueue: queue,
      maxConcurrency: 6,
      maxRequestRetries: 1,
      requestHandlerTimeoutSecs: 90,
      async requestHandler({ request: queuedRequest }) {
        const userData = queuedRequest.userData as CrawlUserData;
        const { company, pageUrl, discoverySource, query } = userData;
        scrapedCompanyIds.add(company.id);

        try {
          const jobs = await harvestJobsForPage({
            company,
            pageUrl,
            request,
            discoverySource,
          });

          if (
            jobs.length === 0
            && request.includeWebSearch
            && discoverySource === "registry"
            && !expandedCompanies.has(company.id)
          ) {
            expandedCompanies.add(company.id);
            const pages = await searchCareerPagesForCompany(company, request);
            for (const page of pages) {
              if (normalizeUrl(page.url) === normalizeUrl(pageUrl)) continue;
              await enqueueCandidatePage(queue, page, company);
            }
          }

          let accepted = 0;
          for (const job of jobs) {
            const offer = normalizeOffer(company, pageUrl, discoverySource, job);
            if (!offer) continue;
            upsertOffer(offerMap, offer);
            accepted += 1;
          }

          const attempt: PageAttempt = {
            companyId: company.id,
            company: company.name,
            pageUrl,
            discoverySource,
            offers: accepted,
            status: "ok",
          };
          attempts.push(attempt);
          await dataset.pushData({
            ...attempt,
            query: query ?? null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          attempts.push({
            companyId: company.id,
            company: company.name,
            pageUrl,
            discoverySource,
            offers: 0,
            status: "error",
            error: message,
          });
          errors.push(`${company.name}: ${message}`);
          await dataset.pushData({
            companyId: company.id,
            company: company.name,
            pageUrl,
            discoverySource,
            offers: 0,
            status: "error",
            error: message,
          });
        }
      },
      async failedRequestHandler({ request: queuedRequest, error }) {
        const userData = queuedRequest.userData as CrawlUserData;
        const message = error instanceof Error ? error.message : String(error);
        attempts.push({
          companyId: userData.company.id,
          company: userData.company.name,
          pageUrl: userData.pageUrl,
          discoverySource: userData.discoverySource,
          offers: 0,
          status: "error",
          error: message,
        });
        errors.push(`${userData.company.name}: ${message}`);
      },
    }, crawlConfig);

    await crawler.run();

    const discoveredOffers = Array.from(offerMap.values())
      .sort((left, right) => {
        const leftScore = scoreByRules(left, { keywords: request.keywords, cities: request.cities }).score;
        const rightScore = scoreByRules(right, { keywords: request.keywords, cities: request.cities }).score;
        return rightScore - leftScore;
      })
      .slice(0, request.max);

    const scoredOffers = await scoreOffers(discoveredOffers, input, request);
    const persistence = input.importToDb
      ? await persistOffers(scoredOffers)
      : { created: 0, updated: 0, skipped: scoredOffers.length };

    if (scrapedCompanyIds.size > 0) {
      await prisma.company.updateMany({
        where: { id: { in: Array.from(scrapedCompanyIds) } },
        data: { lastScrapedAt: new Date() },
      });
    }

    const endedAt = new Date();
    const summary: SearchSummary = {
      source: input.source,
      scrapeRunId,
      request,
      companiesConsidered: companies.length,
      companiesScraped: scrapedCompanyIds.size,
      pagesVisited: attempts.length,
      pagesWithErrors: attempts.filter((attempt) => attempt.status === "error").length,
      offersFound: scoredOffers.length,
      offersImported: persistence.created,
      offersUpdated: persistence.updated,
      offersSkipped: persistence.skipped,
      offersScored: input.score ? scoredOffers.length : 0,
      llmAssistedOffers: scoredOffers.filter((offer) => offer.llmUsed).length,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      topOffers: scoredOffers.slice(0, 5).map((offer) => ({
        title: offer.title,
        company: offer.company,
        city: offer.city,
        country: offer.country,
        url: offer.url,
        matchScore: offer.matchScore,
      })),
      errors: errors.slice(0, 20),
      artifacts,
    };

    await writeArtifacts(artifacts.outputDir, summary, scoredOffers);

    if (scrapeRunId) {
      await prisma.scrapeRun.update({
        where: { id: scrapeRunId },
        data: {
          status: "completed",
          jobsFound: scoredOffers.length,
          jobsNew: persistence.created,
          endedAt,
          error: summary.errors[0] ?? null,
        },
      });
    }

    return summary;
  } catch (error) {
    if (scrapeRunId) {
      await prisma.scrapeRun.update({
        where: { id: scrapeRunId },
        data: {
          status: "failed",
          endedAt: new Date(),
          error: error instanceof Error ? error.message : String(error),
        },
      }).catch(() => {});
    }
    throw error;
  }
}

function buildCrawlRequest(input: SearchOffersInput): CrawlRequest {
  return {
    keywords: toSearchList(input.keywords, DEFAULT_FINANCE_KEYWORDS),
    cities: toSearchList(input.cities, DEFAULT_TARGET_CITIES),
    days: input.days,
    max: input.max,
    includeWebSearch: input.includeWebSearch,
    useBrowserFallback: input.useBrowserFallback,
  };
}

async function loadCompanies(input: SearchOffersInput, request: CrawlRequest) {
  const where: Prisma.CompanyWhereInput = {
    active: true,
  };

  if (input.companyNames.length > 0) {
    where.name = {
      in: input.companyNames,
    };
  } else if (request.cities.length > 0) {
    where.OR = request.cities.map((city) => ({
      city: { contains: city, mode: "insensitive" },
    }));
  }

  const companies = await prisma.company.findMany({
    where,
    orderBy: [
      { city: "asc" },
      { name: "asc" },
    ],
  });

  const normalized = companies.map((company) => ({
    id: company.id,
    name: company.name,
    sector: company.sector,
    city: company.city,
    country: company.country,
    careerUrl: company.careerUrl,
    atsType: company.atsType,
    atsConfig: company.atsConfig,
    active: company.active,
  })) satisfies SourceCompany[];

  return input.limitCompanies ? normalized.slice(0, input.limitCompanies) : normalized;
}

async function enqueueCandidatePage(
  queue: RequestQueue,
  page: CandidatePage,
  company: SourceCompany
) {
  await queue.addRequest({
    url: page.url,
    uniqueKey: `${company.id}:${normalizeUrl(page.url)}`,
    userData: {
      company,
      pageUrl: page.url,
      discoverySource: page.discoverySource,
      query: page.query,
    } satisfies CrawlUserData,
  });
}

function normalizeOffer(
  company: SourceCompany,
  pageUrl: string,
  discoverySource: CandidatePage["discoverySource"],
  job: {
    url: string;
    title: string;
    description: string;
    city?: string;
    country?: string;
    postedAt?: string | null;
    contractType?: string | null;
    sourceDetails?: Record<string, unknown>;
  }
) {
  const url = normalizeUrl(job.url);
  const title = cleanText(job.title);
  if (!url || !title) return null;

  const description = cleanText(job.description);
  const contractType =
    job.contractType?.trim()
      || detectContractType(title, description)
      || "CDI";

  return {
    companyId: company.id,
    company: company.name,
    sector: company.sector,
    discoverySource,
    pageUrl,
    url,
    title,
    description,
    city: cleanText(job.city) || company.city,
    country: cleanText(job.country) || company.country,
    contractType,
    source: String(job.sourceDetails?.strategy ?? company.atsType ?? "registry"),
    postedAt: job.postedAt ?? null,
    matchScore: null,
    matchAnalysis: null,
    baseScore: null,
    llmUsed: false,
    sourceDetails: {
      ...job.sourceDetails,
      pageUrl,
      discoverySource,
    },
  } satisfies PersistableOffer;
}

function upsertOffer(target: Map<string, PersistableOffer>, candidate: PersistableOffer) {
  const existing = target.get(candidate.url);
  if (!existing) {
    target.set(candidate.url, candidate);
    return;
  }

  target.set(candidate.url, {
    ...existing,
    description:
      candidate.description.length > existing.description.length
        ? candidate.description
        : existing.description,
    postedAt: candidate.postedAt ?? existing.postedAt,
    city: candidate.city || existing.city,
    country: candidate.country || existing.country,
    sourceDetails: {
      ...(existing.sourceDetails ?? {}),
      ...(candidate.sourceDetails ?? {}),
    },
  });
}

async function scoreOffers(
  offers: PersistableOffer[],
  input: SearchOffersInput,
  request: CrawlRequest
) {
  if (!input.score) {
    return offers;
  }

  const withBaseScores = offers
    .map((offer) => ({
      offer,
      base: scoreByRules(offer, {
        keywords: request.keywords,
        cities: request.cities,
      }),
    }))
    .sort((left, right) => right.base.score - left.base.score);

  const scored: PersistableOffer[] = [];

  for (let index = 0; index < withBaseScores.length; index += 1) {
    const item = withBaseScores[index];
    const llmAssessment = await assessOfferWithLlm(item.offer, item.base, {
      provider: input.llmProvider,
      cwd: process.cwd(),
      maxOffers: input.llmMaxOffers,
      currentIndex: index,
    });
    const merged = mergeScores(item.base, llmAssessment);
    scored.push({
      ...item.offer,
      baseScore: item.base.score,
      matchScore: merged.score,
      matchAnalysis: merged.rationale,
      contractType: merged.contractType ?? item.offer.contractType,
      llmUsed: merged.llmUsed,
    });
  }

  return scored.sort((left, right) => (right.matchScore ?? 0) - (left.matchScore ?? 0));
}

async function persistOffers(offers: PersistableOffer[]) {
  if (offers.length === 0) {
    return { created: 0, updated: 0, skipped: 0 };
  }

  const existing = await prisma.jobOffer.findMany({
    where: { url: { in: offers.map((offer) => offer.url) } },
    select: { url: true },
  });
  const existingSet = new Set(existing.map((offer) => offer.url));

  const toCreate = offers
    .filter((offer) => !existingSet.has(offer.url))
    .map((offer) => ({
      title: offer.title,
      company: offer.company,
      companyId: offer.companyId,
      city: offer.city,
      country: offer.country,
      contractType: offer.contractType,
      description: offer.description,
      url: offer.url,
      source: offer.source,
      salary: null,
      postedAt: offer.postedAt ? new Date(offer.postedAt) : null,
      matchScore: offer.matchScore,
      matchAnalysis: offer.matchAnalysis,
      scrapedAt: new Date(),
    }));

  const createResult = toCreate.length > 0
    ? await prisma.jobOffer.createMany({
        data: toCreate,
        skipDuplicates: true,
      })
    : { count: 0 };

  const toUpdate = offers.filter((offer) => existingSet.has(offer.url));
  for (const offer of toUpdate) {
    await prisma.jobOffer.update({
      where: { url: offer.url },
      data: {
        title: offer.title,
        company: offer.company,
        companyId: offer.companyId,
        city: offer.city,
        country: offer.country,
        contractType: offer.contractType,
        description: offer.description,
        source: offer.source,
        postedAt: offer.postedAt ? new Date(offer.postedAt) : null,
        matchScore: offer.matchScore,
        matchAnalysis: offer.matchAnalysis,
      },
    });
  }

  return {
    created: createResult.count,
    updated: toUpdate.length,
    skipped: Math.max(0, offers.length - createResult.count - toUpdate.length),
  };
}

async function writeArtifacts(
  outputDir: string,
  summary: SearchSummary,
  offers: PersistableOffer[]
) {
  await mkdir(outputDir, { recursive: true });

  const csvLines = [
    [
      "matchScore",
      "company",
      "title",
      "city",
      "country",
      "contractType",
      "source",
      "postedAt",
      "url",
    ].join(","),
    ...offers.map((offer) =>
      [
        offer.matchScore ?? "",
        escapeCsv(offer.company),
        escapeCsv(offer.title),
        escapeCsv(offer.city),
        escapeCsv(offer.country),
        escapeCsv(offer.contractType),
        escapeCsv(offer.source),
        escapeCsv(offer.postedAt ?? ""),
        escapeCsv(offer.url),
      ].join(",")
    ),
  ];

  await writeFile(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2));
  await writeFile(path.join(outputDir, "offers.json"), JSON.stringify(offers, null, 2));
  await writeFile(path.join(outputDir, "offers.csv"), csvLines.join("\n"));
}

function buildRunSource(input: SearchOffersInput, request: CrawlRequest) {
  return [
    input.source,
    request.keywords.slice(0, 3).join("|"),
    request.cities.slice(0, 2).join("|"),
    `days=${request.days}`,
    `max=${request.max}`,
  ]
    .filter(Boolean)
    .join(" ");
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}
