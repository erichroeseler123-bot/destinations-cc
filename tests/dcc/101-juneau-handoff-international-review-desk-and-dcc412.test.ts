import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { gzipSync } from "node:zlib";
import {
  evaluateDcc412ItineraryRecheck,
  evaluateSyntheticDelhiAgraDcc412Test,
  evaluateUnifiedJuneauTripRecheck,
  recheckSavedJuneauTripContextBeforeCheckout,
  resolveLocalTimeInIanaZoneToUtc,
} from "@/lib/dcc/sharedTripRecheck";
import { evaluateLowBandwidthJuneauReplan } from "@/lib/dcc/lowBandwidthJuneauReplan";
import JuneauPortDayPlanner from "@/app/components/dcc/JuneauPortDayPlanner";
import { GET as getJuneauReplanRoute } from "@/app/juneau/replan/route";
import { GET as getJuneauFlightDeckHandoff } from "@/app/go/dcc-to-juneau-flight-deck/route";
import { POST as postV03Evaluate } from "@/app/api/v1/v03/evaluate/route";
import { V03OperatorDirectCheckoutEngine } from "@/lib/dcc/machine/v03/operatorDirectCheckout";
import {
  verifyV03DecisionReceiptJws,
  type V03SignedDecisionReceipt,
} from "@/lib/dcc/machine/v03/rfc8785AndJws";
import {
  DELHI_AGRA_QUALIFIED_OPTIONS,
  getReviewDeskItemsForInternationalCorridor,
  HONG_KONG_MACAO_QUALIFIED_OPTIONS,
  HONG_KONG_MACAO_SAMPLE_TELEMETRY,
  ICELAND_KEF_VIK_OPERATOR_PROFILES,
  ICELAND_KEF_VIK_SAMPLE_TELEMETRY,
  ICELAND_OPERATOR_OUTREACH_DRAFT,
  verifyDatedSourceOrOperatorConfirmation,
} from "@/lib/dcc/corridors/internationalCorridorQualifications";
import { ingestApprovedFactsFromReviewDesk } from "@/lib/dcc/research/approvedFactsFeed";
import KeflavikToVikRoutePage from "@/app/routes/keflavik-to-vik/page";
import DelhiToAgraRoutePage from "@/app/routes/delhi-to-agra/page";
import HongKongToMacaoRoutePage from "@/app/routes/hong-kong-to-macao/page";

