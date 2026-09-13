"use client";

import React from "react";
import { NormalizedAffiliateExcursion } from "@/lib/affiliate/types";
import { buildAffiliateUrl } from "@/lib/affiliate/links";
import { trackAffiliateEvent } from "@/lib/analytics";
import { TrustDisclosure } from "./TrustDisclosure";

interface ExcursionCardProps {
  excursion: NormalizedAffiliateExcursion;
  showCalculatedFit?: {
    status: "strong_fit" | "tight_fit" | "does_not_fit" | "unknown";
    label: string;
    bufferMinutes: number;
  };
}

export function ExcursionCard({ excursion, showCalculatedFit }: ExcursionCardProps) {
  const affiliateUrl = buildAffiliateUrl(
    excursion.source,
    excursion.officialUrl,
    excursion.attributionCampaign,
    excursion.title,
    excursion.isExactProduct
  );

  const handleBookingClick = () => {
    trackAffiliateEvent({
      event: "affiliate_link_click",
      port: excursion.portSlug,
      category: excursion.activitySlug,
      provider: excursion.provider,
      productId: excursion.productId || undefined,
      tourTitle: excursion.title,
      destinationUrl: affiliateUrl,
      placement: "card",
      isExactProduct: excursion.isExactProduct,
      campaign: excursion.attributionCampaign,
      status: excursion.availabilityStatus,
    });
  };

  const weatherColor =
    excursion.weatherSensitivity === "High"
      ? "#9e2323"
      : excursion.weatherSensitivity === "Moderate"
      ? "#b25e00"
      : "#156d3a";

  const fitBadge = showCalculatedFit && showCalculatedFit.status !== "unknown" && (
    <span
      className="badge"
      style={{
        background:
          showCalculatedFit.status === "strong_fit"
            ? "#e6f4ea"
            : showCalculatedFit.status === "tight_fit"
            ? "#fef7e0"
            : "#fce8e6",
        color:
          showCalculatedFit.status === "strong_fit"
            ? "#137333"
            : showCalculatedFit.status === "tight_fit"
            ? "#b06000"
            : "#c5221f",
        border: "1px solid currentColor",
        fontWeight: 700,
        marginBottom: 8,
      }}
    >
      Ship Window: {showCalculatedFit.label} ({showCalculatedFit.bufferMinutes} min buffer)
    </span>
  );

  const partnerName = excursion.source === "viator" ? "Viator" : "GetYourGuide";
  const ctaLabel = excursion.isExactProduct && excursion.productId
    ? `Check Availability on ${partnerName} →`
    : `Search live options on ${partnerName} →`;

  return (
    <article
      className="card"
      style={{
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        border: "1px solid var(--line)",
      }}
    >
      {excursion.permittedImages && excursion.permittedImages.length > 0 && (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "170px",
            overflow: "hidden",
            borderRadius: "10px",
            marginBottom: "14px",
            background: "#eef5f6",
            border: "1px solid var(--line)",
          }}
        >
          <img
            src={excursion.permittedImages[0].url}
            alt={excursion.permittedImages[0].caption || excursion.title}
            width={600}
            height={400}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          <span
            style={{
              position: "absolute",
              bottom: 6,
              left: 6,
              background: "rgba(14, 26, 31, 0.75)",
              backdropFilter: "blur(4px)",
              color: "#ffffff",
              fontSize: "10.5px",
              padding: "2px 7px",
              borderRadius: "4px",
              lineHeight: 1.3,
            }}
          >
            {excursion.permittedImages[0].caption}
          </span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <span className="badge badge-safety">
          {excursion.transferBufferMinutes}m transit · Last Frontier Planning Standard
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "2px 8px",
            borderRadius: "4px",
            background: excursion.source === "viator" ? "#ebf3fc" : "#fef0e6",
            color: excursion.source === "viator" ? "#1967d2" : "#d9531e",
          }}
        >
          {partnerName} Partner Link
        </span>
      </div>

      {fitBadge}

      <h3 style={{ marginTop: 10, fontSize: "20px" }}>{excursion.title}</h3>
      <p style={{ fontSize: "13px", color: "var(--muted)", margin: "2px 0 12px" }}>
        Curated Operator: <strong>{excursion.provider}</strong>
      </p>

      <p style={{ fontSize: "14px", color: "var(--ink)", lineHeight: 1.5, flexGrow: 1 }}>
        {excursion.description}
      </p>

      {/* Pricing & Key Metrics Bar */}
      <div
        style={{
          background: "#f4f8f8",
          padding: "12px",
          borderRadius: "6px",
          margin: "14px 0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 10,
        }}
      >
        <div>
          <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Typical Price</span>
          <strong style={{ fontSize: "20px", color: "var(--forest)" }}>${excursion.priceFrom}</strong>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}> / person</span>
          <span style={{ display: "block", fontSize: "10px", color: "#607078", marginTop: "2px" }}>Approximate estimate</span>
        </div>
        <div>
          <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Duration</span>
          <strong style={{ fontSize: "15px", color: "var(--ink)" }}>{excursion.duration}</strong>
        </div>
        <div>
          <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Weather Risk</span>
          <strong style={{ fontSize: "13px", color: weatherColor }}>{excursion.weatherSensitivity}</strong>
        </div>
      </div>

      {/* Logistics & Departures */}
      <div style={{ fontSize: "13px", color: "var(--ink)", marginBottom: 14 }}>
        <div style={{ margin: "4px 0" }}>
          <strong>Meeting Pier:</strong> {excursion.meetingPoint}
        </div>
        <div style={{ margin: "4px 0" }}>
          <strong>Typical Departures:</strong> {excursion.datesAndTimeSlots.join(", ")} <span style={{ fontSize: "11px", color: "var(--muted)" }}>(Researched schedule)</span>
        </div>
        <div style={{ margin: "4px 0" }}>
          <strong>Cancellation:</strong> {excursion.cancellationPolicy}
        </div>
        <div style={{ margin: "4px 0" }}>
          <strong>Accessibility:</strong> {excursion.accessibility?.mobilityNotes || (excursion.accessibility?.wheelchairAccessible ? "Wheelchair Accessible" : "Moderate Walking Required")}
        </div>
      </div>

      {/* Badges / Chips */}
      <div className="chips" style={{ marginBottom: 16 }}>
        <span className="chip">{excursion.privateOrShared === "private" ? "Private Charter" : "Small / Shared Group"}</span>
        <span className="chip">{excursion.languages.join(", ")}</span>
        {excursion.mobileVoucher && <span className="chip">Mobile Ticket</span>}
        <span className="chip" style={{ fontSize: "11px", color: "#607078" }}>
          Editorial Review: Sep 2026
        </span>
      </div>

      {/* Outbound Booking CTA */}
      <a
        className="button"
        href={affiliateUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={handleBookingClick}
        style={{ textAlign: "center", textDecoration: "none" }}
      >
        {ctaLabel}
      </a>

      <TrustDisclosure compact />
    </article>
  );
}
