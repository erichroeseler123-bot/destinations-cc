"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  configureAnalyticsClient,
  enqueueClientAnalyticsEvent,
} from "@/lib/dcc/analytics/clientSdk";

const NETWORK_DOMAIN_MAP: Array<[string, string]> = [
  ["cruisepromenade.com", "cruisepromenade"],
  ["rollcallusa.com", "rollcallusa"],
  ["lastfrontiershoreexcursions.com", "lastfrontiershoreexcursions"],
  ["juneauflightdeck.com", "juneauflightdeck"],
  ["welcometoneworleanstours.com", "welcometoneworleanstours"],
  ["welcometotheswamp.com", "welcometotheswamp"],
  ["gosno.co", "gosno"],
  ["partyatredrocks.com", "partyatredrocks"],
  ["welcometothedells.com", "welcometothedells"],
  ["saveonthestrip.com", "saveonthestrip"],
  ["feastlyspread.com", "feastlyspread"],
  ["brinkberry.com", "brinkberry"],
];

function resolveRootHostSiteId(): string {
  if (typeof window === "undefined") return "destinationcommandcenter";
  const h = window.location.hostname.toLowerCase();
  if (h.includes("welcometoneworleanstours")) return "welcometoneworleanstours";
  if (h.includes("shuttletosomersetamphitheater")) return "somersetshuttle";
  if (h.includes("lastfrontiershoreexcursions")) return "lastfrontiershoreexcursions";
  if (h.includes("juneauflightdeck")) return "juneauflightdeck";
  if (h.includes("welcometothedells")) return "welcometothedells";
  if (h.includes("saveonthestrip")) return "saveonthestrip";
  return "destinationcommandcenter";
}

function inferDccContentFamily(pathname: string): string {
  const lower = pathname.toLowerCase();
  if (lower.includes("uncruise")) return "uncruise";
  if (lower.includes("ferry")) return "independent_alaska_ferry";
  if (lower.includes("rv")) return "alaska_rv";
  if (lower.includes("fishing-lodge")) return "fishing_lodges";
  if (lower.includes("juneau") && lower.includes("helicopter")) return "flightseeing";
  if (lower.includes("new-orleans") || lower.includes("swamp")) return "new_orleans_swamp";
  if (lower.startsWith("/ports") || lower.startsWith("/cruises")) return "cruise_sailing";
  return "general_discovery";
}

export default function DccAnalyticsBridge() {
  const pathname = usePathname() || "/";
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    configureAnalyticsClient({ endpoint: "/api/v2/analytics/collect" });
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/embed")) return;

    const isInitial = prevPathRef.current === null;
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    const activeSiteId = resolveRootHostSiteId();
    const contentFamily = inferDccContentFamily(pathname);
    enqueueClientAnalyticsEvent({
      eventType: "page_viewed",
      site: activeSiteId,
      path: pathname,
      navigationType: isInitial ? "initial_load" : "spa_route_change",
      contentFamily,
    });

    if (isInitial && typeof window !== "undefined") {
      const qs = new URLSearchParams(window.location.search);
      const handoffId = qs.get("dcc_handoff_id") || qs.get("handoff_id") || undefined;
      const hasCtx = Boolean(qs.get("dcc_ctx") || qs.get("ctx"));
      if (handoffId || hasCtx) {
        enqueueClientAnalyticsEvent({
          eventType: "cross_site_handoff_arrived",
          site: activeSiteId,
          path: pathname,
          handoffId,
          contextTokenPresent: hasCtx,
          contentFamily,
        });
      }
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor?.href) return;
      if (window.location.pathname.startsWith("/admin")) return;

      let parsed: URL;
      try {
        parsed = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }

      const hostLower = parsed.hostname.toLowerCase();
      if (hostLower === window.location.hostname.toLowerCase()) return;

      const currentSiteId = resolveRootHostSiteId();
      for (const [domain, siteId] of NETWORK_DOMAIN_MAP) {
        if (hostLower === domain || hostLower.endsWith(`.${domain}`)) {
          enqueueClientAnalyticsEvent({
            eventType: "cross_site_handoff_clicked",
            site: currentSiteId,
            path: window.location.pathname,
            targetSite: siteId,
            handoffId: parsed.searchParams.get("dcc_handoff_id") || undefined,
            contextTokenPresent: Boolean(
              parsed.searchParams.get("dcc_ctx") || parsed.searchParams.get("ctx"),
            ),
            contentFamily: inferDccContentFamily(window.location.pathname),
          });
          return;
        }
      }

      if (
        hostLower.includes("viator.com") ||
        hostLower.includes("getyourguide.com") ||
        hostLower.includes("fareharbor.com")
      ) {
        const provider = hostLower.includes("viator.com")
          ? "viator"
          : hostLower.includes("getyourguide.com")
            ? "getyourguide"
            : "fareharbor";
        enqueueClientAnalyticsEvent({
          eventType: "seller_handoff_initiated",
          site: currentSiteId,
          path: window.location.pathname,
          provider,
          targetSite: hostLower,
          contentFamily: inferDccContentFamily(window.location.pathname),
        });
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
