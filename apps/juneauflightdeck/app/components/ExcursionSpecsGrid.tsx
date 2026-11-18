"use client";

import React from "react";
import Link from "next/link";
import {
  LFSE_CANONICAL_LINKS,
  UNVERIFIED_PARTNER_PRICE_LABEL,
  VERIFIED_TARIFF_DATE_LONG,
} from "@/lib/verifiedOperatorPricing";

export interface ExcursionProfile {
  category: string;
  rate: string;
  rateSubnote: string;
  duration: string;
  demand: "Easy" | "Moderate" | "Strenuous" | "None (Airtime)";
  operators: Array<{ name: string; officialUrl: string; lfseUrl?: string }>;
  experience: string;
  backupReason: string;
  highlight?: boolean;
  actionUrl: string;
}

export const EXCURSION_SPECS_DATA: ExcursionProfile[] = [
  {
    category: "Glacier Landing & Walk",
    rate: "$449 – $459 base (as of Nov 18, 2026)",
    rateSubnote:
      "TEMSCO $449 (+$150 at 250+ lbs) · Coastal $459 ($609 260–299 lbs / $918 300+ lbs) · + CBJ tax & fees",
    duration: "2h 15m – 2h 35m total",
    demand: "Moderate",
    operators: [
      {
        name: "TEMSCO Helicopters",
        officialUrl: "https://temscoair.com/",
        lfseUrl: LFSE_CANONICAL_LINKS.temsco,
      },
      {
        name: "Coastal Helicopters",
        officialUrl: "https://coastalhelicopters.com/",
        lfseUrl: LFSE_CANONICAL_LINKS.coastal,
      },
    ],
    experience:
      "Scenic alpine helicopter flight over granite ridgelines followed by a guided walking exploration on Mendenhall or Herbert Glacier ice.",
    backupReason:
      "Most accessible helicopter glacier landing tier when seasonal snow-camp dog sledding departures fill up.",
    highlight: false,
    actionUrl: "/helicopter",
  },
  {
    category: "Glacier Dog Sledding",
    rate: "$759 – $789 base (as of Nov 18, 2026)",
    rateSubnote:
      "May–August seasonal · TEMSCO $759 · Coastal $769 ($919/$1,538 tiers) · NorthStar $789 (+$250 at 250+ lbs) · + CBJ tax & fees",
    duration: "2h 45m – 3h 15m total",
    demand: "Easy",
    operators: [
      {
        name: "TEMSCO Helicopters",
        officialUrl: "https://temscoair.com/",
        lfseUrl: LFSE_CANONICAL_LINKS.temsco,
      },
      {
        name: "Coastal Helicopters",
        officialUrl: "https://coastalhelicopters.com/",
        lfseUrl: LFSE_CANONICAL_LINKS.coastal,
      },
      {
        name: "NorthStar Trekking",
        officialUrl: "https://northstartrekking.com/",
        lfseUrl: LFSE_CANONICAL_LINKS.northstar,
      },
    ],
    experience:
      "Fly to upper-elevation summer snow camps (typically May–August) to meet mushers and ride behind an Alaskan husky team across snowpack.",
    backupReason:
      "Highest-demand seasonal flight. Check Skagway TEMSCO Glacier Dog Sledding ($649 base, 2h, as of Nov 18, 2026) if Juneau is sold out.",
    highlight: true,
    actionUrl: "/best-time-for-glacier-dog-sledding-juneau",
  },
  {
    category: "Ice Walkabout & Technical Trek",
    rate: "$539 – $599 base (as of Nov 18, 2026)",
    rateSubnote:
      "NorthStar $539 Walkabout (ages 8+) / $599 Trek (ages 12+) · +$250 at 250+ lbs clothed · + CBJ tax & fees",
    duration: "3h 15m – 4h 15m total",
    demand: "Strenuous",
    operators: [
      {
        name: "NorthStar Trekking",
        officialUrl: "https://northstartrekking.com/",
        lfseUrl: LFSE_CANONICAL_LINKS.northstar,
      },
    ],
    experience:
      "Extended 1 to 2 hours on glacier ice equipped with mountaineering boots, crampons, helmets, and technical glacier guides.",
    backupReason:
      "Best for active travelers wanting longer time on ice; small-group departures occasionally reopen seats when individual travelers reschedule.",
    highlight: false,
    actionUrl: "/temsco-vs-northstar-juneau",
  },
  {
    category: "Fixed-Wing Floatplane Flightseeing",
    rate: UNVERIFIED_PARTNER_PRICE_LABEL,
    rateSubnote: "Check current operator price directly for Taku Glacier floatplane departures",
    duration: "1h 15m – 3h 15m",
    demand: "None (Airtime)",
    operators: [
      {
        name: "Wings Airways (Floatplane)",
        officialUrl: "https://wingsairways.com/",
        lfseUrl: LFSE_CANONICAL_LINKS.wings,
      },
    ],
    experience:
      "Downtown Juneau harbor floatplane sightseeing over Five Glaciers along the Taku River corridor without an alpine ice landing.",
    backupReason:
      "Different river-corridor route profile when upper-icefield helicopter landing zones face localized cloud ceilings.",
    highlight: false,
    actionUrl: "/helicopter",
  },
];

