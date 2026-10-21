"use client";

import React from "react";
import Link from "next/link";

export interface ExcursionProfile {
  category: string;
  rate: string;
  duration: string;
  demand: "Easy" | "Moderate" | "Strenuous" | "None (Airtime)";
  operators: string[];
  experience: string;
  backupReason: string;
  highlight?: boolean;
  actionUrl: string;
}

export const EXCURSION_SPECS_DATA: ExcursionProfile[] = [
  {
    category: "Glacier Landing",
    rate: "$409 – $429",
    duration: "2h 15m total",
    demand: "Moderate",
    operators: ["TEMSCO Helicopters", "Coastal Helicopters"],
    experience:
      "Scenic alpine flight loops over granite spires followed by a 20–30 minute guided walking exploration on blue glacier ice fields.",
    backupReason:
      "Lowest cost entry point to step onto the icefield if high-altitude dog sledding camps are completely full.",
    highlight: false,
    actionUrl: "/helicopter",
  },
  {
    category: "Glacier Dog Sledding",
    rate: "$659 – $739",
    duration: "2h 45m – 3h 15m",
    demand: "Easy",
    operators: ["TEMSCO Helicopters", "Coastal Helicopters"],
    experience:
      "Fly to high-altitude permanent snow camps. Meet professional mushers and drive an authentic racing husky team across alpine snowfields.",
    backupReason:
      "Highest demand bucket-list tour. If completely locked out in Juneau, use the Skagway backup engine for Denver Glacier availability.",
    highlight: true,
    actionUrl: "/best-time-for-glacier-dog-sledding-juneau",
  },
  {
    category: "Ice Trek & Climb",
    rate: "$499 – $549",
    duration: "3h 15m – 4h 15m",
    demand: "Strenuous",
    operators: ["NorthStar Trekking"],
    experience:
      "Extended 1 to 2 hours exploring deep technical terrain equipped with mountaineering boots, crampons, safety harnesses, and ice axes.",
    backupReason:
      "Best for active travelers. Tiny group size thresholds (typically 5–10 pax) mean single-passenger cancellations drop back into inventory frequently.",
    highlight: false,
    actionUrl: "/temsco-vs-northstar-juneau",
  },
  {
    category: "Scenic Flightseeing",
    rate: "$249 – $299",
    duration: "1h 15m – 1h 30m",
    demand: "None (Airtime)",
    operators: ["Wings Airways (Floatplane)", "Alaska Seaplanes"],
    experience:
      "Pure aerial tracking of mountain gaps, deep valleys, and blue icefall cascades with zero physical landing on the glacier surface.",
    backupReason:
      "Highly weather-resilient. When low, hanging mountain cloud layers block ice touch downs, scenic paths can often still operate safely.",
    highlight: false,
    actionUrl: "/helicopter",
  },
];

export const excursionComparisonSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Juneau Icefield Helicopter & Glacier Excursion Alternatives",
  description:
    "A structural side-by-side technical comparison of Juneau glacier flight configurations, baseline rates, durations, and backup landing options for cruise line travelers.",
  itemListElement: EXCURSION_SPECS_DATA.map((item, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    item: {
      "@type": "Service",
      name: `${item.category} Tour`,
      description: `${item.experience} ${item.backupReason}`,
      provider: {
        "@type": "Organization",
        name: "Juneau Flight Deck",
        url: "https://juneauflightdeck.com",
      },
      areaServed: {
        "@type": "City",
        name: "Juneau",
        addressRegion: "Alaska",
        addressCountry: "US",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        description: `Baseline rate: ${item.rate}`,
      },
    },
  })),
};

