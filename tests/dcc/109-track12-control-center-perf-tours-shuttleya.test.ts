import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, buildAdminSessionValue } from "@/lib/adminAccess";
import { buildOwnerControlCenterSnapshot } from "@/lib/dcc/ownerControlCenter";
import { GET as getControlCenterRoute } from "@/app/api/admin/control-center/route";
import { canViewTourAdminDebugDiagnostics } from "@/lib/dcc/tourAdminDebugGate";
import TourDetailPage from "@/app/tours/[id]/page";
import { getAskDccEvidence } from "@/lib/dcc/ask/service";
import { SHUTTLEYA_TRUTH } from "@/apps/shuttleya/lib/siteTruth";
import { SHUTTLEYA_ROOT_TRUTH } from "@/lib/dcc/shuttleyaTruth";
import { GET as getShuttleYaSubAppAgent } from "@/apps/shuttleya/app/agent.json/route";
import { GET as getShuttleYaSubAppLlms } from "@/apps/shuttleya/app/llms.txt/route";

const ROOT = process.cwd();

test("Item 1.A: Owner Control Center parses nested metrics28d (GoSno + PARR), CP sampledSharedPlannersCount, and enforces strict 10-way separation", async () => {
  const prevAdminKey = process.env.ADMIN_ACCESS_KEY;
  process.env.ADMIN_ACCESS_KEY = "track12-test-admin-secret";

  try {
    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("cruisepromenade.com")) {
        return new Response(
          JSON.stringify({
            sampledSharedPlannersCount: 25,
            planners: {
              sampledSharedPlannersCount: 25,
              genuineSharedPlannersCount: 3,
              testSharedPlannersCount: 22,
              needsAssistanceGuestsCount: 2,
              plannersWithSplitsCount: 1,
              trackedGuestsCount: 11,
            },
            catalog: {
              confirmedSailDatesCount: 1840,
              verifiedFullItinerarySailingsCount: 312,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.includes("gosno.co")) {
        return new Response(
          JSON.stringify({
            metrics28d: {
              testRecordsExcluded: 9,
              genuineBookingsTotal: 7,
              paidBookings: 5,
              confirmedUnpaidBookings: 2,
              openQuoteRequests: 4,
              activeVehicleHolds: 1,
              awaitingBalanceOrders: 1,
              paidGrossSalesUsd: 3850,
              confirmedUnpaidGrossUsd: 1120,
              awaitingBalanceGrossUsd: 450,
              netOperatingRevenueUsd: null,
              provisioningExceptions: 2,
              needsReviewOrders: 1,
            },
            rezdyHealth: {
              failedSyncCount24h: 1,
              lastCronStatus: "degraded",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.includes("partyatredrocks.com")) {
        return new Response(
          JSON.stringify({
            metrics28d: {
              testRecordsExcluded: 14,
              genuineOrdersTotal: 12,
              paidOrders: 10,
              confirmedUnpaidOrders: 2,
              openQuoteRequests: 3,
              activeVehicleHolds: 2,
              awaitingBalanceOrders: 3,
              paidGrossSalesUsd: 2640,
              confirmedUnpaidGrossUsd: 520,
              awaitingBalanceGrossUsd: 780,
              netOperatingRevenueUsd: null,
              provisioningExceptions: 0,
              needsReviewOrders: 1,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("Not Found", { status: 404 });
    };

    const snapshot = await buildOwnerControlCenterSnapshot({
      env: {
        ...process.env,
        DCC_CP_SERVICE_SECRET: "sec",
        DCC_GOSNO_SERVICE_SECRET: "sec",
        DCC_PARR_SERVICE_SECRET: "sec",
      },
      fetchImpl: mockFetch,
    });

    // GoSno nested metrics28d assertions
    assert.equal(snapshot.triageQueue.gosnoOps.testRecordsExcluded28d, 9);
    assert.equal(snapshot.triageQueue.gosnoOps.genuineOrdersTotal28d, 7);
    assert.equal(snapshot.triageQueue.gosnoOps.paidOrders28d, 5);
    assert.equal(snapshot.triageQueue.gosnoOps.confirmedUnpaidOrders28d, 2);
    assert.equal(snapshot.triageQueue.gosnoOps.openQuoteRequests28d, 4);
    assert.equal(snapshot.triageQueue.gosnoOps.activeHoldsCount, 1);
    assert.equal(snapshot.triageQueue.gosnoOps.awaitingBalanceOrders28d, 1);
    assert.equal(snapshot.triageQueue.gosnoOps.paidGrossSalesUsd28d, 3850);
    assert.equal(snapshot.triageQueue.gosnoOps.confirmedUnpaidGrossUsd28d, 1120);
    assert.equal(snapshot.triageQueue.gosnoOps.awaitingBalanceGrossUsd28d, 450);
    assert.equal(snapshot.triageQueue.gosnoOps.netOperatingRevenueUsd28d, null);
    assert.equal(snapshot.triageQueue.gosnoOps.provisioningExceptions, 2);
    assert.equal(snapshot.triageQueue.gosnoOps.needsReviewOrders, 1);
    assert.deepEqual(snapshot.triageQueue.gosnoOps.rezdyHealth, {
      failedSyncCount24h: 1,
      lastCronStatus: "degraded",
    });

    // PARR nested metrics28d assertions
    assert.equal(snapshot.triageQueue.parrOps.testRecordsExcluded28d, 14);
    assert.equal(snapshot.triageQueue.parrOps.genuineOrdersTotal28d, 12);
    assert.equal(snapshot.triageQueue.parrOps.paidOrders28d, 10);
    assert.equal(snapshot.triageQueue.parrOps.confirmedUnpaidOrders28d, 2);
    assert.equal(snapshot.triageQueue.parrOps.openQuoteRequests28d, 3);
    assert.equal(snapshot.triageQueue.parrOps.activeHoldsCount, 2);
    assert.equal(snapshot.triageQueue.parrOps.awaitingBalanceOrders28d, 3);
    assert.equal(snapshot.triageQueue.parrOps.paidGrossSalesUsd28d, 2640);
    assert.equal(snapshot.triageQueue.parrOps.netOperatingRevenueUsd28d, null);

    // Cruise Promenade separation assertions
    assert.equal(snapshot.triageQueue.cruisePromenade.sampledSharedPlannersCount, 25);
    assert.equal(snapshot.triageQueue.cruisePromenade.genuineSharedPlannersCount, 3);
    assert.equal(snapshot.triageQueue.cruisePromenade.testSharedPlannersCount, 22);
    assert.equal(snapshot.triageQueue.cruisePromenade.sharedPlannersCount, 3);
    assert.equal(snapshot.triageQueue.cruisePromenade.confirmedSailDatesCount, 1840);
    assert.equal(snapshot.triageQueue.cruisePromenade.verifiedFullItinerarySailingsCount, 312);

    // Strict 10-way separation ledger assertions
    const rows = snapshot.connectedFunnel28d.strictSeparation10Way28d;
    assert.equal(rows.length, 10);
    assert.deepEqual(
      rows.map((r) => r.key),
      [
        "test_records_excluded",
        "genuine_bookings",
        "paid_bookings",
        "confirmed_unpaid_bookings",
        "open_quotes",
        "active_holds",
        "awaiting_balance_orders",
        "gross_merchant_sales",
        "net_operating_revenue",
        "affiliate_commissions",
      ],
    );

    const grossRow = rows.find((r) => r.key === "gross_merchant_sales")!;
    assert.equal(grossRow.headlineValue, "$6,490");
    assert.match(
      grossRow.antiConflationDisclosure,
      /Gross Merchant Sales — Not Profit; Excludes Operating Costs, Driver Pay, Processor Fees & Refunds/,
    );

    const netRow = rows.find((r) => r.key === "net_operating_revenue")!;
    assert.equal(netRow.headlineValue, "Unreconciled in app DB");
    assert.equal(
      snapshot.connectedFunnel28d.strictlySeparatedRevenue.directMorGrossTrack
        .netOperatingRevenueStatusLabel,
      "Unreconciled in app DB",
    );

    const affRow = rows.find((r) => r.key === "affiliate_commissions")!;
    assert.match(
      affRow.antiConflationDisclosure,
      /Clicks \/ Handoffs Only — Not Bookings or Revenue/,
    );

    // Rezdy triage item surfaces inside gosno-parr-mor-exceptions
    const morItem = snapshot.triageQueue.items.find(
      (item) => item.id === "gosno-parr-mor-exceptions",
    );
    assert.ok(morItem, "Expected GoSno/PARR MoR & Rezdy triage item");
    assert.equal(morItem.priority, "high");
    assert.match(morItem.detail, /Rezdy health:/);

    // Verify /api/admin/control-center returns strictSeparation10Way28d when authenticated
    const adminCookie = buildAdminSessionValue();
    const apiReq = new NextRequest("https://www.destinationcommandcenter.com/api/admin/control-center", {
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${adminCookie}` },
    });
    const apiRes = await getControlCenterRoute(apiReq);
    assert.equal(apiRes.status, 200);
    const apiJson = await apiRes.json();
    assert.equal(apiJson.connectedFunnel28d.strictSeparation10Way28d.length, 10);
  } finally {
    if (prevAdminKey === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = prevAdminKey;
  }
});

test("Item 1.C: /transportation/colorado and /juneau enforce revalidate = 900 ISR, remove syncDurableLedgerWithPostgres, and isolate query state in Suspense client boundaries", () => {
  const coloradoSrc = fs.readFileSync(
    path.join(ROOT, "app/transportation/colorado/page.tsx"),
    "utf8",
  );
  const juneauSrc = fs.readFileSync(
    path.join(ROOT, "app/juneau/page.tsx"),
    "utf8",
  );
  const travelRefSrc = fs.readFileSync(
    path.join(ROOT, "lib/dcc/travelReference.ts"),
    "utf8",
  );
  const travelRefExpSrc = fs.readFileSync(
    path.join(ROOT, "app/components/dcc/TravelReferenceExperience.tsx"),
    "utf8",
  );

  assert.match(coloradoSrc, /export const revalidate = 900;/);
  assert.doesNotMatch(coloradoSrc, /force-dynamic/);
  assert.doesNotMatch(coloradoSrc, /syncDurableLedgerWithPostgres/);
  assert.doesNotMatch(coloradoSrc, /await searchParams/);
  assert.doesNotMatch(coloradoSrc, /initialResult=/);
  assert.match(coloradoSrc, /ColoradoQueryTopCardsClient/);

  assert.match(juneauSrc, /export const revalidate = 900;/);
  assert.doesNotMatch(juneauSrc, /await searchParams/);
  assert.match(juneauSrc, /JuneauQueryReplanSlot/);

  assert.doesNotMatch(travelRefSrc, /syncDurableLedgerWithPostgres/);
  assert.doesNotMatch(travelRefExpSrc, /syncDurableLedgerWithPostgres/);
  assert.match(travelRefExpSrc, /unstable_cache/);
  assert.match(travelRefExpSrc, /AbortSignal\.timeout\(TELEMETRY_FETCH_TIMEOUT_MS\)/);
});

test("Item 1.D: /tours/[id] hides Viator debug cards from customer HTML unless authenticated admin, homepage routes to destination/trip hubs, and Ask DCC resolves Copper Mountain", async () => {
  const prevAdminKey = process.env.ADMIN_ACCESS_KEY;
  process.env.ADMIN_ACCESS_KEY = "track12-tour-debug-secret";

  try {
    const validSession = buildAdminSessionValue();
    assert.equal(
      canViewTourAdminDebugDiagnostics({ adminSessionCookie: null, debugParam: "1" }),
      false,
      "Unauthenticated ?debug=1 must NEVER unlock internal Viator cards",
    );
    assert.equal(
      canViewTourAdminDebugDiagnostics({ adminSessionCookie: "forged.token", debugParam: "1" }),
      false,
    );
    assert.equal(
      canViewTourAdminDebugDiagnostics({ adminSessionCookie: validSession, debugParam: undefined }),
      true,
    );
    assert.equal(
      canViewTourAdminDebugDiagnostics({ adminSessionCookie: validSession, debugParam: "1" }),
      true,
    );
    assert.equal(
      canViewTourAdminDebugDiagnostics({ adminSessionCookie: validSession, debugParam: "0" }),
      false,
    );

    // Render customer HTML for a seeded tour (no admin cookie in test context)
    const toursList = JSON.parse(
      fs.readFileSync(path.join(ROOT, "data/tours.json"), "utf8"),
    ) as Array<{ id: string | number }>;
    const firstTourId = String(toursList[0].id);
    const tree = await TourDetailPage({
      params: Promise.resolve({ id: firstTourId }),
      searchParams: Promise.resolve({ debug: "1" }),
    });
    const customerHtml = renderToStaticMarkup(tree);
    assert.doesNotMatch(customerHtml, /tour-detail-admin-viator-diagnostics/);
    assert.doesNotMatch(customerHtml, /Live availability check/i);
    assert.doesNotMatch(customerHtml, /Prepare booking session/i);
    assert.doesNotMatch(customerHtml, /Booking questions/i);
    assert.doesNotMatch(customerHtml, /Detail source:/i);

    // Homepage routing check
    const homeSrc = fs.readFileSync(
      path.join(ROOT, "app/components/dcc/LocationFirstHomeFast.tsx"),
      "utf8",
    );
    assert.doesNotMatch(homeSrc, /href="\/tours"/);
    assert.match(homeSrc, /href="\/destinations"/);
    assert.match(homeSrc, /href="\/transportation\/colorado"/);

    // Ask DCC Copper Mountain routing check
    const copperEvidence = getAskDccEvidence(
      "Best private transfer from Denver airport to Copper Mountain for 6 people with ski bags?",
    );
    assert.ok(copperEvidence.sources.length > 0, "Expected Colorado transfer sources for Copper Mountain");
    assert.ok(
      copperEvidence.sources.every(
        (s) => s.category === "colorado" || s.category === "transportation",
      ),
    );
    if (copperEvidence.handoff?.href.includes("gosno.co")) {
      assert.match(copperEvidence.handoff.href, /destination=Copper\+Mountain|destination=Copper%20Mountain/);
    }
  } finally {
    if (prevAdminKey === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = prevAdminKey;
  }
});

test("Item 1.E: ShuttleYa removes dead redrocksdd.com and prototype vibearoundtown.com links across sub-app and root mirror", async () => {
  const handoffUrlsSubApp = SHUTTLEYA_TRUTH.operator_handoffs.map((h) => h.url);
  const handoffUrlsRoot = SHUTTLEYA_ROOT_TRUTH.operator_handoffs.map((h) => h.url);

  for (const url of [...handoffUrlsSubApp, ...handoffUrlsRoot]) {
    assert.doesNotMatch(url, /redrocksdd\.com/i);
    assert.doesNotMatch(url, /vibearoundtown\.com/i);
  }

  assert.ok(handoffUrlsSubApp.some((u) => u.startsWith("https://gosno.co")));
  assert.ok(handoffUrlsSubApp.some((u) => u.startsWith("https://bigsky.gosno.co")));
  assert.ok(handoffUrlsSubApp.some((u) => u.startsWith("https://partyatredrocks.com")));
  assert.ok(handoffUrlsSubApp.some((u) => u.startsWith("https://www.destinationcommandcenter.com/ports")));

  const agentRes = getShuttleYaSubAppAgent();
  const agentBody = await agentRes.text();
  assert.doesNotMatch(agentBody, /redrocksdd\.com|vibearoundtown\.com/i);

  const llmsRes = getShuttleYaSubAppLlms();
  const llmsBody = await llmsRes.text();
  assert.doesNotMatch(llmsBody, /redrocksdd\.com|vibearoundtown\.com/i);
});
