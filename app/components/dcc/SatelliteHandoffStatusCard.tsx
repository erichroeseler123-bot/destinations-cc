"use client";

import { useEffect, useState } from "react";

type Summary = {
  handoffId: string;
  satelliteId: string;
  latestEventType: string;
  latestStatus: string | null;
  latestStage: string | null;
  lastEventAt: string;
  eventCount: number;
  externalReferences: string[];
};

function describeHandoffState(summary: Summary) {
  if (
    summary.latestEventType === "partner_booking_completed" ||
    summary.latestEventType === "booking_completed"
  ) {
    return "Booking confirmed. DCC can use this outcome to strengthen the best next-step path for similar travelers.";
  }
  if (
    summary.latestEventType === "partner_booking_failed" ||
    summary.latestEventType === "booking_failed"
  ) {
    return "Booking did not complete. DCC should keep the traveler closer to comparison and fallback paths.";
  }
  if (summary.latestEventType === "accepted_from_partner") {
    return "Partner accepted the handoff. The traveler is now in the downstream execution lane.";
  }
  if (summary.latestEventType === "forwarded_to_partner") {
    return "Forward completed. Waiting for the downstream partner to confirm acceptance.";
  }
  if (summary.latestEventType === "traveler_returned") {
    return "Traveler returned to DCC. Use this state to continue planning instead of restarting the flow.";
  }
  if (summary.latestEventType === "lead_captured") {
    return "Lead captured. DCC can keep the traveler in a higher-intent funnel from here.";
  }
  if (summary.latestEventType === "booking_started") {
    return "Booking started. This lane is active, but final outcome is still pending.";
  }
  return "Recent cross-site activity is being tracked on this handoff.";
}

type Props = {
  handoffId?: string | null;
  title?: string;
};

export default function SatelliteHandoffStatusCard({
  handoffId,
  title = "Recent Handoff Status",
}: Props) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; summary: Summary }
  >({ status: "idle" });

  useEffect(() => {
    if (!handoffId) return;
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/internal/satellite-handoffs/${encodeURIComponent(handoffId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.ok || !json.summary) {
          throw new Error(json.error || "Failed to load handoff status.");
        }
        if (!cancelled) {
          setState({ status: "success", summary: json.summary as Summary });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Failed to load handoff status.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [handoffId]);

  if (!handoffId) return null;

  return (
    <section className="rounded-[1.6rem] border border-emerald-300/20 bg-emerald-400/10 p-5 text-white">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">{title}</div>
      <div className="mt-3 text-sm text-emerald-50/90">
        {state.status === "loading" ? "Loading latest cross-site handoff state..." : null}
        {state.status === "error" ? state.message : null}
        {state.status === "success" ? (
          <div className="space-y-2">
            <p>
              Satellite: <span className="font-semibold">{state.summary.satelliteId}</span>
            </p>
            <p>
              Latest event: <span className="font-semibold">{state.summary.latestEventType}</span>
              {state.summary.latestStatus ? ` • ${state.summary.latestStatus}` : ""}
              {state.summary.latestStage ? ` • ${state.summary.latestStage}` : ""}
            </p>
            <p>
              Events logged: <span className="font-semibold">{state.summary.eventCount}</span>
            </p>
            <p>
              Last update:{" "}
              <span className="font-semibold">
                {new Date(state.summary.lastEventAt).toLocaleString()}
              </span>
            </p>
            <p className="text-emerald-50/80">{describeHandoffState(state.summary)}</p>
            {state.summary.externalReferences.length ? (
              <p>
                External refs:{" "}
                <span className="font-semibold">{state.summary.externalReferences.join(", ")}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
