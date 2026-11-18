import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";

import {
  createInitialDurableLedgerState,
  getDurableLedgerSyncTelemetry,
  readDurableLedgerState,
  resetDurableLedgerStateForTests,
  resetDurableLedgerSyncTelemetry,
  setDurableLedgerSqlExecutorForTests,
  syncDurableLedgerWithPostgres,
  type DurableLedgerSqlClient,
  type DurableLedgerState,
} from "@/lib/dcc/storage/durableTransactionalStore";
import {
  getOpaqueClickAttributionById,
  issueOpaqueClickAttribution,
  reconcilePartnerWebhookByClickId,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";

function createMockPostgresLedgerBackend(initialState?: DurableLedgerState) {
  const rowsByStoreKey = new Map<
    string,
    { tx_sequence: number; state_json: DurableLedgerState; updated_at: string }
  >();
  const secondaryClicks = new Map<string, unknown>();
  const secondaryCases = new Map<string, unknown>();
  const executedSqlLog: string[] = [];

  if (initialState) {
    rowsByStoreKey.set("dcc_core_ledger_test_v1", {
      tx_sequence: initialState.txSequence,
      state_json: structuredClone(initialState),
      updated_at: initialState.updatedAt,
    });
  }

  const executor: DurableLedgerSqlClient = Object.assign(
    async (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> => {
      const sqlText = strings.join("?").replace(/\s+/g, " ").trim();
      executedSqlLog.push(sqlText);

      if (sqlText.startsWith("CREATE TABLE IF NOT EXISTS")) {
        return [];
      }

      if (
        sqlText.includes("SELECT tx_sequence FROM dcc_durable_transactional_ledger") &&
        !sqlText.includes("state_json")
      ) {
        const storeKey = String(values[0]);
        const row = rowsByStoreKey.get(storeKey);
        return row ? [{ tx_sequence: row.tx_sequence }] : [];
      }

      if (
        sqlText.includes("SELECT tx_sequence, state_json FROM dcc_durable_transactional_ledger")
      ) {
        const storeKey = String(values[0]);
        const row = rowsByStoreKey.get(storeKey);
        return row
          ? [
              {
                tx_sequence: row.tx_sequence,
                state_json: structuredClone(row.state_json),
              },
            ]
          : [];
      }

      if (sqlText.includes("INSERT INTO dcc_durable_transactional_ledger")) {
        const storeKey = String(values[0]);
        const incomingTxSeq = Number(values[1]) || 1;
        const incomingJsonStr = String(values[2]);
        const parsedState = JSON.parse(incomingJsonStr) as DurableLedgerState;
        const existing = rowsByStoreKey.get(storeKey);
        const nextTxSeq = existing
          ? Math.max(existing.tx_sequence + 1, incomingTxSeq)
          : incomingTxSeq;
        rowsByStoreKey.set(storeKey, {
          tx_sequence: nextTxSeq,
          state_json: parsedState,
          updated_at: new Date().toISOString(),
        });
        return [{ tx_sequence: nextTxSeq }];
      }

      if (sqlText.includes("INSERT INTO dcc_opaque_click_attributions")) {
        const clickId = String(values[0]);
        const recordJson = JSON.parse(String(values[6]));
        secondaryClicks.set(clickId, recordJson);
        return [];
      }

      if (sqlText.includes("INSERT INTO dcc_steward_cases_ledger")) {
        const caseId = String(values[0]);
        const caseJson = JSON.parse(String(values[5]));
        secondaryCases.set(caseId, caseJson);
        return [];
      }

      throw new Error(`Unexpected SQL in mock ledger executor: ${sqlText}`);
    },
    {
      transaction: async (queries: Array<Promise<unknown>>) => {
        const out: unknown[] = [];
        for (const q of queries) {
          out.push(await q);
        }
        return out;
      },
    },
  );

  return {
    executor,
    rowsByStoreKey,
    secondaryClicks,
    secondaryCases,
    executedSqlLog,
  };
}

function makeSeededHistoricalState(txSequence = 500): DurableLedgerState {
  const base = createInitialDurableLedgerState(true);
  base.txSequence = txSequence;
  for (let i = 1; i <= 25; i++) {
    const hex = String(i).padStart(20, "0");
    const cid = `clk_qa_${hex}`;
    base.opaqueClicksById[cid] = {
      clickId: cid,
      campaignValue: `clkqa${hex}`,
      handoffId: null,
      decisionReceiptId: `rcpt:hist:${i}`,
      recommendedOperatorId: "viator:110048P1",
      recommendedOperatorName: "Historical Juneau Operator",
      recommendedVehicleClassId: null,
      evidenceVersion: "dcc_catalog_v2",
      applicabilityModelVersion: null,
      applicabilityOutcomeHash: null,
      originatingSite: "destinationcommandcenter.com",
      originatingPage: "/ports/juneau",
      trafficSource: "direct-or-other",
      visitorId: null,
      placementId: "fp-dcc-juneau",
      propertySlug: "juneau",
      surface: "dcc",
      partnerId: null,
      partnerRole: null,
      tripDetails: null,
      isTest: true,
      trafficClass: "test",
      recordStage: "outbound_click",
      followedAt: "2026-11-10T12:00:00.000Z",
      clickCount: 1,
      duplicateDeliveryCount: 0,
      provider: "viator",
      productCode: "110048P1",
      outboundPartnerUrl: `https://www.viator.com/tours/Juneau/x/d941-110048P1?campaign=clkqa${hex}`,
      strippedLeakParams: [],
      strippedPiiParams: [],
      reconciliationState: "pending_partner_event",
      reconciledOutcomes: [],
      createdAt: "2026-11-10T12:00:00.000Z",
    };
    base.opaqueClickIdsByHandoffId[`clkqa${hex}`] = cid;
  }
  return base;
}

test("126.1 — Cold worker hydrates once with zero writes, and repeated/concurrent warm read-only syncs skip fetching state_json and perform zero writes", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcc-p1-t1-"));
  const prevStorePath = process.env.DCC_DURABLE_STORE_PATH;
  const prevStoreKey = process.env.DCC_DURABLE_STORE_KEY;

  try {
    process.env.DCC_DURABLE_STORE_PATH = path.join(tmpDir, "worker-a.json");
    process.env.DCC_DURABLE_STORE_KEY = "dcc_core_ledger_test_v1";

    const seeded = makeSeededHistoricalState(500);
    const mockPg = createMockPostgresLedgerBackend(seeded);
    setDurableLedgerSqlExecutorForTests(mockPg.executor);
    resetDurableLedgerSyncTelemetry();

    // 1. Cold worker first read-only sync: fetches state_json once, writes 0 times to Postgres
    const hydrated = await syncDurableLedgerWithPostgres();
    assert.equal(hydrated.txSequence, 500);
    assert.equal(Object.keys(hydrated.opaqueClicksById).length, 25);

    const afterCold = getDurableLedgerSyncTelemetry();
    assert.equal(afterCold.metadataChecks, 1);
    assert.equal(afterCold.fullStateFetches, 1);
    assert.equal(afterCold.ledgerWrites, 0);
    assert.equal(afterCold.secondaryClickUpserts, 0);
    assert.equal(afterCold.secondaryCaseUpserts, 0);
    assert.equal(
      mockPg.rowsByStoreKey.get("dcc_core_ledger_test_v1")?.tx_sequence,
      500,
    );

    // 2. Next 8 warm sequential read-only syncs + 4 concurrent SSR read-only syncs
    for (let i = 0; i < 8; i++) {
      const state = await syncDurableLedgerWithPostgres();
      assert.equal(state.txSequence, 500);
    }
    const concurrent = await Promise.all([
      syncDurableLedgerWithPostgres(),
      syncDurableLedgerWithPostgres(),
      syncDurableLedgerWithPostgres(),
      syncDurableLedgerWithPostgres(),
    ]);
    assert.equal(concurrent.length, 4);

    const afterWarm = getDurableLedgerSyncTelemetry();
    assert.equal(
      afterWarm.fullStateFetches,
      1,
      "Unchanged remote tx_sequence must NEVER re-transfer state_json",
    );
    assert.equal(afterWarm.ledgerWrites, 0, "Read-only syncs must NEVER write to Postgres");
    assert.equal(afterWarm.secondaryClickUpserts, 0);
    assert.ok(afterWarm.skippedUnchangedReads >= 9);
    assert.ok(afterWarm.coalescedInFlightReads >= 3);
    assert.equal(
      mockPg.rowsByStoreKey.get("dcc_core_ledger_test_v1")?.tx_sequence,
      500,
    );
  } finally {
    setDurableLedgerSqlExecutorForTests(null);
    if (prevStorePath === undefined) delete process.env.DCC_DURABLE_STORE_PATH;
    else process.env.DCC_DURABLE_STORE_PATH = prevStorePath;
    if (prevStoreKey === undefined) delete process.env.DCC_DURABLE_STORE_KEY;
    else process.env.DCC_DURABLE_STORE_KEY = prevStoreKey;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("126.2 — Read-only SSR pages and read-only match/planner GET routes produce zero ledger writes while preserving identical output contracts", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcc-p1-t2-"));
  const prevStorePath = process.env.DCC_DURABLE_STORE_PATH;
  const prevStoreKey = process.env.DCC_DURABLE_STORE_KEY;

  try {
    process.env.DCC_DURABLE_STORE_PATH = path.join(tmpDir, "worker-ssr.json");
    process.env.DCC_DURABLE_STORE_KEY = "dcc_core_ledger_test_v1";

    const seeded = makeSeededHistoricalState(500);
    const mockPg = createMockPostgresLedgerBackend(seeded);
    setDurableLedgerSqlExecutorForTests(mockPg.executor);

    // Warm the worker cache once
    await syncDurableLedgerWithPostgres();
    resetDurableLedgerSyncTelemetry();

    const VailPageModule = await import(
      "@/app/transportation/colorado/denver-to-vail-shuttle-guide/page"
    );
    const { GET: toursMatchGet } = await import("@/app/api/v1/tours/match/route");
    const { GET: winterPlanGet } = await import(
      "@/app/api/v1/cruises/winter-excursion-plan/route"
    );

    // 1. Render SSR Denver-to-Vail shuttle guide
    const vailEl = await VailPageModule.default();
    const vailHtml = renderToStaticMarkup(vailEl);
    assert.ok(vailHtml.includes('data-testid="opaque-partner-booking-link"'));
    assert.ok(vailHtml.includes("Book Compiled Vehicle Class"));

    // 2. Call read-only GET /api/v1/tours/match with placementId
    const matchRes = await toursMatchGet(
      new NextRequest(
        "https://destinationcommandcenter.com/api/v1/tours/match?destination=new-orleans&date=2026-11-25&adults=2&approvedTourIds=dcc:tour:viator:6455NOLAAIR&placementId=nola-hotel-monteleone-demo-pilot&enableShortlistLiveCheck=0&isTest=1",
      ),
    );
    assert.equal(matchRes.status, 200);
    const matchJson = await matchRes.json();
    assert.ok(matchJson.options.length >= 1);
    assert.ok(
      matchJson.options[0].bookingPath.trackedClickUrl.startsWith("/api/v1/ads/click?"),
    );

    // 3. Call read-only GET /api/v1/cruises/winter-excursion-plan (without recordOpen=1)
    const planRes = await winterPlanGet(
      new NextRequest(
        "https://destinationcommandcenter.com/api/v1/cruises/winter-excursion-plan?plan=INDY-2027-01-24&live=0&isTest=1",
      ),
    );
    assert.equal(planRes.status, 200);
    const planJson = await planRes.json();
    assert.equal(planJson.plan.planCode, "INDY-2027-01-24");

    // Allow macrotasks to settle and verify ZERO writes & ZERO phantom click records
    await new Promise((r) => setTimeout(r, 30));

    const telemetry = getDurableLedgerSyncTelemetry();
    assert.equal(telemetry.fullStateFetches, 0, "Warm read-only routes must fetch 0 state_json payloads");
    assert.equal(telemetry.ledgerWrites, 0, "Read-only SSR & API routes must produce 0 ledger writes");
    assert.equal(telemetry.secondaryClickUpserts, 0);
    assert.equal(
      mockPg.rowsByStoreKey.get("dcc_core_ledger_test_v1")?.tx_sequence,
      500,
    );
    assert.equal(
      Object.keys(readDurableLedgerState().opaqueClicksById).length,
      25,
      "Read-only requests must not bloat opaqueClicksById with unfollowed phantom clicks",
    );
  } finally {
    setDurableLedgerSqlExecutorForTests(null);
    if (prevStorePath === undefined) delete process.env.DCC_DURABLE_STORE_PATH;
    else process.env.DCC_DURABLE_STORE_PATH = prevStorePath;
    if (prevStoreKey === undefined) delete process.env.DCC_DURABLE_STORE_KEY;
    else process.env.DCC_DURABLE_STORE_KEY = prevStoreKey;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("126.3 — Genuine click handoffs and reconciliations persist once, upsert only dirty clicks, preserve 100% history, recover on cold workers, and merge concurrent worker writes safely", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcc-p1-t3-"));
  const prevStorePath = process.env.DCC_DURABLE_STORE_PATH;
  const prevStoreKey = process.env.DCC_DURABLE_STORE_KEY;

  try {
    const workerAPath = path.join(tmpDir, "worker-a.json");
    const workerBPath = path.join(tmpDir, "worker-b.json");
    const workerCPath = path.join(tmpDir, "worker-c-cold.json");
    process.env.DCC_DURABLE_STORE_KEY = "dcc_core_ledger_test_v1";

    const seeded = makeSeededHistoricalState(500);
    const mockPg = createMockPostgresLedgerBackend(seeded);
    setDurableLedgerSqlExecutorForTests(mockPg.executor);

    // Hydrate Worker A and Worker B at tx_sequence = 500
    process.env.DCC_DURABLE_STORE_PATH = workerAPath;
    await syncDurableLedgerWithPostgres();
    process.env.DCC_DURABLE_STORE_PATH = workerBPath;
    await syncDurableLedgerWithPostgres();

    // On Worker A: match a tour (read-only) then follow its signed trackedClickUrl via /api/v1/ads/click
    process.env.DCC_DURABLE_STORE_PATH = workerAPath;
    resetDurableLedgerSyncTelemetry();

    const { GET: toursMatchGet } = await import("@/app/api/v1/tours/match/route");
    const { GET: adsClickGet } = await import("@/app/api/v1/ads/click/route");
    const { POST: evalPost } = await import(
      "@/app/api/v1/applicability/evaluate/route"
    );

    const matchRes = await toursMatchGet(
      new NextRequest(
        "https://destinationcommandcenter.com/api/v1/tours/match?destination=new-orleans&date=2026-11-25&adults=2&approvedTourIds=dcc:tour:viator:6455NOLAAIR&placementId=nola-hotel-monteleone-demo-pilot&enableShortlistLiveCheck=0&isTest=1",
      ),
    );
    const matchJson = await matchRes.json();
    const trackedUrl = matchJson.options[0].bookingPath.trackedClickUrl as string;
    const expectedClickId = matchJson.options[0].bookingPath.clickId as string;

    const clickRes = await adsClickGet(
      new Request(`https://destinationcommandcenter.com${trackedUrl}&isTest=true`),
    );
    assert.equal(clickRes.status, 302);
    assert.equal(clickRes.headers.get("x-dcc-referral-id"), expectedClickId);

    await new Promise((r) => setTimeout(r, 30));

    const mutTelemetry = getDurableLedgerSyncTelemetry();
    assert.equal(
      mutTelemetry.fullStateFetches,
      0,
      "Warm worker mutation when remote tx_sequence is unchanged must NOT re-download state_json",
    );
    assert.equal(
      mutTelemetry.ledgerWrites,
      1,
      "Genuine click handoff must persist to Postgres exactly ONCE (no double/quadruple writes)",
    );
    assert.equal(
      mutTelemetry.secondaryClickUpserts,
      1,
      "Only the 1 mutated click should be upserted to dcc_opaque_click_attributions, not 20 unchanged rows",
    );
    assert.equal(
      mockPg.rowsByStoreKey.get("dcc_core_ledger_test_v1")?.tx_sequence,
      501,
    );

    // Concurrent mutation on Worker B (still at local base 500 while Postgres is now at 501):
    // Also test ApplicableRouteDecisionPanel initial-click commit via POST /api/v1/applicability/evaluate
    process.env.DCC_DURABLE_STORE_PATH = workerBPath;
    resetDurableLedgerSyncTelemetry();

    const ssrPreviewClickId = "clk_qa_99999999999999999999";
    const evalRes = await evalPost(
      new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clickId: ssrPreviewClickId,
          recordStage: "outbound_click",
          corridorId: "corridor:denver-vail-i70",
          direction: "OUTBOUND",
          origin: "DEN",
          destination: "Vail",
          travelDate: "2026-12-20",
          passengerCount: 7,
          standardBagCount: 7,
          skiOrOversizeBagCount: 7,
          isTest: true,
        }),
      }),
    );
    assert.equal(evalRes.status, 200);
    const evalJson = await evalRes.json();
    assert.equal(evalJson.opaqueAttribution.clickId, ssrPreviewClickId);

    const workerBTelemetry = getDurableLedgerSyncTelemetry();
    assert.equal(
      workerBTelemetry.fullStateFetches,
      1,
      "Stale Worker B must pull & merge Worker A's advance once before pushing",
    );
    assert.equal(workerBTelemetry.ledgerWrites, 1);
    assert.equal(
      mockPg.rowsByStoreKey.get("dcc_core_ledger_test_v1")?.tx_sequence,
      502,
    );

    // Cold Worker C recovery: verify 0 writes on read AND 100% of historical + Worker A + Worker B records recovered!
    process.env.DCC_DURABLE_STORE_PATH = workerCPath;
    resetDurableLedgerSyncTelemetry();
    const recovered = await syncDurableLedgerWithPostgres();
    assert.equal(recovered.txSequence, 502);
    assert.equal(getDurableLedgerSyncTelemetry().ledgerWrites, 0);
    assert.equal(Object.keys(recovered.opaqueClicksById).length, 25 + 2);
    assert.equal(
      getOpaqueClickAttributionById(expectedClickId)?.recordStage,
      "outbound_click",
    );
    assert.equal(
      getOpaqueClickAttributionById(ssrPreviewClickId)?.recordStage,
      "outbound_click",
    );

    // Reconcile booking on Worker C and push once -> verify outcome preserved
    const recon = reconcilePartnerWebhookByClickId({
      clickId: expectedClickId,
      provider: "viator",
      providerBookingRef: "BR-PHASE1-TEST-01",
      eventType: "BOOKING_CONFIRMED",
      grossRevenueUsd: 198,
      estimatedCommissionUsd: 15.84,
      paidCommissionUsd: null,
      currency: "USD",
      isTest: true,
    });
    assert.equal(recon.matched, true);
    await syncDurableLedgerWithPostgres({ forcePushLocal: true });
    assert.equal(
      mockPg.rowsByStoreKey.get("dcc_core_ledger_test_v1")?.tx_sequence,
      503,
    );
    assert.equal(
      mockPg.rowsByStoreKey.get("dcc_core_ledger_test_v1")?.state_json
        .opaqueClicksById[expectedClickId]?.reconciledOutcomes.length,
      1,
    );
  } finally {
    setDurableLedgerSqlExecutorForTests(null);
    resetDurableLedgerStateForTests();
    if (prevStorePath === undefined) delete process.env.DCC_DURABLE_STORE_PATH;
    else process.env.DCC_DURABLE_STORE_PATH = prevStorePath;
    if (prevStoreKey === undefined) delete process.env.DCC_DURABLE_STORE_KEY;
    else process.env.DCC_DURABLE_STORE_KEY = prevStoreKey;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
