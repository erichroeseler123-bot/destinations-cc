import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { comparePortClock } from "../../scripts/dcc/compare-port-clock.mjs";

const references = JSON.parse(await readFile(new URL("../../data/cruise/port-clock/reviewed-itineraries.json", import.meta.url), "utf8"));
const ref = references.find((r) => r.sailingId === "WESTERN-2027-01-24");
const indy = references.find((r) => r.sailingId === "INDY-2027-01-24");
const asOf = "2026-11-24";
const stop = ref.days.find((day) => day.portSlug === "cozumel");

function inputs(reference = ref) {
  const portCalls = reference.days.filter((day) => day.portSlug).map((day) => ({
    ...day, sailingId: reference.sailingId, shipSlug: reference.shipSlug, callDate: day.date,
    timeBasis: "unknown", publishedAllAboardTime: null, scheduleSource: reference.source,
  }));
  const sailing = {
    shipSlug: reference.shipSlug, sailDate: reference.sailDate, provenance: { sourceUrl: reference.source.url },
    itineraryDays: reference.days.map((day, i) => ({ ...day, dayNumber: i + 1 })),
  };
  const cpResponses = { [reference.sailingId]: { input: "test", response: { verified: true, sailing } } };
  const board = { sailing: { ship: reference.shipSlug.replaceAll("-", " "), sailDate: reference.sailDate }, days: reference.days };
  const demoBoards = { [reference.publicDemoBoard]: board };
  return { args: { references: [reference], portCalls, cpResponses, demoBoards, asOf }, portCalls, sailing };
}

test("identical wrong hours on both sites remain two discrepancies against the line's dated schedule", () => {
  const { args, portCalls, sailing } = inputs();
  assert.equal(comparePortClock(args).findings.length, 0);
  portCalls.find((d) => d.portSlug === "cozumel").departureTime = "18:00";
  sailing.itineraryDays.find((d) => d.portSlug === "cozumel").departureTime = "18:00";
  const { findings } = comparePortClock(args);
  assert.deepEqual(findings.map((f) => [f.consumer, f.date, f.status, f.observed, f.expected]), [
    ["DCC", stop.date, "discrepancy", "18:00", "17:00"],
    ["CP", stop.date, "discrepancy", "18:00", "17:00"],
  ]);
});

test("wrong port, ship or sailing date and unsupported published labels remain visible", () => {
  const { args, portCalls, sailing } = inputs();
  const dcc = portCalls.find((d) => d.portSlug === "cozumel");
  Object.assign(dcc, { portSlug: "grand-cayman", status: "verified", publishedAllAboardTime: "16:30", publishedAllAboardSource: ref.source });
  const cp = sailing.itineraryDays.find((d) => d.portSlug === "cozumel");
  Object.assign(cp, { allAboardTime: "16:30", allAboardSource: "official" });
  let fields = comparePortClock(args).findings.map((f) => [f.consumer, f.field].join("/"));
  for (const k of ["DCC/portSlug", "DCC/unsupported_verified_status", "DCC/unsupported_published_source", "CP/publishedAllAboardTime"]) assert.ok(fields.includes(k));
  cp.allAboardSource = "modeled";
  assert.ok(!comparePortClock(args).findings.some((f) => f.consumer === "CP" && f.field === "publishedAllAboardTime"));
  Object.assign(sailing, { sailDate: "2027-02-01", shipSlug: "another-ship" });
  fields = comparePortClock(args).findings.filter((f) => f.consumer === "CP").map((f) => f.field);
  assert.deepEqual(fields, ["shipSlug", "sailDate"]);
});

test("a missing response, an unrepresented call and an unreviewed voyage never become agreement", () => {
  const { args, portCalls } = inputs();
  portCalls.pop();
  portCalls.push({ sailingId: "another", callDate: "2026-01-01" }, { sailingId: "another", callDate: "2027-06-01" });
  const result = comparePortClock({ ...args, asOf: "2027-02-01", cpResponses: {} });
  assert.deepEqual(result.findings.map((f) => [f.consumer, f.status, f.scope]), [
    ["DCC", "missing_coverage", "historical"], ["CP", "missing_coverage", "historical"],
    ["DCC/CP", "missing_coverage", "current_or_future"],
  ]);
  assert.deepEqual(result.ledgerCallsWithoutReviewedSailing.another, { historical: 1, current_or_future: 1 });
});

test("a shared consumer URL cannot serve as the independent primary reference", () => {
  const { args } = inputs();
  const circular = { ...ref, source: { ...ref.source, url: "https://cruisepromenade.com/shared" } };
  assert.throws(() => comparePortClock({ ...args, references: [circular] }), /independently reviewed/);
});

test("unreviewed active sailings are checked for disagreement without claiming primary verification", () => {
  const { args, portCalls, sailing } = inputs();
  args.references = [];
  const key = "symphony-of-the-seas-20270124";
  for (const call of portCalls) call.sailingId = key;
  args.cpResponses = { [key]: { input: "test", response: { verified: true, sailing } } };
  assert.equal(comparePortClock(args).matchedFields, 0);
  assert.deepEqual(comparePortClock(args).findings, []);
  sailing.itineraryDays.find((d) => d.portSlug === "cozumel").dayType = "sea";
  const [difference] = comparePortClock(args).findings;
  assert.deepEqual([difference.comparison, difference.field, difference.cpObserved], ["between_sites", "portSlug", "at sea"]);
});

test("a demo board showing a different ship is reported even when the sailing APIs agree", () => {
  const { args } = inputs();
  args.demoBoards[ref.publicDemoBoard].sailing.ship = "Harmony of the Seas";
  const [finding] = comparePortClock(args).findings;
  assert.deepEqual([finding.consumer, finding.field, finding.observed], ["CP public demo", "shipSlug", "harmony-of-the-seas"]);
});

test("two departures on January 24 use separate references and detect a missing Independence San Juan call", () => {
  const west = inputs();
  const east = inputs(indy);
  const args = { references: [ref, indy], portCalls: [...west.portCalls, ...east.portCalls],
    cpResponses: { ...west.args.cpResponses, ...east.args.cpResponses },
    demoBoards: { ...west.args.demoBoards, ...east.args.demoBoards }, asOf };
  assert.equal(comparePortClock(args).findings.length, 0);
  const sanJuan = east.portCalls.find((day) => day.callDate === "2027-01-27");
  assert.deepEqual([sanJuan.portSlug, sanJuan.arrivalTime, sanJuan.departureTime], ["san-juan", "11:30", "19:00"]);
  const { findings } = comparePortClock({ ...args, portCalls: args.portCalls.filter((day) => day !== sanJuan) });
  assert.deepEqual(findings.map(f => [f.sailingId, f.date, f.consumer, f.status, f.expected]),
    [[indy.sailingId, "2027-01-27", "DCC", "missing_coverage", "san-juan"]]);
});
