import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCruisePromenadeCoordinationHref,
  collectForbiddenPiiKeys,
  extractNonPiiAttribution,
  formatAttributionSummaryLine,
  stripPrivateParamsFromSearch,
} from "@/lib/dcc/commercialAttribution";
import {
  getUnifiedOperatorInbox,
  type RawFindingRowInput,
  type RawJfdWaitlistRowInput,
} from "@/lib/dcc/operatorInbox";
import { POST as specialistInquiriesPost } from "@/app/api/internal/specialist-inquiries/route";

test("107a. Non-PII attribution scrubber preserves source/campaign/sailing/port and strips private traveler data", () => {
  const dirtySearch =
    "?ship=Discovery+Princess&sailDate=2027-07-14&port=juneau&arrival=07:00&allAboard=16:00&partySize=4&utm_source=cruisepromenade&utm_medium=referral&utm_campaign=cp_juneau_glacier_preview&source=cruisepromenade.com&guestEmail=secret.traveler%40example.org&cabinNumber=C714&shareCode=GRP-9981&plannerToken=tok_live_secret&weights=185,210";

  const { cleanSearch, strippedKeys } = stripPrivateParamsFromSearch(dirtySearch);
  assert.equal(cleanSearch.includes("secret.traveler"), false);
  assert.equal(cleanSearch.includes("C714"), false);
  assert.equal(cleanSearch.includes("GRP-9981"), false);
  assert.equal(cleanSearch.includes("tok_live_secret"), false);
  assert.equal(cleanSearch.includes("185"), false);
  assert.equal(cleanSearch.includes("ship=Discovery+Princess"), true);
  assert.equal(cleanSearch.includes("utm_campaign=cp_juneau_glacier_preview"), true);
  assert.deepEqual(
    strippedKeys.sort(),
    ["cabinNumber", "guestEmail", "plannerToken", "shareCode", "weights"].sort(),
  );

  const params = new URLSearchParams(dirtySearch);
  const attribution = extractNonPiiAttribution(params, {
    specialistSite: "juneauflightdeck.com",
    defaultPortSlug: "juneau",
    landingPath: "/juneau-helicopter-tour-sold-out",
  });

  assert.equal(attribution.specialistSite, "juneauflightdeck.com");
  assert.equal(attribution.source, "cruisepromenade.com");
  assert.equal(attribution.utmSource, "cruisepromenade");
  assert.equal(attribution.utmMedium, "referral");
  assert.equal(attribution.utmCampaign, "cp_juneau_glacier_preview");
  assert.equal(attribution.shipName, "Discovery Princess");
  assert.equal(attribution.shipSlug, "discovery-princess");
  assert.equal(attribution.sailDate, "2027-07-14");
  assert.equal(attribution.portSlug, "juneau");
  assert.equal(attribution.partySize, 4);
  assert.equal(attribution.landingPath, "/juneau-helicopter-tour-sold-out");

  const serialized = JSON.stringify(attribution);
  assert.equal(serialized.includes("secret.traveler"), false);
  assert.equal(serialized.includes("C714"), false);
  assert.equal(serialized.includes("GRP-9981"), false);
  assert.equal(serialized.includes("tok_live_secret"), false);

  const summary = formatAttributionSummaryLine(attribution);
  assert.ok(summary);
  assert.match(summary, /specialist=juneauflightdeck\.com/);
  assert.match(summary, /source=cruisepromenade/);
  assert.match(summary, /campaign=cp_juneau_glacier_preview/);
  assert.match(summary, /sailing=Discovery Princess@2027-07-14/);
  assert.match(summary, /port=juneau/);

  assert.deepEqual(
    collectForbiddenPiiKeys({
      utm_source: "dcc",
      email: "hidden@example.com",
      stateroomNumber: "9204",
      pnr: "ABC123",
    }).sort(),
    ["email", "pnr", "stateroomNumber"].sort(),
  );
});

