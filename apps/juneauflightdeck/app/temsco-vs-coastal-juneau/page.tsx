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
  title: "TEMSCO vs Coastal Helicopters: Juneau Glacier Tour Comparison",
  description:
    "Independent comparison of TEMSCO ($449 Mendenhall Walk / $759 Dog Sled) and Coastal Helicopters ($459 Icefield / $769 Dog Sled, as of November 18, 2026), weight rules, and 2-hour cruise port timing.",
  alternates: { canonical: "https://juneauflightdeck.com/temsco-vs-coastal-juneau" },
  openGraph: {
    title: "TEMSCO vs Coastal Helicopters: Juneau Glacier Tour Comparison",
    description:
      "Compare TEMSCO and Coastal Helicopters in Juneau with verified November 18, 2026 base tariffs, weight tiers, and cancellation rules.",
    url: "https://juneauflightdeck.com/temsco-vs-coastal-juneau",
  },
};

const pageSchema = buildFlightGuideJsonLd({
  url: "https://juneauflightdeck.com/temsco-vs-coastal-juneau",
  name: "TEMSCO vs Coastal Helicopters: Juneau Glacier Tour Comparison",
  description:
    "Independent head-to-head comparison of TEMSCO Helicopters and Coastal Helicopters in Juneau, Alaska, with verified base tariffs as of November 18, 2026.",
  breadcrumbs: [
    { name: "Home", url: "https://juneauflightdeck.com/" },
    {
      name: "Operator Comparison",
      url: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau",
    },
    {
      name: "TEMSCO vs Coastal",
      url: "https://juneauflightdeck.com/temsco-vs-coastal-juneau",
    },
  ],
  comparedOperators: ["temsco", "coastal", "wings"],
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where do TEMSCO and Coastal Helicopters land on the glacier?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TEMSCO lands primarily on Mendenhall Glacier for guided walks and operates an upper-glacier summer dog sled camp. Coastal Helicopters lands on Herbert Glacier / the Juneau Icefield for its Icefield Excursion and summer Herbert Glacier dog sled camp. Actual landing zones adjust daily for ceiling and ice safety.",
      },
    },
    {
      "@type": "Question",
      name: "How do verified prices compare between TEMSCO and Coastal as of November 18, 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "As of November 18, 2026 (before CBJ sales tax & fees): TEMSCO's Mendenhall Glacier & Guided Walk (2h 15m) is $449/person (ages 2+, +$150 at 250+ lbs clothed), and Mendenhall Glacier Dog Sledding (2h 45m, May–Aug) is $759/person. Coastal's Icefield Excursion (~2h 35m) is $459 Standard (1–259 lbs), $609 Standard Plus (260–299 lbs), and $918 Premium (300+ lbs, 2 seats); Coastal's Dog Sled Tour on Herbert Glacier (3h 15m, May–Aug) is $769 Standard, $919 Standard Plus, and $1,538 Premium.",
      },
    },
    {
      "@type": "Question",
      name: "How much buffer should cruise passengers leave before all-aboard?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `${VERBATIM_TWO_HOUR_BUFFER_RULE} ${TWO_HOUR_BUFFER_CLARIFICATION}`,
      },
    },
  ],
};

