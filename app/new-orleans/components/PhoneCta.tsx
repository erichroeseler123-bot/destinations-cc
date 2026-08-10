"use client";

import React, { useEffect, useRef } from "react";
import { sendWnoTelemetry } from "./WnoFunnelTracker";

interface PhoneCtaProps {
  placement: string;
  isGroup?: boolean;
  productId?: string;
  productSlug?: string;
  className?: string;
  children: React.ReactNode;
}

export default function PhoneCta({
  placement,
  isGroup = false,
  productId,
  productSlug,
  className = "",
  children,
}: PhoneCtaProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  const trackEvent = (eventName: string) => {
    const eventData = {
      placement,
      ...(productId && { productId }),
      ...(productSlug && { productSlug }),
      pagePath: typeof window !== "undefined" ? window.location.pathname : "",
      phoneNumber: "504-484-9687",
    };

    if (typeof window !== "undefined") {
      sendWnoTelemetry({ eventName, ...eventData });
      window.dispatchEvent(new CustomEvent(eventName, { detail: eventData }));
      const dataLayer = ((window as any).dataLayer ||= []);
      dataLayer.push({
        event: eventName,
        ...eventData,
      });
    }
  };

  useEffect(() => {
    if (!linkRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackEvent("phone_cta_seen");
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(linkRef.current);
    return () => observer.disconnect();
  }, [placement]);

  const handleClick = () => {
    trackEvent("phone_click");
    if (isGroup) {
      trackEvent("group_rates_cta_clicked");
    }
  };

  return (
    <a
      ref={linkRef}
      href="tel:+15044849687"
      onClick={handleClick}
      data-wno-managed-click="phone"
      data-cta-location={placement}
      className={`focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:ring-offset-2 ${className}`}
      aria-label="Call 504-484-9687"
    >
      {children}
    </a>
  );
}
