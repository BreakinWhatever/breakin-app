"use client";

import { motion } from "framer-motion";
import { useLang } from "@/lib/lang-context";

const companies = [
  "Goldman Sachs",
  "Morgan Stanley",
  "JPMorgan",
  "Rothschild & Co",
  "Lazard",
  "BNP Paribas",
  "Société Générale",
  "Natixis",
  "Crédit Agricole CIB",
  "Ardian",
  "Tikehau Capital",
  "Eurazeo",
  "KKR",
  "Blackstone",
  "Carlyle",
  "PAI Partners",
  "Cinven",
  "BC Partners",
  "Macquarie",
  "Amundi",
  "AXA IM",
  "ING",
  "HSBC",
  "Deutsche Bank",
  "Antin",
  "Pemberton",
];

// Duplicate for seamless infinite loop
const track = [...companies, ...companies];

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
          animation: marquee 35s linear infinite;
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

      {/* Marquee container — overflow hidden, full bleed */}
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

        {/* Scrolling track */}
        <div
          className="marquee-track"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 64,
            width: "max-content",
          }}
        >
          {track.map((name, i) => (
            <span
              key={i}
              className="select-none"
              style={{
                color: "rgba(21, 22, 25, 0.22)",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
