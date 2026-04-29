import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { earthosPublications } from "@/lib/db/schema";
import type { MissionPublication } from "@/lib/dcc/earthos/workflows/types";

function normalizePublication(
  row: typeof earthosPublications.$inferSelect,
): MissionPublication {
  return {
    missionId: row.missionId,
    slug: row.slug,
    path: row.path,
    entity: row.entity,
    region: row.region,
    headline: row.headline,
    briefing: row.briefing,
    riskLevel: row.riskLevel,
    recommendedAction: row.recommendedAction,
    publishedAt: row.publishedAt.toISOString(),
    networkTarget: row.networkTarget,
  };
}

export async function findDbMissionPublicationByMissionId(
  missionId: string,
): Promise<MissionPublication | null> {
  if (!hasDb()) return null;
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .select()
      .from(earthosPublications)
      .where(eq(earthosPublications.missionId, missionId))
      .limit(1);

    return row ? normalizePublication(row) : null;
  } catch {
    return null;
  }
}

export async function findDbMissionPublicationBySlug(
  slug: string,
): Promise<MissionPublication | null> {
  if (!hasDb()) return null;
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .select()
      .from(earthosPublications)
      .where(eq(earthosPublications.slug, slug))
      .limit(1);

    return row ? normalizePublication(row) : null;
  } catch {
    return null;
  }
}

export async function listDbMissionPublications(): Promise<MissionPublication[]> {
  if (!hasDb()) return [];
  const db = getDb();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(earthosPublications)
      .orderBy(desc(earthosPublications.publishedAt));

    return rows.map(normalizePublication);
  } catch {
    return [];
  }
}

export async function upsertDbMissionPublication(
  publication: MissionPublication,
): Promise<MissionPublication | null> {
  if (!hasDb()) return null;
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .insert(earthosPublications)
      .values({
        missionId: publication.missionId,
        slug: publication.slug,
        path: publication.path,
        entity: publication.entity,
        region: publication.region,
        headline: publication.headline,
        briefing: publication.briefing,
        riskLevel: publication.riskLevel,
        recommendedAction: publication.recommendedAction,
        publishedAt: new Date(publication.publishedAt),
        networkTarget: publication.networkTarget,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: earthosPublications.missionId,
        set: {
          slug: publication.slug,
          path: publication.path,
          entity: publication.entity,
          region: publication.region,
          headline: publication.headline,
          briefing: publication.briefing,
          riskLevel: publication.riskLevel,
          recommendedAction: publication.recommendedAction,
          publishedAt: new Date(publication.publishedAt),
          networkTarget: publication.networkTarget,
          updatedAt: new Date(),
        },
      })
      .returning();

    return row ? normalizePublication(row) : null;
  } catch {
    return null;
  }
}
