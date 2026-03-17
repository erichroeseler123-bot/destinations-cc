import { getTravelpayoutsConfig, getTravelpayoutsTrsForBrand } from "@/lib/travelpayouts/config";

export type TravelpayoutsLinkInput = {
  url: string;
  sub_id?: string;
};

export type TravelpayoutsCreateLinksOptions = {
  brandKey?: string;
  shorten?: boolean;
  trs?: string;
};

export type TravelpayoutsLinkResult = {
  url: string;
  code: string;
  partner_url: string;
  message?: string;
};

export type TravelpayoutsCreateLinksResponse = {
  result?: {
    trs: number | string;
    marker: number | string;
    shorten: boolean;
    links: TravelpayoutsLinkResult[];
  };
  code: string;
  status: number;
  error?: string;
};

export const TRAVELPAYOUTS_UNSUPPORTED_PARTNER_LINK_BRANDS = new Set([
  "kiwi",
  "kiwi_com",
  "expedia_uk",
  "holidaytaxis",
  "ticketmaster",
  "priority_pass",
  "indrive",
]);

export function normalizeTravelpayoutsBrandKey(value: string | undefined | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
}

export function isTravelpayoutsPartnerLinkBrandSupported(brandKey?: string | null) {
  const normalized = normalizeTravelpayoutsBrandKey(brandKey);
  if (!normalized) return true;
  return !TRAVELPAYOUTS_UNSUPPORTED_PARTNER_LINK_BRANDS.has(normalized);
}

export async function createTravelpayoutsPartnerLinks(
  links: TravelpayoutsLinkInput[],
  options: TravelpayoutsCreateLinksOptions = {}
): Promise<TravelpayoutsCreateLinksResponse> {
  const config = getTravelpayoutsConfig();
  if (!config.configured) {
    throw new Error("travelpayouts_not_configured");
  }

  const brandKey = normalizeTravelpayoutsBrandKey(options.brandKey);
  if (!isTravelpayoutsPartnerLinkBrandSupported(brandKey)) {
    throw new Error("travelpayouts_brand_unsupported");
  }

  const trsValue = Number(options.trs || getTravelpayoutsTrsForBrand(brandKey));
  const markerValue = Number(config.marker);
  if (!Number.isFinite(trsValue) || trsValue <= 0) {
    throw new Error("travelpayouts_invalid_trs");
  }
  if (!Number.isFinite(markerValue) || markerValue <= 0) {
    throw new Error("travelpayouts_invalid_marker");
  }

  const payload = {
    trs: trsValue,
    marker: markerValue,
    shorten: options.shorten ?? true,
    links: links.slice(0, 10),
  };

  const response = await fetch(`${config.baseUrl}/links/v1/create`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-access-token": config.apiToken,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as TravelpayoutsCreateLinksResponse | null;
  if (!response.ok) {
    throw new Error(data?.error || data?.code || `travelpayouts_http_${response.status}`);
  }
  if (!data) {
    throw new Error("travelpayouts_empty_response");
  }

  return data;
}
