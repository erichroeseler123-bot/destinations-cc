import alaskaShipsJson from "./alaska-ships.json";
import { buildViatorProductUrl, buildViatorSearchUrl, buildAffiliateUrl } from "./affiliate/links";
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
  portSlug: "juneau" | "skagway" | "ketchikan" | "sitka" | "icy-strait-point" | "victoria-bc";
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

// Product mapping to verified Viator product URLs in Last Frontier
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
  "Mendenhall Glacier Dog Sledding & Musher's Camp": "https://www.viator.com/tours/Juneau/Sled-Dog-Discovery-in-Juneau/d941-62390P4",
  "Mendenhall Glacier Dog Sledding & Helicopter Flight": "https://www.viator.com/tours/Juneau/Sled-Dog-Discovery-in-Juneau/d941-62390P4",
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
  "Bering Sea Crab Fishermen’s Tour aboard the Aleutian Ballad": "https://www.viator.com/tours/Ketchikan/Misty-Fjords-and-Wilderness-Explorer/d942-472133P3",
  "Bering Sea Crab Fishermen’s Tour": "https://www.viator.com/tours/Ketchikan/Misty-Fjords-and-Wilderness-Explorer/d942-472133P3",

  // Sitka
  "Sitka Sound Wildlife Quest & Sea Otter Sanctuary": "https://www.viator.com/tours/Sitka/Whale-Watch-and-Sea-Otter-Quest/d4153-472133P4",
  "Fortress of the Bear & Alaska Raptor Center Tour": "https://www.viator.com/tours/Sitka/Simply-Amazing-Sitka-Tour/d4153-64781P20",

  // Icy Strait Point
  "Point Adolphus Guaranteed Whale Watching Safari": "https://www.viator.com/tours/Hoonah/Whale-Watch-Adventure/d26215-14707P1"
};

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

export function getTrackedTourUrl(tourTitle: string, portName: string, shipSlug: string): string {
  const campaign = `ship-${shipSlug}-${portName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const directUrl = VIATOR_PRODUCT_MAPPINGS[tourTitle];
  if (directUrl) {
    return buildViatorProductUrl(directUrl, campaign);
  }

  // If tour has a match in verified catalog
  const matched = matchCatalogExcursion(portName, tourTitle, campaign);
  if (matched && matched.isExactProduct && matched.officialUrl) {
    return buildAffiliateUrl(matched.source, matched.officialUrl, campaign, matched.title, matched.isExactProduct);
  }

  return buildViatorSearchUrl(`${portName} Alaska shore excursions`, campaign);
}