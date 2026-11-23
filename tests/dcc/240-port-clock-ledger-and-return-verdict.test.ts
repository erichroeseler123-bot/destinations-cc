import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getPortClockLedger,
  validatePortClockLedger,
  summarizePortClockLedger,
  findPortClockRecord,
  type PortClockLedger,
  type PortClockRecord,
} from "../../lib/dcc/cruise/portClockLedger";
import {
  evaluateReturnBuffer,
  RETURN_BUFFER_VERDICT_LABELS,
} from "../../lib/dcc/cruise/returnBufferVerdict";
import { SCHEDULED_CRUISE_PORT_CALLS } from "../../lib/dcc/cruisePortExcursionCatalogEngine";

const SRC = { url: "https://example-line.test/daily-program", kind: "cruise_line_daily_program" as const, checkedAt: "2026-11-23" };
const ITIN = { url: "https://example-line.test/itinerary", kind: "cruise_line_itinerary" as const, checkedAt: "2026-11-23" };

function verifiedCall(over: Partial<PortClockRecord> = {}): PortClockRecord {
  return {
    sailingId: "TEST-1", shipName: "Test Ship", shipSlug: "test-ship", portSlug: "nassau", callDate: "2027-01-25",
    arrivalTime: "07:00", departureTime: "16:00", timeBasis: "local_port_time",
    publishedAllAboardTime: "15:30", publishedAllAboardSource: SRC,
    modeledAllAboardTime: null, modelRule: null,
    returnPoint: { name: "Prince George Wharf", dockOrTender: "dock", source: ITIN },
    scheduleSource: ITIN, status: "verified", ...over,
  };
}

test("shipped ledger passes validation and invents no published deadlines", () => {
  assert.deepEqual(validatePortClockLedger(), []);
  const s = summarizePortClockLedger();
  assert.equal(s.total, 28);
  assert.equal(s.publishedAllAboard, 0);
  assert.equal(s.verified, 0);
  assert.equal(s.modeledOnly + s.noAllAboard, 28);
});

test("engine view mirrors the ledger and marks nothing as published", () => {
  assert.equal(SCHEDULED_CRUISE_PORT_CALLS.length, getPortClockLedger().portCalls.length);
  assert.ok(SCHEDULED_CRUISE_PORT_CALLS.every((c) => c.allAboardPublished === false));
  const nassau = SCHEDULED_CRUISE_PORT_CALLS.find((c) => c.sailingId === "INDY-2027-01-24" && c.portSlug === "nassau");
  assert.equal(nassau?.allAboardTime, "15:15"); // display value unchanged, now labeled modeled
});

test("validation rejects published deadline without source, wrong source kind, and mixed fields", () => {
  const bad: PortClockLedger = {
    version: "t", generatedAt: "t",
    portCalls: [
      verifiedCall({ publishedAllAboardSource: null, status: "partial" }),
      verifiedCall({ callDate: "2027-01-26", publishedAllAboardSource: ITIN }),
      verifiedCall({ callDate: "2027-01-27", modeledAllAboardTime: "15:00", modelRule: null }),
      verifiedCall({ callDate: "2027-01-28", status: "unverified" }),
    ],
  };
  const errors = validatePortClockLedger(bad).join("\n");
  assert.match(errors, /published all-aboard without a published source/);
  assert.match(errors, /not a line-issued document/);
  assert.match(errors, /modeled all-aboard without a model rule/);
  assert.match(errors, /status "unverified" should be "verified"/);
});

const TOUR_CLOCK = { tourTimeBasis: "local_port_time" as const, tourReturnDate: "2027-01-25" };

test("verdict passes and fails only with full evidence", () => {
  const meets = evaluateReturnBuffer({ ...TOUR_CLOCK, portCall: verifiedCall(), tourReturnTime: "13:30", tourReturnPoint: "Prince George Wharf" });
  assert.equal(meets.verdict, "meets_recommended_120");
  assert.equal(meets.bufferMinutes, 120);
  assert.equal(meets.scheduleSource?.checkedAt, "2026-11-23");
  const below = evaluateReturnBuffer({ ...TOUR_CLOCK, portCall: verifiedCall(), tourReturnTime: "13:31", tourReturnPoint: "prince george wharf" });
  assert.equal(below.verdict, "below_recommended_120");
});

