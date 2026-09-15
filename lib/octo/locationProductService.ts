import { getDb } from "@/lib/db/client";
import { octoNormalizedProducts, octoSupplierConnections } from "@/lib/db/schema";
import { OctoProduct } from "./types";
import { MockOctoSupplierEngine } from "./mockServer";
import { OctoRegistryService, INITIAL_OCTO_PARTICIPANTS } from "./registry";
import { canonicalPlaceService, DccCanonicalPlace } from "@/lib/dcc/canonicalPlaceService";
import { eq } from "drizzle-orm";

export type CommercialStatus = "bookable" | "directory_only";

export type LocationProductAssociation = {
  product: OctoProduct;
  commercialStatus: CommercialStatus;
  supplier: {
    connectionId?: string;
    operatorName: string;
    operatorSlug?: string;
    providerType: string;
    connectionStatus: string;
    onboardingStage: string;
    isAuthorized: boolean;
  };
  distanceKm?: number;
  reason?: string;
};

export type LocationDiscoveryDirectoryItem = {
  id: string;
  name: string;
  role: string;
  website: string;
  destinations: string[];
  commercialStatus: "directory_only";
  notes?: string;
};

export type Coordinate = { lat: number; lng: number };

function haversineKm(a: Coordinate, b: Coordinate): number {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

// Bounding box lookup for known regional destination corridors
const DESTINATION_BOUNDING_BOXES: Record<string, { bbox: [number, number, number, number]; slug: string }> = {
  juneau: {
    bbox: [58.0, -135.0, 58.7, -134.0],
    slug: "juneau",
  },
  "red-rocks": {
    bbox: [39.5, -105.4, 39.8, -105.0],
    slug: "red-rocks",
  },
  denver: {
    bbox: [39.4, -105.2, 40.0, -104.5],
    slug: "denver",
  },
  usvi: {
    bbox: [17.5, -65.1, 18.5, -64.4],
    slug: "usvi",
  },
  "new-orleans": {
    bbox: [29.7, -90.3, 30.2, -89.8],
    slug: "new-orleans",
  },
};

function matchDestinationSlugForCoordinates(lat: number, lng: number): string | null {
  for (const [slug, def] of Object.entries(DESTINATION_BOUNDING_BOXES)) {
    const [minLat, minLng, maxLat, maxLng] = def.bbox;
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      return slug;
    }
  }
  return null;
}

