import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

process.env.DCC_DURABLE_STORE_PATH = path.join(
  os.tmpdir(),
  `dcc-gosno-route-feed-test-${process.pid}.json`,
);
import {
  DEFAULT_GOSNO_SNAPSHOT_TTL_MS,
  GOSNO_PRICE_FALLBACK_MESSAGE,
  GOSNO_ROUTE_FEED_URL,
  SCHEDULED_GOSNO_FEED_REFRESH_CRON,
  SCHEDULED_GOSNO_FEED_REFRESH_INTERVAL_MS,
  SCHEDULED_GOSNO_FEED_REFRESH_PATH,
  buildGoSnoPrivateGroupInquiryOption,
  compileApplicableDecisionContext,
  createGoSnoRouteFeedSnapshot,
  getActiveGoSnoRouteFeedSnapshotState,
  getBaselineGoSnoRouteFeedSnapshot,
  refreshGoSnoRouteFeedSnapshot,
  replayHistoricalApplicableDecisionContext,
  resetGoSnoRouteFeedSnapshotToBaseline,
  resolveGoSnoOneWayFare,
  resolveGoSnoRoundTripFare,
  saveGoSnoRouteFeedSnapshot,
  validateGoSnoRouteFeedPayload,
  type GoSnoRouteFeedPayload,
} from "@/lib/dcc/applicability";
import {
  GET as scheduledRefreshGet,
  POST as scheduledRefreshPost,
} from "@/app/api/internal/gosno/route-feed-refresh/route";
import { POST as evaluateApplicabilityPost } from "@/app/api/v1/applicability/evaluate/route";
import { NextRequest } from "next/server";
import { buildDenverToVailShuttleGuidePageModel } from "@/app/transportation/colorado/denver-to-vail-shuttle-guide/model";
import { getAskDccEvidence } from "@/lib/dcc/ask/service";
import { getTravelReferenceNodeById } from "@/lib/dcc/travelReference";
import { proxy } from "@/proxy";
import { DECISION_ENGINE_PAGES } from "@/src/data/decision-engine-pages";
import { getPublishedDecisionGuide } from "@/src/data/published-decision-guides";

async function withIsolatedGoSnoTestState<T>(
  fn: (ctx: { tempDir: string; storePath: string }) => Promise<T> | T,
): Promise<T> {
  const prevStorePath = process.env.DCC_DURABLE_STORE_PATH;
  const prevBaselinePath = process.env.DCC_GOSNO_BASELINE_SNAPSHOT_PATH;
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `dcc-gosno-isolated-${process.pid}-`),
  );
  const storePath = path.join(tempDir, "durable-store.json");
  process.env.DCC_DURABLE_STORE_PATH = storePath;
  delete process.env.DCC_GOSNO_BASELINE_SNAPSHOT_PATH;
  try {
    return await fn({ tempDir, storePath });
  } finally {
    if (prevStorePath === undefined) {
      delete process.env.DCC_DURABLE_STORE_PATH;
    } else {
      process.env.DCC_DURABLE_STORE_PATH = prevStorePath;
    }
    if (prevBaselinePath === undefined) {
      delete process.env.DCC_GOSNO_BASELINE_SNAPSHOT_PATH;
    } else {
      process.env.DCC_GOSNO_BASELINE_SNAPSHOT_PATH = prevBaselinePath;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

test("1. Duplicate GoSno fare tables and hardcoded fallback fares are removed from compiler.ts", () => {
  const compilerPath = path.join(
    process.cwd(),
    "lib",
    "dcc",
    "applicability",
    "compiler.ts",
  );
  const compilerSource = fs.readFileSync(compilerPath, "utf8");

  assert.equal(
    compilerSource.includes("GOSNO_APPROVED_SUV_ONE_WAY_USD"),
    false,
    "compiler.ts must not contain duplicate GOSNO_APPROVED_SUV_ONE_WAY_USD table",
  );
  assert.equal(
    compilerSource.includes("GOSNO_APPROVED_VAN_ONE_WAY_USD"),
    false,
    "compiler.ts must not contain duplicate GOSNO_APPROVED_VAN_ONE_WAY_USD table",
  );
  assert.equal(
    compilerSource.includes('destination === "Breckenridge" ? 399 : 499'),
    false,
    "compiler.ts must not contain hardcoded 399/499 fallback in group inquiry builder",
  );
});

test("2. Copper Mountain: DEN-COPPER and COPPER-DEN each show $349 SUV / $599 van, and outbound, return, SUV, and van stay distinct", async () => {
  resetGoSnoRouteFeedSnapshotToBaseline();

  // 2a. Outbound DEN-COPPER via compileApplicableDecisionContext & POST /api/v1/applicability/evaluate
  const denCopperRes = await evaluateApplicabilityPost(
    new Request("http://localhost/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        routeId: "DEN-COPPER",
        direction: "OUTBOUND",
        origin: "DEN",
        destination: "Copper Mountain",
        travelDate: "2026-12-20",
        passengerCount: 4,
        standardBagCount: 4,
        skiOrOversizeBagCount: 0,
      }),
    }),
  );
  assert.equal(denCopperRes.status, 200);
  const denCopperJson = await denCopperRes.json();
  assert.equal(denCopperJson.ok, true);
  assert.equal(
    denCopperJson.outcome.gosnoPricingSnapshot.matchedRouteId,
    "DEN-COPPER",
  );
  assert.equal(
    denCopperJson.outcome.gosnoPricingSnapshot.matchedDirection,
    "OUTBOUND",
  );

  const denCopperSuv = denCopperJson.outcome.vehicleClassEvaluations.find(
    (v: { vehicleClassId: string }) =>
      v.vehicleClassId === "veh:awd-full-size-suv",
  );
  const denCopperVan = denCopperJson.outcome.vehicleClassEvaluations.find(
    (v: { vehicleClassId: string }) =>
      v.vehicleClassId === "veh:private-transit-van-10",
  );
  assert.ok(denCopperSuv);
  assert.ok(denCopperVan);
  assert.equal(denCopperSuv.pricingResolution.matchedOfferId, "DEN-COPPER-SUV");
  assert.equal(denCopperSuv.pricingResolution.matchedRouteId, "DEN-COPPER");
  assert.equal(denCopperSuv.pricingResolution.fixedRateOneWayUsd, 349);
  assert.equal(denCopperSuv.pricingResolution.priceDisplay, "$349");

  assert.equal(denCopperVan.pricingResolution.matchedOfferId, "DEN-COPPER-VAN");
  assert.equal(denCopperVan.pricingResolution.matchedRouteId, "DEN-COPPER");
  assert.equal(denCopperVan.pricingResolution.fixedRateOneWayUsd, 599);
  assert.equal(denCopperVan.pricingResolution.priceDisplay, "$599");
  assert.equal(denCopperVan.pricingResolution.quoteOnly, true);

  // 2b. Return COPPER-DEN via compileApplicableDecisionContext & POST /api/v1/applicability/evaluate
  const copperDenRes = await evaluateApplicabilityPost(
    new Request("http://localhost/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        routeId: "COPPER-DEN",
        direction: "RETURN",
        origin: "Copper Mountain",
        destination: "DEN",
        travelDate: "2026-12-27",
        passengerCount: 4,
        standardBagCount: 4,
        skiOrOversizeBagCount: 0,
      }),
    }),
  );
  assert.equal(copperDenRes.status, 200);
  const copperDenJson = await copperDenRes.json();
  assert.equal(copperDenJson.ok, true);
  assert.equal(
    copperDenJson.outcome.gosnoPricingSnapshot.matchedRouteId,
    "COPPER-DEN",
  );
  assert.equal(
    copperDenJson.outcome.gosnoPricingSnapshot.matchedDirection,
    "RETURN",
  );

  const copperDenSuv = copperDenJson.outcome.vehicleClassEvaluations.find(
    (v: { vehicleClassId: string }) =>
      v.vehicleClassId === "veh:awd-full-size-suv",
  );
  const copperDenVan = copperDenJson.outcome.vehicleClassEvaluations.find(
    (v: { vehicleClassId: string }) =>
      v.vehicleClassId === "veh:private-transit-van-10",
  );
  assert.ok(copperDenSuv);
  assert.ok(copperDenVan);
  assert.equal(copperDenSuv.pricingResolution.matchedOfferId, "COPPER-DEN-SUV");
  assert.equal(copperDenSuv.pricingResolution.matchedRouteId, "COPPER-DEN");
  assert.equal(copperDenSuv.pricingResolution.fixedRateOneWayUsd, 349);
  assert.equal(copperDenSuv.pricingResolution.priceDisplay, "$349");

  assert.equal(copperDenVan.pricingResolution.matchedOfferId, "COPPER-DEN-VAN");
  assert.equal(copperDenVan.pricingResolution.matchedRouteId, "COPPER-DEN");
  assert.equal(copperDenVan.pricingResolution.fixedRateOneWayUsd, 599);
  assert.equal(copperDenVan.pricingResolution.priceDisplay, "$599");
  assert.equal(copperDenVan.pricingResolution.quoteOnly, true);

  // 2c. Verify that outbound, return, SUV, and van prices stay strictly distinct when priced differently in the feed
  const baseline = getBaselineGoSnoRouteFeedSnapshot();
  const customFeed: GoSnoRouteFeedPayload = structuredClone(baseline.feed);
  for (const r of customFeed.routes) {
    if (r.offer_id === "DEN-COPPER-SUV") {
      r.pricing.amount_usd = 349;
      r.pricing.amount_cents = 34900;
    } else if (r.offer_id === "COPPER-DEN-SUV") {
      r.pricing.amount_usd = 379;
      r.pricing.amount_cents = 37900;
    } else if (r.offer_id === "DEN-COPPER-VAN") {
      r.pricing.amount_usd = 599;
      r.pricing.amount_cents = 59900;
    } else if (r.offer_id === "COPPER-DEN-VAN") {
      r.pricing.amount_usd = 629;
      r.pricing.amount_cents = 62900;
    }
  }
  const asymmetricSnap = createGoSnoRouteFeedSnapshot(customFeed);
  saveGoSnoRouteFeedSnapshot(asymmetricSnap);

  try {
    const outOutcome = compileApplicableDecisionContext({
      corridorId: "corridor:denver-vail-i70",
      routeId: "DEN-COPPER",
      passengerCount: 4,
      standardBagCount: 4,
    });
    const retOutcome = compileApplicableDecisionContext({
      corridorId: "corridor:denver-vail-i70",
      routeId: "COPPER-DEN",
      passengerCount: 4,
      standardBagCount: 4,
    });

    const outSuv = outOutcome.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:awd-full-size-suv",
    )!;
    const outVan = outOutcome.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:private-transit-van-10",
    )!;
    const retSuv = retOutcome.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:awd-full-size-suv",
    )!;
    const retVan = retOutcome.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:private-transit-van-10",
    )!;

    assert.equal(outSuv.pricingResolution.fixedRateOneWayUsd, 349);
    assert.equal(outVan.pricingResolution.fixedRateOneWayUsd, 599);
    assert.equal(retSuv.pricingResolution.fixedRateOneWayUsd, 379);
    assert.equal(retVan.pricingResolution.fixedRateOneWayUsd, 629);
  } finally {
    resetGoSnoRouteFeedSnapshotToBaseline();
  }
});

