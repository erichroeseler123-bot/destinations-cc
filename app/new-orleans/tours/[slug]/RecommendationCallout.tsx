"use client";

import React, { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

interface RecommendationCalloutProps {
  explanation: string;
  productId: string;
  contextId: string;
}

export default function RecommendationCallout({
  explanation,
  productId,
  contextId,
}: RecommendationCalloutProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      trackEvent("recommendation_detail_viewed", {
        product_id: productId,
        context_id: contextId,
        surface: "new_orleans_tour_detail",
      });
      tracked.current = true;
    }
  }, [productId, contextId]);

  return (
    <div className="mt-8 mb-8 p-6 bg-[#1a1a1a] border-l-2 border-[#d4af37]">
      <h3 className="text-sm font-[var(--font-accent)] font-bold text-[#d4af37] tracking-widest uppercase mb-2">
        Recommended For Your Group
      </h3>
      <p className="text-base text-[#fdfbf7] font-[var(--font-sans)] leading-relaxed">
        {explanation}
      </p>
    </div>
  );
}
