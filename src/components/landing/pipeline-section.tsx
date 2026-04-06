"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TabId = "pipeline" | "emails";

interface TabData {
  id: TabId;
  emoji: string;
  label: string;
  title: string;
  description: string;
}

const tabsData: TabData[] = [
  {
    id: "pipeline",
    emoji: "👀",
    label: "Pipeline",
    title: "Keep 👀 track of every opportunity",
    description:
      "Your entire job search in one view. See who you've contacted, who replied, and what's next — from first email to signed offer.",
  },
  {
    id: "emails",
    emoji: "✉️",
    label: "Emails",
    title: "Let AI ✉️ write your outreach",
    description:
      "Stop spending hours crafting emails. BreakIn generates personalized cold emails in French or English, tailored to each contact.",
  },
];

function PipelineMockup() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="flex" style={{ gap: 8 }}>
        {[
          { label: "Identified", count: 23, color: "#E1E2E5" },
          { label: "Contacted", count: 15, color: "#0560FD" },
          { label: "Replied", count: 8, color: "#E38800" },
          { label: "Interview", count: 4, color: "#059669" },
        ].map((col) => (
          <div key={col.label} className="flex-1">
            <div
              className="flex items-center"
              style={{ gap: 6, marginBottom: 8 }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: col.color,
                }}
              />
              <span
                style={{ fontSize: 11, fontWeight: 600, color: "#363940" }}
              >
                {col.label}
              </span>
              <span
                className="ml-auto"
                style={{ fontSize: 10, color: "#7F8491" }}
              >
                {col.count}
              </span>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    padding: 8,
                    border: "1px solid #E1E2E5",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: "#F3F3F5",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          height: 8,
                          backgroundColor: "#E1E2E5",
                          borderRadius: 4,
                          width: `${60 + i * 15}%`,
                        }}
                      />
                      <div
                        style={{
                          height: 6,
                          backgroundColor: "#E1E2E5",
                          opacity: 0.6,
                          borderRadius: 4,
                          width: `${40 + i * 10}%`,
                          marginTop: 4,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailsMockup() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Featured email draft */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #E1E2E5",
          padding: 16,
        }}
      >
        <div
          className="flex items-center"
          style={{ gap: 8, marginBottom: 12 }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "rgba(5, 96, 253, 0.1)",
            }}
          >
            <span
              style={{ fontSize: 12, fontWeight: 700, color: "#0560FD" }}
            >
              AI
            </span>
          </div>
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#151619",
              }}
            >
              Draft for J. Martin — Ardian
            </p>
            <p style={{ fontSize: 10, color: "#7F8491" }}>
              Private Credit Analyst
            </p>
          </div>
          <span
            className="ml-auto"
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 999,
              backgroundColor: "rgba(227, 136, 0, 0.1)",
              color: "#E38800",
              fontWeight: 500,
            }}
          >
            Pending review
          </span>
        </div>
        <div
          style={{
            paddingLeft: 40,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              height: 8,
              backgroundColor: "#E1E2E5",
              borderRadius: 4,
              width: "100%",
            }}
          />
          <div
            style={{
              height: 8,
              backgroundColor: "#E1E2E5",
              borderRadius: 4,
              width: "92%",
            }}
          />
          <div
            style={{
              height: 8,
              backgroundColor: "#E1E2E5",
              borderRadius: 4,
              width: "80%",
            }}
          />
          <div
            style={{
              height: 8,
              backgroundColor: "#E1E2E5",
              opacity: 0.5,
              borderRadius: 4,
              width: "66%",
            }}
          />
        </div>
        <div
          className="flex"
          style={{ gap: 8, marginTop: 16, paddingLeft: 40 }}
        >
          <button
            style={{
              fontSize: 10,
              padding: "4px 12px",
              borderRadius: 6,
              backgroundColor: "#059669",
              color: "#fff",
              fontWeight: 500,
              border: "none",
            }}
          >
            Approve & Send
          </button>
          <button
            style={{
              fontSize: 10,
              padding: "4px 12px",
              borderRadius: 6,
              backgroundColor: "#F3F3F5",
              color: "#363940",
              fontWeight: 500,
              border: "1px solid #E1E2E5",
            }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Additional email items */}
      {[
        {
          name: "S. Durand — Tikehau",
          status: "Sent",
          statusColor: "#059669",
        },
        {
          name: "A. Chen — Macquarie",
          status: "Draft",
          statusColor: "#7F8491",
        },
      ].map((email) => (
        <div
          key={email.name}
          className="flex items-center"
          style={{
            backgroundColor: "#fff",
            borderRadius: 8,
            border: "1px solid #E1E2E5",
            padding: 12,
            gap: 12,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              backgroundColor: "#F3F3F5",
            }}
          />
          <div className="flex-1">
            <div
              style={{
                height: 8,
                backgroundColor: "#E1E2E5",
                borderRadius: 4,
                width: "75%",
              }}
            />
            <div
              style={{
                height: 6,
                backgroundColor: "#E1E2E5",
                opacity: 0.5,
                borderRadius: 4,
                width: "50%",
                marginTop: 4,
              }}
            />
          </div>
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 999,
              fontWeight: 500,
              backgroundColor: email.statusColor + "15",
              color: email.statusColor,
            }}
          >
            {email.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PipelineSection() {
  const [activeTab, setActiveTab] = useState<TabId>("pipeline");
  const active = tabsData.find((t) => t.id === activeTab)!;

  return (
    <section style={{ marginBottom: 160 }}>
      <div
        style={{
          backgroundColor: "#F3F3F5",
          paddingTop: 80,
          paddingBottom: 80,
        }}
      >
        <div
          className="mx-auto"
          style={{ maxWidth: 1160, paddingLeft: 40, paddingRight: 40 }}
        >
          <div
            className="grid md:grid-cols-2 items-center"
            style={{ gap: 48 }}
          >
            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {/* Tab buttons */}
              <div className="flex" style={{ gap: 8, marginBottom: 32 }}>
                {tabsData.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="transition-all"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      backgroundColor:
                        activeTab === tab.id ? "#25272D" : "#fff",
                      color:
                        activeTab === tab.id ? "#F3F3F5" : "#363940",
                      border:
                        activeTab === tab.id
                          ? "1px solid #25272D"
                          : "1px solid #E1E2E5",
                      cursor: "pointer",
                    }}
                  >
                    {tab.emoji} {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2
                    style={{
                      fontSize: 48,
                      fontWeight: 700,
                      lineHeight: "48px",
                      color: "#151619",
                      maxWidth: 600,
                      marginBottom: 16,
                    }}
                  >
                    {active.title}
                  </h2>
                  <p
                    style={{
                      fontSize: 20,
                      fontWeight: 400,
                      lineHeight: "32px",
                      color: "#7F8491",
                    }}
                  >
                    {active.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Right — Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div
                style={{
                  backgroundColor: "#F9F9FA",
                  borderRadius: 20,
                  border: "1px solid #E1E2E5",
                  padding: 24,
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === "pipeline" ? (
                      <PipelineMockup />
                    ) : (
                      <EmailsMockup />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
