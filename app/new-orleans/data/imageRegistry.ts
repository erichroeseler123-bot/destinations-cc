export type AttributionSource = "Wikimedia Commons" | "Operator";
export type ImageRightsStatus = "approved" | "pending" | "not-approved";
export type ImageRightsBasis =
  | "operator-direct"
  | "fareharbor-fhdn"
  | "fareharbor-marketplace"
  | "creative-commons"
  | "public-domain";

export interface ImageAttribution {
  url: string;
  alt: string;
  source: AttributionSource;
  author?: string;
  license?: string;
  licenseUrl?: string;
  sourceUrl?: string;
  verifiedRights: boolean;
  rightsStatus?: ImageRightsStatus;
  rightsBasis?: ImageRightsBasis;
  approvalNote?: string;
}

/**
 * Operator-level image permissions confirmed for the WNO storefront.
 * These permissions allow product-accurate operator imagery to replace generic
 * editorial imagery as those assets are added to the registry.
 */
export const OPERATOR_IMAGE_PERMISSIONS = {
  "Gray Line / New Orleans Steamboat Company": {
    status: "approved" as const,
    basis: "operator-direct" as const,
    note: "Operator permission confirmed by site owner; may use approved operator/FareHarbor tour imagery for WNO commerce surfaces.",
  },
  "Ragin Cajun Tours": {
    status: "approved" as const,
    basis: "operator-direct" as const,
    note: "Direct operator relationship and image-use permission confirmed by site owner.",
  },
  "Southern Style Tours": {
    status: "approved" as const,
    basis: "operator-direct" as const,
    note: "Direct operator relationship and image-use permission confirmed by site owner.",
  },
} as const;

/**
 * Products intentionally shown without a commerce image until a product-accurate,
 * rights-cleared image is available. Do not substitute a merely related property,
 * vessel, historical scene, or category image on a shopping card.
 */
export const PRODUCT_IMAGE_REPLACEMENT_QUEUE = [
  "all-day-city-plantation-combo",
  "covered-boat-plantation-combo",
  "swamp-boat-oak-alley-combo",
  "swamp-boat-whitney-combo",
] as const;

export const PRODUCT_IMAGES: Record<string, ImageAttribution> = {
  "city-tour-of-new-orleans": {
    url: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    alt: "French Quarter Street View",
    source: "Wikimedia Commons",
    author: "Flickr user 'infrogmation'",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:French_Quarter_Street.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "covered-tour-boat": {
    url: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    alt: "Covered pontoon boat in Louisiana swamp",
    source: "Operator",
    author: "Ragin Cajun Tours",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "operator-direct",
    approvalNote: "Direct operator image-use permission confirmed by site owner.",
  },
  "ragin-cajun-airboat-options": {
    url: "/images/travel-markets/new-orleans/airboat-swamp.png",
    alt: "Airboat speeding through Louisiana swamp",
    source: "Operator",
    author: "Ragin Cajun Tours",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "operator-direct",
    approvalNote: "Direct operator image-use permission confirmed by site owner.",
  },
  "evening-jazz-cruise": {
    url: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    alt: "Steamboat Natchez on the Mississippi River",
    source: "Operator",
    author: "New Orleans Steamboat Company",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "operator-direct",
    approvalNote: "Gray Line / New Orleans Steamboat Company image-use permission confirmed by site owner.",
  },
  "daytime-jazz-cruise": {
    url: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    alt: "Steamboat Natchez on the Mississippi River",
    source: "Operator",
    author: "New Orleans Steamboat Company",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "operator-direct",
    approvalNote: "Gray Line / New Orleans Steamboat Company image-use permission confirmed by site owner.",
  },
  "sunday-jazz-brunch-cruise": {
    url: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    alt: "Steamboat Natchez on the Mississippi River",
    source: "Operator",
    author: "New Orleans Steamboat Company",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "operator-direct",
    approvalNote: "Gray Line / New Orleans Steamboat Company image-use permission confirmed by site owner.",
  },
  "oak-alley-plantation-tour-grey-line": {
    url: "/images/wikimedia/originals/oak-alley-front.jpg",
    alt: "Oak Alley Plantation",
    source: "Wikimedia Commons",
    author: "Sven Krosse",
    license: "CC BY-SA 3.0",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "whitney-plantation-tour": {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/30/The_Big_House_-_Whitney_Plantation%2C_Louisiana.jpg",
    alt: "The Big House at Whitney Plantation in Louisiana",
    source: "Wikimedia Commons",
    author: "bvi4092",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:The_Big_House_-_Whitney_Plantation,_Louisiana.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "swamp-bayou-tour": {
    url: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    alt: "Covered pontoon boat in Louisiana swamp",
    source: "Operator",
    author: "Gray Line / Cajun Pride",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "operator-direct",
    approvalNote: "Gray Line image-use permission confirmed by site owner.",
  },
  "small-airboat-swamp-adventure": {
    url: "/images/travel-markets/new-orleans/small-group-airboat.png",
    alt: "Airboat speeding through Louisiana swamp",
    source: "Operator",
    author: "Gray Line / Cajun Pride",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "operator-direct",
    approvalNote: "Gray Line image-use permission confirmed by site owner.",
  },
  "large-airboat-swamp-adventure": {
    url: "/images/travel-markets/new-orleans/airboat-swamp.png",
    alt: "Airboat speeding through Louisiana swamp",
    source: "Operator",
    author: "Gray Line / Cajun Pride",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "operator-direct",
    approvalNote: "Gray Line image-use permission confirmed by site owner.",
  },
  "cocktail-walking-tour": {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/fc/SazeracCocktail.jpg",
    alt: "Sazerac cocktail in New Orleans",
    source: "Wikimedia Commons",
    author: "Gtandersson",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:SazeracCocktail.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "craft-cocktail-walking-tour": {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/fc/SazeracCocktail.jpg",
    alt: "Sazerac cocktail in New Orleans",
    source: "Wikimedia Commons",
    author: "Gtandersson",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:SazeracCocktail.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "ghosts-spirits-walking-tour": {
    url: "/images/wikimedia/originals/lalaurie-mansion-1906.jpg",
    alt: "LaLaurie Mansion in New Orleans in 1906",
    source: "Wikimedia Commons",
    author: "Detroit Publishing Co",
    license: "Public domain",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "public-domain",
  },
  "city-cemetery-garden-district-tour": {
    url: "/images/wikimedia/originals/st-louis-cemetery-1-gates.jpg",
    alt: "St. Louis Cemetery No. 1",
    source: "Wikimedia Commons",
    author: "Tom Hilton",
    license: "CC BY 2.0",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "city-of-new-orleans-riverboat-cruise": {
    url: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Riverboat_-_Mississippi_River_at_New_Orleans%2C_February_2021.jpg",
    alt: "City of New Orleans riverboat on the Mississippi River",
    source: "Wikimedia Commons",
    author: "David Brossard",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Riverboat_-_Mississippi_River_at_New_Orleans,_February_2021.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
};
