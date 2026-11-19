import type { Metadata } from "next";
import Link from "next/link";
import IcefieldGlacierMap from "../components/IcefieldGlacierMap";
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
  title: "TEMSCO vs Coastal vs NorthStar: Juneau Helicopter Tour Comparison",
  description:
    "Independent comparison of Juneau's 3 licensed FAA Part 135 glacier helicopter operators—TEMSCO, Coastal, and NorthStar—with verified base tariffs as of November 18, 2026, clothed weight rules, and 2-hour cruise return planning.",
  alternates: {
    canonical: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau",
  },
  openGraph: {
    title: "TEMSCO vs Coastal vs NorthStar: Juneau Helicopter Tour Comparison",
    description:
      "Compare glacier walks, seasonal dog sledding, and crampon ice treks across TEMSCO, Coastal, and NorthStar with verified November 18, 2026 tariffs.",
    url: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau",
  },
};

const comparisonPageSchema = buildFlightGuideJsonLd({
  url: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau",
  name: "TEMSCO vs Coastal vs NorthStar: Juneau Helicopter Operator Comparison",
  description:
    "Independent comparison by Juneau Flight Deck of TEMSCO Helicopters, Coastal Helicopters, and NorthStar Trekking (plus Wings Airways floatplane context), with official tariffs verified November 18, 2026.",
  breadcrumbs: [
    { name: "Home", url: "https://juneauflightdeck.com/" },
    {
      name: "TEMSCO vs Coastal vs NorthStar",
      url: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau",
    },
  ],
  comparedOperators: ["temsco", "coastal", "northstar", "wings"],
});

const comparisonFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the difference between a glacier landing, a guided walkabout, and an ice trek?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A standard glacier landing walk (TEMSCO 2h 15m total at $449/person base, or Coastal ~2h 35m total at $459 Standard base, as of November 18, 2026) walks on gentle ice near the helicopter in traction overboots. NorthStar Trekking offers a 3h 15m Helicopter Glacier Walkabout (~1 hour on ice, ages 8+, $539/person base as of November 18, 2026) and a 4h 15m Helicopter Glacier Trek (~2 hours technical hike with crampons and boots, ages 12+, $599/person base as of November 18, 2026). All rates exclude CBJ sales tax, fees, and weight surcharges.",
      },
    },
    {
      "@type": "Question",
      name: "Which Juneau helicopter companies offer glacier dog sledding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All three licensed Juneau helicopter operators offer seasonal glacier dog sledding (typically May through August depending on upper snowpack). As of November 18, 2026, direct base rates before CBJ sales tax, fees, and weight surcharges are: TEMSCO Mendenhall Glacier Dog Sledding ($759/person, 2h 45m), Coastal Dog Sled Tour on Herbert Glacier ($769 Standard 1–259 lbs / $919 260–299 lbs / $1,538 300+ lbs, 3h 15m), and NorthStar Helicopter & Dog Sled Glacier Trek ($789/person, 3h 15m, +$250 at 250+ lbs clothed).",
      },
    },
    {
      "@type": "Question",
      name: "Do TEMSCO, Coastal, and NorthStar provide pickup from cruise ship docks?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Direct-booking cruise passengers meet operator shuttles at designated downtown Juneau hubs specified on their confirmation (such as the Goldbelt Tramway at 490 S Franklin St for Coastal and NorthStar, or TEMSCO's central downtown meeting location) rather than universal gangway pickup.",
      },
    },
    {
      "@type": "Question",
      name: "How much return buffer should cruise passengers plan before all-aboard?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `${VERBATIM_TWO_HOUR_BUFFER_RULE} ${TWO_HOUR_BUFFER_CLARIFICATION}`,
      },
    },
  ],
};

