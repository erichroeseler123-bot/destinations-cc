import {
  appendViatorAttribution,
  buildViatorCampaignFromParts,
  buildViatorDestinationUrl,
  buildViatorSearchUrl,
  hasViatorAffiliateConfig,
} from "@/lib/viator/links";

type AnyTour = Record<string, any>;

export { hasViatorAffiliateConfig };

export function buildViatorSearchLink(query: string, campaign?: string) {
  return buildViatorSearchUrl(query, {
    campaign: campaign || buildViatorCampaignFromParts(["search", query]),
  });
}

export function buildViatorDestinationLink(cityName: string, campaign?: string) {
  return buildViatorDestinationUrl(cityName, {
    campaign: campaign || buildViatorCampaignFromParts(["destination", cityName]),
  });
}

/**
 * Minimal Viator deep link builder.
 * Customize these fields to match your tours.json shape.
 */
export function buildViatorLink(tour: AnyTour) {
  // 1) If your data already includes a direct affiliate url, use it.
  const direct = tour.viatorUrl || tour.url || tour.affiliateUrl;
  if (direct && typeof direct === "string") {
    return appendViatorAttribution(direct, {
      preserveExistingCampaign: true,
      campaign: buildViatorCampaignFromParts([
        tour.city || tour.destination || tour.cityName,
        tour.name || tour.title,
      ]),
    });
  }

  // 2) Otherwise build a simple search URL from city + name
  const city = (tour.city || tour.cityName || tour.destination || "").toString();
  const name = (tour.name || tour.title || "").toString();

  const query = [city, name].filter(Boolean).join(" ").trim() || "tours";
  return buildViatorSearchLink(
    query,
    buildViatorCampaignFromParts([city, name || "product", "pdp"])
  );
}
