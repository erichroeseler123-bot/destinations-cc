"use client";

export type WidgetVariant = "primary" | "backup" | "edge";
export type WidgetIntent = "trust" | "value" | "chooser" | "direct";
export type WidgetAction = "inline_selector" | "detail_page" | "add_to_cart" | "external_booking";

export type DecisionWidget = {
  id: string;
  corridor: "wta";
  productId: string;
  variant: WidgetVariant;
  intent: WidgetIntent;
  recommendationLabel: string;
  title: string;
  promiseLine: string;
  proofPoints: string[];
  fitTags: string[];
  priceFrom?: string;
  durationLabel?: string;
  availabilityLabel?: string;
  availabilitySeverity?: "low" | "medium" | "high";
  imageUrl?: string;
  action: WidgetAction;
  ctaLabel: string;
  href: string;
  position: number;
  prefill?: {
    date?: string;
    partySize?: number;
    priority?: "scenic" | "adventure" | "premium" | "budget";
    travelerType?: "first-time" | "family" | "short-port" | "photography";
  };
};

type WidgetTelemetryEvent =
  | "widget_impression"
  | "widget_click"
  | "widget_open_detail"
  | "widget_open_selector"
  | "widget_expand"
  | "widget_add_to_cart"
  | "widget_fallback_click"
  | "widget_abandon"
  | "handoff_viewed"
  | "shortlist_rendered"
  | "certainty_cta_clicked"
  | "entered_guided_flow"
  | "primary_recommendation_clicked";

type WidgetEventProps = Record<string, unknown> & {
  widget_id?: string;
  product_id?: string;
  variant?: WidgetVariant;
  intent?: WidgetIntent;
  corridor?: string;
  page_type?: string;
  source_page?: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

const LOCAL_EVENT_BUFFER_KEY = "jfd_widget_telemetry_v1";
const LOCAL_EVENT_BUFFER_LIMIT = 200;
const CORRIDOR_EVENT_ENDPOINT =
  process.env.NEXT_PUBLIC_DCC_EVENT_ENDPOINT ||
  "https://www.destinationcommandcenter.com/api/internal/corridor-events";
const SESSION_KEY = "dcc_corridor_session_v1";

function getPageStartedAt(pathname: string) {
  if (typeof window === "undefined") return null;

  const key = `jfd_page_started_at:${pathname}`;

  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing) {
      const parsed = Number(existing);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    const startedAt = Date.now() - Math.round(window.performance?.now?.() || 0);
    window.sessionStorage.setItem(key, String(startedAt));
    return startedAt;
  } catch {
    return null;
  }
}

function appendLocalEvent(name: WidgetTelemetryEvent, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(LOCAL_EVENT_BUFFER_KEY);
    const existing = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
    const next = [
      ...existing,
      {
        event: name,
        timestamp: new Date().toISOString(),
        ...payload,
      },
    ].slice(-LOCAL_EVENT_BUFFER_LIMIT);
    window.localStorage.setItem(LOCAL_EVENT_BUFFER_KEY, JSON.stringify(next));
  } catch {
    // Telemetry should never block the product.
  }
}

export function trackWidgetEvent(name: WidgetTelemetryEvent, props: WidgetEventProps) {
  if (typeof window === "undefined") return;

  const pathname = window.location.pathname;
  const startedAt = getPageStartedAt(pathname);
  const payload: Record<string, unknown> & WidgetEventProps & { page: string; time_to_action_ms?: number } = {
    ...props,
    page: pathname,
    time_to_action_ms: startedAt ? Math.max(0, Date.now() - startedAt) : undefined,
  };

  const corridorId =
    (typeof payload.corridor === "string" && payload.corridor) ||
    (typeof payload.corridor_id === "string" && payload.corridor_id) ||
    "";
  if (
    corridorId &&
    (name === "handoff_viewed" ||
      name === "shortlist_rendered" ||
      name === "widget_click" ||
      name === "widget_add_to_cart" ||
      name === "certainty_cta_clicked" ||
      name === "entered_guided_flow" ||
      name === "primary_recommendation_clicked")
  ) {
    void fetch(CORRIDOR_EVENT_ENDPOINT, {
      method: "POST",
      mode: "cors",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        corridor_id: corridorId,
        event_name:
          name === "widget_click" ||
          name === "widget_add_to_cart" ||
          name === "primary_recommendation_clicked"
            ? "product_opened"
            : name,
        occurred_at: new Date().toISOString(),
        session_id: getSessionId(),
        source_page: typeof payload.source_page === "string" ? payload.source_page : undefined,
        landing_path: pathname,
        handoff_id: typeof payload.handoff_id === "string" ? payload.handoff_id : undefined,
        requested_lane:
          typeof payload.requested_lane === "string" ? payload.requested_lane : undefined,
        resolved_lane: typeof payload.resolved_lane === "string" ? payload.resolved_lane : undefined,
        topic: typeof payload.topic === "string" ? payload.topic : undefined,
        subtype: typeof payload.subtype === "string" ? payload.subtype : undefined,
        port: typeof payload.port === "string" ? payload.port : undefined,
        handoff_date: typeof payload.date === "string" ? payload.date : undefined,
        default_card_slug:
          typeof payload.default_card_slug === "string"
            ? payload.default_card_slug
            : typeof payload.product_slug === "string"
              ? payload.product_slug
              : undefined,
        clicked_product_slug:
          name === "widget_click" || name === "widget_add_to_cart"
            ? typeof payload.product_id === "string"
              ? payload.product_id
              : typeof payload.product_slug === "string"
                ? payload.product_slug
                : undefined
            : undefined,
        fit_signal: typeof payload.fit_signal === "string" ? payload.fit_signal : undefined,
        urgency:
          payload.urgency === "low" || payload.urgency === "medium" || payload.urgency === "high"
            ? payload.urgency
            : undefined,
        decision_mode:
          payload.decision_mode === "guided" || payload.decision_mode === "browse"
            ? payload.decision_mode
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

  window.dispatchEvent(new CustomEvent(`jfd:${name}`, { detail: payload }));
  appendLocalEvent(name, payload);

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
