"use client";

import React, { useEffect, useState } from "react";
import type { LfseDirectContextQualification } from "@/lib/dccResearchFeed";

interface ApprovedResearchQualificationSectionProps {
  portSlug: string;
  activitySlug?: string;
  initialQualifications: LfseDirectContextQualification[];
  initialLastSyncedAt: string | null;
  blockedUmbrellaProducts?: string[];
}

export function ApprovedResearchQualificationSection({
  portSlug,
  activitySlug,
  initialQualifications,
  initialLastSyncedAt,
  blockedUmbrellaProducts = [],
}: ApprovedResearchQualificationSectionProps) {
  const [qualifications, setQualifications] = useState<
    LfseDirectContextQualification[]
  >(initialQualifications);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    initialLastSyncedAt,
  );
  const [shipArrival, setShipArrival] = useState<string>("");
  const [allAboard, setAllAboard] = useState<string>("");
  const [meetingTime, setMeetingTime] = useState<string>("");
  const [dockKey, setDockKey] = useState<string>(
    portSlug === "ketchikan" ? "ketchikan-berths-1-4" : "franklin-dock",
  );
  const [jfdHandoffHref, setJfdHandoffHref] = useState<string>(
    "https://juneauflightdeck.com/handoff/dcc?interest=helicopter",
  );
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLiveQualifications = async (params?: {
    arrival?: string;
    allAboard?: string;
    meetingTime?: string;
    dockKey?: string;
  }) => {
    try {
      setLoading(true);
      const sp = new URLSearchParams({ port: portSlug });
      if (activitySlug) sp.set("activity", activitySlug);
      if (params?.arrival) sp.set("arrival", params.arrival);
      if (params?.allAboard) sp.set("allAboard", params.allAboard);
      if (params?.meetingTime) sp.set("meetingTime", params.meetingTime);
      if (params?.dockKey) sp.set("dockKey", params.dockKey);

      const res = await fetch(
        `/api/research-qualifications?${sp.toString()}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.research_qualifications)) {
        setQualifications(data.research_qualifications);
      }
      if (data?.research_ingestion?.last_synced_at !== undefined) {
        setLastSyncedAt(data.research_ingestion.last_synced_at);
      }
    } catch {
      // Preserve server-rendered qualifications on transient network failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let initialArr = "";
    let initialAboard = "";
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      initialArr =
        sp.get("shipArrivalTime") ||
        sp.get("arrival_time") ||
        sp.get("arrival") ||
        "";
      initialAboard =
        sp.get("allAboardTime") ||
        sp.get("departure_time") ||
        sp.get("allAboard") ||
        "";
      if (initialArr) setShipArrival(initialArr);
      if (initialAboard) setAllAboard(initialAboard);

      const jfdParams = new URLSearchParams({ interest: "helicopter" });
      const dateVal = sp.get("date") || sp.get("port_date");
      const partyVal = sp.get("party_size") || sp.get("passengers") || sp.get("travelers");
      const shipVal = sp.get("cruise_ship") || sp.get("ship");
      const handoffVal = sp.get("dcc_handoff_id");
      if (dateVal) {
        jfdParams.set("date", dateVal);
        jfdParams.set("port_date", dateVal);
      }
      if (partyVal) jfdParams.set("party_size", partyVal);
      if (shipVal) jfdParams.set("ship", shipVal);
      if (handoffVal) jfdParams.set("dcc_handoff_id", handoffVal);
      setJfdHandoffHref(`https://juneauflightdeck.com/handoff/dcc?${jfdParams.toString()}`);
    }
    void fetchLiveQualifications({
      arrival: initialArr || undefined,
      allAboard: initialAboard || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portSlug, activitySlug]);

  if (qualifications.length === 0) {
    return null;
  }

  return (
    <section
      className="section"
      id="dcc-approved-research-qualifications"
      data-testid="lfse-approved-research-section"
      style={{
        background: "#f3f8f6",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        padding: "36px 0",
      }}
    >
      <div className="shell">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <p className="eyebrow" style={{ color: "#137333" }}>
              DCC Research Review · Exact-Product Evidence & Port-Day Qualification
            </p>
            <h2 style={{ marginTop: 4, marginBottom: 8 }}>
              Direct-Operator Verified Research & 45-Minute Return-Buffer Qualification
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--muted)",
                maxWidth: 820,
                margin: 0,
              }}
            >
              Only current, human-confirmed facts from the private DCC Research
              Review desk carry verified status. Approvals map strictly to the
              exact direct-operator product and never transfer to Viator/GetYourGuide
              reseller listings or other operators.{" "}
              <strong>
                A verified duration alone does not establish that an excursion
                fits your port day.
              </strong>
            </p>
          </div>
          {lastSyncedAt && (
            <span
              className="badge"
              style={{
                background: "#e6f4ea",
                color: "#137333",
                border: "1px solid #137333",
                fontWeight: 700,
              }}
            >
              Synced from DCC Review Desk:{" "}
              {new Date(lastSyncedAt).toISOString().slice(0, 10)}
            </span>
          )}
        </div>

        {/* Interactive Ship Window Input for Direct Operator Qualification */}
        <div
          className="card"
          style={{
            background: "#ffffff",
            border: "1px solid var(--line)",
            marginBottom: 20,
            padding: "16px 20px",
          }}
        >
          <strong
            style={{
              display: "block",
              fontSize: "14px",
              color: "var(--deep)",
              marginBottom: 10,
            }}
          >
            Test Direct-Operator Port Window Against the 45-Minute Return Buffer:
          </strong>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
              alignItems: "end",
            }}
          >
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>
              Ship Arrival (e.g. 8:00 AM)
              <input
                type="text"
                placeholder="8:00 AM"
                value={shipArrival}
                onChange={(e) => setShipArrival(e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 4,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                }}
              />
            </label>
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>
              Tour Check-In / Departure
              <input
                type="text"
                placeholder="9:00 AM"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 4,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                }}
              />
            </label>
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>
              Ship All-Aboard (e.g. 4:30 PM)
              <input
                type="text"
                placeholder="4:30 PM"
                value={allAboard}
                onChange={(e) => setAllAboard(e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 4,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                }}
              />
            </label>
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>
              Cruise Berth
              <select
                value={dockKey}
                onChange={(e) => setDockKey(e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 4,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                }}
              >
                {portSlug === "ketchikan" ? (
                  <>
                    <option value="ketchikan-berths-1-4">
                      Downtown Berths 1–4 (5m walk)
                    </option>
                    <option value="ward-cove">
                      Ward Cove Mill (35m shuttle)
                    </option>
                  </>
                ) : (
                  <>
                    <option value="franklin-dock">
                      Franklin Dock (10m walk)
                    </option>
                    <option value="marine-dock">Marine Dock (8m walk)</option>
                    <option value="steamship-dock">
                      Steamship Dock (8m walk)
                    </option>
                    <option value="aj-dock">AJ Dock (20m shuttle)</option>
                  </>
                )}
              </select>
            </label>
            <button
              type="button"
              className="button secondary"
              disabled={loading}
              onClick={() =>
                void fetchLiveQualifications({
                  arrival: shipArrival,
                  allAboard,
                  meetingTime,
                  dockKey,
                })
              }
              style={{ padding: "8px 14px", fontSize: "13px" }}
            >
              {loading ? "Checking…" : "Evaluate Port Window"}
            </button>
          </div>
        </div>

        <div className="grid" style={{ gap: 20 }}>
          {qualifications.map((q) => {
            const hasVerified = q.verifiedFactCount > 0;
            const durationEv = q.constraints.duration.evidence;

            return (
              <article
                key={q.productId}
                className="card"
                data-product-id={q.productId}
                data-lfse-context-id={q.lfseContextId}
                data-qualification-status={q.overallQualificationStatus}
                style={{
                  background: "#ffffff",
                  border: hasVerified
                    ? "2px solid #137333"
                    : "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    className="badge"
                    style={{
                      background: hasVerified ? "#e6f4ea" : "#fef7e0",
                      color: hasVerified ? "#137333" : "#b06000",
                      border: "1px solid currentColor",
                      fontWeight: 700,
                    }}
                  >
                    {hasVerified
                      ? `Human-Verified Direct Evidence (${q.verifiedFactCount} Approved Fact${q.verifiedFactCount === 1 ? "" : "s"})`
                      : "Needs Human Confirmation in DCC Review Desk"}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background:
                        q.overallQualificationStatus === "qualified_for_port_day"
                          ? "#e6f4ea"
                          : q.overallQualificationStatus === "does_not_fit"
                            ? "#fce8e6"
                            : "#f1f3f4",
                      color:
                        q.overallQualificationStatus === "qualified_for_port_day"
                          ? "#137333"
                          : q.overallQualificationStatus === "does_not_fit"
                            ? "#c5221f"
                            : "#3c4043",
                      fontWeight: 700,
                    }}
                  >
                    Port-Day Fit:{" "}
                    {q.overallQualificationStatus === "qualified_for_port_day"
                      ? "Qualified"
                      : q.overallQualificationStatus === "does_not_fit"
                        ? "Does Not Fit (Violates 45-Min Rule)"
                        : "Unknown / Needs Confirmation"}
                  </span>
                </div>

                <h3 style={{ marginTop: 6, marginBottom: 4, fontSize: "19px" }}>
                  {q.productName}
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                    margin: "0 0 10px",
                  }}
                >
                  Operator: <strong>{q.operatorName}</strong> (
                  <code>{q.operatorId}</code>) · Product ID:{" "}
                  <code>{q.productId}</code> · Context:{" "}
                  <code>{q.lfseContextId}</code>
                </p>

                <p
                  style={{
                    fontSize: "13.5px",
                    color: "var(--ink)",
                    background: "#f8fbfb",
                    padding: "10px 12px",
                    borderRadius: 6,
                    borderLeft: "3px solid var(--forest)",
                    margin: "0 0 12px",
                  }}
                >
                  {q.qualificationSummaryText}
                </p>

                {durationEv && (
                  <div
                    data-testid="verified-duration-evidence"
                    data-fact-id={durationEv.fact_id}
                    data-revision={durationEv.revision}
                    data-verified-on={durationEv.verified_on}
                    data-review-due-on={durationEv.review_due_on}
                    style={{
                      background: "#eef7f0",
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: "1px solid #b7dfbe",
                      marginBottom: 12,
                      fontSize: "13px",
                    }}
                  >
                    <strong style={{ color: "#137333", display: "block" }}>
                      Approved Total Duration: {durationEv.value}{" "}
                      {durationEv.unit} (Fact ID:{" "}
                      <code>{durationEv.fact_id}</code> · Revision{" "}
                      {durationEv.revision})
                    </strong>
                    <div style={{ marginTop: 4, color: "var(--ink)" }}>
                      <strong>Verified On:</strong> {durationEv.verified_on} (by{" "}
                      {durationEv.verified_by}) ·{" "}
                      <strong>Review Due:</strong> {durationEv.review_due_on}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        whiteSpace: "pre-line",
                        color: "#2c3a40",
                        fontSize: "12.5px",
                      }}
                    >
                      <strong>Conditions:</strong> {durationEv.conditions}
                    </div>
                    <div style={{ marginTop: 6, fontSize: "12px" }}>
                      <strong>Official Citation:</strong>{" "}
                      <a
                        href={durationEv.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--forest)",
                          textDecoration: "underline",
                        }}
                      >
                        {durationEv.source_url}
                      </a>{" "}
                      (<code>sha256:{durationEv.source_hash.slice(0, 12)}…</code>
                      )
                    </div>
                  </div>
                )}

                {q.verifiedFacts.length > 1 && (
                  <div
                    style={{
                      fontSize: "12.5px",
                      marginBottom: 12,
                      padding: "8px 12px",
                      background: "#f8fbfb",
                      borderRadius: 6,
                    }}
                  >
                    <strong>Additional Human-Confirmed Facts for {q.productId}:</strong>
                    <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                      {q.verifiedFacts
                        .filter((f) => f.fact_id !== durationEv?.fact_id)
                        .map((f) => (
                          <li key={f.fact_id}>
                            <strong>{f.constraint_type}:</strong> {f.value}{" "}
                            {f.unit}
                            {f.conditions ? ` (${f.conditions})` : ""} —{" "}
                            <code>{f.fact_id}</code> · rev {f.revision} ·
                            verified {f.verified_on} · due {f.review_due_on}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Constraint Matrix */}
                <div
                  style={{
                    fontSize: "12.5px",
                    display: "grid",
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <strong>1. Duration:</strong> {q.constraints.duration.summary}
                  </div>
                  <div>
                    <strong>
                      2. {q.mandatoryReturnBufferMinutes}-Minute Return Buffer (
                      {q.constraints.returnBuffer.dockName}):
                    </strong>{" "}
                    {q.constraints.returnBuffer.summary}
                  </div>
                  <div>
                    <strong>3. Pickup & Pier Transfer:</strong>{" "}
                    {q.constraints.pickup.summary}
                  </div>
                  <div>
                    <strong>4. Age Policy:</strong> {q.constraints.age.summary}
                  </div>
                  <div>
                    <strong>5. Mobility & FAA Weight Rules:</strong>{" "}
                    {q.constraints.mobility.summary}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "11.5px",
                    color: "#607078",
                    borderTop: "1px solid var(--line)",
                    paddingTop: 8,
                  }}
                >
                  <strong>Strict Non-Transferability Scope:</strong>{" "}
                  {q.nonTransferableScopeNote}
                  {q.isolatedViatorResellerSkus.length > 0 && (
                    <span>
                      {" "}
                      Isolated Partner Reseller SKUs (remain unverified by
                      direct-operator research):{" "}
                      <code>{q.isolatedViatorResellerSkus.join(", ")}</code>.
                    </span>
                  )}
                  {portSlug === "juneau" && (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={jfdHandoffHref}
                        data-testid="lfse-to-jfd-handoff-link"
                        style={{
                          color: "var(--forest)",
                          fontWeight: 700,
                          textDecoration: "underline",
                        }}
                      >
                        Compare Juneau Helicopter &amp; Glacier Flight Formats on Juneau Flight Deck →
                      </a>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {blockedUmbrellaProducts.length > 0 && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              background: "#fff8e6",
              border: "1px solid #f0d090",
              borderRadius: 6,
              fontSize: "12.5px",
              color: "#5f4300",
            }}
          >
            <strong>Blocked Multi-Attraction Umbrella Bundles:</strong>{" "}
            <code>{blockedUmbrellaProducts.join(", ")}</code> remain excluded from
            sharing single-product Saxman Totem Park approvals.
          </div>
        )}
      </div>
    </section>
  );
}
