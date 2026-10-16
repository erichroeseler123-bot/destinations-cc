import type { Metadata } from "next";
import Link from "next/link";
import HelicopterDispatchBoard from "./components/HelicopterDispatchBoard";

export const metadata: Metadata = {
  title: {
    absolute: "Juneau Helicopter Tours & Glacier Excursions | Compare & Book | Juneau Flight Deck",
  },
  description:
    "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.",
  alternates: { canonical: "https://juneauflightdeck.com/" },
  openGraph: {
    title: "Juneau Helicopter Tours & Glacier Excursions | Compare & Book | Juneau Flight Deck",
    description:
      "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans.",
    url: "https://juneauflightdeck.com/",
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Helicopter Tours & Glacier Excursions | Compare & Book",
    description:
      "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans.",
  },
};

const CP =
  "https://cruisepromenade.com/?utm_source=juneauflightdeck&utm_medium=referral&utm_campaign=alaska_cruise_planning";

const FIT_GUIDE_EXPERIENCES = [
  {
    id: "icefield-glacier-walk",
    title: "Icefield Glacier Walk",
    subtitle: "Mendenhall or Herbert Glacier Landing",
    operators: "TEMSCO Helicopters · Coastal Helicopters",
    rateRange: "$409 – $429",
    badge: "Best All-Around Fit",
    badgeColor: "#38bdf8",
    portWindowRequired: "3.5 – 4.0 hrs dock-to-dock",
    portWindowDetail:
      "2h 15m tour duration + 15–20m shuttle transfer each way (Downtown / AJ Dock to airport heliports) + 15m check-in & 90m pre-all-aboard buffer. Includes ~20–30m walking on blue glacier ice.",
    activityLevel: "Easy to Moderate",
    activityDetail:
      "Guided walk across undulating glacier ice and meltwater crevasses. Slip-on traction overboots are provided over your regular closed-toe walking shoes.",
    weightPolicy:
      "250 lb (113 kg) per-passenger threshold fully clothed with boots. 50%–100% comfort-seat surcharge applies at 250+ lbs. Discreet check-in scale; pilot assigns cabin seats for FAA Part 135 Center of Gravity.",
    weatherBackup:
      "Requires VFR mountain pass clearance (~1,000+ ft ceilings). 100% refund if canceled for weather, plus local coordination to pivot to Auke Bay whale watching within your remaining port window.",
    waitlistHref: "/helicopter-waitlist?tour=glacier_landing",
    waitlistLabel: "Check Glacier Walk Availability",
  },
  {
    id: "glacier-dog-sledding",
    title: "Glacier Dog Sledding",
    subtitle: "High-Altitude Snow Camp & Husky Team",
    operators: "TEMSCO Helicopters · Coastal Helicopters",
    rateRange: "$659 – $739",
    badge: "Sells Out Fastest",
    badgeColor: "#f0b35b",
    portWindowRequired: "4.0 – 4.5 hrs dock-to-dock",
    portWindowDetail:
      "2h 45m – 3h 15m tour duration + 15–20m round-trip heliport shuttle + check-in & 90m all-aboard safety cushion. Includes ~60m on the upper snowfield with professional mushers and huskies.",
    activityLevel: "Easy (Family-Friendly)",
    activityDetail:
      "Flat, packed snow surface at the high-altitude mushing camp. Stand on the sled runners or sit inside the sled basket; glacier overshoes and wind gear provided.",
    weightPolicy:
      "Strict 250 lb (113 kg) threshold fully dressed due to high-elevation snow camp hover performance. 50%–100% comfort surcharge at 250+ lbs; lighter groups of 6 can request manual 6th-seat manifest review.",
    weatherBackup:
      "Highest ceiling sensitivity (upper snow camp elevation). 100% weather refund; backup options include stepping down to a lower-level Icefield Glacier Walk, scanning Skagway (Denver Glacier), or Auke Bay whale watching.",
    waitlistHref: "/helicopter-waitlist?tour=dog_sledding",
    waitlistLabel: "Join Dog Sledding Availability Watch",
  },
  {
    id: "scenic-flightseeing",
    title: "Scenic Flightseeing",
    subtitle: "Pure Icefield Airtime · No Ice Landing",
    operators: "Part 135 Helicopter & Floatplane Operators",
    rateRange: "$249 – $299",
    badge: "Shortest Port Window",
    badgeColor: "#86efac",
    portWindowRequired: "2.5 – 3.0 hrs dock-to-dock",
    portWindowDetail:
      "1h 15m – 1h 30m tour duration + round-trip dock shuttle transfer + check-in buffer. Ideal for shorter half-day cruise calls or late-afternoon gangway arrivals.",
    activityLevel: "None (Seated Airtime Only)",
    activityDetail:
      "Zero walking on snow or uneven ice. Continuous aerial views of deep blue crevasses, granite spires, and glacial valleys from wraparound aircraft windows.",
    weightPolicy:
      "250 lb (113 kg) threshold on helicopter departures; balanced cabin seating assigned by flight dispatch at check-in with private scale readout.",
    weatherBackup:
      "Highest weather resilience—because no glacier touchdown is required, pilots can often adjust flight paths around localized valley fog. 100% weather refund or sea-level marine backup if grounded.",
    waitlistHref: "/helicopter-waitlist?tour=flightseeing",
    waitlistLabel: "Request Flightseeing Availability",
  },
];

