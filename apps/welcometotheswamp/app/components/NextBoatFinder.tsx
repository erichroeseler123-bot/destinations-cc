"use client";

import React, { useState, useEffect, useId, useRef } from "react";
import { FINDER_PLAN_KEY, readFinderPlan } from "../../lib/finderPlan";
import {
  getTodayNewOrleansDate,
  getTomorrowNewOrleansDate,
} from "../../lib/timezone";
import type { TourDeparture } from "../../lib/providerAdapter";
import type { SearchResponse } from "../../lib/searchEngine";

export default function NextBoatFinder() {
  const fieldId = useId();
  const [todayDate, setTodayDate] = useState("");
  const [tomorrowDate, setTomorrowDate] = useState("");
  const [selectedDateMode, setSelectedDateMode] = useState<"today" | "tomorrow" | "custom">("today");
  const [customDate, setCustomDate] = useState("");

  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [transportation, setTransportation] = useState<"hotel_pickup" | "self_drive" | "either">("hotel_pickup");
  const [boatType, setBoatType] = useState<"small_airboat" | "large_airboat" | "any">("any");
  const [planReady, setPlanReady] = useState(false);
  const requestVersion = useRef(0);
  const searchController = useRef<AbortController | null>(null);
  const verificationController = useRef<AbortController | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Interactive Live Seat Verification State
  const [verifyingDepId, setVerifyingDepId] = useState<string | null>(null);
  const [verifiedBadges, setVerifiedBadges] = useState<
    Record<string, { text: string; isLive: boolean; note?: string }>
  >({});

  const clearResults = () => {
    requestVersion.current += 1;
    searchController.current?.abort();
    verificationController.current?.abort();
    setIsSearching(false);
    setSearchResponse(null);
    setSearchError(null);
    setVerifiedBadges({});
    setVerifyingDepId(null);
  };

  useEffect(() => () => {
    requestVersion.current += 1;
    searchController.current?.abort();
    verificationController.current?.abort();
  }, []);

  const handleVerifyDeparture = async (dep: TourDeparture) => {
    verificationController.current?.abort();
    const controller = new AbortController();
    verificationController.current = controller;
    const version = requestVersion.current;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setVerifyingDepId(dep.id);
    try {
      const res = await fetch("/api/availability/confirm", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: dep.provider,
          productCode: dep.productCode,
          optionCode: dep.optionCode,
          travelDate: activeDate,
          departureTime: dep.departureTime,
          adults,
          childrenAges,
        }),
      });
      const data = await res.json();
      if (version !== requestVersion.current || controller.signal.aborted) return;
      if (res.ok && data.ok) {
        setVerifiedBadges((prev) => ({
          ...prev,
          [dep.id]: {
            text: data.statusText,
            isLive: data.availabilityType === "live_inventory",
            note: data.message,
          },
        }));
      } else throw new Error("Seat check unavailable");
    } catch {
      if (version === requestVersion.current && verificationController.current === controller) {
        setVerifiedBadges((prev) => ({ ...prev, [dep.id]: {
          text: "Seat check unavailable",
          isLive: false,
          note: "Please retry or confirm availability directly at checkout.",
        } }));
      }
    } finally {
      clearTimeout(timeout);
      if (version === requestVersion.current && verificationController.current === controller) setVerifyingDepId(null);
    }
  };

  useEffect(() => {
    const today = getTodayNewOrleansDate();
    const tomorrow = getTomorrowNewOrleansDate();
    setTodayDate(today);
    setTomorrowDate(tomorrow);
    setCustomDate(today);
    try {
      const saved = readFinderPlan(sessionStorage.getItem(FINDER_PLAN_KEY), today);
      if (saved) {
        setSelectedDateMode(saved.travelDate === today ? "today" : saved.travelDate === tomorrow ? "tomorrow" : "custom");
        setCustomDate(saved.travelDate);
        setAdults(saved.adults);
        setChildrenCount(saved.childrenAges.length);
        setChildrenAges(saved.childrenAges);
        setTransportation(saved.transportation);
        setBoatType(saved.boatType);
      }
    } catch {
      // Storage may be disabled; the finder remains usable without persistence.
    }
    setPlanReady(true);
  }, []);

  const handleChildrenCountChange = (count: number) => {
    const newCount = Math.max(0, count);
    setChildrenCount(newCount);
    if (newCount > childrenAges.length) {
      const added = Array(newCount - childrenAges.length).fill(8);
      setChildrenAges([...childrenAges, ...added]);
    } else {
      setChildrenAges(childrenAges.slice(0, newCount));
    }
  };

  const handleChildAgeChange = (index: number, age: number) => {
    const updated = [...childrenAges];
    updated[index] = age;
    setChildrenAges(updated);
  };

  const activeDate =
    selectedDateMode === "today"
      ? todayDate
      : selectedDateMode === "tomorrow"
      ? tomorrowDate
      : customDate;

  const totalTravelers = adults + childrenAges.length;
  const hasChildUnder2 = childrenAges.some((age) => age < 2);
  const hasChildUnder5 = childrenAges.some((age) => age < 5);

  const boatRecommendationText =
    boatType === "small_airboat"
      ? hasChildUnder2
        ? "Small Airboat selected (connected airboat options require Min Age 2; small airboats require Min Age 5)"
        : totalTravelers > 25
        ? "Small Airboat selected (small airboat options fit up to 10 passengers; connected airboat options fit up to 25 passengers)"
        : hasChildUnder5
        ? "Small Airboat selected (small airboats require Min Age 5; switch to Large Airboat or Any Airboat for ages 2–4)"
        : totalTravelers > 10
        ? "Small Airboat selected (small airboat options fit up to 10 passengers; switch to Large Airboat or Any Airboat for larger groups)"
        : "Small Airboat (6–9 passengers, Min Age 5)"
      : boatType === "large_airboat"
      ? hasChildUnder2
        ? "Large Airboat selected (connected large airboat options require Min Age 2)"
        : totalTravelers > 25
        ? "Large Airboat selected (connected large airboat options fit up to 25 passengers)"
        : "Large Airboat (15–30 passengers, Min Age 2)"
      : hasChildUnder2
      ? "Any Airboat (connected airboat options require Min Age 2; no matching airboat departures for children under age 2)"
      : totalTravelers > 25
      ? "Any Airboat (connected airboat options fit up to 25 passengers)"
      : hasChildUnder5
      ? "Any Airboat (matching Large Airboat options for children ages 2–4)"
      : totalTravelers > 10
      ? "Any Airboat (matching Large Airboat options for groups over 10)"
      : "Any Airboat (Small or Large Airboat)";

  const pickupRecommendationText =
    transportation === "hotel_pickup"
      ? "French Quarter / Hotel Pickup"
      : transportation === "self_drive"
      ? "Self-Drive (Meet at Dock)"
      : "Either Hotel Pickup or Self-Drive";

  const partySummaryText = `${totalTravelers} ${totalTravelers === 1 ? "traveler" : "travelers"} (${adults} ${
    adults === 1 ? "adult" : "adults"
  }${
    childrenAges.length > 0
      ? `, ${childrenAges.length} ${childrenAges.length === 1 ? "child" : "children"} ages ${childrenAges.join(", ")}`
      : ""
  })${activeDate ? ` on ${activeDate}` : ""}`;

  useEffect(() => {
    if (!planReady) return;
    try {
      sessionStorage.setItem(FINDER_PLAN_KEY, JSON.stringify({
        version: 1, travelDate: activeDate, adults, childrenAges, transportation, boatType,
      }));
    } catch {
      // Private browsing/storage limits must not prevent searching.
    }
  }, [planReady, activeDate, adults, childrenAges, transportation, boatType]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearResults();
    const version = requestVersion.current;
    const controller = new AbortController();
    searchController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travelDate: activeDate,
          adults,
          childrenAges,
          transportation,
          boatType,
        }),
      });

      const data = await res.json();
      if (version !== requestVersion.current || controller.signal.aborted) return;
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to search availability.");
      }

      setSearchResponse(data.data);
    } catch (err: any) {
      if (version === requestVersion.current) {
        setSearchError(controller.signal.aborted
          ? "The search took too long. Please try again with the choices shown above."
          : err?.message || "Search failed. Please try again.");
      }
    } finally {
      clearTimeout(timeout);
      if (version === requestVersion.current) setIsSearching(false);
    }
  };

  return (
    <section className="wts-finder-card" style={{
      background: "#1c1917",
      color: "#f5f5f4",
      padding: "clamp(1rem, 4vw, 2rem)",
      borderRadius: "1rem",
      border: "1px solid #292524",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
      maxWidth: "52rem",
      margin: "0 auto 2.5rem auto",
      boxSizing: "border-box"
    }}>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <p style={{
          color: "#fbbf24",
          fontSize: "0.85rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          margin: "0 0 0.5rem 0"
        }}>
          How do I find the next airboat departure?
        </p>
        <h2 style={{
          fontSize: "clamp(1.35rem, 5vw, 1.85rem)",
          fontWeight: 900,
          margin: 0,
          color: "#ffffff",
          lineHeight: 1.25,
          wordBreak: "normal",
          overflowWrap: "break-word"
        }}>
          Compare and Book New Orleans Swamp & Airboat Tours
        </h2>
        <p style={{ color: "#a8a29e", fontSize: "0.95rem", margin: "0.5rem 0 0 0" }}>
          Find upcoming departures that fit your group, transportation needs, and schedule—all in one place.
        </p>
      </div>

      <form onSubmit={handleSearch} onChangeCapture={clearResults} aria-busy={isSearching} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* WHEN SELECTOR */}
        <div>
          <label id={`${fieldId}-when-label`} style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#d6d3d1", marginBottom: "0.5rem" }}>
            1. When are you going? (New Orleans Time)
          </label>
          <div role="group" aria-labelledby={`${fieldId}-when-label`} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
            <button
              type="button"
              aria-pressed={selectedDateMode === "today"}
              onClick={() => { clearResults(); setSelectedDateMode("today"); }}
              style={{
                padding: "0.75rem 0.5rem",
                borderRadius: "0.5rem",
                border: selectedDateMode === "today" ? "2px solid #fbbf24" : "1px solid #44403c",
                background: selectedDateMode === "today" ? "#292524" : "#0c0a09",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              Today ({todayDate})
            </button>
            <button
              type="button"
              aria-pressed={selectedDateMode === "tomorrow"}
              onClick={() => { clearResults(); setSelectedDateMode("tomorrow"); }}
              style={{
                padding: "0.75rem 0.5rem",
                borderRadius: "0.5rem",
                border: selectedDateMode === "tomorrow" ? "2px solid #fbbf24" : "1px solid #44403c",
                background: selectedDateMode === "tomorrow" ? "#292524" : "#0c0a09",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              Tomorrow ({tomorrowDate})
            </button>
            <button
              type="button"
              aria-pressed={selectedDateMode === "custom"}
              onClick={() => { clearResults(); setSelectedDateMode("custom"); }}
              style={{
                padding: "0.75rem 0.5rem",
                borderRadius: "0.5rem",
                border: selectedDateMode === "custom" ? "2px solid #fbbf24" : "1px solid #44403c",
                background: selectedDateMode === "custom" ? "#292524" : "#0c0a09",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              Pick Date
            </button>
          </div>
          {selectedDateMode === "custom" && (
            <div style={{ marginTop: "0.5rem" }}>
              <input
                type="date"
                aria-label="Tour date (New Orleans time)"
                value={customDate}
                min={todayDate}
                onChange={(e) => setCustomDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "0.5rem",
                  background: "#0c0a09",
                  border: "1px solid #44403c",
                  color: "#ffffff"
                }}
              />
            </div>
          )}
        </div>

        {/* WHO SELECTOR */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#d6d3d1", marginBottom: "0.5rem" }}>
            2. Who is in your group?
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            <div>
              <label htmlFor={`${fieldId}-adults`} style={{ fontSize: "0.8rem", color: "#a8a29e" }}>Adults (Age 13+)</label>
              <select
                id={`${fieldId}-adults`}
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value, 10))}
                style={{
                  width: "100%",
                  marginTop: "0.25rem",
                  padding: "0.6rem",
                  borderRadius: "0.5rem",
                  background: "#0c0a09",
                  border: "1px solid #44403c",
                  color: "#ffffff"
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((num) => (
                  <option key={num} value={num}>{num} Adult{num > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${fieldId}-children`} style={{ fontSize: "0.8rem", color: "#a8a29e" }}>Children (Age 0–12)</label>
              <select
                id={`${fieldId}-children`}
                value={childrenCount}
                onChange={(e) => handleChildrenCountChange(parseInt(e.target.value, 10))}
                style={{
                  width: "100%",
                  marginTop: "0.25rem",
                  padding: "0.6rem",
                  borderRadius: "0.5rem",
                  background: "#0c0a09",
                  border: "1px solid #44403c",
                  color: "#ffffff"
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 8].map((num) => (
                  <option key={num} value={num}>{num} {num === 1 ? "Child" : "Children"}</option>
                ))}
              </select>
            </div>
          </div>

          {/* DYNAMIC CHILD AGES */}
          {childrenCount > 0 && (
            <div style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              background: "#0c0a09",
              borderRadius: "0.5rem",
              border: "1px solid #333"
            }}>
              <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", color: "#fbbf24", fontWeight: 600 }}>
                Children's ages are required to check vessel eligibility (such as small airboat minimum age rules) and family pricing:
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {childrenAges.map((age, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <label htmlFor={`${fieldId}-child-age-${idx}`} style={{ fontSize: "0.8rem", color: "#d6d3d1" }}>Child {idx + 1}:</label>
                    <select
                      id={`${fieldId}-child-age-${idx}`}
                      value={age}
                      onChange={(e) => handleChildAgeChange(idx, parseInt(e.target.value, 10))}
                      style={{
                        padding: "0.35rem 0.5rem",
                        borderRadius: "0.35rem",
                        background: "#1c1917",
                        border: "1px solid #444",
                        color: "#fff",
                        fontSize: "0.85rem"
                      }}
                    >
                      {Array.from({ length: 13 }, (_, i) => i).map((a) => (
                        <option key={a} value={a}>{a} yrs</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LOGISTICS & BOAT PREFERENCE */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div>
            <label htmlFor={`${fieldId}-transportation`} style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#d6d3d1", marginBottom: "0.25rem" }}>
              3. Transportation
            </label>
            <select
              id={`${fieldId}-transportation`}
              value={transportation}
              onChange={(e) => setTransportation(e.target.value as any)}
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "0.5rem",
                background: "#0c0a09",
                border: "1px solid #44403c",
                color: "#ffffff"
              }}
            >
              <option value="hotel_pickup">French Quarter / Hotel Pickup</option>
              <option value="self_drive">Self-Drive (Meet at Dock)</option>
              <option value="either">Either / Show All</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${fieldId}-boat-type`} style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#d6d3d1", marginBottom: "0.25rem" }}>
              4. Boat Size Preference
            </label>
            <select
              id={`${fieldId}-boat-type`}
              value={boatType}
              onChange={(e) => setBoatType(e.target.value as any)}
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "0.5rem",
                background: "#0c0a09",
                border: "1px solid #44403c",
                color: "#ffffff"
              }}
            >
              <option value="any">Any Airboat</option>
              <option value="small_airboat">Small Airboat (6–9 passengers)</option>
              <option value="large_airboat">Large Airboat (15–30 passengers)</option>
            </select>
          </div>
        </div>

        {/* MATCHED RECOMMENDATION SUMMARY REGION */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            padding: "0.75rem 0.9rem",
            borderRadius: "0.5rem",
            background: "#0c0a09",
            border: "1px solid #44403c",
            fontSize: "0.85rem",
            lineHeight: 1.45,
            color: "#d6d3d1",
            maxWidth: "100%",
            boxSizing: "border-box",
            overflowWrap: "anywhere",
          }}
        >
          <strong style={{ color: "#fbbf24" }}>Matched recommendation summary: </strong>
          <span>
            {boatRecommendationText} • {pickupRecommendationText} • {partySummaryText}.
          </span>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <button
            type="submit"
            disabled={isSearching || !planReady || !activeDate}
            style={{
              flex: "1",
              padding: "0.9rem 1.5rem",
              background: "#fbbf24",
              color: "#0c0a09",
              fontWeight: 800,
              fontSize: "1.05rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: isSearching ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(251, 191, 36, 0.3)"
            }}
          >
            {isSearching ? "Checking Live Departures..." : "Find Next Available Departure"}
          </button>
        </div>
      </form>

      {/* SEARCH ERROR */}
      {searchError && (
        <div role="alert" style={{ marginTop: "1.5rem", padding: "1rem", background: "#450a0a", borderRadius: "0.5rem", border: "1px solid #ef4444" }}>
          <p style={{ color: "#fca5a5", margin: 0, fontWeight: 600 }}>{searchError}</p>
        </div>
      )}

      {/* SEARCH RESULTS DISPLAY */}
      <div aria-live="polite" aria-atomic="false">
      {isSearching && <p role="status">Checking departures for your current choices…</p>}
      {searchResponse && (
        <div style={{ marginTop: "2rem", borderTop: "1px solid #333", paddingTop: "1.5rem" }}>
          {/* STATE BANNER */}
          {searchResponse.state === "AVAILABLE" && (
            <div style={{ padding: "0.75rem 1rem", background: "#064e3b", borderRadius: "0.5rem", border: "1px solid #10b981", marginBottom: "1rem" }}>
              <span style={{ fontWeight: 700, color: "#6ee7b7" }}>
                ✓ {searchResponse.summaryMessage}
              </span>
            </div>
          )}

          {searchResponse.state === "PARTIAL" && (
            <div style={{ padding: "0.75rem 1rem", background: "#451a03", borderRadius: "0.5rem", border: "1px solid #f59e0b", marginBottom: "1rem" }}>
              <span style={{ fontWeight: 700, color: "#fcd34d" }}>
                ⚠️ {searchResponse.summaryMessage}
              </span>
            </div>
          )}

          {searchResponse.state === "NO_MATCH" && (
            <div style={{ padding: "1rem", background: "#292524", borderRadius: "0.5rem", border: "1px solid #444", marginBottom: "1rem" }}>
              <h3 style={{ color: "#fbbf24", margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
                No matching departures found
              </h3>
              <p style={{ color: "#d6d3d1", fontSize: "0.9rem", margin: 0 }}>
                All connected options for your group ({searchResponse.totalGroupSize} travelers) on {searchResponse.travelDate} are either booked, past cutoff deadlines, or do not fit vessel age requirements. Try adjusting your party size, date, or transportation choice.
              </p>
            </div>
          )}

          {searchResponse.state === "UNCHECKED" && (
            <div style={{ padding: "1rem", background: "#3b0764", borderRadius: "0.5rem", border: "1px solid #9333ea", marginBottom: "1rem" }}>
              <h3 style={{ color: "#d8b4fe", margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
                We couldn't check availability right now
              </h3>
              <p style={{ color: "#e9d5ff", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
                Live provider connections are currently unreachable. You can view schedules or check directly on the provider websites below.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <a
                  href="https://welcometotheswamp.com/tours/airboat-tour"
                  className="wts-button"
                  style={{ display: "inline-block", padding: "0.5rem 1rem", background: "#9333ea", color: "#fff", textDecoration: "none", borderRadius: "4px", fontSize: "0.85rem", fontWeight: 700 }}
                >
                  Ragin Cajun Airboat Direct →
                </a>
                <a
                  href="https://www.viator.com/tours/New-Orleans/New-Orleans-Airboat-Tour/d675-112604P2"
                  className="wts-button"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-block", padding: "0.5rem 1rem", background: "#444", color: "#fff", textDecoration: "none", borderRadius: "4px", fontSize: "0.85rem", fontWeight: 700 }}
                >
                  Viator Airboat Listings →
                </a>
              </div>
            </div>
          )}

          {/* WINNING DEPARTURE CARD */}
          {searchResponse.winningDeparture && (
            <div style={{
              background: "#0c0a09",
              border: searchResponse.winningDeparture.availabilityType === "live_inventory" ? "2px solid #10b981" : "2px solid #f59e0b",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                    <span style={{
                      background: (verifiedBadges[searchResponse.winningDeparture.id]?.isLive ?? (searchResponse.winningDeparture.availabilityType === "live_inventory")) ? "#065f46" : "#292524",
                      color: (verifiedBadges[searchResponse.winningDeparture.id]?.isLive ?? (searchResponse.winningDeparture.availabilityType === "live_inventory")) ? "#6ee7b7" : "#fcd34d",
                      border: (verifiedBadges[searchResponse.winningDeparture.id]?.isLive ?? (searchResponse.winningDeparture.availabilityType === "live_inventory")) ? "1px solid #10b981" : "1px solid #78716c",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>
                      {verifiedBadges[searchResponse.winningDeparture.id]?.text || searchResponse.winningDeparture.availabilityStatusText}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleVerifyDeparture(searchResponse.winningDeparture!)}
                      disabled={verifyingDepId === searchResponse.winningDeparture.id}
                      style={{
                        background: "#292524",
                        border: "1px solid #78716c",
                        color: "#fbbf24",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      {verifyingDepId === searchResponse.winningDeparture.id ? "Checking Seats..." : "Check Seats & Booking Options"}
                    </button>
                  </div>
                  {verifiedBadges[searchResponse.winningDeparture.id]?.note && (
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#a8a29e", marginBottom: "0.35rem" }}>
                      ℹ️ {verifiedBadges[searchResponse.winningDeparture.id]?.note}
                    </span>
                  )}
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", margin: "0.5rem 0 0.25rem 0" }}>
                    {searchResponse.winningDeparture.departureTimeDisplay} Departure
                  </h3>
                  <p style={{ color: "#fbbf24", fontWeight: 700, margin: 0, fontSize: "0.95rem" }}>
                    {searchResponse.winningDeparture.operatorName} • {searchResponse.winningDeparture.title}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.8rem", color: "#a8a29e" }}>Base Fare ({searchResponse.totalGroupSize} travelers):</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#10b981" }}>
                    ${searchResponse.winningDeparture.totalPrice}
                  </div>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#a8a29e", marginTop: "2px" }}>
                    ${searchResponse.winningDeparture.pricePerAdult}/person base • Booking fees may apply; confirm total at checkout
                  </span>
                </div>
              </div>

              {/* TIMELINE DETAILS */}
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#1c1917", borderRadius: "0.5rem", fontSize: "0.85rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                {searchResponse.winningDeparture.transportation === "hotel_pickup" && searchResponse.winningDeparture.pickupWindowDisplay ? (
                  <div>
                    <strong style={{ color: "#d6d3d1" }}>Hotel Pickup Scheduled:</strong>
                    <p style={{ margin: "2px 0 0 0", color: "#fbbf24" }}>
                      {searchResponse.winningDeparture.pickupWindowDisplay}
                      <span style={{ display: "block", fontSize: "0.75rem", color: "#a8a29e" }}>
                        Operator policy: pickup is 1 hr 15 min prior to tour. Select your hotel at checkout.
                      </span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: "#d6d3d1" }}>Self-Drive Check-In:</strong>
                    <p style={{ margin: "2px 0 0 0", color: "#fbbf24" }}>Arrive 30 min prior ({searchResponse.winningDeparture.dockArrivalTimeDisplay})</p>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#a8a29e", marginTop: "2px" }}>
                      Meeting location: Operators use multiple launch locations. Confirm your exact dock address and directions in your booking confirmation.
                    </span>
                  </div>
                )}
                <div>
                  <strong style={{ color: "#d6d3d1" }}>Boat Type & Age:</strong>
                  <p style={{ margin: "2px 0 0 0", color: "#a8a29e" }}>
                    {searchResponse.winningDeparture.boatType === "small_airboat" ? "Small Airboat (Min Age 5)" : "Large Airboat (All Ages)"}
                  </p>
                </div>
              </div>

              {/* PROMINENT BOOKING SECTION */}
              <div style={{
                marginTop: "1.25rem",
                padding: "1rem",
                background: "#1c1917",
                borderRadius: "0.5rem",
                border: "1px solid #333",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem"
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#ffffff" }}>
                    Choose your tour here and complete your reservation through the checkout shown.
                  </p>
                  <span style={{ fontSize: "0.78rem", color: "#a8a29e", marginTop: "2px", display: "block" }}>
                    {searchResponse.winningDeparture.availabilityStatusText}
                  </span>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.78rem", color: "#fcd34d" }}>
                    Important: You will re-select your date, departure time, and passenger count on the operator's checkout screen.
                  </p>
                </div>
                <a
                  href={searchResponse.winningDeparture.bookingUrl}
                  target={searchResponse.winningDeparture.bookingUrl.includes("welcometotheswamp.com/tours/") ? undefined : "_blank"}
                  rel={searchResponse.winningDeparture.bookingUrl.includes("welcometotheswamp.com/tours/") ? undefined : "noopener noreferrer"}
                  style={{
                    padding: "0.85rem 1.75rem",
                    background: "#fbbf24",
                    color: "#0c0a09",
                    fontWeight: 900,
                    borderRadius: "0.5rem",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(251, 191, 36, 0.3)",
                    whiteSpace: "normal",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    overflowWrap: "anywhere"
                  }}
                >
                  {searchResponse.winningDeparture.bookingUrl.includes("/checkout") || searchResponse.winningDeparture.bookingUrl.includes("/book") || searchResponse.winningDeparture.bookingUrl.includes("fareharbor.com/embeds/book")
                    ? "Continue to Checkout →"
                    : "View Tour & Booking Options →"}
                </a>
              </div>
            </div>
          )}

          {/* OTHER DEPARTURES */}
          {searchResponse.allDepartures.length > 1 && (
            <div>
              <h4 style={{ fontSize: "1rem", color: "#d6d3d1", marginBottom: "0.25rem" }}>
                Later Departures Today:
              </h4>
              <p style={{ fontSize: "0.78rem", color: "#a8a29e", margin: "0 0 0.75rem 0" }}>
                Departures link directly to operator checkout, where you will re-select your date, time, and passenger count.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {searchResponse.allDepartures.slice(1).map((dep) => (
                  <div key={dep.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0c0a09", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #333", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <strong style={{ color: "#fff" }}>{dep.departureTimeDisplay}</strong>
                      <span style={{
                        marginLeft: "0.5rem",
                        background: (verifiedBadges[dep.id]?.isLive ?? (dep.availabilityType === "live_inventory")) ? "#064e3b" : "#292524",
                        color: (verifiedBadges[dep.id]?.isLive ?? (dep.availabilityType === "live_inventory")) ? "#6ee7b7" : "#fcd34d",
                        border: (verifiedBadges[dep.id]?.isLive ?? (dep.availabilityType === "live_inventory")) ? "1px solid #10b981" : "1px solid #78716c",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "3px",
                        fontSize: "0.7rem",
                        fontWeight: 700
                      }}>
                        {verifiedBadges[dep.id]?.text || dep.availabilityStatusText}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleVerifyDeparture(dep)}
                        disabled={verifyingDepId === dep.id}
                        style={{
                          marginLeft: "0.5rem",
                          background: "#292524",
                          border: "1px solid #78716c",
                          color: "#fbbf24",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.4rem",
                          borderRadius: "3px",
                          cursor: "pointer",
                        }}
                      >
                        {verifyingDepId === dep.id ? "Checking..." : "Check Seats & Booking Options"}
                      </button>
                      <span style={{ marginLeft: "0.5rem", color: "#a8a29e", fontSize: "0.85rem" }}>
                        {dep.operatorName} ({dep.transportation === "hotel_pickup" ? "With Pickup" : "Self-Drive"})
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ color: "#10b981", fontWeight: 700 }}>${dep.totalPrice} base</span>
                        <span style={{ display: "block", fontSize: "0.68rem", color: "#a8a29e" }}>Fees may apply</span>
                      </div>
                      <a
                        href={dep.bookingUrl}
                        target={dep.bookingUrl.includes("welcometotheswamp.com/tours/") ? undefined : "_blank"}
                        rel={dep.bookingUrl.includes("welcometotheswamp.com/tours/") ? undefined : "noopener noreferrer"}
                        style={{ padding: "0.45rem 0.9rem", background: "#fbbf24", color: "#0c0a09", textDecoration: "none", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 800 }}
                      >
                        {dep.bookingUrl.includes("/checkout") || dep.bookingUrl.includes("/book") || dep.bookingUrl.includes("fareharbor.com/embeds/book")
                          ? "Continue to Checkout →"
                          : "View Tour & Booking Options →"}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </section>
  );
}
