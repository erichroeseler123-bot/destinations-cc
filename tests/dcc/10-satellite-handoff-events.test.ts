import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {
  SATELLITE_STORAGE_ROOT,
  appendSatelliteEvent,
  buildDccReturnUrl,
  buildParrHandoffHref,
  findSatelliteHandoffSummary,
  verifySatelliteWebhookToken,
} from "@/lib/dcc/satelliteHandoffs";
import {
  getColoradoTransferRecommendationActions,
  getHandoffAnalyticsSnapshot,
  getPortRecommendationActions,
  getRedRocksRecommendationActions,
} from "@/lib/dcc/handoffAnalytics";

test("satellite handoff events persist a summary keyed by handoff id", () => {
  const handoffId = `test-handoff-${Date.now()}`;
  const summaryPath = path.join(
    process.cwd(),
    "data",
    "handoffs",
    "satellites",
    "welcome-to-alaska",
    "by-handoff",
    `${handoffId}.json`
  );

  if (fs.existsSync(summaryPath)) {
    fs.unlinkSync(summaryPath);
  }

  appendSatelliteEvent({
    handoffId,
    satelliteId: "welcome-to-alaska",
    eventType: "booking_started",
    source: "wta",
    sourcePath: "/handoff/dcc",
    status: "in_progress",
    stage: "checkout",
    externalReference: "wta-order-123",
    traveler: {
      email: "traveler@example.com",
      partySize: 2,
    },
    booking: {
      portSlug: "juneau",
      eventDate: "2026-07-01",
      currency: "USD",
      amount: 249,
    },
  });

  const summary = findSatelliteHandoffSummary(handoffId);
  assert.ok(summary);
  assert.equal(summary?.satelliteId, "welcome-to-alaska");
  assert.equal(summary?.latestEventType, "booking_started");
  assert.equal(summary?.latestStatus, "in_progress");
  assert.equal(summary?.booking.portSlug, "juneau");
  assert.equal(summary?.traveler.email, "traveler@example.com");
  assert.equal(summary?.eventCount, 1);
});

test("satellite webhook verification uses specific token before shared token", () => {
  process.env.DCC_SATELLITE_WEBHOOK_TOKEN = "shared-token";
  process.env.DCC_WTA_WEBHOOK_TOKEN = "wta-token";
  process.env.DCC_SAVEONTHESTRIP_WEBHOOK_TOKEN = "sots-token";
  process.env.DCC_REDROCKSFASTPASS_WEBHOOK_TOKEN = "rrfp-token";

  assert.equal(verifySatelliteWebhookToken("welcome-to-alaska", "wta-token"), true);
  assert.equal(verifySatelliteWebhookToken("welcome-to-alaska", "shared-token"), false);
  assert.equal(verifySatelliteWebhookToken("gosno", "shared-token"), true);
  assert.equal(verifySatelliteWebhookToken("saveonthestrip", "sots-token"), true);
  assert.equal(verifySatelliteWebhookToken("saveonthestrip", "shared-token"), false);
  assert.equal(verifySatelliteWebhookToken("redrocksfastpass", "rrfp-token"), true);
  assert.equal(verifySatelliteWebhookToken("redrocksfastpass", "shared-token"), false);

  delete process.env.DCC_SATELLITE_WEBHOOK_TOKEN;
  delete process.env.DCC_WTA_WEBHOOK_TOKEN;
  delete process.env.DCC_SAVEONTHESTRIP_WEBHOOK_TOKEN;
  delete process.env.DCC_REDROCKSFASTPASS_WEBHOOK_TOKEN;
});

