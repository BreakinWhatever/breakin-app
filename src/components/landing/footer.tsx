"use client";

export default function Footer() {
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
              The smarter way to land interviews
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
                {["Features", "How it works", "Testimonials"].map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase().replace(/ /g, "-")}`}
                      className="transition-colors hover:text-[#151619]"
                      style={{ fontSize: 14, fontWeight: 400, color: "#363940" }}
                    >
                      {link}
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
              Privacy Policy
            </span>
            <span style={{ fontSize: 12, color: "#7F8491" }}>
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
