"use client";

import React from "react";
import {
  LFSE_CANONICAL_LINKS,
  UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL,
  VERIFIED_TARIFF_DATE_LONG,
} from "@/lib/verifiedOperatorPricing";

export interface DirectTariffComparisonRow {
  tourName: string;
  directBaseDisplay: string;
  qualifications: string;
  cruisePortalDisplay: string;
  logisticsNote: string;
  lfseHref: string;
  lfseLabel: string;
}

export default function ExcursionRateComparison() {
  const rows: DirectTariffComparisonRow[] = [
    {
      tourName: "Mendenhall Glacier & Guided Walk (2h 15m)",
      directBaseDisplay: "$449 / person (as of Nov 18, 2026)",
      qualifications: "TEMSCO · ages 2+ · +$150 at 250+ lbs clothed · + CBJ sales tax & fees",
      cruisePortalDisplay: UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL,
      logisticsNote:
        "100% direct refund 48h+ prior; 100% weather cancellation refund. Independent public seats remain separate from ship excursion blocks.",
      lfseHref: LFSE_CANONICAL_LINKS.temsco,
      lfseLabel: "TEMSCO profile ↗",
    },
    {
      tourName: "Icefield Excursion / Herbert Glacier Landing (~2h 35m)",
      directBaseDisplay: "$459 Standard (as of Nov 18, 2026)",
      qualifications:
        "Coastal · 1–259 lbs ($609 at 260–299 lbs; $918 at 300+ lbs, 2 seats) · + CBJ sales tax & fees",
      cruisePortalDisplay: UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL,
      logisticsNote:
        "7+ days full refund direct (24h on Viator 6251SHOREXICEWALK); 100% weather refund.",
      lfseHref: LFSE_CANONICAL_LINKS.coastal,
      lfseLabel: "Coastal profile ↗",
    },
    {
      tourName: "Helicopter Glacier Walkabout (3h 15m) & Trek (4h 15m)",
      directBaseDisplay: "$539 Walkabout / $599 Trek (as of Nov 18, 2026)",
      qualifications:
        "NorthStar · ages 8+ (Walkabout) / 12+ (Trek) · +$250 at 250+ lbs clothed · + CBJ sales tax & fees",
      cruisePortalDisplay: UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL,
      logisticsNote:
        "Extended guided ice time with crampons & gear. Direct cancel >24h refunds minus 10% admin fee (<24h non-refundable).",
      lfseHref: LFSE_CANONICAL_LINKS.northstar,
      lfseLabel: "NorthStar profile ↗",
    },
    {
      tourName: "Seasonal Glacier Dog Sledding (2h 45m – 3h 15m, May–Aug)",
      directBaseDisplay: "$759 TEMSCO · $769 Coastal · $789 NorthStar (as of Nov 18, 2026)",
      qualifications:
        "May–August snowpack window · +$150 TEMSCO (250+ lbs), $919/$1,538 Coastal tiers, +$250 NorthStar (250+ lbs) · + CBJ sales tax & fees",
      cruisePortalDisplay: UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL,
      logisticsNote:
        "Highest-demand snow camp flights; check Skagway TEMSCO ($649 base, as of Nov 18, 2026) if Juneau camps are full.",
      lfseHref: LFSE_CANONICAL_LINKS.juneauHelicopterCategory,
      lfseLabel: "Juneau heli directory ↗",
    },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(8, 23, 38, 0.95) 0%, rgba(4, 14, 24, 0.98) 100%)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        padding: "24px 22px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
        color: "var(--text)",
        maxWidth: 1000,
        margin: "24px auto",
      }}
    >
      <div
        style={{
          borderBottom: "1px solid var(--line)",
          paddingBottom: 16,
          marginBottom: 20,
        }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "3px 10px",
            borderRadius: 6,
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            color: "#34d399",
            display: "inline-block",
            marginBottom: 8,
          }}
        >
          Verified Direct Tariffs (as of {VERIFIED_TARIFF_DATE_LONG})
        </span>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: "clamp(1.2rem, 3vw, 1.55rem)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.01em",
          }}
        >
          Official Operator Base Rates vs. Cruise Sailing Portals
        </h3>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", maxWidth: 740 }}>
          Direct operator tariffs below were verified from official operator pages on{" "}
          {VERIFIED_TARIFF_DATE_LONG}. Because cruise lines price excursions dynamically per sailing
          inside passenger login portals, compare your portal&apos;s exact checkout quote against
          these primary operator rates.
        </p>
      </div>

      <div
        style={{
          overflowX: "auto",
          maxWidth: "100%",
          border: "1px solid var(--line)",
          borderRadius: 12,
          background: "rgba(3, 14, 25, 0.6)",
        }}
      >
        <table
          style={{
            width: "100%",
            textAlign: "left",
            borderCollapse: "collapse",
            minWidth: 640,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--line)",
                background: "rgba(6, 20, 35, 0.8)",
                fontSize: "0.72rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#94a3b8",
              }}
            >
              <th style={{ padding: "12px 16px", width: "26%" }}>Flight Excursion</th>
              <th style={{ padding: "12px 14px", width: "24%" }}>Verified Direct Base Rate</th>
              <th style={{ padding: "12px 14px", width: "22%" }}>Cruise-Line Portal</th>
              <th style={{ padding: "12px 16px", width: "28%" }}>Terms &amp; Operator Profile</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => (
              <tr
                key={item.tourName}
                style={{
                  borderBottom:
                    idx !== rows.length - 1 ? "1px solid rgba(158, 217, 255, 0.08)" : "none",
                }}
              >
                <td
                  style={{
                    padding: "14px 16px",
                    fontWeight: 700,
                    color: "#fff",
                    fontSize: "0.86rem",
                    verticalAlign: "top",
                  }}
                >
                  {item.tourName}
                </td>
                <td style={{ padding: "14px 14px", verticalAlign: "top" }}>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      color: "#93c5fd",
                      fontSize: "0.88rem",
                    }}
                  >
                    {item.directBaseDisplay}
                  </div>
                  <div
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--muted)",
                      marginTop: 4,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.qualifications}
                  </div>
                </td>
                <td
                  style={{
                    padding: "14px 14px",
                    fontSize: "0.8rem",
                    color: "#fcd34d",
                    fontWeight: 700,
                    verticalAlign: "top",
                  }}
                >
                  {item.cruisePortalDisplay}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    fontSize: "0.78rem",
                    color: "var(--muted)",
                    lineHeight: 1.45,
                    verticalAlign: "top",
                  }}
                >
                  <div>{item.logisticsNote}</div>
                  <a
                    href={item.lfseHref}
                    style={{
                      display: "inline-block",
                      marginTop: 6,
                      color: "#9ed9ff",
                      fontWeight: 700,
                      textDecoration: "underline",
                    }}
                  >
                    {item.lfseLabel}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: "14px 18px",
          background: "rgba(4, 18, 30, 0.8)",
          border: "1px solid rgba(158, 217, 255, 0.15)",
          borderRadius: 10,
          fontSize: "0.8rem",
          lineHeight: 1.55,
          color: "var(--muted)",
        }}
      >
        <strong
          style={{
            color: "#fff",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontSize: "0.72rem",
            display: "block",
            marginBottom: 4,
          }}
        >
          Why Ship Excursion Portals &amp; Direct Manifests Differ
        </strong>
        Cruise lines contract fixed blocks of seats from local FAA Part 135 operators in advance.
        When your ship&apos;s shore-excursion portal shows{" "}
        <strong style={{ color: "#93c5fd" }}>&ldquo;Sold Out,&rdquo;</strong> it reflects only that
        ship&apos;s contracted block—independent direct seats may still be open on the operator&apos;s
        own manifest.
      </div>
    </div>
  );
}
