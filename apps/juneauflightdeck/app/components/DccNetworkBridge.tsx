"use client";

import { useEffect } from "react";

const ENDPOINT = "/api/network/telemetry";
const SESSION_KEY = "dcc_network_session";
const CONTEXT_KEY = "dcc_traveler_context_v1";

export function getJfdSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = `dcc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

export function getJfdContext(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function captureInboundContext() {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("dcc_ctx");
  if (!raw) return getJfdContext();
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(raw.replace(/-/g, "+").replace(/_/g, "/"))));
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return getJfdContext();
  }
}

export function sendJfdTelemetry(eventName: string, outcome: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const sessionId = getJfdSessionId();
  const currentPath = window.location.pathname;
  const targetPath = typeof outcome.targetUrl === "string" ? outcome.targetUrl : undefined;

  const payload = {
    site: "juneau-flight-deck",
    eventName,
    sessionId,
    sourcePage: currentPath,
    landingPath: currentPath,
    targetPath,
    context: getJfdContext(),
    outcome,
  };

  fetch(ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    headers: { "content-type": "text/plain;charset=UTF-8" },
    body: JSON.stringify(payload),
  }).catch(() => undefined);

  // Store in local browser event buffer for diagnostics
  try {
    const raw = window.localStorage.getItem("jfd_widget_telemetry_v1");
    const existing = raw ? JSON.parse(raw) : [];
    const next = [
      ...existing,
      {
        event: eventName,
        timestamp: new Date().toISOString(),
        ...outcome,
        sourcePage: currentPath,
      },
    ].slice(-200);
    window.localStorage.setItem("jfd_widget_telemetry_v1", JSON.stringify(next));
  } catch {
    // Local storage non-blocking
  }

  // Trigger Google Analytics / GTM dataLayer if present
  try {
    const win = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: Array<Record<string, unknown>>;
    };
    if (typeof win.gtag === "function") {
      win.gtag("event", eventName, { ...outcome, page: currentPath });
    } else if (Array.isArray(win.dataLayer)) {
      win.dataLayer.push({ event: eventName, ...outcome, page: currentPath });
    }
  } catch {
    // Non-blocking
  }

  // Dispatch custom DOM event
  try {
    window.dispatchEvent(new CustomEvent(`jfd:${eventName}`, { detail: payload }));
  } catch {
    // Non-blocking
  }
}

export default function DccNetworkBridge() {
  useEffect(() => {
    // 1. Log inbound context and page view
    const inbound = captureInboundContext();
    sendJfdTelemetry(inbound ? "handoff_received" : "page_viewed", {
      inboundContextPresent: Boolean(inbound),
    });

    // 2. Attach global delegated click tracker for external booking buttons
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a");
      if (!anchor || !anchor.href) return;

      const href = anchor.href;
      const isFareHarbor = href.includes("fareharbor.com");
      const isViator = href.includes("viator.com");
      const isGYG = href.includes("getyourguide.com");

      if (!isFareHarbor && !isViator && !isGYG && !anchor.dataset.bookingClick) {
        return;
      }

      const provider = isFareHarbor
        ? "fareharbor"
        : isViator
        ? "viator"
        : isGYG
        ? "getyourguide"
        : "external";

      let tourSlug = anchor.dataset.tourSlug || "";
      let tourName = anchor.dataset.tourName || "";

      if (!tourSlug && isFareHarbor) {
        if (href.includes("/214803/")) {
          tourSlug = "temsco-mendenhall-glacier-walk";
          tourName = "TEMSCO Mendenhall Glacier Walk";
        } else if (href.includes("/214810/")) {
          tourSlug = "temsco-glacier-dog-sledding";
          tourName = "TEMSCO Glacier Dog Sledding";
        } else if (href.includes("/413056/")) {
          tourSlug = "coastal-herbert-glacier-landing";
          tourName = "Coastal Herbert Glacier Landing";
        } else if (href.includes("/115991/")) {
          tourSlug = "northstar-glacier-dogsled";
          tourName = "NorthStar Glacier Dogsled";
        } else if (href.includes("/116029/")) {
          tourSlug = "northstar-glacier-walkabout";
          tourName = "NorthStar Glacier Walkabout";
        } else if (href.includes("/116035/")) {
          tourSlug = "northstar-glacier-ice-trek";
          tourName = "NorthStar Glacier Ice Trek";
        }
      } else if (!tourSlug && isViator) {
        const lowerHref = href.toLowerCase();
        if (lowerHref.includes("temsco")) {
          tourSlug = "viator-temsco-search";
          tourName = "Viator TEMSCO Tours Search";
        } else if (lowerHref.includes("coastal")) {
          tourSlug = "viator-coastal-search";
          tourName = "Viator Coastal Tours Search";
        } else if (lowerHref.includes("northstar")) {
          tourSlug = "viator-northstar-search";
          tourName = "Viator NorthStar Tours Search";
        } else {
          tourSlug = "viator-general-search";
          tourName = "Viator Juneau Helicopter Search";
        }
      }

      const anchorText = anchor.textContent?.trim().slice(0, 100) || "";

      sendJfdTelemetry("booking_clicked", {
        provider,
        tourSlug: tourSlug || "unspecified",
        tourName: tourName || anchorText,
        targetUrl: href,
        anchorText,
        sourcePage: window.location.pathname,
      });
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}
