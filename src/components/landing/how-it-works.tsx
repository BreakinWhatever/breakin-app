"use client";

import { motion } from "framer-motion";
import { useLang } from "@/lib/lang-context";

const enContent = {
  heading: "What is BreakIn?",
  subheading:
    "Cold emailing is the most effective way to land interviews in finance.",
  subheadingHighlight: "BreakIn automates the entire process.",
  steps: [
    {
      number: "01",
      title: "Source contacts",
      description:
        "Search Apollo.io for decision-makers at your target firms. Filter by role, city, and sector. Import them to your pipeline in one click.",
      emoji: "🔍",
    },
    {
      number: "02",
      title: "AI writes your emails",
      description:
        "BreakIn's AI drafts personalized cold emails for each contact. Review, tweak if needed, and approve. French or English, always professional.",
      emoji: "✍️",
    },
    {
      number: "03",
      title: "Track & follow up",
      description:
        "Monitor opens and replies. When someone doesn't respond, the AI drafts a smart follow-up. Keep going until you land the interview.",
      emoji: "📈",
    },
  ],
  withoutLabel: "Without BreakIn",
  withLabel: "With BreakIn",
  withoutItems: [
    "Hours spent on LinkedIn searching for contacts",
    "Copy-pasting the same generic email template",
    "Forgetting to follow up",
    "No idea who opened your email",
    "Spreadsheet chaos",
  ],
  withItems: [
    "Find contacts in seconds with Apollo.io",
    "AI writes personalized emails for each person",
    "Automated follow-up sequences",
    "Full pipeline visibility: who replied, who didn't",
    "One dashboard to rule them all",
  ],
};

const frContent = {
  heading: "C'est quoi BreakIn ?",
  subheading:
    "Le cold emailing est la méthode la plus efficace pour décrocher des entretiens en finance.",
  subheadingHighlight: "BreakIn automatise tout le process.",
  steps: [
    {
      number: "01",
      title: "Sourcez vos contacts",
      description:
        "Cherchez sur Apollo.io les décideurs de vos boîtes cibles. Filtrez par rôle, ville et secteur. Importez-les dans votre pipeline en un clic.",
      emoji: "🔍",
    },
    {
      number: "02",
      title: "L'IA rédige vos emails",
      description:
        "BreakIn rédige des cold emails personnalisés pour chaque contact. Relisez, ajustez si besoin, et validez. En français ou en anglais, toujours professionnel.",
      emoji: "✍️",
    },
    {
      number: "03",
      title: "Trackez & relancez",
      description:
        "Suivez les ouvertures et les réponses. Quand quelqu'un ne répond pas, l'IA rédige un follow-up intelligent. Continuez jusqu'à décrocher l'entretien.",
      emoji: "📈",
    },
  ],
  withoutLabel: "Sans BreakIn",
  withLabel: "Avec BreakIn",
  withoutItems: [
    "Des heures sur LinkedIn à chercher des contacts",
    "Copier-coller le même template générique",
    "Oublier de relancer",
    "Aucune idée de qui a ouvert votre email",
    "Chaos de spreadsheets",
  ],
  withItems: [
    "Trouvez des contacts en quelques secondes avec Apollo.io",
    "L'IA rédige des emails personnalisés pour chaque contact",
    "Séquences de follow-up automatisées",
    "Visibilité totale sur le pipeline : qui a répondu, qui n'a pas répondu",
    "Un seul dashboard pour tout gérer",
  ],
};

export default function HowItWorks() {
  const lang = useLang();
  const t = lang === "fr" ? frContent : enContent;

  return (
    <section id="how-it-works" style={{ marginBottom: 160 }}>
      <div
        className="mx-auto"
        style={{ maxWidth: 1160, paddingLeft: 40, paddingRight: 40 }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
          style={{ marginBottom: 80 }}
        >
          <h2
            className="text-center"
            style={{
              fontSize: 48,
              fontWeight: 700,
              lineHeight: "48px",
              color: "#151619",
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
              maxWidth: 640,
            }}
          >
            {t.subheading}{" "}
            <span style={{ color: "#151619", fontWeight: 500 }}>
              {t.subheadingHighlight}
            </span>
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3" style={{ gap: 32 }}>
          {t.steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {i < t.steps.length - 1 && (
                <div
                  className="hidden md:block absolute"
                  style={{
                    top: 32,
                    left: "100%",
                    width: "100%",
                    height: 1,
                    backgroundColor: "#E1E2E5",
                    transform: "translateX(-50%)",
                    zIndex: 0,
                  }}
                />
              )}

              <div className="relative" style={{ zIndex: 1 }}>
                <div
                  className="flex items-center"
                  style={{ gap: 12, marginBottom: 16, backgroundColor: "#fff", position: "relative", zIndex: 2, paddingRight: 12, width: "fit-content" }}
                >
                  <span style={{ fontSize: 32 }}>{step.emoji}</span>
                  <span
                    style={{
                      color: "#E1E2E5",
                      fontWeight: 700,
                      fontSize: 48,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {step.number}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#151619",
                    marginBottom: 8,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: "24px",
                    color: "#7F8491",
                  }}
                >
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2"
          style={{ marginTop: 80, gap: 24 }}
        >
          {/* Without BreakIn */}
          <div
            style={{
              border: "1px solid #E1E2E5",
              borderRadius: 20,
              padding: 32,
              backgroundColor: "#fff",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#7F8491",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 16,
              }}
            >
              {t.withoutLabel}
            </p>
            <ul
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {t.withoutItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start"
                  style={{
                    gap: 8,
                    fontSize: 14,
                    color: "#7F8491",
                  }}
                >
                  <span style={{ color: "#DC2626", marginTop: 2 }}>
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* With BreakIn */}
          <div
            style={{
              border: "1px solid #151619",
              borderRadius: 20,
              padding: 32,
              backgroundColor: "#151619",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#7F8491",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 16,
              }}
            >
              {t.withLabel}
            </p>
            <ul
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {t.withItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start"
                  style={{
                    gap: 8,
                    fontSize: 14,
                    color: "#F3F3F5",
                  }}
                >
                  <span style={{ color: "#059669", marginTop: 2 }}>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
