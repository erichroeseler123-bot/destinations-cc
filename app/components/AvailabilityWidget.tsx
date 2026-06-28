import React from "react";

interface AvailabilityWidgetProps {
  tourUrl: string;
  campaign: string;
  currency?: string;
  layout?: string;
  className?: string;
}

export default function AvailabilityWidget({
  tourUrl,
  campaign,
  currency,
  layout,
  className,
}: AvailabilityWidgetProps) {
  return (
    <div
      className={`gyg-availability-widget ${className || ""}`}
      data-tour-url={tourUrl}
      data-campaign={campaign}
      data-currency={currency}
      data-layout={layout}
    />
  );
}
