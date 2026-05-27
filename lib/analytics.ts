"use client";

type EventProps = {
  surface: string;
  page?: string;
  corridor?: string | null;
  page_type?: string | null;
  port_slug?: string | null;
  target_path?: string | null;
  [key: string]: unknown;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const LOCAL_EVENT_BUFFER_KEY = "dcc_telemetry_buffer_v1";
const LOCAL_EVENT_BUFFER_LIMIT = 250;
const CORRIDOR_EVENT_ENDPOINT = "/api/internal/corridor-events";

const LEGACY_DECISION_EVENT_MAP: Record<string, string> = {
  dcc_page_view: "landing_viewed",
  dcc_primary_cta_click: "cta_clicked_primary",
  plan_rendered: "verdict_shown",
  plan_accepted: "cta_clicked_primary",
  recommendation_clicked: "operator_cta_clicked",
};

function getApproxPageStart(pathname?: string) {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") return null;
  if (!pathname) return null;

  const key = `dcc_page_started_at:${pathname}`;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    const fallbackStart = Date.now() - Math.round(window.performance?.now?.() || 0);
    window.sessionStorage.setItem(key, String(fallbackStart));
    return fallbackStart;
  } catch {
    return null;
  }
}

function normalizeProps(props: EventProps): Record<string, unknown> {
  return {
    ...props,
    page: props.page || (typeof window !== "undefined" ? window.location.pathname : undefined),
    corridor: props.corridor ?? null,
    page_type: props.page_type ?? null,
    port_slug: props.port_slug ?? null,
    target_path: props.target_path ?? null,
  };
}

function shouldDebugCruiseEvent(payload: Record<string, unknown>) {
  return payload.surface === "cruise";
}

function mapCruiseEventName(name: string) {
  switch (name) {
    case "cruise_port_selected":
      return "destination_selected";
    case "cruise_port_directory_opened":
      return "dcc_mapping_click";
    case "cruise_lane_primary_cta_clicked":
      return "cta_clicked_primary";
    case "cruise_lane_backup_cta_clicked":
      return "cta_clicked_alternative";
    default:
      return null;
  }
}

function postCruiseEvent(name: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined" || !shouldDebugCruiseEvent(payload)) return;

  const eventName = mapCruiseEventName(name);
  if (!eventName) return;

  void fetch(CORRIDOR_EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      corridor_id: "cruise-debug",
      event_name: eventName,
      occurred_at: new Date().toISOString(),
      source_page: typeof payload.page === "string" ? payload.page : undefined,
      landing_path: typeof payload.page === "string" ? payload.page : undefined,
      target_path: typeof payload.target_path === "string" ? payload.target_path : undefined,
      route_target: typeof payload.target_path === "string" ? payload.target_path : undefined,
      port: typeof payload.port_slug === "string" ? payload.port_slug : undefined,
      metadata: {
        original_event_name: name,
        ...payload,
      },
    }),
  }).catch(() => undefined);
}

export function mapLegacyDecisionEventName(name: string) {
  return LEGACY_DECISION_EVENT_MAP[name] || name;
}

export function isDecisionFunnelEvent(name: string) {
  const mappedName = mapLegacyDecisionEventName(name);
  return (
    mappedName === "landing_viewed" ||
    mappedName === "verdict_shown" ||
    mappedName === "product_opened" ||
    mappedName === "affiliate_fallback_opened" ||
    mappedName === "marketplace_fallback_clicked" ||
    mappedName === "fallback_inventory_viewed" ||
    mappedName === "viator_fallback_handoff" ||
    mappedName === "operator_cta_clicked" ||
    mappedName === "cta_clicked_primary" ||
    mappedName === "booking_opened"
  );
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function buildDecisionFunnelPayload(name: string, payload: Record<string, unknown>) {
  const eventName = mapLegacyDecisionEventName(name);
  if (!isDecisionFunnelEvent(eventName)) return null;
  const corridorId = readString(payload.corridor) || readString(payload.surface);
  if (!corridorId) return null;

  return {
    corridor_id: corridorId,
    event_name: eventName,
    occurred_at: new Date().toISOString(),
    handoff_id: readString(payload.dcc_handoff_id),
    source_page: readString(payload.source_page) || readString(payload.page),
    landing_path: readString(payload.page),
    target_path: readString(payload.target_path) || readString(payload.target_url) || readString(payload.href),
    default_card_slug: readString(payload.decision_product),
    clicked_product_slug:
      readString(payload.product_code) ||
      readString(payload.decision_product) ||
      readString(payload.product_slot),
    route_target:
      readString(payload.route_target) ||
      readString(payload.route_key) ||
      readString(payload.target_path) ||
      readString(payload.target_url) ||
      readString(payload.href),
    fit_signal: readString(payload.intent) || readString(payload.decision_option),
    metadata: {
      ...payload,
      original_event_name: name,
      canonical_event_name: eventName,
    },
  };
}

function postDecisionFunnelEvent(name: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const body = buildDecisionFunnelPayload(name, payload);
  if (!body) return;

  void fetch(CORRIDOR_EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function appendLocalTelemetryEvent(name: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;

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
    // Ignore storage failures; analytics should never block UX.
  }
}

export function trackEvent(name: string, props: EventProps) {
  if (typeof window === "undefined") return;
  const payload = normalizeProps(props);
  const page = typeof payload.page === "string" ? payload.page : undefined;
  const startedAt = getApproxPageStart(page);
  const enrichedPayload =
    name === "dcc_exit_clicked" && startedAt
      ? {
          ...payload,
          time_to_exit_ms: Math.max(0, Date.now() - startedAt),
        }
      : payload;

  window.dispatchEvent(new CustomEvent(`dcc:${name}`, { detail: enrichedPayload }));
  appendLocalTelemetryEvent(name, enrichedPayload);
  postCruiseEvent(name, enrichedPayload);
  postDecisionFunnelEvent(name, enrichedPayload);

  if (process.env.NODE_ENV !== "production" && shouldDebugCruiseEvent(enrichedPayload)) {
    console.info("[dcc-cruise-telemetry]", name, enrichedPayload);
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", name, enrichedPayload);
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...enrichedPayload });
  }
}
