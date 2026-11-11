import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

import {
  buildCanonicalFitEvaluation,
  mapRawFitToCanonicalStatus,
  type CanonicalFitStatus,
} from "@/lib/dcc/shared/canonicalFitStatus";
import { buildAddToCruisePromenadeUrl } from "@/lib/dcc/shared/addToCruisePromenadeUrl";
import {
  CANONICAL_SITE_PROVIDER_ACCOUNTS,
  FROZEN_AFFILIATE_IDENTIFIERS,
  HELD_COMMERCIAL_SKUS,
  PROTECTED_PARTNER_PROPERTIES,
  TRANSACTION_ROUTE_MODELS,
  getProtectedPartnerProperty,
  getTransactionRouteModel,
  listPartnerBoundaryReviewItems,
} from "@/lib/dcc/commerce/affiliateOwnershipLedger";
import { DCC_EXCLUDED_PORTFOLIO_SITES } from "@/lib/dcc/portfolioNetworkRegistry";
import {
  GET as getTravelGraphEvaluate,
  OPTIONS as optionsTravelGraphEvaluate,
  POST as postTravelGraphEvaluate,
} from "@/app/api/v1/travel-graph/evaluate/route";
import { GET as getRootWellKnownDcc } from "@/app/.well-known/dcc/route";
import { GET as getRootAgentJson } from "@/app/agent.json/route";
import { GET as getDellsOutboundRedirect } from "@/apps/welcometothedells/app/out/wisconsin-dells/[slug]/route";
import { GET as getControlCenterRoute } from "@/app/api/admin/control-center/route";
import { POST as postAdminUnlock } from "@/app/admin/unlock/route";
import { ADMIN_SESSION_COOKIE, buildAdminSessionValue } from "@/lib/adminAccess";
import {
  OWNED_ACTIVE_PRODUCTION_PROJECTS,
  buildOwnerControlCenterSnapshot,
} from "@/lib/dcc/ownerControlCenter";

const REPO_ROOT = process.cwd();

