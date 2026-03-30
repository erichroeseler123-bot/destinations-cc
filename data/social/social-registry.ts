export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "x"
  | "youtube"
  | "linkedin"
  | "threads"
  | "spotify";

export type SocialStatus = "live" | "planned" | "hidden";

export type SocialLink = {
  platform: SocialPlatform;
  url: string;
  handle?: string;
  active?: boolean;
  primary?: boolean;
  status?: SocialStatus;
};

export type BrandSocialProfile = {
  brandKey: string;
  brandName: string;
  mode?: "brand" | "inherit-dcc" | "mixed";
  sameAs?: string[];
  socials: SocialLink[];
  shareDefaults?: {
    xHandle?: string;
    hashtags?: string[];
  };
};

export const socialRegistry: Record<string, BrandSocialProfile> = {
  dcc: {
    brandKey: "dcc",
    brandName: "Destination Command Center",
    mode: "brand",
    sameAs: [],
    socials: [],
    shareDefaults: {
      hashtags: ["DestinationCommandCenter", "TravelPlanning", "TravelIntel"],
    },
  },
  saveonthestrip: {
    brandKey: "saveonthestrip",
    brandName: "Save On The Strip",
    mode: "inherit-dcc",
    sameAs: [],
    socials: [],
    shareDefaults: {
      hashtags: ["LasVegas", "VegasDeals", "VegasTravel"],
    },
  },
  partyatredrocks: {
    brandKey: "partyatredrocks",
    brandName: "Party at Red Rocks",
    mode: "brand",
    sameAs: [
      "https://www.instagram.com/partyatredrocks",
      "https://www.facebook.com/redrockstransportation/",
      "https://x.com/partyatredrocks",
    ],
    socials: [
      {
        platform: "instagram",
        url: "https://www.instagram.com/partyatredrocks",
        handle: "@partyatredrocks",
        active: true,
        primary: true,
        status: "live",
      },
      {
        platform: "facebook",
        url: "https://www.facebook.com/redrockstransportation/",
        active: true,
        status: "live",
      },
      {
        platform: "x",
        url: "https://x.com/partyatredrocks",
        handle: "@partyatredrocks",
        active: true,
        status: "live",
      },
    ],
    shareDefaults: {
      xHandle: "@partyatredrocks",
      hashtags: ["RedRocks", "DenverConcerts", "ColoradoNightlife"],
    },
  },
  gosno: {
    brandKey: "gosno",
    brandName: "GoSno",
    mode: "inherit-dcc",
    sameAs: [],
    socials: [],
    shareDefaults: {
      hashtags: ["ColoradoSki", "SkiShuttle", "MountainTrips"],
    },
  },
  wta: {
    brandKey: "wta",
    brandName: "Welcome to Alaska Tours",
    mode: "inherit-dcc",
    sameAs: [],
    socials: [],
    shareDefaults: {
      hashtags: ["AlaskaTravel", "AlaskaTours", "CruiseExcursions"],
    },
  },
  mightyargo: {
    brandKey: "mightyargo",
    brandName: "Mighty Argo",
    mode: "inherit-dcc",
    sameAs: [],
    socials: [],
    shareDefaults: {
      hashtags: ["MightyArgo", "ColoradoAttractions", "CableCar"],
    },
  },
};
