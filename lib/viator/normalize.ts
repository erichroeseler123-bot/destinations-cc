import type { ViatorActionProduct } from "@/lib/viator/schema";
import type {
  NormalizedViatorProduct,
  ViatorAvailabilityStatus,
  ViatorIntent,
} from "@/lib/viator/types";

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function collectCategoryHints(product: ViatorActionProduct): string[] {
  const tags = (product.display_tags || []).map((tag) => normalizeLabel(tag.label));
  const text = [product.title, product.short_description, product.itinerary_type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const categories = new Set<string>(tags);

  if (/whale/.test(text)) categories.add("whale-watching");
  if (/helicopter|heli|flightseeing|glacier landing/.test(text)) categories.add("helicopter-tours");
  if (/swamp/.test(text)) categories.add("swamp-tour");
  if (/airboat/.test(text)) categories.add("airboat");
  if (/jeep/.test(text)) categories.add("jeep-tour");
  if (/luxury|premium|vip|private/.test(text)) categories.add("luxury");
  if (/family|kids|children/.test(text)) categories.add("family");
  if (/cruise|shore excursion|port/.test(text)) categories.add("cruise-compatible");
  if (/budget|value|shared|group/.test(text)) categories.add("value");

  return Array.from(categories);
}

function deriveAvailabilityStatus(product: ViatorActionProduct): ViatorAvailabilityStatus {
  const text = [product.title, product.short_description, product.booking_confirmation_type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/sold out|unavailable/.test(text)) return "limited";
  if (/instant|available|confirmed/.test(text)) return "available";
  return "unknown";
}

export function isDirectViatorProductUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith("viator.com") && /\/tours\//i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function normalizedProductSupportsIntent(
  product: NormalizedViatorProduct,
  intent: ViatorIntent,
): boolean {
  const haystack = [
    product.title,
    product.description,
    ...product.categories,
    ...product.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (intent === "whale-watching") return /whale|wildlife.*boat|marine wildlife/.test(haystack);
  if (intent === "helicopter-tours") return /helicopter|heli|flightseeing|glacier landing/.test(haystack);
  if (intent === "swamp-tour") return /swamp|bayou/.test(haystack) && !/airboat/.test(haystack);
  if (intent === "airboat") return /airboat/.test(haystack);
  if (intent === "jeep-tour") return /jeep|4x4|off-road/.test(haystack);
  if (intent === "luxury") return /luxury|premium|vip|private/.test(haystack);
  if (intent === "value") return /shared|group|budget|value/.test(haystack);
  if (intent === "family") return /family|kids|children/.test(haystack);
  if (intent === "cruise-compatible") return /cruise|shore excursion|port/.test(haystack);

  return false;
}

export function normalizeViatorResolverProduct(
  product: ViatorActionProduct,
): NormalizedViatorProduct {
  return {
    productCode: product.product_code,
    title: product.title,
    description: product.short_description || null,
    price: product.price_from ?? null,
    currency: product.currency || null,
    rating: product.rating ?? null,
    reviewCount: product.review_count ?? null,
    durationMinutes: product.duration_minutes ?? null,
    categories: collectCategoryHints(product),
    tags: (product.display_tags || []).map((tag) => normalizeLabel(tag.label)),
    supplierName: product.supplier_name || null,
    bookUrl: product.url,
    availabilityStatus: deriveAvailabilityStatus(product),
  };
}