export class DccLocationProductService {
  /**
   * Find normalized OCTO products and directory items associated with a coordinate or destination
   */
  static async findProductsForLocation(params: {
    lat: number;
    lng: number;
    radiusKm?: number;
    destinationSlug?: string;
  }): Promise<{
    products: LocationProductAssociation[];
    directoryOnlyOperators: LocationDiscoveryDirectoryItem[];
    canonicalPlace?: DccCanonicalPlace | null;
  }> {
    const isProd = process.env.NODE_ENV === "production";
    const maxRadius = params.radiusKm || 75; // Default 75km radius
    const detectedSlug = params.destinationSlug || matchDestinationSlugForCoordinates(params.lat, params.lng);
    const db = getDb();

    // Resolve canonical DCC place identity using existing geography layer
    const canonicalPlace = params.destinationSlug
      ? canonicalPlaceService.resolvePlaceByDestinationSlug(params.destinationSlug) ||
        canonicalPlaceService.resolvePlaceBySlug(params.destinationSlug) ||
        canonicalPlaceService.resolvePlaceByCoordinates(params.lat, params.lng, maxRadius)
      : canonicalPlaceService.resolvePlaceByCoordinates(params.lat, params.lng, maxRadius);

    const productAssociations: LocationProductAssociation[] = [];
    const directoryOnlyOperators: LocationDiscoveryDirectoryItem[] = [];

    // 1. Query Database for Normalized Products & Supplier Connections
    if (db) {
      try {
        const rows = await db.select().from(octoNormalizedProducts);
        const connections = await db.select().from(octoSupplierConnections);
        const connectionMap = new Map(connections.map((c) => [c.id, c]));

        for (const row of rows) {
          const conn = connectionMap.get(row.supplierConnectionId);
          const isMock = row.supplierConnectionId.includes("mock");

          // Strict invariant: Quarantine mock in production
          if (isProd && isMock) continue;

          // Check spatial relevance
          let distanceKm: number | undefined;
          let matches = false;

          if (row.latitude != null && row.longitude != null) {
            const rowCoords = { lat: Number(row.latitude), lng: Number(row.longitude) };
            distanceKm = haversineKm({ lat: params.lat, lng: params.lng }, rowCoords);
            if (distanceKm <= maxRadius) {
              matches = true;
            }
          }

          if (!matches && canonicalPlace) {
            matches = canonicalPlaceService.isProductServingPlace(
              {
                id: row.id,
                title: row.title,
                internalName: row.title,
                destinationSlug: row.destinationSlug,
                dccPlaceId: (row as any).dccPlaceId,
                placeCoordinates:
                  row.latitude != null && row.longitude != null
                    ? { lat: Number(row.latitude), lng: Number(row.longitude) }
                    : undefined,
              } as OctoProduct,
              canonicalPlace.placeId,
              maxRadius
            ).serves;
          }

          if (!matches && detectedSlug && row.destinationSlug) {
            if (
              row.destinationSlug.toLowerCase() === detectedSlug.toLowerCase() ||
              (detectedSlug === "denver" && row.destinationSlug === "red-rocks") ||
              (detectedSlug === "red-rocks" && row.destinationSlug === "denver")
            ) {
              matches = true;
            }
          }

          if (matches) {
            const isAuthorized =
              conn?.connectionStatus === "authorized" &&
              conn?.healthStatus === "healthy" &&
              conn?.onboardingStage === "live_authorized";

            const commercialStatus: CommercialStatus = isAuthorized ? "bookable" : "directory_only";
            const reason = isAuthorized
              ? undefined
              : conn?.onboardingStage === "technical_onboarding"
              ? "Technical Onboarding - Live Booking Not Authorized"
              : "Commercial Authorization Pending - Directory Listing Only";

            const octoProduct: OctoProduct = {
              id: row.id,
              internalName: row.title,
              reference: row.supplierProductReference,
              title: row.title,
              description: row.description || undefined,
              country: row.country || undefined,
              location: row.locationName || undefined,
              destinationSlug: row.destinationSlug,
              defaultCurrency: row.defaultCurrency,
              durationMinutes: row.durationMinutes || undefined,
              meetingPoint: row.meetingPoint || undefined,
              cancellationPolicy: row.cancellationPolicy || undefined,
              capabilities: (row.capabilities as any) || ["octo/core"],
              options: (row.options as any) || [],
            };

            productAssociations.push({
              product: octoProduct,
              commercialStatus,
              supplier: {
                connectionId: conn?.id,
                operatorName: conn?.operatorName || "Authoritative Supplier",
                operatorSlug: conn?.operatorSlug,
                providerType: conn?.reservationPlatform || "direct",
                connectionStatus: conn?.connectionStatus || "draft",
                onboardingStage: conn?.onboardingStage || "technical_onboarding",
                isAuthorized,
              },
              distanceKm,
              reason,
            });
          }
        }
      } catch (err: any) {
        console.error("Error querying database in findProductsForLocation:", err.message);
      }
    }

    // 2. In Non-Production / Sandbox Mode: Check Mock Server for reference fixtures
    if (!isProd) {
      const mockProducts = MockOctoSupplierEngine.getProducts();
      for (const p of mockProducts) {
        // Avoid duplicate if DB row already added it
        if (productAssociations.some((pa) => pa.product.id === p.id)) continue;

        let distanceKm: number | undefined;
        let matches = false;

        if (p.placeCoordinates) {
          distanceKm = haversineKm({ lat: params.lat, lng: params.lng }, p.placeCoordinates);
          if (distanceKm <= maxRadius) matches = true;
        }

        if (!matches && canonicalPlace) {
          matches = canonicalPlaceService.isProductServingPlace(p, canonicalPlace.placeId, maxRadius).serves;
        }

        if (!matches && detectedSlug && p.destinationSlug) {
          if (
            p.destinationSlug.toLowerCase() === detectedSlug.toLowerCase() ||
            (detectedSlug === "denver" && p.destinationSlug === "red-rocks") ||
            (detectedSlug === "red-rocks" && p.destinationSlug === "denver")
          ) {
            matches = true;
          }
        }

        if (matches) {
          // Reference mock supplier in sandbox: strictly technical_onboarding
          // It is bookable in test runs, but clearly flagged as sandbox mock
          const operatorName =
            p.id === "prod_redrocks_sunset"
              ? "Red Rocks Adventure Co (Sandbox Reference)"
              : p.id === "prod_denver_craft_brew_culture"
              ? "Mile High Craft & Culture Walks (Sandbox Reference)"
              : "Alaska Premier Expeditions (Sandbox Reference)";

          const operatorSlug =
            p.id === "prod_redrocks_sunset"
              ? "red-rocks-adventures"
              : p.id === "prod_denver_craft_brew_culture"
              ? "mile-high-craft-culture"
              : "alaska-premier-expeditions";

          const connectionId =
            p.id === "prod_redrocks_sunset"
              ? "conn_mock_redrocks"
              : p.id === "prod_denver_craft_brew_culture"
              ? "conn_mock_denver_craft"
              : "conn_mock_alaska";

          const providerType =
            p.providerExternalIds?.fareharborShortname
              ? "fareharbor"
              : p.providerExternalIds?.bokunActivityId
              ? "bokun"
              : "direct";

          productAssociations.push({
            product: p,
            commercialStatus: "bookable", // Available in test / sandbox
            supplier: {
              connectionId,
              operatorName,
              operatorSlug,
              providerType,
              connectionStatus: "authorized",
              onboardingStage: "technical_onboarding",
              isAuthorized: true,
            },
            distanceKm,
            reason: "Sandbox Test Environment - Reference Supplier",
          });
        }
      }
    }

    // 3. Match Discovery-Only Operators (e.g. Vibe Around Town in USVI)
    for (const participant of INITIAL_OCTO_PARTICIPANTS) {
      if (participant.outreachStatus !== "live_authorized") {
        let matches = false;
        if (detectedSlug) {
          const dLower = detectedSlug.toLowerCase();
          if (participant.destinations.some((d) => d.toLowerCase().includes(dLower) || dLower.includes(d.toLowerCase()))) {
            matches = true;
          }
        }

        // Check specific regional mappings
        if (detectedSlug === "usvi" && participant.id === "part_vibe_around_town") {
          matches = true;
        }

        if (matches) {
          directoryOnlyOperators.push({
            id: participant.id,
            name: participant.name,
            role: participant.role,
            website: participant.website,
            destinations: participant.destinations,
            commercialStatus: "directory_only",
            notes: participant.notes || "Commercial agreement pending. Directory listing only.",
          });
        }
      }
    }

    return {
      products: productAssociations,
      directoryOnlyOperators,
      canonicalPlace: canonicalPlace || null,
    };
  }

