import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { listCruiseCanonicalPortSlugs, listCruiseShipSlugs } from "@/lib/dcc/internal/cruisePayload";
import { CITY_AUTHORITY_CONFIG } from "@/src/data/city-authority-config";
import { CRUISE_SPECIALTY_LANES } from "@/src/data/cruise-specialty-lanes";
import { PORT_AUTHORITY_CONFIG } from "@/src/data/port-authority-config";
import { NATIONAL_PARKS_AUTHORITY_CONFIG } from "@/src/data/national-parks-authority-config";
import { SPORTS_LEAGUES_CONFIG } from "@/src/data/sports-leagues-config";
import { getSportsCitySlugs, SPORTS_TEAMS_CONFIG } from "@/src/data/sports-teams-config";
import { SPORTS_VENUES_CONFIG } from "@/src/data/sports-venues-config";
import { VEGAS_HOTELS_CONFIG } from "@/src/data/vegas-hotels-config";
import { evaluateCityPublishability } from "@/src/lib/sitemap/city-publishability";
import { evaluatePortPublishability } from "@/src/lib/sitemap/port-publishability";

type Region = { slug: string };

const BASE_URL = "https://destinationcommandcenter.com";

const REGIONS: Region[] = [
  { slug: "alaska" },
  { slug: "australia" },
  { slug: "bahamas" },
  { slug: "canada" },
  { slug: "denmark" },
  { slug: "florida" },
  { slug: "italy" },
  { slug: "mexico" },
  { slug: "puerto-rico" },
  { slug: "spain" },
  { slug: "texas" },
  { slug: "united-kingdom" },
];

function toAbsolute(pathname: string): string {
  return `${BASE_URL}${pathname}`;
}

function buildPublishableCityUrls(): string[] {
  const urls: string[] = [];
  for (const [cityKey, config] of Object.entries(CITY_AUTHORITY_CONFIG)) {
    const evalResult = evaluateCityPublishability(cityKey, config);
    if (!evalResult.root.included) continue;
    urls.push(`/${cityKey}`);
    if (evalResult.routes.tours.included) urls.push(`/${cityKey}/tours`);
    if (evalResult.routes.shows.included) urls.push(`/${cityKey}/shows`);
    if (evalResult.routes.attractions.included) urls.push(`/${cityKey}/attractions`);
    if (evalResult.routes["day-trips"].included) urls.push(`/${cityKey}/day-trips`);
    if (evalResult.routes.helicopter.included) urls.push(`/${cityKey}/helicopter`);
  }
  return urls;
}

function buildPublishablePortUrls(): string[] {
  return Object.entries(PORT_AUTHORITY_CONFIG)
    .filter(([slug, config]) => evaluatePortPublishability(slug, config).root.included)
    .map(([slug]) => `/ports/${slug}`);
}

function buildPublishableCruisePortUrls(): string[] {
  const publishableCruisePortSlugs = new Set(
    Object.entries(PORT_AUTHORITY_CONFIG)
      .filter(([slug, config]) => evaluatePortPublishability(slug, config).cruiseRoute.included)
      .map(([, config]) => config.canonicalCruisePortSlug as string)
  );

  return listCruiseCanonicalPortSlugs()
    .filter((slug) => publishableCruisePortSlugs.has(slug))
    .map((slug) => `/cruises/port/${slug}`);
}

function buildCityLastModifiedMap(): Map<string, Date> {
  const map = new Map<string, Date>();
  for (const [city, cfg] of Object.entries(CITY_AUTHORITY_CONFIG)) {
    const dt = new Date(cfg.updatedAt);
    if (!Number.isNaN(dt.getTime())) map.set(city, dt);
  }
  return map;
}

function buildNationalParkLastModifiedMap(): Map<string, Date> {
  const map = new Map<string, Date>();
  for (const [slug, cfg] of Object.entries(NATIONAL_PARKS_AUTHORITY_CONFIG)) {
    const dt = new Date(cfg.updatedAt);
    if (!Number.isNaN(dt.getTime())) map.set(slug, dt);
  }
  return map;
}

