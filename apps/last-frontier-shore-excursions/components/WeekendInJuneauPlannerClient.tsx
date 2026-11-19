"use client";

import React, { useState } from "react";
import {
  PRINTABLE_QUICK_CONTACTS,
  WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_LONG,
  WEEKEND_ITINERARY_PLANS,
  type StayBaseKey,
  type StayDurationKey,
} from "@/lib/weekendInJuneauGuideData";
import { trackWeekendInJuneauEvent } from "@/lib/weekendInJuneauTelemetry";

const PREP_CHECKLIST_ITEMS = [
  {
    id: "weather-first",
    label:
      "Put your weather-sensitive helicopter or floatplane flight on Full Day 1 (not Arrival or Departure Day)",
  },
  {
    id: "clothed-weights",
    label:
      "Confirm accurate clothed passenger weights & no-bag aircraft rules before booking glacier flights",
  },
  {
    id: "dinner-res",
    label:
      "Reserve downtown dinners ahead: Salt via direct phone (907-500-5000); note In Bocca al Lupo is closed Sundays",
  },
  {
    id: "mendenhall-pass",
    label:
      "Pack your America the Beautiful pass (or $5 summer USFS Visitor Center pass) & plan shuttle/car vs. 1.5-mi bus walk",
  },
  {
    id: "rain-layers",
    label:
      "Pack waterproof hooded shell, grippy waterproof shoes, and non-cotton warm layers for Auke Bay & trails",
  },
] as const;

