"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useLang } from "@/lib/lang-context";

// Row 1 → gauche : bulge bracket + boutiques
const row1 = [
  { name: "Goldman Sachs", domain: "goldmansachs.com" },
  { name: "Morgan Stanley", domain: "morganstanley.com" },
  { name: "JPMorgan", domain: "jpmorgan.com" },
  { name: "Rothschild & Co", domain: "rothschildandco.com" },
  { name: "Lazard", domain: "lazard.com" },
  { name: "BNP Paribas", domain: "bnpparibas.com" },
  { name: "Société Générale", domain: "societegenerale.com" },
  { name: "Natixis", domain: "natixis.com" },
  { name: "Deutsche Bank", domain: "db.com" },
  { name: "HSBC", domain: "hsbc.com" },
  { name: "Barclays", domain: "barclays.com" },
  { name: "Crédit Agricole CIB", domain: "ca-cib.com" },
];

// Row 2 ← droite : PE + Private Credit + infra
const row2 = [
  { name: "Ardian", domain: "ardian.com" },
  { name: "Tikehau Capital", domain: "tikehaucapital.com" },
  { name: "Eurazeo", domain: "eurazeo.com" },
  { name: "KKR", domain: "kkr.com" },
  { name: "Blackstone", domain: "blackstone.com" },
  { name: "Carlyle", domain: "carlyle.com" },
  { name: "PAI Partners", domain: "paipartners.com" },
  { name: "Cinven", domain: "cinven.com" },
  { name: "Macquarie", domain: "macquarie.com" },
  { name: "Antin", domain: "antin-ip.com" },
  { name: "Amundi", domain: "amundi.com" },
  { name: "AXA IM", domain: "axa-im.fr" },
  { name: "ING", domain: "ing.com" },
  { name: "Apollo", domain: "apollo.com" },
  { name: "Ares Management", domain: "aresmgmt.com" },
];

function Logo({ name, domain }: { name: string; domain: string }) {
  const [failed, setFailed] = useState(false);
  const token = process.env.NEXT_PUBLIC_LOGODEV_TOKEN;

  if (failed || !token) {
    return (
      <span
        className="select-none"
        style={{
          color: "rgba(21, 22, 25, 0.7)",
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: "-0.02em",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://img.logo.dev/${domain}?token=${token}&size=80`}
      alt={name}
      style={{
        height: 52,
        width: "auto",
        maxWidth: 200,
        display: "block",
        flexShrink: 0,
        filter: "grayscale(40%)",
        opacity: 0.75,
      }}
      onError={() => setFailed(true)}
    />
  );
}

function MarqueeRow({
  companies,
  direction,
  duration,
}: {
  companies: typeof row1;
  direction: "left" | "right";
  duration: number;
}) {
  const track = [...companies, ...companies, ...companies];
  const animName = direction === "left" ? "marquee-left" : "marquee-right";

  return (
    <div style={{ overflow: "hidden", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 80,
          zIndex: 2,
          background: "linear-gradient(to right, #fff 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 80,
          zIndex: 2,
          background: "linear-gradient(to left, #fff 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        className={animName}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 48,
          width: "max-content",
          animationDuration: `${duration}s`,
        }}
      >
        {track.map((company, i) => (
          <div key={`${company.domain}-${i}`} style={{ flexShrink: 0 }}>
            <Logo name={company.name} domain={company.domain} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LogoBar() {
  const lang = useLang();
  const label =
    lang === "fr"
      ? "Les meilleures boîtes de finance, dans votre pipeline"
      : "Targeting the most prestigious firms worldwide";

  return (
    <section style={{ marginBottom: 160 }}>
      <style>{`
        @keyframes scroll-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes scroll-right {
          0%   { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }
        .marquee-left {
          animation: scroll-left linear infinite;
        }
        .marquee-right {
          animation: scroll-right linear infinite;
        }
        .marquee-left:hover,
        .marquee-right:hover {
          animation-play-state: paused;
        }
      `}</style>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center"
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#7F8491",
          marginBottom: 32,
        }}
      >
        {label}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <MarqueeRow companies={row1} direction="left" duration={40} />
        <MarqueeRow companies={row2} direction="right" duration={35} />
      </motion.div>
    </section>
  );
}
