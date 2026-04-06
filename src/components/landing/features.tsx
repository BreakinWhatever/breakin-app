"use client";

import { motion } from "framer-motion";
import { useLang } from "@/lib/lang-context";

const enContent = {
  heading: "Built for ⚡️speed and precision",
  subheading:
    "We designed BreakIn for finance professionals who value efficiency, precision, and results. No noise, just interviews.",
  features: [
    {
      emoji: "🎯",
      title: "Smart Contact Discovery",
      description:
        "Find decision-makers at your target firms. BreakIn connects to Apollo.io to source the right contacts — the ones who actually hire.",
      details: [
        "Filter by role, city, and sector",
        "Auto-import to your pipeline",
        "Private Credit, M&A, Debt Advisory coverage",
      ],
    },
    {
      emoji: "🤖",
      title: "AI-Powered Cold Emails",
      description:
        "Generate personalized, professional cold emails that get responses. In French or English, adapted to each contact's profile.",
      details: [
        "Personalized to each contact",
        "French & English support",
        "Professional finance tone",
      ],
    },
    {
      emoji: "⚡️",
      title: "Automated Follow-ups",
      description:
        "Never let a lead go cold. BreakIn tracks who hasn't replied and drafts smart follow-ups at the right time.",
      details: [
        "Smart follow-up timing",
        "Draft review before sending",
        "Multi-step sequences",
      ],
    },
  ],
};

const frContent = {
  heading: "Conçu pour ⚡️la vitesse et la précision",
  subheading:
    "BreakIn a été pensé pour les pros de la finance qui veulent de l'efficacité et des résultats. Pas de bruit, juste des entretiens.",
  features: [
    {
      emoji: "🎯",
      title: "Smart Contact Discovery",
      description:
        "Trouvez les décideurs dans vos boîtes cibles. BreakIn se connecte à Apollo.io pour sourcer les bons contacts — ceux qui recrutent vraiment.",
      details: [
        "Filtre par rôle, ville et secteur",
        "Import automatique dans votre pipeline",
        "Private Credit, M&A, Debt Advisory",
      ],
    },
    {
      emoji: "🤖",
      title: "AI-Powered Cold Emails",
      description:
        "Générez des cold emails personnalisés et professionnels qui obtiennent des réponses. En français ou en anglais, adaptés à chaque contact.",
      details: [
        "Personnalisé pour chaque contact",
        "Support français & anglais",
        "Ton finance professionnel",
      ],
    },
    {
      emoji: "⚡️",
      title: "Automated Follow-ups",
      description:
        "Ne laissez plus un lead refroidir. BreakIn suit qui n'a pas répondu et rédige des follow-ups intelligents au bon moment.",
      details: [
        "Timing optimal de relance",
        "Validation du draft avant envoi",
        "Séquences multi-étapes",
      ],
    },
  ],
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  const lang = useLang();
  const t = lang === "fr" ? frContent : enContent;

  return (
    <section id="features" style={{ marginBottom: 160 }}>
      <div
        className="mx-auto"
        style={{ maxWidth: 1160, paddingLeft: 40, paddingRight: 40 }}
      >
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
          style={{ marginBottom: 80 }}
        >
          <h2
            className="text-center mx-auto"
            style={{
              fontSize: 48,
              fontWeight: 700,
              lineHeight: "48px",
              color: "#151619",
              maxWidth: 600,
              marginBottom: 16,
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
              maxWidth: 600,
            }}
          >
            {t.subheading}
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3"
          style={{ gap: 24 }}
        >
          {t.features.map((feature) => (
            <motion.div
              key={feature.title + feature.description}
              variants={cardVariants}
              className="group transition-all hover:border-[#151619]/20 hover:shadow-lg hover:shadow-[#151619]/5 hover:-translate-y-1"
              style={{
                backgroundColor: "#fff",
                border: "1px solid #E1E2E5",
                borderRadius: 20,
                padding: 32,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>
                {feature.emoji}
              </div>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#151619",
                  marginBottom: 12,
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "24px",
                  color: "#7F8491",
                  marginBottom: 24,
                }}
              >
                {feature.description}
              </p>

              <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {feature.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex items-center"
                    style={{
                      gap: 8,
                      fontSize: 14,
                      color: "#363940",
                    }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        backgroundColor: "#0560FD",
                        flexShrink: 0,
                      }}
                    />
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
