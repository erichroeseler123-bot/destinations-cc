import alaskaShipsJson from "./alaska-ships.json";
import {
  buildViatorProductUrl,
  buildGetYourGuideProductUrl,
  buildAffiliateUrl,
  buildDccHandoffAffiliateUrl,
} from "./affiliate/links";
import { matchCatalogExcursion } from "./affiliate/catalog";

export interface VerifiedTourHighlight {
  title: string;
  durationHours: number;
  activityType: string;
  meetingLogistics: string;
  highlight: string;
  viatorProductUrl?: string;
}

export interface VerifiedPortLogistics {
  portSlug: "juneau" | "skagway" | "ketchikan" | "sitka" | "icy-strait-point";
  portName: string;
  portRegion: string;
  typicalDock: string;
  tenderRequired: boolean;
  typicalPortHours: string;
  recommendedBufferMinutes: number;
  maxTourDurationHours: number;
  dockLogisticsNotes: string;
  recommendedExcursionTypes: string[];
  sampleTours: VerifiedTourHighlight[];
}

export interface AlaskaCruiseShip {
  slug: string;
  name: string;
  cruiseLine: string;
  shipClass: string;
  passengerCapacity: number;
  debutYear: number;
  homeportOptions: string[];
  summaryDescription: string;
  ports: Record<string, VerifiedPortLogistics>;
}

