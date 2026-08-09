export type OfficialTourFact = {
  duration: string;
  completeTime: string;
  transportation: string;
  pace: string;
  weatherExposure: string;
  noiseLevel: string;
  sourceLabel: string;
};

/**
 * Current operator-published logistics reviewed 2026-08-09.
 * Keep this intentionally narrow: only add facts that are explicit on the
 * operator's current product page. Live checkout remains controlling.
 */
export const OFFICIAL_TOUR_FACTS: Record<string, OfficialTourFact> = {
  "whitney-plantation-tour": {
    duration: "5 hours 25 minutes",
    completeTime: "Plan for about 5 hours 25 minutes from the operator meeting point; arrive 15 minutes before departure.",
    transportation: "Round-trip transportation from Gray Line's 400 Toulouse Street meeting point is included.",
    pace: "Self-paced audio visit at Whitney Plantation, plus transportation time.",
    weatherExposure: "Mixed indoor/outdoor. Plantation grounds include uneven gravel paths.",
    noiseLevel: "Generally low.",
    sourceLabel: "Gray Line New Orleans — Whitney Plantation",
  },
  "craft-cocktail-walking-tour": {
    duration: "2 hours",
    completeTime: "Plan for about 2 hours plus a 15-minute pre-departure check-in.",
    transportation: "Walking tour; meet at 400 Toulouse Street. No tour transportation is required between stops.",
    pace: "Small-group French Quarter walking tour with cocktail stops.",
    weatherExposure: "Walking between indoor/outdoor French Quarter stops.",
    noiseLevel: "Moderate; bar and street environments vary.",
    sourceLabel: "Gray Line New Orleans — Craft Cocktail Walking Tour",
  },
  "ghosts-spirits-walking-tour": {
    duration: "2 hours",
    completeTime: "Plan for about 2 hours plus a 15-minute pre-departure check-in.",
    transportation: "Walking tour departing from 400 Toulouse Street.",
    pace: "Guided French Quarter walking tour.",
    weatherExposure: "Outdoor walking on uneven sidewalks and streets; alternate routes may be needed for wheelchairs.",
    noiseLevel: "Low to moderate street noise.",
    sourceLabel: "Gray Line New Orleans — Interactive Ghosts & Spirits Walking Tour",
  },
  "city-cemetery-garden-district-tour": {
    duration: "3 hours",
    completeTime: "Plan for about 3 hours plus a 15-minute pre-departure check-in.",
    transportation: "Motorcoach sightseeing with stops, including a guided Garden District stroll; meet at 400 Toulouse Street.",
    pace: "Balanced bus sightseeing plus walking.",
    weatherExposure: "Mixed vehicle and outdoor walking; some Garden District sidewalks are uneven.",
    noiseLevel: "Generally low to moderate.",
    sourceLabel: "Gray Line New Orleans — City & Cemetery Sightseeing Tour + Garden District Stroll",
  },
  "swamp-bayou-tour": {
    duration: "3 hours 45 minutes",
    completeTime: "Plan for about 3 hours 45 minutes for the operator's transportation-inclusive tour format.",
    transportation: "Transportation-inclusive swamp excursion from New Orleans; confirm the current departure/check-in details in checkout.",
    pace: "Relaxed covered-boat swamp sightseeing.",
    weatherExposure: "Outdoor swamp environment on a covered boat.",
    noiseLevel: "Moderate; calmer than an airboat format.",
    sourceLabel: "Gray Line New Orleans — Swamp and Bayou Alligator Tour",
  },
  "small-airboat-swamp-adventure": {
    duration: "3 hours 45 minutes",
    completeTime: "Plan for about 3 hours 45 minutes for the transportation-inclusive tour format.",
    transportation: "Transportation-inclusive airboat excursion; confirm current pickup/check-in details in checkout.",
    pace: "Fast, active small-airboat experience.",
    weatherExposure: "Open-air swamp exposure.",
    noiseLevel: "Loud airboat environment.",
    sourceLabel: "Gray Line New Orleans — Small Airboat Swamp Adventure Tour",
  },
  "large-airboat-swamp-adventure": {
    duration: "3 hours 45 minutes",
    completeTime: "Plan for about 3 hours 45 minutes for the transportation-inclusive tour format.",
    transportation: "Transportation-inclusive airboat excursion; confirm current pickup/check-in details in checkout.",
    pace: "Fast, active large-airboat experience.",
    weatherExposure: "Open-air swamp exposure.",
    noiseLevel: "Loud airboat environment.",
    sourceLabel: "Gray Line New Orleans — Large Airboat Swamp Adventure Tour",
  },
};