test("3. Vail: $599 published van fare still leads to a quote where required; 11-person group is ineligible for a single van; 16- and 20-person cases reach group quote flow", async () => {
  resetGoSnoRouteFeedSnapshotToBaseline();

  // 3a. 8 passengers to Vail -> recommends GoSno van showing $599 published fare while keeping quoteOnly: true and quoteUrl
  const vail8Outcome = compileApplicableDecisionContext({
    corridorId: "corridor:denver-vail-i70",
    routeId: "DEN-VAIL",
    origin: "DEN",
    destination: "Vail",
    travelDate: "2026-12-20",
    passengerCount: 8,
    standardBagCount: 8,
    skiOrOversizeBagCount: 4,
  });
  assert.equal(
    vail8Outcome.recommendedVehicleClassId,
    "veh:private-transit-van-10",
  );
  assert.equal(vail8Outcome.recommendedOperatorId, "op:gosno");

  const vailVanEval = vail8Outcome.vehicleClassEvaluations.find(
    (v) => v.vehicleClassId === "veh:private-transit-van-10",
  )!;
  assert.equal(vailVanEval.pricingResolution.matchedOfferId, "DEN-VAIL-VAN");
  assert.equal(vailVanEval.pricingResolution.fixedRateOneWayUsd, 599);
  assert.equal(vailVanEval.pricingResolution.priceDisplay, "$599");
  assert.equal(vailVanEval.pricingResolution.quoteOnly, true);
  assert.match(
    vailVanEval.pricingResolution.compiledPricingNote,
    /\$599 one-way published van rate on gosno\.co; live availability API returns quoteOnly: true/,
  );
  assert.match(
    vailVanEval.pricingResolution.quoteUrl || "",
    /^https:\/\/gosno\.co\/request-quote\?/,
  );

  // 3b. 11-person group is ineligible for a single van
  const vail11Res = await evaluateApplicabilityPost(
    new Request("http://localhost/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        routeId: "DEN-VAIL",
        origin: "DEN",
        destination: "Vail",
        travelDate: "2026-12-20",
        passengerCount: 11,
        standardBagCount: 11,
        skiOrOversizeBagCount: 6,
      }),
    }),
  );
  const vail11Json = await vail11Res.json();
  const vail11Van = vail11Json.outcome.vehicleClassEvaluations.find(
    (v: { vehicleClassId: string }) =>
      v.vehicleClassId === "veh:private-transit-van-10",
  );
  assert.equal(vail11Van.disposition, "ineligible");
  assert.equal(
    vail11Van.constraintCodes.includes(
      "DISQUALIFIED_PASSENGER_COUNT_EXCEEDS_LEGAL_SEAT_CAP",
    ),
    true,
  );
  assert.notEqual(vail11Json.outcome.recommendedOperatorId, "op:gosno");
  assert.ok(vail11Json.outcome.privateGroupInquiryOption);
  assert.equal(
    vail11Json.outcome.privateGroupInquiryOption.referenceCombinedOneWayUsd,
    1098, // 1 van ($599) + 1 Suburban ($499)
  );

  // 3c. 16-person and 20-person groups reach GoSno group quote flow with route-feed fares
  const vail16Option = buildGoSnoPrivateGroupInquiryOption({
    corridorId: "corridor:denver-vail-i70",
    origin: "DEN",
    destination: "Vail",
    travelDate: "2026-12-20",
    passengerCount: 16,
    standardBagCount: 16,
    skiOrOversizeBagCount: 12,
  });
  assert.ok(vail16Option);
  assert.equal(vail16Option.vehicleSuggestion.vanCount, 1);
  assert.equal(vail16Option.vehicleSuggestion.suvCount, 1);
  assert.equal(vail16Option.referenceCombinedOneWayUsd, 1098); // $599 + $499
  assert.match(vail16Option.inquiryUrl, /^https:\/\/gosno\.co\/request-quote\?/);

  const vail20Option = buildGoSnoPrivateGroupInquiryOption({
    corridorId: "corridor:denver-vail-i70",
    origin: "DEN",
    destination: "Vail",
    travelDate: "2026-12-20",
    passengerCount: 20,
    standardBagCount: 20,
    skiOrOversizeBagCount: 16,
  });
  assert.ok(vail20Option);
  assert.equal(vail20Option.vehicleSuggestion.vanCount, 2);
  assert.equal(vail20Option.vehicleSuggestion.suvCount, 0);
  assert.equal(vail20Option.referenceCombinedOneWayUsd, 1198); // 2 * $599
  assert.match(vail20Option.inquiryUrl, /^https:\/\/gosno\.co\/request-quote\?/);
});

