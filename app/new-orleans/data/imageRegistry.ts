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
 * rights-cleared image is available. Currently only held/unverified SKUs remain here.
 */
export const PRODUCT_IMAGE_REPLACEMENT_QUEUE = [
  "covered-boat-plantation-combo",
  "jeanlafitte-swamp-tour-with-hotel-pickup",
] as const;

export const PRODUCT_IMAGES: Record<string, ImageAttribution> = {
  "city-tour-of-new-orleans": {
    url: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    alt: "Historic French Quarter street architecture and wrought-iron balconies in New Orleans",
    source: "Wikimedia Commons",
    author: "Infrogmation of New Orleans",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:French_Quarter_Street.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "oak-alley-or-laura-plantation-tour": {
    url: "/images/portfolio/laura-plantation.webp",
    alt: "Historic Creole manor house and grounds at Laura Plantation on Louisiana's River Road",
    source: "Wikimedia Commons",
    author: "MeRyan",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Laura_Plantation_Office.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "all-day-city-plantation-combo": {
    url: "/images/portfolio/laura-plantation.webp",
    alt: "Historic Creole plantation architecture included in the full-day New Orleans city and River Road combo",
    source: "Wikimedia Commons",
    author: "MeRyan",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Laura_Plantation_Office.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "louisiana-tour-company-swamp-tour-hotel-pickup": {
    url: "/images/portfolio/nola-covered-swamp-boat.webp",
    alt: "Covered bayou swamp tour boat cruising past cypress trees in South Louisiana",
    source: "Wikimedia Commons",
    author: "Daniel Lobo",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Honey_Island_Swamp_Tour,_Louisiana_July_2023_-_8.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "public-domain",
  },
  "covered-tour-boat": {
    url: "/images/wno/small-boat-swamp-tour.webp",
    alt: "Covered pontoon swamp tour boat gliding across calm Louisiana bayou waters",
    source: "Wikimedia Commons",
    author: "Infrogmation of New Orleans",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Honey_Island_Swamp_Tour,_Louisiana_USA,_18_September_2018_-_03.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "ragin-cajun-airboat-options": {
    url: "/images/wno/airboat-swamp-tour.webp",
    alt: "Open-air swamp airboat skimming across shallow Louisiana marsh waters",
    source: "Wikimedia Commons",
    author: "U.S. Fish and Wildlife Service",
    license: "Public domain",
    licenseUrl: "https://en.wikipedia.org/wiki/Public_domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Man_driving_airboat_on_swamp_water.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "public-domain",
  },
  "swamp-boat-oak-alley-combo": {
    url: "/images/wikimedia/originals/oak-alley-front.jpg",
    alt: "Oak Alley Plantation live oak canopy included in the swamp boat and plantation combination",
    source: "Wikimedia Commons",
    author: "Sven Krosse",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Oak_alley_-_view_from_front.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "swamp-boat-whitney-combo": {
    url: "/images/portfolio/whitney-plantation.webp",
    alt: "Historic grounds and museum exhibits at Whitney Plantation included in the swamp and plantation combination",
    source: "Wikimedia Commons",
    author: "Jeremy Thompson",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Whitney_Plantation,_June_2023_-_Exhibit.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "evening-jazz-cruise": {
    url: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    alt: "Steamboat Natchez paddlewheeler cruising on the Mississippi River in New Orleans",
    source: "Operator",
    author: "New Orleans Steamboat Company",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "operator-direct",
    approvalNote: "Gray Line / New Orleans Steamboat Company image-use permission confirmed by site owner.",
  },
  "daytime-jazz-cruise": {
    url: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    alt: "Steamboat Natchez paddlewheeler on a daytime Mississippi River jazz cruise",
    source: "Operator",
    author: "New Orleans Steamboat Company",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "operator-direct",
    approvalNote: "Gray Line / New Orleans Steamboat Company image-use permission confirmed by site owner.",
  },
  "sunday-jazz-brunch-cruise": {
    url: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    alt: "Steamboat Natchez on the Mississippi River during Sunday jazz brunch",
    source: "Operator",
    author: "New Orleans Steamboat Company",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "operator-direct",
    approvalNote: "Gray Line / New Orleans Steamboat Company image-use permission confirmed by site owner.",
  },
  "oak-alley-plantation-tour-grey-line": {
    url: "/images/wikimedia/originals/oak-alley-front.jpg",
    alt: "Oak Alley Plantation manor framed by 300-year-old southern live oaks",
    source: "Wikimedia Commons",
    author: "Sven Krosse",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Oak_alley_-_view_from_front.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "whitney-plantation-tour": {
    url: "/images/portfolio/whitney-plantation.webp",
    alt: "Historic grounds and museum architecture at Whitney Plantation on Louisiana's River Road",
    source: "Wikimedia Commons",
    author: "Jeremy Thompson",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Whitney_Plantation,_June_2023_-_Exhibit.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "swamp-bayou-tour": {
    url: "/images/portfolio/jean-lafitte-bayou.webp",
    alt: "Cypress trees and calm bayou waters in Jean Lafitte National Historical Park and Preserve",
    source: "Wikimedia Commons",
    author: "Ken Lund",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Barataria_Preserve,_Jean_Lafitte_National_Historical_Park_and_Preserve,_Louisiana.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "small-airboat-swamp-adventure": {
    url: "/images/portfolio/louisiana-airboat-marsh.webp",
    alt: "Small-group airboat riding through coastal Louisiana marsh channels",
    source: "Wikimedia Commons",
    author: "U.S. Fish and Wildlife Service Headquarters",
    license: "Public domain",
    licenseUrl: "https://en.wikipedia.org/wiki/Public_domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Airboat_ride,_Rockefeller_Wildlife_Refuge_(7094167921).jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "public-domain",
  },
  "large-airboat-swamp-adventure": {
    url: "/images/wno/airboat-swamp-tour.webp",
    alt: "Open-air airboat riding across shallow Louisiana swamp waters",
    source: "Wikimedia Commons",
    author: "U.S. Fish and Wildlife Service",
    license: "Public domain",
    licenseUrl: "https://en.wikipedia.org/wiki/Public_domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Man_driving_airboat_on_swamp_water.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "public-domain",
  },
  "cocktail-walking-tour": {
    url: "/images/portfolio/classic-cocktails-nola.webp",
    alt: "Classic whiskey and craft cocktails served on a French Quarter cocktail walking tour",
    source: "Wikimedia Commons",
    author: "Cocktailmarler",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Rum,_Manhattan,_Tequila_Old_Fashioned.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "craft-cocktail-walking-tour": {
    url: "/images/portfolio/classic-cocktails-nola.webp",
    alt: "Craft Manhattan and Old Fashioned cocktails in historic New Orleans glassware",
    source: "Wikimedia Commons",
    author: "Cocktailmarler",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Rum,_Manhattan,_Tequila_Old_Fashioned.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "ghosts-spirits-walking-tour": {
    url: "/images/wikimedia/originals/french-quarter-night.jpg",
    alt: "Historic French Quarter street architecture illuminated at night",
    source: "Wikimedia Commons",
    author: "Infrogmation of New Orleans",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Night_in_the_French_Quarter_2_December_2008.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "city-cemetery-garden-district-tour": {
    url: "/images/portfolio/garden-district-mansion.webp",
    alt: "Historic Greek Revival mansion and live oaks along Coliseum Street in the Garden District",
    source: "Wikimedia Commons",
    author: "Infrogmation of New Orleans",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Coliseum_Street,_Garden_District,_New_Orleans,_April_2023_-_Mansion.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
  "city-of-new-orleans-riverboat-cruise": {
    url: "/images/portfolio/riverboat-city-of-nola.webp",
    alt: "Riverboat CITY of NEW ORLEANS docked along Woldenberg Park on the Mississippi River",
    source: "Wikimedia Commons",
    author: "Jesse James",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:City_of_New_Orleans_Riverboat_at_Woldenberg_Park,_New_Orleans,_January_2020_-_02.jpg",
    verifiedRights: true,
    rightsStatus: "approved",
    rightsBasis: "creative-commons",
  },
};
