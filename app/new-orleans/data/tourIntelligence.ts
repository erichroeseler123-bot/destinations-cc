export type VerificationStatus = "VERIFIED" | "PARTIAL" | "NEEDS_VERIFICATION";

export type TourIntelligenceRecord = {
  slug: string;
  operator: string;
  fareHarborItemId: string;
  experienceType: string;
  decision: {
    timeCommitment: string;
    transportation: string;
    walking: string;
    weatherExposure: string;
    noise: string;
    pace: string;
    familyFit: string;
    historyFocus: string;
    bestFor: string[];
    cautions: string[];
  };
  verification: {
    status: VerificationStatus;
    lastReviewed: string;
    notes: string[];
  };
};

const REVIEW_DATE = "2026-08-09";

/**
 * Decision-oriented facts used to power comparisons, "best for" pages,
 * recommendations, internal linking, and future field-verification notes.
 *
 * Important: unknown facts stay unknown. Do not turn marketing copy or a
 * plausible assumption into a VERIFIED fact merely to fill a field.
 */
export const TOUR_INTELLIGENCE: Record<string, TourIntelligenceRecord> = {
  "city-tour-of-new-orleans": {
    slug: "city-tour-of-new-orleans",
    operator: "Southern Style Tours",
    fareHarborItemId: "51942",
    experienceType: "City overview",
    decision: {
      timeCommitment: "About 3 hours; traffic and pickup routing can affect total time.",
      transportation: "Minibus tour; confirm pickup details during booking.",
      walking: "Limited compared with a walking tour; exact stop walking varies.",
      weatherExposure: "Mostly vehicle-based with outdoor stops.",
      noise: "Generally low.",
      pace: "Balanced sightseeing pace.",
      familyFit: "Suitable for many mixed-age groups; confirm individual needs.",
      historyFocus: "Broad New Orleans history and city orientation.",
      bestFor: ["First-time visitors", "Visitors with a short sightseeing window", "Groups wanting a broad city overview"],
      cautions: ["Traffic can affect timing", "Exact pickup route and stop sequence can vary"]
    },
    verification: { status: "PARTIAL", lastReviewed: REVIEW_DATE, notes: ["Operator page located", "Field timing still needs first-hand verification"] }
  },
  "oak-alley-or-laura-plantation-tour": {
    slug: "oak-alley-or-laura-plantation-tour",
    operator: "Southern Style Tours",
    fareHarborItemId: "83002",
    experienceType: "Plantation history",
    decision: {
      timeCommitment: "Longer excursion; exact schedule varies by selected property and booking.",
      transportation: "Transportation from New Orleans is part of the operator tour format; confirm pickup.",
      walking: "Walking at the selected historic property is required; exact amount varies.",
      weatherExposure: "Mixed indoor and outdoor exposure.",
      noise: "Generally low.",
      pace: "Moderate historical-site visit.",
      familyFit: "Best evaluated by age, attention span, mobility, and historical interest.",
      historyFocus: "Strong historical focus; booked property may be Oak Alley or Laura Plantation.",
      bestFor: ["Visitors prioritizing plantation history", "Travelers willing to leave the city for a longer excursion"],
      cautions: ["Do not imply Oak Alley is guaranteed when Laura may be selected", "Exact property, timing, and accessibility must be confirmed"]
    },
    verification: { status: "PARTIAL", lastReviewed: REVIEW_DATE, notes: ["Official Southern Style plantation pages located", "Property-specific logistics need verification"] }
  },
  "covered-tour-boat": {
    slug: "covered-tour-boat",
    operator: "Ragin Cajun Tours",
    fareHarborItemId: "590176",
    experienceType: "Covered swamp boat",
    decision: {
      timeCommitment: "Exact total commitment depends on selected transportation option.",
      transportation: "Confirm transportation/pickup option during checkout.",
      walking: "Minimal compared with city or plantation walking tours.",
      weatherExposure: "Covered/shaded boat format, while still outdoors.",
      noise: "Moderate; calmer than an airboat format.",
      pace: "Relaxed.",
      familyFit: "Often a better format for mixed-age groups than high-speed airboats; confirm requirements.",
      historyFocus: "Nature/swamp experience rather than a history-first tour.",
      bestFor: ["Mixed-age groups", "Travelers wanting shade", "Visitors preferring a calmer swamp experience"],
      cautions: ["Outdoor heat, humidity, rain, and wildlife conditions still apply", "Transportation and duration must be confirmed"]
    },
    verification: { status: "PARTIAL", lastReviewed: REVIEW_DATE, notes: ["Official Ragin Cajun covered-boat offering located", "Exact duration and current transport options need verification"] }
  },
  "ragin-cajun-airboat-options": {
    slug: "ragin-cajun-airboat-options",
    operator: "Ragin Cajun Tours",
    fareHarborItemId: "590176-flow-options",
    experienceType: "Airboat",
    decision: {
      timeCommitment: "Varies by selected airboat option and transportation.",
      transportation: "Confirm pickup/transportation during checkout.",
      walking: "Minimal; activity is primarily boat-based.",
      weatherExposure: "Open-air exposure.",
      noise: "Loud; hearing protection and operator procedures should be followed.",
      pace: "Fast/adventurous.",
      familyFit: "Age and child eligibility depend on selected option; confirm before booking.",
      historyFocus: "Nature/adventure rather than a history-first experience.",
      bestFor: ["Adventure-focused travelers", "Visitors prioritizing speed and open-air swamp scenery"],
      cautions: ["Loud and open-air", "Age/child restrictions must be confirmed", "Selected boat size changes the experience"]
    },
    verification: { status: "PARTIAL", lastReviewed: REVIEW_DATE, notes: ["Official Ragin Cajun airboat page located", "Exact option matrix needs structured verification"] }
  },
  "all-day-city-plantation-combo": {
    slug: "all-day-city-plantation-combo",
    operator: "Southern Style Tours",
    fareHarborItemId: "51953",
    experienceType: "City + plantation combination",
    decision: {
      timeCommitment: "Approximately 8 hours.",
      transportation: "Morning pickup included in the current product description.",
      walking: "Mixed: vehicle sightseeing plus walking at the plantation site.",
      weatherExposure: "Mixed indoor/outdoor exposure.",
      noise: "Generally low to moderate.",
      pace: "Full-day combination.",
      familyFit: "Current product data lists ages 4+; reconfirm in checkout.",
      historyFocus: "Broad city orientation plus plantation history.",
      bestFor: ["Visitors with one full day", "Travelers wanting city and plantation experiences in one booking"],
      cautions: ["Long day", "Plantation selection and exact return time should be confirmed"]
    },
    verification: { status: "PARTIAL", lastReviewed: REVIEW_DATE, notes: ["8-hour commitment recorded in existing recommendation data", "Reconfirm live age/pickup terms before publishing as evergreen fact"] }
  },
  "covered-boat-plantation-combo": {
    slug: "covered-boat-plantation-combo",
    operator: "Ragin Cajun Airboat Tours",
    fareHarborItemId: "603090",
    experienceType: "Covered swamp boat + plantation",
    decision: {
      timeCommitment: "Approximately 7 hours.",
      transportation: "Transportation/pickup included in current product data.",
      walking: "Minimal on swamp portion plus walking at plantation.",
      weatherExposure: "Covered boat plus mixed indoor/outdoor plantation exposure.",
      noise: "Moderate on swamp segment.",
      pace: "Full-day combination.",
      familyFit: "Current product data lists ages 5+; reconfirm in checkout.",
      historyFocus: "Combination of swamp ecology and plantation history.",
      bestFor: ["Travelers wanting two major out-of-city experiences in one day", "Mixed-interest groups"],
      cautions: ["Long day", "Exact plantation and logistics should be confirmed"]
    },
    verification: { status: "PARTIAL", lastReviewed: REVIEW_DATE, notes: ["Approximate 7-hour commitment exists in current recommendation data", "Live restrictions should be reconfirmed"] }
  },
  "evening-jazz-cruise": unknownTour("evening-jazz-cruise", "New Orleans Steamboat Company", "560778/560822", "Evening jazz river cruise"),
  "daytime-jazz-cruise": unknownTour("daytime-jazz-cruise", "New Orleans Steamboat Company", "varies", "Daytime jazz river cruise"),
  "sunday-jazz-brunch-cruise": unknownTour("sunday-jazz-brunch-cruise", "New Orleans Steamboat Company", "varies", "Sunday brunch river cruise"),
  "oak-alley-plantation-tour-grey-line": unknownTour("oak-alley-plantation-tour-grey-line", "Gray Line New Orleans", "561477", "Oak Alley plantation history"),
  "whitney-plantation-tour": unknownTour("whitney-plantation-tour", "Gray Line New Orleans", "561539", "Whitney Plantation history"),
  "swamp-bayou-tour": unknownTour("swamp-bayou-tour", "Gray Line New Orleans", "561484", "Covered swamp/bayou tour"),
  "small-airboat-swamp-adventure": unknownTour("small-airboat-swamp-adventure", "Gray Line New Orleans", "561547", "Small airboat swamp adventure"),
  "large-airboat-swamp-adventure": unknownTour("large-airboat-swamp-adventure", "Gray Line New Orleans", "562175", "Large airboat swamp adventure"),
  "swamp-boat-oak-alley-combo": unknownTour("swamp-boat-oak-alley-combo", "Gray Line New Orleans", "562191", "Swamp boat + Oak Alley combination"),
  "swamp-boat-whitney-combo": unknownTour("swamp-boat-whitney-combo", "Gray Line New Orleans", "670738", "Swamp boat + Whitney combination"),
  "cocktail-walking-tour": unknownTour("cocktail-walking-tour", "Gray Line New Orleans", "682856", "Cocktail walking tour"),
  "craft-cocktail-walking-tour": unknownTour("craft-cocktail-walking-tour", "Gray Line New Orleans", "562204", "Craft cocktail walking tour"),
  "ghosts-spirits-walking-tour": unknownTour("ghosts-spirits-walking-tour", "Gray Line New Orleans", "562250", "Ghosts & spirits walking tour"),
  "city-cemetery-garden-district-tour": unknownTour("city-cemetery-garden-district-tour", "Gray Line New Orleans", "564661", "City + cemetery + Garden District"),
  "city-of-new-orleans-riverboat-cruise": unknownTour("city-of-new-orleans-riverboat-cruise", "New Orleans Steamboat Company / Gray Line", "694782", "CITY of NEW ORLEANS riverboat cruise")
};

function unknownTour(slug: string, operator: string, fareHarborItemId: string, experienceType: string): TourIntelligenceRecord {
  return {
    slug,
    operator,
    fareHarborItemId,
    experienceType,
    decision: {
      timeCommitment: "Needs verification.",
      transportation: "Needs verification.",
      walking: "Needs verification.",
      weatherExposure: "Needs verification.",
      noise: "Needs verification.",
      pace: "Needs verification.",
      familyFit: "Needs verification.",
      historyFocus: "Needs verification.",
      bestFor: [],
      cautions: ["Do not publish decision claims from this record until verified."]
    },
    verification: {
      status: "NEEDS_VERIFICATION",
      lastReviewed: REVIEW_DATE,
      notes: ["Product is in the bookable storefront; decision-layer facts still need source-by-source verification."]
    }
  };
}

export const VERIFIED_TOUR_INTELLIGENCE = Object.values(TOUR_INTELLIGENCE).filter(
  (tour) => tour.verification.status === "VERIFIED"
);

export const PUBLISHABLE_TOUR_INTELLIGENCE = Object.values(TOUR_INTELLIGENCE).filter(
  (tour) => tour.verification.status !== "NEEDS_VERIFICATION"
);
