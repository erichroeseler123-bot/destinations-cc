import { SEAK_FISHING_LODGES_PATH } from "./fishingLodgesConfig";

export type FishingLodgeTelemetryEvent =
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
  return sp.get("qa") === "1" || sp.get("qa") === "true";
}

export function trackFishingLodgeDirectoryEvent(
  payload: FishingLodgeTelemetryPayload,
): void {
  if (typeof window === "undefined") return;

  const qa = isPreviewOrQaRuntime();
  const body = {
    ...payload,
    page: payload.pagePath || SEAK_FISHING_LODGES_PATH,
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
