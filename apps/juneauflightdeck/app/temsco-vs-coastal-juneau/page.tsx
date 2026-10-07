import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TEMSCO vs Coastal Helicopters: Juneau Glacier Tour Comparison",
  description:
    "Comparing Juneau's two scenic helicopter landing operators: TEMSCO and Coastal. Learn about landing glaciers (Mendenhall vs Herbert), dog sledding exclusivity, and Taku Lodge combos.",
  alternates: { canonical: "https://juneauflightdeck.com/temsco-vs-coastal-juneau" },
  openGraph: {
    title: "TEMSCO vs Coastal Helicopters: Juneau Glacier Tour Comparison",
    description:
      "Compare TEMSCO and Coastal Helicopters in Juneau. Specific tour pricing, Mendenhall vs Herbert Glacier landings, dog sledding camps, and cruise port timing.",
    url: "https://juneauflightdeck.com/temsco-vs-coastal-juneau",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where do TEMSCO and Coastal Helicopters land on the glacier?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TEMSCO lands primarily on Mendenhall Glacier for guided walks and on high Herbert Glacier snowfields for dog sledding. Coastal Helicopters lands on Herbert Glacier or Norris Glacier depending on daily ice and cloud ceiling conditions.",
      },
    },
    {
      "@type": "Question",
      name: "Does Coastal Helicopters offer glacier dog sledding in Juneau?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. In Juneau, only TEMSCO operates an alpine glacier dog sledding camp (on Herbert Glacier). Coastal Helicopters does not offer dog sledding in Juneau; instead, Coastal offers exclusive flightseeing trips to historic Taku Glacier Lodge for a wilderness salmon feast.",
      },
    },
    {
      "@type": "Question",
      name: "Which company has more departures during cruise port days?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TEMSCO operates a larger fleet of ASTAR 350 helicopters and offers departures every 30 to 45 minutes throughout the day, providing more flexibility for tight cruise ship port windows.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://juneauflightdeck.com/" },
    { "@type": "ListItem", position: 2, name: "Operator Comparison", item: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau" },
    { "@type": "ListItem", position: 3, name: "TEMSCO vs Coastal", item: "https://juneauflightdeck.com/temsco-vs-coastal-juneau" },
  ],
};

export default function TemscoVsCoastalPage() {
  return (
    <main className="page-shell" style={{ maxWidth: 960, margin: "auto", padding: "40px 20px 80px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <p className="eyebrow" style={{ color: "var(--accent, #f0b35b)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.1em" }}>
        Head-to-Head Comparison
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)", fontWeight: 900, lineHeight: 1.2, margin: "10px 0 16px", color: "var(--text, #ffffff)" }}>
        TEMSCO vs. Coastal: Juneau Helicopter Landing Comparison
      </h1>
      <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--ice, #e0f2fe)", marginBottom: "20px" }}>
        Both TEMSCO and Coastal Helicopters offer world-class scenic flightseeing and gentle glacier landings where you step onto ancient ice in slip-on traction boots. The key differences lie in <strong>which glaciers they touch, dog sledding exclusivity, and wilderness dining</strong>.
      </p>

      {/* Side-by-Side Comparison Table */}
      <section style={{ overflowX: "auto", marginBottom: "36px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640, background: "var(--panel, #0f172a)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line, #334155)", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "rgba(3, 14, 23, 0.9)", borderBottom: "1px solid var(--line, #334155)" }}>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--accent, #f0b35b)" }}>Feature</th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "#ffffff" }}>TEMSCO Helicopters</th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "#ffffff" }}>Coastal Helicopters</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Primary Landing Glaciers</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Mendenhall Glacier &amp; Herbert Glacier</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Herbert Glacier &amp; Norris Glacier</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Time on Ice (Walkabout)</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>20 to 25 minutes</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>20 to 25 minutes</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Dog Sledding Tour</td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>YES (Only camp in Juneau)</td>
              <td style={{ padding: "12px 16px", color: "#f87171" }}>NO (Not offered)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Specialty Combo Excursion</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Glacier Dog Sledding &amp; Mendenhall Walk</td>
              <td style={{ padding: "12px 16px", color: "#a855f7", fontWeight: 700 }}>Taku Glacier Lodge Salmon Feast Fly-In</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Fleet &amp; Departures</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Larger fleet; flights every 30–45 min</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Smaller boutique fleet; curated departures</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Base Landing Rate</td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>From $409 base (~$442 total)</td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>From $395 base (~$428 total)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Cruise Port Shuttles</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Included for all cruise ship berths</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Included for all cruise ship berths</td>
            </tr>
            <tr>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Weather Cancellation</td>
              <td style={{ padding: "12px 16px", color: "#10b981" }}>100% full refund if grounded</td>
              <td style={{ padding: "12px 16px", color: "#10b981" }}>100% full refund if grounded</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Decision Guidance Cards with Booking CTAs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 40 }}>
        {/* Choose TEMSCO */}
        <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>
            Choose TEMSCO If:
          </span>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", margin: "6px 0 12px" }}>
            TEMSCO Helicopters
          </h2>
          <ul style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.6, paddingLeft: 18, marginBottom: 20 }}>
            <li>You specifically want to land on famous <strong>Mendenhall Glacier</strong>.</li>
            <li><strong>Dog sledding</strong> is your top bucket-list priority (TEMSCO is the only option in Juneau).</li>
            <li>You have a tight cruise schedule and need high departure frequency (flights depart every 30 to 45 min).</li>
            <li>You prefer Alaska&apos;s longest-running operator (flying Juneau glaciers since 1958).</li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.85rem", padding: "8px 14px" }}
            >
              Book TEMSCO on Viator →
            </a>
            <a
              href="https://fareharbor.com/embeds/book/temscoair-juneau/items/214803/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-card"
              style={{ fontSize: "0.82rem", padding: "8px 12px" }}
            >
              Book Direct (FareHarbor) ↗
            </a>
          </div>
        </div>

        {/* Choose Coastal */}
        <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#a855f7", textTransform: "uppercase" }}>
            Choose Coastal If:
          </span>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", margin: "6px 0 12px" }}>
            Coastal Helicopters
          </h2>
          <ul style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.6, paddingLeft: 18, marginBottom: 20 }}>
            <li>You want expansive flight paths over Herbert and Norris glaciers with flexible landing sites.</li>
            <li>You want a slightly lower base price for standard glacier landings (starting at $395).</li>
            <li>You want to combine helicopter flightseeing with an exclusive wilderness meal at <strong>historic Taku Glacier Lodge</strong>.</li>
            <li>You prefer a boutique, locally focused flight operator.</li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+Coastal+Helicopters&pid=P00058396&mcid=42383&medium=api"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.85rem", padding: "8px 14px" }}
            >
              Book Coastal on Viator →
            </a>
            <a
              href="https://fareharbor.com/embeds/book/coastalhelicopters/items/413056/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-card"
              style={{ fontSize: "0.82rem", padding: "8px 12px" }}
            >
              Book Direct (FareHarbor) ↗
            </a>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", borderTop: "1px solid var(--line, #334155)", paddingTop: 24 }}>
        <Link href="/temsco-vs-coastal-vs-northstar-juneau" style={{ color: "var(--accent, #f0b35b)", textDecoration: "none", fontWeight: 700, fontSize: "0.95rem" }}>
          ← Back to All 3 Operators Comparison (TEMSCO vs Coastal vs NorthStar)
        </Link>
      </div>
    </main>
  );
}
