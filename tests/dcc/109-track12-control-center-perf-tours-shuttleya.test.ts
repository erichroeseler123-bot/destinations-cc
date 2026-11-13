import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
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
import {
  MAX_REZGO_CACHE_ENTRIES,
  assessRezgoDepartureAgainstShipWindow,
  buildNormalizedJuneauSupplierFeed,
  buildPublicJuneauLiveAvailabilityView,
  clearRezgoReadOnlyCacheForTesting,
  getRezgoReadOnlyCacheStatsForTesting,
  getSereneRezgoReadinessStatus,
  inspectSereneRezgoInventoryReadOnly,
  resolveJuneauToursDockToDockProvenance,
  revalidatePublicJuneauDepartureBeforeCheckout,
  sanitizeRezgoDiagnosticMessage,
} from "@/lib/dcc/liveSlots/rezgoReadOnly";
import { JuneauLiveAvailabilitySection } from "@/components/dcc/JuneauLiveAvailabilitySection";
import {
  assessLfseJuneauDepartureAgainstShipWindow,
  buildLfsePublicJuneauAvailabilityView,
  clearLfseJuneauSupplierFeedCacheForTesting,
  getLfseJuneauSupplierFeedCacheStatsForTesting,
  loadLfseJuneauNormalizedSupplierFeed,
  resolveLfseJuneauToursDockToDockProvenance,
} from "@/apps/last-frontier-shore-excursions/lib/dccJuneauSupplierFeed";
import { JuneauNormalizedSupplierFeedSection } from "@/apps/last-frontier-shore-excursions/components/JuneauNormalizedSupplierFeedSection";
import { THREE_MARKET_DIRECT_OPERATOR_PITCH_KITS } from "@/lib/dcc/commerce/directOperatorActivationKit";
import { resolveProviderKeyFromBookingSystem } from "@/lib/dcc/operatorOnboardingStore";

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
              testRecordsExcluded: {
                bookings28d: 4,
                quotes28d: 5,
                activeHolds: 0,
              },
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

test("Phase 2 Distribution & Revenue: 6-question daily cockpit, 3-market direct operator kits (incl. Colorado), and Serene isolated read-only Rezgo safety gate", async () => {
  assert.equal(THREE_MARKET_DIRECT_OPERATOR_PITCH_KITS.length, 5);
  assert.ok(
    THREE_MARKET_DIRECT_OPERATOR_PITCH_KITS.some(
      (k) => k.destinationPort === "Colorado (I-70 / Red Rocks)",
    ),
  );
  assert.equal(resolveProviderKeyFromBookingSystem("Rezgo"), "rezgo");

  // Default state: awaiting credentials, live booking strictly disallowed, isolated & secondary
  const defaultRezgo = getSereneRezgoReadinessStatus({});
  assert.equal(defaultRezgo.stage, "awaiting_credentials");
  assert.equal(defaultRezgo.liveBookingAllowed, false);
  assert.equal(defaultRezgo.isolatedSecondaryProperty, true);
  assert.equal(defaultRezgo.influencesPrimaryDccRanking, false);

  // Even if someone sets REZGO_SERENE_LIVE_BOOKING_ENABLED=true without passing upstream gates, liveBookingAllowed stays false!
  const prematureRezgo = getSereneRezgoReadinessStatus({
    REZGO_SERENE_CID: "99999",
    REZGO_SERENE_API_KEY: "test_rezgo_secret_key_123",
    REZGO_SERENE_LIVE_BOOKING_ENABLED: "true",
  });
  assert.equal(prematureRezgo.liveBookingAllowed, false);
  assert.equal(prematureRezgo.stage, "ready_for_readonly_inspection");

  // Read-only XML inspection makes GET-only company & search calls and parses items cleanly
  const requestedUrls: string[] = [];
  const inspected = await inspectSereneRezgoInventoryReadOnly({
    env: {
      REZGO_SERENE_CID: "99999",
      REZGO_SERENE_API_KEY: "test_rezgo_secret_key_123",
    },
    searchDate: "2027-06-15",
    fetchImpl: async (input) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes("i=company")) {
        return new Response(
          "<response><company_name>Juneau Tours &amp; Whale Watch</company_name><domain>juneautours.rezgo.com</domain><currency>USD</currency></response>",
          { status: 200 },
        );
      }
      return new Response(
        "<response><item><uid>1042</uid><com>5857P23</com><item><![CDATA[Ultimate Juneau Whale Watch]]></item><option><![CDATA[Morning Departure]]></option><duration>3 hours</duration><price_adult>169.00</price_adult><currency_base>USD</currency_base></item></response>",
        { status: 200 },
      );
    },
  });
  assert.equal(inspected.ok, true);
  assert.equal(inspected.readOnly, true);
  assert.equal(inspected.mutatedRemoteState, false);
  assert.equal(inspected.itemsCount, 1);
  assert.equal(inspected.items[0].uid, "1042");
  assert.equal(inspected.items[0].itemName, "Ultimate Juneau Whale Watch");
  assert.equal(requestedUrls.length, 2);
  assert.ok(requestedUrls.every((u) => u.includes("i=company") || u.includes("i=search")));

  const snapshot = await buildOwnerControlCenterSnapshot({
    env: { DCC_DISABLE_NEON_COMMERCE: "1" },
  });
  assert.equal(
    snapshot.dailyBusinessCockpit.didWeMakeMoney.question,
    "1. Did we make money?",
  );
  assert.equal(
    snapshot.dailyBusinessCockpit.bookingsNeedingAttention.question,
    "2. What bookings need attention?",
  );
  assert.equal(
    snapshot.dailyBusinessCockpit.automationHealth.question,
    "3. Did any automation fail?",
  );
  assert.equal(
    snapshot.dailyBusinessCockpit.inquiriesNeedingReply.question,
    "4. Which inquiries need a reply?",
  );
  assert.equal(
    snapshot.dailyBusinessCockpit.linksProducingSales.question,
    "5. Which links are producing sales?",
  );
  assert.equal(
    snapshot.dailyBusinessCockpit.operatorAndOrganizerFollowUps.question,
    "6. Which operator or organizer needs follow-up?",
  );
  assert.equal(
    snapshot.dailyBusinessCockpit.linksProducingSales.wnoDiagnostic.diagnosticClickThreshold,
    100,
  );
  assert.equal(
    snapshot.dailyBusinessCockpit.operatorAndOrganizerFollowUps.directOperators3Markets.markets.length,
    3,
  );
});

