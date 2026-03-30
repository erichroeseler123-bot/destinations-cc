"use client";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

type RedRocksClickEvent = {
  event: "parr_click";
  source: "dcc";
  page: string;
  cta: string;
  destinationUrl: string;
  timestamp: string;
};

type RedRocksScrollDepthEvent = {
  event: "dcc_scroll_depth";
  source: "dcc";
  page: string;
  depth: number;
  timestamp: string;
};

type RedRocksVisibilityEvent = {
  event: "dcc_cta_visible";
  source: "dcc";
  page: string;
  cta: string;
  destinationUrl: string;
  timestamp: string;
};

export type RedRocksFunnelEvent =
  | RedRocksClickEvent
  | RedRocksScrollDepthEvent
  | RedRocksVisibilityEvent;

function pushEvent(event: RedRocksFunnelEvent) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(`dcc:${event.event}`, { detail: event }));

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(event);
  }
}

export function trackRedRocksParrClick(page: string, cta: string, destinationUrl: string) {
  pushEvent({
    event: "parr_click",
    source: "dcc",
    page,
    cta,
    destinationUrl,
    timestamp: new Date().toISOString(),
  });
}

export function trackRedRocksScrollDepth(page: string, depth: number) {
  pushEvent({
    event: "dcc_scroll_depth",
    source: "dcc",
    page,
    depth,
    timestamp: new Date().toISOString(),
  });
}

export function trackRedRocksCtaVisible(page: string, cta: string, destinationUrl: string) {
  pushEvent({
    event: "dcc_cta_visible",
    source: "dcc",
    page,
    cta,
    destinationUrl,
    timestamp: new Date().toISOString(),
  });
}