test("107b. Commission-neutral Cruise Promenade coordination bridge builds sailing roll-call and planner links", () => {
  const rollCallLink = buildCruisePromenadeCoordinationHref({
    shipName: "Carnival Liberty",
    sailDate: "2027-03-14",
    portSlug: "new-orleans",
    specialistSite: "welcometoneworleanstours.com",
  });
  assert.deepEqual(rollCallLink, {
    href: "https://cruisepromenade.com/roll-call/carnival-liberty/2027-03-14?utm_source=welcometoneworleanstours&utm_medium=specialist_return&utm_campaign=group_coordination_return&port=new-orleans",
    isExactSailingRollCall: true,
  });

  const fallbackPlannerLink = buildCruisePromenadeCoordinationHref({
    portSlug: "juneau",
    specialistSite: "juneauflightdeck.com",
  });
  assert.deepEqual(fallbackPlannerLink, {
    href: "https://cruisepromenade.com/planner?utm_source=juneauflightdeck&utm_medium=specialist_return&utm_campaign=group_coordination_return&port=juneau",
    isExactSailingRollCall: false,
  });
});

test("107c. /api/internal/specialist-inquiries validates input, scrubs attribution PII, and isolates preview traffic", async () => {
  const prevIsolated = process.env.DCC_ISOLATED_TEST_DB;
  process.env.DCC_ISOLATED_TEST_DB = "1";

  try {
    const badChannelRes = await specialistInquiriesPost(
      new Request("https://destinations-cc-preview.vercel.app/api/internal/specialist-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "unknown-channel",
          name: "Test Traveler",
          email: "traveler@example.com",
        }),
      }),
    );
    assert.equal(badChannelRes.status, 400);

    const validPreviewRes = await specialistInquiriesPost(
      new Request("https://destinations-cc-preview.vercel.app/api/internal/specialist-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "destinations-cc-preview.vercel.app",
        },
        body: JSON.stringify({
          channel: "welcometoneworleanstours-inquiry",
          submissionId: "WNO-UNIT-107C",
          name: "Preview Traveler",
          email: "preview.traveler@gmail.com",
          partySize: 6,
          headline: "NOLA Pre-Cruise Concierge — Carnival Liberty",
          sourcePath: "/guides/things-to-do-before-a-cruise-new-orleans",
          attribution: {
            utm_source: "cruisepromenade",
            utm_campaign: "cp_nola_precruise_preview",
            source: "cruisepromenade.com",
            shipName: "Carnival Liberty",
            sailDate: "2027-03-14",
            port: "new-orleans",
            partySize: 6,
            cabinNumber: "MUST_NOT_LEAK_9241",
            guestEmail: "MUST_NOT_LEAK@secret.example",
          },
        }),
      }),
    );

    assert.equal(validPreviewRes.status, 200);
    const body = (await validPreviewRes.json()) as {
      ok: boolean;
      persisted: boolean;
      environment: string;
      isTest: boolean;
      attribution: Record<string, unknown>;
    };
    assert.equal(body.ok, true);
    assert.equal(body.persisted, true);
    assert.equal(body.environment, "preview");
    assert.equal(body.isTest, true);

    const attrJson = JSON.stringify(body.attribution);
    assert.equal(attrJson.includes("MUST_NOT_LEAK"), false);
    assert.equal(body.attribution.specialistSite, "welcometoneworleanstours.com");
    assert.equal(body.attribution.utmCampaign, "cp_nola_precruise_preview");
    assert.equal(body.attribution.shipSlug, "carnival-liberty");
  } finally {
    if (prevIsolated === undefined) {
      delete process.env.DCC_ISOLATED_TEST_DB;
    } else {
      process.env.DCC_ISOLATED_TEST_DB = prevIsolated;
    }
  }
});

