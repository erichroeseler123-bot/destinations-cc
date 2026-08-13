import { STOREFRONT_PRODUCTS, type NolaFareHarborProduct } from "../tours/pageConfig";

export type KnowledgeConfidence = "verified" | "operator-stated" | "editorial" | "unknown";
export type FitLevel = "strong" | "possible" | "poor" | "unknown";
export type IntensityLevel = "low" | "moderate" | "high" | "unknown";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night" | "varies" | "unknown";
export type FulfillmentSource = "fareharbor" | "viator" | "getyourguide" | "direct";

export type TourKnowledge = {
  slug: string;
  title: string;
  operatorName: string;
  category: string;
  fulfillmentSource: FulfillmentSource;

  durationLabel?: string;
  transportationSummary?: string;
  pickupSummary?: string;
  walkingSummary?: string;
  ridingSummary?: string;
  exposureSummary?: string;

  familyFit: FitLevel;
  mobilityFit: FitLevel;
  rainFit: FitLevel;
  cruisePassengerFit: FitLevel;
  walkingIntensity: IntensityLevel;
  timeOfDay: TimeOfDay[];

  bestFit: string[];
  notIdealFor: string[];
  childrenConsiderations: string[];
  highlights: string[];
  confirmedInclusions: string[];
  bookingConfirmations: string[];

  neighborhoods: string[];
  landmarks: string[];
  experienceTraits: string[];
  searchDemandIds: string[];

  confidence: {
    duration: KnowledgeConfidence;
    transportation: KnowledgeConfidence;
    pickup: KnowledgeConfidence;
    suitability: KnowledgeConfidence;
  };
};

function inferSearchDemandIds(product: NolaFareHarborProduct): string[] {
  const haystack = `${product.category} ${product.title}`.toLowerCase();
  const ids = new Set<string>();

  if (haystack.includes("city tour") || haystack.includes("city +")) ids.add("city-sightseeing");
  if (haystack.includes("swamp") || haystack.includes("covered boat")) ids.add("swamp-bayou");
  if (haystack.includes("airboat")) ids.add("airboat");
  if (haystack.includes("plantation") || haystack.includes("oak alley") || haystack.includes("whitney") || haystack.includes("laura")) ids.add("plantations");
  if (haystack.includes("ghost") || haystack.includes("haunted") || haystack.includes("spirits")) ids.add("ghost-haunted");
  if (haystack.includes("food") || haystack.includes("culinary")) ids.add("food");
  if (haystack.includes("cocktail") || haystack.includes("pub") || haystack.includes("bar")) ids.add("cocktails-bars");
  if (haystack.includes("river") || haystack.includes("cruise") || haystack.includes("steamboat") || haystack.includes("jazz cruise")) ids.add("river-cruises");

  return [...ids];
}

/**
 * Canonical WNO knowledge layer.
 *
 * This adapter intentionally starts with only facts already present in the
 * live storefront registry. Unknown dimensions stay unknown until verified;
 * they must never be invented simply to satisfy search demand.
 *
 * Future enrichment should happen here (or in data feeding this file), not in
 * individual SEO pages, chooser components, comparison pages, or schema
 * helpers. Those surfaces should consume this shared factual layer.
 */
function fromFareHarborProduct(product: NolaFareHarborProduct): TourKnowledge {
  return {
    slug: product.slug,
    title: product.title,
    operatorName: product.operatorName,
    category: product.category,
    fulfillmentSource: "fareharbor",

    durationLabel: product.durationLabel,
    transportationSummary: product.transportationSummary ?? product.logistics?.transportation,
    pickupSummary: product.pickupSummary ?? product.logistics?.pickup,
    walkingSummary: product.physicalFormat?.walking,
    ridingSummary: product.physicalFormat?.riding,
    exposureSummary: product.physicalFormat?.exposure,

    // Do not infer these from marketing copy. They remain unknown until the
    // product has been deliberately classified against a verified rule set.
    familyFit: "unknown",
    mobilityFit: "unknown",
    rainFit: "unknown",
    cruisePassengerFit: "unknown",
    walkingIntensity: "unknown",
    timeOfDay: ["unknown"],

    bestFit: product.bestFit ?? [],
    notIdealFor: product.notIdealFor ?? [],
    childrenConsiderations: product.childrenConsiderations ?? [],
    highlights: product.highlights ?? [],
    confirmedInclusions: product.confirmedInclusions ?? [],
    bookingConfirmations: product.bookingConfirmations ?? [],

    neighborhoods: [],
    landmarks: [],
    experienceTraits: [],
    searchDemandIds: inferSearchDemandIds(product),

    confidence: {
      duration: product.durationLabel ? "operator-stated" : "unknown",
      transportation:
        product.transportationSummary || product.logistics?.transportation ? "operator-stated" : "unknown",
      pickup: product.pickupSummary || product.logistics?.pickup ? "operator-stated" : "unknown",
      suitability:
        product.bestFit?.length || product.notIdealFor?.length || product.childrenConsiderations?.length
          ? "editorial"
          : "unknown",
    },
  };
}

export const TOUR_KNOWLEDGE: TourKnowledge[] = STOREFRONT_PRODUCTS.map(fromFareHarborProduct);

export const TOUR_KNOWLEDGE_BY_SLUG: Record<string, TourKnowledge> = Object.fromEntries(
  TOUR_KNOWLEDGE.map((tour) => [tour.slug, tour]),
);

export function getTourKnowledge(slug: string): TourKnowledge | undefined {
  return TOUR_KNOWLEDGE_BY_SLUG[slug];
}
