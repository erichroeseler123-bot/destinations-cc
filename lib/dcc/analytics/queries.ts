import { and, eq, not, sql } from "drizzle-orm";
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
 * or idempotency keys starting with 'live-staging-', 'pw-browser-', 'test-')
 * is STRICTLY EXCLUDED by default to maintain reporting integrity.
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
    const allRows = await db.select().from(dccContexts);

    let filteredRows = allRows;
    let excludedCount = 0;

    if (excludeTest) {
      filteredRows = allRows.filter((row) => {
        const attrStr = JSON.stringify(row.attribution || {});
        const isStagingTest =
          attrStr.includes("staging-verification-test") ||
          attrStr.includes("test_campaign") ||
          (row.idempotencyKey &&
            (row.idempotencyKey.includes("staging") ||
              row.idempotencyKey.includes("test") ||
              row.idempotencyKey.includes("pw-browser")));

        if (isStagingTest) {
          excludedCount++;
          return false;
        }
        return true;
      });
    }

    if (params.destination) {
      filteredRows = filteredRows.filter(
        (r) => r.destination.toLowerCase() === params.destination!.toLowerCase()
      );
    }
    if (params.sourceSite) {
      filteredRows = filteredRows.filter(
        (r) => r.sourceSite.toLowerCase() === params.sourceSite!.toLowerCase()
      );
    }
    if (params.targetOwner) {
      filteredRows = filteredRows.filter(
        (r) => r.targetOwner.toLowerCase() === params.targetOwner!.toLowerCase()
      );
    }

    // Grouping by corridor
    const corridorMap = new Map<string, {
      sourceSite: string;
      targetOwner: string;
      destination: string;
      issued: number;
      redeemed: number;
      expired: number;
      revoked: number;
    }>();

    let totalIssued = 0;
    let totalRedeemed = 0;
    let totalExpired = 0;
    let totalRevoked = 0;

    for (const row of filteredRows) {
      const key = `${row.sourceSite}::${row.targetOwner}::${row.destination}`;
      let entry = corridorMap.get(key);
      if (!entry) {
        entry = {
          sourceSite: row.sourceSite,
          targetOwner: row.targetOwner,
          destination: row.destination,
          issued: 0,
          redeemed: 0,
          expired: 0,
          revoked: 0,
        };
        corridorMap.set(key, entry);
      }

      totalIssued++;
      entry.issued++;

      if (row.status === "redeemed") {
        totalRedeemed++;
        entry.redeemed++;
      } else if (row.status === "expired") {
        totalExpired++;
        entry.expired++;
      } else if (row.status === "revoked") {
        totalRevoked++;
        entry.revoked++;
      }
    }

    const corridors: CorridorMetricsSummary[] = Array.from(corridorMap.values()).map(
      (c) => ({
        sourceSite: c.sourceSite,
        targetOwner: c.targetOwner,
        destination: c.destination,
        issuedCount: c.issued,
        redeemedCount: c.redeemed,
        expiredCount: c.expired,
        revokedCount: c.revoked,
        conversionRate: c.issued > 0 ? Number(((c.redeemed / c.issued) * 100).toFixed(2)) : 0,
      })
    );

    const overallConversionRate =
      totalIssued > 0 ? Number(((totalRedeemed / totalIssued) * 100).toFixed(2)) : 0;

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
