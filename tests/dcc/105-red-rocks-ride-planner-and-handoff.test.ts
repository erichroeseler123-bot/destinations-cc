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
  hasIncomingRedRocksShowParams,
  RED_ROCKS_MIKE_NOV_14_SHOW,
  RED_ROCKS_STAYING_PRESETS,
  resolveInitialRedRocksShow,
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

test("2. Plain /red-rocks visit prompts for a show; incoming Nov. 14 mike. link uses verified venue time; custom shows display 'Check the venue for doors and showtime' and suppress clock-based departure advice", () => {
  // Plain /red-rocks visit with no show query params -> prompts for a show (returns null)
  assert.equal(hasIncomingRedRocksShowParams({}), false);
  assert.equal(
    hasIncomingRedRocksShowParams({ artist: null, date: null, event: null }),
    false,
  );
  assert.equal(resolveInitialRedRocksShow({}), null);

  // Incoming link selecting Nov. 14 mike. show -> pre-fills RED_ROCKS_MIKE_NOV_14_SHOW
  assert.equal(
    hasIncomingRedRocksShowParams({
      artist: "mike.",
      date: "2026-11-14",
      event: "rr-2026-11-14-mike",
    }),
    true,
  );
  const show = resolveInitialRedRocksShow({
    artist: "mike.",
    date: "2026-11-14",
    event: "rr-2026-11-14-mike",
  });
  assert.ok(show, "Expected incoming Nov. 14 link to select the show");
  assert.equal(show.artist, "mike.");
  assert.equal(show.date, "2026-11-14");
  assert.equal(show.venueTimesVerified, true);
  assert.equal(show.venueDoorsLocal, "18:00");
  assert.equal(show.venueDoorsDisplay, "6:00 p.m.");
  assert.equal(show.venueShowtimeLocal, "19:15");
  assert.equal(show.venueShowtimeDisplay, "7:15 p.m.");
  assert.equal(
    show.venueTimeSummaryDisplay,
    "Doors 6:00 p.m. · Show 7:15 p.m.",
  );
  assert.equal(show.parrListingTimeDisplay, "7:00 p.m.");
  assert.equal(
    show.officialEventUrl,
    "https://www.redrocksonline.com/events/mike-1239116/",
  );

  const plan = evaluateRedRocksRidePlan({
    show,
    partySize: 6,
  });

  assert.equal(plan.scheduleSeparation.venueTimesVerified, true);
  assert.equal(
    plan.scheduleSeparation.clockBasedDepartureAdviceSuppressed,
    false,
  );
  assert.equal(plan.scheduleSeparation.usesVenueTime, true);
  assert.equal(plan.scheduleSeparation.showTimeAndPickupTimeSeparate, true);
  assert.equal(plan.scheduleSeparation.venueDoorsDisplay, "6:00 p.m.");
  assert.equal(plan.scheduleSeparation.venueShowtimeDisplay, "7:15 p.m.");
  assert.equal(plan.scheduleSeparation.parrListingTimeDisplay, "7:00 p.m.");
  assert.match(
    plan.scheduleSeparation.pickupDeadlineInstruction,
    /pickup deadline/i,
  );

  // Custom show (unverified times) -> displays "Check the venue for doors and showtime" and suppresses clock-based departure advice
  const customShow = resolveRedRocksShow({
    artist: "Khruangbin",
    date: "2026-11-20",
  });
  assert.equal(customShow.artist, "Khruangbin");
  assert.equal(customShow.date, "2026-11-20");
  assert.equal(customShow.venueTimesVerified, false);
  assert.equal(customShow.venueDoorsDisplay, null);
  assert.equal(customShow.venueShowtimeDisplay, null);
  assert.equal(
    customShow.venueTimeSummaryDisplay,
    "Check the venue for doors and showtime",
  );

  const customPlan = evaluateRedRocksRidePlan({
    show: customShow,
    partySize: 6,
  });
  assert.equal(customPlan.scheduleSeparation.venueTimesVerified, false);
  assert.equal(
    customPlan.scheduleSeparation.clockBasedDepartureAdviceSuppressed,
    true,
  );
  assert.equal(
    customPlan.scheduleSeparation.venueTimeSummaryDisplay,
    "Check the venue for doors and showtime",
  );

  for (const card of customPlan.comparisonCards) {
    assert.match(
      card.showTimeVsPickupNote,
      /Check the venue for doors and showtime/,
    );
    assert.doesNotMatch(
      card.showTimeVsPickupNote,
      /6:00 p\.m\.|7:15 p\.m\.|4:00–4:30 p\.m\.|before your target gate arrival/i,
    );
    for (const bullet of card.bullets) {
      assert.doesNotMatch(
        bullet,
        /6:00 p\.m\.|7:15 p\.m\.|4:00–4:30 p\.m\./i,
      );
    }
  }
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
  assert.ok(
    staying.straightLineMilesToRedRocks > 10 &&
      staying.straightLineMilesToRedRocks < 20,
  );
  assert.match(staying.straightLineDistanceLabel, /straight-line distance/i);
});

