import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const runs = await prisma.scrapeRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    return Response.json(runs);
  } catch (error) {
    console.error("GET /api/scrape-runs error:", error);
    return Response.json(
      { error: "Failed to fetch scrape runs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source } = body;

    if (!source) {
      return Response.json(
        { error: "source is required" },
        { status: 400 }
      );
    }

    const run = await prisma.scrapeRun.create({
      data: {
        source,
        status: "running",
      },
    });

    return Response.json(run, { status: 201 });
  } catch (error) {
    console.error("POST /api/scrape-runs error:", error);
    return Response.json(
      { error: "Failed to create scrape run" },
      { status: 500 }
    );
  }
}
