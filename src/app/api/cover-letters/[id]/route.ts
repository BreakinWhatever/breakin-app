import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.body !== undefined) data.body = body.body;
    if (body.language !== undefined) data.language = body.language;

    const coverLetter = await prisma.coverLetter.update({
      where: { id },
      data,
    });

    return Response.json(coverLetter);
  } catch (error) {
    console.error("PUT /api/cover-letters/[id] error:", error);
    return Response.json(
      { error: "Failed to update cover letter" },
      { status: 500 }
    );
  }
}
