import {
  appendViatorAttribution,
  buildViatorCampaignFromParts,
} from "@/lib/viator/links";

export function buildAttributedSwampProductHref(input: {
  productUrl: string;
  productCode: string | null;
  currency: string;
}): string {
  return appendViatorAttribution(input.productUrl, {
    campaign: buildViatorCampaignFromParts([
      "new-orleans",
      "swamp-tours",
      input.productCode || "product",
    ]),
    currency: input.currency,
  });
}
