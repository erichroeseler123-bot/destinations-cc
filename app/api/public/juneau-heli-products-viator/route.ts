import { NextResponse } from "next/server";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import { buildViatorCampaignFromParts, buildViatorSearchUrl } from "@/lib/viator/links";

export const dynamic = "force-dynamic";

type JuneauHeliProduct = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  priceLabel: string | null;
  imageUrl: string | null;
  supplierName: string | null;
  bookHref: string;
};

const INCLUDE_PATTERNS = [
  /\bhelicopter\b/i,
  /\bheli\b/i,
  /\bglacier landing\b/i,
  /\bdog.?sled\b/i,
  /\bicefield\b/i,
];

const EXCLUDE_PATTERNS = [
  /\bwhale\b/i,
  /\bfishing\b/i,
  /\bkayak\b/i,
  /\bfood\b/i,
  /\bbrewery\b/i,
  /\bwalking\b/i,
  /\bshuttle\b/i,
  /\btransfer\b/i,
  /\btram\b/i,
  /\bgondola\b/i,
];

function matchesHeliIntent(title: string, description: string | null | undefined) {
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
}) {
  let score = 0;
  if (/\bdog.?sled\b/i.test(product.title)) score += 45;
  if (/\bglacier landing\b/i.test(product.title)) score += 35;
  if (/\bhelicopter\b|\bheli\b/i.test(product.title)) score += 25;
  if (/\bicefield\b/i.test(product.title)) score += 20;
  score += Number(product.review_count || 0) / 100;
  score += Number(product.merchandising_score || 0);
  return score;
}

export async function GET(request: Request) {
  try {
    const date = new URL(request.url).searchParams.get("date");
    const action = await getViatorActionForPlace({
      slug: "juneau-helicopter-tours",
      citySlug: "juneau",
      name: "Juneau",
      currency: "USD",
    });

    const products: JuneauHeliProduct[] = action.products
      .filter((product) => matchesHeliIntent(product.title, product.short_description))
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
      }));

    const browseHref = buildViatorSearchUrl("Juneau helicopter tours", {
      campaign: buildViatorCampaignFromParts(["juneau", "helicopter-tours", "browse"]),
      currency: "USD",
    });

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        selectedDate: date,
        signals: {
          headline: date
            ? `Viator helicopter products to check for ${date}. Availability is confirmed in the booking flow.`
            : "Viator helicopter products for Juneau cruise-day planning.",
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
    const message = error instanceof Error ? error.message : "Viator Juneau helicopter products unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