export default function TemscoVsCoastalPage() {
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
        TEMSCO vs. Coastal: Juneau Helicopter Landing Comparison
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
          href={LFSE_CANONICAL_LINKS.coastal}
          style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
        >
          Coastal Helicopters ↗
        </a>{" "}
        are licensed FAA Part 135 carriers offering gentle overboot glacier landings and seasonal
        May–August dog sledding out of Juneau. Compare their verified tariffs (as of{" "}
        {VERIFIED_TARIFF_DATE_LONG}), weight rules, and cancellation windows below.
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
          src="/images/tours/coastal-icefield-landing.jpg"
          alt="Herbert Glacier blue icefall and Coast Mountains in the Juneau Icefield, Alaska"
          width={1440}
          height={900}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 48%",
            display: "block",
          }}
        />
      </div>

      {/* Side-by-Side Comparison Table */}
      <section style={{ overflowX: "auto", maxWidth: "100%", marginBottom: "36px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 640,
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
                TEMSCO Helicopters (TH)
              </th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "#ffffff" }}>
                Coastal Helicopters (CH)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Primary Landing Zones
              </td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                Mendenhall Glacier (Walk &amp; Dog Sledding)
              </td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                Herbert Glacier / Juneau Icefield (Landing &amp; Dog Camp)
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Glacier Landing Tariff (as of Nov 18, 2026)
              </td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>
                $449 / person (2h 15m, ages 2+) + CBJ tax &amp; fees
              </td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>
                $459 Standard (~2h 35m, 1–259 lbs) + CBJ tax &amp; fees
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Dog Sledding Tariff (May–Aug, as of Nov 18, 2026)
              </td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>
                $759 / person (2h 45m, ages 2+) + CBJ tax &amp; fees
              </td>
              <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>
                $769 Standard (3h 15m, 1–259 lbs) + CBJ tax &amp; fees
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Clothed Weight Surcharge
              </td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>+$150 at 250+ lbs clothed</td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                Icefield: $609 (260–299 lbs) / $918 (300+ lbs, 2 seats)
                <br />
                Dog Sled: $919 (260–299 lbs) / $1,538 (300+ lbs)
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--line, #334155)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Voluntary Cancellation
              </td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                100% refund 48h+ prior direct
              </td>
              <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                7+ days full refund direct (24h on Viator 6251SHOREXICEWALK)
              </td>
            </tr>
            <tr>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ice, #93c5fd)" }}>
                Operator Weather Cancellation
              </td>
              <td style={{ padding: "12px 16px", color: "#10b981" }}>100% refund if grounded</td>
              <td style={{ padding: "12px 16px", color: "#10b981" }}>100% refund if grounded</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Port Buffer + Floatplane Clarification */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.6)",
          border: "1px solid #1e293b",
          borderRadius: 10,
          padding: "16px 20px",
          marginBottom: "20px",
          fontSize: "0.88rem",
          color: "#cbd5e1",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "#93c5fd" }}>2-Hour Port Return Planning Standard:</strong>{" "}
        {VERBATIM_TWO_HOUR_BUFFER_RULE} {TWO_HOUR_BUFFER_CLARIFICATION}
      </div>

      <div
        style={{
          background: "rgba(15, 23, 42, 0.6)",
          border: "1px solid #1e293b",
          borderRadius: 10,
          padding: "16px 20px",
          marginBottom: "32px",
          fontSize: "0.88rem",
          color: "#cbd5e1",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--accent, #f0b35b)" }}>Note on Taku Glacier Lodge:</strong>{" "}
        The historic Taku Glacier Lodge salmon feast is operated by{" "}
        <a
          href={LFSE_CANONICAL_LINKS.wings}
          style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
        >
          Wings Airways ↗
        </a>{" "}
        using classic de Havilland Otter floatplanes from downtown Juneau harbor (check current
        operator price), rather than a helicopter flight. Browse more options in the{" "}
        <a
          href={LFSE_CANONICAL_LINKS.juneauHelicopterCategory}
          style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
        >
          Juneau Helicopter Directory ↗
        </a>
        .
      </div>

      {/* Decision Guidance Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 24,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            background: "#0c121e",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
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
                Choose TEMSCO If:
              </span>
              <h2 style={{ fontSize: "1.2rem", color: "#ffffff", margin: 0 }}>
                TEMSCO Helicopters
              </h2>
            </div>
          </div>
          <ul
            style={{
              fontSize: "0.88rem",
              color: "#cbd5e1",
              lineHeight: 1.6,
              paddingLeft: 18,
              marginBottom: 20,
            }}
          >
            <li>
              You want Mendenhall Glacier &amp; Guided Walk ($449/person base, ages 2+, as of{" "}
              {VERIFIED_TARIFF_DATE_LONG}).
            </li>
            <li>
              You want Mendenhall Glacier Dog Sledding ($759/person base, May–August seasonal, as of{" "}
              {VERIFIED_TARIFF_DATE_LONG}).
            </li>
            <li>You prefer 48-hour direct voluntary cancellation flexibility and frequent waves.</li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api&campaign=jfd-temsco-vs-coastal-temsco"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.85rem", padding: "8px 14px" }}
            >
              Search TEMSCO on Viator →
            </a>
            <a
              href="https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-card"
              style={{ fontSize: "0.82rem", padding: "8px 12px" }}
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
            padding: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
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
                Choose Coastal If:
              </span>
              <h2 style={{ fontSize: "1.2rem", color: "#ffffff", margin: 0 }}>
                Coastal Helicopters
              </h2>
            </div>
          </div>
          <ul
            style={{
              fontSize: "0.88rem",
              color: "#cbd5e1",
              lineHeight: 1.6,
              paddingLeft: 18,
              marginBottom: 20,
            }}
          >
            <li>
              You want Herbert Glacier / Icefield Excursion ($459 Standard 1–259 lbs, $609 260–299
              lbs, $918 300+ lbs, as of {VERIFIED_TARIFF_DATE_LONG}).
            </li>
            <li>
              You want Viator&apos;s Section 20 Worry-Free Shore Excursion protection and 24-hour
              partner cancellation on <code>6251SHOREXICEWALK</code>.
            </li>
            <li>
              You want Herbert Glacier Dog Sledding ($769 Standard, 3h 15m, May–August seasonal, as
              of {VERIFIED_TARIFF_DATE_LONG}).
            </li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api&campaign=jfd-temsco-vs-coastal-coastal"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.85rem", padding: "8px 14px" }}
            >
              Book Coastal on Viator (§20) →
            </a>
            <a
              href="https://coastalhelicopters.com/tours/icefield-excursion/"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-card"
              style={{ fontSize: "0.82rem", padding: "8px 12px" }}
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