export default function HomePage() {
  return (
    <main id="main-content">
      <HelicopterDispatchBoard
        portSlug="juneau"
        sourcePage="/"
        headline="Compare & Book Juneau Helicopter & Glacier Excursions"
        subhead="Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers."
        primaryCtaLabel="Find Your Tour"
      />

      {/* Scannable Dock-to-Dock Fit Guide */}
      <section
        id="dock-to-dock-fit-guide"
        aria-labelledby="dock-to-dock-fit-guide-heading"
        style={{
          maxWidth: 1240,
          margin: "0 auto 44px",
          padding: "36px clamp(14px, 4vw, 24px) 0",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "linear-gradient(180deg, rgba(8, 28, 42, 0.96) 0%, rgba(4, 17, 27, 0.98) 100%)",
            border: "1px solid rgba(151, 211, 255, 0.22)",
            borderRadius: "var(--radius-lg, 24px)",
            padding: "clamp(20px, 4vw, 34px)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div style={{ maxWidth: 820, marginBottom: 24 }}>
            <span
              style={{
                display: "inline-block",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--accent, #f0b35b)",
                marginBottom: 8,
              }}
            >
              Cruise Port Decision Matrix
            </span>
            <h2
              id="dock-to-dock-fit-guide-heading"
              style={{
                margin: "0 0 10px",
                fontSize: "clamp(1.45rem, 3.2vw, 2.15rem)",
                fontWeight: 900,
                lineHeight: 1.2,
                color: "#ffffff",
              }}
            >
              Compare Juneau Helicopter Experiences (Dock-to-Dock Fit Guide)
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                lineHeight: 1.6,
                color: "var(--muted, #cbd5e1)",
              }}
            >
              Generic booking sites list flight time only—leaving out the 15–20 minute airport shuttle each way, FAA weight-and-balance rules, and what happens if mountain pass clouds drop. Use this dock-to-dock breakdown to pick the right excursion for your ship&apos;s port window.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: 18,
              marginBottom: 24,
            }}
          >
            {FIT_GUIDE_EXPERIENCES.map((exp) => (
              <article
                key={exp.id}
                style={{
                  background: "rgba(3, 14, 23, 0.78)",
                  border: "1px solid rgba(151, 211, 255, 0.18)",
                  borderRadius: 18,
                  padding: "clamp(16px, 3.5vw, 22px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 16,
                  minWidth: 0,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "3px 9px",
                        borderRadius: 999,
                        background: "rgba(255, 255, 255, 0.07)",
                        border: `1px solid ${exp.badgeColor}`,
                        color: exp.badgeColor,
                      }}
                    >
                      {exp.badge}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.92rem",
                        fontWeight: 800,
                        color: "#34d399",
                      }}
                    >
                      {exp.rateRange}
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: "0 0 4px",
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "#ffffff",
                    }}
                  >
                    {exp.title}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      color: "var(--ice, #9ed9ff)",
                    }}
                  >
                    {exp.subtitle}
                  </p>
                  <p
                    style={{
                      margin: "0 0 14px",
                      fontSize: "0.76rem",
                      color: "var(--muted, #94a3b8)",
                    }}
                  >
                    {exp.operators}
                  </p>

                  <dl
                    style={{
                      margin: 0,
                      display: "grid",
                      gap: 12,
                      borderTop: "1px solid rgba(151, 211, 255, 0.12)",
                      paddingTop: 14,
                    }}
                  >
                    <div>
                      <dt
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--accent, #f0b35b)",
                          marginBottom: 3,
                        }}
                      >
                        ⏱️ Total Port-Window Time (Incl. Shuttle Buffer)
                      </dt>
                      <dd style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.5, color: "#e2e8f0" }}>
                        <strong style={{ color: "#ffffff", display: "block", marginBottom: 2 }}>
                          {exp.portWindowRequired}
                        </strong>
                        {exp.portWindowDetail}
                      </dd>
                    </div>

                    <div>
                      <dt
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--ice, #9ed9ff)",
                          marginBottom: 3,
                        }}
                      >
                        🥾 Activity Level &amp; Gear
                      </dt>
                      <dd style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.5, color: "#e2e8f0" }}>
                        <strong style={{ color: "#ffffff", display: "block", marginBottom: 2 }}>
                          {exp.activityLevel}
                        </strong>
                        {exp.activityDetail}
                      </dd>
                    </div>

                    <div>
                      <dt
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#c4b5fd",
                          marginBottom: 3,
                        }}
                      >
                        ⚖️ Weight-Policy Transparency
                      </dt>
                      <dd style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.5, color: "#e2e8f0" }}>
                        {exp.weightPolicy}
                      </dd>
                    </div>

                    <div>
                      <dt
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#86efac",
                          marginBottom: 3,
                        }}
                      >
                        🛡️ Weather-Cancellation Backup Options
                      </dt>
                      <dd style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.5, color: "#e2e8f0" }}>
                        {exp.weatherBackup}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div
                  style={{
                    paddingTop: 12,
                    borderTop: "1px solid rgba(151, 211, 255, 0.12)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <Link
                    href={exp.waitlistHref}
                    className="button button-secondary"
                    style={{
                      width: "100%",
                      minHeight: 44,
                      padding: "10px 14px",
                      fontSize: "0.78rem",
                      textAlign: "center",
                      whiteSpace: "normal",
                      lineHeight: 1.3,
                    }}
                  >
                    {exp.waitlistLabel} &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Direct Action & Contingency Links Bar */}
          <div
            style={{
              background: "rgba(6, 21, 33, 0.85)",
              border: "1px solid rgba(151, 211, 255, 0.2)",
              borderRadius: 14,
              padding: "clamp(14px, 3vw, 20px)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div style={{ maxWidth: 640, minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: "0.92rem", color: "#ffffff", marginBottom: 4 }}>
                Sold out on your ship or worried about Juneau mountain weather?
              </strong>
              <p style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.5, color: "var(--muted, #cbd5e1)" }}>
                Check your ship&apos;s exact dock-to-dock buffer and register for daily seat checks, or review our step-by-step weather cancellation backup playbook.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link
                href="/helicopter-waitlist"
                className="button button-primary"
                style={{
                  minHeight: 44,
                  padding: "10px 16px",
                  fontSize: "0.8rem",
                  whiteSpace: "normal",
                  textAlign: "center",
                }}
              >
                Sold-Out Waitlist &amp; Port Timing &rarr;
              </Link>
              <Link
                href="/juneau/what-to-do-if-helicopter-tour-canceled"
                className="button button-secondary"
                style={{
                  minHeight: 44,
                  padding: "10px 16px",
                  fontSize: "0.8rem",
                  whiteSpace: "normal",
                  textAlign: "center",
                }}
              >
                Weather Cancellation Backup Guide &rarr;
              </Link>
              <Link
                href="/juneau-helicopter-tour-weight-limits-and-seating"
                className="button button-secondary"
                style={{
                  minHeight: 44,
                  padding: "10px 16px",
                  fontSize: "0.8rem",
                  whiteSpace: "normal",
                  textAlign: "center",
                }}
              >
                250 lb Weight &amp; 6th-Seat Guide &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Plan the rest of your cruise"
        style={{ maxWidth: 1120, margin: "0 auto 52px", padding: "0 20px" }}
      >
        <div
          style={{
            border: "1px solid rgba(17,41,61,.18)",
            borderRadius: 18,
            padding: "24px 26px",
            background: "#f5f8fa",
            color: "#11293d",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "#334155",
            }}
          >
            Planning more than Juneau?
          </div>
          <h2 style={{ margin: "8px 0", fontSize: "clamp(24px,4vw,36px)" }}>
            Put the whole cruise in one shared plan.
          </h2>
          <p style={{ margin: "0 0 16px", lineHeight: 1.6, maxWidth: 760, color: "#1e293b" }}>
            Cruise Promenade gives your group one private cruise planner for port days,
            booked activities and the plans everyone needs to see.
          </p>
          <a
            href={CP}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Plan the whole cruise on Cruise Promenade (opens in new tab)"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              borderRadius: 10,
              background: "#11293d",
              color: "#ffffff",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Plan the whole cruise →
          </a>
        </div>
      </section>
    </main>
  );
}
