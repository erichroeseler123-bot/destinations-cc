import fs from "fs";
import path from "path";
import {
  canonicalCoordinate,
  coordinateKey,
  DISCOVERABLE_LOCATIONS,
  getDiscoverableLocation,
} from "@/lib/dcc/locationDiscovery";
import {
  DESTINATION_REGISTRY,
  getDestination,
  listDestinationKeys,
} from "@/lib/dcc/destinations/index";
import type { DestinationRecord } from "@/lib/dcc/destinations/schema";
import {
  getNodeById,
  getNodeBySlug,
  loadByIdIndex,
} from "@/lib/dcc/registry";
import { getAllCities, type CityNode } from "@/lib/data/locations";
import { CITIES_REGISTRY, getCityRegistryNode } from "@/src/data/cities-registry";
import { OctoProduct, DccExternalProviderIds } from "@/lib/octo/types";

export type { DccExternalProviderIds };

export type DccPlaceType =
  | "city"
  | "venue"
  | "airport"
  | "cruise_port"
  | "resort"
  | "island"
  | "attraction"
  | "region";

export interface DccPlaceAdmin {
  country: string;
  countryCode: string;
  region?: string;
  regionCode?: string;
  city?: string;
  destinationSlug?: string;
}

export interface DccRelatedPlace {
  placeId: string;
  name: string;
  slug: string;
  placeType?: DccPlaceType;
  relationship: string; // "near_place_geo", "child_of", "parent_of", "gateway_port", "airport_hub", "corridor_stop"
  distanceKm?: number;
}

export interface DccMeetingPoint {
  id: string;
  name: string;
  type?: "pickup" | "meeting" | "departure" | "terminal";
  coordinates?: { lat: number; lng: number };
  address?: string;
  description?: string;
}

export interface DccOperatorServiceArea {
  primaryPlaceId: string;
  servedPlaceIds: string[];
  radiusKm?: number;
  corridors?: string[];
}

export interface CanonicalDccPlace {
  placeId: string;
  name: string;
  slug: string;
  aliases: string[];
  placeType: DccPlaceType;
  coordinates: { lat: number; lng: number };
  admin: DccPlaceAdmin;
  hierarchy: {
    parentPlaceId?: string;
    parentIds?: string[];
    childIds?: string[];
  };
  relatedPlaces: DccRelatedPlace[];
  serviceArea: DccOperatorServiceArea;
  meetingPoints: DccMeetingPoint[];
  providers: DccExternalProviderIds;
  tags?: string[];
  metadata?: {
    qualityScore?: number;
    sourceDataset?: string;
    updatedAt?: string;
  };
}

export interface DccPlaceProductAssociation {
  product: OctoProduct;
  commercialStatus: "bookable" | "directory_only";
  supplier: {
    connectionId?: string;
    operatorName: string;
    operatorSlug?: string;
    providerType: string;
    connectionStatus: string;
    onboardingStage: string;
    isAuthorized: boolean;
  };
  associationType: "primary_place" | "service_area" | "proximity" | "corridor";
  distanceKm?: number;
  reason?: string;
  meetingPointMatch?: DccMeetingPoint;
}

