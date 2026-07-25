export interface NolaFareHarborProduct {
  id: string;
  title: string;
  category: string;
  operatorName: string;
  description: string;
  bestFor?: string;
  imageUrl: string;
  imageAlt?: string;
  imagePresentation?: "standard" | "editorial";
  ctaLabel?: string;
  slug: string;
  relatedTourSlug: string;

  // New optional detail fields for Step 4
  detailSummary?: string;
  bestFit?: string[];
  confirmedInclusions?: string[];
  bookingConfirmations?: string[];
  physicalFormat?: {
    walking?: string;
    riding?: string;
    seating?: string;
    exposure?: string;
  };
  logistics?: {
    meetingPoint?: string;
    pickup?: string;
    transportation?: string;
  };
  historicalContextNote?: string;

  companyShortname: string;
  itemId?: string;
  flowId?: string;

  detailPageTitle: string;
  metaDescription: string;
  durationLabel?: string;
  transportationSummary?: string;
  pickupSummary?: string;
  wikimediaId?: string;
  representativeCaption?: string;
  highlights?: string[];
  bookingNote?: string;
}

export const NEW_ORLEANS_ORIGIN = "https://www.welcometoneworleanstours.com";
export const NEW_ORLEANS_TOURS_PATH = "/new-orleans/tours";
export const FAREHARBOR_ASN = "aktourcenter";

export const getFareHarborUrl = (companyShortname: string, itemId?: string | number, flowId?: string | number) => {
  let url = `https://fareharbor.com/embeds/book/${companyShortname}/`;
  if (itemId) {
    url += `items/${itemId}/`;
  }
  const params = new URLSearchParams();
  params.append("asn", FAREHARBOR_ASN);
  if (flowId) {
    params.append("flow", String(flowId));
  }
  params.append("full-items", "yes");
  return `${url}?${params.toString()}`;
};