test("101.1 — Juneau Replay (2027-07-15, 08:00 arrival at AJ Dock): Auke Bay Whale Watch fails at 13:30 all-aboard (-35m) and replaces Flight Deck link with 'View options that fit' across both planners and API", async () => {
  const unified1330 = await evaluateUnifiedJuneauTripRecheck({
    ship: "Royal Princess",
    date: "2027-07-15",
    arrivalTime: "08:00",
    claaScheduledArrivalTime: "08:00",
    allAboardTime: "13:30",
    berthCode: "AJ",
    partySize: 2,
    simulateNoaaTimeout: true,
  });

  const whaleWatch1330 = unified1330.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  );
  assert.ok(whaleWatch1330);
  assert.equal(whaleWatch1330.legacyReplanId, "whale-watching-auke-bay");
  assert.equal(whaleWatch1330.timeFit.fitsTimeWindow, false);
  assert.equal(whaleWatch1330.fitsOverallForSelection, false);
  assert.equal(whaleWatch1330.timeFit.remainingMinutesAfterBuffer, -35);
  assert.equal(whaleWatch1330.flightDeckHandoffAllowed, false);
  assert.equal(whaleWatch1330.allowedNextStepType, "view_options_that_fit");
  assert.equal(whaleWatch1330.allowedNextStepLabel, "View options that fit");
  assert.ok(whaleWatch1330.allowedNextStepHref.includes("/juneau/replan?"));
  assert.ok(whaleWatch1330.allowedNextStepHref.includes("date=2027-07-15"));
  assert.ok(whaleWatch1330.allowedNextStepHref.includes("arrival=08%3A00"));
  assert.ok(whaleWatch1330.allowedNextStepHref.includes("all_aboard=13%3A30"));
  assert.ok(whaleWatch1330.allowedNextStepHref.includes("berth=AJ"));
  assert.ok(whaleWatch1330.allowedNextStepHref.includes("party_size=2"));
  assert.ok(
    whaleWatch1330.allowedNextStepHref.includes(
      "failed_option_id=whale-watching-auke-bay",
    ),
  );
  assert.ok(
    whaleWatch1330.allowedNextStepHref.includes(
      "failed_engine_option_id=jun-opt-auke-bay-whale-direct",
    ),
  );
  assert.ok(
    whaleWatch1330.allowedNextStepHref.includes(
      "filter=fits_only#fitting-options",
    ),
  );
  assert.equal(whaleWatch1330.handoffHref, whaleWatch1330.allowedNextStepHref);

  // Low-bandwidth planner (/juneau/replan)
  const replanRes = await getJuneauReplanRoute(
    new Request(
      "https://destinationcommandcenter.com/juneau/replan?date=2027-07-15&ship=Royal+Princess&berth=AJ&arrival=08:00&all_aboard=13:30&party_size=2&simulate_noaa_timeout=1",
    ),
  );
  assert.equal(replanRes.status, 200);
  const replanHtml = await replanRes.text();
  assert.ok(replanHtml.includes("View options that fit"));
  assert.ok(replanHtml.includes("failed_option_id=whale-watching-auke-bay"));
  assert.ok(
    replanHtml.includes("failed_engine_option_id=jun-opt-auke-bay-whale-direct"),
  );

  // Full planner (JuneauPortDayPlanner)
  const fullPlannerHtml = renderToStaticMarkup(
    React.createElement(JuneauPortDayPlanner, {
      initialSearchParams: {
        date: "2027-07-15",
        arrival: "08:00",
        allAboard: "13:30",
        dock: "aj_dock",
      },
    }),
  );
  assert.ok(fullPlannerHtml.includes("View options that fit"));
  assert.ok(
    fullPlannerHtml.includes("failed_option_id=whale-watching-auke-bay"),
  );

  // Agent API (POST /api/v1/v03/evaluate)
  const apiRes = await postV03Evaluate(
    new Request("https://destinationcommandcenter.com/api/v1/v03/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        engineId: "juneau-port-day",
        inputs: {
          date: "2027-07-15",
          ship: "Royal Princess",
          berth: "AJ",
          arrival: "08:00",
          all_aboard: "13:30",
          party_size: 2,
          simulateNoaaTimeout: true,
        },
      }),
    }),
  );
  assert.equal(apiRes.status, 200);
  const apiJson = (await apiRes.json()) as {
    sharedTripRecheck: typeof unified1330;
  };
  const apiWhaleWatch = apiJson.sharedTripRecheck.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  );
  assert.ok(apiWhaleWatch);
  assert.equal(apiWhaleWatch.timeFit.fitsTimeWindow, false);
  assert.equal(apiWhaleWatch.timeFit.remainingMinutesAfterBuffer, -35);
  assert.equal(apiWhaleWatch.allowedNextStepLabel, "View options that fit");
  assert.equal(
    apiWhaleWatch.allowedNextStepHref,
    whaleWatch1330.allowedNextStepHref,
  );
});

