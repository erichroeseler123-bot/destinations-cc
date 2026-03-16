// src/data/city-aliases.ts
import aliases from "../../data/city-aliases.json";

type CityAliasMap = { [key: string]: string };

function normalizeCityParam(cityParam: string | undefined | null): string {
  return String(cityParam || "").trim().toLowerCase();
}

export function resolveCanonicalCityKey(cityParam: string | undefined | null): string {
  const key = normalizeCityParam(cityParam);
  if (!key) return "";

  const map = aliases as CityAliasMap;
  const nodeSlug = map[key];
  if (!nodeSlug) return key;

  return nodeSlug.endsWith("-guide") ? nodeSlug.slice(0, -"-guide".length) : key;
}

export function getNodeSlugFromCity(cityParam: string | undefined | null): string | null {
  const key = normalizeCityParam(cityParam);
  if (!key) return null;
  const map = aliases as CityAliasMap;

  return map[key] ?? null;
}
