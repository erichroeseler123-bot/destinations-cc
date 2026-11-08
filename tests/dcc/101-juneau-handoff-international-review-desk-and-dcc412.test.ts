import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { gzipSync } from "node:zlib";
import {
  DELHI_AGRA_CORRIDOR_PLACES,
  evaluateDcc412ItineraryRecheck,
  evaluateDelhiAgra20261210CorridorFixture,
  evaluateDelhiAgraRealTripRecheck,
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
  evaluateDelhiAgraCorridorRecheck,
  getReviewDeskItemsForInternationalCorridor,
  HONG_KONG_MACAO_QUALIFIED_OPTIONS,
  HONG_KONG_MACAO_SAMPLE_TELEMETRY,
  ICELAND_KEF_VIK_OPERATOR_PROFILES,
  ICELAND_KEF_VIK_SAMPLE_TELEMETRY,
  ICELAND_OPERATOR_OUTREACH_DRAFT,
  OFFICIAL_NTES_LIVE_TRAIN_LOOKUP,
  verifyDatedSourceOrOperatorConfirmation,
} from "@/lib/dcc/corridors/internationalCorridorQualifications";
import { ingestApprovedFactsFromReviewDesk } from "@/lib/dcc/research/approvedFactsFeed";
import { previewWnoRaginCajunAirboatPilot } from "@/lib/dcc/catalog/ingest";
import type { FareHarborAvailability } from "@/lib/dcc/liveSlots/fareharbor";
import { PROVIDERS } from "@/app/new-orleans/data/providers";
import {
  getProductPrimaryBookingHref,
  STOREFRONT_PRODUCTS,
} from "@/app/new-orleans/tours/pageConfig";
import KeflavikToVikRoutePage from "@/app/routes/keflavik-to-vik/page";
import DelhiToAgraRoutePage from "@/app/routes/delhi-to-agra/page";
import HongKongToMacaoRoutePage from "@/app/routes/hong-kong-to-macao/page";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import {
  deleteSupplierProductCheckRecord,
  listPortfolioSupplierConnections,
  readSupplierProductCheckRecords,
  runSupplierBookingLinkCheck,
  runSupplierLiveInventoryCheck,
} from "@/lib/dcc/operatorOnboardingStore";
import PortfolioDesktopPage from "@/app/admin/portfolio/page";
import { POST as postPortfolioSupplierCheck } from "@/app/admin/portfolio/supplier-check/route";

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

