import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { createHmac } from "crypto";

const VPS_WEBHOOK = "http://46.225.210.206:9000/hooks/apply-offer";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

async function triggerVPSApply(offerId: string) {
  const payload = JSON.stringify({ offer_id: offerId });
  const sig = createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  await fetch(VPS_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": `sha256=${sig}`,
    },
    body: payload,
  }).catch(() => {}); // never throw
}

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

    const updated = await prisma.jobOffer.update({
      where: { id },
      data: { status: "apply_requested" },
    });

    // Trigger VPS agent directly — agent handles all Telegram notifications
    await triggerVPSApply(id);

    return Response.json(updated);
  } catch (error) {
    console.error("POST /api/offers/[id]/apply error:", error);
    return Response.json({ error: "Failed to trigger apply" }, { status: 500 });
  }
}
