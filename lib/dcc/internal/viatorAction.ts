import {
  resolveViatorAction,
  resolveViatorActionFromCache,
  resolveViatorActionFromCatalog,
  type ViatorActionProduct,
  type ViatorActionResult,
} from "@/lib/dcc/action/viator";
import { slugify } from "@/lib/dcc/slug";
import { getEnvCsv, getEnvNumber, getEnvOptional } from "@/lib/dcc/config/env";
import { appendViatorAttribution, buildViatorCampaignFromParts } from "@/lib/viator/links";
import { normalizeViatorCurrency } from "@/lib/viator/config";
import { getDisplayableViatorTags, normalizeViatorTagIds, scoreViatorMerchandisingSignals } from "@/lib/viator/tags";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorPolicy as getViatorIntegrationPolicy } from "@/lib/viator/policy";
import { normalizeViatorActionProduct } from "@/lib/viator/schema";
import { getViatorClient } from "@/lib/viator/client";
import { getCachedViatorDestinationRows } from "@/lib/viator/destinations";

export type ViatorPlaceInput = {
  slug: string;
  name: string;
  hub?: string;
  citySlug?: string;
  currency?: string;
};

export type ViatorSourcePolicy = "auto" | "live" | "cache" | "fallback";

export type ControlledViatorActionResult = ViatorActionResult & {
  policy_applied: ViatorSourcePolicy;
  served_source: ViatorActionResult["source"];
  reason: string;
};

type ViatorDestination = {
  destinationId: number;
  name: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(value: string, max = 180): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
}

function extractLiveImageUrl(product: Record<string, unknown>): string | null {
  const images = Array.isArray(product.images) ? product.images : [];
  for (const image of images) {
    const row = asRecord(image);
    if (!row) continue;
    const variants = Array.isArray(row.variants) ? row.variants : [];
    for (const variant of variants) {
      const v = asRecord(variant);
      const url = firstString(v?.url, v?.secureUrl);
      if (url) return url;
    }
    const direct = firstString(row.url, row.secureUrl, row.src);
    if (direct) return direct;
  }

  const primaryImage = asRecord(product.primaryImage);
  return firstString(primaryImage?.url, primaryImage?.secureUrl);
}

function extractLiveDescription(product: Record<string, unknown>): string | null {
  const raw = firstString(
    product.shortDescription,
    product.summary,
    product.description,
    asRecord(product.seoData)?.description
  );

  if (!raw) return null;
  const clean = stripHtml(raw);
  return clean ? truncate(clean) : null;
}

function extractLiveDurationMinutes(product: Record<string, unknown>): number | null {
  const duration = asRecord(product.duration);
  const fromDuration = firstNumber(
    duration?.fixedDurationInMinutes,
    duration?.durationInMinutes,
    duration?.minutes
  );
  if (fromDuration !== null) return Math.round(fromDuration);

  const itinerary = asRecord(product.itinerary);
  const fromItinerary = firstNumber(itinerary?.durationMinutes);
  if (fromItinerary !== null) return Math.round(fromItinerary);

  const durationText = firstString(
    product.durationText,
    duration?.formattedDuration,
    duration?.text
  );
  if (!durationText) return null;

  const lower = durationText.toLowerCase();
  const hours = lower.match(/(\d+(?:\.\d+)?)\s*h(?:ou)?r/);
  if (hours) return Math.round(Number(hours[1]) * 60);
  const minutes = lower.match(/(\d+(?:\.\d+)?)\s*m(?:in)?/);
  if (minutes) return Math.round(Number(minutes[1]));
  return null;
}

