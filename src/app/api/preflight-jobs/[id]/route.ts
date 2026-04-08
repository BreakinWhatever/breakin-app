import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { serializePreflightJob } from "@/lib/apply/payloads";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.applyPreflightJob.findUnique({
      where: { id },
      include: {
        offer: true,
        manifest: true,
      },
    });

    if (!job) {
      return Response.json({ error: "Preflight job not found" }, { status: 404 });
    }

    return Response.json(await serializePreflightJob(job));
  } catch (error) {
    console.error("GET /api/preflight-jobs/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch preflight job" },
      { status: 500 }
    );
  }
}
