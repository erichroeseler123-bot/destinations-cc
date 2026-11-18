import type { Metadata } from "next";
import Link from "next/link";
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
  title: "TEMSCO vs NorthStar: Glacier Walk vs Ice Trek (Juneau Helicopter)",
  description:
    "Compare TEMSCO's Mendenhall Glacier Walk ($449 base) against NorthStar's Glacier Walkabout ($539 base) and Glacier Trek ($599 base, as of November 18, 2026), weight surcharges, and 2-hour cruise return buffers.",
  alternates: { canonical: "https://juneauflightdeck.com/temsco-vs-northstar-juneau" },
  openGraph: {
    title: "TEMSCO vs NorthStar: Glacier Walk vs Ice Trek (Juneau Helicopter)",
    description:
      "Independent head-to-head comparison of TEMSCO and NorthStar Trekking in Juneau with verified November 18, 2026 tariffs.",
    url: "https://juneauflightdeck.com/temsco-vs-northstar-juneau",
  },
};

const pageSchema = buildFlightGuideJsonLd({
  url: "https://juneauflightdeck.com/temsco-vs-northstar-juneau",
  name: "TEMSCO vs NorthStar: Glacier Walk vs Ice Trek Comparison",
  description:
    "Independent comparison by Juneau Flight Deck of TEMSCO Helicopters and NorthStar Trekking in Juneau, Alaska, with verified base tariffs as of November 18, 2026.",
  breadcrumbs: [
    { name: "Home", url: "https://juneauflightdeck.com/" },
    {
      name: "Operator Comparison",
      url: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau",
    },
    {
      name: "TEMSCO vs NorthStar",
      url: "https://juneauflightdeck.com/temsco-vs-northstar-juneau",
    },
  ],
  comparedOperators: ["temsco", "northstar"],
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does NorthStar compare to TEMSCO for glacier walking and ice trekking?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "As of November 18, 2026 (before CBJ sales tax & fees): TEMSCO's Mendenhall Glacier & Guided Walk (2h 15m total) is $449/person (ages 2+, +$150 at 250+ lbs clothed) with slip-on traction overboots. NorthStar offers the 3h 15m Helicopter Glacier Walkabout (~1 hour on ice, ages 8+, $539/person base, +$250 at 250+ lbs clothed) and the 4h 15m Helicopter Glacier Trek (~2 hours technical hike, ages 12+, $599/person base, +$250 at 250+ lbs clothed).",
      },
    },
    {
      "@type": "Question",
      name: "Do both TEMSCO and NorthStar offer seasonal glacier dog sledding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, during the May–August summer snowpack window. As of November 18, 2026 (before CBJ sales tax & fees): TEMSCO Mendenhall Glacier Dog Sledding (2h 45m) is $759/person (+$150 at 250+ lbs clothed), and NorthStar Helicopter & Dog Sled Glacier Trek (3h 15m from Douglas Island) is $789/person (+$250 at 250+ lbs clothed).",
      },
    },
    {
      "@type": "Question",
      name: "What return buffer is recommended for cruise passengers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `${VERBATIM_TWO_HOUR_BUFFER_RULE} ${TWO_HOUR_BUFFER_CLARIFICATION}`,
      },
    },
  ],
};