function normalizeItineraryType(value: unknown): string | null {
  const raw = firstString(value);
  if (!raw) return null;
  return raw
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getViatorApiKey(): string {
  return getEnvOptional("VIATOR_API_KEY") || "";
}

function getRequestedCurrency(value: string | undefined): string {
  return normalizeViatorCurrency(value);
}

function getViatorSourcePolicy(): ViatorSourcePolicy {
  const raw = (getEnvOptional("VIATOR_SOURCE_POLICY") || "auto").toLowerCase();
  if (raw === "auto" || raw === "live" || raw === "cache" || raw === "fallback") return raw;
  return "auto";
}

function getViatorLiveAllowlist(): Set<string> {
  return new Set(getEnvCsv("VIATOR_LIVE_ALLOWLIST").map((s) => slugify(s)).filter(Boolean));
}

function getViatorLivePercent(): number {
  return getEnvNumber("VIATOR_LIVE_PERCENT", 0, { min: 0, max: 100 });
}

function hashPercent(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 100;
}

function lookupDestinationId(place: ViatorPlaceInput): number | null {
  const rows = (getCachedViatorDestinationRows() as ViatorDestination[])
    .filter((d) => typeof d.destinationId === "number" && typeof d.name === "string");

  const placeSlug = slugify(place.slug);
  const nameSlug = slugify(place.name.replace(/\s*Guide\s*$/i, "").trim());

  const exact = rows.find((d) => slugify(d.name) === placeSlug || slugify(d.name) === nameSlug);
  if (exact) return exact.destinationId;

  const firstToken = placeSlug.split("-")[0];
  const loose = rows.find((d) => slugify(d.name).startsWith(firstToken));
  return loose?.destinationId || null;
}

function liveProductMatchesPlace(product: ViatorActionProduct, place: ViatorPlaceInput): boolean {
  const placeSlug = slugify(place.citySlug || place.slug || place.name);
  const placeNameSlug = slugify(place.name.replace(/\s*Guide\s*$/i, "").trim());
  const haystack = slugify(
    [product.title, product.short_description, product.url]
      .filter(Boolean)
      .join(" ")
  );

  if (placeSlug && haystack.includes(placeSlug)) return true;
  if (placeNameSlug && haystack.includes(placeNameSlug)) return true;

  const tokens = placeNameSlug.split("-").filter((token) => token.length > 2);
  return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
}

function normalizeLiveProducts(data: unknown, placeName: string): ViatorActionProduct[] {
  const payload = asRecord(data);
  const rowsRaw =
    (payload && Array.isArray(payload.products) ? payload.products : null) ||
    (payload && Array.isArray(payload.data) ? payload.data : null) ||
    [];
  const rows = rowsRaw.filter((row): row is Record<string, unknown> => Boolean(asRecord(row)));

  return rows.slice(0, 8).map((p) => {
    const title = String(p.title || p.name || "Experience");
    const productCode = String(p.productCode || p.code || slugify(title));
    const reviews = asRecord(p.reviews);
    const pricing = asRecord(p.pricing);
    const pricingSummary = asRecord(pricing?.summary);
    const price = asRecord(p.price);
    const supplier = asRecord(p.supplier);
    const itinerary = asRecord(p.itinerary);
    const bookingConfirmationSettings = asRecord(p.bookingConfirmationSettings);
    const productOptions = Array.isArray(p.productOptions) ? p.productOptions : [];
    const reviewCount = Number(reviews?.totalReviews ?? reviews?.total ?? reviews?.count ?? 0);
    const rating = Number(reviews?.combinedAverageRating ?? reviews?.average ?? NaN);
    const priceFrom = Number(
      pricingSummary?.fromPrice ?? price?.fromPrice ?? price?.amount ?? NaN
    );
    const currency = String(pricing?.currency || price?.currency || "USD");
    const productUrl = String(p.productUrl || p.webUrl || "");
    const imageUrl = extractLiveImageUrl(p);
    const shortDescription = extractLiveDescription(p);
    const durationMinutes = extractLiveDurationMinutes(p);
    const supplierName = firstString(supplier?.name);
    const itineraryType = normalizeItineraryType(itinerary?.itineraryType);
    const bookingConfirmationType = normalizeItineraryType(
      bookingConfirmationSettings?.confirmationType
    );
    const tagIds = normalizeViatorTagIds(Array.isArray(p.tags) ? p.tags : []);
    const productOptionTitles = productOptions
      .map((option) => firstString(asRecord(option)?.title))
      .filter((value): value is string => Boolean(value));
    const tracked = appendViatorAttribution(
      productUrl || `https://www.viator.com/searchResults/all?text=${encodeURIComponent(`${placeName} ${title}`)}`,
      {
        preserveExistingCampaign: true,
        campaign: buildViatorCampaignFromParts([placeName, title, "live"]),
      }
    );

    return normalizeViatorActionProduct({
      product_code: productCode,
      title,
      short_description: shortDescription,
      rating: Number.isFinite(rating) ? rating : null,
      review_count: Number.isFinite(reviewCount) && reviewCount > 0 ? reviewCount : null,
      price_from: Number.isFinite(priceFrom) ? priceFrom : null,
      currency,
      duration_minutes: durationMinutes,
      image_url: imageUrl,
      supplier_name: supplierName,
      itinerary_type: itineraryType,
      booking_confirmation_type: bookingConfirmationType,
      product_option_count: productOptions.length || null,
      product_option_titles: productOptionTitles.length > 0 ? productOptionTitles : null,
      tag_ids: tagIds,
      display_tags: getDisplayableViatorTags(tagIds),
      merchandising_score: scoreViatorMerchandisingSignals(tagIds),
      url: tracked,
    });
  });
}

async function fetchLiveViatorAction(place: ViatorPlaceInput): Promise<ViatorActionResult | null> {
  if (!getViatorCapabilities().canUseSearch) {
    return {
      enabled: false,
      products: [],
      source: "live_api",
      cache_status: "bypass",
      stale: false,
      last_updated: new Date().toISOString(),
      stale_after: null,
      max_age_hours: 0,
      fallback_reason: "search_not_allowed_for_access_tier",
    };
  }
  const VIATOR_API_KEY = getViatorApiKey();
  if (!VIATOR_API_KEY) {
    return {
      enabled: false,
      products: [],
      source: "live_api",
      cache_status: "bypass",
      stale: false,
      last_updated: new Date().toISOString(),
      stale_after: null,
      max_age_hours: 0,
      fallback_reason: "missing_api_key",
    };
  }
  const destinationId = lookupDestinationId(place);
  if (!destinationId) {
    return {
      enabled: false,
      products: [],
      source: "live_api",
      cache_status: "bypass",
      stale: false,
      last_updated: new Date().toISOString(),
      stale_after: null,
      max_age_hours: 0,
      fallback_reason: "missing_destination_id",
    };
  }

  let json: unknown;
  try {
    json = await getViatorClient().searchProducts({
      filtering: { destination: destinationId },
      currency: getRequestedCurrency(place.currency),
      pagination: { start: 1, count: 8 },
    });
  } catch (error) {
    const summary =
      error instanceof Error ? error.message.slice(0, 160).replace(/\s+/g, "_") : "unknown";
    return {
      enabled: false,
      products: [],
      source: "live_api",
      cache_status: "bypass",
      stale: false,
      last_updated: new Date().toISOString(),
      stale_after: null,
      max_age_hours: 0,
      fallback_reason: summary,
    };
  }

  const products = normalizeLiveProducts(json, place.name).filter((product) =>
    liveProductMatchesPlace(product, place)
  );
  if (products.length === 0) {
    const payload = asRecord(json);
    const hasProductsArray = Boolean(payload && Array.isArray(payload.products));
    const hasDataArray = Boolean(payload && Array.isArray(payload.data));
    return {
      enabled: false,
      products: [],
      source: "live_api",
      cache_status: "bypass",
      stale: false,
      last_updated: new Date().toISOString(),
      stale_after: null,
      max_age_hours: 0,
      fallback_reason: hasProductsArray || hasDataArray ? "live_empty_products" : "live_response_shape_unrecognized",
    };
  }

  return {
    enabled: products.length > 0,
    products,
    source: "live_api",
    cache_status: "bypass",
    stale: false,
    last_updated: new Date().toISOString(),
    stale_after: null,
    max_age_hours: 0,
    fallback_reason: null,
  };
}

function policyForPlace(place: ViatorPlaceInput): { policy: ViatorSourcePolicy; useLive: boolean; reason: string } {
  const capabilities = getViatorCapabilities();
  const policy = getViatorSourcePolicy();
  const slug = slugify(place.slug);
  const VIATOR_LIVE_ALLOWLIST = getViatorLiveAllowlist();
  const VIATOR_LIVE_PERCENT = getViatorLivePercent();
  const inAllowlist = VIATOR_LIVE_ALLOWLIST.size > 0 && VIATOR_LIVE_ALLOWLIST.has(slug);
  const inPercentRollout = hashPercent(slug) < VIATOR_LIVE_PERCENT;

  if (policy === "live") {
    if (!capabilities.canUseSearch) {
      return { policy, useLive: false, reason: "live_policy_blocked_by_access_tier" };
    }
    if (VIATOR_LIVE_ALLOWLIST.size > 0 && !inAllowlist) {
      return { policy, useLive: false, reason: "live_policy_allowlist_block" };
    }
    return { policy, useLive: true, reason: "live_policy" };
  }
  if (policy === "cache") return { policy, useLive: false, reason: "cache_policy" };
  if (policy === "fallback") return { policy, useLive: false, reason: "fallback_policy" };

  if (capabilities.canUseSearch && inAllowlist) return { policy: "auto", useLive: true, reason: "allowlist" };
  if (capabilities.canUseSearch && inPercentRollout) return { policy: "auto", useLive: true, reason: "percent_rollout" };
  return { policy: "auto", useLive: false, reason: "auto_cache_default" };
}

export async function getViatorProductsForPlace(
  place: ViatorPlaceInput
): Promise<ViatorActionProduct[]> {
  const action = await getViatorActionForPlace(place);
  return action.products;
}

export async function getViatorActionForPlace(
  place: ViatorPlaceInput
): Promise<ControlledViatorActionResult> {
  const policyState = getViatorIntegrationPolicy();
  const decision = policyForPlace(place);
  const maxAgeHours = getEnvNumber("VIATOR_CACHE_MAX_AGE_HOURS", 72, { min: 1 });

  if (decision.policy === "fallback") {
    const action = resolveViatorActionFromCatalog(place, maxAgeHours, "forced_fallback_policy");
    return { ...action, policy_applied: decision.policy, served_source: action.source, reason: decision.reason };
  }

  if (decision.policy === "cache") {
    const cacheAction =
      resolveViatorActionFromCache(place, maxAgeHours) ||
      resolveViatorActionFromCatalog(place, maxAgeHours, "cache_policy_miss");
    return { ...cacheAction, policy_applied: decision.policy, served_source: cacheAction.source, reason: decision.reason };
  }

  if (decision.useLive) {
    try {
      const live = await fetchLiveViatorAction(place);
      if (live?.enabled || live?.products.length) {
        return { ...live, policy_applied: decision.policy, served_source: live.source, reason: decision.reason };
      }
      if (live) {
        return {
          ...live,
          policy_applied: decision.policy,
          served_source: live.source,
          reason: `${decision.reason}:${policyState.accessTier}:live_diagnostics_only`,
        };
      }
      const fallback = resolveViatorAction(place, maxAgeHours);
      return {
        ...fallback,
        policy_applied: decision.policy,
        served_source: fallback.source,
        reason: "live_failed_fallback",
      };
    } catch {
      const fallback = resolveViatorAction(place, maxAgeHours);
      return {
        ...fallback,
        policy_applied: decision.policy,
        served_source: fallback.source,
        reason: "live_exception_fallback",
       };
     }
   }
 
   const action = resolveViatorAction(place, maxAgeHours);
   return { ...action, policy_applied: decision.policy, served_source: action.source, reason: decision.reason };
 }
