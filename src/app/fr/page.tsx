import type { Metadata } from "next";
import LandingClient from "@/app/landing/landing-client";

export const metadata: Metadata = {
  title: "BreakIn — Décrochez des entretiens en finance",
  description:
    "La façon intelligente de décrocher des entretiens. Trouvez les décideurs, rédigez des cold emails percutants, et trackez chaque opportunité jusqu'à l'entretien.",
};

export default function FRLandingPage() {
  return <LandingClient lang="fr" />;
}
