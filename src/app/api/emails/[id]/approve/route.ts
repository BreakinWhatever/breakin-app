import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const email = await prisma.email.findUnique({
      where: { id },
    });

    if (!email) {
      return Response.json({ error: "Email not found" }, { status: 404 });
    }

    const updated = await prisma.email.update({
      where: { id },
      data: { status: "approved" },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("POST /api/emails/[id]/approve error:", error);
    return Response.json(
      { error: "Failed to approve email" },
      { status: 500 }
    );
  }
}
