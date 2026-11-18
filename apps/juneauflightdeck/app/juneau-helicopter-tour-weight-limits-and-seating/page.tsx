import type { Metadata } from "next";
import Link from "next/link";
import HelicopterWaitlistForm from "../components/HelicopterWaitlistForm";
import HelicopterCabinSimulator from "../components/HelicopterCabinSimulator";
import CrossPortBackup from "../components/CrossPortBackup";
import OperatorIdentityMark from "../components/OperatorIdentityMark";
import SourcesAndFreshness from "../components/SourcesAndFreshness";
import { buildFlightGuideJsonLd } from "@/lib/operatorSchema";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
  VERIFIED_TARIFF_DATE_LONG,
} from "@/lib/verifiedOperatorPricing";

export const metadata: Metadata = {
  title: "Juneau Helicopter Tour Weight Limits, Surcharges & Seating Math | Juneau Flight Deck",
  description:
    "Interactive Airbus AStar 350 helicopter weight & balance simulator and verified November 18, 2026 weight surcharge rules across TEMSCO (+$150 at 250+ lbs), Coastal ($609/$918 tiers), and NorthStar (+$250 at 250+ lbs).",
  alternates: {
    canonical: "https://juneauflightdeck.com/juneau-helicopter-tour-weight-limits-and-seating",
  },
  openGraph: {
    title: "Juneau Helicopter Tour Weight Limits, Surcharges & Seating Math",
    description:
      "Compare exact clothed weight surcharges across TEMSCO, Coastal, and NorthStar (verified November 18, 2026) and simulate 6-passenger AStar cabin balance.",
    url: "https://juneauflightdeck.com/juneau-helicopter-tour-weight-limits-and-seating",
  },
};

const weightPageGuideSchema = buildFlightGuideJsonLd({
  url: "https://juneauflightdeck.com/juneau-helicopter-tour-weight-limits-and-seating",
  name: "Juneau Helicopter Tour Weight Limits, Surcharges & Seating Math",
  description:
    "Independent educational guide and payload simulator explaining FAA Part 135 weight-and-balance rules and verified operator weight surcharges (as of November 18, 2026) for TEMSCO Helicopters, Coastal Helicopters, and NorthStar Trekking.",
  breadcrumbs: [
    { name: "Home", url: "https://juneauflightdeck.com/" },
    {
      name: "Weight Limits & Seating Math",
      url: "https://juneauflightdeck.com/juneau-helicopter-tour-weight-limits-and-seating",
    },
  ],
  comparedOperators: ["temsco", "coastal", "northstar"],
});

const weightFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What are the exact clothed weight surcharges for Juneau helicopter operators as of November 18, 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "As of November 18, 2026 (plus CBJ sales tax & fees): TEMSCO Helicopters charges a +$150 weight surcharge at 250+ lbs clothed ($449 Mendenhall Walk / $759 Dog Sled base). Coastal Helicopters uses tiered clothed weight pricing: on Icefield Excursion, $459 Standard (1–259 lbs), $609 Standard Plus (260–299 lbs, +$150), and $918 Premium (300+ lbs, 2 seats); on Herbert Glacier Dog Sledding, $769 Standard, $919 Standard Plus, and $1,538 Premium. NorthStar Trekking charges a +$250 weight surcharge at 250+ lbs clothed ($539 Walkabout / $599 Trek / $789 Dog Sled base).",
      },
    },
    {
      "@type": "Question",
      name: "How are seats assigned on Juneau glacier helicopters?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Seat assignments are determined by licensed FAA Part 135 flight dispatchers and pilots using weight-and-balance calculations. Passengers cannot reserve specific front-row seats in advance.",
      },
    },
    {
      "@type": "Question",
      name: "Are weigh-ins private at the heliport?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. TEMSCO, Coastal, and NorthStar use discreet scales at check-in where the readout is visible only to ground dispatch staff.",
      },
    },
  ],
};

