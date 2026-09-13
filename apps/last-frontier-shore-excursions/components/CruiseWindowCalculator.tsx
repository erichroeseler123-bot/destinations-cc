"use client";

import React, { useState, useMemo } from "react";
import { calculateCruiseWindow, DOCK_TRANSFERS } from "@/lib/cruise-window";
import { PortSlug, CruiseFitStatus } from "@/lib/affiliate/types";
import { trackAffiliateEvent } from "@/lib/analytics";

interface CruiseWindowCalculatorProps {
  portSlug?: PortSlug;
  defaultDurationMinutes?: number;
  onFitCalculated?: (fit: {
    status: CruiseFitStatus;
    label: string;
    bufferMinutes: number;
    durationMinutes: number;
  }) => void;
}

export function CruiseWindowCalculator({
  portSlug = "juneau",
  defaultDurationMinutes = 210,
  onFitCalculated,
}: CruiseWindowCalculatorProps) {
  const [arrivalTime, setArrivalTime] = useState("08:00 AM");
  const [allAboardTime, setAllAboardTime] = useState("04:30 PM");
  const [meetingTime, setMeetingTime] = useState("09:00 AM");
  const [durationMinutes, setDurationMinutes] = useState(defaultDurationMinutes);
  const [selectedDockKey, setSelectedDockKey] = useState(() => {
    const docksForPort = Object.entries(DOCK_TRANSFERS).filter(([, d]) => d.portSlug === portSlug);
    return docksForPort.length > 0 ? docksForPort[0][0] : "franklin-dock";
  });

  const availableDocks = useMemo(() => {
    return Object.entries(DOCK_TRANSFERS).filter(([, d]) => d.portSlug === portSlug);
  }, [portSlug]);

  const calculation = useMemo(() => {
    const result = calculateCruiseWindow({
      arrivalTimeStr: arrivalTime,
      allAboardTimeStr: allAboardTime,
      meetingTimeStr: meetingTime,
      durationMinutes: durationMinutes,
      dockKey: selectedDockKey,
      planningMarginMinutes: 45,
    });

    if (onFitCalculated) {
      onFitCalculated({
        status: result.status,
        label: result.statusLabel,
        bufferMinutes: result.safetyBufferMinutes,
        durationMinutes: durationMinutes,
      });
    }

    return result;
  }, [arrivalTime, allAboardTime, meetingTime, durationMinutes, selectedDockKey, onFitCalculated]);

  const handleComputeClick = () => {
    trackAffiliateEvent({
      event: "port_window_calculated",
      port: portSlug,
      status: calculation.status,
      metadata: {
        arrivalTime,
        allAboardTime,
        meetingTime,
        durationMinutes,
        dockKey: selectedDockKey,
        buffer: calculation.safetyBufferMinutes,
      },
    });
  };

  const statusColors = {
    strong_fit: { bg: "#e6f4ea", border: "#137333", text: "#137333", icon: "✓" },
    tight_fit: { bg: "#fef7e0", border: "#b06000", text: "#b06000", icon: "⚠" },
    does_not_fit: { bg: "#fce8e6", border: "#c5221f", text: "#c5221f", icon: "✕" },
    unknown: { bg: "#f1f3f4", border: "#5f6368", text: "#5f6368", icon: "?" },
  }[calculation.status];

  return (
    <div
      className="card"
      style={{
        background: "#ffffff",
        border: "2px solid var(--accent)",
        borderRadius: "8px",
        padding: "24px",
        margin: "24px 0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span className="badge badge-safety">Last Frontier Planning Standard</span>
          <h3 style={{ margin: "8px 0 4px", fontSize: "22px" }}>Cruise-Window Fit Calculator</h3>
        </div>
        <span style={{ fontSize: "13px", color: "var(--muted)" }}>
          Planning Rule: Tour End + Transfer + 45 Min Margin ≤ Ship All-Aboard
        </span>
      </div>

      {/* Input Form Controls */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginTop: "16px",
          marginBottom: "16px",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>
            Ship Arrival Time
          </label>
          <input
            type="text"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "14px" }}
            placeholder="08:00 AM"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>
            Ship All-Aboard Time
          </label>
          <input
            type="text"
            value={allAboardTime}
            onChange={(e) => setAllAboardTime(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "14px" }}
            placeholder="04:30 PM"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>
            Tour Meeting Time
          </label>
          <input
            type="text"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "14px" }}
            placeholder="09:00 AM"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>
            Tour Duration (minutes)
          </label>
          <input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "14px" }}
            min={30}
            max={720}
            step={15}
          />
        </div>

        {availableDocks.length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>
              Your Cruise Berth / Dock Location
            </label>
            <select
              value={selectedDockKey}
              onChange={(e) => setSelectedDockKey(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "14px", background: "white" }}
            >
              {availableDocks.map(([key, dock]) => (
                <option value={key} key={key}>
                  {dock.dockName} ({dock.transferMinutesEachWay}m transit buffer — {dock.logisticsNote})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Result Display Box */}
      <div
        style={{
          background: statusColors.bg,
          border: "1px solid " + statusColors.border,
          borderRadius: "6px",
          padding: "16px",
          marginTop: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: statusColors.text }}>
            {statusColors.icon}
          </span>
          <strong style={{ fontSize: "17px", color: statusColors.text }}>
            {calculation.statusLabel}
          </strong>
        </div>

        <p style={{ margin: "8px 0", fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>
          {calculation.summary}
        </p>

        {calculation.reasons.length > 0 && (
          <ul style={{ margin: "8px 0 0", paddingLeft: "20px", fontSize: "13px", color: "#485b63" }}>
            {calculation.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Standard Cruise-Fit Disclaimer Requirement */}
      <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: 14, lineHeight: 1.5, fontStyle: "italic" }}>
        Last Frontier’s planning method estimates whether an excursion fits the ship’s port window using the published all-aboard time, activity duration, meeting logistics, transfer time, and a planning margin. It is not a guarantee of ship timing, tour operation, or return.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button
          type="button"
          className="button secondary"
          onClick={handleComputeClick}
          style={{ fontSize: "13px", padding: "6px 14px" }}
        >
          Recalculate Fit
        </button>
      </div>
    </div>
  );
}
