import {
  buildViatorCampaignValue,
  getViatorPublicConfig,
  sanitizeViatorCampaignValue,
  type ViatorMedium,
} from "@/lib/viator/config";

type ViatorAttributionOptions = {
  campaign?: string | null;
  medium?: ViatorMedium | null;
  preserveExistingCampaign?: boolean;
  locale?: string | null;
  currency?: string | null;
};

function normalizeUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function hasViatorAffiliateConfig(): boolean {
  const { pid } = getViatorPublicConfig();
  return pid.trim().length > 0;
}

export function appendViatorAttribution(
  url: string,
  options: ViatorAttributionOptions = {}
): string {
  const normalized = normalizeUrl(url);
  if (!normalized) return url;

  const config = getViatorPublicConfig();
  const medium = options.medium || config.medium;
  const existingCampaign = normalized.searchParams.get("campaign");
  const campaign =
    options.preserveExistingCampaign && existingCampaign
      ? sanitizeViatorCampaignValue(existingCampaign)
      : sanitizeViatorCampaignValue(options.campaign || config.campaign);

  if (config.pid) normalized.searchParams.set("pid", config.pid);
  if (config.mcid) normalized.searchParams.set("mcid", config.mcid);
  normalized.searchParams.set("medium", medium);
  normalized.searchParams.set("campaign", campaign);
  normalized.searchParams.set("utm_source", config.utmSource);
  normalized.searchParams.set("utm_medium", config.utmMedium);
  normalized.searchParams.set("utm_campaign", config.utmCampaign);
  normalized.searchParams.set("locale", options.locale || config.locale);
  if (options.currency) normalized.searchParams.set("currencyCode", options.currency);

  return normalized.toString();
}

export function buildViatorSearchUrl(
  query: string,
  options: ViatorAttributionOptions = {}
): string {
  const trimmedQuery = query.trim() || "tours";
  const base = new URL("https://www.viator.com/searchResults/all");
  base.searchParams.set("text", trimmedQuery);
  return appendViatorAttribution(base.toString(), {
    ...options,
    medium: options.medium || "api",
  });
}

export function buildViatorDestinationUrl(
  destinationName: string,
  options: ViatorAttributionOptions = {}
): string {
  return buildViatorSearchUrl(`${destinationName} tours and activities`, options);
}

export function buildViatorCampaignFromParts(parts: Array<string | null | undefined>): string {
  return buildViatorCampaignValue(parts);
}