export default function HelicopterWeightLimitsPage() {
  return (
    <main
      id="main-content"
      className="page-shell"
      style={{ maxWidth: 940, margin: "auto", padding: "40px 20px 80px" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(weightPageGuideSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(weightFaqSchema) }}
      />

      <p className="eyebrow">
        Independent Aviation Logistics Guide · Verified {VERIFIED_TARIFF_DATE_LONG}
      </p>
      <h1
        style={{
          fontSize: "clamp(2rem, 4vw, 2.7rem)",
          fontWeight: 900,
          lineHeight: 1.2,
          margin: "10px 0 18px",
          color: "var(--text)",
        }}
      >
        Juneau Helicopter Tour Weight Limits, Surcharges &amp; Seating Math
      </h1>
      <p style={{ fontSize: "1.06rem", lineHeight: 1.6, color: "var(--muted)", marginBottom: "24px" }}>
        Juneau Flight Deck is an independent flightseeing education and concierge planning site—not
        an aircraft operator. Under federal FAA Part 135 regulations, Juneau&apos;s three licensed
        helicopter carriers (
        <a
          href={LFSE_CANONICAL_LINKS.temsco}
          style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
        >
          TEMSCO Helicopters ↗
        </a>
        ,{" "}
        <a
          href={LFSE_CANONICAL_LINKS.coastal}
          style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
        >
          Coastal Helicopters ↗
        </a>
        , and{" "}
        <a
          href={LFSE_CANONICAL_LINKS.northstar}
          style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
        >
          NorthStar Trekking ↗
        </a>
        ) balance exact clothed passenger weights on every glacier departure.
      </p>

      <div
        style={{
          marginBottom: 32,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--line-strong, #334155)",
          aspectRatio: "16 / 9",
          maxHeight: 320,
          background: "#071626",
        }}
      >
        <img
          src="/images/tours/temsco-mendenhall-glacier-walk.jpg"
          alt="AS350 AStar turbine helicopter landed on Mendenhall Glacier snow and blue ice in Juneau, Alaska"
          width={1280}
          height={853}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 50%",
            display: "block",
          }}
        />
      </div>

      {/* Operator-Specific Weight Surcharge Matrix */}
      <section
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "24px 22px",
          marginBottom: "36px",
        }}
      >
        <div
          style={{
            color: "var(--accent)",
            fontSize: "0.8rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            marginBottom: "6px",
          }}
        >
          Verified Operator Weight Surcharges · As of {VERIFIED_TARIFF_DATE_LONG}
        </div>
        <h2
          style={{
            fontSize: "1.35rem",
            fontWeight: 800,
            color: "var(--text)",
            margin: "0 0 12px",
          }}
        >
          Exact Clothed Weight Thresholds by Operator
        </h2>
        <div style={{ overflowX: "auto", maxWidth: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 620,
              fontSize: "0.86rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", color: "var(--ice)" }}>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Operator</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>
                  Verified Base Tariffs (as of Nov 18, 2026)
                </th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>
                  Clothed Weight Surcharge Rule
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(151, 211, 255, 0.1)" }}>
                <td style={{ padding: "12px", fontWeight: 700, color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <OperatorIdentityMark operator="temsco" size="sm" />
                    <span>TEMSCO Helicopters</span>
                  </div>
                </td>
                <td style={{ padding: "12px", color: "var(--muted)" }}>
                  Juneau Walk $449 · Juneau Dog Sled $759 · Skagway Discovery $479 · Skagway Dog
                  Sled $649 (+ tax &amp; fees)
                </td>
                <td style={{ padding: "12px", color: "#fcd34d", fontWeight: 700 }}>
                  +$150 weight surcharge at 250+ lbs clothed
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(151, 211, 255, 0.1)" }}>
                <td style={{ padding: "12px", fontWeight: 700, color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <OperatorIdentityMark operator="coastal" size="sm" />
                    <span>Coastal Helicopters</span>
                  </div>
                </td>
                <td style={{ padding: "12px", color: "var(--muted)" }}>
                  Icefield Excursion $459 Standard · Herbert Dog Sled $769 Standard (+ CBJ tax &amp;
                  fees)
                </td>
                <td style={{ padding: "12px", color: "#fcd34d", fontWeight: 700 }}>
                  1–259 lbs Standard · 260–299 lbs Standard Plus ($609 Icefield / $919 Dog Sled) ·
                  300+ lbs Premium 2 seats ($918 Icefield / $1,538 Dog Sled)
                </td>
              </tr>
              <tr>
                <td style={{ padding: "12px", fontWeight: 700, color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <OperatorIdentityMark operator="northstar" size="sm" />
                    <span>NorthStar Trekking</span>
                  </div>
                </td>
                <td style={{ padding: "12px", color: "var(--muted)" }}>
                  Walkabout $539 · Glacier Trek $599 · Dog Sled $789 (+ CBJ tax &amp; fees)
                </td>
                <td style={{ padding: "12px", color: "#fcd34d", fontWeight: 700 }}>
                  +$250 weight surcharge at 250+ lbs clothed
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5 }}>
          <strong>Important:</strong> Always enter accurate clothed weights (including jacket,
          boots, and daypack) during checkout. Under FAA regulations, significantly understated
          weights at check-in can force a safety bump without refund.
        </p>
      </section>

      {/* Interactive Helicopter Cabin Payload Simulator */}
      <section style={{ marginBottom: "40px" }}>
        <HelicopterCabinSimulator />
      </section>

      {/* The Physics: FAA Weight & Balance */}
      <section style={{ display: "grid", gap: "24px", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", margin: "0 0 4px" }}>
          Behind the Scenes: How Helicopters Balance Weight &amp; Port Timing
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "18px",
          }}
        >
          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
            }}
          >
            <h3 style={{ color: "var(--ice)", fontSize: "1.05rem", margin: "0 0 8px" }}>
              Airbus AStar 350 (6-Passenger Cabin)
            </h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "var(--muted)", margin: 0 }}>
              The primary turbine helicopter flown by Juneau operators carries up to 6 passengers
              plus pilot, calibrated for alpine hover performance at 2,000–4,000 feet.
            </p>
          </div>

          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
            }}
          >
            <h3 style={{ color: "var(--ice)", fontSize: "1.05rem", margin: "0 0 8px" }}>
              Center of Gravity &amp; Seating
            </h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "var(--muted)", margin: 0 }}>
              No Alaska operator guarantees front-row seats in advance; ramp dispatchers assign
              every seat before boarding to balance lateral and longitudinal center of gravity.
            </p>
          </div>

          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
            }}
          >
            <h3 style={{ color: "var(--ice)", fontSize: "1.05rem", margin: "0 0 8px" }}>
              2-Hour Cruise Return Standard
            </h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "var(--muted)", margin: 0 }}>
              {VERBATIM_TWO_HOUR_BUFFER_RULE} {TWO_HOUR_BUFFER_CLARIFICATION}
            </p>
          </div>
        </div>
      </section>

      {/* 6th Seat Concierge Explanation */}
      <section
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "28px 26px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            color: "var(--accent-strong)",
            fontSize: "0.82rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          Concierge Coordination for Parties of 5–6
        </div>
        <h2
          style={{
            fontSize: "1.45rem",
            fontWeight: 800,
            color: "var(--text)",
            margin: "0 0 12px",
          }}
        >
          Why Online Calendars Often Cap Bookings at 5 Seats
        </h2>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 14px" }}>
          Automated checkout calendars frequently block the 6th cabin seat to prevent accidental
          gross-weight overruns. When a lighter family or group of 5–6 submits approximate clothed
          weights through our concierge desk below, we can check with the operator&apos;s reservation
          team to see whether a single-aircraft 6-seat slot or paired departure is open—or compare{" "}
          <a
            href={LFSE_CANONICAL_LINKS.juneauHelicopterCategory}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            Juneau helicopter options on Last Frontier Shore Excursions ↗
          </a>
          .
        </p>
      </section>

      {/* Cross-Port Backup Routing */}
      <section style={{ marginBottom: "40px" }}>
        <CrossPortBackup currentPort="Juneau" desiredTourType="dogsled" />
      </section>

      {/* Intake / Waitlist Section */}
      <section id="waitlist" style={{ marginTop: "30px", marginBottom: "36px" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--text)",
            marginBottom: "8px",
          }}
        >
          Have a Group of 5–6+ or Weight Tier Question?
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
          Share your ship date, party count, and approximate individual weights so our concierge
          desk can check matching operator departures.
        </p>
        <HelicopterWaitlistForm />
      </section>

      <SourcesAndFreshness includeSkagway />
    </main>
  );
}
