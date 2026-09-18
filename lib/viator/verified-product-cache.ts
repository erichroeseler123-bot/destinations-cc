import fs from "fs";
import path from "path";
import { z } from "zod";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const VERIFIED_CACHE_DIR = path.join(DATA_DIR, "viator-verified-cache");

/**
 * 1. Stable product data (slowly moving, foundational attributes)
 */
export const StableProductDataSchema = z.object({
  title: z.string().min(1),
  supplier: z.string().min(1),
  destination: z.string().min(1),
  destinationId: z.number().int().optional(),
  canonicalViatorUrl: z.string().url(),
  durationMinutes: z.number().int().nullable(),
  durationText: z.string().nullable(),
  itineraryType: z.string().nullable().optional(),
  ticketType: z.string().nullable().optional(),
});
export type StableProductData = z.infer<typeof StableProductDataSchema>;

/**
 * 2. Slowly changing data (editorial, media, policy)
 */
export const SlowlyChangingDataSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        caption: z.string().optional(),
        source: z.enum(["supplier", "traveler"]),
      })
    )
    .default([]),
  description: z.string().nullable(),
  highlights: z.array(z.string()).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  meetingPoint: z.string().nullable().optional(),
  hasHotelPickup: z.boolean().default(false),
  pickupDetails: z.string().nullable().optional(),
  cancellationPolicy: z.object({
    policyType: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    freeCancellation: z.boolean().default(true),
  }),
});
export type SlowlyChangingData = z.infer<typeof SlowlyChangingDataSchema>;

/**
 * 3. Frequently changing data (pricing, schedule, seat capacity)
 */
export const FrequentlyChangingDataSchema = z.object({
  availabilityStatus: z.enum(["available", "limited", "unavailable", "unknown"]),
  startingPrice: z.number().nullable(),
  currency: z.string().min(3).default("USD"),
  availableOptions: z
    .array(
      z.object({
        code: z.string().min(1),
        title: z.string().min(1),
        times: z.array(z.string()).optional(),
      })
    )
    .default([]),
  operatingDays: z.array(z.string()).default([]),
  lastVerifiedTimestamp: z.string().datetime(),
  isLiveAvailability: z.boolean().default(false),
});
export type FrequentlyChangingData = z.infer<typeof FrequentlyChangingDataSchema>;

/**
 * 4. Affiliate & site metadata (routing, internal mapping, tracking tags)
 */
export const AffiliateMetadataSchema = z.object({
  internalProductId: z.string().min(1),
  viatorProductCode: z.string().min(1),
  defaultCampaign: z.string().min(1),
  allowedSites: z.array(z.string()).min(1),
  portSlug: z.string().optional(),
  status: z.enum(["active", "inactive", "seasonal"]).default("active"),
});
export type AffiliateMetadata = z.infer<typeof AffiliateMetadataSchema>;

/**
 * Unified Verified Product Record
 */
export const VerifiedProductRecordSchema = z.object({
  internalProductId: z.string().min(1),
  viatorProductCode: z.string().min(1),
  status: z.enum(["active", "inactive", "seasonal"]).default("active"),
  stable: StableProductDataSchema,
  slowlyChanging: SlowlyChangingDataSchema,
  frequentlyChanging: FrequentlyChangingDataSchema,
  affiliate: AffiliateMetadataSchema,
});
export type VerifiedProductRecord = z.infer<typeof VerifiedProductRecordSchema>;

/**
 * In-memory fallback cache registry for seed & high-speed reads
 */
const IN_MEMORY_CACHE = new Map<string, VerifiedProductRecord>();

function ensureCacheDir() {
  if (!fs.existsSync(VERIFIED_CACHE_DIR)) {
    fs.mkdirSync(VERIFIED_CACHE_DIR, { recursive: true });
  }
}

function getCacheFilePath(productCode: string): string {
  return path.join(VERIFIED_CACHE_DIR, `${productCode}.json`);
}

/**
 * Business Rule 1: Product Displayability
 * Inactive products must never be displayed on customer-facing sites.
 */
export function isProductDisplayable(product: VerifiedProductRecord): boolean {
  if (product.status === "inactive" || product.affiliate.status === "inactive") {
    return false;
  }
  return true;
}

/**
 * Business Rule 2: Stale Availability Guard
 * Prevents cached availability older than maxAgeMs from being shown as live.
 */
