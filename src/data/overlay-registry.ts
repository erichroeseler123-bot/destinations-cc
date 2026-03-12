export type DccOverlayType =
  | "accessibility"
  | "cannabis-rules"
  | "pet-friendly"
  | "kid-friendly"
  | "luxury"
  | "nightlife"
  | "budget"
  | "scenic"
  | "festival-pressure"
  | "music-first"
  | "family"
  | "smoker-friendly"
  | "smoking";

export type DccOverlayLink = {
  href: string;
  label: string;
  kind?: "internal" | "external";
};

export type DccOverlayRegistryNode = {
  slug: string;
  citySlug: string;
  overlayType: DccOverlayType;
  entityTypes: string[];
  resultSlugs: string[];
  canonicalPath: string;
  summary: string;
  relatedLinks?: DccOverlayLink[];
};

export const OVERLAY_REGISTRY: DccOverlayRegistryNode[] = [
  {
    slug: "accessibility-las-vegas",
    citySlug: "las-vegas",
    overlayType: "accessibility",
    entityTypes: ["hotel", "attraction", "pool"],
    resultSlugs: ["bellagio", "vdara", "park-mgm", "sphere-las-vegas", "fountains-of-bellagio", "adventuredome", "mandalay-bay-pools"],
    canonicalPath: "/accessibility/las-vegas",
    summary: "Accessibility-first Las Vegas overlay for hotel, attraction, and pool routing where entrance access, restrooms, mobility flow, and service-animal logistics matter early in the planning process.",
    relatedLinks: [
      { href: "/vegas", label: "Vegas hub" },
      { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
      { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
    ],
  },
  {
    slug: "accessibility-miami",
    citySlug: "miami",
    overlayType: "accessibility",
    entityTypes: ["hotel", "beach"],
    resultSlugs: ["loews-miami-beach", "1-hotel-south-beach", "north-beach", "hobie-beach"],
    canonicalPath: "/accessibility/miami",
    summary: "Accessibility-first Miami overlay for stay and shoreline planning, with a bias toward easier routing, beach-day practicality, and lower-friction mobility choices.",
    relatedLinks: [
      { href: "/miami", label: "Miami hub" },
      { href: "/miami/beaches", label: "Miami beaches" },
      { href: "/pet-friendly/miami", label: "Pet-friendly Miami" },
    ],
  },
  {
    slug: "accessibility-orlando",
    citySlug: "orlando",
    overlayType: "accessibility",
    entityTypes: ["hotel", "attraction"],
    resultSlugs: ["cabana-bay-beach-resort", "signia-bonnet-creek", "icon-park-orlando", "sea-life-orlando-aquarium"],
    canonicalPath: "/accessibility/orlando",
    summary: "Accessibility-first Orlando overlay built for families and travelers who need easier movement, clearer attraction access, and less guesswork before choosing a base.",
    relatedLinks: [
      { href: "/orlando", label: "Orlando hub" },
      { href: "/kid-friendly/orlando", label: "Kid-friendly Orlando" },
      { href: "/orlando/attractions", label: "Orlando attractions" },
    ],
  },
  {
    slug: "pet-friendly-las-vegas",
    citySlug: "las-vegas",
    overlayType: "pet-friendly",
    entityTypes: ["hotel"],
    resultSlugs: ["vdara", "park-mgm", "mgm-grand", "caesars-palace"],
    canonicalPath: "/pet-friendly/las-vegas",
    summary: "Cross-city overlay pattern for pet-friendly hotel discovery, proven first in the Vegas hotel mesh.",
    relatedLinks: [
      { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
      { href: "/vegas", label: "Vegas hub" },
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
    ],
  },
  {
    slug: "smoking-las-vegas",
    citySlug: "las-vegas",
    overlayType: "smoking",
    entityTypes: ["hotel", "casino", "attraction"],
    resultSlugs: ["park-mgm", "caesars-palace", "bellagio-casino", "caesars-palace-casino", "fremont-street-experience"],
    canonicalPath: "/smoking/las-vegas",
    summary:
      "Smoking logistics overlay for Las Vegas travelers who need to compare casino-floor smoking culture, smoking-room availability, cigar-lounge adjacency, outdoor smoking escape options, and the policy friction between hotels, venues, and casino floors.",
    relatedLinks: [
      { href: "/vegas", label: "Vegas hub" },
      { href: "/las-vegas/casinos", label: "Las Vegas casinos" },
      { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
      { href: "/fremont-street", label: "Fremont Street" },
    ],
  },
  {
    slug: "smoker-friendly-las-vegas",
    citySlug: "las-vegas",
    overlayType: "smoker-friendly",
    entityTypes: ["hotel", "casino", "attraction"],
    resultSlugs: ["park-mgm", "caesars-palace", "bellagio-casino", "caesars-palace-casino", "fremont-street-experience"],
    canonicalPath: "/smoker-friendly/las-vegas",
    summary:
      "Traveler-first Las Vegas smoking-policy overlay for comparing casino-floor smoking culture, cigar-lounge adjacency, outdoor-patio escape options, and hotel-policy friction before the stay is locked in.",
    relatedLinks: [
      { href: "/vegas", label: "Vegas hub" },
      { href: "/las-vegas/casinos", label: "Las Vegas casinos" },
      { href: "/fremont-street", label: "Fremont Street" },
      { href: "https://www.vegasmeansbusiness.com/planning-tools/transportation-parking/", label: "Vegas transportation and parking", kind: "external" },
    ],
  },
  {
    slug: "cannabis-rules-las-vegas",
    citySlug: "las-vegas",
    overlayType: "cannabis-rules",
    entityTypes: ["hotel", "casino", "attraction"],
    resultSlugs: ["vdara", "park-mgm", "bellagio-casino", "sphere-las-vegas"],
    canonicalPath: "/cannabis/las-vegas",
    summary:
      "Compliance-first Las Vegas cannabis rules overlay focused on what visitors need to avoid getting wrong: public-consumption bans, hotel and casino policy friction, airport and federal-property warnings, and safe trip-planning alternatives to guessing.",
    relatedLinks: [
      { href: "/vegas", label: "Vegas hub" },
      { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
      { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
      { href: "https://ccb.nv.gov/", label: "Nevada Cannabis Compliance Board", kind: "external" },
      { href: "https://www.harryreidairport.com/Traveler-Information/Know-Before-You-Go/Rules-and-Regulations", label: "Harry Reid Airport rules", kind: "external" },
    ],
  },
  {
    slug: "kid-friendly-las-vegas",
    citySlug: "las-vegas",
    overlayType: "kid-friendly",
    entityTypes: ["hotel", "attraction", "pool"],
    resultSlugs: ["excalibur", "circus-circus", "adventuredome", "mandalay-bay-pools"],
    canonicalPath: "/kid-friendly/las-vegas",
    summary: "Family-first Vegas overlay that cuts across hotels, attractions, and pool nodes.",
    relatedLinks: [
      { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
      { href: "/las-vegas/pools", label: "Las Vegas pools" },
      { href: "/vegas", label: "Vegas hub" },
    ],
  },
  {
    slug: "luxury-las-vegas",
    citySlug: "las-vegas",
    overlayType: "luxury",
    entityTypes: ["hotel", "casino"],
    resultSlugs: ["bellagio", "caesars-palace", "venetian", "wynn", "bellagio-casino", "wynn-casino"],
    canonicalPath: "/luxury-hotels-las-vegas",
    summary: "Luxury overlay layer for flagship Vegas hotel and casino routing.",
  },
  {
    slug: "smoking-miami",
    citySlug: "miami",
    overlayType: "smoking",
    entityTypes: ["hotel", "beach", "attraction"],
    resultSlugs: ["loews-miami-beach", "1-hotel-south-beach", "south-beach", "north-beach", "hobie-beach"],
    canonicalPath: "/smoking/miami",
    summary:
      "Smoking logistics overlay for Miami trips where outdoor patio culture, beach restrictions, hotel balcony assumptions, and district-by-district smoking norms matter more than generic nightlife advice.",
    relatedLinks: [
      { href: "/miami", label: "Miami hub" },
      { href: "/miami/beaches", label: "Miami beaches" },
      { href: "/pet-friendly/miami", label: "Pet-friendly Miami" },
      { href: "https://www.miamidade.gov/global/environment/air/smoking-regulations.page", label: "Miami-Dade smoking regulations", kind: "external" },
    ],
  },
  {
    slug: "kid-friendly-miami",
    citySlug: "miami",
    overlayType: "kid-friendly",
    entityTypes: ["beach"],
    resultSlugs: ["north-beach", "surfside", "hobie-beach"],
    canonicalPath: "/kid-friendly/miami",
    summary: "Kid-friendly Miami overlay focused on calmer beaches, easier family movement, and lighter beach-day logistics.",
    relatedLinks: [
      { href: "/miami", label: "Miami hub" },
      { href: "/miami/beaches", label: "Miami beaches" },
      { href: "/miami/tours", label: "Miami tours" },
    ],
  },
  {
    slug: "pet-friendly-miami",
    citySlug: "miami",
    overlayType: "pet-friendly",
    entityTypes: ["hotel", "attraction", "beach"],
    resultSlugs: ["loews-miami-beach", "1-hotel-south-beach", "bark-beach-miami-beach", "belle-isle-dog-park", "north-beach"],
    canonicalPath: "/pet-friendly/miami",
    summary: "Pet-friendly Miami overlay for dog-beach planning, easier outdoor routing, and stays that need more than a hotel pet-policy note.",
    relatedLinks: [
      { href: "/miami", label: "Miami hub" },
      { href: "/miami/beaches", label: "Miami beaches" },
      { href: "/miami/tours", label: "Miami tours" },
    ],
  },
  {
    slug: "kid-friendly-orlando",
    citySlug: "orlando",
    overlayType: "kid-friendly",
    entityTypes: ["hotel", "attraction"],
    resultSlugs: [
      "cabana-bay-beach-resort",
      "signia-bonnet-creek",
      "waldorf-astoria-orlando",
      "icon-park-orlando",
      "sea-life-orlando-aquarium",
      "airboat-adventures-orlando",
    ],
    canonicalPath: "/kid-friendly/orlando",
    summary: "Kid-friendly Orlando overlay for easier family routing across indoor attractions, ICON Park-style stops, and outdoor contrast days.",
    relatedLinks: [
      { href: "/orlando", label: "Orlando hub" },
      { href: "/orlando/attractions", label: "Orlando attractions" },
      { href: "/orlando/tours", label: "Orlando tours" },
    ],
  },
  {
    slug: "miami-beach-family",
    citySlug: "miami",
    overlayType: "family",
    entityTypes: ["beach"],
    resultSlugs: ["north-beach", "surfside", "hobie-beach"],
    canonicalPath: "/miami/beaches",
    summary: "Family-oriented Miami beach overlay that can later split into dedicated family-beach pages.",
  },
  {
    slug: "miami-beach-scenic",
    citySlug: "miami",
    overlayType: "scenic",
    entityTypes: ["beach"],
    resultSlugs: ["south-beach", "mid-beach", "haulover-beach"],
    canonicalPath: "/miami/beaches",
    summary: "Scenic and skyline-oriented beach discovery layer for Miami.",
  },
  {
    slug: "new-orleans-festival-pressure",
    citySlug: "new-orleans",
    overlayType: "festival-pressure",
    entityTypes: ["district", "venue", "hotel"],
    resultSlugs: [],
    canonicalPath: "/new-orleans",
    summary: "Seasonal-pressure overlay for New Orleans, centered on festival, crowd, and hotel-demand behavior.",
  },
  {
    slug: "nashville-music-first",
    citySlug: "nashville",
    overlayType: "music-first",
    entityTypes: ["venue", "show", "district"],
    resultSlugs: [],
    canonicalPath: "/nashville/shows",
    summary: "Music-first Nashville overlay that ties live-music discovery to venue and district expansion later.",
  },
];

export function getOverlayRegistryNodesByCity(citySlug: string) {
  return OVERLAY_REGISTRY.filter((overlay) => overlay.citySlug === citySlug);
}

export function getOverlayRegistryNodeByTypeAndCity(overlayType: DccOverlayType, citySlug: string) {
  return OVERLAY_REGISTRY.find((overlay) => overlay.overlayType === overlayType && overlay.citySlug === citySlug) ?? null;
}

export function listOverlayCitySlugsByType(overlayType: DccOverlayType) {
  return OVERLAY_REGISTRY.filter((overlay) => overlay.overlayType === overlayType).map((overlay) => overlay.citySlug);
}

export function listOverlayCategoriesByTypeAndCity(overlayType: DccOverlayType, citySlug: string) {
  const overlay = getOverlayRegistryNodeByTypeAndCity(overlayType, citySlug);
  return overlay ? overlay.entityTypes : [];
}
