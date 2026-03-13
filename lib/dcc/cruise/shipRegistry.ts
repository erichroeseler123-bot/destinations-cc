import { slugify } from "@/lib/dcc/slug";

export type CruiseShipNode = {
  slug: string;
  name: string;
  lineSlug: string;
  lineName: string;
  aliases: string[];
  commonPortSlugs: string[];
  alaska: boolean;
};

export type CruiseShipMatch = {
  cruiseShip: string;
  cruiseShipSlug: string;
  lineSlug: string;
  lineName: string;
};

export const cruiseShips: CruiseShipNode[] = [
  {
    slug: "norwegian-bliss",
    name: "Norwegian Bliss",
    lineSlug: "norwegian-cruise-line",
    lineName: "Norwegian Cruise Line",
    aliases: ["ncl bliss", "bliss"],
    commonPortSlugs: ["juneau", "ketchikan", "skagway", "sitka"],
    alaska: true,
  },
  {
    slug: "carnival-jubilee",
    name: "Carnival Jubilee",
    lineSlug: "carnival-cruise-line",
    lineName: "Carnival Cruise Line",
    aliases: ["jubilee", "ccl jubilee"],
    commonPortSlugs: ["galveston", "cozumel", "costa-maya", "roatan"],
    alaska: false,
  },
  {
    slug: "icon-of-the-seas",
    name: "Icon of the Seas",
    lineSlug: "royal-caribbean-international",
    lineName: "Royal Caribbean International",
    aliases: ["icon", "rcl icon", "royal icon of the seas"],
    commonPortSlugs: ["miami", "coco-cay", "cozumel"],
    alaska: false,
  },
  {
    slug: "viking-octantis",
    name: "Viking Octantis",
    lineSlug: "viking-expeditions",
    lineName: "Viking Expeditions",
    aliases: ["octantis", "viking octantis expedition"],
    commonPortSlugs: ["seward", "sitka", "juneau", "ketchikan"],
    alaska: true,
  },
];

function normalizeShipLookupKey(input: string): string {
  return slugify(input || "").replace(/-/g, " ").trim();
}

const shipLookup = (() => {
  const map = new Map<string, CruiseShipNode>();
  for (const ship of cruiseShips) {
    map.set(normalizeShipLookupKey(ship.slug), ship);
    map.set(normalizeShipLookupKey(ship.name), ship);
    for (const alias of ship.aliases) {
      map.set(normalizeShipLookupKey(alias), ship);
    }
  }
  return map;
})();

export function matchCruiseShip(rawShip: string, rawShipSlug?: string): CruiseShipMatch | null {
  const slugKey = normalizeShipLookupKey(rawShipSlug || "");
  const nameKey = normalizeShipLookupKey(rawShip);
  const hit = shipLookup.get(slugKey) || shipLookup.get(nameKey);
  if (!hit) return null;
  return {
    cruiseShip: hit.name,
    cruiseShipSlug: hit.slug,
    lineSlug: hit.lineSlug,
    lineName: hit.lineName,
  };
}

export function isAlaskaCruisePortSlug(portSlug: string): boolean {
  const normalized = slugify(portSlug || "");
  if (!normalized) return false;
  return cruiseShips.some(
    (ship) => ship.alaska && ship.commonPortSlugs.some((port) => slugify(port) === normalized)
  );
}
