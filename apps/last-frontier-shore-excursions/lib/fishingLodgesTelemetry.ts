import { SEAK_FISHING_LODGES_PATH } from "./fishingLodgesConfig";

export type FishingLodgeTelemetryEvent =
  | "lfse_lodge_page_view"
  | "lfse_lodge_directory_filter"
  | "lfse_lodge_compare_used"
  | "lfse_lodge_printable_compare_used"
  | "lfse_lodge_official_outbound_click"
  | "lfse_lodge_ecosystem_handoff";

export interface FishingLodgeTelemetryPayload {
  event: FishingLodgeTelemetryEvent;
  pagePath?: string;
  action?: string;
  lodgeSlug?: string;
  stayFormat?: string;
  subRegion?: string;
  compareCount?: number;
  targetSurface?: string;
  targetUrl?: string;
}

function isPreviewOrQaRuntime(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname.toLowerCase();
  const isCanonicalProd =
    host === "www.lastfrontiershoreexcursions.com" ||
    host === "lastfrontiershoreexcursions.com";
  if (!isCanonicalProd) return true;
  const sp = new URLSearchParams(window.location.search);
  return (
    sp.get("qa") === "1" ||
    sp.get("qa") === "true" ||
    sp.get("qa_test") === "1" ||
    sp.get("is_test") === "1"
  );
}

function getOrCreateLfseSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const key = "lfse_anon_session_v1";
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const fresh = `lfse_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    window.sessionStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return "lfse_web";
  }
}

let customTelemetryFetchForTests: typeof fetch | null = null;
export function setLfseTelemetryFetchForTests(fn: typeof fetch | null): void {
  customTelemetryFetchForTests = fn;
}
export function getLfseTelemetryFetch(): typeof fetch {
  return customTelemetryFetchForTests ?? fetch;
}

export function trackFishingLodgeDirectoryEvent(
  payload: FishingLodgeTelemetryPayload,
): void {
  if (typeof window === "undefined") return;

  const qa = isPreviewOrQaRuntime();
  const resolvedPage =
    payload.pagePath || window.location.pathname || SEAK_FISHING_LODGES_PATH;
  const body = {
    ...payload,
    site: "lastfrontiershoreexcursions.com",
    page: resolvedPage,
    path: resolvedPage,
    sessionId: getOrCreateLfseSessionId(),
    bookingConfirmed: false,
    qa,
    occurredAt: new Date().toISOString(),
  };

  try {
    const win = window as unknown as { dataLayer?: unknown[] };
    win.dataLayer = win.dataLayer || [];
    win.dataLayer.push(body);
  } catch {
    // Non-blocking
  }

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/telemetry",
        new Blob([JSON.stringify(body)], { type: "application/json" }),
      );
    } else {
      fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking
  }
}