test("101.7 — Table-Driven Delhi → Agra 2026-12-10 Corridor Suite (3 Distinct Places, 3 Cutoff/Delay Cases, Absolute 10:32 ETA Parity, Stale/Missing Update Baseline, Cross-Timezone Planner & API Parity, Public Guide NTES + Labeled ETA)", async () => {
  // 1. Model the Delhi rail station, Agra Cantt, and the Taj entry gate as 3 distinct places
  const distinctPlaceIds = new Set([
    DELHI_AGRA_CORRIDOR_PLACES.delhiRailStation.placeId,
    DELHI_AGRA_CORRIDOR_PLACES.agraCantt.placeId,
    DELHI_AGRA_CORRIDOR_PLACES.tajEntryGate.placeId,
  ]);
  assert.equal(distinctPlaceIds.size, 3);
  assert.equal(
    DELHI_AGRA_CORRIDOR_PLACES.delhiRailStation.placeId,
    "dcc:place:in-del-nzm-rail-station",
  );
  assert.equal(
    DELHI_AGRA_CORRIDOR_PLACES.delhiRailStation.role,
    "origin_rail_station",
  );
  assert.equal(
    DELHI_AGRA_CORRIDOR_PLACES.agraCantt.placeId,
    "dcc:place:in-agr-agc-rail-station",
  );
  assert.equal(
    DELHI_AGRA_CORRIDOR_PLACES.agraCantt.role,
    "arrival_and_interchange_station",
  );
  assert.equal(
    DELHI_AGRA_CORRIDOR_PLACES.tajEntryGate.placeId,
    "dcc:place:in-agr-taj-entry-gate",
  );
  assert.equal(
    DELHI_AGRA_CORRIDOR_PLACES.tajEntryGate.role,
    "destination_cutoff_gate",
  );

  // 2. Table-driven 2026-12-10 fixture in Asia/Kolkata:
  //    Scheduled arrival 09:50, 15m exit station, onward departures 10:30 & 11:00, 25m from departure to ready at gate
  const tableCases: Array<{
    caseName: string;
    delayMinutes?: number;
    absoluteEta?: string;
    tajCutoffLocal: string;
    expectedReadyLocal: string;
    expectedReadyUtc: string;
    expectedServiceId: string;
    expectedServiceDepartureLocal: string;
    expectedGateArrivalLocal: string;
    expectedGateArrivalUtc: string;
    expectedCutoffMarginMinutes: number;
    expectedFitsCutoff: boolean;
    expectedVerdictLabel: string;
  }> = [
    {
      caseName: "Train on time, 11:00 a.m. cutoff",
      delayMinutes: 0,
      tajCutoffLocal: "11:00",
      expectedReadyLocal: "10:05",
      expectedReadyUtc: "2026-12-10T04:35:00Z",
      expectedServiceId: "agc-conn-1030-missed",
      expectedServiceDepartureLocal: "10:30",
      expectedGateArrivalLocal: "10:55",
      expectedGateArrivalUtc: "2026-12-10T05:25:00Z",
      expectedCutoffMarginMinutes: 5,
      expectedFitsCutoff: true,
      expectedVerdictLabel: "Fits by 5 minutes.",
    },
    {
      caseName: "Train 42 minutes late, same cutoff (11:00 a.m.)",
      delayMinutes: 42,
      tajCutoffLocal: "11:00",
      expectedReadyLocal: "10:47",
      expectedReadyUtc: "2026-12-10T05:17:00Z",
      expectedServiceId: "agc-conn-1100-catchable",
      expectedServiceDepartureLocal: "11:00",
      expectedGateArrivalLocal: "11:25",
      expectedGateArrivalUtc: "2026-12-10T05:55:00Z",
      expectedCutoffMarginMinutes: -25,
      expectedFitsCutoff: false,
      expectedVerdictLabel: "Misses cutoff by 25 minutes.",
    },
    {
      caseName: "Same delay (42 minutes late), 11:30 a.m. cutoff",
      delayMinutes: 42,
      tajCutoffLocal: "11:30",
      expectedReadyLocal: "10:47",
      expectedReadyUtc: "2026-12-10T05:17:00Z",
      expectedServiceId: "agc-conn-1100-catchable",
      expectedServiceDepartureLocal: "11:00",
      expectedGateArrivalLocal: "11:25",
      expectedGateArrivalUtc: "2026-12-10T05:55:00Z",
      expectedCutoffMarginMinutes: 5,
      expectedFitsCutoff: true,
      expectedVerdictLabel: "Fits by 5 minutes.",
    },
  ];

  const originalTz = process.env.TZ;
  const deviceTimeZones = ["America/Los_Angeles", "UTC", "Asia/Kolkata"];

  try {
    for (const row of tableCases) {
      for (const tz of deviceTimeZones) {
        process.env.TZ = tz;

        // Shared evaluator run
        const evalRes = evaluateDelhiAgra20261210CorridorFixture({
          delayMinutes: row.delayMinutes,
          absoluteEta: row.absoluteEta,
          tajCutoffLocal: row.tajCutoffLocal,
        });

        assert.equal(
          evalRes.serviceDate,
          "2026-12-10",
          `[${row.caseName} | TZ=${tz}] serviceDate`,
        );
        assert.equal(
          evalRes.isExampleScenario,
          true,
          `[${row.caseName} | TZ=${tz}] December 10 scenario must be labeled as an example`,
        );
        assert.ok(
          evalRes.scenarioLabel.includes("Example — December 10, 2026 Scenario"),
          `[${row.caseName} | TZ=${tz}] scenarioLabel must explicitly label December 10 as an example`,
        );
        assert.equal(
          evalRes.ianaTimeZone,
          "Asia/Kolkata",
          `[${row.caseName} | TZ=${tz}] ianaTimeZone`,
        );
        assert.ok(evalRes.places);
        assert.equal(Object.keys(evalRes.places).length, 3);
        assert.equal(
          evalRes.travelerReadyAt.localTime24,
          row.expectedReadyLocal,
          `[${row.caseName} | TZ=${tz}] ready localTime24`,
        );
        assert.equal(
          evalRes.travelerReadyAt.utcIso,
          row.expectedReadyUtc,
          `[${row.caseName} | TZ=${tz}] ready utcIso`,
        );
        assert.ok(evalRes.nextServiceAfterReady);
        assert.equal(
          evalRes.nextServiceAfterReady.candidateId,
          row.expectedServiceId,
          `[${row.caseName} | TZ=${tz}] nextServiceAfterReady.candidateId`,
        );
        assert.equal(
          evalRes.nextServiceAfterReady.departureLocal,
          row.expectedServiceDepartureLocal,
          `[${row.caseName} | TZ=${tz}] nextServiceAfterReady.departureLocal`,
        );
        assert.equal(
          evalRes.gateArrivalLocal,
          row.expectedGateArrivalLocal,
          `[${row.caseName} | TZ=${tz}] gateArrivalLocal`,
        );
        assert.equal(
          evalRes.gateArrivalUtc,
          row.expectedGateArrivalUtc,
          `[${row.caseName} | TZ=${tz}] gateArrivalUtc`,
        );
        assert.equal(
          evalRes.cutoffMarginMinutes,
          row.expectedCutoffMarginMinutes,
          `[${row.caseName} | TZ=${tz}] cutoffMarginMinutes`,
        );
        assert.equal(
          evalRes.fitsDestinationCutoff,
          row.expectedFitsCutoff,
          `[${row.caseName} | TZ=${tz}] fitsDestinationCutoff`,
        );
        assert.equal(
          evalRes.cutoffVerdictLabel,
          row.expectedVerdictLabel,
          `[${row.caseName} | TZ=${tz}] cutoffVerdictLabel`,
        );

        // Agent API POST /api/v1/v03/evaluate parity across device time zones
        const apiRes = await postV03Evaluate(
          new Request("https://destinationcommandcenter.com/api/v1/v03/evaluate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              engineId: "dcc-412",
              inputs: {
                serviceDate: "2026-12-10",
                ianaTimeZone: "Asia/Kolkata",
                scheduledArrivalLocal: "09:50",
                delayMinutes: row.delayMinutes,
                absoluteEta: row.absoluteEta ?? null,
                transferBufferMinutes: 15,
                tajCutoffLocal: row.tajCutoffLocal,
              },
            }),
          }),
        );
        assert.equal(apiRes.status, 200);
        const apiBody = (await apiRes.json()) as {
          ok: boolean;
          sharedTripRecheck: ReturnType<
            typeof evaluateDelhiAgra20261210CorridorFixture
          >;
          receipt: V03SignedDecisionReceipt;
        };
        assert.equal(apiBody.ok, true);
        assert.equal(apiBody.sharedTripRecheck.isExampleScenario, true);
        assert.ok(
          apiBody.sharedTripRecheck.scenarioLabel.includes(
            "Example — December 10, 2026 Scenario",
          ),
        );
        assert.equal(
          apiBody.sharedTripRecheck.travelerReadyAt.utcIso,
          row.expectedReadyUtc,
        );
        assert.equal(
          apiBody.sharedTripRecheck.gateArrivalLocal,
          row.expectedGateArrivalLocal,
        );
        assert.equal(
          apiBody.sharedTripRecheck.cutoffMarginMinutes,
          row.expectedCutoffMarginMinutes,
        );
        assert.equal(
          apiBody.sharedTripRecheck.cutoffVerdictLabel,
          row.expectedVerdictLabel,
        );

        // Planner SSR page parity across device time zones
        const plannerHtml = renderToStaticMarkup(
          await DelhiToAgraRoutePage({
            searchParams: Promise.resolve({
              date: "2026-12-10",
              arrival: "09:50",
              delay: String(row.delayMinutes ?? 0),
              eta: row.absoluteEta ?? "",
              exit_buffer: "15",
              cutoff: row.tajCutoffLocal,
            }),
          }),
        );
        assert.ok(
          plannerHtml.includes("Example — December 10, 2026 Scenario"),
          `Planner HTML should label the December 10 scenario as an example in TZ=${tz}`,
        );
        assert.ok(
          plannerHtml.includes(row.expectedReadyUtc),
          `Planner HTML should include ready UTC ${row.expectedReadyUtc} in TZ=${tz}`,
        );
        assert.ok(
          plannerHtml.includes(row.expectedGateArrivalLocal),
          `Planner HTML should include gate arrival ${row.expectedGateArrivalLocal} in TZ=${tz}`,
        );
        assert.ok(
          plannerHtml.includes(row.expectedVerdictLabel),
          `Planner HTML should include verdict '${row.expectedVerdictLabel}' in TZ=${tz}`,
        );
      }
    }
  } finally {
    if (originalTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTz;
    }
  }

  // 3. Verify that an absolute 10:32 a.m. ETA yields the exact same result as the 42-minute delay
  for (const cutoff of ["11:00", "11:30"]) {
    const fromDelay42 = evaluateDelhiAgra20261210CorridorFixture({
      delayMinutes: 42,
      tajCutoffLocal: cutoff,
    });
    const fromAbsEta1032 = evaluateDelhiAgra20261210CorridorFixture({
      delayMinutes: 0,
      absoluteEta: "10:32",
      tajCutoffLocal: cutoff,
    });

    assert.equal(fromAbsEta1032.etaResolutionMode, "absolute_eta");
    assert.equal(
      fromAbsEta1032.effectiveArrivalLocal,
      fromDelay42.effectiveArrivalLocal,
    );
    assert.equal(
      fromAbsEta1032.effectiveArrivalUtc,
      fromDelay42.effectiveArrivalUtc,
    );
    assert.equal(
      fromAbsEta1032.travelerReadyAt.utcIso,
      fromDelay42.travelerReadyAt.utcIso,
    );
    assert.equal(
      fromAbsEta1032.travelerReadyAt.formattedSummary,
      fromDelay42.travelerReadyAt.formattedSummary,
    );
    assert.equal(
      fromAbsEta1032.nextServiceAfterReady?.candidateId,
      fromDelay42.nextServiceAfterReady?.candidateId,
    );
    assert.equal(fromAbsEta1032.gateArrivalLocal, fromDelay42.gateArrivalLocal);
    assert.equal(fromAbsEta1032.gateArrivalUtc, fromDelay42.gateArrivalUtc);
    assert.equal(
      fromAbsEta1032.cutoffMarginMinutes,
      fromDelay42.cutoffMarginMinutes,
    );
    assert.equal(
      fromAbsEta1032.fitsDestinationCutoff,
      fromDelay42.fitsDestinationCutoff,
    );
    assert.equal(
      fromAbsEta1032.cutoffVerdictLabel,
      fromDelay42.cutoffVerdictLabel,
    );
  }

  // 4. Verify real-trip rules:
  //    a) For a traveler who hasn't entered an ETA, show 'Needs verification'
  //    b) Keep the sample onward departures out of the real-trip result until those services are verified
  const realTripNoEta = evaluateDelhiAgraRealTripRecheck({
    serviceDate: "2026-12-10",
    scheduledArrivalLocal: "09:50",
    absoluteEta: null,
  });
  assert.equal(realTripNoEta.isExampleScenario, false);
  assert.equal(realTripNoEta.travelerEtaEntered, false);
  assert.equal(realTripNoEta.scheduleBaselineStatus, "Needs verification");
  assert.equal(realTripNoEta.sampleOnwardDeparturesExcluded, true);
  assert.equal(realTripNoEta.candidates.length, 0);
  assert.equal(realTripNoEta.nextServiceAfterReady, null);
  assert.equal(realTripNoEta.nextCatchableDeparture, null);

  const realTripWithEta = evaluateDelhiAgraRealTripRecheck({
    serviceDate: "2026-12-10",
    scheduledArrivalLocal: "09:50",
    absoluteEta: "10:32",
  });
  assert.equal(realTripWithEta.isExampleScenario, false);
  assert.equal(realTripWithEta.travelerEtaEntered, true);
  assert.equal(realTripWithEta.travelerReadyAt.utcIso, "2026-12-10T05:17:00Z");
  // Sample onward departures (10:30, 11:00) remain excluded from real-trip result until verified
  assert.equal(realTripWithEta.sampleOnwardDeparturesExcluded, true);
  assert.equal(realTripWithEta.candidates.length, 0);

  const corridorRealTrip = evaluateDelhiAgraCorridorRecheck({
    date: "2026-12-10",
    scheduledArrivalLocal: "09:50",
    absoluteEta: null,
  });
  assert.equal(
    corridorRealTrip.dcc412Recheck.scheduleBaselineStatus,
    "Needs verification",
  );
  assert.equal(corridorRealTrip.dcc412Recheck.candidates.length, 0);
  assert.equal(corridorRealTrip.sampleOnwardDeparturesExcludedFromRealTrip, true);
  assert.equal(corridorRealTrip.december10ExampleScenario.isExampleScenario, true);
  assert.ok(
    corridorRealTrip.december10ExampleScenario.scenarioLabel.includes(
      "Example — December 10, 2026 Scenario",
    ),
  );

  // Verify API real-trip call (engineId: 'delhi-to-agra' without ETA) shows 'Needs verification' and excludes sample onward departures
  const realTripApiRes = await postV03Evaluate(
    new Request("https://destinationcommandcenter.com/api/v1/v03/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        engineId: "delhi-to-agra",
        inputs: {
          serviceDate: "2026-12-10",
          scheduledArrivalLocal: "09:50",
        },
      }),
    }),
  );
  assert.equal(realTripApiRes.status, 200);
  const realTripApiBody = (await realTripApiRes.json()) as {
    ok: boolean;
    sharedTripRecheck: ReturnType<typeof evaluateDelhiAgraRealTripRecheck>;
  };
  assert.equal(realTripApiBody.ok, true);
  assert.equal(realTripApiBody.sharedTripRecheck.isExampleScenario, false);
  assert.equal(realTripApiBody.sharedTripRecheck.travelerEtaEntered, false);
  assert.equal(
    realTripApiBody.sharedTripRecheck.scheduleBaselineStatus,
    "Needs verification",
  );
  assert.equal(
    realTripApiBody.sharedTripRecheck.sampleOnwardDeparturesExcluded,
    true,
  );
  assert.equal(realTripApiBody.sharedTripRecheck.candidates.length, 0);

  // Verify missing or stale update sets scheduleBaselineStatus to 'Needs verification'
  const missingUpdateEval = evaluateDelhiAgra20261210CorridorFixture({
    delayMinutes: 0,
    tajCutoffLocal: "11:00",
    criticalUpdateMissing: true,
  });
  assert.equal(missingUpdateEval.scheduleBaselineStatus, "Needs verification");

  const staleFlagEval = evaluateDelhiAgra20261210CorridorFixture({
    delayMinutes: 0,
    tajCutoffLocal: "11:00",
    staleUpdate: true,
  });
  assert.equal(staleFlagEval.scheduleBaselineStatus, "Needs verification");

  const expiredTimestampEval = evaluateDelhiAgra20261210CorridorFixture({
    delayMinutes: 0,
    tajCutoffLocal: "11:00",
    inboundSourceExpiry: "2026-12-10T04:15:00Z",
    evaluatedAtUtc: "2026-12-10T04:20:00Z",
  });
  assert.equal(expiredTimestampEval.scheduleBaselineStatus, "Needs verification");

  // 5. Public guide requirements: official NTES lookup, labeled traveler-entered ETA, Needs verification when no ETA entered, checkout disabled until verified
  assert.equal(
    OFFICIAL_NTES_LIVE_TRAIN_LOOKUP.officialMobileAndWebUrl,
    "https://enquiry.indianrail.gov.in/mntes/",
  );
  const defaultGuideNoEtaHtml = renderToStaticMarkup(
    await DelhiToAgraRoutePage({
      searchParams: Promise.resolve({
        date: "2026-12-10",
      }),
    }),
  );
  assert.ok(
    defaultGuideNoEtaHtml.includes("Schedule Baseline: Needs verification"),
  );
  assert.ok(
    defaultGuideNoEtaHtml.includes("Example — December 10, 2026 Scenario"),
  );
  assert.ok(
    defaultGuideNoEtaHtml.includes(
      "Onward Services: Sample Departures Excluded Until Verified (0 verified onward departures)",
    ),
  );

  const publicGuideHtml = renderToStaticMarkup(
    await DelhiToAgraRoutePage({
      searchParams: Promise.resolve({
        date: "2026-12-10",
        arrival: "09:50",
        eta: "10:32",
        cutoff: "11:00",
        stale_update: "1",
      }),
    }),
  );
  assert.ok(publicGuideHtml.includes("https://enquiry.indianrail.gov.in/mntes/"));
  assert.ok(publicGuideHtml.includes("Traveler-Entered ETA"));
  assert.ok(publicGuideHtml.includes("Needs verification"));
  assert.ok(publicGuideHtml.includes("dcc:place:in-del-nzm-rail-station"));
  assert.ok(publicGuideHtml.includes("dcc:place:in-agr-agc-rail-station"));
  assert.ok(publicGuideHtml.includes("dcc:place:in-agr-taj-entry-gate"));

  // Commercial private car checkout remains withheld while operator, price, and booking link are pending Review Desk verification
  const privateCarOption = DELHI_AGRA_QUALIFIED_OPTIONS.find(
    (o) => o.optionId === "agra-cantt-station-to-taj-private-car",
  );
  assert.ok(privateCarOption);
  assert.equal(privateCarOption.pricingVerificationGate.verified, false);
  assert.equal(privateCarOption.bookingLinkVerificationGate.verified, false);
  assert.equal(privateCarOption.bookingOrWhatsappHref, null);
});

