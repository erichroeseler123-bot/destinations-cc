"use client";

import React from "react";
import Link from "next/link";
import {
  LFSE_CANONICAL_LINKS,
  VERIFIED_TARIFF_DATE_LONG,
} from "@/lib/verifiedOperatorPricing";

export interface CrossPortBackupProps {
  currentPort?: "Juneau" | "Skagway";
  desiredTourType?: "landing" | "dogsled" | "trek" | "scenic";
  cruiseShipName?: string;
}

interface BackupRecommendation {
  targetPort: "Skagway" | "Ketchikan";
  glacierName: string;
  tourName: string;
  description: string;
  tariffSummary: string;
  actionUrl: string;
  actionLabel: string;
  isExternal: boolean;
  operatorProfileUrl: string;
  operatorProfileLabel: string;
  portDirectoryUrl: string;
  portDirectoryLabel: string;
  badge: string;
}

export default function CrossPortBackup({
  currentPort = "Juneau",
  desiredTourType = "dogsled",
  cruiseShipName,
}: CrossPortBackupProps) {
  const getBackupRecommendation = (): BackupRecommendation | null => {
    if (currentPort === "Juneau") {
      switch (desiredTourType) {
        case "dogsled":
          return {
            targetPort: "Skagway",
            glacierName: "Denver Glacier",
            tourName: "TEMSCO Glacier Dog Sledding via Skagway (2h total)",
            description:
              "TEMSCO Helicopters operates a summer snow-camp mushing base out of the waterfront Skagway heliport, walkable from Skagway cruise berths.",
            tariffSummary:
              "$649 / person base (ages 2+, May–August seasonal, as of November 18, 2026; +$150 at 250+ lbs clothed; +$3 Skagway fee & tax).",
            actionUrl: "/skagway/helicopter",
            actionLabel: "Check Skagway Helicopter Guide →",
            isExternal: false,
            operatorProfileUrl: LFSE_CANONICAL_LINKS.temsco,
            operatorProfileLabel: "TEMSCO Helicopters",
            portDirectoryUrl: LFSE_CANONICAL_LINKS.skagwayPort,
            portDirectoryLabel: "Skagway Port Guide",
            badge: "Next-Port Snow Camp",
          };
        case "trek":
        case "landing":
          return {
            targetPort: "Skagway",
            glacierName: "Chilkoot / Meade Glacier Icefield",
            tourName: "TEMSCO Glacier Discovery by Helicopter via Skagway (2h total)",
            description:
              "Fly from Skagway's waterfront heliport over glacially carved valleys for a guided glacier walk with traction overboots.",
            tariffSummary:
              "$479 / person base (ages 2+, as of November 18, 2026; +$150 at 250+ lbs clothed; + Skagway tax & fees).",
            actionUrl: "/skagway/helicopter",
            actionLabel: "Check Skagway Helicopter Guide →",
            isExternal: false,
            operatorProfileUrl: LFSE_CANONICAL_LINKS.temsco,
            operatorProfileLabel: "TEMSCO Helicopters",
            portDirectoryUrl: LFSE_CANONICAL_LINKS.skagwayPort,
            portDirectoryLabel: "Skagway Port Guide",
            badge: "Top Skagway Alternative",
          };
        case "scenic":
        default:
          return {
            targetPort: "Ketchikan",
            glacierName: "Misty Fjords National Monument",
            tourName: "Ketchikan Misty Fjords Seaplane Exploration",
            description:
              "If Juneau glacier helicopter flights are sold out or socked in, consider a floatplane flight over Misty Fjords' 3,000-foot granite cliffs and alpine lakes during your Ketchikan port call.",
            tariffSummary:
              "Check current operator price · Operated out of Ketchikan waterfront floatplane docks.",
            actionUrl: LFSE_CANONICAL_LINKS.ketchikanMistyFjords,
            actionLabel: "Explore Ketchikan Misty Fjords Flights ↗",
            isExternal: true,
            operatorProfileUrl: LFSE_CANONICAL_LINKS.taquanAir,
            operatorProfileLabel: "Taquan Air",
            portDirectoryUrl: LFSE_CANONICAL_LINKS.ketchikanMistyFjords,
            portDirectoryLabel: "Ketchikan Misty Fjords Guide",
            badge: "Top Scenic Backup",
          };
      }
    }
    return null;
  };

  const recommendation = getBackupRecommendation();
  if (!recommendation) return null;

  const ctaStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
    color: "#fff",
    textDecoration: "none",
    padding: "10px 18px",
    borderRadius: 10,
    fontSize: "0.88rem",
    fontWeight: 800,
    letterSpacing: "0.02em",
    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
    display: "inline-flex",
    alignItems: "center",
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(13, 39, 58, 0.95) 0%, rgba(5, 20, 32, 0.98) 100%)",
        border: "1px solid rgba(99, 102, 241, 0.35)",
        borderRadius: "var(--radius-lg)",
        padding: "24px 22px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
        color: "var(--text)",
        maxWidth: 900,
        margin: "24px auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          paddingBottom: 14,
          borderBottom: "1px solid var(--line)",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              padding: "8px 10px",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: 10,
              fontSize: "1.1rem",
            }}
          >
            🧭
          </div>
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: "0.95rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#fff",
              }}
            >
              Sold Out in {currentPort}?
            </h4>
            <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--muted)" }}>
              Inside Passage Multi-Port Flight Backup ({VERIFIED_TARIFF_DATE_LONG})
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "4px 10px",
            borderRadius: 6,
            background: "rgba(99, 102, 241, 0.2)",
            border: "1px solid rgba(99, 102, 241, 0.4)",
            color: "#a5b4fc",
          }}
        >
          {recommendation.badge}
        </span>
      </div>

      <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--muted)", margin: "0 0 16px" }}>
        {cruiseShipName
          ? `If helicopter departures matching ${cruiseShipName} are full in Juneau, look at your adjacent Inside Passage port call.`
          : "Don't let a sold-out Juneau departure end your flightseeing plans."}{" "}
        Most Alaska itineraries call at{" "}
        <strong style={{ color: "#fff" }}>{recommendation.targetPort}</strong> within 24–48 hours of
        Juneau.
      </p>

      <div
        style={{
          background: "rgba(4, 18, 29, 0.8)",
          border: "1px solid rgba(158, 217, 255, 0.15)",
          borderRadius: 12,
          padding: "16px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              color: "#818cf8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Next Port Alternative: {recommendation.targetPort}
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontFamily: "monospace" }}>
            📍 {recommendation.glacierName}
          </span>
        </div>
        <h5 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 800, color: "#fff" }}>
          {recommendation.tourName}
        </h5>
        <p style={{ margin: "0 0 8px", fontSize: "0.85rem", lineHeight: 1.55, color: "var(--muted)" }}>
          {recommendation.description}
        </p>
        <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "#93c5fd" }}>
          {recommendation.tariffSummary}
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
          Canonical operator &amp; port reference:{" "}
          <a
            href={recommendation.operatorProfileUrl}
            style={{ color: "#9ed9ff", fontWeight: 700, textDecoration: "underline" }}
          >
            {recommendation.operatorProfileLabel} ↗
          </a>{" "}
          ·{" "}
          <a
            href={recommendation.portDirectoryUrl}
            style={{ color: "#9ed9ff", fontWeight: 700, textDecoration: "underline" }}
          >
            {recommendation.portDirectoryLabel} ↗
          </a>
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingTop: 6,
        }}
      >
        <div>
          <span style={{ display: "block", fontSize: "0.72rem", color: "var(--muted)" }}>
            Operator Weather Policy
          </span>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#34d399" }}>
            100% Refund if Canceled by Operator for Weather
          </span>
        </div>

        {recommendation.isExternal ? (
          <a href={recommendation.actionUrl} style={ctaStyle}>
            {recommendation.actionLabel}
          </a>
        ) : (
          <Link href={recommendation.actionUrl} style={ctaStyle}>
            {recommendation.actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
