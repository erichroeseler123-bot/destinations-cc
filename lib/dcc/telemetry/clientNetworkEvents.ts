"use client";

export type SharedNetworkEventName =
  | "service_page_view"
  | "date_selected"
  | "availability_started"
  | "booking_handoff"
  | "booking_completed"
  | "network_handoff"
  | "dcc_plan_opened"
  | "cp_sailing_started"
  | "cp_board_created";

export interface TrackNetworkEventInput {
  eventName: SharedNetworkEventName;
  originatingSite: "dcc" | "partyatredrocks" | "gosno" | "cruisepromenade";
  destinationSite?: "dcc" | "partyatredrocks" | "gosno" | "cruisepromenade";
  entryPage?: string;
  travelIntent?: string;
  campaignSource?: string;
  date?: string;
  corridorId?: string;
}

function getAnonymousSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const key = "dcc_anon_session_id";
    let sid = window.localStorage.getItem(key);
    if (!sid) {
      sid = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

export function trackNetworkEvent(input: TrackNetworkEventInput): void {
  if (typeof window === "undefined") return;
  const sessionId = getAnonymousSessionId();
  const entryPage = input.entryPage || window.location.pathname || "/";
  const urlParams = new URLSearchParams(window.location.search);
  const campaignSource =
    input.campaignSource || urlParams.get("source") || urlParams.get("utm_source") || "direct";

  const payload = JSON.stringify({
    corridor_id: input.corridorId || "portfolio-network",
    event_name: input.eventName,
    session_id: sessionId,
    source_page: entryPage,
    landing_path: entryPage,
    ...(input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? { handoff_date: input.date } : {}),
    metadata: {
      originating_site: input.originatingSite,
      entry_page: entryPage,
      destination_site: input.destinationSite || input.originatingSite,
      travel_intent: input.travelIntent || urlParams.get("intent") || "general",
      campaign_source: campaignSource,
      date: input.date || null,
      session_id: sessionId,
    },
  });

  const endpoint = "/api/public/corridor-events";
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  } catch {
    // Non-blocking telemetry
  }
}
