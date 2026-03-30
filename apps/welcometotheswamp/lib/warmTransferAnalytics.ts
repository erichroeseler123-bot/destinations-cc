import type { WarmTransferContext, WarmTransferIntent, WarmTransferSource, WarmTransferSourcePage, WarmTransferSubtype, WarmTransferTopic } from "@/lib/warmTransfer";

export type WarmTransferEventType = "plan_viewed" | "plan_click";

export type WarmTransferAnalyticsPayload = {
  eventType: WarmTransferEventType;
  pagePath: "/plan";
  intent: WarmTransferIntent;
  topic: WarmTransferTopic;
  subtype: WarmTransferSubtype | null;
  context: WarmTransferContext | null;
  source: WarmTransferSource;
  sourcePage: WarmTransferSourcePage | null;
  targetId?: string;
  targetHref?: string;
  lane?: string | null;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function postWarmTransferEvent(payload: WarmTransferAnalyticsPayload) {
  const body = JSON.stringify({
    ...payload,
    timestamp: new Date().toISOString(),
  });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/internal/warm-transfer", blob);
    return;
  }

  void fetch("/api/internal/warm-transfer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackWarmTransferEvent(payload: WarmTransferAnalyticsPayload): void {
  if (typeof window === "undefined") return;
  const event = {
    event: "wts_warm_transfer",
    ...payload,
    timestamp: new Date().toISOString(),
  };

  window.dispatchEvent(new CustomEvent("wts:warm-transfer", { detail: event }));
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(event);
  }
  postWarmTransferEvent(payload);
}
