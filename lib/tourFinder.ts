import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import { getViatorDestinationOptions } from "@/lib/viator/destinations";

export type TourFinderSearchRequest = {
  destination: string;
  startDate: string;
  endDate?: string;
  intent?: string;
  groupSize?: number;
};

export type TourFinderResult = {
  id: string;
  title: string;
  location: string;
  image?: string;
  priceFrom?: number;
  rating?: number;
  reviewCount?: number;
  duration?: string;
  category?: string;
  whyItMatches?: string[];
  detailUrl: string;
  bookingUrl?: string;
  available?: boolean;
};

type TourFinderDestinationOption = ReturnType<typeof getViatorDestinationOptions>[number];

export const TOUR_FINDER_INTENT_MAP: Record<string, string[]> = {
  "concerts-nightlife": ["night", "nightlife", "show", "shows", "entertainment", "party", "pub", "bar", "music"],
  "tours-sightseeing": ["sightseeing", "city", "walking", "bus", "museum", "landmark", "culture", "cruise", "tour"],
  "adventure-excursions": ["adventure", "outdoor", "hiking", "rafting", "helicopter", "glacier", "kayak", "excursion", "zipline"],
  "private-group-transport": ["private", "group", "charter", "transfer", "transport", "custom", "vip"],
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function formatDuration(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return undefined;
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} hours`;
  return `${hours.toFixed(1)} hours`;
}

function resolveDestinationOption(destination: string): TourFinderDestinationOption | null {
  const query = normalizeText(destination);
  if (!query) return null;

  const options = getViatorDestinationOptions();
  const exact =
    options.find((option) => normalizeText(option.routeSlug) === query) ||
    options.find((option) => normalizeText(option.cityName) === query) ||
    options.find((option) => option.searchTerms.some((term) => normalizeText(term) === query));
  if (exact) return exact;

  return (
    options.find(
      (option) =>
        normalizeText(option.cityName).includes(query) ||
        normalizeText(option.routeSlug).includes(query) ||
        option.searchTerms.some((term) => normalizeText(term).includes(query))
    ) || null
  );
}

function productHaystack(product: Awaited<ReturnType<typeof getViatorActionForPlace>>["products"][number]) {
  return [
    product.title,
    product.short_description || "",
    product.supplier_name || "",
    product.itinerary_type || "",
    product.booking_confirmation_type || "",
    ...(product.display_tags || []).map((tag) => tag.label),
    ...(product.product_option_titles || []),
  ]
    .join(" ")
    .toLowerCase();
}

function scoreIntentMatch(haystack: string, intent: string | undefined) {
  if (!intent) return 0;
  const keywords = TOUR_FINDER_INTENT_MAP[intent] || [];
  return keywords.reduce((score, keyword) => (haystack.includes(keyword) ? score + 4 : score), 0);
}

function scoreGroupMatch(haystack: string, groupSize: number | undefined, intent: string | undefined) {
  if (!groupSize) return 0;

  let score = 0;
  if (groupSize >= 6 && /(private|group|small group|charter|vip)/.test(haystack)) score += 8;
  if (groupSize >= 4 && /(small group|private)/.test(haystack)) score += 4;
  if (groupSize <= 3 && /(walking|city|night|food|bus|cruise)/.test(haystack)) score += 3;
  if (intent === "private-group-transport" && /(private|group|charter|transport|transfer)/.test(haystack)) score += 8;
  return score;
}

function buildWhyItMatches(input: {
  haystack: string;
  intent?: string;
  groupSize?: number;
  cityName: string;
  reviewCount?: number | null;
  rating?: number | null;
}) {
  const reasons: string[] = [];
  if (input.intent) {
    const label = input.intent
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    reasons.push(`Matches ${label.toLowerCase()} intent`);
  }
  if (input.groupSize) {
    reasons.push(`Fits a ${input.groupSize}-person trip better than generic tour search`);
  }
  reasons.push(`Strong destination match for ${input.cityName}`);
  if ((input.rating || 0) >= 4.5 && (input.reviewCount || 0) >= 25) {
    reasons.push("Strong review profile");
  }
  if (/(private|small group)/.test(input.haystack)) {
    reasons.push("More controlled group experience");
  }
  return reasons.slice(0, 3);
}

export async function searchTourFinder(request: TourFinderSearchRequest): Promise<{
  destination: TourFinderDestinationOption | null;
  results: TourFinderResult[];
}> {
  const destination = resolveDestinationOption(request.destination);
  if (!destination) return { destination: null, results: [] };

  const action = await getViatorActionForPlace({
    slug: destination.routeSlug,
    name: destination.cityName,
    citySlug: destination.routeSlug,
    currency: "USD",
  });

  const ranked = action.products
    .map((product) => {
      const haystack = productHaystack(product);
      const score =
        scoreIntentMatch(haystack, request.intent) +
        scoreGroupMatch(haystack, request.groupSize, request.intent) +
        ((product.merchandising_score || 0) * 2) +
        ((product.rating || 0) * 2) +
        Math.min(product.review_count || 0, 200) / 50;

      const category =
        product.display_tags?.[0]?.label ||
        product.itinerary_type ||
        product.booking_confirmation_type ||
        undefined;

      return {
        score,
        result: {
          id: product.product_code,
          title: product.title,
          location: destination.cityName,
          image: product.image_url || undefined,
          priceFrom: product.price_from ?? undefined,
          rating: product.rating ?? undefined,
          reviewCount: product.review_count ?? undefined,
          duration: formatDuration(product.duration_minutes),
          category,
          whyItMatches: buildWhyItMatches({
            haystack,
            intent: request.intent,
            groupSize: request.groupSize,
            cityName: destination.cityName,
            rating: product.rating,
            reviewCount: product.review_count,
          }),
          detailUrl: `/tours/${encodeURIComponent(product.product_code)}`,
          bookingUrl: product.url || undefined,
        } satisfies TourFinderResult,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((item) => item.result);

  return { destination, results: ranked };
}
