"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Passenger,
  WeightAnalysisResult,
  PILOT_WEIGHT_LBS,
  MAX_PAX_PAYLOAD_LBS,
  MAX_GROSS_PAYLOAD_LBS,
  SURCHARGE_THRESHOLD_LBS,
  DEFAULT_6_PAX_SEATS,
  PRESET_PROFILES,
  analyzeHelicopterPayload,
} from "../../lib/payloadMath";

export default function HelicopterCabinSimulator() {
  const [passengers, setPassengers] = useState<Passenger[]>(DEFAULT_6_PAX_SEATS);
  const [selectedSeatId, setSelectedSeatId] = useState<number>(2); // Default to Seat 2 like in Google AI mock
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);

  // Handle party size change
  const handlePartySizeChange = (newSize: number) => {
    const clampedSize = Math.max(1, Math.min(6, newSize));
    if (clampedSize > passengers.length) {
      const added: Passenger[] = DEFAULT_6_PAX_SEATS.slice(passengers.length, clampedSize).map((s) => ({
        ...s,
        weightLbs: 160,
      }));
      setPassengers([...passengers, ...added]);
    } else {
      setPassengers(passengers.slice(0, clampedSize));
      if (selectedSeatId > clampedSize) {
        setSelectedSeatId(clampedSize);
      }
    }
    setActivePresetIndex(-1); // custom
  };

  // Handle weight update for a specific seat
  const handleWeightChange = (id: number, weight: number) => {
    const clampedWeight = Math.max(0, Math.min(400, weight));
    setPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, weightLbs: clampedWeight } : p))
    );
    setActivePresetIndex(-1);
  };

  // Handle preset selection
  const handlePresetSelect = (index: number) => {
    if (index >= 0 && index < PRESET_PROFILES.length) {
      setActivePresetIndex(index);
      const preset = PRESET_PROFILES[index];
      setPassengers(preset.passengers);
      if (selectedSeatId > preset.passengers.length) {
        setSelectedSeatId(preset.passengers.length);
      }
    }
  };

  // Real-time analysis computation
  const analysis: WeightAnalysisResult = useMemo(() => {
    return analyzeHelicopterPayload(passengers);
  }, [passengers]);

  const selectedPassenger = passengers.find((p) => p.id === selectedSeatId) || passengers[0];

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
      {/* Title & Badge */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(158, 217, 255, 0.12)", border: "1px solid rgba(158, 217, 255, 0.25)", fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ice)", marginBottom: 6 }}>
            <span>✈️ FAA Part 135 Weight &amp; Balance</span>
          </div>
          <h2 style={{ margin: 0, fontSize: "clamp(1.2rem, 3vw, 1.55rem)", fontWeight: 900, color: "#fff" }}>
            Juneau Glacier Tour Configuration ({passengers.length} Passenger{passengers.length > 1 ? "s" : ""})
          </h2>
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--muted)", textAlign: "right" }}>
          <span style={{ display: "block" }}>• Surcharges apply if single passenger &ge; 250 lbs</span>
          <span style={{ display: "block" }}>• 6th seat unlock requires strict weight compliance</span>
        </div>
      </div>

      {/* Main Cabin Visual Canvas */}
      <div
        style={{
          position: "relative",
          background: "linear-gradient(180deg, #020910 0%, #061724 100%)",
          border: "1px solid rgba(151, 211, 255, 0.16)",
          borderRadius: 20,
          padding: "26px 16px 20px",
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        {/* Fuselage Outline Arc */}
        <div
          style={{
            position: "relative",
            maxWidth: 620,
            margin: "0 auto",
            minHeight: 240,
            border: "2px solid rgba(158, 217, 255, 0.28)",
            borderRadius: "140px 140px 50px 50px",
            background: "rgba(4, 18, 29, 0.65)",
            padding: "36px 20px 24px",
            boxShadow: "inset 0 0 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          {/* Canopy Windshield Arc Reflection */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "15%",
              right: "15%",
              height: 24,
              borderTop: "2px solid rgba(158, 217, 255, 0.2)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />

          {/* FRONT ROW: S1, S2, Pilot */}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 28 }}>
            {/* Seat 1 */}
            {passengers[0] ? (
              <button
                type="button"
                onClick={() => setSelectedSeatId(1)}
                style={{
                  background: selectedSeatId === 1 ? "rgba(14, 165, 233, 0.35)" : "rgba(13, 148, 136, 0.25)",
                  border: selectedSeatId === 1 ? "2px solid #38bdf8" : "1.5px solid rgba(45, 212, 191, 0.4)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  color: "#fff",
                  minWidth: 72,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "var(--ice)", fontWeight: 700 }}>S1</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 900, fontFamily: "monospace" }}>
                  {passengers[0].weightLbs}#
                </div>
              </button>
            ) : null}

            {/* Seat 2 */}
            {passengers[1] ? (
              <button
                type="button"
                onClick={() => setSelectedSeatId(2)}
                style={{
                  background: selectedSeatId === 2 ? "rgba(14, 165, 233, 0.4)" : "rgba(13, 148, 136, 0.25)",
                  border: selectedSeatId === 2 ? "2px solid #38bdf8" : "1.5px solid rgba(45, 212, 191, 0.4)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  color: "#fff",
                  minWidth: 72,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "var(--ice)", fontWeight: 700 }}>S2</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 900, fontFamily: "monospace" }}>
                  {passengers[1].weightLbs}#
                </div>
              </button>
            ) : null}

            {/* Pilot (Fixed on Right) */}
            <div
              style={{
                background: "rgba(51, 65, 85, 0.35)",
                border: "1.5px dashed rgba(148, 163, 184, 0.4)",
                borderRadius: 12,
                padding: "10px 14px",
                color: "#94a3b8",
                minWidth: 72,
                textAlign: "center",
                userSelect: "none",
              }}
            >
              <div style={{ fontSize: "0.72rem", fontWeight: 700 }}>Pilot</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 800, fontFamily: "monospace" }}>
                {PILOT_WEIGHT_LBS} lb
              </div>
            </div>
          </div>

          {/* DYNAMIC CG CROSSHAIR TARGET */}
          <div
            style={{
              position: "relative",
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "4px 0 16px",
            }}
          >
            {/* Center crosshair dot and target */}
            <div
              style={{
                position: "absolute",
                transform: `translate(${analysis.cgBalance.lateralOffsetPercent * 1.8}px, ${analysis.cgBalance.longitudinalOffsetPercent * 0.4}px)`,
                transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="3 2" />
                <line x1="14" y1="2" x2="14" y2="26" stroke="#eab308" strokeWidth="1.5" />
                <line x1="2" y1="14" x2="26" y2="14" stroke="#eab308" strokeWidth="1.5" />
                <circle cx="14" cy="14" r="3.5" fill="#ef4444" />
              </svg>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#facc15", textShadow: "0 1px 3px rgba(0,0,0,0.8)", whiteSpace: "nowrap" }}>
                CG Balance
              </span>
            </div>
          </div>

          {/* REAR ROW: S3, S4, S5, S6 */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            {[3, 4, 5, 6].map((seatNum) => {
              const p = passengers[seatNum - 1];
              if (!p) {
                return (
                  <div
                    key={seatNum}
                    style={{
                      background: "rgba(15, 23, 42, 0.4)",
                      border: "1px dashed rgba(71, 85, 105, 0.3)",
                      borderRadius: 12,
                      padding: "8px 12px",
                      color: "#475569",
                      minWidth: 64,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.68rem" }}>S{seatNum}</div>
                    <div style={{ fontSize: "0.8rem", fontStyle: "italic" }}>Empty</div>
                  </div>
                );
              }
              const isSelected = selectedSeatId === seatNum;
              const isSurcharge = p.weightLbs >= SURCHARGE_THRESHOLD_LBS;
              return (
                <button
                  key={seatNum}
                  type="button"
                  onClick={() => setSelectedSeatId(seatNum)}
                  style={{
                    background: isSelected
                      ? "rgba(14, 165, 233, 0.4)"
                      : isSurcharge
                      ? "rgba(245, 158, 11, 0.25)"
                      : "rgba(13, 148, 136, 0.25)",
                    border: isSelected
                      ? "2px solid #38bdf8"
                      : isSurcharge
                      ? "1.5px solid #f59e0b"
                      : "1.5px solid rgba(45, 212, 191, 0.4)",
                    borderRadius: 12,
                    padding: "8px 12px",
                    color: "#fff",
                    minWidth: 64,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: isSurcharge ? "#fcd34d" : "var(--ice)", fontWeight: 700 }}>
                    S{seatNum}
                  </div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 900, fontFamily: "monospace" }}>
                    {p.weightLbs}#
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row Captions */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--muted)", marginTop: 14, padding: "0 10px" }}>
          <span>Front Row: Pilot + S1 + S2</span>
          <span>Rear Row: S3 + S4 + S5 + S6</span>
        </div>
      </div>

      {/* METRICS BAR (3 Pillars) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {/* Metric 1: Total Payload */}
        <div
          style={{
            background: "rgba(7, 24, 36, 0.8)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: "14px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 4 }}>
            Total Payload (Pax + Pilot)
          </div>
          <div
            style={{
              fontSize: "1.35rem",
              fontWeight: 900,
              fontFamily: "monospace",
              color:
                analysis.payloadStatus === "overweight"
                  ? "#f87171"
                  : analysis.payloadStatus === "warning"
                  ? "#fbbf24"
                  : "#34d399",
            }}
          >
            {analysis.totalGrossPayload} / {analysis.maxGrossPayload} lbs
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>
            Pax: {analysis.totalPassengerWeight} lbs (Max {MAX_PAX_PAYLOAD_LBS})
          </div>
        </div>

        {/* Metric 2: >250lb Seats Surcharge */}
        <div
          style={{
            background: "rgba(7, 24, 36, 0.8)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: "14px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 4 }}>
            &ge; 250lb Seats
          </div>
          <div
            style={{
              fontSize: "1.35rem",
              fontWeight: 900,
              color: analysis.hasSurcharge ? "#f59e0b" : "#eef6fb",
            }}
          >
            {analysis.surchargeCount} Surcharge{analysis.surchargeCount === 1 ? "" : "s"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>
            {analysis.hasSurcharge ? "Requires comfort seat fee" : "No comfort surcharges"}
          </div>
        </div>

        {/* Metric 3: 6th Seat Unlock Probability */}
        <div
          style={{
            background: "rgba(7, 24, 36, 0.8)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: "14px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 4 }}>
            6th Seat Unlock
          </div>
          <div
            style={{
              fontSize: "1.35rem",
              fontWeight: 900,
              color:
                analysis.sixthSeatProbability === "high"
                  ? "#34d399"
                  : analysis.sixthSeatProbability === "medium"
                  ? "#fbbf24"
                  : analysis.sixthSeatProbability === "low"
                  ? "#f87171"
                  : "var(--muted)",
            }}
          >
            {analysis.sixthSeatProbability !== "not-applicable"
              ? `${analysis.sixthSeatPercent}% Prob`
              : "N/A (<5 Pax)"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>
            {analysis.sixthSeatProbability === "high"
              ? "High direct dispatch odds"
              : analysis.sixthSeatProbability === "medium"
              ? "Possible manual override"
              : analysis.sixthSeatProbability === "low"
              ? "Likely 2 aircraft required"
              : "Party fits in 1 aircraft"}
          </div>
        </div>
      </div>

      {/* INTERACTIVE CONTROLS SECTION */}
      <div
        style={{
          background: "rgba(3, 14, 23, 0.7)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: "20px 18px",
          marginBottom: 20,
        }}
      >
        {/* Preset Selector */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ice)", marginBottom: 6 }}>
            Passenger Weight Profile Presets
          </label>
          <select
            value={activePresetIndex}
            onChange={(e) => handlePresetSelect(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "#081d2c",
              border: "1px solid var(--line)",
              borderRadius: 10,
              color: "#fff",
              fontSize: "0.92rem",
              cursor: "pointer",
            }}
          >
            {PRESET_PROFILES.map((preset, idx) => (
              <option key={idx} value={idx}>
                {preset.label}
              </option>
            ))}
            {activePresetIndex === -1 && <option value={-1}>Custom Weights Configuration</option>}
          </select>
        </div>

        {/* Party Size Buttons */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ice)" }}>
              Total Group Size (1–6 Passengers)
            </label>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>AStar max = 6 pax + pilot</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePartySizeChange(num)}
                style={{
                  padding: "8px 0",
                  borderRadius: 8,
                  border: passengers.length === num ? "2px solid var(--ice)" : "1px solid var(--line)",
                  background: passengers.length === num ? "rgba(158, 217, 255, 0.25)" : "rgba(8, 28, 42, 0.6)",
                  color: passengers.length === num ? "#fff" : "var(--muted)",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Seat Weight Configuration */}
        <div
          style={{
            background: "rgba(8, 28, 42, 0.8)",
            border: "1px solid rgba(158, 217, 255, 0.2)",
            borderRadius: 12,
            padding: "16px",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text)" }}>
                Select Seat to Adjust:
              </label>
              <select
                value={selectedSeatId}
                onChange={(e) => setSelectedSeatId(Number(e.target.value))}
                style={{
                  padding: "6px 12px",
                  background: "#030f19",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  color: "var(--ice)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                }}
              >
                {passengers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.seatLabel} ({p.weightLbs} lbs)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Weight:</span>
              <input
                type="number"
                min="60"
                max="380"
                value={selectedPassenger?.weightLbs || 0}
                onChange={(e) => handleWeightChange(selectedSeatId, Number(e.target.value))}
                style={{
                  width: 80,
                  padding: "6px 10px",
                  background: "#020910",
                  border: selectedPassenger?.weightLbs >= SURCHARGE_THRESHOLD_LBS ? "1.5px solid #f59e0b" : "1px solid var(--line)",
                  borderRadius: 8,
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: "1rem",
                  fontWeight: 900,
                  textAlign: "center",
                }}
              />
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--ice)" }}>lbs</span>
            </div>
          </div>

          {/* Slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", width: 48 }}>90 lbs</span>
            <input
              type="range"
              min="90"
              max="350"
              step="5"
              value={selectedPassenger?.weightLbs || 160}
              onChange={(e) => handleWeightChange(selectedSeatId, Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: selectedPassenger?.weightLbs >= SURCHARGE_THRESHOLD_LBS ? "#f59e0b" : "#38bdf8",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", width: 55, textAlign: "right" }}>350 lbs</span>
          </div>

          {selectedPassenger?.weightLbs >= SURCHARGE_THRESHOLD_LBS && (
            <div style={{ marginTop: 10, fontSize: "0.78rem", color: "#fcd34d", display: "flex", alignItems: "center", gap: 6 }}>
              <span>⚠️</span>
              <span>
                <strong>{selectedPassenger.seatLabel}</strong> reaches the 250 lb threshold. Operators will require reserving a comfort seat or paying a single-seat weight surcharge.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* DISPATCH LOGISTICS EVALUATION CARD */}
      <div
        style={{
          background:
            analysis.payloadStatus === "overweight"
              ? "rgba(127, 29, 29, 0.25)"
              : analysis.hasSurcharge
              ? "rgba(120, 53, 15, 0.25)"
              : "rgba(6, 78, 59, 0.25)",
          border:
            analysis.payloadStatus === "overweight"
              ? "1px solid rgba(239, 68, 68, 0.45)"
              : analysis.hasSurcharge
              ? "1px solid rgba(245, 158, 11, 0.45)"
              : "1px solid rgba(16, 185, 129, 0.45)",
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: "1.1rem" }}>
            {analysis.payloadStatus === "overweight" ? "🚨" : analysis.hasSurcharge ? "⚠️" : "✓"}
          </span>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color:
                analysis.payloadStatus === "overweight"
                  ? "#fca5a5"
                  : analysis.hasSurcharge
                  ? "#fde68a"
                  : "#6ee7b7",
            }}
          >
            {analysis.payloadStatus === "overweight"
              ? "PAYLOAD OVERWEIGHT: DUAL AIRCRAFT REQUIRED"
              : analysis.hasSurcharge
              ? "PAYLOAD STABLE (COMFORT SURCHARGE APPLIES)"
              : "PAYLOAD STABLE: WITHIN FAA TAKEOFF MARGIN"}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.55, color: "var(--text)" }}>
          {analysis.strategyRecommendation}
        </p>
      </div>

      {/* ACTION CTA: Request Availability with Pre-Calculated Data */}
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <Link
          href="#waitlist"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "#fff",
            textDecoration: "none",
            padding: "12px 24px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: "0.92rem",
            boxShadow: "0 8px 24px rgba(2, 132, 199, 0.35)",
          }}
        >
          <span>Request Dispatch Check with Party Weights ({passengers.length} Pax, {analysis.totalPassengerWeight} lbs)</span>
          <span>&darr;</span>
        </Link>
      </div>
    </div>
  );
}
