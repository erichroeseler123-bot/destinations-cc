"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  buildFareHarborLightframeOptions,
  getExpectedFareHarborAsn,
  normalizeFareHarborFallbackHref,
  type FareHarborSource,
} from "../lib/fareHarborAttribution";
import { getWnoFunnelContext, sendWnoTelemetry } from "./WnoFunnelTracker";

declare global {
  interface Window {
    FH?: {
      open: (options: Record<string, unknown>) => boolean;
    };
  }
}

export interface FareHarborBookingButtonProps {
  productTitle?: string;
  productSlug?: string;
  shortname: string;
  itemId?: string | number;
  flowId?: string | number;
  asn: string;
  refCode: FareHarborSource | string;
  fallbackHref: string;
  scheduleUuid?: string;
  fullItems?: string;
  placement?: string;
  className?: string;
  onBookingClick?: () => void;
  children: React.ReactNode;
}

export default function FareHarborBookingButton({
  productTitle,
  productSlug,
  shortname,
  itemId,
  flowId,
  asn,
  refCode,
  fallbackHref,
  scheduleUuid,
  fullItems,
  placement,
  className = "",
  onBookingClick,
  children,
}: FareHarborBookingButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const effectiveAsn = getExpectedFareHarborAsn(shortname, asn);
  const effectiveFallbackHref = useMemo(
    () => normalizeFareHarborFallbackHref({
      href: fallbackHref,
      shortname,
      requestedAsn: effectiveAsn,
    }),
    [fallbackHref, shortname, effectiveAsn],
  );

  const trackEvent = useCallback((eventName: string) => {
    const eventData = {
      productTitle,
      productSlug,
      operator: shortname,
      placement,
      shortname,
      itemId,
      flowId,
      ref: refCode,
      bookingUrl: effectiveFallbackHref,
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(eventName, { detail: eventData }));
      const dataLayer = (window as any).dataLayer || [];
      dataLayer.push({ event: eventName, ...eventData });
    }
  }, [effectiveFallbackHref, flowId, itemId, placement, productSlug, productTitle, refCode, shortname]);

  useEffect(() => {
    if (!buttonRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackEvent("fareharbor_cta_seen");
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(buttonRef.current);
    return () => observer.disconnect();
  }, [trackEvent]);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const context = getWnoFunnelContext();
    const sourcePage = window.location.pathname;

    trackEvent("fareharbor_cta_clicked");
    trackEvent("booking_opened");
    sendWnoTelemetry({
      eventName: "booking_opened",
      sourcePage,
      targetPath: effectiveFallbackHref,
      productSlug,
      productName: productTitle,
      operatorId: shortname,
      itemId: String(itemId || ""),
      flowId: String(flowId || ""),
      ctaLocation: placement,
      entrySource: context?.source,
      entryPath: context?.landingPath,
    });
    if (onBookingClick) onBookingClick();

    // Preserve native modified-click behavior for visitors who explicitly ask
    // the browser to open the secure FareHarbor fallback in another tab.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      trackEvent("fareharbor_direct_fallback_used");
      return;
    }

    trackEvent("fareharbor_open_attempted");
    if (!window.FH?.open) {
      trackEvent("fareharbor_script_failed");
      trackEvent("fareharbor_direct_fallback_used");
      return;
    }

    try {
      const opened = window.FH.open(buildFareHarborLightframeOptions({
        shortname,
        asn: effectiveAsn,
        itemId,
        flowId,
        source: refCode,
        scheduleUuid,
        fullItems,
      }));
      if (opened) {
        event.preventDefault();
        trackEvent("fareharbor_open_succeeded");
        return;
      }
    } catch {
      trackEvent("fareharbor_script_failed");
    }

    // The href remains a real, attributed FareHarbor URL so checkout still
    // works when Lightframe is unavailable or unsupported on the device.
    trackEvent("fareharbor_direct_fallback_used");
  };

  return (
    <a
      ref={buttonRef}
      href={effectiveFallbackHref}
      onClick={handleClick}
      data-wno-managed-click="true"
      data-wno-product={productSlug}
      data-cta-location={placement}
      className={className}
    >
      {children}
    </a>
  );
}
