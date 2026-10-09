"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ALASKA_CRUISE_FLEET, AlaskaShipData } from "../../lib/alaskaCruiseFleet";

export interface BufferAnalysisResult {
  ship: AlaskaShipData;
  isAjDock: boolean;
  dockTypeLabel: string;
  disembarkMinutes: number;
  transitMinutes: number;
  allAboardCushionMinutes: number;
  arrivalTimeStr: string;
  departureTimeStr: string;
  earliestSafeFlightDepartureStr: string;
  latestSafeFlightReturnStr: string;
  totalPortMinutes: number;
  netExcursionWindowMinutes: number;
  safetyStatus: "optimal" | "standard" | "tight" | "incompatible";
  logisticsNotice: string;
}

function parseTimeToMinutes(timeStr: string): number {
  // Parses "13:00" or "1:00 PM"
  const clean = timeStr.trim().toLowerCase();
  const isPM = clean.includes("pm");
  const isAM = clean.includes("am");
  const numericPart = clean.replace(/[a-z\s]/g, "");
  const [hStr, mStr] = numericPart.split(":");
  let hours = parseInt(hStr, 10) || 0;
  const minutes = parseInt(mStr, 10) || 0;
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : `${m}`;
  return `${displayH}:${displayM} ${ampm}`;
}

export interface ExcursionPortBufferSolverProps {
  defaultShipSlug?: string;
}

