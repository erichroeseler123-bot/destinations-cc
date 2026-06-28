import React from "react";

interface ActivitiesWidgetProps {
  href: string;
  campaign: string;
  numberOfItems: number;
  className?: string;
}

export default function ActivitiesWidget({
  href,
  campaign,
  numberOfItems,
  className,
}: ActivitiesWidgetProps) {
  return (
    <div
      className={`gyg-activities-widget ${className || ""}`}
      data-href={href}
      data-campaign={campaign}
      data-number-of-items={numberOfItems}
    />
  );
}
