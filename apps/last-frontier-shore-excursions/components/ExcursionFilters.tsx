"use client";

import React, { useState, useMemo } from "react";
import { NormalizedAffiliateExcursion, PortSlug } from "@/lib/affiliate/types";
import { ExcursionCard } from "./ExcursionCard";

interface ExcursionFiltersProps {
  excursions: NormalizedAffiliateExcursion[];
  initialPort?: PortSlug;
  showPortFilter?: boolean;
}

export function ExcursionFilters({
  excursions,
  initialPort,
  showPortFilter = true,
}: ExcursionFiltersProps) {
  const [selectedPort, setSelectedPort] = useState<string>(initialPort || "all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDuration, setSelectedDuration] = useState<string>("all");
  const [selectedPrice, setSelectedPrice] = useState<string>("all");
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);
  const [privateOnly, setPrivateOnly] = useState(false);
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [maxWeatherRisk, setMaxWeatherRisk] = useState<string>("all");

  const filteredExcursions = useMemo(() => {
    return excursions.filter((item) => {
      if (selectedPort !== "all" && item.portSlug !== selectedPort) return false;
      if (selectedCategory !== "all" && !item.tags.includes(selectedCategory) && item.activitySlug !== selectedCategory) return false;

      if (selectedDuration === "under-3") {
        if (item.durationMinutes > 180) return false;
      } else if (selectedDuration === "3-to-5") {
        if (item.durationMinutes < 180 || item.durationMinutes > 300) return false;
      } else if (selectedDuration === "over-5") {
        if (item.durationMinutes < 300) return false;
      }

      if (selectedPrice === "under-150") {
        if (item.priceFrom > 150) return false;
      } else if (selectedPrice === "150-to-300") {
        if (item.priceFrom < 150 || item.priceFrom > 300) return false;
      } else if (selectedPrice === "over-300") {
        if (item.priceFrom < 300) return false;
      }

      if (freeCancellationOnly && !item.cancellationPolicy.toLowerCase().includes("free cancellation")) return false;
      if (privateOnly && item.privateOrShared !== "private") return false;
      if (accessibleOnly && !item.accessibility?.wheelchairAccessible) return false;

      if (maxWeatherRisk === "low-only" && item.weatherSensitivity !== "Low") return false;

      return true;
    });
  }, [
    excursions,
    selectedPort,
    selectedCategory,
    selectedDuration,
    selectedPrice,
    freeCancellationOnly,
    privateOnly,
    accessibleOnly,
    maxWeatherRisk,
  ]);

  return (
    <div>
      {/* Filter Control Bar */}
      <div
        className="card"
        style={{
          background: "#ffffff",
          border: "1px solid var(--line)",
          padding: "18px",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", marginBottom: 12 }}>
          <strong style={{ fontSize: "16px", color: "var(--deep)" }}>
            Filter Tours ({filteredExcursions.length} matches)
          </strong>
          {(selectedPort !== "all" || selectedCategory !== "all" || selectedDuration !== "all" || selectedPrice !== "all" || freeCancellationOnly || privateOnly || accessibleOnly || maxWeatherRisk !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSelectedPort(initialPort || "all");
                setSelectedCategory("all");
                setSelectedDuration("all");
                setSelectedPrice("all");
                setFreeCancellationOnly(false);
                setPrivateOnly(false);
                setAccessibleOnly(false);
                setMaxWeatherRisk("all");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 700,
                textDecoration: "underline",
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {showPortFilter && (
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                Port
              </label>
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                style={{ width: "100%", padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid var(--line)" }}
              >
                <option value="all">All Alaska Ports</option>
                <option value="juneau">Juneau</option>
                <option value="skagway">Skagway</option>
                <option value="ketchikan">Ketchikan</option>
                <option value="sitka">Sitka</option>
                <option value="icy-strait-point">Icy Strait Point</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
              Duration
            </label>
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid var(--line)" }}
            >
              <option value="all">Any Duration</option>
              <option value="under-3">Under 3 Hours</option>
              <option value="3-to-5">3 to 5 Hours</option>
              <option value="over-5">Over 5 Hours</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
              Price Range
            </label>
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid var(--line)" }}
            >
              <option value="all">Any Price</option>
              <option value="under-150">Under $150</option>
              <option value="150-to-300">$150 to $300</option>
              <option value="over-300">$300+</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
              Weather Risk
            </label>
            <select
              value={maxWeatherRisk}
              onChange={(e) => setMaxWeatherRisk(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid var(--line)" }}
            >
              <option value="all">All Weather Risks</option>
              <option value="low-only">Rain-Safe Only (Low Risk)</option>
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 14, paddingTop: 10, borderTop: "1px solid #f0f0f0" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={freeCancellationOnly}
              onChange={(e) => setFreeCancellationOnly(e.target.checked)}
            />
            Free 24h Cancellation
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={accessibleOnly}
              onChange={(e) => setAccessibleOnly(e.target.checked)}
            />
            Wheelchair Accessible
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={privateOnly}
              onChange={(e) => setPrivateOnly(e.target.checked)}
            />
            Private Only
          </label>
        </div>
      </div>

      {/* Excursions Grid */}
      {filteredExcursions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <h3>No excursions match the selected filters</h3>
          <p style={{ color: "var(--muted)", margin: "8px 0 16px" }}>
            Try broadening your duration, price, or mobility filters to review available port options.
          </p>
          <button
            type="button"
            className="button small"
            onClick={() => {
              setSelectedPort(initialPort || "all");
              setSelectedCategory("all");
              setSelectedDuration("all");
              setSelectedPrice("all");
              setFreeCancellationOnly(false);
              setPrivateOnly(false);
              setAccessibleOnly(false);
              setMaxWeatherRisk("all");
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid">
          {filteredExcursions.map((excursion) => (
            <ExcursionCard key={excursion.productId} excursion={excursion} />
          ))}
        </div>
      )}
    </div>
  );
}
