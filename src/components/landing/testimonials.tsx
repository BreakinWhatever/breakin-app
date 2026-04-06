"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "BreakIn completely changed my job search. I went from sending 50 generic applications to landing 4 interviews in Private Credit in just 3 weeks.",
    name: "Thomas R.",
    role: "Analyst, Private Credit",
    school: "ESSEC Business School",
  },
  {
    quote:
      "The AI emails are incredibly well-written. I was skeptical at first, but the response rate speaks for itself — 25% reply rate on cold outreach.",
    name: "Sarah K.",
    role: "Associate, M&A Advisory",
    school: "HEC Paris",
  },
  {
    quote:
      "Finally a tool that understands finance recruiting. The pipeline view alone saved me hours of spreadsheet management every week.",
    name: "Marc D.",
    role: "Analyst, Leverage Finance",
    school: "Paris Dauphine",
  },
  {
    quote:
      "I used BreakIn to break into Private Equity after my internship. The follow-up automation is a game changer — no more dropped leads.",
    name: "Julie M.",
    role: "Junior Associate, PE",
    school: "EDHEC Business School",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" style={{ marginBottom: 160 }}>
      <div
        className="mx-auto"
        style={{ maxWidth: 1160, paddingLeft: 40, paddingRight: 40 }}
      >
        {/* Header — LEFT aligned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginBottom: 80 }}
        >
          <h2
            style={{
              fontSize: 48,
              fontWeight: 700,
              lineHeight: "48px",
              color: "#151619",
            }}
          >
            Finance professionals
            <br />
            are big fans of BreakIn.
          </h2>
        </motion.div>

        {/* 2x2 grid */}
        <div className="grid md:grid-cols-2" style={{ gap: 24 }}>
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 32,
                border: "1px solid #E1E2E5",
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "24px",
                  color: "#363940",
                  marginBottom: 24,
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center" style={{ gap: 12 }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "#F3F3F5",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#7F8491",
                    }}
                  >
                    {t.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#151619",
                    }}
                  >
                    {t.name}
                  </p>
                  <p style={{ fontSize: 12, color: "#7F8491" }}>
                    {t.role} · {t.school}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
