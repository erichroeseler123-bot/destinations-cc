// src/data/city-aliases.ts
import aliases from "../../data/city-aliases.json";

type CityAliasMap = { [key: string]: string };

function isStateQualifiedCitySlug(value: string): boolean {
  return /-[a-z]{2}$/.test(value);
}

function normalizeCityParam(cityParam: string | undefined | null): string {
  return String(cityParam || "").trim().toLowerCase();
}

export function resolveCanonicalCityKey(cityParam: string | undefined | null): string {
  const key = normalizeCityParam(cityParam);
  if (!key) return "";

  const map = aliases as CityAliasMap;
  const nodeSlug = map[key];
  if (!nodeSlug) return key;

  if (!nodeSlug.endsWith("-guide")) return key;

  const stripped = nodeSlug.slice(0, -"-guide".length);
  if (stripped === key) return key;

  // Preserve simple public city slugs like "las-vegas", but normalize
  // state-qualified aliases such as "miami-fl" to the canonical city slug.
  return isStateQualifiedCitySlug(key) ? stripped : key;
}

export function getNodeSlugFromCity(cityParam: string | undefined | null): string | null {
  const key = normalizeCityParam(cityParam);
  if (!key) return null;
  const map = aliases as CityAliasMap;

  return map[key] ?? null;
}
