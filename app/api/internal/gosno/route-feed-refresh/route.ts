import { NextResponse } from "next/server";
import {
  DEFAULT_GOSNO_SNAPSHOT_TTL_MS,
  SCHEDULED_GOSNO_FEED_REFRESH_CRON,
  SCHEDULED_GOSNO_FEED_REFRESH_INTERVAL_MS,
  SCHEDULED_GOSNO_FEED_REFRESH_PATH,
  getActiveGoSnoRouteFeedSnapshotState,
  refreshGoSnoRouteFeedSnapshot,
} from "@/lib/dcc/applicability";
import {
  buildEarthOSUnauthorizedResponse,
  verifyEarthOSAuthorization,
} from "@/lib/dcc/earthos/auth";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const dynamic = "force-dynamic";

async function executeScheduledGoSnoFeedRefresh(
  request: Request,
  options?: {
    sourceUrl?: string;
    ttlMs?: number;
  },
) {
  const auth = await verifyEarthOSAuthorization(request);
  if (!auth.authorized) {
    return buildEarthOSUnauthorizedResponse(auth);
  }

  try {
    await syncDurableLedgerWithPostgres();
    const refreshResult = await refreshGoSnoRouteFeedSnapshot({
      feedUrl: options?.sourceUrl,
      ttlMs: options?.ttlMs,
    });
    await syncDurableLedgerWithPostgres({ forcePushLocal: true });

    const activeState = getActiveGoSnoRouteFeedSnapshotState();

    return NextResponse.json(
      {
        ok: true,
        actor: auth.actor,
        authMethod: auth.method,
        scheduledRefreshCadence: {
          endpoint: SCHEDULED_GOSNO_FEED_REFRESH_PATH,
          cron: SCHEDULED_GOSNO_FEED_REFRESH_CRON,
          intervalMs: SCHEDULED_GOSNO_FEED_REFRESH_INTERVAL_MS,
          refreshIntervalHours:
            SCHEDULED_GOSNO_FEED_REFRESH_INTERVAL_MS / (60 * 60 * 1000),
          snapshotTtlMs: DEFAULT_GOSNO_SNAPSHOT_TTL_MS,
          snapshotTtlHours: DEFAULT_GOSNO_SNAPSHOT_TTL_MS / (60 * 60 * 1000),
          refreshesBeforeExpiry: Math.floor(
            DEFAULT_GOSNO_SNAPSHOT_TTL_MS /
              SCHEDULED_GOSNO_FEED_REFRESH_INTERVAL_MS,
          ),
        },
        refreshOutcome: {
          refreshed: refreshResult.ok,
          retainedPriorSnapshot: refreshResult.retainedLastValid,
          error: refreshResult.error ?? null,
          lastRefreshStatus: refreshResult.refreshMeta.lastRefreshStatus,
          lastRefreshAttemptAt: refreshResult.refreshMeta.lastRefreshAttemptAt,
        },
        gosnoRouteFeedSnapshot: {
          snapshotId: activeState.snapshot.snapshotId,
          sourceUrl: activeState.snapshot.sourceUrl,
          feedVersion: activeState.snapshot.feedVersion,
          feedGeneratedAt: activeState.snapshot.feedGeneratedAt,
          contentHash: activeState.snapshot.contentHash,
          rawPayloadHash: activeState.snapshot.rawPayloadHash,
          fetchedAt: activeState.snapshot.fetchedAt,
          expiresAt: activeState.snapshot.expiresAt,
          ageMs: activeState.ageMs,
          ageLabel: activeState.ageLabel,
          isExpired: activeState.isExpired,
          freshnessStatus: activeState.freshnessStatus,
          statusBanner: activeState.statusBanner,
          routeCount: activeState.snapshot.routeCount,
          roundTripCount: activeState.snapshot.roundTripCount,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "scheduled_gosno_feed_refresh_failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return executeScheduledGoSnoFeedRefresh(request);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    sourceUrl?: string;
    ttlMs?: number;
  };
  return executeScheduledGoSnoFeedRefresh(request, {
    sourceUrl: body.sourceUrl,
    ttlMs: body.ttlMs,
  });
}
