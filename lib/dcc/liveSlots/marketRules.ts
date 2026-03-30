import type { MarketKey } from "./types";

export type MarketRule = {
  market: MarketKey;
  shortnameEnv: string;
  includeTitlePatterns: RegExp[];
  excludeTitlePatterns: RegExp[];
  normalizeType(title: string): string | null;
};

export const MARKET_RULES: Record<MarketKey, MarketRule> = {
  "new-orleans-swamp": {
    market: "new-orleans-swamp",
    shortnameEnv: "FAREHARBOR_SWAMP_SHORTNAME",
    includeTitlePatterns: [/\bswamp\b/i, /\bbayou\b/i, /\bairboat\b/i, /\bpontoon\b/i],
    excludeTitlePatterns: [/\bgift card\b/i, /\bfundraiser\b/i, /\bdonation\b/i, /\bmerch\b/i, /\blocal\b/i],
    normalizeType(title) {
      if (/\bsmall\b.*\bairboat\b|\bairboat\b.*\bsmall\b/i.test(title)) return "Small Airboat";
      if (/\blarge\b.*\bairboat\b|\bairboat\b.*\blarge\b/i.test(title)) return "Large Airboat";
      if (/\bpontoon\b/i.test(title)) return "Pontoon Boat";
      if (/\bflat\b|\bquiet\b|\beco\b/i.test(title)) return "Small / Quiet Boat";
      if (/\bswamp\b|\bbayou\b|\bairboat\b/i.test(title)) return "Swamp Tour";
      return null;
    },
  },
  "juneau-heli": {
    market: "juneau-heli",
    shortnameEnv: "FAREHARBOR_JUNEAU_SHORTNAME",
    includeTitlePatterns: [/\bhelicopter\b/i, /\bheli\b/i],
    excludeTitlePatterns: [/\bgift card\b/i, /\bfundraiser\b/i, /\bdonation\b/i, /\blocal\b/i, /\bshuttle\b/i],
    normalizeType(title) {
      if (/\bdog.?sled\b/i.test(title)) return "Dog Sled + Helicopter";
      if (/\bglacier\b.*\blanding\b|\blanding\b.*\bglacier\b/i.test(title)) return "Glacier Landing";
      if (/\bicefield\b/i.test(title)) return "Icefield Explorer";
      if (/\bwalk\b/i.test(title)) return "Helicopter + Glacier Walk";
      if (/\bhelicopter\b|\bheli\b/i.test(title)) return "Helicopter Tour";
      return null;
    },
  },
};

export function getMarketShortname(market: MarketKey) {
  const envName = MARKET_RULES[market].shortnameEnv;
  return String(process.env[envName] || "").trim();
}