export default function OperatorComparisonPage() {
  return (
    <main
      id="main-content"
      className="page-shell"
      style={{ maxWidth: 1040, margin: "auto", padding: "40px 20px 80px" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonFaqSchema) }}
      />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p
          className="eyebrow"
          style={{
            color: "var(--accent, #f0b35b)",
            textTransform: "uppercase",
            fontSize: "0.8rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
          }}
        >
          Independent Operator Guide · Verified {VERIFIED_TARIFF_DATE_LONG}
        </p>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            fontWeight: 900,
            lineHeight: 1.2,
            margin: "10px 0 16px",
            color: "var(--text, #ffffff)",
          }}
        >
          TEMSCO vs Coastal vs NorthStar: Juneau Helicopter Comparison
        </h1>
        <p
          style={{
            fontSize: "1.06rem",
            lineHeight: 1.6,
            color: "var(--ice, #e0f2fe)",
            marginBottom: "14px",
          }}
        >
          Juneau Flight Deck is an independent flightseeing education and concierge planning site—not
          an aircraft operator. Every glacier helicopter tour out of Juneau is flown by one of three
          licensed FAA Part 135 carriers:{" "}
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
          , or{" "}
          <a
            href={LFSE_CANONICAL_LINKS.northstar}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            NorthStar Trekking ↗
          </a>
          .
        </p>
        <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--muted, #94a3b8)", margin: 0 }}>
          Compare verified direct tariffs (as of {VERIFIED_TARIFF_DATE_LONG}), clothed weight
          surcharge tiers, time on ice, downtown shuttle logistics, and weather cancellation rules
          below—or browse the full{" "}
          <a
            href={LFSE_CANONICAL_LINKS.juneauHelicopterCategory}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            Juneau Helicopter &amp; Glacier Tour Directory on Last Frontier Shore Excursions ↗
          </a>
          .
        </p>
        <div
          style={{
            marginTop: 22,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--line, #334155)",
            aspectRatio: "16 / 9",
            maxHeight: 340,
            background: "#071626",
          }}
        >
          <img
            src="/images/juneau-helicopter-hero.jpg"
            alt="Flightseeing helicopter soaring over an Alaska glacier valley and snow-capped peaks"
            width={1440}
            height={900}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 46%",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* Navigation Quick Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "36px",
          padding: "14px 18px",
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: "var(--radius-md, 12px)",
          border: "1px solid var(--line, #334155)",
        }}
      >
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--accent, #f0b35b)",
            alignSelf: "center",
            marginRight: 6,
          }}
        >
          Jump to:
        </span>
        <a
          href="#icefield-map"
          style={{
            fontSize: "0.85rem",
            color: "var(--accent, #f0b35b)",
            textDecoration: "none",
            padding: "4px 10px",
            background: "rgba(240, 179, 91, 0.12)",
            borderRadius: 6,
            fontWeight: 700,
          }}
        >
          🗺️ Icefield Map
        </a>
        <a
          href="#effort-comparison"
          style={{
            fontSize: "0.85rem",
            color: "var(--ice, #e0f2fe)",
            textDecoration: "none",
            padding: "4px 10px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 6,
          }}
        >
          1. Walk vs. Trek
        </a>
        <a
          href="#dog-sledding-options"
          style={{
            fontSize: "0.85rem",
            color: "var(--ice, #e0f2fe)",
            textDecoration: "none",
            padding: "4px 10px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 6,
          }}
        >
          2. Dog Sledding
        </a>
        <a
          href="#pricing-inclusions"
          style={{
            fontSize: "0.85rem",
            color: "var(--ice, #e0f2fe)",
            textDecoration: "none",
            padding: "4px 10px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 6,
          }}
        >
          3. Verified Prices
        </a>
        <a
          href="#cruise-timing-pickup"
          style={{
            fontSize: "0.85rem",
            color: "var(--ice, #e0f2fe)",
            textDecoration: "none",
            padding: "4px 10px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 6,
          }}
        >
          4. 2-Hour Port Buffer
        </a>
        <a
          href="#cancellation-weather"
          style={{
            fontSize: "0.85rem",
            color: "var(--ice, #e0f2fe)",
            textDecoration: "none",
            padding: "4px 10px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 6,
          }}
        >
          5. Weather &amp; Refunds
        </a>
        <a
          href="#recommendations"
          style={{
            fontSize: "0.85rem",
            color: "var(--accent, #f0b35b)",
            fontWeight: 700,
            textDecoration: "none",
            padding: "4px 10px",
            background: "rgba(240, 179, 91, 0.15)",
            borderRadius: 6,
          }}
        >
          Recommendations ↓
        </a>
      </div>

      {/* INTERACTIVE ICEFIELD & GLACIER MAP */}
      <section id="icefield-map">
        <IcefieldGlacierMap />
      </section>

      {/* MASTER SPECIFIC TOUR COMPARISON TABLE */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "1.45rem",
            fontWeight: 800,
            color: "var(--text, #ffffff)",
            marginBottom: "16px",
          }}
        >
          Master Tour Comparison Matrix (Verified {VERIFIED_TARIFF_DATE_LONG})
        </h2>
        <div style={{ overflowX: "auto", maxWidth: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 820,
              background: "var(--panel, #0f172a)",
              borderRadius: "var(--radius-md, 12px)",
              overflow: "hidden",
              border: "1px solid var(--line, #334155)",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "rgba(3, 14, 23, 0.9)",
                  borderBottom: "1px solid var(--line, #334155)",
                }}
              >
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    color: "var(--accent, #f0b35b)",
                    fontSize: "0.82rem",
                  }}
                >
                  Operator &amp; Tour
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    color: "var(--text, #ffffff)",
                    fontSize: "0.82rem",
                  }}
                >
                  Total Duration &amp; Glacier
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    color: "var(--text, #ffffff)",
                    fontSize: "0.82rem",
                  }}
                >
                  Age &amp; Effort
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    color: "var(--text, #ffffff)",
                    fontSize: "0.82rem",
                  }}
                >
                  Base Price (as of Nov 18, 2026)
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    color: "var(--text, #ffffff)",
                    fontSize: "0.82rem",
                  }}
                >
                  Weight Surcharge &amp; Tax
                </th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "0.88rem" }}>
              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", color: "#ffffff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <OperatorIdentityMark operator="temsco" size="sm" />
                    <div>
                      <strong>TEMSCO Helicopters</strong>
                      <br />
                      <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.8rem" }}>
                        Mendenhall Glacier &amp; Guided Walk
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  2h 15m door-to-door
                  <br />
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    Mendenhall Glacier (~20–25m walk)
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  Ages 2+ · Easy walk
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $449 / person
                  <br />
                  <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                    as of Nov 18, 2026
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "#cbd5e1", fontSize: "0.8rem" }}>
                  +$150 at 250+ lbs clothed · + CBJ sales tax &amp; fees
                </td>
              </tr>

              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", color: "#ffffff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <OperatorIdentityMark operator="coastal" size="sm" />
                    <div>
                      <strong>Coastal Helicopters</strong>
                      <br />
                      <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.8rem" }}>
                        Icefield Excursion / Herbert Glacier Landing
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  ~2h 35m door-to-door
                  <br />
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    Herbert Glacier / Juneau Icefield
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  All ages · Easy walk
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $459 Standard (1–259 lbs)
                  <br />
                  <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                    as of Nov 18, 2026
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "#cbd5e1", fontSize: "0.8rem" }}>
                  $609 (260–299 lbs, +$150) · $918 (300+ lbs, 2 seats) · + CBJ sales tax &amp; fees
                </td>
              </tr>

              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", color: "#ffffff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <OperatorIdentityMark operator="northstar" size="sm" />
                    <div>
                      <strong>NorthStar Trekking</strong>
                      <br />
                      <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.8rem" }}>
                        Helicopter Glacier Walkabout
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  3h 15m door-to-door
                  <br />
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    ~1h guided ice walk (crampons)
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  Ages 8+ · Moderate
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $539 / person
                  <br />
                  <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                    as of Nov 18, 2026
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "#cbd5e1", fontSize: "0.8rem" }}>
                  +$250 at 250+ lbs clothed · + CBJ sales tax &amp; fees
                </td>
              </tr>

              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", color: "#ffffff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <OperatorIdentityMark operator="northstar" size="sm" />
                    <div>
                      <strong>NorthStar Trekking</strong>
                      <br />
                      <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.8rem" }}>
                        Helicopter Glacier Trek
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  4h 15m door-to-door
                  <br />
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    ~2h technical trek on glacier
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  Ages 12+ · Active trek
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $599 / person
                  <br />
                  <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                    as of Nov 18, 2026
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "#cbd5e1", fontSize: "0.8rem" }}>
                  +$250 at 250+ lbs clothed · + CBJ sales tax &amp; fees
                </td>
              </tr>

              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", color: "#ffffff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <OperatorIdentityMark operator="temsco" size="sm" />
                    <div>
                      <strong>TEMSCO Helicopters</strong>
                      <br />
                      <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.8rem" }}>
                        Mendenhall Glacier Dog Sledding
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  2h 45m total (May–Aug seasonal)
                  <br />
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    Upper snowfield mushing camp
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  Ages 2+ · Easy/Moderate
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $759 / person
                  <br />
                  <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                    as of Nov 18, 2026
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "#cbd5e1", fontSize: "0.8rem" }}>
                  May–Aug snowpack · +$150 at 250+ lbs clothed · + CBJ sales tax &amp; fees
                </td>
              </tr>

              <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
                <td style={{ padding: "14px 16px", color: "#ffffff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <OperatorIdentityMark operator="coastal" size="sm" />
                    <div>
                      <strong>Coastal Helicopters</strong>
                      <br />
                      <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.8rem" }}>
                        Dog Sled Tour on Herbert Glacier
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  3h 15m total (May–Aug seasonal)
                  <br />
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    Herbert Glacier snow camp
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  All ages · Easy/Moderate
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $769 Standard (1–259 lbs)
                  <br />
                  <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                    as of Nov 18, 2026
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "#cbd5e1", fontSize: "0.8rem" }}>
                  May–Aug · $919 (260–299 lbs) · $1,538 (300+ lbs) · + CBJ sales tax &amp; fees
                </td>
              </tr>

              <tr>
                <td style={{ padding: "14px 16px", color: "#ffffff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <OperatorIdentityMark operator="northstar" size="sm" />
                    <div>
                      <strong>NorthStar Trekking</strong>
                      <br />
                      <span style={{ color: "var(--ice, #93c5fd)", fontSize: "0.8rem" }}>
                        Helicopter &amp; Dog Sled Glacier Trek
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  3h 15m total (May–Aug seasonal)
                  <br />
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    Norris Glacier camp · Douglas Heliport
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--muted, #cbd5e1)" }}>
                  Ages 2+ · Easy/Moderate
                </td>
                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                  $789 / person
                  <br />
                  <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                    as of Nov 18, 2026
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "#cbd5e1", fontSize: "0.8rem" }}>
                  May–Aug snowpack · +$250 at 250+ lbs clothed · + CBJ sales tax &amp; fees
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.5, margin: "10px 0 0" }}>
          * Direct operator base tariffs verified on {VERIFIED_TARIFF_DATE_LONG}. City and Borough
          of Juneau (CBJ) sales tax, port/landing fees, and clothed weight surcharges are added at
          provider checkout. Actual landing sites adjust daily for cloud ceilings and ice safety.
        </p>
      </section>

      {/* FACTOR 1: WALK VS WALKABOUT VS TREK */}
      <section
        id="effort-comparison"
        style={{
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid var(--line, #334155)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "28px",
          marginBottom: "36px",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "var(--accent, #f0b35b)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Decision Factor 1
        </span>
        <h2 style={{ fontSize: "1.5rem", color: "#ffffff", margin: "6px 0 14px" }}>
          Glacier Landing vs. Walkabout vs. Ice Trek: How Much Time &amp; Effort on Ice?
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: "18px",
          }}
        >
          <div
            style={{
              background: "#0c121e",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "18px",
            }}
          >
            <h3 style={{ fontSize: "1.05rem", color: "#93c5fd", margin: "0 0 6px" }}>
              Tier 1: Standard Glacier Landing (20–40 min on ice)
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#e2e8f0", margin: "0 0 10px" }}>
              <strong>TEMSCO</strong> ($449 base, 2h 15m) &amp; <strong>Coastal</strong> ($459
              Standard base, ~2h 35m), as of {VERIFIED_TARIFF_DATE_LONG}
            </p>
            <ul
              style={{
                fontSize: "0.85rem",
                color: "var(--muted, #94a3b8)",
                lineHeight: 1.55,
                paddingLeft: 18,
                margin: 0,
              }}
            >
              <li>Slip-on traction overboots provided at the heliport.</li>
              <li>Gentle, relatively level ice walk near the landing zone.</li>
              <li>Family-accessible (TEMSCO ages 2+; Coastal all ages).</li>
            </ul>
          </div>

          <div
            style={{
              background: "#0c121e",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "18px",
            }}
          >
            <h3 style={{ fontSize: "1.05rem", color: "#f0b35b", margin: "0 0 6px" }}>
              Tier 2: Glacier Walkabout (~1 Hour on Ice)
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#e2e8f0", margin: "0 0 10px" }}>
              <strong>NorthStar Trekking</strong> ($539 base, 3h 15m total, ages 8+, as of{" "}
              {VERIFIED_TARIFF_DATE_LONG}; +$250 at 250+ lbs)
            </p>
            <ul
              style={{
                fontSize: "0.85rem",
                color: "var(--muted, #94a3b8)",
                lineHeight: 1.55,
                paddingLeft: 18,
                margin: 0,
              }}
            >
              <li>Roughly 60 minutes exploring undulating glacier ice and meltwater features.</li>
              <li>Outfitted with mountaineering boots, crampons, helmet, and trekking pole.</li>
              <li>Moderate walking pace without technical ice climbing.</li>
            </ul>
          </div>

          <div
            style={{
              background: "#0c121e",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "18px",
            }}
          >
            <h3 style={{ fontSize: "1.05rem", color: "#38bdf8", margin: "0 0 6px" }}>
              Tier 3: Helicopter Glacier Trek (~2 Hours on Ice)
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#e2e8f0", margin: "0 0 10px" }}>
              <strong>NorthStar Trekking</strong> ($599 base, 4h 15m total, ages 12+, as of{" "}
              {VERIFIED_TARIFF_DATE_LONG}; +$250 at 250+ lbs)
            </p>
            <ul
              style={{
                fontSize: "0.85rem",
                color: "var(--muted, #94a3b8)",
                lineHeight: 1.55,
                paddingLeft: 18,
                margin: 0,
              }}
            >
              <li>2 hours hiking deeper crevasse ridges, moulins, and blue ice walls.</li>
              <li>Full boots, steel crampons, rain gear, helmet, and guide equipment included.</li>
              <li>Active hike requiring steady endurance and 7+ hour cruise port calls.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FACTOR 2: DOG SLEDDING */}
      <section
        id="dog-sledding-options"
        style={{
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid var(--line, #334155)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "28px",
          marginBottom: "36px",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "var(--accent, #f0b35b)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Decision Factor 2
        </span>
        <h2 style={{ fontSize: "1.5rem", color: "#ffffff", margin: "6px 0 14px" }}>
          Seasonal Glacier Dog Sledding (May–August Snowpack Window)
        </h2>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--muted, #cbd5e1)",
            lineHeight: 1.6,
            marginBottom: 18,
          }}
        >
          All three Juneau helicopter carriers operate summer snow-camp mushing tours during the
          May–August snowpack window (rates below are direct base prices as of{" "}
          {VERIFIED_TARIFF_DATE_LONG} before CBJ sales tax &amp; fees):
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#0c121e",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <OperatorIdentityMark operator="temsco" size="sm" />
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--accent, #f0b35b)",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  TEMSCO Helicopters
                </span>
                <h3 style={{ fontSize: "1.02rem", color: "#ffffff", margin: 0 }}>
                  Mendenhall Glacier Dog Sledding
                </h3>
              </div>
            </div>
            <p style={{ fontSize: "0.92rem", fontWeight: 800, color: "#10b981", margin: "0 0 6px" }}>
              $759 / person (ages 2+, as of Nov 18, 2026)
            </p>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--muted, #94a3b8)",
                lineHeight: 1.5,
                margin: "0 0 12px",
              }}
            >
              2h 45m total · May–August seasonal · +$150 weight surcharge at 250+ lbs clothed · +
              CBJ sales tax &amp; fees. (Also operates in Skagway at $649/person base, 2h total, as
              of Nov 18, 2026.)
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+dog+sledding&pid=P00058396&mcid=42383&medium=api&campaign=jfd-comparison-temsco-dogsled"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.78rem", padding: "6px 10px" }}
              >
                Search on Viator →
              </a>
              <a
                href="https://temscoair.com/juneau-helicopter-tours/dog-sled/"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.75rem", padding: "6px 10px" }}
              >
                Official Tariff ↗
              </a>
            </div>
          </div>

          <div
            style={{
              background: "#0c121e",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <OperatorIdentityMark operator="coastal" size="sm" />
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--accent, #f0b35b)",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  Coastal Helicopters
                </span>
                <h3 style={{ fontSize: "1.02rem", color: "#ffffff", margin: 0 }}>
                  Dog Sled Tour on Herbert Glacier
                </h3>
              </div>
            </div>
            <p style={{ fontSize: "0.92rem", fontWeight: 800, color: "#10b981", margin: "0 0 6px" }}>
              $769 Standard (1–259 lbs, as of Nov 18, 2026)
            </p>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--muted, #94a3b8)",
                lineHeight: 1.5,
                margin: "0 0 12px",
              }}
            >
              3h 15m total · May–August seasonal · $919 Standard Plus (260–299 lbs) · $1,538 Premium
              (300+ lbs) · + CBJ sales tax &amp; fees.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+Coastal+dog+sledding&pid=P00058396&mcid=42383&medium=api&campaign=jfd-comparison-coastal-dogsled"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.78rem", padding: "6px 10px" }}
              >
                Search on Viator →
              </a>
              <a
                href="https://coastalhelicopters.com/tours/dog-sled-tours/"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.75rem", padding: "6px 10px" }}
              >
                Official Tariff ↗
              </a>
            </div>
          </div>

          <div
            style={{
              background: "#0c121e",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <OperatorIdentityMark operator="northstar" size="sm" />
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--accent, #f0b35b)",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  NorthStar Trekking
                </span>
                <h3 style={{ fontSize: "1.02rem", color: "#ffffff", margin: 0 }}>
                  Helicopter &amp; Dog Sled Glacier Trek
                </h3>
              </div>
            </div>
            <p style={{ fontSize: "0.92rem", fontWeight: 800, color: "#10b981", margin: "0 0 6px" }}>
              $789 / person (as of Nov 18, 2026)
            </p>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--muted, #94a3b8)",
                lineHeight: 1.5,
                margin: "0 0 12px",
              }}
            >
              3h 15m total (departs Douglas Island Heliport) · May–August seasonal · +$250 weight
              surcharge at 250+ lbs clothed · + CBJ sales tax &amp; fees.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+dog+sledding&pid=P00058396&mcid=42383&medium=api&campaign=jfd-comparison-northstar-dogsled"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.78rem", padding: "6px 10px" }}
              >
                Search on Viator →
              </a>
              <a
                href="https://northstartrekking.com/adventures/juneau-glacier-dog-sled-adventure/"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.75rem", padding: "6px 10px" }}
              >
                Official Tariff ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FACTOR 3: WEIGHT SURCHARGE & FEE COMPARISON */}
      <section
        id="pricing-inclusions"
        style={{
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid var(--line, #334155)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "28px",
          marginBottom: "36px",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "var(--accent, #f0b35b)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Decision Factor 3
        </span>
        <h2 style={{ fontSize: "1.5rem", color: "#ffffff", margin: "6px 0 14px" }}>
          Weight Surcharges, Taxes &amp; Cruise Portal Comparisons
        </h2>
        <p style={{ lineHeight: 1.6, color: "var(--muted, #cbd5e1)", marginBottom: "14px" }}>
          Each operator enforces FAA Part 135 weight-and-balance rules based on clothed passenger
          weight (with shoes and daypack), verified {VERIFIED_TARIFF_DATE_LONG}:
        </p>
        <ul style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.65, paddingLeft: 20 }}>
          <li>
            <strong>TEMSCO Helicopters:</strong> +$150 weight surcharge at 250+ lbs clothed (Juneau
            &amp; Skagway) + municipal sales tax &amp; fees.
          </li>
          <li>
            <strong>Coastal Helicopters:</strong> Tiered clothed weight pricing—Standard (1–259
            lbs), Standard Plus (260–299 lbs: $609 on Icefield / $919 on Dog Sled), and Premium
            (300+ lbs, 2 seats: $918 on Icefield / $1,538 on Dog Sled) + CBJ sales tax &amp; fees.
          </li>
          <li>
            <strong>NorthStar Trekking:</strong> +$250 weight surcharge at 250+ lbs clothed across
            Walkabout ($539 base), Trek ($599 base), and Dog Sled ($789 base) + CBJ sales tax &amp;
            fees.
          </li>
          <li>
            <strong>Cruise-Line Excursion Portals:</strong> Check current cruise-line price in your
            sailing portal, or use our{" "}
            <Link
              href="/juneau/cruise-excursions-vs-independent"
              style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
            >
              Cruise Portal vs. Direct Tariff Calculator
            </Link>{" "}
            to compare your ship&apos;s exact quote.
          </li>
        </ul>
      </section>

      {/* FACTOR 4: CRUISE TIMING & 2-HOUR BUFFER */}
      <section
        id="cruise-timing-pickup"
        style={{
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid var(--line, #334155)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "28px",
          marginBottom: "36px",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "var(--accent, #f0b35b)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Decision Factor 4
        </span>
        <h2 style={{ fontSize: "1.5rem", color: "#ffffff", margin: "6px 0 14px" }}>
          Cruise Port Return Buffer, Bases &amp; Meeting Points
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              background: "#0c121e",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "16px",
            }}
          >
            <h3 style={{ fontSize: "1rem", color: "#93c5fd", margin: "0 0 8px" }}>
              Downtown Meeting Hubs &amp; Two NorthStar Bases
            </h3>
            <ul
              style={{
                fontSize: "0.83rem",
                color: "#94a3b8",
                lineHeight: 1.55,
                paddingLeft: 18,
                margin: 0,
              }}
            >
              <li>
                <strong>NorthStar Trekking:</strong> Operates <em>Airport Base</em> (1890 Renshaw
                Way) for Walkabout/Trek and <em>Douglas Island Heliport</em> (6910 N Douglas Hwy)
                for Dog Sledding &amp; Airboat tours. Direct cruise guests typically meet at{" "}
                <strong>Goldbelt Tramway (490 S Franklin St)</strong>.
              </li>
              <li>
                <strong>Coastal Helicopters:</strong> Base at 8995 Alex Holden Way near JNU. Direct
                cruise shuttle meets at <strong>Goldbelt Tramway</strong> ~1 hour prior to flight.
              </li>
              <li>
                <strong>TEMSCO Helicopters:</strong> Base at 1650 Maplesden Way near JNU. Downtown
                shuttle pickup point and exact check-in time are printed on your confirmation.
              </li>
            </ul>
          </div>

          <div
            style={{
              background: "#0c121e",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "16px",
            }}
          >
            <h3 style={{ fontSize: "1rem", color: "#93c5fd", margin: "0 0 8px" }}>
              2-Hour Return Buffer Planning Standard
            </h3>
            <p style={{ fontSize: "0.86rem", color: "#ffffff", fontWeight: 700, lineHeight: 1.5, margin: "0 0 8px" }}>
              {VERBATIM_TWO_HOUR_BUFFER_RULE}
            </p>
            <p style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.55, margin: 0 }}>
              {TWO_HOUR_BUFFER_CLARIFICATION} Allow 60–90 minutes after ship arrival to clear the
              gangway and reach your downtown shuttle meeting point on time.
            </p>
          </div>
        </div>

        <div
          style={{
            background: "#0c121e",
            border: "1px solid #1e293b",
            borderRadius: 8,
            padding: "14px",
          }}
        >
          <h4 style={{ fontSize: "0.92rem", color: "#f0b35b", margin: "0 0 6px" }}>
            Clarification: Taku Glacier Helicopter Tours vs. Wings Airways Floatplane Lodge
          </h4>
          <p style={{ fontSize: "0.83rem", color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
            <strong>NorthStar Trekking</strong> operates a helicopter + airboat adventure from
            Douglas Island, whereas{" "}
            <a
              href={LFSE_CANONICAL_LINKS.wings}
              style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
            >
              Wings Airways ↗
            </a>{" "}
            operates the historic de Havilland floatplane flight and feast to Taku Glacier Lodge
            from downtown Juneau harbor (check current operator price).
          </p>
        </div>
      </section>

      {/* FACTOR 5: CANCELLATION & WEATHER */}
      <section
        id="cancellation-weather"
        style={{
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid var(--line, #334155)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "28px",
          marginBottom: "40px",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "var(--accent, #f0b35b)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Decision Factor 5
        </span>
        <h2 style={{ fontSize: "1.5rem", color: "#ffffff", margin: "6px 0 14px" }}>
          Voluntary Cancellation Cutoffs vs. Weather Refunds
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 8,
              padding: "16px",
            }}
          >
            <h3 style={{ fontSize: "1rem", color: "#6ee7b7", margin: "0 0 6px" }}>
              ✓ Operator Weather Cancellations
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#d1fae5", lineHeight: 1.5, margin: 0 }}>
              When TEMSCO, Coastal, or NorthStar cancels a departure for cloud ceilings, fog, or FAA
              Part 135 VFR minimums, guests are offered a reschedule (if time allows) or a{" "}
              <strong>100% full refund</strong>. Review same-day sea-level options in our{" "}
              <Link
                href="/juneau/what-to-do-if-helicopter-tour-canceled"
                style={{ color: "#a7f3d0", textDecoration: "underline", fontWeight: 700 }}
              >
                canceled-flight backup guide
              </Link>
              .
            </p>
          </div>

          <div
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: 8,
              padding: "16px",
            }}
          >
            <h3 style={{ fontSize: "1rem", color: "#fcd34d", margin: "0 0 6px" }}>
              ⚠️ Voluntary Traveler Cancellation Terms (Verified Nov 18, 2026)
            </h3>
            <ul
              style={{
                fontSize: "0.82rem",
                color: "#fef3c7",
                lineHeight: 1.5,
                paddingLeft: 18,
                margin: "0 0 8px",
              }}
            >
              <li>
                <strong>TEMSCO Direct:</strong> 100% refund 48+ hours prior; non-refundable within
                48 hours.
              </li>
              <li>
                <strong>Coastal Direct vs. Viator:</strong> 7+ days full refund direct; 24-hour
                cancellation window on Viator listing <code>6251SHOREXICEWALK</code> (which also
                carries Viator Terms §20 Worry-Free Shore Excursion protection when ending ≥2 hours
                before ship departure).
              </li>
              <li>
                <strong>NorthStar Direct:</strong> &gt;24 hours prior receives a refund minus a 10%
                administrative fee; &lt;24 hours is non-refundable.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* RECOMMENDATIONS BY TRAVELER NEED */}
      <section id="recommendations" style={{ marginBottom: "48px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p
            className="eyebrow"
            style={{
              color: "var(--accent, #f0b35b)",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              fontWeight: 800,
            }}
          >
            Match Your Group to the Right Tour
          </p>
          <h2 style={{ fontSize: "1.85rem", color: "#ffffff", margin: "6px 0 10px" }}>
            Recommendations by Traveler Need
          </h2>
        </div>

        <div style={{ display: "grid", gap: "20px" }}>
          <div
            style={{
              background: "var(--panel, #0f172a)",
              border: "1px solid #1e293b",
              borderRadius: "var(--radius-md, 12px)",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <OperatorIdentityMark operator="temsco" />
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: "#10b981",
                      textTransform: "uppercase",
                    }}
                  >
                    Best Gentle Family Glacier Walk
                  </span>
                  <h3 style={{ fontSize: "1.25rem", color: "#ffffff", margin: "2px 0" }}>
                    TEMSCO: Mendenhall Glacier &amp; Guided Walk (2h 15m)
                  </h3>
                </div>
              </div>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#10b981" }}>
                $449 / person (as of Nov 18, 2026)
              </span>
            </div>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--muted, #cbd5e1)",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              Ages 2+ welcome; +$150 at 250+ lbs clothed + CBJ sales tax &amp; fees. Frequent
              departures and accessible overboot walking on Mendenhall Glacier.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api&campaign=jfd-comparison-temsco-mendenhall"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.85rem", padding: "8px 16px" }}
              >
                Search on Viator →
              </a>
              <a
                href="https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                Official TEMSCO Tariff ↗
              </a>
              <a
                href={LFSE_CANONICAL_LINKS.temsco}
                style={{ fontSize: "0.82rem", color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
              >
                LFSE Profile ↗
              </a>
            </div>
          </div>

          <div
            style={{
              background: "var(--panel, #0f172a)",
              border: "1px solid #1e293b",
              borderRadius: "var(--radius-md, 12px)",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <OperatorIdentityMark operator="coastal" />
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: "#38bdf8",
                      textTransform: "uppercase",
                    }}
                  >
                    Best Herbert Glacier Flight · Viator Worry-Free §20
                  </span>
                  <h3 style={{ fontSize: "1.25rem", color: "#ffffff", margin: "2px 0" }}>
                    Coastal Helicopters: Icefield Excursion (6251SHOREXICEWALK)
                  </h3>
                </div>
              </div>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#10b981" }}>
                $459 Standard (as of Nov 18, 2026)
              </span>
            </div>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--muted, #cbd5e1)",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              ~2h 35m total; $459 Standard (1–259 lbs), $609 Standard Plus (260–299 lbs), $918
              Premium (300+ lbs, 2 seats) + CBJ sales tax &amp; fees. Carries Viator §20 Worry-Free
              Shore Excursion coverage when booked to end ≥2 hours before ship departure.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api&campaign=jfd-comparison-coastal-icefield"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.85rem", padding: "8px 16px" }}
              >
                Book on Viator (Worry-Free §20) →
              </a>
              <a
                href="https://coastalhelicopters.com/tours/icefield-excursion/"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                Official Coastal Tariff ↗
              </a>
              <a
                href={LFSE_CANONICAL_LINKS.coastal}
                style={{ fontSize: "0.82rem", color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
              >
                LFSE Profile ↗
              </a>
            </div>
          </div>

          <div
            style={{
              background: "var(--panel, #0f172a)",
              border: "1px solid #1e293b",
              borderRadius: "var(--radius-md, 12px)",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <OperatorIdentityMark operator="northstar" />
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: "#f0b35b",
                      textTransform: "uppercase",
                    }}
                  >
                    Best Extended Time on Ice (1–2 Hours)
                  </span>
                  <h3 style={{ fontSize: "1.25rem", color: "#ffffff", margin: "2px 0" }}>
                    NorthStar: Walkabout ($539) &amp; Glacier Trek ($599)
                  </h3>
                </div>
              </div>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#10b981" }}>
                $539 – $599 (as of Nov 18, 2026)
              </span>
            </div>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--muted, #cbd5e1)",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              Walkabout (3h 15m, ages 8+): $539 base · Glacier Trek (4h 15m, ages 12+): $599 base ·
              +$250 weight surcharge at 250+ lbs clothed + CBJ sales tax &amp; fees.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Glacier+Walkabout&pid=P00058396&mcid=42383&medium=api&campaign=jfd-comparison-northstar-walkabout"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.85rem", padding: "8px 16px" }}
              >
                Search Walkabout on Viator →
              </a>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Glacier+Trek&pid=P00058396&mcid=42383&medium=api&campaign=jfd-comparison-northstar-trek"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                Search Glacier Trek on Viator →
              </a>
              <a
                href={LFSE_CANONICAL_LINKS.northstar}
                style={{ fontSize: "0.82rem", color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
              >
                LFSE Profile ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* DEDICATED PAIRWISE COMPARISONS */}
      <section
        style={{
          background: "rgba(15, 23, 42, 0.4)",
          border: "1px solid var(--line, #334155)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "26px",
          marginBottom: "32px",
        }}
      >
        <h3 style={{ fontSize: "1.2rem", color: "#ffffff", margin: "0 0 10px" }}>
          Pairwise Operator Comparisons
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: 16,
          }}
        >
          <Link
            href="/temsco-vs-northstar-juneau"
            style={{
              textDecoration: "none",
              background: "#0c121e",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "16px",
              display: "block",
            }}
          >
            <h4 style={{ color: "#38bdf8", margin: "0 0 6px", fontSize: "1rem" }}>
              TEMSCO vs. NorthStar →
            </h4>
            <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>
              Compare $449 Mendenhall Walk vs. $539 Walkabout and $599 Crampon Trek (as of{" "}
              {VERIFIED_TARIFF_DATE_LONG}).
            </p>
          </Link>

          <Link
            href="/temsco-vs-coastal-juneau"
            style={{
              textDecoration: "none",
              background: "#0c121e",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "16px",
              display: "block",
            }}
          >
            <h4 style={{ color: "#38bdf8", margin: "0 0 6px", fontSize: "1rem" }}>
              TEMSCO vs. Coastal →
            </h4>
            <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>
              Compare Mendenhall ($449) vs. Herbert Glacier ($459 Standard) landings and seasonal
              dog sledding ($759 vs. $769, as of {VERIFIED_TARIFF_DATE_LONG}).
            </p>
          </Link>

          <Link
            href="/guides/uncruise-juneau-helicopter-tours"
            style={{
              textDecoration: "none",
              background: "#0c121e",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "16px",
              display: "block",
            }}
          >
            <h4 style={{ color: "#f0b35b", margin: "0 0 6px", fontSize: "1rem" }}>
              UnCruise Pre/Post-Cruise Guide →
            </h4>
            <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>
              Plan a Juneau glacier flight around 76 Egan Drive luggage &amp; check-in cutoffs or a
              dedicated hotel land day.
            </p>
          </Link>
        </div>
      </section>

      <SourcesAndFreshness includeSkagway />
    </main>
  );
}
