"use client";

import React from "react";
import FareHarborBookingButton from "./FareHarborBookingButton";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import type { FareHarborSource } from "../lib/fareHarborAttribution";

interface StickyMobileBookingBarProps {
  product: any;
  refCode: FareHarborSource | string;
  fallbackHref: string;
  ctaText?: string;
}

export default function StickyMobileBookingBar({
  product,
  refCode,
  fallbackHref,
  ctaText = "CHECK AVAILABILITY",
}: StickyMobileBookingBarProps) {
  const variants = product.bookingVariants || [];
  const hasMultipleVariants = Array.isArray(variants) && variants.length > 1;
  const v0 = variants.length > 0 ? variants[0] : null;

  let finalAsn = "aktourcenter";
  let finalRef = refCode as string;
  let scheduleUuid: string | undefined = undefined;
  let fullItems: string | undefined = undefined;
  let finalFlow = (v0 && v0.flowId) || product.flowId;
  let finalItem = (v0 && v0.itemId) || product.itemId;

  try {
    const url = new URL(fallbackHref);
    if (url.searchParams.has("asn")) finalAsn = url.searchParams.get("asn")!;
    if (url.searchParams.has("ref")) finalRef = url.searchParams.get("ref")!;
    if (url.searchParams.has("schedule-uuid")) scheduleUuid = url.searchParams.get("schedule-uuid")!;
    if (url.searchParams.has("full-items")) fullItems = url.searchParams.get("full-items")!;
    if (url.searchParams.has("flow")) finalFlow = url.searchParams.get("flow")!;
  } catch (e) {}

  const shortname = product.companyShortname || "neworleanssteamboatcompany";

  return (
    <div
      data-testid="sticky-mobile-booking-bar"
      className="md:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-[#151515] border-t border-[#d4af37]/40 z-50 shadow-2xl backdrop-blur-md bg-opacity-95"
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-bold text-[#fdfbf7] truncate leading-tight">
            {product.title}
          </span>
          <span className="text-[10px] text-[#d4af37] font-medium tracking-wide">
            {hasMultipleVariants ? "Multiple Options Available" : "Instant Online Booking"}
          </span>
        </div>

        {hasMultipleVariants ? (
          <Link
            href={`#booking-variants`}
            className="flex-shrink-0 bg-[#d4af37] text-[#1a1a1a] font-bold px-4 py-2.5 text-xs uppercase tracking-wider rounded-sm shadow-md text-center"
          >
            View Options
          </Link>
        ) : (
          <FareHarborBookingButton
            productTitle={product.title}
            productSlug={product.slug || product.id}
            shortname={shortname}
            itemId={finalItem}
            flowId={finalFlow}
            asn={finalAsn}
            refCode={finalRef}
            scheduleUuid={scheduleUuid}
            fullItems={fullItems}
            fallbackHref={fallbackHref}
            placement="mobile_sticky_bar"
            className="flex-shrink-0 bg-[#d4af37] hover:bg-[#fdfbf7] text-[#1a1a1a] font-bold px-5 py-2.5 text-xs uppercase tracking-wider rounded-sm shadow-md text-center"
            onBookingClick={() => {
              trackEvent("mobile_sticky_cta_clicked", {
                surface: "new_orleans_tour_detail_mobile_sticky",
                product_id: product.id || product.slug,
                operator_id: shortname,
                item_id: finalItem,
                flow_id: finalFlow,
              });
            }}
          >
            {ctaText}
          </FareHarborBookingButton>
        )}
      </div>
    </div>
  );
}
