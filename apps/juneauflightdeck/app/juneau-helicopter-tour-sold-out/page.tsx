import type { Metadata } from "next";
import Link from "next/link";
import HelicopterWaitlistForm from "../components/HelicopterWaitlistForm";
import JuneauPortAviationDecisionDesk from "../components/JuneauPortAviationDecisionDesk";

export const metadata: Metadata = {
  title: "Juneau Helicopter Tours Sold Out? Port Timing & Independent Options | Juneau Flight Deck",
  description:
    "Glacier flights or dog sledding showing sold out on your cruise ship? Check DCC port-window buffers, snow-camp season dates, verified Viator partner availability, or request a free concierge check.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau-helicopter-tour-sold-out" },
  openGraph: {
    title: "Juneau Helicopter Tours Sold Out? Port Timing & Independent Options",
    description:
      "Why ship blocks sell out early, how to verify safe pier-to-heliport return timing, and how to check independent Part 135 operator & partner availability.",
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
        text: "Yes, seats can open up. Capacity can shift when cruise line block allocations are adjusted, when other travelers change plans or cancel, or when dispatchers finalize aircraft weight and balance manifests.",
      },
    },
    {
      "@type": "Question",
      name: "How can you check if helicopter seats have opened back up?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Independent operator availability often differs from cruise line allotments because cruise lines only contract specific blocks. You can check operator schedules directly or submit your ship details so our local team can help check for matching openings.",
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
        Juneau Flight Deck helps Alaska cruise passengers evaluate helicopter glacier landings, snow-camp dog sledding, and ice-trekking excursions across Juneau&apos;s three FAA Part 135 operators (TEMSCO, Coastal, and NorthStar). Flights are operated by the named providers; bookings are completed either via disclosed third-party partner checkout (Viator) or directly with the operator.
      </p>
      <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "var(--muted)", marginBottom: "24px" }}>
        Glacier walkabouts and helicopter dog sledding are the first excursions to fill up in Alaska. If your cruise excursion desk says sold out, <strong>independent operator or partner allocations can differ from your cruise line&apos;s contracted block</strong> — though peak summer dates can reach full capacity across every aircraft.
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
        <Link href="#waitlist-form" className="primary-cta" style={{ fontSize: "0.9rem", padding: "10px 18px" }}>
          Request Free Availability Check →
        </Link>
        <Link href="/helicopter" className="button button-secondary" style={{ fontSize: "0.9rem", padding: "10px 18px" }}>
          Compare All 3 FAA Operators
        </Link>
        <Link href="/temsco-vs-coastal-vs-northstar-juneau" className="button button-secondary" style={{ fontSize: "0.9rem", padding: "10px 18px" }}>
          TEMSCO vs Coastal vs NorthStar
        </Link>
      </div>

      <JuneauPortAviationDecisionDesk />

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
          Inside the Port Logistics
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: "0 0 14px" }}>
          Why does your cruise ship say sold out when independent seats might still exist?
        </h2>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 16px" }}>
          Cruise lines negotiate dedicated seat blocks with Juneau&apos;s three FAA Part 135 operators (TEMSCO, Coastal, and NorthStar) well in advance. When the cruise allotment sells out, the ship&apos;s shore excursion desk marks the tour unavailable. However:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginTop: "20px" }}>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "18px" }}>
            <h3 style={{ color: "var(--ice)", fontSize: "1rem", margin: "0 0 8px" }}>Independent Seat Allocations</h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--muted)", margin: 0 }}>
              Operators hold back independent seats for direct booking and partner distribution. These slots do not show on the cruise line app.
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "18px" }}>
            <h3 style={{ color: "var(--ice)", fontSize: "1rem", margin: "0 0 8px" }}>Cruise Block Adjustments</h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--muted)", margin: 0 }}>
              Cruise lines reserve specific group blocks. As ship manifests finalize or group space is released back, operators may open additional capacity for public booking.
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "18px" }}>
            <h3 style={{ color: "var(--ice)", fontSize: "1rem", margin: "0 0 8px" }}>Manifest &amp; Weight Adjustments</h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--muted)", margin: 0 }}>
              Aircraft fly under strict FAA weight limits. When passenger weights balance favorably, dispatchers can occasionally open additional seats on scheduled departures.
            </p>
          </div>
        </div>
      </section>

      {/* How to Handle a Sold Out Tour */}
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
          What should you do if your ship&apos;s helicopter tour is full?
        </h2>
        <p style={{ lineHeight: 1.6, color: "var(--muted)", margin: "0 0 20px" }}>
          Follow these practical steps to check independent options safely without jeopardizing your ship schedule:
        </p>

        <ol style={{ paddingLeft: "20px", lineHeight: 1.8, color: "var(--text)", margin: "0 0 24px" }}>
          <li>
            <strong>Check the Three Local FAA Operators:</strong> Compare TEMSCO, Coastal, and NorthStar directly or via partner availability to see if independent departures remain open.
          </li>
          <li>
            <strong>Plan for a Safe Port Buffer:</strong> As a planning recommendation, choose a flight departure that returns to the heliport at least 90 to 120 minutes before your ship&apos;s published all-aboard time. Docks and heliports are roughly 15–20 minutes apart, giving you a comfortable margin for shuttle transit and dock security.
          </li>
          <li>
            <strong>Understand Weather Refund Policies by Channel:</strong> Southeast Alaska weather changes quickly. Under FAA Visual Flight Rules (VFR), pilots will ground flights if cloud ceilings or visibility drop below safe operational minimums. If the operator cancels due to weather:
            <ul style={{ marginTop: "6px", marginBottom: "6px", paddingLeft: "20px", color: "var(--muted)", fontSize: "0.92rem" }}>
              <li><strong>Direct Operator Bookings (TEMSCO, Coastal, NorthStar):</strong> All three primary Juneau helicopter operators provide a 100% full refund when flights are canceled due to weather.</li>
              <li><strong>Partner Channels (Viator):</strong> If the operator cancels for weather, you are entitled to a full refund through the platform. For voluntary cancellations initiated by the traveler, Viator offers free cancellation up to 24 hours prior to departure on most tours. Always review the specific terms on your booking confirmation.</li>
            </ul>
          </li>
          <li>
            <strong>Have a Shore Backup Plan:</strong> If morning flights are grounded by weather, have a ready alternative near the docks, such as the Mount Roberts Tramway or Auke Bay whale watching.
          </li>
        </ol>

        <div style={{ padding: "14px 18px", background: "rgba(240, 179, 91, 0.12)", border: "1px solid rgba(240, 179, 91, 0.35)", borderRadius: "var(--radius-sm)" }}>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--accent-strong)", fontWeight: 700 }}>
            Timing note: Local operators run regular shuttles between the cruise piers and their flight bases. Always tell the operator your ship name and berth so they can align pickup and drop-off times.
          </p>
        </div>
      </section>

      {/* Direct Intake Form */}
      <section id="waitlist-form" style={{ marginTop: "20px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", marginBottom: "8px" }}>
          Step 2B: Request a Qualified Availability Check for Your Port Date
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
          No payment or card hold is collected here. Share your ship schedule and party size below — your request routes directly to our Unified Operator Inbox with your port timing context so our team can check independent operator openings.
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
              &rarr; Browse Helicopter Availability Checks by Alaska Cruise Ship (All Lines &amp; Berths)
            </Link>
          </li>
          <li>
            <Link href="/juneau/cruise-excursions-vs-independent" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; Cruise Excursion Desk vs. Independent Booking: Policies &amp; Tradeoffs
            </Link>
          </li>
          <li>
            <Link href="/best-time-for-glacier-dog-sledding-juneau" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; Best Time for Glacier Dog Sledding (Snow-Camp Operating Window &amp; Weather Realities)
            </Link>
          </li>
          <li>
            <Link href="/juneau/what-to-do-if-helicopter-tour-canceled" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; What to do if your helicopter flight is grounded by weather on port day
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