export function isAvailabilityStale(
  product: VerifiedProductRecord,
  maxAgeMs = 30 * 60 * 1000 // 30 minutes default threshold
): boolean {
  const verifiedTime = new Date(product.frequentlyChanging.lastVerifiedTimestamp).getTime();
  const now = Date.now();
  return now - verifiedTime > maxAgeMs;
}

/**
 * Business Rule 3: Hotel Pickup Verification
 * Never claim hotel pickup on a card/guide unless verified in slowlyChanging attributes.
 */
export function validatePickupClaim(
  product: VerifiedProductRecord,
  claimRequiresPickup: boolean
): boolean {
  if (!claimRequiresPickup) return true;
  return Boolean(product.slowlyChanging.hasHotelPickup);
}

/**
 * Business Rule 4: Port Boundary Verification
 * Ensures tours are never advertised in a port where they do not operate.
 */
export function validatePortOperation(
  product: VerifiedProductRecord,
  targetPortSlug: string
): boolean {
  const normalizedTarget = targetPortSlug.trim().toLowerCase();
  if (product.affiliate.portSlug) {
    return product.affiliate.portSlug.trim().toLowerCase() === normalizedTarget;
  }
  const destinationMatch = product.stable.destination.toLowerCase();
  return destinationMatch.includes(normalizedTarget);
}

/**
 * Business Rule 5: Cruise Port Safety Buffer Window
 * Evaluates whether an excursion safely fits a cruise passenger's available shore window.
 * Rejects tours that exceed available port time or return too close to all-aboard time.
 */
export type CruiseTimeWindow = {
  arrivalHour: number; // 24-hr, e.g. 8 for 08:00
  arrivalMinute?: number;
  departureHour: number; // 24-hr, e.g. 17 for 17:00
  departureMinute?: number;
  allAboardBufferMinutes?: number; // default 60 minutes
};

export function validateCruiseSafetyWindow(
  product: VerifiedProductRecord,
  cruise: CruiseTimeWindow
): { fits: boolean; reason?: string; availableMinutes: number; tourMinutes: number } {
  const arrTotal = cruise.arrivalHour * 60 + (cruise.arrivalMinute || 0);
  const depTotal = cruise.departureHour * 60 + (cruise.departureMinute || 0);
  const buffer = cruise.allAboardBufferMinutes ?? 60;

  const totalPortStayMinutes = depTotal - arrTotal;
  const safeShoreMinutes = totalPortStayMinutes - buffer;

  const durationMinutes = product.stable.durationMinutes || 180; // fallback 3 hours if unstated

  if (totalPortStayMinutes <= 0) {
    return {
      fits: false,
      reason: "Invalid cruise port window: departure is not after arrival.",
      availableMinutes: 0,
      tourMinutes: durationMinutes,
    };
  }

  if (durationMinutes > safeShoreMinutes) {
    return {
      fits: false,
      reason: `Tour duration (${durationMinutes}m) exceeds safe shore window (${safeShoreMinutes}m after ${buffer}m all-aboard buffer).`,
      availableMinutes: safeShoreMinutes,
      tourMinutes: durationMinutes,
    };
  }

  return {
    fits: true,
    availableMinutes: safeShoreMinutes,
    tourMinutes: durationMinutes,
  };
}

/**
 * Write a verified product record to the cache store
 */
export function writeVerifiedProductToCache(record: VerifiedProductRecord): void {
  const validated = VerifiedProductRecordSchema.parse(record);
  IN_MEMORY_CACHE.set(validated.viatorProductCode, validated);
  IN_MEMORY_CACHE.set(validated.internalProductId, validated);

  try {
    ensureCacheDir();
    const filePath = getCacheFilePath(validated.viatorProductCode);
    fs.writeFileSync(filePath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  } catch {
    // Non-fatal if filesystem is read-only in serverless; in-memory cache preserves data
  }
}

/**
 * Read a verified product record from the cache store
 */
export function readVerifiedProductFromCache(
  key: string // can be viatorProductCode or internalProductId
): VerifiedProductRecord | null {
  if (IN_MEMORY_CACHE.has(key)) {
    return IN_MEMORY_CACHE.get(key)!;
  }

  try {
    const filePath = getCacheFilePath(key);
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
      const validated = VerifiedProductRecordSchema.parse(parsed);
      IN_MEMORY_CACHE.set(validated.viatorProductCode, validated);
      IN_MEMORY_CACHE.set(validated.internalProductId, validated);
      return validated;
    }
  } catch {
    // ignore parse errors and fallback
  }

  return null;
}
