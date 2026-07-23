"use client";

import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    FH?: {
      open: (options: any) => boolean;
    };
  }
}

interface FareHarborBookingButtonProps {
  productTitle: string;
  productSlug: string;
  shortname: string;
  itemId?: string | number;
  flowId?: string | number;
  asn: string;
  refCode: string;
  fallbackHref: string;
  placement: string;
  className?: string;
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
  children,
}: FareHarborBookingButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);

  const trackEvent = (eventName: string) => {
    const eventData = {
      productTitle,
      productSlug,
      operator: shortname, // shortname serves as operator id
      placement,
      shortname,
      itemId,
      flowId,
      ref: refCode,
    };
    
    if (typeof window !== "undefined") {
      // Dispatch custom event for our own listener if needed
      window.dispatchEvent(
        new CustomEvent(eventName, { detail: eventData })
      );
      
      // Push to dataLayer if present
      const dataLayer = (window as any).dataLayer || [];
      dataLayer.push({
        event: eventName,
        ...eventData,
      });
    }
  };

  useEffect(() => {
    // Intersection Observer to track "seen"
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
  }, [productSlug, placement]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent("fareharbor_cta_clicked");

    // Let the browser handle modified clicks (Ctrl, Shift, Meta, Alt) normally
    if (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey || buttonRef.current?.target === "_blank") {
      trackEvent("fareharbor_direct_fallback_used");
      return;
    }

    // Check script readiness
    if (typeof window.FH === "undefined" || typeof window.FH.open !== "function") {
      trackEvent("fareharbor_script_failed");
      trackEvent("fareharbor_direct_fallback_used");
      return; // let normal href navigation occur
    }

    trackEvent("fareharbor_open_attempted");

    const fhOptions: any = {
      shortname,
      asn,
      ref: refCode,
    };

    if (itemId) {
      fhOptions.view = { item: String(itemId) };
    }
    
    if (flowId) {
      fhOptions.flow = String(flowId);
    }

    const opened = window.FH.open(fhOptions);

    if (opened) {
      // FH.open returns true if the overlay is going to open successfully
      e.preventDefault();
      trackEvent("fareharbor_open_succeeded");
    } else {
      // FH.open returns false in cases where it intentionally falls back (e.g. some mobile contexts)
      trackEvent("fareharbor_direct_fallback_used");
      // we do NOT preventDefault here, allowing normal href navigation
    }
  };

  return (
    <a
      ref={buttonRef}
      href={fallbackHref}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
