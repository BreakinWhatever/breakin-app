"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section style={{ marginBottom: 160 }}>
      <div
        className="mx-auto"
        style={{ maxWidth: 1160, paddingLeft: 40, paddingRight: 40 }}
      >
        <div style={{ paddingTop: 80 }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
            style={{ marginBottom: 40 }}
          >
            <a
              href="#features"
              className="inline-flex items-center transition-[border-color] duration-300 ease-in-out hover:border-[#151619]"
              style={{
                gap: 8,
                padding: "4px 8px",
                borderRadius: 12,
                border: "1px solid #C8CAD0",
                fontSize: 14,
                fontWeight: 600,
                color: "#363940",
                backgroundColor: "transparent",
              }}
            >
              Your unfair advantage in finance recruiting
              <ArrowRight size={14} />
            </a>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center"
            style={{
              fontSize: 80,
              fontWeight: 700,
              lineHeight: "72px",
              color: "#151619",
              marginBottom: 40,
            }}
          >
            The smarter way to
            <br />
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#0560FD",
                color: "#fff",
                borderRadius: 20,
                padding: "8px 12px",
                marginTop: 8,
                fontSize: 64,
                transform: "rotate(-2deg)",
              }}
            >
              ✨ land interviews
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mx-auto"
            style={{
              fontSize: 24,
              fontWeight: 500,
              lineHeight: "32px",
              color: "#151619",
              maxWidth: 760,
              marginBottom: 16,
            }}
          >
            Say goodbye to mass applications and job boards. Use BreakIn to find
            decision-makers, write the perfect cold email, and track every
            opportunity until you get the interview.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center"
            style={{ marginTop: 40 }}
          >
            <a
              href="#cta"
              className="inline-flex items-center justify-center transition-colors hover:bg-[#151619]"
              style={{
                fontSize: 20,
                fontWeight: 700,
                backgroundColor: "#25272D",
                color: "#F3F3F5",
                padding: "0 16px",
                borderRadius: 8,
                height: 50,
              }}
            >
              Get early access
            </a>
          </motion.div>

          {/* Browser mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative"
            style={{ marginTop: 80 }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center"
              style={{
                backgroundColor: "#F3F3F5",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                border: "1px solid #E1E2E5",
                borderBottom: "none",
                padding: "12px 16px",
                gap: 8,
              }}
            >
              <div className="flex" style={{ gap: 6 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: "#E1E2E5",
                  }}
                />
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: "#E1E2E5",
                  }}
                />
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: "#E1E2E5",
                  }}
                />
              </div>
              <div className="flex-1 flex justify-center">
                <div
                  className="text-center"
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 6,
                    padding: "4px 16px",
                    fontSize: 12,
                    color: "#7F8491",
                    border: "1px solid #E1E2E5",
                    minWidth: 200,
                  }}
                >
                  app.breakin.io
                </div>
              </div>
            </div>

            {/* Dashboard mockup content */}
            <div
              style={{
                backgroundColor: "#fff",
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
                border: "1px solid #E1E2E5",
                borderTop: "none",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: 32 }}>
                {/* Metrics bar */}
                <div
                  className="grid grid-cols-2 md:grid-cols-4"
                  style={{ gap: 16, marginBottom: 32 }}
                >
                  {[
                    { label: "Contacts", value: "247", change: "+12 this week" },
                    {
                      label: "Emails sent",
                      value: "183",
                      change: "74% open rate",
                    },
                    {
                      label: "Replies",
                      value: "38",
                      change: "20.7% reply rate",
                    },
                    {
                      label: "Interviews",
                      value: "12",
                      change: "6 scheduled",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        backgroundColor: "#F3F3F5",
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          color: "#7F8491",
                          fontWeight: 500,
                        }}
                      >
                        {stat.label}
                      </p>
                      <p
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: "#151619",
                          marginTop: 4,
                        }}
                      >
                        {stat.value}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#059669",
                          marginTop: 4,
                        }}
                      >
                        {stat.change}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pipeline columns */}
                <div className="flex overflow-hidden" style={{ gap: 12 }}>
                  {[
                    { stage: "Identified", count: 85, color: "#E1E2E5" },
                    { stage: "Contacted", count: 64, color: "#0560FD" },
                    { stage: "Replied", count: 38, color: "#E38800" },
                    { stage: "Interview", count: 12, color: "#059669" },
                    { stage: "Offer", count: 3, color: "#DC2626" },
                  ].map((stage) => (
                    <div key={stage.stage} className="flex-1 min-w-0">
                      <div
                        className="flex items-center"
                        style={{ gap: 8, marginBottom: 8 }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: stage.color,
                          }}
                        />
                        <span
                          className="truncate"
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#363940",
                          }}
                        >
                          {stage.stage}
                        </span>
                        <span
                          className="ml-auto"
                          style={{ fontSize: 12, color: "#7F8491" }}
                        >
                          {stage.count}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {Array.from({
                          length: Math.min(3, Math.ceil(stage.count / 25)),
                        }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              backgroundColor: "#F3F3F5",
                              borderRadius: 8,
                              padding: 10,
                              border: "1px solid #E1E2E5",
                            }}
                          >
                            <div
                              style={{
                                height: 8,
                                backgroundColor: "#E1E2E5",
                                borderRadius: 4,
                                width: "75%",
                                marginBottom: 6,
                              }}
                            />
                            <div
                              style={{
                                height: 6,
                                backgroundColor: "#E1E2E5",
                                opacity: 0.6,
                                borderRadius: 4,
                                width: "50%",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fade-bottom gradient */}
            <div
              className="absolute left-0 right-0 bottom-0 pointer-events-none"
              style={{
                height: 160,
                background:
                  "linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
