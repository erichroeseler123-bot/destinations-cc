export interface SwampFareHarborProduct {
  id: string;
  companyShortname: string;
  itemId?: string | number;
  flowId?: string | number;
  title: string;
  description: string;
  eyebrow: string;
  type: "airboat" | "boat" | "city";
}

export const SITE_CONFIG = {
  siteKey: "welcometotheswamp",
  name: "Welcome to the Swamp",
  domain: "welcometotheswamp.com",
  url: "https://welcometotheswamp.com",
  mission:
    "Welcome to the Swamp helps visitors choose, time, and understand swamp tours near New Orleans with practical, tourist-first advice — before they book anything.",
  dccOrigin: process.env.DCC_ORIGIN || "https://www.destinationcommandcenter.com",
  fareharborSwampAsn: process.env.NEXT_PUBLIC_FAREHARBOR_SWAMP_ASN || "aktourcenter",
  swampFareHarborProducts: [
    {
      id: "ragincajun-airboat",
      companyShortname: "ragincajuntours",
      flowId: "940162",
      title: "Ragin Cajun Airboat Tour",
      description: "Use this if speed, wind, and a louder, high-energy ride are the point of the trip.",
      eyebrow: "Speed-first option",
      type: "airboat"
    },
    {
      id: "ragincajun-covered-boat",
      companyShortname: "ragincajuntours",
      itemId: "590176",
      flowId: "392449",
      title: "Ragin Cajun Covered Swamp Boat",
      description: "Better fit for shade, calmer pacing, and easier conversation on the water.",
      eyebrow: "Comfort-first option",
      type: "boat"
    },
    {
      id: "ragincajun-private-boat",
      companyShortname: "ragincajuntours",
      itemId: "603090",
      flowId: "392449",
      title: "Ragin Cajun Private Covered Tour",
      description: "A private shaded excursion tailored for family and friend groups.",
      eyebrow: "Private group option",
      type: "boat"
    },
    {
      id: "southernstyle-swamp",
      companyShortname: "southernstyletours",
      itemId: "83002",
      flowId: "4344",
      title: "Southern Style Swamp Tour",
      description: "Classic New Orleans swamp excursion with optional French Quarter pickup.",
      eyebrow: "Pickup-friendly option",
      type: "boat"
    },
    {
      id: "southernstyle-city-tour",
      companyShortname: "southernstyletours",
      itemId: "51942",
      flowId: "4344",
      title: "Southern Style New Orleans City Tour",
      description: "Explore the French Quarter, Garden District, and historic landmarks with local guides.",
      eyebrow: "City exploration",
      type: "city"
    }
  ] as SwampFareHarborProduct[],
};