export default function ExcursionSpecsGrid() {
  return (
    <div
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #0d273a 0%, #051420 100%)",
        border: "1px solid rgba(158, 217, 255, 0.22)",
        borderRadius: "var(--radius-xl)",
        padding: "24px 20px",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5)",
        color: "var(--text)",
        maxWidth: 960,
        margin: "32px auto",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(excursionComparisonSchema) }}
      />

      {/* Header Profile Section */}
      <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 16, marginBottom: 20 }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "0.74rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "4px 10px",
            borderRadius: 20,
            background: "rgba(56, 189, 248, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            color: "#38bdf8",
            marginBottom: 8,
          }}
        >
          📊 Technical Inventory Matrix
        </span>
        <h3 style={{ margin: 0, fontSize: "clamp(1.2rem, 3vw, 1.55rem)", fontWeight: 900, color: "#fff" }}>
          Juneau Flight Configurations &amp; Operator Profiles
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: "0.9rem", color: "var(--muted)", maxWidth: 700, lineHeight: 1.5 }}>
          Compare verified independent baseline rates, round-trip dock shuttles, physical exertion scales, and licensed providers side-by-side.
        </p>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "0.85rem",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--line)",
                background: "rgba(3, 14, 23, 0.6)",
                color: "var(--ice)",
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <th style={{ padding: "12px 14px" }}>Flight Category</th>
              <th style={{ padding: "12px 14px" }}>Base Rate</th>
              <th style={{ padding: "12px 14px" }}>Duration (Incl. Shuttle)</th>
              <th style={{ padding: "12px 14px" }}>Exertion</th>
              <th style={{ padding: "12px 14px" }}>Licensed Operators</th>
              <th style={{ padding: "12px 14px" }}>Strategy &amp; Backup Logic</th>
            </tr>
          </thead>
          <tbody>
            {EXCURSION_SPECS_DATA.map((spec, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: "1px solid rgba(151, 211, 255, 0.1)",
                  background: spec.highlight ? "rgba(99, 102, 241, 0.08)" : "transparent",
                }}
              >
                {/* Category */}
                <td style={{ padding: "14px", fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>
                  <div>{spec.category}</div>
                  {spec.highlight && (
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.65rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        background: "rgba(99, 102, 241, 0.25)",
                        border: "1px solid rgba(99, 102, 241, 0.4)",
                        color: "#a5b4fc",
                        padding: "2px 6px",
                        borderRadius: 4,
                        marginTop: 4,
                      }}
                    >
                      Peak Demand
                    </span>
                  )}
                </td>

                {/* Rate */}
                <td style={{ padding: "14px", fontFamily: "monospace", fontWeight: 800, color: "#34d399", whiteSpace: "nowrap" }}>
                  {spec.rate}
                </td>

                {/* Duration */}
                <td style={{ padding: "14px", color: "var(--text)", whiteSpace: "nowrap" }}>
                  <div>{spec.duration}</div>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Dock to Heliport</span>
                </td>

                {/* Exertion */}
                <td style={{ padding: "14px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      padding: "3px 8px",
                      borderRadius: 6,
                      background:
                        spec.demand === "Strenuous"
                          ? "rgba(239, 68, 68, 0.2)"
                          : spec.demand === "Moderate"
                          ? "rgba(245, 158, 11, 0.2)"
                          : "rgba(16, 185, 129, 0.2)",
                      border:
                        spec.demand === "Strenuous"
                          ? "1px solid rgba(239, 68, 68, 0.4)"
                          : spec.demand === "Moderate"
                          ? "1px solid rgba(245, 158, 11, 0.4)"
                          : "1px solid rgba(16, 185, 129, 0.4)",
                      color:
                        spec.demand === "Strenuous"
                          ? "#fca5a5"
                          : spec.demand === "Moderate"
                          ? "#fcd34d"
                          : "#6ee7b7",
                    }}
                  >
                    {spec.demand}
                  </span>
                </td>

                {/* Operators */}
                <td style={{ padding: "14px" }}>
                  <ul style={{ margin: 0, paddingLeft: 14, listStyle: "circle", color: "var(--muted)", fontSize: "0.78rem", lineHeight: 1.4 }}>
                    {spec.operators.map((op, oIdx) => (
                      <li key={oIdx} style={{ whiteSpace: "nowrap" }}>
                        {op}
                      </li>
                    ))}
                  </ul>
                </td>

                {/* Backup Strategy */}
                <td style={{ padding: "14px", minWidth: 240, lineHeight: 1.5 }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.82rem", color: "var(--text)" }}>
                    {spec.experience}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.76rem", color: "#93c5fd", fontStyle: "italic" }}>
                    <strong>Backup:</strong> {spec.backupReason}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid CTA Footer */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
          Need live seats checked for a specific date? We coordinate directly with local flight desks.
        </span>
        <Link
          href="#waitlist"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "#fff",
            textDecoration: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: "0.84rem",
            fontWeight: 800,
          }}
        >
          <span>Check Matching Departures ↓</span>
        </Link>
      </div>
    </div>
  );
}
