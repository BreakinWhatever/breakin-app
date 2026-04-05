import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type"); // "daily" or "weekly"
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const recaps = await prisma.recap.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return Response.json(recaps);
  } catch (error) {
    console.error("GET /api/recaps error:", error);
    return Response.json(
      { error: "Failed to fetch recaps" },
      { status: 500 }
    );
  }
}
