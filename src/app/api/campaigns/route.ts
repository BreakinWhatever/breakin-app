import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        template: true,
        _count: {
          select: { outreaches: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(campaigns);
  } catch (error) {
    console.error("GET /api/campaigns error:", error);
    return Response.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, targetRole, targetCity } = body;
    if (!name || !targetRole || !targetCity) {
      return Response.json(
        { error: "name, targetRole, and targetCity are required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        targetRole,
        targetCity,
        templateId: body.templateId ?? null,
        status: body.status ?? "draft",
      },
    });

    const full = await prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: { template: true },
    });

    return Response.json(full, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("POST /api/campaigns error:", message);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
