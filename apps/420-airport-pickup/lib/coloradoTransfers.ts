export type ColoradoTransfer = {
  slug: string;
  destination: string;
  gosnoPath: string;
  summary: string;
  handoffMode?: "route" | "quote";
};

export const COLORADO_TRANSFERS: ColoradoTransfer[] = [
  {
    slug: "colorado-springs",
    destination: "Colorado Springs",
    gosnoPath: "/request-quote",
    handoffMode: "quote",
    summary: "Private DEN to Colorado Springs transportation for adults 21+ with an optional lawful dispensary stop when practical. GoSno confirms this corridor by quote.",
  },
  {
    slug: "breckenridge",
    destination: "Breckenridge",
    gosnoPath: "/breckenridge",
    summary: "Private DEN to Breckenridge transportation for adults 21+ with an optional dispensary stop included at no additional transportation charge.",
  },
  {
    slug: "vail",
    destination: "Vail",
    gosnoPath: "/vail",
    summary: "Private DEN to Vail transportation for adults 21+ with an optional dispensary stop included at no additional transportation charge.",
  },
  {
    slug: "beaver-creek",
    destination: "Beaver Creek",
    gosnoPath: "/beaver-creek",
    summary: "Private DEN to Beaver Creek transportation for adults 21+ with an optional dispensary stop included at no additional transportation charge.",
  },
  {
    slug: "winter-park",
    destination: "Winter Park",
    gosnoPath: "/winter-park",
    summary: "Private DEN to Winter Park transportation for adults 21+ with an optional dispensary stop included at no additional transportation charge.",
  },
  {
    slug: "copper",
    destination: "Copper Mountain",
    gosnoPath: "/copper",
    summary: "Private DEN to Copper Mountain transportation for adults 21+ with an optional dispensary stop included at no additional transportation charge.",
  },
  {
    slug: "steamboat",
    destination: "Steamboat Springs",
    gosnoPath: "/steamboat",
    summary: "Private DEN to Steamboat Springs transportation for adults 21+ with an optional dispensary stop included at no additional transportation charge.",
  },
  {
    slug: "aspen",
    destination: "Aspen",
    gosnoPath: "/aspen",
    summary: "Private DEN to Aspen transportation for adults 21+ with an optional dispensary stop included at no additional transportation charge.",
  },
  {
    slug: "snowmass",
    destination: "Snowmass",
    gosnoPath: "/snowmass",
    summary: "Private DEN to Snowmass transportation for adults 21+ with an optional dispensary stop included at no additional transportation charge.",
  },
];

export function getColoradoTransfer(slug: string) {
  return COLORADO_TRANSFERS.find((transfer) => transfer.slug === slug) || null;
}

export function buildGoSnoHref(transfer: ColoradoTransfer) {
  const url = new URL(`https://gosno.co${transfer.gosnoPath}`);
  url.searchParams.set("utm_source", "420friendlyairportpickup.com");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "420-friendly-transfer");
  url.searchParams.set("arrival_option", "optional-dispensary-stop");
  if (transfer.handoffMode === "quote") {
    url.searchParams.set("origin", "DEN");
    url.searchParams.set("destination", transfer.destination);
    url.searchParams.set("direction", "airport_to_resort");
  }
  return url.toString();
}
