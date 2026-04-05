import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerId, language } = body;

    let company = "Entreprise";
    let role = "Poste";

    if (offerId) {
      const offer = await prisma.jobOffer.findUnique({
        where: { id: offerId },
      });
      if (offer) {
        company = offer.company;
        role = offer.title;
      }
    }

    return Response.json({
      title: `LM - ${company} - ${role}`,
      body: "Generation placeholder — the agent will fill this in.",
      language: language ?? "fr",
    });
  } catch (error) {
    console.error("POST /api/cover-letters/generate error:", error);
    return Response.json(
      { error: "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}
