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
    pageIntent: "Provide an honest, clear breakdown of New Orleans city tours that feature the Garden District, making it unmistakable that WNO books motorcoach/minibus city tours rather than dedicated walking tours.",
    canonicalRoute: `${ORIGIN}/garden-district-tours`,
    heroEyebrow: "City Sightseeing · Includes Garden District",
    heroTitle: "New Orleans City Tours Featuring the Garden District",
    heroSubtitle: "Looking for Garden District tours? Welcome to New Orleans Tours books comprehensive city sightseeing tours that include the Garden District and historic cemeteries—not dedicated walking-only tours.",
    openingAnswer: "Important booking note: Welcome to New Orleans Tours does not sell a standalone, walking-only Garden District tour. Instead, we book comprehensive 3-hour city sightseeing tours (by motorcoach or minibus) that include the Garden District, St. Charles Avenue, historic cemeteries, and the French Quarter. Choose a dedicated walking specialist if your priority is a 2-hour stroll inspecting individual private mansion gates on foot. Choose one of our verified city tours below if you want an air-conditioned overview of the Garden District and New Orleans' most famous neighborhoods with minimal walking.",
    topCta: "/tours/city-cemetery-garden-district-tour",
    secondaryCta: "/tours/city-tour-of-new-orleans",
    whoItIsFor: "First-time visitors, families, and travelers who want to experience the Garden District's architecture and oak-lined avenues as part of a comfortable citywide tour without exhausting walking.",
    whoShouldChooseSomethingElse: "Visitors who strictly want a 100% walking-only tour focused exclusively on the Garden District. WNO does not sell walking-only Garden District tours.",
    decisionFactors: [
      "Format difference: These are vehicle-based city sightseeing tours that feature the Garden District along with the French Quarter, Tremé, and cemeteries—not standalone 2-hour walking tours.",
      "Bookable operator details: Gray Line New Orleans departs from 400 Toulouse St (3 hours, motorcoach); Southern Style Tours offers hotel pickup options (approx. 3 hours, minibus).",
      "Walking requirements: Instead of walking miles in the Louisiana heat, these tours provide air-conditioned transit with guided commentary and an exterior cemetery/neighborhood stroll.",
      "Inclusions: Professional licensed guide, narrated coach sightseeing through the Garden District mansion corridor, and a historic cemetery stop."
    ],
    comparisonColumns: [],
    comparisonRows: [],
    recommendedChoiceGuidance: null,
    planningConsiderations: "Check departure and pickup points: Gray Line meets at 400 Toulouse St in the French Quarter; Southern Style Tours confirms hotel pickup during checkout. Both tours cover the Garden District without requiring hours on foot.",
    transportationNotes: "The bookable options are vehicle-based city sightseeing products. Gray Line departs from 400 Toulouse St; Southern Style offers hotel pickup.",
    durationNotes: "Approximately 3 hours door-to-door.",
    ageNotes: "All ages welcome on motorcoach city tours.",
    mobilityNotes: "Far less walking than a dedicated walking tour. Motorcoaches have stairs for boarding; cemetery and Garden District stroll portions involve flat walking and sidewalks.",
    weatherNotes: "Air-conditioned motorcoach or minibus provides relief during hot or rainy Louisiana weather.",
    itineraryCombinations: [],
    liveProductIds: productIds(["city-cemetery-garden-district-tour", "city-tour-of-new-orleans"]),
    futureProductCategoryIds: [],
    relatedPageIds: [],
    relatedAreaIds: [],
    disclosure: "Welcome to New Orleans Tours is an independent comparison and visitor-help site. Bookings are fulfilled by licensed operators Gray Line New Orleans and Southern Style Tours.",
    faqs: [
      { question: "Does Welcome to New Orleans Tours offer a dedicated Garden District walking tour?", answer: "No. WNO does not sell standalone walking-only Garden District tours. We book comprehensive 3-hour city tours that feature the Garden District and cemeteries from an air-conditioned vehicle with a guided stroll." },
      { question: "What is the difference between a dedicated walking tour and a city tour that includes the Garden District?", answer: "A dedicated walking tour covers roughly 1 to 2 miles entirely on foot within the residential Garden District. A city tour covers 3 hours of citywide history across the French Quarter, Tremé, and Garden District aboard an air-conditioned motorcoach, providing a much broader introduction with far less physical exertion." },
      { question: "Which operator runs the City, Cemetery and Garden District Tour?", answer: "Gray Line New Orleans operates the 3-hour tour, meeting at 400 Toulouse Street in the French Quarter. It includes narrated sightseeing through the Garden District and a guided stop at St. Louis Cemetery No. 3." },
      { question: "Are there hotel pickup options for city tours including the Garden District?", answer: "Yes. Southern Style Tours offers pickup from select downtown and French Quarter hotels for their comprehensive city tour, which also includes the Garden District corridor." }
    ],
    metadata: metadata(
      "/garden-district-tours",
      "New Orleans Garden District Tours | Mansions & Sightseeing",
      "Compare New Orleans tours featuring the Garden District, St. Charles Ave mansions, and historic cemeteries by comfortable coach. Check Gray Line availability."
    ),
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

  "walking-tours": {
    id: "walking-tours",
    publicRoute: "/walking-tours",
    variant: "category",
    pageIntent: "Compare bookable New Orleans walking tours covering French Quarter history, cocktail culture, and haunted evening walks on foot.",
    canonicalRoute: `${ORIGIN}/walking-tours`,
    heroEyebrow: "French Quarter on Foot",
    heroTitle: "New Orleans Walking Tours",
    heroSubtitle: "Explore historic streets, cocktail culture, and haunted legends with local licensed guides.",
    openingAnswer: "Walking tours in New Orleans are the best way to experience the intimate architecture, hidden courtyards, cocktail heritage, and haunted lore of the French Quarter on foot. Choose between afternoon cocktail history walks and evening haunted history tours, with all tours meeting centrally in the French Quarter.",
    topCta: "/tours/craft-cocktail-walking-tour",
    secondaryCta: "/tours/ghosts-spirits-walking-tour",
    whoItIsFor: "Visitors and groups who enjoy exploring historic neighborhoods on foot, hearing in-depth local stories, and sampling historic drinks or exploring haunted courtyards.",
    whoShouldChooseSomethingElse: "Travelers with mobility limitations or those looking for citywide coverage without walking should choose an air-conditioned motorcoach or minibus city tour instead.",
    decisionFactors: [
      "Walking requirements: Expect roughly 1 to 1.5 miles of walking at a leisurely pace over historic, sometimes uneven French Quarter sidewalks.",
      "Daytime vs evening: Cocktail walking tours operate in the afternoon; haunted and ghost walking tours run after dark.",
      "Age and alcohol: Cocktail tours require participants to be 21+ with valid ID for tastings; ghost tours are open to all ages.",
      "Meeting points: All walking tours depart from central French Quarter locations (such as 400 Toulouse St) rather than hotel pickups."
    ],
    comparisonColumns: [],
    comparisonRows: [],
    recommendedChoiceGuidance: null,
    planningConsiderations: "Wear comfortable walking shoes and check the weather forecast. In summer months, bring water. Check in 15 minutes prior to departure at the designated French Quarter meeting location.",
    transportationNotes: "Walking tours meet in the central French Quarter. No hotel pickup is included; all locations are walkable from most downtown and French Quarter hotels.",
    durationNotes: "Tours range from 2 to 2.5 hours.",
    ageNotes: "Cocktail walking tours are 21+ with valid ID. Ghost and haunted history tours are all-ages friendly.",
    mobilityNotes: "Historic French Quarter sidewalks can be uneven, narrow, or have curbs. Not recommended for those who cannot walk or stand for 2 hours.",
    weatherNotes: "Walking tours operate rain or shine. In case of severe weather, tours may be rescheduled or cancelled per operator policy.",
    itineraryCombinations: [],
    liveProductIds: productIds(["cocktail-walking-tour", "craft-cocktail-walking-tour", "ghosts-spirits-walking-tour"]),
    futureProductCategoryIds: [],
    relatedPageIds: [],
    relatedAreaIds: [],
    disclosure: "Welcome to New Orleans Tours is an independent guide and referral service. Walking tours are operated by licensed local partner Gray Line New Orleans.",
    faqs: [
      { question: "How far do New Orleans walking tours walk?", answer: "Most French Quarter walking tours cover approximately 1 to 1.5 miles at a relaxed, conversational pace with frequent stops for storytelling and refreshments." },
      { question: "Where do walking tours meet?", answer: "Walking tours meet at designated central French Quarter locations, such as 400 Toulouse Street. Exact meeting instructions are confirmed on your booking voucher." },
      { question: "Are drinks included on cocktail walking tours?", answer: "Sample tastings and signature drinks depend on the specific tour option selected during checkout. Bring photo ID as all venues require proof of age (21+)." },
      { question: "Do walking tours operate in the rain?", answer: "Yes, tours typically operate rain or shine. In the event of severe weather or lightning, the operator may reschedule or offer alternatives." }
    ],
    metadata: metadata("/walking-tours", "New Orleans Walking Tours | Historic, Cocktail & Ghost Walks", "Compare French Quarter walking tours in New Orleans. Explore historic architecture, cocktail culture, and haunted evening walks with local guides."),
    schemaEligibility: { productSchema: false, faqSchema: true, collectionSchema: true },
    visualMood: "French Quarter",
    imageAttributionIds: [],
    status: "live",
    isIndexable: true,
  },
};

export const ADDITIONAL_COMMERCIAL_CATEGORY_PATHS = Object.values(ADDITIONAL_COMMERCIAL_CATEGORY_PAGES).map((page) => page.publicRoute);
