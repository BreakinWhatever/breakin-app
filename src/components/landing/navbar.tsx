"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
];

export default function Navbar() {
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
        <a href="#" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="BreakIn"
            style={{ height: 36, width: "auto" }}
          />
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

        {/* Desktop CTA — OUTLINED style */}
        <div className="hidden md:flex items-center">
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
            Get early access
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
                Get early access
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
