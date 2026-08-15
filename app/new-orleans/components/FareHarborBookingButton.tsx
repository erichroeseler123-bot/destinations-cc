"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  getExpectedFareHarborAsn,
  normalizeFareHarborFallbackHref,
  type FareHarborSource,
} from "../lib/fareHarborAttribution";

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
      window.dispatchEvent(new CustomEvent(eventName, { detail: eventData }));
      const dataLayer = (window as any).dataLayer || [];
      dataLayer.push({ event: eventName, ...eventData });
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
      { threshold: 0.1 },
    );

    observer.observe(buttonRef.current);
    return () => observer.disconnect();
  }, [productSlug, placement, effectiveFallbackHref]);

  const handleClick = () => {
    trackEvent("fareharbor_cta_clicked");
    trackEvent("fareharbor_direct_fallback_used");
    if (onBookingClick) onBookingClick();
  };

  return (
    <a
      ref={buttonRef}
      href={effectiveFallbackHref}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
