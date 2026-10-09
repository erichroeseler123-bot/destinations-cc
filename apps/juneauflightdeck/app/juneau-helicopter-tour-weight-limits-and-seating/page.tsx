import type { Metadata } from "next";
import Link from "next/link";
import HelicopterWaitlistForm from "../components/HelicopterWaitlistForm";
import HelicopterCabinSimulator from "../components/HelicopterCabinSimulator";
import CrossPortBackup from "../components/CrossPortBackup";

export const metadata: Metadata = {
  title: "Juneau Helicopter Tour Weight Limits, Surcharges & Seating Math | Juneau Flight Deck",
  description:
    "Interactive Airbus AStar 350 helicopter weight & balance simulator, FAA Part 135 rules, 250 lb comfort surcharges, and how dispatchers release 6th passenger seats.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau-helicopter-tour-weight-limits-and-seating" },
  openGraph: {
    title: "Juneau Helicopter Tour Weight Limits, Surcharges & Seating Math",
    description:
      "Interactive Airbus AStar 350 helicopter weight & balance simulator, FAA Part 135 rules, 250 lb comfort surcharges, and how dispatchers release 6th passenger seats.",
    url: "https://juneauflightdeck.com/juneau-helicopter-tour-weight-limits-and-seating",
  },
};

const simulatorAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Juneau Helicopter Cabin Payload & Seating Math Simulator",
  applicationCategory: "TravelApplication",
  operatingSystem: "All",
  description:
    "Interactive Airbus AStar 350 helicopter weight & balance simulator. Calculates combined party payload, FAA Part 135 comfort surcharges (250 lb threshold), center of gravity distribution, and 6th-seat manual dispatch unlock probability for Juneau glacier tours.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  provider: {
    "@type": "Organization",
    name: "Juneau Flight Deck",
    url: "https://juneauflightdeck.com",
  },
};

const weightFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the weight limit for a Juneau helicopter tour?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most Juneau operators set a standard surcharge threshold at 250 lbs (113 kg) fully clothed with boots. Passengers exceeding this limit typically purchase an additional comfort seat (or pay a surcharge of 50% to 100% of the ticket) to ensure aircraft weight and balance limits remain compliant with FAA regulations.",
      },
    },
    {
      "@type": "Question",
      name: "How are seats assigned on Juneau glacier helicopters?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Seat assignments are strictly determined by flight dispatchers and pilots using computer weight-and-balance software. Passengers cannot reserve specific seats in advance. Seating is configured to balance the aircraft's center of gravity across its lateral and longitudinal axes.",
      },
    },
    {
      "@type": "Question",
      name: "Can our group of 6 fly together on one helicopter?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, on Airbus AStar 350 airframes configured for 6 passengers, provided the total combined passenger and fuel weight falls within maximum gross takeoff weight for current temperature and wind conditions. Online booking engines frequently cap departures at 5 passengers to prevent accidental over-weighting, but our local dispatch team can check flight manifests directly with the operator to see if a 6th seat can be released for lighter groups.",
      },
    },
    {
      "@type": "Question",
      name: "Are weigh-ins private at the heliport?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All three Juneau commercial heliports (TEMSCO, Coastal, NorthStar) utilize discreet scales at the check-in desk where the weight readout is visible only to ground crew staff entering data into the FAA flight manifest.",
      },
    },
  ],
};

