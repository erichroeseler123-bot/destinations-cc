"use client";

import React from "react";
import FareHarborBookingButton from "../../components/FareHarborBookingButton";
import { trackEvent } from "@/lib/analytics";
import type { FareHarborSource } from "../../lib/fareHarborAttribution";

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
        trackEvent("tour_detail_booking_selected", {
          surface: "new_orleans_tour_detail",
          product_id: product.id,
          operator_id: product.companyShortname,
          variant_label: variantLabel,
          item_id: itemId || product.itemId,
          flow_id: finalFlow,
        });
        trackEvent("fareharbor_checkout_opened", {
          surface: "new_orleans_tour_detail",
          tour_slug: product.slug,
          operator: product.operatorName,
          flow_id: finalFlow,
          item_id: itemId || product.itemId,
          variant_label: variantLabel,
        });
      }}
    >
      {ctaText}
    </FareHarborBookingButton>
  );
}
