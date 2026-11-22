"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  configureAnalyticsClient,
  enqueueClientAnalyticsEvent,
} from "@/lib/dcc/analytics/clientSdk";

const NETWORK_DOMAINS: Array<[string, string]> = [
  ["welcometotheswamp.com", "welcometotheswamp"],
  ["frenchquarterorientation.com", "frenchquarterorientation"],
  ["cruisepromenade.com", "cruisepromenade"],
  ["rollcallusa.com", "rollcallusa"],
  ["destinationcommandcenter.com", "destinationcommandcenter"],
];

export function WnoAnalyticsBridge() {
  const pathname = usePathname() || "/";
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    configureAnalyticsClient({ endpoint: "/api/telemetry" });
  }, []);

  useEffect(() => {
    const isInitial = prevPathRef.current === null;
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    enqueueClientAnalyticsEvent({
      eventType: "page_viewed",
      site: "welcometoneworleanstours",
      path: pathname,
      navigationType: isInitial ? "initial_load" : "spa_route_change",
      contentFamily: "new_orleans_swamp",
    });

    if (isInitial && typeof window !== "undefined") {
      const qs = new URLSearchParams(window.location.search);
      const handoffId = qs.get("dcc_handoff_id") || qs.get("handoff_id") || undefined;
      const hasCtx = Boolean(qs.get("dcc_ctx") || qs.get("wtno_trip_ctx") || qs.get("ctx"));
      let fromNetworkReferrer = false;
      if (document.referrer) {
        try {
          const refHost = new URL(document.referrer).hostname.toLowerCase();
          fromNetworkReferrer = NETWORK_DOMAINS.some(
            ([d]) => refHost === d || refHost.endsWith(`.${d}`),
          );
        } catch {
          fromNetworkReferrer = false;
        }
      }
      if (handoffId || hasCtx || fromNetworkReferrer) {
        enqueueClientAnalyticsEvent({
          eventType: "cross_site_handoff_arrived",
          site: "welcometoneworleanstours",
          path: pathname,
          handoffId,
          contextTokenPresent: hasCtx,
          contentFamily: "new_orleans_swamp",
        });
      }
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor?.href) return;

      let parsed: URL;
      try {
        parsed = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }

      const hostLower = parsed.hostname.toLowerCase();
      if (hostLower === window.location.hostname.toLowerCase()) return;

      for (const [domain, targetSite] of NETWORK_DOMAINS) {
        if (hostLower === domain || hostLower.endsWith(`.${domain}`)) {
          enqueueClientAnalyticsEvent({
            eventType: "cross_site_handoff_clicked",
            site: "welcometoneworleanstours",
            path: window.location.pathname,
            targetSite,
            handoffId: parsed.searchParams.get("dcc_handoff_id") || undefined,
            contextTokenPresent: Boolean(
              parsed.searchParams.get("dcc_ctx") || parsed.searchParams.get("ctx"),
            ),
            contentFamily: "new_orleans_swamp",
          });
          return;
        }
      }

      if (
        hostLower.includes("viator.com") ||
        hostLower.includes("getyourguide.com") ||
        hostLower.includes("fareharbor.com") ||
        anchor.dataset.sellerHandoff === "true"
      ) {
        const provider = hostLower.includes("viator.com")
          ? "viator"
          : hostLower.includes("getyourguide.com")
            ? "getyourguide"
            : hostLower.includes("fareharbor.com")
              ? "fareharbor"
              : "direct";
        enqueueClientAnalyticsEvent({
          eventType: "seller_handoff_initiated",
          site: "welcometoneworleanstours",
          path: window.location.pathname,
          provider,
          targetSite: hostLower,
          productCode: anchor.dataset.productCode || anchor.dataset.wnoItemId || undefined,
          contentFamily: "new_orleans_swamp",
        });
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
