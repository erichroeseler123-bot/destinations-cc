import assert from "node:assert/strict";
import test from "node:test";
import { evaluateTour, rankTours } from "../../app/new-orleans/data/decisionEngine";
import type { TourKnowledge } from "../../app/new-orleans/data/tourKnowledge";

function tour(overrides: Partial<TourKnowledge> & Pick<TourKnowledge, "slug" | "title">): TourKnowledge {
  const base: TourKnowledge = {
    slug: overrides.slug,
    title: overrides.title,
    operatorName: "Test Operator",
    category: "Test",
    duration: { label: "3 hours", minutes: 180, approximate: false, dayPart: "short", fitsBeforeDinner: true },
    transportation: { mode: "included", pickupZones: [] },
    mobility: { walkingIntensity: "low", stairs: "none", seating: "frequent", mobilityFit: "strong", caveats: [] },
    family: { fit: "strong", strollerFriendly: true, mixedAgeFit: "strong", kidsUnderSixFit: "strong", considerations: [] },
    weather: { suitability: "rain-friendly", rainFit: "strong", heatExposure: "low", coveredOrIndoor: true },
    time: { periods: ["morning", "afternoon"], tonightCapable: false, lateArrivalCompatible: false },
    cruise: { fit: "strong", preCruise: "strong", postCruise: "strong", minimumPortWindowMinutes: 300, luggageConsiderations: [], transportConsiderations: [] },
    fulfillment: { authority: "fareharbor", transactional: true, bookingPath: `/tours/${overrides.slug}` },
    familyFit: "strong",
    mobilityFit: "strong",
    rainFit: "strong",
    cruisePassengerFit: "strong",
    walkingIntensity: "low",
    timeOfDay: ["morning", "afternoon"],
    bestFit: [], notIdealFor: [], childrenConsiderations: [], highlights: [], confirmedInclusions: [], bookingConfirmations: [], neighborhoods: [], landmarks: [], experienceTraits: [], searchDemandIds: [],
    confidence: { duration: "verified", transportation: "verified", pickup: "verified", suitability: "verified" },
  };
  return { ...base, ...overrides };
}

test("hard filters reject a tour that cannot fit the visitor time window", () => {
  const result = evaluateTour(tour({ slug: "long", title: "Long Tour", duration: { label: "7 hours", minutes: 420, approximate: false, dayPart: "full-day", fitsBeforeDinner: false } }), { availableMinutes: 240 });
  assert.equal(result.eligible, false);
  assert.match(result.exclusions.join(" "), /available time window/i);
});

test("cruise window is a hard constraint when the minimum window is verified", () => {
  const result = evaluateTour(tour({ slug: "cruise", title: "Cruise Tour" }), { situation: "cruise-window", cruisePortWindowMinutes: 240 });
  assert.equal(result.eligible, false);
  assert.match(result.exclusions.join(" "), /cruise-port window/i);
});

test("rain + mixed ages + transportation rewards a covered low-walking option", () => {
  const covered = tour({ slug: "covered", title: "Covered Tour", experienceTraits: ["covered", "relaxed"] });
  const exposed = tour({
    slug: "exposed",
    title: "Exposed Tour",
    transportation: { mode: "self-arrival", pickupZones: [] },
    mobility: { walkingIntensity: "high", stairs: "some", seating: "limited", mobilityFit: "poor", caveats: [] },
    weather: { suitability: "weather-sensitive", rainFit: "poor", heatExposure: "high", coveredOrIndoor: false },
    family: { fit: "possible", strollerFriendly: false, mixedAgeFit: "poor", kidsUnderSixFit: "poor", considerations: [] },
  });
  const ranked = rankTours([exposed, covered], { situation: "rain", raining: true, needsTransportation: true, mixedAgeGroup: true, mobilityConstraint: "low-walking" });
  assert.equal(ranked[0].tour.slug, "covered");
  assert.equal(ranked[0].eligible, true);
  assert.equal(ranked[1].eligible, false);
});

test("commercial value cannot overturn an eight-point visitor-fit lead", () => {
  const betterFit = tour({
    slug: "better-fit",
    title: "Better Fit",
    fulfillment: { authority: "viator", transactional: true, bookingPath: "/affiliate" },
    experienceTraits: ["history"],
    searchDemandIds: ["history"],
  });
  const direct = tour({
    slug: "direct",
    title: "Direct",
    fulfillment: { authority: "fareharbor", transactional: true, bookingPath: "/tours/direct" },
    experienceTraits: [],
    searchDemandIds: [],
  });
  const ranked = rankTours([direct, betterFit], { preferences: ["history"] });
  assert.ok(ranked[0].score.totalWithoutCommercial - ranked[1].score.totalWithoutCommercial >= 8);
  assert.equal(ranked[0].tour.slug, "better-fit");
});
