import type { Metadata } from "next";
import Link from "next/link";

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
        text: "A glacier landing or guided walk (offered by TEMSCO and Coastal) involves 20 to 25 minutes on the ice, walking on gentle terrain in provided slip-on overboots. An ice trek (offered by NorthStar Trekking) involves 1 to 2+ hours on the ice equipped with technical steel crampons, mountaineering boots, trekking poles, and harnesses to navigate crevasses and blue ice formations.",
      },
    },
    {
      "@type": "Question",
      name: "Which Juneau helicopter company offers glacier dog sledding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TEMSCO Helicopters is the only operator offering glacier dog sledding in Juneau, landing at their high-altitude summer dog camp on Herbert Glacier. Coastal Helicopters and NorthStar Trekking do not operate dog sled camps in Juneau.",
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
        <a href="#effort-comparison" style={{ fontSize: "0.85rem", color: "var(--ice, #e0f2fe)", textDecoration: "none", padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>1. Walk vs. Trek</a>
        <a href="#dog-sledding-options" style={{ fontSize: "0.85rem", color: "var(--ice, #e0f2fe)", textDecoration: "none", padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>2. Dog Sledding</a>
        <a href="#pricing-inclusions" style={{ fontSize: "0.85rem", color: "var(--ice, #e0f2fe)", textDecoration: "none", padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>3. Prices &amp; Inclusions</a>
        <a href="#cruise-timing-pickup" style={{ fontSize: "0.85rem", color: "var(--ice, #e0f2fe)", textDecoration: "none", padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>4. Port Timing &amp; Docks</a>
        <a href="#cancellation-weather" style={{ fontSize: "0.85rem", color: "var(--ice, #e0f2fe)", textDecoration: "none", padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>5. Weather &amp; Refunds</a>
        <a href="#recommendations" style={{ fontSize: "0.85rem", color: "var(--accent, #f0b35b)", fontWeight: 700, textDecoration: "none", padding: "4px 10px", background: "rgba(240, 179, 91, 0.15)", borderRadius: 6 }}>Top Recommendations ↓</a>
      </div>

      {/* MASTER SPECIFIC TOUR COMPARISON TABLE */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text, #ffffff)", marginBottom: "16px" }}>
          Master Tour Comparison Matrix (Specific Signature Excursions)
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780, background: "var(--panel, #0f172a)", borderRadius: "var(--radius-md, 12px)", overflow: "hidden", border: "1px solid var(--line, #334155)" }}>
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
                  From $409 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>+ 3% card fee/tax</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  First-time flyers, families, multi-generational groups
                </td>
              </tr>
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
                  From $659 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>+ 3% card fee/tax</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  Bucket-list dog sledding fans &amp; animal lovers
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#ffffff" }}>
                  <strong>Coastal</strong><br />
                  <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.82rem" }}>Juneau Icefield &amp; Glacier Landing</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  20–25 min on ice<br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Herbert or Norris Glacier</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>Easy / Gentle</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Glacier boots provided</span>
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  From $395 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>+ 3% card fee/tax</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  Scenic flight enthusiasts &amp; quiet icefield landings
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#ffffff" }}>
                  <strong>NorthStar</strong><br />
                  <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.82rem" }}>Level 1 Glacier Ice Trek</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>1 hr to 1 hr 15 min on ice</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Mendenhall Deep Icefield</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>Moderate Hike</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Steel crampons &amp; harness</span>
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  From $559 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>+ 3% card fee/tax</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  Active travelers wanting real hiking on crampons
                </td>
              </tr>
              <tr>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#ffffff" }}>
                  <strong>NorthStar</strong><br />
                  <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.82rem" }}>Level 2 Advanced Ice Climb</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>2+ hours on ice</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Vertical Glacier Seracs</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  <strong>Strenuous / Technical</strong><br />
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Ice axes, rope belaying</span>
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  From $699 base<br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>+ 3% card fee/tax</span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--accent, #f0b35b)", fontWeight: 600 }}>
                  Thrill-seekers, fit climbers, adventure sports lovers
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
          The biggest misunderstanding cruise passengers have is confusing a standard <em>glacier landing</em> with an <em>ice trek</em>. The physical effort, equipment, and duration on the ice are completely different:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px", marginBottom: "16px" }}>
          <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: "10px", padding: "18px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "#93c5fd", margin: "0 0 8px" }}>
              Standard Glacier Landing / Walkabout
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#e2e8f0", margin: "0 0 10px" }}>
              <strong>Offered by:</strong> TEMSCO (Mendenhall) &amp; Coastal (Herbert/Norris)
            </p>
            <ul style={{ fontSize: "0.85rem", color: "var(--muted, #94a3b8)", lineHeight: 1.55, paddingLeft: 18, margin: 0 }}>
              <li><strong>Time on Ice:</strong> 20 to 25 minutes.</li>
              <li><strong>Footwear:</strong> Operators provide rubber pull-on overboots with traction soles that slip over your sneakers.</li>
              <li><strong>Terrain:</strong> Level, gentle ice close to the helicopter skid pads.</li>
              <li><strong>Physical Demand:</strong> Minimal. If you can walk three city blocks, you can comfortably do this tour. Perfect for kids (ages 2+) and grandparents.</li>
            </ul>
          </div>

          <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: "10px", padding: "18px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "#93c5fd", margin: "0 0 8px" }}>
              Guided Ice Trek (Technical Hiking)
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#e2e8f0", margin: "0 0 10px" }}>
              <strong>Offered by:</strong> NorthStar Trekking (Level 1 &amp; Level 2)
            </p>
            <ul style={{ fontSize: "0.85rem", color: "var(--muted, #94a3b8)", lineHeight: 1.55, paddingLeft: 18, margin: 0 }}>
              <li><strong>Time on Ice:</strong> 1 hour to 2+ hours deep on the glacier.</li>
              <li><strong>Footwear &amp; Gear:</strong> Real mountaineering boots, steel crampons, climbing harnesses, rain gear, and trekking poles.</li>
              <li><strong>Terrain:</strong> Actively hiking over rolling ice ridges, looking down 100-foot moulins, navigating deep crevasses.</li>
              <li><strong>Physical Demand:</strong> Moderate to strenuous. Requires good ankle stability and cardio endurance. Minimum age 8+ (Level 1) or 15+ (Level 2).</li>
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
        <div style={{ padding: "14px 18px", background: "rgba(240, 179, 91, 0.12)", border: "1px solid rgba(240, 179, 91, 0.35)", borderRadius: 8, marginBottom: 16 }}>
          <strong style={{ color: "var(--accent, #f0b35b)" }}>Exclusive Juneau Operator:</strong>{" "}
          <span style={{ color: "#e2e8f0", fontSize: "0.92rem" }}>
            <strong>TEMSCO Helicopters is the ONLY operator in Juneau that runs a glacier dog sledding tour.</strong> Coastal and NorthStar do not offer dog sledding in Juneau. If your dream is dog sledding on snow, TEMSCO is your sole option in this port.
          </span>
        </div>

        <div style={{ background: "#0c121e", border: "1px solid #1e293b", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", color: "#ffffff", margin: 0 }}>
                TEMSCO Helicopter Glacier Dog Sledding on Herbert Glacier
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--accent, #f0b35b)", margin: "4px 0 0" }}>
                FareHarbor Item 214810 • 2 Hours 45 Minutes Total Excursion
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10b981" }}>From $659 base</span>
              <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8" }}>per person + fees</span>
            </div>
          </div>

          <p style={{ fontSize: "0.9rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.6, margin: "0 0 14px" }}>
            You fly across the Juneau Icefield to a remote summer mushing camp on the high alpine snowfields of Herbert Glacier. Over 100 Alaskan huskies live at this camp with professional mushers who compete in the Iditarod and Yukon Quest.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
              <strong style={{ color: "#93c5fd" }}>✓ What&apos;s Included:</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18, color: "#94a3b8" }}>
                <li>30 min scenic flightseeing</li>
                <li>~1 hour on the snowfield</li>
                <li>20–25 min dog sled ride</li>
                <li>Drive the sled on runners (optional)</li>
                <li>Time with huskies &amp; puppies</li>
                <li>Overboots &amp; cruise shuttle</li>
              </ul>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
              <strong style={{ color: "#f87171" }}>⚠️ What to Know:</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18, color: "#94a3b8" }}>
                <li>Seasonal: mid-May to late August only</li>
                <li>Sells out months in advance</li>
                <li>High-altitude snow conditions</li>
                <li>Backup in Skagway: TEMSCO Denver Glacier camp</li>
              </ul>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+dog+sledding&pid=P00058396&mcid=42383&medium=api"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.85rem", padding: "8px 16px" }}
            >
              Check TEMSCO Dog Sledding on Viator →
            </a>
            <a
              href="https://fareharbor.com/embeds/book/temscoair-juneau/items/214810/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-card"
              style={{ fontSize: "0.82rem", padding: "8px 14px" }}
            >
              🏢 Book TEMSCO Direct (FareHarbor) ↗
            </a>
            <Link
              href="/helicopter-waitlist?operator=temsco&tour=dogsled"
              style={{ fontSize: "0.82rem", color: "var(--accent, #f0b35b)", fontWeight: 700, textDecoration: "none", marginLeft: 4 }}
            >
              Sold out? Join Waitlist →
            </Link>
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
          Glacier helicopter tours have significant aviation operating costs. When comparing prices across operators, look at base fares versus final checkout charges:
        </p>

        <div style={{ overflowX: "auto", marginBottom: "18px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640, background: "#0c121e", borderRadius: 8, overflow: "hidden", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "#1e293b", borderBottom: "1px solid #334155", color: "#ffffff" }}>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Tour Category</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Operator &amp; Tour</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Base Rate</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Est. Checkout Total</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Transportation &amp; Gear</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#93c5fd" }}>Glacier Landing Walk</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>TEMSCO Mendenhall Walk</td>
                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>$409</td>
                <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>~$442 (incl. 5% tax + 3% fee)</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>Free cruise shuttle + overboots</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#93c5fd" }}>Glacier Landing Walk</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>Coastal Icefield Landing</td>
                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>$395 – $419</td>
                <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>~$428 – $453</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>Free cruise shuttle + glacier boots</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#93c5fd" }}>Glacier Dog Sledding</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>TEMSCO Herbert Glacier</td>
                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>$659 – $679</td>
                <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>~$712 – $734</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>Free cruise shuttle + dog camp gear</td>
              </tr>
              <tr>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#93c5fd" }}>Glacier Ice Trek</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>NorthStar Level 1 Trek</td>
                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>$559 – $589</td>
                <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>~$605 – $637</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>Free shuttle + crampons, boots, harness</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
          <strong>Fee Breakdown Disclosure:</strong> All three operators include complimentary port dock shuttle transportation in their tour pricing. City of Juneau sales tax (5%) and merchant processing fees (typically 3%) are applied at checkout. Weight surcharge policies apply across all three operators for guests weighing 250 lbs or more (standard FAA weight and balance regulations).
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
        <p style={{ lineHeight: 1.6, color: "var(--muted, #cbd5e1)", marginBottom: "16px" }}>
          Missing your ship is every cruise traveler&apos;s nightmare. Here is how ground logistics work across all three operators:
        </p>

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
          💡 <em>Local Tip:</em> TEMSCO has the largest fleet (ASTAR 350s) and offers the highest frequency of departures (staggered every 30 to 45 minutes), making them the easiest to match if your ship has a narrow morning or late afternoon port window.
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
        <p style={{ lineHeight: 1.6, color: "var(--muted, #cbd5e1)", marginBottom: "16px" }}>
          Helicopter tours in Southeast Alaska are governed by strict FAA visual flight rules (VFR). Coastal mountain passes frequently experience localized fog, low ceilings, or gusts that require grounding flights:
        </p>

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
                  Best for Families, First-Timers &amp; Multi-Generational Groups
                </span>
                <h3 style={{ fontSize: "1.35rem", color: "#ffffff", margin: "4px 0" }}>
                  TEMSCO: Mendenhall Glacier Guided Walk
                </h3>
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981" }}>From $409 base</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.6, marginBottom: 16 }}>
              <strong>Why this wins:</strong> Accessible, low-stress, and iconic. You fly past rainforest valleys directly onto Mendenhall Glacier. The 25 minutes on the ice are spent on gentle, level terrain with provided overboots. Perfect if you have kids (ages 2+) or grandparents who want the thrill of walking on ancient ice without technical hiking.
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

          {/* NEED 2: DOG SLEDDING */}
          <div style={{ background: "var(--panel, #0f172a)", border: "1px solid #1e293b", borderRadius: "var(--radius-md, 12px)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Best Bucket-List Adventure (The Only Juneau Dog Sled Camp)
                </span>
                <h3 style={{ fontSize: "1.35rem", color: "#ffffff", margin: "4px 0" }}>
                  TEMSCO: Helicopter Glacier Dog Sledding on Herbert Glacier
                </h3>
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981" }}>From $659 base</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.6, marginBottom: 16 }}>
              <strong>Why this wins:</strong> The definitive Alaska experience. You land at 3,500 feet on snowfields surrounded by jagged peaks. You meet real racing mushers, cuddle huskies, and take a 20-minute sled run through pure alpine snow. Unrivaled experience for dog lovers.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+dog+sledding&pid=P00058396&mcid=42383&medium=api"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.85rem", padding: "8px 16px" }}
              >
                Check Dog Sledding on Viator →
              </a>
              <a
                href="https://fareharbor.com/embeds/book/temscoair-juneau/items/214810/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                🏢 Book TEMSCO Direct (FareHarbor) ↗
              </a>
              <Link
                href="/helicopter-waitlist?operator=temsco&tour=dogsled"
                style={{ fontSize: "0.82rem", color: "var(--accent, #f0b35b)", fontWeight: 700, textDecoration: "none", marginLeft: 4 }}
              >
                Sold out? Join Waitlist →
              </Link>
            </div>
          </div>

          {/* NEED 3: ACTIVE HIKERS & CRAMPONS */}
          <div style={{ background: "var(--panel, #0f172a)", border: "1px solid #1e293b", borderRadius: "var(--radius-md, 12px)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Best for Active Hikers (Crampons, Deep Crevasses &amp; Moulins)
                </span>
                <h3 style={{ fontSize: "1.35rem", color: "#ffffff", margin: "4px 0" }}>
                  NorthStar Trekking: Level 1 Glacier Ice Trek
                </h3>
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981" }}>From $559 base</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.6, marginBottom: 16 }}>
              <strong>Why this wins:</strong> If 20 minutes on the ice sounds too short, NorthStar gives you over an hour of actual mountaineering. With steel crampons strapped to heavy-duty boots, your certified guide leads a small group (1:6 ratio) deep into sculpted blue ice formations, crevasses, and water-carved ice tunnels.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Trekking&pid=P00058396&mcid=42383&medium=api"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.85rem", padding: "8px 16px" }}
              >
                Check NorthStar Trek on Viator →
              </a>
              <a
                href="https://fareharbor.com/embeds/book/northstartrekking/items/116035/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                🏢 Book NorthStar Direct (FareHarbor) ↗
              </a>
              <Link
                href="/helicopter-waitlist?operator=northstar"
                style={{ fontSize: "0.82rem", color: "var(--accent, #f0b35b)", fontWeight: 700, textDecoration: "none", marginLeft: 4 }}
              >
                Sold out? Join Waitlist →
              </Link>
            </div>
          </div>

          {/* NEED 4: SCENIC FLYING & REMOTE SALMON BAKE */}
          <div style={{ background: "var(--panel, #0f172a)", border: "1px solid #1e293b", borderRadius: "var(--radius-md, 12px)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Best for Scenic Flightseeing &amp; Backcountry Dining
                </span>
                <h3 style={{ fontSize: "1.35rem", color: "#ffffff", margin: "4px 0" }}>
                  Coastal Helicopters: Juneau Icefield Landing &amp; Taku Lodge
                </h3>
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981" }}>From $395 base</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.6, marginBottom: 16 }}>
              <strong>Why this wins:</strong> Coastal excels at expansive aerial views across Herbert, Norris, and Taku glaciers, selecting landing sites based on optimal daily ice visibility. They also partner for fly-in wilderness dining at historic Taku Glacier Lodge featuring fresh wild Alaska salmon grilled over alder wood.
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
              Glacier Walk vs. Technical Ice Trek: deciding between 20 minutes of gentle walking or 1+ hours of crampon hiking.
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
              Mendenhall vs. Herbert &amp; Taku: comparing landing locations, dog sledding exclusivity, and salmon feast combos.
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
