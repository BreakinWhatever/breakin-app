import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        outreaches: {
          include: {
            contact: {
              include: { company: true },
            },
            emails: true,
          },
        },
      },
    });

    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    return Response.json(campaign);
  } catch (error) {
    console.error("GET /api/campaigns/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch campaign" },
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

    await prisma.campaign.update({
      where: { id },
      data: body,
    });

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { template: true },
    });

    return Response.json(campaign);
  } catch (error) {
    console.error("PUT /api/campaigns/[id] error:", error);
    return Response.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.campaign.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/campaigns/[id] error:", error);
    return Response.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
