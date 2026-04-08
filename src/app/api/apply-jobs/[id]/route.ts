import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { serializeApplyJob } from "@/lib/apply/payloads";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.applyJob.findUnique({
      where: { id },
      include: {
        offer: true,
        application: true,
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!job) {
      return Response.json({ error: "Apply job not found" }, { status: 404 });
    }

    return Response.json(await serializeApplyJob(job));
  } catch (error) {
    console.error("GET /api/apply-jobs/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch apply job" },
      { status: 500 }
    );
  }
}
