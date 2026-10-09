"use client";

import React from "react";
import Link from "next/link";

export interface CrossPortBackupProps {
  currentPort?: "Juneau" | "Skagway";
  desiredTourType?: "landing" | "dogsled" | "trek" | "scenic";
  cruiseShipName?: string;
}

export default function CrossPortBackup({
  currentPort = "Juneau",
  desiredTourType = "dogsled",
  cruiseShipName,
}: CrossPortBackupProps) {
  const getBackupRecommendation = () => {
    if (currentPort === "Juneau") {
      switch (desiredTourType) {
        case "dogsled":
          return {
            targetPort: "Skagway",
            glacierName: "Denver Glacier",
            tourName: "Helicopter Glacier Dog Sledding via Skagway",
            description:
              "TEMSCO operates an identical high-altitude mushing camp on the Denver Glacier snowfields out of Skagway airport. Fleet volumes match Juneau, and availability is often easier to secure.",
            actionUrl: "/skagway/helicopter",
            badge: "Identical Experience",
          };
        case "trek":
        case "landing":
          return {
            targetPort: "Skagway",
            glacierName: "Meade Glacier",
            tourName: "Skagway Helicopter Icefield Landing & Walk",
            description:
              "Fly over rugged Skagway gorges to touch down on the ancient ice cascades of Meade Glacier. Includes provided overboots and extended glacier field walking slots.",
            actionUrl: "/skagway/helicopter",
            badge: "Top Alternative",
          };
        case "scenic":
        default:
          return {
            targetPort: "Ketchikan",
            glacierName: "Misty Fjords",
            tourName: "Misty Fjords National Monument Seaplane Exploration",
            description:
              "If glacier flights are full, swap to the ultimate Inside Passage wilderness flight. Land on pristine alpine fjords surrounded by 3,000-foot sheer granite sea walls.",
            actionUrl: "/helicopter-waitlist",
            badge: "Top Scenic Backup",
          };
      }
    }
    return null;
  };

  const recommendation = getBackupRecommendation();
  if (!recommendation) return null;

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
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, paddingBottom: 14, borderBottom: "1px solid var(--line)", marginBottom: 14 }}>
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
            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>
              Sold Out in {currentPort}?
            </h4>
            <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--muted)" }}>
              Smart Inside Passage Itinerary Backup Routing
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

      {/* Description */}
      <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--muted)", margin: "0 0 16px" }}>
        {cruiseShipName
          ? `Since your slots on ${cruiseShipName} are currently full in Juneau, don't miss out on ice entirely.`
          : "Don't let a sold-out Juneau flight scrap your glacier plans."}{" "}
        Most Alaska cruise itineraries call at <strong style={{ color: "#fff" }}>{recommendation.targetPort}</strong> within 24–48 hours of departing Juneau.
      </p>

      {/* Solution Block */}
      <div
        style={{
          background: "rgba(4, 18, 29, 0.8)",
          border: "1px solid rgba(158, 217, 255, 0.15)",
          borderRadius: 12,
          padding: "16px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Next Port Alternative: {recommendation.targetPort}
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontFamily: "monospace" }}>
            📍 {recommendation.glacierName}
          </span>
        </div>
        <h5 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 800, color: "#fff" }}>
          {recommendation.tourName}
        </h5>
        <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.55, color: "var(--muted)" }}>
          {recommendation.description}
        </p>
      </div>

      {/* Action Footer */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 6 }}>
        <div>
          <span style={{ display: "block", fontSize: "0.72rem", color: "var(--muted)" }}>Cancellation Guarantee</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#34d399" }}>100% Weather Refund Protections</span>
        </div>

        <Link
          href={recommendation.actionUrl}
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
            color: "#fff",
            textDecoration: "none",
            padding: "10px 18px",
            borderRadius: 10,
            fontSize: "0.88rem",
            fontWeight: 800,
            letterSpacing: "0.04em",
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
          }}
        >
          Check {recommendation.targetPort} Glacier Openings &rarr;
        </Link>
      </div>
    </div>
  );
}
