import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recap = await prisma.recap.findUnique({
      where: { id },
    });

    if (!recap) {
      return Response.json({ error: "Recap not found" }, { status: 404 });
    }

    return Response.json(recap);
  } catch (error) {
    console.error("GET /api/recaps/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch recap" },
      { status: 500 }
    );
  }
}
