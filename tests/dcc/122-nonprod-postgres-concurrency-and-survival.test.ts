import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { NextRequest } from "next/server";

import {
  closeAnalyticsPgPool,
  describeActiveAnalyticsBackend,
  getAnalyticsExecutor,
  getAnalyticsRuntimeControls,
  resolveAnalyticsBackendMode,
  setAnalyticsRuntimeControls,
} from "@/lib/dcc/analytics/store";
import { collectAnalyticsRawPayload } from "@/lib/dcc/analytics/collector";
import { runAnalyticsWorker } from "@/lib/dcc/analytics/worker";
import {
  buildNetworkAndTripAnalyticsReport,
  clearReportMemorySnapshotsForTests,
} from "@/lib/dcc/analytics/reporting";
import { POST as collectPost } from "@/app/api/v2/analytics/collect/route";
import {
  GET as controlGet,
  POST as controlPost,
} from "@/app/api/admin/analytics/control/route";

function loadNonprodDatabaseUrl(): string {
  if (process.env.DCC_NONPROD_DATABASE_URL?.trim()) {
    return process.env.DCC_NONPROD_DATABASE_URL.trim();
  }
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    "C:/Users/erich/Documents/Projects/destinations-cc/.env.local",
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const m = /^(?:DCC_DATABASE_URL|DATABASE_URL)=(.+)$/.exec(line.trim());
      if (m?.[1]) {
        const val = m[1].trim().replace(/^["']|["']$/g, "");
        if (val.includes("neondb_nonprod") || val.includes("dcc_nonprod_app")) {
          return val;
        }
      }
    }
  }
  throw new Error("Nonproduction Postgres URL (`neondb_nonprod`) not found for suite 122.");
}

async function truncateAllNonprodAnalyticsTables() {
  const exec = await getAnalyticsExecutor();
  assert.equal(exec.backend, "postgres");
  assert.equal(exec.databaseName, "neondb_nonprod");
  await exec.query(`
    TRUNCATE TABLE
      dcc_analytics_runtime_controls,
      dcc_analytics_ingest_queue,
      dcc_analytics_events,
      dcc_analytics_hourly_rollups,
      dcc_analytics_subject_activity,
      dcc_analytics_daily_subjects,
      dcc_analytics_daily_sessions,
      dcc_analytics_trip_links,
      dcc_analytics_trip_state,
      dcc_analytics_tombstones,
      dcc_analytics_health_counters,
      dcc_analytics_watermarks,
      dcc_analytics_worker_lease,
      dcc_analytics_report_cache
    RESTART IDENTITY
  `);
}

function runIsolatedChildTsx(
  mode: "collector_ingest" | "worker_drain",
  envOverrides: Record<string, string>,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const tsxCli = path.resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs");
  const childScript =
    mode === "collector_ingest"
      ? `
        import { collectAnalyticsRawPayload } from "./lib/dcc/analytics/collector";
        import { closeAnalyticsPgPool } from "./lib/dcc/analytics/store";
        (async () => {
          const headers = new Headers({
            host: "cruisepromenade-preview.vercel.app",
            origin: "https://cruisepromenade-preview.vercel.app",
            "accept-language": "en-US,en;q=0.9",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0",
            "x-dcc-internal-secret": "test-nonprod-secret-122"
          });
          const events = [];
          for (let i = 0; i < 8; i++) {
            events.push({
              logicalEventId: "surv_procA_evt_" + i,
              eventType: i === 0 ? "trip_persisted" : "page_viewed",
              occurredAt: new Date(Date.parse("2026-11-19T10:00:00.000Z") + i * 10000).toISOString(),
              site: i % 2 === 0 ? "cruisepromenade" : "lastfrontiershoreexcursions",
              browserSeed: "bseed_surv_" + (i % 3),
              sessionId: "sess_surv_" + (i % 3),
              path: i === 0 ? "/planner" : "/southeast-alaska/fishing-lodges",
              ...(i === 0 ? { tripIdentifier: "68A1B2C3D4E5F60718293A4B", partyHeadcountTotal: 3 } : {})
            });
          }
          const res = await collectAnalyticsRawPayload({
            rawBodyText: JSON.stringify({ deliveryId: "dlv_procA", events }),
            headers
          });
          await closeAnalyticsPgPool();
          console.log(JSON.stringify(res));
          process.exit(0);
        })();
      `
      : `
        import { runAnalyticsWorker } from "./lib/dcc/analytics/worker";
        import { closeAnalyticsPgPool } from "./lib/dcc/analytics/store";
        (async () => {
          const res = await runAnalyticsWorker({
            workerId: "wrk_separate_os_process_B",
            batchSize: 50
          });
          await closeAnalyticsPgPool();
          console.log(JSON.stringify(res));
          process.exit(0);
        })();
      `;

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [tsxCli, "--eval", childScript], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...envOverrides,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += String(d);
    });
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

