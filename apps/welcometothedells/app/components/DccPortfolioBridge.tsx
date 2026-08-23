"use client";

import { useEffect } from "react";

const ENDPOINT = "https://www.destinationcommandcenter.com/api/network/telemetry";
const SESSION_KEY = "dcc_network_session";
const CONTEXT_KEY = "dcc_traveler_context_v1";

function getSession() {
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = `dcc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

function readStoredContext() {
  try {
    const raw = sessionStorage.getItem(CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function captureInboundContext() {
  const raw = new URLSearchParams(window.location.search).get("dcc_ctx");
  if (!raw) return readStoredContext();
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(raw.replace(/-/g, "+").replace(/_/g, "/"))));
    if (parsed && typeof parsed === "object") sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(parsed));
    return parsed;
  } catch { return readStoredContext(); }
}

export function sendPortfolioOutcome(site: string, eventName: string, outcome: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  fetch(ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    headers: { "content-type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      site,
      eventName,
      sessionId: getSession(),
      sourcePage: window.location.pathname,
      landingPath: window.location.pathname,
      context: readStoredContext(),
      outcome,
    }),
  }).catch(() => undefined);
}

export default function DccPortfolioBridge({ site }: { site: string }) {
  useEffect(() => {
    const inbound = captureInboundContext();
    sendPortfolioOutcome(site, inbound ? "handoff_received" : "page_viewed");
  }, [site]);
  return null;
}
