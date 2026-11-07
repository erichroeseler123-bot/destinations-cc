"use client";

import { usePathname, useSearchParams } from "next/navigation";
import StickyMobileBookingBar from "./StickyMobileBookingBar";
import {
  STOREFRONT_PRODUCTS,
  getFareHarborUrl,
  getProductPrimaryBookingHref,
} from "../tours/pageConfig";
import {
  isApprovedProductSlug,
  resolveFareHarborSource,
} from "../lib/fareHarborAttribution";

export default function WnoMobileConversionMount() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const match = pathname.match(/^\/tours\/([^/]+)\/?$/);
  if (!match) return null;

  const slug = decodeURIComponent(match[1]);
  if (!isApprovedProductSlug(slug)) return null;

  const product = STOREFRONT_PRODUCTS.find((candidate) => candidate.slug === slug);
  if (!product) return null;

  const requestedSource = searchParams.get("src") || undefined;
  const recommendationContext = searchParams.get("recommended");
  const refCode = resolveFareHarborSource({
    productSlug: slug,
    requestedSource,
    hasValidRecommendation: Boolean(recommendationContext),
  });
  const selectedDate = searchParams.get("date") || searchParams.get("arrivalDate") || undefined;
  const selectedPartySize =
    searchParams.get("party_size") || searchParams.get("adults") || undefined;
  const fallbackHref =
    getProductPrimaryBookingHref(product, {
      date: selectedDate,
      adults: selectedPartySize,
    }) || getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);

  return (
    <StickyMobileBookingBar
      product={product}
      refCode={refCode}
      fallbackHref={fallbackHref}
      ctaText={product.ctaLabel || "Check availability"}
    />
  );
}