  /**
   * Resolve a canonical DCC place for a place ID, slug, or coordinate
   */
  static resolveCanonicalPlace(query: string | { lat: number; lng: number }): DccCanonicalPlace | null {
    if (typeof query === "string") {
      return (
        canonicalPlaceService.resolvePlaceById(query) ||
        canonicalPlaceService.resolvePlaceBySlug(query) ||
        canonicalPlaceService.resolvePlaceByDestinationSlug(query)
      );
    }
    return canonicalPlaceService.resolvePlaceByCoordinates(query.lat, query.lng);
  }

  /**
   * Find products specifically attached to or serving a canonical DCC place
   */
  static async findProductsForCanonicalPlace(
    placeIdOrSlug: string,
    maxRadiusKm: number = 75
  ): Promise<{
    place: DccCanonicalPlace | null;
    products: LocationProductAssociation[];
    directoryOnlyOperators: LocationDiscoveryDirectoryItem[];
  }> {
    const place =
      canonicalPlaceService.resolvePlaceById(placeIdOrSlug) ||
      canonicalPlaceService.resolvePlaceBySlug(placeIdOrSlug) ||
      canonicalPlaceService.resolvePlaceByDestinationSlug(placeIdOrSlug);
    if (!place) {
      return { place: null, products: [], directoryOnlyOperators: [] };
    }
    const res = await this.findProductsForLocation({
      lat: place.coordinates.lat,
      lng: place.coordinates.lng,
      radiusKm: maxRadiusKm,
      destinationSlug: place.admin.destinationSlug || place.slug,
    });
    return {
      place,
      products: res.products,
      directoryOnlyOperators: res.directoryOnlyOperators,
    };
  }

  /**
   * Check if a product is authorized for live booking in production
   */
  static async canBookProduct(productId: string): Promise<boolean> {
    const isProd = process.env.NODE_ENV === "production";
    if (
      isProd &&
      (productId.includes("mock") ||
        productId === "prod_alaska_whale_glacier" ||
        productId === "prod_redrocks_sunset" ||
        productId === "prod_denver_craft_brew_culture")
    ) {
      return false;
    }

    // Explicit check for unverified / directory-only suppliers
    if (productId.includes("vibe") || productId.includes("unverified") || productId.includes("pending")) {
      return false;
    }

    const db = getDb();
    if (!db) {
      // Without DB, only reference mock products can be booked in non-production sandbox
      return (
        !isProd &&
        (productId === "prod_alaska_whale_glacier" ||
          productId === "prod_redrocks_sunset" ||
          productId === "prod_denver_craft_brew_culture" ||
          productId.startsWith("prod_mock_"))
      );
    }

    try {
      const rows = await db
        .select()
        .from(octoNormalizedProducts)
        .where(eq(octoNormalizedProducts.id, productId));

      if (rows.length === 0) {
        return (
          !isProd &&
          (productId === "prod_alaska_whale_glacier" ||
            productId === "prod_redrocks_sunset" ||
            productId === "prod_denver_craft_brew_culture" ||
            productId.startsWith("prod_mock_"))
        );
      }

      const product = rows[0];
      const connections = await db
        .select()
        .from(octoSupplierConnections)
        .where(eq(octoSupplierConnections.id, product.supplierConnectionId));

      if (connections.length === 0) return false;
      const conn = connections[0];
      return (
        conn.connectionStatus === "authorized" &&
        conn.healthStatus === "healthy" &&
        conn.onboardingStage === "live_authorized"
      );
    } catch {
      return false;
    }
  }
}
