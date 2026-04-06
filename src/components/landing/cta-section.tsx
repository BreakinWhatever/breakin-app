"use client";

import { motion } from "framer-motion";
import WaitlistForm from "@/components/landing/waitlist-form";
import { useLang } from "@/lib/lang-context";

const enContent = {
  heading: "Land 🤩 interviews in 📖 finance with a 🙈 simple and ⚡️ powerful tool",
  subtitle:
    "Join the finance professionals who stopped mass-applying and started getting responses.",
};

const frContent = {
  heading: "Décroche 🤩 des entretiens en 📖 finance avec un outil 🙈 simple et ⚡️ puissant",
  subtitle:
    "Rejoins les pros de la finance qui ont arrêté de postuler en masse et qui décrochent enfin des entretiens.",
};

export default function CtaSection() {
  const lang = useLang();
  const t = lang === "fr" ? frContent : enContent;

  return (
    <section id="cta" style={{ paddingBottom: 80 }}>
      <div
        className="mx-auto"
        style={{ maxWidth: 1160, paddingLeft: 40, paddingRight: 40 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2
            className="mx-auto"
            style={{
              fontSize: 48,
              fontWeight: 700,
              lineHeight: "48px",
              color: "#151619",
              maxWidth: 760,
              marginBottom: 24,
            }}
          >
            {t.heading}
          </h2>
          <p
            className="mx-auto"
            style={{
              fontSize: 20,
              fontWeight: 400,
              lineHeight: "32px",
              color: "#7F8491",
              maxWidth: 560,
            }}
          >
            {t.subtitle}
          </p>

          <div
            className="flex flex-col items-center"
            style={{ marginTop: 40, gap: 12 }}
          >
            <WaitlistForm />
            <span style={{ fontSize: 14, color: "#7F8491" }}>Free during beta</span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 mx-auto"
          style={{ marginTop: 80, gap: 32, maxWidth: 760 }}
        >
          {[
            { value: "20%+", label: "Reply rate" },
            { value: "3x", label: "More interviews" },
            { value: "10min", label: "Setup time" },
            { value: "€0", label: "During beta" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#151619",
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "#7F8491",
                  marginTop: 4,
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
