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
  },
  "evening-jazz-cruise": {
    url: "/images/wikimedia/originals/french-quarter-night.jpg",
    alt: "Historic French Quarter street at night",
    source: "Wikimedia Commons",
    author: "Infrogmation of New Orleans",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Night_in_the_French_Quarter_2_December_2008.jpg",
    verifiedRights: true,
  },
  "daytime-jazz-cruise": {
    url: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    alt: "French Quarter Street View",
    source: "Wikimedia Commons",
    author: "Flickr user 'infrogmation'",
    license: "CC BY 2.0",
    verifiedRights: true,
  },
  "sunday-jazz-brunch-cruise": {
    url: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    alt: "French Quarter Street View",
    source: "Wikimedia Commons",
    author: "Flickr user 'infrogmation'",
    license: "CC BY 2.0",
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
    url: "/images/wikimedia/originals/oak-alley-front.jpg",
    alt: "Plantation grounds",
    source: "Wikimedia Commons",
    author: "Sven Krosse",
    license: "CC BY-SA 3.0",
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
    url: "/images/travel-markets/new-orleans/airboat-swamp.png",
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
  "swamp-boat-oak-alley-combo": {
    url: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    alt: "Covered pontoon boat in Louisiana swamp",
    source: "Operator",
    author: "Gray Line / Cajun Pride",
    verifiedRights: true,
  },
  "swamp-boat-whitney-combo": {
    url: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    alt: "Covered pontoon boat in Louisiana swamp",
    source: "Operator",
    author: "Gray Line / Cajun Pride",
    verifiedRights: true,
  },
  "cocktail-walking-tour": {
    url: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    alt: "French Quarter Street View",
    source: "Wikimedia Commons",
    author: "Flickr user 'infrogmation'",
    license: "CC BY 2.0",
    verifiedRights: true,
  },
  "craft-cocktail-walking-tour": {
    url: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    alt: "French Quarter Street View",
    source: "Wikimedia Commons",
    author: "Flickr user 'infrogmation'",
    license: "CC BY 2.0",
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
    url: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    alt: "French Quarter Street View",
    source: "Wikimedia Commons",
    author: "Flickr user 'infrogmation'",
    license: "CC BY 2.0",
    verifiedRights: true,
  }
};
