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
};
