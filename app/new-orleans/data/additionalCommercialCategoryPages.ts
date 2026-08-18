import type { SeoPageRecord } from "./types";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";

const ORIGIN = "https://www.welcometoneworleanstours.com";

function productIds(slugs: string[]) {
  return slugs
    .map((slug) => STOREFRONT_PRODUCTS.find((product) => product.slug === slug)?.id)
    .filter((id): id is string => Boolean(id));
}

function metadata(path: string, title: string, description: string) {
  return {
    title,
    description,
    canonicalRoute: `${ORIGIN}${path}`,
    robots: "index, follow",
    openGraphTitle: title,
    openGraphUrl: `${ORIGIN}${path}`,
    twitterTitle: title,
  };
}

export const ADDITIONAL_COMMERCIAL_CATEGORY_PAGES: Record<string, SeoPageRecord> = {
  "garden-district-tours": {
    id: "garden-district-tours",
    publicRoute: "/garden-district-tours",
    variant: "category",
    pageIntent: "Help visitors choose Garden District and architecture-oriented New Orleans sightseeing without pretending every city tour is a dedicated Garden District tour.",
    canonicalRoute: `${ORIGIN}/garden-district-tours`,
    heroEyebrow: "Garden District",
    heroTitle: "New Orleans Garden District Tours",
    heroSubtitle: "Choose between a broader city overview and a Garden District-focused sightseeing format based on how much neighborhood depth you want.",
    openingAnswer: "The key decision is whether you want the Garden District as one chapter of a broader New Orleans overview or as the main focus of the outing. Start with the format, then confirm the current route, stop sequence, walking, pickup, and departure time with the operator.",
    topCta: "/tours/city-cemetery-garden-district-tour",
    secondaryCta: "/tours/city-tour-of-new-orleans",
    whoItIsFor: "A strong fit for first-time visitors, architecture-focused travelers, and groups that want Garden District context without committing to an all-day excursion outside the city.",
    whoShouldChooseSomethingElse: "Choose a dedicated walking experience only if neighborhood-level detail matters more than covering more of New Orleans in the same outing.",
    decisionFactors: [
      "Neighborhood depth: decide whether the Garden District should be the main event or part of a wider city overview.",
      "Walking versus riding: current products can include substantial vehicle time with selected stops; confirm the actual format before booking.",
      "Cemetery component: do not assume every Garden District-oriented route includes the same cemetery access or stop sequence.",
      "Time budget: city-based sightseeing is usually easier to fit around dinner, river cruises, or other same-day plans than swamp or plantation excursions."
    ],
    comparisonColumns: [],
    comparisonRows: [],
    recommendedChoiceGuidance: null,
    planningConsiderations: "Use this category when the Garden District matters, then compare how much of the outing is neighborhood-focused versus broader city sightseeing.",
    transportationNotes: "The current bookable options are city sightseeing products. Confirm the pickup or meeting arrangement in the operator checkout.",
    durationNotes: null,
    ageNotes: null,
    mobilityNotes: "Walking and stop surfaces vary. Confirm the current route if uneven sidewalks, standing time, or vehicle boarding are concerns.",
    weatherNotes: "Even vehicle-based tours can include outdoor stops, so heat and rain can still affect comfort.",
    itineraryCombinations: [],
    liveProductIds: productIds(["city-cemetery-garden-district-tour", "city-tour-of-new-orleans"]),
    futureProductCategoryIds: [],
    relatedPageIds: [],
    relatedAreaIds: [],
    disclosure: "Welcome to New Orleans Tours is an independent comparison and visitor-help site. The exact Garden District route, stops, timing, and access are controlled by the participating operator.",
    faqs: [
      { question: "Is a Garden District tour different from a New Orleans city tour?", answer: "Sometimes. Some city tours include the Garden District as one part of a broader route, while other formats place more emphasis on the neighborhood. Compare the current itinerary before booking." },
      { question: "Do Garden District tours require a lot of walking?", answer: "It depends on the format. Vehicle-based sightseeing can limit walking compared with a dedicated walking tour, but outdoor stops and uneven sidewalks can still matter." },
    ],
    metadata: metadata("/garden-district-tours", "New Orleans Garden District Tours | Compare the Right Format", "Compare New Orleans Garden District sightseeing options by neighborhood depth, walking, city coverage, and current operator logistics."),
    schemaEligibility: { productSchema: false, faqSchema: true, collectionSchema: true },
    visualMood: "Garden District",
    imageAttributionIds: [],
    status: "live",
    isIndexable: true,
  },

  "jazz-music-tours": {
    id: "jazz-music-tours",
    publicRoute: "/jazz-music-tours",
    variant: "category",
    pageIntent: "Help visitors choose currently bookable New Orleans experiences where live jazz is a meaningful part of the experience, without pretending WNO has a complete live-music venue marketplace.",
    canonicalRoute: `${ORIGIN}/jazz-music-tours`,
    heroEyebrow: "Live Jazz",
    heroTitle: "New Orleans Jazz & Music Experiences",
    heroSubtitle: "Start with the live-jazz experiences we can actually book, then choose by daytime, evening, meal format, and how you want music to fit into the day.",
    openingAnswer: "The currently bookable music-forward inventory on WNO is strongest on the Mississippi River, where daytime, evening, and brunch cruises pair live jazz with sightseeing. Choose the daypart first, then decide whether the cruise should be sightseeing-only or include a meal.",
    topCta: "/tours/evening-jazz-cruise",
    secondaryCta: "/tours/daytime-jazz-cruise",
    whoItIsFor: "A strong fit for visitors who want live jazz built into a scheduled experience rather than trying to plan a venue-by-venue nightlife itinerary.",
    whoShouldChooseSomethingElse: "If your goal is specifically a club crawl, Frenchmen Street venue plan, or late-night music calendar, use a dedicated live-music resource rather than assuming these cruise products cover the whole New Orleans music scene.",
    decisionFactors: [
      "Daytime versus evening: decide whether music should anchor the day or the night.",
      "Meal versus sightseeing: some variants include meals and others do not; the selected booking option controls the experience.",
      "Low-walking format: river cruises can work well for groups wanting music without a long walking route.",
      "Schedule fit: boarding and sailing times matter when pairing a jazz cruise with dinner, a city tour, or another timed activity."
    ],
    comparisonColumns: [],
    comparisonRows: [],
    recommendedChoiceGuidance: null,
    planningConsiderations: "Choose the daypart first. If dinner flexibility matters, compare sightseeing-only with meal variants before booking.",
    transportationNotes: "The current music-forward products use central riverfront meeting points rather than hotel pickup.",
    durationNotes: null,
    ageNotes: "Current core jazz cruise products are offered for all ages; confirm the exact selected variant during booking.",
    mobilityNotes: "Vessel and deck accessibility vary. Confirm the booked vessel and accessible areas if mobility is important to the group.",
    weatherNotes: "Indoor seating may be available, but outdoor deck time remains weather-sensitive and river operations are controlled by the operator.",
    itineraryCombinations: [],
    liveProductIds: productIds(["evening-jazz-cruise", "daytime-jazz-cruise", "sunday-jazz-brunch-cruise"]),
    futureProductCategoryIds: ["live-music-tours"],
    relatedPageIds: [],
    relatedAreaIds: [],
    disclosure: "This category covers currently bookable WNO experiences with a live-jazz component. It is not presented as a complete directory of New Orleans music venues or performances.",
    faqs: [
      { question: "Which New Orleans jazz experience is best for a first visit?", answer: "An evening jazz cruise is a strong choice when you want music and the Mississippi River to anchor the night. A daytime cruise is better when you want to preserve the evening for other plans." },
      { question: "Do all jazz cruises include dinner?", answer: "No. Sightseeing-only and meal variants can both exist. Confirm the selected booking option rather than assuming food is included." },
    ],
    metadata: metadata("/jazz-music-tours", "New Orleans Jazz & Music Experiences | Compare Live-Jazz Options", "Compare bookable New Orleans jazz experiences by daypart, meal format, walking burden, and how live music fits into your itinerary."),
    schemaEligibility: { productSchema: false, faqSchema: true, collectionSchema: true },
    visualMood: "Jazz",
    imageAttributionIds: [],
    status: "live",
    isIndexable: true,
  },
};

export const ADDITIONAL_COMMERCIAL_CATEGORY_PATHS = Object.values(ADDITIONAL_COMMERCIAL_CATEGORY_PAGES).map((page) => page.publicRoute);
