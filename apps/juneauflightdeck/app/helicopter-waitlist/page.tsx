import type { Metadata } from "next";
import Link from "next/link";
import HelicopterWaitlistForm from "../components/HelicopterWaitlistForm";
import ExcursionPortBufferSolver from "../components/ExcursionPortBufferSolver";
import CrossPortBackup from "../components/CrossPortBackup";
import { ALASKA_CRUISE_FLEET } from "../../lib/alaskaCruiseFleet";

export const metadata: Metadata = {
  title: "Helicopter Tour Availability Check & Request | Juneau Flight Deck",
  description:
    "Compare and book Juneau excursions, and submit your ship, port date, tour preference, and party size for a helicopter availability request. We perform daily availability checks across TEMSCO, Coastal, and NorthStar.",
  alternates: { canonical: "https://juneauflightdeck.com/helicopter-waitlist" },
  openGraph: {
    title: "Helicopter Tour Availability Check | Juneau Flight Deck",
    description:
      "Daily availability checks for Juneau & Skagway helicopter glacier tours. Direct operator booking links and excursion coordination.",
    url: "https://juneauflightdeck.com/helicopter-waitlist",
  },
};

const waitlistFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "When do sold-out Juneau helicopter seats usually open up?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Seats can reopen when cruise line group blocks are adjusted, when other travelers change plans or cancel, or when dispatchers finalize aircraft weight and balance manifests. We conduct daily availability checks across local operator schedules to find matching openings.",
      },
    },
    {
      "@type": "Question",
      name: "Can I monitor both Juneau and Skagway for glacier dog sledding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Many Alaska cruise sailings visit both Juneau and Skagway. TEMSCO operates dog sledding camps on both Herbert Glacier (Juneau) and Denver Glacier (Skagway). Our form allows you to submit availability requests for both port dates.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if a helicopter tour is grounded due to mountain weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All Part 135 helicopter operators in Juneau and Skagway provide a 100% full refund if a flight cannot proceed due to weather conditions. Additionally, Juneau Flight Deck provides same-day backup coordination to help you pivot to marine tours like Auke Bay whale watching.",
      },
    },
  ],
};

const waitlistServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Juneau Helicopter Sold-Out Tour Waitlist & Availability Assistance",
  serviceType: "Helicopter Excursion Availability Assistance",
  provider: {
    "@type": "Organization",
    name: "Juneau Flight Deck",
    url: "https://juneauflightdeck.com",
    logo: "https://juneauflightdeck.com/images/jfd-logo.png",
  },
  areaServed: {
    "@type": "City",
    name: "Juneau",
    addressRegion: "Alaska",
    addressCountry: "US",
  },
  description:
    "Helps Alaska cruise passengers compare and book open seats, or request availability checks for sold-out Juneau helicopter and glacier dog sledding tours across local Part 135 operators (TEMSCO, Coastal, NorthStar) with cruise ship port timing guidance.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free availability check and notification service for Alaska cruise travelers.",
  },
};

