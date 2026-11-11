import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer" style={{ padding: "36px 0 28px" }}>
      <div className="site-shell" style={{ display: "grid", gap: "22px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px 32px",
          }}
        >
          <div style={{ maxWidth: "460px" }}>
            <p
              style={{
                fontSize: "0.82rem",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#e2b86b",
                margin: "0 0 6px",
              }}
            >
              Juneau Flight Deck
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.55,
                margin: 0,
                color: "rgba(238, 246, 251, 0.85)",
              }}
            >
              Independent Juneau glacier flight guide &amp; concierge desk. Compare FAA Part 135
              operators (TEMSCO, Coastal &amp; NorthStar), check ship port timing, and book with
              official providers.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="site-footer-links"
            style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", alignItems: "center" }}
          >
            <Link href="/helicopter">Glacier Flights</Link>
            <Link href="/temsco-vs-coastal-vs-northstar-juneau">Compare Operators</Link>
            <Link href="/helicopter-waitlist">Sold-Out Concierge</Link>
            <Link href="/juneau/what-to-do-if-helicopter-tour-canceled">Weather Backups</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>

        <div
          style={{
            paddingTop: "16px",
            borderTop: "1px solid rgba(151, 211, 255, 0.14)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            fontSize: "0.78rem",
            color: "rgba(228, 239, 246, 0.72)",
          }}
        >
          <span>
            &copy; {new Date().getFullYear()} Juneau Flight Deck · Official Viator Partner &amp;
            Independent Concierge (we may earn a commission on partner bookings at no extra cost to
            you).
          </span>
          <span>Juneau, Alaska</span>
        </div>
      </div>
    </footer>
  );
}
