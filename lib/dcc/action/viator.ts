import fs from "fs";
import path from "path";
import toursCatalog from "@/data/tours.json";
import vegasTours from "@/data/vegas.tours.json";
import { slugify } from "@/lib/dcc/slug";
import { getEnvNumber, getEnvOptional } from "@/lib/dcc/config/env";

const ROOT = process.cwd();
const VIATOR_CACHE_PATH = path.join(ROOT, "data", "action", "viator.products.cache.json");
const DEFAULT_VIATOR_PID = "P00281144";
const DEFAULT_VIATOR_MCID = "42383";

function getViatorPid(): string {
  return getEnvOptional("VIATOR_PID") || DEFAULT_VIATOR_PID;
}

function getViatorMcid(): string {
  return getEnvOptional("VIATOR_MCID") || DEFAULT_VIATOR_MCID;
}

function getDefaultMaxAgeHours(): number {
  return getEnvNumber("VIATOR_CACHE_MAX_AGE_HOURS", 72, { min: 1, max: 720 });
}

type Tour = {
  id?: string;
  product_code?: string;
  name?: string;
  title?: string;
  duration?: string | null;
  duration_minutes?: number | null;
  price_from?: number | null;
  currency?: string | null;
  rating?: number | null;
  reviews?: number | null;
  review_count?: number | null;
  image_url?: string | null;
  supplier_name?: string | null;
  itinerary_type?: string | null;
  booking_confirmation_type?: string | null;
  product_option_count?: number | null;
  product_option_titles?: string[] | null;
  booking_url?: string;
  url?: string;
  viatorUrl?: string;
  city?: string;
  citySlug?: string;
  destination?: string;
  destinationSlug?: string;
  dcc?: {
    node?: string;
    hub?: string;
    destinationSlug?: string;
    citySlug?: string;
  };
};

type CacheEntry = {
  place_slug: string;
  last_updated: string;
  products: Tour[];
};

type CacheFile = {
  generated_at: string;
  source: string;
  places: Record<string, CacheEntry>;
};

export type ViatorActionProduct = {
  product_code: string;
  title: string;
  short_description?: string | null;
  rating: number | null;
  review_count: number | null;
  price_from: number | null;
  currency: string;
  duration_minutes: number | null;
  image_url: string | null;
  supplier_name?: string | null;
  itinerary_type?: string | null;
  booking_confirmation_type?: string | null;
  product_option_count?: number | null;
  product_option_titles?: string[] | null;
  url: string;
};

export type ViatorActionResult = {
  enabled: boolean;
  products: ViatorActionProduct[];
  source: "cache" | "catalog_fallback" | "live_api";
  cache_status: "fresh" | "stale" | "miss" | "bypass";
  stale: boolean;
  last_updated: string | null;
  stale_after: string | null;
  max_age_hours: number;
  fallback_reason: string | null;
};

export type ViatorActionInput = {
  slug: string;
  name: string;
  hub?: string;
  citySlug?: string;
};

function tokenize(value: string): string[] {
  return slugify(value)
    .split("-")
    .filter((token) => token.length > 2);
}

function productMatchesPlace(tour: Tour, node: ViatorActionInput): boolean {
  const cityName = node.name.replace(/\s*Guide\s*$/i, "").trim();
  const acceptedExact = new Set<string>(
    [node.slug, node.citySlug, node.hub, cityName]
      .filter((value): value is string => Boolean(value))
      .map((value) => slugify(value))
  );
  const textHaystack = slugify(
    [
      tour.name,
      tour.title,
      tour.city,
      tour.citySlug,
      tour.destination,
      tour.destinationSlug,
      tour.dcc?.citySlug,
      tour.dcc?.destinationSlug,
      tour.url,
      tour.viatorUrl,
    ]
      .filter(Boolean)
      .join(" ")
  );

  if ([...acceptedExact].some((value) => value && textHaystack.includes(value))) return true;

  const cityTokens = tokenize(cityName);
  return cityTokens.length > 0 && cityTokens.every((token) => textHaystack.includes(token));
}

function normalizeTours(raw: unknown): Tour[] {
  if (Array.isArray(raw)) return raw as Tour[];
  if (raw && typeof raw === "object") {
    const obj = raw as { tours?: Tour[]; items?: Tour[] };
    if (Array.isArray(obj.tours)) return obj.tours;
    if (Array.isArray(obj.items)) return obj.items;
  }
  return [];
}

function getTourNodeKey(t: Tour): string {
  const key =
    t?.dcc?.node ||
    t?.dcc?.hub ||
    t?.dcc?.destinationSlug ||
    t?.dcc?.citySlug ||
    t?.citySlug ||
    t?.destinationSlug ||
    t?.destination ||
    t?.city;
  return slugify(String(key || ""));
}

function toDurationMinutes(duration: string | number | null | undefined): number | null {
  if (typeof duration === "number" && Number.isFinite(duration)) return duration;
  if (typeof duration !== "string") return null;
  const lower = duration.toLowerCase();
  const h = lower.match(/(\d+(?:\.\d+)?)\s*hour/);
  if (h) return Math.round(Number(h[1]) * 60);
  const m = lower.match(/(\d+(?:\.\d+)?)\s*min/);
  if (m) return Math.round(Number(m[1]));
  return null;
}

function appendViatorTracking(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("pid", getViatorPid());
    u.searchParams.set("mcid", getViatorMcid());
    return u.toString();
  } catch {
    return url;
  }
}

