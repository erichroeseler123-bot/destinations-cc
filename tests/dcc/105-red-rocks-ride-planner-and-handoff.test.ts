import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  getTravelReferenceNodeById,
  resolveTransportModeComparison,
} from "@/lib/dcc/travelReference";
import { evaluateRedRocksRideHomeRecheck } from "@/lib/dcc/sharedTripRecheck";
import { resolveLlmsTxtByRegionOrNodeSlug } from "@/lib/dcc/llmsManifest";
import { RED_ROCKS_CONCERT_DECISION_ENGINE } from "@/lib/dcc/decisionEngines/redRocksConcertTransportationEngine";
import { GET as getLocationResolve } from "@/app/api/public/location-resolve/route";
import {
  buildRedRocksStayingPlace,
  clearRecordedRedRocksPlannerEvents,
  evaluateRedRocksRidePlan,
  getRecordedRedRocksPlannerEvents,
  RED_ROCKS_MIKE_NOV_14_SHOW,
  RED_ROCKS_STAYING_PRESETS,
  resolveRedRocksShow,
  trackRedRocksProviderClick,
  trackRedRocksRideComparison,
} from "@/lib/dcc/redRocksRidePlanner";

test("1. Red Rocks guide and ride comparison fix outdated $65 shared shuttle, Entrance 4, and 2:00 AM claims", () => {
  const rrNode = getTravelReferenceNodeById("red-rocks");
  assert.ok(rrNode, "Expected red-rocks reference node");

  const shuttleMode = rrNode.gettingThereAndAround.modes.find(
    (m) => m.id === "rr-shuttle-transfer",
  )!;
  const parkingMode = rrNode.gettingThereAndAround.modes.find(
    (m) => m.id === "rr-driving-parking",
  )!;
  const rideshareMode = rrNode.gettingThereAndAround.modes.find(
    (m) => m.id === "rr-rideshare",
  )!;

  const shuttleComp = resolveTransportModeComparison(shuttleMode);
  const parkingComp = resolveTransportModeComparison(parkingMode);
  const rideshareComp = resolveTransportModeComparison(rideshareMode);

  // 1a. Party at Red Rocks private rides ($399 Suburban up to 6 / $599 van up to 10, subject to availability)
  assert.match(shuttleComp.pricingModel || "", /\$399 for a Suburban up to 6/);
  assert.match(shuttleComp.pricingModel || "", /\$599 for a van up to 10/);
  assert.match(shuttleComp.pricingModel || "", /subject to availability/i);
  assert.doesNotMatch(shuttleComp.pricingModel || "", /\$55–\$65|\$65/);

  // 1b. General post-show pickup at Jurassic Lot by Entrance 2
  assert.match(
    rideshareComp.egressOrTransitTiming || "",
    /Jurassic Lot by Entrance 2/,
  );
  assert.match(
    rideshareComp.statutoryOrOperationalRule || "",
    /Jurassic Lot by Entrance 2/,
  );
  assert.doesNotMatch(
    rideshareComp.egressOrTransitTiming || "",
    /Entrance 4 on Hwy 93/,
  );

  // 1c. Overnight vehicles moved before 10:00 a.m. the next day
  assert.match(
    parkingComp.statutoryOrOperationalRule || "",
    /before 10:00 a\.m\. the next day/i,
  );
  assert.doesNotMatch(
    parkingComp.statutoryOrOperationalRule || "",
    /past 2:00 AM/i,
  );

  // 1d. Shared trip recheck & /red-rocks/llms.txt & decision engine align
  const recheck = evaluateRedRocksRideHomeRecheck({
    date: "2026-11-14",
    eventName: "mike.",
    partySize: 6,
  });
  assert.equal(
    recheck.venuePickupRules.rideshareGeofenceLot,
    "Jurassic Lot by Entrance 2",
  );
  assert.equal(
    recheck.venuePickupRules.overnightVehicleDeadline,
    "Before 10:00 a.m. the next day",
  );
  assert.match(recheck.recheckCard.whatStillFits, /\$399 for a Suburban up to 6/);
  assert.match(recheck.recheckCard.whatStillFits, /\$599 for a van up to 10/);
  assert.doesNotMatch(recheck.recheckCard.whatStillFits, /\$65/);

  const llms = resolveLlmsTxtByRegionOrNodeSlug("red-rocks") || "";
  assert.match(llms, /Jurassic Lot by Entrance 2/);
  assert.match(llms, /before 10:00 a\.m\. the next day/i);
  assert.match(llms, /\$399 for a Suburban up to 6/);
  assert.match(llms, /\$599 for a van up to 10/);
  assert.doesNotMatch(llms, /past \*\*2:00 AM\*\*/);

  const selfDriveOption = RED_ROCKS_CONCERT_DECISION_ENGINE.candidateOptions.find(
    (o) => o.optionId === "rr-self-drive-general-parking-free",
  )!;
  assert.match(
    selfDriveOption.transportationAvailability.selfDriveParkingNote || "",
    /before 10:00 a\.m\. the next day/,
  );
});

