import { US_STATIONS, type StationAuthorityConfig, type StationSubtype } from "@/src/data/us-stations";

export type StationView = StationAuthorityConfig;

export function getEffectiveStations(): StationView[] {
  return [...US_STATIONS].sort((a, b) => a.name.localeCompare(b.name));
}

export function getStationBySlug(slug: string): StationView | null {
  return US_STATIONS.find((station) => station.slug === slug) || null;
}

export function getStationSlugs(): string[] {
  return US_STATIONS.map((station) => station.slug);
}

export function getStationSubtypeLabel(subtype: StationSubtype): string {
  return subtype === "train-station" ? "Train station" : "Bus station";
}

export function getStationsBySubtype(subtype: StationSubtype): StationView[] {
  return US_STATIONS.filter((station) => station.subtype === subtype);
}

export function getStationsByCitySlug(citySlug: string): StationView[] {
  return US_STATIONS.filter((station) => station.citySlug === citySlug);
}

export function getStationsByPortSlug(portSlug: string): StationView[] {
  return US_STATIONS.filter(
    (station) =>
      station.nearbyPortSlugs?.includes(portSlug) ||
      station.nearbyCruisePortSlugs?.includes(portSlug)
  );
}

export function getStationsByVenueSlug(venueSlug: string): StationView[] {
  return US_STATIONS.filter((station) => station.nearbyVenueSlugs?.includes(venueSlug));
}