export default function Page() {
  // Group ships by cruise line
  const shipsByLine = ALASKA_CRUISE_FLEET.reduce((acc, ship) => {
    const line = ship.cruiseLine;
    if (!acc[line]) acc[line] = [];
    acc[line].push(ship);
    return acc;
  }, {} as Record<string, typeof ALASKA_CRUISE_FLEET>);

  return (
    <main id="main-content" className="jfd-root waitlist-page-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(waitlistServiceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(waitlistFaqSchema) }}
      />

      <div className="site-shell" style={{ maxWidth: 960, margin: "0 auto", padding: "44px 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p className="eyebrow" style={{ color: "var(--accent, #f0b35b)", marginBottom: 8 }}>
            Cruise Logistics &amp; Excursion Planning
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 4.5vw, 2.85rem)",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#ffffff",
              margin: "0 0 16px",
              letterSpacing: "-0.02em",
            }}
          >
            Alaska Cruise Ship Port Timing &amp; Availability Alerts
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.6,
              color: "rgba(228, 239, 246, 0.9)",
              maxWidth: 760,
              margin: "0 auto 20px",
            }}
          >
            Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, availability alerts for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <Link
              href="/helicopter"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 20px",
                borderRadius: 8,
                background: "var(--accent, #f0b35b)",
                color: "#04101d",
                fontWeight: 800,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Compare &amp; Book Open Tours →
            </Link>
            <Link
              href="/juneau-helicopter-tour-weight-limits-and-seating"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 18px",
                borderRadius: 8,
                background: "rgba(14, 165, 233, 0.15)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                color: "#38bdf8",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Seat Math &amp; Weight Simulator ✈️
            </Link>
            <Link
              href="/temsco-vs-coastal-vs-northstar-juneau"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 18px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Operator Specs
            </Link>
            <a
              href="#waitlist-form"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 18px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "var(--ice, #9ed9ff)",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Daily Availability Check ↓
            </a>
          </div>
        </div>

        {/* Dynamic Shore Excursion Port Buffer Calculator */}
        <section style={{ marginBottom: 40 }}>
          <ExcursionPortBufferSolver />
        </section>

        {/* 1. Cruise Port Timing & Fleet Directory Section (Top priority) */}
        <section
          style={{
            background: "rgba(3, 14, 23, 0.8)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg, 16px)",
            padding: "32px 28px",
            marginBottom: 44,
          }}
          aria-labelledby="fleet-directory-heading"
        >
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent, #f0b35b)" }}>
              Step 1 · Port Logistics
            </span>
            <h2
              id="fleet-directory-heading"
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", margin: "6px 0 10px" }}
            >
              Select Your Alaska Cruise Ship for Port Hours &amp; Berth Guidance
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--muted, #94a3b8)", lineHeight: 1.5, margin: "0 0 16px" }}>
              Each ship operates on unique gangway hours and assigned Juneau docks. Choose your ship to see recommended flight windows, dock transit logistics, and live availability:
            </p>

            {/* Quick Port Timing Rules */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "rgba(6, 21, 33, 0.6)", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 14px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 700, display: "block" }}>DOWNTOWN BERTHS</span>
                <strong style={{ fontSize: "0.85rem", color: "#ffffff" }}>Franklin, CT &amp; Marine Park</strong>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: 2 }}>15-min shuttle to airport heliports</span>
              </div>
              <div style={{ background: "rgba(6, 21, 33, 0.6)", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 14px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 700, display: "block" }}>SOUTH BERTH</span>
                <strong style={{ fontSize: "0.85rem", color: "#ffffff" }}>AJ Dock (AJD)</strong>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: 2 }}>20-min shuttle from south security gate</span>
              </div>
              <div style={{ background: "rgba(6, 21, 33, 0.6)", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 14px" }}>
                <span style={{ fontSize: "0.75rem", color: "#86efac", fontWeight: 700, display: "block" }}>SAFETY BUFFER</span>
                <strong style={{ fontSize: "0.85rem", color: "#ffffff" }}>90–120 Minutes</strong>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: 2 }}>Scheduled return prior to all-aboard</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            {Object.entries(shipsByLine).map(([line, ships]) => (
              <div key={line} style={{ borderTop: "1px solid rgba(151, 211, 255, 0.12)", paddingTop: 14 }}>
                <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ice, #9ed9ff)", marginBottom: 8 }}>
                  ⚓ {line}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ships.map((ship) => (
                    <Link
                      key={ship.slug}
                      href={`/helicopter-waitlist/${ship.slug}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        fontSize: "0.82rem",
                        color: "#e2e8f0",
                        background: "rgba(6, 21, 33, 0.9)",
                        border: "1px solid rgba(151, 211, 255, 0.2)",
                        borderRadius: 8,
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{ship.shipName}</span>
                      <span style={{ color: "rgba(151, 211, 255, 0.6)", fontSize: "0.75rem" }}>
                        ({ship.typicalScheduledBerth.split("(")[0].trim()})
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-Port Backup Funnel */}
        <section style={{ marginBottom: 40 }}>
          <CrossPortBackup currentPort="Juneau" desiredTourType="dogsled" />
        </section>

        {/* 2. Primary Waitlist Intake Form */}
        <section id="waitlist-form" style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent, #f0b35b)" }}>
              Step 2 · Availability Watch
            </span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", margin: "6px 0 8px" }}>
              Can&apos;t Find an Open Seat? Request a Daily Availability Check
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", maxWidth: 680, margin: "0 auto", lineHeight: 1.5 }}>
              If your desired tour or departure time is fully booked through your cruise line, submit your port date below. We perform a daily availability check across local helicopter operators (TEMSCO, Coastal, NorthStar) and send direct booking links if seats open.
            </p>
          </div>
          <HelicopterWaitlistForm />
        </section>

        {/* High-Intent Decision Guides & Internal Links */}
        <section
          style={{
            borderTop: "1px solid var(--line)",
            paddingTop: 32,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <div style={{ background: "rgba(6, 21, 33, 0.5)", border: "1px solid var(--line)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: "1rem", color: "#ffffff", margin: "0 0 8px" }}>
              <Link href="/juneau-helicopter-tour-sold-out" style={{ color: "var(--ice, #9ed9ff)", textDecoration: "none" }}>
                Sold-Out Seats Guide &rarr;
              </Link>
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              How independent operator capacity differs from cruise line blocks and how to check for reopened seats.
            </p>
          </div>

          <div style={{ background: "rgba(6, 21, 33, 0.5)", border: "1px solid var(--line)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: "1rem", color: "#ffffff", margin: "0 0 8px" }}>
              <Link href="/temsco-vs-coastal-vs-northstar-juneau" style={{ color: "var(--ice, #9ed9ff)", textDecoration: "none" }}>
                Operator Comparison &rarr;
              </Link>
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              Compare TEMSCO, Coastal, and NorthStar: aircraft types, landing glaciers, and mountaineering options.
            </p>
          </div>

          <div style={{ background: "rgba(6, 21, 33, 0.5)", border: "1px solid var(--line)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: "1rem", color: "#ffffff", margin: "0 0 8px" }}>
              <Link href="/juneau-helicopter-tour-weight-limits-and-seating" style={{ color: "var(--ice, #9ed9ff)", textDecoration: "none" }}>
                Weight Limits &amp; 6th Seat Math &rarr;
              </Link>
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              FAA weight and balance rules, 250lb surcharges, and how dispatchers unlock additional group seats.
            </p>
          </div>

          <div style={{ background: "rgba(6, 21, 33, 0.5)", border: "1px solid var(--line)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: "1rem", color: "#ffffff", margin: "0 0 8px" }}>
              <Link href="/skagway/helicopter" style={{ color: "var(--ice, #9ed9ff)", textDecoration: "none" }}>
                Skagway Helicopter Tours &rarr;
              </Link>
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              Denver Glacier dog sledding and Meade Glacier landings for your Skagway port call.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
