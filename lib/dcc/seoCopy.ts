export function humanizeSlug(input: string): string {
  return input
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function buildCityClusterNarrative(cityName: string): string {
  return `${cityName} is easier to rank through specific trip-planning angles than through a single broad city query. The stronger pattern is to connect the city hub to named attractions, clear tour categories, and practical planning pages that match what travelers actually search before they book.`;
}

export function buildCategoryNarrative(cityName: string, title: string): string {
  return `${title} in ${cityName} works best as its own long-tail topic because it matches visitors who already know the kind of experience they want. That makes this page a cleaner organic target than a generic ${cityName} tours page, especially when it links into attractions and related tour types.`;
}

export function buildAttractionNarrative(cityName: string, attractionName: string): string {
  return `${attractionName} is the kind of named place that can win more qualified organic traffic than a broad city term, because searchers already know the landmark, district, or stop they care about. The page performs better when it explains what to do there, how it fits the day, and what related tours or nearby places to visit next.`;
}

export function buildLongTailKeywords(cityName: string, primary: string, supporting: string[] = []): string[] {
  const seeds = [
    `${primary} in ${cityName}`,
    `${primary} ${cityName}`,
    `best ${primary.toLowerCase()} in ${cityName}`,
    `things to do near ${primary} ${cityName}`,
    ...supporting.map((item) => `${cityName} ${item}`),
  ];

  return Array.from(new Set(seeds)).slice(0, 6);
}

export function buildAttractionCardDescription(cityName: string, attractionTitle: string): string {
  return `${attractionTitle} is one of the clearer planning anchors in ${cityName} and works best when paired with nearby attractions, tours, or a broader neighborhood route.`;
}
