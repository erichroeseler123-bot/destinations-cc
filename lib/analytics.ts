"use client";

type EventProps = {
  surface: string;
  page?: string;
  corridor?: string | null;
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
  };
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

  if (typeof window.gtag === "function") {
    window.gtag("event", name, enrichedPayload);
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...enrichedPayload });
  }
}
