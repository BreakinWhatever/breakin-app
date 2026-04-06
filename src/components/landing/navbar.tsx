"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLang } from "@/lib/lang-context";

const enContent = {
  navLinks: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
  ],
  cta: "Get early access",
};

const frContent = {
  navLinks: [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Comment ça marche", href: "#how-it-works" },
    { label: "Témoignages", href: "#testimonials" },
  ],
  cta: "Rejoindre la waitlist",
};

export default function Navbar() {
  const lang = useLang();
  const t = lang === "fr" ? frContent : enContent;
  const navLinks = t.navLinks;

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="sticky top-0 left-0 right-0 transition-[border-color] duration-300"
      style={{
        zIndex: 100,
        height: 71,
        backgroundColor: "#fff",
        borderBottom: scrolled ? "1px solid #E1E2E5" : "1px solid transparent",
      }}
    >
      <div
        className="mx-auto flex items-center justify-between h-full"
        style={{ maxWidth: 1160, paddingLeft: 40, paddingRight: 40 }}
      >
        {/* Logo */}
        <a href="#" className="flex items-center" style={{ gap: 8, textDecoration: "none" }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              backgroundColor: "#151619",
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 14L9 4L14 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 10.5H12" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#151619",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            BreakIn
          </span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center" style={{ gap: 32 }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[#151619]"
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "#363940",
                lineHeight: "24px",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop right side: lang switcher + CTA */}
        <div className="hidden md:flex items-center" style={{ gap: 16 }}>
          {/* Language switcher */}
          <div
            className="flex items-center"
            style={{ gap: 4, fontSize: 12, color: "#7F8491" }}
          >
            <a
              href="/"
              style={{
                color: lang === "en" ? "#151619" : "#7F8491",
                fontWeight: lang === "en" ? 700 : 400,
                textDecoration: "none",
              }}
            >
              EN
            </a>
            <span style={{ color: "#7F8491" }}>·</span>
            <a
              href="/fr"
              style={{
                color: lang === "fr" ? "#151619" : "#7F8491",
                fontWeight: lang === "fr" ? 700 : 400,
                textDecoration: "none",
              }}
            >
              FR
            </a>
          </div>

          {/* CTA */}
          <a
            href="#cta"
            className="transition-colors hover:border-[#151619]"
            style={{
              fontSize: 16,
              fontWeight: 700,
              backgroundColor: "#fff",
              color: "#151619",
              border: "1px solid #B0B3BB",
              padding: "0 10px",
              borderRadius: 8,
              height: 38,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {t.cta}
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-[#151619]"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-[#E1E2E5] overflow-hidden"
          >
            <div
              className="flex flex-col"
              style={{ padding: "16px 40px", gap: 12 }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#363940",
                    padding: "8px 0",
                  }}
                >
                  {link.label}
                </a>
              ))}
              {/* Mobile lang switcher */}
              <div
                className="flex items-center"
                style={{ gap: 4, fontSize: 12, color: "#7F8491", padding: "4px 0" }}
              >
                <a
                  href="/"
                  style={{
                    color: lang === "en" ? "#151619" : "#7F8491",
                    fontWeight: lang === "en" ? 700 : 400,
                    textDecoration: "none",
                  }}
                >
                  EN
                </a>
                <span style={{ color: "#7F8491" }}>·</span>
                <a
                  href="/fr"
                  style={{
                    color: lang === "fr" ? "#151619" : "#7F8491",
                    fontWeight: lang === "fr" ? 700 : 400,
                    textDecoration: "none",
                  }}
                >
                  FR
                </a>
              </div>
              <a
                href="#cta"
                onClick={() => setMobileOpen(false)}
                className="text-center"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  backgroundColor: "#fff",
                  color: "#151619",
                  border: "1px solid #B0B3BB",
                  padding: "0 10px",
                  borderRadius: 8,
                  height: 38,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 8,
                }}
              >
                {t.cta}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