function buildCruiseSpecialtyLastModifiedMap(): Map<string, Date> {
  const map = new Map<string, Date>();
  for (const lane of CRUISE_SPECIALTY_LANES) {
    const dt = new Date(lane.updatedAt);
    if (!Number.isNaN(dt.getTime())) {
      map.set(lane.key, dt);
    }
  }
  return map;
}

function buildSportsVenueLastModifiedMap(): Map<string, Date> {
  const map = new Map<string, Date>();
  for (const venue of SPORTS_VENUES_CONFIG) {
    const dt = new Date(venue.updatedAt);
    if (!Number.isNaN(dt.getTime())) {
      map.set(venue.slug, dt);
    }
  }
  return map;
}

function buildPortLastModifiedMaps(): {
  portLastModified: Map<string, Date>;
  cruisePortLastModified: Map<string, Date>;
} {
  const portLastModified = new Map<string, Date>();
  const cruisePortLastModified = new Map<string, Date>();
  for (const [slug, cfg] of Object.entries(PORT_AUTHORITY_CONFIG)) {
    const dt = new Date(cfg.updatedAt);
    if (Number.isNaN(dt.getTime())) continue;
    const evalResult = evaluatePortPublishability(slug, cfg);
    if (evalResult.root.included) portLastModified.set(slug, dt);
    if (evalResult.cruiseRoute.included && cfg.canonicalCruisePortSlug) {
      cruisePortLastModified.set(cfg.canonicalCruisePortSlug, dt);
    }
  }
  return { portLastModified, cruisePortLastModified };
}

function readCruiseLastModified(): Date | null {
  const cachePath = path.join(process.cwd(), "data", "action", "cruise.sailings.cache.json");
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath, "utf8")) as { generated_at?: string };
    const dt = typeof raw.generated_at === "string" ? new Date(raw.generated_at) : null;
    if (!dt || Number.isNaN(dt.getTime())) return null;
    return dt;
  } catch {
    return null;
  }
}