test("each missing fact yields Cannot verify with its reason", () => {
  const cases: [Partial<PortClockRecord>, string][] = [
    [{ publishedAllAboardTime: null, publishedAllAboardSource: null, modeledAllAboardTime: "15:30", modelRule: "departure − 30 min" }, "no_published_all_aboard"],
    [{ timeBasis: "unknown" }, "time_basis_unknown"],
    [{ returnPoint: null }, "return_point_unknown"],
  ];
  for (const [over, reason] of cases) {
    const r = evaluateReturnBuffer({ portCall: verifiedCall(over), tourReturnTime: "12:00", tourReturnPoint: "Prince George Wharf" });
    assert.equal(r.verdict, "cannot_verify", reason);
    assert.ok(r.reasons.includes(reason as never), reason);
  }
  assert.deepEqual(evaluateReturnBuffer({ portCall: null, tourReturnTime: "12:00", tourReturnPoint: "x" }).reasons, ["port_call_not_found"]);
  assert.ok(evaluateReturnBuffer({ portCall: verifiedCall(), tourReturnPoint: "Prince George Wharf" }).reasons.includes("tour_return_time_missing"));
  assert.ok(evaluateReturnBuffer({ portCall: verifiedCall(), tourReturnTime: "12:00" }).reasons.includes("tour_return_point_missing"));
  assert.ok(evaluateReturnBuffer({ portCall: verifiedCall(), tourReturnTime: "12:00", tourReturnPoint: "Downtown" }).reasons.includes("tour_return_point_differs"));
});

test("verdict requires a common service date and clock, a checked schedule, a line-issued deadline and a sourced return point", () => {
  const valid = { ...TOUR_CLOCK, portCall: verifiedCall(), tourReturnTime: "13:30", tourReturnPoint: "Prince George Wharf" };
  for (const input of [
    { ...valid, tourTimeBasis: undefined },
    { ...valid, tourTimeBasis: "ship_time" as const },
    { ...valid, tourReturnDate: "2027-01-26" },
    { ...valid, tourReturnDate: undefined },
    { ...valid, tourReturnTime: "04:30" },
    { ...valid, portCall: verifiedCall({ publishedAllAboardTime: "25:00" }) },
    { ...valid, portCall: verifiedCall({ publishedAllAboardSource: ITIN }) },
    { ...valid, portCall: verifiedCall({ scheduleSource: null }) },
    { ...valid, portCall: verifiedCall({ scheduleSource: { ...ITIN, checkedAt: "2026-02-30" } }) },
    { ...valid, portCall: verifiedCall({ returnPoint: { name: "Prince George Wharf", dockOrTender: "dock", source: { ...ITIN, url: "" } } }) },
    { ...valid, portCall: verifiedCall({ arrivalTime: "21:00", departureTime: "03:00", publishedAllAboardTime: "02:30" }) },
  ]) {
    const result = evaluateReturnBuffer(input);
    assert.equal(result.verdict, "cannot_verify");
    assert.equal(result.bufferMinutes, null);
  }
});

test("different non-Latin pier names remain distinct", () => {
  const portCall = verifiedCall({ returnPoint: { name: "東桟橋", dockOrTender: "dock", source: ITIN } });
  const input = { ...TOUR_CLOCK, portCall, tourReturnTime: "13:00" };
  assert.equal(evaluateReturnBuffer({ ...input, tourReturnPoint: "西桟橋" }).verdict, "cannot_verify");
  assert.equal(evaluateReturnBuffer({ ...input, tourReturnPoint: "東桟橋" }).verdict, "meets_recommended_120");
});

test("a modeled estimate never passes, even with a huge cushion", () => {
  const r = evaluateReturnBuffer({
    portCall: verifiedCall({ publishedAllAboardTime: null, publishedAllAboardSource: null, modeledAllAboardTime: "23:00", modelRule: "test", status: "partial" }),
    tourReturnTime: "08:00", tourReturnPoint: "Prince George Wharf",
  });
  assert.equal(r.verdict, "cannot_verify");
  assert.match(r.planningNote ?? "", /Planning estimate only/);
});

test("real ledger calls all return Cannot verify today, including the empty all-aboard row", () => {
  for (const call of getPortClockLedger().portCalls) {
    assert.equal(evaluateReturnBuffer({ portCall: call, tourReturnTime: "10:00", tourReturnPoint: "pier" }).verdict, "cannot_verify");
  }
  const empty = findPortClockRecord({ sailingId: "SYMPHONY-2027-01-03", portSlug: "cozumel", callDate: "2027-01-08" });
  assert.equal(empty?.modeledAllAboardTime, null);
});

test("labels never claim safety or guarantees", () => {
  for (const label of Object.values(RETURN_BUFFER_VERDICT_LABELS)) assert.doesNotMatch(label, /safe|guarantee/i);
  const note = evaluateReturnBuffer({ portCall: getPortClockLedger().portCalls[0], tourReturnTime: "10:00", tourReturnPoint: "x" }).planningNote ?? "";
  assert.doesNotMatch(note, /safe|guarantee/i);
});
