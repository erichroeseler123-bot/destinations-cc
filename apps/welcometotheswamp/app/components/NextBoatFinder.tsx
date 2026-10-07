"use client";

import React, { useState, useEffect } from "react";
import {
  getTodayNewOrleansDate,
  getTomorrowNewOrleansDate,
} from "../../lib/timezone";
import type { TourDeparture } from "../../lib/providerAdapter";
import type { SearchResponse } from "../../lib/searchEngine";

export default function NextBoatFinder() {
  const [todayDate, setTodayDate] = useState("");
  const [tomorrowDate, setTomorrowDate] = useState("");
  const [selectedDateMode, setSelectedDateMode] = useState<"today" | "tomorrow" | "custom">("today");
  const [customDate, setCustomDate] = useState("");

  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [transportation, setTransportation] = useState<"hotel_pickup" | "self_drive" | "either">("hotel_pickup");
  const [boatType, setBoatType] = useState<"small_airboat" | "large_airboat" | "any">("any");

  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Waitlist Enrollment State
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistWindow, setWaitlistWindow] = useState<"any" | "morning" | "afternoon">("any");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState<{
    submissionId: string;
    message: string;
    unsubscribeUrl: string;
  } | null>(null);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  useEffect(() => {
    const today = getTodayNewOrleansDate();
    const tomorrow = getTomorrowNewOrleansDate();
    setTodayDate(today);
    setTomorrowDate(tomorrow);
    setCustomDate(today);
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

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setSearchError(null);
    setWaitlistSuccess(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
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
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to search availability.");
      }

      setSearchResponse(data.data);
      if (data.data.state === "NO_MATCH") {
        setShowWaitlist(true);
      }
    } catch (err: any) {
      setSearchError(err?.message || "Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleEnrollWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistSubmitting(true);
    setWaitlistError(null);

    try {
      const res = await fetch("/api/waitlist/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: waitlistEmail,
          name: waitlistName,
          travelDate: activeDate,
          adults,
          childrenCount,
          childrenAges,
          transportation,
          boatType,
          timeWindow: waitlistWindow,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to enroll.");
      }

      setWaitlistSuccess({
        submissionId: data.submissionId,
        message: data.message,
        unsubscribeUrl: data.unsubscribeUrl,
      });
    } catch (err: any) {
      setWaitlistError(err?.message || "Enrollment failed.");
    } finally {
      setWaitlistSubmitting(false);
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
          Real-Time Departure Check • New Orleans
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
          Find the Next Available Airboat Tour
        </h2>
        <p style={{ color: "#a8a29e", fontSize: "0.95rem", margin: "0.5rem 0 0 0" }}>
          Check connected departures for your exact party and see what you can actually book right now.
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* WHEN SELECTOR */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#d6d3d1", marginBottom: "0.5rem" }}>
            1. When are you going? (New Orleans Time)
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setSelectedDateMode("today")}
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
              onClick={() => setSelectedDateMode("tomorrow")}
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
              onClick={() => setSelectedDateMode("custom")}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.8rem", color: "#a8a29e" }}>Adults (Age 13+)</span>
              <select
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
              <span style={{ fontSize: "0.8rem", color: "#a8a29e" }}>Children (Age 0–12)</span>
              <select
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
                    <span style={{ fontSize: "0.8rem", color: "#d6d3d1" }}>Child {idx + 1}:</span>
                    <select
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
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#d6d3d1", marginBottom: "0.25rem" }}>
              3. Transportation
            </label>
            <select
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
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#d6d3d1", marginBottom: "0.25rem" }}>
              4. Boat Size Preference
            </label>
            <select
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

        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <button
            type="submit"
            disabled={isSearching}
            style={{
              flex: "2",
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
          <button
            type="button"
            onClick={() => setShowWaitlist(!showWaitlist)}
            style={{
              flex: "1",
              padding: "0.9rem 1rem",
              background: "transparent",
              color: "#fbbf24",
              fontWeight: 700,
              fontSize: "0.95rem",
              borderRadius: "0.5rem",
              border: "1px solid #fbbf24",
              cursor: "pointer"
            }}
          >
            {showWaitlist ? "Hide Opening List" : "Alert Me When Seats Open"}
          </button>
        </div>
      </form>

      {/* SEARCH ERROR */}
      {searchError && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#450a0a", borderRadius: "0.5rem", border: "1px solid #ef4444" }}>
          <p style={{ color: "#fca5a5", margin: 0, fontWeight: 600 }}>{searchError}</p>
        </div>
      )}

      {/* SEARCH RESULTS DISPLAY */}
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
              <p style={{ color: "#d6d3d1", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
                All connected options for your group ({searchResponse.totalGroupSize} travelers) on {searchResponse.travelDate} are either booked, past cutoff deadlines, or do not fit vessel age requirements.
              </p>
              <p style={{ color: "#fbbf24", fontSize: "0.85rem", fontWeight: 600, margin: 0 }}>
                You can enroll below to be notified if schedules or inventory open up.
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
                  {searchResponse.winningDeparture.availabilityType === "live_inventory" ? (
                    <span style={{ background: "#059669", color: "#ffffff", padding: "0.25rem 0.65rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Live Availability Checked
                    </span>
                  ) : (
                    <span style={{ background: "#d97706", color: "#ffffff", padding: "0.25rem 0.65rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Next Scheduled Departure
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
                  <span style={{ fontSize: "0.8rem", color: "#a8a29e" }}>Total for Group ({searchResponse.totalGroupSize}):</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#10b981" }}>
                    ${searchResponse.winningDeparture.totalPrice}
                  </div>
                </div>
              </div>

              {/* TIMELINE DETAILS */}
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#1c1917", borderRadius: "0.5rem", fontSize: "0.85rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                {searchResponse.winningDeparture.transportation === "hotel_pickup" && searchResponse.winningDeparture.pickupWindowDisplay ? (
                  <div>
                    <strong style={{ color: "#d6d3d1" }}>Estimated Hotel Pickup Window:</strong>
                    <p style={{ margin: "2px 0 0 0", color: "#fbbf24" }}>
                      {searchResponse.winningDeparture.pickupWindowDisplay}
                      <span style={{ display: "block", fontSize: "0.75rem", color: "#a8a29e" }}>Exact time confirmed by operator upon booking</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: "#d6d3d1" }}>Self-Drive Dock Arrival:</strong>
                    <p style={{ margin: "2px 0 0 0", color: "#fbbf24" }}>Arrive 30 min prior ({searchResponse.winningDeparture.dockArrivalTimeDisplay})</p>
                  </div>
                )}
                <div>
                  <strong style={{ color: "#d6d3d1" }}>Boat Type & Age:</strong>
                  <p style={{ margin: "2px 0 0 0", color: "#a8a29e" }}>
                    {searchResponse.winningDeparture.boatType === "small_airboat" ? "Small Airboat (Min Age 5)" : "Large Airboat (All Ages)"}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <div style={{ fontSize: "0.82rem", color: "#d6d3d1" }}>
                  {searchResponse.winningDeparture.availabilityType === "live_inventory" ? (
                    <span>
                      <strong style={{ color: "#34d399" }}>Seats available for group of {searchResponse.totalGroupSize} when checked</strong> · Subject to checkout availability
                    </span>
                  ) : (
                    <span>
                      <strong style={{ color: "#fbbf24" }}>Next scheduled departure: {searchResponse.winningDeparture.departureTimeDisplay}</strong> · Eligibility confirmed for {searchResponse.totalGroupSize} · Confirm open seats with operator
                    </span>
                  )}
                </div>
                <a
                  href={searchResponse.winningDeparture.bookingUrl}
                  target={searchResponse.winningDeparture.bookingUrl.includes("welcometotheswamp.com") ? undefined : "_blank"}
                  rel={searchResponse.winningDeparture.bookingUrl.includes("welcometotheswamp.com") ? undefined : "noopener noreferrer"}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: searchResponse.winningDeparture.availabilityType === "live_inventory" ? "#10b981" : "#fbbf24",
                    color: "#0c0a09",
                    fontWeight: 800,
                    borderRadius: "0.5rem",
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                  }}
                >
                  {searchResponse.winningDeparture.bookingUrl.includes("welcometotheswamp.com/tours/")
                    ? "View Tour & Check Seats →"
                    : searchResponse.winningDeparture.availabilityType === "live_inventory"
                    ? "Book Live Seats →"
                    : "Check Seats on Operator Checkout →"}
                </a>
              </div>
            </div>
          )}

          {/* OTHER DEPARTURES */}
          {searchResponse.allDepartures.length > 1 && (
            <div>
              <h4 style={{ fontSize: "1rem", color: "#d6d3d1", marginBottom: "0.75rem" }}>
                Later Departures Today:
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {searchResponse.allDepartures.slice(1).map((dep) => (
                  <div key={dep.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0c0a09", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #333", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <strong style={{ color: "#fff" }}>{dep.departureTimeDisplay}</strong>
                      <span style={{ marginLeft: "0.5rem", background: dep.availabilityType === "live_inventory" ? "#064e3b" : "#451a03", color: dep.availabilityType === "live_inventory" ? "#6ee7b7" : "#fcd34d", padding: "0.15rem 0.4rem", borderRadius: "3px", fontSize: "0.7rem", fontWeight: 700 }}>
                        {dep.availabilityType === "live_inventory" ? "Live" : "Scheduled"}
                      </span>
                      <span style={{ marginLeft: "0.5rem", color: "#a8a29e", fontSize: "0.85rem" }}>
                        {dep.operatorName} ({dep.transportation === "hotel_pickup" ? "With Pickup" : "Self-Drive"})
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ color: "#10b981", fontWeight: 700 }}>${dep.totalPrice}</span>
                      <a
                        href={dep.bookingUrl}
                        target={dep.bookingUrl.includes("welcometotheswamp.com") ? undefined : "_blank"}
                        rel={dep.bookingUrl.includes("welcometotheswamp.com") ? undefined : "noopener noreferrer"}
                        style={{ padding: "0.4rem 0.8rem", background: dep.availabilityType === "live_inventory" ? "#10b981" : "#fbbf24", color: "#0c0a09", textDecoration: "none", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700 }}
                      >
                        {dep.bookingUrl.includes("welcometotheswamp.com/tours/") ? "View Tour →" : "Check Seats →"}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WAITLIST / OPENING LIST ENROLLMENT FORM */}
      {showWaitlist && (
        <div style={{
          marginTop: "2rem",
          background: "#0c0a09",
          border: "1px solid #44403c",
          borderRadius: "0.75rem",
          padding: "1.5rem"
        }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#fbbf24", fontSize: "1.25rem" }}>
            Alert Me When Seats Open (Opening List)
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#a8a29e", lineHeight: "1.5", margin: "0 0 1.25rem 0" }}>
            Enroll in the opening list. <strong>Automated real-time seat alerts are currently inactive;</strong> we will record your requested date ({activeDate}) and party size ({adults + childrenCount}) and notify you if scheduling or inventory opens.
          </p>

          {waitlistSuccess ? (
            <div style={{ padding: "1rem", background: "#064e3b", borderRadius: "0.5rem", border: "1px solid #10b981" }}>
              <h4 style={{ color: "#6ee7b7", margin: "0 0 0.5rem 0" }}>✓ Enrollment Confirmed</h4>
              <p style={{ color: "#d1fae5", fontSize: "0.9rem", margin: "0 0 0.75rem 0" }}>{waitlistSuccess.message}</p>
              <p style={{ color: "#a7f3d0", fontSize: "0.8rem", margin: 0 }}>
                Submission ID: <code>{waitlistSuccess.submissionId}</code>. You can cancel anytime using your{" "}
                <a href={waitlistSuccess.unsubscribeUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#fff", textDecoration: "underline" }}>
                  one-click unsubscribe link
                </a>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEnrollWaitlist} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#d6d3d1", marginBottom: "0.25rem" }}>
                    Your Email (Required)
                  </label>
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "0.5rem",
                      background: "#1c1917",
                      border: "1px solid #444",
                      color: "#fff"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#d6d3d1", marginBottom: "0.25rem" }}>
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={waitlistName}
                    onChange={(e) => setWaitlistName(e.target.value)}
                    placeholder="Family or Traveler Name"
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "0.5rem",
                      background: "#1c1917",
                      border: "1px solid #444",
                      color: "#fff"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d6d3d1", marginBottom: "0.25rem" }}>
                  Preferred Time of Day:
                </label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  {(["any", "morning", "afternoon"] as const).map((win) => (
                    <label key={win} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "#e7e5e4", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="timeWindow"
                        value={win}
                        checked={waitlistWindow === win}
                        onChange={() => setWaitlistWindow(win)}
                      />
                      {win === "any" ? "Any Time" : win === "morning" ? "Morning (Before Noon)" : "Afternoon (Noon or Later)"}
                    </label>
                  ))}
                </div>
              </div>

              {waitlistError && (
                <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>{waitlistError}</p>
              )}

              <button
                type="submit"
                disabled={waitlistSubmitting}
                style={{
                  padding: "0.75rem 1.25rem",
                  background: "#44403c",
                  color: "#fbbf24",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #fbbf24",
                  cursor: waitlistSubmitting ? "not-allowed" : "pointer",
                  alignSelf: "flex-start"
                }}
              >
                {waitlistSubmitting ? "Enrolling..." : "Enroll in Opening List"}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
