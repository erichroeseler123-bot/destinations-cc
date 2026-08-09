"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  buildFareHarborLightframeOptions,
  getExpectedFareHarborAsn,
  normalizeFareHarborFallbackHref,
  type FareHarborSource,
} from "../lib/fareHarborAttribution";

declare global {
  interface Window {
    FH?: {
      open: (options: any) => boolean;
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
      requestedAsn: asn,
    }),
    [fallbackHref, shortname, asn],
  );

  const trackEvent = (eventName: string) => {
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
      window.dispatchEvent(
        new CustomEvent(eventName, { detail: eventData })
      );

      const dataLayer = (window as any).dataLayer || [];
      dataLayer.push({
        event: eventName,
        ...eventData,
      });
    }
  };

  useEffect(() => {
    if (!buttonRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackEvent("fareharbor_cta_seen");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(buttonRef.current);

    return () => observer.disconnect();
  }, [productSlug, placement, effectiveFallbackHref]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent("fareharbor_cta_clicked");
    if (onBookingClick) onBookingClick();

    if (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey || buttonRef.current?.target === "_blank") {
      trackEvent("fareharbor_direct_fallback_used");
      return;
    }

    if (typeof window.FH === "undefined" || typeof window.FH.open !== "function") {
      trackEvent("fareharbor_script_failed");
      trackEvent("fareharbor_direct_fallback_used");
      return;
    }

    trackEvent("fareharbor_open_attempted");

    const fhOptions = buildFareHarborLightframeOptions({
      shortname,
      asn: effectiveAsn,
      itemId,
      flowId,
      source: refCode,
      scheduleUuid,
      fullItems,
    });

    const opened = window.FH.open(fhOptions);

    if (opened) {
      e.preventDefault();
      trackEvent("fareharbor_open_succeeded");
    } else {
      trackEvent("fareharbor_direct_fallback_used");
    }
  };

  return (
    <a
      ref={buttonRef}
      href={effectiveFallbackHref}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
