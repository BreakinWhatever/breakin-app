import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { detectContractType } from "@/lib/offers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offers, scrapeRunId } = body;

    if (!offers || !Array.isArray(offers) || offers.length === 0) {
      return Response.json(
        { error: "offers array is required" },
        { status: 400 }
      );
    }

    // Deduplicate: fetch existing URLs
    const incomingUrls = offers.map((o: { url: string }) => o.url);
    const existing = await prisma.jobOffer.findMany({
      where: { url: { in: incomingUrls } },
      select: { url: true },
    });
    const existingUrls = new Set(existing.map((e) => e.url));

    const newOffers = offers.filter(
      (o: { url: string }) => !existingUrls.has(o.url)
    );
    const duplicates = offers.length - newOffers.length;

    // Bulk create
    if (newOffers.length > 0) {
      await prisma.jobOffer.createMany({
        data: newOffers.map(
          (o: {
            title: string;
            company: string;
            city: string;
            country?: string;
            contractType?: string;
            description: string;
            url: string;
            source: string;
            salary?: string;
            postedAt?: string;
          }) => ({
            title: o.title,
            company: o.company,
            city: o.city,
            country: o.country ?? "France",
            contractType: detectContractType(o.title, o.description, o.contractType),
            description: o.description,
            url: o.url,
            source: o.source,
            salary: o.salary ?? null,
            postedAt: o.postedAt ? new Date(o.postedAt) : null,
          })
        ),
      });
    }

    // Update ScrapeRun if provided
    if (scrapeRunId) {
      await prisma.scrapeRun.update({
        where: { id: scrapeRunId },
        data: {
          jobsFound: offers.length,
          jobsNew: newOffers.length,
          status: "completed",
          endedAt: new Date(),
        },
      });
    }

    return Response.json({
      imported: newOffers.length,
      duplicates,
      total: offers.length,
    });
  } catch (error) {
    console.error("POST /api/offers/import error:", error);
    return Response.json(
      { error: "Failed to import offers" },
      { status: 500 }
    );
  }
}
