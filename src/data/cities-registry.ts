import { CITY_AUTHORITY_CONFIG } from "@/src/data/city-authority-config";
import { CITY_ROLLOUT_PRIORITY, type CityRolloutPhase, type CityRolloutStatus } from "@/src/data/city-rollout-priority";

export type DccHubType = "city" | "port" | "region";

export type DccCityRegistryNode = {
  slug: string;
  name: string;
  state?: string;
  country: string;
  hubType: DccHubType;
  canonicalPath: string;
  rolloutPhase?: CityRolloutPhase;
  rolloutStatus?: CityRolloutStatus;
  keyDistrictSlugs: string[];
  keyCategorySlugs: string[];
  keyOverlaySlugs: string[];
  keyRelationshipPaths: string[];
  updatedAt: string;
};

const CITY_STATE_OVERRIDES: Record<string, string | undefined> = {
  "las-vegas": "Nevada",
  miami: "Florida",
  orlando: "Florida",
  "new-orleans": "Louisiana",
  nashville: "Tennessee",
  chicago: "Illinois",
  "new-york-city": "New York",
  "los-angeles": "California",
  "san-francisco": "California",
};

const CITY_DISTRICT_OVERRIDES: Record<string, string[]> = {
  "las-vegas": [
    "las-vegas-strip",
    "fremont-street",
    "las-vegas-arts-district",
    "las-vegas-chinatown",
    "summerlin",
    "henderson-las-vegas",
  ],
  miami: ["south-beach"],
  "new-orleans": ["french-quarter"],
  nashville: ["broadway-nashville"],
};

const CITY_CATEGORY_OVERRIDES: Record<string, string[]> = {
  "las-vegas": ["hotels", "casinos", "shows", "things-to-do", "pools", "sports", "tours", "day-trips"],
  miami: ["beaches", "sports", "tours", "attractions"],
  orlando: ["sports", "tours", "attractions"],
  "new-orleans": ["shows", "festivals", "tours", "sports"],
  nashville: ["shows", "sports"],
};

const CITY_OVERLAY_OVERRIDES: Record<string, string[]> = {
  "las-vegas": ["accessibility", "pet-friendly", "kid-friendly", "luxury"],
  miami: ["accessibility", "nightlife", "scenic", "family", "kid-friendly", "pet-friendly"],
  orlando: ["accessibility", "kid-friendly"],
  "new-orleans": ["festival-pressure", "music-first"],
};

const CITY_RELATIONSHIP_PATHS: Record<string, string[]> = {
  "las-vegas": ["hotels-near", "casinos-near", "attractions-near"],
};

export const CITIES_REGISTRY: DccCityRegistryNode[] = CITY_ROLLOUT_PRIORITY.map((city) => {
  const authority = CITY_AUTHORITY_CONFIG[city.cityKey];
  return {
    slug: city.cityKey,
    name: city.cityName,
    state: CITY_STATE_OVERRIDES[city.cityKey],
    country: "United States",
    hubType: "city",
    canonicalPath: authority?.canonicalPath ?? `/${city.cityKey}`,
    rolloutPhase: city.phase,
    rolloutStatus: city.status,
    keyDistrictSlugs: CITY_DISTRICT_OVERRIDES[city.cityKey] ?? [],
    keyCategorySlugs: CITY_CATEGORY_OVERRIDES[city.cityKey] ?? city.priorityLanes,
    keyOverlaySlugs: CITY_OVERLAY_OVERRIDES[city.cityKey] ?? [],
    keyRelationshipPaths: CITY_RELATIONSHIP_PATHS[city.cityKey] ?? [],
    updatedAt: authority?.updatedAt ?? "2026-03-12",
  };
});

export function getCityRegistryNode(slug: string) {
  return CITIES_REGISTRY.find((city) => city.slug === slug) ?? null;
}

export function getLiveCityRegistryNodes() {
  return CITIES_REGISTRY.filter((city) => city.rolloutStatus === "live");
}