test("107d. Unified Operator Inbox surfaces specialist attribution, separates preview/seed fixtures, and retains genuine JFD leads", async () => {
  const findingsOverride: RawFindingRowInput[] = [
    {
      finding_id:
        "control-map:transactional-submission:preview:welcometoneworleanstours-inquiry:WNO-PREV-001",
      source_system: "transactional_submission",
      finding_type: "welcometoneworleanstours-inquiry",
      severity: "info",
      status: "captured",
      entity_type: "submission",
      entity_key: "WNO-PREV-001",
      title: "welcometoneworleanstours-inquiry submission WNO-PREV-001",
      summary: "NOLA Same-Day Embarkation Concierge — Carnival Liberty",
      evidence_refs: [],
      metadata: {
        submissionId: "WNO-PREV-001",
        channel: "welcometoneworleanstours-inquiry",
        environment: "preview",
        namespace: "preview",
        isTest: true,
        name: "Preview Cruise Coordinator",
        email: "coordinator@gmail.com",
        partySize: 6,
        headline: "NOLA Same-Day Embarkation Concierge — Carnival Liberty",
        dates: "2027-03-14",
        routeOrLocation: "Carnival Liberty · Erato Street Cruise Terminal",
        sourcePath: "/guides/things-to-do-before-a-cruise-new-orleans",
        attribution: {
          specialistSite: "welcometoneworleanstours.com",
          sourceSite: "cruisepromenade.com",
          utmSource: "cruisepromenade",
          utmMedium: "referral",
          utmCampaign: "cp_nola_precruise_preview",
          shipName: "Carnival Liberty",
          shipSlug: "carnival-liberty",
          sailDate: "2027-03-14",
          portSlug: "new-orleans",
          partySize: 6,
          strippedPrivateKeys: ["cabinNumber"],
        },
      },
      created_at: "2026-11-10T20:00:00.000Z",
      updated_at: "2026-11-10T20:00:00.000Z",
    },
  ];

  const jfdWaitlistOverride: RawJfdWaitlistRowInput[] = [
    {
      id: "JFD-SCAN-JUL14-48291",
      name: "Demo Seed Row",
      email: "seed.traveler@gmail.com",
      phone: "(206) 555-0194",
      cruise_line: "Princess Cruises",
      ship_name: "Discovery Princess",
      port_city: "juneau",
      port_date: "2026-07-14",
      juneau_date: "2026-07-14",
      skagway_date: null,
      tour_type: "dog_sledding",
      party_size: 4,
      booking_mode: "instant_hold",
      status: "active_scanning",
      notes: "Seed demo fixture",
      estimated_value: 2596,
      is_test: false,
      created_at: "2026-10-05T12:00:00.000Z",
      raw_entry: {},
    },
    {
      id: "JFD-SCAN-MVIB0LBA-77420",
      name: "Real Summer Passenger",
      email: "summer2027.passenger@gmail.com",
      phone: "(303) 442-8891",
      cruise_line: "Princess Cruises",
      ship_name: "Royal Princess",
      port_city: "both",
      port_date: "2027-05-17",
      juneau_date: "2027-05-17",
      skagway_date: "2027-05-18",
      tour_type: "dog_sledding",
      party_size: 4,
      booking_mode: "instant_alert",
      status: "active_scanning",
      notes: "Looking for 4 seats on snow dog sledding in Juneau or Skagway.",
      estimated_value: 2596,
      is_test: false,
      created_at: "2026-10-21T18:30:00.000Z",
      raw_entry: { sourcePage: "/juneau-helicopter-tour-sold-out" },
    },
  ];

  const genuineInbox = await getUnifiedOperatorInbox({
    view: "genuine",
    findingsOverride,
    argoLegacyOverride: [],
    jfdWaitlistOverride,
    cpFetchOverride: async () =>
      new Response(JSON.stringify({ ok: true, items: [] }), { status: 200 }),
  });

  assert.equal(genuineInbox.items.length, 1);
  assert.equal(genuineInbox.items[0]?.sourceId, "JFD-SCAN-MVIB0LBA-77420");
  assert.equal(genuineInbox.items[0]?.sourceSite, "juneauflightdeck");
  assert.equal(genuineInbox.items[0]?.classification, "genuine");
  assert.equal(genuineInbox.items[0]?.attribution?.shipSlug, "royal-princess");

  const testInbox = await getUnifiedOperatorInbox({
    view: "test",
    findingsOverride,
    argoLegacyOverride: [],
    jfdWaitlistOverride,
    cpFetchOverride: async () =>
      new Response(JSON.stringify({ ok: true, items: [] }), { status: 200 }),
  });

  assert.equal(testInbox.items.length, 2);
  const wnoItem = testInbox.items.find(
    (item) => item.sourceSite === "welcometoneworleanstours",
  );
  assert.ok(wnoItem);
  assert.equal(wnoItem.attribution?.utmCampaign, "cp_nola_precruise_preview");
  assert.deepEqual(wnoItem.attribution?.strippedPrivateKeys, ["cabinNumber"]);

  const seedJfdItem = testInbox.items.find(
    (item) => item.sourceId === "JFD-SCAN-JUL14-48291",
  );
  assert.ok(seedJfdItem);
  assert.equal(seedJfdItem.classification, "test");
  assert.equal(seedJfdItem.classificationReason, "seed_demo_fixture");
});
