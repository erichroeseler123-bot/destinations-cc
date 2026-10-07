import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Juneau Flight Deck | Alaska Cruise Excursions & Coordination",
  description:
    "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons, port timing, sold-out alerts, and weather alternatives.",
  alternates: { canonical: "https://juneauflightdeck.com/about" },
};

export default function AboutPage() {
  return (
    <main className="page-shell static-page-shell">
      <section className="static-page-card">
        <p className="eyebrow">About Juneau Flight Deck</p>
        <h1 className="static-page-title" style={{ lineHeight: 1.25, marginBottom: "18px" }}>
          Compare &amp; Book Juneau Cruise Excursions with Confidence
        </h1>
        <p className="chooser-trust-line" style={{ fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "24px", color: "var(--ice)" }}>
          Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, availability alerts for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.
        </p>

        {/* 4 Operational Pillars */}
        <div style={{ display: "grid", gap: "20px", margin: "28px 0" }}>
          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-md)",
              padding: "20px 22px",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", color: "var(--accent)", margin: "0 0 8px", fontWeight: 800 }}>
              1. What We Provide
            </h2>
            <p style={{ lineHeight: 1.6, color: "var(--text)", margin: 0, fontSize: "0.95rem" }}>
              We provide side-by-side operator comparisons across TEMSCO, Coastal, and NorthStar, ship-safe port timing calculations (with conservative 90 to 120-minute safety buffers), daily 10:00 AM availability alerts when sold-out dates reopen, and ground assistance if weather impacts your flight.
            </p>
          </div>

          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-md)",
              padding: "20px 22px",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", color: "var(--accent)", margin: "0 0 8px", fontWeight: 800 }}>
              2. Who Operates Your Tour
            </h2>
            <p style={{ lineHeight: 1.6, color: "var(--text)", margin: 0, fontSize: "0.95rem" }}>
              All flights, glacier landings, and dog sledding camps are operated directly by Juneau&apos;s licensed FAA Part 135 commercial helicopter operators: <strong>TEMSCO Helicopters</strong>, <strong>Coastal Helicopters</strong>, and <strong>NorthStar Trekking</strong>. Marine wildlife tours are operated by licensed local Auke Bay whale watching captains.
            </p>
          </div>

          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-md)",
              padding: "20px 22px",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", color: "var(--accent)", margin: "0 0 8px", fontWeight: 800 }}>
              3. Who Handles Payment &amp; Policies
            </h2>
            <p style={{ lineHeight: 1.6, color: "var(--text)", margin: 0, fontSize: "0.95rem" }}>
              Tours are booked at published operator and partner rates via FareHarbor or our official Viator partner checkout (powered by Tripadvisor). Juneau Flight Deck does not add separate platform booking fees or hold passenger funds; transactions, ticket delivery, and refunds are governed directly by the booking provider&apos;s and operating carrier&apos;s published terms.
            </p>
          </div>

          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-md)",
              padding: "20px 22px",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", color: "var(--accent)", margin: "0 0 8px", fontWeight: 800 }}>
              4. How Availability Alerts &amp; Weather Alternatives Work
            </h2>
            <p style={{ lineHeight: 1.6, color: "var(--text)", margin: "0 0 10px", fontSize: "0.95rem" }}>
              <strong>Sold-Out Alerts:</strong> When cruise line excursion desks show sold out, our automated sweep engine monitors operator schedules daily at 10:00 AM AKDT as cancellation desks process adjustments and unbooked wholesale allocations are returned to operator inventory. If matching seats open, we send direct booking links so you can reserve under standard provider terms. (Openings depend on passenger cancellations and operator capacity; availability is not guaranteed on every sailing date.)
            </p>
            <p style={{ lineHeight: 1.6, color: "var(--text)", margin: 0, fontSize: "0.95rem" }}>
              <strong>Weather Alternatives:</strong> Southeast Alaska glacier flights operate strictly under FAA Visual Flight Rules (VFR). If cloud ceilings or dense fog close mountain passes, full refunds are issued directly by the booking provider and operating carrier under their published weather policies. Our local team assists by identifying available alternatives—such as Auke Bay whale watching charters or land-based glacier tours—which operate subject to boat capacity and require separate booking.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "28px" }}>
          <Link href="/helicopter" className="primary-cta">
            Find Your Tour
          </Link>
          <Link
            href="/temsco-vs-coastal-vs-northstar-juneau"
            className="primary-cta"
            style={{ background: "transparent", border: "1px solid var(--line)", color: "var(--text)" }}
          >
            Compare Operators
          </Link>
          <Link
            href="/helicopter-waitlist"
            className="primary-cta"
            style={{ background: "transparent", border: "1px solid var(--line)", color: "var(--text)" }}
          >
            Sold-Out Availability Alerts
          </Link>
        </div>
      </section>
    </main>
  );
}