const SAMPLE_RAGIN_CAJUN_228561_DEPARTURES: FareHarborAvailability[] = [
  {
    pk: 1774334571,
    start_at: "2026-11-18T10:00:00-0600",
    end_at: "2026-11-18T11:45:00-0600",
    capacity: undefined,
    minimum_party_size: 1,
    maximum_party_size: null,
    headline: "10:00 AM — Large Airboat Tour (Drive Yourself / Self-Drive)",
    customer_type_rates: [
      {
        pk: 650101,
        capacity: null,
        minimum_party_size: 1,
        maximum_party_size: null,
        total: 6500,
        total_including_tax: 6890,
        customer_prototype: {
          pk: 499047,
          display_name: "General",
          note: "48 inches and taller (Pre-tax estimate $65.00 + 6% online booking fee)",
          total: 6500,
          total_including_tax: 6890,
        },
        customer_type: {
          pk: 1001,
          singular: "General",
          plural: "General",
          note: "Drive yourself (Pre-tax estimate)",
        },
      },
    ],
  },
  {
    pk: 1774340210,
    start_at: "2026-11-18T10:00:00-0600",
    end_at: "2026-11-18T11:45:00-0600",
    capacity: undefined,
    minimum_party_size: 1,
    maximum_party_size: null,
    headline:
      "10:00 AM — Large Airboat Tour with Downtown New Orleans Hotel Pickup (Shuttle Service)",
    customer_type_rates: [
      {
        pk: 650102,
        capacity: null,
        minimum_party_size: 1,
        maximum_party_size: null,
        total: 9000,
        total_including_tax: 9540,
        customer_prototype: {
          pk: 499051,
          display_name: "General - Shuttle Service",
          note: "Includes round-trip hotel pickup ($65.00 base + $25.00 Shuttle Service = $90.00/person pre-tax estimate)",
          total: 9000,
          total_including_tax: 9540,
        },
        customer_type: {
          pk: 1002,
          singular: "General - Shuttle Service",
          plural: "General - Shuttle Service",
          note: "Hotel pickup included (Pre-tax estimate)",
        },
      },
    ],
  },
];

