import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const drafts = await prisma.email.findMany({
      where: { status: "draft" },
      include: {
        outreach: {
          include: {
            contact: {
              include: { company: true },
            },
            campaign: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(drafts);
  } catch (error) {
    console.error("GET /api/agent/suggestions error:", error);
    return Response.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
