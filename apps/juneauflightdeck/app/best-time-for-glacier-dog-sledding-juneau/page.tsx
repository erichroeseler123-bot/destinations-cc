import type { Metadata } from "next";
import Link from "next/link";
import HelicopterWaitlistForm from "../components/HelicopterWaitlistForm";

export const metadata: Metadata = {
  title: "Best Time for Glacier Dog Sledding in Juneau (Month-by-Month Guide) | Juneau Flight Deck",
  description:
    "Month-by-month guide to icefield snow conditions, weather factors, and camp operating windows for Juneau helicopter dog sledding tours.",
  alternates: { canonical: "https://juneauflightdeck.com/best-time-for-glacier-dog-sledding-juneau" },
  openGraph: {
    title: "Best Time for Glacier Dog Sledding in Juneau, Alaska",
    description:
      "Month-by-month breakdown of icefield snow conditions, weather factors, and cruise port planning for helicopter dog sledding.",
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
        text: "June and July typically offer the most favorable combination of stable icefield snow conditions, long daylight hours, and milder summer temperatures for both passengers and sled dog teams.",
      },
    },
    {
      "@type": "Question",
      name: "Why do helicopter dog sledding tours experience weather cancellations more frequently than regular glacier walks?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Dog sledding camps are established at high elevations (typically 2,500 to 3,500 feet on Herbert or Norris Glacier) where snow remains year-round. This requires higher cloud ceilings for pilots to safely clear mountain passes under FAA Visual Flight Rules (VFR). If low coastal clouds or fog obscure the passes, dog sledding flights cannot depart even when lower-elevation glacier walks (around 1,500 ft) are still able to land.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if my Juneau dog sled flight cancels due to weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If a flight is grounded by the operator due to weather or safety under FAA regulations, passengers are eligible for a 100% refund under published operator cancellation terms. Standard refund processing follows your payment issuer or booking platform timelines.",
      },
    },
    {
      "@type": "Question",
      name: "Can you do helicopter dog sledding in Juneau in late August or September?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Dog sledding camps generally conclude operations between late August and early September as summer melt reduces upper snowpack and autumn weather fronts arrive. If traveling in September, standard glacier walkabouts or guided ice trekking are the recommended helicopter alternatives.",
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
        Helicopter dog sledding is one of the most sought-after cruise excursions in Alaska. Because dog camps sit thousands of feet up on the Juneau Icefield, snowpack conditions, visibility requirements, and operating windows shift across the summer season.
      </p>

      {/* Seasonal Overview Card */}
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
            Seasonal Overview
          </h2>
        </div>
        <p style={{ lineHeight: 1.65, color: "var(--text)", margin: "0 0 12px" }}>
          <strong>Mid-summer (June through mid-July) generally provides the most stable snow conditions and longest daylight.</strong> During these peak summer weeks, high-elevation snow is firm on morning runs, temperatures are mild, and dog teams are fully settled into camp routines.
        </p>
        <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
          Dog sledding camps operate from mid-May through late August, subject to weather conditions and pass visibility. Here is an overview of how conditions evolve through the season.
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
            <h3 style={{ fontSize: "1.25rem", color: "var(--ice)", margin: 0 }}>May: Deep Snow &amp; Camp Setup</h3>
            <span style={{ padding: "4px 10px", background: "rgba(240, 179, 91, 0.15)", color: "var(--accent)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 700 }}>
              Season Phase: Opening / High Snowpack
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: "var(--text)", margin: "0 0 10px" }}>
            Camps set up on the icefield in early to mid-May. The winter snowpack is at its deepest, and surrounding peaks remain fully snow-covered.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: 0, fontSize: "0.92rem" }}>
            <strong>Operational note:</strong> Spring weather in northern Southeast Alaska frequently brings passing frontal systems with low cloud decks over mountain passes. Warm waterproof gear is essential.
          </p>
        </div>

        {/* June */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ice)", margin: 0 }}>June: Firm Trails &amp; Peak Daylight</h3>
            <span style={{ padding: "4px 10px", background: "rgba(52, 211, 153, 0.15)", color: "#34d399", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 700 }}>
              Season Phase: Prime Trail Conditions
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: "var(--text)", margin: "0 0 10px" }}>
            June delivers 18+ hours of daylight and consistently firm morning trail conditions. Sled dog mushers favor this period because trails hold their shape well after overnight freezes.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: 0, fontSize: "0.92rem" }}>
            <strong>Operational note:</strong> June is among the fastest months to book out on cruise ship excursion desks. Entering the waitlist early helps monitor cancellation releases.
          </p>
        </div>

        {/* July */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ice)", margin: 0 }}>July: Warm Days &amp; Glacial Meltwater</h3>
            <span style={{ padding: "4px 10px", background: "rgba(52, 211, 153, 0.15)", color: "#34d399", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 700 }}>
              Season Phase: Mid-Summer
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: "var(--text)", margin: "0 0 10px" }}>
            July brings the warmest temperatures to the icefield, often reaching 50°F to 60°F on sunny afternoons. Dog mushing crews groom trails daily to maintain consistent tracks, and blue melt pools form along glacier edges.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: 0, fontSize: "0.92rem" }}>
            <strong>Operational note:</strong> High afternoon temperatures can soften the snow surface. Morning flight slots typically offer firmer conditions for sled runners.
          </p>
        </div>

        {/* August */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ice)", margin: 0 }}>August: Late Season &amp; Snowline Receding</h3>
            <span style={{ padding: "4px 10px", background: "rgba(240, 179, 91, 0.15)", color: "var(--accent)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 700 }}>
              Season Phase: Late Summer Melt
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: "var(--text)", margin: "0 0 10px" }}>
            By August, persistent summer melting reduces upper snowpacks and precipitation increases across the region. Early August maintains regular operations, but toward the second half of the month, operators prepare to demobilize camps and fly dogs to winter kennels.
          </p>
          <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: 0, fontSize: "0.92rem" }}>
            <strong>Operational note:</strong> For late August port calls, having an alternate tour in mind—such as an Auke Bay whale watch—is sound planning.
          </p>
        </div>

        {/* September */}
        <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ice)", margin: 0 }}>September: Camp Closure &amp; Glacier Landing Alternatives</h3>
            <span style={{ padding: "4px 10px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 700 }}>
              Season Phase: Dog Camps Closed
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: "var(--text)", margin: "0 0 10px" }}>
            High-elevation dog sledding camps wrap up operations by early September. However, <strong>standard glacier landings and guided ice trekking continue through late September</strong>, showcasing deep blue crevasses and autumn mountain light.
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
          Operational Policies &amp; Contingencies
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: "0 0 14px" }}>
          What Happens If Your Flight Is Weather-Delayed or Canceled?
        </h2>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 16px" }}>
          In Alaska, safety is determined strictly by FAA Visual Flight Rules (VFR) and chief pilot discretion. If mountain pass weather drops below legal visibility minimums, flights do not launch. Here is how your booking is protected:
        </p>

        <ul style={{ paddingLeft: "20px", lineHeight: 1.8, color: "var(--text)", margin: "0 0 20px" }}>
          <li>
            <strong>100% Weather Refund Policy:</strong> When an operator cancels a flight due to weather, passengers are eligible for a 100% refund under standard published operator and platform cancellation terms.
          </li>
          <li>
            <strong>Morning Weather Tracking:</strong> Our team checks morning dispatch reports before cruise shuttles depart, keeping you informed on mountain pass conditions as early as possible.
          </li>
          <li>
            <strong>Whale Watching Backups:</strong> If low cloud cover prevents glacier flights, our local coordinators help check for open seats on Auke Bay whale watching boats so you can still make the most of your port day.
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
          Looking for Dog Sledding Openings?
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
          Our scanner sweeps operator fleet schedules daily at 10:00 AM as cancellations and group blocks process. Submit your details below to receive availability alerts.
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