test("101.8 — WNO First Pilot: Ragin Cajun Airboat Tours (Keep aktourcenter Links, Move Sample Departures to Tests, 'Check dates and prices on FareHarbor' When Inventory Unavailable, Pre-Tax Estimate Labels, and Luling Meeting Point Gate)", async () => {
  // 1. Verify WNO provider and tour configuration keep existing aktourcenter checkout links
  const raginProvider = PROVIDERS["ragin-cajun-tours"];
  assert.ok(raginProvider);
  assert.equal(raginProvider.fareHarborShortname, "ragincajuntours");

  const raginTour = STOREFRONT_PRODUCTS.find(
    (t) => t.id === "ragincajun-airboat",
  );
  assert.ok(raginTour);
  assert.equal(raginTour.companyShortname, "ragincajuntours");
  assert.equal(raginTour.itemId, "228561");
  assert.equal(raginTour.flowId, "940162");
  assert.equal(raginTour.fareharborAsnActive, true);
  assert.equal(raginTour.ctaLabel, "Check dates and prices on FareHarbor");
  assert.ok(raginTour.priceUnit.toLowerCase().includes("pre-tax estimate"));
  assert.ok(raginTour.logistics.meetingPoint.includes("two Luling"));
  assert.ok(
    raginTour.logistics.meetingPoint.includes(
      "provides the launch address with the booking",
    ),
  );
  assert.equal(
    raginTour.logistics.meetingPoint.includes("9694 Barataria"),
    false,
  );

  const primaryHref = getProductPrimaryBookingHref(raginTour);
  assert.ok(
    primaryHref.includes(
      "https://fareharbor.com/embeds/book/ragincajuntours/items/228561/",
    ),
  );
  assert.ok(primaryHref.includes("asn=aktourcenter"));

  // 2. Verify when live inventory is unavailable, no sample departures are returned in production and CTA is 'Check dates and prices on FareHarbor'
  const pilotUnavailable = await previewWnoRaginCajunAirboatPilot({
    date: "2026-11-18",
    guests: 2,
    itemPk: 228561,
    skipLiveFetch: true,
  });

  assert.equal(pilotUnavailable.pilotId, "wno-ragin-cajun-airboat-pilot");
  assert.equal(pilotUnavailable.wnoAccountShortname, "aktourcenter");
  assert.equal(pilotUnavailable.supplierShortname, "ragincajuntours");
  assert.equal(pilotUnavailable.inventoryAvailable, false);
  assert.equal(pilotUnavailable.departures.length, 0);
  assert.equal(
    pilotUnavailable.whenInventoryUnavailableCtaLabel,
    "Check dates and prices on FareHarbor",
  );
  assert.equal(
    pilotUnavailable.primaryActionLabel,
    "Check dates and prices on FareHarbor",
  );
  assert.equal(
    pilotUnavailable.primaryActionHref,
    "https://fareharbor.com/embeds/book/ragincajuntours/items/228561/?asn=aktourcenter&flow=940162&full-items=yes",
  );

  // Verify meeting point confirmation gate for item 228561 (two Luling locations, launch address provided with booking, no unconfirmed directions)
  assert.equal(
    pilotUnavailable.productPreview.meetingPointConfirmationGate
      .exactMeetingPointConfirmed,
    false,
  );
  assert.equal(
    pilotUnavailable.productPreview.meetingPointConfirmationGate
      .displayDirectionsAllowed,
    false,
  );
  assert.equal(
    pilotUnavailable.productPreview.meetingPointConfirmationGate
      .twoLulingLocationsListedByOperator,
    true,
  );
  assert.equal(
    pilotUnavailable.productPreview.meetingPointConfirmationGate
      .launchAddressProvidedWithBooking,
    true,
  );
  assert.ok(
    pilotUnavailable.productPreview.meetingPointConfirmationGate.directionsHoldNote.includes(
      "two Luling",
    ),
  );
  assert.equal(
    pilotUnavailable.productPreview.normalizedCatalogItem.meetingPointAddress,
    null,
  );
  assert.equal(
    pilotUnavailable.productPreview.normalizedCatalogItem.meetingPointLat,
    null,
  );
  assert.equal(
    pilotUnavailable.productPreview.normalizedCatalogItem.meetingPointLng,
    null,
  );
  assert.equal(
    pilotUnavailable.productPreview.normalizedCatalogItem.locationPrecision,
    "unknown",
  );

  // 3. Inject sample departures strictly from this test via availabilitiesOverride
  const pilot = await previewWnoRaginCajunAirboatPilot({
    date: "2026-11-18",
    guests: 2,
    itemPk: 228561,
    availabilitiesOverride: SAMPLE_RAGIN_CAJUN_228561_DEPARTURES,
  });

  assert.equal(pilot.inventoryAvailable, true);
  assert.equal(pilot.productPreview.fareHarborItemPk, 228561);
  assert.equal(
    pilot.productPreview.exactProductId,
    "dcc:tour:fh:ragincajuntours:228561",
  );
  assert.equal(pilot.productPreview.title, "Ragin' Cajun Large Airboat Tour");
  assert.equal(pilot.productPreview.isPreTaxEstimate, true);
  assert.ok(
    pilot.productPreview.priceEstimateLabel.includes("Pre-tax estimate"),
  );
  assert.equal(pilot.date, "2026-11-18");
  assert.equal(pilot.guests, 2);
  assert.equal(pilot.departures.length, 2);

  // Self-drive sample departure (1774334571)
  const selfDriveDep = pilot.departures.find((d) => d.pickupIncluded === false);
  assert.ok(selfDriveDep);
  assert.equal(selfDriveDep.availabilityPk, 1774334571);
  assert.equal(selfDriveDep.startAtLocal, "2026-11-18T10:00:00");
  assert.equal(selfDriveDep.endAtLocal, "2026-11-18T11:45:00");
  assert.equal(selfDriveDep.isBookable, true);
  assert.equal(selfDriveDep.isSoldOut, false);
  assert.equal(selfDriveDep.exactRemainingCapacity, null);
  assert.equal(selfDriveDep.pickupIncluded, false);
  assert.equal(selfDriveDep.isPreTaxEstimate, true);
  assert.ok(selfDriveDep.priceEstimateLabel.includes("Pre-tax estimate"));
  assert.equal(selfDriveDep.perPersonBaseUsd, 65);
  assert.equal(selfDriveDep.subtotalBaseUsd, 130);
  assert.equal(selfDriveDep.onlineBookingFeeUsd, 7.8);
  assert.equal(selfDriveDep.totalEstimatedUsdBeforeLocalTax, 137.8);
  assert.ok(
    selfDriveDep.slotCheckoutUrl.includes(
      "https://fareharbor.com/embeds/book/ragincajuntours/items/228561/availability/1774334571/book/?asn=aktourcenter&flow=940162&full-items=yes",
    ),
  );

  // Hotel pickup / Shuttle Service sample departure (1774340210)
  const shuttleDep = pilot.departures.find((d) => d.pickupIncluded === true);
  assert.ok(shuttleDep);
  assert.equal(shuttleDep.availabilityPk, 1774340210);
  assert.equal(shuttleDep.startAtLocal, "2026-11-18T10:00:00");
  assert.equal(shuttleDep.endAtLocal, "2026-11-18T11:45:00");
  assert.equal(shuttleDep.isBookable, true);
  assert.equal(shuttleDep.isSoldOut, false);
  assert.equal(shuttleDep.pickupIncluded, true);
  assert.equal(shuttleDep.isPreTaxEstimate, true);
  assert.ok(shuttleDep.priceEstimateLabel.includes("Pre-tax estimate"));
  assert.equal(shuttleDep.perPersonBaseUsd, 90);
  assert.equal(shuttleDep.subtotalBaseUsd, 180);
  assert.equal(shuttleDep.onlineBookingFeeUsd, 10.8);
  assert.equal(shuttleDep.totalEstimatedUsdBeforeLocalTax, 190.8);

  // Verify existing WNO checkout handoff links carry aktourcenter attribution
  assert.equal(
    pilot.productPreview.existingWnoItemCheckoutUrl,
    "https://fareharbor.com/embeds/book/ragincajuntours/items/228561/?asn=aktourcenter&flow=940162&full-items=yes",
  );
  assert.equal(
    pilot.productPreview.existingWnoFlowCheckoutUrl,
    "https://fareharbor.com/embeds/book/ragincajuntours/?asn=aktourcenter&flow=940162&full-items=yes",
  );
  assert.equal(
    pilot.accessStatus.requiredApiPermissionsForLiveAvailabilityAndPricing
      .length,
    2,
  );
  assert.ok(
    pilot.accessStatus.requiredApiPermissionsForLiveAvailabilityAndPricing[0]?.includes(
      "aktourcenter",
    ),
  );
});