// Product mapping to verified Viator product URLs in Last Frontier.
// Safeguards 1 & 2: Never map glacier helicopter dog sledding to wheeled dog-cart SKU 62390P4,
// and never map Bering Sea Crab Fishermen's Tour (Aleutian Ballad) to Allen Marine Misty Fjords SKU 472133P3.
const VIATOR_PRODUCT_MAPPINGS: Record<string, string> = {
  // Juneau
  "Mendenhall Glacier Helicopter Landing & Guided Ice Walk": "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK",
  "Mendenhall Glacier Helicopter Landing & Guided Walk": "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK",
  "Auke Bay Guaranteed Whale Watching Safari": "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
  "Auke Bay Whale Watching Safari": "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
  "Auke Bay Catamaran Whale Watch Expedition": "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
  "Auke Bay Catamaran Whale Watch Safari": "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
  "Auke Bay Catamaran Whale Watch": "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
  "Premier Whale Watching & Wildlife Exploration": "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
  "Family-Friendly Auke Bay Whale Watching Cruise": "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
  "Mendenhall Glacier Visitor Center & Rainforest Trail": "https://www.viator.com/tours/Juneau/Round-Trip-Mendenhall-Glacier-Shuttle-Service/d941-5857SHUTTLE",
  "Auke Bay Whale Watching & Mendenhall Glacier Combo": "https://www.viator.com/tours/Juneau/Mendenhall-Glacier-Waterfall-and-Whale-Watching-Tour/d941-466119P3",
  "Juneau Sled Dog Discovery & Musher's Camp": "https://www.viator.com/tours/Juneau/Sled-Dog-Discovery-in-Juneau/d941-62390P4",
  "Taku Glacier Lodge Seaplane Flight & Salmon Feast": "https://www.viator.com/tours/Juneau/Taku-Lodge-Feast-and-5-Glacier-Seaplane-Discovery/d941-110048P1",
  "Juneau Whale Watching with Traditional Alaskan Salmon Bake": "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",

  // Skagway
  "White Pass Scenic Railway Summit Excursion": "https://www.viator.com/tours/Skagway/Skagway-Shore-Excursion-White-Pass-Summit-and-Skagway-City-Tour/d943-5338PRTSGYCITY",
  "White Pass & Yukon Route Classic Train Tour": "https://www.viator.com/tours/Skagway/Skagway-Shore-Excursion-White-Pass-Summit-and-Skagway-City-Tour/d943-5338PRTSGYCITY",
  "White Pass Scenic Railway Journey": "https://www.viator.com/tours/Skagway/Skagway-Shore-Excursion-White-Pass-Summit-and-Skagway-City-Tour/d943-5338PRTSGYCITY",
  "White Pass Scenic Railroad Summit Pass": "https://www.viator.com/tours/Skagway/Skagway-Shore-Excursion-White-Pass-Summit-and-Skagway-City-Tour/d943-5338PRTSGYCITY",
  "White Pass Scenic Railway Summit Climb": "https://www.viator.com/tours/Skagway/Skagway-Shore-Excursion-White-Pass-Summit-and-Skagway-City-Tour/d943-5338PRTSGYCITY",
  "White Pass Summit Classic Train Ride": "https://www.viator.com/tours/Skagway/Skagway-Shore-Excursion-White-Pass-Summit-and-Skagway-City-Tour/d943-5338PRTSGYCITY",
  "White Pass Summit Rail Journey": "https://www.viator.com/tours/Skagway/Skagway-Shore-Excursion-White-Pass-Summit-and-Skagway-City-Tour/d943-5338PRTSGYCITY",
  "White Pass Scenic Railroad Summit Journey": "https://www.viator.com/tours/Skagway/Skagway-Shore-Excursion-White-Pass-Summit-and-Skagway-City-Tour/d943-5338PRTSGYCITY",
  "White Pass Scenic Railway Summit Tour": "https://www.viator.com/tours/Skagway/Skagway-Shore-Excursion-White-Pass-Summit-and-Skagway-City-Tour/d943-5338PRTSGYCITY",
  "Yukon Suspension Bridge & Klondike Highway Explorer": "https://www.viator.com/tours/Whitehorse/Skagway-Shore-Excursion-Full-Day-Tour-of-the-Yukon/d5420-5338PRTSGYFULL",
  "Historic Skagway Street Car & City Tour": "https://www.viator.com/tours/Skagway/Skagway-Historic-City-Tour-2-HRS/d943-10649P17",

  // Ketchikan
  "Misty Fjords National Monument Floatplane Safari": "https://www.viator.com/tours/Ketchikan/Ketchikan-Shore-Excursion-Misty-Fjords-National-Monument-Floatplane-Tour/d942-6459PRTKTNMISTY",
  "Misty Fjords Wilderness Floatplane Expedition": "https://www.viator.com/tours/Ketchikan/Ketchikan-Shore-Excursion-Misty-Fjords-National-Monument-Floatplane-Tour/d942-6459PRTKTNMISTY",
  "Misty Fjords National Monument Flightseeing": "https://www.viator.com/tours/Ketchikan/Ketchikan-Shore-Excursion-Misty-Fjords-National-Monument-Floatplane-Tour/d942-6459PRTKTNMISTY",
  "Misty Fjords National Monument Floatplane Adventure": "https://www.viator.com/tours/Ketchikan/Ketchikan-Shore-Excursion-Misty-Fjords-National-Monument-Floatplane-Tour/d942-6459PRTKTNMISTY",
  "Misty Fjords Wilderness Seaplane Flight": "https://www.viator.com/tours/Ketchikan/Ketchikan-Shore-Excursion-Misty-Fjords-National-Monument-Floatplane-Tour/d942-6459PRTKTNMISTY",
  "Misty Fjords Wilderness Cruise by High-Speed Catamaran": "https://www.viator.com/tours/Ketchikan/Misty-Fjords-and-Wilderness-Explorer/d942-472133P3",
  "Saxman Native Village & Cultural Totem Park": "https://www.viator.com/tours/Ketchikan/Saxman-Native-Village-Ketchikan-Highlights-and-Lumberjack-Show/d942-445368P5",
  "Great Alaskan Lumberjack Show & Totem Discovery": "https://www.viator.com/tours/Ketchikan/Saxman-Native-Village-Ketchikan-Highlights-and-Lumberjack-Show/d942-445368P5",

  // Sitka
  "Sitka Sound Wildlife Quest & Sea Otter Sanctuary": "https://www.viator.com/tours/Sitka/Whale-Watch-and-Sea-Otter-Quest/d4153-472133P4",
  "Fortress of the Bear & Alaska Raptor Center Tour": "https://www.viator.com/tours/Sitka/Simply-Amazing-Sitka-Tour/d4153-64781P20",

  // Icy Strait Point
  "Point Adolphus Guaranteed Whale Watching Safari": "https://www.viator.com/tours/Hoonah/Whale-Watch-Adventure/d26215-14707P1",
};

