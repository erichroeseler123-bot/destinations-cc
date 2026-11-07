import assert from "node:assert/strict";
import {
  computeMsyAirportTaxiFare,
  resolveColoradoSeasonalSpotlight,
} from "../../lib/dcc/msyTaxiAndColoradoSeasonal";
import {
  evaluateDenArrivalTripRecheck,
  evaluateRedRocksRideHomeRecheck,
  evaluateUnifiedJuneauTripRecheck,
  evaluateUnifiedJuneauTripRecheckSync,
} from "../../lib/dcc/sharedTripRecheck";
import { evaluateLowBandwidthJuneauReplan } from "../../lib/dcc/lowBandwidthJuneauReplan";
import { POST as evaluateApiPost } from "../../app/api/v1/v03/evaluate/route";
import { GET as llmsTxtGet } from "../../app/llms.txt/route";
import {
  DELHI_AGRA_MACHINE_FEEDS,
  DELHI_AGRA_QUALIFIED_OPERATORS,
  DELHI_AGRA_SAMPLE_TRIP_FITS,
  DELHI_AGRA_SAMPLE_TRIP_NEEDS_VERIFICATION,
  HK_IMMD_CHECKPOINT_WAIT_SAMPLES,
  HK_MACAO_MOBILE_CHANNELS,
  HK_MACAO_SAMPLE_TRIP_FITS,
  HK_MACAO_SAMPLE_TRIP_NEEDS_VERIFICATION,
  HK_MACAO_SIX_FACTOR_ENTRY_MODEL,
  HZMB_TRANSPORT_OPTIONS,
  ICELAND_KEF_VIK_OPERATOR_PROFILES,
  ICELAND_OPERATOR_OUTREACH_DRAFT,
  KEF_TO_VIK_DATE_ROAD_SAMPLES,
  KEF_VIK_SAMPLE_TRIP_FITS,
  KEF_VIK_SAMPLE_TRIP_NEEDS_VERIFICATION,
  SEPARATED_ICELAND_TRIPS,
  SHENZHEN_SEPARATE_ROUTE_NOTICE,
  TAJ_MAHAL_OFFICIAL_RULES,
  evaluateDelhiAgraTajVisit,
} from "../../lib/dcc/corridors/internationalCorridorQualifications";
import { getRegionalHubByStateSlug } from "../../lib/dcc/regionalHubs";
import { getTravelReferenceNodeById } from "../../lib/dcc/travelReferenceCore";

