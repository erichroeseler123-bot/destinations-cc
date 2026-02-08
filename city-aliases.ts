export const CITY_ALIASES: Record<string, string> = {
  "las-vegas": "vegas-guide",
  vegas: "vegas-guide",
  lv: "vegas-guide",

  "new-orleans": "new-orleans-guide",
  neworleans: "new-orleans-guide",
  nola: "new-orleans-guide",
};

export function getNodeSlugFromCity(city: string) {
  return CITY_ALIASES[city.toLowerCase()] || null;
}

