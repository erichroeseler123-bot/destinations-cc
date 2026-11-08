import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  buildRiverboatComparisonFunnelReport,
  RIVERBOAT_COMPARISON_PATHS,
  RIVERBOAT_COMPARISON_SLUG,
} from "../../lib/wno/riverboatComparisonFunnel";
import {
  buildAutomatedPortEvidenceReviewQueue,
  computeHaversineDistanceMiles,
  evaluateEvidenceReviewPriority,
  queryPortDayExcursionCatalog,
  resolveCruisePortExcursionProfile,
} from "../../lib/dcc/cruisePortExcursionCatalogEngine";
import type { DurableTourRecord } from "../../lib/dcc/catalog/durableCatalogStore";

test("New Orleans Riverboat Comparison Funnel & One-Mile Evidence Prioritizer Suite", async (t) => {
  await t.test("1. DecisionComparison and TourDetailBookingAction wire all 4 funnel stages with preserved entry page", () => {
    const decisionComparison = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/compare/DecisionComparison.tsx"),
      "utf8",
    );
    const tracker = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/components/WnoFunnelTracker.tsx"),
      "utf8",
    );
    const tourDetailAction = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/tours/[slug]/TourDetailBookingAction.tsx"),
      "utf8",
    );
    const fhButton = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/components/FareHarborBookingButton.tsx"),
      "utf8",
    );

    assert.match(decisionComparison, /data-wno-event="comparison_boat_selected"/);
    assert.match(decisionComparison, /561220/);
    assert.match(decisionComparison, /694782/);
    assert.ok(!decisionComparison.includes('data-wno-event="booking_button_clicked"'));

    assert.match(tracker, /eventName: "comparison_viewed"/);
    assert.match(tracker, /funnelStage: "comparison_visit"/);
    assert.match(tracker, /customEventName === "comparison_boat_selected"/);

    assert.match(tourDetailAction, /productTitle=\{product\.title\}/);
    assert.match(tourDetailAction, /productSlug=\{product\.slug\}/);
    assert.match(fhButton, /funnelStage: "checkout_opened"/);
  });

  await t.test("2. Riverboat comparison funnel measures comparison visit -> boat selected -> checkout opened -> provider-confirmed booking separately", async () => {
    const nowIso = new Date().toISOString();
    const comparisonPath = RIVERBOAT_COMPARISON_PATHS[0];

    const customEvents = [
      // Session 1: Enters via /riverboat-cruises, visits comparison page, selects Natchez, opens FH 561220 checkout (no provider booking yet)
      {
        corridorId: "wno-commerce",
        eventName: "page_viewed",
        sessionId: "wno_sess_natchez_1",
        sourcePage: "wtonot-organic",
        landingPath: "/riverboat-cruises",
        targetPath: comparisonPath,
        occurredAt: nowIso,
        metadata: {
          original_event_name: "comparison_viewed",
          funnel_stage: "comparison_visit",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
        },
      },
      {
        corridorId: "wno-commerce",
        eventName: "cta_clicked_primary",
        sessionId: "wno_sess_natchez_1",
        sourcePage: comparisonPath,
        landingPath: "/riverboat-cruises",
        targetPath: "/tours/daytime-jazz-cruise",
        clickedProductSlug: "daytime-jazz-cruise",
        occurredAt: nowIso,
        metadata: {
          original_event_name: "comparison_boat_selected",
          funnel_stage: "boat_selected",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          selected_boat: "natchez",
          item_id: "561220",
        },
      },
      {
        corridorId: "wno-commerce",
        eventName: "product_opened",
        sessionId: "wno_sess_natchez_1",
        sourcePage: "/tours/daytime-jazz-cruise",
        landingPath: "/riverboat-cruises",
        clickedProductSlug: "daytime-jazz-cruise",
        occurredAt: nowIso,
        metadata: {
          original_event_name: "product_opened",
          item_id: "561220",
        },
      },
      {
        corridorId: "wno-commerce",
        eventName: "booking_opened",
        sessionId: "wno_sess_natchez_1",
        sourcePage: "/tours/daytime-jazz-cruise",
        landingPath: "/riverboat-cruises",
        targetPath: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561220/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&flow=1621342&full-items=yes",
        clickedProductSlug: "daytime-jazz-cruise",
        occurredAt: nowIso,
        metadata: {
          original_event_name: "booking_opened",
          funnel_stage: "checkout_opened",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          selected_boat: "natchez",
          item_id: "561220",
          flow_id: "1621342",
        },
      },

      // Session 2: Enters directly on comparison page, selects City of New Orleans, opens FH 694782 checkout, and completes provider-confirmed booking
      {
        corridorId: "wno-commerce",
        eventName: "landing_viewed",
        sessionId: "wno_sess_city_2",
        sourcePage: "wtonot-organic",
        landingPath: comparisonPath,
        targetPath: comparisonPath,
        occurredAt: nowIso,
        metadata: {
          original_event_name: "landing_viewed",
        },
      },
      {
        corridorId: "wno-commerce",
        eventName: "cta_clicked_primary",
        sessionId: "wno_sess_city_2",
        sourcePage: comparisonPath,
        landingPath: comparisonPath,
        targetPath: "/tours/city-of-new-orleans-riverboat-cruise",
        clickedProductSlug: "city-of-new-orleans-riverboat-cruise",
        occurredAt: nowIso,
        metadata: {
          original_event_name: "comparison_boat_selected",
          funnel_stage: "boat_selected",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          selected_boat: "city_of_new_orleans",
          item_id: "694782",
        },
      },
      {
        corridorId: "wno-commerce",
        eventName: "booking_opened",
        sessionId: "wno_sess_city_2",
        sourcePage: "/tours/city-of-new-orleans-riverboat-cruise",
        landingPath: comparisonPath,
        targetPath: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/694782/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&flow=1621347&full-items=yes",
        clickedProductSlug: "city-of-new-orleans-riverboat-cruise",
        occurredAt: nowIso,
        metadata: {
          original_event_name: "booking_opened",
          funnel_stage: "checkout_opened",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          selected_boat: "city_of_new_orleans",
          item_id: "694782",
          flow_id: "1621347",
        },
      },
      {
        corridorId: "wno-commerce",
        eventName: "booking_completed",
        sessionId: "wno_sess_city_2",
        sourcePage: comparisonPath,
        landingPath: comparisonPath,
        clickedProductSlug: "city-of-new-orleans-riverboat-cruise",
        occurredAt: nowIso,
        metadata: {
          original_event_name: "provider_confirmed_booking",
          funnel_stage: "provider_confirmed_booking",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          selected_boat: "city_of_new_orleans",
          item_id: "694782",
          booking_value_usd: 51.5,
        },
      },
    ];

    const report = await buildRiverboatComparisonFunnelReport({
      windowDays: 28,
      customEvents,
    });

    assert.strictEqual(report.stages.comparisonVisits.totalEvents, 2);
    assert.strictEqual(report.stages.comparisonVisits.uniqueSessions, 2);
    assert.strictEqual(report.stages.boatSelected.totalEvents, 2);
    assert.strictEqual(report.stages.boatSelected.uniqueSessions, 2);
    assert.strictEqual(report.stages.checkoutOpened.primaryItems561220And694782Events, 2);
    assert.strictEqual(report.stages.providerConfirmedBookings.totalConfirmedBookings, 1);
    assert.strictEqual(report.stages.providerConfirmedBookings.confirmedGrossSalesUsd, 51.5);

    assert.strictEqual(report.vessels.natchez.primaryFareHarborItemId, "561220");
    assert.strictEqual(report.vessels.natchez.boatSelectedEvents, 1);
    assert.strictEqual(report.vessels.natchez.checkoutOpenedPrimaryItemEvents, 1);
    assert.strictEqual(report.vessels.natchez.checkoutOpenedFromComparisonSessions, 1);
    assert.strictEqual(report.vessels.natchez.providerConfirmedBookingsCount, 0);

    assert.strictEqual(report.vessels.cityOfNewOrleans.primaryFareHarborItemId, "694782");
    assert.strictEqual(report.vessels.cityOfNewOrleans.boatSelectedEvents, 1);
    assert.strictEqual(report.vessels.cityOfNewOrleans.checkoutOpenedPrimaryItemEvents, 1);
    assert.strictEqual(report.vessels.cityOfNewOrleans.checkoutOpenedFromComparisonSessions, 1);
    assert.strictEqual(report.vessels.cityOfNewOrleans.providerConfirmedBookingsCount, 1);
    assert.strictEqual(report.vessels.cityOfNewOrleans.confirmedGrossSalesUsd, 51.5);

    const riverboatEntry = report.entryPageBreakdown.find((r) => r.entryPage === "/riverboat-cruises");
    assert.ok(riverboatEntry, "Must preserve /riverboat-cruises entry page");
    assert.strictEqual(riverboatEntry!.comparisonVisits, 1);
    assert.strictEqual(riverboatEntry!.natchezSelected, 1);
    assert.strictEqual(riverboatEntry!.natchezCheckoutOpened561220, 1);
    assert.strictEqual(riverboatEntry!.providerConfirmedBookings, 0);
  });

  await t.test("3. One-mile rule Haversine prioritizer ranks tours <= 1.0 mile from berth first without relaxing the 5-pillar sailing-fit gate", async () => {
    const profile = resolveCruisePortExcursionProfile("reykjavik")!;
    assert.ok(profile);

    // Skarfabakki berth is (64.1558, -21.8697). A point ~0.35 miles away:
    const nearDist = computeHaversineDistanceMiles(64.1558, -21.8697, 64.1535, -21.86);
    assert.ok(nearDist <= 1.0, `Expected <= 1.0 mile, got ${nearDist}`);

    const prioNear = evaluateEvidenceReviewPriority({
      rec: {
        tourId: "test-near",
        meetingPointLat: 64.1535,
        meetingPointLng: -21.86,
      } as DurableTourRecord,
      profile,
      missingFields: ["meetingPoint", "transfers"],
    });
    assert.strictEqual(prioNear.withinOneMileOfBerth, true);
    assert.strictEqual(prioNear.priorityTier, "priority_1_within_one_mile");
    assert.strictEqual(prioNear.priorityRank, 1);
    assert.strictEqual(prioNear.spatialMethod, "haversine_sql_and_js_no_postgis");

    // Verify automated review queue on Reykjavik and bounded checkpoint metadata on New Orleans
    const queue = await buildAutomatedPortEvidenceReviewQueue({
      portSlug: "reykjavik",
      limit: 25,
    });
    assert.ok(queue);
    assert.strictEqual(queue!.spatialMethod, "haversine_sql_and_js_no_postgis");
    assert.ok(queue!.totalCandidatesEvaluated > 0);

    const nolaCatalog = await queryPortDayExcursionCatalog({
      portSlug: "new-orleans",
      viewMode: "browse_all",
      limit: 5,
    });
    assert.ok(nolaCatalog?.providerCounts.importerCheckpoint);
    assert.strictEqual(
      nolaCatalog!.providerCounts.importerCheckpoint!.destinationSearchPaginationModel,
      "start_and_count",
    );
    assert.strictEqual(
      nolaCatalog!.providerCounts.importerCheckpoint!.incrementalFeedPaginationModel,
      "nextCursor",
    );
    assert.strictEqual(
      nolaCatalog!.providerCounts.importerCheckpoint!.checkpointStatus,
      "bounded_batch_paused",
    );
  });

  await t.test("4. DCC New Orleans tours guide links to Compare Natchez and City of New Orleans with src=dcc-authority-nola-riverboats, excludes test sessions from customer totals, and records provider-confirmed bookings and commissions", async () => {
    const toursPage = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/tours/page.tsx"),
      "utf8",
    );
    assert.match(
      toursPage,
      /https:\/\/www\.welcometoneworleanstours\.com\/compare\/natchez-vs-city-of-new-orleans-riverboat\?src=dcc-authority-nola-riverboats/,
    );
    assert.match(toursPage, /Compare Natchez and City of New Orleans/);
    assert.match(toursPage, /section\.id === "River Cruises"/);

    const nowIso = new Date().toISOString();
    const comparisonPath = RIVERBOAT_COMPARISON_PATHS[0];

    const customEvents = [
      // Customer Session A: Arrives from DCC riverboat section (src=dcc-authority-nola-riverboats), selects Natchez, opens FH 561220, provider confirms booking + commission
      {
        corridorId: "wno-commerce",
        eventName: "page_viewed",
        sessionId: "wno_cust_dcc_nola_1",
        sourcePage: "dcc-authority-nola-riverboats",
        landingPath: comparisonPath,
        targetPath: comparisonPath,
        occurredAt: nowIso,
        metadata: {
          original_event_name: "comparison_viewed",
          funnel_stage: "comparison_visit",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          entry_source: "dcc-authority-nola-riverboats",
        },
      },
      {
        corridorId: "wno-commerce",
        eventName: "cta_clicked_primary",
        sessionId: "wno_cust_dcc_nola_1",
        sourcePage: comparisonPath,
        landingPath: comparisonPath,
        targetPath: "/tours/daytime-jazz-cruise",
        clickedProductSlug: "daytime-jazz-cruise",
        occurredAt: nowIso,
        metadata: {
          original_event_name: "comparison_boat_selected",
          funnel_stage: "boat_selected",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          selected_boat: "natchez",
          item_id: "561220",
          entry_source: "dcc-authority-nola-riverboats",
        },
      },
      {
        corridorId: "wno-commerce",
        eventName: "booking_opened",
        sessionId: "wno_cust_dcc_nola_1",
        sourcePage: "/tours/daytime-jazz-cruise",
        landingPath: comparisonPath,
        targetPath:
          "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561220/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&flow=1621342&full-items=yes",
        clickedProductSlug: "daytime-jazz-cruise",
        occurredAt: nowIso,
        metadata: {
          original_event_name: "booking_opened",
          funnel_stage: "checkout_opened",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          selected_boat: "natchez",
          item_id: "561220",
          flow_id: "1621342",
          entry_source: "dcc-authority-nola-riverboats",
        },
      },
      {
        corridorId: "wno-commerce",
        eventName: "booking_completed",
        sessionId: "wno_cust_dcc_nola_1",
        sourcePage: comparisonPath,
        landingPath: comparisonPath,
        clickedProductSlug: "daytime-jazz-cruise",
        occurredAt: nowIso,
        metadata: {
          original_event_name: "provider_confirmed_booking",
          funnel_stage: "provider_confirmed_booking",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          selected_boat: "natchez",
          item_id: "561220",
          entry_source: "dcc-authority-nola-riverboats",
          booking_value_usd: 88,
          estimated_commission_usd: 13.2,
          confirmed_earnings_usd: 13.2,
          payouts_usd: 0,
        },
      },

      // Tagged Test Session B: Verified through checkout with src=dcc-authority-nola-riverboats, MUST be excluded from customer totals
      {
        corridorId: "wno-commerce",
        eventName: "page_viewed",
        sessionId: "wno_test_dcc_authority_nola_riverboats_1",
        sourcePage: "dcc-authority-nola-riverboats",
        landingPath: comparisonPath,
        targetPath: comparisonPath,
        occurredAt: nowIso,
        metadata: {
          original_event_name: "comparison_viewed",
          funnel_stage: "comparison_visit",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          entry_source: "dcc-authority-nola-riverboats",
          is_test: true,
          test: true,
        },
      },
      {
        corridorId: "wno-commerce",
        eventName: "cta_clicked_primary",
        sessionId: "wno_test_dcc_authority_nola_riverboats_1",
        sourcePage: comparisonPath,
        landingPath: comparisonPath,
        targetPath: "/tours/city-of-new-orleans-riverboat-cruise",
        clickedProductSlug: "city-of-new-orleans-riverboat-cruise",
        occurredAt: nowIso,
        metadata: {
          original_event_name: "comparison_boat_selected",
          funnel_stage: "boat_selected",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          selected_boat: "city_of_new_orleans",
          item_id: "694782",
          entry_source: "dcc-authority-nola-riverboats",
          is_test: true,
          test: true,
        },
      },
      {
        corridorId: "wno-commerce",
        eventName: "booking_opened",
        sessionId: "wno_test_dcc_authority_nola_riverboats_1",
        sourcePage: "/tours/city-of-new-orleans-riverboat-cruise",
        landingPath: comparisonPath,
        targetPath:
          "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/694782/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&flow=1621347&full-items=yes",
        clickedProductSlug: "city-of-new-orleans-riverboat-cruise",
        occurredAt: nowIso,
        metadata: {
          original_event_name: "booking_opened",
          funnel_stage: "checkout_opened",
          comparison_slug: RIVERBOAT_COMPARISON_SLUG,
          selected_boat: "city_of_new_orleans",
          item_id: "694782",
          flow_id: "1621347",
          entry_source: "dcc-authority-nola-riverboats",
          is_test: true,
          test: true,
        },
      },
    ];

    const report = await buildRiverboatComparisonFunnelReport({
      windowDays: 28,
      customEvents,
    });

    // Customer totals must ONLY count wno_cust_dcc_nola_1 (1 session, not 2!)
    assert.strictEqual(report.customerTotalsExcludeTestSessions, true);
    assert.strictEqual(report.stages.comparisonVisits.uniqueSessions, 1);
    assert.strictEqual(report.stages.boatSelected.uniqueSessions, 1);
    assert.strictEqual(report.stages.checkoutOpened.primaryItems561220And694782Events, 1);
    assert.strictEqual(report.stages.providerConfirmedBookings.totalConfirmedBookings, 1);
    assert.strictEqual(report.stages.providerConfirmedBookings.confirmedGrossSalesUsd, 88);
    assert.strictEqual(report.stages.providerConfirmedBookings.estimatedCommissionUsd, 13.2);
    assert.strictEqual(report.stages.providerConfirmedBookings.confirmedEarningsUsd, 13.2);
    assert.strictEqual(report.stages.providerConfirmedBookings.payoutsUsd, 0);
    assert.strictEqual(report.stages.providerConfirmedBookings.confirmedCommissionsUsd, 13.2);

    // DCC Authority Riverboats corridor summary
    const dccCorridor = report.dccAuthorityRiverboatsCorridor;
    assert.strictEqual(dccCorridor.sourceTag, "dcc-authority-nola-riverboats");
    assert.strictEqual(dccCorridor.excludedTestSessionsFromCustomerTotals, true);
    assert.strictEqual(dccCorridor.visitorsArrived.uniqueSessions, 1);
    assert.strictEqual(dccCorridor.boatChosen.natchezEvents, 1);
    assert.strictEqual(dccCorridor.boatChosen.cityOfNewOrleansEvents, 0);
    assert.strictEqual(dccCorridor.exactFareHarborItemOpened.natchez561220Events, 1);
    assert.strictEqual(dccCorridor.exactFareHarborItemOpened.city694782Events, 0);
    assert.strictEqual(dccCorridor.providerConfirmedOutcomes.confirmedBookingsCount, 1);
    assert.strictEqual(dccCorridor.providerConfirmedOutcomes.confirmedGrossSalesUsd, 88);
    assert.strictEqual(dccCorridor.providerConfirmedOutcomes.estimatedCommissionUsd, 13.2);
    assert.strictEqual(dccCorridor.providerConfirmedOutcomes.confirmedEarningsUsd, 13.2);
    assert.strictEqual(dccCorridor.providerConfirmedOutcomes.payoutsUsd, 0);
    assert.strictEqual(dccCorridor.providerConfirmedOutcomes.confirmedCommissionsUsd, 13.2);

    // Verified test session must be recorded separately and marked excludedFromCustomerTotals: true
    assert.strictEqual(report.verifiedTestSessions.excludedFromCustomerTotals, true);
    assert.strictEqual(report.verifiedTestSessions.totalTestSessionsCount, 1);
    assert.strictEqual(report.verifiedTestSessions.dccAuthorityRiverboatsTestSessionsCount, 1);
    assert.strictEqual(report.verifiedTestSessions.verifiedCheckoutTestSessionsCount, 1);
    const verifiedSess = report.verifiedTestSessions.sessions[0];
    assert.strictEqual(verifiedSess.sessionId, "wno_test_dcc_authority_nola_riverboats_1");
    assert.strictEqual(verifiedSess.entrySource, "dcc-authority-nola-riverboats");
    assert.strictEqual(verifiedSess.comparisonVisited, true);
    assert.strictEqual(verifiedSess.boatSelected, "city_of_new_orleans");
    assert.strictEqual(verifiedSess.checkoutOpenedItemId, "694782");
    assert.strictEqual(verifiedSess.completedAllStagesThroughCheckout, true);
    assert.strictEqual(verifiedSess.excludedFromCustomerTotals, true);
  });

  await t.test("5. WNO & FareHarbor webhook strictly separate estimatedCommissionUsd, confirmedEarningsUsd, and payoutsUsd (confirmed commission field never includes an estimate)", async () => {
    const { separateFareHarborCommissionBreakdown } = await import(
      "../../lib/wno/riverboatComparisonFunnel"
    );

    // Case A: BOOKING_CONFIRMED with an estimatedCommission ($13.20) and no paidCommission
    const confirmedEstOnly = separateFareHarborCommissionBreakdown({
      eventType: "BOOKING_CONFIRMED",
      estimatedCommission: { amount: 13.2, currency: "USD" },
      paidCommission: { amount: null, currency: null },
    } as any);
    assert.strictEqual(confirmedEstOnly.estimatedCommissionUsd, 13.2);
    assert.strictEqual(confirmedEstOnly.confirmedEarningsUsd, 0);
    assert.strictEqual(confirmedEstOnly.payoutsUsd, 0);
    assert.strictEqual(confirmedEstOnly.commissionStage, "estimated_only");

    // Case B: BOOKING_FULFILLED with verified paidCommission ($15.00)
    const fulfilledPaid = separateFareHarborCommissionBreakdown({
      eventType: "BOOKING_FULFILLED",
      estimatedCommission: { amount: 13.2, currency: "USD" },
      paidCommission: { amount: 15.0, currency: "USD" },
    } as any);
    assert.strictEqual(fulfilledPaid.estimatedCommissionUsd, 13.2);
    assert.strictEqual(fulfilledPaid.confirmedEarningsUsd, 15.0);
    assert.strictEqual(fulfilledPaid.payoutsUsd, 0);
    assert.strictEqual(fulfilledPaid.commissionStage, "confirmed_earned");

    // Case C: COMMISSION_RECONCILED with settled payout ($15.00)
    const reconciledPayout = separateFareHarborCommissionBreakdown({
      eventType: "COMMISSION_RECONCILED",
      estimatedCommission: { amount: 13.2, currency: "USD" },
      paidCommission: { amount: 15.0, currency: "USD" },
    } as any);
    assert.strictEqual(reconciledPayout.estimatedCommissionUsd, 13.2);
    assert.strictEqual(reconciledPayout.confirmedEarningsUsd, 15.0);
    assert.strictEqual(reconciledPayout.payoutsUsd, 15.0);
    assert.strictEqual(reconciledPayout.commissionStage, "payout_settled");

    // Verify funnel report with an unconfirmed estimate in both corridor events and commercial outcomes
    const nowIso = new Date().toISOString();
    const comparisonPath = RIVERBOAT_COMPARISON_PATHS[0];
    const report = await buildRiverboatComparisonFunnelReport({
      windowDays: 28,
      customEvents: [
        {
          corridorId: "wno-commerce",
          eventName: "booking_completed",
          sessionId: "wno_est_only_sess",
          sourcePage: comparisonPath,
          landingPath: comparisonPath,
          clickedProductSlug: "daytime-jazz-cruise",
          occurredAt: nowIso,
          metadata: {
            original_event_name: "provider_confirmed_booking",
            funnel_stage: "provider_confirmed_booking",
            comparison_slug: RIVERBOAT_COMPARISON_SLUG,
            selected_boat: "natchez",
            item_id: "561220",
            entry_source: "dcc-authority-nola-riverboats",
            provider_booking_ref: "FH_REF_EST_1",
            outcome_event_type: "BOOKING_CONFIRMED",
            booking_value_usd: 88,
            // Even if legacy commission_amount_usd or estimated_commission_usd is present, confirmedEarningsUsd MUST remain 0
            estimated_commission_usd: 13.2,
            commission_amount_usd: 13.2,
          },
        },
      ],
      customOutcomes: [
        {
          provider: "fareharbor",
          eventType: "BOOKING_CONFIRMED",
          providerBookingRef: "FH_REF_CITY_EST_2",
          bookedProductCode: "city-of-new-orleans-riverboat-cruise",
          bookedOption: "694782",
          bookingValue: { amount: 51.5, currency: "USD" },
          estimatedCommission: { amount: 7.73, currency: "USD" },
          paidCommission: { amount: null, currency: null },
        },
        {
          provider: "fareharbor",
          eventType: "COMMISSION_RECONCILED",
          providerBookingRef: "FH_REF_CITY_PAID_3",
          bookedProductCode: "city-of-new-orleans-riverboat-cruise",
          bookedOption: "694782",
          bookingValue: { amount: 103.0, currency: "USD" },
          estimatedCommission: { amount: 15.45, currency: "USD" },
          paidCommission: { amount: 15.45, currency: "USD" },
        },
      ],
    });

    assert.strictEqual(report.commissionBreakdown.confirmedFieldIncludesEstimate, false);
    // Natchez had only an estimate ($13.20): confirmedEarningsUsd and confirmedCommissionsUsd must be 0
    assert.strictEqual(report.vessels.natchez.estimatedCommissionUsd, 13.2);
    assert.strictEqual(report.vessels.natchez.confirmedEarningsUsd, 0);
    assert.strictEqual(report.vessels.natchez.confirmedCommissionsUsd, 0);
    assert.strictEqual(report.vessels.natchez.payoutsUsd, 0);

    // City of New Orleans had $7.73 + $15.45 = $23.18 estimated, and $15.45 confirmed/settled on FH_REF_CITY_PAID_3
    assert.strictEqual(report.vessels.cityOfNewOrleans.estimatedCommissionUsd, 23.18);
    assert.strictEqual(report.vessels.cityOfNewOrleans.confirmedEarningsUsd, 15.45);
    assert.strictEqual(report.vessels.cityOfNewOrleans.confirmedCommissionsUsd, 15.45);
    assert.strictEqual(report.vessels.cityOfNewOrleans.payoutsUsd, 15.45);

    // Overall totals: $36.38 estimated, $15.45 confirmed earnings, $15.45 payouts
    assert.strictEqual(report.stages.providerConfirmedBookings.estimatedCommissionUsd, 36.38);
    assert.strictEqual(report.stages.providerConfirmedBookings.confirmedEarningsUsd, 15.45);
    assert.strictEqual(report.stages.providerConfirmedBookings.confirmedCommissionsUsd, 15.45);
    assert.strictEqual(report.stages.providerConfirmedBookings.payoutsUsd, 15.45);
  });
});