function buildFallbackViatorSearchUrl(placeName: string, title: string): string {
  const q = encodeURIComponent([placeName, title].filter(Boolean).join(" ").trim() || `${placeName} tours`);
  return `https://www.viator.com/searchResults/all?text=${q}&pid=${encodeURIComponent(getViatorPid())}&mcid=${encodeURIComponent(getViatorMcid())}`;
}

function mapToursToActionProducts(tours: Tour[], placeName: string): ViatorActionProduct[] {
  return tours.slice(0, 8).map((tour) => {
    const title = (tour.name || tour.title || "Experience").trim();
    const baseUrl = tour.viatorUrl || tour.url || tour.booking_url || "";
    const tracked =
      baseUrl && baseUrl.includes("viator.com")
        ? appendViatorTracking(baseUrl)
        : buildFallbackViatorSearchUrl(placeName, title);
    return {
      product_code: String(tour.product_code || tour.id || slugify(title)),
      title,
      short_description: null,
      rating: typeof tour.rating === "number" ? tour.rating : null,
      review_count:
        typeof tour.review_count === "number"
          ? tour.review_count
          : typeof tour.reviews === "number"
            ? tour.reviews
            : null,
      price_from: typeof tour.price_from === "number" ? tour.price_from : null,
      currency: tour.currency || "USD",
      duration_minutes:
        typeof tour.duration_minutes === "number"
          ? tour.duration_minutes
          : toDurationMinutes(tour.duration),
      image_url: tour.image_url || null,
      supplier_name: tour.supplier_name || null,
      itinerary_type: tour.itinerary_type || null,
      booking_confirmation_type: tour.booking_confirmation_type || null,
      product_option_count:
        typeof tour.product_option_count === "number" ? tour.product_option_count : null,
      product_option_titles: Array.isArray(tour.product_option_titles)
        ? tour.product_option_titles.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        : null,
      url: tracked,
    };
  });
}

function readCache(): CacheFile | null {
  if (!fs.existsSync(VIATOR_CACHE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(VIATOR_CACHE_PATH, "utf8")) as CacheFile;
  } catch {
    return null;
  }
}

function isFresh(lastUpdated: string, maxAgeHours: number): boolean {
  const ts = Date.parse(lastUpdated);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= maxAgeHours * 60 * 60 * 1000;
}

function getCatalogFallback(node: ViatorActionInput): Tour[] {
  const cityName = node.name.replace(/\s*Guide\s*$/i, "").trim();
  const hubId = slugify(node.hub || node.slug.replace(/-guide$/i, ""));
  const citySlug = slugify(node.citySlug || hubId) === "vegas" ? "las-vegas" : slugify(node.citySlug || hubId);
  const nodeSlug = slugify(node.slug);
  const accepted = new Set<string>([
    hubId,
    citySlug,
    nodeSlug,
    slugify(cityName),
    slugify(cityName.replace(/\s+/g, "-")),
  ]);
  const primaryTours = normalizeTours(toursCatalog);
  const fallbackTours = normalizeTours(vegasTours);
  const allTours = primaryTours.length > 0 ? primaryTours : fallbackTours;
  return allTours.filter((t) => accepted.has(getTourNodeKey(t)) || productMatchesPlace(t, node));
}

export function resolveViatorActionFromCache(
  node: ViatorActionInput,
  maxAgeHours = getDefaultMaxAgeHours()
): ViatorActionResult | null {
  const placeName = node.name.replace(/\s*Guide\s*$/i, "").trim();
  const cache = readCache();
  const cached = cache?.places?.[node.slug];
  if (!cached?.products?.length) return null;

  const fresh = isFresh(cached.last_updated, maxAgeHours);
  const staleAfter = Number.isNaN(Date.parse(cached.last_updated))
    ? null
    : new Date(Date.parse(cached.last_updated) + maxAgeHours * 60 * 60 * 1000).toISOString();

  return {
    enabled: true,
    products: mapToursToActionProducts(cached.products.filter((tour) => productMatchesPlace(tour, node)), placeName),
    source: "cache",
    cache_status: fresh ? "fresh" : "stale",
    stale: !fresh,
    last_updated: cached.last_updated,
    stale_after: staleAfter,
    max_age_hours: maxAgeHours,
    fallback_reason: null,
  };
}

export function resolveViatorActionFromCatalog(
  node: ViatorActionInput,
  maxAgeHours = getDefaultMaxAgeHours(),
  reason = "cache_miss"
): ViatorActionResult {
  const placeName = node.name.replace(/\s*Guide\s*$/i, "").trim();
  const fallbackTours = getCatalogFallback(node).filter((tour) => productMatchesPlace(tour, node));
  return {
    enabled: fallbackTours.length > 0,
    products: mapToursToActionProducts(fallbackTours, placeName),
    source: "catalog_fallback",
    cache_status: "miss",
    stale: false,
    last_updated: null,
    stale_after: null,
    max_age_hours: maxAgeHours,
    fallback_reason: reason,
  };
}

export function resolveViatorAction(node: ViatorActionInput, maxAgeHours = getDefaultMaxAgeHours()): ViatorActionResult {
  return (
    resolveViatorActionFromCache(node, maxAgeHours) ||
    resolveViatorActionFromCatalog(node, maxAgeHours, "cache_miss")
  );
}
