import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  DEFAULT_GOSNO_SNAPSHOT_TTL_MS,
  GOSNO_ROUTE_FEED_URL,
  SCHEDULED_GOSNO_FEED_REFRESH_CRON,
  SCHEDULED_GOSNO_FEED_REFRESH_INTERVAL_MS,
  SCHEDULED_GOSNO_FEED_REFRESH_PATH,
  createGoSnoRouteFeedSnapshot,
  getActiveGoSnoRouteFeedSnapshotState,
  getBaselineGoSnoRouteFeedSnapshot,
  isProductionGoSnoFeedEnvironment,
  refreshGoSnoRouteFeedSnapshot,
  saveGoSnoRouteFeedSnapshot,
} from "@/lib/dcc/applicability";
import {
  buildEarthOSUnauthorizedResponse,
  verifyEarthOSAuthorization,
} from "@/lib/dcc/earthos/auth";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const dynamic = "force-dynamic";

interface NonProdTestOverride {
  vailSuvUsd?: number;
  vailVanUsd?: number;
  breckSuvUsd?: number;
  breckVanUsd?: number;
  forceExpired?: boolean;
}

function parseNonProdTestOverride(request: Request): NonProdTestOverride | null {
  if (isProductionGoSnoFeedEnvironment()) {
    return null;
  }
  try {
    const url = new URL(request.url);
    const vailSuvUsd = url.searchParams.get("testVailSuvUsd")
      ? Number(url.searchParams.get("testVailSuvUsd"))
      : undefined;
    const vailVanUsd = url.searchParams.get("testVailVanUsd")
      ? Number(url.searchParams.get("testVailVanUsd"))
      : undefined;
    const breckSuvUsd = url.searchParams.get("testBreckSuvUsd")
      ? Number(url.searchParams.get("testBreckSuvUsd"))
      : undefined;
    const breckVanUsd = url.searchParams.get("testBreckVanUsd")
      ? Number(url.searchParams.get("testBreckVanUsd"))
      : undefined;
    const forceExpired = url.searchParams.get("testExpired") === "1";

    if (
      (typeof vailSuvUsd === "number" && Number.isFinite(vailSuvUsd)) ||
      (typeof vailVanUsd === "number" && Number.isFinite(vailVanUsd)) ||
      (typeof breckSuvUsd === "number" && Number.isFinite(breckSuvUsd)) ||
      (typeof breckVanUsd === "number" && Number.isFinite(breckVanUsd)) ||
      forceExpired
    ) {
      return {
        vailSuvUsd,
        vailVanUsd,
        breckSuvUsd,
        breckVanUsd,
        forceExpired,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

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
    const isProd = isProductionGoSnoFeedEnvironment();
    const effectiveSourceUrl = isProd
      ? GOSNO_ROUTE_FEED_URL
      : options?.sourceUrl?.trim()
        ? options.sourceUrl.trim()
        : GOSNO_ROUTE_FEED_URL;
    const effectiveTtlMs = isProd
      ? DEFAULT_GOSNO_SNAPSHOT_TTL_MS
      : typeof options?.ttlMs === "number" &&
          Number.isFinite(options.ttlMs) &&
          options.ttlMs > 0
        ? options.ttlMs
        : DEFAULT_GOSNO_SNAPSHOT_TTL_MS;
    const nonProdOverride = parseNonProdTestOverride(request);
    let refreshResult: Awaited<ReturnType<typeof refreshGoSnoRouteFeedSnapshot>>;

    if (nonProdOverride) {
      const baseSnap =
        getActiveGoSnoRouteFeedSnapshotState().snapshot ??
        getBaselineGoSnoRouteFeedSnapshot();
      const feedClone = structuredClone(baseSnap.feed);
      const applyRouteFare = (
        routeIds: string[],
        vehicleClass: "suv" | "van",
        usd?: number,
      ) => {
        if (typeof usd !== "number" || !Number.isFinite(usd) || usd <= 0) {
          return;
        }
        for (const r of feedClone.routes) {
          if (routeIds.includes(r.route_id) && r.vehicle_class === vehicleClass) {
            r.pricing.amount_usd = usd;
            r.pricing.amount_cents = Math.round(usd * 100);
          }
        }
      };
      applyRouteFare(["DEN-VAIL", "VAIL-DEN"], "suv", nonProdOverride.vailSuvUsd);
      applyRouteFare(["DEN-VAIL", "VAIL-DEN"], "van", nonProdOverride.vailVanUsd);
      applyRouteFare(
        ["DEN-BRECKENRIDGE", "BRECKENRIDGE-DEN"],
        "suv",
        nonProdOverride.breckSuvUsd,
      );
      applyRouteFare(
        ["DEN-BRECKENRIDGE", "BRECKENRIDGE-DEN"],
        "van",
        nonProdOverride.breckVanUsd,
      );

      const nowMs = Date.now();
      const fetchedAt = nonProdOverride.forceExpired
        ? new Date(nowMs - 48 * 60 * 60 * 1000).toISOString()
        : new Date(nowMs).toISOString();
      const expiresAt = nonProdOverride.forceExpired
        ? new Date(nowMs - 24 * 60 * 60 * 1000).toISOString()
        : new Date(nowMs + DEFAULT_GOSNO_SNAPSHOT_TTL_MS).toISOString();

      const customSnap = createGoSnoRouteFeedSnapshot(feedClone, {
        fetchedAt,
        expiresAt,
        ttlMs: DEFAULT_GOSNO_SNAPSHOT_TTL_MS,
      });
      saveGoSnoRouteFeedSnapshot(customSnap, {
        lastRefreshAttemptAt: new Date(nowMs).toISOString(),
        lastRefreshStatus: "ok",
        lastRefreshError: null,
        consecutiveFailures: 0,
      });
      refreshResult = {
        ok: true,
        retainedLastValid: false,
        error: null,
        snapshot: customSnap,
        refreshMeta: {
          lastRefreshAttemptAt: new Date(nowMs).toISOString(),
          lastRefreshStatus: "ok",
          lastRefreshError: null,
          consecutiveFailures: 0,
        },
        state: getActiveGoSnoRouteFeedSnapshotState(),
      };
    } else {
      refreshResult = await refreshGoSnoRouteFeedSnapshot({
        feedUrl: effectiveSourceUrl,
        ttlMs: effectiveTtlMs,
      });
    }

    await syncDurableLedgerWithPostgres({ forcePushLocal: true });

    try {
      revalidatePath("/transportation/colorado/denver-to-vail-shuttle-guide");
      revalidatePath("/guides/denver-airport-to-vail-rental-car-vs-private-transfer");
      revalidatePath("/routes/denver-breckenridge");
      revalidatePath("/transportation/colorado");
      revalidatePath("/operators/gosno");
    } catch {
      // ignore outside Next.js request context
    }

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

