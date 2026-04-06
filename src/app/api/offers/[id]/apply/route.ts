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

    // Detect language from title + description
    const text = `${offer.title} ${offer.description}`.toLowerCase();
    const isEnglish =
      (text.match(/\b(the|and|for|with|our|you|will|have|this|that)\b/g) || []).length >
      (text.match(/\b(le|la|les|et|pour|avec|notre|vous|sera|avez|cette)\b/g) || []).length;

    const profile = isEnglish
      ? "applications@ousmanethienta.com | CV EN"
      : "candidatures@ousmanethienta.com | CV FR";

    const score = offer.matchScore ? ` | Score: <b>${offer.matchScore}/100</b>` : "";
    const city = `${offer.city}, ${offer.country}`;

    // Telegram: start notification
    await sendTelegram(
      `🚀 <b>Candidature lancée</b>\n` +
      `<b>${offer.title}</b> @ ${offer.company}\n` +
      `📍 ${city}${score}\n` +
      `📧 ${profile}\n` +
      `🔗 <a href="${offer.url}">Voir l'offre</a>`
    );

    return Response.json(updated);
  } catch (error) {
    console.error("POST /api/offers/[id]/apply error:", error);
    return Response.json({ error: "Failed to trigger apply" }, { status: 500 });
  }
}
