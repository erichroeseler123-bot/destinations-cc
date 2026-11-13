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
  | "cp_board_created"
  | "planner_view"
  | "organizer_copy_imported";

export interface TrackNetworkEventInput {
  eventName: SharedNetworkEventName;
  originatingSite: "dcc" | "partyatredrocks" | "gosno" | "cruisepromenade";
  destinationSite?: "dcc" | "partyatredrocks" | "gosno" | "cruisepromenade";
  entryPage?: string;
  travelIntent?: string;
  campaignSource?: string;
  date?: string;
  corridorId?: string;
  eventId?: string;
  journeyId?: string;
  isTest?: boolean;
}

const JOURNEY_STORAGE_KEY = "dcc_journey_id_v1";
const JOURNEY_TTL_MS = 24 * 60 * 60 * 1000;
const JOURNEY_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function createOpaqueId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateJourneyId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlJourneyId = urlParams.get("journey_id")?.trim() || "";
    if (JOURNEY_ID_RE.test(urlJourneyId)) {
      const record = JSON.stringify({ id: urlJourneyId, expiresAt: Date.now() + JOURNEY_TTL_MS });
      window.sessionStorage.setItem(JOURNEY_STORAGE_KEY, urlJourneyId);
      window.localStorage.setItem(JOURNEY_STORAGE_KEY, record);
      return urlJourneyId;
    }

    const sessionVal = window.sessionStorage.getItem(JOURNEY_STORAGE_KEY);
    if (sessionVal && JOURNEY_ID_RE.test(sessionVal)) return sessionVal;

    const rawLocal = window.localStorage.getItem(JOURNEY_STORAGE_KEY);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal) as { id?: string; expiresAt?: number };
      if (parsed?.id && JOURNEY_ID_RE.test(parsed.id) && (parsed.expiresAt ?? 0) > Date.now()) {
        window.sessionStorage.setItem(JOURNEY_STORAGE_KEY, parsed.id);
        return parsed.id;
      }
    }

    const fresh = createOpaqueId("jrn");
    window.sessionStorage.setItem(JOURNEY_STORAGE_KEY, fresh);
    window.localStorage.setItem(
      JOURNEY_STORAGE_KEY,
      JSON.stringify({ id: fresh, expiresAt: Date.now() + JOURNEY_TTL_MS }),
    );
    return fresh;
  } catch {
    return createOpaqueId("jrn");
  }
}

export function isQaTestMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("qa_test") === "1" || params.get("is_test") === "1";
  } catch {
    return false;
  }
}

function getAnonymousSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const key = "dcc_anon_session_id";
    let sid = window.localStorage.getItem(key);
    if (!sid) {
      sid = createOpaqueId("sess");
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
  const journeyId = input.journeyId || getOrCreateJourneyId();
  const eventId = input.eventId || createOpaqueId("evt");
  const entryPage = input.entryPage || window.location.pathname || "/";
  const urlParams = new URLSearchParams(window.location.search);
  const isTest = Boolean(input.isTest || isQaTestMode());
  const campaignSource =
    input.campaignSource || urlParams.get("source") || urlParams.get("utm_source") || (isTest ? "qa_test" : "direct");

  const payload = JSON.stringify({
    corridor_id: input.corridorId || "portfolio-network",
    event_name: input.eventName,
    event_id: eventId,
    journey_id: journeyId,
    handoff_id: journeyId,
    is_test: isTest,
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
      journey_id: journeyId,
      event_id: eventId,
      is_test: isTest,
    },
  });

  const endpoint = "/api/public/corridor-events";
  try {
    let sent = false;
    if (typeof navigator.sendBeacon === "function") {
      sent = navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
    }
    if (!sent) {
      void fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isTest ? { "x-qa-test": "1" } : {}),
        },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    // Non-blocking telemetry
  }
}
