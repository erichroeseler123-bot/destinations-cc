import type { FitLevel, FulfillmentAuthority, TourKnowledge } from "./tourKnowledge";

export type DecisionSituation =
  | "today"
  | "tonight"
  | "weekend"
  | "rain"
  | "before-dinner"
  | "late-arrival"
  | "pre-cruise"
  | "post-cruise"
  | "cruise-window"
  | "general";

export type DecisionRequest = {
  availableMinutes?: number;
  requiredReturnBufferMinutes?: number;
  situation?: DecisionSituation;
  needsTransportation?: boolean;
  mobilityConstraint?: "low-walking" | "no-stairs" | "needs-seating";
  youngestAge?: number;
  includesChildrenUnderSix?: boolean;
  mixedAgeGroup?: boolean;
  strollerNeeded?: boolean;
  raining?: boolean;
  hotWeatherConcern?: boolean;
  desiredTimeOfDay?: "morning" | "afternoon" | "evening" | "night";
  cruisePortWindowMinutes?: number;
  carryingLuggage?: boolean;
  preferences?: string[];
};

export type DecisionScore = {
  situation: number; // 0-30
  logistics: number; // 0-25
  group: number; // 0-20
  preference: number; // 0-15
  commercial: number; // 0-10
  totalWithoutCommercial: number;
  total: number;
};

export type DecisionResult = {
  tour: TourKnowledge;
  eligible: boolean;
  score: DecisionScore;
  reasons: string[];
  warnings: string[];
  exclusions: string[];
};

const COMMERCIAL_SCORE: Record<FulfillmentAuthority, number> = {
  fareharbor: 10,
  "approved-direct": 7,
  viator: 4,
  getyourguide: 4,
  "editorial-only": 0,
};

const FIT_SCORE: Record<FitLevel, number> = {
  strong: 1,
  possible: 0.5,
  poor: 0,
  unknown: 0,
};

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

function addReason(target: string[], value: string | false | undefined) {
  if (value) target.push(value);
}

function hardFilter(tour: TourKnowledge, request: DecisionRequest): { exclusions: string[]; warnings: string[] } {
  const exclusions: string[] = [];
  const warnings: string[] = [];

  const duration = tour.duration.minutes;
  const requiredBuffer = request.requiredReturnBufferMinutes ?? 0;
  if (request.availableMinutes && duration && duration + requiredBuffer > request.availableMinutes) {
    exclusions.push("Does not fit the available time window plus required buffer");
  }

  if (request.needsTransportation && tour.transportation.mode === "self-arrival") {
    exclusions.push("Transportation is required but this experience requires self-arrival");
  }

  if (request.mobilityConstraint === "low-walking" && tour.mobility.walkingIntensity === "high") {
    exclusions.push("Walking load conflicts with the stated mobility constraint");
  }
  if (request.mobilityConstraint === "no-stairs" && tour.mobility.stairs !== "none" && tour.mobility.stairs !== "unknown") {
    exclusions.push("Known stair requirements conflict with the stated mobility constraint");
  }
  if (request.mobilityConstraint === "needs-seating" && tour.mobility.seating === "limited") {
    exclusions.push("Known seating availability conflicts with the stated mobility need");
  }

  if (request.youngestAge !== undefined && tour.family.minimumAge !== undefined && request.youngestAge < tour.family.minimumAge) {
    exclusions.push(`Minimum age is ${tour.family.minimumAge}`);
  }
  if (request.includesChildrenUnderSix && tour.family.kidsUnderSixFit === "poor") {
    exclusions.push("Not suitable for children under six");
  }

  if (request.raining && tour.weather.suitability === "weather-sensitive" && tour.weather.rainFit === "poor") {
    exclusions.push("Known weather limitations conflict with rainy conditions");
  }

  if (request.desiredTimeOfDay && !tour.time.periods.includes("unknown") && !tour.time.periods.includes("varies") && !tour.time.periods.includes(request.desiredTimeOfDay)) {
    exclusions.push("Known operating period does not match the requested time of day");
  }

  if (request.situation === "tonight" && tour.time.tonightCapable === false) {
    exclusions.push("Not available as a tonight-capable option");
  }

  const cruiseWindow = request.cruisePortWindowMinutes;
  if (cruiseWindow) {
    const minimumWindow = tour.cruise.minimumPortWindowMinutes;
    if (minimumWindow && cruiseWindow < minimumWindow) {
      exclusions.push("Does not fit the verified cruise-port window requirement");
    } else if (tour.cruise.fit === "poor") {
      exclusions.push("Known cruise logistics are not suitable for this port window");
    } else if (tour.cruise.fit === "unknown") {
      warnings.push("Cruise-port suitability has not yet been verified");
    }
  }

  if (!tour.fulfillment.transactional || tour.fulfillment.authority === "editorial-only") {
    exclusions.push("No current transactional booking or referral path");
  }

  if (tour.transportation.mode === "unknown" && request.needsTransportation) {
    warnings.push("Transportation fit must be confirmed before booking");
  }
  if (tour.mobility.mobilityFit === "unknown" && request.mobilityConstraint) {
    warnings.push("Mobility suitability has not yet been verified");
  }
  if (tour.family.fit === "unknown" && (request.mixedAgeGroup || request.includesChildrenUnderSix)) {
    warnings.push("Family suitability has not yet been fully verified");
  }

  return { exclusions, warnings };
}

