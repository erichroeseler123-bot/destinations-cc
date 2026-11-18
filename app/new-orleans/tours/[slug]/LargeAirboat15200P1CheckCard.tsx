"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  resolveNextEligibleTourOption,
  buildViatorCarryoverTruth,
  validateCatalogCheckoutBinding,
} from "@/lib/dcc/catalog/provenToursCatalog";
import type { PortDaySeatAvailabilityEvaluation } from "@/lib/dcc/cruisePortExcursionCatalogEngine";

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
  initialAutoAdvancedReason?: string | null;
  initialSeatAvailability?: PortDaySeatAvailabilityEvaluation | null;
  initialAllAboardTime?: string | null;
  initialAllAboardConfirmed?: boolean;
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
  autoAdvanceNote: string | null;
}

function hydrateCheckStateFromSeat(
  seat: PortDaySeatAvailabilityEvaluation | null | undefined,
  partySize: number,
  autoAdvanceNote: string | null,
): LiveCheckState {
  if (!seat) {
    return {
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
      note: "Checking next eligible departure with Viator in New Orleans local time (America/Chicago)...",
      providerEndpoint: null,
      singleVesselStatus: "requires_separate_operator_verification",
      singleVesselCapacity: 16,
      singleVesselNote:
        "Live Viator availability confirms total seats on the scheduled departure across Louisiana Tour Company's fleet (16-passenger large airboats), not guaranteed single-boat assignment. If your group wants one boat together, verify single-vessel grouping directly with Louisiana Tour Company after booking.",
      autoAdvanceNote,
    };
  }

  const isConfirmedAvailable =
    seat.status === "live_verified" && seat.available === true;
  const isConfirmedUnavailable =
    seat.status === "sold_out" ||
    seat.available === false ||
    seat.pastDepartureRejected === true;
  const normalizedStatus: LiveCheckState["status"] = isConfirmedAvailable
    ? "available_for_party"
    : isConfirmedUnavailable
      ? "unavailable_for_party"
      : "unknown";
  const resolvedDisplayLabel =
    seat.availabilityDisplayLabel ||
    (isConfirmedAvailable
      ? `Available for ${partySize} when checked`
      : isConfirmedUnavailable
        ? `Unavailable for ${partySize} when checked`
        : "Check availability at the provider");
  const resolvedTotalPriceCents =
    typeof seat.totalPriceUsd === "number"
      ? Math.round(seat.totalPriceUsd * 100)
      : null;

  return {
    loading: false,
    checked: true,
    error: null,
    status: normalizedStatus,
    availabilityDisplayLabel: resolvedDisplayLabel,
    bookable: isConfirmedAvailable ? true : isConfirmedUnavailable ? false : null,
    totalPriceCents: resolvedTotalPriceCents,
    currency: seat.currency || "USD",
    priceBasis: seat.fromPriceUsd ? `$${seat.fromPriceUsd.toFixed(2)}/adult` : null,
    timeChecked: seat.liveCheckedAt || new Date().toISOString(),
    checkedTimeZone: seat.checkedTimeZone || "America/Chicago",
    note: seat.detailNote || "",
    providerEndpoint: "POST /availability/check",
    singleVesselStatus:
      seat.singleVesselVerification?.status ||
      "requires_separate_operator_verification",
    singleVesselCapacity:
      seat.singleVesselVerification?.vesselCapacityPassengers || 16,
    singleVesselNote:
      seat.singleVesselVerification?.detailNote ||
      `Live Viator availability confirms ${partySize} seats on the scheduled departure across Louisiana Tour Company's fleet (16-passenger large airboats), not guaranteed single-boat assignment. If the group wants one boat, verify single-vessel grouping separately with Louisiana Tour Company.`,
    autoAdvanceNote: seat.nextEligibleOption?.reason || autoAdvanceNote,
  };
}

