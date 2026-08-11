export type Port = {
  slug: string;
  name: string;
  region: string;
  hook: string;
  bestFor: string[];
  searchTerms: string[];
  weatherBackup: string;
};

export const PORTS: Port[] = [
  {
    slug: "juneau",
    name: "Juneau",
    region: "Southeast Alaska",
    hook: "Glaciers, whale watching, flightseeing, and the easiest place to build one unforgettable Alaska day.",
    bestFor: ["Mendenhall Glacier", "whale watching", "helicopter flightseeing", "first-time Alaska visitors"],
    searchTerms: ["Juneau shore excursions", "Juneau whale watching", "Juneau glacier tours"],
    weatherBackup: "Keep a ground-based glacier or city option in reserve if aviation weather closes in.",
  },
  {
    slug: "skagway",
    name: "Skagway",
    region: "Inside Passage",
    hook: "Gold Rush history, White Pass scenery, rail, road trips, and mountain views built for a port day.",
    bestFor: ["White Pass", "rail tours", "Yukon scenery", "Gold Rush history"],
    searchTerms: ["Skagway shore excursions", "White Pass tours", "Skagway Yukon tours"],
    weatherBackup: "Choose history or a shorter scenic drive if visibility is poor at elevation.",
  },
  {
    slug: "ketchikan",
    name: "Ketchikan",
    region: "Southeast Alaska",
    hook: "Totem culture, wildlife, rainforest, fishing, and floatplane scenery close to port.",
    bestFor: ["Misty Fjords", "totem parks", "wildlife", "fishing"],
    searchTerms: ["Ketchikan shore excursions", "Misty Fjords tours", "Ketchikan wildlife tours"],
    weatherBackup: "Totem and cultural experiences make strong backups when flying or boating is weather-sensitive.",
  },
  {
    slug: "sitka",
    name: "Sitka",
    region: "Baranof Island",
    hook: "Wildlife, Russian-Alaska history, rainforest, and a less frantic port-day rhythm.",
    bestFor: ["wildlife", "raptor center", "history", "small-group tours"],
    searchTerms: ["Sitka shore excursions", "Sitka wildlife tours", "Sitka Alaska tours"],
    weatherBackup: "Stay close to town with history, culture, or wildlife-center options if marine weather deteriorates.",
  },
  {
    slug: "icy-strait-point",
    name: "Icy Strait Point",
    region: "Hoonah",
    hook: "Whales, bears, wilderness, and high-impact excursions without a big-city port feel.",
    bestFor: ["whale watching", "bear viewing", "zipline", "wilderness"],
    searchTerms: ["Icy Strait Point shore excursions", "Hoonah whale watching", "Icy Strait Point bear tours"],
    weatherBackup: "Keep a lower-commitment local or cultural option available if marine or wildlife conditions shift.",
  },
];

export function getPort(slug: string) {
  return PORTS.find((port) => port.slug === slug) ?? null;
}