test("4. Main private ride button routes 1-6 guests to Suburban, 7-10 to Van, and 11+ to Quote; keeps GPS & lodging out of analytics and outbound URLs; audits arrival fields", () => {
  clearRecordedRedRocksPlannerEvents();

  const stayingSheraton = buildRedRocksStayingPlace({
    ...RED_ROCKS_STAYING_PRESETS[1],
    source: "preset",
  });

  // 4a. Group of 6 (1–6 guests -> Suburban /book/red-rocks-amphitheatre/private/suv)
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
  assert.equal(plan6.handoff.destinationKind, "suburban_checkout");

  const parrCard6 = plan6.comparisonCards.find(
    (c) => c.modeId === "parr_private",
  )!;
  assert.equal(parrCard6.ctaHref, plan6.handoff.checkoutUrl);

  const url6 = new URL(parrCard6.ctaHref);
  assert.equal(url6.origin, "https://www.partyatredrocks.com");
  assert.equal(url6.pathname, "/book/red-rocks-amphitheatre/private/suv");
  assert.equal(url6.searchParams.get("artist"), "mike.");
  assert.equal(url6.searchParams.get("date"), "2026-11-14");
  assert.equal(url6.searchParams.get("event"), "rr-2026-11-14-mike");
  assert.equal(url6.searchParams.get("src"), "dcc-red-rocks-ride-planner");
  assert.equal(url6.searchParams.get("utm_source"), "destinationcommandcenter");
  assert.equal(url6.searchParams.get("utm_medium"), "referral");
  assert.equal(url6.searchParams.get("utm_campaign"), "red-rocks-ride-planner");
  // Ensure NO lodging details or GPS coordinates in outbound URL
  assert.equal(url6.searchParams.get("staying"), null);
  assert.equal(url6.searchParams.get("lat"), null);
  assert.equal(url6.searchParams.get("lng"), null);
  assert.doesNotMatch(parrCard6.ctaHref, /Sheraton|1550|39\.7422|-104\.9892/i);

  // 4b. Group of 8 (7–10 guests -> Van /book/red-rocks-amphitheatre/private/van)
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
  assert.equal(plan8.handoff.destinationKind, "van_checkout");

  const parrCard8 = plan8.comparisonCards.find(
    (c) => c.modeId === "parr_private",
  )!;
  assert.equal(parrCard8.ctaHref, plan8.handoff.checkoutUrl);

  const url8 = new URL(parrCard8.ctaHref);
  assert.equal(url8.origin, "https://www.partyatredrocks.com");
  assert.equal(url8.pathname, "/book/red-rocks-amphitheatre/private/van");
  assert.equal(url8.searchParams.get("artist"), "mike.");
  assert.equal(url8.searchParams.get("date"), "2026-11-14");
  assert.equal(url8.searchParams.get("event"), "rr-2026-11-14-mike");
  assert.equal(url8.searchParams.get("src"), "dcc-red-rocks-ride-planner");
  assert.equal(url8.searchParams.get("utm_source"), "destinationcommandcenter");
  assert.equal(url8.searchParams.get("staying"), null);
  assert.equal(url8.searchParams.get("lat"), null);
  assert.equal(url8.searchParams.get("lng"), null);
  assert.doesNotMatch(parrCard8.ctaHref, /Sheraton|1550|39\.7422|-104\.9892/i);

  // 4c. Group of 12 (11+ guests -> Quote /contact)
  const plan12 = evaluateRedRocksRidePlan({
    show: RED_ROCKS_MIKE_NOV_14_SHOW,
    staying: stayingSheraton,
    partySize: 12,
  });

  assert.equal(plan12.partySize, 12);
  assert.equal(plan12.parrRecommendation.vehicleType, "quote");
  assert.equal(plan12.parrRecommendation.publishedPriceUsd, null);
  assert.equal(plan12.handoff.destinationKind, "group_quote");

  const parrCard12 = plan12.comparisonCards.find(
    (c) => c.modeId === "parr_private",
  )!;
  const url12 = new URL(parrCard12.ctaHref);
  assert.equal(url12.origin, "https://www.partyatredrocks.com");
  assert.equal(url12.pathname, "/contact");
  assert.equal(url12.searchParams.get("artist"), "mike.");
  assert.equal(url12.searchParams.get("date"), "2026-11-14");
  assert.equal(url12.searchParams.get("event"), "rr-2026-11-14-mike");
  assert.equal(url12.searchParams.get("src"), "dcc-red-rocks-ride-planner");
  assert.equal(url12.searchParams.get("staying"), null);

  // 4d. Handoff field audit in tests (verifying what populates on arrival vs entered in checkout)
  const artistAudit = plan8.handoff.fieldsAudit.find(
    (f) => f.queryParam === "artist",
  )!;
  const dateAudit = plan8.handoff.fieldsAudit.find(
    (f) => f.queryParam === "date",
  )!;
  const eventAudit = plan8.handoff.fieldsAudit.find(
    (f) => f.queryParam === "event",
  )!;
  const pickupAudit = plan8.handoff.fieldsAudit.find((f) =>
    f.field.includes("Pickup Location"),
  )!;
  assert.equal(artistAudit.populatesOnArrival, true);
  assert.equal(dateAudit.populatesOnArrival, true);
  assert.equal(eventAudit.populatesOnArrival, true);
  assert.equal(pickupAudit.populatesOnArrival, false);

  // 4e. Separate event tracking with zero GPS coordinates or lodging details in analytics
  const cmpEvt6 = trackRedRocksRideComparison(plan6);
  const clkEvt6 = trackRedRocksProviderClick(plan6);
  const cmpEvt8 = trackRedRocksRideComparison(plan8);
  const clkEvt8 = trackRedRocksProviderClick(plan8);

  assert.equal(cmpEvt6.eventName, "red_rocks_ride_comparison");
  assert.equal(clkEvt6.eventName, "red_rocks_provider_click");
  assert.notEqual(cmpEvt6.eventId, clkEvt6.eventId);
  assert.equal(cmpEvt6.partySize, 6);
  assert.equal(cmpEvt6.recommendedVehicle, "suburban");
  assert.equal(cmpEvt6.publishedPriceUsd, 399);
  assert.equal(clkEvt6.targetUrl, plan6.handoff.checkoutUrl);

  assert.equal(cmpEvt8.eventName, "red_rocks_ride_comparison");
  assert.equal(clkEvt8.eventName, "red_rocks_provider_click");
  assert.equal(cmpEvt8.partySize, 8);
  assert.equal(cmpEvt8.recommendedVehicle, "van");
  assert.equal(cmpEvt8.publishedPriceUsd, 599);
  assert.equal(clkEvt8.targetUrl, plan8.handoff.checkoutUrl);

  const recorded = getRecordedRedRocksPlannerEvents();
  assert.equal(recorded.length, 4);
  for (const evt of recorded) {
    const serialized = JSON.stringify(evt);
    assert.doesNotMatch(
      serialized,
      /stayingLocation|stayingLat|stayingLng|Sheraton|1550|39\.7422|-104\.9892/i,
    );
  }
});