test("101.2 — Juneau Replay (2027-07-15, 08:00 arrival at AJ Dock): Auke Bay Whale Watch fits at 15:30 all-aboard (+85m) and allows Continue to Juneau Flight Deck", async () => {
  const unified1530 = await evaluateUnifiedJuneauTripRecheck({
    ship: "Royal Princess",
    date: "2027-07-15",
    arrivalTime: "08:00",
    claaScheduledArrivalTime: "08:00",
    allAboardTime: "15:30",
    berthCode: "AJ",
    partySize: 2,
    simulateNoaaTimeout: true,
  });

  const whaleWatch1530 = unified1530.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  );
  assert.ok(whaleWatch1530);
  assert.equal(whaleWatch1530.timeFit.fitsTimeWindow, true);
  assert.equal(whaleWatch1530.fitsOverallForSelection, true);
  assert.equal(whaleWatch1530.timeFit.remainingMinutesAfterBuffer, 85);
  assert.equal(whaleWatch1530.flightDeckHandoffAllowed, true);
  assert.equal(
    whaleWatch1530.allowedNextStepType,
    "continue_to_flight_deck",
  );
  assert.equal(
    whaleWatch1530.allowedNextStepLabel,
    "Continue to Juneau Flight Deck →",
  );
  assert.ok(
    whaleWatch1530.allowedNextStepHref.includes(
      "/go/dcc-to-juneau-flight-deck?",
    ),
  );

  const lowBw1530 = evaluateLowBandwidthJuneauReplan({
    ship: "Royal Princess",
    date: "2027-07-15",
    arrivalTime: "08:00",
    claaScheduledArrivalTime: "08:00",
    allAboardTime: "15:30",
    berth: "AJ",
    partySize: 2,
    simulateNoaaTimeout: true,
  });
  const lowBwWhale = lowBw1530.options.find(
    (o) => o.engineOptionId === "jun-opt-auke-bay-whale-direct",
  );
  assert.ok(lowBwWhale);
  assert.equal(lowBwWhale.fitsNow, true);
  assert.equal(lowBwWhale.remainingMinutesAfterBuffer, 85);
  assert.equal(
    lowBwWhale.allowedNextStepLabel,
    "Continue to Juneau Flight Deck →",
  );
  assert.equal(lowBwWhale.allowedNextStepHref, whaleWatch1530.allowedNextStepHref);
});

test("101.3 — Saved Trip Context Recheck Before Checkout (/go/dcc-to-juneau-flight-deck and operatorDirectCheckout)", async () => {
  // 1. Handoff route blocks checkout when saved trip context has 13:30 all-aboard at AJ Dock for whale watch
  const blockedHandoffRes = await getJuneauFlightDeckHandoff(
    new Request(
      "https://destinationcommandcenter.com/go/dcc-to-juneau-flight-deck?date=2027-07-15&ship=Royal+Princess&berth=AJ&arrival=08:00&all_aboard=13:30&party_size=2&option_id=whale-watching-auke-bay&engine_option_id=jun-opt-auke-bay-whale-direct",
    ),
  );
  assert.equal(blockedHandoffRes.status, 302);
  assert.equal(
    blockedHandoffRes.headers.get("x-dcc-saved-context-recheck"),
    "blocked-view-options-that-fit",
  );
  const blockedLocation = blockedHandoffRes.headers.get("location") ?? "";
  assert.ok(blockedLocation.includes("/juneau/replan?"));
  assert.ok(
    blockedLocation.includes("failed_option_id=whale-watching-auke-bay"),
  );
  assert.ok(
    blockedLocation.includes(
      "failed_engine_option_id=jun-opt-auke-bay-whale-direct",
    ),
  );
  assert.ok(blockedLocation.includes("filter=fits_only#fitting-options"));

  // 2. Handoff route allows checkout when saved trip context has 15:30 all-aboard at AJ Dock for whale watch
  const allowedHandoffRes = await getJuneauFlightDeckHandoff(
    new Request(
      "https://destinationcommandcenter.com/go/dcc-to-juneau-flight-deck?date=2027-07-15&ship=Royal+Princess&berth=AJ&arrival=08:00&all_aboard=15:30&party_size=2&option_id=whale-watching-auke-bay&engine_option_id=jun-opt-auke-bay-whale-direct",
    ),
  );
  assert.equal(allowedHandoffRes.status, 302);
  assert.equal(
    allowedHandoffRes.headers.get("x-dcc-saved-context-recheck"),
    "passed",
  );
  assert.ok(
    (allowedHandoffRes.headers.get("location") ?? "").includes(
      "https://juneauflightdeck.com/",
    ),
  );

  // 3. Direct checkout engine rechecks saved trip timing before locking seats
  const checkoutEngine = new V03OperatorDirectCheckoutEngine();
  checkoutEngine.registerDeparture({
    departureId: "dep_juneau_whale_0930",
    operatorId: "alaska-galore-whale-331813P1",
    serviceDate: "2027-07-15",
    departureLocal: "09:30",
    durationMinutes: 210,
    baseFarePerSeatUsd: 189,
    taxesAndFeesPerSeatUsd: 15,
    seatLockSource: "PROVIDER_CHECKOUT",
    providerConfirmedSeats: true,
    totalConfirmedSeats: 12,
    remainingSeats: 8,
  });

  const directCheckoutBlocked = checkoutEngine.submitDirectCheckout({
    idempotencyKey: "idem_recheck_test_1330",
    operatorId: "alaska-galore-whale-331813P1",
    departureId: "dep_juneau_whale_0930",
    tripContext: {
      contextId: "dcc_ctx_juneau_20270715_aj_1330",
      portSlug: "juneau",
      serviceDate: "2027-07-15",
      partySize: 2,
      shipName: "Royal Princess",
      berthCode: "AJ",
      claaArrivalLocal: "08:00",
      confirmedAllAboardLocal: "13:30",
    },
  });
  assert.equal(directCheckoutBlocked.ok, false);
  assert.equal(directCheckoutBlocked.code, "SAVED_CONTEXT_TIMING_FAILED");
  assert.equal(
    directCheckoutBlocked.allowedNextStepLabel,
    "View options that fit",
  );
  assert.ok(
    (directCheckoutBlocked.allowedNextStepHref ?? "").includes(
      "/juneau/replan?",
    ),
  );

  // 4. Direct helper check
  const savedCheck = recheckSavedJuneauTripContextBeforeCheckout({
    date: "2027-07-15",
    ship: "Royal Princess",
    berthCode: "AJ",
    arrivalTime: "08:00",
    allAboardTime: "13:30",
    partySize: 2,
    optionId: "jun-opt-auke-bay-whale-direct",
  });
  assert.equal(savedCheck.checkoutAllowed, false);
  assert.equal(savedCheck.allowedNextStepLabel, "View options that fit");
});

