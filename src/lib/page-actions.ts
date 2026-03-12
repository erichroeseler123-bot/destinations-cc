export type PageAction = {
  href: string;
  label: string;
  kind?: "internal" | "external";
};

export function buildMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildOfficialSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} official site`)}`;
}