test("Owner-only Rezgo inspection action, secret scrubbing, cross-surface reconciliation, and LFSE normalized feed fallback", async () => {
  const prevAdminKey = process.env.ADMIN_ACCESS_KEY;
  const prevCid = process.env.REZGO_SERENE_CID;
  const prevApiKey = process.env.REZGO_SERENE_API_KEY;

  process.env.ADMIN_ACCESS_KEY = "owner-inspect-test-secret";
  process.env.REZGO_SERENE_CID = "SERENE_SECRET_CID_888";
  process.env.REZGO_SERENE_API_KEY = "SERENE_SECRET_API_KEY_99999999";
  clearRezgoReadOnlyCacheForTesting();

  const origFetch = globalThis.fetch;

  try {
    // 1. Unauthenticated caller is strictly rejected (401)
    const unauthReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/admin/control-center?action=inspect_serene_rezgo",
    );
    const unauthRes = await getControlCenterRoute(unauthReq);
    assert.equal(unauthRes.status, 401);

    // 2. Diagnostic scrubber strips transcode, key, and raw secret values
    const scrubbed = sanitizeRezgoDiagnosticMessage(
      "Failed GET https://xml.rezgo.com/xml?transcode=SERENE_SECRET_CID_888&key=SERENE_SECRET_API_KEY_99999999&i=search (cid SERENE_SECRET_CID_888)",
      ["SERENE_SECRET_CID_888", "SERENE_SECRET_API_KEY_99999999"],
    );
    assert.ok(scrubbed);
    assert.doesNotMatch(scrubbed, /SERENE_SECRET_CID_888/);
    assert.doesNotMatch(scrubbed, /SERENE_SECRET_API_KEY_99999999/);

    // 3. Authenticated owner inspection returns company, UIDs, options, reconciliation, and conflicts with ZERO secret leakage
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.includes("i=company")) {
        return new Response(
          "<response><company_name>Juneau Tours &amp; Whale Watch</company_name><domain>juneautours.rezgo.com</domain><currency>USD</currency></response>",
          { status: 200 },
        );
      }
      if (url.includes("i=search")) {
        return new Response(
          `<response>
            <item>
              <id>1</id>
              <uid>2001</uid>
              <com>5857P22</com>
              <item><![CDATA[Mendenhall Glacier & Whale Watch Combo]]></item>
              <option><![CDATA[Standard Combo]]></option>
              <duration>5 hours</duration>
              <time>09:30 AM</time>
              <price_adult>199.00</price_adult>
              <price_child>159.00</price_child>
              <currency_base>USD</currency_base>
              <availability>18</availability>
            </item>
            <item>
              <id>2</id>
              <uid>2002</uid>
              <com></com>
              <item><![CDATA[Mendenhall Glacier Blue Bus Express Shuttle]]></item>
              <option><![CDATA[Round-Trip Shuttle]]></option>
              <duration>3 hours</duration>
              <time>10:00 AM</time>
              <price_adult>79.00</price_adult>
              <currency_base>USD</currency_base>
              <availability>24</availability>
            </item>
          </response>`,
          { status: 200 },
        );
      }
      return new Response("Not Found", { status: 404 });
    };

    const adminCookie = buildAdminSessionValue();
    const authReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/admin/control-center?action=inspect_serene_rezgo&fresh=1&rezgoDates=2027-07-15",
      {
        headers: { cookie: `${ADMIN_SESSION_COOKIE}=${adminCookie}` },
      },
    );
    const authRes = await getControlCenterRoute(authReq);
    assert.equal(authRes.status, 200);
    const rawBody = await authRes.text();
    assert.doesNotMatch(rawBody, /SERENE_SECRET_CID_888/);
    assert.doesNotMatch(rawBody, /SERENE_SECRET_API_KEY_99999999/);

    const payload = JSON.parse(rawBody);
    assert.equal(payload.ok, true);
    assert.equal(payload.readOnly, true);
    assert.equal(payload.mutatedRemoteState, false);
    assert.equal(payload.secretsExposed, false);
    assert.equal(payload.credentialHolder, "destinations-cc");
    assert.equal(payload.writeCapabilitiesDisabled.commitBookingDisabled, true);
    assert.equal(payload.writeCapabilitiesDisabled.liveDirectCheckoutEnabled, false);
    assert.equal(payload.catalogInspection.companyName, "Juneau Tours & Whale Watch");
    assert.equal(payload.catalogInspection.itemsCount, 2);
    assert.equal(payload.dateInspections.length, 1);

    const comboRec = payload.catalogInspection.reconciliation.find(
      (r: any) => r.rezgoUid === "2001",
    );
    assert.equal(comboRec.matchedDccCatalogProductCode, "5857P22");
    assert.equal(
      comboRec.supplierConflictStatus,
      "conflicts_with_466119P3_dolphin_jet_boat",
    );
    assert.equal(comboRec.liveDirectRezgoCheckoutEnabled, false);

    const shuttleRec = payload.catalogInspection.reconciliation.find(
      (r: any) => r.rezgoUid === "2002",
    );
    assert.equal(shuttleRec.matchedDccCatalogProductCode, "5857SHUTTLE");
    assert.equal(shuttleRec.matchedLastFrontierCatalogProductId, "5857SHUTTLE");

    // 4. Last Frontier normalized feed consumer maps to P00281144 Viator fallback and fails open when Rezgo is unavailable
    const lfseOk = await loadLfseJuneauNormalizedSupplierFeed({
      activitySlug: "whale-watching",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            ok: true,
            normalizedSupplierFeeds: {
              juneauToursWhaleWatch: payload.normalizedSupplierFeed,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    });
    assert.equal(lfseOk.ok, true);
    assert.equal(lfseOk.liveDirectRezgoCheckoutEnabled, false);
    assert.equal(lfseOk.tours.length, 1);
    assert.match(lfseOk.tours[0].trackedFallbackHref || "", /pid=P00281144/);
    assert.match(lfseOk.tours[0].trackedFallbackHref || "", /5857P22/);

    const lfseFallback = await loadLfseJuneauNormalizedSupplierFeed({
      bypassCache: true,
      fetchImpl: async () => new Response("Service Unavailable", { status: 503 }),
    });
    assert.equal(lfseFallback.ok, false);
    assert.equal(lfseFallback.fallbackActive, true);
    assert.equal(lfseFallback.tours.length, 0);

    // 5. buildNormalizedJuneauSupplierFeed fails open cleanly when Rezgo throws network error
    const failedFeed = await buildNormalizedJuneauSupplierFeed({
      bypassCache: true,
      env: {
        REZGO_SERENE_CID: "SERENE_SECRET_CID_888",
        REZGO_SERENE_API_KEY: "SERENE_SECRET_API_KEY_99999999",
      },
      fetchImpl: async () => {
        throw new Error(
          "Connection reset for https://xml.rezgo.com/xml?transcode=SERENE_SECRET_CID_888&key=SERENE_SECRET_API_KEY_99999999",
        );
      },
    });
    assert.equal(failedFeed.ok, false);
    assert.equal(failedFeed.source, "dcc_approved_fallback");
    assert.equal(failedFeed.liveDirectRezgoCheckoutEnabled, false);
    assert.doesNotMatch(JSON.stringify(failedFeed), /SERENE_SECRET_CID_888/);
    assert.doesNotMatch(JSON.stringify(failedFeed), /SERENE_SECRET_API_KEY_99999999/);
  } finally {
    globalThis.fetch = origFetch;
    clearRezgoReadOnlyCacheForTesting();
    clearLfseJuneauSupplierFeedCacheForTesting();
    if (prevAdminKey === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = prevAdminKey;
    if (prevCid === undefined) delete process.env.REZGO_SERENE_CID;
    else process.env.REZGO_SERENE_CID = prevCid;
    if (prevApiKey === undefined) delete process.env.REZGO_SERENE_API_KEY;
    else process.env.REZGO_SERENE_API_KEY = prevApiKey;
  }
});

