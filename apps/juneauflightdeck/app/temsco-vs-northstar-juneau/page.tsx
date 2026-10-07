import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TEMSCO vs NorthStar: Glacier Walk vs Ice Trek (Juneau Helicopter)",
  description:
    "Deciding between TEMSCO's gentle Mendenhall Glacier walk and NorthStar's glacier walkabout or crampon ice trek? Compare time on the ice, physical effort, gear, pricing, and booking paths.",
  alternates: { canonical: "https://juneauflightdeck.com/temsco-vs-northstar-juneau" },
  openGraph: {
    title: "TEMSCO vs NorthStar: Glacier Walk vs Ice Trek (Juneau Helicopter)",
    description:
      "20 minutes of gentle walking or 1–2 hours on the ice? Compare TEMSCO and NorthStar specific helicopter tours with cruise port timing.",
    url: "https://juneauflightdeck.com/temsco-vs-northstar-juneau",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does NorthStar compare to TEMSCO for glacier walking and ice trekking?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TEMSCO offers a gentle 20-25 minute landing on Mendenhall Glacier in slip-on overboots ($409 base), suitable for all ages (2+) with minimal walking. NorthStar offers two distinct options: the Helicopter Glacier Walkabout ($499 base), which gives a full 60 minutes on Mendenhall ice with crampons and trekking poles for moderate walkers (ages 8+), and the Level 1 Glacier Ice Trek ($549 base), which spends 2 hours hiking deep ice formations with mountaineering boots and harness (ages 12+).",
      },
    },
    {
      "@type": "Question",
      name: "Do both TEMSCO and NorthStar offer helicopter glacier dog sledding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Both operators run summer glacier dog sledding camps on high snowfields: TEMSCO operates its camp on Herbert Glacier ($659 base per person), and NorthStar operates its Helicopter Glacier Dogsled Adventure on Norris Glacier ($739 base per person). Both excursions feature Alaskan huskies and veteran mushers.",
      },
    },
    {
      "@type": "Question",
      name: "What gear is provided by TEMSCO vs NorthStar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TEMSCO provides neoprene overboots with rubber traction soles that slip directly over your sneakers or walking shoes. NorthStar outfits guests based on tour difficulty: traction crampons and trekking poles for the Glacier Walkabout, and full mountaineering boots, steel crampons, glacier safety harness, rainwear, and trekking poles for the Ice Trek.",
      },
    },
    {
      "@type": "Question",
      name: "How do the prices compare between TEMSCO and NorthStar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TEMSCO's Mendenhall Glacier Walk starts at $409 base per person (~$442 at checkout with local taxes and fees). NorthStar's Glacier Walkabout starts at $499 base (~$539 at checkout for 1 hour on ice), and its Level 1 Ice Trek starts at $549 base (~$593 at checkout for 2 hours on ice). Dog sledding is $659 base on TEMSCO vs $739 base on NorthStar.",
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
        Both TEMSCO and NorthStar fly to Mendenhall Glacier, but they cater to very different physical preferences and ice-time appetites. Rather than technical mountaineering alone, NorthStar also offers a 1-hour gentle <strong>Glacier Walkabout</strong> alongside its advanced crampon treks.
      </p>

      {/* Side-by-Side Comparison Grid */}
      <section style={{ overflowX: "auto", marginBottom: "36px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, background: "var(--panel, #0f172a)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line, #334155)", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "rgba(3, 14, 23, 0.9)", borderBottom: "1px solid var(--line, #334155)" }}>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--accent, #f0b35b)" }}>Feature</th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "#ffffff" }}>TEMSCO Mendenhall Guided Walk</th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "#ffffff" }}>NorthStar Glacier Walkabout</th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "#ffffff" }}>NorthStar Level 1 Ice Trek</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Time on Glacier</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>20 to 25 minutes</td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>Full 1 hour on ice</td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>2 hours on ice</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Physical Effort</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Easy / Casual walking</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Moderate walking</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Active mountaineering</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Gear Provided</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Slip-on glacier overboots</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Crampons &amp; trekking pole</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Steel crampons, boots, harness, rainwear</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Minimum Age</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>All ages (Ages 2+ walk; infants on lap)</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Ages 8+</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Ages 12+</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Base Rate / Person</td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>$409 base (~$442 total)</td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>$499 base (~$539 total)</td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>$549 base (~$593 total)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Dog Sledding Option</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Herbert Glacier ($659 base)</td>
              <td colSpan={2} style={{ padding: "12px 16px", color: "#cbd5e1" }}>Norris Glacier ($739 base · FareHarbor 115991)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Cruise Port Shuttles</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Included (All 4 cruise docks)</td>
              <td colSpan={2} style={{ padding: "12px 16px", color: "#cbd5e1" }}>Included (All 4 cruise docks)</td>
            </tr>
            <tr>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>Weather Policy</td>
              <td style={{ padding: "12px 16px", color: "#10b981" }}>100% full refund if grounded</td>
              <td colSpan={2} style={{ padding: "12px 16px", color: "#10b981" }}>100% full refund if grounded</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Decision Guidance Cards with Booking CTAs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 40 }}>
        {/* Choose TEMSCO */}
        <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: 12, padding: 22 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>
            Choose TEMSCO If:
          </span>
          <h2 style={{ fontSize: "1.2rem", color: "#ffffff", margin: "6px 0 10px" }}>
            TEMSCO Mendenhall Guided Walk
          </h2>
          <ul style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.55, paddingLeft: 18, marginBottom: 18 }}>
            <li>You travel with young kids (under 8) or grandparents desiring gentle walking.</li>
            <li>You want dramatic flightseeing and glacier photos at the lowest entry price ($409 base).</li>
            <li>You need high departure frequency (flights depart every 30 to 45 minutes).</li>
            <li>You want Herbert Glacier dog sledding ($659 base).</li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.82rem", padding: "8px 12px" }}
            >
              Book TEMSCO on Viator →
            </a>
            <a
              href="https://fareharbor.com/embeds/book/temscoair-juneau/items/214803/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-card"
              style={{ fontSize: "0.8rem", padding: "8px 10px" }}
            >
              Direct (FareHarbor) ↗
            </a>
          </div>
        </div>

        {/* Choose NorthStar Walkabout */}
        <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: 12, padding: 22 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#f0b35b", textTransform: "uppercase" }}>
            Choose NorthStar Walkabout If:
          </span>
          <h2 style={{ fontSize: "1.2rem", color: "#ffffff", margin: "6px 0 10px" }}>
            NorthStar Glacier Walkabout
          </h2>
          <ul style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.55, paddingLeft: 18, marginBottom: 18 }}>
            <li>20 minutes on the ice feels too short—you want a full hour (60 minutes) exploring.</li>
            <li>You want traction crampons and trekking poles without needing technical climbing gear.</li>
            <li>All guests in your group are at least 8 years old.</li>
            <li>Direct rate from $499 base (FareHarbor item 116029).</li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Glacier+Walkabout&pid=P00058396&mcid=42383&medium=api"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.82rem", padding: "8px 12px" }}
            >
              Book Walkabout on Viator →
            </a>
            <a
              href="https://fareharbor.com/embeds/book/northstartrekking/items/116029/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-card"
              style={{ fontSize: "0.8rem", padding: "8px 10px" }}
            >
              Direct (FareHarbor) ↗
            </a>
          </div>
        </div>

        {/* Choose NorthStar Ice Trek */}
        <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: 12, padding: 22 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
            Choose NorthStar Trek If:
          </span>
          <h2 style={{ fontSize: "1.2rem", color: "#ffffff", margin: "6px 0 10px" }}>
            NorthStar Level 1 Glacier Ice Trek
          </h2>
          <ul style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.55, paddingLeft: 18, marginBottom: 18 }}>
            <li>You want active mountaineering: 2 hours hiking deep glacier ice in crampons and harness.</li>
            <li>You want to examine crevasses, look down 100-foot moulins, and touch sculpted blue ice.</li>
            <li>All participants are fit, active, and at least 12 years old.</li>
            <li>Direct rate from $549 base (FareHarbor item 116035).</li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Trekking&pid=P00058396&mcid=42383&medium=api"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.82rem", padding: "8px 12px" }}
            >
              Book Trek on Viator →
            </a>
            <a
              href="https://fareharbor.com/embeds/book/northstartrekking/items/116035/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-card"
              style={{ fontSize: "0.8rem", padding: "8px 10px" }}
            >
              Direct (FareHarbor) ↗
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
