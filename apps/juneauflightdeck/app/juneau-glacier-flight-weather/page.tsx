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
        text: "Under FAA Part 135 Visual Flight Rules (VFR), commercial tour helicopters cannot fly into clouds. Pilots must maintain a minimum of 1,000 feet of clearance beneath cloud ceilings and at least 3 statute miles of forward flight visibility along the entire route.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if my Juneau helicopter tour is canceled due to weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All licensed Juneau helicopter operators (TEMSCO, Coastal, NorthStar) provide 100% full refunds or rebooking options if a flight is canceled due to adverse weather or cloud ceilings.",
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
            See exactly what helicopter dispatchers see before your excursion. Live mountain pass camera feeds
            from Pedersen Hill, Juneau Tram, and Spuhn Island to track cloud decks, mountain fog, and VFR flight clearance.
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
                Under federal law (FAA Part 135), commercial passenger helicopters cannot operate under instrument guidance (IFR)
                into remote glacier landing sites. Dispatchers require Visual Flight Rules: continuous ground reference,
                at least 1,000 feet of separation beneath cloud decks, and 3 miles visibility. If the cloud deck dips below
                the pass ridge, safety rules require dispatchers to hold or cancel flights.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>
                3. The 100% Weather Refund Rule
              </h3>
              <p style={{ margin: 0 }}>
                All reputable flight operators (TEMSCO Helicopters, Coastal Helicopters, NorthStar Trekking) operate with strict safety-first protocols.
                If dispatch cancels your flight due to cloud cover or wind shear, you are <strong>100% refunded</strong> automatically.
                No operator will ever fly into unsafe mountain margins.
              </p>
            </div>
          </div>
        </section>

        {/* Cross-Port Backup Router */}
        <div style={{ marginTop: 40 }}>
          <CrossPortBackup currentPort="Juneau" desiredTourType="dogsled" />
        </div>
      </main>
    </>
  );
}