test("4. Feed failure, invalid data, expired snapshot, and missing group component fare behavior (isolated test state)", async () => {
  await withIsolatedGoSnoTestState(async () => {
    const baseline = getBaselineGoSnoRouteFeedSnapshot();
    const baseNowMs = Date.now();

    // Seed a known valid snapshot fetched 45 minutes ago in isolated state
    const validFetchedAt = new Date(baseNowMs - 45 * 60 * 1000).toISOString();
    const seededValidSnapshot = createGoSnoRouteFeedSnapshot(baseline.feed, {
      fetchedAt: validFetchedAt,
      ttlMs: 24 * 60 * 60 * 1000,
    });
    saveGoSnoRouteFeedSnapshot(seededValidSnapshot);

    // 4a. Unavailable feed (HTTP 503): retains last valid snapshot, shows its age (45m old), and evaluates fares from it
    const unavailableRefresh = await refreshGoSnoRouteFeedSnapshot({
      now: new Date(baseNowMs),
      fetchImpl: async () =>
        new Response("Upstream Unavailable", {
          status: 503,
          statusText: "Service Unavailable",
        }),
    });
    assert.equal(unavailableRefresh.ok, false);
    assert.equal(unavailableRefresh.retainedLastValid, true);
    assert.equal(
      unavailableRefresh.state.freshnessStatus,
      "retained_after_failed_refresh",
    );
    assert.equal(unavailableRefresh.state.ageLabel, "45m old");
    assert.match(
      unavailableRefresh.state.statusBanner,
      /retaining last valid GoSno snapshot \(45m old/,
    );

    const outcomeAfterUnavailable = compileApplicableDecisionContext(
      {
        corridorId: "corridor:denver-vail-i70",
        routeId: "DEN-COPPER",
        passengerCount: 4,
        standardBagCount: 4,
      },
      { serverNowMs: baseNowMs },
    );
    const suvAfterUnavailable =
      outcomeAfterUnavailable.vehicleClassEvaluations.find(
        (v) => v.vehicleClassId === "veh:awd-full-size-suv",
      )!;
    assert.equal(suvAfterUnavailable.pricingResolution.fixedRateOneWayUsd, 349);
    assert.equal(
      outcomeAfterUnavailable.gosnoPricingSnapshot?.freshnessStatus,
      "retained_after_failed_refresh",
    );
    assert.equal(
      outcomeAfterUnavailable.gosnoPricingSnapshot?.ageLabel,
      "45m old",
    );

    // 4b. Invalid feed data (negative price & empty round_trips): rejects invalid payload, retains last valid snapshot, shows its age
    const invalidRefresh = await refreshGoSnoRouteFeedSnapshot({
      now: new Date(baseNowMs + 5 * 60 * 1000), // 50m old
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            spec: "dcc-route-feed",
            version: "1.0",
            generated_at: new Date(baseNowMs).toISOString(),
            routes: [
              {
                offer_id: "DEN-COPPER-SUV",
                route_id: "DEN-COPPER",
                direction: "OUTBOUND",
                origin: "DEN",
                destination: "Copper Mountain",
                vehicle_class: "suv",
                seating_limit: 6,
                canonical_booking_url: "https://gosno.co/copper",
                quote_url: "https://gosno.co/request-quote",
                pricing: {
                  amount_usd: -349,
                  amount_cents: -34900,
                  currency: "USD",
                },
              },
            ],
            round_trips: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    });
    assert.equal(invalidRefresh.ok, false);
    assert.equal(invalidRefresh.retainedLastValid, true);
    assert.equal(
      invalidRefresh.state.freshnessStatus,
      "retained_after_failed_refresh",
    );
    assert.equal(invalidRefresh.state.ageLabel, "50m old");
    assert.equal(
      invalidRefresh.snapshot.contentHash,
      seededValidSnapshot.contentHash,
    );

    // 4c. Expired snapshot (evaluated 26 hours after fetch, past 24h TTL): shows "Check current price with GoSno", withholds numeric fares, and preserves quote handoff
    const expiredSnapshot = createGoSnoRouteFeedSnapshot(baseline.feed, {
      fetchedAt: new Date(baseNowMs - 26 * 60 * 60 * 1000).toISOString(),
      ttlMs: 24 * 60 * 60 * 1000,
    });
    saveGoSnoRouteFeedSnapshot(expiredSnapshot);

    const expiredOutcome = compileApplicableDecisionContext({
      corridorId: "corridor:denver-vail-i70",
      routeId: "DEN-COPPER",
      passengerCount: 16,
      standardBagCount: 16,
      skiOrOversizeBagCount: 12,
    });
    assert.equal(
      expiredOutcome.gosnoPricingSnapshot?.freshnessStatus,
      "expired",
    );
    assert.equal(expiredOutcome.gosnoPricingSnapshot?.isExpired, true);
    assert.match(
      expiredOutcome.gosnoPricingSnapshot?.statusBanner || "",
      /Check current price with GoSno/,
    );

    const expiredSuv = expiredOutcome.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:awd-full-size-suv",
    )!;
    const expiredVan = expiredOutcome.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:private-transit-van-10",
    )!;
    assert.equal(expiredSuv.pricingResolution.fixedRateOneWayUsd, null);
    assert.equal(
      expiredSuv.pricingResolution.priceDisplay,
      GOSNO_PRICE_FALLBACK_MESSAGE,
    );
    assert.equal(expiredSuv.pricingResolution.quoteOnly, true);
    assert.equal(
      expiredOutcome.gosnoPricingSnapshot?.suvOffer?.onlineBookable,
      false,
    );
    assert.equal(
      expiredOutcome.gosnoPricingSnapshot?.suvOffer?.nextStep,
      "request a quote",
    );
    assert.match(
      expiredSuv.pricingResolution.compiledPricingNote,
      /Check current price with GoSno/,
    );
    assert.equal(expiredVan.pricingResolution.fixedRateOneWayUsd, null);
    assert.equal(
      expiredVan.pricingResolution.priceDisplay,
      GOSNO_PRICE_FALLBACK_MESSAGE,
    );
    assert.equal(expiredVan.pricingResolution.quoteOnly, true);
    assert.equal(
      expiredOutcome.gosnoPricingSnapshot?.vanOffer?.onlineBookable,
      false,
    );
    assert.equal(
      expiredOutcome.gosnoPricingSnapshot?.vanOffer?.nextStep,
      "request a quote",
    );

    assert.ok(expiredOutcome.privateGroupInquiryOption);
    assert.equal(
      expiredOutcome.privateGroupInquiryOption.referenceCombinedOneWayUsd,
      null,
    );
    assert.equal(
      expiredOutcome.privateGroupInquiryOption.priceDisplay,
      GOSNO_PRICE_FALLBACK_MESSAGE,
    );
    assert.match(
      expiredOutcome.privateGroupInquiryOption.inquiryUrl,
      /^https:\/\/gosno\.co\/request-quote\?/,
    );

    // 4d. Group estimate missing a component fare (e.g. Crested Butte 16-person group where SUV is $699 but Van fare is null)
    saveGoSnoRouteFeedSnapshot(seededValidSnapshot);
    const crestedButte16Group = buildGoSnoPrivateGroupInquiryOption({
      corridorId: "corridor:denver-vail-i70",
      origin: "DEN",
      destination: "Crested Butte",
      travelDate: "2026-12-20",
      passengerCount: 16,
      standardBagCount: 16,
      skiOrOversizeBagCount: 12,
      nowMs: baseNowMs,
    });
    assert.ok(crestedButte16Group);
    assert.equal(crestedButte16Group.componentFares.suvOneWayUsd, 699);
    assert.equal(crestedButte16Group.componentFares.vanOneWayUsd, null);
    assert.equal(crestedButte16Group.componentFares.missingComponentFare, true);
    assert.equal(
      crestedButte16Group.referenceCombinedOneWayUsd,
      null,
      "When a group estimate is missing a component fare, referenceCombinedOneWayUsd must be null",
    );
    assert.equal(
      crestedButte16Group.priceDisplay,
      GOSNO_PRICE_FALLBACK_MESSAGE,
    );
    assert.match(
      crestedButte16Group.inquiryUrl,
      /^https:\/\/gosno\.co\/request-quote\?/,
    );
    assert.equal(
      crestedButte16Group.inquiryUrl.includes("referenceCombinedOneWayUsd"),
      false,
    );
  });
});

