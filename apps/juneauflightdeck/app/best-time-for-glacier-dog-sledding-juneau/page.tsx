import type { Metadata } from "next";
import Link from "next/link";
import HelicopterWaitlistForm from "../components/HelicopterWaitlistForm";

export const metadata: Metadata = {
  title: "Best Time for Glacier Dog Sledding in Juneau (Month-by-Month Guide) | Juneau Flight Deck",
  description:
    "Month-by-month breakdown of snow conditions, weather cancellation risks, and camp operating windows for Juneau helicopter dog sledding tours.",
  alternates: { canonical: "https://juneauflightdeck.com/best-time-for-glacier-dog-sledding-juneau" },
  openGraph: {
    title: "Best Time for Glacier Dog Sledding in Juneau, Alaska",
    description:
      "Insider month-by-month breakdown of icefield snow conditions, cancellation percentages, and cruise port planning for helicopter dog sledding.",
    url: "https://juneauflightdeck.com/best-time-for-glacier-dog-sledding-juneau",
  },
};

const dogSledFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the best month for glacier dog sledding in Juneau?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Mid-June through late July provides the most reliable snowpack on the Juneau Icefield, the lowest cancellation rates of the season, and comfortable summer temperatures for both passengers and sled dogs.",
      },
    },
    {
      "@type": "Question",
      name: "Why do helicopter dog sledding tours have higher cancellation rates than regular glacier walks?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Dog sledding camps are positioned at higher elevations (typically 2,500 to 3,500 feet on Herbert or Norris Glacier) where snow remains year-round. This requires higher cloud ceilings for pilots to safely clear mountain passes under FAA Visual Flight Rules (VFR). If clouds drop below pass minimums, dog sledding cancels even when lower glacier walkabouts (1,500 ft) are still flying.",
      },
    },
    {
      "@type": "Question",
      name: "What happens to my money if my Juneau dog sled flight cancels due to weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every tour booked through Juneau Flight Deck via our official Viator partnership includes an automatic 100% full refund guarantee for weather cancellations. If pilots ground the flight, your money is completely safe.",
      },
    },
    {
      "@type": "Question",
      name: "Can you do helicopter dog sledding in Juneau in late August or September?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Dog sledding camps generally conclude operations between late August and early September as summer melt turns snow into slush and autumn weather fronts arrive. If traveling in September, standard glacier walkabouts or guided ice trekking are the recommended helicopter alternatives.",
      },
    },
  ],
};

