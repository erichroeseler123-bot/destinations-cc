"use client";

import React, { useState } from "react";

type StayZone = "unselected" | "downtown_hotel" | "airport_valley_hotel" | "same_day_air";
type DayChoice =
  | "unselected"
  | "pre_cruise_land_day"
  | "post_cruise_land_day"
  | "embarkation_day"
  | "disembarkation_day";
type NextReportAndLuggage =
  | "unselected"
  | "land_day_bags_stored"
  | "embark_standard_bags_planned"
  | "embark_safari_quest"
  | "disembark_flight_home";
type PickupPlan =
  | "unselected"
  | "downtown_goldbelt_tram"
  | "hotel_pickup_requested"
  | "direct_heliport_taxi";

export default function UncruiseFiveStepChecklist() {
  const [stayZone, setStayZone] = useState<StayZone>("unselected");
  const [dayChoice, setDayChoice] = useState<DayChoice>("unselected");
  const [reportAndBags, setReportAndBags] = useState<NextReportAndLuggage>("unselected");
  const [pickupPlan, setPickupPlan] = useState<PickupPlan>("unselected");

  const hasUnknownOrTightConstraint =
    stayZone === "unselected" ||
    stayZone === "same_day_air" ||
    (stayZone === "airport_valley_hotel" && pickupPlan === "downtown_goldbelt_tram") ||
    dayChoice === "unselected" ||
    dayChoice === "embarkation_day" ||
    dayChoice === "disembarkation_day" ||
    reportAndBags === "unselected" ||
    reportAndBags === "embark_standard_bags_planned" ||
    reportAndBags === "embark_safari_quest" ||
    reportAndBags === "disembark_flight_home" ||
    pickupPlan === "unselected" ||
    pickupPlan === "hotel_pickup_requested" ||
    pickupPlan === "direct_heliport_taxi";

  const requiredChecks: string[] = [];

  if (stayZone === "unselected") {
    requiredChecks.push(
      "Step 1 open: Identify whether you will start from Downtown Juneau (near 76 Egan Dr / 490 S. Franklin St.) or the JNU Airport / Mendenhall Valley corridor (~8.5–9 miles north).",
    );
  } else if (stayZone === "airport_valley_hotel" && pickupPlan === "downtown_goldbelt_tram") {
    requiredChecks.push(
      "Geography check: Staying near JNU Airport while meeting at Goldbelt Tram (490 S. Franklin St.) adds ~20–25 minutes of road travel each way—check whether NorthStar hotel pickup or a confirmed TEMSCO/seller airport-area arrangement applies instead.",
    );
  } else if (stayZone === "same_day_air") {
    requiredChecks.push(
      "Same-day air travel risk: Airline delays or glacier weather holds can collide with UnCruise’s embarkation cutoff or your outbound JNU flight check-in.",
    );
  }

  if (dayChoice === "unselected") {
    requiredChecks.push(
      "Step 2 open: Choose whether you are flying on a dedicated Juneau land day or attempting embarkation/disembarkation day.",
    );
  } else if (dayChoice === "embarkation_day") {
    requiredChecks.push(
      "Embarkation-day cutoff check: UnCruise’s Juneau check-in at 76 Egan Drive (open 9:00 a.m.–4:30 p.m.) requires luggage checked in by 3:00 p.m. and guests back in hospitality by 4:30 p.m. (3:00 p.m. on Safari Quest). Ensure your full door-to-door tour duration plus transit margin finishes well ahead of those cutoffs.",
    );
  } else if (dayChoice === "disembarkation_day") {
    requiredChecks.push(
      "Disembarkation-day cutoff check: UnCruise advises JNU flights no earlier than 11:30 a.m., and exact morning disembarkation clock times arrive in final e-documents (~45 days pre-cruise). Account for potential temporary glacier weather delays before any same-day flight home.",
    );
  }

  if (reportAndBags === "unselected") {
    requiredChecks.push(
      "Step 3 open: Confirm both your next mandatory reporting time and where full suitcases will stay (all three helicopter operators prohibit suitcases on tour; base lockers hold small personal items only).",
    );
  } else if (reportAndBags === "embark_safari_quest") {
    requiredChecks.push(
      "Safari Quest 3:00 p.m. cutoff: UnCruise requires Safari Quest guests at JNU/hospitality by 3:00 p.m. (90 minutes earlier than other vessels), leaving very little embarkation-day slack.",
    );
  } else if (reportAndBags === "embark_standard_bags_planned") {
    requiredChecks.push(
      "Luggage & transfer coordination: Verify hotel bell-desk storage or 76 Egan Drive luggage drop (9:00 a.m.–3:00 p.m.), and confirm with UnCruise if you will not be riding the group airport transfer.",
    );
  } else if (reportAndBags === "disembark_flight_home") {
    requiredChecks.push(
      "Post-disembarkation bags & flight check-in: Confirm suitcase storage after leaving 76 Egan Drive and allow ample margin before your airline’s JNU bag-drop deadline.",
    );
  }

  if (pickupPlan === "unselected") {
    requiredChecks.push(
      "Step 4 open: Verify the exact pickup point for your chosen operator AND booking channel (selected tour time means downtown departure on some listings, while hotel pickup requires channel-specific confirmation).",
    );
  } else if (pickupPlan === "hotel_pickup_requested") {
    requiredChecks.push(
      "Hotel pickup verification: NorthStar’s direct FAQ covers most Juneau locations (excluding Mendenhall Glacier Recreation Area), TEMSCO’s direct page covers “select few hotels,” and Viator 6251SHOREXICEWALK pickup options must be verified inside Viator’s checkout selector.",
    );
  } else if (pickupPlan === "direct_heliport_taxi") {
    requiredChecks.push(
      "Direct heliport check-in verification: Call or email the operator before booking to confirm whether self-transport to their JNU-area base is accepted and what check-in time applies when bypassing the downtown shuttle.",
    );
  }

  const selectStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 46,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(158, 217, 255, 0.32)",
    background: "rgba(4, 17, 27, 0.95)",
    color: "#eef6fb",
    fontSize: "0.92rem",
    lineHeight: 1.4,
  };

  return (
    <section
      aria-labelledby="uncruise-five-step-heading"
      data-testid="jfd-uncruise-five-step-flow"
      style={{
        borderRadius: 24,
        border: "1px solid rgba(151, 211, 255, 0.22)",
        background: "rgba(8, 28, 42, 0.92)",
        padding: "24px 20px",
        display: "grid",
        gap: 18,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#f0b35b",
          }}
        >
          Interactive 5-Step Pre-Booking Self-Check · Zero Personal Data Collected
        </p>
        <h2
          id="uncruise-five-step-heading"
          style={{ margin: 0, fontSize: "clamp(1.35rem, 2.4vw, 1.8rem)", lineHeight: 1.25 }}
        >
          Check Your Juneau Turnaround &amp; Pickup Logistics Before Selecting a Flight
        </h2>
        <p style={{ margin: 0, fontSize: "0.94rem", lineHeight: 1.6, color: "rgba(228, 239, 246, 0.82)" }}>
          Walk through the five practical handoffs below. Any open or tight constraint keeps your
          status at <strong>Confirm timing before booking</strong>—this checklist never guesses
          live seat availability or weather.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
          gap: 14,
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <label
            htmlFor="step-1-stay-zone"
            style={{ fontSize: "0.86rem", fontWeight: 800, color: "#9ed9ff" }}
          >
            1. Where are you staying?
          </label>
          <select
            id="step-1-stay-zone"
            value={stayZone}
            onChange={(e) => setStayZone(e.target.value as StayZone)}
            style={selectStyle}
            data-testid="jfd-step-1-stay"
          >
            <option value="unselected">Select your Juneau starting zone…</option>
            <option value="downtown_hotel">
              Downtown Juneau hotel (near 76 Egan Dr &amp; 490 S. Franklin St.)
            </option>
            <option value="airport_valley_hotel">
              Airport / Mendenhall Valley hotel (near JNU &amp; heliports)
            </option>
            <option value="same_day_air">
              Flying in or out same day (no Juneau hotel night)
            </option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label
            htmlFor="step-2-day-choice"
            style={{ fontSize: "0.86rem", fontWeight: 800, color: "#9ed9ff" }}
          >
            2. Which day is free?
          </label>
          <select
            id="step-2-day-choice"
            value={dayChoice}
            onChange={(e) => setDayChoice(e.target.value as DayChoice)}
            style={selectStyle}
            data-testid="jfd-step-2-day"
          >
            <option value="unselected">Select the day you want to fly…</option>
            <option value="pre_cruise_land_day">
              Dedicated pre-cruise Juneau land day (1+ nights early)
            </option>
            <option value="post_cruise_land_day">
              Dedicated post-cruise Juneau land day (staying over)
            </option>
            <option value="embarkation_day">UnCruise embarkation day</option>
            <option value="disembarkation_day">UnCruise disembarkation day</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label
            htmlFor="step-3-report-bags"
            style={{ fontSize: "0.86rem", fontWeight: 800, color: "#9ed9ff" }}
          >
            3. Where must you report next—and where will your luggage stay?
          </label>
          <select
            id="step-3-report-bags"
            value={reportAndBags}
            onChange={(e) => setReportAndBags(e.target.value as NextReportAndLuggage)}
            style={selectStyle}
            data-testid="jfd-step-3-bags"
          >
            <option value="unselected">Select next cutoff &amp; suitcase storage…</option>
            <option value="land_day_bags_stored">
              No same-day ship/flight cutoff &amp; hotel holds suitcases
            </option>
            <option value="embark_standard_bags_planned">
              Standard UnCruise embarkation (bags by 3:00 p.m. · 76 Egan Dr by 4:30 p.m.)
            </option>
            <option value="embark_safari_quest">
              Safari Quest embarkation (3:00 p.m. hospitality cutoff at 76 Egan Dr)
            </option>
            <option value="disembark_flight_home">
              Disembarking + flying out of JNU same day (11:30 a.m.+ flight rule)
            </option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label
            htmlFor="step-4-pickup-plan"
            style={{ fontSize: "0.86rem", fontWeight: 800, color: "#9ed9ff" }}
          >
            4. Where does this exact tour collect you?
          </label>
          <select
            id="step-4-pickup-plan"
            value={pickupPlan}
            onChange={(e) => setPickupPlan(e.target.value as PickupPlan)}
            style={selectStyle}
            data-testid="jfd-step-4-pickup"
          >
            <option value="unselected">Select planned collection method…</option>
            <option value="downtown_goldbelt_tram">
              Downtown Goldbelt Tram (490 S. Franklin St. — verify on chosen channel)
            </option>
            <option value="hotel_pickup_requested">
              Hotel pickup (requires operator/channel-specific confirmation)
            </option>
            <option value="direct_heliport_taxi">
              Self-transport / taxi to JNU-area heliport (confirm with operator)
            </option>
          </select>
        </div>
      </div>

      <div
        role="region"
        aria-live="polite"
        aria-label="Step 5 pre-booking readiness summary"
        data-testid="jfd-step-5-readout"
        style={{
          borderRadius: 16,
          padding: "16px 18px",
          border: hasUnknownOrTightConstraint
            ? "1px solid rgba(240, 179, 91, 0.55)"
            : "1px solid rgba(158, 217, 255, 0.4)",
          background: hasUnknownOrTightConstraint
            ? "rgba(48, 31, 9, 0.55)"
            : "rgba(9, 34, 52, 0.78)",
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#9ed9ff" }}>
            5. Check departures with the seller.
          </span>
          <span
            data-testid="jfd-step-5-status-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: "0.8rem",
              fontWeight: 800,
              background: hasUnknownOrTightConstraint
                ? "rgba(240, 179, 91, 0.2)"
                : "rgba(158, 217, 255, 0.16)",
              border: hasUnknownOrTightConstraint
                ? "1px solid #f0b35b"
                : "1px solid #9ed9ff",
              color: hasUnknownOrTightConstraint ? "#ffd596" : "#e0f2fe",
            }}
          >
            {hasUnknownOrTightConstraint
              ? "Confirm timing before booking"
              : "Dedicated land-day path — verify live departures & seller terms"}
          </span>
        </div>

        {requiredChecks.length > 0 ? (
          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              display: "grid",
              gap: 6,
              fontSize: "0.88rem",
              lineHeight: 1.55,
              color: "#eef6fb",
            }}
          >
            {requiredChecks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.55, color: "#eef6fb" }}>
            You selected a dedicated Juneau land day with suitcases stored at your hotel and a
            Downtown Goldbelt Tram (490 S. Franklin St.) collection plan. Next, compare each
            operator’s exact booking-channel pickup rule, weight tier, and cancellation cutoff below
            before checking live departure calendars.
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 4 }}>
          <a
            href="#operator-channel-cards"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "10px 18px",
              borderRadius: 12,
              background: "#f0b35b",
              color: "#04111b",
              fontWeight: 800,
              fontSize: "0.88rem",
              textDecoration: "none",
            }}
            data-testid="jfd-step-5-jump-cards"
          >
            Compare Operator &amp; Channel Cards ↓
          </a>
        </div>
      </div>
    </section>
  );
}
