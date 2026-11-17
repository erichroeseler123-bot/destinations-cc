"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  evaluateCruiseSailingPortFit,
  type SoutheastAlaskaDockOrAccessPoint,
  type SoutheastAlaskaTourProductRecord,
} from "../../../lib/dcc/shared/southeastAlaskaDirectoryContract";

interface PortSailingTimingFitPanelProps {
  portName: string;
  docks: readonly SoutheastAlaskaDockOrAccessPoint[];
  tours: readonly SoutheastAlaskaTourProductRecord[];
}

function parseClockMinutes(raw: string): number | null {
  const trimmed = raw.trim();
  const twelveHour = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed);
  if (twelveHour) {
    let h = Number(twelveHour[1]);
    const m = Number(twelveHour[2]);
    const ampm = twelveHour[3].toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }
  const twentyFour = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (twentyFour) {
    return Number(twentyFour[1]) * 60 + Number(twentyFour[2]);
  }
  return null;
}

export function PortSailingTimingFitPanel({
  portName,
  docks,
  tours,
}: PortSailingTimingFitPanelProps) {
  const [arrivalStr, setArrivalStr] = useState("08:00");
  const [allAboardStr, setAllAboardStr] = useState("17:00");
  const [selectedDockId, setSelectedDockId] = useState(
    docks[0]?.locationId || "default-dock",
  );

  const selectedDock = useMemo(
    () => docks.find((d) => d.locationId === selectedDockId) || docks[0] || null,
    [docks, selectedDockId],
  );

  const arrivalMins = parseClockMinutes(arrivalStr) ?? 8 * 60;
  const allAboardMins = parseClockMinutes(allAboardStr) ?? 17 * 60;
  const dockTransferMins = selectedDock?.additionalTransferMinutesEachWay ?? 0;

  const evaluatedRows = useMemo(() => {
    return tours.map((tour) => {
      const candidateSlots =
        tour.typicalDepartureTimes.length > 0
          ? tour.typicalDepartureTimes
          : ["09:30 AM"];
      const slotEvaluations = candidateSlots.map((slotLabel) => {
        const depMins = parseClockMinutes(slotLabel) ?? 9 * 60 + 30;
        const fit = evaluateCruiseSailingPortFit({
          shipArrivalMinutesFromMidnight: arrivalMins,
          shipAllAboardMinutesFromMidnight: allAboardMins,
          tourDepartureMinutesFromMidnight: depMins,
          tourDurationMinutes: tour.durationMinutes,
          berthTransferMinutesEachWay:
            dockTransferMins + tour.transferBufferMinutesEachWay,
          mandatoryAllAboardBufferMinutes: 120,
        });
        return { slotLabel, fit };
      });
      const passingSlots = slotEvaluations.filter(
        (s) => s.fit.fitsRecommendedWindow,
      );
      return {
        tour,
        passingSlots,
        bestEvaluation: passingSlots[0] || slotEvaluations[0],
      };
    });
  }, [tours, arrivalMins, allAboardMins, dockTransferMins]);

  return (
    <div
      className="card"
      data-testid="port-sailing-timing-fit-panel"
      style={{ border: "2px solid var(--forest)", background: "#ffffff" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <span className="badge badge-safety">2-Hour All-Aboard Buffer Engine</span>
          <h3 style={{ marginTop: 8, marginBottom: 4 }}>
            Timing-Fit Results for Your {portName} Sailing
          </h3>
        </div>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          Evaluates disembarkation + berth transfer + tour duration + 120-minute return buffer
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginTop: 16,
          marginBottom: 18,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13 }}>
          <strong>Ship Arrival (Local)</strong>
          <input
            type="time"
            value={arrivalStr}
            onChange={(e) => setArrivalStr(e.target.value)}
            style={{
              padding: "9px 11px",
              borderRadius: 8,
              border: "1px solid var(--line)",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13 }}>
          <strong>Ship All-Aboard (Local)</strong>
          <input
            type="time"
            value={allAboardStr}
            onChange={(e) => setAllAboardStr(e.target.value)}
            style={{
              padding: "9px 11px",
              borderRadius: 8,
              border: "1px solid var(--line)",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13 }}>
          <strong>Assigned Dock / Landing</strong>
          <select
            value={selectedDockId}
            onChange={(e) => setSelectedDockId(e.target.value)}
            style={{
              padding: "9px 11px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "white",
            }}
          >
            {docks.map((dock) => (
              <option key={dock.locationId} value={dock.locationId}>
                {dock.name} (+{dock.additionalTransferMinutesEachWay}m each way)
              </option>
            ))}
          </select>
        </label>
      </div>

      {tours.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
          No timed shore excursions are currently published for {portName}. Review dock
          and local operator details above.
        </p>
      ) : (
        <div className="table-wrap" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Tour &amp; Local Operator</th>
                <th>Duration</th>
                <th>Fitting Departures</th>
                <th>2-Hour Buffer Verdict</th>
              </tr>
            </thead>
            <tbody>
              {evaluatedRows.map(({ tour, passingSlots, bestEvaluation }) => (
                <tr key={tour.tourId}>
                  <td>
                    <Link
                      href={`/tours/${tour.operatorSlug}/${tour.tourSlug}`}
                      style={{ fontWeight: 700, color: "var(--deep)" }}
                    >
                      {tour.title}
                    </Link>
                    <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                      Operated by{" "}
                      <Link
                        href={`/operators/${tour.operatorSlug}`}
                        style={{ color: "var(--forest)", fontWeight: 600 }}
                      >
                        {tour.operatorName}
                      </Link>
                    </div>
                  </td>
                  <td>{tour.durationLabel}</td>
                  <td>
                    {passingSlots.length > 0 ? (
                      passingSlots.map((s) => s.slotLabel).join(", ")
                    ) : (
                      <span style={{ color: "var(--muted)" }}>
                        None in {arrivalStr}–{allAboardStr} window
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        passingSlots.length > 0 ? "badge-safety" : "badge-warning"
                      }`}
                    >
                      {passingSlots.length > 0
                        ? `Fits (${bestEvaluation.fit.remainingBufferBeforeAllAboardMinutes}m buffer)`
                        : "Outside 2h Buffer"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
