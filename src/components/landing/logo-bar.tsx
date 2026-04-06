"use client";

import { motion } from "framer-motion";

const logos = [
  "Goldman Sachs",
  "Rothschild & Co",
  "Lazard",
  "Ardian",
  "Tikehau Capital",
  "Macquarie",
];

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
          style={{ gap: "16px 48px" }}
        >
          {logos.map((name) => (
            <span
              key={name}
              className="select-none"
              style={{
                color: "rgba(21, 22, 25, 0.2)",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.02em",
              }}
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
