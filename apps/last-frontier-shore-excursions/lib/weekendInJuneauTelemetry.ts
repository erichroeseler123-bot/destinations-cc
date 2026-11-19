import { WEEKEND_IN_JUNEAU_PATH } from "./weekendInJuneauGuideData";

/**
 * Distinct telemetry events for `/guides/weekend-in-juneau`:
 * 1. `lfse_guide_engagement` — itinerary tab, base toggle, or section interaction
 * 2. `lfse_printable_plan_used` — print / save PDF itinerary sheet triggered
 * 3. `lfse_jfd_guide_handoff` — cross-network planning link to juneauflightdeck.com
 * 4. `lfse_seller_handoff_click` — outbound click to operator/reseller availability (NOT a confirmed booking)
 */
export type WeekendGuideTelemetryEvent =
  | "lfse_guide_engagement"
  | "lfse_printable_plan_used"
  | "lfse_jfd_guide_handoff"
  | "lfse_seller_handoff_click";

export interface WeekendGuideTelemetryPayload {
  event: WeekendGuideTelemetryEvent;
  action?: string;
  stayDuration?: string;
  stayBase?: string;
  operatorName?: string;
  sellerChannel?: string;
  provider?: string;
  productCode?: string;
  campaign?: string;
  targetUrl?: string;
}

function isPreviewOrQaHost(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname.toLowerCase();
  const isCanonicalProd =
    host === "www.lastfrontiershoreexcursions.com" ||
    host === "lastfrontiershoreexcursions.com";
  if (!isCanonicalProd) return true;
  const sp = new URLSearchParams(window.location.search);
  return sp.get("qa") === "1" || sp.get("qa") === "true";
}

export function trackWeekendInJuneauEvent(payload: WeekendGuideTelemetryPayload): void {
  if (typeof window === "undefined") return;

  const qa = isPreviewOrQaHost();
  const body = {
    ...payload,
    page: WEEKEND_IN_JUNEAU_PATH,
    port: "juneau",
    bookingConfirmed: false,
    qa,
    occurredAt: new Date().toISOString(),
  };

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(body);
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
