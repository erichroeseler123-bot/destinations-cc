"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  getOrCreateJourneyId,
  isQaTestMode,
  trackNetworkEvent,
} from "@/lib/dcc/telemetry/clientNetworkEvents";

export default function TrackedCruisePromenadeLink({
  href,
  className,
  children,
  testId,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  testId?: string;
}) {
  const [resolvedHref, setResolvedHref] = useState(href);

  useEffect(() => {
    try {
      const url = new URL(href);
      url.searchParams.set("journey_id", getOrCreateJourneyId());
      if (isQaTestMode()) url.searchParams.set("qa_test", "1");
      setResolvedHref(url.toString());
    } catch {
      setResolvedHref(href);
    }
  }, [href]);

  return (
    <a
      href={resolvedHref}
      data-testid={testId}
      data-dcc-next-step="cruisepromenade"
      className={className}
      onClick={() =>
        trackNetworkEvent({
          eventName: "network_handoff",
          originatingSite: "dcc",
          destinationSite: "cruisepromenade",
          travelIntent: "cruise-group-planning",
          corridorId: "portfolio-network",
        })
      }
    >
      {children}
    </a>
  );
}
