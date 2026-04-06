"use client";

import { useLang } from "@/lib/lang-context";

const enContent = {
  tagline: "The smarter way to land interviews",
  navLinks: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
  ],
  privacy: "Privacy Policy",
  terms: "Terms of Service",
};

const frContent = {
  tagline: "La façon intelligente de décrocher des entretiens",
  navLinks: [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Comment ça marche", href: "#how-it-works" },
    { label: "Témoignages", href: "#testimonials" },
  ],
  privacy: "Politique de confidentialité",
  terms: "Conditions d'utilisation",
};

export default function Footer() {
  const lang = useLang();
  const t = lang === "fr" ? frContent : enContent;

  return (
    <footer style={{ borderTop: "1px solid #E1E2E5" }}>
      <div
        className="mx-auto"
        style={{
          maxWidth: 1160,
          paddingLeft: 40,
          paddingRight: 40,
          paddingTop: 48,
          paddingBottom: 48,
        }}
      >
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Logo & tagline */}
          <div>
            <div
              className="flex items-center"
              style={{ gap: 8, marginBottom: 8 }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: "#151619",
                  borderRadius: 8,
                }}
              >
                <span
                  className="text-white font-bold"
                  style={{ fontSize: 12 }}
                >
                  B
                </span>
              </div>
              <span
                className="font-bold"
                style={{
                  fontSize: 16,
                  color: "#151619",
                  letterSpacing: "-0.02em",
                }}
              >
                BreakIn
              </span>
            </div>
            <p style={{ fontSize: 14, color: "#7F8491" }}>
              {t.tagline}
            </p>
          </div>

          {/* Link columns */}
          <div className="flex" style={{ gap: 64 }}>
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7F8491",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 12,
                }}
              >
                Why BreakIn
              </p>
              <ul
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {t.navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="transition-colors hover:text-[#151619]"
                      style={{ fontSize: 14, fontWeight: 400, color: "#363940" }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7F8491",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 12,
                }}
              >
                Product
              </p>
              <ul
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {["Cold Emailing", "Pipeline", "AI Agent"].map((link) => (
                  <li key={link}>
                    <span style={{ fontSize: 14, color: "#363940" }}>
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between"
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid #E1E2E5",
            gap: 16,
          }}
        >
          <p style={{ fontSize: 12, color: "#7F8491" }}>
            © {new Date().getFullYear()} BreakIn · Paris, France
          </p>
          <div className="flex" style={{ gap: 16 }}>
            <span style={{ fontSize: 12, color: "#7F8491" }}>
              {t.privacy}
            </span>
            <span style={{ fontSize: 12, color: "#7F8491" }}>
              {t.terms}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