test("save on the strip events are accepted by DCC analytics", () => {
  const handoffId = `sots-clickout-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "saveonthestrip",
    eventType: "ticket_clickout",
    source: "saveonthestrip",
    sourcePath: "/shows/sphere",
    status: "clickout",
    stage: "ticket_affiliate",
    attribution: {
      sourcePage: "/shows/sphere",
      sourceSlug: "saveonthestrip-sphere",
      topicSlug: "sphere-shows",
    },
    booking: {
      citySlug: "las-vegas",
      eventDate: "2026-08-01",
    },
    metadata: {
      affiliateTarget: "ticketmaster",
      eventName: "Wizard of Oz at Sphere",
    },
  });

  const summary = findSatelliteHandoffSummary(handoffId);
  assert.ok(summary);
  assert.equal(summary?.satelliteId, "saveonthestrip");
  assert.equal(summary?.latestEventType, "ticket_clickout");

  const snapshot = getHandoffAnalyticsSnapshot(500);
  assert.ok(snapshot.bySatellite.saveonthestrip >= 1);
});

test("satellite handoff storage root stays writable in production runtimes", () => {
  if (process.env.VERCEL) {
    assert.match(SATELLITE_STORAGE_ROOT, /^\/tmp\//);
    return;
  }

  assert.match(SATELLITE_STORAGE_ROOT, /data\/handoffs\/satellites$/);
});

test("satellite handoff href includes DCC tracking and return URL", () => {
  const href = buildParrHandoffHref("/book/red-rocks-amphitheatre", {
    handoffId: "handoff-12345",
    sourceSlug: "red-rocks-amphitheatre",
    sourcePage: "/red-rocks-shuttle",
    venueSlug: "red-rocks-amphitheatre",
    eventDate: "2026-08-01",
    quantity: 2,
    returnPath: "/red-rocks-shuttle",
  });

  const url = new URL(href);
  assert.equal(url.origin, "https://www.partyatredrocks.com");
  assert.equal(url.searchParams.get("dcc_handoff_id"), "handoff-12345");
  assert.equal(url.searchParams.get("source"), "dcc");
  assert.equal(url.searchParams.get("source_page"), "/red-rocks-shuttle");
  assert.equal(url.searchParams.get("venue"), "red-rocks-amphitheatre");
  assert.equal(
    url.searchParams.get("dcc_return"),
    buildDccReturnUrl("/red-rocks-shuttle", "handoff-12345")
  );
});

test("degradation events mark summaries and analytics snapshot", () => {
  const handoffId = `degraded-handoff-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "partyatredrocks",
    eventType: "temporarily_paused",
    source: "parr",
    sourcePath: "/book/red-rocks-amphitheatre",
    status: "paused",
    stage: "capacity",
    booking: {
      venueSlug: "red-rocks-amphitheatre",
      eventDate: "2026-08-01",
    },
    attribution: {
      sourcePage: "/red-rocks-shuttle",
    },
  });

  const summary = findSatelliteHandoffSummary(handoffId);
  assert.ok(summary);
  assert.equal(summary?.degraded, true);
  assert.equal(summary?.latestEventType, "temporarily_paused");

  const snapshot = getHandoffAnalyticsSnapshot(500);
  assert.ok(snapshot.degraded >= 1);
  assert.ok(snapshot.degradedContexts.some((row) => row.key === "venue:red-rocks-amphitheatre"));
});

test("red rocks recommendations promote fallback pages during partner degradation", () => {
  const handoffId = `red-rocks-fallback-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "partyatredrocks",
    eventType: "inventory_unavailable",
    source: "parr",
    sourcePath: "/book/red-rocks-amphitheatre",
    status: "sold_out",
    stage: "capacity",
    booking: {
      venueSlug: "red-rocks-amphitheatre",
      eventDate: "2026-08-02",
    },
    attribution: {
      sourcePage: "/red-rocks-shuttle",
    },
  });

  const actions = getRedRocksRecommendationActions();
  assert.equal(actions[0]?.id, "compare-rides");
  assert.equal(actions[0]?.laneState, "fallback");
  assert.equal(actions.find((action) => action.id === "book-shuttle")?.laneState, "degraded");
});

test("colorado transfer recommendations promote DCC fallback during gosno degradation", () => {
  const handoffId = `gosno-fallback-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "gosno",
    eventType: "temporarily_paused",
    source: "gosno",
    sourcePath: "/denver-to-vail-shuttle",
    status: "paused",
    stage: "ops",
    booking: {
      citySlug: "vail",
      eventDate: "2026-12-20",
    },
    attribution: {
      sourcePage: "/transportation/colorado/denver-to-vail-shuttle-guide",
      topicSlug: "ski-transfers",
    },
  });

  const actions = getColoradoTransferRecommendationActions();
  assert.equal(actions[0]?.id, "corridor-guide");
  assert.equal(actions[0]?.laneState, "fallback");
  assert.equal(actions.find((action) => action.id === "gosno-execution")?.laneState, "degraded");
});

