export type CosTransfer = {
  slug: string;
  destination: string;
  gosnoPath: string;
  summary: string;
  handoffMode?: "route" | "quote";
};

export const COS_TRANSFERS: CosTransfer[] = [
  {
    slug: "colorado-springs",
    destination: "Colorado Springs",
    gosnoPath: "/request-quote",
    handoffMode: "quote",
    summary: "Private Colorado Springs Airport pickup to a Colorado Springs-area destination. GoSno confirms the route, vehicle, availability, and price by quote.",
  },
  {
    slug: "breckenridge",
    destination: "Breckenridge",
    gosnoPath: "/colorado-springs-airport-to-breckenridge-transportation",
    summary: "Private COS to Breckenridge transportation with configured GoSno route availability.",
  },
  {
    slug: "vail",
    destination: "Vail",
    gosnoPath: "/colorado-springs-airport-to-vail-transportation",
    summary: "Private COS to Vail transportation with configured GoSno route availability.",
  },
  {
    slug: "beaver-creek",
    destination: "Beaver Creek",
    gosnoPath: "/colorado-springs-airport-to-beaver-creek-transportation",
    summary: "Private COS to Beaver Creek transportation with configured GoSno route availability.",
  },
  {
    slug: "keystone",
    destination: "Keystone",
    gosnoPath: "/colorado-springs-airport-to-keystone-transportation",
    summary: "Private COS to Keystone transportation with configured GoSno route availability.",
  },
  {
    slug: "copper-mountain",
    destination: "Copper Mountain",
    gosnoPath: "/colorado-springs-airport-to-copper-mountain-transportation",
    summary: "Private COS to Copper Mountain transportation with configured GoSno route availability.",
  },
  {
    slug: "winter-park",
    destination: "Winter Park",
    gosnoPath: "/colorado-springs-airport-to-winter-park-transportation",
    summary: "Private COS to Winter Park transportation with configured GoSno route availability.",
  },
  {
    slug: "aspen",
    destination: "Aspen",
    gosnoPath: "/colorado-springs-airport-to-aspen-transportation",
    summary: "Private COS to Aspen transportation with configured GoSno route availability.",
  },
  {
    slug: "snowmass",
    destination: "Snowmass",
    gosnoPath: "/colorado-springs-airport-to-snowmass-transportation",
    summary: "Private COS to Snowmass transportation with configured GoSno route availability.",
  },
  {
    slug: "steamboat-springs",
    destination: "Steamboat Springs",
    gosnoPath: "/colorado-springs-airport-to-steamboat-springs-transportation",
    summary: "Private COS to Steamboat Springs transportation with configured GoSno route availability.",
  },
];

export function buildCosGoSnoHref(transfer: CosTransfer) {
  const url = new URL(`https://gosno.co${transfer.gosnoPath}`);
  url.searchParams.set("utm_source", "420friendlyairportpickup.com");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "420-friendly-cos-transfer");
  url.searchParams.set("arrival_option", "optional-dispensary-stop");
  if (transfer.handoffMode === "quote") {
    url.searchParams.set("origin", "COS");
    url.searchParams.set("destination", transfer.destination);
    url.searchParams.set("direction", "airport_to_resort");
  }
  return url.toString();
}