test("101.9 — Portfolio Cockpit Supplier Connections: Durable check persistence, real HTTP checkout handoff verification, GoSno /api/availability trip check, and distinct FareHarbor states (missing_credentials, http_403, empty_date, timeout)", async () => {
  const checksFilePath = path.join(
    process.cwd(),
    "data",
    "memory",
    "supplier-connection-checks.json",
  );
  const originalChecksJson = fs.existsSync(checksFilePath)
    ? fs.readFileSync(checksFilePath, "utf8")
    : "[]\n";

  const createdKeys: Array<{
    companyId: string;
    productId: string;
    checkType: "booking_link" | "live_inventory";
  }> = [
    {
      companyId: "southern-style-tours",
      productId: "southernstyle-city-tour",
      checkType: "booking_link",
    },
    {
      companyId: "southern-style-tours",
      productId: "southernstyle-city-tour",
      checkType: "live_inventory",
    },
    {
      companyId: "ragin-cajun-tours",
      productId: "ragincajun-airboat",
      checkType: "booking_link",
    },
    {
      companyId: "ragin-cajun-tours",
      productId: "ragincajun-airboat",
      checkType: "live_inventory",
    },
    {
      companyId: "gosno",
      productId: "gosno-colorado-planner-vail-booking",
      checkType: "booking_link",
    },
    {
      companyId: "gosno",
      productId: "gosno-colorado-planner-vail-booking",
      checkType: "live_inventory",
    },
  ];

  try {
    for (const k of createdKeys) {
      await deleteSupplierProductCheckRecord(k);
    }

    // 1. Before any check is saved, unchecked products show null (Not checked)
    const initialConnections = await listPortfolioSupplierConnections();
    assert.ok(initialConnections.length >= 6);

    const steamboatInitial = initialConnections.find(
      (c) => c.companyId === "new-orleans-steamboat-gray-line",
    );
    assert.ok(steamboatInitial);
    assert.equal(steamboatInitial.lastChecked, null);
    assert.equal(steamboatInitial.bookingLinksLastChecked, null);
    assert.equal(steamboatInitial.liveInventoryLastChecked, null);
    assert.equal(steamboatInitial.checkoutVerified.verified, false);
    assert.equal(steamboatInitial.checkoutVerified.checkedAt, null);

    // 2. Open the actual checkout: follow redirects and verify supplier, product, and tracking tag intact
    const redirectFetchMock: typeof fetch = async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (!url.includes("hop=2")) {
        return new Response(null, {
          status: 302,
          headers: {
            location: `${url}&hop=2`,
          },
        });
      }
      return new Response(
        "<html><body>FareHarbor southernstyletours item 51942 asn=aktourcenter</body></html>",
        {
          status: 200,
          headers: { "content-type": "text/html" },
        },
      );
    };

    const sstCheckIso = "2026-11-07T23:10:11.000Z";
    const sstBookingRes = await runSupplierBookingLinkCheck({
      companyId: "southern-style-tours",
      productId: "southernstyle-city-tour",
      nowIso: sstCheckIso,
      fetchImpl: redirectFetchMock,
    });
    assert.equal(sstBookingRes.ok, true);
    assert.equal(sstBookingRes.persisted, true);
    assert.equal(sstBookingRes.status, 200);
    assert.equal(sstBookingRes.checkRecord?.verified, true);
    assert.equal(sstBookingRes.checkRecord?.failureReason, null);
    assert.equal(sstBookingRes.checkRecord?.httpStatus, 200);
    assert.equal(sstBookingRes.checkRecord?.supplierMatched, true);
    assert.equal(sstBookingRes.checkRecord?.productMatched, true);
    assert.equal(sstBookingRes.checkRecord?.attributionVerified, true);
    assert.equal(sstBookingRes.checkRecord?.attributionTag, "asn=aktourcenter");
    assert.equal(sstBookingRes.checkRecord?.handoffChain?.length, 2);
    assert.ok(sstBookingRes.checkRecord?.finalReachedUrl?.includes("hop=2"));

    // Verify if a redirect strips the tracking tag, booking check fails with tracking_tag_missing
    const strippedTagFetchMock: typeof fetch = async () =>
      new Response(
        "<html><body>ragincajuntours item 228561</body></html>",
        {
          status: 302,
          headers: {
            location:
              "https://fareharbor.com/embeds/book/ragincajuntours/items/228561/?full-items=yes",
          },
        },
      );
    let hopCount = 0;
    const strippedRedirectLoopMock: typeof fetch = async (input) => {
      hopCount += 1;
      if (hopCount === 1) {
        return strippedTagFetchMock(input);
      }
      return new Response(
        "<html><body>ragincajuntours item 228561 without asn</body></html>",
        { status: 200 },
      );
    };

    const strippedRes = await runSupplierBookingLinkCheck({
      companyId: "ragin-cajun-tours",
      productId: "ragincajun-airboat",
      nowIso: "2026-11-07T23:10:25.000Z",
      fetchImpl: strippedRedirectLoopMock,
    });
    assert.equal(strippedRes.ok, true);
    assert.equal(strippedRes.checkRecord?.verified, false);
    assert.equal(strippedRes.checkRecord?.failureReason, "tracking_tag_missing");

    // Verify GoSno booking link check reaches gosno.co/vail with src=dcc-authority-colorado intact
    const gosnoBookingMock: typeof fetch = async () =>
      new Response("<html><body>GoSno Vail Transfer Booking</body></html>", {
        status: 200,
      });
    const gosnoBookingRes = await runSupplierBookingLinkCheck({
      companyId: "gosno",
      productId: "gosno-colorado-planner-vail-booking",
      nowIso: "2026-11-07T23:11:02.000Z",
      fetchImpl: gosnoBookingMock,
    });
    assert.equal(gosnoBookingRes.ok, true);
    assert.equal(gosnoBookingRes.persisted, true);
    assert.equal(gosnoBookingRes.checkRecord?.verified, true);
    assert.equal(gosnoBookingRes.checkRecord?.supplierMatched, true);
    assert.equal(gosnoBookingRes.checkRecord?.productMatched, true);
    assert.equal(
      gosnoBookingRes.checkRecord?.attributionTag,
      "src=dcc-authority-colorado",
    );

    // 3. Check inventory for a specific trip on GoSno via /api/availability
    let capturedGosnoUrl = "";
    const gosnoAvailabilityMock: typeof fetch = async (input) => {
      capturedGosnoUrl = typeof input === "string" ? input : input.toString();
      return new Response(
        JSON.stringify({
          routeId: "DEN-VAIL",
          date: "2026-12-15",
          time: "10:00",
          passengers: 4,
          availability: {
            suv: {
              available: true,
              priceCents: 49900,
              availabilityToken: "tok_test_vail_suv",
              tokenExpiresAt: "2026-12-15T10:15:00.000Z",
            },
            van: {
              available: true,
              priceCents: 59900,
              availabilityToken: "tok_test_vail_van",
              tokenExpiresAt: "2026-12-15T10:15:00.000Z",
            },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const gosnoInvIso = "2026-11-07T23:12:00.000Z";
    const gosnoInvRes = await runSupplierLiveInventoryCheck({
      companyId: "gosno",
      productId: "gosno-colorado-planner-vail-booking",
      route: "DEN-VAIL",
      pickupDate: "2026-12-15",
      pickupTime: "10:00",
      partySize: 4,
      vehicleClass: "suv",
      nowIso: gosnoInvIso,
      fetchImpl: gosnoAvailabilityMock,
    });
    assert.equal(gosnoInvRes.ok, true);
    assert.equal(gosnoInvRes.persisted, true);
    assert.ok(capturedGosnoUrl.startsWith("https://gosno.co/api/availability?"));
    const parsedGosnoUrl = new URL(capturedGosnoUrl);
    assert.equal(parsedGosnoUrl.searchParams.get("routeId"), "DEN-VAIL");
    assert.equal(parsedGosnoUrl.searchParams.get("date"), "2026-12-15");
    assert.equal(parsedGosnoUrl.searchParams.get("time"), "10:00");
    assert.equal(parsedGosnoUrl.searchParams.get("passengers"), "4");
    assert.equal(parsedGosnoUrl.searchParams.get("vehicleClass"), "suv");
    assert.equal(gosnoInvRes.checkRecord?.verified, true);
    assert.equal(gosnoInvRes.checkRecord?.failureReason, null);
    assert.equal(gosnoInvRes.checkRecord?.httpStatus, 200);
    assert.deepEqual(gosnoInvRes.checkRecord?.tripQuery, {
      route: "DEN-VAIL",
      origin: "DEN",
      destination: "Vail",
      pickupDate: "2026-12-15",
      pickupTime: "10:00",
      partySize: 4,
      vehicleClass: "suv",
    });
    assert.ok(gosnoInvRes.checkRecord?.whatItProves.includes("$499"));
    assert.equal(
      gosnoInvRes.companyConnection?.plannerLiveDisplayVerified.verified,
      false,
      "Displayed in the DCC planner must remain a separate status from live inventory verified",
    );

    // 4. For Ragin Cajun and Southern Style, report missing_credentials, http_403, empty_date, and timeout separately
    // Case A: missing_credentials
    const missingCredsRes = await runSupplierLiveInventoryCheck({
      companyId: "ragin-cajun-tours",
      productId: "ragincajun-airboat",
      pickupDate: "2026-11-18",
      partySize: 2,
      nowIso: "2026-11-07T23:13:01.000Z",
      forceMissingWnoCredentials: true,
    });
    assert.equal(missingCredsRes.ok, true);
    assert.equal(missingCredsRes.checkRecord?.verified, false);
    assert.equal(missingCredsRes.checkRecord?.failureReason, "missing_credentials");
    assert.equal(
      missingCredsRes.checkRecord?.httpStatus,
      null,
      "missing_credentials must not be labeled HTTP 403",
    );

    // Temporarily ensure WNO credentials exist in env for Cases B, C, D if not already set
    const origAppKey = process.env.FAREHARBOR_WNO_APP_KEY;
    const origUserKey = process.env.FAREHARBOR_WNO_USER_KEY;
    if (!origAppKey && !process.env.DCC_FH_API) {
      process.env.FAREHARBOR_WNO_APP_KEY = "test_app_key";
      process.env.FAREHARBOR_WNO_USER_KEY = "test_user_key";
    }

    try {
      // Case B: actual HTTP 403
      const fh403Mock: typeof fetch = async () =>
        new Response('{"error":"Not authorized for company ragincajuntours"}', {
          status: 403,
        });
      const http403Res = await runSupplierLiveInventoryCheck({
        companyId: "ragin-cajun-tours",
        productId: "ragincajun-airboat",
        pickupDate: "2026-11-18",
        partySize: 2,
        nowIso: "2026-11-07T23:13:15.000Z",
        fetchImpl: fh403Mock,
      });
      assert.equal(http403Res.ok, true);
      assert.equal(http403Res.checkRecord?.verified, false);
      assert.equal(http403Res.checkRecord?.failureReason, "http_403");
      assert.equal(http403Res.checkRecord?.httpStatus, 403);

      // Case C: empty_date (HTTP 200 with availabilities: [])
      const fhEmptyDateMock: typeof fetch = async () =>
        new Response(JSON.stringify({ availabilities: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      const emptyDateRes = await runSupplierLiveInventoryCheck({
        companyId: "southern-style-tours",
        productId: "southernstyle-city-tour",
        pickupDate: "2026-12-25",
        partySize: 2,
        nowIso: "2026-11-07T23:13:30.000Z",
        fetchImpl: fhEmptyDateMock,
      });
      assert.equal(emptyDateRes.ok, true);
      assert.equal(emptyDateRes.checkRecord?.verified, false);
      assert.equal(emptyDateRes.checkRecord?.failureReason, "empty_date");
      assert.equal(
        emptyDateRes.checkRecord?.httpStatus,
        200,
        "empty_date must record HTTP 200, not 403",
      );

      // Case D: timeout
      const fhTimeoutMock: typeof fetch = async () => {
        const err = new Error("The operation was aborted due to timeout");
        err.name = "TimeoutError";
        throw err;
      };
      const timeoutRes = await runSupplierLiveInventoryCheck({
        companyId: "southern-style-tours",
        productId: "southernstyle-city-tour",
        pickupDate: "2026-11-18",
        partySize: 2,
        nowIso: "2026-11-07T23:13:45.000Z",
        timeoutMs: 2500,
        fetchImpl: fhTimeoutMock,
      });
      assert.equal(timeoutRes.ok, true);
      assert.equal(timeoutRes.checkRecord?.verified, false);
      assert.equal(timeoutRes.checkRecord?.failureReason, "timeout");
      assert.equal(
        timeoutRes.checkRecord?.httpStatus,
        null,
        "timeout must have httpStatus null, not 403",
      );
    } finally {
      if (origAppKey === undefined) {
        delete process.env.FAREHARBOR_WNO_APP_KEY;
      } else {
        process.env.FAREHARBOR_WNO_APP_KEY = origAppKey;
      }
      if (origUserKey === undefined) {
        delete process.env.FAREHARBOR_WNO_USER_KEY;
      } else {
        process.env.FAREHARBOR_WNO_USER_KEY = origUserKey;
      }
    }

    // 5. Verify persisted records read back from durable storage and render on /admin/portfolio
    const persistedRecords = await readSupplierProductCheckRecords();
    assert.ok(
      persistedRecords.some(
        (r) =>
          r.companyId === "gosno" &&
          r.productId === "gosno-colorado-planner-vail-booking" &&
          r.checkType === "live_inventory" &&
          r.checkedAt === gosnoInvIso,
      ),
    );

    const bannerPageHtml = renderToStaticMarkup(
      await PortfolioDesktopPage({
        searchParams: Promise.resolve({
          checkSaved: "1",
          checkedCompany: "gosno",
          checkedProduct: "gosno-colorado-planner-vail-booking",
          checkType: "live_inventory",
          checkedAt: gosnoInvIso,
        }),
      }),
    );
    assert.ok(bannerPageHtml.includes('data-testid="supplier-check-saved-banner"'));
    assert.ok(bannerPageHtml.includes("Checkout reachable"));
    assert.ok(bannerPageHtml.includes("Live inventory verified"));
    assert.ok(bannerPageHtml.includes("Displayed in DCC planner"));

    // Verify failed write banner when checkSaved=0
    const failedBannerHtml = renderToStaticMarkup(
      await PortfolioDesktopPage({
        searchParams: Promise.resolve({
          checkSaved: "0",
          checkError: "Database write failed in test",
        }),
      }),
    );
    assert.ok(failedBannerHtml.includes('data-testid="supplier-check-error-banner"'));
    assert.equal(
      failedBannerHtml.includes('data-testid="supplier-check-saved-banner"'),
      false,
    );
  } finally {
    for (const k of createdKeys) {
      await deleteSupplierProductCheckRecord(k);
    }
    fs.writeFileSync(checksFilePath, originalChecksJson, "utf8");
  }
});

test("101.10 — Reykjavík: Neon catalog filtering & pagination, crawlable /ports/reykjavik, existing /tours/[id] route, and exact-product checkout handoff", async () => {
  const { GET: getCatalogRoute } = await import("@/app/api/v1/tours/catalog/route");
  const { GET: getMatchRoute } = await import("@/app/api/v1/tours/match/route");
  const { GET: getAdsClickRoute } = await import("@/app/api/v1/ads/click/route");
  const { PUBLICATION_MANIFEST } = await import("@/src/data/publication-manifest");
  const PortPageModule = await import("@/app/ports/[slug]/page");
  const TourDetailPageModule = await import("@/app/tours/[id]/page");

  // 1. Verify /ports/reykjavik is public_indexable & index_follow in PUBLICATION_MANIFEST
  const reykjavikPub = PUBLICATION_MANIFEST.find((r) => r.route === "/ports/reykjavik");
  assert.ok(reykjavikPub, "/ports/reykjavik must exist in PUBLICATION_MANIFEST");
  assert.equal(reykjavikPub.acceptanceState, "public_indexable");
  assert.equal(reykjavikPub.indexingState, "index_follow");
  assert.equal(reykjavikPub.includeInSitemap, true);

  // 2. Verify Neon-filtered and paginated /api/v1/tours/catalog for Reykjavík
  const page1Res = await getCatalogRoute(
    new NextRequest(
      "https://destinationcommandcenter.com/api/v1/tours/catalog?port=reykjavik&limit=6&page=1&sort=recommended&surface=cruisepromenade",
    ),
  );
  assert.equal(page1Res.status, 200);
  const page1Json = await page1Res.json();
  assert.equal(page1Json.ok, true);
  assert.equal(page1Json.totalMatched, 24);
  assert.equal(page1Json.returnedCount, 6);
  assert.equal(page1Json.page, 1);
  assert.equal(page1Json.totalPages, 4);
  assert.equal(page1Json.hasMore, true);
  assert.ok(Array.isArray(page1Json.categoriesAvailable) && page1Json.categoriesAvailable.length >= 3);

  const page2Res = await getCatalogRoute(
    new NextRequest(
      "https://destinationcommandcenter.com/api/v1/tours/catalog?port=reykjavik&limit=6&page=2&sort=recommended&surface=cruisepromenade",
    ),
  );
  const page2Json = await page2Res.json();
  assert.equal(page2Json.page, 2);
  assert.equal(page2Json.offset, 6);
  assert.equal(page2Json.returnedCount, 6);
  assert.notEqual(page1Json.tours[0].tourId, page2Json.tours[0].tourId);

  // Verify category filter on catalog route
  const goldenCircleCategory = "Golden Circle, Geysers & Waterfalls";
  const catRes = await getCatalogRoute(
    new NextRequest(
      `https://destinationcommandcenter.com/api/v1/tours/catalog?port=reykjavik&category=${encodeURIComponent(goldenCircleCategory)}&limit=12`,
    ),
  );
  const catJson = await catRes.json();
  assert.equal(catJson.ok, true);
  assert.ok(catJson.totalMatched >= 1);
  assert.ok(catJson.tours.every((t: { category: string }) => t.category === goldenCircleCategory));

  // 3. Verify Fits my sailing (/api/v1/tours/match) for Reykjavík cruise arrival/all-aboard
  const matchRes = await getMatchRoute(
    new NextRequest(
      "https://destinationcommandcenter.com/api/v1/tours/match?port=reykjavik&shipArrival=07:30&shipDeparture=19:00&allAboardTime=18:30&date=2027-07-15&adults=2&limit=24&page=1&enableShortlistLiveCheck=false",
    ),
  );
  assert.equal(matchRes.status, 200);
  const matchJson = await matchRes.json();
  assert.equal(matchJson.ok, true);
  assert.equal(matchJson.destination.destinationSlug, "reykjavik");
  assert.ok(matchJson.metrics.totalCatalogCandidates >= 20);
  assert.ok(matchJson.options.length >= 10);
  assert.ok(
    matchJson.options.some((m: { providerProductCode: string }) => m.providerProductCode === "7090P9"),
    "3h Whale Watching (7090P9) must fit a 07:30–18:30 all-aboard Reykjavík port call",
  );
  assert.ok(
    matchJson.options.some((m: { providerProductCode: string }) => m.providerProductCode === "36855P1"),
    "8h Small-group Golden Circle Classic (36855P1) must fit a 07:30–18:30 all-aboard Reykjavík port call",
  );

  const shortCallRes = await getMatchRoute(
    new NextRequest(
      "https://destinationcommandcenter.com/api/v1/tours/match?port=reykjavik&shipArrival=08:00&shipDeparture=15:00&allAboardTime=14:30&date=2027-07-15&adults=2&limit=24&page=1&enableShortlistLiveCheck=false",
    ),
  );
  const shortCallJson = await shortCallRes.json();
  assert.ok(
    shortCallJson.options.some((m: { providerProductCode: string }) => m.providerProductCode === "7090P9"),
    "3h Whale Watching (7090P9) must still fit a 08:00–14:30 all-aboard call",
  );
  assert.equal(
    shortCallJson.options.some((m: { providerProductCode: string }) => m.providerProductCode === "36855P1"),
    false,
    "8h Golden Circle (36855P1) must not be eligible on a tight 08:00–14:30 all-aboard call",
  );
  assert.ok(
    shortCallJson.ineligibleOptions.some((m: { providerProductCode: string }) => m.providerProductCode === "36855P1"),
    "8h Golden Circle (36855P1) must be marked ineligible on a tight 08:00–14:30 all-aboard call",
  );

  // 4. Verify crawlable /ports/reykjavik renders PortAuthorityTemplate + Neon catalog + Cruise Promenade CTAs + exact-product checkout links
  const firstTour = page1Json.tours[0] as {
    providerProductCode: string;
    title: string;
    bookingPath: { trackedClickUrl: string };
  };
  assert.ok(firstTour?.providerProductCode, "page 1 of Reykjavík catalog must return a first tour");
  const portElement = await PortPageModule.default({
    params: Promise.resolve({ slug: "reykjavik" }),
    searchParams: Promise.resolve({}),
  });
  const portHtml = renderToStaticMarkup(portElement);
  assert.ok(portHtml.includes('data-testid="reykjavik-port-catalog-section"'));
  assert.ok(portHtml.includes('data-testid="reykjavik-browse-all-tours-cta"'));
  assert.ok(portHtml.includes('data-testid="reykjavik-fits-my-sailing-cta"'));
  assert.ok(portHtml.includes(`data-testid="reykjavik-tour-detail-${firstTour.providerProductCode}"`));
  assert.ok(portHtml.includes(`data-testid="reykjavik-exact-checkout-${firstTour.providerProductCode}"`));

  // 5. Verify existing /tours/[id] route resolves 7090P9 from Neon durable catalog
  const tourDetailElement = await TourDetailPageModule.default({
    params: Promise.resolve({ id: "7090P9" }),
  });
  const tourDetailHtml = renderToStaticMarkup(tourDetailElement);
  assert.ok(tourDetailHtml.includes("The Original Classic Whale Watching from Reykjavik"));
  assert.ok(tourDetailHtml.includes('data-testid="tour-detail-durable-catalog-panel"'));
  assert.ok(tourDetailHtml.includes('data-testid="tour-detail-exact-checkout-cta"'));

  // 6. Verify exact-product checkout handoff (/api/v1/ads/click -> 302 to exact Viator product URL)
  assert.ok(
    firstTour.bookingPath.trackedClickUrl.startsWith("/api/v1/ads/click?"),
    "trackedClickUrl must use signed /api/v1/ads/click handoff",
  );
  const clickRes = await getAdsClickRoute(
    new NextRequest(`https://destinationcommandcenter.com${firstTour.bookingPath.trackedClickUrl}`),
  );
  assert.equal(clickRes.status, 302);
  const redirectLocation = clickRes.headers.get("location") || "";
  assert.ok(
    redirectLocation.includes(`d905-${firstTour.providerProductCode}`),
    `Expected exact-product Viator redirect for ${firstTour.providerProductCode}, got: ${redirectLocation}`,
  );
});