test("partner handoff events persist partner timeline context", () => {
  const handoffId = `partner-forward-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "welcome-to-alaska",
    eventType: "forwarded_to_partner",
    source: "wta",
    sourcePath: "/checkout/success",
    status: "forwarded",
    stage: "partner_handoff",
    traveler: {
      email: "traveler@example.com",
      name: "Jane Traveler",
    },
    partner: {
      fromSite: "welcome-to-alaska",
      toSite: "partyatredrocks",
      partnerHandoffId: handoffId,
      reason: "traveler_reuse",
    },
  });

  const summary = findSatelliteHandoffSummary(handoffId);
  assert.ok(summary);
  assert.equal(summary?.latestEventType, "forwarded_to_partner");
  assert.equal(summary?.partner.fromSite, "welcome-to-alaska");
  assert.equal(summary?.partner.toSite, "partyatredrocks");
  assert.equal(summary?.partner.partnerHandoffId, handoffId);
  assert.equal(summary?.partner.reason, "traveler_reuse");
});

test("wta to parr partner loop influences DCC port routing analytics", () => {
  const handoffId = `wta-parr-loop-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "partyatredrocks",
    eventType: "partner_booking_completed",
    source: "parr",
    sourcePath: "/checkout/success",
    status: "booked",
    stage: "partner_confirmed",
    booking: {
      portSlug: "juneau-alaska",
      venueSlug: "red-rocks-amphitheatre",
      eventDate: "2026-08-01",
      quantity: 2,
      currency: "USD",
      amount: 120,
    },
    attribution: {
      sourcePage: "/handoff/partner/partyatredrocks",
      topicSlug: "concert-transport",
    },
    partner: {
      fromSite: "welcome-to-alaska",
      toSite: "partyatredrocks",
      partnerHandoffId: handoffId,
      reason: "traveler_reuse",
    },
  });

  const snapshot = getHandoffAnalyticsSnapshot(500);
  assert.ok(snapshot.partnerCompleted >= 1);
  assert.ok(snapshot.byPartnerRoute.some((row) => row.key === "welcome-to-alaska->partyatredrocks"));

  const actions = getPortRecommendationActions("juneau-alaska");
  const execution = actions.find((action) => action.id === "wta-execution");
  assert.ok(execution);
  assert.match(
    execution?.reason || "",
    /(WTA to PARR downstream outcomes|not being fully accepted downstream)/i
  );
});

