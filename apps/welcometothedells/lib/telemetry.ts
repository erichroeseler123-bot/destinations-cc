"use client";

type DellsTelemetryEvent =
  | "landing_viewed"
  | "hub_selected"
  | "next_stop_viewed"
  | "verdict_shown"
  | "product_opened"
  | "support_opened";
type DellsEventProps = Record<string, unknown>;

const CORRIDOR_EVENT_ENDPOINT =
  process.env.NEXT_PUBLIC_DCC_EVENT_ENDPOINT ||
  "https://www.destinationcommandcenter.com/api/internal/corridor-events";
const SESSION_KEY = "dcc_dells_session_v1";
const ATTRIBUTION_KEY = "dcc_dells_attribution_v1";
const LANDING_EVENT_KEY = "dcc_dells_landing_event_v1";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

type Attribution = {
  landing_path: string;
  landing_url: string;
  referrer: string;
  captured_at: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackDellsEvent(name: DellsTelemetryEvent, props: DellsEventProps) {
  if (typeof window === "undefined") return;

  const attribution = getAttribution();
  const payload: DellsEventProps & { page: string } = {
    ...attribution,
    ...props,
    page: window.location.pathname,
  };
  const sessionId = getSessionId();
  const corridorId =
    (typeof payload.corridor === "string" && payload.corridor) ||
    (typeof payload.corridor_id === "string" && payload.corridor_id) ||
    "wisconsin-dells-next-stop";

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
      source_page: "welcometothedells.com",
      landing_path: attribution.landing_path || window.location.pathname,
      target_path: typeof payload.target_path === "string" ? payload.target_path : undefined,
      decision_corridor: "wisconsin-dells-next-stop",
      corridor: corridorId,
      surface: "welcometothedells",
      route_key: "wisconsin-dells",
      experience_type: "dells_satellite_decision_surface",
      dcc_network_role: "satellite_decision_surface",
      decision_cta: typeof payload.decision_cta === "string" ? payload.decision_cta : undefined,
      decision_action: typeof payload.decision_action === "string" ? payload.decision_action : undefined,
      decision_option: typeof payload.decision_option === "string" ? payload.decision_option : undefined,
      decision_product: typeof payload.decision_product === "string" ? payload.decision_product : undefined,
      decision_state: typeof payload.decision_state === "string" ? payload.decision_state : "next_stop",
      clicked_product_slug:
        typeof payload.clicked_product_slug === "string" ? payload.clicked_product_slug : undefined,
      route_target: typeof payload.route_target === "string" ? payload.route_target : undefined,
      execution_tier: typeof payload.execution_tier === "string" ? payload.execution_tier : undefined,
      handoff_id: typeof payload.handoff_id === "string" ? payload.handoff_id : sessionId,
      fit_signal: typeof payload.fit_signal === "string" ? payload.fit_signal : undefined,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      referrer: attribution.referrer,
      metadata: payload,
    }),
  }).catch(() => undefined);

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...payload });
  }
}

export function trackDellsLanding(source = "homepage") {
  if (typeof window === "undefined") return;

  const sessionId = getSessionId();
  const eventKey = `${sessionId}:${window.location.pathname}:${window.location.search}`;

  try {
    if (window.sessionStorage.getItem(LANDING_EVENT_KEY) === eventKey) return;
    window.sessionStorage.setItem(LANDING_EVENT_KEY, eventKey);
  } catch {
    // If sessionStorage is blocked, still attempt the landing event.
  }

  trackDellsEvent("landing_viewed", {
    corridor: "wisconsin-dells-next-stop",
    decision_state: "landing",
    decision_action: "view_surface",
    decision_option: source,
    target_path: window.location.href,
  });
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

function getAttribution(): Attribution {
  const current = captureCurrentAttribution();
  try {
    const shouldRefresh = UTM_KEYS.some((key) => new URLSearchParams(window.location.search).has(key));
    if (shouldRefresh) {
      window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(current));
      return current;
    }

    const stored = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Attribution;
      return parsed;
    }

    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(current));
    return current;
  } catch {
    return current;
  }
}

function captureCurrentAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const attribution: Attribution = {
    landing_path: `${window.location.pathname}${window.location.search}`,
    landing_url: window.location.href,
    referrer: document.referrer || "",
    captured_at: new Date().toISOString(),
  };

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) attribution[key] = value;
  }

  return attribution;
}
