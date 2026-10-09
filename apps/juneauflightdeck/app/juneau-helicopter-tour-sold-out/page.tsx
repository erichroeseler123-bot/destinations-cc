import type { Metadata } from "next";
import Link from "next/link";
import HelicopterWaitlistForm from "../components/HelicopterWaitlistForm";

export const metadata: Metadata = {
  title: "Juneau Helicopter Tours Sold Out? How to Get Seats | Juneau Flight Deck",
  description:
    "Glacier flights and dog sledding showing sold out for your Juneau port date? Learn how cruise blocks release seats and how to request help comparing operator availability.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau-helicopter-tour-sold-out" },
  openGraph: {
    title: "Juneau Helicopter Tours Sold Out? How to Find Open Seats",
    description:
      "Don't give up on sold-out Juneau glacier flights. How cruise blocks drop, how seats open up, and how our local team monitors and holds openings.",
    url: "https://juneauflightdeck.com/juneau-helicopter-tour-sold-out",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why do Juneau helicopter tours sell out so quickly?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cruise lines reserve massive blocks of seats with local operators (TEMSCO, Coastal, NorthStar) months in advance. Because aircraft capacity is strictly limited by FAA weight and balance regulations, prime departure slots appear fully booked long before the cruise season begins.",
      },
    },
    {
      "@type": "Question",
      name: "Do seats open up on sold-out Juneau helicopter tours?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, frequently. When cruise lines reach contractual cutoff dates (typically 14 to 30 days prior to sailing), unsold seats are released back into the open inventory. Additionally, ship schedule changes, guest cancellations, and aircraft re-configurations regularly create new seat openings.",
      },
    },
    {
      "@type": "Question",
      name: "How can I request availability assistance?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Request help checking helicopter tour availability for your port date and party size. Availability and reservations are confirmed by the operator.",
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
      name: "Sold Out Tours Guide",
      item: "https://juneauflightdeck.com/juneau-helicopter-tour-sold-out",
    },
  ],
};

