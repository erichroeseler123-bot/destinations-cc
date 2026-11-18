import type { Metadata } from "next";
import Link from "next/link";
import GlacierFlightCams from "../components/GlacierFlightCams";
import CrossPortBackup from "../components/CrossPortBackup";
import SourcesAndFreshness from "../components/SourcesAndFreshness";
import { buildFlightGuideJsonLd } from "@/lib/operatorSchema";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
  VERIFIED_TARIFF_DATE_LONG,
} from "@/lib/verifiedOperatorPricing";

export const metadata: Metadata = {
  title: "Juneau Glacier Flight Weather & Live FAA Aviation Cams | Juneau Flight Deck",
  description:
    "Check FAA WeatherCams along Juneau helicopter corridors to Mendenhall Glacier, Herbert Glacier, and Gastineau Channel, plus FAA Part 135 VFR minimums and 2-hour cruise return planning.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau-glacier-flight-weather" },
  openGraph: {
    title: "Juneau Glacier Flight Weather & FAA Aviation Cams",
    description:
      "Supplemental FAA WeatherCam snapshots along Juneau glacier helicopter flight paths, cloud-ceiling explanations, and weather backup options.",
    url: "https://juneauflightdeck.com/juneau-glacier-flight-weather",
  },
};

const weatherPageSchema = buildFlightGuideJsonLd({
  url: "https://juneauflightdeck.com/juneau-glacier-flight-weather",
  name: "Juneau Glacier Flight Weather & FAA Aviation Cams",
  description:
    "Independent flight-weather educational guide displaying supplemental FAA WeatherCam snapshots and explaining Part 135 VFR minimums for Juneau helicopter operators.",
  breadcrumbs: [
    { name: "Home", url: "https://juneauflightdeck.com/" },
    {
      name: "Flight Weather",
      url: "https://juneauflightdeck.com/juneau-glacier-flight-weather",
    },
  ],
  comparedOperators: ["temsco", "coastal", "northstar"],
});

const weatherFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why do helicopter tours cancel when downtown Juneau is sunny?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Downtown Juneau cruise berths sit at sea level, whereas glacier landing zones sit between 1,800 and 4,000 feet in alpine mountain passes where marine cloud ceilings can obscure VFR visibility.",
      },
    },
    {
      "@type": "Question",
      name: "What are the FAA weather minimums for Juneau helicopter tours?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Applicable VFR minima depend on airspace, altitude, time of day, and each licensed operator's FAA-approved operations specifications under 14 CFR Part 135 (including §135.205 and §135.207). Only the operating carrier and pilot make the go/no-go decision.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if my Juneau helicopter tour is canceled due to weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TEMSCO Helicopters and Coastal Helicopters publish a 100% refund when canceled by the operator for weather; NorthStar Trekking offers rescheduling when available or a full refund. Marketplace reservations follow the cancellation terms on the booking confirmation.",
      },
    },
  ],
};

