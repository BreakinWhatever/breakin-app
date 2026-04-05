import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { score, analysis } = body;
    if (score === undefined || analysis === undefined) {
      return Response.json(
        { error: "score and analysis are required" },
        { status: 400 }
      );
    }

    const offer = await prisma.jobOffer.update({
      where: { id },
      data: {
        matchScore: score,
        matchAnalysis: analysis,
      },
    });

    return Response.json(offer);
  } catch (error) {
    console.error("POST /api/offers/[id]/score error:", error);
    return Response.json(
      { error: "Failed to score offer" },
      { status: 500 }
    );
  }
}