// Held commercial SKUs (e.g., Aleutian Ballad / t598272) remain empty until explicit owner portal sign-off.
const GETYOURGUIDE_PRODUCT_MAPPINGS: Record<
  string,
  { url: string; productCode: string }
> = {};

const SPECIALIST_AVIATION_HANDOFF_PATHS: Record<string, string> = {
  "Mendenhall Glacier Dog Sledding & Helicopter Flight": "/juneau-dogsled-helicopter-tours",
};

function extractViatorProductCodeFromUrl(viatorUrl: string): string | undefined {
  const m = /\/d\d+-([A-Za-z0-9_]+)(?:[/?#]|$)/.exec(viatorUrl);
  return m ? m[1] : undefined;
}

export const ALASKA_SHIPS_FLEET: Record<string, AlaskaCruiseShip> = alaskaShipsJson as unknown as Record<string, AlaskaCruiseShip>;

export function getShipBySlug(slug: string): AlaskaCruiseShip | undefined {
  return ALASKA_SHIPS_FLEET[slug];
}

export function getAllAlaskaShips(): AlaskaCruiseShip[] {
  return Object.values(ALASKA_SHIPS_FLEET);
}

export function getShipPortPair(shipSlug: string, portSlug: string): { ship: AlaskaCruiseShip; port: VerifiedPortLogistics } | undefined {
  const ship = ALASKA_SHIPS_FLEET[shipSlug];
  if (!ship) return undefined;
  const normalizedKey = portSlug.replace(/-shore-excursions$/, "");
  const port = ship.ports[normalizedKey] || ship.ports[portSlug];
  if (!port) return undefined;
  return { ship, port };
}

export function getTrackedTourUrl(tourTitle: string, portName: string, shipSlug: string): string | null {
  const campaign = `ship-${shipSlug}-${portName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const specialistPath = SPECIALIST_AVIATION_HANDOFF_PATHS[tourTitle];
  if (specialistPath) {
    const url = new URL(`https://juneauflightdeck.com${specialistPath}`);
    url.searchParams.set("utm_source", "lastfrontiershoreexcursions.com");
    url.searchParams.set("utm_medium", "specialist_handoff");
    url.searchParams.set("utm_campaign", `last-frontier-${campaign}`);
    url.searchParams.set("ship", shipSlug);
    return url.toString();
  }

  const gygMatch = GETYOURGUIDE_PRODUCT_MAPPINGS[tourTitle];
  if (gygMatch) {
    const gygDestinationUrl = buildGetYourGuideProductUrl(gygMatch.url, campaign);
    return buildDccHandoffAffiliateUrl({
      source: "getyourguide",
      destinationUrl: gygDestinationUrl,
      productCode: gygMatch.productCode,
      campaign,
    });
  }

  const directUrl = VIATOR_PRODUCT_MAPPINGS[tourTitle];
  if (directUrl) {
    const viatorDestinationUrl = buildViatorProductUrl(directUrl, campaign);
    return buildDccHandoffAffiliateUrl({
      source: "viator",
      destinationUrl: viatorDestinationUrl,
      productCode: extractViatorProductCodeFromUrl(directUrl),
      campaign,
    });
  }

  // Safeguard 2: Never guess or fuzzy-match an unmapped excursion title to a different operator/activity.
  // Only match AFFILIATE_CATALOG when the canonical title matches explicitly.
  const exactCatalogItem = matchCatalogExcursion(portName, tourTitle, campaign);
  if (
    exactCatalogItem &&
    exactCatalogItem.isExactProduct &&
    exactCatalogItem.officialUrl &&
    exactCatalogItem.title.trim().toLowerCase() === tourTitle.trim().toLowerCase()
  ) {
    const affiliateDestinationUrl = buildAffiliateUrl(
      exactCatalogItem.source,
      exactCatalogItem.officialUrl,
      campaign,
      exactCatalogItem.title,
      exactCatalogItem.isExactProduct,
    );
    return buildDccHandoffAffiliateUrl({
      source: exactCatalogItem.source,
      destinationUrl: affiliateDestinationUrl,
      productCode: exactCatalogItem.productId || exactCatalogItem.activitySlug,
      campaign,
    });
  }

  return null;
}
