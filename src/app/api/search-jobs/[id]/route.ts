import { NextRequest } from "next/server";
import { readSearchJobRecord } from "@/lib/sourcing/jobs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await readSearchJobRecord(process.cwd(), id);

    if (!job) {
      return Response.json({ error: "Search job not found" }, { status: 404 });
    }

    return Response.json(job);
  } catch (error) {
    console.error("GET /api/search-jobs/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch search job" },
      { status: 500 }
    );
  }
}