test("5. Automated catalog comparison against all 72 one-way and 36 round-trip offers from live GoSno route feed", async () => {
  await withIsolatedGoSnoTestState(async () => {
    const liveRes = await fetch(GOSNO_ROUTE_FEED_URL, {
      headers: { Accept: "application/json" },
    });
    assert.equal(liveRes.ok, true, "Live GoSno route feed must return HTTP 200");
    const liveFeed = (await liveRes.json()) as GoSnoRouteFeedPayload;

    const validation = validateGoSnoRouteFeedPayload(liveFeed);
    assert.equal(
      validation.valid,
      true,
      `Live GoSno route feed failed validation: ${validation.errors.join("; ")}`,
    );

    assert.equal(
      liveFeed.routes.length,
      72,
      "GoSno route feed must expose exactly 72 one-way offers",
    );
    assert.equal(
      liveFeed.round_trips.length,
      36,
      "GoSno route feed must expose exactly 36 round-trip offers",
    );

    // Seed freshly fetched live snapshot into isolated state
    const liveSnapshot = createGoSnoRouteFeedSnapshot(liveFeed);
    saveGoSnoRouteFeedSnapshot(liveSnapshot);

    const activeState = getActiveGoSnoRouteFeedSnapshotState();
    assert.equal(
      activeState.snapshot.contentHash,
      getBaselineGoSnoRouteFeedSnapshot().contentHash,
      "Saved DCC baseline snapshot contentHash must match live GoSno route feed catalog content",
    );

    // Compare all 72 one-way offers for every field DCC consumes
    for (const liveOffer of liveFeed.routes) {
      const resolved = resolveGoSnoOneWayFare({
        offerId: liveOffer.offer_id,
        routeId: liveOffer.route_id,
        direction: liveOffer.direction,
        origin: liveOffer.origin,
        destination: liveOffer.destination,
        vehicleClass: liveOffer.vehicle_class,
      });

      assert.equal(
        resolved.matched,
        true,
        `Offer ${liveOffer.offer_id} must match in DCC`,
      );
      assert.equal(resolved.offerId, liveOffer.offer_id);
      assert.equal(resolved.routeId, liveOffer.route_id);
      assert.equal(resolved.direction, liveOffer.direction);
      assert.equal(resolved.origin, liveOffer.origin);
      assert.equal(resolved.destination, liveOffer.destination);
      assert.equal(resolved.vehicleClass, liveOffer.vehicle_class);
      assert.equal(resolved.seatingLimit, liveOffer.seating_limit);
      assert.equal(resolved.amountUsd, liveOffer.pricing.amount_usd);
      assert.equal(resolved.amountCents, liveOffer.pricing.amount_cents);
      assert.equal(resolved.currency, liveOffer.pricing.currency);
      assert.equal(resolved.canonicalBookingUrl, liveOffer.canonical_booking_url);
      assert.equal(resolved.quoteUrl, liveOffer.quote_url);

      // Also verify compileApplicableDecisionContext evaluates this exact offer price
      const compiled = compileApplicableDecisionContext({
        corridorId:
          liveOffer.destination === "Breckenridge" ||
          liveOffer.origin === "Breckenridge"
            ? "corridor:denver-breckenridge-i70"
            : "corridor:denver-vail-i70",
        offerId: liveOffer.offer_id,
        routeId: liveOffer.route_id,
        direction: liveOffer.direction,
        origin: liveOffer.origin,
        destination: liveOffer.destination,
        passengerCount: liveOffer.vehicle_class === "suv" ? 4 : 8,
        standardBagCount: 4,
      });

      const targetClassId =
        liveOffer.vehicle_class === "suv"
          ? "veh:awd-full-size-suv"
          : "veh:private-transit-van-10";
      const evalVehicle = compiled.vehicleClassEvaluations.find(
        (v) => v.vehicleClassId === targetClassId,
      )!;
      assert.equal(
        evalVehicle.pricingResolution.matchedOfferId,
        liveOffer.offer_id,
      );
      assert.equal(
        evalVehicle.pricingResolution.matchedRouteId,
        liveOffer.route_id,
      );
      assert.equal(
        evalVehicle.pricingResolution.fixedRateOneWayUsd,
        liveOffer.pricing.amount_usd,
      );
    }

    // Compare all 36 round-trip offers for every field DCC consumes
    for (const liveRt of liveFeed.round_trips) {
      const resolvedRt = resolveGoSnoRoundTripFare({
        offerId: liveRt.offer_id,
        routeId: liveRt.route_id,
        airport: liveRt.airport,
        resort: liveRt.resort,
        vehicleClass: liveRt.vehicle_class,
      });

      assert.equal(
        resolvedRt.matched,
        true,
        `Round-trip offer ${liveRt.offer_id} must match in DCC`,
      );
      assert.equal(resolvedRt.offerId, liveRt.offer_id);
      assert.equal(resolvedRt.routeId, liveRt.route_id);
      assert.equal(resolvedRt.outboundRouteId, liveRt.outbound_route_id);
      assert.equal(resolvedRt.returnRouteId, liveRt.return_route_id);
      assert.equal(resolvedRt.airport, liveRt.airport);
      assert.equal(resolvedRt.resort, liveRt.resort);
      assert.equal(resolvedRt.vehicleClass, liveRt.vehicle_class);
      assert.equal(resolvedRt.seatingLimit, liveRt.seating_limit);
      assert.equal(
        resolvedRt.outboundAmountUsd,
        liveRt.pricing.outbound_amount_usd,
      );
      assert.equal(
        resolvedRt.returnAmountUsd,
        liveRt.pricing.return_amount_usd,
      );
      assert.equal(resolvedRt.totalAmountUsd, liveRt.pricing.total_amount_usd);
      assert.equal(
        resolvedRt.totalAmountCents,
        liveRt.pricing.total_amount_cents,
      );
      assert.equal(resolvedRt.canonicalBookingUrl, liveRt.canonical_booking_url);
      assert.equal(resolvedRt.quoteUrl, liveRt.quote_url);
    }
  });
});

test("6. Authenticated scheduled refresh job runs before expiry while public trip evaluations only read the snapshot", async () => {
  await withIsolatedGoSnoTestState(async () => {
    // Verify vercel.json cron configuration matches scheduled cadence before 24h expiry
    const vercelConfigPath = path.join(process.cwd(), "vercel.json");
    const vercelConfig = JSON.parse(
      fs.readFileSync(vercelConfigPath, "utf8"),
    ) as {
      crons: Array<{ path: string; schedule: string }>;
    };
    const gosnoCron = vercelConfig.crons.find(
      (c) => c.path === SCHEDULED_GOSNO_FEED_REFRESH_PATH,
    );
    assert.ok(
      gosnoCron,
      "vercel.json must configure /api/internal/gosno/route-feed-refresh cron",
    );
    assert.equal(gosnoCron.schedule, SCHEDULED_GOSNO_FEED_REFRESH_CRON);
    assert.equal(
      DEFAULT_GOSNO_SNAPSHOT_TTL_MS / SCHEDULED_GOSNO_FEED_REFRESH_INTERVAL_MS,
      4,
      "Scheduled refresh job must run 4 times (every 6h) before the 24h snapshot TTL expires",
    );

    const prevCronSecret = process.env.CRON_SECRET;
    const prevInternalSecret = process.env.INTERNAL_API_SECRET;
    process.env.CRON_SECRET = "test-cron-secret-gosno-refresh";
    process.env.INTERNAL_API_SECRET = "test-internal-secret-gosno-refresh";

    try {
      // 6a. Unauthenticated GET and POST to /api/internal/gosno/route-feed-refresh must be rejected with 401
      const unauthGetRes = await scheduledRefreshGet(
        new Request("http://localhost/api/internal/gosno/route-feed-refresh", {
          method: "GET",
        }),
      );
      assert.equal(unauthGetRes.status, 401);

      const unauthPostRes = await scheduledRefreshPost(
        new Request("http://localhost/api/internal/gosno/route-feed-refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
      );
      assert.equal(unauthPostRes.status, 401);

      // 6b. Authenticated scheduled cron GET refreshes the snapshot before expiry
      const authCronGetRes = await scheduledRefreshGet(
        new Request("http://localhost/api/internal/gosno/route-feed-refresh", {
          method: "GET",
          headers: {
            Authorization: "Bearer test-cron-secret-gosno-refresh",
          },
        }),
      );
      assert.equal(authCronGetRes.status, 200);
      const authCronGetJson = await authCronGetRes.json();
      assert.equal(authCronGetJson.ok, true);
      assert.equal(authCronGetJson.authMethod, "cron_secret");
      assert.equal(
        authCronGetJson.scheduledRefreshCadence.cron,
        "0 */6 * * *",
      );
      assert.equal(
        authCronGetJson.scheduledRefreshCadence.refreshIntervalHours,
        6,
      );
      assert.equal(
        authCronGetJson.scheduledRefreshCadence.snapshotTtlHours,
        24,
      );
      assert.equal(
        authCronGetJson.scheduledRefreshCadence.refreshesBeforeExpiry,
        4,
      );
      assert.equal(
        authCronGetJson.gosnoRouteFeedSnapshot.freshnessStatus,
        "fresh",
      );

      // 6c. Authenticated internal POST also succeeds
      const authInternalPostRes = await scheduledRefreshPost(
        new Request("http://localhost/api/internal/gosno/route-feed-refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": "test-internal-secret-gosno-refresh",
          },
          body: JSON.stringify({ ttlMs: 24 * 60 * 60 * 1000 }),
        }),
      );
      assert.equal(authInternalPostRes.status, 200);
      const authInternalPostJson = await authInternalPostRes.json();
      assert.equal(authInternalPostJson.ok, true);
      assert.equal(authInternalPostJson.authMethod, "internal_secret");

      // 6d. Public trip evaluations strictly read the saved snapshot and ignore any refresh/simulation fields
      const beforeEvalState = getActiveGoSnoRouteFeedSnapshotState();
      const publicEvalRes = await evaluateApplicabilityPost(
        new Request("http://localhost/api/v1/applicability/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            corridorId: "corridor:denver-vail-i70",
            routeId: "DEN-COPPER",
            passengerCount: 4,
            standardBagCount: 4,
            // Attempt to pass removed public fields; route must ignore them and only read snapshot
            refreshGoSnoFeed: true,
            simulateFeedState: "expired",
          }),
        }),
      );
      assert.equal(publicEvalRes.status, 200);
      const publicEvalJson = await publicEvalRes.json();
      assert.equal(publicEvalJson.ok, true);
      assert.equal(
        publicEvalJson.outcome.gosnoPricingSnapshot.freshnessStatus,
        "fresh",
      );
      assert.equal(
        publicEvalJson.outcome.gosnoPricingSnapshot.fetchedAt,
        beforeEvalState.snapshot.fetchedAt,
      );
      const suvEval = publicEvalJson.outcome.vehicleClassEvaluations.find(
        (v: { vehicleClassId: string }) =>
          v.vehicleClassId === "veh:awd-full-size-suv",
      );
      assert.equal(suvEval.pricingResolution.fixedRateOneWayUsd, 349);
    } finally {
      if (prevCronSecret === undefined) {
        delete process.env.CRON_SECRET;
      } else {
        process.env.CRON_SECRET = prevCronSecret;
      }
      if (prevInternalSecret === undefined) {
        delete process.env.INTERNAL_API_SECRET;
      } else {
        process.env.INTERNAL_API_SECRET = prevInternalSecret;
      }
    }
  });
});

