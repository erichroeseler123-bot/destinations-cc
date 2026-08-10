"use client";

import React from "react";
import FareHarborBookingButton from "./FareHarborBookingButton";
import PhoneCta from "./PhoneCta";
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
  ctaText = "Check availability",
}: StickyMobileBookingBarProps) {
  const variants = product.bookingVariants || [];
  const hasMultipleVariants = Array.isArray(variants) && variants.length > 1;
  const v0 = variants.length > 0 ? variants[0] : null;

  let finalAsn = "aktourcenter";
  let finalRef = refCode as string;
  let scheduleUuid: string | undefined;
  let fullItems: string | undefined;
  let finalFlow = (v0 && v0.flowId) || product.flowId;
  let finalItem = (v0 && v0.itemId) || product.itemId;

  try {
    const url = new URL(fallbackHref);
    if (url.searchParams.has("asn")) finalAsn = url.searchParams.get("asn")!;
    if (url.searchParams.has("ref")) finalRef = url.searchParams.get("ref")!;
    if (url.searchParams.has("schedule-uuid")) scheduleUuid = url.searchParams.get("schedule-uuid")!;
    if (url.searchParams.has("full-items")) fullItems = url.searchParams.get("full-items")!;
    if (url.searchParams.has("flow")) finalFlow = url.searchParams.get("flow")!;
  } catch {}

  const shortname = product.companyShortname || "neworleanssteamboatcompany";
  const productSlug = product.slug || product.id;

  const handleViewOptions = () => {
    trackEvent("mobile_sticky_options_clicked", {
      surface: "new_orleans_tour_detail_mobile_sticky",
      product_id: product.id || product.slug,
      operator_id: shortname,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      data-testid="sticky-mobile-booking-bar"
      className="md:hidden fixed inset-x-0 bottom-0 z-[70] border-t border-[#c7a96b]/35 bg-[#151116]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-16px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl"
    >
      <div className="mx-auto max-w-md">
        <div className="mb-2 flex min-w-0 items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <div className="truncate font-serif text-[15px] font-medium text-[#f6f1e8]">{product.title}</div>
            <div className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-[#c7a96b]">
              {hasMultipleVariants ? "Multiple booking options" : `Operated by ${product.operatorName}`}
            </div>
          </div>
          <span className="shrink-0 text-[10px] text-[#f6f1e8]/45">Need help?</span>
        </div>

        <div className="grid grid-cols-[0.8fr_1.2fr] gap-2">
          <PhoneCta
            placement="WTONOT-MOBILE-TOUR-CALL"
            productId={product.id}
            productSlug={productSlug}
            className="flex min-h-12 items-center justify-center rounded-sm border border-[#c7a96b]/45 bg-transparent px-3 text-xs font-bold uppercase tracking-[0.12em] text-[#f6f1e8]"
          >
            Call us
          </PhoneCta>

          {hasMultipleVariants ? (
            <button
              type="button"
              onClick={handleViewOptions}
              className="min-h-12 rounded-sm bg-[#c7a96b] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#151116] shadow-md"
            >
              View booking options
            </button>
          ) : (
            <FareHarborBookingButton
              productTitle={product.title}
              productSlug={productSlug}
              shortname={shortname}
              itemId={finalItem}
              flowId={finalFlow}
              asn={finalAsn}
              refCode={finalRef}
              scheduleUuid={scheduleUuid}
              fullItems={fullItems}
              fallbackHref={fallbackHref}
              placement="mobile_sticky_bar"
              className="flex min-h-12 items-center justify-center rounded-sm bg-[#c7a96b] px-4 text-center text-xs font-bold uppercase tracking-[0.12em] text-[#151116] shadow-md"
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
    </div>
  );
}