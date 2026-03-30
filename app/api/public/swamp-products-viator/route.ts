import { NextResponse } from "next/server";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import { buildViatorCampaignFromParts, buildViatorSearchUrl } from "@/lib/viator/links";

export const dynamic = "force-dynamic";

type SwampProduct = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  priceLabel: string | null;
  imageUrl: string | null;
  supplierName: string | null;
  bookHref: string;
  rating: number | null;
  reviewCount: number | null;
  itineraryType: string | null;
  bookingConfirmationType: string | null;
  optionCount: number | null;
  displayTags: string[];
};

const INCLUDE_PATTERNS = [
  /\bswamp\b/i,
  /\bbayou\b/i,
  /\bairboat\b/i,
  /\balligator\b/i,
  /\bplantation\b.*\bswamp\b/i,
];

const EXCLUDE_PATTERNS = [
  /\bghost\b/i,
  /\bvampire\b/i,
  /\bvoodoo\b/i,
  /\bwalking\b/i,
  /\bfood\b/i,
  /\bjazz\b/i,
  /\bsteamboat\b/i,
  /\bbrewery\b/i,
  /\bcemetery\b/i,
];

function matchesSwampIntent(title: string, description: string | null | undefined) {
  const haystack = `${title} ${description || ""}`.trim();
  return (
    INCLUDE_PATTERNS.some((pattern) => pattern.test(haystack)) &&
    !EXCLUDE_PATTERNS.some((pattern) => pattern.test(haystack))
  );
}

function formatPriceLabel(priceFrom: number | null, currency: string) {
  if (!Number.isFinite(priceFrom) || priceFrom === null || priceFrom <= 0) return null;
  return `${currency} ${priceFrom % 1 === 0 ? priceFrom.toFixed(0) : priceFrom.toFixed(2)}`;
}

function toProductRank(product: {
  title: string;
  review_count: number | null;
  merchandising_score?: number;
  rating: number | null;
}) {
  let score = 0;
  if (/\bairboat\b/i.test(product.title)) score += 50;
  if (/\bsmall\b/i.test(product.title)) score += 15;
  if (/\blarge\b/i.test(product.title)) score += 10;
  score += Number(product.review_count || 0) / 100;
  score += Number(product.rating || 0) * 5;
  score += Number(product.merchandising_score || 0);
  return score;
}

export async function GET() {
  try {
    const action = await getViatorActionForPlace({
      slug: "new-orleans-swamp-tours",
      citySlug: "new-orleans",
      name: "New Orleans",
      currency: "USD",
    });

    const products: SwampProduct[] = action.products
      .filter((product) => matchesSwampIntent(product.title, product.short_description))
      .sort((a, b) => toProductRank(b) - toProductRank(a))
      .slice(0, 8)
      .map((product) => ({
        id: product.product_code,
        title: product.title,
        description: product.short_description || null,
        durationMinutes: product.duration_minutes || null,
        priceLabel: formatPriceLabel(product.price_from, product.currency),
        imageUrl: product.image_url || null,
        supplierName: product.supplier_name || null,
        bookHref: product.url,
        rating: product.rating || null,
        reviewCount: product.review_count || null,
        itineraryType: product.itinerary_type || null,
        bookingConfirmationType: product.booking_confirmation_type || null,
        optionCount: product.product_option_count || null,
        displayTags: (product.display_tags || []).map((tag) => tag.label).filter(Boolean),
      }));

    const browseHref = buildViatorSearchUrl("New Orleans swamp tours", {
      campaign: buildViatorCampaignFromParts(["new-orleans", "swamp-tours", "browse"]),
      currency: "USD",
    });

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        signals: {
          headline: products.length
            ? "Bookable swamp tours surfaced from Viator inventory."
            : "No Viator swamp products matched the current New Orleans search.",
        },
        browseHref,
        products,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Viator swamp products unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
