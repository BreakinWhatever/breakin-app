"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useLang } from "@/lib/lang-context";

const companies = [
  { name: "Goldman Sachs", domain: "goldmansachs.com" },
  { name: "Morgan Stanley", domain: "morganstanley.com" },
  { name: "JPMorgan", domain: "jpmorgan.com" },
  { name: "Rothschild & Co", domain: "rothschildandco.com" },
  { name: "Lazard", domain: "lazard.com" },
  { name: "BNP Paribas", domain: "bnpparibas.com" },
  { name: "Société Générale", domain: "societegenerale.com" },
  { name: "Natixis", domain: "natixis.com" },
  { name: "Ardian", domain: "ardian.com" },
  { name: "Tikehau Capital", domain: "tikehaucapital.com" },
  { name: "Eurazeo", domain: "eurazeo.com" },
  { name: "KKR", domain: "kkr.com" },
  { name: "Blackstone", domain: "blackstone.com" },
  { name: "Carlyle", domain: "carlyle.com" },
  { name: "PAI Partners", domain: "paipartners.com" },
  { name: "Macquarie", domain: "macquarie.com" },
  { name: "Amundi", domain: "amundi.com" },
  { name: "AXA IM", domain: "axa-im.fr" },
  { name: "ING", domain: "ing.com" },
  { name: "HSBC", domain: "hsbc.com" },
  { name: "Deutsche Bank", domain: "db.com" },
  { name: "Cinven", domain: "cinven.com" },
];

// Duplicate list for seamless infinite loop
const track = [...companies, ...companies];

function Logo({ name, domain }: { name: string; domain: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="select-none"
        style={{
          color: "rgba(21, 22, 25, 0.25)",
          fontWeight: 700,
          fontSize: 14,
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
      src={`/api/logo?domain=${domain}`}
      alt={name}
      style={{
        height: 28,
        width: "auto",
        maxWidth: 120,
        filter: "grayscale(100%)",
        opacity: 0.4,
        display: "block",
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
    />
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
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 40s linear infinite;
        }
        .marquee-track:hover {
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
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        style={{ overflow: "hidden", position: "relative" }}
      >
        {/* Fade edges */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 100,
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
            width: 100,
            zIndex: 2,
            background: "linear-gradient(to left, #fff 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="marquee-track"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 64,
            width: "max-content",
          }}
        >
          {track.map((company, i) => (
            <Logo key={`${company.domain}-${i}`} name={company.name} domain={company.domain} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
