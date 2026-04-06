"use client";

import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import LogoBar from "@/components/landing/logo-bar";
import Features from "@/components/landing/features";
import PipelineSection from "@/components/landing/pipeline-section";
import HowItWorks from "@/components/landing/how-it-works";
import Testimonials from "@/components/landing/testimonials";
import CtaSection from "@/components/landing/cta-section";
import Footer from "@/components/landing/footer";
import { LangContext, Lang } from "@/lib/lang-context";

interface LandingClientProps {
  lang?: Lang;
}

export default function LandingClient({ lang = "en" }: LandingClientProps) {
  return (
    <LangContext.Provider value={lang}>
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        style={{ backgroundColor: "#fff" }}
      >
        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }
        `}</style>

        <Navbar />

        <main>
          <Hero />
          <LogoBar />
          <Features />
          <PipelineSection />
          <HowItWorks />
          <Testimonials />
          <CtaSection />
        </main>

        <Footer />
      </div>
    </LangContext.Provider>
  );
}