export default function LargeAirboat15200P1CheckCard({
  siteDomain,
  initialDate,
  initialPartySize,
  initialOptionCode,
  initialAutoAdvancedReason,
  initialSeatAvailability,
  initialAllAboardTime,
  initialAllAboardConfirmed,
}: LargeAirboat15200P1CheckCardProps) {
  const initialResolution = useMemo(
    () =>
      resolveNextEligibleTourOption({
        productCode: "15200P1",
        date: initialDate || null,
        explicitOptionCode: initialOptionCode || null,
        autoAdvanceIfPast: true,
      }),
    [initialDate, initialOptionCode],
  );

  const [date, setDate] = useState<string>(
    initialSeatAvailability?.checkedDate ||
      initialDate?.trim() ||
      initialResolution?.resolvedDate ||
      "2026-11-09",
  );
  const [partySize, setPartySize] = useState<number>(
    initialPartySize && initialPartySize > 0 ? initialPartySize : 8,
  );
  const [optionCode, setOptionCode] = useState<"TG9" | "TG2" | "TG6" | "TG7">(() => {
    const candidate = (
      initialSeatAvailability?.selectedOptionCode ||
      initialOptionCode ||
      initialResolution?.selectedOption.optionCode ||
      "TG9"
    )
      .trim()
      .toUpperCase();
    if (candidate === "TG2" || candidate === "TG6" || candidate === "TG7") {
      return candidate;
    }
    return "TG9";
  });

  const [checkState, setCheckState] = useState<LiveCheckState>(() =>
    hydrateCheckStateFromSeat(
      initialSeatAvailability,
      initialPartySize && initialPartySize > 0 ? initialPartySize : 8,
      initialAutoAdvancedReason ?? initialResolution?.reason ?? null,
    ),
  );

  const didAutoCheckOnMount = useRef(false);

  const selectedOption = useMemo(
    () =>
      LARGE_AIRBOAT_15200P1_OPTIONS.find((opt) => opt.optionCode === optionCode) ||
      LARGE_AIRBOAT_15200P1_OPTIONS[0],
    [optionCode],
  );

  async function runLiveAvailabilityCheck(overrideParams?: {
    date?: string;
    optionCode?: "TG9" | "TG2" | "TG6" | "TG7";
    partySize?: number;
    autoSelectNextDeparture?: boolean;
    autoAdvanceNote?: string | null;
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
      autoAdvanceNote:
        overrideParams?.autoAdvanceNote !== undefined
          ? overrideParams.autoAdvanceNote
          : prev.autoAdvanceNote,
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
          optionCode: targetOpt.optionCode,
          departureTime: targetOpt.departureTime,
          partySize: targetPartySize,
          autoSelectNextDeparture: overrideParams?.autoSelectNextDeparture ?? false,
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
          error: data?.message || data?.error || "Live provider check did not return a verified result.",
        }));
        return;
      }

      if (
        seat.selectedOptionCode &&
        (seat.selectedOptionCode === "TG9" ||
          seat.selectedOptionCode === "TG2" ||
          seat.selectedOptionCode === "TG6" ||
          seat.selectedOptionCode === "TG7") &&
        seat.selectedOptionCode !== targetOptionCode
      ) {
        setOptionCode(seat.selectedOptionCode);
      }

      setCheckState((prev) =>
        hydrateCheckStateFromSeat(
          seat,
          targetPartySize,
          overrideParams?.autoAdvanceNote ??
            seat.nextEligibleOption?.reason ??
            prev.autoAdvanceNote,
        ),
      );
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

  // On mount: synchronize URL parameters, resolve next eligible departure in America/Chicago, and auto-check if not yet verified
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (didAutoCheckOnMount.current) return;
    didAutoCheckOnMount.current = true;

    const sp = new URLSearchParams(window.location.search);
    let nextParty = partySize;
    const rawParty = sp.get("partySize") || sp.get("party_size");
    if (rawParty) {
      const parsed = Number(rawParty);
      if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 16) {
        nextParty = Math.round(parsed);
        setPartySize(nextParty);
      }
    }

    const rawDate = sp.get("date") || sp.get("port_date");
    const rawOption = (sp.get("option") || sp.get("optionCode") || "").trim().toUpperCase();

    const resolution = resolveNextEligibleTourOption({
      productCode: "15200P1",
      date: rawDate || date,
      explicitOptionCode: rawOption || null,
      autoAdvanceIfPast: !rawOption,
    });

    const nextDate = resolution?.resolvedDate || rawDate || date;
    const nextOpt = (resolution?.selectedOption.optionCode ||
      rawOption ||
      optionCode) as "TG9" | "TG2" | "TG6" | "TG7";
    const advanceReason = resolution?.autoAdvancedFromPast
      ? resolution.reason
      : checkState.autoAdvanceNote;

    if (nextDate !== date) setDate(nextDate);
    if (nextOpt !== optionCode) setOptionCode(nextOpt);

    const needsInitialFetch =
      !checkState.checked ||
      nextDate !== date ||
      nextOpt !== optionCode ||
      nextParty !== partySize;

    if (needsInitialFetch) {
      void runLiveAvailabilityCheck({
        date: nextDate,
        optionCode: nextOpt,
        partySize: nextParty,
        autoSelectNextDeparture: !rawOption,
        autoAdvanceNote: advanceReason,
      });
    }
  }, []);

  const handleDateChange = (newDate: string) => {
    const resolution = resolveNextEligibleTourOption({
      productCode: "15200P1",
      date: newDate,
      explicitOptionCode: optionCode,
      autoAdvanceIfPast: true,
    });
    const resolvedOpt = (resolution?.selectedOption.optionCode ||
      optionCode) as "TG9" | "TG2" | "TG6" | "TG7";
    const advanceNote = resolution?.autoAdvancedFromPast ? resolution.reason : null;
    setDate(newDate);
    if (resolvedOpt !== optionCode) {
      setOptionCode(resolvedOpt);
    }
    void runLiveAvailabilityCheck({
      date: newDate,
      optionCode: resolvedOpt,
      partySize,
      autoSelectNextDeparture: true,
      autoAdvanceNote: advanceNote,
    });
  };

  const handleOptionChange = (newOption: "TG9" | "TG2" | "TG6" | "TG7") => {
    setOptionCode(newOption);
    void runLiveAvailabilityCheck({
      date,
      optionCode: newOption,
      partySize,
      autoSelectNextDeparture: false,
      autoAdvanceNote: null,
    });
  };

  const handlePartySizeChange = (newPartySize: number) => {
    const clamped = Math.max(1, Math.min(16, newPartySize || 8));
    setPartySize(clamped);
    void runLiveAvailabilityCheck({
      date,
      optionCode,
      partySize: clamped,
      autoSelectNextDeparture: false,
    });
  };

  const trackedViatorCheckoutHref = useMemo(() => {
    const isWto =
      siteDomain === "welcometoneworleanstours.com" ||
      siteDomain === "www.welcometoneworleanstours.com" ||
      siteDomain.toLowerCase().includes("welcometoneworleans");
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

  const checkoutBindingValidation = useMemo(
    () =>
      validateCatalogCheckoutBinding({
        provider: "viator",
        providerAccount: "P00306962",
        productCode: "15200P1",
        optionCode: selectedOption.optionCode,
        checkoutDestinationUrl: CANONICAL_VIATOR_15200P1_URL,
      }),
    [selectedOption.optionCode],
  );

  const carryoverTruth = useMemo(
    () =>
      buildViatorCarryoverTruth({
        productCode: "15200P1",
        optionCode: selectedOption.optionCode,
        optionTitle: selectedOption.title,
        startTime: selectedOption.departureTime,
        date,
        partySize,
      }),
    [selectedOption.optionCode, selectedOption.title, selectedOption.departureTime, date, partySize],
  );

  // Estimate return back to port / French Quarter: start + 100m tour + 35m return transfer = +135m
  const estimatedReturnLabel = useMemo(() => {
    const [h, m] = selectedOption.departureTime.split(":").map(Number);
    const totalMins = (h || 0) * 60 + (m || 0) + 135;
    const retH24 = Math.floor(totalMins / 60) % 24;
    const retM = totalMins % 60;
    const suffix = retH24 >= 12 ? "p.m." : "a.m.";
    const retH12 = retH24 % 12 || 12;
    return `${retH12}:${String(retM).padStart(2, "0")} ${suffix}`;
  }, [selectedOption.departureTime]);

  const fitsSailingBadgeLabel = useMemo(() => {
    if (initialAllAboardConfirmed && initialAllAboardTime) {
      return `Fits the sailing (est. back ${estimatedReturnLabel} vs ${initialAllAboardTime} all-aboard)`;
    }
    return `Schedule window: ${selectedOption.displayTime}–${estimatedReturnLabel} (confirm all-aboard if cruising)`;
  }, [initialAllAboardConfirmed, initialAllAboardTime, selectedOption.displayTime, estimatedReturnLabel]);

  const isWnoWarm = siteDomain === "welcometoneworleanstours.com";

  return (
    <section
      data-testid="wno-large-airboat-15200p1-card"
      aria-label="Verified Large Airboat Option — Louisiana Tour Company"
      style={{
        width: "min(1120px, calc(100% - 32px))",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "clip",
        margin: "20px auto",
        padding: "22px 24px",
        borderRadius: 16,
        background: isWnoWarm ? "#fffdf9" : "#111b27",
        border: isWnoWarm
          ? "1px solid rgba(30, 25, 21, 0.14)"
          : "1px solid rgba(212, 175, 55, 0.45)",
        boxShadow: isWnoWarm ? "0 12px 32px rgba(30, 25, 21, 0.06)" : undefined,
        color: isWnoWarm ? "#1e1915" : "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ minWidth: 0, maxWidth: "100%" }}>
          <div
            style={{
              fontSize: "0.74rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: isWnoWarm ? "#8a6220" : "#d4af37",
            }}
          >
            Group Airboat Availability · Live Partner Calendar
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              margin: "4px 0 2px",
              color: isWnoWarm ? "#163828" : "#ffffff",
            }}
          >
            New Orleans 16-Passenger Large Airboat Swamp Tour (Louisiana Tour Company)
          </h2>
          <div style={{ fontSize: "0.83rem", color: isWnoWarm ? "#4a4138" : "#cbd5e1" }}>
            16-Passenger Large Airboat · 1h 40m on water · Self-Drive Meeting Point:{" "}
            <strong>9706 Barataria Blvd, Marrero, LA 70072</strong> (check in 30 min prior) · New Orleans Local Time
          </div>
        </div>

        {/* Three Strictly Separate Status Badges: 1) Fits Sailing, 2) Available for N, 3) One Boat Confirmed */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span
            data-testid="wno-15200p1-fits-sailing-badge"
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: "0.78rem",
              fontWeight: 800,
              background: initialAllAboardConfirmed
                ? isWnoWarm
                  ? "rgba(22, 56, 40, 0.12)"
                  : "rgba(16, 185, 129, 0.16)"
                : isWnoWarm
                  ? "#f5efe2"
                  : "rgba(148, 163, 184, 0.18)",
              color: initialAllAboardConfirmed
                ? isWnoWarm
                  ? "#163828"
                  : "#6ee7b7"
                : isWnoWarm
                  ? "#4a4138"
                  : "#e2e8f0",
              border: initialAllAboardConfirmed
                ? isWnoWarm
                  ? "1px solid rgba(22, 56, 40, 0.35)"
                  : "1px solid rgba(16, 185, 129, 0.4)"
                : isWnoWarm
                  ? "1px solid rgba(30, 25, 21, 0.16)"
                  : "1px solid rgba(148, 163, 184, 0.35)",
            }}
          >
            {fitsSailingBadgeLabel}
          </span>

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
                  ? isWnoWarm
                    ? "rgba(22, 56, 40, 0.14)"
                    : "rgba(16, 185, 129, 0.2)"
                  : checkState.status === "unavailable_for_party"
                    ? isWnoWarm
                      ? "rgba(107, 39, 55, 0.14)"
                      : "rgba(239, 68, 68, 0.2)"
                    : isWnoWarm
                      ? "#f7efe0"
                      : "rgba(245, 158, 11, 0.2)",
              color:
                checkState.status === "available_for_party"
                  ? isWnoWarm
                    ? "#163828"
                    : "#6ee7b7"
                  : checkState.status === "unavailable_for_party"
                    ? isWnoWarm
                      ? "#6b2737"
                      : "#fca5a5"
                    : isWnoWarm
                      ? "#8a6220"
                      : "#fde68a",
              border:
                checkState.status === "available_for_party"
                  ? isWnoWarm
                    ? "1px solid rgba(22, 56, 40, 0.35)"
                    : "1px solid rgba(16, 185, 129, 0.45)"
                  : checkState.status === "unavailable_for_party"
                    ? isWnoWarm
                      ? "1px solid rgba(107, 39, 55, 0.35)"
                      : "1px solid rgba(239, 68, 68, 0.45)"
                    : isWnoWarm
                      ? "1px solid rgba(184, 137, 58, 0.45)"
                      : "1px solid rgba(245, 158, 11, 0.45)",
            }}
          >
            {checkState.availabilityDisplayLabel}
          </span>

          <span
            data-testid="wno-15200p1-one-boat-badge"
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: "0.78rem",
              fontWeight: 800,
              background: isWnoWarm ? "#f5efe2" : "rgba(56, 189, 248, 0.15)",
              color: isWnoWarm ? "#6b2737" : "#bae6fd",
              border: isWnoWarm
                ? "1px solid rgba(107, 39, 55, 0.28)"
                : "1px solid rgba(56, 189, 248, 0.4)",
            }}
          >
            One boat: verify separately ({checkState.singleVesselCapacity}-seat capacity)
          </span>
        </div>
      </div>

      {/* Auto-selected next eligible departure notice */}
      {checkState.autoAdvanceNote && (
        <div
          data-testid="wno-15200p1-next-eligible-banner"
          style={{
            padding: "9px 14px",
            borderRadius: 8,
            background: isWnoWarm ? "#f5efe2" : "rgba(16, 185, 129, 0.12)",
            border: isWnoWarm
              ? "1px solid rgba(22, 56, 40, 0.28)"
              : "1px solid rgba(16, 185, 129, 0.35)",
            marginBottom: 14,
            fontSize: "0.8rem",
            color: isWnoWarm ? "#163828" : "#d1fae5",
          }}
        >
          <strong>Next Eligible Departure Auto-Selected:</strong> {checkState.autoAdvanceNote}
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))",
          gap: 12,
          padding: 14,
          borderRadius: 12,
          background: isWnoWarm ? "#faf6ee" : "rgba(15, 23, 42, 0.8)",
          border: isWnoWarm
            ? "1px solid rgba(30, 25, 21, 0.12)"
            : "1px solid rgba(148, 163, 184, 0.22)",
          marginBottom: 14,
        }}
      >
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 0,
            fontSize: "0.78rem",
            color: isWnoWarm ? "#4a4138" : "#cbd5e1",
          }}
        >
          <span style={{ fontWeight: 700 }}>Departure Time (New Orleans Local Time)</span>
          <select
            data-testid="wno-15200p1-option-select"
            value={optionCode}
            onChange={(e) =>
              handleOptionChange(e.target.value as "TG9" | "TG2" | "TG6" | "TG7")
            }
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              padding: "8px 10px",
              borderRadius: 8,
              background: isWnoWarm ? "#fffdf9" : "#0f172a",
              color: isWnoWarm ? "#1e1915" : "#f8fafc",
              border: isWnoWarm
                ? "1px solid rgba(30, 25, 21, 0.2)"
                : "1px solid rgba(148, 163, 184, 0.35)",
              fontSize: "0.84rem",
            }}
          >
            {LARGE_AIRBOAT_15200P1_OPTIONS.map((opt) => (
              <option key={opt.optionCode} value={opt.optionCode}>
                {opt.displayTime} — Large Airboat (Self-Drive · 9706 Barataria Blvd)
              </option>
            ))}
          </select>
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 0,
            fontSize: "0.78rem",
            color: isWnoWarm ? "#4a4138" : "#cbd5e1",
          }}
        >
          <span style={{ fontWeight: 700 }}>Departure Date</span>
          <input
            data-testid="wno-15200p1-date-input"
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              padding: "7px 10px",
              borderRadius: 8,
              background: isWnoWarm ? "#fffdf9" : "#0f172a",
              color: isWnoWarm ? "#1e1915" : "#f8fafc",
              border: isWnoWarm
                ? "1px solid rgba(30, 25, 21, 0.2)"
                : "1px solid rgba(148, 163, 184, 0.35)",
              fontSize: "0.84rem",
            }}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 0,
            fontSize: "0.78rem",
            color: isWnoWarm ? "#4a4138" : "#cbd5e1",
          }}
        >
          <span style={{ fontWeight: 700 }}>Party Size (Guests)</span>
          <input
            data-testid="wno-15200p1-party-size-input"
            type="number"
            min={1}
            max={16}
            value={partySize}
            onChange={(e) => handlePartySizeChange(Number(e.target.value) || 8)}
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              padding: "7px 10px",
              borderRadius: 8,
              background: isWnoWarm ? "#fffdf9" : "#0f172a",
              color: isWnoWarm ? "#1e1915" : "#f8fafc",
              border: isWnoWarm
                ? "1px solid rgba(30, 25, 21, 0.2)"
                : "1px solid rgba(148, 163, 184, 0.35)",
              fontSize: "0.84rem",
            }}
          />
        </label>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6, minWidth: 0 }}>
          <button
            type="button"
            data-testid="wno-15200p1-check-btn"
            disabled={checkState.loading}
            onClick={() => runLiveAvailabilityCheck()}
            style={{
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
              padding: "9px 14px",
              borderRadius: 999,
              background: isWnoWarm ? "#b8893a" : "#d4af37",
              color: isWnoWarm ? "#1e1915" : "#111827",
              fontWeight: 800,
              fontSize: "0.82rem",
              border: "none",
              cursor: checkState.loading ? "wait" : "pointer",
            }}
          >
            {checkState.loading
              ? `Checking ${partySize} guests...`
              : `Check ${partySize} Guests (${selectedOption.displayTime})`}
          </button>
        </div>
      </div>

      {/* Exact Time, Pickup, Group Total, and Checked Timestamp */}
      <div
        data-testid="wno-15200p1-provider-response"
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: isWnoWarm ? "#faf6ee" : "rgba(15, 23, 42, 0.72)",
          border: isWnoWarm
            ? "1px solid rgba(30, 25, 21, 0.12)"
            : "1px solid rgba(148, 163, 184, 0.24)",
          marginBottom: 14,
          fontSize: "0.82rem",
          color: isWnoWarm ? "#4a4138" : "#cbd5e1",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: isWnoWarm ? "#163828" : "#f8fafc",
            marginBottom: 8,
          }}
        >
          Selected Departure Summary — Time, Dock Address &amp; Group Estimate:
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
            gap: 10,
          }}
        >
          <div>
            <strong>Departure Time:</strong>{" "}
            <strong style={{ color: isWnoWarm ? "#1e1915" : "#ffffff" }}>
              {selectedOption.displayTime}
            </strong>{" "}
            (New Orleans local time on {date})
          </div>
          <div>
            <strong>Pickup / Meeting Point:</strong>{" "}
            <span style={{ color: isWnoWarm ? "#1e1915" : "#f8fafc" }}>
              Self-drive meeting point at 9706 Barataria Blvd, Marrero, LA 70072
            </span>{" "}
            (no hotel pickup on this departure; check in 30 min prior)
          </div>
          <div>
            <strong>Group Total ({partySize} Guests):</strong>{" "}
            {checkState.totalPriceCents !== null ? (
              <strong
                style={{
                  color: isWnoWarm ? "#163828" : "#6ee7b7",
                  fontSize: "0.92rem",
                }}
              >
                ${(checkState.totalPriceCents / 100).toFixed(2)} {checkState.currency}
              </strong>
            ) : (
              <span>Verify on provider</span>
            )}{" "}
            {checkState.priceBasis ? <span>({checkState.priceBasis})</span> : <span>($65.00/adult)</span>}
          </div>
          <div>
            <strong>Availability Status:</strong>{" "}
            <span data-testid="wno-15200p1-provider-status">
              {checkState.status === "available_for_party"
                ? "Available when checked"
                : checkState.status === "unavailable_for_party"
                  ? "Unavailable when checked"
                  : "Verify on partner calendar"}
            </span>
            {checkState.timeChecked ? (
              <span> (checked {checkState.timeChecked})</span>
            ) : (
              <span> (checking live calendar)</span>
            )}
          </div>
        </div>
        {checkState.note && (
          <div
            style={{
              marginTop: 8,
              color: isWnoWarm ? "#6e6255" : "#94a3b8",
              fontSize: "0.77rem",
            }}
          >
            {checkState.note}
          </div>
        )}
      </div>

      {/* Separate One-Boat Verification Notice */}
      <div
        data-testid="wno-15200p1-single-vessel-verification"
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: isWnoWarm ? "#f7efe0" : "rgba(56, 189, 248, 0.1)",
          border: isWnoWarm
            ? "1px solid rgba(184, 137, 58, 0.4)"
            : "1px solid rgba(56, 189, 248, 0.32)",
          marginBottom: 14,
          fontSize: "0.8rem",
          color: isWnoWarm ? "#1e1915" : "#e0f2fe",
        }}
      >
        <strong>Separate Single-Boat Verification (16-Passenger Vessel Capacity):</strong>{" "}
        {checkState.singleVesselNote}
      </div>

      {/* One Clear Button to Continue + Exact Checkout Destination & Viator Carryover Truth */}
      <div
        data-testid="wno-15200p1-checkout-destination"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "14px 16px",
          borderRadius: 12,
          background: isWnoWarm ? "#f5efe2" : "rgba(2, 132, 199, 0.1)",
          border: isWnoWarm
            ? "1px solid rgba(22, 56, 40, 0.25)"
            : "1px solid rgba(2, 132, 199, 0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontSize: "0.8rem", color: isWnoWarm ? "#1e1915" : "#e2e8f0", minWidth: 0 }}>
            <strong>
              Partner Checkout ({checkoutBindingValidation.valid ? "Verified" : "Check"}):
            </strong>{" "}
            Viator · Louisiana Tour Company 16-Passenger Large Airboat ({selectedOption.displayTime} departure)
          </div>

          <a
            data-testid="wno-15200p1-continue-viator-link"
            href={trackedViatorCheckoutHref}
            target="_blank"
            rel="sponsored noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              maxWidth: "100%",
              boxSizing: "border-box",
              padding: "11px 18px",
              borderRadius: 999,
              background: isWnoWarm ? "#163828" : "#0284c7",
              color: isWnoWarm ? "#faf6ee" : "#ffffff",
              fontWeight: 800,
              fontSize: "0.86rem",
              textDecoration: "none",
              whiteSpace: "normal",
              textAlign: "center",
            }}
          >
            {checkState.status === "available_for_party"
              ? `Continue to Viator (${selectedOption.displayTime} · ${partySize} Guests · $${((checkState.totalPriceCents || partySize * 6500) / 100).toFixed(0)}) ↗`
              : `Continue to Viator (${selectedOption.displayTime} · ${partySize} Guests) ↗`}
          </a>
        </div>

        <div
          data-testid="wno-15200p1-viator-carryover-truth"
          style={{
            fontSize: "0.76rem",
            color: isWnoWarm ? "#4a4138" : "#cbd5e1",
            borderTop: isWnoWarm
              ? "1px solid rgba(30, 25, 21, 0.12)"
              : "1px solid rgba(148, 163, 184, 0.2)",
            paddingTop: 8,
          }}
        >
          <strong>What carries over to Viator vs. what to confirm on Viator:</strong>{" "}
          {carryoverTruth.travelerInstruction}
        </div>
      </div>
    </section>
  );
}

