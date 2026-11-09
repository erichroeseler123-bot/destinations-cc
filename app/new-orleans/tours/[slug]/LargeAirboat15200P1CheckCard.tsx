"use client";

import React, { useEffect, useMemo, useState } from "react";

export interface LargeAirboatOptionSpec {
  optionCode: "TG9" | "TG2" | "TG6" | "TG7";
  departureTime: string;
  displayTime: string;
  title: string;
  seasonalNote?: string;
}

export const LARGE_AIRBOAT_15200P1_OPTIONS: LargeAirboatOptionSpec[] = [
  {
    optionCode: "TG9",
    departureTime: "09:40",
    displayTime: "9:40 a.m.",
    title: "9:40 AM Large Airboat Swamp Tour (Self-Drive · 9706 Barataria Blvd)",
  },
  {
    optionCode: "TG2",
    departureTime: "12:10",
    displayTime: "12:10 p.m.",
    title: "12:10 PM Large Airboat Swamp Tour (Self-Drive · 9706 Barataria Blvd)",
  },
  {
    optionCode: "TG6",
    departureTime: "14:10",
    displayTime: "2:10 p.m.",
    title: "2:10 PM Large Airboat Swamp Tour (Self-Drive · 9706 Barataria Blvd)",
  },
  {
    optionCode: "TG7",
    departureTime: "16:15",
    displayTime: "4:15 p.m.",
    title: "4:15 PM Large Airboat Swamp Tour (Seasonal — Unavailable in Winter)",
    seasonalNote: "Seasonal afternoon departure (unavailable Nov–Feb; returns TRAVELER_MISMATCH)",
  },
];

export const CANONICAL_VIATOR_15200P1_URL =
  "https://www.viator.com/tours/New-Orleans/Large-Airboat-Swamp-Tour/d675-15200P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0";

export interface LargeAirboat15200P1CheckCardProps {
  siteDomain: string;
  initialDate?: string | null;
  initialPartySize?: number | null;
  initialOptionCode?: string | null;
}

interface LiveCheckState {
  loading: boolean;
  checked: boolean;
  error: string | null;
  status: "available_for_party" | "unavailable_for_party" | "unknown" | "requires_live_check";
  availabilityDisplayLabel: string;
  bookable: boolean | null;
  totalPriceCents: number | null;
  currency: string;
  priceBasis: string | null;
  timeChecked: string | null;
  checkedTimeZone: string;
  note: string;
  providerEndpoint: string | null;
  singleVesselStatus: string;
  singleVesselCapacity: number;
  singleVesselNote: string;
}

