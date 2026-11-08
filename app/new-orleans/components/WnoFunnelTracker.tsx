"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { captureDccTravelerContext, getStoredDccTravelerContext } from "@/lib/dcc/travelerContext";
import { classifyWnoEntrySource } from "../lib/trafficSource";

const TELEMETRY_URL = "https://destinationcommandcenter.com/api/wno/telemetry";
const SESSION_KEY = "wno_funnel_session";
const ENTRY_PATH_KEY = "wno_entry_path";
const ENTRY_SOURCE_KEY = "wno_entry_source";
const ENTRY_GAD_CAMPAIGN_KEY = "wno_entry_gad_campaignid";
const ENTRY_GCLID_KEY = "wno_entry_gclid";
const LANDING_SENT_KEY = "wno_landing_sent";
const COMPARISON_SLUG_KEY = "wno_comparison_slug";
const COMPARISON_PATH_KEY = "wno_comparison_path";
const SELECTED_BOAT_KEY = "wno_selected_boat";
const SELECTED_PRODUCT_KEY = "wno_selected_product_slug";
const SELECTED_ITEM_ID_KEY = "wno_selected_item_id";
const IS_TEST_SESSION_KEY = "wno_is_test_session";

function id(isTest = false) {
  const prefix = isTest ? "wno_test" : "wno";
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function detectTestQueryParam(search: string): boolean {
  if (!search) return false;
  const sp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return (
    sp.get("test") === "1" ||
    sp.get("test") === "true" ||
    sp.get("isTest") === "1" ||
    sp.get("isTest") === "true" ||
    sp.get("is_test") === "1" ||
    sp.get("is_test") === "true" ||
    sp.get("synthetic_test") === "1" ||
    sp.get("trafficClass") === "test"
  );
}

function extractComparisonSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/(?:new-orleans\/)?compare\/([^/?#]+)/i);
  return match ? match[1].toLowerCase() : null;
}

function classifyClick(href: string) {
  if (href.startsWith("tel:")) return "phone_click";
  if (href.startsWith("sms:")) return "sms_click";
  if (href.includes("fareharbor.com")) return "fareharbor_click";
  if (href.includes("/api/v1/ads/click") || href.includes("viator.com")) return "viator_click";
  return null;
}

function ctaLocation(anchor: HTMLAnchorElement) {
  const explicit = anchor.dataset.ctaLocation || anchor.closest<HTMLElement>("[data-cta-location]")?.dataset.ctaLocation;
  if (explicit) return explicit;
  if (anchor.closest("header")) return "header";
  if (anchor.closest("footer")) return "footer";
  return "page";
}

export function getWnoFunnelContext() {
  if (typeof window === "undefined") return null;
  const queryIsTest = detectTestQueryParam(window.location.search);
  if (queryIsTest) {
    sessionStorage.setItem(IS_TEST_SESSION_KEY, "1");
  }
  const isTest = sessionStorage.getItem(IS_TEST_SESSION_KEY) === "1" || queryIsTest;
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId || (isTest && !sessionId.startsWith("wno_test_"))) {
    sessionId = id(isTest);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return {
    sessionId,
    landingPath: sessionStorage.getItem(ENTRY_PATH_KEY) || window.location.pathname,
    source: sessionStorage.getItem(ENTRY_SOURCE_KEY) || "wtonot-unknown",
    gadCampaignId: sessionStorage.getItem(ENTRY_GAD_CAMPAIGN_KEY) || null,
    gclid: sessionStorage.getItem(ENTRY_GCLID_KEY) || null,
    comparisonSlug: sessionStorage.getItem(COMPARISON_SLUG_KEY) || undefined,
    selectedBoat: sessionStorage.getItem(SELECTED_BOAT_KEY) || undefined,
    isTest,
    dccContext: getStoredDccTravelerContext(),
  };
}

export function sendWnoTelemetry(event: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const context = getWnoFunnelContext();
  if (!context) return;
  const body = JSON.stringify({
    ...context,
    ...event,
    entrySource: (event.entrySource as string) || context.source,
    isTest: context.isTest || Boolean(event.isTest),
    dccContext: context.dccContext || undefined,
  });
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
    if (navigator.sendBeacon(TELEMETRY_URL, blob)) return;
  }
  fetch(TELEMETRY_URL, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    headers: { "content-type": "text/plain;charset=UTF-8" },
    body,
  }).catch(() => undefined);
}

