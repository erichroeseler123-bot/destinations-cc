import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getPortClockLedger,
  validatePortClockLedger,
  summarizePortClockLedger,
  findPortClockRecord,
  filterPortCallsByScope,
  isPastPortCall,
  parsePortClockScope,
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
  assert.equal(s.total, 29);
  assert.equal(s.publishedAllAboard, 0);
  assert.equal(s.verified, 0);
  assert.equal(s.modeledOnly + s.noAllAboard, s.total);
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

const RC_SAILING_URL =
  "https://www.royalcaribbean.com/itinerary/7-night-western-caribbean-from-galveston-on-symphony-SY07GAL-3851841824?country=USA&currencyCode=USD&sailDate=2027-01-24";

test("WESTERN-2027-01-24 records the line's full round trip separately from modeled cutoffs", () => {
  const rows = getPortClockLedger().portCalls.filter((r) => r.sailingId === "WESTERN-2027-01-24");
  assert.deepEqual(
    rows.map((r) => [r.portSlug, r.callDate, r.arrivalTime, r.departureTime, r.modeledAllAboardTime]),
    [
      ["galveston", "2027-01-24", null, "15:00", null],
      ["roatan", "2027-01-27", "08:00", "17:00", "16:30"],
      ["costa-maya", "2027-01-28", "08:00", "17:00", "16:30"],
      ["cozumel", "2027-01-29", "07:00", "17:00", "16:30"],
      ["galveston", "2027-01-31", "07:00", null, null],
    ],
  );
  for (const r of rows) {
    assert.equal(r.shipSlug, "symphony-of-the-seas");
    assert.notEqual(r.portSlug, "grand-cayman");
    assert.notEqual(r.portSlug, "miami");
    assert.equal(r.publishedAllAboardTime, null);
    assert.equal(r.publishedAllAboardSource, null);
    assert.equal(r.timeBasis, "unknown");
    assert.equal(r.returnPoint, null);
    assert.equal(r.status, "unverified");
    assert.ok(!(r.sailingAliases ?? []).includes("WC07MIA-20270124"));
    for (const alias of [
      "symphony-of-the-seas-20270124",
      "royal-caribbean-symphony-of-the-seas-2027-01-24",
      "sailing:rcl:symphony-of-the-seas:2027-01-24",
      "sailing:rccl:symphony-of-the-seas:2027-01-24",
    ]) {
      assert.ok(r.sailingAliases?.includes(alias), alias);
    }
    assert.equal(r.scheduleSource?.kind, "cruise_line_itinerary");
    assert.equal(r.scheduleSource?.url, RC_SAILING_URL);
    assert.equal(r.scheduleSource?.checkedAt, "2026-11-24");
    assert.equal(r.modelRule, r.modeledAllAboardTime ? "departure_minus_30" : null);
  }
  assert.equal(findPortClockRecord({ sailingId: "WC07MIA-20270124", portSlug: "cozumel" }), null);
  assert.equal(findPortClockRecord({ sailingId: "WESTERN-2027-01-24", portSlug: "grand-cayman" }), null);
  assert.equal(findPortClockRecord({ sailingId: "WESTERN-2027-01-24", portSlug: "galveston" }), null);
  assert.equal(findPortClockRecord({ sailingId: "WESTERN-2027-01-24", portSlug: "cozumel", callDate: "2027-01-26" }), null);
  assert.equal(
    findPortClockRecord({ sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-24", portSlug: "cozumel" })?.callDate,
    "2027-01-29",
  );
});

test("departure_minus_30 rows must match the rule and unknown rules are rejected", () => {
  const modeled = (over: Partial<PortClockRecord>) =>
    verifiedCall({ publishedAllAboardTime: null, publishedAllAboardSource: null, status: "partial", ...over });
  const ledger: PortClockLedger = {
    version: "t", generatedAt: "t",
    portCalls: [
      modeled({ callDate: "2027-01-25", modeledAllAboardTime: "15:30", modelRule: "departure_minus_30" }),
      modeled({ callDate: "2027-01-26", modeledAllAboardTime: "15:15", modelRule: "departure_minus_30" }),
      modeled({ callDate: "2027-01-27", modeledAllAboardTime: "15:30", modelRule: "made_up_rule" }),
    ],
  };
  const errors = validatePortClockLedger(ledger);
  assert.equal(errors.length, 2, errors.join("\n"));
  assert.match(errors.join("\n"), /2027-01-26 modeled all-aboard "15:15" does not equal departure − 30/);
  assert.match(errors.join("\n"), /2027-01-27 unknown model rule "made_up_rule"/);
});

test("scope helper separates past and upcoming rows without removing any", () => {
  const all = getPortClockLedger().portCalls;
  const asOf = "2026-11-24";
  const upcoming = filterPortCallsByScope(all, "upcoming", asOf);
  const past = filterPortCallsByScope(all, "past", asOf);
  assert.equal(filterPortCallsByScope(all, "all", asOf).length, all.length);
  assert.equal(upcoming.length + past.length, all.length);
  assert.equal(past.length, 19);
  assert.equal(upcoming.length, 10);
  assert.ok(upcoming.every((r) => r.callDate >= asOf));
  assert.ok(past.every((r) => isPastPortCall(r, asOf)));
  assert.equal(upcoming.filter((r) => r.sailingId === "WESTERN-2027-01-24").length, 5);
  assert.equal(parsePortClockScope("UPCOMING"), "upcoming");
  assert.equal(parsePortClockScope("bogus"), "all");
  assert.equal(parsePortClockScope(null), "all");
});
