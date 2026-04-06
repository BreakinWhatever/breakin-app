"use client";

import { motion } from "framer-motion";

const steps = [
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
];

export default function HowItWorks() {
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
            What is BreakIn?
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
            Cold emailing is the most effective way to land interviews in
            finance.{" "}
            <span style={{ color: "#151619", fontWeight: 500 }}>
              BreakIn automates the entire process.
            </span>
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3" style={{ gap: 32 }}>
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
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
                  style={{ gap: 12, marginBottom: 16 }}
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
              Without BreakIn
            </p>
            <ul
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {[
                "Hours spent on LinkedIn searching for contacts",
                "Copy-pasting the same generic email template",
                "Forgetting to follow up",
                "No idea who opened your email",
                "Spreadsheet chaos",
              ].map((item) => (
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
              With BreakIn
            </p>
            <ul
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {[
                "Find contacts in seconds with Apollo.io",
                "AI writes personalized emails for each person",
                "Automated follow-up sequences",
                "Full pipeline visibility: who replied, who didn't",
                "One dashboard to rule them all",
              ].map((item) => (
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
