"use client";

import React from "react";
import FareHarborBookingButton from "../../components/FareHarborBookingButton";
import { trackEvent } from "@/lib/analytics";

interface Props {
  product: any;
  refCode: string;
  fallbackHref: string;
  ctaText: string;
  className?: string;
}

export default function TourDetailBookingAction({ product, refCode, fallbackHref, ctaText, className }: Props) {
  return (
    <FareHarborBookingButton
      shortname={product.companyShortname}
      itemId={product.itemId}
      flowId={product.flowId}
      asn="aktourcenter"
      fallbackHref={fallbackHref}
      className={`${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]`}
      onBookingClick={() => {
        trackEvent("tour_detail_booking_selected", {
          surface: "new_orleans_tour_detail",
          product_id: product.id,
          operator_id: product.companyShortname,
        });
        trackEvent("fareharbor_checkout_opened", {
          surface: "new_orleans_tour_detail",
          tour_slug: product.slug,
          operator: product.operatorName,
          flow_id: product.flowId,
          item_id: product.itemId,
        });
      }}
    >
      {ctaText}
    </FareHarborBookingButton>
  );
}
