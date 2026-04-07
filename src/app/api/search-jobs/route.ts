import { NextRequest } from "next/server";
import { listSearchJobRecords } from "@/lib/sourcing/jobs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const limitValue = Number(searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 50) : 20;

    const jobs = await listSearchJobRecords(process.cwd(), { limit: Math.max(limit * 2, 10) });
    const filtered = status
      ? jobs.filter((job) => job.status === status)
      : jobs;

    return Response.json(filtered.slice(0, limit));
  } catch (error) {
    console.error("GET /api/search-jobs error:", error);
    return Response.json(
      { error: "Failed to fetch search jobs" },
      { status: 500 }
    );
  }
}
