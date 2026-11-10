import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import VailBusCatchChecker from "@/app/components/dcc/VailBusCatchChecker";
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
    assert.equal(res.aLineTrain?.serviceId, "MT");
    assert.equal(res.aLineTrain?.dep12h, "3:57 p.m.");
    assert.equal(res.aLineTrain?.arr12h, "4:34 p.m.");
    assert.equal(res.gateB19Transfer.minutes, 41);
    assert.equal(res.gateB19Transfer.passesMinimum, true);
    assert.equal(res.bustangWestConnection?.tripId, "116053731");
    assert.equal(res.bustangWestConnection?.serviceId, "WK");
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
    assert.equal(
      res.gosnoAvailabilityUrl,
      "https://gosno.co/vail?origin=DEN&destination=Vail&date=2026-12-15",
    );
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
    assert.equal(
      res.gosnoAvailabilityUrl,
      "https://gosno.co/vail?origin=DEN&destination=Vail&date=2026-12-15",
    );
    assert.ok(!res.gosnoAvailabilityUrl.includes("passengers="));
    assert.ok(!res.gosnoAvailabilityUrl.includes("vehicleClass="));
    assert.ok(!res.gosnoAvailabilityUrl.includes("skiBags="));
  });

  it("applies RTD, Bustang West Line, and Pegasus service calendars and holiday exceptions separately on Thanksgiving (2026-11-26), Christmas (2026-12-25), and New Year's Day (2027-01-01)", () => {
    // 1. Thanksgiving (Thursday 2026-11-26)
    const thanksgiving = evaluateDenverVailBusCheck({
      arrivalDate: "2026-11-26",
      arrivalTime: "15:10",
      luggage: "skis_and_checked",
    });
    assert.equal(thanksgiving.scheduleStatusLabel, "scheduled");
    assert.equal(thanksgiving.verdict, "fits");
    assert.deepEqual(
      thanksgiving.serviceCalendars.rtdALine.removedExceptionServiceIds,
      ["MT", "P_Fri", "WK"],
    );
    assert.deepEqual(
      thanksgiving.serviceCalendars.rtdALine.addedExceptionServiceIds,
      ["SU"],
    );
    assert.deepEqual(
      thanksgiving.serviceCalendars.rtdALine.activeRouteServiceIds,
      ["SU"],
    );
    assert.deepEqual(
      thanksgiving.serviceCalendars.bustangWest.removedExceptionServiceIds,
      ["WK"],
    );
    assert.deepEqual(
      thanksgiving.serviceCalendars.bustangWest.addedExceptionServiceIds,
      ["SU"],
    );
    assert.deepEqual(
      thanksgiving.serviceCalendars.bustangWest.activeRouteServiceIds,
      ["SU"],
    );
    assert.deepEqual(
      thanksgiving.serviceCalendars.pegasus.removedExceptionServiceIds,
      ["WK"],
    );
    assert.deepEqual(
      thanksgiving.serviceCalendars.pegasus.addedExceptionServiceIds,
      ["SU"],
    );
    // Sunday trip IDs on Thanksgiving instead of weekday MT/WK trip IDs
    assert.equal(thanksgiving.aLineTrain?.tripId, "115891073");
    assert.equal(thanksgiving.bustangWestConnection?.tripId, "116053701");

    // 2. Christmas (Friday 2026-12-25)
    const christmas = evaluateDenverVailBusCheck({
      arrivalDate: "2026-12-25",
      arrivalTime: "16:05",
      luggage: "skis_and_personal",
    });
    assert.equal(christmas.scheduleStatusLabel, "scheduled");
    assert.equal(christmas.verdict, "fits_pegasus_only");
    assert.deepEqual(
      christmas.serviceCalendars.rtdALine.removedExceptionServiceIds,
      ["FR", "P_Fri", "WK"],
    );
    assert.deepEqual(
      christmas.serviceCalendars.rtdALine.addedExceptionServiceIds,
      ["SU"],
    );
    assert.deepEqual(
      christmas.serviceCalendars.bustangWest.removedExceptionServiceIds,
      ["WK"],
    );
    assert.deepEqual(
      christmas.serviceCalendars.pegasus.removedExceptionServiceIds,
      ["P_Fri", "WK"],
    );
    assert.deepEqual(
      christmas.serviceCalendars.pegasus.addedExceptionServiceIds,
      ["SU"],
    );
    assert.equal(christmas.pegasusConnection?.trip.serviceId, "SU");
    assert.equal(christmas.pegasusConnection?.trip.tripId, "116053064");

    // 3. New Year's Day (Friday 2027-01-01)
    const newYearsDay = evaluateDenverVailBusCheck({
      arrivalDate: "2027-01-01",
      arrivalTime: "15:40",
      luggage: "skis_and_checked",
    });
    assert.equal(newYearsDay.scheduleStatusLabel, "scheduled");
    assert.equal(newYearsDay.verdict, "misses");
    assert.equal(newYearsDay.missReason, "union_transfer_under_15_min");
    assert.equal(newYearsDay.gateB19Transfer.minutes, 11);
    assert.deepEqual(
      newYearsDay.serviceCalendars.rtdALine.activeRouteServiceIds,
      ["SU"],
    );
    assert.deepEqual(
      newYearsDay.serviceCalendars.bustangWest.activeRouteServiceIds,
      ["SU"],
    );
    assert.deepEqual(
      newYearsDay.serviceCalendars.pegasus.activeRouteServiceIds,
      ["SU"],
    );
    assert.equal(
      newYearsDay.gosnoAvailabilityUrl,
      "https://gosno.co/vail?origin=DEN&destination=Vail&date=2027-01-01",
    );

    // 4. Regular Friday (2026-12-18) uses FR for RTD, WK for Bustang West, and P_Fri+WK for Pegasus
    const regularFriday = evaluateDenverVailBusCheck({
      arrivalDate: "2026-12-18",
      arrivalTime: "13:10",
      luggage: "personal_only",
    });
    assert.deepEqual(
      regularFriday.serviceCalendars.rtdALine.activeRouteServiceIds,
      ["FR"],
    );
    assert.deepEqual(
      regularFriday.serviceCalendars.bustangWest.activeRouteServiceIds,
      ["WK"],
    );
    assert.deepEqual(
      regularFriday.serviceCalendars.pegasus.activeRouteServiceIds,
      ["P_Fri", "WK"],
    );
  });

  it("evaluates Jan. 3 (2027-01-03) outside the current feed window as Schedule needs verification", () => {
    const jan3 = evaluateDenverVailBusCheck({
      arrivalDate: "2027-01-03",
      arrivalTime: "15:10",
      luggage: "skis_and_checked",
    });

    assert.equal(jan3.verdict, "schedule_needs_verification");
    assert.equal(jan3.scheduleStatusLabel, "Schedule needs verification");
    assert.equal(jan3.verdictBadge, "Schedule needs verification");
    assert.equal(jan3.serviceCalendars.rtdALine.inFeedWindow, false);
    assert.equal(jan3.serviceCalendars.bustangWest.inFeedWindow, false);
    assert.equal(jan3.serviceCalendars.pegasus.inFeedWindow, false);
    assert.equal(
      jan3.gosnoAvailabilityUrl,
      "https://gosno.co/vail?origin=DEN&destination=Vail&date=2027-01-03",
    );
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

  it("wires the three Dec. 15 benchmark preview cases into the Vail shuttle guide page model and renders the preview HTML", () => {
    const model = buildDenverToVailShuttleGuidePageModel();
    assert.equal(model.busCheckerPreviewCases.length, 3);
    const [fitsCase, elevenMinCase, missesCase] =
      buildDec15BenchmarkPreviewCases();
    assert.equal(fitsCase.result.verdict, "fits");
    assert.equal(elevenMinCase.result.gateB19Transfer.minutes, 11);
    assert.equal(elevenMinCase.result.verdict, "misses");
    assert.equal(missesCase.result.verdict, "misses");

    const html = renderToStaticMarkup(
      React.createElement(VailBusCatchChecker, {
        basePartnerDestinationUrl: model.basePartnerDestinationUrl,
        initialPreviewCases: model.busCheckerPreviewCases,
      }),
    );

    assert.ok(html.includes("Can I still catch the bus to Vail?"));
    assert.ok(html.includes("3:10 p.m. landing fits"));
    assert.ok(html.includes("11 minutes at Union Station fails"));
    assert.ok(html.includes("4:05 p.m. landing misses"));
    assert.ok(html.includes("Check GoSno availability"));
    assert.ok(
      html.includes(
        "https://gosno.co/vail?origin=DEN&amp;destination=Vail&amp;date=2026-12-15",
      ),
    );
    assert.ok(html.includes("scheduled"));
  });
});
