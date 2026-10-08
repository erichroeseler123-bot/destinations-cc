import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer" style={{ padding: "40px 0 28px" }}>
      <div className="site-shell" style={{ display: "grid", gap: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "28px" }}>
          {/* Brand & Mission */}
          <div className="site-footer-copy" style={{ maxWidth: "420px" }}>
            <p className="eyebrow" style={{ color: "var(--accent-strong)", margin: "0 0 6px" }}>
              Juneau Flight Deck • Cruise Excursion Booking &amp; Coordination
            </p>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 10px", color: "var(--text)" }}>
              Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>
              Bookings are completed directly with licensed flight and marine operators or via our official Viator partner checkout. Local ground coordination provided in Juneau, Alaska.
            </p>
          </div>

          {/* Essential Guides */}
          <div>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ice)", margin: "0 0 12px" }}>
              Insider Guides
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }} className="site-footer-links">
              <li>
                <Link href="/juneau-helicopter-tour-sold-out">Sold Out Flights: How to Get Seats</Link>
              </li>
              <li>
                <Link href="/temsco-vs-coastal-vs-northstar-juneau">TEMSCO vs Coastal vs NorthStar</Link>
              </li>
              <li>
                <Link href="/best-time-for-glacier-dog-sledding-juneau">Best Time for Dog Sledding</Link>
              </li>
              <li>
                <Link href="/juneau-helicopter-tour-weight-limits-and-seating">Weight Limits &amp; Seating Math</Link>
              </li>
              <li>
                <Link href="/juneau/what-to-do-if-helicopter-tour-canceled">What to Do if Flight Cancels</Link>
              </li>
            </ul>
          </div>

          {/* Tours & Tools */}
          <div>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ice)", margin: "0 0 12px" }}>
              Excursions &amp; Tools
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }} className="site-footer-links">
              <li>
                <Link href="/helicopter-waitlist">Helicopter Tour Waitlist</Link>
              </li>
              <li>
                <Link href="/helicopter">Juneau Helicopter Tours</Link>
              </li>
              <li>
                <Link href="/juneau-whale-watching-tours">Auke Bay Whale Watching</Link>
              </li>
              <li>
                <Link href="/skagway/helicopter">Skagway Glacier Flights</Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ice)", margin: "0 0 12px" }}>
              Information
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }} className="site-footer-links">
              <li>
                <Link href="/about">About Our Service</Link>
              </li>
              <li>
                <Link href="/faq">FAQ</Link>
              </li>
              <li>
                <Link href="/contact">Contact Dispatch</Link>
              </li>
              <li>
                <Link href="/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms">Terms of Service</Link>
              </li>
            </ul>
          </div>
        </div>

        <div style={{ paddingTop: "18px", borderTop: "1px solid rgba(151, 211, 255, 0.12)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", fontSize: "0.8rem", color: "var(--muted)" }}>
          <span>&copy; {new Date().getFullYear()} Juneau Flight Deck. Independent coordination &amp; official Viator partner.</span>
          <span>Juneau, Alaska</span>
        </div>
      </div>
    </footer>
  );
}
