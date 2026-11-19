import Link from "next/link";
import { LFSE_CANONICAL_LINKS } from "@/lib/verifiedOperatorPricing";

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
          <div style={{ maxWidth: "500px" }}>
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
              Independent Juneau flightseeing education, weather-guidance, and concierge planning
              site. Juneau Flight Deck is not an FAA Part 135 helicopter operator or air carrier;
              all flights are operated independently by licensed Alaska operators.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="site-footer-links"
            style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", alignItems: "center" }}
          >
            <Link href="/helicopter">Glacier Flights</Link>
            <Link href="/juneau-glacier-flight-weather">Flight Weather</Link>
            <Link href="/temsco-vs-coastal-vs-northstar-juneau">Compare Operators</Link>
            <Link href="/helicopter-waitlist">Sold-Out Concierge</Link>
            <Link href="/guides/uncruise-juneau-helicopter-tours">UnCruise Pre/Post Guide</Link>
            <Link href="/juneau/what-to-do-if-helicopter-tour-canceled">Weather Backups</Link>
            <Link href="/about">About</Link>
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
            display: "grid",
            gap: "8px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#9ed9ff",
            }}
          >
            Canonical Alaska Operator &amp; Port Profiles (Last Frontier Shore Excursions)
          </p>
          <div
            className="site-footer-links"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 16px",
              fontSize: "0.8rem",
            }}
          >
            <a href={LFSE_CANONICAL_LINKS.temsco}>TEMSCO Helicopters ↗</a>
            <a href={LFSE_CANONICAL_LINKS.coastal}>Coastal Helicopters ↗</a>
            <a href={LFSE_CANONICAL_LINKS.northstar}>NorthStar Trekking ↗</a>
            <a href={LFSE_CANONICAL_LINKS.wings}>Wings Airways ↗</a>
            <a href={LFSE_CANONICAL_LINKS.juneauWhaleWatch}>Juneau Tours &amp; Whale Watch ↗</a>
            <a href={LFSE_CANONICAL_LINKS.taquanAir}>Taquan Air ↗</a>
            <a href={LFSE_CANONICAL_LINKS.juneauPort}>Juneau Port Guide ↗</a>
            <a href={LFSE_CANONICAL_LINKS.juneauHelicopterCategory}>Juneau Helicopter Tours ↗</a>
            <a href={LFSE_CANONICAL_LINKS.juneauWhaleCategory}>Juneau Whale Watching ↗</a>
            <a href={LFSE_CANONICAL_LINKS.skagwayPort}>Skagway Port Guide ↗</a>
            <a href={LFSE_CANONICAL_LINKS.ketchikanMistyFjords}>Ketchikan Misty Fjords ↗</a>
          </div>
        </div>

        <div
          style={{
            paddingTop: "14px",
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
            &copy; 2026 Juneau Flight Deck · Independent Flightseeing Guide &amp; Viator Partner
            (we may earn a commission on partner bookings at no extra cost to you).
          </span>
          <span>Juneau, Alaska</span>
        </div>
      </div>
    </footer>
  );
}
