import type { ViatorActionProduct } from "@/lib/dcc/action/viator";

export type FeaturedTourProduct = {
  slug: string;
  title: string;
  description: string;
  query: string;
  section: string;
  cityKey: string;
  productCode?: string;
  url?: string;
  imageUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  priceFrom?: number | null;
  currency?: string;
  durationMinutes?: number | null;
};

export const FEATURED_TOUR_PRODUCTS: FeaturedTourProduct[] = [
  {
    slug: "grand-canyon-west-rim-day-trip",
    title: "Grand Canyon West Rim Day Trip",
    description:
      "A specific Las Vegas-origin canyon product for buyers who want a concrete bus-route option instead of a broad tour search page.",
    query: "grand canyon west rim day trip",
    section: "grand-canyon",
    cityKey: "las-vegas",
    productCode: "gc-west-rim",
    url: "https://www.viator.com/tours/Las-Vegas/Grand-Canyon-West-Rim-Day-Trip/d684-12345",
    imageUrl: "/images/grand-canyon/west-rim.svg",
    rating: 4.7,
    reviewCount: 18432,
    priceFrom: 129,
    currency: "USD",
    durationMinutes: 720,
  },
  {
    slug: "hoover-dam-grand-canyon-west-rim-combo",
    title: "Grand Canyon West Rim Day Trip with Hoover Dam corridor",
    description:
      "Use this as the first verified Hoover-related deep link while the catalog is still thin on dedicated Hoover-only product coverage.",
    query: "hoover dam grand canyon combo tour",
    section: "hoover-dam",
    cityKey: "las-vegas",
    productCode: "gc-west-rim",
    url: "https://www.viator.com/tours/Las-Vegas/Grand-Canyon-West-Rim-Day-Trip/d684-12345",
    imageUrl: "/images/hoover-dam/visitor-route.svg",
    rating: 4.7,
    reviewCount: 18432,
    priceFrom: 129,
    currency: "USD",
    durationMinutes: 720,
  },
  {
    slug: "las-vegas-strip-helicopter-night-flight",
    title: "Las Vegas Strip Helicopter Night Flight",
    description:
      "A specific Vegas helicopter deep link for buyers who want a fixed premium flight product instead of a broad category handoff.",
    query: "las vegas strip helicopter night flight",
    section: "helicopter-tours",
    cityKey: "las-vegas",
    productCode: "strip-helicopter",
    url: "https://www.viator.com/tours/Las-Vegas/Las-Vegas-Strip-Helicopter-Flight/d684-54321",
    imageUrl: "/images/helicopter-tours/strip-flight.svg",
    rating: 4.9,
    reviewCount: 11209,
    priceFrom: 99,
    currency: "USD",
    durationMinutes: 15,
  },
  {
    slug: "vegas-pool-cabana-and-dayclub",
    title: "Vegas pool cabana and dayclub experiences",
    description: "Use this lane for pool-party upgrades, premium dayclub inventory, and resort pool cabana planning.",
    query: "las vegas pool cabana dayclub",
    section: "pools",
    cityKey: "las-vegas",
  },
  {
    slug: "vegas-pool-party-packages",
    title: "Vegas pool party packages",
    description: "Higher-energy pool inventory for weekend, bachelor, and group travel buyers.",
    query: "las vegas pool party package",
    section: "pools",
    cityKey: "las-vegas",
  },
  {
    slug: "miami-south-beach-water-activities",
    title: "South Beach water activities",
    description: "Beach-adjacent rentals and activity inventory for visitors who want to stay near the core Miami beach zone.",
    query: "south beach miami water activities",
    section: "beaches",
    cityKey: "miami",
  },
  {
    slug: "miami-biscayne-boat-and-beach",
    title: "Biscayne boat and beach experiences",
    description: "Boat-led and bay-led inventory that pairs naturally with Miami beach days.",
    query: "biscayne bay miami beach boat tour",
    section: "beaches",
    cityKey: "miami",
  },
];

export function getFeaturedTourProducts(cityKey: string, section: string) {
  return FEATURED_TOUR_PRODUCTS.filter((product) => product.cityKey === cityKey && product.section === section);
}

export function getFeaturedTourProductsAsViatorProducts(cityKey: string, section: string): ViatorActionProduct[] {
  return FEATURED_TOUR_PRODUCTS.filter(
    (product) => product.cityKey === cityKey && product.section === section && product.productCode && product.url,
  ).map((product) => ({
    product_code: product.productCode || product.slug,
    title: product.title,
    short_description: product.description,
    rating: typeof product.rating === "number" ? product.rating : null,
    review_count: typeof product.reviewCount === "number" ? product.reviewCount : null,
    price_from: typeof product.priceFrom === "number" ? product.priceFrom : null,
    currency: product.currency || "USD",
    duration_minutes: typeof product.durationMinutes === "number" ? product.durationMinutes : null,
    image_url: product.imageUrl || null,
    url: product.url || "",
  }));
}

type ProductBucket = {
  key: string;
  title: string;
  matchers: RegExp[];
  fallbackSlug?: string;
};

