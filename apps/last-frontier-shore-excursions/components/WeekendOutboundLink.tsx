"use client";

import React from "react";
import { trackWeekendInJuneauEvent } from "@/lib/weekendInJuneauTelemetry";

export interface WeekendOutboundLinkProps {
  href: string;
  telemetryKind: "jfd_guide" | "seller_handoff" | "official_reference";
  operatorName?: string;
  sellerChannel?: string;
  provider?: string;
  productCode?: string;
  campaign?: string;
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
  children: React.ReactNode;
}

export function WeekendOutboundLink({
  href,
  telemetryKind,
  operatorName,
  sellerChannel,
  provider,
  productCode,
  campaign,
  className,
  style,
  testId,
  children,
}: WeekendOutboundLinkProps) {
  function handleClick() {
    if (telemetryKind === "jfd_guide") {
      trackWeekendInJuneauEvent({
        event: "lfse_jfd_guide_handoff",
        action: "click_jfd_guide",
        targetUrl: href,
        campaign: campaign || "lfse-weekend-to-jfd",
      });
    } else if (telemetryKind === "seller_handoff") {
      trackWeekendInJuneauEvent({
        event: "lfse_seller_handoff_click",
        action: "click_seller_availability",
        operatorName,
        sellerChannel,
        provider,
        productCode,
        campaign,
        targetUrl: href,
      });
    } else {
      trackWeekendInJuneauEvent({
        event: "lfse_guide_engagement",
        action: "click_official_reference",
        operatorName,
        targetUrl: href,
      });
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
      style={style}
      data-testid={testId}
    >
      {children}
    </a>
  );
}
