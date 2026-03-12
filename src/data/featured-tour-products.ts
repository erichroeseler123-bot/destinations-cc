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
