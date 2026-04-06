import { prisma } from "@/lib/db";
import { sendTelegram } from "@/lib/telegram";
import { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const offer = await prisma.jobOffer.findUnique({ where: { id } });
    if (!offer) {
      return Response.json({ error: "Offer not found" }, { status: 404 });
    }

    if (offer.status === "applied") {
      return Response.json({ error: "Already applied" }, { status: 409 });
    }

    // Update status
    const updated = await prisma.jobOffer.update({
      where: { id },
      data: { status: "apply_requested" },
    });

    // Wake up the VPS agent — it handles everything from here
    // (start notification, dev-browser, end notification)
    await sendTelegram(`postule à cette offre ${offer.id}`);

    return Response.json(updated);
  } catch (error) {
    console.error("POST /api/offers/[id]/apply error:", error);
    return Response.json({ error: "Failed to trigger apply" }, { status: 500 });
  }
}