export default function GlacierFlightWeatherPage() {
  return (
    <main
      id="main-content"
      style={{
        width: "100%",
        maxWidth: 1100,
        boxSizing: "border-box",
        overflowX: "clip",
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 40px) 16px 80px",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(weatherPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(weatherFaqSchema) }}
      />

      <div style={{ marginBottom: 20 }}>
        <Link
          href="/tools"
          style={{
            fontSize: "0.85rem",
            color: "#93c5fd",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          &larr; Back to Logistics Dashboard
        </Link>
      </div>

      {/* Title Hero */}
      <header style={{ marginBottom: 28 }}>
        <span
          style={{
            fontSize: "0.74rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "4px 12px",
            borderRadius: 6,
            background: "rgba(56, 189, 248, 0.15)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            color: "#38bdf8",
            display: "inline-block",
            marginBottom: 14,
          }}
        >
          Independent Aviation Weather Guide · Verified {VERIFIED_TARIFF_DATE_LONG}
        </span>
        <h1
          style={{
            fontSize: "clamp(1.85rem, 4vw, 2.75rem)",
            fontWeight: 900,
            lineHeight: 1.15,
            color: "#ffffff",
            margin: "0 0 14px",
          }}
        >
          Juneau Glacier Flight Weather &amp; FAA Aviation Cams
        </h1>
        <p
          style={{
            fontSize: "1.02rem",
            lineHeight: 1.6,
            color: "var(--muted)",
            maxWidth: 780,
            margin: "0 0 12px",
          }}
        >
          Review supplemental FAA WeatherCam snapshots for visual context on cloud decks and
          mountain passes along Juneau&apos;s glacier flight corridors. Juneau Flight Deck is an
          independent flightseeing education guide—these cameras are not an operator flight-status
          feed, and only your licensed FAA Part 135 operator (
          <a
            href={LFSE_CANONICAL_LINKS.temsco}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            TEMSCO ↗
          </a>
          ,{" "}
          <a
            href={LFSE_CANONICAL_LINKS.coastal}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            Coastal ↗
          </a>
          , or{" "}
          <a
            href={LFSE_CANONICAL_LINKS.northstar}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            NorthStar ↗
          </a>
          ) makes the go/no-go decision.
        </p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.55, color: "#bae6fd", margin: 0 }}>
          <strong>Port Return Standard:</strong> {VERBATIM_TWO_HOUR_BUFFER_RULE}{" "}
          {TWO_HOUR_BUFFER_CLARIFICATION}
        </p>
      </header>

      {/* FAA WeatherCams Component */}
      <GlacierFlightCams />

      {/* In-Depth Flight Dispatch Explanation */}
      <section
        style={{
          background: "linear-gradient(135deg, rgba(8, 23, 38, 0.95) 0%, rgba(4, 14, 24, 0.98) 100%)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          padding: "clamp(20px, 4vw, 32px)",
          margin: "36px 0",
          boxSizing: "border-box",
          maxWidth: "100%",
        }}
      >
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>
          Why Juneau Glacier Flights Hold or Cancel
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
            gap: 22,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "var(--muted)",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>
              1. Sea Level vs. Alpine Elevation
            </h3>
            <p style={{ margin: 0 }}>
              Downtown{" "}
              <a
                href={LFSE_CANONICAL_LINKS.juneauPort}
                style={{ color: "#9ed9ff", textDecoration: "underline" }}
              >
                Juneau cruise docks ↗
              </a>{" "}
              sit at sea level, whereas glacier helicopter routes cross mountain passes at
              1,500–4,000+ feet. A low ceiling over Pedersen Hill or Mendenhall Valley can pause
              glacier landings even when the harbor is dry.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>
              2. FAA Part 135 VFR Minima
            </h3>
            <p style={{ margin: 0 }}>
              Applicable VFR minima vary by airspace, altitude, and operator specifications under{" "}
              <a
                href="https://www.ecfr.gov/current/title-14/chapter-I/subchapter-G/part-135/subpart-D/section-135.205"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#9ed9ff", textDecoration: "underline" }}
              >
                14 CFR 135.205
              </a>{" "}
              and{" "}
              <a
                href="https://www.ecfr.gov/current/title-14/chapter-I/subchapter-G/part-135/subpart-D/section-135.207"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#9ed9ff", textDecoration: "underline" }}
              >
                14 CFR 135.207
              </a>
              . Always wait for your operator&apos;s official confirmation before changing plans.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>
              3. Weather Refunds &amp; Sea-Level Backups
            </h3>
            <p style={{ margin: 0 }}>
              TEMSCO and Coastal publish a 100% weather cancellation refund; NorthStar offers
              rescheduling or a full refund. If your flight cancels, explore{" "}
              <Link
                href="/juneau/what-to-do-if-helicopter-tour-canceled"
                style={{ color: "#9ed9ff", textDecoration: "underline" }}
              >
                our canceled-flight guide
              </Link>{" "}
              and{" "}
              <a
                href={LFSE_CANONICAL_LINKS.juneauWhaleCategory}
                style={{ color: "#9ed9ff", textDecoration: "underline" }}
              >
                Auke Bay whale watching ↗
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Cross-Port Backup Router */}
      <div style={{ marginTop: 32, marginBottom: 28 }}>
        <CrossPortBackup currentPort="Juneau" desiredTourType="scenic" />
      </div>

      <SourcesAndFreshness includeSkagway />
    </main>
  );
}
