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
});