export type PlaceQuery = {
  placeId?: string;
  slug?: string;
  destinationSlug?: string;
  coordinates?: { lat: number; lng: number };
  maxRadiusKm?: number;
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lon2 - lon1) * Math.PI) / 180;
  const a1 = (lat1 * Math.PI) / 180;
  const a2 = (lat2 * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a1) * Math.cos(a2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

export class DccCanonicalPlaceService {
  private static placesById = new Map<string, CanonicalDccPlace>();
  private static placesBySlug = new Map<string, CanonicalDccPlace>();
  private static placesByCoordKey = new Map<string, CanonicalDccPlace>();
  private static placesByDestination = new Map<string, CanonicalDccPlace>();
  private static graphIndexByPlaceId = new Map<string, string>();
  private static allPlacesList: CanonicalDccPlace[] = [];
  private static isInitialized = false;

  /**
   * Initializes the unified Canonical DCC Place Registry in memory.
   * Merges:
   * 1. Backbone registry (data/registry/place, port, venue)
   * 2. Curated destinations (data/destinations/)
   * 3. City nodes (data/nodes/locations.jsonl)
   * 4. Place graph relationships (data/graph/by-place/)
   * 5. Curated discoverable coordinates (DISCOVERABLE_LOCATIONS)
   * 6. City rollout registry (CITIES_REGISTRY)
   */
  public static initialize(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      this.loadBackboneRegistry();
      this.loadDiscoverableLocations();
      this.loadDestinations();
      this.loadLocationsJsonl();
      this.loadCityVenues();
      this.loadGraphRelationships();
      this.enrichWellKnownMeetingPoints();
      this.enrichServiceAreas();

      this.allPlacesList = Array.from(this.placesById.values());
    } catch (err: any) {
      console.error("Failed to initialize DccCanonicalPlaceService:", err.message);
    }
  }

  private static ensureInitialized(): void {
    if (!this.isInitialized) {
      this.initialize();
    }
  }

  /**
   * 1. Load places, ports, and venues from data/index/by-id.json via lib/dcc/registry
   */
  private static loadBackboneRegistry(): void {
    try {
      const byIdIndex = loadByIdIndex();
      const fileCache = new Map<string, string[]>();
      for (const [id, ptr] of Object.entries(byIdIndex)) {
        if (!ptr.file || !ptr.line) continue;

        try {
          let lines = fileCache.get(ptr.file);
          if (!lines) {
            const fullPath = path.resolve(process.cwd(), ptr.file);
            if (!fs.existsSync(fullPath)) continue;
            lines = fs.readFileSync(fullPath, "utf8").split("\n");
            fileCache.set(ptr.file, lines);
          }
          const raw = lines[ptr.line - 1];
          if (!raw || !raw.trim()) continue;
          const node = JSON.parse(raw);
          if (!node) continue;

          const lat = node.geo?.lat ?? null;
          const lon = node.geo?.lon ?? null;

          let placeType: DccPlaceType = "city";
          if (node.class === "port") {
            placeType = "cruise_port";
          } else if (node.class === "venue") {
            placeType = "venue";
          } else if (node.subclass === "island") {
            placeType = "island";
          } else if (node.subclass === "resort") {
            placeType = "resort";
          } else if (node.subclass === "airport") {
            placeType = "airport";
          } else if (node.subclass === "attraction") {
            placeType = "attraction";
          } else if (node.subclass === "region") {
            placeType = "region";
          }

          const coordinates =
            lat != null && lon != null
              ? { lat, lng: lon }
              : { lat: 0, lng: 0 };

          const parentIds = node.hierarchy?.parent_ids || [];
          const parentPlaceId = parentIds.length > 0 ? parentIds[0] : undefined;

          const place: CanonicalDccPlace = {
            placeId: node.id,
            name: node.name || node.display_name || node.slug,
            slug: node.slug,
            aliases: node.aliases || [node.slug],
            placeType,
            coordinates,
            admin: {
              country: node.admin?.country_name || node.admin?.country_code || "US",
              countryCode: node.admin?.country_code || "US",
              region: node.admin?.admin1_name || undefined,
              regionCode: node.admin?.admin1_code || undefined,
              city: node.admin?.locality || undefined,
            },
            hierarchy: {
              parentPlaceId,
              parentIds,
              childIds: node.hierarchy?.child_ids || [],
            },
            relatedPlaces: [],
            serviceArea: {
              primaryPlaceId: node.id,
              servedPlaceIds: [node.id],
              radiusKm: 80,
            },
            meetingPoints: [],
            providers: {},
            tags: node.tags || [],
            metadata: {
              qualityScore: 90,
              sourceDataset: "registry",
              updatedAt: node.meta?.updated_at || undefined,
            },
          };

          this.indexPlace(place);
        } catch {
          // ignore single-line parse failures
        }
      }
    } catch (err: any) {
      console.warn("Could not read byIdIndex in loadBackboneRegistry:", err.message);
    }
  }

  /**
   * 2. Curated Discoverable Locations with canonical 5-decimal coordinates
   */
  private static loadDiscoverableLocations(): void {
    for (const loc of DISCOVERABLE_LOCATIONS) {
      const coordK = coordinateKey(loc.lat, loc.lng);
      const parts = loc.name.split(",").map((s) => s.trim());
      const baseName = parts[0];
      const stateOrCountry = parts.length > 1 ? parts[1] : undefined;
      const slug = baseName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

      // Check if place already exists
      let place =
        this.placesByCoordKey.get(coordK) ||
        this.placesBySlug.get(slug) ||
        this.placesBySlug.get(`${slug}-${(stateOrCountry || "").toLowerCase()}`);

      if (!place) {
        const lowerName = baseName.toLowerCase();
        for (const existing of this.placesById.values()) {
          if (
            existing.name.toLowerCase() === lowerName ||
            existing.slug === `${slug}-${(stateOrCountry || "").toLowerCase()}` ||
            existing.slug.startsWith(`${slug}-`)
          ) {
            place = existing;
            break;
          }
        }
      }

      if (!place) {
        let placeType: DccPlaceType = "city";
        if (loc.type === "port") placeType = "cruise_port";
        else if (loc.type === "venue") placeType = "venue";
        else if (loc.type === "resort") placeType = "resort";
        else if (loc.type === "island") placeType = "island";

        const placeId =
          slug === "red-rocks-amphitheatre" || slug === "red-rocks"
            ? "dcc:venue:us-co-morrison-red-rocks:0001"
            : `dcc:place:${slug}:0001`;

        place = {
          placeId,
          name: baseName,
          slug,
          aliases: [slug, `${slug}-${(stateOrCountry || "").toLowerCase()}`],
          placeType,
          coordinates: { lat: loc.lat, lng: loc.lng },
          admin: {
            country: "United States",
            countryCode: "US",
            region: stateOrCountry,
            city: baseName,
          },
          hierarchy: {},
          relatedPlaces: [],
          serviceArea: {
            primaryPlaceId: placeId,
            servedPlaceIds: [placeId],
            radiusKm: 80,
          },
          meetingPoints: [],
          providers: {},
          metadata: {
            qualityScore: loc.qualityScore,
            sourceDataset: "discoverable",
          },
        };
        this.indexPlace(place);
      } else {
        // Update coordinates to canonical coordinate if needed
        place.coordinates = { lat: loc.lat, lng: loc.lng };
        this.placesByCoordKey.set(coordK, place);
        if (!place.aliases.includes(slug)) {
          place.aliases.push(slug);
          this.placesBySlug.set(slug, place);
        }
      }
    }
  }

  /**
   * 3. Load Destinations from data/destinations/
   */
  private static loadDestinations(): void {
    const destKeys = listDestinationKeys();
    for (const slug of destKeys) {
      const dest = getDestination(slug);
      if (!dest) continue;

      let place =
        this.placesBySlug.get(slug) ||
        this.placesByDestination.get(slug);

      if (!place) {
        for (const alias of dest.aliases || []) {
          place = this.placesBySlug.get(alias);
          if (place) break;
        }
      }

      if (!place) {
        const lowerDisplay = (dest.display_name || dest.name || "").toLowerCase();
        for (const existing of this.placesById.values()) {
          if (
            existing.name.toLowerCase() === lowerDisplay ||
            existing.slug === `${slug}-ak` ||
            existing.slug === `${slug}-co` ||
            existing.slug === `${slug}-nv` ||
            existing.slug === `${slug}-la` ||
            existing.slug === `${slug}-fl` ||
            existing.slug.startsWith(`${slug}-`)
          ) {
            place = existing;
            break;
          }
        }
      }

      if (place) {
        place.admin.destinationSlug = dest.slug;
        if (!place.aliases.includes(dest.slug)) {
          place.aliases.push(dest.slug);
          this.placesBySlug.set(dest.slug, place);
        }
        for (const alias of dest.aliases || []) {
          if (!place.aliases.includes(alias)) {
            place.aliases.push(alias);
            this.placesBySlug.set(alias, place);
          }
        }
        // Preserve external provider IDs separately
        if (dest.providers?.viator_destination_id != null) {
          place.providers.viatorDestinationId = dest.providers.viator_destination_id;
        }
        if (dest.providers?.fareharbor_shortname != null) {
          place.providers.fareharborShortname = dest.providers.fareharbor_shortname;
        }
        if (dest.providers?.rezdy_location != null) {
          place.providers.rezdyLocation = dest.providers.rezdy_location;
        }
        this.placesByDestination.set(slug, place);
      }
    }
  }

  /**
   * 4. Load city nodes from data/nodes/locations.jsonl
   */
  private static loadLocationsJsonl(): void {
    try {
      const cities = getAllCities();
      for (const city of cities) {
        if (!city.geo?.lat || !city.geo?.lon) continue;

        let place =
          this.placesById.get(city.id) ||
          this.placesBySlug.get(city.slug);

        if (!place) {
          const coordK = coordinateKey(city.geo.lat, city.geo.lon);
          place = this.placesByCoordKey.get(coordK);
        }

        if (place) {
          // Cross-index city id
          if (city.id && !this.placesById.has(city.id)) {
            this.placesById.set(city.id, place);
          }
          if (city.slug && !place.aliases.includes(city.slug)) {
            place.aliases.push(city.slug);
            this.placesBySlug.set(city.slug, place);
          }
        } else {
          // Register city node
          const newPlace: CanonicalDccPlace = {
            placeId: city.id,
            name: city.name,
            slug: city.slug,
            aliases: [city.slug],
            placeType: "city",
            coordinates: { lat: city.geo.lat, lng: city.geo.lon },
            admin: {
              country: city.admin?.country || "US",
              countryCode: city.admin?.country || "US",
              regionCode: city.admin?.region_code,
              city: city.name,
            },
            hierarchy: {},
            relatedPlaces: [],
            serviceArea: {
              primaryPlaceId: city.id,
              servedPlaceIds: [city.id],
              radiusKm: 80,
            },
            meetingPoints: [],
            providers: {},
            tags: ["locations_jsonl"],
            metadata: {
              sourceDataset: "locations.jsonl",
            },
          };
          this.indexPlace(newPlace);
        }
      }
    } catch (err: any) {
      console.warn("Could not load locations.jsonl in DccCanonicalPlaceService:", err.message);
    }
  }

  /**
   * 4b. Load Curated Venues from data/cities/[city]/venues.json
   */
  private static loadCityVenues(): void {
    const citiesDir = path.join(process.cwd(), "data", "cities");
    if (!fs.existsSync(citiesDir)) return;

    try {
      const cityFolders = fs.readdirSync(citiesDir);
      for (const cityFolder of cityFolders) {
        const venuesPath = path.join(citiesDir, cityFolder, "venues.json");
        if (!fs.existsSync(venuesPath)) continue;

        try {
          const raw = fs.readFileSync(venuesPath, "utf-8");
          const data = JSON.parse(raw);
          const citySlug = data.city || cityFolder;
          const parentCityPlace =
            this.placesBySlug.get(citySlug) ||
            this.placesByDestination.get(citySlug);

          for (const v of data.venues || []) {
            if (!v.slug || v.lat == null || v.lng == null) continue;
            const venueSlug = v.slug;
            const placeId = `dcc:venue:${citySlug}-${venueSlug}:0001`;

            const aliases = [venueSlug];
            if (venueSlug.endsWith("-amphitheatre")) {
              aliases.push(venueSlug.replace("-amphitheatre", ""));
            }
            if (venueSlug.endsWith("-theater") || venueSlug.endsWith("-theatre")) {
              aliases.push(venueSlug.replace(/-theat(er|re)$/, ""));
            }

            const venuePlace: CanonicalDccPlace = {
              placeId,
              name: v.name,
              slug: venueSlug,
              aliases,
              placeType: "venue",
              coordinates: { lat: Number(v.lat), lng: Number(v.lng) },
              admin: {
                city: parentCityPlace?.name || citySlug,
                region: parentCityPlace?.admin.region,
                regionCode: parentCityPlace?.admin.regionCode,
                country: parentCityPlace?.admin.country || "US",
                countryCode: parentCityPlace?.admin.countryCode || "US",
              },
              hierarchy: {
                parentPlaceId: parentCityPlace?.placeId,
              },
              relatedPlaces: parentCityPlace
                ? [
                    {
                      placeId: parentCityPlace.placeId,
                      name: parentCityPlace.name,
                      slug: parentCityPlace.slug,
                      relationship: "parent_of",
                      placeType: parentCityPlace.placeType,
                    },
                  ]
                : [],
              serviceArea: {
                primaryPlaceId: placeId,
                servedPlaceIds: parentCityPlace ? [placeId, parentCityPlace.placeId] : [placeId],
                radiusKm: 35,
              },
              meetingPoints: [],
              providers: {},
              tags: [v.venue_type, v.category].filter(Boolean),
              metadata: {
                qualityScore: 85,
                sourceDataset: "city-venues",
              },
            };

            this.indexPlace(venuePlace);

            // Also register explicit well-known ID and aliases for Red Rocks
            if (venueSlug === "red-rocks-amphitheatre") {
              this.placesById.set("dcc:venue:us-co-morrison-red-rocks:0001", venuePlace);
              this.placesBySlug.set("red-rocks", venuePlace);
              this.placesBySlug.set("redrocks", venuePlace);
              if (parentCityPlace) {
                venuePlace.hierarchy.parentPlaceId = parentCityPlace.placeId;
              }
            }
          }
        } catch {
          // ignore single city venue parse failures
        }
      }
    } catch {
      // ignore
    }
  }

  /**
   * 5. Index graph relationships from data/graph/place-action-index.json
   */
  private static loadGraphRelationships(): void {
    try {
      const root = process.cwd();
      const indexPath = path.join(root, "data", "graph", "place-action-index.json");
      if (!fs.existsSync(indexPath)) return;

      const indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      const byPlaceId = indexData.by_place_id || {};

      for (const [placeId, relPath] of Object.entries<string>(byPlaceId)) {
        this.graphIndexByPlaceId.set(placeId, relPath);
      }
    } catch (err: any) {
      console.warn("Could not load graph index in DccCanonicalPlaceService:", err.message);
    }
  }

  /**
   * Populate graph relationships and edges for a place on-demand
   */
  public static populateGraphForPlace(place: CanonicalDccPlace): void {
    if (!place || place.relatedPlaces.length > 0) return;
    const relPath = this.graphIndexByPlaceId.get(place.placeId);
    if (!relPath) return;

    try {
      const root = process.cwd();
      const fullPath = path.join(root, relPath);
      if (!fs.existsSync(fullPath)) return;

      const graphData = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      const relatedPlaces = graphData.related_places || [];

      for (const rp of relatedPlaces) {
        if (!rp.place_id) continue;
        const alreadyHas = place.relatedPlaces.some((r) => r.placeId === rp.place_id);
        if (!alreadyHas) {
          place.relatedPlaces.push({
            placeId: rp.place_id,
            name: rp.place_name || rp.place_slug,
            slug: rp.place_slug,
            relationship: rp.reason || "near_place_geo",
            distanceKm: rp.distance_km,
          });
          if (!place.serviceArea.servedPlaceIds.includes(rp.place_id)) {
            place.serviceArea.servedPlaceIds.push(rp.place_id);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  /**
   * 6. Enrich well-known meeting points & departure terminals
   */
  private static enrichWellKnownMeetingPoints(): void {
    // Juneau City & Port
    const juneauCity = this.resolvePlaceById("dcc:place:us-ak-juneau-ak:0001");
    const juneauPort = this.resolvePlaceById("dcc:port:us-juneau:0001");

    const juneauMeetingPoints = [
      {
        id: "mp_jnu_auke_bay",
        name: "Auke Bay Harbor, Loading Float B",
        type: "departure" as const,
        coordinates: { lat: 58.3842, lng: -134.6528 },
        address: "11497 Auke Bay Harbor Rd, Juneau, AK 99801",
        description: "Primary marine departure dock for whale watching and glacier excursions",
      },
      {
        id: "mp_jnu_cruise_terminal",
        name: "Juneau Cruise Ship Terminal / Tramway Plaza",
        type: "pickup" as const,
        coordinates: { lat: 58.2975, lng: -134.4053 },
        address: "490 S Franklin St, Juneau, AK 99801",
        description: "Central downtown cruise passenger pickup and shuttle hub",
      },
    ];

    if (juneauCity) {
      juneauCity.meetingPoints = [...juneauMeetingPoints];
      juneauCity.admin.destinationSlug = "juneau";
      juneauCity.providers.viatorDestinationId = 941;
      this.placesByDestination.set("juneau", juneauCity);
      this.placesBySlug.set("juneau", juneauCity);
    }
    if (juneauPort) {
      juneauPort.meetingPoints = [...juneauMeetingPoints];
      juneauPort.admin.destinationSlug = "juneau";
      if (juneauCity) {
        juneauPort.hierarchy.parentPlaceId = juneauCity.placeId;
        if (!juneauCity.relatedPlaces.some((r) => r.placeId === juneauPort.placeId)) {
          juneauCity.relatedPlaces.push({
            placeId: juneauPort.placeId,
            name: juneauPort.name,
            slug: juneauPort.slug,
            relationship: "gateway_port",
            placeType: juneauPort.placeType,
          });
        }
      }
    }

    // Denver
    const denver = this.resolvePlaceById("dcc:place:us-co-denver-co:0001") || this.resolvePlaceBySlug("denver");
    if (denver && denver.meetingPoints.length === 0) {
      denver.meetingPoints = [
        {
          id: "mp_den_union_station",
          name: "Denver Union Station (Wynkoop Terminal)",
          type: "departure",
          coordinates: { lat: 39.7527, lng: -105.0008 },
          address: "1701 Wynkoop St, Denver, CO 80202",
          description: "Primary regional transit hub and shuttle departure point",
        },
        {
          id: "mp_den_sheraton",
          name: "Sheraton Denver Downtown (16th St Mall)",
          type: "pickup",
          coordinates: { lat: 39.7428, lng: -104.9892 },
          address: "1550 Court Pl, Denver, CO 80202",
          description: "Central hotel pickup location for mountain & concert shuttles",
        },
      ];
      denver.admin.destinationSlug = "denver";
    }

    // Red Rocks
    const redRocks = this.resolvePlaceBySlug("red-rocks");
    if (redRocks && redRocks.meetingPoints.length === 0) {
      redRocks.meetingPoints = [
        {
          id: "mp_rr_lower_south",
          name: "Lower South Lot Shuttle Drop-off",
          type: "terminal",
          coordinates: { lat: 39.6641, lng: -105.2031 },
          description: "Designated commercial shuttle and rideshare drop-off loop",
        },
        {
          id: "mp_rr_trading_post",
          name: "Red Rocks Trading Post Visitor Plaza",
          type: "meeting",
          coordinates: { lat: 39.6635, lng: -105.2065 },
          description: "Day visitor parking and tour meeting location",
        },
      ];
    }

    // St. Thomas
    const stThomas = this.resolvePlaceById("dcc:port:vi-st-thomas:0001") || this.resolvePlaceBySlug("st-thomas");
    if (stThomas && stThomas.meetingPoints.length === 0) {
      stThomas.coordinates = { lat: 18.3419, lng: -64.9307 };
      stThomas.meetingPoints = [
        {
          id: "mp_stt_havensight",
          name: "Havensight Cruise Pier (West Indian Company Dock)",
          type: "terminal",
          coordinates: { lat: 18.3344, lng: -64.9198 },
          description: "Main cruise ship dock terminal and shore excursion dispatch",
        },
        {
          id: "mp_stt_crown_bay",
          name: "Crown Bay Marina & Cruise Terminal",
          type: "terminal",
          coordinates: { lat: 18.3361, lng: -64.9492 },
          description: "Austin 'Babe' Monsanto Marine Terminal",
        },
      ];
      stThomas.admin.destinationSlug = "usvi";
    }
  }

  /**
   * 7. Enrich and link service areas across parent/child hierarchies and regional clusters
   */
  private static enrichServiceAreas(): void {
    const denver = this.resolvePlaceById("dcc:place:us-co-denver-co:0001");
    const redRocks =
      this.resolvePlaceById("dcc:venue:us-co-morrison-red-rocks:0001") ||
      this.resolvePlaceBySlug("red-rocks") ||
      this.resolvePlaceBySlug("red-rocks-amphitheatre");
    const boulder = this.resolvePlaceById("dcc:place:us-co-boulder-co:0001");

    if (denver && redRocks) {
      if (!denver.serviceArea.servedPlaceIds.includes(redRocks.placeId)) {
        denver.serviceArea.servedPlaceIds.push(redRocks.placeId);
      }
      if (!redRocks.serviceArea.servedPlaceIds.includes(denver.placeId)) {
        redRocks.serviceArea.servedPlaceIds.push(denver.placeId);
      }
      redRocks.hierarchy.parentPlaceId = denver.placeId;
    }

    if (denver && boulder) {
      if (!denver.serviceArea.servedPlaceIds.includes(boulder.placeId)) {
        denver.serviceArea.servedPlaceIds.push(boulder.placeId);
      }
    }

    const juneau = this.resolvePlaceById("dcc:place:us-ak-juneau-ak:0001");
    const skagway = this.resolvePlaceById("dcc:place:us-ak-skagway-ak:0001");
    const sitka = this.resolvePlaceById("dcc:place:us-ak-sitka-ak:0001");

    if (juneau) {
      if (skagway && !juneau.serviceArea.servedPlaceIds.includes(skagway.placeId)) {
        juneau.serviceArea.servedPlaceIds.push(skagway.placeId);
      }
      if (sitka && !juneau.serviceArea.servedPlaceIds.includes(sitka.placeId)) {
        juneau.serviceArea.servedPlaceIds.push(sitka.placeId);
      }
    }
  }

  private static indexPlace(place: CanonicalDccPlace): void {
    this.placesById.set(place.placeId, place);

    const shouldOverride = (existing?: CanonicalDccPlace) => {
      if (!existing) return true;
      // City takes priority over port/venue for primary slugs
      if (place.placeType === "city" && existing.placeType !== "city") return true;
      // Backbone place takes priority over secondary datasets
      if (place.placeId.startsWith("dcc:place:") && !existing.placeId.startsWith("dcc:place:")) return true;
      return false;
    };

    if (place.slug) {
      const lower = place.slug.toLowerCase();
      if (shouldOverride(this.placesBySlug.get(lower))) {
        this.placesBySlug.set(lower, place);
      }
    }

    for (const alias of place.aliases) {
      const lower = alias.toLowerCase();
      if (shouldOverride(this.placesBySlug.get(lower))) {
        this.placesBySlug.set(lower, place);
      }
    }

    if (place.coordinates.lat !== 0 || place.coordinates.lng !== 0) {
      const coordK = coordinateKey(place.coordinates.lat, place.coordinates.lng);
      if (shouldOverride(this.placesByCoordKey.get(coordK))) {
        this.placesByCoordKey.set(coordK, place);
      }
    }

    if (place.admin.destinationSlug) {
      const lower = place.admin.destinationSlug.toLowerCase();
      if (shouldOverride(this.placesByDestination.get(lower))) {
        this.placesByDestination.set(lower, place);
      }
    }
  }

  // ==========================================
  // Resolution APIs
  // ==========================================

  /**
   * Universal Place Resolver.
   * Resolves a canonical DCC place by ID, slug, destination slug, or coordinates.
   */
  public static resolvePlace(query: PlaceQuery): CanonicalDccPlace | null {
    this.ensureInitialized();

    if (query.placeId) {
      const match = this.resolvePlaceById(query.placeId);
      if (match) return match;
    }

    if (query.slug) {
      const match = this.resolvePlaceBySlug(query.slug);
      if (match) return match;
    }

    if (query.destinationSlug) {
      const match = this.resolvePlaceByDestinationSlug(query.destinationSlug);
      if (match) return match;
    }

    if (query.coordinates) {
      const match = this.resolvePlaceByCoordinates(
        query.coordinates.lat,
        query.coordinates.lng,
        query.maxRadiusKm
      );
      if (match) return match;
    }

    return null;
  }

  /**
   * Resolve place by DCC Place ID.
   */
  public static resolvePlaceById(placeId: string): CanonicalDccPlace | null {
    this.ensureInitialized();
    if (!placeId) return null;

    const direct = this.placesById.get(placeId);
    if (direct) {
      this.populateGraphForPlace(direct);
      return direct;
    }

    // Try fallback normalization
    const normalized = placeId.trim().toLowerCase();
    for (const [id, place] of this.placesById.entries()) {
      if (id.toLowerCase() === normalized) {
        this.populateGraphForPlace(place);
        return place;
      }
    }

    return null;
  }

  /**
   * Resolve place by slug or alias.
   */
  public static resolvePlaceBySlug(slug: string): CanonicalDccPlace | null {
    this.ensureInitialized();
    if (!slug) return null;

    const normalized = slug.trim().toLowerCase();
    const direct = this.placesBySlug.get(normalized);
    if (direct) {
      this.populateGraphForPlace(direct);
      return direct;
    }

    // Try destination key matching
    const destMatch = this.placesByDestination.get(normalized);
    if (destMatch) {
      this.populateGraphForPlace(destMatch);
      return destMatch;
    }

    return null;
  }

  /**
   * Resolve place by destination slug.
   */
  public static resolvePlaceByDestinationSlug(destinationSlug: string): CanonicalDccPlace | null {
    this.ensureInitialized();
    if (!destinationSlug) return null;

    const normalized = destinationSlug.trim().toLowerCase();
    const direct = this.placesByDestination.get(normalized);
    if (direct) {
      this.populateGraphForPlace(direct);
      return direct;
    }

    return this.resolvePlaceBySlug(normalized);
  }

  /**
   * Resolve closest canonical place by latitude and longitude.
   */
  public static resolvePlaceByCoordinates(
    lat: number,
    lng: number,
    maxRadiusKm = 80
  ): CanonicalDccPlace | null {
    this.ensureInitialized();
    if (typeof lat !== "number" || typeof lng !== "number") return null;

    // 1. Exact 5-decimal match
    const exactKey = coordinateKey(lat, lng);
    const exactMatch = this.placesByCoordKey.get(exactKey);
    if (exactMatch) {
      this.populateGraphForPlace(exactMatch);
      return exactMatch;
    }

    // 2. Discoverable location exact match
    const discoverable = getDiscoverableLocation(lat, lng);
    if (discoverable) {
      const discMatch = this.resolvePlaceBySlug(discoverable.name.split(",")[0]);
      if (discMatch) {
        this.populateGraphForPlace(discMatch);
        return discMatch;
      }
    }

    // 3. Nearest neighbor spatial lookup
    let closestPlace: CanonicalDccPlace | null = null;
    let minDistance = Infinity;

    for (const place of this.allPlacesList) {
      if (place.coordinates.lat === 0 && place.coordinates.lng === 0) continue;
      const d = haversineKm(lat, lng, place.coordinates.lat, place.coordinates.lng);
      if (d < minDistance && d <= maxRadiusKm) {
        minDistance = d;
        closestPlace = place;
      }
    }

    if (closestPlace) {
      this.populateGraphForPlace(closestPlace);
    }
    return closestPlace;
  }

  /**
   * Returns related places for a given place ID.
   */
  public static getRelatedPlaces(placeId: string): DccRelatedPlace[] {
    const place = this.resolvePlaceById(placeId);
    return place ? place.relatedPlaces : [];
  }

  /**
   * Returns all place IDs served by an operator based at placeId.
   */
  public static getPlacesInServiceArea(placeId: string, radiusKm = 100): string[] {
    const place = this.resolvePlaceById(placeId);
    if (!place) return [placeId];

    const result = new Set<string>(place.serviceArea.servedPlaceIds || [placeId]);

    // Also include all nearby places within radiusKm
    if (place.coordinates.lat !== 0 || place.coordinates.lng !== 0) {
      for (const other of this.allPlacesList) {
        if (other.placeId === place.placeId) continue;
        if (other.coordinates.lat === 0 && other.coordinates.lng === 0) continue;
        const d = haversineKm(
          place.coordinates.lat,
          place.coordinates.lng,
          other.coordinates.lat,
          other.coordinates.lng
        );
        if (d <= radiusKm) {
          result.add(other.placeId);
        }
      }
    }

    return Array.from(result);
  }

  /**
   * Attaches an OCTO product to a canonical DCC place.
   * Preserves external provider IDs separately.
   */
  public static attachProductToPlace(
    product: OctoProduct,
    placeId: string,
    options?: {
      pickupPoints?: DccMeetingPoint[];
      serviceArea?: DccOperatorServiceArea;
      providerExternalIds?: DccExternalProviderIds;
      customMeetingPoint?: string;
    }
  ): OctoProduct {
    const place = this.resolvePlaceById(placeId) || this.resolvePlaceBySlug(placeId);
    if (!place) {
      throw new Error(`Cannot attach product ${product.id}: DCC Place ${placeId} does not exist`);
    }

    const meetingPoints = options?.pickupPoints || place.meetingPoints;
    const serviceArea = options?.serviceArea || place.serviceArea;

    return {
      ...product,
      dccPlaceId: place.placeId,
      destinationSlug: place.admin.destinationSlug || place.slug,
      location: place.name,
      country: place.admin.countryCode,
      placeCoordinates: place.coordinates,
      meetingPoint:
        options?.customMeetingPoint ||
        product.meetingPoint ||
        (meetingPoints.length > 0 ? meetingPoints[0].name : undefined),
      pickupPoints: meetingPoints,
      serviceArea,
      providerExternalIds: {
        ...place.providers,
        ...product.providerExternalIds,
        ...options?.providerExternalIds,
      },
    };
  }

  /**
   * Reusable product-association search.
   * Matches products to places using:
   * 1. Primary place ID attachment
   * 2. Operator service area expansion
   * 3. Proximity
   * 4. Destination corridor
   */
  public static isProductServingPlace(
    product: OctoProduct,
    targetPlaceId: string,
    maxRadiusKm = 100
  ): {
    serves: boolean;
    associationType: "primary_place" | "service_area" | "proximity" | "corridor";
    distanceKm?: number;
  } {
    const targetPlace = this.resolvePlaceById(targetPlaceId) || this.resolvePlaceBySlug(targetPlaceId);
    if (!targetPlace) return { serves: false, associationType: "primary_place" };

    // 1. Direct Place ID Match
    if (product.dccPlaceId === targetPlace.placeId) {
      return { serves: true, associationType: "primary_place", distanceKm: 0 };
    }

    // 2. Operator Service Area Expansion (Product serves multiple places)
    if (product.serviceArea?.servedPlaceIds?.includes(targetPlace.placeId)) {
      let distanceKm: number | undefined;
      if (product.placeCoordinates && targetPlace.coordinates) {
        distanceKm = haversineKm(
          product.placeCoordinates.lat,
          product.placeCoordinates.lng,
          targetPlace.coordinates.lat,
          targetPlace.coordinates.lng
        );
      }
      return { serves: true, associationType: "service_area", distanceKm };
    }

    // 3. Destination Slug Match
    if (
      product.destinationSlug &&
      (product.destinationSlug === targetPlace.admin.destinationSlug ||
        product.destinationSlug === targetPlace.slug)
    ) {
      return { serves: true, associationType: "corridor" };
    }

    // 4. Proximity Match
    if (product.placeCoordinates && targetPlace.coordinates) {
      const d = haversineKm(
        product.placeCoordinates.lat,
        product.placeCoordinates.lng,
        targetPlace.coordinates.lat,
        targetPlace.coordinates.lng
      );
      const effectiveRadius = product.serviceArea?.radiusKm || maxRadiusKm;
      if (d <= effectiveRadius) {
        return { serves: true, associationType: "proximity", distanceKm: d };
      }
    }

    return { serves: false, associationType: "primary_place" };
  }

  /**
   * Commercial Gatekeeper:
   * A product CANNOT become bookable merely because it has a geographic association!
   * Live availability is shown ONLY for authorized, production-verified, healthy, bookable suppliers.
   */
  public static canBookProduct(
    productId: string,
    supplierConnection?: {
      connectionStatus?: string;
      onboardingStage?: string;
      healthStatus?: string;
      isSandbox?: boolean;
    }
  ): boolean {
    const isProd = process.env.NODE_ENV === "production";

    // 1. Production Mode Guardrail: Mock products can NEVER be booked in production
    if (isProd && (productId.startsWith("prod_alaska") || productId.includes("mock"))) {
      return false;
    }

    // 2. Explicit Unverified Operator Block
    if (
      productId.includes("vibe") ||
      productId.includes("pending") ||
      productId.includes("unverified")
    ) {
      return false;
    }

    // 3. Supplier Connection Validation (if provided)
    if (supplierConnection) {
      if (isProd && supplierConnection.isSandbox) return false;
      if (supplierConnection.connectionStatus !== "bookable" && supplierConnection.connectionStatus !== "authorized") {
        return false;
      }
      if (supplierConnection.onboardingStage !== "bookable" && supplierConnection.onboardingStage !== "live_authorized") {
        return false;
      }
      if (supplierConnection.healthStatus && supplierConnection.healthStatus !== "healthy") {
        return false;
      }
    }

    return true;
  }

  /**
   * Return all canonical places currently indexed.
   */
  public static getAllCanonicalPlaces(): CanonicalDccPlace[] {
    this.ensureInitialized();
    return this.allPlacesList;
  }
}

export const canonicalPlaceService = DccCanonicalPlaceService;
export type DccCanonicalPlace = CanonicalDccPlace;
