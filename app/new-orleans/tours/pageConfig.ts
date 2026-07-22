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
  ctaLabel?: string;
  bestFor?: string;
  slug: string;
  relatedTourSlug: string;
  detailPageTitle: string;
  metaDescription: string;
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
    slug: "oak-alley-or-laura-plantation-tour",
    relatedTourSlug: "city-tour-of-new-orleans",
    detailPageTitle: "Oak Alley Or Laura Plantation Tour | Welcome to New Orleans Tours",
    metaDescription: "Journey outside the city to explore historic Louisiana plantations and learn their complex history. Best for a longer day trip.",
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
