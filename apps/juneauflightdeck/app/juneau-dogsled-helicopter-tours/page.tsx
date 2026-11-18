import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import HelicopterWaitlistForm from "../components/HelicopterWaitlistForm";
import LiveSeatDropsBadge from "../components/LiveSeatDropsBadge";
import OperatorIdentityMark from "../components/OperatorIdentityMark";
import SourcesAndFreshness from "../components/SourcesAndFreshness";
import { buildFlightGuideJsonLd } from "@/lib/operatorSchema";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
  VERIFIED_TARIFF_DATE_LONG,
} from "@/lib/verifiedOperatorPricing";

export const metadata: Metadata = {
  title: "Juneau Helicopter Dog Sledding on Glacier | Tariffs & Availability Check",
  description:
    "Compare Juneau helicopter glacier dog sledding across TEMSCO ($759), Coastal ($769), and NorthStar ($789, as of November 18, 2026), May–August snowpack windows, and 2-hour cruise return buffers.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau-dogsled-helicopter-tours" },
  openGraph: {
    title: "Juneau Helicopter Dog Sledding on Glacier | Verified 2026 Guide",
    description:
      "Independent guide to Juneau Icefield seasonal dog sledding camps across TEMSCO, Coastal, and NorthStar, plus concierge availability checks.",
    url: "https://juneauflightdeck.com/juneau-dogsled-helicopter-tours",
    type: "website",
  },
};

const dogSledPageSchema = buildFlightGuideJsonLd({
  url: "https://juneauflightdeck.com/juneau-dogsled-helicopter-tours",
  name: "Juneau Helicopter Glacier Dog Sledding Guide",
  description:
    "Independent comparison of seasonal glacier dog sledding flights operated by TEMSCO Helicopters, Coastal Helicopters, and NorthStar Trekking in Juneau, Alaska, with verified base tariffs as of November 18, 2026.",
  breadcrumbs: [
    { name: "Home", url: "https://juneauflightdeck.com/" },
    {
      name: "Juneau Glacier Dog Sledding",
      url: "https://juneauflightdeck.com/juneau-dogsled-helicopter-tours",
    },
  ],
  comparedOperators: ["temsco", "coastal", "northstar"],
});

const dogSledFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why is helicopter glacier dog sledding in Juneau frequently sold out?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Summer glacier dog sledding camps operate in an upper-elevation alpine snowpack zone regulated by US Forest Service special-use permits, capping daily flight slots and husky team runs across all three licensed Juneau carriers.",
      },
    },
    {
      "@type": "Question",
      name: "What are the verified Juneau glacier dog sledding prices as of November 18, 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "As of November 18, 2026 (before CBJ sales tax & fees): TEMSCO Mendenhall Glacier Dog Sledding (2h 45m, May–Aug) is $759/person (ages 2+, +$150 at 250+ lbs clothed); Coastal Dog Sled Tour on Herbert Glacier (3h 15m, May–Aug) is $769 Standard (1–259 lbs), $919 Standard Plus (260–299 lbs), and $1,538 Premium (300+ lbs); NorthStar Helicopter & Dog Sled Glacier Trek (3h 15m, May–Aug) is $789/person (+$250 at 250+ lbs clothed). TEMSCO also operates Skagway Glacier Dog Sledding (2h, May–Aug) at $649/person (+$150 at 250+ lbs; +$3 Skagway fee & tax).",
      },
    },
    {
      "@type": "Question",
      name: "When does the Juneau glacier dog sledding season operate?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Snow camps typically operate from May through mid-to-late August depending on upper-elevation snowpack. Standard helicopter glacier landings on bare ice continue into September.",
      },
    },
    {
      "@type": "Question",
      name: "How much buffer should cruise passengers plan before all-aboard?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `${VERBATIM_TWO_HOUR_BUFFER_RULE} ${TWO_HOUR_BUFFER_CLARIFICATION}`,
      },
    },
  ],
};

