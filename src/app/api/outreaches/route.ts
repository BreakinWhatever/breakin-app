import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const campaignId = searchParams.get("campaignId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;
    if (status) where.status = status;

    const outreaches = await prisma.outreach.findMany({
      where,
      include: {
        contact: {
          include: { company: true },
        },
        campaign: true,
        emails: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(outreaches);
  } catch (error) {
    console.error("GET /api/outreaches error:", error);
    return Response.json(
      { error: "Failed to fetch outreaches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { contactId, campaignId } = body;
    if (!contactId || !campaignId) {
      return Response.json(
        { error: "contactId and campaignId are required" },
        { status: 400 }
      );
    }

    // Dedup check: prevent duplicate outreach for same contact+campaign
    const existing = await prisma.outreach.findUnique({
      where: {
        contactId_campaignId: { contactId, campaignId },
      },
    });

    if (existing) {
      return Response.json(
        { error: "An outreach already exists for this contact and campaign" },
        { status: 409 }
      );
    }

    const outreach = await prisma.outreach.create({
      data: {
        contactId,
        campaignId,
        status: body.status ?? "identified",
        lastContactDate: body.lastContactDate
          ? new Date(body.lastContactDate)
          : null,
        nextActionDate: body.nextActionDate
          ? new Date(body.nextActionDate)
          : null,
        nextActionType: body.nextActionType ?? null,
        aiSuggestion: body.aiSuggestion ?? null,
        notes: body.notes ?? null,
      },
      include: {
        contact: { include: { company: true } },
        campaign: true,
      },
    });

    return Response.json(outreach, { status: 201 });
  } catch (error) {
    console.error("POST /api/outreaches error:", error);
    return Response.json(
      { error: "Failed to create outreach" },
      { status: 500 }
    );
  }
}