test("2. Nov. 14 mike. show uses official venue time (Doors 6:00 p.m., Showtime 7:15 p.m.) and keeps show time and pickup time separate", () => {
  const show = resolveRedRocksShow({
    artist: "mike.",
    date: "2026-11-14",
    event: "rr-2026-11-14-mike",
  });

  assert.equal(show.artist, "mike.");
  assert.equal(show.date, "2026-11-14");
  assert.equal(show.venueDoorsLocal, "18:00");
  assert.equal(show.venueDoorsDisplay, "6:00 p.m.");
  assert.equal(show.venueShowtimeLocal, "19:15");
  assert.equal(show.venueShowtimeDisplay, "7:15 p.m.");
  assert.equal(show.parrListingTimeDisplay, "7:00 p.m.");
  assert.equal(
    show.officialEventUrl,
    "https://www.redrocksonline.com/events/mike-1239116/",
  );

  const plan = evaluateRedRocksRidePlan({
    show,
    partySize: 6,
  });

  assert.equal(plan.scheduleSeparation.usesVenueTime, true);
  assert.equal(plan.scheduleSeparation.showTimeAndPickupTimeSeparate, true);
  assert.equal(plan.scheduleSeparation.venueDoorsDisplay, "6:00 p.m.");
  assert.equal(plan.scheduleSeparation.venueShowtimeDisplay, "7:15 p.m.");
  assert.equal(plan.scheduleSeparation.parrListingTimeDisplay, "7:00 p.m.");
  assert.match(
    plan.scheduleSeparation.pickupDeadlineInstruction,
    /pickup deadline/i,
  );
});

test("3. DCC location lookup prioritizes Denver/Colorado places and computes labeled straight-line distance to Red Rocks", async () => {
  const req = new NextRequest(
    "https://www.destinationcommandcenter.com/api/public/location-resolve?q=Sheraton+Denver+Downtown&bias=denver",
  );
  const res = await getLocationResolve(req);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.ok(Array.isArray(body.results) && body.results.length >= 1);
  const top = body.results[0];
  assert.equal(top.region, "Colorado");
  assert.ok(typeof top.lat === "number" && typeof top.lng === "number");

  const staying = buildRedRocksStayingPlace({
    id: top.id,
    name: top.name,
    displayName: top.displayName,
    city: top.city,
    region: top.region,
    lat: top.lat,
    lng: top.lng,
    source: "search",
  });
  assert.ok(staying.straightLineMilesToRedRocks > 10 && staying.straightLineMilesToRedRocks < 20);
  assert.match(staying.straightLineDistanceLabel, /straight-line distance/i);
});

