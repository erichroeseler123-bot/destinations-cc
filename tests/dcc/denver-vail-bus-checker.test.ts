import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDenverToVailShuttleGuidePageModel } from "@/app/transportation/colorado/denver-to-vail-shuttle-guide/model";
import {
  buildDec15BenchmarkPreviewCases,
  evaluateDenverVailBusCheck,
} from "@/lib/dcc/transit/denverVailBusChecker";

describe("DEN -> Union Station -> Vail bus catch checker", () => {
  it("evaluates Dec. 15 3:10 p.m. landing with skis + checked suitcase as fits (scheduled)", () => {
    const res = evaluateDenverVailBusCheck({
      arrivalDate: "2026-12-15",
      arrivalTime: "15:10",
      luggage: "skis_and_checked",
    });

    assert.equal(res.scheduleStatusLabel, "scheduled");
    assert.equal(res.verdict, "fits");
    assert.equal(res.input.baggageEstimateMinutes, 45);
    assert.equal(res.denPlatformReadyTime12h, "3:55 p.m.");
    assert.equal(res.aLineTrain?.tripId, "115890751");
    assert.equal(res.aLineTrain?.dep12h, "3:57 p.m.");
    assert.equal(res.aLineTrain?.arr12h, "4:34 p.m.");
    assert.equal(res.gateB19Transfer.minutes, 41);
    assert.equal(res.gateB19Transfer.passesMinimum, true);
    assert.equal(res.bustangWestConnection?.tripId, "116053731");
    assert.equal(res.scheduledVailArrival12h, "7:35 p.m.");
    assert.equal(res.pegasusConnection, null);
    assert.ok(res.assumptions.length >= 4);
  });

  it("evaluates Dec. 15 3:40 p.m. landing (11 minutes at Union Station) as failing the 15-minute minimum", () => {
    const res = evaluateDenverVailBusCheck({
      arrivalDate: "2026-12-15",
      arrivalTime: "15:40",
      luggage: "skis_and_checked",
    });

    assert.equal(res.scheduleStatusLabel, "scheduled");
    assert.equal(res.verdict, "misses");
    assert.equal(res.missReason, "union_transfer_under_15_min");
    assert.equal(res.aLineTrain?.tripId, "115890750");
    assert.equal(res.aLineTrain?.dep12h, "4:27 p.m.");
    assert.equal(res.aLineTrain?.arr12h, "5:04 p.m.");
    assert.equal(res.gateB19Transfer.minutes, 11);
    assert.equal(res.gateB19Transfer.passesMinimum, false);
    assert.equal(res.gateB19Transfer.failsUnderMinimum, true);
    assert.equal(res.scheduledVailArrival12h, null);
    assert.equal(res.pegasusConnection, null);
    assert.ok(res.gosnoAvailabilityUrl.includes("gosno.co/vail"));
  });

  it("evaluates Dec. 15 4:05 p.m. landing with skis + checked suitcase as misses (scheduled)", () => {
    const res = evaluateDenverVailBusCheck({
      arrivalDate: "2026-12-15",
      arrivalTime: "16:05",
      luggage: "skis_and_checked",
    });

    assert.equal(res.scheduleStatusLabel, "scheduled");
    assert.equal(res.verdict, "misses");
    assert.equal(res.missReason, "arrives_after_last_bus");
    assert.equal(res.aLineTrain?.tripId, "115890749");
    assert.equal(res.aLineTrain?.dep12h, "4:57 p.m.");
    assert.equal(res.aLineTrain?.arr12h, "5:34 p.m.");
    assert.equal(res.gateB19Transfer.minutes, -19);
    assert.equal(res.scheduledVailArrival12h, null);
    assert.equal(res.pegasusConnection, null);
    assert.ok(res.gosnoAvailabilityUrl.includes("date=2026-12-15"));
  });

  it("shows Pegasus only when both schedule (>= 15m transfer) and compact luggage rules fit", () => {
    const fitsPegasus = evaluateDenverVailBusCheck({
      arrivalDate: "2026-12-15",
      arrivalTime: "16:05",
      luggage: "skis_and_personal",
    });

    assert.equal(fitsPegasus.verdict, "fits_pegasus_only");
    assert.ok(fitsPegasus.pegasusConnection !== null);
    assert.equal(fitsPegasus.pegasusConnection?.trip.dep12h, "7:30 p.m.");
    assert.equal(fitsPegasus.pegasusConnection?.trip.arr12h, "9:40 p.m.");
    assert.equal(fitsPegasus.pegasusConnection?.transferMinutes, 116);

    const tooLateForPegasus = evaluateDenverVailBusCheck({
      arrivalDate: "2026-12-15",
      arrivalTime: "18:10",
      luggage: "skis_and_personal",
    });
    assert.equal(tooLateForPegasus.verdict, "misses");
    assert.equal(tooLateForPegasus.pegasusConnection, null);
  });

  it("returns Schedule needs verification when schedule data is missing for the date", () => {
    const missing = evaluateDenverVailBusCheck({
      arrivalDate: "2027-03-15",
      arrivalTime: "15:10",
      luggage: "skis_and_checked",
    });

    assert.equal(missing.verdict, "schedule_needs_verification");
    assert.equal(missing.scheduleStatusLabel, "Schedule needs verification");
    assert.equal(missing.verdictBadge, "Schedule needs verification");
  });

  it("wires the three Dec. 15 benchmark preview cases into the Vail shuttle guide page model", () => {
    const model = buildDenverToVailShuttleGuidePageModel();
    assert.equal(model.busCheckerPreviewCases.length, 3);
    const [fitsCase, elevenMinCase, missesCase] =
      buildDec15BenchmarkPreviewCases();
    assert.equal(fitsCase.result.verdict, "fits");
    assert.equal(elevenMinCase.result.gateB19Transfer.minutes, 11);
    assert.equal(elevenMinCase.result.verdict, "misses");
    assert.equal(missesCase.result.verdict, "misses");
  });
});
