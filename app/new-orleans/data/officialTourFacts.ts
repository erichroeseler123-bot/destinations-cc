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
  "evening-jazz-cruise": {
    duration: "2-hour sightseeing cruise; dinner variants include additional dining time",
    completeTime: "Allow additional time for boarding and, for dinner variants, the selected dining seating. Confirm the exact variant schedule in checkout.",
    transportation: "Steamboat NATCHEZ departures meet at 400 Toulouse Street; selected vessel and live departure details remain controlling in checkout.",
    pace: "Relaxed Mississippi River cruise with live jazz and indoor/outdoor seating.",
    weatherExposure: "Indoor and outdoor vessel areas; operator states cruises run rain or shine subject to operating conditions.",
    noiseLevel: "Live jazz, narration, and normal vessel/bar activity.",
    sourceLabel: "Gray Line New Orleans — Evening Jazz Cruise",
  },
  "daytime-jazz-cruise": {
    duration: "2-hour sightseeing cruise; meal variants can require additional dining/check-in time",
    completeTime: "Allow additional time for boarding and any selected lunch seating; confirm the exact variant schedule in checkout.",
    transportation: "Steamboat NATCHEZ departures meet at 400 Toulouse Street; selected vessel and live departure details remain controlling in checkout.",
    pace: "Relaxed daytime Mississippi River cruise with live jazz and narration.",
    weatherExposure: "Indoor and outdoor vessel areas.",
    noiseLevel: "Live jazz, narration, and normal vessel activity.",
    sourceLabel: "Gray Line New Orleans — Daytime Jazz Cruise",
  },
  "sunday-jazz-brunch-cruise": {
    duration: "2-hour sightseeing cruise; brunch product is listed at 2 hours 30 minutes",
    completeTime: "Plan around the selected sightseeing or brunch variant and allow extra time for boarding/check-in.",
    transportation: "Steamboat NATCHEZ departures meet at 400 Toulouse Street.",
    pace: "Relaxed Sunday river cruise with live jazz; brunch is included only with the brunch variant.",
    weatherExposure: "Indoor and outdoor vessel areas.",
    noiseLevel: "Live jazz, narration, and normal vessel/dining activity.",
    sourceLabel: "Gray Line New Orleans — Sunday Jazz Cruise",
  },
  "city-of-new-orleans-riverboat-cruise": {
    duration: "75 minutes",
    completeTime: "The cruise is 75 minutes; Gray Line asks guests to arrive 30 minutes before the cruise for boarding.",
    transportation: "Meet at 101 Saint Louis Street, New Orleans. This is a riverboat cruise rather than a hotel-pickup tour.",
    pace: "Relaxed sightseeing cruise with live Captain's narration and indoor/outdoor seating.",
    weatherExposure: "Indoor and outdoor decks; the top deck is accessible by stairs only.",
    noiseLevel: "Narration and normal vessel/bar activity.",
    sourceLabel: "Gray Line New Orleans — 75-Minute CITY of NEW ORLEANS Riverboat Cruise",
  },
  "whitney-plantation-tour": {
    duration: "5 hours 25 minutes",
    completeTime: "Plan for about 5 hours 25 minutes from the operator meeting point; arrive 15 minutes before departure.",
    transportation: "Round-trip transportation from Gray Line's 400 Toulouse Street meeting point is included.",
    pace: "Self-paced audio visit at Whitney Plantation, plus transportation time.",
    weatherExposure: "Mixed indoor/outdoor. Plantation grounds include uneven gravel paths.",
    noiseLevel: "Generally low.",
    sourceLabel: "Gray Line New Orleans — Whitney Plantation",
  },
  "oak-alley-plantation-tour-grey-line": {
    duration: "5 hours 25 minutes",
    completeTime: "Plan for about 5 hours 25 minutes for the full New Orleans-to-Oak Alley excursion.",
    transportation: "Gray Line lists 400 Toulouse Street as the New Orleans meeting point for this excursion.",
    pace: "Transportation plus a historic-site visit with meaningful walking on the plantation grounds.",
    weatherExposure: "Mixed indoor/outdoor. Access to the second floor of the Big House requires stairs.",
    noiseLevel: "Generally low.",
    sourceLabel: "Gray Line New Orleans — Oak Alley Plantation Tour",
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
  "swamp-boat-oak-alley-combo": {
    duration: "7 hours 45 minutes",
    completeTime: "Plan for approximately 7 hours 45 minutes and arrive at the operator meeting point before departure as instructed in checkout.",
    transportation: "Combination excursion from New Orleans joining transportation, a swamp boat experience, and Oak Alley Plantation.",
    pace: "Full-day combination with transportation, boat sightseeing, and plantation walking.",
    weatherExposure: "Mixed vehicle, outdoor swamp, and indoor/outdoor plantation exposure.",
    noiseLevel: "Moderate during transportation and boat portions; generally lower at the plantation.",
    sourceLabel: "Gray Line New Orleans — Swamp Boat and Oak Alley Combination",
  },
  "swamp-boat-whitney-combo": {
    duration: "7 hours 45 minutes",
    completeTime: "Plan for approximately 7 hours 45 minutes and confirm current check-in/departure instructions in checkout.",
    transportation: "Combination excursion from New Orleans joining transportation, a swamp boat experience, and Whitney Plantation.",
    pace: "Full-day combination with transportation, boat sightseeing, and plantation walking.",
    weatherExposure: "Mixed vehicle, outdoor swamp, and indoor/outdoor plantation exposure.",
    noiseLevel: "Moderate during transportation and boat portions; generally lower at the plantation.",
    sourceLabel: "Gray Line New Orleans — Swamp Boat and Whitney Combination",
  },
};
