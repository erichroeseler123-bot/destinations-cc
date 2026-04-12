"use client";

const CORRIDOR_EVENT_ENDPOINT =
  process.env.NEXT_PUBLIC_DCC_EVENT_ENDPOINT ||
  "https://www.destinationcommandcenter.com/api/internal/corridor-events";
const SESSION_KEY = "dcc_corridor_session_v1";

type MappingClickEvent = {
  event: "dcc_mapping_click";
  source: "dcc";
  page: string;
  corridor?: string;
  cta: string;
  routeKey: string;
  provider: string;
  targetKind: string;
  operatorId?: string;
  destinationUrl: string;
  timestamp: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export type MappingTelemetryMeta = {
  corridor?: string;
  routeKey: string;
  provider: string;
  targetKind: string;
  operatorId?: string;
};

export function trackMappedDestinationClick(
  page: string,
  cta: string,
  destinationUrl: string,
  meta: MappingTelemetryMeta,
) {
  if (typeof window === "undefined") return;

  const payload: MappingClickEvent = {
    event: "dcc_mapping_click",
    source: "dcc",
    page,
    corridor: meta.corridor,
    cta,
    routeKey: meta.routeKey,
    provider: meta.provider,
    targetKind: meta.targetKind,
    operatorId: meta.operatorId,
    destinationUrl,
    timestamp: new Date().toISOString(),
  };

  window.dispatchEvent(new CustomEvent("dcc:dcc_mapping_click", { detail: payload }));
  const corridorId = resolveWarehouseCorridorId(meta);
  if (corridorId) {
    const targetPath = getTargetPath(destinationUrl);
    void fetch(CORRIDOR_EVENT_ENDPOINT, {
      method: "POST",
      mode: "cors",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        corridor_id: corridorId,
        event_name: "dcc_mapping_click",
        occurred_at: payload.timestamp,
        session_id: getSessionId(),
        source_page: page,
        landing_path: window.location.pathname,
        target_path: targetPath,
        route_target: meta.routeKey,
        metadata: {
          source: payload.source,
          page: payload.page,
          corridor: payload.corridor,
          source_corridor: meta.corridor,
          cta: payload.cta,
          route_key: payload.routeKey,
          provider: payload.provider,
          target_kind: payload.targetKind,
          operator_id: payload.operatorId,
          destination_url: payload.destinationUrl,
          timestamp: payload.timestamp,
        },
      }),
    }).catch(() => undefined);
  }
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(payload);
  }
}

function resolveWarehouseCorridorId(meta: MappingTelemetryMeta) {
  const operatorId = String(meta.operatorId || "").toLowerCase();
  if (operatorId === "partyatredrocks") return "partyatredrocks";
  if (operatorId === "airport-420-pickup") return "airport-420-pickup";
  if (operatorId === "welcometotheswamp" || operatorId === "wts") return "welcometotheswamp";
  if (operatorId === "wta" || operatorId === "juneauflightdeck") return "wta";
  if (operatorId === "saveonthestrip" || operatorId === "sots") return "saveonthestrip";

  const corridor = String(meta.corridor || "").toLowerCase();
  if (corridor.includes("swamp")) return "welcometotheswamp";
  if (corridor.includes("vegas")) return "saveonthestrip";
  if (corridor.includes("alaska") || corridor.includes("juneau")) return "wta";
  if (corridor.includes("420")) return "airport-420-pickup";
  if (corridor.includes("red-rocks") || corridor.includes("red rocks")) return "partyatredrocks";

  return meta.corridor;
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

function getTargetPath(destinationUrl: string) {
  try {
    return new URL(destinationUrl, window.location.href).pathname;
  } catch {
    return destinationUrl;
  }
}
