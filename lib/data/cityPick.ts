import { CityNode, getAllCities } from "./locations";

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function pickCitySlugByName(name: string): string | null {
  const cities = getAllCities();

  const exact = cities.find(c => norm(c.name) === norm(name));
  if (exact?.slug) return exact.slug;

  const includes = cities
    .filter(c => norm(c.name).includes(norm(name)))
    .sort((a, b) => (b.metrics?.population ?? 0) - (a.metrics?.population ?? 0))[0];

  return includes?.slug ?? null;
}

export function topCities(opts?: { country?: string; limit?: number }): CityNode[] {
  const cities = getAllCities().slice();
  const filtered = opts?.country
    ? cities.filter(c => c.admin?.country === opts.country)
    : cities;

  filtered.sort((a, b) => (b.metrics?.population ?? 0) - (a.metrics?.population ?? 0));
  return filtered.slice(0, opts?.limit ?? 24);
}
