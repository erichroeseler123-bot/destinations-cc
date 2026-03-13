export type CruiseSpecialtyIntent = {
  label: string;
  query: string;
};

export type CruiseSpecialtyLaneKey = "gay" | "sober" | "music";

export type CruiseSpecialtyLane = {
  key: CruiseSpecialtyLaneKey;
  updatedAt: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  organizers?: string[];
  tags?: string[];
  viatorQuery?: string;
  intents: CruiseSpecialtyIntent[];
  featuredPortSlugs: string[];
  featuredShipSlugs: string[];
};

export const CRUISE_SPECIALTY_LANES: CruiseSpecialtyLane[] = [
  {
    key: "gay",
    updatedAt: "2026-03-11",
    title: "LGBTQ+ Cruise Planning Lane",
    description:
      "High-intent lane for LGBTQ+ cruise travelers: inclusive sailings, shore logistics, and excursion planning tied to major embark ports.",
    ctaLabel: "Explore LGBTQ+ Cruise Routes",
    ctaHref: "/tours?q=lgbtq%20cruise%20excursions",
    organizers: ["Atlantis Events", "VACAYA", "Brand g"],
    tags: ["lgbtq", "gay-charter", "inclusive"],
    viatorQuery: "lgbtq friendly shore excursions",
    intents: [
      { label: "LGBTQ+ cruise excursions", query: "lgbtq cruise excursions" },
      { label: "Gay cruise shore excursions", query: "gay cruise shore excursions" },
      { label: "Inclusive cruise port tours", query: "inclusive cruise port tours" },
    ],
    featuredPortSlugs: ["miami-usa", "nassau-bahamas", "cozumel-mexico"],
    featuredShipSlugs: ["icon-of-the-seas"],
  },
  {
    key: "sober",
    updatedAt: "2026-03-11",
    title: "Sober Cruise Support Lane",
    description:
      "Planning lane for sober and alcohol-free cruise travelers, including calm excursion options and predictable shore-day routing.",
    ctaLabel: "Explore Sober-Friendly Excursions",
    ctaHref: "/tours?q=sober%20cruise%20excursions",
    organizers: ["Sober Celebrations", "Recovery at Sea"],
    tags: ["sober", "recovery", "alcohol-free"],
    viatorQuery: "wellness shore excursions",
    intents: [
      { label: "Sober cruise excursions", query: "sober cruise excursions" },
      { label: "Alcohol-free cruise activities", query: "alcohol free cruise activities" },
      { label: "Wellness shore day tours", query: "wellness shore excursions" },
    ],
    featuredPortSlugs: ["juneau-alaska", "ketchikan-alaska", "skagway-alaska"],
    featuredShipSlugs: ["viking-octantis"],
  },
  {
    key: "music",
    updatedAt: "2026-03-11",
    title: "Music-Themed Cruise Lane",
    description:
      "Music-first cruise lane for festival-at-sea and concert-at-sea travelers, with linked port and ship discovery paths.",
    ctaLabel: "Explore Music Cruise Experiences",
    ctaHref: "/tours?q=music%20cruise%20excursions",
    organizers: ["Monsters of Rock Cruise", "Sixthman"],
    tags: ["music-themed", "concert-at-sea", "festival"],
    viatorQuery: "concert shore excursions",
    intents: [
      { label: "Music cruise excursions", query: "music cruise excursions" },
      { label: "Festival at sea ports", query: "festival cruise ports" },
      { label: "Concert cruise shore tours", query: "concert cruise shore tours" },
    ],
    featuredPortSlugs: ["miami-usa", "nassau-bahamas", "cozumel-mexico"],
    featuredShipSlugs: ["carnival-jubilee", "icon-of-the-seas"],
  },
];

export const CRUISE_SPECIALTY_LANE_KEYS = CRUISE_SPECIALTY_LANES.map((lane) => lane.key);

export function getCruiseSpecialtyLane(key: string): CruiseSpecialtyLane | null {
  return CRUISE_SPECIALTY_LANES.find((lane) => lane.key === key) || null;
}

export function getCruiseSpecialtyLanesForShip(shipSlug: string): CruiseSpecialtyLane[] {
  return CRUISE_SPECIALTY_LANES.filter((lane) => lane.featuredShipSlugs.includes(shipSlug));
}

export function getCruiseSpecialtyLanesForPort(portSlug: string): CruiseSpecialtyLane[] {
  return CRUISE_SPECIALTY_LANES.filter((lane) => lane.featuredPortSlugs.includes(portSlug));
}