describe("122 — Nonproduction PostgreSQL (`neondb_nonprod`) Durability, Process Survival, Concurrency & Runtime Kill Switch", () => {
  let nonprodUrl = "";

  before(async () => {
    nonprodUrl = loadNonprodDatabaseUrl();
    delete process.env.DCC_ANALYTICS_SQLITE_PATH;
    delete process.env.DCC_ISOLATED_TEST_DB;
    process.env.DCC_ANALYTICS_BACKEND = "postgres";
    process.env.DCC_NONPROD_DATABASE_URL = nonprodUrl;
    process.env.DCC_ANALYTICS_DATABASE_URL = nonprodUrl;
    process.env.DCC_ANALYTICS_INTERNAL_SECRET = "test-nonprod-secret-122";
    clearReportMemorySnapshotsForTests();
    await truncateAllNonprodAnalyticsTables();
  });

  after(async () => {
    try {
      await truncateAllNonprodAnalyticsTables();
    } finally {
      await closeAnalyticsPgPool();
    }
  });

  test("122a. Verifies credential-isolated `neondb_nonprod` connection and enforces strict fail-closed rule (zero silent SQLite fallback on deployed runtimes)", async () => {
    const exec = await getAnalyticsExecutor();
    const whoRes = await exec.query<{ db: string; usr: string }>(
      "SELECT current_database() AS db, current_user AS usr",
    );
    assert.equal(whoRes.rows[0]?.db, "neondb_nonprod");
    assert.equal(whoRes.rows[0]?.usr, "dcc_nonprod_app");
    assert.deepEqual(describeActiveAnalyticsBackend(), {
      backend: "postgres",
      databaseName: "neondb_nonprod",
    });

    // Simulate deployed Vercel runtime attempting to request SQLite -> MUST throw immediately!
    const savedBackend = process.env.DCC_ANALYTICS_BACKEND;
    const savedDbUrl = process.env.DCC_ANALYTICS_DATABASE_URL;
    const savedNonprod = process.env.DCC_NONPROD_DATABASE_URL;
    const savedPrimary = process.env.DATABASE_URL;
    const savedDcc = process.env.DCC_DATABASE_URL;

    try {
      process.env.VERCEL = "1";
      process.env.DCC_ANALYTICS_BACKEND = "sqlite";
      assert.throws(
        () => resolveAnalyticsBackendMode(),
        (err: unknown) =>
          err instanceof Error &&
          (err as { code?: string }).code === "SQLITE_FORBIDDEN_IN_DEPLOYED_RUNTIME",
      );

      // Simulate deployed Vercel runtime with missing Postgres URL -> MUST return 503 / `unavailable` without touching SQLite!
      process.env.DCC_ANALYTICS_BACKEND = "postgres";
      delete process.env.DCC_ANALYTICS_DATABASE_URL;
      delete process.env.DCC_NONPROD_DATABASE_URL;
      delete process.env.DATABASE_URL;
      delete process.env.DCC_DATABASE_URL;
      clearReportMemorySnapshotsForTests();

      const failCollect = await collectAnalyticsRawPayload({
        rawBodyText: JSON.stringify({
          events: [
            {
              logicalEventId: "evt_should_fail_closed",
              eventType: "page_viewed",
              site: "cruisepromenade",
            },
          ],
        }),
        headers: new Headers({ "user-agent": "Mozilla/5.0 Chrome/131.0.0.0" }),
      });
      assert.equal(failCollect.status, 503);
      assert.equal(failCollect.accepted, false);
      assert.equal(failCollect.error, "ingestion_store_unavailable");

      const failReport = await buildNetworkAndTripAnalyticsReport({
        environment: "preview",
        bypassCache: true,
      });
      assert.equal(failReport.ok, false);
      assert.equal(failReport.dataStatus, "unavailable");
      assert.equal(failReport.trafficSummary, null);
    } finally {
      delete process.env.VERCEL;
      process.env.DCC_ANALYTICS_BACKEND = savedBackend;
      process.env.DCC_ANALYTICS_DATABASE_URL = savedDbUrl;
      process.env.DCC_NONPROD_DATABASE_URL = savedNonprod;
      if (savedPrimary) process.env.DATABASE_URL = savedPrimary;
      if (savedDcc) process.env.DCC_DATABASE_URL = savedDcc;
    }
  });

  test("122b. Collector process termination / redeployment survival: events accepted by Process A survive OS process exit and are processed by separate Worker Process B", async () => {
    await truncateAllNonprodAnalyticsTables();

    const childEnv = {
      DCC_ANALYTICS_BACKEND: "postgres",
      DCC_ANALYTICS_DATABASE_URL: nonprodUrl,
      DCC_NONPROD_DATABASE_URL: nonprodUrl,
      DCC_ANALYTICS_INTERNAL_SECRET: "test-nonprod-secret-122",
    };

    // 1. Spawn Collector OS Process A -> accepts 8 events into `neondb_nonprod` -> exits & destroys memory
    const procA = await runIsolatedChildTsx("collector_ingest", childEnv);
    assert.equal(procA.code, 0, `Collector Process A failed: ${procA.stderr}`);
    const collectJson = JSON.parse(procA.stdout.split(/\r?\n/).pop()!) as {
      accepted: boolean;
      queuedCount: number;
      dbTelemetry: { backend: string; databaseName: string };
    };
    assert.equal(collectJson.accepted, true);
    assert.equal(collectJson.queuedCount, 8);
    assert.equal(collectJson.dbTelemetry.backend, "postgres");
    assert.equal(collectJson.dbTelemetry.databaseName, "neondb_nonprod");

    // Verify rows sit durably in `dcc_analytics_ingest_queue` with `status = 'queued'` while 0 processes hold them in memory
    const exec = await getAnalyticsExecutor();
    const pendingBefore = await exec.query<{ cnt: string }>(
      "SELECT COUNT(*) AS cnt FROM dcc_analytics_ingest_queue WHERE status = 'queued'",
    );
    assert.equal(Number(pendingBefore.rows[0]?.cnt), 8);

    // 2. Spawn completely separate Worker OS Process B -> claims & processes all 8 events
    const procB = await runIsolatedChildTsx("worker_drain", childEnv);
    assert.equal(procB.code, 0, `Worker Process B failed: ${procB.stderr}`);
    const workerJson = JSON.parse(procB.stdout.split(/\r?\n/).pop()!) as {
      ok: boolean;
      workerId: string;
      claimedCount: number;
      processedCount: number;
    };
    assert.equal(workerJson.ok, true);
    assert.equal(workerJson.workerId, "wrk_separate_os_process_B");
    assert.equal(workerJson.claimedCount, 8);
    assert.equal(workerJson.processedCount, 8);

    // 3. Query report from our third independent process and verify exact totals + Postgres cache hit
    const report1 = await buildNetworkAndTripAnalyticsReport({
      environment: "preview",
      windowPreset: "24h",
      endIso: "2026-11-19T12:00:00.000Z",
      bypassCache: true,
    });
    assert.equal(report1.dataStatus, "live_verified");
    assert.equal(report1.backendInfo.backend, "postgres");
    assert.equal(report1.backendInfo.databaseName, "neondb_nonprod");
    assert.equal(report1.backendInfo.cacheHit, false);
    assert.equal(report1.trafficSummary?.pageviews, 7);
    assert.equal(report1.tripLifecycle?.milestones.stage3_tripPersisted, 1);

    const reportCached = await buildNetworkAndTripAnalyticsReport({
      environment: "preview",
      windowPreset: "24h",
      endIso: "2026-11-19T12:00:00.000Z",
    });
    assert.equal(reportCached.backendInfo.cacheHit, true);
    assert.equal((reportCached.dbTelemetry?.queryCount || 99) <= 5, true);
  });

  test("122c. Concurrent collectors + concurrent workers (`FOR UPDATE SKIP LOCKED`), cross-collector duplicate races, crash-lease recovery, and poison-pill SAVEPOINT dead-lettering", async () => {
    await truncateAllNonprodAnalyticsTables();

    const headers = new Headers({
      host: "lastfrontiershoreexcursions-preview.vercel.app",
      origin: "https://lastfrontiershoreexcursions-preview.vercel.app",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0.0.0",
    });

    // 1. Fire 12 concurrent collector calls: 36 distinct events + 12 duplicate races on `evt_shared_dup_race_0..5`
    const collectorPromises = Array.from({ length: 12 }, (_, cIdx) => {
      const batchEvents = [
        {
          logicalEventId: `conc_unique_${cIdx}_a`,
          eventType: "page_viewed",
          occurredAt: new Date(Date.parse("2026-11-19T11:00:00.000Z") + cIdx * 1000).toISOString(),
          site: "lastfrontiershoreexcursions",
          browserSeed: `bseed_conc_${cIdx % 6}`,
          sessionId: `sess_conc_${cIdx % 6}`,
          path: "/ports/juneau",
        },
        {
          logicalEventId: `conc_unique_${cIdx}_b`,
          eventType: "guide_engaged",
          occurredAt: new Date(Date.parse("2026-11-19T11:02:00.000Z") + cIdx * 1000).toISOString(),
          site: "lastfrontiershoreexcursions",
          browserSeed: `bseed_conc_${cIdx % 6}`,
          sessionId: `sess_conc_${cIdx % 6}`,
          path: "/southeast-alaska/fishing-lodges",
        },
        {
          logicalEventId: `conc_unique_${cIdx}_c`,
          eventType: "printable_view_opened",
          occurredAt: new Date(Date.parse("2026-11-19T11:03:00.000Z") + cIdx * 1000).toISOString(),
          site: "lastfrontiershoreexcursions",
          browserSeed: `bseed_conc_${cIdx % 6}`,
          sessionId: `sess_conc_${cIdx % 6}`,
          path: "/southeast-alaska/fishing-lodges",
        },
        // Intentional race: pairs of concurrent collectors submit the exact same logicalEventId simultaneously!
        {
          logicalEventId: `conc_shared_race_${Math.floor(cIdx / 2)}`,
          eventType: "page_viewed",
          occurredAt: "2026-11-19T11:04:00.000Z",
          site: "juneauflightdeck",
          browserSeed: `bseed_jfd_race_${Math.floor(cIdx / 2)}`,
          sessionId: `sess_jfd_race_${Math.floor(cIdx / 2)}`,
          path: "/juneau-helicopter-tours",
        },
      ];
      return collectAnalyticsRawPayload({
        rawBodyText: JSON.stringify({ deliveryId: `dlv_conc_${cIdx}`, events: batchEvents }),
        headers,
      });
    });

    const collectResults = await Promise.all(collectorPromises);
    const totalQueued = collectResults.reduce((acc, r) => acc + r.queuedCount, 0);
    const totalDedupedIngest = collectResults.reduce((acc, r) => acc + r.deduplicatedCount, 0);
    // 12 * 3 unique (36) + 6 shared race winners (6) = 42 queued, 6 deduplicated at ingest!
    assert.equal(totalQueued, 42);
    assert.equal(totalDedupedIngest, 6);

    // 2. Launch 4 concurrent workers with small batchSize=5 so all 4 workers contend via `FOR UPDATE SKIP LOCKED`
    const workerResults = await Promise.all(
      Array.from({ length: 4 }, (_, wIdx) =>
        runAnalyticsWorker({
          workerId: `wrk_concurrent_${wIdx + 1}`,
          batchSize: 5,
          maxBatches: 10,
        }),
      ),
    );

    const sumProcessed = workerResults.reduce((acc, w) => acc + w.processedCount, 0);
    assert.equal(sumProcessed, 42);

    const exec = await getAnalyticsExecutor();
    const claimedDist = await exec.query<{ claimed_by: string; cnt: string }>(
      "SELECT claimed_by, COUNT(*) AS cnt FROM dcc_analytics_ingest_queue GROUP BY claimed_by",
    );
    assert.ok(
      claimedDist.rows.length >= 2,
      `Expected multiple concurrent workers to claim disjoint batches via SKIP LOCKED, got ${JSON.stringify(claimedDist.rows)}`,
    );

    const eventsCountRes = await exec.query<{ cnt: string }>(
      "SELECT COUNT(*) AS cnt FROM dcc_analytics_events",
    );
    assert.equal(Number(eventsCountRes.rows[0]?.cnt), 42);

    // 3. Simulate worker crash AFTER claiming (`simulateCrashAfterClaim: true`, `claimLeaseMs: 120`) + poison-pill SAVEPOINT dead-letter
    await collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify({
        events: [
          {
            logicalEventId: "crash_recovery_valid_1",
            eventType: "page_viewed",
            occurredAt: "2026-11-19T11:10:00.000Z",
            site: "cruisepromenade",
            browserSeed: "bseed_crash_1",
            sessionId: "sess_crash_1",
            path: "/planner",
          },
        ],
      }),
      headers,
    });
    await exec.query(
      `INSERT INTO dcc_analytics_ingest_queue (
         logical_event_id, environment, site_id, event_type, traffic_class,
         occurred_at, received_at, status, attempts, payload_json
       ) VALUES (
         'pg_poison_pill_1', 'preview', 'cruisepromenade', 'page_viewed', 'observed_browser',
         '2026-11-19T11:11:00.000Z', '2026-11-19T11:11:00.000Z', 'queued', 0, '{"malformed": true}'::jsonb
       )`,
    );

    await assert.rejects(
      () =>
        runAnalyticsWorker({
          workerId: "wrk_crashed_1",
          claimLeaseMs: 100,
          simulateCrashAfterClaim: true,
        }),
      /SIMULATED_WORKER_CRASH_AFTER_CLAIM/,
    );

    const midClaimRes = await exec.query<{ status: string; attempts: number }>(
      "SELECT status, attempts FROM dcc_analytics_ingest_queue WHERE logical_event_id = 'crash_recovery_valid_1'",
    );
    assert.equal(midClaimRes.rows[0]?.status, "processing");
    assert.equal(Number(midClaimRes.rows[0]?.attempts), 1);

    // Wait 160ms for claim_expires_at to expire, then run healthy workers to reclaim & dead-letter poison pill
    await new Promise((r) => setTimeout(r, 160));
    await runAnalyticsWorker({ workerId: "wrk_recovery_2" });
    await runAnalyticsWorker({ workerId: "wrk_recovery_3" });

    const recoveredValid = await exec.query<{ status: string }>(
      "SELECT status FROM dcc_analytics_ingest_queue WHERE logical_event_id = 'crash_recovery_valid_1'",
    );
    assert.equal(recoveredValid.rows[0]?.status, "processed");

    const deadLetteredPoison = await exec.query<{ status: string; attempts: number }>(
      "SELECT status, attempts FROM dcc_analytics_ingest_queue WHERE logical_event_id = 'pg_poison_pill_1'",
    );
    assert.equal(deadLetteredPoison.rows[0]?.status, "dead_letter");
    assert.equal(Number(deadLetteredPoison.rows[0]?.attempts), 3);

    const finalReport = await buildNetworkAndTripAnalyticsReport({
      environment: "preview",
      windowPreset: "24h",
      endIso: "2026-11-19T12:00:00.000Z",
      bypassCache: true,
    });
    // Pageviews: 12 LFSE + 6 JFD + 1 recovered CP = 19!
    assert.equal(finalReport.trafficSummary?.pageviews, 19);
    assert.equal(finalReport.trafficSummary?.guideEngagements, 12);
    assert.equal(finalReport.trafficSummary?.printableOpens, 12);

    // Verify Blue Hills Outpost and Welcome to Alaska display as `unavailable`, NEVER `0`!
    const bhoRow = finalReport.sites.find((s) => s.siteId === "bluehillsoutpost");
    const wtaRow = finalReport.sites.find((s) => s.siteId === "welcometoalaskatours");
    assert.ok(bhoRow);
    assert.ok(wtaRow);
    assert.equal(bhoRow.pageviews, "unavailable");
    assert.equal(bhoRow.observedBrowsers, "unavailable");
    assert.equal(wtaRow.pageviews, "unavailable");
    assert.equal(wtaRow.observedBrowsers, "unavailable");
  });

  test("122d. Genuine runtime kill switch via `/api/admin/analytics/control` halts and resumes ingestion in `neondb_nonprod` with zero redeployment", async () => {
    // 1. Unauthenticated control call MUST fail with 401
    const unauthRes = await controlPost(
      new NextRequest("https://destinationcommandcenter.com/api/admin/analytics/control", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ killSwitchActive: true }),
      }),
    );
    assert.equal(unauthRes.status, 401);

    // 2. Authenticated admin toggle turns kill switch ON in `neondb_nonprod`
    const enableRes = await controlPost(
      new NextRequest("https://destinationcommandcenter.com/api/admin/analytics/control", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-internal-secret": "test-nonprod-secret-122",
        },
        body: JSON.stringify({ killSwitchActive: true, actorNote: "suite_122_verify" }),
      }),
    );
    assert.equal(enableRes.status, 200);
    const enableJson = (await enableRes.json()) as {
      runtimeControls: { killSwitchActive: boolean; killSwitchSource: string };
    };
    assert.equal(enableJson.runtimeControls.killSwitchActive, true);
    assert.equal(enableJson.runtimeControls.killSwitchSource, "runtime_db");

    // 3. Collector immediately returns 202 accepted: false (`killSwitchSource: "runtime_db"`) without queuing
    const haltedCollectRes = await collectPost(
      new NextRequest("https://destinationcommandcenter.com/api/v2/analytics/collect", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          host: "cruisepromenade-preview.vercel.app",
          "user-agent": "Mozilla/5.0 Chrome/131.0.0.0",
        },
        body: JSON.stringify({
          events: [
            {
              logicalEventId: "evt_halted_by_runtime_ks",
              eventType: "page_viewed",
              site: "cruisepromenade",
              path: "/planner",
            },
          ],
        }),
      }),
    );
    assert.equal(haltedCollectRes.status, 202);
    const haltedJson = (await haltedCollectRes.json()) as {
      accepted: boolean;
      queuedCount: number;
      killSwitchSource: string;
    };
    assert.equal(haltedJson.accepted, false);
    assert.equal(haltedJson.queuedCount, 0);
    assert.equal(haltedJson.killSwitchSource, "runtime_db");

    // 4. Authenticated admin toggle turns kill switch OFF -> collector resumes immediately without redeploying!
    const disableRes = await controlPost(
      new NextRequest("https://destinationcommandcenter.com/api/admin/analytics/control", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-internal-secret": "test-nonprod-secret-122",
        },
        body: JSON.stringify({ killSwitchActive: false, actorNote: "suite_122_resume" }),
      }),
    );
    assert.equal(disableRes.status, 200);

    const statusRes = await controlGet(
      new NextRequest("https://destinationcommandcenter.com/api/admin/analytics/control", {
        headers: { "x-dcc-internal-secret": "test-nonprod-secret-122" },
      }),
    );
    const statusJson = (await statusRes.json()) as {
      runtimeControls: { killSwitchActive: boolean };
    };
    assert.equal(statusJson.runtimeControls.killSwitchActive, false);

    const resumedCollectRes = await collectPost(
      new NextRequest("https://destinationcommandcenter.com/api/v2/analytics/collect", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          host: "cruisepromenade-preview.vercel.app",
          "user-agent": "Mozilla/5.0 Chrome/131.0.0.0",
        },
        body: JSON.stringify({
          events: [
            {
              logicalEventId: "evt_resumed_after_runtime_ks",
              eventType: "page_viewed",
              site: "cruisepromenade",
              path: "/planner",
            },
          ],
        }),
      }),
    );
    assert.equal(resumedCollectRes.status, 202);
    const resumedJson = (await resumedCollectRes.json()) as {
      accepted: boolean;
      queuedCount: number;
    };
    assert.equal(resumedJson.accepted, true);
    assert.equal(resumedJson.queuedCount, 1);

    await setAnalyticsRuntimeControls({
      killSwitchActive: false,
      simulateOutageActive: false,
      actor: "suite_122_cleanup",
    });
    const finalControls = await getAnalyticsRuntimeControls({ bypassCache: true });
    assert.equal(finalControls.killSwitchActive, false);
  });
});