describe("North Star Slice 3: Canonical Fit/Ledger/Partner Modules, Travel-Graph Evaluate API, Specialist Connected UX, & Owner Control Center", () => {
  it("1. maps all raw engine statuses deterministically into the 5-state CanonicalFitStatus vocabulary and enforces commissionNeutral: true", () => {
    const fitsRaw = [
      "fits",
      "fits_comfortably",
      "tight_buffer",
      "tight_fit",
      "strong_fit",
      "best_fit",
      "eligible",
      "recommended",
      "still_fits",
    ];
    for (const raw of fitsRaw) {
      assert.equal(
        mapRawFitToCanonicalStatus(raw),
        "fits",
        `Expected '${raw}' -> 'fits'`,
      );
      assert.equal(
        mapRawFitToCanonicalStatus(raw, { isQualified: true }),
        "needs_verification",
        `Expected qualified '${raw}' -> 'needs_verification'`,
      );
      assert.equal(
        mapRawFitToCanonicalStatus(raw, { isStale: true }),
        "needs_verification",
        `Expected stale '${raw}' -> 'needs_verification'`,
      );
    }

    const doesNotFitRaw = [
      "runs_too_late",
      "does_not_fit",
      "does_not_fit_port_window",
      "ineligible",
      "no_longer_fits",
    ];
    for (const raw of doesNotFitRaw) {
      assert.equal(
        mapRawFitToCanonicalStatus(raw),
        "does_not_fit",
        `Expected '${raw}' -> 'does_not_fit'`,
      );
    }

    const needsVerificationRaw = [
      "needs_verification",
      "qualified_needs_confirmation",
      "needs_confirmation",
      "needs_reverification",
      "qualified_stale_or_unknown",
      "tighter_margin_caution",
      "check_availability",
    ];
    for (const raw of needsVerificationRaw) {
      assert.equal(
        mapRawFitToCanonicalStatus(raw),
        "needs_verification",
        `Expected '${raw}' -> 'needs_verification'`,
      );
    }

    for (const raw of ["sold_out", "unavailable", "withdrawn"]) {
      assert.equal(
        mapRawFitToCanonicalStatus(raw),
        "unavailable",
        `Expected '${raw}' -> 'unavailable'`,
      );
    }
    assert.equal(
      mapRawFitToCanonicalStatus("fits_comfortably", { seatAvailable: false }),
      "unavailable",
    );
    assert.equal(
      mapRawFitToCanonicalStatus("fits", { pastDepartureRejected: true }),
      "unavailable",
    );

    for (const raw of ["missing_operator_info", "unknown", "indeterminate", "", null, undefined]) {
      assert.equal(
        mapRawFitToCanonicalStatus(raw),
        "unknown",
        `Expected '${String(raw)}' -> 'unknown'`,
      );
    }

    const evalFit = buildCanonicalFitEvaluation({
      rawStatus: "fits_comfortably",
      informationBasis: "official_operating_fact",
      factAppliesAt: "2026-07-15",
      learnedByDccAt: "2026-11-11T12:00:00Z",
      freshnessState: "current",
      assumptions: ["60-min return buffer", "60-min return buffer"],
      sources: ["operator:coastal-helicopters"],
    });
    assert.equal(evalFit.status, "fits");
    assert.equal(evalFit.commissionNeutral, true);
    assert.equal(evalFit.informationBasis, "official_operating_fact");
    assert.equal(evalFit.factAppliesAt, "2026-07-15");
    assert.equal(evalFit.learnedByDccAt, "2026-11-11T12:00:00Z");
    assert.deepEqual(evalFit.assumptions, ["60-min return buffer"]);
    assert.deepEqual(evalFit.sources, ["operator:coastal-helicopters"]);
    assert.equal(evalFit.rawEngineStatus, "fits_comfortably");
  });

  it("2. builds sanitized Cruise Promenade /planner/add URLs while stripping all PII, weights, cabin numbers, and dcc_ctx_ tokens", () => {
    const urlStr = buildAddToCruisePromenadeUrl({
      title: "Mendenhall Glacier Helicopter & Dog Sledding contact@secret.org",
      port: "Juneau",
      portDate: "2026-07-18",
      ship: "Norwegian Bliss",
      sailDate: "2026-07-15",
      cruiseLine: "Norwegian Cruise Line",
      durationMinutes: 195,
      partySize: 4,
      operator: "Coastal Helicopters",
      fitStatus: "fits_comfortably",
      sourceSite: "JuneauFlightDeck.com",
      productCode: "5889HELI",
      handoffId: "ho_jfd_123",
      shareCode: "ALASKA2026",
      // Accidental PII fields that MUST be stripped:
      email: "traveler@example.com",
      phone: "+1-555-0199",
      name: "Jordan Traveler",
      passenger_weight: 215,
      passengerWeightsLbs: "215,180",
      cabin: "11204",
      stateroom: "11204",
      pnr: "ABC123",
      ctx: "dcc_ctx_secret_token",
      dcc_ctx: "dcc_ctx_secret_token",
    });

    const parsed = new URL(urlStr);
    assert.equal(parsed.origin, "https://cruisepromenade.com");
    assert.equal(parsed.pathname, "/planner/add");
    assert.equal(
      parsed.searchParams.get("title"),
      "Mendenhall Glacier Helicopter & Dog Sledding",
    );
    assert.equal(parsed.searchParams.get("port"), "juneau");
    assert.equal(parsed.searchParams.get("date"), "2026-07-18");
    assert.equal(parsed.searchParams.get("ship"), "Norwegian Bliss");
    assert.equal(parsed.searchParams.get("sailDate"), "2026-07-15");
    assert.equal(parsed.searchParams.get("cruiseLine"), "Norwegian Cruise Line");
    assert.equal(parsed.searchParams.get("durationMinutes"), "195");
    assert.equal(parsed.searchParams.get("partySize"), "4");
    assert.equal(parsed.searchParams.get("operator"), "Coastal Helicopters");
    assert.equal(parsed.searchParams.get("fitStatus"), "fits");
    assert.equal(parsed.searchParams.get("sourceSite"), "juneauflightdeck.com");
    assert.equal(parsed.searchParams.get("productCode"), "5889HELI");
    assert.equal(parsed.searchParams.get("handoffId"), "ho_jfd_123");
    assert.equal(parsed.searchParams.get("shareCode"), "ALASKA2026");

    // Verify zero PII leakage
    for (const forbidden of [
      "email",
      "phone",
      "name",
      "passenger_weight",
      "passengerWeightsLbs",
      "cabin",
      "stateroom",
      "pnr",
      "ctx",
      "dcc_ctx",
    ]) {
      assert.equal(
        parsed.searchParams.has(forbidden),
        false,
        `Expected '${forbidden}' to be stripped`,
      );
    }
    assert.equal(urlStr.includes("secret.org"), false);
    assert.equal(urlStr.includes("dcc_ctx_"), false);

    // Ensure a dcc_ctx_ token accidentally passed in shareCode is rejected
    const withTokenShare = new URL(
      buildAddToCruisePromenadeUrl({
        port: "ketchikan",
        shareCode: "dcc_ctx_should_not_pass",
      }),
    );
    assert.equal(withTokenShare.searchParams.has("shareCode"), false);
  });

  it("3. enforces Canonical Affiliate, Money-Route, Held-SKU, & WTA Protected-Partner Ledger invariants without node:fs", () => {
    const ledgerSrc = fs.readFileSync(
      path.join(REPO_ROOT, "lib/dcc/commerce/affiliateOwnershipLedger.ts"),
      "utf8",
    );
    assert.doesNotMatch(
      ledgerSrc,
      /(?:import\s+[\s\S]*?from\s*|import\s*\(|require\s*\()\s*["'][^"']*(?:node:fs|^fs$|@neondatabase\/serverless)/,
    );

    // 4 commercial routes + 1 neutral planning route = 5 total
    assert.equal(TRANSACTION_ROUTE_MODELS.length, 5);
    const commercialRoutes = TRANSACTION_ROUTE_MODELS.filter(
      (r) => r.routeCategory === "commercial",
    );
    const neutralRoutes = TRANSACTION_ROUTE_MODELS.filter(
      (r) => r.routeCategory === "neutral_planning",
    );
    assert.equal(commercialRoutes.length, 4);
    assert.equal(neutralRoutes.length, 1);

    for (const route of TRANSACTION_ROUTE_MODELS) {
      assert.equal(route.influencesFitOrRanking, false);
    }

    assert.equal(getTransactionRouteModel("dcc_sourced_direct_10pct").targetTakeRateBps, 1000);
    assert.equal(
      getTransactionRouteModel("dcc_sourced_direct_10pct").liveAuthorizedExternalSupplierCount,
      0,
    );
    assert.equal(getTransactionRouteModel("machine_distributed_5pct").targetTakeRateBps, 500);
    assert.equal(
      getTransactionRouteModel("machine_distributed_5pct").liveAuthorizedExternalSupplierCount,
      0,
    );
    assert.deepEqual(getTransactionRouteModel("direct_mor").participatingProperties, [
      "gosno.co",
      "partyatredrocks.com",
    ]);
    assert.equal(getTransactionRouteModel("commission_neutral_planning").targetTakeRateBps, 0);

    // 8 frozen affiliate IDs
    const expectedFrozenIds = [
      "P00058396",
      "P00306962",
      "P00281144",
      "aktourcenter",
      "welcometoneworleanstours",
      "wtonot-tours",
      "welcometoalaskatours",
      "F2MMUUH",
    ];
    assert.equal(FROZEN_AFFILIATE_IDENTIFIERS.length, 8);
    assert.deepEqual(
      FROZEN_AFFILIATE_IDENTIFIERS.map((r) => r.id),
      expectedFrozenIds,
    );

    const reviewItems = listPartnerBoundaryReviewItems();
    assert.equal(reviewItems.length, 0);
    const wtaFrozen = FROZEN_AFFILIATE_IDENTIFIERS.find(
      (r) => r.id === "welcometoalaskatours",
    );
    assert.ok(wtaFrozen);
    assert.deepEqual(wtaFrozen.assignedSurfaces, []);
    assert.equal(wtaFrozen.governanceStatus, "isolated_partner_unused");

    assert.equal(
      CANONICAL_SITE_PROVIDER_ACCOUNTS["lastfrontiershoreexcursions.com"].viatorPid,
      "P00281144",
    );
    assert.equal(
      CANONICAL_SITE_PROVIDER_ACCOUNTS["destinationcommandcenter.com"].viatorPid,
      "P00306962",
    );
    assert.equal(
      CANONICAL_SITE_PROVIDER_ACCOUNTS["juneauflightdeck.com"].viatorPid,
      "P00058396",
    );

    // 1 held commercial SKU (WNO Jean Lafitte stays held; LFSE Aleutian Ballad unheld on GYG F2MMUUH)
    assert.equal(HELD_COMMERCIAL_SKUS.length, 1);
    assert.deepEqual(
      HELD_COMMERCIAL_SKUS.map((s) => `${s.surfaceCode}:${s.skuSlug}`),
      ["WNO:jeanlafitte-swamp-tour-with-hotel-pickup"],
    );

    // Protected Partner Property: Welcome to Alaska Tours
    assert.equal(PROTECTED_PARTNER_PROPERTIES.length, 1);
    const wta = getProtectedPartnerProperty("welcometoalaskatours.com");
    assert.ok(wta);
    assert.equal(wta.partnerId, "welcome-to-alaska");
    assert.equal(wta.ownership, "friend_independent_partner");
    assert.equal(wta.isOwnedByDcc, false);
    assert.equal(wta.consumerTrafficLinkingAllowed, false);
    assert.equal(wta.activeContainmentDeployment, "dpl_D6yaKKQtgek7iEz4fcbLqSVTCViC");
    assert.equal(wta.stagedContingencyPreviewOnly, "dpl_9Uod58Fs6s5YdP3BJYNaqbGhtC8V");
    assert.equal(wta.checkoutStatus, "503_BOOKINGS_DISABLED");
    assert.deepEqual(wta.prohibitedWithoutPartnerApproval, [
      "promote_301_redirect",
      "retire_or_rebrand_domain",
      "consolidate_affiliate_ids_or_payouts",
      "migrate_customer_records",
    ]);

    // Verify WTA independent partner labeling across registry & admin views
    const excludedWta = DCC_EXCLUDED_PORTFOLIO_SITES.find(
      (s) => s.site_id === "welcometoalaskatours",
    );
    assert.ok(excludedWta);
    assert.match(
      excludedWta.reason,
      /Independent Protected Partner Property \(WTA/,
    );
    const adminPortfolioSrc = fs.readFileSync(
      path.join(REPO_ROOT, "app/admin/portfolio/page.tsx"),
      "utf8",
    );
    assert.match(adminPortfolioSrc, /Independent Protected Partner Property \(WTA\)/);
    const satelliteHandoffsSrc = fs.readFileSync(
      path.join(REPO_ROOT, "app/admin/satellite-handoffs/page.tsx"),
      "utf8",
    );
    assert.match(satelliteHandoffsSrc, /Independent Protected Partner Property \(WTA\)/);
  });

  it("4. evaluates port-day travel graph options via GET & POST /api/v1/travel-graph/evaluate and advertises endpoint in /.well-known/dcc and /agent.json", async () => {
    const optRes = await optionsTravelGraphEvaluate();
    assert.equal(optRes.status, 204);

    // Validation errors
    const missingPortRes = await getTravelGraphEvaluate(
      new Request("https://www.destinationcommandcenter.com/api/v1/travel-graph/evaluate"),
    );
    assert.equal(missingPortRes.status, 400);

    const unknownPortRes = await getTravelGraphEvaluate(
      new Request(
        "https://www.destinationcommandcenter.com/api/v1/travel-graph/evaluate?portSlug=atlantis-underwater-port",
      ),
    );
    assert.equal(unknownPortRes.status, 404);

    // GET evaluation on Juneau with explicit window
    const getRes = await getTravelGraphEvaluate(
      new Request(
        "https://www.destinationcommandcenter.com/api/v1/travel-graph/evaluate?portSlug=juneau&shipSlug=norwegian-bliss&sailDate=2026-07-15&portDate=2026-07-18&arrivalTime=07:00&allAboardTime=19:30&partySize=4&category=all",
      ),
    );
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.ok, true);
    assert.equal(getBody.commissionNeutral, true);
    assert.equal(getBody.context.port.slug, "juneau");
    assert.equal(getBody.context.partySize, 4);
    assert.ok(typeof getBody.context.safeReturnCutoffTime === "string");
    assert.ok(Array.isArray(getBody.options) && getBody.options.length > 0);

    const validCanonicalStates = new Set<CanonicalFitStatus>([
      "fits",
      "does_not_fit",
      "needs_verification",
      "unavailable",
      "unknown",
    ]);

    for (const opt of getBody.options) {
      assert.equal(validCanonicalStates.has(opt.canonicalFit.status), true);
      assert.equal(opt.canonicalFit.commissionNeutral, true);
      assert.equal(opt.transactionCapabilities.nativeBookingAuthorized, false);
      assert.equal(
        opt.transactionCapabilities.disclosure,
        "Native machine booking requires explicit supplier authorization; use context-preserving handoff.",
      );
      assert.match(opt.handoffUrl, /^https:\/\//);
      const cpUrl = new URL(opt.addToCruisePromenadeUrl);
      assert.equal(cpUrl.origin, "https://cruisepromenade.com");
      assert.equal(cpUrl.pathname, "/planner/add");
      assert.equal(cpUrl.searchParams.get("port"), "juneau");
      assert.equal(cpUrl.searchParams.get("partySize"), "4");
    }

    // POST evaluation on New Orleans with tight vs ample port window
    const postRes = await postTravelGraphEvaluate(
      new Request("https://www.destinationcommandcenter.com/api/v1/travel-graph/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipSlug: "carnival-valor",
          sailDate: "2026-09-12",
          portSlug: "new-orleans",
          portDate: "2026-09-12",
          arrivalTime: "08:00",
          allAboardTime: "15:30",
          partySize: 2,
          category: "all",
        }),
      }),
    );
    assert.equal(postRes.status, 200);
    const postBody = await postRes.json();
    assert.equal(postBody.ok, true);
    assert.equal(postBody.context.port.slug, "new-orleans");
    assert.ok(postBody.options.length > 0);

    // Advertised in /.well-known/dcc and /agent.json
    const wkJson = await (await getRootWellKnownDcc()).json();
    assert.equal(
      wkJson.endpoints.travelGraphEvaluate,
      "https://www.destinationcommandcenter.com/api/v1/travel-graph/evaluate",
    );
    const agentJson = await (await getRootAgentJson()).json();
    assert.equal(
      agentJson.discovery.travel_graph_evaluate,
      "https://www.destinationcommandcenter.com/api/v1/travel-graph/evaluate",
    );
  });

  it("5. wires WNO wtno_trip_ctx cookie persistence, specialist 'Add to Cruise Promenade Plan' buttons, and fail-open Wisconsin Dells durable handoff recording", async () => {
    // WNO cookie persistence checks
    const wnoAppPageSrc = fs.readFileSync(
      path.join(REPO_ROOT, "apps/welcometoneworleanstours/app/page.tsx"),
      "utf8",
    );
    assert.match(wnoAppPageSrc, /cookieStore\.get\("wtno_trip_ctx"\)/);
    assert.match(wnoAppPageSrc, /cookieContextId/);

    const wnoTourDetailSrc = fs.readFileSync(
      path.join(REPO_ROOT, "app/new-orleans/tours/[slug]/page.tsx"),
      "utf8",
    );
    assert.match(wnoTourDetailSrc, /cookieStore\.get\("wtno_trip_ctx"\)/);
    assert.match(wnoTourDetailSrc, /cookieContextId/);
    assert.match(wnoTourDetailSrc, /Add to Cruise Promenade Plan/);
    assert.match(wnoTourDetailSrc, /buildAddToCruisePromenadeUrl/);

    // Specialist Add to Cruise Promenade Plan checks (JFD, LFSE, WNO Turnaround Desk)
    for (const relFile of [
      "apps/juneauflightdeck/app/components/JuneauPortAviationDecisionDesk.tsx",
      "apps/last-frontier-shore-excursions/components/ExcursionCard.tsx",
      "apps/last-frontier-shore-excursions/app/cruise-ships/[shipSlug]/[portSlug]/page.tsx",
      "app/new-orleans/components/NolaCruiseTurnaroundDesk.tsx",
    ]) {
      const src = fs.readFileSync(path.join(REPO_ROOT, relFile), "utf8");
      assert.match(
        src,
        /Add to Cruise Promenade Plan/,
        `Expected 'Add to Cruise Promenade Plan' in ${relFile}`,
      );
      assert.match(
        src,
        /buildAddToCruisePromenadeUrl/,
        `Expected buildAddToCruisePromenadeUrl in ${relFile}`,
      );
    }

    // Wisconsin Dells /out/wisconsin-dells/[slug] durable handoff recording + fail-open behavior
    const originalFetch = globalThis.fetch;
    try {
      let capturedUrl = "";
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(
          JSON.stringify({ ok: true, handoff: { handoffId: "ho_dells_river_777" } }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-DCC-Handoff-Id": "ho_dells_river_777",
            },
          },
        );
      }) as typeof fetch;

      const resWithHandoff = await getDellsOutboundRedirect(
        new NextRequest(
          "https://welcometothedells.com/out/wisconsin-dells/original-wisconsin-ducks?utm_source=dells-guide",
        ),
        { params: Promise.resolve({ slug: "original-wisconsin-ducks" }) },
      );
      assert.equal(resWithHandoff.status, 302);
      assert.equal(resWithHandoff.headers.get("X-DCC-Handoff-Id"), "ho_dells_river_777");
      assert.match(capturedUrl, /\/go\/out\?mode=json&url=/);
      assert.match(capturedUrl, /source_site=welcometothedells\.com/);
      assert.match(capturedUrl, /corridor=wisconsin-dells-river-ops/);

      // Simulate DCC ingest network failure -> must still return exact 302 redirect!
      globalThis.fetch = (async () => {
        throw new Error("simulated network timeout");
      }) as typeof fetch;

      const resFailOpen = await getDellsOutboundRedirect(
        new NextRequest(
          "https://welcometothedells.com/out/wisconsin-dells/original-wisconsin-ducks",
        ),
        { params: Promise.resolve({ slug: "original-wisconsin-ducks" }) },
      );
      assert.equal(resFailOpen.status, 302);
      assert.match(
        resFailOpen.headers.get("location") || "",
        /wisconsinducktours\.com|originalwisconsinducks\.com|viator\.com/,
      );
      assert.equal(resFailOpen.headers.get("X-DCC-Handoff-Id"), null);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("6. gates /api/admin/control-center & /admin/unlock to '/admin' and builds complete Single-Administrator Owner Control Center snapshot", async () => {
    const prevAdminKey = process.env.ADMIN_ACCESS_KEY;
    process.env.ADMIN_ACCESS_KEY = "slice3-test-admin-secret";

    try {
      // Unauthenticated request -> 401 with no-store & noindex
      const unauthRes = await getControlCenterRoute(
        new Request("https://www.destinationcommandcenter.com/api/admin/control-center"),
      );
      assert.equal(unauthRes.status, 401);
      assert.match(unauthRes.headers.get("Cache-Control") || "", /no-store/);
      assert.match(unauthRes.headers.get("X-Robots-Tag") || "", /noindex/);

      // Unlock route defaults to /admin
      const form = new FormData();
      form.set("key", "slice3-test-admin-secret");
      const unlockRes = await postAdminUnlock(
        new NextRequest("https://www.destinationcommandcenter.com/admin/unlock", {
          method: "POST",
          body: form,
        }),
      );
      assert.ok(unlockRes.status === 307 || unlockRes.status === 303);
      assert.equal(
        new URL(unlockRes.headers.get("location") || "").pathname,
        "/admin",
      );
      assert.match(unlockRes.headers.get("set-cookie") || "", /dcc_admin_session=/);

      // Authenticated via ADMIN_SESSION_COOKIE
      const sessionToken = buildAdminSessionValue();
      const authCookieRes = await getControlCenterRoute(
        new Request("https://www.destinationcommandcenter.com/api/admin/control-center", {
          headers: {
            cookie: `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(sessionToken)}`,
          },
        }),
      );
      assert.equal(authCookieRes.status, 200);
      assert.match(authCookieRes.headers.get("Cache-Control") || "", /no-store/);
      assert.match(authCookieRes.headers.get("X-Robots-Tag") || "", /noindex/);
      const apiPayload = await authCookieRes.json();
      assert.equal(apiPayload.ok, true);
      assert.equal(apiPayload.operatorName, "Erich");
      assert.equal(apiPayload.dailyOperatingBudgetMinutes, 15);

      // Test buildOwnerControlCenterSnapshot with mocked remote CP, GoSno, and PARR endpoints
      const snapshotLive = await buildOwnerControlCenterSnapshot({
        env: {
          DCC_DISABLE_NEON_COMMERCE: "1",
          DCC_CP_SERVICE_SECRET: "cp-sec",
          DCC_INTERNAL_API_SECRET: "gosno-sec",
          DCC_PARR_WEBHOOK_TOKEN: "parr-sec",
          MODERATION_ALERT_EMAILS: "",
        },
        fetchImpl: (async (input: RequestInfo | URL) => {
          const url = String(input);
          if (url.includes("cruisepromenade.com/api/internal/owner-summary")) {
            return new Response(
              JSON.stringify({
                needsAssistanceGuestsCount: 3,
                plannersWithSplitsCount: 5,
                sharedPlannersCount: 18,
                trackedGuestsCount: 64,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }
          if (url.includes("gosno.co/api/internal/owner-summary")) {
            return new Response(
              JSON.stringify({
                provisioningExceptions: 1,
                needsReviewOrders: 2,
                paidOrders28d: 14,
                grossRevenueUsd28d: 6850,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }
          if (url.includes("partyatredrocks.com/api/internal/owner-summary")) {
            return new Response("Not Found", { status: 404 });
          }
          return new Response("Not Found", { status: 404 });
        }) as typeof fetch,
      });

      assert.equal(snapshotLive.triageQueue.inboxHref, "/admin/inbox?view=genuine");
      assert.equal(snapshotLive.triageQueue.cruisePromenade.status, "live");
      assert.equal(snapshotLive.triageQueue.cruisePromenade.needsAssistanceGuestsCount, 3);
      assert.equal(snapshotLive.triageQueue.cruisePromenade.plannersWithSplitsCount, 5);
      assert.equal(snapshotLive.triageQueue.gosnoOps.status, "live");
      assert.equal(snapshotLive.triageQueue.gosnoOps.provisioningExceptions, 1);
      assert.equal(snapshotLive.triageQueue.gosnoOps.needsReviewOrders, 2);
      assert.equal(snapshotLive.triageQueue.parrOps.status, "pending_deploy");
      assert.equal(
        snapshotLive.triageQueue.rollCallBridge.moderationNotificationsOperational,
        false,
      );
      assert.match(
        snapshotLive.triageQueue.rollCallBridge.reminder || "",
        /MODERATION_ALERT_EMAILS/,
      );
      assert.equal(snapshotLive.triageQueue.heldSkusCount, 1);
      assert.equal(snapshotLive.triageQueue.partnerBoundaryReviewCount, 0);

      // 8-stage funnel & strictly separated revenue tracks
      assert.equal(snapshotLive.connectedFunnel28d.stages.length, 8);
      assert.deepEqual(
        snapshotLive.connectedFunnel28d.strictlySeparatedRevenue.commissionTrack.routesIncluded,
        [
          "marketplace_affiliate",
          "dcc_sourced_direct_10pct",
          "machine_distributed_5pct",
        ],
      );
      assert.deepEqual(
        snapshotLive.connectedFunnel28d.strictlySeparatedRevenue.directMorGrossTrack.routesIncluded,
        ["direct_mor"],
      );

      // 11 Owned Production Projects + 1 Protected Partner Property
      assert.equal(OWNED_ACTIVE_PRODUCTION_PROJECTS.length, 11);
      assert.equal(
        snapshotLive.fleetHealthAndRollback.ownedActiveProductionProjectsCount,
        11,
      );
      assert.equal(
        snapshotLive.fleetHealthAndRollback.ownedProductionProjects.some((p) =>
          p.canonicalDomain.includes("welcometoalaskatours"),
        ),
        false,
      );
      assert.equal(
        snapshotLive.fleetHealthAndRollback.protectedPartnerProperties.length,
        1,
      );
      assert.equal(
        snapshotLive.fleetHealthAndRollback.protectedPartnerProperties[0].partnerId,
        "welcome-to-alaska",
      );

      // Verify /admin layout nav bar & page have no consumer anchor link to welcometoalaskatours.com
      const adminLayoutSrc = fs.readFileSync(
        path.join(REPO_ROOT, "app/admin/layout.tsx"),
        "utf8",
      );
      assert.match(adminLayoutSrc, /Owner Control Center/);
      assert.match(adminLayoutSrc, /Operator Inbox/);
      assert.match(adminLayoutSrc, /Portfolio Desktop/);

      const adminPageSrc = fs.readFileSync(
        path.join(REPO_ROOT, "app/admin/page.tsx"),
        "utf8",
      );
      assert.match(adminPageSrc, /protected-partner-property-card/);
      assert.doesNotMatch(adminPageSrc, /href=["'][^"']*welcometoalaskatours\.com/i);
    } finally {
      if (prevAdminKey === undefined) {
        delete process.env.ADMIN_ACCESS_KEY;
      } else {
        process.env.ADMIN_ACCESS_KEY = prevAdminKey;
      }
    }
  });

  it("7. keeps lib/dcc/productScope.ts 100% pure with zero node:fs or heavy runtime imports", () => {
    const productScopeSrc = fs.readFileSync(
      path.join(REPO_ROOT, "lib/dcc/productScope.ts"),
      "utf8",
    );
    assert.doesNotMatch(
      productScopeSrc,
      /node:fs|from\s+["']fs["']|node:child_process|@neondatabase\/serverless|drizzle-orm|lib\/dcc\/machine\/v03|lib\/dcc\/cruisePortDirectory/,
    );
  });
});
