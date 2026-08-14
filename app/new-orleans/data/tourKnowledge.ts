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
  duration: DurationFacts;
  transportation: TransportationFacts;
  mobility: MobilityFacts;
  family: FamilyFacts;
  weather: WeatherFacts;
  time: TimeFacts;
  cruise: CruiseFacts;
  fulfillment: FulfillmentFacts;

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
  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:hour|hr)/);
  if (rangeMatch) return Math.round(Number(rangeMatch[2]) * 60);
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

function transportationMode(summary?: string, pickup?: string): TransportationMode {
  const text = `${summary ?? ""} ${pickup ?? ""}`.toLowerCase();
  if (!text.trim()) return "unknown";
  if (text.includes("included")) return "included";
  if (text.includes("pickup") || text.includes("pick-up")) return "pickup-available";
  if (text.includes("self") && (text.includes("arriv") || text.includes("drive"))) return "self-arrival";
  return "varies";
}

function explicitMinimumAge(product: NolaFareHarborProduct): number | undefined {
  const text = (product.childrenConsiderations ?? []).join(" ");
  const match = text.match(/(?:age|ages)\s*(\d+)\s*(?:and|\+|or)\s*(?:older|up)/i);
  return match ? Number(match[1]) : undefined;
}

function applyConservativeClassifications(tour: TourKnowledge): TourKnowledge {
  const text = `${tour.title} ${tour.category} ${tour.transportationSummary ?? ""} ${tour.walkingSummary ?? ""} ${tour.exposureSummary ?? ""}`.toLowerCase();

  if (text.includes("covered") && (text.includes("boat") || text.includes("swamp"))) {
    tour.weather.coveredOrIndoor = true;
    tour.weather.rainFit = "possible";
    tour.weather.suitability = "mixed";
    tour.weather.heatExposure = "moderate";
  }

  if (text.includes("airboat")) {
    tour.weather.coveredOrIndoor = false;
    tour.weather.suitability = "weather-sensitive";
    tour.weather.heatExposure = "high";
  }

  if (text.includes("walking tour") || text.includes("walking")) {
    tour.mobility.walkingIntensity = "moderate";
    tour.mobility.mobilityFit = "possible";
  }

  if (text.includes("minibus") || text.includes("city tour")) {
    tour.mobility.walkingIntensity = tour.mobility.walkingIntensity === "unknown" ? "low" : tour.mobility.walkingIntensity;
    tour.mobility.seating = "frequent";
    tour.mobility.mobilityFit = tour.mobility.mobilityFit === "unknown" ? "possible" : tour.mobility.mobilityFit;
  }

  if (tour.family.minimumAge !== undefined) {
    tour.family.kidsUnderSixFit = tour.family.minimumAge >= 6 ? "poor" : "possible";
  }

  if (tour.duration.minutes && tour.duration.minutes <= 240) {
    tour.time.lateArrivalCompatible = tour.time.periods.includes("evening") || tour.time.periods.includes("night") ? true : "unknown";
  }

  tour.familyFit = tour.family.fit;
  tour.mobilityFit = tour.mobility.mobilityFit;
  tour.rainFit = tour.weather.rainFit;
  tour.walkingIntensity = tour.mobility.walkingIntensity;
  tour.timeOfDay = tour.time.periods;
  return tour;
}

function fromFareHarborProduct(product: NolaFareHarborProduct): TourKnowledge {
  const durationMinutes = parseDurationMinutes(product.durationLabel);
  const transportationSummary = product.transportationSummary ?? product.logistics?.transportation;
  const pickupSummary = product.pickupSummary ?? product.logistics?.pickup;
  const walkingSummary = product.physicalFormat?.walking;
  const exposureSummary = product.physicalFormat?.exposure;
  const minimumAge = explicitMinimumAge(product);

  const duration: DurationFacts = {
    label: product.durationLabel,
    minutes: durationMinutes,
    approximate: Boolean(product.durationLabel?.toLowerCase().includes("approx")),
    dayPart: durationDayPart(durationMinutes),
    fitsBeforeDinner: durationMinutes ? durationMinutes <= 240 : "unknown",
  };

  const transportation: TransportationFacts = {
    mode: transportationMode(transportationSummary, pickupSummary),
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
    fit: (product.bestFit?.some((value) => /family|mixed-age/i.test(value)) ? "possible" : "unknown"),
    minimumAge,
    strollerFriendly: "unknown",
    mixedAgeFit: (product.bestFit?.some((value) => /family|mixed-age/i.test(value)) ? "possible" : "unknown"),
    kidsUnderSixFit: minimumAge !== undefined && minimumAge >= 6 ? "poor" : "unknown",
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

  return applyConservativeClassifications({
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
      suitability: product.bestFit?.length || product.notIdealFor?.length || product.childrenConsiderations?.length ? "editorial" : "unknown",
    },
  });
}

export const TOUR_KNOWLEDGE: TourKnowledge[] = STOREFRONT_PRODUCTS.map(fromFareHarborProduct);

export const TOUR_KNOWLEDGE_BY_SLUG: Record<string, TourKnowledge> = Object.fromEntries(
  TOUR_KNOWLEDGE.map((tour) => [tour.slug, tour]),
);

export function getTourKnowledge(slug: string): TourKnowledge | undefined {
  return TOUR_KNOWLEDGE_BY_SLUG[slug];
}
