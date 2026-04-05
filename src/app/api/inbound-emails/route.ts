import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const contactId = searchParams.get("contactId");

    const where: Record<string, unknown> = {};
    if (contactId) where.contactId = contactId;

    const inboundEmails = await prisma.inboundEmail.findMany({
      where,
      include: {
        contact: {
          include: { company: true },
        },
        outreach: {
          include: { campaign: true },
        },
      },
      orderBy: { receivedAt: "desc" },
      take: limit,
    });

    return Response.json(inboundEmails);
  } catch (error) {
    console.error("GET /api/inbound-emails error:", error);
    return Response.json(
      { error: "Failed to fetch inbound emails" },
      { status: 500 }
    );
  }
}
