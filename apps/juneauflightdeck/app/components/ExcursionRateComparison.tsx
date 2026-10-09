"use client";

import React from "react";

export interface MarkupProfile {
  tourName: string;
  directRate: number;
  cruiseRate: number;
  operatorNotes: string;
}

export default function ExcursionRateComparison() {
  const markupData: MarkupProfile[] = [
    {
      tourName: "Signature Glacier Landing Flight (Walkabout)",
      directRate: 409,
      cruiseRate: 539,
      operatorNotes: "TEMSCO / Coastal. Cruise lines markup this exact 20-minute glacier walk configuration by over 30% per passenger seat.",
    },
    {
      tourName: "High-Altitude Glacier Dog Sledding Tour",
      directRate: 659,
      cruiseRate: 849,
      operatorNotes: "TEMSCO / Coastal. The highest in-demand tour. Families of four save up to $760 total by bypassing ship block allocations.",
    },
    {
      tourName: "Level 1 Glacier Ice Trek (1-2 Hours on Ice)",
      directRate: 499,
      cruiseRate: 649,
      operatorNotes: "NorthStar Trekking. Small-group mountaineering paths. Independent lines access raw public manifests that skip cruise holds entirely.",
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
      {/* Header */}
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
          Rate Transparency Audit
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
          Excursion Desk Markup &amp; Savings Breakdown
        </h3>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", maxWidth: 700 }}>
          Compare independent direct baseline operator rates against typical cruise line shore excursion desk markups for identical helicopter flights.
        </p>
      </div>

      {/* Comparison Table */}
      <div
        style={{
          overflowX: "auto",
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
            minWidth: 620,
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
              <th style={{ padding: "12px 16px", width: "32%" }}>Flight Excursion</th>
              <th style={{ padding: "12px 14px", width: "16%" }}>Independent Direct</th>
              <th style={{ padding: "12px 14px", width: "16%" }}>Cruise Line Desk</th>
              <th style={{ padding: "12px 14px", width: "16%" }}>Net Savings</th>
              <th style={{ padding: "12px 16px", width: "22%" }}>Logistics Note</th>
            </tr>
          </thead>
          <tbody>
            {markupData.map((item, idx) => {
              const savings = item.cruiseRate - item.directRate;
              const savingsPct = Math.round((savings / item.directRate) * 100);

              return (
                <tr
                  key={idx}
                  style={{
                    borderBottom: idx !== markupData.length - 1 ? "1px solid rgba(158, 217, 255, 0.08)" : "none",
                  }}
                >
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>
                    {item.tourName}
                  </td>
                  <td style={{ padding: "14px 14px", fontFamily: "monospace", fontWeight: 700, color: "#93c5fd", fontSize: "0.92rem" }}>
                    ${item.directRate}
                  </td>
                  <td style={{ padding: "14px 14px", fontFamily: "monospace", color: "#f87171", fontSize: "0.92rem" }}>
                    <span style={{ textDecoration: "line-through", opacity: 0.8 }}>${item.cruiseRate}</span>
                  </td>
                  <td style={{ padding: "14px 14px", fontFamily: "monospace" }}>
                    <strong style={{ color: "#34d399", fontSize: "1rem", display: "block" }}>
                      +${savings}
                    </strong>
                    <span style={{ fontSize: "0.7rem", color: "#6ee7b7", fontWeight: 700 }}>
                      Save {savingsPct}%
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.45 }}>
                    {item.operatorNotes}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Informational Sub-Notice */}
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
        <strong style={{ color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.72rem", display: "block", marginBottom: 4 }}>
          Why is there a price variance?
        </strong>
        Cruise lines contract blocks of seats from local operators months in advance and add overhead markups.
        When your ship shore excursion desk announces that an excursion is <strong style={{ color: "#93c5fd" }}>&ldquo;Sold Out,&rdquo;</strong> it typically means only their contracted allotment has been exhausted.
        Independent direct seats often remain available through local manifests at standard retail pricing.
      </div>
    </div>
  );
}