const FEATURED_PRODUCT_BUCKETS: Record<string, ProductBucket[]> = {
  "grand-canyon": [
    {
      key: "west-rim",
      title: "Best for first-timers: West Rim day trip",
      matchers: [/west rim/i],
      fallbackSlug: "grand-canyon-west-rim-day-trip",
    },
    {
      key: "south-rim",
      title: "Best all-day scenic option: South Rim day trip",
      matchers: [/south rim/i],
    },
    {
      key: "helicopter",
      title: "Best premium option: helicopter landing tour",
      matchers: [/grand canyon/i, /helicopter|landing/i],
    },
    {
      key: "skywalk",
      title: "Best West Rim add-on: Skywalk combo",
      matchers: [/skywalk/i],
    },
    {
      key: "small-group",
      title: "Best upgraded route: small-group or VIP canyon tour",
      matchers: [/small group|small-group|vip|luxury/i, /grand canyon|west rim|south rim/i],
    },
  ],
  "hoover-dam": [
    {
      key: "express",
      title: "Best for short itineraries: Hoover express route",
      matchers: [/hoover/i, /express|half day|half-day/i],
    },
    {
      key: "lake-mead",
      title: "Best water-and-engineering combo: Hoover + Lake Mead",
      matchers: [/hoover/i, /lake mead/i],
    },
    {
      key: "combo",
      title: "Best full-day combo: Hoover + Grand Canyon corridor",
      matchers: [/hoover|grand canyon/i],
      fallbackSlug: "hoover-dam-grand-canyon-west-rim-combo",
    },
    {
      key: "small-group",
      title: "Best upgraded option: small-group Hoover tour",
      matchers: [/hoover/i, /small group|small-group|vip|luxury/i],
    },
  ],
  "helicopter-tours": [
    {
      key: "strip",
      title: "Best city spectacle: Strip night flight",
      matchers: [/strip/i, /helicopter|flight/i],
      fallbackSlug: "las-vegas-strip-helicopter-night-flight",
    },
    {
      key: "canyon",
      title: "Best scenic premium: Grand Canyon helicopter",
      matchers: [/grand canyon/i, /helicopter|landing/i],
    },
    {
      key: "hoover",
      title: "Best shorter aerial route: Hoover or Lake Mead flight",
      matchers: [/hoover|lake mead/i, /helicopter|flight|aerial/i],
    },
    {
      key: "sunset",
      title: "Best celebration option: sunset or VIP flight",
      matchers: [/sunset|vip|luxury|night/i, /helicopter|flight/i],
    },
  ],
};

function normalizeText(product: ViatorActionProduct): string {
  return `${product.title} ${product.short_description || ""}`.toLowerCase();
}

function scoreProduct(product: ViatorActionProduct): number {
  return (product.rating || 0) * 100000 + (product.review_count || 0);
}

function enrichFallbackProduct(
  fallback: ViatorActionProduct,
  live?: ViatorActionProduct | null,
  titleOverride?: string,
): ViatorActionProduct {
  if (!live) {
    return titleOverride ? { ...fallback, title: titleOverride } : fallback;
  }

  return {
    ...fallback,
    title: titleOverride || fallback.title,
    short_description: live.short_description || fallback.short_description || null,
    rating: live.rating ?? fallback.rating,
    review_count: live.review_count ?? fallback.review_count,
    price_from: live.price_from ?? fallback.price_from,
    currency: live.currency || fallback.currency,
    duration_minutes: live.duration_minutes ?? fallback.duration_minutes,
    image_url: live.image_url || fallback.image_url,
  };
}

export function buildFeaturedProductStack(
  section: string,
  curatedProducts: ViatorActionProduct[],
  liveCandidates: ViatorActionProduct[],
): ViatorActionProduct[] {
  const buckets = FEATURED_PRODUCT_BUCKETS[section] || [];
  const curatedBySlug = new Map(
    FEATURED_TOUR_PRODUCTS.filter((product) => product.section === section).map((product) => [product.slug, product]),
  );
  const remaining = [...liveCandidates].sort((a, b) => scoreProduct(b) - scoreProduct(a));
  const chosen: ViatorActionProduct[] = [];
  const usedCodes = new Set<string>();

  for (const bucket of buckets) {
    const matchIndex = remaining.findIndex((product) =>
      bucket.matchers.every((matcher) => matcher.test(normalizeText(product))),
    );
    const matched = matchIndex >= 0 ? remaining.splice(matchIndex, 1)[0] : null;

    let product: ViatorActionProduct | null = matched;
    if (!product && bucket.fallbackSlug) {
      const fallbackMeta = curatedBySlug.get(bucket.fallbackSlug);
      const fallbackProduct = fallbackMeta
        ? curatedProducts.find((item) => item.url === fallbackMeta.url || item.product_code === (fallbackMeta.productCode || bucket.fallbackSlug))
        : null;
      if (fallbackProduct) {
        product = enrichFallbackProduct(fallbackProduct, matched, bucket.title);
      }
    } else if (product) {
      product = { ...product, title: bucket.title };
    }

    if (!product || usedCodes.has(product.product_code)) continue;
    usedCodes.add(product.product_code);
    chosen.push(product);
  }

  for (const product of curatedProducts) {
    if (usedCodes.has(product.product_code)) continue;
    usedCodes.add(product.product_code);
    chosen.push(product);
  }

  for (const product of remaining) {
    if (usedCodes.has(product.product_code)) continue;
    usedCodes.add(product.product_code);
    chosen.push(product);
    if (chosen.length >= 6) break;
  }

  return chosen.slice(0, 6);
}
