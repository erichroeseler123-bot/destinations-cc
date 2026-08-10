"use client";

import { useEffect } from "react";

const TELEMETRY_URL = "https://www.destinationcommandcenter.com/api/wno/telemetry";
const SESSION_KEY = "wno_funnel_session";
const ENTRY_PATH_KEY = "wno_entry_path";
const ENTRY_SOURCE_KEY = "wno_entry_source";
const LANDING_SENT_KEY = "wno_landing_sent";

function id() {
  return `wno_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function labelForEntry(pathname: string, explicitSource: string | null, referrer: string) {
  if (explicitSource) return explicitSource.slice(0, 80);
  try {
    const host = referrer ? new URL(referrer).hostname : "";
    if (host.includes("destinationcommandcenter.com")) return "dcc-new-orleans";
    if (host.includes("welcometotheswamp.com")) return "welcome-to-the-swamp";
    if (host.includes("frenchquarterorientation.com")) return "french-quarter-orientation";
  } catch {}

  const clean = pathname.replace(/^\/guides\//, "").replace(/^\//, "") || "home";
  return `wtonot-entry-${clean}`.slice(0, 80);
}

function classifyClick(href: string) {
  if (href.startsWith("tel:")) return "phone_click";
  if (href.startsWith("sms:")) return "sms_click";
  if (href.includes("fareharbor.com")) return "fareharbor_click";
  return null;
}

function ctaLocation(anchor: HTMLAnchorElement) {
  return (
    anchor.dataset.ctaLocation ||
    anchor.closest<HTMLElement>("[data-cta-location]")?.dataset.ctaLocation ||
    anchor.closest("header") ? "header" :
    anchor.closest("footer") ? "footer" :
    "page"
  );
}

export function getWnoFunnelContext() {
  if (typeof window === "undefined") return null;
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = id();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return {
    sessionId,
    landingPath: sessionStorage.getItem(ENTRY_PATH_KEY) || window.location.pathname,
    source: sessionStorage.getItem(ENTRY_SOURCE_KEY) || "wtonot-unknown",
  };
}

export function sendWnoTelemetry(event: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const context = getWnoFunnelContext();
  if (!context) return;
  const body = JSON.stringify({ ...event, ...context });
  fetch(TELEMETRY_URL, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    headers: { "content-type": "text/plain;charset=UTF-8" },
    body,
  }).catch(() => undefined);
}

export default function WnoFunnelTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const context = getWnoFunnelContext();
    if (!context) return;

    if (!sessionStorage.getItem(ENTRY_PATH_KEY)) {
      sessionStorage.setItem(ENTRY_PATH_KEY, window.location.pathname);
      sessionStorage.setItem(
        ENTRY_SOURCE_KEY,
        labelForEntry(window.location.pathname, params.get("src"), document.referrer),
      );
    }

    if (!sessionStorage.getItem(LANDING_SENT_KEY)) {
      sessionStorage.setItem(LANDING_SENT_KEY, "1");
      const updated = getWnoFunnelContext();
      sendWnoTelemetry({
        eventName: "landing_viewed",
        sourcePage: updated?.source,
        targetPath: window.location.pathname,
      });
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      const eventName = classifyClick(href);
      if (!eventName) return;

      sendWnoTelemetry({
        eventName,
        sourcePage: window.location.pathname,
        targetPath: href,
        ctaLocation: ctaLocation(anchor),
        ctaLabel: (anchor.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
      });
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