function rankPath(
  pathname: string,
  citySlugs: string[]
): {
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
} {
  if (pathname === "/") return { priority: 1, changeFrequency: "weekly" };

  const highPriorityRoots = new Set([
    "/cruises",
    "/national-parks",
    "/alaska",
    "/authority",
    "/tours",
    "/ports",
    "/cities",
  ]);
  if (highPriorityRoots.has(pathname)) return { priority: 0.95, changeFrequency: "weekly" };

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 1 && citySlugs.includes(parts[0])) {
    if (parts.length === 1) return { priority: 0.9, changeFrequency: "weekly" };
    return { priority: 0.8, changeFrequency: "weekly" };
  }

  if (pathname.startsWith("/cruises/port/") || pathname.startsWith("/cruises/ship/")) {
    return { priority: 0.7, changeFrequency: "monthly" };
  }

  if (pathname.startsWith("/cruises/themed/")) {
    return { priority: 0.7, changeFrequency: "monthly" };
  }

  if (pathname.startsWith("/ports/") || pathname.startsWith("/regions/")) {
    return { priority: 0.6, changeFrequency: "monthly" };
  }

  if (pathname.startsWith("/sports/game/")) {
    return { priority: 0.65, changeFrequency: "daily" };
  }

  return { priority: 0.5, changeFrequency: "monthly" };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const citySlugs = Object.keys(CITY_AUTHORITY_CONFIG).sort();
  const cityLastModified = buildCityLastModifiedMap();
  const nationalParkLastModified = buildNationalParkLastModifiedMap();
  const cruiseSpecialtyLastModified = buildCruiseSpecialtyLastModifiedMap();
  const sportsVenueLastModified = buildSportsVenueLastModifiedMap();
  const { portLastModified, cruisePortLastModified } = buildPortLastModifiedMaps();
  const cruiseLastModified = readCruiseLastModified();
  const regionUrls = REGIONS.map((r) => `/regions/${r.slug}`);
  const cruiseShipUrls = listCruiseShipSlugs().map((slug) => `/cruises/ship/${slug}`);
  const cruiseSpecialtyUrls = CRUISE_SPECIALTY_LANES.map((lane) => `/cruises/themed/${lane.key}`);
  const sportsLeagueUrls = SPORTS_LEAGUES_CONFIG.map((league) => `/sports/${league.slug}`);
  const sportsCityUrls = getSportsCitySlugs().map((city) => `/${city}/sports`);
  const sportsTeamUrls = SPORTS_TEAMS_CONFIG.map((team) => `/sports/team/${team.slug}`);
  const nationalParkUrls = Object.keys(NATIONAL_PARKS_AUTHORITY_CONFIG).map((slug) => `/national-parks/${slug}`);
  const sportsVenueUrls = SPORTS_VENUES_CONFIG.map((venue) => `/venues/${venue.slug}`);
  const hotelUrls = VEGAS_HOTELS_CONFIG.map((hotel) => `/hotel/${hotel.slug}`);

  const staticPaths = [
    "/",
    "/mighty-argo-shuttle",
    "/mighty-argo",
    "/vegas",
    "/las-vegas/hotels",
    "/fremont-street",
    "/grand-canyon",
    "/henderson-las-vegas",
    "/hoover-dam",
    "/pet-friendly/las-vegas",
    "/kid-friendly/las-vegas",
    "/lake-mead",
    "/las-vegas-arts-district",
    "/las-vegas-chinatown",
    "/las-vegas-strip",
    "/red-rock-canyon",
    "/valley-of-fire",
    "/helicopter-tours",
    "/new-orleans",
    "/miami",
    "/orlando",
    "/nashville",
    "/alaska",
    "/cruises",
    "/summerlin",
    "/tours",
    "/ports",
    "/authority",
    "/national-parks",
    "/snowmobiling",
    "/cities",
    "/usa",
  ];

  const allPaths = [
    ...staticPaths,
    ...buildPublishableCityUrls(),
    ...buildPublishablePortUrls(),
    ...buildPublishableCruisePortUrls(),
    ...nationalParkUrls,
    ...regionUrls,
    ...cruiseShipUrls,
    ...cruiseSpecialtyUrls,
    ...sportsLeagueUrls,
    ...sportsCityUrls,
    ...sportsTeamUrls,
    ...sportsVenueUrls,
    ...hotelUrls,
    "/data/sports-teams.json",
    "/data/sports-venues.json",
    "/data/sports-cities.json",
  ];

  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];
  for (const p of allPaths) {
    const key = p.replace(/\/+$/, "") || "/";
    if (seen.has(key)) continue;
    seen.add(key);

    const parts = key.split("/").filter(Boolean);
    const citySlug = parts.length > 0 && citySlugs.includes(parts[0]) ? parts[0] : null;
    const nationalParkSlug = key.startsWith("/national-parks/") ? parts[1] || null : null;
    const portSlug = key.startsWith("/ports/") ? parts[1] || null : null;
    const cruisePortSlug = key.startsWith("/cruises/port/") ? parts[2] || null : null;
    const cruiseSpecialtySlug = key.startsWith("/cruises/themed/") ? parts[2] || null : null;
    const sportsVenueSlug = key.startsWith("/venues/") ? parts[1] || null : null;
    const { priority, changeFrequency } = rankPath(key, citySlugs);
    const isCruisePath = key === "/cruises" || key.startsWith("/cruises/ship/");

    entries.push({
      url: toAbsolute(key),
      lastModified: citySlug
        ? cityLastModified.get(citySlug) || now
        : nationalParkSlug
          ? nationalParkLastModified.get(nationalParkSlug) || now
        : portSlug
          ? portLastModified.get(portSlug) || now
          : cruisePortSlug
            ? cruisePortLastModified.get(cruisePortSlug) || cruiseLastModified || now
            : cruiseSpecialtySlug
              ? cruiseSpecialtyLastModified.get(cruiseSpecialtySlug) || cruiseLastModified || now
            : sportsVenueSlug
              ? sportsVenueLastModified.get(sportsVenueSlug) || now
            : isCruisePath
              ? cruiseLastModified || now
              : now,
      priority,
      changeFrequency,
    });
  }

  return entries;
}
