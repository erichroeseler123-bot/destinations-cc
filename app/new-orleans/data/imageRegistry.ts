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
  "all-day-city-plantation-combo": {
    url: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    alt: "Historic French Quarter street lined with Creole buildings in New Orleans",
    source: "Wikimedia Commons",
    author: "Flickr user 'infrogmation'",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:French_Quarter_Street.jpg",
    verifiedRights: true,
  },
  "covered-boat-plantation-combo": {
    url: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    alt: "Covered pontoon tour boat carrying passengers through a Louisiana swamp",
    source: "Operator",
    author: "Ragin Cajun Tours",
    verifiedRights: true,
  }
};
