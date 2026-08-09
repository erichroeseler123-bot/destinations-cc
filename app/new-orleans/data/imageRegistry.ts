export type AttributionSource = "Wikimedia Commons" | "Operator";

export interface ImageAttribution {
  url: string;
  alt: string;
  source: AttributionSource;
  author?: string;
  license?: string;
  licenseUrl?: string;
  sourceUrl?: string;
  verifiedRights: boolean;
}

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
  },
  "covered-tour-boat": {
    url: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    alt: "Covered pontoon boat in Louisiana swamp",
    source: "Operator",
    author: "Ragin Cajun Tours",
    verifiedRights: true,
  },
  "ragin-cajun-airboat-options": {
    url: "/images/travel-markets/new-orleans/airboat-swamp.png",
    alt: "Airboat speeding through Louisiana swamp",
    source: "Operator",
    author: "Ragin Cajun Tours",
    verifiedRights: true,
  },
  "evening-jazz-cruise": {
    url: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    alt: "Steamboat Natchez on the Mississippi River",
    source: "Operator",
    author: "New Orleans Steamboat Company",
    verifiedRights: true,
  },
  "daytime-jazz-cruise": {
    url: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    alt: "Steamboat Natchez on the Mississippi River",
    source: "Operator",
    author: "New Orleans Steamboat Company",
    verifiedRights: true,
  },
  "sunday-jazz-brunch-cruise": {
    url: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    alt: "Steamboat Natchez on the Mississippi River",
    source: "Operator",
    author: "New Orleans Steamboat Company",
    verifiedRights: true,
  },
  "oak-alley-plantation-tour-grey-line": {
    url: "/images/wikimedia/originals/oak-alley-front.jpg",
    alt: "Oak Alley Plantation",
    source: "Wikimedia Commons",
    author: "Sven Krosse",
    license: "CC BY-SA 3.0",
    verifiedRights: true,
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
  },
  "swamp-bayou-tour": {
    url: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    alt: "Covered pontoon boat in Louisiana swamp",
    source: "Operator",
    author: "Gray Line / Cajun Pride",
    verifiedRights: true,
  },
  "small-airboat-swamp-adventure": {
    url: "/images/travel-markets/new-orleans/small-group-airboat.png",
    alt: "Airboat speeding through Louisiana swamp",
    source: "Operator",
    author: "Gray Line / Cajun Pride",
    verifiedRights: true,
  },
  "large-airboat-swamp-adventure": {
    url: "/images/travel-markets/new-orleans/airboat-swamp.png",
    alt: "Airboat speeding through Louisiana swamp",
    source: "Operator",
    author: "Gray Line / Cajun Pride",
    verifiedRights: true,
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
  },
  "ghosts-spirits-walking-tour": {
    url: "/images/wikimedia/originals/lalaurie-mansion-1906.jpg",
    alt: "LaLaurie Mansion in New Orleans in 1906",
    source: "Wikimedia Commons",
    author: "Detroit Publishing Co",
    license: "Public domain",
    verifiedRights: true,
  },
  "city-cemetery-garden-district-tour": {
    url: "/images/wikimedia/originals/st-louis-cemetery-1-gates.jpg",
    alt: "St. Louis Cemetery No. 1",
    source: "Wikimedia Commons",
    author: "Tom Hilton",
    license: "CC BY 2.0",
    verifiedRights: true,
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
  },
};
