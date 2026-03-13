import attractionsMap from "@/data/attractions.json";

export type IntentItem = {
  title: string;
  description: string;
  query: string;
  badge?: string;
};

export function titleCase(s: string) {
  return s
    .split(/[\s-]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getCityIntents(cityKey: string): IntentItem[] | null {
  const key = (cityKey || "").toLowerCase().trim();
  const items = (attractionsMap as any)[key] as IntentItem[] | undefined;
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  return items;
}
