"use client";

import React from "react";
import FareHarborBookingButton from "../../components/FareHarborBookingButton";
import { trackEvent } from "@/lib/analytics";
import type { FareHarborSource } from "../../lib/fareHarborAttribution";
import { getWnoFunnelContext, sendWnoTelemetry } from "../../components/WnoFunnelTracker";

interface Props {
  product: any;
  refCode: FareHarborSource | string;
  fallbackHref: string;
  ctaText: string;
  className?: string;
  variantLabel?: string;
  itemId?: string;
  flowId?: string;
}

const CHOOSER_COMPLETED_AT = "wno_chooser_completed_at";
const CHOOSER_RECOMMENDATION = "wno_chooser_recommendation";

export default function TourDetailBookingAction({ product, refCode, fallbackHref, ctaText, className, variantLabel, itemId, flowId }: Props) {
  let finalAsn = "aktourcenter";
  let finalRef = refCode as string;
  let scheduleUuid: string | undefined = undefined;
  let fullItems: string | undefined = undefined;
  let finalFlow = flowId || product.flowId;

  try {
    const url = new URL(fallbackHref);
    if (url.searchParams.has("asn")) finalAsn = url.searchParams.get("asn")!;
    if (url.searchParams.has("ref")) finalRef = url.searchParams.get("ref")!;
    if (url.searchParams.has("schedule-uuid")) scheduleUuid = url.searchParams.get("schedule-uuid")!;
    if (url.searchParams.has("full-items")) fullItems = url.searchParams.get("full-items")!;
    if (url.searchParams.has("flow")) finalFlow = url.searchParams.get("flow")!;
  } catch(e) {}

  return (
    <FareHarborBookingButton
      shortname={product.companyShortname}
      itemId={itemId || product.itemId}
      flowId={finalFlow}
      asn={finalAsn}
      refCode={finalRef}
      scheduleUuid={scheduleUuid}
      fullItems={fullItems}
      fallbackHref={fallbackHref}
      className={`${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]`}
      onBookingClick={() => {
        const context = getWnoFunnelContext();
        const basePayload = {
          surface: "new_orleans_tour_detail",
          product_id: product.id,
          product_name: product.title,
          tour_slug: product.slug,
          operator_id: product.companyShortname,
          operator: product.operatorName,
          variant_label: variantLabel,
          item_id: itemId || product.itemId,
          flow_id: finalFlow,
          fareharbor_url: fallbackHref,
          entry_source: context?.source,
          entry_path: context?.landingPath,
        };

        trackEvent("tour_detail_booking_selected", basePayload);
        trackEvent("fareharbor_outbound_clicked", basePayload);
        trackEvent("fareharbor_checkout_opened", basePayload);

        sendWnoTelemetry({
          eventName: "booking_opened",
          sourcePage: context?.source,
          targetPath: fallbackHref,
          productSlug: product.slug,
          productName: product.title,
          operatorId: product.companyShortname,
          variantLabel,
          itemId: String(itemId || product.itemId || ""),
          flowId: String(finalFlow || ""),
        });

        try {
          const completedAt = Number(sessionStorage.getItem(CHOOSER_COMPLETED_AT));
          const recommendation = sessionStorage.getItem(CHOOSER_RECOMMENDATION);
          if (Number.isFinite(completedAt) && completedAt > 0) {
            const elapsedMs = Date.now() - completedAt;
            if (elapsedMs >= 0 && elapsedMs <= 6 * 60 * 60 * 1000) {
              const conversionPayload = {
                ...basePayload,
                chooser_recommendation: recommendation,
                recommendation_match: recommendation === product.slug,
                chooser_to_booking_ms: elapsedMs,
              };
              trackEvent("chooser_to_fareharbor_conversion", conversionPayload);
              sendWnoTelemetry({
                eventName: "chooser_to_fareharbor_conversion",
                sourcePage: window.location.pathname,
                targetPath: fallbackHref,
                productSlug: product.slug,
                chooserRecommendation: recommendation,
                recommendationMatch: recommendation === product.slug,
                chooserToBookingMs: elapsedMs,
              });
            }
          }
        } catch {
          // Session analytics must never block checkout.
        }
      }}
    >
      {ctaText}
    </FareHarborBookingButton>
  );
}
