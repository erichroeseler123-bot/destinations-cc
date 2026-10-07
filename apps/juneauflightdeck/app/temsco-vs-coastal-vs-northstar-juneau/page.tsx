import type { Metadata } from "next";
import Link from "next/link";
import IcefieldGlacierMap from "../components/IcefieldGlacierMap";

export const metadata: Metadata = {
  title: "TEMSCO vs Coastal vs NorthStar: Juneau Helicopter Tour Comparison",
  description:
    "Compare Juneau's 3 FAA Part 135 glacier helicopter operators by specific tour: glacier walkabouts, dog sledding, and ice treks. Total pricing, cruise timing, and direct booking links.",
  alternates: { canonical: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau" },
  openGraph: {
    title: "TEMSCO vs Coastal vs NorthStar: Juneau Helicopter Tour Comparison",
    description:
      "Detailed comparison of Juneau's 3 licensed glacier helicopter operators. Compare landing time, dog sledding, physical effort, pricing, cruise dock pickups, and weather terms.",
    url: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau",
  },
};

const comparisonFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the difference between a glacier landing, a guided walk, and an ice trek?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A standard glacier landing or walkabout (offered by TEMSCO for 20-25 min and Coastal for 25-30 min) involves walking on gentle, level ice near the helicopter in slip-on traction overboots. NorthStar offers a 1-hour Glacier Walkabout equipped with crampons and trekking poles for moderate walkers (ages 8+), as well as a technical Level 1 Ice Trek spending 2 hours hiking deep ice formations with mountaineering boots, steel crampons, and harnesses (ages 12+).",
      },
    },
    {
      "@type": "Question",
      name: "Which Juneau helicopter companies offer glacier dog sledding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All three licensed Juneau helicopter operators offer glacier dog sledding excursions during the summer snow season (mid-May to mid-to-late August): TEMSCO operates its camp on Herbert Glacier snowfields ($659 base), Coastal Helicopters operates on Herbert Glacier ($709 base), and NorthStar Trekking operates its Glacier Dogsled Adventure on Norris Glacier ($739 base). Dog sledding is not offered in September once the high-altitude snow melts.",
      },
    },
    {
      "@type": "Question",
      name: "Do TEMSCO, Coastal, and NorthStar provide pickup from cruise ship docks?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All three operators provide complimentary round-trip ground shuttles from all four Juneau cruise berths (AJ Dock, Franklin Dock, Steamship Wharf, and Marine Park). The shuttle ride takes approximately 15 to 20 minutes each way.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if a helicopter flight is cancelled due to weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If an operator cancels your flight due to mountain pass clouds, fog, high winds, or FAA flight minimums, you receive a 100% full refund. Juneau Flight Deck also monitors real-time pass conditions and coordinates same-day backup tours like whale watching or Mendenhall Visitor Center ground shuttles.",
      },
    },
    {
      "@type": "Question",
      name: "How much buffer time do I need between my cruise ship docking and my helicopter flight?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We recommend scheduling your departure at least 60 to 90 minutes after your ship's scheduled arrival time to clear the gangway, and selecting a tour that returns to the dock at least 60 to 90 minutes before your ship's All Aboard time.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://juneauflightdeck.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Operator Comparison",
      item: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau",
    },
  ],
};

