import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, hasDb } from "@/lib/db/client";
import { earthosControlMapFindings } from "@/lib/db/schema";
import { getGoSnoRouteSnapshotDisplayPricing } from "@/lib/dcc/applicability";
import {
  applyPublishedReferenceNodeOverride,
  buildReferenceOverrideFindingId,
  DISALLOWED_PRODUCTION_TEST_URLS,
  getBaseTravelReferenceNodeById,
  registerGoSnoDisplayPricingResolver,
  resolveEarthosEnvironmentScope,
  type EarthosEnvironmentScope,
  type PublishedReferenceNodeOverride,
  type TravelReferenceNode,
} from "./travelReferenceCore";

registerGoSnoDisplayPricingResolver(getGoSnoRouteSnapshotDisplayPricing);

export * from "./travelReferenceCore";

const REFERENCE_OVERRIDE_DB_TIMEOUT_MS = 1200;

async function queryPublishedReferenceNodeOverrideDirect(
  id: TravelReferenceNode["id"],
  scope: EarthosEnvironmentScope,
): Promise<PublishedReferenceNodeOverride | null> {
  if (
    process.env.DCC_DISABLE_NEON_COMMERCE === "1" ||
    !hasDb()
  ) {
    return null;
  }

  const db = getDb();
  if (!db) {
    return null;
  }

  let rows: Array<typeof earthosControlMapFindings.$inferSelect>;
  try {
    rows = await Promise.race([
      db
        .select()
        .from(earthosControlMapFindings)
        .where(
          eq(
            earthosControlMapFindings.findingId,
            buildReferenceOverrideFindingId(id, scope),
          ),
        )
        .limit(1),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("reference_override_db_timeout")),
          REFERENCE_OVERRIDE_DB_TIMEOUT_MS,
        ),
      ),
    ]);
  } catch {
    return null;
  }

  const row = rows[0];
  if (!row || row.status !== "applied" || !row.metadata) {
    return null;
  }

  const rawMetadata =
    typeof row.metadata === "string"
      ? (() => {
          try {
            return JSON.parse(row.metadata) as unknown;
          } catch {
            return null;
          }
        })()
      : (row.metadata as unknown);
  if (!rawMetadata || typeof rawMetadata !== "object") {
    return null;
  }

  const override = rawMetadata as PublishedReferenceNodeOverride;
  if (scope === "production") {
    if (override.environmentScope !== "production") {
      return null;
    }
    if (/seed|test|regression/i.test(override.appliedBy || "")) {
      return null;
    }
    const handoffUrls = Object.values(override.specialistHandoffBaseUrls || {});
    if (
      handoffUrls.some(
        (u) =>
          DISALLOWED_PRODUCTION_TEST_URLS.has(u.trim()) ||
          u.toLowerCase().includes("welcometoalaskatours"),
      )
    ) {
      return null;
    }
  }

  return override;
}

const getCachedProductionReferenceOverride = unstable_cache(
  async (id: TravelReferenceNode["id"]) =>
    queryPublishedReferenceNodeOverrideDirect(id, "production"),
  ["dcc-published-reference-node-override-v1"],
  { revalidate: 3600, tags: ["travel-reference-override"] },
);

export async function readPublishedReferenceNodeOverrideFromDb(
  id: TravelReferenceNode["id"],
  scope: EarthosEnvironmentScope = resolveEarthosEnvironmentScope(),
): Promise<PublishedReferenceNodeOverride | null> {
  if (scope === "production" && process.env.NODE_ENV !== "test") {
    try {
      return await getCachedProductionReferenceOverride(id);
    } catch {
      return queryPublishedReferenceNodeOverrideDirect(id, scope);
    }
  }
  return queryPublishedReferenceNodeOverrideDirect(id, scope);
}

export async function getPublishedTravelReferenceNodeById(
  id: TravelReferenceNode["id"],
): Promise<TravelReferenceNode> {
  const override = await readPublishedReferenceNodeOverrideFromDb(id);
  return applyPublishedReferenceNodeOverride(getBaseTravelReferenceNodeById(id), override);
}

export async function getAllPublishedTravelReferenceNodes(): Promise<TravelReferenceNode[]> {
  return Promise.all([
    getPublishedTravelReferenceNodeById("juneau"),
    getPublishedTravelReferenceNodeById("red-rocks"),
    getPublishedTravelReferenceNodeById("denver-breckenridge"),
    getPublishedTravelReferenceNodeById("new-orleans"),
    getPublishedTravelReferenceNodeById("las-vegas"),
  ]);
}