export default function SoldOutGuidePage() {
  return (
    <main className="page-shell" style={{ maxWidth: 920, margin: "auto", padding: "40px 20px 80px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <p className="eyebrow">Juneau Port Day Solutions</p>
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.7rem)", fontWeight: 900, lineHeight: 1.2, margin: "10px 0 18px", color: "var(--text)" }}>
        Juneau Helicopter Tours Sold Out? Don&apos;t Panic.
      </h1>
      <p style={{ fontSize: "1.08rem", lineHeight: 1.6, color: "var(--ice)", marginBottom: "16px" }}>
        Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, availability assistance for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.
      </p>
      <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "var(--muted)", marginBottom: "24px" }}>
        Glacier walkabouts and helicopter dog sledding are the first excursions to sell out in Alaska. But in Southeast Alaska aviation, <strong>&ldquo;Sold Out&rdquo; rarely means zero chance of flying.</strong>
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "32px" }}>
        <Link href="/helicopter" className="primary-cta" style={{ fontSize: "0.9rem", padding: "10px 18px" }}>
          Check Live Open Tours →
        </Link>
        <Link href="/temsco-vs-coastal-vs-northstar-juneau" className="button button-secondary" style={{ fontSize: "0.9rem", padding: "10px 18px" }}>
          Compare Operators
        </Link>
        <Link href="/helicopter-waitlist" className="button button-secondary" style={{ fontSize: "0.9rem", padding: "10px 18px" }}>
          Set Ship Availability Alert
        </Link>
      </div>

      {/* The Block Release Reality */}
      <section
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "30px 28px",
          marginBottom: "36px",
        }}
      >
        <div style={{ color: "var(--accent)", fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          Inside the Industry
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: "0 0 14px" }}>
          Why Sold-Out Seats Reappear 7 to 30 Days Before Port Day
        </h2>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 16px" }}>
          The cruise lines hold enormous blocks of helicopter seats with all three FAA Part 135 operators (TEMSCO, Coastal, and NorthStar) months before the season starts. Here is what happens behind the scenes:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginTop: "20px" }}>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "18px" }}>
            <h3 style={{ color: "var(--ice)", fontSize: "1rem", margin: "0 0 8px" }}>1. Cruise Line Block Drops</h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--muted)", margin: 0 }}>
              Cruise lines have contractual release deadlines (often 30, 14, or 7 days out). Any seat they fail to sell gets handed back to the local operator for open public sale.
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "18px" }}>
            <h3 style={{ color: "var(--ice)", fontSize: "1rem", margin: "0 0 8px" }}>2. Ship Itinerary Shifts</h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--muted)", margin: 0 }}>
              Ships frequently modify arrival hours or swap port schedules due to tides or weather. When their port window shifts, groups cancel their bookings, instantly opening up flights.
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "18px" }}>
            <h3 style={{ color: "var(--ice)", fontSize: "1rem", margin: "0 0 8px" }}>3. Aircraft Weight Manifests</h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--muted)", margin: 0 }}>
              Helicopters operate under strict FAA weight limits. When passenger weights balance out favorably, dispatchers often release a 5th or 6th seat that was previously locked by the booking engine.
            </p>
          </div>
        </div>
      </section>

      {/* How Juneau Flight Deck Helps */}
      <section
        style={{
          background: "rgba(3, 14, 23, 0.7)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          padding: "30px 28px",
          marginBottom: "40px",
        }}
      >
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)", margin: "0 0 12px" }}>
          Request Help With Sold-Out Tours
        </h2>
        <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 20px" }}>
          Request help checking helicopter tour availability for your port date and party size. Availability and reservations are confirmed by the operator.
        </p>

        <ol style={{ paddingLeft: "20px", lineHeight: 1.8, color: "var(--text)", margin: "0 0 24px" }}>
          <li>
            <strong>You Submit Your Parameters:</strong> Port date, cruise ship, group size, and accepted tour styles.
          </li>
          <li>
            <strong>Availability Inquiry:</strong> Request assistance with your date, party size, and preferred experience.
          </li>
          <li>
            <strong>Provider Terms:</strong> Review current cancellation and missed-port terms before paying.
          </li>
          <li>
            <strong>Operator Confirmation:</strong> Complete any reservation through the operator or authorized booking provider.
          </li>
        </ol>

        <div style={{ padding: "14px 18px", background: "rgba(240, 179, 91, 0.12)", border: "1px solid rgba(240, 179, 91, 0.35)", borderRadius: "var(--radius-sm)" }}>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--accent-strong)", fontWeight: 700 }}>
            Standard Operator Protection: Whether booking directly with the operator or via Viator partner checkout, flights grounded by weather are eligible for a 100% refund under standard operator terms.
          </p>
        </div>
      </section>

      {/* Direct Intake Form */}
      <section id="waitlist-form" style={{ marginTop: "20px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", marginBottom: "8px" }}>
          Request an Availability Watch
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
          Tell us your ship schedule and party details below. Our team reviews matching availability and will reach out as soon as seats open up.
        </p>
        <HelicopterWaitlistForm />
      </section>

      {/* Helpful Links */}
      <section style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "1.1rem", color: "var(--text)", marginBottom: "12px" }}>Helpful Resources</h3>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "10px" }}>
          <li>
            <Link href="/helicopter" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; Compare all 3 Juneau Helicopter Operators (TEMSCO, Coastal, NorthStar)
            </Link>
          </li>
          <li>
            <Link href="/helicopter-waitlist" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; Browse Helicopter Waitlists by Alaska Cruise Ship (All Lines &amp; Berths)
            </Link>
          </li>
          <li>
            <Link href="/juneau/cruise-excursions-vs-independent" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; Cruise Excursion Desk vs. Independent Booking ($80–$150 savings)
            </Link>
          </li>
          <li>
            <Link href="/best-time-for-glacier-dog-sledding-juneau" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; Best Time for Glacier Dog Sledding (Operating Dates &amp; Weather Realities)
            </Link>
          </li>
          <li>
            <Link href="/juneau-whale-watching-tours" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; Explore Auke Bay Whale Watching (Top Weather Backup Plan)
            </Link>
          </li>
          <li>
            <Link href="/juneau/what-to-do-if-helicopter-tour-canceled" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; What to do if your helicopter flight is canceled on port day
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
