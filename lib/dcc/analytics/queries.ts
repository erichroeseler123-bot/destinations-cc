import { and, count, eq, gte, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { getDb, type DccDb } from "@/lib/db/client";
import { dccContexts } from "@/lib/db/schema";

export interface CorridorMetricsSummary {
  sourceSite: string;
  targetOwner: string;
  destination: string;
  issuedCount: number;
  redeemedCount: number;
  expiredCount: number;
  revokedCount: number;
  conversionRate: number; // percentage (0 - 100)
}

export interface AnalyticsQueryParams {
  dbOverride?: DccDb | null;
  excludeTestTraffic?: boolean;
  dateStart?: string;
  dateEnd?: string;
  destination?: string;
  sourceSite?: string;
  targetOwner?: string;
}

/**
 * Authoritative Analytics Query Engine for DCC Context Protocol.
 * 
 * CRITICAL SAFETY & ISOLATION RULE:
 * Staging test verification traffic (e.g. campaign: 'staging-verification-test',
 * 'test_campaign', or idempotency keys starting with 'live-staging-', 'pw-browser-', 'test-', 'expire-test-')
 * is STRICTLY EXCLUDED by default to maintain reporting integrity.
 * 
 * Filters and aggregates are pushed down directly to SQL for optimal performance.
 */
export async function queryDccConversionMetrics(
  params: AnalyticsQueryParams = {}
): Promise<{
  success: boolean;
  totalIssued: number;
  totalRedeemed: number;
  totalExpired: number;
  totalRevoked: number;
  overallConversionRate: number;
  corridors: CorridorMetricsSummary[];
  excludedTestContextsCount?: number;
}> {
  const db = params.dbOverride !== undefined ? params.dbOverride : getDb();
  if (!db) {
    return {
      success: false,
      totalIssued: 0,
      totalRedeemed: 0,
      totalExpired: 0,
      totalRevoked: 0,
      overallConversionRate: 0,
      corridors: [],
    };
  }

  const excludeTest = params.excludeTestTraffic ?? true;

  try {
    const baseConditions: SQL[] = [];

    if (params.destination) {
      baseConditions.push(
        sql`lower(${dccContexts.destination}) = ${params.destination.toLowerCase()}`
      );
    }
    if (params.sourceSite) {
      baseConditions.push(
        sql`lower(${dccContexts.sourceSite}) = ${params.sourceSite.toLowerCase()}`
      );
    }
    if (params.targetOwner) {
      baseConditions.push(
        sql`lower(${dccContexts.targetOwner}) = ${params.targetOwner.toLowerCase()}`
      );
    }
    if (params.dateStart) {
      const startDate = new Date(params.dateStart);
      if (!isNaN(startDate.getTime())) {
        baseConditions.push(gte(dccContexts.issuedAt, startDate));
      }
    }
    if (params.dateEnd) {
      const endDate = new Date(params.dateEnd);
      if (!isNaN(endDate.getTime())) {
        baseConditions.push(lte(dccContexts.issuedAt, endDate));
      }
    }

    const conditions: SQL[] = [...baseConditions];

    if (excludeTest) {
      // Precise exclusion: exclude staging verification tests without blocking legitimate campaigns like "pro-contest"
      conditions.push(
        sql`COALESCE(${dccContexts.attribution}->>'campaign', '') NOT IN ('staging-verification-test', 'test_campaign')`
      );
      conditions.push(
        sql`(${dccContexts.idempotencyKey} IS NULL OR (
          ${dccContexts.idempotencyKey} NOT LIKE 'live-staging-%' AND
          ${dccContexts.idempotencyKey} NOT LIKE 'pw-browser-%' AND
          ${dccContexts.idempotencyKey} NOT LIKE 'test-%' AND
          ${dccContexts.idempotencyKey} NOT LIKE 'expire-test-%'
        ))`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Direct SQL Grouping and Aggregation
    const corridorRows = await db
      .select({
        sourceSite: dccContexts.sourceSite,
        targetOwner: dccContexts.targetOwner,
        destination: dccContexts.destination,
        issuedCount: count(),
        redeemedCount: sql<number>`count(CASE WHEN ${dccContexts.status} = 'redeemed' THEN 1 END)::int`,
        expiredCount: sql<number>`count(CASE WHEN ${dccContexts.status} = 'expired' THEN 1 END)::int`,
        revokedCount: sql<number>`count(CASE WHEN ${dccContexts.status} = 'revoked' THEN 1 END)::int`,
      })
      .from(dccContexts)
      .where(whereClause)
      .groupBy(dccContexts.sourceSite, dccContexts.targetOwner, dccContexts.destination);

    let totalIssued = 0;
    let totalRedeemed = 0;
    let totalExpired = 0;
    let totalRevoked = 0;

    const corridors: CorridorMetricsSummary[] = corridorRows.map((r) => {
      const issued = Number(r.issuedCount);
      const redeemed = Number(r.redeemedCount);
      const expired = Number(r.expiredCount);
      const revoked = Number(r.revokedCount);

      totalIssued += issued;
      totalRedeemed += redeemed;
      totalExpired += expired;
      totalRevoked += revoked;

      return {
        sourceSite: r.sourceSite,
        targetOwner: r.targetOwner,
        destination: r.destination,
        issuedCount: issued,
        redeemedCount: redeemed,
        expiredCount: expired,
        revokedCount: revoked,
        conversionRate: issued > 0 ? Number(((redeemed / issued) * 100).toFixed(2)) : 0,
      };
    });

    const overallConversionRate =
      totalIssued > 0 ? Number(((totalRedeemed / totalIssued) * 100).toFixed(2)) : 0;

    let excludedCount = 0;
    if (excludeTest) {
      const baseWhereClause = baseConditions.length > 0 ? and(...baseConditions) : undefined;
      const [totalWithTests] = await db
        .select({ count: count() })
        .from(dccContexts)
        .where(baseWhereClause);

      const rawCount = Number(totalWithTests?.count || 0);
      excludedCount = Math.max(0, rawCount - totalIssued);
    }

    return {
      success: true,
      totalIssued,
      totalRedeemed,
      totalExpired,
      totalRevoked,
      overallConversionRate,
      corridors,
      excludedTestContextsCount: excludedCount,
    };
  } catch (err) {
    console.error("Failed to query DCC conversion metrics:", err);
    return {
      success: false,
      totalIssued: 0,
      totalRedeemed: 0,
      totalExpired: 0,
      totalRevoked: 0,
      overallConversionRate: 0,
      corridors: [],
    };
  }
}