export const STOREFRONT_PRODUCTS: NolaFareHarborProduct[] = [
  {
    id: "southernstyle-city-tour",
    companyShortname: "southernstyletours",
    itemId: "51942",
    flowId: "4344",
    title: "City Tour Of New Orleans",
    category: "City Tours",
    operatorName: "Southern Style Tours",
    description: "A comprehensive overview of New Orleans covering the French Quarter, Garden District, and more.",
    bestFor: "Best for first-time visitors",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    imageAlt: "French Quarter street in New Orleans",
    slug: "city-tour-of-new-orleans",
    relatedTourSlug: "oak-alley-or-laura-plantation-tour",
    detailPageTitle: "City Tour Of New Orleans | Welcome to New Orleans Tours",
    metaDescription: "A comprehensive overview of New Orleans covering the French Quarter, Garden District, and more. Best for first-time visitors.",
    durationLabel: "Duration varies by traffic and route. Check estimates during booking.",
    transportationSummary: "Minibus transportation",
    pickupSummary: "Pickup availability and zones are confirmed during booking.",
    highlights: [
      "French Quarter",
      "Tremé",
      "Esplanade Avenue",
      "Garden District",
      "Metairie Cemetery",
      "Warehouse District"
    ],
    detailSummary: "A broad city overview offered through Southern Style Tours.",
    bestFit: [
      "First-time visitors seeking a broad introduction"
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Current itinerary and route",
      "Exact schedule and departure time",
      "Transportation format",
      "Pickup availability and zones"
    ],
    physicalFormat: {
      riding: "A riding-focused city overview offered through the participating operator."
    },
    logistics: {
      transportation: "Transportation format and availability are confirmed during booking."
    },
  },
  {
    id: "southernstyle-plantation",
    companyShortname: "southernstyletours",
    itemId: "83002",
    flowId: "4344",
    title: "Oak Alley Or Laura Plantation Tour",
    category: "Plantation Tours",
    operatorName: "Southern Style Tours",
    description: "Journey outside the city to explore historic Louisiana plantations and learn their complex history.",
    bestFor: "Best for a longer day trip",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    imagePresentation: "editorial",
    slug: "oak-alley-or-laura-plantation-tour",
    relatedTourSlug: "city-tour-of-new-orleans",
    detailPageTitle: "Oak Alley Or Laura Plantation Tour | Welcome to New Orleans Tours",
    metaDescription: "Journey outside the city to explore historic Louisiana plantations and learn their complex history. Best for a longer day trip.",
    durationLabel: "Tour duration varies. Exact schedule confirmed during booking.",
    transportationSummary: "Minibus transportation",
    bookingNote: "Pickup and return timing may make the complete outing longer. The available plantation option, current itinerary and exact schedule are confirmed during booking.",
    highlights: [
      "History and architecture connected to either Oak Alley or Laura Plantation",
      "Historic grounds and gardens",
      "The lives of people connected to the plantation sites",
      "The history of slavery represented at these locations"
    ],
    wikimediaId: "oak-alley-front",
    representativeCaption: "Representative image: Oak Alley Plantation. Tour selection may include Oak Alley or Laura Plantation.",
    detailSummary: "A historic-site excursion to Oak Alley or Laura Plantation, with the selected site and current logistics confirmed during booking.",
    bestFit: [
      "Visitors interested in a historic-site excursion",
      "Visitors preparing for a longer outing outside the city"
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Available plantation options (Oak Alley or Laura)",
      "Exact schedule and departure time",
      "Transportation format",
      "Walking and standing requirements"
    ],
    physicalFormat: {
      walking: "Confirm the current format and participation requirements during booking.",
      riding: "Extended travel time to and from the sites"
    },
    logistics: {
      transportation: "Transportation and return timing are confirmed during booking."
    },
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor. The depth and focus of historical interpretation vary by site. We encourage visitors to review the selected plantation’s specific historical program and educational approach."
  },
  {
    id: "ragincajun-covered-boat",
    companyShortname: "ragincajuntours",
    itemId: "590176",
    flowId: "392449",
    title: "Covered Tour Boat",
    category: "Swamp Tours",
    operatorName: "Ragin Cajun Tours",
    description: "A covered tour-boat experience offered through Ragin Cajun Tours.",
    bestFor: "Covered tour boat",
    imageUrl: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    imageAlt: "Covered tour boat in a Louisiana swamp",
    slug: "covered-tour-boat",
    relatedTourSlug: "ragin-cajun-airboat-options",
    detailPageTitle: "Covered Tour Boat Swamp Ride | Welcome to New Orleans Tours",
    metaDescription: "A covered tour-boat experience offered through Ragin Cajun Tours.",
    durationLabel: "Duration confirmed during booking.",
    transportationSummary: "Covered boat format",
    pickupSummary: "Transportation options are confirmed during booking.",
    highlights: [
      "A covered-boat format"
    ],
    detailSummary: "A covered tour-boat experience.",
    bestFit: [
      "Visitors comparing a covered boat with an airboat"
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Exact departure time",
      "Meeting or transportation location",
      "Weather conditions and cancellation policy",
      "Accessibility and age policies"
    ],
    physicalFormat: {
      exposure: "Covered boat format"
    },
    logistics: {
      transportation: "Transportation options are confirmed during booking."
    },
  },
  {
    id: "ragincajun-airboat",
    companyShortname: "ragincajuntours",
    flowId: "940162",
    title: "Ragin Cajun Airboat Options",
    category: "Airboat Rides",
    operatorName: "Ragin Cajun Tours",
    description: "A booking flow for the airboat options currently offered by Ragin Cajun Tours.",
    bestFor: "Airboat options",
    imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
    imageAlt: "Airboat traveling through a Louisiana swamp",
    ctaLabel: "View Airboat Options →",
    slug: "ragin-cajun-airboat-options",
    relatedTourSlug: "covered-tour-boat",
    detailPageTitle: "Ragin Cajun Airboat Options | Welcome to New Orleans Tours",
    metaDescription: "A booking flow for the airboat options currently offered by Ragin Cajun Tours.",
    durationLabel: "Duration confirmed during booking.",
    transportationSummary: "Boat formats confirmed during booking.",
    pickupSummary: "Transportation options confirmed during booking.",
    bookingNote: "Confirm the current format and participation requirements during booking.",
    highlights: [
      "The operator describes the route as traveling through privately accessed swamp property"
    ],
    detailSummary: "A booking flow for the airboat options currently offered by Ragin Cajun Tours.",
    bestFit: [
      "Visitors comparing available airboat formats within the operator’s flow"
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Confirm the current format and participation requirements during booking.",
      "Meeting or transportation location",
      "Weather conditions and cancellation policy"
    ],
    physicalFormat: {
      riding: "Airboat ride",
      exposure: "Open-air exposure"
    },
    logistics: {
      transportation: "Transportation options confirmed during booking."
    },
  }
];

export interface ListingNode {
  id: string;
  name: string;
  category: string;
  location?: string;
  description?: string;
  menuUrl?: string;
  hours?: { open: number; close: number };
  verification_status?: string;
  rating?: number;
  reviewsCount?: number;
  price?: string | number;
  vibe?: string;
  logistics: Record<string, string>;
}

export const DIRECTORY_DATA: ListingNode[] = STOREFRONT_PRODUCTS.map(p => ({
  id: p.id,
  name: p.title,
  category: p.category.toLowerCase().includes("swamp") || p.category.toLowerCase().includes("airboat") ? "swamp" : "tours",
  description: p.description,
  verification_status: "verified_active",
  menuUrl: `/new-orleans/tours#${p.id}`,
  logistics: p.durationLabel ? { "Duration": p.durationLabel } as Record<string, string> : {} as Record<string, string>,
}));

export const METADATA = {
  title: "Find and Book New Orleans Tours | Welcome to New Orleans Tours",
  description: "Compare city tours, plantation experiences, swamp tours and airboat rides from local New Orleans operators.",
  keywords: ["new orleans tours", "new orleans city tour", "plantation tours new orleans", "cajun swamp tour", "airboat rides"]
};
