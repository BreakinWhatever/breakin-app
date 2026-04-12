import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { queueApplyPreflightForOfferUrls } from "@/lib/apply/preflight";
import { detectContractType } from "@/lib/offers";

type IncomingOffer = {
  title: string;
  company: string;
  companyId?: string | null;
  city: string;
  country?: string | null;
  contractType?: string | null;
  description: string;
  url: string;
  source: string;
  salary?: string | null;
  postedAt?: string | Date | null;
  matchScore?: number | null;
  matchAnalysis?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const offers: IncomingOffer[] = body?.offers ?? body; // allow raw array for convenience
    const scrapeRunId: string | undefined = body?.scrapeRunId ?? undefined;

    if (!Array.isArray(offers) || offers.length === 0) {
      return Response.json(
        { error: "Body must contain non-empty 'offers' array" },
        { status: 400 }
      );
    }

    // Dedup by URL (DB has unique constraint)
    const urls = offers.map((o) => o.url).filter(Boolean);
    const companies = [...new Set(offers.map((o) => o.company).filter(Boolean))];

    const [existingByUrl, existingByContent] = await Promise.all([
      prisma.jobOffer.findMany({
        where: { url: { in: urls } },
        select: { id: true, url: true },
      }),
      prisma.jobOffer.findMany({
        where: { company: { in: companies } },
        select: { id: true, url: true, title: true, company: true, city: true },
      })
    ]);

    const existingSet = new Set(existingByUrl.map((e) => e.url));
    const contentMap = new Map<string, string>(); // 'company|title|city' -> url
    for (const e of existingByContent) {
      const key = `${e.company.toLowerCase().trim()}|${e.title.toLowerCase().trim()}|${e.city.toLowerCase().trim()}`;
      contentMap.set(key, e.url);
    }

    const uniqueToCreate: IncomingOffer[] = [];
    const toUpdateOffers: IncomingOffer[] = [];

    for (const o of offers) {
      const key = `${(o.company || "").toLowerCase().trim()}|${(o.title || "").toLowerCase().trim()}|${(o.city || "").toLowerCase().trim()}`;
      
      let targetUrl = null;
      if (existingSet.has(o.url)) {
        targetUrl = o.url;
      } else if (contentMap.has(key)) {
        targetUrl = contentMap.get(key)!;
        // Merge into the existing offer's URL to preserve history
        o.url = targetUrl;
      }

      if (targetUrl) {
        toUpdateOffers.push(o);
        existingSet.add(targetUrl); // prevent processing same target twice as new
      } else {
        uniqueToCreate.push(o);
        existingSet.add(o.url);
        contentMap.set(key, o.url);
      }
    }

    const now = new Date();
    const toCreate = uniqueToCreate
      .map((o) => {
        const country = o.country ?? "France";
        const contract = (o.contractType && o.contractType.trim())
          ? o.contractType
          : detectContractType(o.title ?? "", o.description ?? "", undefined);
        const posted = o.postedAt
          ? new Date(o.postedAt)
          : null;
        return {
          title: o.title,
          company: o.company,
          companyId: o.companyId ?? null,
          city: o.city,
          country,
          contractType: contract,
          description: o.description,
          url: o.url,
          source: o.source,
          salary: o.salary ?? null,
          matchScore: o.matchScore ?? null,
          matchAnalysis: o.matchAnalysis ?? null,
          postedAt: posted,
          scrapedAt: now,
        };
      });

    // Create new offers
    let createdCount = 0;
    if (toCreate.length > 0) {
      const result = await prisma.jobOffer.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      createdCount = result.count;
      await queueApplyPreflightForOfferUrls(
        process.cwd(),
        toCreate.map((offer) => offer.url),
        "import"
      ).catch(() => {});
    }

    // Optional: light update of existing entries (refresh description/postedAt if provided)
    for (const o of toUpdateOffers) {
      const data: Record<string, unknown> = {};
      if (o.title) data.title = o.title;
      if (o.company) data.company = o.company;
      if (o.companyId !== undefined) data.companyId = o.companyId ?? null;
      if (o.city) data.city = o.city;
      if (o.country) data.country = o.country;
      if (o.description) data.description = o.description;
      if (o.salary !== undefined) data.salary = o.salary ?? null;
      if (o.source) data.source = o.source;
      if (o.contractType || (o.title && o.description)) {
        data.contractType = (o.contractType && o.contractType.trim())
          ? o.contractType
          : detectContractType(o.title ?? "", o.description ?? "", undefined);
      }
      if (o.matchScore !== undefined) data.matchScore = o.matchScore;
      if (o.matchAnalysis !== undefined) data.matchAnalysis = o.matchAnalysis;
      if (o.postedAt !== undefined) data.postedAt = o.postedAt ? new Date(o.postedAt) : null;

      if (Object.keys(data).length > 0) {
        await prisma.jobOffer.update({ where: { url: o.url }, data });
      }
    }

    // Update ScrapeRun if provided
    if (scrapeRunId) {
      await prisma.scrapeRun.update({
        where: { id: scrapeRunId },
        data: {
          jobsFound: offers.length,
          jobsNew: createdCount,
          status: "completed",
          endedAt: new Date(),
        },
      }).catch(() => {});
    }

    return Response.json({
      total: offers.length,
      created: createdCount,
      updated: toUpdate.length,
      skipped: offers.length - createdCount - toUpdate.length,
    });
  } catch (error) {
    console.error("POST /api/offers/import error:", error);
    return Response.json(
      { error: "Failed to import offers" },
      { status: 500 }
    );
  }
}