test("4. Proves handoff for groups of 6 ($399 Suburban) and 8 ($599 Van), verifies populated arrival fields, and tracks ride comparison and provider click separately", () => {
  clearRecordedRedRocksPlannerEvents();

  const stayingSheraton = buildRedRocksStayingPlace({
    ...RED_ROCKS_STAYING_PRESETS[1],
    source: "preset",
  });

  // Group of 6
  const plan6 = evaluateRedRocksRidePlan({
    show: RED_ROCKS_MIKE_NOV_14_SHOW,
    staying: stayingSheraton,
    partySize: 6,
  });

  assert.equal(plan6.partySize, 6);
  assert.equal(plan6.parrRecommendation.vehicleType, "suburban");
  assert.equal(plan6.parrRecommendation.publishedPriceUsd, 399);
  assert.equal(plan6.parrRecommendation.maxCapacityPerVehicle, 6);
  assert.equal(plan6.parrRecommendation.perPersonUsd, 66.5);
  assert.equal(plan6.parrRecommendation.subjectToAvailability, true);

  const url6 = new URL(plan6.handoff.privateOverviewUrl);
  assert.equal(url6.origin, "https://www.partyatredrocks.com");
  assert.equal(url6.pathname, "/book/red-rocks-amphitheatre/private");
  assert.equal(url6.searchParams.get("artist"), "mike.");
  assert.equal(url6.searchParams.get("date"), "2026-11-14");
  assert.equal(url6.searchParams.get("event"), "rr-2026-11-14-mike");
  assert.equal(url6.searchParams.get("qty"), "1");
  assert.equal(url6.searchParams.get("partySize"), "6");
  assert.equal(url6.searchParams.get("vehicle"), "suburban");

  const directUrl6 = new URL(plan6.handoff.directVehicleOptionUrl);
  assert.equal(
    directUrl6.pathname,
    "/book/red-rocks-amphitheatre/private/suv",
  );

  // Group of 8
  const plan8 = evaluateRedRocksRidePlan({
    show: RED_ROCKS_MIKE_NOV_14_SHOW,
    staying: stayingSheraton,
    partySize: 8,
  });

  assert.equal(plan8.partySize, 8);
  assert.equal(plan8.parrRecommendation.vehicleType, "van");
  assert.equal(plan8.parrRecommendation.publishedPriceUsd, 599);
  assert.equal(plan8.parrRecommendation.maxCapacityPerVehicle, 10);
  assert.equal(plan8.parrRecommendation.perPersonUsd, 74.88);
  assert.equal(plan8.parrRecommendation.subjectToAvailability, true);

  const url8 = new URL(plan8.handoff.privateOverviewUrl);
  assert.equal(url8.origin, "https://www.partyatredrocks.com");
  assert.equal(url8.pathname, "/book/red-rocks-amphitheatre/private");
  assert.equal(url8.searchParams.get("artist"), "mike.");
  assert.equal(url8.searchParams.get("date"), "2026-11-14");
  assert.equal(url8.searchParams.get("event"), "rr-2026-11-14-mike");
  assert.equal(url8.searchParams.get("qty"), "1");
  assert.equal(url8.searchParams.get("partySize"), "8");
  assert.equal(url8.searchParams.get("vehicle"), "van");

  const directUrl8 = new URL(plan8.handoff.directVehicleOptionUrl);
  assert.equal(
    directUrl8.pathname,
    "/book/red-rocks-amphitheatre/private/van",
  );

  // Verify field population audit
  const artistAudit = plan8.handoff.fieldsAudit.find(
    (f) => f.queryParam === "artist",
  )!;
  const dateAudit = plan8.handoff.fieldsAudit.find(
    (f) => f.queryParam === "date",
  )!;
  const qtyAudit = plan8.handoff.fieldsAudit.find(
    (f) => f.queryParam === "qty",
  )!;
  const stayingAudit = plan8.handoff.fieldsAudit.find(
    (f) => f.queryParam === "staying",
  )!;
  assert.equal(artistAudit.populatesOnArrival, true);
  assert.equal(dateAudit.populatesOnArrival, true);
  assert.equal(qtyAudit.populatesOnArrival, true);
  assert.equal(stayingAudit.populatesOnArrival, false);

  // Verify separate event tracking for ride comparison vs provider click
  const cmpEvt6 = trackRedRocksRideComparison(plan6);
  const clkEvt6 = trackRedRocksProviderClick(plan6, "private_overview");
  const cmpEvt8 = trackRedRocksRideComparison(plan8);
  const clkEvt8 = trackRedRocksProviderClick(plan8, "direct_vehicle_option");

  assert.equal(cmpEvt6.eventName, "red_rocks_ride_comparison");
  assert.equal(clkEvt6.eventName, "red_rocks_provider_click");
  assert.notEqual(cmpEvt6.eventId, clkEvt6.eventId);
  assert.equal(cmpEvt6.partySize, 6);
  assert.equal(cmpEvt6.publishedPriceUsd, 399);
  assert.equal(clkEvt6.targetUrl, plan6.handoff.privateOverviewUrl);

  assert.equal(cmpEvt8.eventName, "red_rocks_ride_comparison");
  assert.equal(clkEvt8.eventName, "red_rocks_provider_click");
  assert.equal(cmpEvt8.partySize, 8);
  assert.equal(cmpEvt8.publishedPriceUsd, 599);
  assert.equal(clkEvt8.targetUrl, plan8.handoff.directVehicleOptionUrl);

  const recorded = getRecordedRedRocksPlannerEvents();
  assert.equal(recorded.length, 4);
});