export function WeekendInJuneauPlannerClient() {
  const [durationKey, setDurationKey] = useState<StayDurationKey>("2_full_days");
  const [baseKey, setBaseKey] = useState<StayBaseKey>("downtown");
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [showCompactSheetPreview, setShowCompactSheetPreview] = useState(false);

  const activePlan =
    WEEKEND_ITINERARY_PLANS.find((p) => p.key === durationKey) ||
    WEEKEND_ITINERARY_PLANS[0]!;

  function handleDurationChange(next: StayDurationKey) {
    setDurationKey(next);
    trackWeekendInJuneauEvent({
      event: "lfse_guide_engagement",
      action: "select_stay_duration",
      stayDuration: next,
      stayBase: baseKey,
    });
  }

  function handleBaseChange(next: StayBaseKey) {
    setBaseKey(next);
    trackWeekendInJuneauEvent({
      event: "lfse_guide_engagement",
      action: "select_stay_base",
      stayDuration: durationKey,
      stayBase: next,
    });
  }

  function toggleChecklistItem(id: string) {
    const nextState = !checkedIds[id];
    setCheckedIds((prev) => ({ ...prev, [id]: nextState }));
    trackWeekendInJuneauEvent({
      event: "lfse_guide_engagement",
      action: nextState ? "check_prep_item" : "uncheck_prep_item",
      stayDuration: durationKey,
      stayBase: baseKey,
    });
  }

  function handlePrintPlan() {
    trackWeekendInJuneauEvent({
      event: "lfse_printable_plan_used",
      action: "window_print_triggered",
      stayDuration: durationKey,
      stayBase: baseKey,
    });
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
    }
  }

  function handleToggleSheetPreview() {
    const next = !showCompactSheetPreview;
    setShowCompactSheetPreview(next);
    trackWeekendInJuneauEvent({
      event: "lfse_printable_plan_used",
      action: next ? "open_printable_sheet_preview" : "close_printable_sheet_preview",
      stayDuration: durationKey,
      stayBase: baseKey,
    });
  }

  return (
    <div data-testid="lfse-weekend-planner" style={{ display: "grid", gap: 22 }}>
      {/* Interactive Controls (hidden in print) */}
      <div
        className="lfse-no-print"
        style={{
          background: "var(--parchment)",
          border: "1px solid var(--line)",
          borderRadius: 18,
          padding: "20px",
          display: "grid",
          gap: 16,
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: 16,
          }}
        >
          <fieldset
            style={{
              border: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 8,
            }}
          >
            <legend
              style={{
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--forest)",
                marginBottom: 6,
              }}
            >
              1. Choose Your Full Days in Juneau
            </legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {WEEKEND_ITINERARY_PLANS.map((plan) => {
                const active = plan.key === durationKey;
                return (
                  <button
                    key={plan.key}
                    type="button"
                    aria-pressed={active}
                    data-testid={`lfse-duration-${plan.key}`}
                    onClick={() => handleDurationChange(plan.key)}
                    style={{
                      minHeight: 46,
                      padding: "10px 16px",
                      borderRadius: 12,
                      border: active
                        ? "2px solid var(--deep)"
                        : "1px solid var(--line)",
                      background: active ? "var(--deep)" : "#ffffff",
                      color: active ? "#ffffff" : "var(--ink)",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      flex: "1 1 200px",
                      textAlign: "left",
                    }}
                  >
                    {plan.tabLabel}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset
            style={{
              border: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 8,
            }}
          >
            <legend
              style={{
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--forest)",
                marginBottom: 6,
              }}
            >
              2. Choose Your Home Base
            </legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(
                [
                  { key: "downtown", label: "Walkable Downtown Base" },
                  { key: "valley_airport", label: "Airport / Mendenhall Valley Base" },
                ] as const
              ).map((opt) => {
                const active = opt.key === baseKey;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    aria-pressed={active}
                    data-testid={`lfse-base-${opt.key}`}
                    onClick={() => handleBaseChange(opt.key)}
                    style={{
                      minHeight: 46,
                      padding: "10px 16px",
                      borderRadius: 12,
                      border: active
                        ? "2px solid var(--forest)"
                        : "1px solid var(--line)",
                      background: active ? "var(--forest)" : "#ffffff",
                      color: active ? "#ffffff" : "var(--ink)",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      flex: "1 1 200px",
                      textAlign: "left",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingTop: 10,
            borderTop: "1px solid var(--line)",
          }}
        >
          <div style={{ fontSize: 13.5, color: "var(--muted)" }}>
            <strong>Active itinerary:</strong> {activePlan.nightsLabel} ·{" "}
            <strong>
              {baseKey === "downtown"
                ? "Downtown Juneau logistics"
                : "Airport / Mendenhall Valley logistics"}
            </strong>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              type="button"
              onClick={handleToggleSheetPreview}
              data-testid="lfse-toggle-printable-preview"
              style={{
                minHeight: 46,
                padding: "10px 16px",
                borderRadius: 999,
                border: "1.5px solid var(--deep)",
                background: "#ffffff",
                color: "var(--deep)",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              {showCompactSheetPreview
                ? "Hide Compact Trip Sheet"
                : "View Compact Printable Sheet"}
            </button>
            <button
              type="button"
              onClick={handlePrintPlan}
              data-testid="lfse-print-plan-btn"
              style={{
                minHeight: 46,
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid transparent",
                background: "var(--accent)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Print / Save PDF Plan
            </button>
          </div>
        </div>
      </div>

      {/* Day-by-Day Itinerary Cards (also cleanly printed) */}
      <div
        className="lfse-printable-plan-sheet"
        data-testid="lfse-itinerary-days"
        style={{ display: "grid", gap: 16 }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: "20px 22px",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            {activePlan.nightsLabel} ·{" "}
            {baseKey === "downtown"
              ? "Downtown Juneau Base"
              : "Airport / Mendenhall Valley Base"}
          </p>
          <h3 style={{ margin: "0 0 8px", fontSize: 21, color: "var(--deep)" }}>
            {activePlan.headline}
          </h3>
          <p style={{ margin: 0, fontSize: 14.5, color: "var(--muted)", lineHeight: 1.58 }}>
            {activePlan.framingNote}
          </p>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {activePlan.days.map((day) => {
            const isFullDay = day.dayType === "full_activity_day";
            return (
              <article
                key={day.dayBadge}
                style={{
                  background: "var(--parchment)",
                  border: isFullDay
                    ? "1.5px solid #9ab8bc"
                    : "1px dashed #b9c9cb",
                  borderRadius: 16,
                  padding: "18px 20px",
                  display: "grid",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "4px 11px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                      background: isFullDay ? "var(--deep)" : "var(--ice)",
                      color: isFullDay ? "#ffffff" : "var(--deep)",
                    }}
                  >
                    {day.dayBadge}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isFullDay ? "var(--forest)" : "var(--muted)",
                    }}
                  >
                    {isFullDay
                      ? "Full Uninterrupted Juneau Day"
                      : "Travel Buffer Day — No Tight Excursions"}
                  </span>
                </div>

                <h4 style={{ margin: 0, fontSize: 18, color: "var(--deep)", lineHeight: 1.3 }}>
                  {day.title}
                </h4>

                {day.weatherNote && (
                  <div
                    style={{
                      background: "var(--safety-bg)",
                      border: "1px solid var(--safety-border)",
                      borderRadius: 10,
                      padding: "9px 12px",
                      fontSize: 13.5,
                      color: "#5f3c16",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Weather pacing note:</strong> {day.weatherNote}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                    gap: 12,
                    fontSize: 14,
                    lineHeight: 1.55,
                  }}
                >
                  <div>
                    <strong style={{ color: "var(--deep)", display: "block", marginBottom: 2 }}>
                      Morning
                    </strong>
                    <span style={{ color: "var(--ink)" }}>{day.morning}</span>
                  </div>
                  <div>
                    <strong style={{ color: "var(--deep)", display: "block", marginBottom: 2 }}>
                      Afternoon
                    </strong>
                    <span style={{ color: "var(--ink)" }}>{day.afternoon}</span>
                  </div>
                  <div>
                    <strong style={{ color: "var(--deep)", display: "block", marginBottom: 2 }}>
                      Evening
                    </strong>
                    <span style={{ color: "var(--ink)" }}>{day.evening}</span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--line)",
                    paddingTop: 10,
                    fontSize: 13.5,
                    color: "var(--forest)",
                    lineHeight: 1.5,
                  }}
                >
                  <strong>
                    {baseKey === "downtown"
                      ? "Downtown Base Tip: "
                      : "Airport / Valley Base Tip: "}
                  </strong>
                  {baseKey === "downtown" ? day.downtownBaseTip : day.valleyBaseTip}
                </div>
              </article>
            );
          })}
        </div>

        {/* Printable Pocket Cheatsheet & Prep Checklist */}
        <section
          id="printable-juneau-trip-sheet"
          aria-labelledby="printable-sheet-heading"
          data-testid="lfse-printable-trip-sheet"
          style={{
            background: showCompactSheetPreview ? "#ffffff" : "var(--parchment)",
            border: showCompactSheetPreview
              ? "2px solid var(--deep)"
              : "1px solid var(--line)",
            borderRadius: 18,
            padding: "22px",
            display: "grid",
            gap: 16,
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
            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 11.5,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--accent)",
                }}
              >
                Printable Juneau Pocket Sheet · Zero Personal Data Stored
              </p>
              <h3 id="printable-sheet-heading" style={{ margin: 0, fontSize: 20, color: "var(--deep)" }}>
                Pre-Trip Checklist &amp; Local Juneau Reference Numbers
              </h3>
            </div>
            <button
              type="button"
              onClick={handlePrintPlan}
              className="lfse-no-print"
              style={{
                minHeight: 46,
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid var(--deep)",
                background: "var(--deep)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              Print This Plan
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))",
              gap: 18,
            }}
          >
            <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
              <strong style={{ fontSize: 14, color: "var(--deep)" }}>
                Before You Fly Into JNU
              </strong>
              {PREP_CHECKLIST_ITEMS.map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid var(--line)",
                    fontSize: 13.5,
                    lineHeight: 1.48,
                    cursor: "pointer",
                    minHeight: 44,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checkedIds[item.id])}
                    onChange={() => toggleChecklistItem(item.id)}
                    style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0 }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
              <strong style={{ fontSize: 14, color: "var(--deep)" }}>
                Verified Juneau Addresses &amp; Numbers ({WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_LONG})
              </strong>
              <dl
                style={{
                  margin: 0,
                  display: "grid",
                  gap: 8,
                  background: "#ffffff",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                {PRINTABLE_QUICK_CONTACTS.map((row) => (
                  <div key={row.label}>
                    <dt style={{ fontWeight: 800, color: "var(--deep)" }}>{row.label}</dt>
                    <dd style={{ margin: 0, color: "var(--muted)" }}>{row.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)" }}>
            Printed from Last Frontier Shore Excursions (lastfrontiershoreexcursions.com/guides/weekend-in-juneau) · Always reconfirm live seasonal hours, weather dispatch, and seller cancellation terms directly before travel.
          </p>
        </section>
      </div>
    </div>
  );
}
