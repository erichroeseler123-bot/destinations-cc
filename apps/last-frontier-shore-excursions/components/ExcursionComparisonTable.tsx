"use client";

import React from "react";
import { NormalizedAffiliateExcursion } from "@/lib/affiliate/types";
import { buildAffiliateUrl } from "@/lib/affiliate/links";
import { trackAffiliateEvent } from "@/lib/analytics";
import { TrustDisclosure } from "./TrustDisclosure";

interface ExcursionComparisonTableProps {
  excursions: NormalizedAffiliateExcursion[];
}

export function ExcursionComparisonTable({ excursions }: ExcursionComparisonTableProps) {
  if (!excursions || excursions.length === 0) return null;

  return (
    <div style={{ margin: "24px 0" }}>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", background: "white" }}>
          <thead>
            <tr style={{ background: "#f4f8f8", borderBottom: "2px solid var(--line)", textAlign: "left" }}>
              <th style={{ padding: "12px" }}>Excursion / Operator</th>
              <th style={{ padding: "12px" }}>Duration</th>
              <th style={{ padding: "12px" }}>Typical Price</th>
              <th style={{ padding: "12px" }}>Weather Risk</th>
              <th style={{ padding: "12px" }}>Meeting Area</th>
              <th style={{ padding: "12px" }}>Transit Buffer</th>
              <th style={{ padding: "12px" }}>Live Options</th>
            </tr>
          </thead>
          <tbody>
            {excursions.map((ex, idx) => {
              const url = buildAffiliateUrl(
                ex.source,
                ex.officialUrl,
                ex.attributionCampaign,
                ex.title,
                ex.isExactProduct
              );

              const partner = ex.source === "viator" ? "Viator" : "GetYourGuide";
              const ctaText = ex.isExactProduct && ex.productId
                ? `Check on ${partner}`
                : `Search live options →`;

              return (
                <tr key={idx} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px" }}>
                    <strong>{ex.title}</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--muted)" }}>
                      {ex.provider}
                    </span>
                  </td>
                  <td style={{ padding: "12px", whiteSpace: "nowrap" }}>{ex.duration}</td>
                  <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                    <strong style={{ color: "var(--forest)" }}>${ex.priceFrom}</strong>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--muted)" }}>typical</span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color:
                          ex.weatherSensitivity === "High"
                            ? "#9e2323"
                            : ex.weatherSensitivity === "Moderate"
                            ? "#b25e00"
                            : "#156d3a",
                      }}
                    >
                      {ex.weatherSensitivity}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px" }}>{ex.meetingPoint}</td>
                  <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                    {ex.transferBufferMinutes} min buffer
                  </td>
                  <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                    <a
                      href={url}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      className="button secondary"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => {
                        trackAffiliateEvent({
                          event: "affiliate_link_click",
                          port: ex.portSlug,
                          category: ex.activitySlug,
                          provider: ex.provider,
                          productId: ex.productId || undefined,
                          campaign: ex.attributionCampaign,
                          status: ex.availabilityStatus,
                        });
                      }}
                    >
                      {ctaText}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TrustDisclosure compact />
    </div>
  );
}
