import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const city = searchParams.get("city");
    const contractType = searchParams.get("contractType");
    const source = searchParams.get("source");
    const status = searchParams.get("status");
    const minScore = searchParams.get("minScore");
    const search = searchParams.get("search");
    const companyId = searchParams.get("companyId");

    const where: Record<string, unknown> = {};
    if (city) where.city = city;
    if (contractType) where.contractType = contractType;
    if (source) where.source = source;
    if (status) where.status = status;
    if (companyId) where.companyId = companyId;
    if (minScore) where.matchScore = { gte: parseInt(minScore, 10) };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    const offers = await prisma.jobOffer.findMany({
      where,
      orderBy: [
        { matchScore: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
    });

    return Response.json(offers);
  } catch (error) {
    console.error("GET /api/offers error:", error);
    return Response.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}