test("Rezgo Gate-2 advancement, supplier 2.00h cutoff vs DCC 2-hour return buffer return buffer, bounded caching, and live-availability-only UI labeling", async () => {
  clearRezgoReadOnlyCacheForTesting();
  clearLfseJuneauSupplierFeedCacheForTesting();

  try {
    // 1. Gate-2 only: REZGO_SERENE_READONLY_INSPECTED=true advances stage without unlocking live booking or downstream gates
    const gate2Status = getSereneRezgoReadinessStatus({
      REZGO_SERENE_CID: "CID_PRESENT",
      REZGO_SERENE_API_KEY: "KEY_PRESENT",
      REZGO_SERENE_READONLY_INSPECTED: "true",
    });
    assert.equal(
      gate2Status.stage,
      "readonly_inspected_awaiting_mapping_and_written_commission",
    );
    assert.equal(gate2Status.gates.credentialsStoredSecurelyInEnv, true);
    assert.equal(gate2Status.gates.readOnlyInventoryInspected, true);
    assert.equal(gate2Status.gates.dccProductMappingVerified, false);
    assert.equal(gate2Status.gates.writtenCommissionOwnershipConfirmed, false);
    assert.equal(gate2Status.gates.nonCustomerTestBookingVerified, false);
    assert.equal(gate2Status.gates.liveBookingToggleEnabled, false);
    assert.equal(gate2Status.liveBookingAllowed, false);

    // 2. Architectural Detail #1: Rezgo 2.00h cutoff is supplier booking cutoff ONLY; DCC 2-hour return buffer rule & outside-window blocking hold
    // 120 complete minutes remaining (e.g. 11:30:00 end vs 13:30:00 all-aboard = 7200s) -> meets clock upper bound (still unverified cruise timing!)
    const exactBoundary = assessRezgoDepartureAgainstShipWindow({
      departureTime: "08:30:00",
      durationMinutes: 180,
      shipArrivalTime: "08:00",
      shipAllAboardTime: "13:30",
      allAboardConfirmed: true,
    });
    assert.equal(exactBoundary.upperBoundRemainingSecondsBeforeTransfer, 7200);
    assert.equal(exactBoundary.upperBoundRemainingBufferHmsLabel, "2:00:00");
    assert.equal(
      exactBoundary.status,
      "unverified_cruise_timing_pending_transfer_and_pickup",
    );
    assert.equal(exactBoundary.blockedForSailingWindow, false);
    assert.equal(exactBoundary.meetingPointAndReturnConfirmed, false);
    assert.match(exactBoundary.displayLabel, /Cruise-safe timing unverified/);

    // < 2-hour return buffer remaining (e.g. 12:00 departure + 180m = 15:00 end vs 16:30 all-aboard = 1:30:00 remaining) -> reduced_buffer_not_recommended with exact H:MM:SS
    const reducedBuffer = assessRezgoDepartureAgainstShipWindow({
      departureTime: "12:00",
      durationMinutes: 180,
      shipArrivalTime: "08:00",
      shipAllAboardTime: "16:30",
      allAboardConfirmed: true,
    });
    assert.equal(reducedBuffer.upperBoundRemainingSecondsBeforeTransfer, 5400);
    assert.equal(reducedBuffer.upperBoundRemainingBufferHmsLabel, "1:30:00");
    assert.equal(reducedBuffer.status, "reduced_buffer_not_recommended");
    assert.equal(reducedBuffer.blockedForSailingWindow, false);
    assert.match(reducedBuffer.displayLabel, /1:30:00 remaining/);

    // Outside sailing window (14:00 departure + 180m = 17:00 end vs 16:30 all-aboard) -> blocked
    const outsideLate = assessRezgoDepartureAgainstShipWindow({
      departureTime: "14:00",
      durationMinutes: 180,
      shipArrivalTime: "08:00",
      shipAllAboardTime: "16:30",
      allAboardConfirmed: true,
    });
    assert.equal(outsideLate.status, "outside_sailing_window_blocked");
    assert.equal(outsideLate.blockedForSailingWindow, true);
    assert.match(outsideLate.displayLabel, /Outside ship window/);

    // Outside sailing window early (07:30 departure vs 08:00 arrival) -> blocked
    const outsideEarly = assessRezgoDepartureAgainstShipWindow({
      departureTime: "07:30",
      durationMinutes: 180,
      shipArrivalTime: "08:00",
      shipAllAboardTime: "16:30",
      allAboardConfirmed: true,
    });
    assert.equal(outsideEarly.status, "outside_sailing_window_blocked");
    assert.equal(outsideEarly.blockedForSailingWindow, true);

    // 3. Architectural Detail #2: Bounded caching by operator, product, and service date + coalescing + freshness preservation
    let upstreamFetchCalls = 0;
    const mockRezgoFetch: typeof fetch = async (input) => {
      upstreamFetchCalls += 1;
      const url = String(input);
      if (url.includes("i=company")) {
        return new Response(
          "<response><company_name>Juneau Tours</company_name><domain>juneauwhalewatch</domain><currency>USD</currency></response>",
          { status: 200 },
        );
      }
      return new Response(
        `<response>
          <item>
            <id>10</id>
            <uid>32331</uid>
            <com>32329</com>
            <item><![CDATA[Juneau Whale Watch]]></item>
            <option><![CDATA[9:30 AM]]></option>
            <duration>3.75 hours</duration>
            <time>09:30 AM</time>
            <cutoff>2.00</cutoff>
            <price_adult>169.00</price_adult>
            <currency_base>USD</currency_base>
            <availability>20</availability>
          </item>
          <item>
            <id>11</id>
            <uid>32339</uid>
            <com>32329</com>
            <item><![CDATA[Juneau Whale Watch]]></item>
            <option><![CDATA[2:30 PM]]></option>
            <duration>3.75 hours</duration>
            <time>02:30 PM</time>
            <cutoff>2.00</cutoff>
            <price_adult>169.00</price_adult>
            <currency_base>USD</currency_base>
            <availability>15</availability>
          </item>
        </response>`,
        { status: 200 },
      );
    };

    const mockEnv = {
      REZGO_SERENE_CID: "TEST_CID",
      REZGO_SERENE_API_KEY: "TEST_KEY",
    };

    // Concurrent calls for the same service date coalesce into ONE Rezgo inspection (2 HTTP GETs: i=company + i=search)
    const [firstFeed, concurrentFeed] = await Promise.all([
      buildNormalizedJuneauSupplierFeed({
        env: mockEnv,
        fetchImpl: mockRezgoFetch,
        searchDate: "2027-07-15",
        productFilter: "5857P23",
        shipArrivalTime: "08:00",
        shipAllAboardTime: "16:30",
        allAboardConfirmed: true,
      }),
      buildNormalizedJuneauSupplierFeed({
        env: mockEnv,
        fetchImpl: mockRezgoFetch,
        searchDate: "2027-07-15",
        productFilter: "5857P23",
        shipArrivalTime: "08:00",
        shipAllAboardTime: "16:30",
        allAboardConfirmed: true,
      }),
    ]);
    assert.equal(upstreamFetchCalls, 2);
    assert.equal(firstFeed.timingSafetyPolicy.feedClassification, "live_operator_availability_only");
    assert.equal(firstFeed.timingSafetyPolicy.verifiedCruiseSafeTiming, false);
    assert.equal(firstFeed.timingSafetyPolicy.supplierCutoffIsNeverCruiseReturnBuffer, true);
    assert.equal(firstFeed.tours.length, 1);

    const whaleTour = firstFeed.tours[0];
    assert.equal(whaleTour.supplierBookingCutoffHours, 2);
    assert.equal(
      whaleTour.supplierBookingCutoffSemantics,
      "supplier_booking_cutoff_only_never_cruise_return_buffer",
    );
    assert.equal(whaleTour.durationScope, "dock_to_dock");
    assert.equal(whaleTour.includedOperatorTransportationInPublishedDuration, true);
    assert.equal(
      whaleTour.cruiseTimingVerificationStatus,
      "dock_to_dock_confirmed_window_evaluated",
    );
    assert.equal(
      whaleTour.cruiseTimingStatusLabel,
      "Estimated back 2+ hours before all aboard",
    );
    // 09:30 + 225m = 13:15 (fits inside 16:30 window); 14:30 + 225m = 18:15 (blocked outside 16:30 window!)
    assert.deepEqual(whaleTour.departureTimes, ["09:30"]);
    assert.deepEqual(whaleTour.blockedOutsideWindowDepartures, ["14:30"]);
    assert.equal(concurrentFeed.checkedAt, firstFeed.checkedAt);

    // Subsequent sequential call hits bounded cache with zero additional Rezgo fetches and preserves checkedAt freshness timestamp
    const secondFeed = await buildNormalizedJuneauSupplierFeed({
      env: mockEnv,
      fetchImpl: mockRezgoFetch,
      searchDate: "2027-07-15",
      productFilter: "5857P23",
    });
    assert.equal(upstreamFetchCalls, 2);
    assert.equal(secondFeed.cachePolicy.cacheStatus, "hit");
    assert.equal(secondFeed.checkedAt, firstFeed.checkedAt);
    assert.equal(
      secondFeed.cachePolicy.cacheKey,
      "rezgo:juneau-tours-whale-watch:5857P23:2027-07-15",
    );

    // Bounded eviction: inserting > MAX_REZGO_CACHE_ENTRIES service dates never exceeds MAX_REZGO_CACHE_ENTRIES
    for (let i = 1; i <= MAX_REZGO_CACHE_ENTRIES + 10; i++) {
      const day = String(((i - 1) % 28) + 1).padStart(2, "0");
      const month = String((Math.floor((i - 1) / 28) % 9) + 1).padStart(2, "0");
      await buildNormalizedJuneauSupplierFeed({
        env: mockEnv,
        fetchImpl: mockRezgoFetch,
        searchDate: `2028-${month}-${day}`,
      });
    }
    const cacheStats = getRezgoReadOnlyCacheStatsForTesting();
    assert.ok(cacheStats.inspectionEntries <= MAX_REZGO_CACHE_ENTRIES);
    assert.ok(cacheStats.productEntries <= MAX_REZGO_CACHE_ENTRIES);

    // 4. Last Frontier bounded cache + UI rendering uses "Live Operator Availability" (never "Verified Operator Schedule" or badge-safety)
    let lfseDccCalls = 0;
    const lfseMockFetch: typeof fetch = async () => {
      lfseDccCalls += 1;
      return new Response(
        JSON.stringify({
          ok: true,
          normalizedSupplierFeeds: {
            juneauToursWhaleWatch: firstFeed,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const lfseFirst = await loadLfseJuneauNormalizedSupplierFeed({
      date: "2027-07-15",
      activitySlug: "whale-watching",
      revalidateSeconds: 180,
      fetchImpl: lfseMockFetch,
    });
    const lfseSecond = await loadLfseJuneauNormalizedSupplierFeed({
      date: "2027-07-15",
      activitySlug: "whale-watching",
      revalidateSeconds: 180,
      fetchImpl: lfseMockFetch,
    });
    assert.equal(lfseDccCalls, 1);
    assert.equal(lfseFirst.cachePolicy.cacheStatus, "miss_fresh");
    assert.equal(lfseSecond.cachePolicy.cacheStatus, "hit");
    assert.equal(lfseSecond.checkedAt, lfseFirst.checkedAt);
    assert.equal(lfseSecond.verifiedCruiseSafeTiming, false);
    assert.equal(getLfseJuneauSupplierFeedCacheStatsForTesting().entries, 1);

    const html = renderToStaticMarkup(
      React.createElement(JuneauNormalizedSupplierFeedSection, { feed: lfseSecond }),
    );
    assert.match(html, /Live Operator Availability/);
    assert.match(html, /How many people are going\?/);
    // firstFeed had confirmed allAboard 16:30, so 9:30 AM + 225m = 13:15 -> 3:15:00 remaining -> Estimated back 2+ hours before all aboard!
    assert.match(html, /Estimated back 2\+ hours before all aboard/);
    assert.match(html, /Recommended times/);
    assert.match(html, /Doesn’t fit this ship day/);
    assert.match(html, /Book this tour/);
    assert.match(html, /Add to group plan/);
    assert.match(html, /Checkout via Viator/);
    assert.doesNotMatch(html, /Verified Operator Schedule/);
    assert.doesNotMatch(html, /badge-safety/);
    assert.doesNotMatch(html, /20 seats|15 seats|35 spots|0 seats/i);
    assert.doesNotMatch(html, /COM 32329|UID 32331|#5857P23/);

    // 5. DCC /juneau/whale-watching-tours public surface wires JuneauLiveAvailabilitySection with simplified cards
    assert.equal(whaleTour.departureOptions.length, 2);
    assert.equal(whaleTour.departureOptions[0].uid, "32331");
    assert.equal(whaleTour.departureOptions[0].departureTime, "09:30");
    assert.equal(whaleTour.departureOptions[0].availableSpots, 20);
    assert.equal(whaleTour.departureOptions[1].uid, "32339");
    assert.equal(whaleTour.departureOptions[1].windowAssessment?.blockedForSailingWindow, true);
    assert.match(whaleTour.dccCommerceWrapperHref || "", /\/go\/out\?.*product=5857P23/);
    assert.match(whaleTour.dccCommerceWrapperHref || "", /P00306962/);
    assert.equal(whaleTour.bookingProviderIdentity?.liveDirectRezgoCheckoutEnabled, false);
    assert.equal(whaleTour.bookingProviderIdentity?.fallbackProductCode, "5857P23");

    const dccWhalePageSrc = fs.readFileSync(
      path.join(process.cwd(), "app/juneau/whale-watching-tours/page.tsx"),
      "utf8",
    );
    const dccLiveSectionSrc = fs.readFileSync(
      path.join(process.cwd(), "components/dcc/JuneauLiveAvailabilitySection.tsx"),
      "utf8",
    );
    assert.match(dccWhalePageSrc, /JuneauLiveAvailabilitySection/);
    assert.match(dccWhalePageSrc, /buildNormalizedJuneauSupplierFeed/);
    assert.match(dccWhalePageSrc, /buildPublicJuneauLiveAvailabilityView/);
    assert.match(dccLiveSectionSrc, /Juneau Tours — Live Operator Availability/);
    assert.match(dccLiveSectionSrc, /dcc-juneau-tours-live-availability/);
  } finally {
    clearRezgoReadOnlyCacheForTesting();
    clearLfseJuneauSupplierFeedCacheForTesting();
  }
});

test("Juneau Tours dock-to-dock timing correction: Celebrity Edge May 24 (13:30–21:30) 5-case verification matrix, 2-hour return buffer boundary, berth adjustments, and strict non-generalization", async () => {
  clearRezgoReadOnlyCacheForTesting();
  clearLfseJuneauSupplierFeedCacheForTesting();

  try {
    // 1. Strict provenance allowlist: confirmed Juneau Tours Rezgo products ONLY
    const confirmedWhale = resolveJuneauToursDockToDockProvenance({
      operatorId: "juneau-tours-whale-watch",
      rezgoCom: "32329",
      matchedViatorProductCode: "5857P23",
      verifiedRezgoDomain: "juneauwhalewatch",
      verifiedRezgoCompanyName: "Juneau Tours",
      title: "Juneau Whale Watch",
    });
    assert.equal(confirmedWhale.durationScope, "dock_to_dock");
    assert.equal(confirmedWhale.includedOperatorTransportationInPublishedDuration, true);
    assert.equal(confirmedWhale.durationProvenance.additionalOperatorTransferMinutesAdded, 0);
    assert.equal(confirmedWhale.durationProvenance.generalizedToOtherOperators, false);

    // Must NEVER generalize to Dolphin Jet Boat Tours (466119P3), Alaska Galore (331813P1), or other operators
    const dolphin = resolveJuneauToursDockToDockProvenance({
      operatorId: "dolphin-jet-boat",
      rezgoCom: "32329",
      matchedViatorProductCode: "466119P3",
      title: "Mendenhall Glacier Waterfall and Whale Watching Tour",
    });
    assert.equal(dolphin.durationScope, "activity_only_unverified");
    assert.equal(dolphin.includedOperatorTransportationInPublishedDuration, false);

    const mismatched5857 = resolveJuneauToursDockToDockProvenance({
      operatorId: "juneau-tours-whale-watch",
      matchedViatorProductCode: "466119P3",
      title: "Dolphin Tour",
    });
    assert.equal(mismatched5857.durationScope, "activity_only_unverified");

    const lfseDolphin = resolveLfseJuneauToursDockToDockProvenance({
      operatorId: "alaska-galore",
      matchedViatorProductCode: "331813P1",
      title: "Whale Watching",
    });
    assert.equal(lfseDolphin.durationScope, "activity_only_unverified");

    // 2. Canonical Celebrity Edge May 24 matrix (13:30 arrival, 21:30 confirmed all-aboard):
    // - 13:30 3-hour (180m) whale tour -> returns 16:30 -> 5:00:00 remaining -> Recommended
    const edge1330Whale = assessRezgoDepartureAgainstShipWindow({
      departureTime: "13:30",
      durationMinutes: 180,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
      durationScope: "dock_to_dock",
    });
    assert.equal(edge1330Whale.estimatedDockReturnTime, "16:30");
    assert.equal(edge1330Whale.upperBoundRemainingSecondsBeforeTransfer, 5 * 3600);
    assert.equal(edge1330Whale.upperBoundRemainingBufferHmsLabel, "5:00:00");
    assert.equal(edge1330Whale.status, "recommended");
    assert.equal(edge1330Whale.blockedForSailingWindow, false);
    assert.equal(edge1330Whale.displayLabel, "Estimated back 2+ hours before all aboard");

    // - 15:30 3-hour (180m) whale tour -> returns 18:30 -> 3:00:00 remaining -> Recommended
    const edge1530Whale = assessRezgoDepartureAgainstShipWindow({
      departureTime: "15:30",
      durationMinutes: 180,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
      durationScope: "dock_to_dock",
    });
    assert.equal(edge1530Whale.estimatedDockReturnTime, "18:30");
    assert.equal(edge1530Whale.upperBoundRemainingBufferHmsLabel, "3:00:00");
    assert.equal(edge1530Whale.status, "recommended");
    assert.equal(edge1530Whale.displayLabel, "Estimated back 2+ hours before all aboard");

    // - 16:30 3-hour (180m) whale tour -> returns 19:30 -> 2:00:00 (7200s >= 7199s) remaining -> Recommended / qualifies!
    const edge1630Whale = assessRezgoDepartureAgainstShipWindow({
      departureTime: "16:30",
      durationMinutes: 180,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
      durationScope: "dock_to_dock",
    });
    assert.equal(edge1630Whale.estimatedDockReturnTime, "19:30");
    assert.equal(edge1630Whale.upperBoundRemainingSecondsBeforeTransfer, 7200);
    assert.equal(edge1630Whale.upperBoundRemainingBufferHmsLabel, "2:00:00");
    assert.equal(edge1630Whale.status, "recommended");
    assert.equal(edge1630Whale.displayLabel, "Estimated back 2+ hours before all aboard");

    // - 15:00 5-hour (300m) combo -> returns 20:00 -> 1:30:00 remaining -> Not recommended
    const edge1500Combo = assessRezgoDepartureAgainstShipWindow({
      departureTime: "15:00",
      durationMinutes: 300,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
      durationScope: "dock_to_dock",
    });
    assert.equal(edge1500Combo.estimatedDockReturnTime, "20:00");
    assert.equal(edge1500Combo.upperBoundRemainingSecondsBeforeTransfer, 5400);
    assert.equal(edge1500Combo.upperBoundRemainingBufferHmsLabel, "1:30:00");
    assert.equal(edge1500Combo.status, "reduced_buffer_not_recommended");
    assert.equal(edge1500Combo.blockedForSailingWindow, false);
    assert.equal(edge1500Combo.displayLabel, "1:30:00 buffer · Not recommended");

    // - 15:30 5-hour (300m) combo -> returns 20:30 -> 1:00:00 remaining -> Not recommended
    const edge1530Combo = assessRezgoDepartureAgainstShipWindow({
      departureTime: "15:30",
      durationMinutes: 300,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
      durationScope: "dock_to_dock",
    });
    assert.equal(edge1530Combo.estimatedDockReturnTime, "20:30");
    assert.equal(edge1530Combo.upperBoundRemainingSecondsBeforeTransfer, 3600);
    assert.equal(edge1530Combo.upperBoundRemainingBufferHmsLabel, "1:00:00");
    assert.equal(edge1530Combo.status, "reduced_buffer_not_recommended");
    assert.equal(edge1530Combo.displayLabel, "1:00:00 buffer · Not recommended");

    // 3. Exact 120 complete minutes (7200s) vs 119 minutes (7140s) dock-to-dock boundary & documented berth adjustment
    const boundary120m = assessRezgoDepartureAgainstShipWindow({
      departureTime: "16:30:00",
      durationMinutes: 180,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
      durationScope: "dock_to_dock",
    });
    assert.equal(boundary120m.upperBoundRemainingSecondsBeforeTransfer, 7200);
    assert.equal(boundary120m.upperBoundRemainingBufferHmsLabel, "2:00:00");
    assert.equal(boundary120m.status, "recommended");

    const boundary119m = assessRezgoDepartureAgainstShipWindow({
      departureTime: "16:31:00",
      durationMinutes: 180,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
      durationScope: "dock_to_dock",
    });
    assert.equal(boundary119m.upperBoundRemainingSecondsBeforeTransfer, 7140);
    assert.equal(boundary119m.upperBoundRemainingBufferHmsLabel, "1:59:00");
    assert.equal(boundary119m.status, "reduced_buffer_not_recommended");

    // Documented specific-berth return adjustment (e.g. AJD shuttle 15m beyond advertised downtown pickup)
    const withDocumentedBerthReturn = assessRezgoDepartureAgainstShipWindow({
      departureTime: "16:30",
      durationMinutes: 180,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
      durationScope: "dock_to_dock",
      documentedBerthReturnMinutes: 15,
    });
    assert.equal(withDocumentedBerthReturn.documentedBerthReturnMinutesApplied, 15);
    assert.equal(withDocumentedBerthReturn.upperBoundRemainingBufferHmsLabel, "1:45:00");
    assert.equal(withDocumentedBerthReturn.status, "reduced_buffer_not_recommended");

    // Documented specific-berth pickup adjustment blocks 13:30 departure if passenger needs 15m from berth
    const withDocumentedBerthPickup = assessRezgoDepartureAgainstShipWindow({
      departureTime: "13:30",
      durationMinutes: 180,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
      durationScope: "dock_to_dock",
      documentedBerthPickupMinutes: 15,
    });
    assert.equal(withDocumentedBerthPickup.status, "outside_sailing_window_blocked");
    assert.equal(withDocumentedBerthPickup.blockedForSailingWindow, true);

    // 4. End-to-end DCC + Last Frontier public cards on Celebrity Edge May 24 (13:30–21:30)
    const mockEdgeFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("i=company")) {
        return new Response(
          "<response><company_name>Juneau Tours</company_name><domain>juneauwhalewatch</domain><currency>USD</currency></response>",
          { status: 200 },
        );
      }
      return new Response(
        `<response>
          <item>
            <id>101</id><uid>50001</uid><com>32329</com>
            <item><![CDATA[Juneau Whale Watch]]></item><option><![CDATA[1:30 PM]]></option>
            <duration>3 hours</duration><time>01:30 PM</time><cutoff>2.00</cutoff>
            <price_adult>169.00</price_adult><currency_base>USD</currency_base><availability>24</availability>
          </item>
          <item>
            <id>102</id><uid>50002</uid><com>32329</com>
            <item><![CDATA[Juneau Whale Watch]]></item><option><![CDATA[3:30 PM]]></option>
            <duration>3 hours</duration><time>03:30 PM</time><cutoff>2.00</cutoff>
            <price_adult>169.00</price_adult><currency_base>USD</currency_base><availability>18</availability>
          </item>
          <item>
            <id>103</id><uid>50003</uid><com>32329</com>
            <item><![CDATA[Juneau Whale Watch]]></item><option><![CDATA[4:30 PM]]></option>
            <duration>3 hours</duration><time>04:30 PM</time><cutoff>2.00</cutoff>
            <price_adult>169.00</price_adult><currency_base>USD</currency_base><availability>12</availability>
          </item>
          <item>
            <id>201</id><uid>60001</uid><com>31703</com>
            <item><![CDATA[Juneau Mendenhall Glacier & Whale Watch Combo]]></item><option><![CDATA[3:00 PM]]></option>
            <duration>5 hours</duration><time>03:00 PM</time><cutoff>2.00</cutoff>
            <price_adult>219.00</price_adult><currency_base>USD</currency_base><availability>16</availability>
          </item>
          <item>
            <id>202</id><uid>60002</uid><com>31703</com>
            <item><![CDATA[Juneau Mendenhall Glacier & Whale Watch Combo]]></item><option><![CDATA[3:30 PM]]></option>
            <duration>5 hours</duration><time>03:30 PM</time><cutoff>2.00</cutoff>
            <price_adult>219.00</price_adult><currency_base>USD</currency_base><availability>10</availability>
          </item>
        </response>`,
        { status: 200 },
      );
    };

    const edgeFeed = await buildNormalizedJuneauSupplierFeed({
      env: { REZGO_SERENE_CID: "TEST_CID", REZGO_SERENE_API_KEY: "TEST_KEY" },
      fetchImpl: mockEdgeFetch,
      searchDate: "2027-05-24",
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
    });

    const dccEdgeView = buildPublicJuneauLiveAvailabilityView(edgeFeed, {
      partySize: 4,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
    });
    assert.equal(dccEdgeView.cards.length, 2);
    const whaleCard = dccEdgeView.cards.find((c) => c.title === "Juneau Whale Watch")!;
    const comboCard = dccEdgeView.cards.find((c) => c.title.includes("Combo"))!;

    assert.deepEqual(
      whaleCard.recommendedDepartures.map((d) => d.departureTime24),
      ["13:30", "15:30", "16:30"],
    );
    assert.equal(whaleCard.confirmTimingDepartures.length, 0);
    assert.equal(whaleCard.otherAvailableTimes.length, 0);
    for (const dep of whaleCard.recommendedDepartures) {
      assert.equal(dep.timingStatusLabel, "Estimated back 2+ hours before all aboard");
      assert.match(dep.plannerAddHref, /durationScope=dock_to_dock/);
      assert.match(dep.plannerAddHref, /returnTransferMinutes=0/);
      assert.match(dep.plannerAddHref, /fitStatus=recommended/);
    }

    assert.equal(comboCard.recommendedDepartures.length, 0);
    assert.equal(comboCard.confirmTimingDepartures.length, 0);
    assert.deepEqual(
      comboCard.otherAvailableTimes.map((d) => `${d.departureTime24}:${d.timingStatusLabel}`),
      [
        "15:00:1:30:00 buffer · Not recommended",
        "15:30:1:00:00 buffer · Not recommended",
      ],
    );

    const dccEdgeHtml = renderToStaticMarkup(
      React.createElement(JuneauLiveAvailabilitySection, {
        initialView: dccEdgeView,
        initialDate: "2027-05-24",
        initialShipArrival: "13:30",
        initialAllAboard: "21:30",
        initialBerth: "CT",
      }),
    );
    assert.match(dccEdgeHtml, /Estimated back 2\+ hours before all aboard/);
    assert.match(dccEdgeHtml, /1:30:00 buffer · Not recommended/);
    assert.match(dccEdgeHtml, /1:00:00 buffer · Not recommended/);
    assert.doesNotMatch(dccEdgeHtml, /Confirm return timing/);

    // Verify Last Frontier evaluator + SSR card view matches identically
    const lfseEdgeCheck = assessLfseJuneauDepartureAgainstShipWindow({
      departureTime: "16:30",
      durationMinutes: 180,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
      durationScope: "dock_to_dock",
    });
    assert.equal(lfseEdgeCheck.status, "recommended");
    assert.equal(lfseEdgeCheck.upperBoundRemainingBufferHmsLabel, "2:00:00");

    const lfseEdgeFeed = await loadLfseJuneauNormalizedSupplierFeed({
      date: "2027-05-24",
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      bypassCache: true,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            ok: true,
            normalizedSupplierFeeds: { juneauToursWhaleWatch: edgeFeed },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    });
    const lfseEdgeView = buildLfsePublicJuneauAvailabilityView(lfseEdgeFeed, {
      partySize: 4,
      shipArrivalTime: "13:30",
      shipAllAboardTime: "21:30",
      allAboardConfirmed: true,
    });
    const lfseEdgeHtml = renderToStaticMarkup(
      React.createElement(JuneauNormalizedSupplierFeedSection, {
        initialView: lfseEdgeView,
        initialPartySize: 4,
        initialShipArrival: "13:30",
        initialAllAboard: "21:30",
      }),
    );
    assert.match(lfseEdgeHtml, /Estimated back 2\+ hours before all aboard/);
    assert.match(lfseEdgeHtml, /1:30:00 buffer · Not recommended/);
    assert.match(lfseEdgeHtml, /1:00:00 buffer · Not recommended/);
    assert.doesNotMatch(lfseEdgeHtml, /Confirm return timing/);
  } finally {
    clearRezgoReadOnlyCacheForTesting();
    clearLfseJuneauSupplierFeedCacheForTesting();
  }
});

test("Simplified public Juneau live-availability interface hides seat counts, sold-out departures, insufficient-party-size departures, and technical IDs while preserving pre-checkout revalidation", async () => {
  clearRezgoReadOnlyCacheForTesting();
  clearLfseJuneauSupplierFeedCacheForTesting();

  try {
    const mockEnv = {
      REZGO_SERENE_CID: "TEST_CID",
      REZGO_SERENE_API_KEY: "TEST_KEY",
    };

    let currentSpotCounts: Record<string, number> = {
      "31001": 0, // 08:30 AM — SOLD OUT (0 seats) -> must NEVER render publicly
      "31002": 3, // 10:00 AM — 3 seats (in window, >= 2h margin -> Confirm return timing)
      "31003": 8, // 01:00 PM — 8 seats (13:00 + 180m = 16:00 vs 17:30 all-aboard = 1:30:00 reduced buffer)
      "31004": 12, // 03:00 PM — 12 seats (15:00 + 180m = 18:00 > 17:30 all-aboard -> Doesn't fit this ship day)
      "31005": 0, // 04:00 PM — 0 seats AND outside window -> must NOT even appear in Doesn't fit this ship day!
    };

    const mockRezgoFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("i=company")) {
        return new Response(
          "<response><company_name>Juneau Tours</company_name><domain>juneauwhalewatch</domain><currency>USD</currency></response>",
          { status: 200 },
        );
      }
      return new Response(
        `<response>
          <item>
            <id>1</id><uid>31001</uid><com>32329</com>
            <item><![CDATA[Juneau Whale Watch]]></item><option><![CDATA[8:30 AM]]></option>
            <duration>3 hours</duration><time>08:30 AM</time><cutoff>2.00</cutoff>
            <price_adult>169.00</price_adult><currency_base>USD</currency_base>
            <availability>${currentSpotCounts["31001"]}</availability>
          </item>
          <item>
            <id>2</id><uid>31002</uid><com>32329</com>
            <item><![CDATA[Juneau Whale Watch]]></item><option><![CDATA[10:00 AM]]></option>
            <duration>3 hours</duration><time>10:00 AM</time><cutoff>2.00</cutoff>
            <price_adult>169.00</price_adult><currency_base>USD</currency_base>
            <availability>${currentSpotCounts["31002"]}</availability>
          </item>
          <item>
            <id>3</id><uid>31003</uid><com>32329</com>
            <item><![CDATA[Juneau Whale Watch]]></item><option><![CDATA[1:00 PM]]></option>
            <duration>3 hours</duration><time>01:00 PM</time><cutoff>2.00</cutoff>
            <price_adult>169.00</price_adult><currency_base>USD</currency_base>
            <availability>${currentSpotCounts["31003"]}</availability>
          </item>
          <item>
            <id>4</id><uid>31004</uid><com>32329</com>
            <item><![CDATA[Juneau Whale Watch]]></item><option><![CDATA[3:00 PM]]></option>
            <duration>3 hours</duration><time>03:00 PM</time><cutoff>2.00</cutoff>
            <price_adult>169.00</price_adult><currency_base>USD</currency_base>
            <availability>${currentSpotCounts["31004"]}</availability>
          </item>
          <item>
            <id>5</id><uid>31005</uid><com>32329</com>
            <item><![CDATA[Juneau Whale Watch]]></item><option><![CDATA[4:00 PM]]></option>
            <duration>3 hours</duration><time>04:00 PM</time><cutoff>2.00</cutoff>
            <price_adult>169.00</price_adult><currency_base>USD</currency_base>
            <availability>${currentSpotCounts["31005"]}</availability>
          </item>
        </response>`,
        { status: 200 },
      );
    };

    const feed = await buildNormalizedJuneauSupplierFeed({
      env: mockEnv,
      fetchImpl: mockRezgoFetch,
      searchDate: "2027-07-15",
      shipArrivalTime: "08:00",
      shipAllAboardTime: "17:30",
      allAboardConfirmed: true,
    });

    // Backend feed still retains exact seat counts and COM/UIDs for owner/admin diagnostics
    assert.equal(feed.tours[0].rezgoCom, "32329");
    assert.equal(feed.tours[0].departureOptions[0].availableSpots, 0);
    assert.equal(feed.tours[0].departureOptions[1].availableSpots, 3);

    // 1. Before party size is entered (partySize = null):
    // - Sold-out 8:30 AM (0 seats) and 4:00 PM (0 seats) are completely hidden
    // - Positive departures 10:00 AM and 1:00 PM render time-only (no seat counts, no UIDs, no COM, no #5857P23)
    // - 3:00 PM (12 seats, outside window) appears ONLY inside collapsed "Doesn’t fit this ship day"
    // - Prompts "How many people are going?"
    const unselectedView = buildPublicJuneauLiveAvailabilityView(feed, {
      partySize: null,
      shipArrivalTime: "08:00",
      shipAllAboardTime: "17:30",
      allAboardConfirmed: true,
    });
    const dccUnselectedHtml = renderToStaticMarkup(
      React.createElement(JuneauLiveAvailabilitySection, {
        initialView: unselectedView,
        initialDate: "2027-07-15",
        initialShipArrival: "08:00",
        initialAllAboard: "17:30",
        initialBerth: "CT",
      }),
    );

    assert.match(dccUnselectedHtml, /How many people are going\?/);
    assert.match(dccUnselectedHtml, /10:00 AM/);
    assert.match(dccUnselectedHtml, /1:00 PM/);
    assert.match(dccUnselectedHtml, /Recommended times/);
    assert.match(dccUnselectedHtml, /Other available times/);
    assert.match(dccUnselectedHtml, /1:30:00 buffer · Not recommended/);
    assert.match(dccUnselectedHtml, /Estimated back 2\+ hours before all aboard/);
    assert.doesNotMatch(dccUnselectedHtml, /Confirm return timing/);
    assert.match(dccUnselectedHtml, /Doesn’t fit this ship day/);
    assert.match(dccUnselectedHtml, /3:00 PM/);
    assert.doesNotMatch(dccUnselectedHtml, /8:30 AM/);
    assert.doesNotMatch(dccUnselectedHtml, /4:00 PM/);
    assert.doesNotMatch(dccUnselectedHtml, /0 seats|3 seats|8 seats|12 seats|23 spots/i);
    assert.doesNotMatch(dccUnselectedHtml, /31001|31002|31003|32329|#5857P23/);

    // 2. After party size = 4 is entered:
    // - 10:00 AM (only 3 seats < 4) is NOT rendered!
    // - 1:00 PM (8 seats >= 4) IS rendered with "Available for your group of 4"
    const partyOf4View = buildPublicJuneauLiveAvailabilityView(feed, {
      partySize: 4,
      shipArrivalTime: "08:00",
      shipAllAboardTime: "17:30",
      allAboardConfirmed: true,
    });
    const dccPartyOf4Html = renderToStaticMarkup(
      React.createElement(JuneauLiveAvailabilitySection, {
        initialView: partyOf4View,
        initialDate: "2027-07-15",
        initialShipArrival: "08:00",
        initialAllAboard: "17:30",
        initialBerth: "CT",
      }),
    );
    assert.doesNotMatch(dccPartyOf4Html, /10:00 AM/);
    assert.match(dccPartyOf4Html, /1:00 PM/);
    assert.match(dccPartyOf4Html, /Available for your group of 4/);
    assert.doesNotMatch(dccPartyOf4Html, /8 seats|seats remaining/i);

    // Also verify Last Frontier renders identical filtering for partySize = 4 and partySize = 10
    const lfseFeed = await loadLfseJuneauNormalizedSupplierFeed({
      date: "2027-07-15",
      bypassCache: true,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            ok: true,
            normalizedSupplierFeeds: { juneauToursWhaleWatch: feed },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    });
    const lfseParty4Html = renderToStaticMarkup(
      React.createElement(JuneauNormalizedSupplierFeedSection, {
        feed: lfseFeed,
        initialPartySize: 4,
      }),
    );
    assert.doesNotMatch(lfseParty4Html, /8:30 AM/);
    assert.doesNotMatch(lfseParty4Html, /10:00 AM/);
    assert.match(lfseParty4Html, /1:00 PM/);
    assert.match(lfseParty4Html, /Available for your group of 4/);
    assert.doesNotMatch(lfseParty4Html, /#5857P23|COM 32329|UID 31003|8 seats/i);

    // 3. When no in-window departure can accommodate partySize = 10 (max in-window is 8):
    // - Renders exact message: "No departure currently has enough availability for 10 people."
    const partyOf10View = buildPublicJuneauLiveAvailabilityView(feed, {
      partySize: 10,
      shipArrivalTime: "08:00",
      shipAllAboardTime: "17:30",
      allAboardConfirmed: true,
    });
    const dccParty10Html = renderToStaticMarkup(
      React.createElement(JuneauLiveAvailabilitySection, {
        initialView: partyOf10View,
        initialDate: "2027-07-15",
        initialShipArrival: "08:00",
        initialAllAboard: "17:30",
        initialBerth: "CT",
      }),
    );
    assert.doesNotMatch(dccParty10Html, /10:00 AM/);
    assert.doesNotMatch(dccParty10Html, /1:00 PM/);
    assert.match(
      dccParty10Html,
      /No departure currently has enough availability for 10 people\./,
    );

    // 4. Pre-checkout live revalidation catches last-second inventory drop before opening checkout
    const revalOk = await revalidatePublicJuneauDepartureBeforeCheckout({
      env: mockEnv,
      fetchImpl: mockRezgoFetch,
      serviceDate: "2027-07-15",
      partySize: 4,
      rezgoUid: "31003",
      shipArrivalTime: "08:00",
      shipAllAboardTime: "17:30",
      allAboardConfirmed: true,
    });
    assert.equal(revalOk.available, true);
    assert.equal(revalOk.message, "Available for your group of 4");
    assert.equal(revalOk.requiresReducedBufferConfirmation, true);

    // Simulate seats dropping from 8 to 2 right before the traveler clicks "Book this tour"
    currentSpotCounts = { ...currentSpotCounts, "31003": 2 };
    const revalDropped = await revalidatePublicJuneauDepartureBeforeCheckout({
      env: mockEnv,
      fetchImpl: mockRezgoFetch,
      serviceDate: "2027-07-15",
      partySize: 4,
      rezgoUid: "31003",
      shipArrivalTime: "08:00",
      shipAllAboardTime: "17:30",
      allAboardConfirmed: true,
    });
    assert.equal(revalDropped.available, false);
    assert.equal(revalDropped.checkoutHref, null);
    assert.equal(
      revalDropped.message,
      "No departure currently has enough availability for 4 people.",
    );
  } finally {
    clearRezgoReadOnlyCacheForTesting();
    clearLfseJuneauSupplierFeedCacheForTesting();
  }
});
