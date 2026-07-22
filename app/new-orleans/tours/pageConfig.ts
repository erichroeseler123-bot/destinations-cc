// New Orleans Tours Outpost - FareHarbor Storefront Configuration

export interface NolaFareHarborProduct {
  id: string;
  companyShortname: string;
  itemId?: string | number;
  flowId?: string | number;
  title: string;
  category: string;
  operatorName: string;
  description: string;
  duration?: string;
  price?: string;
  imageUrl: string;
  imagePresentation?: "photo" | "editorial";
  ctaLabel?: string;
  bestFor?: string;
  slug: string;
  relatedTourSlug: string;
  detailPageTitle: string;
  metaDescription: string;
  durationLabel?: string;
  transportationSummary?: string;
  pickupSummary?: string;
  highlights?: string[];
  bookingNote?: string;
}

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

// Data Sources:
// City Tour & Plantation Tour: southernstyletours.com & FareHarbor Flow 4344
// Covered Boat: ragincajunairboattours.com & FareHarbor Flow 392449
// Airboat Options: ragincajunairboattours.com & FareHarbor Flow 940162
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
    slug: "city-tour-of-new-orleans",
    relatedTourSlug: "oak-alley-or-laura-plantation-tour",
    detailPageTitle: "City Tour Of New Orleans | Welcome to New Orleans Tours",
    metaDescription: "A comprehensive overview of New Orleans covering the French Quarter, Garden District, and more. Best for first-time visitors.",
    durationLabel: "Approximately 3 hours",
    transportationSummary: "Air-conditioned minibus",
    pickupSummary: "Hotel pickup and drop-off are offered. Allow a 30-minute pickup window.",
    highlights: [
      "French Quarter",
      "Tremé",
      "Esplanade Avenue",
      "Garden District",
      "Metairie Cemetery",
      "Warehouse District"
    ],
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
    durationLabel: "The operator describes this as a four-hour tour.",
    transportationSummary: "Minibus transportation",
    bookingNote: "Pickup and return timing may make the complete outing longer. The available plantation option, current itinerary and exact schedule are confirmed during booking.",
    highlights: [
      "History and architecture connected to either Oak Alley or Laura Plantation",
      "Historic grounds and gardens",
      "The lives of people connected to the plantation sites",
      "The history of slavery represented at these locations"
    ],
  },
  {
    id: "ragincajun-covered-boat",
    companyShortname: "ragincajuntours",
    itemId: "590176",
    flowId: "392449",
    title: "Covered Tour Boat",
    category: "Swamp Tours",
    operatorName: "Ragin Cajun Tours",
    description: "A shaded, family-friendly pontoon boat ride through authentic Louisiana bayous.",
    bestFor: "Best for shade and a relaxed ride",
    imageUrl: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    slug: "covered-tour-boat",
    relatedTourSlug: "ragin-cajun-airboat-options",
    detailPageTitle: "Covered Tour Boat Swamp Ride | Welcome to New Orleans Tours",
    metaDescription: "A shaded, family-friendly pontoon boat ride through authentic Louisiana bayous. Best for shade and a relaxed ride.",
    durationLabel: "Approximately 1.5 hours",
    transportationSummary: "Covered pontoon boat",
    pickupSummary: "Self-drive and pickup or shuttle booking options may be available.",
    highlights: [
      "Louisiana swamp and bayou scenery",
      "Stories and commentary from the captain",
      "Opportunities to observe Louisiana wildlife, including alligators",
      "A covered-boat format suited to guests seeking a calmer swamp experience"
    ],
  },
  {
    id: "ragincajun-airboat",
    companyShortname: "ragincajuntours",
    flowId: "940162",
    title: "Ragin Cajun Airboat Options",
    category: "Airboat Rides",
    operatorName: "Ragin Cajun Tours",
    description: "Explore Louisiana wetlands aboard an airboat and review the available tour options.",
    bestFor: "Best for speed and a more active ride",
    imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
    ctaLabel: "View Airboat Options →",
    slug: "ragin-cajun-airboat-options",
    relatedTourSlug: "covered-tour-boat",
    detailPageTitle: "Ragin Cajun Airboat Options | Welcome to New Orleans Tours",
    metaDescription: "Explore Louisiana wetlands aboard an airboat and review the available tour options. Best for speed and a more active ride.",
    durationLabel: "Approximately 1 hour 45 minutes to 2 hours, excluding transportation",
    transportationSummary: "Multiple airboat formats may be available.",
    pickupSummary: "Self-drive and hotel pickup options may be available.",
    bookingNote: "Current boat format, capacity, departure time, pickup option and availability are shown during booking.",
    highlights: [
      "High-speed travel through Louisiana swamps and bayous",
      "A smaller, more open boat format than the covered tour",
      "Wildlife-viewing opportunities that vary by season and conditions",
      "The operator describes the route as traveling through privately accessed swamp property"
    ],
  }
];

// Reintroduce legacy interfaces for category routes compatibility
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
  logistics: p.duration ? { "Duration": p.duration } as Record<string, string> : {} as Record<string, string>,
}));

export const METADATA = {
  title: "Find and Book New Orleans Tours | Local Operators",
  description: "Compare city tours, plantation experiences, swamp tours and airboat rides from local New Orleans operators.",
  keywords: ["new orleans tours", "new orleans city tour", "plantation tours new orleans", "cajun swamp tour", "airboat rides"]
};
