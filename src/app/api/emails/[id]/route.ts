import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const email = await prisma.email.findUnique({
      where: { id },
      include: {
        outreach: {
          include: {
            contact: { include: { company: true } },
            campaign: true,
          },
        },
      },
    });

    if (!email) {
      return Response.json({ error: "Email not found" }, { status: 404 });
    }

    return Response.json(email);
  } catch (error) {
    console.error("GET /api/emails/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch email" },
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
    if (body.sentAt) body.sentAt = new Date(body.sentAt);
    if (body.openedAt) body.openedAt = new Date(body.openedAt);
    if (body.repliedAt) body.repliedAt = new Date(body.repliedAt);

    const email = await prisma.email.update({
      where: { id },
      data: body,
    });

    return Response.json(email);
  } catch (error) {
    console.error("PUT /api/emails/[id] error:", error);
    return Response.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }
}
