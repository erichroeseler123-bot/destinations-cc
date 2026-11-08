import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HAWAII_WHALE_DECISION_ENGINE,
  KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW,
  KAHULUI_MAALAEA_VERIFIED_TRIP_CANDIDATES,
  evaluateKahuluiMaalaeaPortDay,
  evaluateKahuluiMaalaeaWhaleWatchingTrip,
} from "@/lib/dcc/decisionEngines/hawaiiWhaleWatchingEngine";
import { getCruisePortReference } from "@/lib/dcc/cruisePortDirectory";

describe("Kahului Harbor → Maʻalaea Whale Watching (DCC Maui Build)", () => {
  it("reuses the existing Kahului entry in DCC cruise port directory and the Hawaiʻi whale-watching engine", () => {
    const kahuluiPort = getCruisePortReference("kahului");
    assert.ok(kahuluiPort, "Expected kahului entry in DCC cruise-port-directory.json");
    assert.equal(kahuluiPort.slug, "kahului");
    assert.equal(kahuluiPort.area, "Maui");
    assert.equal(kahuluiPort.country, "United States");

    const comparison = evaluateKahuluiMaalaeaPortDay();
    assert.equal(comparison.portSlug, "kahului");
    assert.equal(
      comparison.reusedDecisionEngineId,
      HAWAII_WHALE_DECISION_ENGINE.engineId,
    );
    assert.equal(
      comparison.reusedDecisionEnginePath,
      "/hawaii/whale-watching",
    );
    assert.equal(comparison.summaryCounts.totalEvaluated, 3);
    assert.equal(comparison.summaryCounts.fitsCount, 1);
    assert.equal(comparison.summaryCounts.runsTooLateCount, 1);
    assert.equal(comparison.summaryCounts.needsVerificationCount, 1);
  });

  it("verifies Scenario 1: a real Maʻalaea departure that fits the ship's all-aboard time with seat availability displayed separately", () => {
    const fitsCandidate = KAHULUI_MAALAEA_VERIFIED_TRIP_CANDIDATES.find(
      (c) => c.scenarioRole === "fits",
    );
    assert.ok(fitsCandidate);
    const evaluated = evaluateKahuluiMaalaeaWhaleWatchingTrip(
      fitsCandidate,
      KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW,
    );

    assert.equal(evaluated.engineOptionId, "hi-whale-maui-pacwhale-catamaran");
    assert.equal(evaluated.fareHarborItemId, "410840");
    assert.equal(evaluated.verifiedLogistics.maalaeaDepartureTime, "10:30");
    assert.equal(evaluated.verifiedLogistics.checkInLeadMinutes, 45);
    assert.equal(evaluated.verifiedLogistics.checkInCutoffTime, "09:45");
    assert.equal(evaluated.verifiedLogistics.roadTransferEachWayMinutes, 25);
    assert.equal(evaluated.verifiedLogistics.roadTransferRoundTripMinutes, 50);
    assert.equal(evaluated.verifiedLogistics.effectiveTransferRoundTripMinutes, 60);
    assert.match(
      evaluated.verifiedLogistics.pickupOrMeetingPoint,
      /300 Maʻalaea Rd/,
    );

    // All-aboard fit check
    assert.equal(evaluated.allAboardFit.status, "fits_all_aboard");
    assert.equal(evaluated.allAboardFit.fitsAllAboard, true);
    assert.equal(
      evaluated.allAboardFit.timeline.plannedKahuluiPierReturnTime,
      "13:00",
    );
    assert.equal(evaluated.allAboardFit.timeline.minutesBeforeAllAboard, 195);
    assert.equal(
      evaluated.allAboardFit.timeline.netSlackAfterBufferMinutes,
      135,
    );
    assert.ok(evaluated.allAboardFit.engineTimingCalculation);

    // Seat availability is separate from schedule fit
    assert.equal(
      evaluated.seatAvailability.status,
      "check_live_seats_on_fareharbor",
    );
    assert.equal(evaluated.seatAvailability.seatsVerified, false);
    assert.match(
      evaluated.seatAvailability.badgeLabel,
      /Seat Availability: Check dates and prices on FareHarbor/,
    );
  });

  it("verifies Scenario 2: a Maʻalaea departure that runs too late for the ship's all-aboard time", () => {
    const lateCandidate = KAHULUI_MAALAEA_VERIFIED_TRIP_CANDIDATES.find(
      (c) => c.scenarioRole === "runs_too_late",
    );
    assert.ok(lateCandidate);
    const evaluated = evaluateKahuluiMaalaeaWhaleWatchingTrip(
      lateCandidate,
      KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW,
    );

    assert.equal(evaluated.verifiedLogistics.maalaeaDepartureTime, "14:00");
    assert.equal(evaluated.allAboardFit.status, "runs_too_late");
    assert.equal(evaluated.allAboardFit.fitsAllAboard, false);
    assert.equal(
      evaluated.allAboardFit.timeline.plannedKahuluiPierReturnTime,
      "16:30",
    );
    assert.equal(evaluated.allAboardFit.timeline.minutesBeforeAllAboard, -15);
    assert.equal(
      evaluated.allAboardFit.timeline.netSlackAfterBufferMinutes,
      -75,
    );
    assert.equal(
      evaluated.seatAvailability.status,
      "check_live_seats_on_fareharbor",
    );
  });

  it("verifies Scenario 3: a trip with missing operator information held back as Needs verification", () => {
    const missingCandidate = KAHULUI_MAALAEA_VERIFIED_TRIP_CANDIDATES.find(
      (c) => c.scenarioRole === "missing_operator_info",
    );
    assert.ok(missingCandidate);
    const evaluated = evaluateKahuluiMaalaeaWhaleWatchingTrip(
      missingCandidate,
      KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW,
    );

    assert.equal(evaluated.allAboardFit.status, "needs_verification");
    assert.equal(evaluated.allAboardFit.fitsAllAboard, false);
    assert.ok(evaluated.allAboardFit.missingOperatorFields.length >= 3);
    assert.match(
      evaluated.allAboardFit.verdictBadgeLabel,
      /Needs verification — missing operator information/,
    );
    assert.equal(
      evaluated.seatAvailability.status,
      "unverified_operator_inventory",
    );
    assert.equal(evaluated.seatAvailability.seatsVerified, false);
  });
});
