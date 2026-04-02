import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const outreach = await prisma.outreach.findUnique({
      where: { id },
      include: {
        contact: {
          include: { company: true },
        },
        campaign: {
          include: { template: true },
        },
        emails: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!outreach) {
      return Response.json({ error: "Outreach not found" }, { status: 404 });
    }

    return Response.json(outreach);
  } catch (error) {
    console.error("GET /api/outreaches/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch outreach" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Convert date strings to Date objects if present
    if (body.lastContactDate) {
      body.lastContactDate = new Date(body.lastContactDate);
    }
    if (body.nextActionDate) {
      body.nextActionDate = new Date(body.nextActionDate);
    }

    const outreach = await prisma.outreach.update({
      where: { id },
      data: body,
      include: {
        contact: { include: { company: true } },
        campaign: true,
      },
    });

    return Response.json(outreach);
  } catch (error) {
    console.error("PUT /api/outreaches/[id] error:", error);
    return Response.json(
      { error: "Failed to update outreach" },
      { status: 500 }
    );
  }
}