test("widget attribution analytics expose origins, embeds, winners, and leakage", () => {
  const base = `widget-analytics-${Date.now()}`;

  appendSatelliteEvent({
    handoffId: `${base}-good`,
    satelliteId: "welcome-to-alaska",
    eventType: "booking_completed",
    source: "wta",
    sourcePath: "/widget/checkout/success",
    status: "booked",
    stage: "confirmed",
    attribution: {
      sourcePage: "/cruises/port/juneau-alaska",
      sourceSlug: "dcc-cruises-port",
      topicSlug: "shore-excursions",
    },
    booking: {
      portSlug: "juneau-alaska",
      productSlug: "juneau-helicopter-glacier-tour",
      eventDate: "2026-07-12",
      quantity: 4,
      currency: "USD",
      amount: 899,
    },
    metadata: {
      embedDomain: "friendsite.com",
      embedPath: "/alaska-excursions",
      widgetPlacement: "sidebar",
      widgetId: "wta-juneau-1",
    },
  });

  appendSatelliteEvent({
    handoffId: `${base}-weak`,
    satelliteId: "welcome-to-alaska",
    eventType: "handoff_viewed",
    source: "wta",
    sourcePath: "/widget",
    status: "received",
    stage: "landing",
    attribution: {
      sourcePage: "/cruises/port/skagway-alaska",
      sourceSlug: "dcc-cruises-port",
      topicSlug: "shore-excursions",
    },
    booking: {
      portSlug: "skagway-alaska",
      productSlug: "skagway-rail-pass",
      eventDate: "2026-07-13",
    },
    metadata: {
      embedDomain: "weaksite.com",
      embedPath: "/travel/sidebar",
      widgetPlacement: "sidebar",
      widgetId: "wta-skagway-1",
    },
  });

  appendSatelliteEvent({
    handoffId: `${base}-started`,
    satelliteId: "welcome-to-alaska",
    eventType: "booking_started",
    source: "wta",
    sourcePath: "/widget",
    status: "in_progress",
    stage: "checkout",
    attribution: {
      sourcePage: "/cruises/port/skagway-alaska",
      sourceSlug: "dcc-cruises-port",
      topicSlug: "shore-excursions",
    },
    booking: {
      portSlug: "skagway-alaska",
      productSlug: "skagway-rail-pass",
      eventDate: "2026-07-13",
      quantity: 2,
    },
    metadata: {
      embedDomain: "weaksite.com",
      embedPath: "/travel/sidebar",
      widgetPlacement: "sidebar",
      widgetId: "wta-skagway-1",
    },
  });

  appendSatelliteEvent({
    handoffId: `${base}-failed`,
    satelliteId: "welcome-to-alaska",
    eventType: "booking_failed",
    source: "wta",
    sourcePath: "/widget/checkout",
    status: "failed",
    stage: "checkout",
    attribution: {
      sourcePage: "/cruises/port/skagway-alaska",
      sourceSlug: "dcc-cruises-port",
      topicSlug: "shore-excursions",
    },
    booking: {
      portSlug: "skagway-alaska",
      productSlug: "skagway-rail-pass",
      eventDate: "2026-07-13",
    },
    metadata: {
      embedDomain: "weaksite.com",
      embedPath: "/travel/sidebar",
      widgetPlacement: "sidebar",
      widgetId: "wta-skagway-1",
    },
  });

  const snapshot = getHandoffAnalyticsSnapshot(500);

  assert.ok(snapshot.byEmbedDomain.some((row) => row.key === "friendsite.com"));
  assert.ok(snapshot.byEmbedPath.some((row) => row.key === "/alaska-excursions"));
  assert.ok(snapshot.byWidgetPlacement.some((row) => row.key === "sidebar"));
  assert.ok(snapshot.byWidgetId.some((row) => row.key === "wta-juneau-1"));
  assert.ok(
    snapshot.topOriginPages.some(
      (row) => row.key === "/cruises/port/juneau-alaska" && row.completions >= 1 && row.revenue >= 899
    )
  );
  assert.ok(
    snapshot.topConvertingEmbedDomains.some(
      (row) => row.key === "friendsite.com" && row.completions >= 1 && row.conversionRate > 0
    )
  );
  assert.ok(
    snapshot.topPlacements.some(
      (row) => row.key === "friendsite.com | /alaska-excursions | sidebar" && row.completions >= 1
    )
  );
  assert.ok(
    snapshot.weakestEmbeds.some(
      (row) => row.key === "weaksite.com | /travel/sidebar | sidebar" && row.starts >= 1 && row.leakageRate > 0
    )
  );
  assert.ok(
    snapshot.productPortWinners.some(
      (row) =>
        row.key === "juneau-helicopter-glacier-tour | juneau-alaska" &&
        row.completions >= 1 &&
        row.revenue >= 899
    )
  );
  assert.ok(
    snapshot.leakagePoints.some(
      (row) => row.key === "weaksite.com | /travel/sidebar" && row.failed >= 1 && row.leakageRate > 0
    )
  );
});

test("analytics snapshot exposes operator alerts and partner scorecards", () => {
  const handoffId = `ops-alert-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "welcome-to-alaska",
    eventType: "forwarded_to_partner",
    source: "wta",
    sourcePath: "/handoff/partner/partyatredrocks",
    status: "forwarded",
    stage: "partner_handoff",
    attribution: {
      sourcePage: "/cruises/port/juneau-alaska",
      sourceSlug: "dcc-cruises-port",
      topicSlug: "shore-excursions",
    },
    booking: {
      portSlug: "juneau-alaska",
      amount: 450,
      currency: "USD",
    },
    partner: {
      fromSite: "welcome-to-alaska",
      toSite: "partyatredrocks",
      partnerHandoffId: handoffId,
      reason: "traveler_reuse",
    },
  });

  const snapshot = getHandoffAnalyticsSnapshot(500);
  assert.ok(snapshot.urgentAlerts.some((alert) => alert.kind === "broken_loop"));
  assert.ok(
    snapshot.operatorLeakingLanes.some(
      (row) => row.key === "welcome-to-alaska->partyatredrocks" || row.key === "juneau-alaska"
    )
  );
  const wtaCard = snapshot.partnerScorecards.find((row) => row.satelliteId === "welcome-to-alaska");
  assert.ok(wtaCard);
  assert.ok((wtaCard?.forwarded || 0) >= 1);
});

test("analytics snapshot surfaces missing partner outcomes after acceptance", () => {
  const handoffId = `accepted-no-outcome-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "partyatredrocks",
    eventType: "accepted_from_partner",
    source: "parr",
    sourcePath: "/book/red-rocks-amphitheatre",
    status: "received",
    stage: "landing",
    attribution: {
      sourcePage: "/handoff/partner/partyatredrocks",
      topicSlug: "concert-transport",
    },
    booking: {
      venueSlug: "red-rocks-amphitheatre",
      eventDate: "2026-07-12",
    },
    partner: {
      fromSite: "welcome-to-alaska",
      toSite: "partyatredrocks",
      partnerHandoffId: handoffId,
      reason: "traveler_reuse",
    },
  });

  const snapshot = getHandoffAnalyticsSnapshot(500);
  assert.ok(snapshot.urgentAlerts.some((alert) => alert.kind === "missing_outcome"));
});