export default function JuneauDogSleddingPage() {
  return (
    <main
      id="main-content"
      className="page-shell py-8"
      style={{ maxWidth: "100%", overflowX: "clip" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dogSledPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dogSledFaqJsonLd) }}
      />

      <div
        className="site-shell max-w-5xl mx-auto px-4"
        style={{ maxWidth: "100%", boxSizing: "border-box" }}
      >
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="eyebrow">
            Independent Seasonal Guide · Verified {VERIFIED_TARIFF_DATE_LONG}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
            Juneau Helicopter Glacier Dog Sledding
          </h1>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
            Compare seasonal May–August snowfield mushing camps operated by{" "}
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
            —or submit a concierge availability request if your cruise portal shows sold out.
          </p>
        </div>

        {/* Hero Image Showcase */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "100%",
            aspectRatio: "16 / 9",
            maxHeight: 440,
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(151, 211, 255, 0.18)",
            marginBottom: 32,
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.45)",
          }}
        >
          <Image
            src="/images/tours/temsco-glacier-dog-sledding.jpg"
            alt="Alaskan husky sled dog team harnessed on an Alaska mountain snowfield at alpenglow"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            style={{
              objectFit: "cover",
              objectPosition: "55% 60%",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(4, 17, 27, 0.08) 0%, rgba(4, 17, 27, 0.25) 48%, rgba(4, 17, 27, 0.88) 100%)",
              display: "flex",
              alignItems: "flex-end",
              padding: "clamp(18px, 4vw, 32px)",
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  background: "rgba(240, 179, 91, 0.92)",
                  color: "#04111b",
                  fontWeight: 900,
                  fontSize: "0.72rem",
                  padding: "4px 12px",
                  borderRadius: 999,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                May–August Seasonal Snowpack · Books Out Months Ahead
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(1.35rem, 3vw, 1.85rem)",
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1.2,
                }}
              >
                Mendenhall, Herbert &amp; Norris Glacier Snow Camps
              </h2>
            </div>
          </div>
        </div>

        {/* Partner & Direct Operator Status Card */}
        <div
          id="waitlist"
          style={{
            background: "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
            border: "1px solid var(--line, rgba(151, 211, 255, 0.2))",
            borderRadius: "var(--radius-lg, 24px)",
            padding: "clamp(18px, 4vw, 26px) clamp(16px, 4vw, 30px)",
            marginBottom: "36px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            alignItems: "center",
            gap: 20,
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent, #f0b35b)",
                marginBottom: 8,
              }}
            >
              <OperatorIdentityMark operator="temsco" size="sm" />
              <OperatorIdentityMark operator="coastal" size="sm" />
              <OperatorIdentityMark operator="northstar" size="sm" />
              <span>Verified Tariffs as of {VERIFIED_TARIFF_DATE_LONG}</span>
            </div>
            <h3
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--text, #ffffff)",
                margin: "0 0 8px",
              }}
            >
              Compare &amp; Book Seasonal Glacier Dog Sledding
            </h3>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "0.88rem",
                color: "var(--muted)",
                lineHeight: 1.55,
              }}
            >
              Summer snow camps operate May through August across TEMSCO ($759/person base, 2h 45m),
              Coastal Helicopters ($769 Standard 1–259 lbs / $919 260–299 lbs / $1,538 300+ lbs, 3h
              15m), and NorthStar Trekking ($789/person base, 3h 15m, +$250 at 250+ lbs)—all as of{" "}
              {VERIFIED_TARIFF_DATE_LONG} plus CBJ sales tax &amp; fees. Also check{" "}
              <Link
                href="/skagway/helicopter"
                style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
              >
                Skagway TEMSCO Dog Sledding ($649 base, 2h)
              </Link>{" "}
              and{" "}
              <a
                href={LFSE_CANONICAL_LINKS.juneauHelicopterCategory}
                style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
              >
                Juneau Helicopter Tours on Last Frontier Shore Excursions ↗
              </a>
              .
            </p>
            <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--ice, #9ed9ff)", fontWeight: 600 }}>
              {VERBATIM_TWO_HOUR_BUFFER_RULE}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 10,
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+glacier+dog+sledding&pid=P00058396&mcid=42383&medium=api&campaign=jfd-dogsled-hero"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{
                padding: "12px 22px",
                fontSize: "0.92rem",
                maxWidth: "100%",
                textAlign: "center",
              }}
            >
              Check Partner Calendar on Viator &rarr;
            </a>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxWidth: "100%" }}>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+dog+sledding&pid=P00058396&mcid=42383&medium=api&campaign=jfd-dogsled-temsco"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.78rem", padding: "6px 10px", whiteSpace: "nowrap" }}
              >
                TEMSCO on Viator ↗
              </a>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+Coastal+dog+sledding&pid=P00058396&mcid=42383&medium=api&campaign=jfd-dogsled-coastal"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.78rem", padding: "6px 10px", whiteSpace: "nowrap" }}
              >
                Coastal on Viator ↗
              </a>
              <a
                href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+dog+sledding&pid=P00058396&mcid=42383&medium=api&campaign=jfd-dogsled-northstar"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.78rem", padding: "6px 10px", whiteSpace: "nowrap" }}
              >
                NorthStar on Viator ↗
              </a>
            </div>
            <a
              href="#waitlist-form"
              style={{
                fontSize: "0.78rem",
                color: "var(--accent, #f0b35b)",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sold out? Submit a Concierge Availability Request &darr;
            </a>
          </div>
        </div>

        {/* Dedicated Intake Form */}
        <section className="mb-14">
          <div className="mb-6">
            <LiveSeatDropsBadge showLink={false} />
          </div>
          <HelicopterWaitlistForm compact={false} defaultPort="juneau" />
        </section>

        {/* Key Tour Specifications Table */}
        <section className="section-block p-8 md:p-12 mb-12">
          <div className="section-heading mb-6">
            <p className="eyebrow">Verified Specifications · {VERIFIED_TARIFF_DATE_LONG}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Helicopter Dog Sledding Tariff &amp; Timing Matrix
            </h2>
          </div>

          <div className="seo-table-container" style={{ maxWidth: "100%", overflowX: "auto" }}>
            <table className="seo-matrix-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Verified Operator Details</th>
                  <th>Cruise Planning Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Total Tour Duration</strong>
                  </td>
                  <td>2h 45m (TEMSCO) · 3h 15m (Coastal &amp; NorthStar)</td>
                  <td>
                    {VERBATIM_TWO_HOUR_BUFFER_RULE} ({TWO_HOUR_BUFFER_CLARIFICATION})
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Operating Season</strong>
                  </td>
                  <td>May through August (snowpack dependent)</td>
                  <td>Not offered in September once upper snow camps demobilize</td>
                </tr>
                <tr>
                  <td>
                    <strong>Verified Direct Base Tariffs (as of Nov 18, 2026)</strong>
                  </td>
                  <td>
                    $759 TEMSCO · $769 Coastal Standard · $789 NorthStar (+ CBJ sales tax &amp;
                    fees)
                  </td>
                  <td>Cruise-line desk: {UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Clothed Weight Surcharges</strong>
                  </td>
                  <td>
                    TEMSCO +$150 (250+ lbs) · Coastal $919 (260–299 lbs) / $1,538 (300+ lbs) ·
                    NorthStar +$250 (250+ lbs)
                  </td>
                  <td>Discreetly weighed at the heliport with outerwear and shoes</td>
                </tr>
                <tr>
                  <td>
                    <strong>Skagway Corridor Backup</strong>
                  </td>
                  <td>
                    TEMSCO Skagway Glacier Dog Sledding: $649/person (2h, May–Aug, as of Nov 18,
                    2026)
                  </td>
                  <td>+$150 at 250+ lbs clothed; +$3 Skagway fee &amp; tax</td>
                </tr>
                <tr>
                  <td>
                    <strong>Weather Policy</strong>
                  </td>
                  <td>100% refund if canceled by operator for weather</td>
                  <td>
                    Keep{" "}
                    <a
                      href={LFSE_CANONICAL_LINKS.juneauWhaleCategory}
                      style={{ color: "#9ed9ff", textDecoration: "underline" }}
                    >
                      Auke Bay whale watching ↗
                    </a>{" "}
                    ready as a sea-level weather backup
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <SourcesAndFreshness includeSkagway />

        <div className="text-center mt-8 mb-8">
          <Link href="/" className="button button-secondary">
            ← Back to Juneau Flight Deck Home
          </Link>
        </div>
      </div>
    </main>
  );
}
