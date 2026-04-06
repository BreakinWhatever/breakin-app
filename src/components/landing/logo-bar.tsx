"use client";

import { motion } from "framer-motion";
import { useState } from "react";

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
  { name: "AXA IM", domain: "axa-im.com" },
  { name: "ING", domain: "ing.com" },
  { name: "HSBC", domain: "hsbc.com" },
  { name: "Deutsche Bank", domain: "db.com" },
  { name: "Antin", domain: "antin-ip.com" },
];

function CompanyLogo({ name, domain }: { name: string; domain: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="select-none"
        style={{
          color: "rgba(21, 22, 25, 0.25)",
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={name}
      height={28}
      style={{
        height: 28,
        width: "auto",
        maxWidth: 120,
        filter: "grayscale(100%)",
        opacity: 0.35,
        display: "block",
      }}
      onError={() => setFailed(true)}
    />
  );
}

export default function LogoBar() {
  return (
    <section style={{ marginBottom: 160 }}>
      <div
        className="mx-auto"
        style={{ maxWidth: 1160, paddingLeft: 40, paddingRight: 40 }}
      >
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
          Targeting the most prestigious firms worldwide
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-center"
          style={{ gap: "16px 40px" }}
        >
          {companies.map((company) => (
            <CompanyLogo
              key={company.domain}
              name={company.name}
              domain={company.domain}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
