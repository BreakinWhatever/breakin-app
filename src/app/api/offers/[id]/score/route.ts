import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { matchScore, matchAnalysis } = body ?? {};

    if (typeof matchScore !== "number" && typeof matchAnalysis !== "string") {
      return Response.json(
        { error: "Provide matchScore (number) and/or matchAnalysis (string)" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (typeof matchScore === "number") data.matchScore = Math.round(matchScore);
    if (typeof matchAnalysis === "string") data.matchAnalysis = matchAnalysis;

    const offer = await prisma.jobOffer.update({ where: { id }, data });
    return Response.json(offer);
  } catch (error) {
    console.error("POST /api/offers/[id]/score error:", error);
    return Response.json(
      { error: "Failed to update score" },
      { status: 500 }
    );
  }
}

