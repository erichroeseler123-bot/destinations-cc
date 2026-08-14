import { STOREFRONT_PRODUCTS, type NolaFareHarborProduct } from "../tours/pageConfig";

export type KnowledgeConfidence = "verified" | "operator-stated" | "editorial" | "unknown";
export type FitLevel = "strong" | "possible" | "poor" | "unknown";
export type IntensityLevel = "low" | "moderate" | "high" | "unknown";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night" | "varies" | "unknown";
export type FulfillmentAuthority = "fareharbor" | "approved-direct" | "viator" | "getyourguide" | "editorial-only";
export type TransportationMode = "included" | "pickup-available" | "self-arrival" | "varies" | "unknown";
export type WeatherSuitability = "rain-friendly" | "weather-sensitive" | "mixed" | "unknown";

export type DurationFacts = {
  label?: string;
  minutes?: number;
  approximate: boolean;
  dayPart: "short" | "half-day" | "full-day" | "unknown";
  fitsBeforeDinner: boolean | "unknown";
};

export type TransportationFacts = {
  mode: TransportationMode;
  summary?: string;
  pickupSummary?: string;
  pickupZones: string[];
};

export type MobilityFacts = {
  walkingIntensity: IntensityLevel;
  walkingSummary?: string;
  stairs: "none" | "some" | "significant" | "unknown";
  seating: "frequent" | "some" | "limited" | "unknown";
  mobilityFit: FitLevel;
  caveats: string[];
};

export type FamilyFacts = {
  fit: FitLevel;
  minimumAge?: number;
  strollerFriendly: boolean | "unknown";
  mixedAgeFit: FitLevel;
  kidsUnderSixFit: FitLevel;
  considerations: string[];
};

export type WeatherFacts = {
  suitability: WeatherSuitability;
  rainFit: FitLevel;
  heatExposure: "low" | "moderate" | "high" | "unknown";
  coveredOrIndoor: boolean | "partial" | "unknown";
  exposureSummary?: string;
};

export type TimeFacts = {
  periods: TimeOfDay[];
  tonightCapable: boolean | "unknown";
  lateArrivalCompatible: boolean | "unknown";
};

export type CruiseFacts = {
  fit: FitLevel;
  preCruise: FitLevel;
  postCruise: FitLevel;
  minimumPortWindowMinutes?: number;
  luggageConsiderations: string[];
  transportConsiderations: string[];
};

export type FulfillmentFacts = {
  authority: FulfillmentAuthority;
  transactional: boolean;
  bookingPath?: string;
};

export type TourKnowledge = {
  slug: string;
  title: string;
  operatorName: string;
  category: string;

  // Minimum viable fact model. These eight objects are the canonical inputs
  // to recommendation, comparison, intent, situation and schema surfaces.
  duration: DurationFacts;
  transportation: TransportationFacts;
  mobility: MobilityFacts;
  family: FamilyFacts;
  weather: WeatherFacts;
  time: TimeFacts;
  cruise: CruiseFacts;
  fulfillment: FulfillmentFacts;

  // Compatibility/readability fields retained while older WNO surfaces are
  // migrated onto the eight canonical fact groups above.
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

function parseDurationMinutes(label?: string): number | undefined {
  if (!label) return undefined;
  const normalized = label.toLowerCase();
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)/);
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60);
  const minuteMatch = normalized.match(/(\d+)\s*(?:minute|min)/);
  if (minuteMatch) return Number(minuteMatch[1]);
  return undefined;
}

function durationDayPart(minutes?: number): DurationFacts["dayPart"] {
  if (!minutes) return "unknown";
  if (minutes <= 180) return "short";
  if (minutes <= 360) return "half-day";
  return "full-day";
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
  const durationMinutes = parseDurationMinutes(product.durationLabel);
  const transportationSummary = product.transportationSummary ?? product.logistics?.transportation;
  const pickupSummary = product.pickupSummary ?? product.logistics?.pickup;
  const walkingSummary = product.physicalFormat?.walking;
  const exposureSummary = product.physicalFormat?.exposure;

  const duration: DurationFacts = {
    label: product.durationLabel,
    minutes: durationMinutes,
    approximate: Boolean(product.durationLabel?.toLowerCase().includes("approx")),
    dayPart: durationDayPart(durationMinutes),
    fitsBeforeDinner: durationMinutes ? durationMinutes <= 240 : "unknown",
  };

  const transportation: TransportationFacts = {
    mode: transportationSummary ? "varies" : "unknown",
    summary: transportationSummary,
    pickupSummary,
    pickupZones: [],
  };

  const mobility: MobilityFacts = {
    walkingIntensity: "unknown",
    walkingSummary,
    stairs: "unknown",
    seating: "unknown",
    mobilityFit: "unknown",
    caveats: [],
  };

  const family: FamilyFacts = {
    fit: "unknown",
    strollerFriendly: "unknown",
    mixedAgeFit: "unknown",
    kidsUnderSixFit: "unknown",
    considerations: product.childrenConsiderations ?? [],
  };

  const weather: WeatherFacts = {
    suitability: "unknown",
    rainFit: "unknown",
    heatExposure: "unknown",
    coveredOrIndoor: "unknown",
    exposureSummary,
  };

  const time: TimeFacts = {
    periods: ["unknown"],
    tonightCapable: "unknown",
    lateArrivalCompatible: "unknown",
  };

  const cruise: CruiseFacts = {
    fit: "unknown",
    preCruise: "unknown",
    postCruise: "unknown",
    luggageConsiderations: [],
    transportConsiderations: [],
  };

  const fulfillment: FulfillmentFacts = {
    authority: "fareharbor",
    transactional: true,
    bookingPath: `/tours/${product.slug}`,
  };

  return {
    slug: product.slug,
    title: product.title,
    operatorName: product.operatorName,
    category: product.category,
    duration,
    transportation,
    mobility,
    family,
    weather,
    time,
    cruise,
    fulfillment,

    durationLabel: product.durationLabel,
    transportationSummary,
    pickupSummary,
    walkingSummary,
    ridingSummary: product.physicalFormat?.riding,
    exposureSummary,
    familyFit: family.fit,
    mobilityFit: mobility.mobilityFit,
    rainFit: weather.rainFit,
    cruisePassengerFit: cruise.fit,
    walkingIntensity: mobility.walkingIntensity,
    timeOfDay: time.periods,

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
      transportation: transportationSummary ? "operator-stated" : "unknown",
      pickup: pickupSummary ? "operator-stated" : "unknown",
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