test("7. Server time governs current fare freshness (including bundled snapshot on a cold start), expired snapshot preserves quote handoff, and historical replay stays separate", async () => {
  await withIsolatedGoSnoTestState(async ({ tempDir }) => {
    const baseline = getBaselineGoSnoRouteFeedSnapshot();
    const realServerNowMs = Date.now();

    // Create an expired bundled snapshot file (fetched 30h ago, expired 6h ago relative to server time)
    const coldStartFetchedAtIso = new Date(
      realServerNowMs - 30 * 60 * 60 * 1000,
    ).toISOString();
    const expiredBundledSnapshot = createGoSnoRouteFeedSnapshot(baseline.feed, {
      fetchedAt: coldStartFetchedAtIso,
      ttlMs: 24 * 60 * 60 * 1000,
    });
    const coldStartBaselinePath = path.join(
      tempDir,
      "cold-start-expired-baseline.snapshot.json",
    );
    fs.writeFileSync(
      coldStartBaselinePath,
      JSON.stringify(expiredBundledSnapshot, null, 2),
      "utf8",
    );
    process.env.DCC_GOSNO_BASELINE_SNAPSHOT_PATH = coldStartBaselinePath;

    // 7a. On a cold start (no durable store entry yet), getActiveGoSnoRouteFeedSnapshotState() uses server time and detects the bundled snapshot is expired
    const coldStartState = getActiveGoSnoRouteFeedSnapshotState();
    assert.equal(coldStartState.isExpired, true);
    assert.equal(coldStartState.freshnessStatus, "expired");
    assert.match(
      coldStartState.statusBanner,
      /Check current price with GoSno/,
    );

    // 7b. Even if a request passes a backdated evaluationTimestamp (when the bundled snapshot was 1h old), current trip evaluation uses server time, shows "Check current price with GoSno", and preserves the quote handoff
    const backdatedTimestampWhenSnapshotWasFresh = new Date(
      Date.parse(coldStartFetchedAtIso) + 60 * 60 * 1000,
    ).toISOString();

    const coldStartEvalRes = await evaluateApplicabilityPost(
      new Request("http://localhost/api/v1/applicability/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corridorId: "corridor:denver-vail-i70",
          routeId: "DEN-VAIL",
          origin: "DEN",
          destination: "Vail",
          travelDate: "2026-12-20",
          passengerCount: 4,
          standardBagCount: 2,
          skiOrOversizeBagCount: 2,
          roofBoxConfirmed: true,
          evaluationTimestamp: backdatedTimestampWhenSnapshotWasFresh,
        }),
      }),
    );
    assert.equal(coldStartEvalRes.status, 200);
    const coldStartEvalJson = await coldStartEvalRes.json();
    assert.equal(coldStartEvalJson.ok, true);
    assert.equal(
      coldStartEvalJson.outcome.gosnoPricingSnapshot.isExpired,
      true,
    );
    assert.equal(
      coldStartEvalJson.outcome.gosnoPricingSnapshot.freshnessStatus,
      "expired",
    );

    const vailSuvExpired =
      coldStartEvalJson.outcome.vehicleClassEvaluations.find(
        (v: { vehicleClassId: string }) =>
          v.vehicleClassId === "veh:awd-full-size-suv",
      );
    const vailVanExpired =
      coldStartEvalJson.outcome.vehicleClassEvaluations.find(
        (v: { vehicleClassId: string }) =>
          v.vehicleClassId === "veh:private-transit-van-10",
      );
    assert.ok(vailSuvExpired);
    assert.ok(vailVanExpired);

    assert.equal(vailSuvExpired.pricingResolution.fixedRateOneWayUsd, null);
    assert.equal(
      vailSuvExpired.pricingResolution.priceDisplay,
      "Check current price with GoSno",
    );
    assert.equal(vailSuvExpired.pricingResolution.quoteOnly, true);
    assert.equal(
      coldStartEvalJson.outcome.gosnoPricingSnapshot.suvOffer.onlineBookable,
      false,
    );
    assert.equal(
      coldStartEvalJson.outcome.gosnoPricingSnapshot.suvOffer.nextStep,
      "request a quote",
    );
    const expiredHandoffUrl =
      coldStartEvalJson.opaqueAttribution.outboundPartnerUrl;
    assert.ok(
      expiredHandoffUrl,
      "Expired snapshot must preserve the GoSno quote handoff URL",
    );
    assert.match(
      expiredHandoffUrl,
      /^https:\/\/gosno\.co\/request-quote\?/,
    );
    assert.match(expiredHandoffUrl, /origin=DEN/);
    assert.match(expiredHandoffUrl, /destination=Vail/);
    assert.match(expiredHandoffUrl, /routeId=DEN-VAIL/);
    assert.match(expiredHandoffUrl, /offerId=DEN-VAIL-(?:SUV|VAN)/);
    assert.match(expiredHandoffUrl, /date=2026-12-20/);
    assert.match(expiredHandoffUrl, /passengers=4/);
    assert.match(expiredHandoffUrl, /skiBags=2/);
    assert.equal(
      expiredHandoffUrl.includes("publishedPrice"),
      false,
      "Expired quote handoff URL must not include a stale publishedPrice",
    );

    assert.ok(vailSuvExpired.pricingResolution.quoteUrl);
    assert.match(
      vailSuvExpired.pricingResolution.quoteUrl,
      /^https:\/\/gosno\.co\/request-quote\?/,
    );
    assert.equal(
      vailSuvExpired.pricingResolution.quoteUrl.includes("publishedPrice"),
      false,
    );

    assert.equal(vailVanExpired.pricingResolution.fixedRateOneWayUsd, null);
    assert.equal(
      vailVanExpired.pricingResolution.priceDisplay,
      "Check current price with GoSno",
    );
    assert.ok(
      vailVanExpired.pricingResolution.quoteUrl,
      "Expired snapshot must preserve the GoSno quote handoff URL on Van",
    );
    assert.match(
      vailVanExpired.pricingResolution.quoteUrl,
      /^https:\/\/gosno\.co\/request-quote\?/,
    );
    assert.equal(
      vailVanExpired.pricingResolution.quoteUrl.includes("publishedPrice"),
      false,
    );

    // 7c. Historical replay is kept separate and evaluates the snapshot at replayAtIso without affecting current freshness
    const replayedOutcome = replayHistoricalApplicableDecisionContext(
      {
        corridorId: "corridor:denver-vail-i70",
        routeId: "DEN-VAIL",
        origin: "DEN",
        destination: "Vail",
        passengerCount: 4,
        standardBagCount: 2,
        skiOrOversizeBagCount: 2,
      },
      {
        snapshot: expiredBundledSnapshot,
        replayAtIso: backdatedTimestampWhenSnapshotWasFresh,
      },
    );
    assert.equal(replayedOutcome.gosnoPricingSnapshot?.isExpired, false);
    assert.equal(
      replayedOutcome.gosnoPricingSnapshot?.freshnessStatus,
      "fresh",
    );
    assert.equal(replayedOutcome.gosnoPricingSnapshot?.ageLabel, "1h old");
    const replayedVailSuv = replayedOutcome.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:awd-full-size-suv",
    )!;
    assert.equal(replayedVailSuv.pricingResolution.fixedRateOneWayUsd, 499);
    assert.equal(replayedVailSuv.pricingResolution.priceDisplay, "$499");
  });
});