test("broken partner loops are surfaced and degrade port execution routing", () => {
  const handoffId = `broken-loop-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "welcome-to-alaska",
    eventType: "forwarded_to_partner",
    source: "wta",
    sourcePath: "/handoff/partner/partyatredrocks",
    status: "forwarded",
    stage: "partner_handoff",
    attribution: {
      sourcePage: "/cruises/port/juneau-alaska",
      topicSlug: "shore-excursions",
    },
    booking: {
      portSlug: "juneau-alaska",
      eventDate: "2026-07-12",
    },
    partner: {
      fromSite: "welcome-to-alaska",
      toSite: "partyatredrocks",
      partnerHandoffId: handoffId,
      reason: "traveler_reuse",
    },
  });

  const snapshot = getHandoffAnalyticsSnapshot(500);
  assert.ok(snapshot.brokenPartnerLoops.some((loop) => loop.handoffId === handoffId));

  const actions = getPortRecommendationActions("juneau-alaska");
  const execution = actions.find((action) => action.id === "wta-execution");
  assert.ok(execution);
  assert.equal(execution?.laneState, "degraded");
  assert.match(execution?.reason || "", /not being fully accepted downstream/i);
});

test("analytics snapshot exposes topic, lifecycle, and venue-port breakdowns", () => {
  const handoffId = `analytics-breakdown-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "welcome-to-alaska",
    eventType: "booking_completed",
    source: "wta",
    sourcePath: "/checkout/success",
    status: "booked",
    stage: "confirmed",
    attribution: {
      sourceSlug: "dcc-cruises-port",
      sourcePage: "/cruises/port/juneau-alaska",
      topicSlug: "shore-excursions",
    },
    booking: {
      portSlug: "juneau-alaska",
      venueSlug: "red-rocks-amphitheatre",
      eventDate: "2026-07-12",
      currency: "USD",
      amount: 899,
    },
  });

  const snapshot = getHandoffAnalyticsSnapshot(500);
  assert.ok(snapshot.byTopicSlug.some((row) => row.key === "shore-excursions"));
  assert.ok(
    snapshot.byLifecycleState.some((row) => row.key === "booking_completed | booked | confirmed")
  );
  assert.ok(snapshot.byPortSlug.some((row) => row.key === "juneau-alaska"));
  assert.ok(snapshot.byVenueSlug.some((row) => row.key === "red-rocks-amphitheatre"));
});

