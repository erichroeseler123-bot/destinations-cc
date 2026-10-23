import type { Metadata } from "next";
import Link from "next/link";
import GlacierFlightCams from "../components/GlacierFlightCams";
import CrossPortBackup from "../components/CrossPortBackup";

export const metadata: Metadata = {
  title: "Juneau Glacier Flight Weather & Live FAA Aviation Cams | Juneau Flight Deck",
  description:
    "Check live FAA WeatherCams along Juneau helicopter flight corridors to Mendenhall Glacier, Herbert Glacier, and Gastineau Channel. Understand mountain cloud ceilings and VFR safety minima.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau-glacier-flight-weather" },
  openGraph: {
    title: "Juneau Glacier Flight Weather & Live FAA Aviation Cams",
    description:
      "Real-time visual feeds from FAA WeatherCam towers used by helicopter dispatchers to evaluate mountain pass safety, cloud ceilings, and VFR flight status.",
    url: "https://juneauflightdeck.com/juneau-glacier-flight-weather",
  },
};

const weatherFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why do helicopter tours cancel when downtown Juneau is sunny?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Downtown Juneau cruise berths sit at sea level, but glacier landing zones sit between 1,800 and 4,000 feet in steep mountain passes. Marine moisture frequently gets trapped against the coastal mountains, creating low cloud ceilings that obscure the glacier while downtown remains clear.",
      },
    },
    {
      "@type": "Question",
      name: "What are the FAA weather minimums for Juneau helicopter tours?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There is no single 1,000-foot-and-3-mile rule for every point of a Juneau helicopter tour. Applicable VFR minima depend on airspace, altitude, time of day, and the operator's FAA-approved specifications. Part 135.207 requires sufficient visual surface reference for VFR helicopter control. Only the pilot and operator can make the go/no-go decision.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if my Juneau helicopter tour is canceled due to weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The current direct-booking pages for TEMSCO, Coastal, and NorthStar state that an operator-canceled weather flight is refunded or, for NorthStar, first offered rebooking and then refunded if rebooking is not possible. A third-party reservation is governed by the terms attached to that booking.",
      },
    },
  ],
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Juneau Icefield Flight Path Aviation Cams & Weather Portal",
  applicationCategory: "TravelApplication",
  operatingSystem: "All",
  url: "https://juneauflightdeck.com/juneau-glacier-flight-weather",
  description:
    "Real-time FAA aviation weathercam aggregator and visual VFR monitoring tool for Juneau glacier helicopter tour corridors.",
};

export default function GlacierFlightWeatherPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(weatherFaqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Breadcrumb / Top Bar */}
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
        <header style={{ marginBottom: 32 }}>
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
            Live Aviation Conditions • FAA Part 135 VFR
          </span>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#ffffff",
              margin: "0 0 14px",
            }}
          >
            Juneau Glacier Flight Weather &amp; Live FAA Aviation Cams
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.6,
              color: "var(--muted)",
              maxWidth: 780,
              margin: 0,
            }}
          >
            Review near-real-time FAA weather-camera images for additional context on cloud decks
            and mountain fog. These images are supplemental information—not a flight-status feed—and
            only the operator can make the go/no-go decision.
          </p>
        </header>

        {/* Live WeatherCams Component */}
        <GlacierFlightCams />

        {/* In-Depth Flight Dispatch Explanation */}
        <section
          style={{
            background: "linear-gradient(135deg, rgba(8, 23, 38, 0.95) 0%, rgba(4, 14, 24, 0.98) 100%)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
            padding: "32px 28px",
            margin: "36px 0",
          }}
        >
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>
            The Science of Juneau Glacier Flight Delays
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
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
                Downtown Juneau sits at sea level (0 ft elevation), protected by Gastineau Peak.
                However, helicopter flights must traverse mountain passes at 1,500–2,500 ft to land on
                Mendenhall Glacier (1,800 ft) or the high snowfields of Herbert and Taku Glaciers (3,500+ ft).
                A 100-foot ceiling change in the pass can shut down flight routes while cruise passengers are wearing T-shirts downtown.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>
                2. FAA Visual Flight Rules (VFR) Minima
              </h3>
              <p style={{ margin: 0 }}>
                Applicable VFR minima vary by airspace, altitude, time of day, and the operator&apos;s
                FAA-approved specifications. Part 135.207 requires enough visual surface reference
                to control a helicopter operating under VFR. A camera image cannot establish legal
                flight conditions by itself; the pilot and operator make the operational decision.
                See <a href="https://www.ecfr.gov/current/title-14/chapter-I/subchapter-G/part-135/subpart-D/section-135.205" target="_blank" rel="noopener noreferrer">14 CFR 135.205</a>
                {" "}and <a href="https://www.ecfr.gov/current/title-14/chapter-I/subchapter-G/part-135/subpart-D/section-135.207" target="_blank" rel="noopener noreferrer">14 CFR 135.207</a>.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>
                3. Weather-Cancellation Terms
              </h3>
              <p style={{ margin: 0 }}>
                TEMSCO and Coastal currently publish a full refund when they cancel for weather.
                NorthStar publishes rebooking first and a full refund if rebooking is not possible.
                Those statements are for direct operator terms; a marketplace booking is controlled
                by the cancellation terms on its own confirmation.
              </p>
            </div>
          </div>
          <p style={{ margin: "24px 0 0", fontSize: ".78rem", color: "var(--muted)" }}>
            Sources checked October 23, 2026: FAA weather-camera guidance, current eCFR Part 135,
            and the operators&apos; published tour or FAQ pages.
          </p>
        </section>

        {/* Cross-Port Backup Router */}
        <div style={{ marginTop: 40 }}>
          <CrossPortBackup currentPort="Juneau" desiredTourType="dogsled" />
        </div>
      </main>
    </>
  );
}