async function runTests() {
  console.log(
    "Running Test 100: Unified Trip Recheck, MSY Taxi, CO Seasonal Spotlight & International Corridors..."
  );

  // ==========================================================================
  // 1. STEP 1A: MSY Taxi Fare ($36 for 1-2 pax, $15/person for 3+, $75 for 5)
  // ==========================================================================
  const msy1 = computeMsyAirportTaxiFare({ passengers: 1 });
  const msy2 = computeMsyAirportTaxiFare({ passengers: 2 });
  const msy3 = computeMsyAirportTaxiFare({ passengers: 3 });
  const msy4 = computeMsyAirportTaxiFare({ passengers: 4 });
  const msy5 = computeMsyAirportTaxiFare({
    passengers: 5,
    verifiedPrivateVanQuoteUsd: 95,
  });

  assert.equal(msy1.postedTaxiFareUsd, 36, "1 passenger MSY taxi fare must be $36");
  assert.equal(msy2.postedTaxiFareUsd, 36, "2 passengers MSY taxi fare must be $36");
  assert.equal(msy3.postedTaxiFareUsd, 45, "3 passengers MSY taxi fare must be $45 ($15/pax)");
  assert.equal(msy4.postedTaxiFareUsd, 60, "4 passengers MSY taxi fare must be $60 ($15/pax)");
  assert.equal(msy5.postedTaxiFareUsd, 75, "5 passengers MSY taxi fare must be $75 ($15/pax)");
  assert.equal(msy5.officialSourceUrl, "https://flymsy.com/taxis-2/");
  assert.ok(
    msy5.singleCabSuitabilityNote.includes("one suitable"),
    "5-passenger MSY rule must qualify when one suitable cab can carry the group and its luggage"
  );
  assert.ok(
    msy5.privateVanComparisonSummary.includes("$75") &&
      msy5.privateVanComparisonSummary.includes("$95"),
    "MSY 5-passenger calculation must compare against verified private van quote when provided"
  );

  const laHub = getRegionalHubByStateSlug("louisiana");
  assert.ok(laHub, "Louisiana hub must resolve");
  const laHas36And75 = JSON.stringify(laHub).includes("$36") && JSON.stringify(laHub).includes("$75");
  assert.ok(laHas36And75, "/destinations/louisiana must reflect $36 (1-2 pax) and $75 (5 pax) MSY taxi fare");

  const nolaNode = getTravelReferenceNodeById("new-orleans");
  assert.ok(nolaNode, "New Orleans travel reference node must resolve");
  const nolaText = JSON.stringify(nolaNode);
  assert.ok(
    nolaText.includes("$36") &&
      nolaText.includes("$15 per") &&
      nolaText.includes("https://flymsy.com/taxis-2/"),
    "Shared New Orleans fare copy must cite flymsy.com/taxis-2/ and use $36 / $15 per person / $75 for 5"
  );

  // ==========================================================================
  // 2. STEP 1B: Colorado Seasonal Spotlight (Nov-Apr vs May-Oct + Trip Offer)
  // ==========================================================================
  const winterDefault = resolveColoradoSeasonalSpotlight({
    dateOrMonth: "2026-12-19",
    partySize: 4,
    skiBags: 3,
  });
  assert.equal(winterDefault.activeSeasonSpotlight, "winter_nov_apr");
  assert.ok(
    winterDefault.featuredGuides.length > 0 &&
      winterDefault.yearRoundSecondaryGuides.length > 0,
    "Both sets of guides must be present year-round"
  );
  assert.equal(winterDefault.selectedOffer.partnerName, "GoSno");

  const summerDefault = resolveColoradoSeasonalSpotlight({
    dateOrMonth: "2026-07-18",
    partySize: 4,
  });
  assert.equal(summerDefault.activeSeasonSpotlight, "summer_may_oct");
  assert.ok(
    summerDefault.featuredGuides.length > 0 &&
      summerDefault.yearRoundSecondaryGuides.length > 0,
    "Both sets of guides must be present year-round"
  );

  // Season chooses what's featured, but traveler's actual trip chooses the offer:
  // Even in November, if the traveler's trip is for Red Rocks Amphitheatre, select Party at Red Rocks!
  const winterButRedRocksTrip = resolveColoradoSeasonalSpotlight({
    dateOrMonth: "2026-11-08",
    destinationOrVenue: "Red Rocks Amphitheatre",
    tripIntent: "red_rocks_event",
    partySize: 6,
  });
  assert.equal(winterButRedRocksTrip.activeSeasonSpotlight, "winter_nov_apr");
  assert.equal(
    winterButRedRocksTrip.selectedOffer.partnerName,
    "Party at Red Rocks"
  );

  // Even in May, if the traveler's trip is a late-season A-Basin/Breckenridge ski transfer, select GoSno!
  const summerButMountainSkiTrip = resolveColoradoSeasonalSpotlight({
    dateOrMonth: "2026-05-10",
    destinationOrVenue: "Breckenridge / Arapahoe Basin",
    tripIntent: "ski_transfer",
    partySize: 4,
    skiBags: 4,
  });
  assert.equal(summerButMountainSkiTrip.activeSeasonSpotlight, "summer_may_oct");
  assert.equal(summerButMountainSkiTrip.selectedOffer.partnerName, "GoSno");

  // ==========================================================================
  // 3. STEP 2: Juneau 4 Specific Scenarios + Web & Agent API Parity
  // ==========================================================================
  // Scenario A: July 15, 2027 (2027-07-15), standard window, no confirmed tide limit
  const july15Web = await evaluateUnifiedJuneauTripRecheck({
    date: "2027-07-15",
    arrivalTime: "08:00",
    allAboardTime: "16:30",
    berth: "franklin_dock",
    returnBufferMinutes: 60,
    partySize: 2,
    operatorConfirmedTideLimitFt: null,
  });

  const july15LowBw = evaluateLowBandwidthJuneauReplan({
    date: "2027-07-15",
    arrivalTime: "08:00",
    allAboardTime: "16:30",
    berth: "FKL",
    partySize: 2,
    operatorConfirmedTideLimitFt: null,
  });

  const apiReqJuly15 = new Request("https://destinationcommandcenter.com/api/v1/v03/evaluate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      corridorId: "juneau-port-day",
      context: {
        date: "2027-07-15",
        arrivalTime: "08:00",
        allAboardTime: "16:30",
        berth: "franklin_dock",
        returnBufferMinutes: 60,
        partySize: 2,
        operatorConfirmedTideLimitFt: null,
      },
    }),
  });
  const apiResJuly15 = await evaluateApiPost(apiReqJuly15);
  assert.equal(apiResJuly15.status, 200);
  const apiJsonJuly15 = await apiResJuly15.json();

  assert.equal(
    july15Web.recheckCard.whatStillFits,
    july15LowBw.recheckCard.whatStillFits,
    "Full planner and low-bandwidth page must agree on whatStillFits for 2027-07-15"
  );
  assert.equal(
    july15Web.topRemainingMinutesAfterBuffer,
    july15LowBw.options[0].remainingMinutesAfterBuffer,
    "Full planner and low-bandwidth page must agree on topRemainingMinutesAfterBuffer for 2027-07-15"
  );
  assert.equal(
    july15Web.topRemainingMinutesAfterBuffer,
    apiJsonJuly15.sharedTripRecheck.topRemainingMinutesAfterBuffer,
    "Web and /api/v1/v03/evaluate must agree on topRemainingMinutesAfterBuffer for 2027-07-15"
  );
  assert.equal(
    july15Web.recheckCard.primaryNextActionHref,
    apiJsonJuly15.sharedTripRecheck.recheckCard.primaryNextActionHref,
    "Web and /api/v1/v03/evaluate must agree on primaryNextActionHref for 2027-07-15"
  );
  assert.equal(july15Web.tides.stationId, "9452210");
  assert.equal(july15Web.tides.datum, "MLLW");
  assert.equal(
    july15Web.tides.tideGateStatus,
    "no_confirmed_operator_tide_limit",
    "Launch with no confirmed tide limit must keep tides as context only"
  );
  assert.equal(july15Web.tides.tideLimitApplied, false);

  // Scenario B: Shortened port window (14:00 arrival to 18:30 all-aboard)
  const shortenedWeb = evaluateUnifiedJuneauTripRecheckSync({
    date: "2027-07-15",
    arrivalTime: "14:00",
    allAboardTime: "18:30",
    berth: "aj_dock",
    returnBufferMinutes: 90,
    partySize: 2,
  });
  const apiReqShortened = new Request("https://destinationcommandcenter.com/api/v1/v03/evaluate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      corridorId: "juneau-port-day",
      context: {
        date: "2027-07-15",
        arrivalTime: "14:00",
        allAboardTime: "18:30",
        berth: "aj_dock",
        returnBufferMinutes: 90,
        partySize: 2,
      },
    }),
  });
  const apiJsonShortened = await (await evaluateApiPost(apiReqShortened)).json();
  assert.equal(
    shortenedWeb.topRemainingMinutesAfterBuffer,
    apiJsonShortened.sharedTripRecheck.topRemainingMinutesAfterBuffer,
    "Web and API must agree on remaining minutes for shortened port window"
  );
  assert.equal(
    shortenedWeb.recheckCard.whatStillFits,
    apiJsonShortened.sharedTripRecheck.recheckCard.whatStillFits,
    "Web and API must agree on whatStillFits for shortened port window"
  );

  // Scenario C: NOAA timeout (simulateNoaaTimeout: true)
  const noaaTimeoutWeb = await evaluateUnifiedJuneauTripRecheck({
    date: "2027-07-15",
    arrivalTime: "08:00",
    allAboardTime: "16:30",
    berth: "franklin_dock",
    returnBufferMinutes: 60,
    partySize: 2,
    simulateNoaaTimeout: true,
  });
  assert.equal(
    noaaTimeoutWeb.tides.status,
    "noaa_timeout_unavailable",
    "NOAA timeout must report noaa_timeout_unavailable and never fake tide predictions"
  );
  assert.equal(
    noaaTimeoutWeb.topRemainingMinutesAfterBuffer,
    july15Web.topRemainingMinutesAfterBuffer,
    "NOAA timeout must not corrupt port-day time-fit math"
  );

  // Scenario D: Operator-confirmed tide limit vs launch with no confirmed tide limit
  const confirmedTideLimitEval = evaluateUnifiedJuneauTripRecheckSync({
    date: "2027-07-15",
    arrivalTime: "08:00",
    allAboardTime: "16:30",
    berth: "franklin_dock",
    returnBufferMinutes: 60,
    partySize: 2,
    operatorConfirmedTideLimitFt: 2.5, // Predicted low tide is +1.4 ft MLLW at 10:36 on 2027-07-15
  });
  assert.equal(
    confirmedTideLimitEval.tides.tideGateStatus,
    "breaches_confirmed_operator_limit",
    "When operator confirms a tide limit that is breached, tideGateStatus must be breaches_confirmed_operator_limit"
  );
  assert.equal(confirmedTideLimitEval.tides.tideLimitApplied, true);

  // Step 2 Reuse: DEN Arrivals & Red Rocks Ride-Home Planning
  const denEval = evaluateDenArrivalTripRecheck({
    date: "2026-12-19",
    flightNumber: "UA 1482",
    scheduledEtaLocal: "13:30",
    revisedEtaLocal: "14:45",
    destination: "Vail",
    partySize: 4,
    skiBags: 3,
  });
  assert.ok(
    denEval.recheckCard.primaryNextActionHref.includes("gosno"),
    "DEN arrival recheck must route to GoSno"
  );

  const redRocksEval = evaluateRedRocksRideHomeRecheck({
    date: "2026-08-14",
    eventName: "Morrison Amphitheatre Headline Show",
    encoreCutoffLocal: "23:30",
    partySize: 4,
  });
  assert.ok(
    redRocksEval.recheckCard.primaryNextActionHref.includes("partyatredrocks"),
    "Red Rocks ride-home recheck must route to Party at Red Rocks"
  );

  // ==========================================================================
  // 4. STEP 3: Iceland Qualification (KEF → Vík)
  // ==========================================================================
  assert.equal(
    SEPARATED_ICELAND_TRIPS.length,
    4,
    "Must explicitly separate RKV, Golden Circle, Blue Lagoon, and glacier excursions"
  );
  assert.equal(
    ICELAND_KEF_VIK_OPERATOR_PROFILES.length,
    2,
    "Must include NorthTrip and Drive Reykjavík profiles"
  );
  for (const op of ICELAND_KEF_VIK_OPERATOR_PROFILES) {
    assert.equal(op.pricingCurrency, "ISK");
    assert.ok(op.publishedPriceScheduleIsk.length > 0);
    assert.equal(
      op.directCheckoutStatus,
      "qualification_complete_pending_10pct_partner_agreement"
    );
  }
  assert.equal(ICELAND_OPERATOR_OUTREACH_DRAFT.proposedCommissionRatePct, 10);
  assert.ok(
    ICELAND_OPERATOR_OUTREACH_DRAFT.emailBodyText.includes("10%") &&
      ICELAND_OPERATOR_OUTREACH_DRAFT.emailBodyText.includes("date") &&
      ICELAND_OPERATOR_OUTREACH_DRAFT.emailBodyText.includes("luggage")
  );
  assert.equal(
    KEF_TO_VIK_DATE_ROAD_SAMPLES.open_winter_spots_of_ice.segments.length,
    4
  );
  assert.equal(KEF_VIK_SAMPLE_TRIP_FITS.fitStatus, "fits_confirmed_vehicle");
  assert.equal(
    KEF_VIK_SAMPLE_TRIP_NEEDS_VERIFICATION.fitStatus,
    "blocked_by_road_closure"
  );
  assert.equal(KEF_VIK_SAMPLE_TRIP_NEEDS_VERIFICATION.hasActiveRoadClosure, true);

  // ==========================================================================
  // 5. STEP 4: Delhi–Agra & Hong Kong–Macao + /llms.txt
  // ==========================================================================
  assert.equal(
    TAJ_MAHAL_OFFICIAL_RULES.officialUrl,
    "https://www.tajmahal.gov.in/visiting-hours.aspx"
  );
  assert.equal(TAJ_MAHAL_OFFICIAL_RULES.closedDayOfWeek, "Friday");
  assert.equal(TAJ_MAHAL_OFFICIAL_RULES.ticketValidityDurationMinutes, 180);
  assert.equal(DELHI_AGRA_MACHINE_FEEDS.length, 2);
  assert.ok(DELHI_AGRA_QUALIFIED_OPERATORS[0].priceInr > 0);
  assert.equal(DELHI_AGRA_SAMPLE_TRIP_FITS.fitVerdict, "fits_visit_window");
  assert.equal(
    DELHI_AGRA_SAMPLE_TRIP_NEEDS_VERIFICATION.fitVerdict,
    "needs_verification_or_reschedule"
  );

  // Verify Friday closure detection for Delhi–Agra
  const fridayTajEval = evaluateDelhiAgraTajVisit({
    date: "2026-11-20", // Friday
    trainNumberAndName: "12002 Gatimaan Express",
    scheduledArrivalAgc: "09:50",
    revisedArrivalAgc: "09:50",
    partySize: 2,
  });
  assert.equal(fridayTajEval.isFridayClosed, true);
  assert.equal(fridayTajEval.fitVerdict, "closed_on_friday");

  // Verify Hong Kong–Macao
  assert.equal(HZMB_TRANSPORT_OPTIONS.length, 2);
  assert.ok(
    HZMB_TRANSPORT_OPTIONS[1].regulatorySourceUrl.includes(
      "td.gov.hk/en/transport_in_hong_kong/land_based_cross_boundary_transport/enquiries_on_cross_boundary_hire_car_service"
    )
  );
  assert.ok(
    HK_IMMD_CHECKPOINT_WAIT_SAMPLES.normal_weekday_visitor.sourceDatasetUrl.includes(
      "data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time"
    )
  );
  assert.equal(HK_MACAO_SIX_FACTOR_ENTRY_MODEL.length, 6);
  assert.ok(
    HK_MACAO_SAMPLE_TRIP_FITS.privateHireIncludesImmigrationNote.includes(
      "STILL includes mandatory immigration"
    )
  );
  assert.ok(SHENZHEN_SEPARATE_ROUTE_NOTICE.explanation.includes("Mainland China"));
  assert.ok(HK_MACAO_MOBILE_CHANNELS.amapRouteHref.includes("amap.com"));
  assert.ok(HK_MACAO_MOBILE_CHANNELS.whatsappConciergeHref.includes("wa.me"));
  assert.equal(HK_MACAO_SAMPLE_TRIP_FITS.entryAndPermitStatus, "ready_to_cross");
  assert.equal(
    HK_MACAO_SAMPLE_TRIP_NEEDS_VERIFICATION.entryAndPermitStatus,
    "verify_entry_or_vehicle_permit"
  );

  // Verify /llms.txt documents the new guides and API URLs
  const llmsRes = await llmsTxtGet();
  const llmsBody = await llmsRes.text();
  assert.ok(llmsBody.includes("/routes/keflavik-to-vik"));
  assert.ok(llmsBody.includes("/routes/delhi-to-agra"));
  assert.ok(llmsBody.includes("/routes/hong-kong-to-macao"));
  assert.ok(llmsBody.includes("/api/v1/v03/evaluate"));
  assert.ok(llmsBody.includes("/juneau/replan"));

  console.log("All Test 100 assertions passed!");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
