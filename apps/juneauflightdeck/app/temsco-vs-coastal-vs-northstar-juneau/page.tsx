import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TEMSCO vs Coastal vs NorthStar: Juneau Helicopter Comparison",
  description:
    "Compare Juneau's only 3 FAA Part 135 glacier helicopter operators: TEMSCO Helicopters, Coastal Helicopters, and NorthStar Trekking. Aircraft, landing locations, and tour styles.",
  alternates: { canonical: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau" },
  openGraph: {
    title: "TEMSCO vs Coastal vs NorthStar: Juneau Helicopter Comparison",
    description:
      "Insider comparison of Juneau's three FAA Part 135 helicopter operators: aircraft, glacier landings, dog sledding, and hiking treks.",
    url: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau",
  },
};

export default function OperatorComparisonPage() {
  return (
    <main className="page-shell" style={{ maxWidth: 960, margin: "auto", padding: "40px 20px 80px" }}>
      <p className="eyebrow">Juneau Operator Guide</p>
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.7rem)", fontWeight: 900, lineHeight: 1.2, margin: "10px 0 18px", color: "var(--text)" }}>
        TEMSCO vs Coastal vs NorthStar: Comparing Juneau&apos;s Helicopter Operators
      </h1>
      <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--muted)", marginBottom: "30px" }}>
        Every helicopter passenger flying to a glacier in Juneau is flown by one of exactly three FAA Part 135 licensed commercial operators. Here is an honest, independent comparison from local coordinators on the ground.
      </p>

      {/* Comparison Grid */}
      <section style={{ overflowX: "auto", marginBottom: "40px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650, background: "var(--panel)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <thead>
            <tr style={{ background: "rgba(3, 14, 23, 0.9)", borderBottom: "1px solid var(--line)" }}>
              <th style={{ padding: "16px", textAlign: "left", color: "var(--accent)", fontSize: "0.9rem" }}>Feature</th>
              <th style={{ padding: "16px", textAlign: "left", color: "var(--text)", fontSize: "0.9rem" }}>TEMSCO Helicopters</th>
              <th style={{ padding: "16px", textAlign: "left", color: "var(--text)", fontSize: "0.9rem" }}>Coastal Helicopters</th>
              <th style={{ padding: "16px", textAlign: "left", color: "var(--text)", fontSize: "0.9rem" }}>NorthStar Trekking</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ice)" }}>Primary Focus</td>
              <td style={{ padding: "14px 16px", color: "var(--text)" }}>Glacier Landings &amp; Dog Sledding</td>
              <td style={{ padding: "14px 16px", color: "var(--text)" }}>Icefield Walkabouts &amp; Taku Lodge</td>
              <td style={{ padding: "14px 16px", color: "var(--text)" }}>Guided Glacier Hiking &amp; Ice Climbing</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ice)" }}>Glacier Locations</td>
              <td style={{ padding: "14px 16px", color: "var(--muted)" }}>Mendenhall, Herbert Glacier</td>
              <td style={{ padding: "14px 16px", color: "var(--muted)" }}>Herbert, Norris, Taku Glacier</td>
              <td style={{ padding: "14px 16px", color: "var(--muted)" }}>Mendenhall High Icefield</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ice)" }}>Heliport Location</td>
              <td style={{ padding: "14px 16px", color: "var(--muted)" }}>Near Juneau Airport (Shuttle provided)</td>
              <td style={{ padding: "14px 16px", color: "var(--muted)" }}>Juneau North Airport Ramp</td>
              <td style={{ padding: "14px 16px", color: "var(--muted)" }}>Juneau Industrial Heliport</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ice)" }}>Physical Demand</td>
              <td style={{ padding: "14px 16px", color: "var(--muted)" }}>Easy to Moderate</td>
              <td style={{ padding: "14px 16px", color: "var(--muted)" }}>Easy to Moderate</td>
              <td style={{ padding: "14px 16px", color: "var(--muted)" }}>Moderate to Strenuous</td>
            </tr>
            <tr>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ice)" }}>Best For</td>
              <td style={{ padding: "14px 16px", color: "var(--accent-strong)", fontWeight: 700 }}>Families &amp; Dog Sledding Fans</td>
              <td style={{ padding: "14px 16px", color: "var(--accent-strong)", fontWeight: 700 }}>Scenic Flights &amp; Salmon Bakes</td>
              <td style={{ padding: "14px 16px", color: "var(--accent-strong)", fontWeight: 700 }}>Active Hikers &amp; Small Groups</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Operator Deep Dives */}
      <section style={{ display: "grid", gap: "28px", marginBottom: "40px" }}>
        {/* TEMSCO */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "26px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Official Viator Partner Operator
              </span>
              <h2 style={{ fontSize: "1.5rem", color: "var(--text)", margin: "4px 0 8px" }}>
                1. TEMSCO Helicopters (The Pioneer Operator)
              </h2>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--ice)", background: "rgba(151, 211, 255, 0.1)", border: "1px solid rgba(151, 211, 255, 0.25)", padding: "4px 10px", borderRadius: 8, fontWeight: 700 }}>
              2027 Season: May–September
            </span>
          </div>

          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 14px" }}>
            Founded in 1958, TEMSCO is the longest-operating commercial helicopter tour company in Alaska. Operating ASTAR 350 aircraft, they pioneered glacier landings on the Mendenhall Glacier and run the premier alpine dog sledding camp on the snowfields of Herbert Glacier.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 18px" }}>
            <strong>Signature Excursions:</strong> Mendenhall Glacier Guided Walkabout (approx. 2 hr 15 min total) and Glacier Dog Sledding via Helicopter (approx. 2 hr 45 min total).
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/helicopter-waitlist?operator=temsco" className="button button-primary">
              Join TEMSCO 2027 Waitlist &rarr;
            </Link>
            <Link href="/helicopter" className="button button-card">
              View Helicopter Specs
            </Link>
          </div>
        </div>

        {/* Coastal */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "26px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Official Viator Partner Operator
              </span>
              <h2 style={{ fontSize: "1.5rem", color: "var(--text)", margin: "4px 0 8px" }}>
                2. Coastal Helicopters (The Icefield Specialists)
              </h2>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--ice)", background: "rgba(151, 211, 255, 0.1)", border: "1px solid rgba(151, 211, 255, 0.25)", padding: "4px 10px", borderRadius: 8, fontWeight: 700 }}>
              2027 Season: May–September
            </span>
          </div>

          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 14px" }}>
            Coastal operates out of Juneau North Airport ramp and is renowned for deep icefield scenic routing across Herbert and Norris glaciers. They are also the exclusive aviation partner for the historic Taku Glacier Lodge salmon bake fly-in excursions.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 18px" }}>
            <strong>Signature Excursions:</strong> Juneau Icefield Helicopter Tour with Glacier Landing (approx. 2 hr 30 min) and Taku Glacier Lodge Flight &amp; Feast.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/helicopter-waitlist?operator=coastal" className="button button-primary">
              Join Coastal 2027 Waitlist &rarr;
            </Link>
            <Link href="/juneau/helicopter" className="button button-card">
              View Coastal Specs
            </Link>
          </div>
        </div>

        {/* NorthStar */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "26px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Official Viator Partner Operator
              </span>
              <h2 style={{ fontSize: "1.5rem", color: "var(--text)", margin: "4px 0 8px" }}>
                3. NorthStar Trekking (Small-Group Glacier Hiking)
              </h2>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--ice)", background: "rgba(151, 211, 255, 0.1)", border: "1px solid rgba(151, 211, 255, 0.25)", padding: "4px 10px", borderRadius: 8, fontWeight: 700 }}>
              2027 Season: May–September
            </span>
          </div>

          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 14px" }}>
            NorthStar specializes exclusively in small-group guided glacier hiking and technical ice climbing on the high ice of Mendenhall Glacier. Rather than a brief photo stop, guests strap on crampons, harness up, and explore moulins, blue ice crevasses, and ice formations with certified mountaineering guides.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 18px" }}>
            <strong>Signature Excursions:</strong> Level 1 Glacier Ice Trek (approx. 3 hr total) and Level 2 Advanced Glacier Ice Climb (approx. 4 hr total).
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/helicopter-waitlist?operator=northstar" className="button button-primary">
              Join NorthStar 2027 Waitlist &rarr;
            </Link>
            <Link href="/helicopter" className="button button-card">
              View Trekking Specs
            </Link>
          </div>
        </div>
      </section>

      {/* The Viator Partner & Local Advantage */}
      <section style={{ background: "var(--panel)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-lg)", padding: "30px 28px" }}>
        <h2 style={{ fontSize: "1.4rem", color: "var(--accent)", margin: "0 0 12px" }}>
          Why Book Through Juneau Flight Deck?
        </h2>
        <p style={{ lineHeight: 1.65, color: "var(--text)", margin: "0 0 16px" }}>
          We provide transparent comparison across Juneau’s three licensed operators, with options to book directly or via our official Viator partner checkout. All flights follow published operator cancellation policies, including full refunds if flights are grounded due to weather or safety.
        </p>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 20px" }}>
          Plus, you get our local ground team monitoring your ship&apos;s docking schedule, tracking morning weather passes, and helping coordinate backup activities like whale watching if mountain pass clouds ground your flight.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/" className="button button-primary">
            Compare Juneau Flights
          </Link>
          <Link href="/helicopter-waitlist" className="button button-secondary">
            Join Availability Watch
          </Link>
        </div>
      </section>
    </main>
  );
}
