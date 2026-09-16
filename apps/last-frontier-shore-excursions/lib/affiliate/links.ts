import { AffiliateSource } from "./types";

const VIATOR_SEARCH_BASE = "https://www.viator.com/searchResults/all";
const GYG_SEARCH_BASE = "https://www.getyourguide.com/s/";
const DEFAULT_VIATOR_PID = "P00281144";
const DEFAULT_VIATOR_MCID = "42383";
const DEFAULT_GYG_PARTNER_ID = "F2MMUUH";

export interface AffiliateLinkOptions {
  campaign: string;
  source?: AffiliateSource;
  medium?: string;
  searchFallbackQuery?: string;
}

export function buildViatorProductUrl(
  productUrlOrPath: string,
  campaign: string
): string {
  try {
    let url: URL;
    if (productUrlOrPath.startsWith("http://") || productUrlOrPath.startsWith("https://")) {
      url = new URL(productUrlOrPath);
    } else {
      url = new URL(productUrlOrPath.startsWith("/") ? productUrlOrPath : `/${productUrlOrPath}`, "https://www.viator.com");
    }

    const pid = process.env.NEXT_PUBLIC_LAST_FRONTIER_VIATOR_PID || process.env.NEXT_PUBLIC_VIATOR_PID || DEFAULT_VIATOR_PID;
    const mcid = process.env.NEXT_PUBLIC_LAST_FRONTIER_VIATOR_MCID || process.env.NEXT_PUBLIC_VIATOR_MCID || DEFAULT_VIATOR_MCID;
    const cleanCampaign = `last-frontier-${campaign.replace(/^last-frontier-/, "")}`;

    if (pid) url.searchParams.set("pid", pid);
    if (mcid) url.searchParams.set("mcid", mcid);
    url.searchParams.set("medium", "link");
    url.searchParams.set("campaign", cleanCampaign);
    url.searchParams.set("utm_source", "lastfrontiershoreexcursions.com");
    url.searchParams.set("utm_medium", "affiliate");
    url.searchParams.set("utm_campaign", cleanCampaign);

    return url.toString();
  } catch {
    return buildViatorSearchUrl(productUrlOrPath, campaign);
  }
}

export function buildViatorSearchUrl(query: string, campaign: string): string {
  const url = new URL(VIATOR_SEARCH_BASE);
  url.searchParams.set("text", query.trim() || "Alaska shore excursions");

  const pid = process.env.NEXT_PUBLIC_LAST_FRONTIER_VIATOR_PID || process.env.NEXT_PUBLIC_VIATOR_PID || DEFAULT_VIATOR_PID;
  const mcid = process.env.NEXT_PUBLIC_LAST_FRONTIER_VIATOR_MCID || process.env.NEXT_PUBLIC_VIATOR_MCID || DEFAULT_VIATOR_MCID;
  const cleanCampaign = `last-frontier-${campaign.replace(/^last-frontier-/, "")}`;

  if (pid) url.searchParams.set("pid", pid);
  if (mcid) url.searchParams.set("mcid", mcid);
  url.searchParams.set("medium", "link");
  url.searchParams.set("campaign", cleanCampaign);
  url.searchParams.set("utm_source", "lastfrontiershoreexcursions.com");
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set("utm_campaign", cleanCampaign);

  return url.toString();
}

export function buildGetYourGuideProductUrl(
  productUrlOrPath: string,
  campaign: string
): string {
  try {
    let url: URL;
    if (productUrlOrPath.startsWith("http://") || productUrlOrPath.startsWith("https://")) {
      url = new URL(productUrlOrPath);
    } else {
      url = new URL(productUrlOrPath.startsWith("/") ? productUrlOrPath : `/${productUrlOrPath}`, "https://www.getyourguide.com");
    }

    const partnerId = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || process.env.GETYOURGUIDE_PARTNER_ID || DEFAULT_GYG_PARTNER_ID;
    const cleanCampaign = `last-frontier-${campaign.replace(/^last-frontier-/, "")}`;

    url.searchParams.set("partner_id", partnerId);
    url.searchParams.set("utm_medium", "online_publisher");
    url.searchParams.set("utm_source", "lastfrontiershoreexcursions.com");
    url.searchParams.set("utm_campaign", cleanCampaign);

    return url.toString();
  } catch {
    return buildGetYourGuideSearchUrl(productUrlOrPath, campaign);
  }
}

export function buildGetYourGuideSearchUrl(query: string, campaign: string): string {
  const url = new URL(GYG_SEARCH_BASE);
  url.searchParams.set("q", query.trim() || "Alaska shore excursions");

  const partnerId = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || process.env.GETYOURGUIDE_PARTNER_ID || DEFAULT_GYG_PARTNER_ID;
  const cleanCampaign = `last-frontier-${campaign.replace(/^last-frontier-/, "")}`;

  url.searchParams.set("partner_id", partnerId);
  url.searchParams.set("utm_medium", "online_publisher");
  url.searchParams.set("utm_source", "lastfrontiershoreexcursions.com");
  url.searchParams.set("utm_campaign", cleanCampaign);

  return url.toString();
}

export function buildAffiliateUrl(
  source: AffiliateSource,
  officialUrl: string,
  campaign: string,
  fallbackQuery?: string,
  isExactProduct?: boolean
): string {
  const isDirectProduct = isExactProduct !== undefined
    ? isExactProduct
    : Boolean(
        officialUrl &&
        !officialUrl.includes("searchResults") &&
        !officialUrl.includes("/s/?") &&
        (officialUrl.includes("/tours/") || officialUrl.includes("getyourguide.com/activity/"))
      );

  // If not a verified exact product, always route to partner search with affiliate tracking
  if (!isDirectProduct || !officialUrl || officialUrl.includes("searchResults") || officialUrl.includes("/s/?")) {
    const query = fallbackQuery || (officialUrl.includes("text=") ? new URL(officialUrl).searchParams.get("text") || "" : "Alaska shore excursions");
    if (source === "getyourguide") {
      return buildGetYourGuideSearchUrl(query, campaign);
    }
    return buildViatorSearchUrl(query, campaign);
  }

  if (source === "getyourguide") {
    return buildGetYourGuideProductUrl(officialUrl, campaign);
  }

  return buildViatorProductUrl(officialUrl, campaign);
}
