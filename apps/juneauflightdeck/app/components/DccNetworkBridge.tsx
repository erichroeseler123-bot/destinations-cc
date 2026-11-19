"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  configureAnalyticsClient,
  enqueueClientAnalyticsEvent,
} from "@/lib/dcc/analytics/clientSdk";

const ENDPOINT = "/api/network/telemetry";
const SESSION_KEY = "dcc_network_session";
const CONTEXT_KEY = "dcc_traveler_context_v1";

const JFD_NETWORK_DOMAINS: Array<[string, string]> = [
  ["cruisepromenade.com", "cruisepromenade"],
  ["lastfrontiershoreexcursions.com", "lastfrontiershoreexcursions"],
  ["rollcallusa.com", "rollcallusa"],
  ["destinationcommandcenter.com", "destinationcommandcenter"],
];

function inferJfdContentFamily(pathname: string): string {
  const lower = pathname.toLowerCase();
  if (lower.includes("uncruise")) return "uncruise";
  return "flightseeing";
}

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

function captureInboundContext(): {
  context: Record<string, unknown> | null;
  freshInboundParam: boolean;
  handoffId?: string;
} {
  if (typeof window === "undefined") {
    return { context: null, freshInboundParam: false };
  }
  const sp = new URLSearchParams(window.location.search);
  const handoffId = sp.get("dcc_handoff_id") || sp.get("handoff_id") || undefined;
  const raw = sp.get("dcc_ctx");
  if (!raw) {
    return { context: getJfdContext(), freshInboundParam: Boolean(handoffId), handoffId };
  }
  try {
    const parsed = JSON.parse(
      decodeURIComponent(atob(raw.replace(/-/g, "+").replace(/_/g, "/"))),
    );
    // Strip any sensitive fields before storing in origin-scoped sessionStorage
    if (parsed && typeof parsed === "object") {
      delete (parsed as Record<string, unknown>).shareCode;
      delete (parsed as Record<string, unknown>).token;
      delete (parsed as Record<string, unknown>).email;
      sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(parsed));
    }
    return { context: parsed, freshInboundParam: true, handoffId };
  } catch {
    return { context: getJfdContext(), freshInboundParam: true, handoffId };
  }
}

export function sendJfdTelemetry(
  eventName: string,
  outcome: Record<string, unknown> = {},
  options?: { skipRemotePost?: boolean },
) {
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

  if (!options?.skipRemotePost) {
    fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "content-type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  }

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
  const pathname = usePathname() || "/";
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    configureAnalyticsClient({ endpoint: ENDPOINT });
  }, []);

  useEffect(() => {
    const isInitial = prevPathRef.current === null;
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    const inbound = captureInboundContext();
    const contentFamily = inferJfdContentFamily(pathname);

    // Always record page_viewed (fixing legacy bug where inbound context suppressed pageviews)
    enqueueClientAnalyticsEvent({
      eventType: "page_viewed",
      site: "juneauflightdeck",
      path: pathname,
      navigationType: isInitial ? "initial_load" : "spa_route_change",
      contentFamily,
    });
    sendJfdTelemetry(
      "page_viewed",
      { inboundContextPresent: Boolean(inbound.context) },
      { skipRemotePost: true },
    );

    if (isInitial) {
      let fromNetworkRef = false;
      if (document.referrer) {
        try {
          const refHost = new URL(document.referrer).hostname.toLowerCase();
          fromNetworkRef = JFD_NETWORK_DOMAINS.some(
            ([d]) => refHost === d || refHost.endsWith(`.${d}`),
          );
        } catch {
          fromNetworkRef = false;
        }
      }
      if (inbound.freshInboundParam || fromNetworkRef) {
        enqueueClientAnalyticsEvent({
          eventType: "cross_site_handoff_arrived",
          site: "juneauflightdeck",
          path: pathname,
          handoffId: inbound.handoffId,
          contextTokenPresent: inbound.freshInboundParam,
          contentFamily,
        });
      }
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a");
      if (!anchor || !anchor.href) return;

      const href = anchor.href;
      let parsedUrl: URL | null = null;
      try {
        parsedUrl = new URL(href, window.location.origin);
      } catch {
        parsedUrl = null;
      }

      // 1. Cross-site network handoffs (e.g., JFD UnCruise guide -> Cruise Promenade or LFSE)
      if (parsedUrl && parsedUrl.hostname.toLowerCase() !== window.location.hostname.toLowerCase()) {
        const hostLower = parsedUrl.hostname.toLowerCase();
        for (const [domain, targetSite] of JFD_NETWORK_DOMAINS) {
          if (hostLower === domain || hostLower.endsWith(`.${domain}`)) {
            enqueueClientAnalyticsEvent({
              eventType: "cross_site_handoff_clicked",
              site: "juneauflightdeck",
              path: window.location.pathname,
              targetSite,
              handoffId: parsedUrl.searchParams.get("dcc_handoff_id") || undefined,
              contextTokenPresent: Boolean(
                parsedUrl.searchParams.get("dcc_ctx") || parsedUrl.searchParams.get("ctx"),
              ),
              contentFamily: inferJfdContentFamily(window.location.pathname),
            });
            return;
          }
        }
      }

      // 2. Seller booking handoffs (Viator / GetYourGuide / explicit booking buttons)
      const isViator = href.includes("viator.com");
      const isGYG = href.includes("getyourguide.com");

      if (!isViator && !isGYG && !anchor.dataset.bookingClick) {
        return;
      }

      const provider = isViator
        ? "viator"
        : isGYG
          ? "getyourguide"
          : "external";

      let tourSlug = anchor.dataset.tourSlug || "";
      let tourName = anchor.dataset.tourName || "";

      if (!tourSlug && isViator) {
        const lowerHref = href.toLowerCase();
        if (lowerHref.includes("6251shorexicewalk")) {
          tourSlug = "coastal-icefield-landing";
          tourName = "Coastal Helicopters Icefield Excursion (6251SHOREXICEWALK)";
        } else if (lowerHref.includes("temsco")) {
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

      enqueueClientAnalyticsEvent({
        eventType: "seller_handoff_initiated",
        site: "juneauflightdeck",
        path: window.location.pathname,
        provider,
        productCode: tourSlug || "unspecified",
        targetSite: parsedUrl?.hostname.toLowerCase() || provider,
        contentFamily: inferJfdContentFamily(window.location.pathname),
        props: {
          tourName: (tourName || anchorText).slice(0, 120),
        },
      });

      sendJfdTelemetry(
        "booking_clicked",
        {
          provider,
          tourSlug: tourSlug || "unspecified",
          tourName: tourName || anchorText,
          targetUrl: href,
          anchorText,
          sourcePage: window.location.pathname,
        },
        { skipRemotePost: true },
      );
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}