export default function TemscoVsNorthstarPage() {
  return (
    <main
      id="main-content"
      className="page-shell"
      style={{ maxWidth: 960, margin: "auto", padding: "40px 20px 80px" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

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
        Independent Head-to-Head · Verified {VERIFIED_TARIFF_DATE_LONG}
      </p>
      <h1
        style={{
          fontSize: "clamp(2rem, 4vw, 2.6rem)",
          fontWeight: 900,
          lineHeight: 1.2,
          margin: "10px 0 16px",
          color: "var(--text, #ffffff)",
        }}
      >
        TEMSCO vs. NorthStar: Glacier Walk vs. Ice Trek
      </h1>
      <p
        style={{
          fontSize: "1.06rem",
          lineHeight: 1.6,
          color: "var(--ice, #e0f2fe)",
          marginBottom: "20px",
        }}
      >
        Both{" "}
        <a
          href={LFSE_CANONICAL_LINKS.temsco}
          style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
        >
          TEMSCO Helicopters ↗
        </a>{" "}
        and{" "}
        <a
          href={LFSE_CANONICAL_LINKS.northstar}
          style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
        >
          NorthStar Trekking ↗
        </a>{" "}
        are licensed FAA Part 135 operators flying to the Juneau Icefield, but they serve different
        ice-time appetites, minimum ages, and weight-surcharge rules. Compare verified tariffs (as
        of {VERIFIED_TARIFF_DATE_LONG}) and{" "}
        <a
          href={LFSE_CANONICAL_LINKS.juneauHelicopterCategory}
          style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
        >
          Juneau helicopter listings ↗
        </a>{" "}
        below.
      </p>

      <div
        style={{
          marginBottom: 28,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--line, #334155)",
          aspectRatio: "16 / 9",
          maxHeight: 320,
          background: "#071626",
        }}
      >
        <img
          src="/images/tours/northstar-glacier-ice-trek.jpg"
          alt="Guided glacier hiker with crampons and trekking poles exploring sculpted blue glacier ice in Alaska"
          width={1440}
          height={900}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 42%",
            display: "block",
          }}
        />
      </div>

      {/* Side-by-Side Comparison Grid */}
      <section style={{ overflowX: "auto", maxWidth: "100%", marginBottom: "36px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 700,
            background: "var(--panel, #0f172a)",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--line, #334155)",
            fontSize: "0.88rem",
          }}
        >
          <thead>
            <tr
              style={{
                background: "rgba(3, 14, 23, 0.9)",
                borderBottom: "1px solid var(--line, #334155)",
              }}
            >
              <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--accent, #f0b35b)" }}>
                Feature
              </th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "#ffffff" }}>
                TEMSCO Guided Walk (TH)
              </th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "#ffffff" }}>
                NorthStar Walkabout (NT)
              </th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "#ffffff" }}>
                NorthStar Glacier Trek (NT)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Total Duration &amp; Ice Time
              </td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                2h 15m total (~20–25m on ice)
              </td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>
                3h 15m total (~1h guided walk)
              </td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>
                4h 15m total (~2h technical trek)
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Minimum Age &amp; Effort
              </td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Ages 2+ · Easy walking</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Ages 8+ · Moderate walking</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>Ages 12+ · Active trekking</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Base Tariff (as of Nov 18, 2026)
              </td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>
                $449 / person + CBJ tax &amp; fees
              </td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>
                $539 / person + CBJ tax &amp; fees
              </td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>
                $599 / person + CBJ tax &amp; fees
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Clothed Weight Surcharge
              </td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>+$150 at 250+ lbs clothed</td>
              <td colSpan={2} style={{ padding: "12px 16px", color: "#fcd34d", fontWeight: 700 }}>
                +$250 at 250+ lbs clothed
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Seasonal Dog Sled (May–Aug, as of Nov 18, 2026)
              </td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                $759 / person (2h 45m) + CBJ tax &amp; fees
              </td>
              <td colSpan={2} style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                $789 / person (3h 15m · Douglas Island base) + CBJ tax &amp; fees
              </td>
            </tr>
            <tr>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Direct Cancellation &amp; Weather
              </td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                100% refund 48h+ prior; 100% weather refund
              </td>
              <td colSpan={2} style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                &gt;24h refund minus 10% admin fee (&lt;24h non-refundable); reschedule or full
                refund on operator weather cancel
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div
        style={{
          background: "rgba(15, 23, 42, 0.6)",
          border: "1px solid #1e293b",
          borderRadius: 10,
          padding: "16px 20px",
          marginBottom: "28px",
          fontSize: "0.88rem",
          color: "#cbd5e1",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "#93c5fd" }}>2-Hour Port Return Planning Standard:</strong>{" "}
        {VERBATIM_TWO_HOUR_BUFFER_RULE} {TWO_HOUR_BUFFER_CLARIFICATION}
      </div>

      {/* Decision Guidance Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: 20,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            background: "#0c121e",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <OperatorIdentityMark operator="temsco" size="sm" />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "#10b981",
                textTransform: "uppercase",
              }}
            >
              Choose TEMSCO ($449)
            </span>
          </div>
          <h2 style={{ fontSize: "1.15rem", color: "#ffffff", margin: "4px 0 10px" }}>
            Mendenhall Glacier &amp; Guided Walk
          </h2>
          <ul
            style={{
              fontSize: "0.85rem",
              color: "#cbd5e1",
              lineHeight: 1.55,
              paddingLeft: 18,
              marginBottom: 18,
            }}
          >
            <li>Traveling with children under age 8 (ages 2+ eligible) or preferring easy walking.</li>
            <li>$449/person base (as of {VERIFIED_TARIFF_DATE_LONG}; +$150 at 250+ lbs clothed).</li>
            <li>Shorter 2h 15m door-to-door footprint for tighter cruise calls.</li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api&campaign=jfd-temsco-vs-northstar-temsco"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.82rem", padding: "8px 12px" }}
            >
              Search TEMSCO on Viator →
            </a>
            <a
              href="https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-card"
              style={{ fontSize: "0.8rem", padding: "8px 10px" }}
            >
              Official Tariff ↗
            </a>
          </div>
        </div>

        <div
          style={{
            background: "#0c121e",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <OperatorIdentityMark operator="northstar" size="sm" />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "#f0b35b",
                textTransform: "uppercase",
              }}
            >
              Choose Walkabout ($539)
            </span>
          </div>
          <h2 style={{ fontSize: "1.15rem", color: "#ffffff", margin: "4px 0 10px" }}>
            NorthStar Glacier Walkabout
          </h2>
          <ul
            style={{
              fontSize: "0.85rem",
              color: "#cbd5e1",
              lineHeight: 1.55,
              paddingLeft: 18,
              marginBottom: 18,
            }}
          >
            <li>Full ~1 hour exploring glacier formations with crampons and trekking pole.</li>
            <li>Ages 8+ · 3h 15m total · $539/person base (as of {VERIFIED_TARIFF_DATE_LONG}).</li>
            <li>+$250 weight surcharge at 250+ lbs clothed + CBJ sales tax &amp; fees.</li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Glacier+Walkabout&pid=P00058396&mcid=42383&medium=api&campaign=jfd-temsco-vs-northstar-walkabout"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.82rem", padding: "8px 12px" }}
            >
              Search Walkabout on Viator →
            </a>
            <a
              href="https://northstartrekking.com/adventures/helicopter-glacier-walkabout/"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-card"
              style={{ fontSize: "0.8rem", padding: "8px 10px" }}
            >
              Official Tariff ↗
            </a>
          </div>
        </div>

        <div
          style={{
            background: "#0c121e",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <OperatorIdentityMark operator="northstar" size="sm" />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "#38bdf8",
                textTransform: "uppercase",
              }}
            >
              Choose Trek ($599)
            </span>
          </div>
          <h2 style={{ fontSize: "1.15rem", color: "#ffffff", margin: "4px 0 10px" }}>
            NorthStar Helicopter Glacier Trek
          </h2>
          <ul
            style={{
              fontSize: "0.85rem",
              color: "#cbd5e1",
              lineHeight: 1.55,
              paddingLeft: 18,
              marginBottom: 18,
            }}
          >
            <li>~2 hours hiking deep glacier terrain with mountaineering boots &amp; crampons.</li>
            <li>Ages 12+ · 4h 15m total · $599/person base (as of {VERIFIED_TARIFF_DATE_LONG}).</li>
            <li>+$250 weight surcharge at 250+ lbs clothed + CBJ sales tax &amp; fees.</li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Trekking&pid=P00058396&mcid=42383&medium=api&campaign=jfd-temsco-vs-northstar-trek"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.82rem", padding: "8px 12px" }}
            >
              Search Trek on Viator →
            </a>
            <a
              href="https://northstartrekking.com/adventures/helicopter-glacier-trek/"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-card"
              style={{ fontSize: "0.8rem", padding: "8px 10px" }}
            >
              Official Tariff ↗
            </a>
          </div>
        </div>
      </div>

      <SourcesAndFreshness />

      <div
        style={{
          textAlign: "center",
          borderTop: "1px solid var(--line, #334155)",
          paddingTop: 24,
          marginTop: 28,
        }}
      >
        <Link
          href="/temsco-vs-coastal-vs-northstar-juneau"
          style={{
            color: "var(--accent, #f0b35b)",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.95rem",
          }}
        >
          ← Back to All 3 Operators Comparison (TEMSCO vs Coastal vs NorthStar)
        </Link>
      </div>
    </main>
  );
}
