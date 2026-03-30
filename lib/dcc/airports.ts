import { US_AIRPORTS, type AirportAuthorityConfig } from "@/src/data/us-airports";

export type AirportView = AirportAuthorityConfig;

export function getEffectiveAirports(): AirportView[] {
  return [...US_AIRPORTS].sort((a, b) => a.name.localeCompare(b.name));
}

export function getAirportBySlug(slug: string): AirportView | null {
  return US_AIRPORTS.find((airport) => airport.slug === slug) || null;
}

export function getAirportSlugs(): string[] {
  return US_AIRPORTS.map((airport) => airport.slug);
}

export function getAirportsByCitySlug(citySlug: string): AirportView[] {
  return US_AIRPORTS.filter((airport) => airport.citySlug === citySlug);
}

export function getAirportsByPortSlug(portSlug: string): AirportView[] {
  return US_AIRPORTS.filter(
    (airport) =>
      airport.nearbyPortSlugs?.includes(portSlug) ||
      airport.nearbyCruisePortSlugs?.includes(portSlug)
  );
}
