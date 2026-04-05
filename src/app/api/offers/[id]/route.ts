import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const offer = await prisma.jobOffer.findUnique({
      where: { id },
    });

    if (!offer) {
      return Response.json({ error: "Offer not found" }, { status: 404 });
    }

    return Response.json(offer);
  } catch (error) {
    console.error("GET /api/offers/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch offer" },
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

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.matchScore !== undefined) data.matchScore = body.matchScore;
    if (body.matchAnalysis !== undefined) data.matchAnalysis = body.matchAnalysis;
    if (body.companyId !== undefined) data.companyId = body.companyId;
    if (body.contractType !== undefined) data.contractType = body.contractType;

    const offer = await prisma.jobOffer.update({
      where: { id },
      data,
    });

    return Response.json(offer);
  } catch (error) {
    console.error("PUT /api/offers/[id] error:", error);
    return Response.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}
