import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const dataDir = fileURLToPath(new URL("../../data/cruise/port-clock/", import.meta.url));
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const cpUrl = (r) => `https://cruisepromenade.com/api/verified-sailings/${encodeURIComponent(r.shipSlug)}/${encodeURIComponent(r.sailDate)}`;
// Extend when an independently checked schedule from another publisher is added.
const reviewedPublisherHosts = new Set(["www.royalcaribbean.com"]);

function isoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function callDate(sailDate, dayNumber) {
  if (!Number.isInteger(dayNumber) || dayNumber < 1) return null;
  const date = new Date(sailDate + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + dayNumber - 1);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

// A port call date may appear inside a legacy alias. Prefer the sailing ID
// itself, then a physical ID, and only use ship-prefixed aliases that agree.
function departureDates(call) {
  const datedSuffix = /[-:](20\d{2})-?(\d{2})-?(\d{2})$/;
  const fromId = (value) => {
    const m = datedSuffix.exec(value);
    const date = m && m.slice(1, 4).join("-");
    return date && isoDate(date) ? date : null;
  };
  if (fromId(call.sailingId)) return [fromId(call.sailingId)];
  const aliases = call.sailingAliases ?? [];
  const physical = aliases.filter((a) => a.startsWith("sailing:") && a.includes(":" + call.shipSlug + ":"));
  const candidates = physical.length ? physical : aliases.filter((a) => a.startsWith(call.shipSlug + "-"));
  return [...new Set(candidates.map(fromId).filter(Boolean))];
}

function ledgerIdentities(portCalls, references) {
  const ids = new Map(references.map((ref) => [ref.sailingId, { ...ref, reviewed: true }]));
  for (const call of portCalls) {
    if (ids.get(call.sailingId)?.reviewed) continue;
    const item = ids.get(call.sailingId) ?? { sailingId: call.sailingId, shipSlug: call.shipSlug, dates: new Set(), ambiguousShip: false };
    if (item.shipSlug !== call.shipSlug) item.ambiguousShip = true;
    for (const date of departureDates(call)) item.dates.add(date);
    ids.set(call.sailingId, item);
  }
  return [...ids.values()].map((x) => x.reviewed ? x : {
    sailingId: x.sailingId, shipSlug: x.shipSlug,
    sailDate: !x.ambiguousShip && x.dates.size === 1 ? [...x.dates][0] : null,
  });
}

function sameScheduleSource(a, b) {
  try {
    // Locale and currency selectors do not identify a different voyage.
    const key = (input) => {
      const url = new URL(input);
      for (const p of ["currencyCode", "country"]) url.searchParams.delete(p);
      url.searchParams.sort();
      return url.href;
    };
    return key(a) === key(b);
  } catch {
    return false;
  }
}

export function comparePortClock({ references, portCalls, cpResponses = {}, demoBoards = {}, asOf }) {
  if (!isoDate(asOf)) throw new Error("Comparison date must be YYYY-MM-DD.");
  const findings = [];
  let matchedFields = 0;
  const scope = (date) => date < asOf ? "historical" : "current_or_future";
  const reviewedIds = new Set(references.map((r) => r.sailingId));
  const identities = ledgerIdentities(portCalls, references);
  const uncoveredLedger = {};
  for (const call of portCalls) {
    if (reviewedIds.has(call.sailingId)) continue;
    const counts = uncoveredLedger[call.sailingId] ??= { historical: 0, current_or_future: 0 };
    counts[scope(call.callDate)]++;
  }

  for (const ref of references) {
    const sourceUrl = new URL(ref.source.url);
    if (sourceUrl.protocol !== "https:" || !reviewedPublisherHosts.has(sourceUrl.hostname) ||
        ref.source.kind !== "cruise_line_itinerary" || !isoDate(ref.source.checkedAt) ||
        (sourceUrl.searchParams.has("sailDate") && sourceUrl.searchParams.get("sailDate") !== ref.sailDate) ||
        !isoDate(ref.sailDate) || ref.days.length === 0 ||
        ref.days.some((day, i) => day.date !== callDate(ref.sailDate, i + 1))) {
      throw new Error("Invalid independently reviewed itinerary for " + ref.sailingId);
    }
    const expectedByDate = new Map(ref.days.map((day) => [day.date, day]));
    function report(consumer, date, status, field, observed = null, expected = null) {
      findings.push({ consumer, sailingId: ref.sailingId, date, scope: scope(date), status, field, observed, expected });
    }
    function compare(consumer, date, field, actual, expected) {
      if (expected == null) {
        if (actual != null) report(consumer, date, "needs_evidence", field, actual);
      } else if (actual == null) {
        report(consumer, date, "missing_coverage", field, null, expected);
      } else if (actual !== expected) {
        report(consumer, date, "discrepancy", field, actual, expected);
      } else {
        matchedFields++;
      }
    }
    function checkDays(consumer, days, ledger) {
      const seen = new Set();
      for (const day of days) {
        const expected = expectedByDate.get(day.date);
        if (!expected || seen.has(day.date)) {
          report(consumer, day.date ?? ref.sailDate, "discrepancy", seen.has(day.date) ? "duplicate_day" : "unexpected_day", day.date);
          continue;
        }
        seen.add(day.date);
        if (!ledger) compare(consumer, day.date, "dayType", day.dayType, expected.dayType);
        if (expected.dayType === "sea" && day.portSlug) {
          report(consumer, day.date, "discrepancy", "portSlug", day.portSlug, "at sea");
        } else {
          compare(consumer, day.date, "portSlug", day.portSlug, expected.portSlug);
        }
        for (const field of ["arrivalTime", "departureTime"]) compare(consumer, day.date, field, day[field], expected[field]);
        if (day.timeBasis && day.timeBasis !== "unknown") compare(consumer, day.date, "timeBasis", day.timeBasis, expected.timeBasis);
        // A line itinerary corroborates the schedule. Reviewing a published deadline requires separate line-issued evidence.
        if (day.publishedAllAboardTime) report(consumer, day.date, "needs_evidence", "publishedAllAboardTime", day.publishedAllAboardTime);
      }
      for (const day of ref.days) {
        if (!seen.has(day.date) && !(ledger && day.dayType === "sea")) {
          report(consumer, day.date, "missing_coverage", "day", null, day.portSlug ?? day.dayType);
        }
      }
    }
    const ledgerDays = portCalls.filter((call) => call.sailingId === ref.sailingId);
    for (const day of ledgerDays) {
      compare("DCC", day.callDate, "shipSlug", day.shipSlug, ref.shipSlug);
      const source = day.scheduleSource;
      if (!source?.url || !source?.checkedAt) {
        report("DCC", day.callDate, "needs_evidence", "scheduleSource", source ?? null);
      } else if (source.kind === "cruise_line_itinerary" && !sameScheduleSource(source.url, ref.source.url)) {
        report("DCC", day.callDate, "needs_evidence", "scheduleSource.url", source.url, ref.source.url);
      }
      if (day.status === "verified" && (!day.publishedAllAboardTime || !day.publishedAllAboardSource || !day.returnPoint?.source || !["ship_time", "local_port_time"].includes(day.timeBasis))) {
        report("DCC", day.callDate, "discrepancy", "unsupported_verified_status", "verified");
      }
      if (day.publishedAllAboardTime && !["cruise_line_daily_program", "cruise_line_sailing_notice"].includes(day.publishedAllAboardSource?.kind)) {
        report("DCC", day.callDate, "discrepancy", "unsupported_published_source", day.publishedAllAboardSource?.kind);
      }
    }
    checkDays("DCC", ledgerDays.map((day) => ({ ...day, date: day.callDate })), true);

    if (ref.publicDemoBoard) {
      const board = demoBoards[ref.publicDemoBoard];
      if (!board?.sailing || !Array.isArray(board.days)) {
        report("CP public demo", ref.sailDate, "missing_coverage", "board_response");
      } else {
        const slug = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        compare("CP public demo", ref.sailDate, "shipSlug", slug(board.sailing.ship), ref.shipSlug);
        compare("CP public demo", ref.sailDate, "sailDate", board.sailing.sailDate, ref.sailDate);
        const days = board.days.map((d) => ({
          date: d.date, dayType: d.dayType,
          portSlug: d.dayType === "sea" ? null : d.portSlug ?? slug(d.label?.split(",")[0]),
          arrivalTime: d.arrivalTime, departureTime: d.departureTime,
        }));
        checkDays("CP public demo", days, false);
      }
    }

    const cp = cpResponses[ref.sailingId];
    if (!cp?.response?.verified || !Array.isArray(cp.response.sailing?.itineraryDays)) {
      report("CP", ref.sailDate, "missing_coverage", "sailing_response", cp?.error ?? "no verified itinerary response");
      continue;
    }
    const sailing = cp.response.sailing;
    compare("CP", ref.sailDate, "shipSlug", sailing.shipSlug, ref.shipSlug);
    compare("CP", ref.sailDate, "sailDate", sailing.sailDate, ref.sailDate);
    if (sailing.sailDate !== ref.sailDate || sailing.shipSlug !== ref.shipSlug) continue;
    if (!sameScheduleSource(sailing.provenance?.sourceUrl, ref.source.url)) {
      report("CP", ref.sailDate, "needs_evidence", "provenance.sourceUrl", sailing.provenance?.sourceUrl, ref.source.url);
    }
    const cpDays = sailing.itineraryDays.map((day) => {
      const date = callDate(sailing.sailDate, day.dayNumber);
      if (day.allAboardTime && !["modeled", "cruise_line", "traveler_program", "organizer", "official"].includes(day.allAboardSource)) {
        report("CP", date ?? ref.sailDate, "needs_evidence", "allAboardSource", day.allAboardSource);
      }
      return { ...day, date, publishedAllAboardTime: ["official", "cruise_line", "traveler_program"].includes(day.allAboardSource) ? day.allAboardTime : null };
    });
    checkDays("CP", cpDays, false);
  }
  // Compare remaining active calls across consumers as a drift check. Mutual
  // agreement without independent evidence never increments matchedFields.
  for (const id of identities.filter((x) => !x.reviewed)) {
    const calls = portCalls.filter((call) => call.sailingId === id.sailingId && call.callDate >= asOf);
    if (!calls.length) continue;
    const report = (status, date, field, observed, cpObserved = null) =>
      findings.push({ consumer: "DCC/CP", comparison: "between_sites", sailingId: id.sailingId, date, scope: scope(date), status, field, observed, cpObserved });
    const result = cpResponses[id.sailingId];
    const sailing = result?.response?.sailing;
    if (!id.sailDate || !result?.response?.verified || !sailing || !Array.isArray(sailing.itineraryDays)) {
      report("missing_coverage", calls[0].callDate, id.sailDate ? "sailing_response" : "sailing_identity", result?.error ?? null);
      continue;
    }
    if (sailing.shipSlug !== id.shipSlug || sailing.sailDate !== id.sailDate) {
      report("discrepancy", calls[0].callDate, "sailing_identity", [id.shipSlug, id.sailDate], [sailing.shipSlug, sailing.sailDate]);
      continue;
    }
    for (const call of calls) {
      const days = sailing.itineraryDays.filter((day) => callDate(id.sailDate, day.dayNumber) === call.callDate);
      if (!days.length) {
        report("missing_coverage", call.callDate, "day", call.portSlug);
        continue;
      }
      const day = days.find((d) => d.portSlug === call.portSlug) ?? (days.length === 1 ? days[0] : undefined);
      if (!day) { report("needs_evidence", call.callDate, "ambiguous_port_call", call.portSlug); continue; }
      const place = day.dayType === "sea" ? "at sea" : day.portSlug;
      if (call.portSlug !== place) {
        report(place ? "discrepancy" : "missing_coverage", call.callDate, "portSlug", call.portSlug, place);
        continue;
      }
      for (const field of ["arrivalTime", "departureTime"]) {
        if (call[field] === day[field] || (!call[field] && !day[field])) continue;
        report(call[field] && day[field] ? "discrepancy" : "missing_coverage", call.callDate, field, call[field] ?? null, day[field] ?? null);
      }
    }
  }
  const counts = { discrepancy: 0, missing_coverage: 0, needs_evidence: 0 };
  for (const f of findings) counts[f.status]++;
  return {
    asOf, matchedFields, counts, findings, ledgerCallsWithoutReviewedSailing: uncoveredLedger,
    reviewed: references.map((r) => ({ sailingId: r.sailingId, ...r.source })),
    cpInputs: identities.map((r) => ({ sailingId: r.sailingId, url: r.sailDate ? cpUrl(r) : null, input: cpResponses[r.sailingId]?.input ?? "none" })),
  };
}

async function main() {
  const { values } = parseArgs({ options: {
    "as-of": { type: "string", default: new Date().toISOString().slice(0, 10) },
    "cp-dir": { type: "string" },
    "cp-live": { type: "boolean" },
  } });
  if (values["cp-dir"] && values["cp-live"]) throw new Error("Select a local CP directory or live CP.");
  const references = await readJson(join(dataDir, "reviewed-itineraries.json"));
  // Same ledger selected by lib/dcc/cruise/portClockLedger.ts.
  const ledger = await readJson(join(dataDir, "2026-11-23.json"));
  const cpResponses = {};
  const demoBoards = {};
  const activeSailings = new Set(ledger.portCalls.filter((c) => c.callDate >= values["as-of"]).map((c) => c.sailingId));
  for (const ref of ledgerIdentities(ledger.portCalls, references)) {
    if (!ref.sailDate || (!ref.reviewed && !activeSailings.has(ref.sailingId))) continue;
    const input = values["cp-live"] ? "live" : values["cp-dir"] ? "local_snapshot" : "none";
    if (input === "none") continue;
    try {
      let response;
      if (input === "local_snapshot") {
        response = await readJson(join(values["cp-dir"], ref.shipSlug + "-" + ref.sailDate + ".json"));
      } else {
        const result = await fetch(cpUrl(ref), { signal: AbortSignal.timeout(12000) });
        if (!result.ok) throw new Error("HTTP " + result.status);
        response = await result.json();
      }
      cpResponses[ref.sailingId] = { input, response };
    } catch (error) {
      cpResponses[ref.sailingId] = { input, error: error.message };
    }
    if (ref.publicDemoBoard) {
      try {
        let body;
        if (input === "local_snapshot") {
          body = await readJson(join(values["cp-dir"], ref.publicDemoBoard + ".board.json"));
        } else {
          const result = await fetch("https://cruisepromenade.com/api/planners/" + encodeURIComponent(ref.publicDemoBoard), { signal: AbortSignal.timeout(12000) });
          if (!result.ok) throw new Error("HTTP " + result.status);
          body = await result.json();
        }
        // Read only schedule fields of explicitly designated public demonstration boards.
        demoBoards[ref.publicDemoBoard] = { sailing: body.planner.sailing, days: body.planner.days };
      } catch {
        // Missing responses are included in the report.
      }
    }
  }
  const report = comparePortClock({ references, portCalls: ledger.portCalls, cpResponses, demoBoards, asOf: values["as-of"] });
  console.log(JSON.stringify({ ledgerVersion: ledger.version, ...report }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