function scoreSituation(tour: TourKnowledge, request: DecisionRequest, reasons: string[]): number {
  let score = 0;

  if (!request.situation || request.situation === "general") return 15;

  if (request.situation === "rain") {
    score += 20 * FIT_SCORE[tour.weather.rainFit];
    if (tour.weather.coveredOrIndoor === true) score += 10;
    else if (tour.weather.coveredOrIndoor === "partial") score += 5;
    addReason(reasons, tour.weather.rainFit === "strong" && "Strong fit for rainy conditions");
  }

  if (request.situation === "tonight") {
    if (tour.time.tonightCapable === true) {
      score += 30;
      reasons.push("Available as a tonight-capable option");
    } else if (tour.time.periods.includes("evening") || tour.time.periods.includes("night")) score += 20;
  }

  if (request.situation === "before-dinner") {
    if (tour.duration.fitsBeforeDinner === true) {
      score += 30;
      reasons.push("Fits a before-dinner planning window");
    }
  }

  if (request.situation === "late-arrival") {
    if (tour.time.lateArrivalCompatible === true) {
      score += 30;
      reasons.push("Works well for a late arrival");
    }
  }

  if (request.situation === "pre-cruise") {
    score += 30 * FIT_SCORE[tour.cruise.preCruise];
    addReason(reasons, tour.cruise.preCruise === "strong" && "Strong fit before a cruise");
  }
  if (request.situation === "post-cruise") {
    score += 30 * FIT_SCORE[tour.cruise.postCruise];
    addReason(reasons, tour.cruise.postCruise === "strong" && "Strong fit after a cruise");
  }
  if (request.situation === "cruise-window") {
    score += 30 * FIT_SCORE[tour.cruise.fit];
    addReason(reasons, tour.cruise.fit === "strong" && "Verified fit for cruise passengers");
  }

  if (request.situation === "today" || request.situation === "weekend") {
    score += 15;
    if (tour.time.periods.some((period) => period !== "unknown")) score += 5;
    if (tour.fulfillment.transactional) score += 10;
  }

  return clamp(score, 30);
}

function scoreLogistics(tour: TourKnowledge, request: DecisionRequest, reasons: string[]): number {
  let score = 0;

  if (request.availableMinutes && tour.duration.minutes) {
    const buffer = request.availableMinutes - tour.duration.minutes;
    if (buffer >= 120) score += 8;
    else if (buffer >= 60) score += 6;
    else if (buffer >= 0) score += 4;
    addReason(reasons, buffer >= 60 && `Fits your time window with ${buffer} minutes of breathing room`);
  } else if (!request.availableMinutes) score += 5;

  if (request.needsTransportation) {
    if (tour.transportation.mode === "included") {
      score += 9;
      reasons.push("Transportation is included");
    } else if (tour.transportation.mode === "pickup-available") {
      score += 7;
      reasons.push("Pickup is available");
    } else if (tour.transportation.mode === "varies") score += 4;
  } else score += 4;

  if (request.cruisePortWindowMinutes && tour.cruise.fit === "strong") score += 5;
  if (tour.fulfillment.transactional) score += 3;

  return clamp(score, 25);
}

