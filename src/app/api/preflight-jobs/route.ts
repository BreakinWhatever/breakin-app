import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { serializePreflightJob } from "@/lib/apply/payloads";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const offerId = searchParams.get("offerId");

    const jobs = await prisma.applyPreflightJob.findMany({
      where: {
        status: status ?? undefined,
        offerId: offerId ?? undefined,
      },
      include: {
        offer: true,
        manifest: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return Response.json(await Promise.all(jobs.map((job) => serializePreflightJob(job))));
  } catch (error) {
    console.error("GET /api/preflight-jobs error:", error);
    return Response.json(
      { error: "Failed to fetch preflight jobs" },
      { status: 500 }
    );
  }
}
