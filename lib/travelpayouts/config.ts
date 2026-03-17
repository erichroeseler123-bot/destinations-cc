const DEFAULT_BASE_URL = "https://api.travelpayouts.com";

function clean(value: string | undefined | null): string {
  return String(value || "").trim();
}

export function getTravelpayoutsConfig() {
  const apiToken = clean(process.env.TRAVELPAYOUTS_API_TOKEN);
  const marker = clean(process.env.TRAVELPAYOUTS_MARKER);
  const defaultTrs = clean(process.env.TRAVELPAYOUTS_TRS_DEFAULT);
  const baseUrl = clean(process.env.TRAVELPAYOUTS_API_BASE_URL) || DEFAULT_BASE_URL;

  return {
    apiToken,
    marker,
    defaultTrs,
    baseUrl,
    configured: Boolean(apiToken && marker && defaultTrs),
  };
}

export function getTravelpayoutsTrsForBrand(brandKey?: string | null): string {
  const normalized = clean(brandKey).toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  if (!normalized) return getTravelpayoutsConfig().defaultTrs;

  const brandSpecific = clean(process.env[`TRAVELPAYOUTS_TRS_${normalized}`]);
  return brandSpecific || getTravelpayoutsConfig().defaultTrs;
}
