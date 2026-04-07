import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const offerId = searchParams.get("offerId");
    const source = searchParams.get("source");

    const jobs = await prisma.applyJob.findMany({
      where: {
        status: status ?? undefined,
        offerId: offerId ?? undefined,
        source: source ?? undefined,
      },
      include: {
        offer: true,
        application: true,
        events: {
          orderBy: { createdAt: "asc" },
          take: 20,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return Response.json(jobs);
  } catch (error) {
    console.error("GET /api/apply-jobs error:", error);
    return Response.json(
      { error: "Failed to fetch apply jobs" },
      { status: 500 }
    );
  }
}
