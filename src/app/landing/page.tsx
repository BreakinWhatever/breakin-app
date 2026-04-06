import type { Metadata } from "next";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "BreakIn — Land Interviews in Finance with Cold Emailing",
  description:
    "The smarter way to land interviews. Find decision-makers, write AI-powered cold emails, and track every opportunity until you get the interview.",
};

export default function LandingPage() {
  return <LandingClient />;
}