export default function HelicopterWeightLimitsPage() {
  return (
    <main className="page-shell" style={{ maxWidth: 940, margin: "auto", padding: "40px 20px 80px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(simulatorAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(weightFaqSchema) }}
      />

      <p className="eyebrow">Flight Logistics &amp; Regulations</p>
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.7rem)", fontWeight: 900, lineHeight: 1.2, margin: "10px 0 18px", color: "var(--text)" }}>
        Juneau Helicopter Tour Weight Limits, Surcharges &amp; Seating Math
      </h1>
      <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--muted)", marginBottom: "32px" }}>
        Weight and balance isn&apos;t just tour company policy—it is federal aviation law under FAA Part 135. Understanding how helicopter weight math works can save you money, prevent check-in surprises, and even uncover seats on flights that appear sold out.
      </p>

      {/* Interactive Helicopter Cabin Payload Simulator */}
      <section style={{ marginBottom: "40px" }}>
        <HelicopterCabinSimulator />
      </section>

      {/* Overview Card */}
      <section
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "26px 28px",
          marginBottom: "36px",
        }}
      >
        <div style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          Key Rule of Thumb
        </div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", margin: "0 0 12px" }}>
          The 250 lb Standard Surcharge Threshold
        </h2>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 14px" }}>
          Across Juneau’s three licensed operators (TEMSCO, Coastal, and NorthStar), guests weighing <strong>250 lbs (113 kg) or more</strong> fully dressed with daypack and outerwear are typically required to pay a surcharge (often 50% to 100% of the seat price) or reserve a dedicated comfort seat.
        </p>
        <div style={{ padding: "12px 16px", background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ice)", lineHeight: 1.5 }}>
            <strong>Why it matters:</strong> Be honest when submitting passenger weights at booking. If a passenger weighs in significantly heavier at check-in than stated on the booking, the pilot may be forced by FAA regulations to bump that passenger without a refund if the aircraft exceeds gross weight limits.
          </p>
        </div>
      </section>

      {/* The Physics: FAA Weight & Balance */}
      <section style={{ display: "grid", gap: "24px", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", margin: "0 0 4px" }}>
          Behind the Scenes: How Helicopters Balance Weight
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "18px" }}>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "20px" }}>
            <h3 style={{ color: "var(--ice)", fontSize: "1.1rem", margin: "0 0 8px" }}>Airbus AStar 350 (The Workhorse)</h3>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--muted)", margin: 0 }}>
              The primary helicopter flown by Juneau operators is the Eurocopter/Airbus AS350 AStar. It carries up to 6 passengers plus pilot, but total payload (fuel + baggage + humans) is strictly calibrated for high-altitude mountain hover performance.
            </p>
          </div>

          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "20px" }}>
            <h3 style={{ color: "var(--ice)", fontSize: "1.1rem", margin: "0 0 8px" }}>Center of Gravity (CG)</h3>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--muted)", margin: 0 }}>
              A helicopter hangs from its rotor mast like a pendulum. If front passengers are too heavy, the nose pitches down; if side weights are uneven, the aircraft banks. Pilots must balance passenger placement so the cyclic stick has full control authority.
            </p>
          </div>

          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "20px" }}>
            <h3 style={{ color: "var(--ice)", fontSize: "1.1rem", margin: "0 0 8px" }}>No Guaranteed Front Seats</h3>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--muted)", margin: 0 }}>
              Because of CG math, no operator in Alaska guarantees front-row seating. Seating is assigned right before boarding by the ramp lead. The good news: AStar helicopters have massive wraparound bubble glass, ensuring unobstructed views from every seat.
            </p>
          </div>
        </div>
      </section>

      {/* The 6th Passenger Unlock Section */}
      <section
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "30px 28px",
          marginBottom: "40px",
        }}
      >
        <div style={{ color: "var(--accent-strong)", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          The Juneau Flight Deck Advantage
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: "0 0 14px" }}>
          How Our Team Can Unlock a &ldquo;Sold Out&rdquo; 6th Passenger Seat
        </h2>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 16px" }}>
          Online booking engines (including Viator, ship excursion desks, and direct web forms) are rigid algorithms. To prevent risk of exceeding gross aircraft weight, websites frequently cap departures at <strong>5 seats</strong> even though the Airbus AStar has 6 passenger positions.
        </p>
        <p style={{ lineHeight: 1.65, color: "var(--text)", margin: "0 0 16px" }}>
          <strong>Here is what our local team does:</strong>
        </p>
        <ul style={{ paddingLeft: "20px", lineHeight: 1.8, color: "var(--text)", margin: "0 0 20px" }}>
          <li>
            We live here in Juneau and work directly with local operator dispatchers daily.
          </li>
          <li>
            When a party of 5 or 6 finds a flight that says &ldquo;only 4 seats left&rdquo; or &ldquo;sold out,&rdquo; we can review the total group weights.
          </li>
          <li>
            If the booked passengers on that departure are lighter than average, dispatch can calculate that the gross payload margin is safe and <strong>release the 6th seat manually</strong>.
          </li>
        </ul>
        <div style={{ padding: "14px 18px", background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.3)", borderRadius: "var(--radius-sm)" }}>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "#34d399", fontWeight: 700 }}>
            Flexible Booking Options: Once dispatch approves a seat release, reservations can be confirmed directly with the operator or via our official Viator partner checkout under standard operator terms.
          </p>
        </div>
      </section>

      {/* Cross-Port Backup Routing */}
      <section style={{ marginBottom: "40px" }}>
        <CrossPortBackup currentPort="Juneau" desiredTourType="dogsled" />
      </section>

      {/* Intake / Waitlist Section */}
      <section id="waitlist" style={{ marginTop: "30px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>
          Have a Group or Need Weight Confirmation?
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
          Let us know your ship date, party count, and approximate individual weights. Our coordinators will check live manifests with Juneau operators.
        </p>
        <HelicopterWaitlistForm />
      </section>

      {/* Related Resources */}
      <section style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "1.1rem", color: "var(--text)", marginBottom: "12px" }}>Related Resources</h3>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "10px" }}>
          <li>
            <Link href="/juneau-helicopter-tour-sold-out" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; What to do when Juneau helicopter tours show sold out
            </Link>
          </li>
          <li>
            <Link href="/temsco-vs-coastal-vs-northstar-juneau" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; TEMSCO vs Coastal vs NorthStar: Comparing Juneau Operators
            </Link>
          </li>
          <li>
            <Link href="/best-time-for-glacier-dog-sledding-juneau" style={{ color: "var(--ice)", textDecoration: "none", fontWeight: 700 }}>
              &rarr; Best time for glacier dog sledding in Juneau (Month-by-month guide)
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
