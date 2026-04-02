import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const outreachId = searchParams.get("outreachId");
    const status = searchParams.get("status");
    const campaignId = searchParams.get("campaignId");

    const where: Record<string, unknown> = {};
    if (outreachId) where.outreachId = outreachId;
    if (status) where.status = status;
    if (campaignId) where.outreach = { campaignId };

    const emails = await prisma.email.findMany({
      where,
      include: {
        outreach: {
          include: {
            contact: true,
            campaign: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(emails);
  } catch (error) {
    console.error("GET /api/emails error:", error);
    return Response.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { outreachId, subject, body: emailBody } = body;
    if (!outreachId || !subject || !emailBody) {
      return Response.json(
        { error: "outreachId, subject, and body are required" },
        { status: 400 }
      );
    }

    const email = await prisma.email.create({
      data: {
        outreachId,
        subject,
        body: emailBody,
        type: body.type ?? "initial",
        status: "draft",
      },
      include: {
        outreach: true,
      },
    });

    return Response.json(email, { status: 201 });
  } catch (error) {
    console.error("POST /api/emails error:", error);
    return Response.json(
      { error: "Failed to create email" },
      { status: 500 }
    );
  }
}
