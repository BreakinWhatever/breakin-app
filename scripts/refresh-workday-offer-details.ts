import "dotenv/config";
import { prisma } from "../src/lib/db";
import {
  DEFAULT_FINANCE_KEYWORDS,
  DEFAULT_TARGET_CITIES,
  cleanText,
  extractCityCountry,
} from "../src/lib/crawler/filters";
import { detectContractType } from "../src/lib/offers";
import { scoreByRules } from "../src/lib/scoring/core";
import {
  assessOfferWithLlm,
  mergeScores,
  type LlmProvider,
} from "../src/lib/scoring/llm";

const DEFAULT_HEADERS = {
  Accept: "application/json, text/html;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
};

async function main() {
  const dryRun = !process.argv.includes("--apply");
  const provider = readProviderArg();
  const limit = readNumberArg("--limit") ?? 50;

  const offers = await prisma.jobOffer.findMany({
    where: {
      url: {
        contains: "myworkdayjobs.com",
      },
      description: "",
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const changes: Array<Record<string, unknown>> = [];
  const failures: Array<Record<string, unknown>> = [];

  for (let index = 0; index < offers.length; index += 1) {
    const offer = offers[index];

    try {
      const detail = await fetchWorkdayDetail(offer.url);
      const jobPostingInfo = recordValue(detail, "jobPostingInfo");
      const rawDescription = stringValue(jobPostingInfo?.jobDescription);
      const description = htmlToText(rawDescription);

      if (!description) {
        failures.push({
          id: offer.id,
          title: offer.title,
          company: offer.company,
          url: offer.url,
          reason: "empty-description-from-workday",
        });
        continue;
      }

      const locationText =
        stringValue(jobPostingInfo?.location) ||
        stringValue(jobPostingInfo?.locationsText) ||
        `${offer.city} ${offer.country}`;
      const location = extractCityCountry(
        `${offer.title}\n${description}\n${locationText}`,
        { city: offer.city, country: offer.country }
      );

      const base = scoreByRules(
        {
          title: offer.title,
          description,
          city: location.city || offer.city,
          country: location.country || offer.country,
          postedAt: offer.postedAt?.toISOString() ?? null,
        },
        {
          keywords: DEFAULT_FINANCE_KEYWORDS,
          cities: DEFAULT_TARGET_CITIES,
        }
      );

      const llm = await assessOfferWithLlm(
        {
          title: offer.title,
          description,
          city: location.city || offer.city,
          country: location.country || offer.country,
          postedAt: offer.postedAt?.toISOString() ?? null,
        },
        base,
        {
          provider,
          cwd: process.cwd(),
          maxOffers: offers.length,
          currentIndex: index,
        }
      );
      const merged = mergeScores(base, llm);
      const contractType =
        merged.contractType ?? detectContractType(offer.title, description);

      const next = {
        description,
        city: location.city || offer.city,
        country: location.country || offer.country,
        contractType,
        matchScore: merged.score,
        matchAnalysis: merged.rationale,
      };

      changes.push({
        id: offer.id,
        title: offer.title,
        company: offer.company,
        fromScore: offer.matchScore,
        toScore: merged.score,
        fromDescriptionLength: offer.description.length,
        toDescriptionLength: description.length,
      });

      if (!dryRun) {
        await prisma.jobOffer.update({
          where: { id: offer.id },
          data: next,
        });
      }
    } catch (error) {
      failures.push({
        id: offer.id,
        title: offer.title,
        company: offer.company,
        url: offer.url,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        provider,
        scanned: offers.length,
        updated: changes.length,
        failed: failures.length,
        sample: changes.slice(0, 10),
        failures: failures.slice(0, 5),
      },
      null,
      2
    )
  );
}

async function fetchWorkdayDetail(url: string) {
  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`workday-detail-http-${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`workday-detail-content-type-${contentType}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

function recordValue(
  value: Record<string, unknown>,
  key: string
): Record<string, unknown> | null {
  const candidate = value[key];
  if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
    return candidate as Record<string, unknown>;
  }
  return null;
}

function htmlToText(value: string) {
  return cleanText(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readProviderArg(): LlmProvider {
  const match = process.argv.find((arg) => arg.startsWith("--llm-provider="));
  const value = match?.split("=")[1];
  if (value === "claude" || value === "codex" || value === "none") {
    return value;
  }
  return "auto";
}

function readNumberArg(name: string) {
  const match = process.argv.find((arg) => arg.startsWith(`${name}=`));
  const raw = match?.split("=")[1];
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
