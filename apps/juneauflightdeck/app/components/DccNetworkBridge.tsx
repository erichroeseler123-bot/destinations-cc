"use client";

import { useEffect } from "react";

const ENDPOINT = "https://www.destinationcommandcenter.com/api/network/telemetry";
const SESSION_KEY = "dcc_network_session";
const CONTEXT_KEY = "dcc_traveler_context_v1";

function sessionId() {
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = `dcc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

function context() {
  try {
    const raw = sessionStorage.getItem(CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function capture() {
  const raw = new URLSearchParams(window.location.search).get("dcc_ctx");
  if (!raw) return context();
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(raw.replace(/-/g, "+").replace(/_/g, "/"))));
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(parsed));
    return parsed;
  } catch { return context(); }
}

export default function DccNetworkBridge() {
  useEffect(() => {
    const inbound = capture();
    fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "content-type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ site: "juneau-flight-deck", eventName: inbound ? "handoff_received" : "page_viewed", sessionId: sessionId(), sourcePage: window.location.pathname, landingPath: window.location.pathname, context: inbound }),
    }).catch(() => undefined);
  }, []);
  return null;
}