test("8. DCC guide copy and evaluator agree after a fixture fare change, and a fresh instance reads the same snapshot while Vail van still requires a quote", async () => {
  await withIsolatedGoSnoTestState(async ({ tempDir, storePath }) => {
    const baseline = getBaselineGoSnoRouteFeedSnapshot();
    const nowIso = new Date().toISOString();

    // Seed fresh baseline snapshot ($499 Vail SUV / $599 Vail Van)
    const freshBaselineSnapshot = createGoSnoRouteFeedSnapshot(baseline.feed, {
      fetchedAt: nowIso,
      ttlMs: 24 * 60 * 60 * 1000,
    });
    saveGoSnoRouteFeedSnapshot(freshBaselineSnapshot);

    // 8a. Verify baseline Vail guide copy and shuttle guide page model reflect $499 SUV and $599 van
    const baselineVailGuide = getPublishedDecisionGuide(
      "denver-airport-to-vail-rental-car-vs-private-transfer",
    )!;
    assert.ok(baselineVailGuide);
    assert.match(baselineVailGuide.answer, /\$499/);
    assert.match(baselineVailGuide.answer, /\$599/);

    const baselineShuttleModel = buildDenverToVailShuttleGuidePageModel();
    assert.equal(baselineShuttleModel.vailPricing.suvPriceLabel, "$499");
    assert.equal(baselineShuttleModel.vailPricing.vanPriceLabel, "$599");
    assert.equal(
      baselineShuttleModel.vailPricing.roundTripSuvPriceLabel,
      "$998",
    );
    assert.equal(
      baselineShuttleModel.vailPricing.roundTripVanFare.priceDisplay,
      "$1198",
    );

    // 8b. Modify DEN-VAIL fares in a test fixture ($499 -> $479 SUV, $599 -> $649 Van) and run refreshGoSnoRouteFeedSnapshot
    const modifiedFeed: GoSnoRouteFeedPayload = structuredClone(baseline.feed);
    for (const route of modifiedFeed.routes) {
      if (route.route_id === "DEN-VAIL" || route.route_id === "VAIL-DEN") {
        if (route.vehicle_class === "suv") {
          route.pricing.amount_usd = 479;
          route.pricing.amount_cents = 47900;
        } else if (route.vehicle_class === "van") {
          route.pricing.amount_usd = 649;
          route.pricing.amount_cents = 64900;
        }
      }
    }
    for (const rt of modifiedFeed.round_trips) {
      if (
        rt.resort === "Vail" ||
        rt.route_id === "DEN-VAIL" ||
        rt.route_id === "DEN-VAIL-RT"
      ) {
        if (rt.vehicle_class === "suv") {
          rt.pricing.outbound_amount_usd = 479;
          rt.pricing.return_amount_usd = 479;
          rt.pricing.total_amount_usd = 958;
          rt.pricing.total_amount_cents = 95800;
        } else if (rt.vehicle_class === "van") {
          rt.pricing.outbound_amount_usd = 649;
          rt.pricing.return_amount_usd = 649;
          rt.pricing.total_amount_usd = 1298;
          rt.pricing.total_amount_cents = 129800;
        }
      }
    }

    const refreshResult = await refreshGoSnoRouteFeedSnapshot({
      now: new Date(),
      fetchImpl: async () =>
        new Response(JSON.stringify(modifiedFeed), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    });
    assert.equal(refreshResult.ok, true);

    // 8c. Verify DCC guide copy, shuttle guide page model, Ask DCC evidence, and evaluator all agree on $479 SUV / $649 Van
    const updatedVailGuide = getPublishedDecisionGuide(
      "denver-airport-to-vail-rental-car-vs-private-transfer",
    )!;
    const updatedGroupGuide = getPublishedDecisionGuide(
      "how-does-group-size-change-airport-transportation",
    )!;
    const updatedGearGuide = getPublishedDecisionGuide(
      "how-ski-gear-changes-colorado-airport-transfer-choice",
    )!;
    const updatedShuttleModel = buildDenverToVailShuttleGuidePageModel();
    const updatedEvidence = getAskDccEvidence(
      "How should seven people get from Denver airport to Vail with ski bags?",
    );

    assert.match(updatedVailGuide.answer, /\$479/);
    assert.match(updatedVailGuide.answer, /\$649/);
    assert.equal(updatedVailGuide.answer.includes("$499"), false);
    assert.equal(updatedVailGuide.answer.includes("$599"), false);
    assert.match(
      JSON.stringify(updatedVailGuide.optionComparison),
      /\$479/,
    );
    assert.match(
      JSON.stringify(updatedVailGuide.optionComparison),
      /\$649/,
    );
    assert.match(JSON.stringify(updatedVailGuide.citations), /\$479/);
    assert.match(JSON.stringify(updatedVailGuide.citations), /\$649/);

    assert.match(updatedGroupGuide.answer, /\$479/);
    assert.match(updatedGroupGuide.answer, /\$649/);
    assert.match(updatedGearGuide.answer, /\$479/);
    assert.match(
      JSON.stringify(updatedGearGuide.assumptionsAndUnknowns),
      /\$649/,
    );
    assert.match(JSON.stringify(updatedGearGuide.citations), /\$479/);
    assert.match(JSON.stringify(updatedGearGuide.citations), /\$649/);

    assert.equal(updatedShuttleModel.vailPricing.suvPriceLabel, "$479");
    assert.equal(updatedShuttleModel.vailPricing.vanPriceLabel, "$649");
    assert.equal(
      updatedShuttleModel.vailPricing.roundTripSuvPriceLabel,
      "$958",
    );
    assert.equal(
      updatedShuttleModel.vailPricing.roundTripVanFare.priceDisplay,
      "$1298",
    );
    assert.match(updatedShuttleModel.capacityRuleSummary, /\$479/);
    assert.match(updatedShuttleModel.capacityRuleSummary, /\$649/);

    assert.match(JSON.stringify(updatedEvidence), /\$479/);
    assert.match(JSON.stringify(updatedEvidence), /\$649/);

    const updatedEval = compileApplicableDecisionContext({
      corridorId: "corridor:denver-vail-i70",
      routeId: "DEN-VAIL",
      origin: "DEN",
      destination: "Vail",
      passengerCount: 8,
      standardBagCount: 8,
      skiOrOversizeBagCount: 6,
    });
    const updatedEvalSuv = updatedEval.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:awd-full-size-suv",
    )!;
    const updatedEvalVan = updatedEval.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:private-transit-van-10",
    )!;
    assert.equal(updatedEvalSuv.pricingResolution.fixedRateOneWayUsd, 479);
    assert.equal(updatedEvalSuv.pricingResolution.priceDisplay, "$479");
    assert.equal(updatedEvalVan.pricingResolution.fixedRateOneWayUsd, 649);
    assert.equal(updatedEvalVan.pricingResolution.priceDisplay, "$649");
    assert.equal(updatedEvalVan.pricingResolution.quoteOnly, true);
    assert.equal(
      updatedEval.gosnoPricingSnapshot?.vanOffer?.onlineBookable,
      false,
    );
    assert.equal(
      updatedEval.gosnoPricingSnapshot?.vanOffer?.nextStep,
      "request a quote",
    );

    // 8d. Spawn a fresh OS process pointing at the same storePath to verify a fresh instance reads the same snapshot and Vail van still requires a quote
    const childScriptPath = path.join(tempDir, "fresh-instance-verify.ts");
    const childScript = `
      import { compileApplicableDecisionContext, getActiveGoSnoRouteFeedSnapshotState } from "@/lib/dcc/applicability";
      import { getPublishedDecisionGuide } from "@/src/data/published-decision-guides";
      import { buildDenverToVailShuttleGuidePageModel } from "@/app/transportation/colorado/denver-to-vail-shuttle-guide/model";

      const state = getActiveGoSnoRouteFeedSnapshotState();
      const guide = getPublishedDecisionGuide("denver-airport-to-vail-rental-car-vs-private-transfer");
      const shuttle = buildDenverToVailShuttleGuidePageModel();
      const evaluated = compileApplicableDecisionContext({
        corridorId: "corridor:denver-vail-i70",
        routeId: "DEN-VAIL",
        origin: "DEN",
        destination: "Vail",
        travelDate: "2026-12-20",
        passengerCount: 8,
        standardBagCount: 8,
        skiOrOversizeBagCount: 6,
      });
      const suv = evaluated.vehicleClassEvaluations.find((v) => v.vehicleClassId === "veh:awd-full-size-suv");
      const van = evaluated.vehicleClassEvaluations.find((v) => v.vehicleClassId === "veh:private-transit-van-10");
      process.stdout.write(JSON.stringify({
        contentHash: state.snapshot.contentHash,
        guideAnswer: guide?.answer,
        shuttleSuvText: shuttle.vailPricing.suvPriceLabel,
        shuttleVanText: shuttle.vailPricing.vanPriceLabel,
        evalSuvUsd: suv?.pricingResolution.fixedRateOneWayUsd,
        evalVanUsd: van?.pricingResolution.fixedRateOneWayUsd,
        evalVanPriceDisplay: van?.pricingResolution.priceDisplay,
        evalVanQuoteOnly: van?.pricingResolution.quoteOnly,
        evalVanOnlineBookable: evaluated.gosnoPricingSnapshot?.vanOffer?.onlineBookable,
        evalVanNextStep: evaluated.gosnoPricingSnapshot?.vanOffer?.nextStep,
      }));
    `;
    fs.writeFileSync(childScriptPath, childScript, "utf8");
    const childStdout = execFileSync(
      process.execPath,
      ["--import", "tsx", childScriptPath],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DCC_DURABLE_STORE_PATH: storePath,
        },
        encoding: "utf8",
      },
    );
    const freshInstanceResult = JSON.parse(childStdout.trim()) as {
      contentHash: string;
      guideAnswer: string;
      shuttleSuvText: string;
      shuttleVanText: string;
      evalSuvUsd: number;
      evalVanUsd: number;
      evalVanPriceDisplay: string;
      evalVanQuoteOnly: boolean;
      evalVanOnlineBookable: boolean;
      evalVanNextStep: string;
    };

    assert.equal(
      freshInstanceResult.contentHash,
      refreshResult.snapshot.contentHash,
      "Fresh instance must read the exact same refreshed snapshot",
    );
    assert.match(freshInstanceResult.guideAnswer, /\$479/);
    assert.match(freshInstanceResult.guideAnswer, /\$649/);
    assert.equal(freshInstanceResult.shuttleSuvText, "$479");
    assert.equal(freshInstanceResult.shuttleVanText, "$649");
    assert.equal(freshInstanceResult.evalSuvUsd, 479);
    assert.equal(freshInstanceResult.evalVanUsd, 649);
    assert.equal(freshInstanceResult.evalVanPriceDisplay, "$649");
    assert.equal(
      freshInstanceResult.evalVanQuoteOnly,
      true,
      "Fresh instance must still require a quote for the Vail van",
    );
    assert.equal(freshInstanceResult.evalVanOnlineBookable, false);
    assert.equal(freshInstanceResult.evalVanNextStep, "request a quote");
  });
});