export const excursionComparisonSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Juneau Icefield Flightseeing Categories (Independent Guide Comparison)",
  description: `Independent educational comparison of Juneau flightseeing categories and licensed Alaska operators, verified ${VERIFIED_TARIFF_DATE_LONG} by Juneau Flight Deck.`,
  itemListElement: EXCURSION_SPECS_DATA.map((item, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: item.category,
    description: `${item.experience} Rate note: ${item.rate} (${item.rateSubnote}).`,
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
          Flight Category Matrix · Verified {VERIFIED_TARIFF_DATE_LONG}
        </span>
        <h3 style={{ margin: 0, fontSize: "clamp(1.2rem, 3vw, 1.55rem)", fontWeight: 900, color: "#fff" }}>
          Juneau Flight Configurations &amp; Licensed Operator Profiles
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: "0.9rem", color: "var(--muted)", maxWidth: 720, lineHeight: 1.5 }}>
          Compare verified direct operator base tariffs (as of {VERIFIED_TARIFF_DATE_LONG}), total
          door-to-door shuttle durations, physical exertion levels, and licensed Alaska operators.
        </p>
      </div>

      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
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
              <th style={{ padding: "12px 14px" }}>Verified Direct Rate</th>
              <th style={{ padding: "12px 14px" }}>Total Duration</th>
              <th style={{ padding: "12px 14px" }}>Exertion</th>
              <th style={{ padding: "12px 14px" }}>Licensed Operators</th>
              <th style={{ padding: "12px 14px" }}>Strategy &amp; Backup Logic</th>
            </tr>
          </thead>
          <tbody>
            {EXCURSION_SPECS_DATA.map((spec) => (
              <tr
                key={spec.category}
                style={{
                  borderBottom: "1px solid rgba(151, 211, 255, 0.1)",
                  background: spec.highlight ? "rgba(99, 102, 241, 0.08)" : "transparent",
                }}
              >
                <td style={{ padding: "14px", fontWeight: 800, color: "#fff", verticalAlign: "top" }}>
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
                      Seasonal Snowpack
                    </span>
                  )}
                </td>

                <td style={{ padding: "14px", verticalAlign: "top", minWidth: 190 }}>
                  <div style={{ fontFamily: "monospace", fontWeight: 800, color: "#34d399" }}>
                    {spec.rate}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>
                    {spec.rateSubnote}
                  </div>
                </td>

                <td style={{ padding: "14px", color: "var(--text)", verticalAlign: "top", whiteSpace: "nowrap" }}>
                  <div>{spec.duration}</div>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Door-to-door w/ shuttle</span>
                </td>

                <td style={{ padding: "14px", verticalAlign: "top" }}>
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

                <td style={{ padding: "14px", verticalAlign: "top" }}>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 14,
                      listStyle: "circle",
                      color: "var(--muted)",
                      fontSize: "0.78rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {spec.operators.map((op) => (
                      <li key={op.name} style={{ whiteSpace: "nowrap" }}>
                        {op.lfseUrl ? (
                          <a
                            href={op.lfseUrl}
                            style={{ color: "#9ed9ff", textDecoration: "underline" }}
                          >
                            {op.name} ↗
                          </a>
                        ) : (
                          op.name
                        )}
                      </li>
                    ))}
                  </ul>
                </td>

                <td style={{ padding: "14px", minWidth: 220, lineHeight: 1.5, verticalAlign: "top" }}>
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

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 20,
          paddingTop: 14,
          borderTop: "1px solid var(--line)",
        }}
      >
        <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
          Juneau Flight Deck is an independent planning &amp; concierge guide—all flights are
          operated by licensed Alaska carriers.
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
          <span>Request Concierge Timing Check ↓</span>
        </Link>
      </div>
    </div>
  );
}