export default function BestTimeDogSleddingPage() {
  return (
    <main className="page-shell" style={{ maxWidth: 940, margin: "auto", padding: "40px 20px 80px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dogSledFaqSchema) }}
      />

      <p className="eyebrow">Juneau Excursion Strategy</p>
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.7rem)", fontWeight: 900, lineHeight: 1.2, margin: "10px 0 18px", color: "var(--text)" }}>
        Best Time for Glacier Dog Sledding in Juneau: Month-by-Month Guide
      </h1>
      <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--muted)", marginBottom: "32px" }}>
        Helicopter dog sledding is the most sought-after cruise excursion in Alaska. Because camps sit thousands of feet up on the Juneau Icefield, snow conditions and weather risks change dramatically across the summer season.
      </p>

      {/* Quick Summary Card */}
      <section
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "26px 28px",
          marginBottom: "36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <span style={{ fontSize: "1.2rem" }}>🎯</span>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-strong)", margin: 0 }}>
            The Quick Answer
          </h2>
        </div>
        <p style={{ lineHeight: 1.65, color: "var(--text)", margin: "0 0 12px" }}>
          <strong>The sweet spot is June 10 through July 25.</strong> During this 6-week window, high-elevation snow is firm, temperatures are mild, dog teams are fully acclimated, and Southeast Alaska experiences its lowest seasonal rainfall.
        </p>
        <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
          However, dog sledding is viable from mid-May through late August. Here is the realistic breakdown for each month of the cruise season.
        </p>
      </section>

      {/* Month by Month Breakdown */}
      <section style={{ display: "grid", gap: "24px", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", margin: "0 0 4px" }}>
          Month-by-Month Icefield Conditions
        </h2>

        {/* May */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ice)", margin: 0 }}>May: Deep Snow &amp; Season Opening</h3>
            <span style={{ padding: "4px 10px", background: "rgba(240, 179, 91, 0.15)", color: "var(--accent)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 700 }}>
              Cancellation Risk: ~25-35%
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: "var(--text)", margin: "0 0 10px" }}>
            Camps usually set up in early to mid-May. The snowpack is deep and winter-like. Mountain air is crisp and clear between storm fronts, with dramatic snow-capped peaks in all directions.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: 0, fontSize: "0.92rem" }}>
            <strong>Consideration:</strong> Spring weather in northern Southeast Alaska can be unpredictable, with passing low ceilings. Dress warmly in waterproof layers.
          </p>
        </div>

        {/* June */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ice)", margin: 0 }}>June: The Gold Standard</h3>
            <span style={{ padding: "4px 10px", background: "rgba(52, 211, 153, 0.15)", color: "#34d399", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 700 }}>
              Cancellation Risk: ~15-25% (Lowest of Season)
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: "var(--text)", margin: "0 0 10px" }}>
            June delivers 18+ hours of daylight, firmer snow trails, and historical lows for precipitation in Juneau. Sled dog mushers consider June prime running season because trails remain solid under morning crusts.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: 0, fontSize: "0.92rem" }}>
            <strong>Consideration:</strong> June flights sell out 3 to 6 months in advance. If your June port date is sold out, enter our Availability Watch immediately.
          </p>
        </div>

        {/* July */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ice)", margin: 0 }}>July: Warmest Weather &amp; Glacial Meltwater</h3>
            <span style={{ padding: "4px 10px", background: "rgba(52, 211, 153, 0.15)", color: "#34d399", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 700 }}>
              Cancellation Risk: ~20-30%
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: "var(--text)", margin: "0 0 10px" }}>
            July offers comfortable glacier temperatures (frequently 50°F to 60°F on sunny days). Dog sled trails are actively groomed every morning. Stunning turquoise melt pools begin appearing around camp perimeters.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: 0, fontSize: "0.92rem" }}>
            <strong>Consideration:</strong> Afternoon snow can get slushy on hot days. Morning departures (8:00 AM - 11:30 AM) generally offer firmer trails for sled runners.
          </p>
        </div>

        {/* August */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ice)", margin: 0 }}>August: Summer Transition &amp; High Melt</h3>
            <span style={{ padding: "4px 10px", background: "rgba(240, 179, 91, 0.15)", color: "var(--accent)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 700 }}>
              Cancellation Risk: ~30-40%
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: "var(--text)", margin: "0 0 10px" }}>
            By August, rain increases in Southeast Alaska and high-elevation snow lines recede. Early August remains fully operational, but by the third or fourth week, camps begin preparing to fly dogs back down to valley kennels.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: 0, fontSize: "0.92rem" }}>
            <strong>Consideration:</strong> Always have a concrete backup plan (such as whale watching) booked or lined up if flying in late August.
          </p>
        </div>

        {/* September */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ice)", margin: 0 }}>September: Camp Closure Window</h3>
            <span style={{ padding: "4px 10px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 700 }}>
              Availability: Extremely Limited to Closed
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: "var(--text)", margin: "0 0 10px" }}>
            Almost all Juneau dog sled camps pack up by late August or the first days of September. However, <strong>regular glacier landings and guided glacier treks operate through late September</strong> and are magnificent in autumn colors.
          </p>
        </div>
      </section>

      {/* The Cancellation Reality & Juneau Flight Deck Advantage */}
      <section
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "30px 28px",
          marginBottom: "40px",
        }}
      >
        <div style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          The Local Coordination Difference
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: "0 0 14px" }}>
          What Happens If Your Flight Is Weather-Delayed or Canceled?
        </h2>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 16px" }}>
          In Alaska, safety is non-negotiable. FAA Part 135 regulations forbid flying when mountain passes drop below visibility thresholds. Here is how Juneau Flight Deck protects your trip:
        </p>

        <ul style={{ paddingLeft: "20px", lineHeight: 1.8, color: "var(--text)", margin: "0 0 20px" }}>
          <li>
            <strong>100% Financial Refund via Viator:</strong> When booked through our Viator partner links, any weather cancellation is refunded in full to your card automatically.
          </li>
          <li>
            <strong>Proactive Morning Monitoring:</strong> Our team checks morning dispatch weather reports before cruise shuttles depart. We know pass status before cruise shore excursion desks announce it.
          </li>
          <li>
            <strong>Same-Day Whale Watching Pivot:</strong> If cloud cover prevents glacier landings, our local coordinators help switch you to an Auke Bay whale watching boat so your port day isn&apos;t wasted sitting on the ship.
          </li>
        </ul>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
          <Link href="/helicopter" className="button button-primary">
            Browse Helicopter Tours
          </Link>
          <Link href="/juneau-whale-watching-tours" className="button button-secondary">
            View Whale Watching Backups
          </Link>
        </div>
      </section>

      {/* Waitlist Call to Action */}
      <section id="waitlist" style={{ marginTop: "30px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>
          Can&apos;t Find an Open Dog Sledding Slot?
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
          Cruise lines hold large seat blocks that drop 14 to 30 days before port day. Submit your details below to join our Availability Watch.
        </p>
        <HelicopterWaitlistForm />
      </section>

      {/* Helpful Links */}
      <section style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "1.1rem", color: "var(--text)", marginBottom: "12px" }}>Related Guides</h3>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "10px" }}>
          <li>
            <Link href="/juneau-helicopter-tour-sold-out" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; Juneau Helicopter Tours Sold Out? How to Get Seats
            </Link>
          </li>
          <li>
            <Link href="/temsco-vs-coastal-vs-northstar-juneau" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; TEMSCO vs Coastal vs NorthStar: Juneau Operator Comparison
            </Link>
          </li>
          <li>
            <Link href="/juneau-helicopter-tour-weight-limits-and-seating" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; Juneau Helicopter Tour Weight Limits, Surcharges &amp; Seating Math
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
