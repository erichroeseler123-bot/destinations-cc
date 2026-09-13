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
  tourTitle?: string;
  destinationUrl?: string;
  placement?: "card" | "comparison_table" | "hero_cta" | "guide_link";
  isExactProduct?: boolean;
  campaign?: string;
  status?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
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

  // 2. Forward to Google Analytics gtag if initialized
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", payload.event, {
        event_category: "affiliate_outbound",
        event_label: payload.tourTitle || payload.destinationUrl || payload.campaign,
        provider: payload.provider,
        port: payload.port,
        category: payload.category,
        product_id: payload.productId || "unverified_search",
        placement: payload.placement || "card",
        is_exact_product: payload.isExactProduct || false,
        destination_url: payload.destinationUrl,
        campaign: payload.campaign,
      });
    }
  } catch {
    // Non-blocking
  }

  // 3. Dispatch to local telemetry endpoint (non-blocking, zero-PII)
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
