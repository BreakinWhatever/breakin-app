"use client";

import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setState("success");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Something went wrong");
        setState("error");
      }
    } catch {
      setErrorMsg("Something went wrong");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <p
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#059669",
        }}
      >
        You&apos;re on the list ✓
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="flex flex-col sm:flex-row items-center"
        style={{ gap: 8 }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          disabled={state === "loading"}
          required
          style={{
            fontSize: 16,
            padding: "0 16px",
            borderRadius: 8,
            border: "1px solid #C8CAD0",
            height: 50,
            minWidth: 260,
            color: "#151619",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          style={{
            fontSize: 16,
            fontWeight: 700,
            backgroundColor: "#25272D",
            color: "#F3F3F5",
            padding: "0 20px",
            borderRadius: 8,
            height: 50,
            border: "none",
            cursor: state === "loading" ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            opacity: state === "loading" ? 0.7 : 1,
          }}
        >
          {state === "loading" ? "..." : "Join waitlist →"}
        </button>
      </div>
      {state === "error" && (
        <p style={{ fontSize: 13, color: "#DC2626", marginTop: 8 }}>
          {errorMsg}
        </p>
      )}
    </form>
  );
}