export default function OperatorComparisonPage() {
  return (
    <main className="page-shell" style={{ maxWidth: 1040, margin: "auto", padding: "40px 20px 80px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonFaqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow" style={{ color: "var(--accent, #f0b35b)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.1em" }}>
          Juneau Flight Deck • Operator Decision Guide
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 900, lineHeight: 1.2, margin: "10px 0 16px", color: "var(--text, #ffffff)" }}>
          TEMSCO vs Coastal vs NorthStar: Juneau Helicopter Comparison
        </h1>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--ice, #e0f2fe)", marginBottom: "14px" }}>
          Every passenger flying to a glacier in Juneau is flown by one of exactly three FAA Part 135 licensed commercial helicopter operators: <strong>TEMSCO Helicopters</strong>, <strong>Coastal Helicopters</strong>, or <strong>NorthStar Trekking</strong>.
        </p>
        <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--muted, #94a3b8)", margin: 0 }}>
          Because each operator specializes in distinct experiences—from family-friendly gentle walkabouts to high-altitude dog sledding and crampon ice treks—this guide compares their specific tours across the five factors that actually affect your booking decision.
        </p>
      </div>

      {/* Navigation Quick Bar */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "36px", padding: "14px 18px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "var(--radius-md, 12px)", border: "1px solid var(--line, #334155)" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent, #f0b35b)", alignSelf: "center", marginRight: 6 }}>Jump to:</span>
        <a href="#icefield-map" style={{ fontSize: "0.85rem", color: "var(--accent, #f0b35b)", textDecoration: "none", padding: "4px 10px", background: "rgba(240, 179, 91, 0.12)", borderRadius: 6, fontWeight: 700 }}>🗺️ Icefield &amp; Glacier Map</a>
        <a href="#effort-comparison" style={{ fontSize: "0.85rem", color: "var(--ice, #e0f2fe)", textDecoration: "none", padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>1. Walk vs. Trek</a>
        <a href="#dog-sledding-options" style={{ fontSize: "0.85rem", color: "var(--ice, #e0f2fe)", textDecoration: "none", padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>2. Dog Sledding</a>
        <a href="#pricing-inclusions" style={{ fontSize: "0.85rem", color: "var(--ice, #e0f2fe)", textDecoration: "none", padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>3. Prices &amp; Inclusions</a>
        <a href="#cruise-timing-pickup" style={{ fontSize: "0.85rem", color: "var(--ice, #e0f2fe)", textDecoration: "none", padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>4. Port Timing &amp; Docks</a>
        <a href="#cancellation-weather" style={{ fontSize: "0.85rem", color: "var(--ice, #e0f2fe)", textDecoration: "none", padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>5. Weather &amp; Refunds</a>
        <a href="#recommendations" style={{ fontSize: "0.85rem", color: "var(--accent, #f0b35b)", fontWeight: 700, textDecoration: "none", padding: "4px 10px", background: "rgba(240, 179, 91, 0.15)", borderRadius: 6 }}>Top Recommendations ↓</a>
      </div>

      {/* INTERACTIVE ICEFIELD & GLACIER MAP */}
      <section id="icefield-map">
        <IcefieldGlacierMap />
      </section>

      {/* MASTER SPECIFIC TOUR COMPARISON TABLE */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text, #ffffff)", marginBottom: "16px" }}>
          Master Tour Comparison Matrix (Specific Verified Excursions)
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860, background: "var(--panel, #0f172a)", borderRadius: "var(--radius-md, 12px)", overflow: "hidden", border: "1px solid var(--line, #334155)" }}>
            <thead>
              <tr style={{ background: "rgba(3, 14, 23, 0.9)", borderBottom: "1px solid var(--line, #334155)" }}>
                <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--accent, #f0b35b)", fontSize: "0.85rem" }}>Operator &amp; Specific Tour</th>
                <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--text, #ffffff)", fontSize: "0.85rem" }}>Glacier Time &amp; Location</th>
                <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--text, #ffffff)", fontSize: "0.85rem" }}>Physical Effort</th>
                <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--text, #ffffff)", fontSize: "0.85rem" }}>Base Price / Person</th>
                <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--text, #ffffff)", fontSize: "0.85rem" }}>Best For</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "0.9rem" }}>
              {/* TEMSCO WALK */}
              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#ffffff" }}>
                  <strong>TEMSCO</strong><br />
                  <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.82rem" }}>Mendenhall Glacier Guided Walk</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  20–25 min on ice<br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Mendenhall Glacier</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>Easy / Gentle</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Pull-on overboots</span>
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $409 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>~$442 at checkout</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  First-time flyers, families, multi-generational groups
                </td>
              </tr>

              {/* COASTAL LANDING */}
              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#ffffff" }}>
                  <strong>Coastal</strong><br />
                  <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.82rem" }}>Icefield Tour with Glacier Landing</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  25–30 min on ice<br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Herbert Glacier</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>Easy / Gentle</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Glacier boots provided</span>
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $429 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>~$463 at checkout</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  Scenic flight enthusiasts &amp; boutique Herbert Glacier landings
                </td>
              </tr>

              {/* NORTHSTAR WALKABOUT */}
              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#ffffff" }}>
                  <strong>NorthStar</strong><br />
                  <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.82rem" }}>Helicopter Glacier Walkabout</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>Full 1 hour on ice</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Mendenhall Glacier</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>Moderate Walking</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Crampons &amp; pole (Ages 8+)</span>
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $499 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>~$539 at checkout</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  Active guests wanting 1 full hr on ice without technical climbing
                </td>
              </tr>

              {/* NORTHSTAR TREK */}
              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#ffffff" }}>
                  <strong>NorthStar</strong><br />
                  <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.82rem" }}>Level 1 Glacier Ice Trek</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>2 hours on ice</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Mendenhall Deep Icefield</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>Active Mountaineering</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Steel crampons, boots, harness</span>
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $549 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>~$593 at checkout</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  Hikers exploring deep crevasses, moulins, and blue ice walls
                </td>
              </tr>

              {/* TEMSCO DOG SLED */}
              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#ffffff" }}>
                  <strong>TEMSCO</strong><br />
                  <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.82rem" }}>Glacier Dog Sledding Tour</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  ~1 hr at alpine camp<br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Herbert Glacier Camp</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>Easy / Moderate</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Ride sled or stand on runners</span>
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $659 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>~$712 at checkout</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  Iconic dog sledding with Iditarod mushers on Herbert Glacier
                </td>
              </tr>

              {/* COASTAL DOG SLED */}
              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#ffffff" }}>
                  <strong>Coastal</strong><br />
                  <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.82rem" }}>Dog Sled Tour on Herbert Glacier</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  ~1 hr at alpine camp<br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Herbert Glacier Camp</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>Easy / Moderate</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Ride sled or stand on runners</span>
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $709 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>~$766 at checkout</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  Boutique small-group dog sledding on Herbert Glacier
                </td>
              </tr>

              {/* NORTHSTAR DOG SLED */}
              <tr>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#ffffff" }}>
                  <strong>NorthStar</strong><br />
                  <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.82rem" }}>Glacier Dogsled Adventure</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  ~1 hr at alpine camp<br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Norris Glacier Camp</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>Easy / Moderate</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Ride sled with partner musher (Ages 2+)</span>
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $739 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>~$798 at checkout</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  Exclusive Norris Glacier mushing camp adventure
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* QUESTION 1: GLACIER LANDING VS GUIDED WALK VS ICE TREK */}
      <section id="effort-comparison" style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--line, #334155)", borderRadius: "var(--radius-lg, 16px)", padding: "28px", marginBottom: "36px" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Decision Factor 1
        </span>
        <h2 style={{ fontSize: "1.5rem", color: "#ffffff", margin: "6px 0 14px" }}>
          Glacier Landing vs. Guided Walk vs. Ice Trek: How Much Walking &amp; Effort Do You Want?
        </h2>
        <p style={{ lineHeight: 1.6, color: "var(--muted, #cbd5e1)", marginBottom: "16px" }}>
          Understanding physical demands and ice duration prevents mismatches. Juneau helicopter excursions fall into three distinct activity tiers:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px", marginBottom: "16px" }}>
          <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: "10px", padding: "18px" }}>
            <h3 style={{ fontSize: "1.05rem", color: "#93c5fd", margin: "0 0 6px" }}>
              Tier 1: Standard Glacier Landing (20–30 min)
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#e2e8f0", margin: "0 0 10px" }}>
              <strong>Offered by:</strong> TEMSCO ($409, Mendenhall) &amp; Coastal ($429, Herbert)
            </p>
            <ul style={{ fontSize: "0.85rem", color: "var(--muted, #94a3b8)", lineHeight: 1.55, paddingLeft: 18, margin: 0 }}>
              <li><strong>Time on Ice:</strong> 20 to 30 minutes.</li>
              <li><strong>Footwear:</strong> Slip-on rubber/neoprene overboots with traction soles fitting over your sneakers.</li>
              <li><strong>Terrain:</strong> Gentle, level ice near the helicopter skids.</li>
              <li><strong>Physical Demand:</strong> Minimal. If you can walk three city blocks, you can comfortably do this tour. Perfect for all ages (2+) and multi-generational families.</li>
            </ul>
          </div>

          <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: "10px", padding: "18px" }}>
            <h3 style={{ fontSize: "1.05rem", color: "#f0b35b", margin: "0 0 6px" }}>
              Tier 2: Glacier Walkabout (1 Full Hour on Ice)
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#e2e8f0", margin: "0 0 10px" }}>
              <strong>Offered by:</strong> NorthStar Trekking ($499 base, Mendenhall)
            </p>
            <ul style={{ fontSize: "0.85rem", color: "var(--muted, #94a3b8)", lineHeight: 1.55, paddingLeft: 18, margin: 0 }}>
              <li><strong>Time on Ice:</strong> Full 60 minutes exploring.</li>
              <li><strong>Footwear &amp; Gear:</strong> Traction crampons and trekking pole for enhanced stability.</li>
              <li><strong>Terrain:</strong> Natural undulating ice formations, meltwater pools, and blue crevasse edges.</li>
              <li><strong>Physical Demand:</strong> Moderate. Ideal for active travelers who want more than 20 minutes on ice without requiring technical climbing harnesses. Minimum age 8+.</li>
            </ul>
          </div>

          <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: "10px", padding: "18px" }}>
            <h3 style={{ fontSize: "1.05rem", color: "#38bdf8", margin: "0 0 6px" }}>
              Tier 3: Guided Ice Trek &amp; Climb (2+ Hours)
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#e2e8f0", margin: "0 0 10px" }}>
              <strong>Offered by:</strong> NorthStar Trekking ($549 Trek / $599 Climb)
            </p>
            <ul style={{ fontSize: "0.85rem", color: "var(--muted, #94a3b8)", lineHeight: 1.55, paddingLeft: 18, margin: 0 }}>
              <li><strong>Time on Ice:</strong> 2 to 2.5 hours deep on the glacier.</li>
              <li><strong>Footwear &amp; Gear:</strong> Sturdy mountain boots, steel crampons, harness, rainwear, and trekking poles (plus ice axes/ropes for climbing).</li>
              <li><strong>Terrain:</strong> Hiking ridges, peering down 100-foot moulins, navigating deep blue ice labyrinths.</li>
              <li><strong>Physical Demand:</strong> Strenuous. Requires solid fitness and cardio endurance. Minimum age 12+.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* QUESTION 2: GLACIER DOG SLEDDING OPTIONS */}
      <section id="dog-sledding-options" style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--line, #334155)", borderRadius: "var(--radius-lg, 16px)", padding: "28px", marginBottom: "36px" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Decision Factor 2
        </span>
        <h2 style={{ fontSize: "1.5rem", color: "#ffffff", margin: "6px 0 14px" }}>
          Glacier Dog Sledding: Which Specific Tours Offer It and What’s Included?
        </h2>
        <p style={{ fontSize: "0.95rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.6, marginBottom: 18 }}>
          Contrary to common misconceptions, <strong>all three Juneau helicopter operators offer glacier dog sledding excursions</strong> during the snow season (mid-May to mid-to-late August). Each operator flies to a dedicated summer alpine snowfield camp:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16, marginBottom: 18 }}>
          {/* TEMSCO DOG SLED */}
          <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: "10px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--accent, #f0b35b)", fontWeight: 800, textTransform: "uppercase" }}>TEMSCO Helicopters</span>
                <h3 style={{ fontSize: "1.05rem", color: "#ffffff", margin: "2px 0 0" }}>Herbert Glacier Dog Sledding</h3>
              </div>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#10b981" }}>$659 base</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--muted, #94a3b8)", lineHeight: 1.5, margin: "0 0 10px" }}>
              Fly 30 minutes total over the icefield to a camp of 100+ Alaskan huskies on Herbert Glacier snowfields. Spend ~1 hour at camp with a 20-minute sled run and time with puppies. Operates mid-May through late August.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+dog+sledding&pid=P00058396&mcid=42383&medium=api"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.78rem", padding: "6px 10px" }}
              >
                Viator →
              </a>
              <a
                href="https://fareharbor.com/embeds/book/temscoair-juneau/items/214810/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.75rem", padding: "6px 10px" }}
              >
                Direct (FareHarbor 214810) ↗
              </a>
            </div>
          </div>

          {/* COASTAL DOG SLED */}
          <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: "10px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--accent, #f0b35b)", fontWeight: 800, textTransform: "uppercase" }}>Coastal Helicopters</span>
                <h3 style={{ fontSize: "1.05rem", color: "#ffffff", margin: "2px 0 0" }}>Herbert Glacier Dog Sled Tour</h3>
              </div>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#10b981" }}>$709 base</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--muted, #94a3b8)", lineHeight: 1.5, margin: "0 0 10px" }}>
              Scenic helicopter flight to Coastal&apos;s dedicated dog camp on Herbert Glacier snowfields. Meet professional racing mushers, cuddle huskies, and ride across snowfields. Operates mid-May to mid-August.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+Coastal+dog+sledding&pid=P00058396&mcid=42383&medium=api"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.78rem", padding: "6px 10px" }}
              >
                Viator →
              </a>
              <a
                href="https://coastalhelicopters.com/tours/dog-sled-tours/"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.75rem", padding: "6px 10px" }}
              >
                Coastal Direct ↗
              </a>
            </div>
          </div>

          {/* NORTHSTAR DOG SLED */}
          <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: "10px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--accent, #f0b35b)", fontWeight: 800, textTransform: "uppercase" }}>NorthStar Trekking</span>
                <h3 style={{ fontSize: "1.05rem", color: "#ffffff", margin: "2px 0 0" }}>Norris Glacier Dogsled Adventure</h3>
              </div>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#10b981" }}>$739 base</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--muted, #94a3b8)", lineHeight: 1.5, margin: "0 0 10px" }}>
              Helicopter transit to Norris Glacier snowfields for an Iditarod musher partner camp excursion. Total duration 3.25 hours, suitable for ages 2+. Operates mid-May through mid-to-late August.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+dog+sledding&pid=P00058396&mcid=42383&medium=api"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.78rem", padding: "6px 10px" }}
              >
                Viator →
              </a>
              <a
                href="https://fareharbor.com/embeds/book/northstartrekking/items/115991/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.75rem", padding: "6px 10px" }}
              >
                Direct (FareHarbor 115991) ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* QUESTION 3: TOTAL PRICE AND INCLUSIONS */}
      <section id="pricing-inclusions" style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--line, #334155)", borderRadius: "var(--radius-lg, 16px)", padding: "28px", marginBottom: "36px" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Decision Factor 3
        </span>
        <h2 style={{ fontSize: "1.5rem", color: "#ffffff", margin: "6px 0 14px" }}>
          Total Price &amp; Inclusions: What Comparable Experiences Actually Cost
        </h2>
        <p style={{ lineHeight: 1.6, color: "var(--muted, #cbd5e1)", marginBottom: "16px" }}>
          Helicopter tour pricing includes aviation turbine fuel, pilot staffing, insurance, and Forest Service permits. When comparing prices across operators, distinguish direct published base fares from checkout totals:
        </p>

        <div style={{ overflowX: "auto", marginBottom: "18px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680, background: "#0c121e", borderRadius: 8, overflow: "hidden", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "#1e293b", borderBottom: "1px solid #334155", color: "#ffffff" }}>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Tour Category</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Operator &amp; Tour</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Direct Base Rate</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Est. Checkout Total</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Transportation &amp; Gear</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#93c5fd" }}>Glacier Landing Walk</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>TEMSCO Mendenhall Walk</td>
                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>$409 base</td>
                <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>~$442 (incl. 5% tax + 3% fee)</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>Free cruise shuttle + overboots</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#93c5fd" }}>Glacier Landing Walk</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>Coastal Icefield Landing</td>
                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>$429 base</td>
                <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>~$463 (incl. 5% tax + 3% fee)</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>Free cruise shuttle + glacier boots</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#f0b35b" }}>Glacier Walkabout</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>NorthStar Glacier Walkabout</td>
                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>$499 base</td>
                <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>~$539 (incl. 5% tax + 3% fee)</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>Free shuttle + crampons &amp; pole (1 hr ice)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#38bdf8" }}>Glacier Ice Trek</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>NorthStar Level 1 Trek</td>
                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>$549 base</td>
                <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>~$593 (incl. 5% tax + 3% fee)</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>Free shuttle + boots, crampons, harness (2 hr ice)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#a855f7" }}>Glacier Dog Sledding</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>TEMSCO Herbert Glacier</td>
                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>$659 base</td>
                <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>~$712 (incl. 5% tax + 3% fee)</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>Free cruise shuttle + snow camp gear</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#a855f7" }}>Glacier Dog Sledding</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>Coastal Herbert Glacier</td>
                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>$709 base</td>
                <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>~$766 (incl. 5% tax + 3% fee)</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>Free cruise shuttle + dog camp gear</td>
              </tr>
              <tr>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#a855f7" }}>Glacier Dog Sledding</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>NorthStar Norris Glacier</td>
                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>$739 base</td>
                <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>~$798 (incl. 5% tax + 3% fee)</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>Free cruise shuttle + mushing gear</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
          <strong>Fee Breakdown Disclosure:</strong> All three operators include complimentary port dock shuttle transportation in their tour pricing. City of Juneau sales tax (5%) and merchant processing fees (typically 3%) are applied at checkout. Standard FAA weight and balance regulations apply across all three operators for guests weighing 250 lbs or more.
        </p>
      </section>

      {/* QUESTION 4: CRUISE TIMING AND PICKUP */}
      <section id="cruise-timing-pickup" style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--line, #334155)", borderRadius: "var(--radius-lg, 16px)", padding: "28px", marginBottom: "36px" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Decision Factor 4
        </span>
        <h2 style={{ fontSize: "1.5rem", color: "#ffffff", margin: "6px 0 14px" }}>
          Cruise Timing &amp; Dock Pickup: Which Departure Fits Your Port Day?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 18 }}>
          <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: 8, padding: "16px" }}>
            <h3 style={{ fontSize: "1rem", color: "#93c5fd", margin: "0 0 8px" }}>
              All 4 Juneau Docks Served
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
              Whether your ship berths at <strong>AJ Dock</strong> (south of downtown), <strong>Franklin Dock</strong>, <strong>Steamship Wharf</strong>, or <strong>Marine Park</strong>, TEMSCO, Coastal, and NorthStar run marked shuttle vans directly from the security gate exit to their heliports. Travel time is 15 to 20 minutes each way.
            </p>
          </div>

          <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: 8, padding: "16px" }}>
            <h3 style={{ fontSize: "1rem", color: "#93c5fd", margin: "0 0 8px" }}>
              The 90-Minute Safety Buffer
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
              Always choose a departure slot that starts at least <strong>60 to 90 minutes after your ship docks</strong> (to clear customs and gangway lines) and returns to the cruise terminal at least <strong>60 to 90 minutes before your ship&apos;s All Aboard time</strong>.
            </p>
          </div>
        </div>

        <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
          💡 <em>Local Tip:</em> TEMSCO has the largest fleet (ASTAR 350s) and offers departures every 30 to 45 minutes, making them the easiest to match if your ship has a narrow morning or late afternoon port window. Coastal and NorthStar run curated small-group flight waves.
        </p>
      </section>

      {/* QUESTION 5: CANCELLATION AND WEATHER TERMS */}
      <section id="cancellation-weather" style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--line, #334155)", borderRadius: "var(--radius-lg, 16px)", padding: "28px", marginBottom: "40px" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Decision Factor 5
        </span>
        <h2 style={{ fontSize: "1.5rem", color: "#ffffff", margin: "6px 0 14px" }}>
          Cancellation &amp; Weather Terms: What Happens If Plans Change or Fog Rolls In?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 18 }}>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, padding: "16px" }}>
            <h3 style={{ fontSize: "1rem", color: "#6ee7b7", margin: "0 0 6px" }}>
              ✓ 100% Weather Refund Guarantee
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#d1fae5", lineHeight: 1.5, margin: 0 }}>
              If your flight is cancelled by TEMSCO, Coastal, or NorthStar due to weather or flight safety, you receive an immediate <strong>100% full refund</strong>. You are never penalized for Alaska weather.
            </p>
          </div>

          <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 8, padding: "16px" }}>
            <h3 style={{ fontSize: "1rem", color: "#fcd34d", margin: "0 0 6px" }}>
              ⚠️ Passenger Change Cutoffs
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#fef3c7", lineHeight: 1.5, margin: 0 }}>
              If you cancel voluntarily, TEMSCO and NorthStar require 48 hours notice for a full refund; Coastal requires 7 days notice. However, if your cruise ship skips Juneau or arrives too late to make your tour, all three operators issue full refunds upon verification.
            </p>
          </div>
        </div>

        <p style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
          <strong>The JFD Weather Advantage:</strong> If morning pass cameras indicate your flight might be scrubbed, Juneau Flight Deck coordinators can immediately assist in rebooking you onto afternoon slots or securing same-day backup seats on whale-watching catamarans (which operate in rain and fog) so you don&apos;t waste your day in port.
        </p>
      </section>

      {/* RECOMMENDATIONS BY TRAVELER NEED WITH BOOKING BUTTONS */}
      <section id="recommendations" style={{ marginBottom: "48px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p className="eyebrow" style={{ color: "var(--accent, #f0b35b)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: 800 }}>
            Which Operator Should You Book?
          </p>
          <h2 style={{ fontSize: "1.85rem", color: "#ffffff", margin: "6px 0 10px" }}>
            Recommendations by Traveler Need
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--muted, #cbd5e1)", maxWidth: 680, margin: "auto" }}>
            Match your group&apos;s physical appetite, bucket-list priorities, and budget to the right specific tour:
          </p>
        </div>

        <div style={{ display: "grid", gap: "24px" }}>
          {/* NEED 1: FAMILIES & GENTLE WALK */}
          <div style={{ background: "var(--panel, #0f172a)", border: "1px solid #1e293b", borderRadius: "var(--radius-md, 12px)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Best Value &amp; Highest Frequency (Gentle Walk)
                </span>
                <h3 style={{ fontSize: "1.35rem", color: "#ffffff", margin: "4px 0" }}>
                  TEMSCO: Mendenhall Glacier Guided Walk
                </h3>
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981" }}>From $409 base</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.6, marginBottom: 16 }}>
              <strong>Why this wins:</strong> Accessible, low-stress, and iconic. You fly past rainforest valleys directly onto Mendenhall Glacier. The 25 minutes on the ice are spent on gentle, level terrain with provided overboots. Perfect if you have kids (ages 2+) or grandparents who want the thrill of walking on ancient ice without strenuous hiking.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.85rem", padding: "8px 16px" }}
              >
                Check Mendenhall Walk on Viator →
              </a>
              <a
                href="https://fareharbor.com/embeds/book/temscoair-juneau/items/214803/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                🏢 Book TEMSCO Direct (FareHarbor) ↗
              </a>
            </div>
          </div>

          {/* NEED 2: SCENIC FLYING & HERBERT GLACIER */}
          <div style={{ background: "var(--panel, #0f172a)", border: "1px solid #1e293b", borderRadius: "var(--radius-md, 12px)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Best Scenic Icefield Flight &amp; Herbert Glacier Landing
                </span>
                <h3 style={{ fontSize: "1.35rem", color: "#ffffff", margin: "4px 0" }}>
                  Coastal Helicopters: Icefield Tour with Glacier Landing
                </h3>
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981" }}>From $429 base</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.6, marginBottom: 16 }}>
              <strong>Why this wins:</strong> Coastal excels at panoramic flightseeing through mountain passes directly to Herbert Glacier, offering 25 to 30 minutes on ancient blue ice away from high-traffic zones. (Note: The historic Taku Glacier Lodge salmon feast is operated by Wings Airways using classic seaplanes, while Coastal is Juneau&apos;s premier boutique helicopter operator).
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+Coastal+Helicopters&pid=P00058396&mcid=42383&medium=api"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.85rem", padding: "8px 16px" }}
              >
                Check Coastal on Viator →
              </a>
              <a
                href="https://fareharbor.com/embeds/book/coastalhelicopters/items/413056/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                🏢 Book Coastal Direct (FareHarbor) ↗
              </a>
            </div>
          </div>

          {/* NEED 3: DOG SLEDDING COMPARISON */}
          <div style={{ background: "var(--panel, #0f172a)", border: "1px solid #1e293b", borderRadius: "var(--radius-md, 12px)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Best Bucket-List Adventure: Glacier Dog Sledding (All 3 Operators Compared)
                </span>
                <h3 style={{ fontSize: "1.35rem", color: "#ffffff", margin: "4px 0" }}>
                  Glacier Dog Sledding: TEMSCO vs. Coastal vs. NorthStar
                </h3>
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981" }}>From $659 – $739 base</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.6, marginBottom: 16 }}>
              <strong>Why this wins:</strong> All three operators fly to dedicated alpine snow camps from mid-May through mid/late August:
              <br />• <strong>TEMSCO ($659 base):</strong> Herbert Glacier snowfields, high flight frequency, longest running mushing camp.
              <br />• <strong>Coastal ($709 base):</strong> Herbert Glacier snowfields, boutique small-group departure waves.
              <br />• <strong>NorthStar ($739 base):</strong> Norris Glacier snowfields, partner musher camp, ages 2+ welcome.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="https://fareharbor.com/embeds/book/temscoair-juneau/items/214810/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                TEMSCO Dog Sled ($659) ↗
              </a>
              <a
                href="https://coastalhelicopters.com/tours/dog-sled-tours/"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                Coastal Dog Sled ($709) ↗
              </a>
              <a
                href="https://fareharbor.com/embeds/book/northstartrekking/items/115991/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                NorthStar Dogsled ($739) ↗
              </a>
              <Link
                href="/helicopter-waitlist?tour=dogsled"
                style={{ fontSize: "0.82rem", color: "var(--accent, #f0b35b)", fontWeight: 700, textDecoration: "none", marginLeft: 4 }}
              >
                Sold out? Join Waitlist →
              </Link>
            </div>
          </div>

          {/* NEED 4: ACTIVE HIKERS & CRAMPONS */}
          <div style={{ background: "var(--panel, #0f172a)", border: "1px solid #1e293b", borderRadius: "var(--radius-md, 12px)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Best for In-Depth Ice Time &amp; Technical Mountaineering
                </span>
                <h3 style={{ fontSize: "1.35rem", color: "#ffffff", margin: "4px 0" }}>
                  NorthStar: Glacier Walkabout ($499) &amp; Level 1 Ice Trek ($549)
                </h3>
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981" }}>From $499 – $549 base</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.6, marginBottom: 16 }}>
              <strong>Why this wins:</strong> NorthStar gives you far more ice time than standard landings. Choose the <strong>Glacier Walkabout</strong> ($499 base) for a full 60 minutes on Mendenhall ice with crampons and trekking poles (ages 8+), or step up to the <strong>Level 1 Glacier Ice Trek</strong> ($549 base) for 2 hours navigating deep crevasses, blue ice walls, and moulins with mountain boots and harnesses (ages 12+).
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="https://fareharbor.com/embeds/book/northstartrekking/items/116029/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.85rem", padding: "8px 16px" }}
              >
                Book Walkabout ($499) ↗
              </a>
              <a
                href="https://fareharbor.com/embeds/book/northstartrekking/items/116035/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                Book Level 1 Trek ($549) ↗
              </a>
              <Link
                href="/helicopter-waitlist?operator=northstar"
                style={{ fontSize: "0.82rem", color: "var(--accent, #f0b35b)", fontWeight: 700, textDecoration: "none", marginLeft: 4 }}
              >
                Sold out? Join Waitlist →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DEDICATED PAIRWISE COMPARISONS */}
      <section style={{ background: "rgba(15, 23, 42, 0.4)", border: "1px solid var(--line, #334155)", borderRadius: "var(--radius-lg, 16px)", padding: "26px", marginBottom: "40px" }}>
        <h3 style={{ fontSize: "1.2rem", color: "#ffffff", margin: "0 0 10px" }}>
          Specific Pairwise Operator Guides
        </h3>
        <p style={{ fontSize: "0.88rem", color: "var(--muted, #94a3b8)", lineHeight: 1.5, margin: "0 0 16px" }}>
          Need to drill down between two specific companies? Explore our dedicated head-to-head comparisons answering specific trade-offs:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <Link
            href="/temsco-vs-northstar-juneau"
            style={{ textDecoration: "none", background: "#0c121e", border: "1px solid #1e293b", borderRadius: 8, padding: "16px", display: "block" }}
          >
            <h4 style={{ color: "#38bdf8", margin: "0 0 6px", fontSize: "1rem" }}>
              TEMSCO vs. NorthStar →
            </h4>
            <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>
              Glacier Walk vs. Walkabout &amp; Ice Trek: deciding between 20 minutes of gentle walking or 1 to 2 hours of crampon hiking.
            </p>
          </Link>

          <Link
            href="/temsco-vs-coastal-juneau"
            style={{ textDecoration: "none", background: "#0c121e", border: "1px solid #1e293b", borderRadius: 8, padding: "16px", display: "block" }}
          >
            <h4 style={{ color: "#38bdf8", margin: "0 0 6px", fontSize: "1rem" }}>
              TEMSCO vs. Coastal →
            </h4>
            <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>
              Mendenhall vs. Herbert Glacier: comparing landing locations, dog sledding camps on Herbert, and fleet departure frequencies.
            </p>
          </Link>
        </div>
      </section>

      {/* Helpful Links */}
      <section style={{ borderTop: "1px solid var(--line, #334155)", paddingTop: "24px" }}>
        <h4 style={{ fontSize: "1rem", color: "#ffffff", marginBottom: "12px" }}>Related Port Day Resources</h4>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "8px", fontSize: "0.85rem" }}>
          <li>
            <Link href="/helicopter-waitlist" style={{ color: "var(--ice, #93c5fd)", textDecoration: "none" }}>
              → Alaska Cruise Fleet Helicopter Waitlist &amp; Port Berths
            </Link>
          </li>
          <li>
            <Link href="/juneau-dogsled-helicopter-tours" style={{ color: "var(--ice, #93c5fd)", textDecoration: "none" }}>
              → Helicopter Glacier Dog Sledding Tours &amp; Summer Camps
            </Link>
          </li>
          <li>
            <Link href="/juneau-helicopter-tour-sold-out" style={{ color: "var(--ice, #93c5fd)", textDecoration: "none" }}>
              → Juneau Helicopter Tours Sold Out? How to Get Open Seats
            </Link>
          </li>
          <li>
            <Link href="/juneau-helicopter-tour-weight-limits-and-seating" style={{ color: "var(--ice, #93c5fd)", textDecoration: "none" }}>
              → Helicopter Weight Limits, Surcharges, and Seating Math
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