export default function LargeAirboat15200P1CheckCard({
  siteDomain,
  initialDate,
  initialPartySize,
  initialOptionCode,
}: LargeAirboat15200P1CheckCardProps) {
  const [date, setDate] = useState<string>(initialDate?.trim() || "2027-01-12");
  const [partySize, setPartySize] = useState<number>(
    initialPartySize && initialPartySize > 0 ? initialPartySize : 8,
  );
  const [optionCode, setOptionCode] = useState<"TG9" | "TG2" | "TG6" | "TG7">(() => {
    const normalized = (initialOptionCode || "").trim().toUpperCase();
    if (normalized === "TG2" || normalized === "TG6" || normalized === "TG7") {
      return normalized;
    }
    return "TG9";
  });

  // Also read query string on mount in case SSR was cached or link supplied ?partySize=8
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const rawParty = sp.get("partySize") || sp.get("party_size");
    if (rawParty) {
      const parsed = Number(rawParty);
      if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 16) {
        setPartySize(Math.round(parsed));
      }
    }
    const rawDate = sp.get("date") || sp.get("port_date");
    if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
      setDate(rawDate.trim());
    }
    const rawOption = (sp.get("option") || sp.get("optionCode") || "").trim().toUpperCase();
    if (rawOption === "TG9" || rawOption === "TG2" || rawOption === "TG6" || rawOption === "TG7") {
      setOptionCode(rawOption);
    }
  }, []);

  const selectedOption = useMemo(
    () =>
      LARGE_AIRBOAT_15200P1_OPTIONS.find((opt) => opt.optionCode === optionCode) ||
      LARGE_AIRBOAT_15200P1_OPTIONS[0],
    [optionCode],
  );

  const [checkState, setCheckState] = useState<LiveCheckState>({
    loading: false,
    checked: false,
    error: null,
    status: "requires_live_check",
    availabilityDisplayLabel: "Check availability at the provider",
    bookable: null,
    totalPriceCents: null,
    currency: "USD",
    priceBasis: null,
    timeChecked: null,
    checkedTimeZone: "America/Chicago",
    note: "Select your date, departure option, and party size to verify live seats with Viator in New Orleans local time (America/Chicago).",
    providerEndpoint: null,
    singleVesselStatus: "requires_separate_operator_verification",
    singleVesselCapacity: 16,
    singleVesselNote:
      "Live Viator availability confirms total seats on the scheduled departure across Louisiana Tour Company's fleet (16-passenger large airboats), not guaranteed single-boat assignment. If your group wants one boat together, verify single-vessel grouping directly with Louisiana Tour Company after booking.",
  });

  // Reset confirmation state whenever product parameters change so we never show stale "Available for N when checked"
  const handleParamChange = (updater: () => void) => {
    updater();
    setCheckState((prev) => ({
      ...prev,
      checked: false,
      error: null,
      status: "requires_live_check",
      availabilityDisplayLabel: "Check availability at the provider",
      bookable: null,
    }));
  };

  async function runLiveAvailabilityCheck(overrideParams?: {
    date?: string;
    optionCode?: "TG9" | "TG2" | "TG6" | "TG7";
    partySize?: number;
  }) {
    const targetDate = overrideParams?.date ?? date;
    const targetOptionCode = overrideParams?.optionCode ?? optionCode;
    const targetPartySize = overrideParams?.partySize ?? partySize;
    const targetOpt =
      LARGE_AIRBOAT_15200P1_OPTIONS.find((o) => o.optionCode === targetOptionCode) ||
      LARGE_AIRBOAT_15200P1_OPTIONS[0];

    setCheckState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const isLocalOrDcc =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.includes("destinationcommandcenter.com"));
      const endpoint = isLocalOrDcc
        ? "/api/v1/cruise/port-day-excursions"
        : "https://www.destinationcommandcenter.com/api/v1/cruise/port-day-excursions";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portSlug: "new-orleans",
          tourId: "dcc:tour:viator:15200P1",
          productCode: "15200P1",
          sailingDate: targetDate,
          selectedOptionCode: targetOpt.optionCode,
          selectedDepartureTime: targetOpt.departureTime,
          partySize: targetPartySize,
        }),
      });

      const data = await response.json();
      const seat = data?.seatAvailability;
      if (!response.ok || !seat) {
        setCheckState((prev) => ({
          ...prev,
          loading: false,
          checked: true,
          status: "unknown",
          availabilityDisplayLabel: "Check availability at the provider",
          bookable: null,
          error: data?.error || "Live provider check did not return a verified result.",
        }));
        return;
      }

      const resolvedDisplayLabel =
        seat.availabilityDisplayLabel ||
        (seat.status === "available_for_party" && seat.bookable === true
          ? `Available for ${targetPartySize} when checked`
          : seat.status === "unavailable_for_party" || seat.bookable === false
            ? `Unavailable for ${targetPartySize} when checked`
            : "Check availability at the provider");

      setCheckState({
        loading: false,
        checked: true,
        error: null,
        status: seat.status,
        availabilityDisplayLabel: resolvedDisplayLabel,
        bookable: typeof seat.bookable === "boolean" ? seat.bookable : null,
        totalPriceCents: typeof seat.totalPriceCents === "number" ? seat.totalPriceCents : null,
        currency: seat.currency || "USD",
        priceBasis: seat.priceBasis || null,
        timeChecked: seat.checkedAt || new Date().toISOString(),
        checkedTimeZone: seat.checkedTimeZone || "America/Chicago",
        note: seat.note || "",
        providerEndpoint: seat.providerEndpoint || "POST /availability/check",
        singleVesselStatus:
          seat.singleVesselVerification?.status || "requires_separate_operator_verification",
        singleVesselCapacity: seat.singleVesselVerification?.vesselCapacityPassengers || 16,
        singleVesselNote:
          seat.singleVesselVerification?.note ||
          `Live Viator availability confirms ${targetPartySize} seats on the scheduled departure across Louisiana Tour Company's fleet (16-passenger large airboats), not guaranteed single-boat assignment. If the group wants one boat, verify single-vessel grouping separately with Louisiana Tour Company.`,
      });
    } catch (err: any) {
      setCheckState((prev) => ({
        ...prev,
        loading: false,
        checked: true,
        status: "unknown",
        availabilityDisplayLabel: "Check availability at the provider",
        bookable: null,
        error: err?.message || "Network error while checking Viator availability.",
      }));
    }
  }

  const trackedViatorCheckoutHref = useMemo(() => {
    const isWto =
      siteDomain === "welcometoneworleanstours.com" ||
      siteDomain === "www.welcometoneworleanstours.com";
    const base = isWto
      ? "https://www.destinationcommandcenter.com/go/commerce/handoff"
      : "/go/commerce/handoff";
    const qs = new URLSearchParams();
    qs.set("site", siteDomain);
    qs.set("provider", "viator");
    qs.set("account", "P00306962");
    qs.set("product", "15200P1");
    qs.set("option", selectedOption.optionCode);
    qs.set("date", date);
    qs.set("partySize", String(partySize));
    qs.set("campaign", `wno-15200p1-${selectedOption.optionCode.toLowerCase()}`);
    qs.set("url", CANONICAL_VIATOR_15200P1_URL);
    return `${base}?${qs.toString()}`;
  }, [siteDomain, selectedOption.optionCode, date, partySize]);

  return (
    <section
      data-testid="wno-large-airboat-15200p1-card"
      aria-label="Verified Large Airboat Option — Louisiana Tour Company Viator 15200P1"
      style={{
        maxWidth: 1120,
        margin: "20px auto",
        padding: "22px 24px",
        borderRadius: 14,
        background: "#111b27",
        border: "1px solid rgba(212, 175, 55, 0.45)",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.74rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#d4af37",
            }}
          >
            Authorized Provider Option · Live Viator Partner API v2
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "4px 0 2px", color: "#ffffff" }}>
            New Orleans Large Airboat Swamp Tour (Viator <code>15200P1</code> · Louisiana Tour Company)
          </h2>
          <div style={{ fontSize: "0.83rem", color: "#cbd5e1" }}>
            16-Passenger Large Airboat · 1h 40m · Self-Drive Meeting Point: 9706 Barataria Blvd, Marrero, LA 70072 · New Orleans Local Time (<code>America/Chicago</code>)
          </div>
        </div>

        <span
          data-testid="wno-15200p1-availability-badge"
          data-availability-status={checkState.status}
          style={{
            display: "inline-block",
            padding: "6px 14px",
            borderRadius: 999,
            fontSize: "0.82rem",
            fontWeight: 800,
            background:
              checkState.status === "available_for_party"
                ? "rgba(16, 185, 129, 0.2)"
                : checkState.status === "unavailable_for_party"
                  ? "rgba(239, 68, 68, 0.2)"
                  : "rgba(245, 158, 11, 0.2)",
            color:
              checkState.status === "available_for_party"
                ? "#6ee7b7"
                : checkState.status === "unavailable_for_party"
                  ? "#fca5a5"
                  : "#fde68a",
            border:
              checkState.status === "available_for_party"
                ? "1px solid rgba(16, 185, 129, 0.45)"
                : checkState.status === "unavailable_for_party"
                  ? "1px solid rgba(239, 68, 68, 0.45)"
                  : "1px solid rgba(245, 158, 11, 0.45)",
          }}
        >
          {checkState.availabilityDisplayLabel}
        </span>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 12,
          padding: 14,
          borderRadius: 10,
          background: "rgba(15, 23, 42, 0.8)",
          border: "1px solid rgba(148, 163, 184, 0.22)",
          marginBottom: 14,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", color: "#cbd5e1" }}>
          <span style={{ fontWeight: 700 }}>Verified Option &amp; Start Time (America/Chicago)</span>
          <select
            data-testid="wno-15200p1-option-select"
            value={optionCode}
            onChange={(e) =>
              handleParamChange(() =>
                setOptionCode(e.target.value as "TG9" | "TG2" | "TG6" | "TG7"),
              )
            }
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              background: "#0f172a",
              color: "#f8fafc",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              fontSize: "0.84rem",
            }}
          >
            {LARGE_AIRBOAT_15200P1_OPTIONS.map((opt) => (
              <option key={opt.optionCode} value={opt.optionCode}>
                Option {opt.optionCode} · {opt.departureTime} ({opt.displayTime}) — {opt.title}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", color: "#cbd5e1" }}>
          <span style={{ fontWeight: 700 }}>Departure Date</span>
          <input
            data-testid="wno-15200p1-date-input"
            type="date"
            value={date}
            onChange={(e) => handleParamChange(() => setDate(e.target.value))}
            style={{
              padding: "7px 10px",
              borderRadius: 6,
              background: "#0f172a",
              color: "#f8fafc",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              fontSize: "0.84rem",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", color: "#cbd5e1" }}>
          <span style={{ fontWeight: 700 }}>Party Size (Guests)</span>
          <input
            data-testid="wno-15200p1-party-size-input"
            type="number"
            min={1}
            max={16}
            value={partySize}
            onChange={(e) =>
              handleParamChange(() =>
                setPartySize(Math.max(1, Math.min(16, Number(e.target.value) || 8))),
              )
            }
            style={{
              padding: "7px 10px",
              borderRadius: 6,
              background: "#0f172a",
              color: "#f8fafc",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              fontSize: "0.84rem",
            }}
          />
        </label>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6 }}>
          <button
            type="button"
            data-testid="wno-15200p1-check-btn"
            disabled={checkState.loading}
            onClick={() => runLiveAvailabilityCheck()}
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              background: "#d4af37",
              color: "#111827",
              fontWeight: 800,
              fontSize: "0.82rem",
              border: "none",
              cursor: checkState.loading ? "wait" : "pointer",
            }}
          >
            {checkState.loading
              ? `Checking ${partySize} guests on Viator...`
              : `Check ${partySize} Guests (${selectedOption.optionCode} · ${selectedOption.departureTime})`}
          </button>
        </div>
      </div>

      {/* Separate One-Boat Verification Notice */}
      <div
        data-testid="wno-15200p1-single-vessel-verification"
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          background: "rgba(56, 189, 248, 0.1)",
          border: "1px solid rgba(56, 189, 248, 0.32)",
          marginBottom: 14,
          fontSize: "0.8rem",
          color: "#e0f2fe",
        }}
      >
        <strong>Separate Single-Boat Verification (16-Passenger Vessel Capacity):</strong>{" "}
        {checkState.singleVesselNote}
      </div>

      {/* Live Provider Response Details */}
      <div
        data-testid="wno-15200p1-provider-response"
        style={{
          padding: "12px 14px",
          borderRadius: 10,
          background: "rgba(15, 23, 42, 0.65)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          marginBottom: 14,
          fontSize: "0.8rem",
          color: "#cbd5e1",
        }}
      >
        <div style={{ fontWeight: 700, color: "#f8fafc", marginBottom: 6 }}>
          Selection &amp; Provider Verification Summary:
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          <div>
            <strong>Product:</strong> <code>15200P1</code> (New Orleans Large Airboat Swamp Tour)
          </div>
          <div>
            <strong>Option &amp; Time:</strong> <code>{selectedOption.optionCode}</code> ·{" "}
            <code>{selectedOption.departureTime}</code> ({selectedOption.displayTime} <code>America/Chicago</code>)
          </div>
          <div>
            <strong>Date &amp; Party Size:</strong> <code>{date}</code> · <code>{partySize}</code> guests
          </div>
          <div>
            <strong>Provider Result:</strong>{" "}
            <code data-testid="wno-15200p1-provider-status">{checkState.status}</code>
            {checkState.totalPriceCents !== null && (
              <span>
                {" "}
                · <strong>${(checkState.totalPriceCents / 100).toFixed(2)} {checkState.currency}</strong> ($65.00/adult)
              </span>
            )}
          </div>
        </div>
        <div style={{ marginTop: 6, color: "#94a3b8", fontSize: "0.77rem" }}>
          {checkState.note}
          {checkState.timeChecked && (
            <span> · Checked at <code>{checkState.timeChecked}</code> via <code>{checkState.providerEndpoint}</code></span>
          )}
        </div>
      </div>

      {/* Exact Checkout Destination Agreement */}
      <div
        data-testid="wno-15200p1-checkout-destination"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
          <strong>Checkout Destination Agreement:</strong> Provider <code>viator</code> (<code>pid=P00306962</code>) · Product <code>15200P1</code> · Option <code>{selectedOption.optionCode}</code> (<code>{selectedOption.departureTime}</code>) →{" "}
          <code style={{ color: "#cbd5e1" }}>viator.com/tours/New-Orleans/Large-Airboat-Swamp-Tour/d675-15200P1</code>
        </div>

        <a
          data-testid="wno-15200p1-continue-viator-link"
          href={trackedViatorCheckoutHref}
          target="_blank"
          rel="sponsored noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            borderRadius: 8,
            background: "#0284c7",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "0.82rem",
            textDecoration: "none",
          }}
        >
          {checkState.status === "available_for_party"
            ? `Continue to Viator Checkout (15200P1 · ${selectedOption.optionCode} · ${partySize} Guests) ↗`
            : `Check Availability at Viator (15200P1 · ${selectedOption.optionCode} · ${partySize} Guests) ↗`}
        </a>
      </div>
    </section>
  );
}
