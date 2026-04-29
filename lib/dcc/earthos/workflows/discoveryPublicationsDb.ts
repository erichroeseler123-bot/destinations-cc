import { desc, eq } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { earthosDiscoveryPublications } from "@/lib/db/schema";
import {
  buildDiscoveryPublicationDriftRecord,
  type DiscoveryPublicationDriftRecord,
  type DiscoverySurfacePublicationLike,
} from "@/lib/dcc/discoveryPublicationHistory";

function normalizeRow(
  row: typeof earthosDiscoveryPublications.$inferSelect,
): DiscoveryPublicationDriftRecord {
  return {
    publicationId: row.publicationId,
    surfaceId: row.surfaceId,
    role: row.role as DiscoverySurfacePublicationLike["role"],
    domain: row.domain,
    siteName: row.siteName,
    generatedAt: row.generatedAt.toISOString(),
    publishedAt: row.publishedAt.toISOString(),
    version: row.version,
    contentHash: row.contentHash,
    agentHash: row.agentHash,
    llmsHash: row.llmsHash,
    sitemapHash: row.sitemapHash,
    winnerCode: row.winnerCode,
    winnerConfidence: row.winnerConfidence,
    fitReason: row.fitReason,
    resolutionPath: row.resolutionPath,
    previousPublicationId: row.previousPublicationId,
    previousWinnerCode: row.previousWinnerCode,
    previousWinnerConfidence: row.previousWinnerConfidence,
    changed: row.changed,
    changedFields: row.changedFields,
    winnerChangedAt: row.winnerChangedAt?.toISOString() || null,
    metadata: row.metadata,
  };
}

export async function findLatestDiscoveryPublicationBySurfaceId(
  surfaceId: string,
): Promise<DiscoveryPublicationDriftRecord | null> {
  if (!hasDb()) return null;
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .select()
      .from(earthosDiscoveryPublications)
      .where(eq(earthosDiscoveryPublications.surfaceId, surfaceId))
      .orderBy(desc(earthosDiscoveryPublications.publishedAt))
      .limit(1);

    return row ? normalizeRow(row) : null;
  } catch {
    return null;
  }
}

export async function appendDiscoveryPublicationHistory(input: {
  publications: DiscoverySurfacePublicationLike[];
  generatedAt: string;
  publishedAt: string;
  version: string;
}): Promise<DiscoveryPublicationDriftRecord[] | null> {
  if (!hasDb()) return null;
  const db = getDb();
  if (!db) return null;

  const records: DiscoveryPublicationDriftRecord[] = [];

  try {
    for (const publication of input.publications) {
      const previous = await findLatestDiscoveryPublicationBySurfaceId(publication.id);
      const record = buildDiscoveryPublicationDriftRecord({
        publication,
        generatedAt: input.generatedAt,
        publishedAt: input.publishedAt,
        version: input.version,
        previous,
      });

      await db.insert(earthosDiscoveryPublications).values({
        publicationId: record.publicationId,
        surfaceId: record.surfaceId,
        role: record.role,
        domain: record.domain,
        siteName: record.siteName,
        generatedAt: new Date(record.generatedAt),
        publishedAt: new Date(record.publishedAt),
        version: record.version,
        contentHash: record.contentHash,
        agentHash: record.agentHash,
        llmsHash: record.llmsHash,
        sitemapHash: record.sitemapHash,
        winnerCode: record.winnerCode,
        winnerConfidence: record.winnerConfidence,
        fitReason: record.fitReason,
        resolutionPath: record.resolutionPath,
        previousPublicationId: record.previousPublicationId,
        previousWinnerCode: record.previousWinnerCode,
        previousWinnerConfidence: record.previousWinnerConfidence,
        changed: record.changed,
        changedFields: record.changedFields,
        winnerChangedAt: record.winnerChangedAt ? new Date(record.winnerChangedAt) : null,
        metadata: record.metadata,
      });

      records.push(record);
    }

    return records;
  } catch {
    return null;
  }
}