test("analytics snapshot exposes revenue, product, partner reason, and metadata breakdowns", () => {
  const handoffId = `analytics-revenue-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "partyatredrocks",
    eventType: "partner_booking_completed",
    source: "parr",
    sourcePath: "/checkout/success",
    status: "booked",
    stage: "partner_confirmed",
    traveler: {
      partySize: 5,
    },
    attribution: {
      sourceSlug: "wta-network-forward",
      sourcePage: "/handoff/partner/partyatredrocks",
      topicSlug: "concert-transport",
    },
    booking: {
      venueSlug: "red-rocks-amphitheatre",
      productSlug: "private-suv",
      eventDate: "2026-08-01",
      quantity: 5,
      currency: "USD",
      amount: 480,
    },
    partner: {
      fromSite: "welcome-to-alaska",
      toSite: "partyatredrocks",
      partnerHandoffId: handoffId,
      reason: "traveler_reuse",
    },
    metadata: {
      artist: "Tycho",
      event: "Tycho at Red Rocks",
    },
  });

  const snapshot = getHandoffAnalyticsSnapshot(500);
  assert.ok(snapshot.grossRevenue >= 480);
  assert.ok(snapshot.partnerRevenue >= 480);
  assert.ok(snapshot.byProductSlug.some((row) => row.key === "private-suv"));
  assert.ok(snapshot.byPartnerReason.some((row) => row.key === "traveler_reuse"));
  assert.ok(snapshot.byPartySizeBucket.some((row) => row.key === "group"));
  assert.ok(snapshot.byArtist.some((row) => row.key === "Tycho"));
  assert.ok(snapshot.byEventLabel.some((row) => row.key === "Tycho at Red Rocks"));
  assert.ok(
    snapshot.highValuePages.some(
      (row) => row.key === "/handoff/partner/partyatredrocks" && row.revenue >= 480
    )
  );
  assert.ok(
    snapshot.expansionPriorityPages.some(
      (row) => row.key === "/handoff/partner/partyatredrocks" && row.revenue >= 480
    )
  );
});

test("analytics snapshot exposes SEO source, topic, product, and hub opportunities", () => {
  const handoffId = `analytics-seo-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "welcome-to-alaska",
    eventType: "partner_booking_completed",
    source: "wta",
    sourcePath: "/checkout/success",
    status: "booked",
    stage: "partner_confirmed",
    attribution: {
      sourceSlug: "dcc-cruises-port",
      sourcePage: "/cruises/port/juneau-alaska",
      topicSlug: "shore-excursions",
    },
    booking: {
      portSlug: "juneau-alaska",
      productSlug: "whale-watch-premium",
      eventDate: "2026-07-12",
      amount: 650,
      currency: "USD",
    },
    partner: {
      fromSite: "welcome-to-alaska",
      toSite: "partyatredrocks",
      partnerHandoffId: handoffId,
      reason: "traveler_reuse",
    },
  });

  const snapshot = getHandoffAnalyticsSnapshot(500);
  assert.ok(snapshot.seoSourceSlugOpportunities.some((row) => row.key === "dcc-cruises-port"));
  assert.ok(snapshot.seoTopicOpportunities.some((row) => row.key === "shore-excursions"));
  assert.ok(snapshot.seoProductOpportunities.some((row) => row.key === "whale-watch-premium"));
  assert.ok(
    snapshot.seoHubOpportunities.some(
      (row) => row.type === "port" && row.key === "juneau-alaska"
    )
  );
});

test("analytics snapshot exposes highest-revenue product, reason, group, and hub breakdowns", () => {
  const handoffId = `analytics-highest-revenue-${Date.now()}`;
  appendSatelliteEvent({
    handoffId,
    satelliteId: "partyatredrocks",
    eventType: "partner_booking_completed",
    source: "parr",
    sourcePath: "/checkout/success",
    status: "booked",
    stage: "partner_confirmed",
    traveler: {
      partySize: 6,
    },
    attribution: {
      sourceSlug: "wta-network-forward",
      sourcePage: "/handoff/partner/partyatredrocks",
      topicSlug: "concert-transport",
    },
    booking: {
      venueSlug: "red-rocks-amphitheatre",
      portSlug: "juneau-alaska",
      productSlug: "lux-sprinter",
      eventDate: "2026-08-01",
      quantity: 6,
      amount: 1200,
      currency: "USD",
    },
    partner: {
      fromSite: "welcome-to-alaska",
      toSite: "partyatredrocks",
      partnerHandoffId: handoffId,
      reason: "cross_sell",
    },
  });

  const snapshot = getHandoffAnalyticsSnapshot(500);
  assert.ok(snapshot.revenueByProduct.some((row) => row.key === "lux-sprinter" && row.revenue >= 1200));
  assert.ok(snapshot.revenueByPartnerReason.some((row) => row.key === "cross_sell" && row.revenue >= 1200));
  assert.ok(snapshot.revenueByPartySizeBucket.some((row) => row.key === "group" && row.revenue >= 1200));
  assert.ok(
    snapshot.highRevenueHubs.some(
      (row) => row.type === "venue" && row.key === "red-rocks-amphitheatre" && row.revenue >= 1200
    )
  );
  assert.ok(
    snapshot.premiumGroupPages.some(
      (row) => row.key === "/handoff/partner/partyatredrocks" && row.revenue >= 1200
    )
  );
});
