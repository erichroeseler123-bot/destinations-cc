"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { getWnoFunnelContext, sendWnoTelemetry } from "../../components/WnoFunnelTracker";

interface TourDetailAnalyticsProps {
  productId: string;
  operatorId: string;
}

export default function TourDetailAnalytics({ productId, operatorId }: TourDetailAnalyticsProps) {
  useEffect(() => {
    const context = getWnoFunnelContext();
    trackEvent("tour_detail_viewed", {
      surface: "new_orleans_tour_detail",
      product_id: productId,
      operator_id: operatorId,
      entry_source: context?.source,
      entry_path: context?.landingPath,
    });
    sendWnoTelemetry({
      eventName: "product_opened",
      sourcePage: context?.source,
      targetPath: window.location.pathname,
      productSlug: productId,
      operatorId,
    });
  }, [productId, operatorId]);

  return null;
}
