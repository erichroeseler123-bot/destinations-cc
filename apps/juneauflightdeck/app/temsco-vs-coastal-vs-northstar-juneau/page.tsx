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
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "26px" }}>
          <h2 style={{ fontSize: "1.4rem", color: "var(--text)", margin: "0 0 10px" }}>1. TEMSCO Helicopters (The Pioneer Operator)</h2>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 14px" }}>
            Founded in 1958, TEMSCO is the longest-operating commercial helicopter tour company in Alaska. They pioneered glacier landings on the Mendenhall Glacier and operate the legendary dog sledding camp on the snowfields of the Herbert Glacier.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 14px" }}>
            <strong>Why choose TEMSCO:</strong> If you want the classic Alaska helicopter dog sledding experience or a quintessential 25-minute glacier landing walkabout, TEMSCO is the gold standard.
          </p>
          <Link href="/helicopter" className="button button-card" style={{ display: "inline-block" }}>
            View TEMSCO Flights &rarr;
          </Link>
        </div>

        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "26px" }}>
          <h2 style={{ fontSize: "1.4rem", color: "var(--text)", margin: "0 0 10px" }}>2. Coastal Helicopters (The Icefield Specialists)</h2>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 14px" }}>
            Coastal operates out of Juneau North Airport and is famed for diverse landing routes across the broader Juneau Icefield, including Herbert and Norris Glaciers. They also partner with historic Taku Glacier Lodge for famous fly-in salmon feasts.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 14px" }}>
            <strong>Why choose Coastal:</strong> Outstanding extended icefield scenic routes and world-class culinary combo flights.
          </p>
          <Link href="/juneau/helicopter" className="button button-card" style={{ display: "inline-block" }}>
            View Coastal Flights &rarr;
          </Link>
        </div>

        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "26px" }}>
          <h2 style={{ fontSize: "1.4rem", color: "var(--text)", margin: "0 0 10px" }}>3. NorthStar Trekking (Small-Group Glacier Hiking)</h2>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 14px" }}>
            NorthStar specializes exclusively in small-group guided glacier hiking and technical ice climbing on the high ice of Mendenhall Glacier. Rather than a brief photo stop, guests strap on crampons, harness up, and hike deep into crevasses and ice caves with experienced mountaineering guides.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 14px" }}>
            <strong>Why choose NorthStar:</strong> Perfect for adventurous travelers who want real physical engagement with the glacier, small group ratios, and technical ice trekking.
          </p>
          <Link href="/juneau-dogsled-helicopter-tours" className="button button-card" style={{ display: "inline-block" }}>
            View NorthStar Treks &rarr;
          </Link>
        </div>
      </section>

      {/* The Viator Partner & Local Advantage */}
      <section style={{ background: "var(--panel)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-lg)", padding: "30px 28px" }}>
        <h2 style={{ fontSize: "1.4rem", color: "var(--accent)", margin: "0 0 12px" }}>
          Why Book Through Juneau Flight Deck?
        </h2>
        <p style={{ lineHeight: 1.65, color: "var(--text)", margin: "0 0 16px" }}>
          We are an official Viator partner (a Tripadvisor company). When you book with us, your reservation is processed through the world’s most trusted booking platform with guaranteed secure checkout, transparent pricing, and 100% weather refunds.
        </p>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 20px" }}>
          Plus, you get our local ground team monitoring your ship&apos;s docking schedule, holding sold-out seats on your behalf, and immediately pivoting you to whale watching if mountain pass clouds ground your flight.
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
