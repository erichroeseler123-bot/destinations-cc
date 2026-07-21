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
}

export const NEW_ORLEANS_TOURS_PATH = "/new-orleans/tours";
export const FAREHARBOR_ASN = "aktourcenter";

export const STOREFRONT_PRODUCTS: NolaFareHarborProduct[] = [
  {
    id: "southernstyle-city-tour",
    companyShortname: "southernstyletours",
    itemId: "51942",
    flowId: "4344",
    title: "City Tour Of New Orleans",
    category: "City Tours",
    operatorName: "Southern Style",
    description: "A comprehensive overview of New Orleans covering the French Quarter, Garden District, and more.",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg"
  },
  {
    id: "southernstyle-plantation",
    companyShortname: "southernstyletours",
    itemId: "83002",
    flowId: "4344",
    title: "Oak Alley Or Laura Plantation Tour",
    category: "Plantation Tours",
    operatorName: "Southern Style",
    description: "Journey outside the city to explore historic Louisiana plantations and learn their complex history.",
    imageUrl: "/images/travel-markets/new-orleans/swamp-plantation-combo.png"
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
    imageUrl: "/images/travel-markets/new-orleans/covered-boat-swamp.png"
  },
  {
    id: "ragincajun-airboat",
    companyShortname: "ragincajuntours",
    flowId: "940162",
    title: "Ragin Cajun Airboat Options",
    category: "Airboat Rides",
    operatorName: "Ragin Cajun Tours",
    description: "A high-speed, thrilling open-air ride into the shallow marshes for close wildlife encounters.",
    imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
    ctaLabel: "View Airboat Options →"
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
