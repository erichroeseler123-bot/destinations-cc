import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TEMSCO vs NorthStar: Glacier Walk vs Ice Trek (Juneau Helicopter)",
  description:
    "Deciding between TEMSCO's gentle Mendenhall Glacier walk and NorthStar's crampon ice trek? Compare time on the ice, physical effort, gear, pricing, and booking paths.",
  alternates: { canonical: "https://juneauflightdeck.com/temsco-vs-northstar-juneau" },
  openGraph: {
    title: "TEMSCO vs NorthStar: Glacier Walk vs Ice Trek (Juneau Helicopter)",
    description:
      "20 minutes of gentle walking or 1+ hours of technical crampon hiking? Compare TEMSCO and NorthStar specific helicopter tours with cruise port timing.",
    url: "https://juneauflightdeck.com/temsco-vs-northstar-juneau",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much more difficult is NorthStar's ice trek compared to TEMSCO's glacier walk?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TEMSCO's guided walk is gentle and flat, spending 20 to 25 minutes near the helicopter in slip-on traction boots, suitable for all ages (2+) with no hiking experience required. NorthStar's Level 1 ice trek spends 1 to 1.25 hours actively hiking on the ice with technical steel crampons, mountaineering boots, and trekking poles, requiring good balance, stamina, and a minimum age of 8.",
      },
    },
    {
      "@type": "Question",
      name: "What gear is provided by TEMSCO vs NorthStar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TEMSCO provides neoprene overboots with rubber traction soles that fit over your regular walking shoes. NorthStar provides full mountaineering equipment: sturdy hiking boots, steel crampons, a glacier safety harness, rain gear jacket and pants, gloves, and trekking poles.",
      },
    },
    {
      "@type": "Question",
      name: "How do the prices compare between TEMSCO and NorthStar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TEMSCO's Mendenhall Glacier Walk starts around $409 base per person (~$442 at checkout with taxes and fees). NorthStar's Level 1 Glacier Ice Trek starts around $559 base per person (~$605 at checkout), reflecting the longer flight, smaller 1:6 guide ratio, and technical mountain gear.",
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
    { "@type": "ListItem", position: 3, name: "TEMSCO vs NorthStar", item: "https://juneauflightdeck.com/temsco-vs-northstar-juneau" },
  ],
};

export default function TemscoVsNorthstarPage() {
  return (
    <main className="page-shell" style={{ maxWidth: 960, margin: "auto", padding: "40px 20px 80px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <p className="eyebrow" style={{ color: "var(--accent, #f0b35b)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.1em" }}>
        Head-to-Head Comparison
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)", fontWeight: 900, lineHeight: 1.2, margin: "10px 0 16px", color: "var(--text, #ffffff)" }}>
        TEMSCO vs. NorthStar: Glacier Walk vs. Ice Trek
      </h1>
      <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--ice, #e0f2fe)", marginBottom: "20px" }}>
        Both TEMSCO and NorthStar fly to Mendenhall Glacier, but they offer completely different experiences on the ice. The decision comes down to one question: <strong>Do you want a gentle 20-minute walk or a 1+ hour technical crampon trek?</strong>
      </p>

      {/* Side-by-Side Comparison Grid */}
      <section style={{ overflowX: "auto", marginBottom: "36px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640, background: "var(--panel, #0f172a)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line, #334155)", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "rgba(3, 14, 23, 0.9)", borderBottom: "1px solid var(--line, #334155)" }}>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--accent, #f0b35b)" }}>Feature</th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "#ffffff" }}>TEMSCO Mendenhall Guided Walk</th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "#ffffff" }}>NorthStar Level 1 Ice Trek</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Time on the Glacier</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>20 to 25 minutes</td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>1 hour to 1 hr 15 min</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Physical Effort</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Easy / Casual walking</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Moderate / Active mountaineering</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Gear Provided</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Slip-on glacier overboots</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Steel crampons, boots, harness, poles, rainwear</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Minimum Age</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>All ages (Ages 2+ walk; infants on lap)</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Strictly age 8+</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Guide Ratio</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Pilot/guide with helicopter group (~6:1)</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Certified mountain guide (max 6 guests)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Base Rate / Person</td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>$409 base (~$442 at checkout)</td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>$559 base (~$605 at checkout)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Cruise Port Shuttles</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Included (AJ, Franklin, Steamship, Marine Park)</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Included (AJ, Franklin, Steamship, Marine Park)</td>
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
            TEMSCO Mendenhall Guided Walk
          </h2>
          <ul style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.6, paddingLeft: 18, marginBottom: 20 }}>
            <li>You are traveling with young children (under 8) or older family members.</li>
            <li>You want dramatic flightseeing and glacier photos without strenuous physical effort.</li>
            <li>You want a shorter total excursion (2 hr 15 min) leaving time for whale watching or shopping downtown.</li>
            <li>You also want the option of glacier dog sledding (which only TEMSCO offers in Juneau).</li>
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

        {/* Choose NorthStar */}
        <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
            Choose NorthStar If:
          </span>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", margin: "6px 0 12px" }}>
            NorthStar Level 1 Glacier Ice Trek
          </h2>
          <ul style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.6, paddingLeft: 18, marginBottom: 20 }}>
            <li>20 minutes on the ice feels too brief—you want over an hour exploring the deep glacier.</li>
            <li>You want the thrill of strapping real steel crampons onto mountaineering boots.</li>
            <li>You want to hike around deep crevasses, look down moulins, and touch sculpted blue ice.</li>
            <li>Your group is fit, active, and all participants are at least 8 years old.</li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Trekking&pid=P00058396&mcid=42383&medium=api"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.85rem", padding: "8px 14px" }}
            >
              Book NorthStar on Viator →
            </a>
            <a
              href="https://fareharbor.com/embeds/book/northstartrekking/items/116035/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
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