function scoreGroup(tour: TourKnowledge, request: DecisionRequest, reasons: string[]): number {
  let score = 0;

  if (request.mixedAgeGroup) {
    score += 8 * FIT_SCORE[tour.family.mixedAgeFit];
    addReason(reasons, tour.family.mixedAgeFit === "strong" && "Good for mixed-age groups");
  }
  if (request.includesChildrenUnderSix) {
    score += 6 * FIT_SCORE[tour.family.kidsUnderSixFit];
    addReason(reasons, tour.family.kidsUnderSixFit === "strong" && "Good fit for children under six");
  }
  if (request.strollerNeeded && tour.family.strollerFriendly === true) {
    score += 3;
    reasons.push("Stroller-friendly");
  }
  if (request.mobilityConstraint) {
    score += 6 * FIT_SCORE[tour.mobility.mobilityFit];
    if (tour.mobility.walkingIntensity === "low") {
      score += 3;
      reasons.push("Low walking load");
    }
  }

  if (!request.mixedAgeGroup && !request.includesChildrenUnderSix && !request.mobilityConstraint && !request.strollerNeeded) {
    score = 10;
  }

  return clamp(score, 20);
}

function scorePreference(tour: TourKnowledge, request: DecisionRequest, reasons: string[]): number {
  const preferences = request.preferences?.map((value) => value.toLowerCase().trim()).filter(Boolean) ?? [];
  if (!preferences.length) return 7.5;

  const haystack = new Set([
    tour.category.toLowerCase(),
    ...tour.searchDemandIds.map((value) => value.toLowerCase()),
    ...tour.experienceTraits.map((value) => value.toLowerCase()),
    ...tour.bestFit.map((value) => value.toLowerCase()),
    ...tour.highlights.map((value) => value.toLowerCase()),
  ]);

  let matches = 0;
  for (const preference of preferences) {
    if ([...haystack].some((value) => value.includes(preference) || preference.includes(value))) matches += 1;
  }

  if (matches) reasons.push(`Matches ${matches} stated experience preference${matches === 1 ? "" : "s"}`);
  return clamp((matches / preferences.length) * 15, 15);
}

export function evaluateTour(tour: TourKnowledge, request: DecisionRequest): DecisionResult {
  const reasons: string[] = [];
  const { exclusions, warnings } = hardFilter(tour, request);

  if (exclusions.length) {
    return {
      tour,
      eligible: false,
      reasons,
      warnings,
      exclusions,
      score: {
        situation: 0,
        logistics: 0,
        group: 0,
        preference: 0,
        commercial: 0,
        totalWithoutCommercial: 0,
        total: 0,
      },
    };
  }

  const situation = scoreSituation(tour, request, reasons);
  const logistics = scoreLogistics(tour, request, reasons);
  const group = scoreGroup(tour, request, reasons);
  const preference = scorePreference(tour, request, reasons);
  const commercial = COMMERCIAL_SCORE[tour.fulfillment.authority];
  const totalWithoutCommercial = situation + logistics + group + preference;

  return {
    tour,
    eligible: true,
    reasons,
    warnings,
    exclusions,
    score: {
      situation,
      logistics,
      group,
      preference,
      commercial,
      totalWithoutCommercial,
      total: totalWithoutCommercial + commercial,
    },
  };
}

/**
 * Facts determine eligibility. Visitor intent determines ranking. Commercial
 * value breaks only close ties: an 8+ point visitor-fit lead cannot be
 * overturned by fulfillment economics.
 */
export function rankTours(tours: TourKnowledge[], request: DecisionRequest): DecisionResult[] {
  const results = tours.map((tour) => evaluateTour(tour, request));
  const eligible = results.filter((result) => result.eligible);
  const ineligible = results.filter((result) => !result.eligible);

  eligible.sort((a, b) => {
    const visitorFitDifference = b.score.totalWithoutCommercial - a.score.totalWithoutCommercial;
    if (Math.abs(visitorFitDifference) >= 8) return visitorFitDifference;
    return b.score.total - a.score.total;
  });

  return [...eligible, ...ineligible];
}
