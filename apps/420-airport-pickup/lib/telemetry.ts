"use client";

type Airport420TelemetryEvent =
  | "handoff_viewed"
  | "shortlist_rendered"
  | "product_opened"
  | "booking_opened"
  | "checkout_started";

type Airport420EventProps = Record<string, unknown>;

const CORRIDOR_EVENT_ENDPOINT =
  process.env.NEXT_PUBLIC_DCC_EVENT_ENDPOINT ||
  "https://www.destinationcommandcenter.com/api/internal/corridor-events";
const SESSION_KEY = "dcc_corridor_session_v1";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackAirport420Event(name: Airport420TelemetryEvent, props: Airport420EventProps) {
  if (typeof window === "undefined") return;

  const payload: Airport420EventProps & { page: string } = {
    ...props,
    page: window.location.pathname,
  };

  const sessionId = getSessionId();
  const corridorId =
    (typeof payload.corridor === "string" && payload.corridor) ||
    (typeof payload.corridor_id === "string" && payload.corridor_id) ||
    "";

  if (corridorId) {
    void fetch(CORRIDOR_EVENT_ENDPOINT, {
      method: "POST",
      mode: "cors",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        corridor_id: corridorId,
        event_name: name,
        occurred_at: new Date().toISOString(),
        session_id: sessionId,
        source_page: typeof payload.source_page === "string" ? payload.source_page : undefined,
        landing_path: window.location.pathname,
        target_path: typeof payload.target_path === "string" ? payload.target_path : undefined,
        decision_corridor:
          typeof payload.decision_corridor === "string" ? payload.decision_corridor : undefined,
        decision_cta:
          typeof payload.decision_cta === "string" ? payload.decision_cta : undefined,
        decision_action:
          typeof payload.decision_action === "string" ? payload.decision_action : undefined,
        decision_option:
          typeof payload.decision_option === "string" ? payload.decision_option : undefined,
        decision_product:
          typeof payload.decision_product === "string" ? payload.decision_product : undefined,
        decision_entry:
          typeof payload.decision_entry === "string" ? payload.decision_entry : undefined,
        decision_state:
          typeof payload.decision_state === "string" ? payload.decision_state : undefined,
        requested_lane:
          typeof payload.requested_lane === "string" ? payload.requested_lane : undefined,
        resolved_lane: typeof payload.resolved_lane === "string" ? payload.resolved_lane : undefined,
        topic: typeof payload.topic === "string" ? payload.topic : undefined,
        subtype: typeof payload.subtype === "string" ? payload.subtype : undefined,
        port: typeof payload.port === "string" ? payload.port : undefined,
        handoff_id: typeof payload.handoff_id === "string" ? payload.handoff_id : undefined,
        handoff_date: typeof payload.date === "string" ? payload.date : undefined,
        default_card_slug:
          typeof payload.default_card_slug === "string"
            ? payload.default_card_slug
            : name === "handoff_viewed" || name === "shortlist_rendered"
              ? typeof payload.product_slug === "string"
                ? payload.product_slug
                : undefined
              : undefined,
        clicked_product_slug:
          typeof payload.clicked_product_slug === "string"
            ? payload.clicked_product_slug
            : name === "product_opened" || name === "booking_opened"
              ? typeof payload.product_slug === "string"
                ? payload.product_slug
                : undefined
              : undefined,
        route_target:
          typeof payload.route_target === "string" ? payload.route_target : undefined,
        fit_signal: typeof payload.fit_signal === "string" ? payload.fit_signal : undefined,
        urgency:
          payload.urgency === "low" || payload.urgency === "medium" || payload.urgency === "high"
            ? payload.urgency
            : undefined,
        confidence_downgraded: payload.confidence_downgraded === true,
        winning_rule_ids: Array.isArray(payload.winning_rule_ids)
          ? payload.winning_rule_ids.filter((value: unknown): value is string => typeof value === "string")
          : undefined,
        winning_fields: isStringRecord(payload.winning_fields) ? payload.winning_fields : undefined,
        metadata: payload,
      }),
    }).catch(() => undefined);
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...payload });
  }
}

function getSessionId() {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    window.localStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return `anon-${Date.now()}`;
  }
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
}
