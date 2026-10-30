import { eq } from "drizzle-orm";
import { earthosControlMapFindings } from "@/lib/db/schema";
import { getRequiredEarthosDb } from "@/lib/dcc/earthos/ensureEarthosSchema";
import {
  applyPublishedReferenceNodeOverride,
  buildReferenceOverrideFindingId,
  DISALLOWED_PRODUCTION_TEST_URLS,
  getBaseTravelReferenceNodeById,
  resolveEarthosEnvironmentScope,
  type EarthosEnvironmentScope,
  type PublishedReferenceNodeOverride,
  type TravelReferenceNode,
} from "./travelReferenceCore";

export * from "./travelReferenceCore";

export async function readPublishedReferenceNodeOverrideFromDb(
  id: TravelReferenceNode["id"],
  scope: EarthosEnvironmentScope = resolveEarthosEnvironmentScope(),
): Promise<PublishedReferenceNodeOverride | null> {
  const db = await getRequiredEarthosDb();

  const rows = await db
    .select()
    .from(earthosControlMapFindings)
    .where(eq(earthosControlMapFindings.findingId, buildReferenceOverrideFindingId(id, scope)))
    .limit(1);

  const row = rows[0];
  if (!row || row.status !== "applied" || !row.metadata) {
    return null;
  }

  const override = row.metadata as unknown as PublishedReferenceNodeOverride;
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
