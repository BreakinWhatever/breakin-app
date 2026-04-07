import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const run = await prisma.scrapeRun.findUnique({ where: { id } });
    if (!run) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(run);
  } catch (error) {
    console.error("GET /api/scrape-runs/[id] error:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.jobsFound !== undefined) data.jobsFound = Number(body.jobsFound) || 0;
    if (body.jobsNew !== undefined) data.jobsNew = Number(body.jobsNew) || 0;
    if (body.error !== undefined) data.error = body.error ?? null;
    if (body.endedAt !== undefined) data.endedAt = body.endedAt ? new Date(body.endedAt) : new Date();

    const run = await prisma.scrapeRun.update({ where: { id }, data });
    return Response.json(run);
  } catch (error) {
    console.error("PUT /api/scrape-runs/[id] error:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

