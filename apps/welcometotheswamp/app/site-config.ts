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
      title: "Airboat Tour",
      description: "Fast, open-air swamp ride for travelers who want the most action and wind-in-your-face energy.",
      eyebrow: "Speed-first option",
      type: "airboat"
    },
    {
      id: "ragincajun-covered-boat",
      companyShortname: "ragincajuntours",
      itemId: "590176",
      flowId: "392449",
      title: "Covered Swamp Boat",
      description: "A calmer swamp ride with shade and easier conversation, good for families and laid-back groups.",
      eyebrow: "Comfort-first option",
      type: "boat"
    },
    {
      id: "ragincajun-private-boat",
      companyShortname: "ragincajuntours",
      itemId: "603090",
      flowId: "392449",
      title: "Private Covered Tour",
      description: "A private swamp option for groups that want more control over timing, space, and pace.",
      eyebrow: "Private group option",
      type: "boat"
    },
    {
      id: "southernstyle-swamp",
      companyShortname: "southernstyletours",
      itemId: "83002",
      flowId: "4344",
      title: "Plantation Tour",
      description: "A history-focused tour outside the city for visitors who want to see more of Louisiana beyond New Orleans.",
      eyebrow: "Plantation Tour",
      type: "boat"
    },
    {
      id: "southernstyle-city-tour",
      companyShortname: "southernstyletours",
      itemId: "51942",
      flowId: "4344",
      title: "City Tour",
      description: "A simple New Orleans overview for first-time visitors who want the city layout before or after other tours.",
      eyebrow: "City Tour",
      type: "city"
    }
  ] as SwampFareHarborProduct[],
};
