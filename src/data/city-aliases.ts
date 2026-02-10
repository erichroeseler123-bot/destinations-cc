// src/data/city-aliases.ts
import aliases from "../../data/city-aliases.json";

type CityAliasMap = { [key: string]: string };

export function getNodeSlugFromCity(cityParam: string | undefined | null): string | null {
  // Defensive check for Next.js 16 async params
  if (!cityParam) return null;

  const key = cityParam.trim().toLowerCase();
  const map = aliases as CityAliasMap;

  return map[key] ?? null;
}