test("9. Proxy CRON_SECRET authorization and DEN-BRECKENRIDGE shared snapshot fare lookup across Breckenridge guide, reference node, and evaluator", async () => {
  await withIsolatedGoSnoTestState(async () => {
    const prevCronSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "test-cron-secret-release-check";
    try {
      const getRefreshReq = new NextRequest(
        "https://www.destinationcommandcenter.com/api/internal/gosno/route-feed-refresh",
        {
          method: "GET",
          headers: {
            authorization: "Bearer test-cron-secret-release-check",
          },
        },
      );
      const getProxyRes = await proxy(getRefreshReq);
      assert.notEqual(
        getProxyRes.status,
        401,
        "proxy.ts must not return 401 for GET /api/internal/gosno/route-feed-refresh with CRON_SECRET",
      );
      assert.notEqual(
        getProxyRes.status,
        403,
        "proxy.ts must allow CRON_SECRET for GET /api/internal/gosno/route-feed-refresh",
      );

      const postRefreshReq = new NextRequest(
        "https://www.destinationcommandcenter.com/api/internal/gosno/route-feed-refresh",
        {
          method: "POST",
          headers: {
            authorization: "Bearer test-cron-secret-release-check",
          },
        },
      );
      const postProxyRes = await proxy(postRefreshReq);
      assert.equal(
        postProxyRes.status,
        403,
        "proxy.ts must deny POST with CRON_SECRET",
      );
    } finally {
      if (prevCronSecret === undefined) {
        delete process.env.CRON_SECRET;
      } else {
        process.env.CRON_SECRET = prevCronSecret;
      }
    }

    const baseSnap = resetGoSnoRouteFeedSnapshotToBaseline();
    const freshSnap = createGoSnoRouteFeedSnapshot(baseSnap.feed, {
      fetchedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      ttlMs: DEFAULT_GOSNO_SNAPSHOT_TTL_MS,
    });
    saveGoSnoRouteFeedSnapshot(freshSnap);

    const breckDecisionPage = DECISION_ENGINE_PAGES.find(
      (p) => p.canonicalPath === "/routes/denver-breckenridge",
    )!;
    const breckNode = getTravelReferenceNodeById("denver-breckenridge");
    const breckShuttleMode = breckNode.gettingThereAndAround.modes.find(
      (m) => m.id === "db-mountain-shuttles",
    )!;
    const breckHandoff = breckNode.specialistHandoffs.options.find(
      (o) => o.id === "handoff-gosno-breck",
    )!;

    assert.match(breckDecisionPage.howToGetThere[0] || "", /\$399 one-way/);
    assert.match(breckDecisionPage.howToGetThere[0] || "", /\$599/);
    assert.match(breckShuttleMode.routeOrCoverage, /\$399 one-way/);
    assert.match(breckShuttleMode.routeOrCoverage, /\$599 one-way/);
    assert.match(breckShuttleMode.pricingModel || "", /\$399 one-way/);
    assert.match(breckShuttleMode.pricingModel || "", /\$599 one-way/);
    assert.match(breckShuttleMode.practicalConstraints[0] || "", /\$399 one-way/);
    assert.match(breckShuttleMode.practicalConstraints[0] || "", /\$599 one-way/);
    assert.match(breckHandoff.description, /\$399 one-way/);
    assert.match(breckHandoff.description, /\$599 one-way/);

    const breckEval = compileApplicableDecisionContext({
      corridorId: "corridor:denver-breckenridge-i70",
      routeId: "DEN-BRECKENRIDGE",
      origin: "DEN",
      destination: "Breckenridge",
      passengerCount: 6,
      standardBagCount: 6,
      skiOrOversizeBagCount: 4,
    });
    const breckEvalSuv = breckEval.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:awd-full-size-suv",
    )!;
    const breckEvalVan = breckEval.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:private-transit-van-10",
    )!;
    assert.equal(breckEvalSuv.pricingResolution.priceDisplay, "$399");
    assert.equal(breckEvalVan.pricingResolution.priceDisplay, "$599");

    // Mutate DEN-BRECKENRIDGE fares in a test fixture and verify guide, reference node, and evaluator agree
    const modifiedFeed = structuredClone(baseSnap.feed);
    for (const r of modifiedFeed.routes) {
      if (r.route_id === "DEN-BRECKENRIDGE" && r.vehicle_class === "suv") {
        r.pricing.amount_usd = 419;
        r.pricing.amount_cents = 41900;
      }
      if (r.route_id === "DEN-BRECKENRIDGE" && r.vehicle_class === "van") {
        r.pricing.amount_usd = 629;
        r.pricing.amount_cents = 62900;
      }
    }
    saveGoSnoRouteFeedSnapshot(
      createGoSnoRouteFeedSnapshot(modifiedFeed, {
        fetchedAt: new Date().toISOString(),
        ttlMs: DEFAULT_GOSNO_SNAPSHOT_TTL_MS,
      }),
    );

    assert.match(breckDecisionPage.howToGetThere[0] || "", /\$419 one-way/);
    assert.match(breckDecisionPage.howToGetThere[0] || "", /\$629/);
    assert.match(breckShuttleMode.routeOrCoverage, /\$419 one-way/);
    assert.match(breckShuttleMode.routeOrCoverage, /\$629 one-way/);
    assert.match(breckHandoff.description, /\$419 one-way/);
    assert.match(breckHandoff.description, /\$629 one-way/);

    const updatedBreckEval = compileApplicableDecisionContext({
      corridorId: "corridor:denver-breckenridge-i70",
      routeId: "DEN-BRECKENRIDGE",
      origin: "DEN",
      destination: "Breckenridge",
      passengerCount: 6,
      standardBagCount: 6,
      skiOrOversizeBagCount: 4,
    });
    const updatedBreckSuv = updatedBreckEval.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:awd-full-size-suv",
    )!;
    const updatedBreckVan = updatedBreckEval.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:private-transit-van-10",
    )!;
    assert.equal(updatedBreckSuv.pricingResolution.priceDisplay, "$419");
    assert.equal(updatedBreckVan.pricingResolution.priceDisplay, "$629");

    // Expire snapshot and verify both guide/reference node and evaluator show "Check current price with GoSno"
    const nowMs = Date.now();
    saveGoSnoRouteFeedSnapshot(
      createGoSnoRouteFeedSnapshot(baseSnap.feed, {
        fetchedAt: new Date(nowMs - 48 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(nowMs - 24 * 60 * 60 * 1000).toISOString(),
      }),
    );
    assert.match(
      breckDecisionPage.howToGetThere[0] || "",
      /Check current price with GoSno/,
    );
    assert.match(
      breckShuttleMode.routeOrCoverage,
      /Check current price with GoSno/,
    );
    assert.match(breckHandoff.description, /Check current price with GoSno/);
  });
});