export default function WnoFunnelTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inboundDccContext = captureDccTravelerContext(window.location.search);
    const context = getWnoFunnelContext();
    if (!context) return;

    const gadCamp = (params.get("gad_campaignid") || "").trim();
    const gclid = (params.get("gclid") || params.get("gbraid") || params.get("wbraid") || "").trim();
    if (gadCamp) sessionStorage.setItem(ENTRY_GAD_CAMPAIGN_KEY, gadCamp);
    if (gclid) sessionStorage.setItem(ENTRY_GCLID_KEY, gclid);

    const classifiedNow = classifyWnoEntrySource({
      pathname: window.location.pathname,
      // `src` is the existing WNO convention. `source` is accepted too so
      // QR cards, briefs, hotels and partner links can use readable tags
      // such as ?source=str_card without losing attribution.
      explicitSource: params.get("src") || params.get("source"),
      utmSource: params.get("utm_source"),
      referrer: document.referrer,
      search: window.location.search,
      gadCampaignId: gadCamp || undefined,
    });

    const explicitSrc = (params.get("src") || params.get("source") || "").trim();
    const hasValidExplicitSrc = Boolean(explicitSrc && !/^google[-_]?ads/i.test(explicitSrc));
    const hasActualGoogleAdsClick = Boolean(
      gadCamp || gclid || params.get("gad_source"),
    );

    if (!sessionStorage.getItem(ENTRY_PATH_KEY)) {
      sessionStorage.setItem(ENTRY_PATH_KEY, window.location.pathname);
      sessionStorage.setItem(ENTRY_SOURCE_KEY, classifiedNow);
    } else if (hasActualGoogleAdsClick || hasValidExplicitSrc) {
      sessionStorage.setItem(ENTRY_SOURCE_KEY, classifiedNow);
    }

    if (inboundDccContext) {
      sendWnoTelemetry({
        eventName: "dcc_context_received",
        sourcePage: window.location.pathname,
        dccContext: inboundDccContext,
      });
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

      const latestContext = getWnoFunnelContext() || context;
      let href = anchor.getAttribute("href") || "";
      if (href.includes("/api/v1/ads/click")) {
        const hasSrc = /[?&](src|source|trafficSource)=/i.test(href);
        if (!hasSrc && latestContext.source && !/^google[-_]?ads/i.test(latestContext.source)) {
          href = `${href}${href.includes("?") ? "&" : "?"}src=${encodeURIComponent(latestContext.source)}`;
        }
        if (!/[?&]gad_campaignid=/i.test(href) && latestContext.gadCampaignId) {
          href = `${href}${href.includes("?") ? "&" : "?"}gad_campaignid=${encodeURIComponent(latestContext.gadCampaignId)}`;
        }
        if (!/[?&]gclid=/i.test(href) && latestContext.gclid) {
          href = `${href}${href.includes("?") ? "&" : "?"}gclid=${encodeURIComponent(latestContext.gclid)}`;
        }
        if (!/[?&]visitorId=/i.test(href) && latestContext.sessionId) {
          href = `${href}${href.includes("?") ? "&" : "?"}visitorId=${encodeURIComponent(latestContext.sessionId)}`;
        }
        anchor.setAttribute("href", href);
      }

      const customEventName = anchor.dataset.wnoEvent;
      const label = anchor.dataset.wnoLabel || (anchor.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120);
      const productSlug = anchor.dataset.wnoProduct;
      const selectedBoat = anchor.dataset.wnoBoat;
      const itemId = anchor.dataset.wnoItemId;
      const signal = anchor.dataset.wnoSignal;
      const activeComparisonSlug =
        extractComparisonSlugFromPath(window.location.pathname) || latestContext.comparisonSlug;

      if (customEventName === "comparison_boat_selected") {
        if (activeComparisonSlug) sessionStorage.setItem(COMPARISON_SLUG_KEY, activeComparisonSlug);
        if (selectedBoat) sessionStorage.setItem(SELECTED_BOAT_KEY, selectedBoat);
        if (productSlug) sessionStorage.setItem(SELECTED_PRODUCT_KEY, productSlug);
        if (itemId) sessionStorage.setItem(SELECTED_ITEM_ID_KEY, itemId);
      }

      if (customEventName) {
        const funnelStage =
          customEventName === "comparison_boat_selected" ? "boat_selected" : undefined;
        const eventPayload = {
          surface: "welcome_to_new_orleans_tours",
          page: window.location.pathname,
          target_path: href,
          cta_location: ctaLocation(anchor),
          cta_label: label,
          product_slug: productSlug,
          selected_boat: selectedBoat,
          item_id: itemId,
          comparison_slug: activeComparisonSlug,
          funnel_stage: funnelStage,
          signal,
          entry_source: latestContext.source,
          entry_path: latestContext.landingPath,
        };
        trackEvent(customEventName, eventPayload);
        sendWnoTelemetry({
          eventName: customEventName,
          sourcePage: window.location.pathname,
          targetPath: href,
          ctaLocation: ctaLocation(anchor),
          ctaLabel: label,
          productSlug,
          selectedBoat,
          itemId,
          comparisonSlug: activeComparisonSlug,
          funnelStage,
          signal,
        });
      }

      // Managed CTA components emit the canonical event themselves with richer context.
      if (anchor.dataset.wnoManagedClick) return;

      const eventName = classifyClick(href);
      if (!eventName) return;

      sendWnoTelemetry({
        eventName,
        sourcePage: window.location.pathname,
        targetPath: href,
        ctaLocation: ctaLocation(anchor),
        ctaLabel: label,
      });
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentPath = pathname || window.location.pathname;
    const comparisonSlug = extractComparisonSlugFromPath(currentPath);
    if (!comparisonSlug) return;

    sessionStorage.setItem(COMPARISON_SLUG_KEY, comparisonSlug);
    sessionStorage.setItem(COMPARISON_PATH_KEY, currentPath);

    const viewedKey = `wno_comparison_viewed_${comparisonSlug}`;
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, "1");
      const updated = getWnoFunnelContext();
      sendWnoTelemetry({
        eventName: "comparison_viewed",
        sourcePage: updated?.source,
        targetPath: currentPath,
        comparisonSlug,
        funnelStage: "comparison_visit",
      });
    }
  }, [pathname]);

  return null;
}
