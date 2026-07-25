"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

interface TourDetailAnalyticsProps {
  productId: string;
  operatorId: string;
}

export default function TourDetailAnalytics({ productId, operatorId }: TourDetailAnalyticsProps) {
  useEffect(() => {
    trackEvent("tour_detail_viewed", {
      surface: "new_orleans_tour_detail",
      product_id: productId,
      operator_id: operatorId,
    });
  }, [productId, operatorId]);

  return null;
}
