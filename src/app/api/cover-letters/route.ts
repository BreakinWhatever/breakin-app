import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const coverLetters = await prisma.coverLetter.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    });

    return Response.json(coverLetters);
  } catch (error) {
    console.error("GET /api/cover-letters error:", error);
    return Response.json(
      { error: "Failed to fetch cover letters" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, body: letterBody } = body;
    if (!title || !letterBody) {
      return Response.json(
        { error: "title and body are required" },
        { status: 400 }
      );
    }

    const coverLetter = await prisma.coverLetter.create({
      data: {
        title,
        body: letterBody,
        language: body.language ?? "fr",
        offerId: body.offerId ?? null,
      },
    });

    return Response.json(coverLetter, { status: 201 });
  } catch (error) {
    console.error("POST /api/cover-letters error:", error);
    return Response.json(
      { error: "Failed to create cover letter" },
      { status: 500 }
    );
  }
}