test("101.4 — Juneau Cold First-Load < 50 KB Target (HTML + required CSS + JS)", async () => {
  const res = await getJuneauReplanRoute(
    new Request(
      "https://destinationcommandcenter.com/juneau/replan?date=2027-07-15&ship=Royal+Princess&berth=AJ&arrival=08:00&all_aboard=13:30&party_size=2&simulate_noaa_timeout=1",
    ),
  );
  assert.equal(res.status, 200);
  const html = await res.text();

  // Verify zero external stylesheet or script chunk requests are required for cold first load
  assert.equal(/<script[^>]+src=/i.test(html), false);
  assert.equal(/<link[^>]+rel=["']stylesheet["']/i.test(html), false);
  assert.ok(html.includes("<style>"));
  assert.ok(html.includes("<script"));

  const uncompressedBytes = Buffer.byteLength(html, "utf8");
  const gzippedBytes = gzipSync(Buffer.from(html, "utf8")).byteLength;

  // Both raw and gzipped cold first load (including all CSS & JS) must be < 50 KB (51,200 bytes)
  assert.ok(
    uncompressedBytes < 51_200,
    `Expected uncompressed cold load (${uncompressedBytes} B) < 51,200 B`,
  );
  assert.ok(
    gzippedBytes < 15_000,
    `Expected gzipped cold load (${gzippedBytes} B) < 15,000 B (< 50 KB budget)`,
  );
});

test("101.5 — International Pages Reconciliation, Dated Source Gate, Review Desk & Private 10% Proposal", async () => {
  // 1. Drive Reykjavík FAQ pickup reconciliation
  const driveRvk = ICELAND_KEF_VIK_OPERATOR_PROFILES.find(
    (op) => op.operatorId === "drive-reykjavik",
  );
  assert.ok(driveRvk);
  assert.equal(
    driveRvk.faqPickupPolicyReconciliation.faqSourceUrl,
    "https://drivereykjavik.is/faq/",
  );
  assert.equal(
    driveRvk.faqPickupPolicyReconciliation.faqVerifiedOnDate,
    "2026-11-07",
  );
  assert.ok(
    driveRvk.faqPickupPolicyReconciliation.publishedFaqRuleSummary.includes(
      "30 minutes prior to scheduled departure",
    ),
  );
  assert.equal(
    driveRvk.faqPickupPolicyReconciliation.privateKefArrivalPolicyStatus,
    "pending_operator_confirmation",
  );

  // 2. Dated source or operator confirmation gate
  const unverifiedCheck = verifyDatedSourceOrOperatorConfirmation({
    fieldCategory: "published_price",
    proposedValue: "from 134,000 ISK",
    pendingFallbackLabel: "[Pending Review Desk confirmation]",
    verifiedOnDate: null,
    sourceUrl: null,
    operatorConfirmedBy: null,
    reviewDeskFactId: "test-claim",
  });
  assert.equal(unverifiedCheck.verified, false);
  assert.equal(
    unverifiedCheck.publicDisplayValue,
    "[Pending Review Desk confirmation]",
  );

  const verifiedCheck = verifyDatedSourceOrOperatorConfirmation({
    fieldCategory: "booking_or_whatsapp_link",
    proposedValue: "https://www.straeto.is/en/route-planner",
    pendingFallbackLabel: "[Pending]",
    verifiedOnDate: "2026-11-07",
    sourceUrl: "https://www.straeto.is/en/route-planner",
    operatorConfirmedBy: null,
    reviewDeskFactId: "test-verified",
  });
  assert.equal(verifiedCheck.verified, true);
  assert.equal(
    verifiedCheck.publicDisplayValue,
    "https://www.straeto.is/en/route-planner",
  );

  // Unverified WhatsApp placeholder links on Delhi-Agra and HK-Macao are withheld
  const delhiCar = DELHI_AGRA_QUALIFIED_OPTIONS.find(
    (o) => o.optionId === "agra-cantt-station-to-taj-private-car",
  );
  assert.ok(delhiCar);
  assert.equal(delhiCar.bookingLinkVerificationGate.verified, false);
  assert.equal(delhiCar.bookingOrWhatsappHref, null);

  const hkCrossBorder = HONG_KONG_MACAO_QUALIFIED_OPTIONS.find(
    (o) => o.optionId === "hk-macao-cross-boundary-private-mpv",
  );
  assert.ok(hkCrossBorder);
  assert.equal(hkCrossBorder.bookingLinkVerificationGate.verified, false);
  assert.equal(hkCrossBorder.bookingOrWhatsappHref, null);

  // Verify pending items are placed in the existing Review Desk
  assert.ok(
    getReviewDeskItemsForInternationalCorridor("iceland-kef-vik").length >= 2,
  );
  assert.ok(
    getReviewDeskItemsForInternationalCorridor("india-delhi-agra").length >= 2,
  );
  assert.ok(
    getReviewDeskItemsForInternationalCorridor("china-hk-macao").length >= 1,
  );

  const icelandDesk = await ingestApprovedFactsFromReviewDesk({
    portSlug: "keflavik-to-vik",
    skipLiveFetch: true,
  });
  assert.ok(icelandDesk.all_evaluated_facts.length >= 2);
  assert.equal(icelandDesk.verified_count, 0);

  const delhiDesk = await ingestApprovedFactsFromReviewDesk({
    portSlug: "delhi-to-agra",
    skipLiveFetch: true,
  });
  assert.ok(delhiDesk.all_evaluated_facts.length >= 2);
  assert.equal(delhiDesk.verified_count, 0);

  const hkDesk = await ingestApprovedFactsFromReviewDesk({
    portSlug: "hong-kong-to-macao",
    skipLiveFetch: true,
  });
  assert.ok(hkDesk.all_evaluated_facts.length >= 1);
  assert.equal(hkDesk.verified_count, 0);

  // 3. Iceland road and HK checkpoint labeled as Samples, 10% proposal kept strictly in private outreach draft
  assert.equal(
    ICELAND_KEF_VIK_SAMPLE_TELEMETRY.normal_winter_patches.isSample,
    true,
  );
  assert.ok(
    ICELAND_KEF_VIK_SAMPLE_TELEMETRY.normal_winter_patches.sampleLabel.includes(
      "Sample",
    ),
  );
  assert.equal(
    HONG_KONG_MACAO_SAMPLE_TELEMETRY.normal_weekday[0]?.isSample,
    true,
  );
  assert.ok(
    HONG_KONG_MACAO_SAMPLE_TELEMETRY.normal_weekday[0]?.sampleLabel.includes(
      "Sample",
    ),
  );

  assert.equal(
    ICELAND_OPERATOR_OUTREACH_DRAFT.visibility,
    "private_outreach_only",
  );
  assert.equal(ICELAND_OPERATOR_OUTREACH_DRAFT.proposedCommissionRatePercent, 10);
  assert.ok(
    ICELAND_OPERATOR_OUTREACH_DRAFT.bodyText.includes(
      "10% referral commission on confirmed referred bookings",
    ),
  );

  const icelandHtml = renderToStaticMarkup(await KeflavikToVikRoutePage());
  assert.ok(icelandHtml.includes("Sample"));
  assert.ok(icelandHtml.includes("Review Desk"));
  assert.equal(icelandHtml.includes("10% referral"), false);
  assert.equal(
    icelandHtml.includes("10% on confirmed referred bookings"),
    false,
  );

  const hkHtml = renderToStaticMarkup(await HongKongToMacaoRoutePage());
  assert.ok(hkHtml.includes("Sample"));
  assert.ok(hkHtml.includes("Review Desk"));
  assert.equal(hkHtml.includes("wa.me/85290000000"), false);
});

test("101.6 — DCC-412 Inside sharedTripRecheck: Synthetic Delhi–Agra Test (9:50 a.m. + 42m delay + 15m exit = 10:47 a.m. local / 05:17Z, missing 10:30 and catching 11:00) & Multi-Timezone API/Mobile Parity", async () => {
  const res = evaluateSyntheticDelhiAgraDcc412Test({
    serviceDate: "2026-11-18",
    scheduledArrivalLocal: "09:50",
    delayMinutes: 42,
    transferBufferMinutes: 15,
  });

  assert.equal(res.specId, "DCC-412");
  assert.equal(res.transferBufferAddedOnce, true);
  assert.equal(res.effectiveArrivalLocal, "10:32");
  assert.equal(res.effectiveArrivalUtc, "2026-11-18T05:02:00Z");
  assert.equal(res.travelerReadyAt.formattedSummary, "10:47 a.m. local (05:17Z)");
  assert.equal(res.travelerReadyAt.utcIso, "2026-11-18T05:17:00Z");
  assert.equal(res.scheduleBaselineStatus, "Verified");

  // Candidate 1: 10:30 connection is missed (-17m)
  const conn1030 = res.candidates.find(
    (c) => c.candidateId === "agc-conn-1030-missed",
  );
  assert.ok(conn1030);
  assert.equal(conn1030.travelerReadyAt.utcIso, "2026-11-18T05:17:00Z");
  assert.equal(conn1030.departureUtc, "2026-11-18T05:00:00Z");
  assert.equal(conn1030.slackToDepartureMinutes, -17);
  assert.equal(conn1030.passesDepartureTime, false);
  assert.equal(conn1030.catchable, false);

  // Candidate 2: 11:00 connection is the next departure the traveler can actually catch (+13m)
  const conn1100 = res.candidates.find(
    (c) => c.candidateId === "agc-conn-1100-catchable",
  );
  assert.ok(conn1100);
  assert.equal(conn1100.travelerReadyAt.utcIso, "2026-11-18T05:17:00Z");
  assert.equal(conn1100.departureUtc, "2026-11-18T05:30:00Z");
  assert.equal(conn1100.slackToDepartureMinutes, 13);
  assert.equal(conn1100.passesDepartureTime, true);
  assert.equal(conn1100.passesTicketCutoff, true);
  assert.equal(conn1100.passesDestinationCutoff, true);
  assert.equal(conn1100.catchable, true);

  assert.ok(
    res.missedConnections.some((c) => c.candidateId === "agc-conn-1030-missed"),
  );
  assert.equal(res.nextCatchableDeparture?.candidateId, "agc-conn-1100-catchable");
  assert.ok(res.legProvenance.length >= 3);
  for (const leg of res.legProvenance) {
    assert.ok(leg.source.length > 0);
    assert.ok(leg.timestamp.endsWith("Z"));
    assert.ok(leg.expiry.endsWith("Z"));
  }

  // Verify absoluteEta override and 'Needs verification' when a critical update is missing
  const withAbsEta = evaluateDcc412ItineraryRecheck({
    corridorId: "delhi-to-agra",
    serviceDate: "2026-11-18",
    ianaTimeZone: "Asia/Kolkata",
    scheduledArrivalLocal: "09:50",
    delayMinutes: 42,
    absoluteEta: "10:15",
    transferBufferMinutes: 15,
    criticalUpdateMissing: true,
    candidateDepartures: [
      {
        candidateId: "conn-1030",
        title: "10:30 Station Transfer",
        operatorName: "Agra Feeder",
        departureLocal: "10:30",
        ticketCutoffLocal: "10:30",
        destinationCutoffLocal: "16:30",
        arrivalAtDestinationLocal: "10:55",
        source: "Schedule Baseline",
        sourceTimestamp: "2026-11-18T04:00:00Z",
        sourceExpiry: "2026-11-18T06:00:00Z",
      },
    ],
  });
  assert.equal(withAbsEta.etaResolutionMode, "absolute_eta");
  assert.equal(withAbsEta.effectiveArrivalUtc, "2026-11-18T04:45:00Z");
  assert.equal(withAbsEta.travelerReadyAt.utcIso, "2026-11-18T05:00:00Z");
  assert.equal(withAbsEta.scheduleBaselineStatus, "Needs verification");
  assert.equal(withAbsEta.candidates[0]?.catchable, true);
  assert.equal(withAbsEta.candidates[0]?.slackToDepartureMinutes, 0);

  // Verify identical UTC ISO-8601 readiness times and signed JWS receipts across device time zones
  const originalTz = process.env.TZ;
  const zonesToTest = ["America/Los_Angeles", "UTC", "Asia/Kolkata"];

  try {
    for (const tz of zonesToTest) {
      process.env.TZ = tz;
      const resolved = resolveLocalTimeInIanaZoneToUtc(
        "2026-11-18",
        "10:47",
        "Asia/Kolkata",
      );
      assert.equal(resolved.utcIso, "2026-11-18T05:17:00Z");
      assert.equal(
        `${resolved.localTime12} local (${resolved.utcShort})`,
        "10:47 a.m. local (05:17Z)",
      );

      const apiRes = await postV03Evaluate(
        new Request("https://destinationcommandcenter.com/api/v1/v03/evaluate", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "user-agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          },
          body: JSON.stringify({
            engineId: "dcc-412",
            inputs: {
              serviceDate: "2026-11-18",
              ianaTimeZone: "Asia/Kolkata",
              scheduledArrivalLocal: "09:50",
              delayMinutes: 42,
              transferBufferMinutes: 15,
            },
          }),
        }),
      );
      assert.equal(apiRes.status, 200);
      const apiBody = (await apiRes.json()) as {
        ok: boolean;
        sharedTripRecheck: ReturnType<
          typeof evaluateSyntheticDelhiAgraDcc412Test
        >;
        receipt: V03SignedDecisionReceipt;
      };
      assert.equal(apiBody.ok, true);
      assert.equal(
        apiBody.sharedTripRecheck.travelerReadyAt.utcIso,
        "2026-11-18T05:17:00Z",
      );
      assert.equal(
        apiBody.sharedTripRecheck.travelerReadyAt.formattedSummary,
        "10:47 a.m. local (05:17Z)",
      );
      assert.ok(
        apiBody.sharedTripRecheck.missedConnections.some(
          (c) => c.candidateId === "agc-conn-1030-missed",
        ),
      );
      assert.equal(
        apiBody.sharedTripRecheck.nextCatchableDeparture?.candidateId,
        "agc-conn-1100-catchable",
      );

      // Verify signed JWS decision receipt includes legProvenance (source, timestamp, expiry)
      assert.ok(apiBody.receipt);
      assert.ok(apiBody.receipt.payload.legProvenance);
      assert.ok(apiBody.receipt.payload.legProvenance.length >= 3);
      const verifyJws = await verifyV03DecisionReceiptJws({
        jwsCompact: apiBody.receipt.jwsCompact,
      });
      assert.equal(verifyJws.valid, true);
    }
  } finally {
    if (originalTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTz;
    }
  }

  // Verify mobile/SSR rendering on /routes/delhi-to-agra
  const delhiMobileHtml = renderToStaticMarkup(
    await DelhiToAgraRoutePage({
      searchParams: Promise.resolve({
        date: "2026-11-18",
        arrival: "09:50",
        delay: "42",
        exit_buffer: "15",
      }),
    }),
  );
  assert.ok(delhiMobileHtml.includes("10:47 a.m. local (05:17Z)"));
  assert.ok(delhiMobileHtml.includes("2026-11-18T05:17:00Z"));
  assert.equal(delhiMobileHtml.includes("wa.me/919810000000"), false);
});
