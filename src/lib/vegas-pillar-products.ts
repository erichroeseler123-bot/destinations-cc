import type { AttractionPillarConfig } from "@/app/components/dcc/AttractionPillarTemplate";
import type { ViatorActionProduct } from "@/lib/dcc/action/viator";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import { buildFeaturedProductStack } from "@/src/data/featured-tour-products";

type PlaceInput = {
  slug: string;
  name: string;
  hub?: string;
  citySlug?: string;
};

const PILLAR_PLACES: Record<string, PlaceInput[]> = {
  "grand-canyon": [
    { slug: "grand-canyon", name: "Grand Canyon National Park", hub: "grand-canyon" },
    { slug: "las-vegas", name: "Las Vegas", hub: "las-vegas", citySlug: "las-vegas" },
  ],
  "hoover-dam": [{ slug: "las-vegas", name: "Las Vegas", hub: "las-vegas", citySlug: "las-vegas" }],
  "helicopter-tours": [
    { slug: "las-vegas", name: "Las Vegas", hub: "las-vegas", citySlug: "las-vegas" },
    { slug: "grand-canyon", name: "Grand Canyon National Park", hub: "grand-canyon" },
  ],
};

function scoreProduct(product: ViatorActionProduct): number {
  return (product.rating || 0) * 100000 + (product.review_count || 0);
}

function dedupeProducts(products: ViatorActionProduct[]): ViatorActionProduct[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    const key = product.url || product.product_code || product.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function withLiveFeaturedProducts(config: AttractionPillarConfig): Promise<AttractionPillarConfig> {
  const places = PILLAR_PLACES[config.slug] || [];
  if (!places.length) return config;

  const actions = await Promise.all(places.map((place) => getViatorActionForPlace(place)));
  const liveCandidates = dedupeProducts(
    actions
      .flatMap((action) => action.products)
      .filter((product) => product.url && (product.image_url || product.rating || product.price_from))
      .sort((a, b) => scoreProduct(b) - scoreProduct(a)),
  );

  if (!liveCandidates.length) return config;

  return {
    ...config,
    featuredProducts: buildFeaturedProductStack(config.slug, config.featuredProducts || [], liveCandidates),
  };
}
