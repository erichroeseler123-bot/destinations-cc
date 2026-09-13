export type AnalyticsEventType =
  | "port_window_calculated"
  | "eligible_results_shown"
  | "affiliate_impression"
  | "affiliate_product_view"
  | "affiliate_availability_opened"
  | "affiliate_link_click"
  | "affiliate_provider_selected"
  | "fallback_shown";

export interface AnalyticsEventPayload {
  event: AnalyticsEventType;
  page?: string;
  port?: string;
  category?: string;
  provider?: string;
  productId?: string;
  campaign?: string;
  status?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export function trackAffiliateEvent(payload: AnalyticsEventPayload) {
  if (typeof window === "undefined") return;

  const eventData = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
    page: payload.page || window.location.pathname,
  };

  // 1. Console diagnostics in development
  if (process.env.NODE_ENV !== "production") {
    console.log(`[LFSE Analytics: ${payload.event}]`, eventData);
  }

  // 2. Dispatch to local telemetry endpoint (non-blocking, zero-PII)
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/telemetry",
        new Blob([JSON.stringify(eventData)], { type: "application/json" })
      );
    } else {
      fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking
  }
}