test("10. Production guard enforces canonical GoSno route feed URL and configured 24h expiry while keeping sourceUrl and ttlMs overrides preview-only", async () => {
  await withIsolatedGoSnoTestState(async () => {
    const baseline = getBaselineGoSnoRouteFeedSnapshot();
    const prevVercelEnv = process.env.VERCEL_ENV;
    const prevDccScope = process.env.DCC_ENVIRONMENT_SCOPE;
    const prevInternalSecret = process.env.INTERNAL_API_SECRET;
    const originalFetch = globalThis.fetch;

    try {
      // 10a. Preview/nonprod honors custom feedUrl/sourceUrl and ttlMs overrides
      process.env.VERCEL_ENV = "preview";
      delete process.env.DCC_ENVIRONMENT_SCOPE;
      process.env.INTERNAL_API_SECRET = "test-internal-secret-prod-guard";

      const nowPreview = new Date("2026-11-04T15:00:00.000Z");
      const previewRefresh = await refreshGoSnoRouteFeedSnapshot({
        feedUrl: "https://preview-fixture.gosno.test/api/public/route-feed",
        ttlMs: 3600_000, // 1 hour custom TTL in preview
        now: nowPreview,
        fetchImpl: async (input) => {
          assert.equal(
            String(input),
            "https://preview-fixture.gosno.test/api/public/route-feed",
          );
          return new Response(JSON.stringify(baseline.feed), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
      });
      assert.equal(previewRefresh.ok, true);
      assert.equal(
        previewRefresh.snapshot.sourceUrl,
        "https://preview-fixture.gosno.test/api/public/route-feed",
      );
      assert.equal(previewRefresh.snapshot.ttlMs, 3600_000);
      assert.equal(
        previewRefresh.snapshot.expiresAt,
        "2026-11-04T16:00:00.000Z",
      );

      // 10b. Production ignores feedUrl/sourceUrl and ttlMs overrides in refreshGoSnoRouteFeedSnapshot
      process.env.VERCEL_ENV = "production";
      const nowProd = new Date("2026-11-04T15:10:00.000Z");
      let requestedProdUrl = "";
      const prodRefresh = await refreshGoSnoRouteFeedSnapshot({
        feedUrl: "https://rogue-override.example.com/feed.json",
        ttlMs: 60_000, // 1 minute custom TTL attempted
        now: nowProd,
        fetchImpl: async (input) => {
          requestedProdUrl = String(input);
          return new Response(JSON.stringify(baseline.feed), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
      });
      assert.equal(prodRefresh.ok, true);
      assert.equal(requestedProdUrl, GOSNO_ROUTE_FEED_URL);
      assert.equal(prodRefresh.snapshot.sourceUrl, GOSNO_ROUTE_FEED_URL);
      assert.equal(prodRefresh.snapshot.ttlMs, DEFAULT_GOSNO_SNAPSHOT_TTL_MS);
      assert.equal(
        prodRefresh.snapshot.expiresAt,
        "2026-11-05T15:10:00.000Z",
      );

      // 10c. Production POST /api/internal/gosno/route-feed-refresh ignores body.sourceUrl, body.ttlMs, and query-param test overrides
      let routeRequestedUrl = "";
      globalThis.fetch = async (input) => {
        routeRequestedUrl = String(input);
        return new Response(JSON.stringify(baseline.feed), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const prodRouteRes = await scheduledRefreshPost(
        new Request(
          "https://www.destinationcommandcenter.com/api/internal/gosno/route-feed-refresh?testVailVanUsd=999&testExpired=1",
          {
            method: "POST",
            headers: {
              authorization: "Bearer test-internal-secret-prod-guard",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              sourceUrl: "https://rogue-override.example.com/feed.json",
              ttlMs: 5000,
            }),
          },
        ),
      );
      assert.equal(prodRouteRes.status, 200);
      const prodRouteBody = (await prodRouteRes.json()) as {
        ok: boolean;
        gosnoRouteFeedSnapshot: {
          sourceUrl: string;
          fetchedAt: string;
          expiresAt: string;
          isExpired: boolean;
          freshnessStatus: string;
        };
      };
      assert.equal(prodRouteBody.ok, true);
      assert.equal(routeRequestedUrl, GOSNO_ROUTE_FEED_URL);
      assert.equal(
        prodRouteBody.gosnoRouteFeedSnapshot.sourceUrl,
        GOSNO_ROUTE_FEED_URL,
      );
      assert.equal(prodRouteBody.gosnoRouteFeedSnapshot.isExpired, false);
      assert.equal(
        prodRouteBody.gosnoRouteFeedSnapshot.freshnessStatus,
        "fresh",
      );
      const prodFetchedMs = Date.parse(
        prodRouteBody.gosnoRouteFeedSnapshot.fetchedAt,
      );
      const prodExpiresMs = Date.parse(
        prodRouteBody.gosnoRouteFeedSnapshot.expiresAt,
      );
      assert.equal(
        prodExpiresMs - prodFetchedMs,
        DEFAULT_GOSNO_SNAPSHOT_TTL_MS,
      );
      const vailVanAfterProdRefresh = resolveGoSnoOneWayFare({
        routeId: "DEN-VAIL",
        vehicleClass: "van",
      });
      assert.equal(
        vailVanAfterProdRefresh?.amountUsd,
        599,
        "Production refresh must ignore query-param fare overrides and use canonical GoSno feed fare ($599)",
      );
    } finally {
      globalThis.fetch = originalFetch;
      if (prevVercelEnv === undefined) {
        delete process.env.VERCEL_ENV;
      } else {
        process.env.VERCEL_ENV = prevVercelEnv;
      }
      if (prevDccScope === undefined) {
        delete process.env.DCC_ENVIRONMENT_SCOPE;
      } else {
        process.env.DCC_ENVIRONMENT_SCOPE = prevDccScope;
      }
      if (prevInternalSecret === undefined) {
        delete process.env.INTERNAL_API_SECRET;
      } else {
        process.env.INTERNAL_API_SECRET = prevInternalSecret;
      }
    }
  });
});




