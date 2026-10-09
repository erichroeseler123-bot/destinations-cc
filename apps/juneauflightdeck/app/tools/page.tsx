import type { Metadata } from "next";
import Link from "next/link";
import HelicopterCabinSimulator from "../components/HelicopterCabinSimulator";
import ExcursionPortBufferSolver from "../components/ExcursionPortBufferSolver";
import ExcursionSpecsGrid from "../components/ExcursionSpecsGrid";
import CrossPortBackup from "../components/CrossPortBackup";

export const metadata: Metadata = {
  title: "Alaska Cruise Helicopter Flight & Port Logistics Toolkit | Juneau Flight Deck",
  description:
    "Interactive Airbus AStar 350 weight & balance simulator, 19-ship cruise port buffer solver, technical excursion comparison matrix, and cross-port backup routing.",
  alternates: { canonical: "https://juneauflightdeck.com/tools" },
  openGraph: {
    title: "Alaska Cruise Helicopter Flight & Port Logistics Toolkit",
    description:
      "Interactive cabin weight & balance simulator, cruise port buffer solver, and technical excursion matrix for Alaska Inside Passage travelers.",
    url: "https://juneauflightdeck.com/tools",
  },
};

const toolkitJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Juneau Flight Deck Cruise Logistics & Aviation Toolkit",
      applicationCategory: "TravelApplication",
      operatingSystem: "All",
      description:
        "Suite of interactive tools for Alaska cruise passengers: AStar 350 helicopter weight & balance simulator, 19-ship docking buffer solver, and excursion alternative comparisons.",
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
    },
  ],
};

export default function ToolsDashboardPage() {
  return (
    <main className="page-shell" style={{ maxWidth: 1040, margin: "auto", padding: "40px 20px 80px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolkitJsonLd) }}
      />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <p className="eyebrow" style={{ color: "var(--accent, #f0b35b)", marginBottom: 8 }}>
          Aviation &amp; Maritime Logistics
        </p>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            fontWeight: 900,
            lineHeight: 1.15,
            color: "#ffffff",
            margin: "0 0 14px",
          }}
        >
          Alaska Cruise Flight &amp; Port Logistics Dashboard
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            lineHeight: 1.6,
            color: "var(--muted)",
            maxWidth: 760,
            margin: "0 auto 24px",
          }}
        >
          Independent calculators solving the four hardest friction points in Alaska excursion planning: aircraft weight &amp; balance, ship dock transit buffers, operator comparisons, and sold-out cross-port alternatives.
        </p>

        {/* Quick Nav Anchors */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
          <a
            href="#weight-simulator"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              color: "#38bdf8",
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            1. Weight &amp; Balance Simulator ↓
          </a>
          <a
            href="#port-solver"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(158, 217, 255, 0.12)",
              border: "1px solid rgba(158, 217, 255, 0.25)",
              color: "var(--ice)",
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            2. Port Buffer Solver ↓
          </a>
          <a
            href="#specs-matrix"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.35)",
              color: "#a5b4fc",
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            3. Excursion Specs Grid ↓
          </a>
          <a
            href="#cross-port"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              color: "#fcd34d",
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            4. Skagway / Ketchikan Backup ↓
          </a>
        </div>
      </div>

      {/* Tool 1: Helicopter Cabin Weight & Balance Simulator */}
      <section id="weight-simulator" style={{ scrollMarginTop: 80, marginBottom: 50 }}>
        <HelicopterCabinSimulator />
      </section>

      {/* Tool 2: 19-Ship Cruise Excursion Port Buffer Solver */}
      <section id="port-solver" style={{ scrollMarginTop: 80, marginBottom: 50 }}>
        <ExcursionPortBufferSolver />
      </section>

      {/* Tool 3: Technical Excursion Specs Matrix */}
      <section id="specs-matrix" style={{ scrollMarginTop: 80, marginBottom: 50 }}>
        <ExcursionSpecsGrid />
      </section>

      {/* Tool 4: Cross-Port Itinerary Backup */}
      <section id="cross-port" style={{ scrollMarginTop: 80, marginBottom: 50 }}>
        <CrossPortBackup currentPort="Juneau" desiredTourType="dogsled" />
      </section>

      {/* Footer Return Link */}
      <div style={{ textAlign: "center", paddingTop: 20, borderTop: "1px solid var(--line)" }}>
        <Link
          href="/helicopter-waitlist"
          style={{
            color: "var(--ice)",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "0.95rem",
          }}
        >
          &larr; Return to All Cruise Ship Availability Alerts &amp; Waitlists
        </Link>
      </div>
    </main>
  );
}