export default function ExcursionPortBufferSolver({
  defaultShipSlug,
}: ExcursionPortBufferSolverProps = {}) {
  const [selectedShipSlug, setSelectedShipSlug] = useState<string>(
    defaultShipSlug && ALASKA_CRUISE_FLEET.some((s) => s.slug === defaultShipSlug)
      ? defaultShipSlug
      : "discovery-princess"
  );
  const [sailingDate, setSailingDate] = useState<string>("");
  const [arrivalStr, setArrivalStr] = useState<string>("13:00");
  const [departureStr, setDepartureStr] = useState<string>("22:00");
  const [cushionMinutes, setCushionMinutes] = useState<number>(90); // 90 min standard target

  const selectedShip = useMemo(() => {
    return ALASKA_CRUISE_FLEET.find((s) => s.slug === selectedShipSlug) || ALASKA_CRUISE_FLEET[0];
  }, [selectedShipSlug]);

  const analysis: BufferAnalysisResult = useMemo(() => {
    const isAjDock = selectedShip.typicalScheduledBerth.toLowerCase().includes("aj dock");
    const dockTypeLabel = isAjDock ? "AJ Dock (South Berth - Shuttle Required)" : "Downtown Berths (Franklin, CT, Marine Park)";
    
    // Disembarkation clearance (customs / gangway lowering)
    const disembarkMinutes = isAjDock ? 45 : 30;
    // Heliport transit via Egan Drive
    const transitMinutes = isAjDock ? 20 : 15;
    // Tour check-in buffer before flight
    const checkinBuffer = 15;
    // Safe return cushion before ship all-aboard (harmonized to 90-120m standard)
    const allAboardCushionMinutes = cushionMinutes;

    const arrivalMins = parseTimeToMinutes(arrivalStr);
    const departureMins = parseTimeToMinutes(departureStr);
    
    const earliestSafeMins = arrivalMins + disembarkMinutes + transitMinutes + checkinBuffer;
    const latestSafeReturnMins = departureMins - allAboardCushionMinutes - transitMinutes;
    
    const totalPortMinutes = departureMins >= arrivalMins ? departureMins - arrivalMins : (1440 - arrivalMins) + departureMins;
    const netExcursionWindowMinutes = Math.max(0, latestSafeReturnMins - earliestSafeMins);

    let safetyStatus: "optimal" | "standard" | "tight" | "incompatible" = "optimal";
    if (netExcursionWindowMinutes >= 240) {
      safetyStatus = "optimal";
    } else if (netExcursionWindowMinutes >= 150) {
      safetyStatus = "standard";
    } else if (netExcursionWindowMinutes >= 90) {
      safetyStatus = "tight";
    } else {
      safetyStatus = "incompatible";
    }

    let logisticsNotice = `Your port stay provides comfortable clearance with a ${allAboardCushionMinutes}-minute safety return buffer before all-aboard.`;
    if (isAjDock) {
      logisticsNotice = `⚠️ AJ Dock Advisory: Your ship berths at the South Berth (AJD). Passengers must board the terminal shuttle or meet direct operator transfers outside the security gate. A ${allAboardCushionMinutes}-minute return cushion is active.`;
    } else if (safetyStatus === "tight") {
      logisticsNotice = `⚠️ Tight Port Window: Based on your docking timeframe, only midday flight slots (between ${formatMinutesToTime(earliestSafeMins)} and ${formatMinutesToTime(latestSafeReturnMins)}) are safe. Do not book flights landing after ${formatMinutesToTime(latestSafeReturnMins)}.`;
    }

    return {
      ship: selectedShip,
      isAjDock,
      dockTypeLabel,
      disembarkMinutes,
      transitMinutes,
      allAboardCushionMinutes,
      arrivalTimeStr: formatMinutesToTime(arrivalMins),
      departureTimeStr: formatMinutesToTime(departureMins),
      earliestSafeFlightDepartureStr: formatMinutesToTime(earliestSafeMins),
      latestSafeFlightReturnStr: formatMinutesToTime(latestSafeReturnMins),
      totalPortMinutes,
      netExcursionWindowMinutes,
      safetyStatus,
      logisticsNotice,
    };
  }, [selectedShip, arrivalStr, departureStr, cushionMinutes]);

  return (
    <div
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #0d273a 0%, #051420 100%)",
        border: "1px solid rgba(158, 217, 255, 0.22)",
        borderRadius: "var(--radius-xl)",
        padding: "24px 20px",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5)",
        color: "var(--text)",
        maxWidth: 900,
        margin: "0 auto 40px",
      }}
    >
      {/* Title */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(158, 217, 255, 0.12)", border: "1px solid rgba(158, 217, 255, 0.25)", fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ice)", marginBottom: 6 }}>
            <span>⚓ 19-Ship Port Logistics Engine</span>
          </div>
          <h2 style={{ margin: 0, fontSize: "clamp(1.2rem, 3vw, 1.55rem)", fontWeight: 900, color: "#fff" }}>
            Juneau Shore Excursion Time Window Builder
          </h2>
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--muted)", textAlign: "right" }}>
          <span>Automated All-Aboard &amp; Dock Buffer Calculations</span>
        </div>
      </div>

      {/* Input Controls Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          background: "rgba(3, 14, 23, 0.7)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: "18px",
          marginBottom: 20,
        }}
      >
        {/* Ship Selector */}
        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ice)", marginBottom: 6 }}>
            Step 1: Select Your Cruise Ship
          </label>
          <select
            value={selectedShipSlug}
            onChange={(e) => setSelectedShipSlug(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "#081d2c",
              border: "1px solid var(--line)",
              borderRadius: 10,
              color: "#fff",
              fontSize: "0.92rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {ALASKA_CRUISE_FLEET.map((ship) => (
              <option key={ship.slug} value={ship.slug}>
                {ship.shipName} ({ship.cruiseLine})
              </option>
            ))}
          </select>
          <div style={{ fontSize: "0.76rem", color: "var(--muted)", marginTop: 6 }}>
            Assigned Dock: <strong style={{ color: "var(--ice)" }}>{selectedShip.typicalScheduledBerth}</strong>
          </div>
        </div>

        {/* Arrival Time */}
        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ice)", marginBottom: 6 }}>
            Step 2: Gangway Arrival Time
          </label>
          <input
            type="time"
            value={arrivalStr}
            onChange={(e) => setArrivalStr(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              background: "#081d2c",
              border: "1px solid var(--line)",
              borderRadius: 10,
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          />
          <div style={{ fontSize: "0.76rem", color: "var(--muted)", marginTop: 6 }}>
            Typical: {selectedShip.dockHours}
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ice)", marginBottom: 6 }}>
            Step 3: Ship Sail / All-Aboard Time
          </label>
          <input
            type="time"
            value={departureStr}
            onChange={(e) => setDepartureStr(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              background: "#081d2c",
              border: "1px solid var(--line)",
              borderRadius: 10,
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          />
          <div style={{ fontSize: "0.76rem", color: "var(--muted)", marginTop: 6 }}>
            All-aboard is strictly 30 min before lines cast off.
          </div>
        </div>

        {/* Cushion Selector */}
        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ice)", marginBottom: 6 }}>
            Step 4: Return Cushion Target
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setCushionMinutes(90)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                background: cushionMinutes === 90 ? "rgba(56, 189, 248, 0.25)" : "#081d2c",
                border: cushionMinutes === 90 ? "1px solid #38bdf8" : "1px solid var(--line)",
                color: cushionMinutes === 90 ? "#38bdf8" : "var(--muted)",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              90 Min Target
            </button>
            <button
              type="button"
              onClick={() => setCushionMinutes(120)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                background: cushionMinutes === 120 ? "rgba(56, 189, 248, 0.25)" : "#081d2c",
                border: cushionMinutes === 120 ? "1px solid #38bdf8" : "1px solid var(--line)",
                color: cushionMinutes === 120 ? "#38bdf8" : "var(--muted)",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              120 Min Max
            </button>
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--muted)", marginTop: 6 }}>
            Back before all-aboard call (90–120m target)
          </div>
        </div>
      </div>

      {/* Voyage Schedule Clarification Notice */}
      <div
        style={{
          background: "rgba(15, 30, 48, 0.6)",
          border: "1px solid rgba(158, 217, 255, 0.15)",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: "0.78rem",
          lineHeight: 1.5,
          color: "var(--muted)",
        }}
      >
        <strong style={{ color: "#93c5fd" }}>🗓️ Voyage Itinerary Notice:</strong> Port hours vary across different sailing dates for the same vessel (for example, official CLA Alaska schedules show {selectedShip.shipName} docking times shift between early morning and afternoon calls across May, July, and August). Confirm your voyage&apos;s exact docking time on your cruise booking confirmation and adjust the arrival/departure inputs above.
      </div>

      {/* TIMELINE METRICS BAR */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ background: "rgba(7, 24, 36, 0.8)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 4 }}>
            Earliest Safe Flight
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#38bdf8", fontFamily: "monospace" }}>
            {analysis.earliestSafeFlightDepartureStr}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 2 }}>
            +{analysis.disembarkMinutes}m dock +{analysis.transitMinutes}m shuttle
          </div>
        </div>

        <div style={{ background: "rgba(7, 24, 36, 0.8)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 4 }}>
            Latest Safe Landing
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#f59e0b", fontFamily: "monospace" }}>
            {analysis.latestSafeFlightReturnStr}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 2 }}>
            -{analysis.allAboardCushionMinutes}m all-aboard safety buffer
          </div>
        </div>

        <div style={{ background: "rgba(7, 24, 36, 0.8)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 4 }}>
            Net Flight Window
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 900, color: analysis.safetyStatus === "optimal" ? "#34d399" : "#fbbf24", fontFamily: "monospace" }}>
            {(analysis.netExcursionWindowMinutes / 60).toFixed(1)} Hours
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 2 }}>
            {analysis.safetyStatus === "optimal" ? "Broad slot availability" : "Target specific departures"}
          </div>
        </div>
      </div>

      {/* LOGISTICS NOTICE BOX */}
      <div
        style={{
          background: analysis.isAjDock ? "rgba(120, 53, 15, 0.25)" : "rgba(6, 78, 59, 0.25)",
          border: analysis.isAjDock ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)",
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 20,
        }}
      >
        <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text)" }}>
          {analysis.logisticsNotice}
        </p>
      </div>

      {/* CTA to Check Matching Availability */}
      <div style={{ textAlign: "center" }}>
        <Link
          href={`/helicopter-waitlist/${selectedShip.slug}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "#fff",
            textDecoration: "none",
            padding: "12px 22px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: "0.92rem",
          }}
        >
          <span>View {selectedShip.shipName} Safe Flight Departures</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
