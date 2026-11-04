import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

process.env.DCC_DURABLE_STORE_PATH = path.join(
  os.tmpdir(),
  `dcc-gosno-route-feed-test-${process.pid}.json`,
);
import {
  GOSNO_PRICE_FALLBACK_MESSAGE,
  GOSNO_ROUTE_FEED_URL,
  buildGoSnoPrivateGroupInquiryOption,
  compileApplicableDecisionContext,
  createGoSnoRouteFeedSnapshot,
  getActiveGoSnoRouteFeedSnapshotState,
  getBaselineGoSnoRouteFeedSnapshot,
  refreshGoSnoRouteFeedSnapshot,
  resetGoSnoRouteFeedSnapshotToBaseline,
  resolveGoSnoOneWayFare,
  resolveGoSnoRoundTripFare,
  saveGoSnoRouteFeedSnapshot,
  validateGoSnoRouteFeedPayload,
  type GoSnoRouteFeedPayload,
} from "@/lib/dcc/applicability";
import { POST as evaluateApplicabilityPost } from "@/app/api/v1/applicability/evaluate/route";

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

test("4. Feed failure, invalid data, expired snapshot, and missing group component fare behavior", async () => {
  resetGoSnoRouteFeedSnapshotToBaseline();
  const baseline = getBaselineGoSnoRouteFeedSnapshot();
  const baseNowMs = Date.parse("2026-11-04T12:00:00.000Z");

  // Seed a known valid snapshot fetched 45 minutes ago
  const validFetchedAt = new Date(baseNowMs - 45 * 60 * 1000).toISOString();
  const seededValidSnapshot = createGoSnoRouteFeedSnapshot(baseline.feed, {
    fetchedAt: validFetchedAt,
    ttlMs: 24 * 60 * 60 * 1000,
  });
  saveGoSnoRouteFeedSnapshot(seededValidSnapshot);

  try {
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

    const outcomeAfterUnavailable = compileApplicableDecisionContext({
      corridorId: "corridor:denver-vail-i70",
      routeId: "DEN-COPPER",
      passengerCount: 4,
      standardBagCount: 4,
      evaluationTimestamp: new Date(baseNowMs).toISOString(),
    });
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

    // 4c. Expired snapshot (evaluated 26 hours after fetch, past 24h TTL): shows "Check current price with GoSno" and withholds numeric fares
    const expiredEvalTimeIso = new Date(
      Date.parse(validFetchedAt) + 26 * 60 * 60 * 1000,
    ).toISOString();
    const expiredOutcome = compileApplicableDecisionContext({
      corridorId: "corridor:denver-vail-i70",
      routeId: "DEN-COPPER",
      passengerCount: 16,
      standardBagCount: 16,
      skiOrOversizeBagCount: 12,
      evaluationTimestamp: expiredEvalTimeIso,
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
    assert.match(
      expiredSuv.pricingResolution.compiledPricingNote,
      /Check current price with GoSno/,
    );
    assert.equal(expiredVan.pricingResolution.fixedRateOneWayUsd, null);
    assert.equal(
      expiredVan.pricingResolution.priceDisplay,
      GOSNO_PRICE_FALLBACK_MESSAGE,
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
  } finally {
    resetGoSnoRouteFeedSnapshotToBaseline();
  }
});

test("5. Automated catalog comparison against all 72 one-way and 36 round-trip offers from live GoSno route feed", async () => {
  resetGoSnoRouteFeedSnapshotToBaseline();

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

  const activeState = getActiveGoSnoRouteFeedSnapshotState();
  assert.equal(
    activeState.snapshot.contentHash,
    createGoSnoRouteFeedSnapshot(liveFeed).contentHash,
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
