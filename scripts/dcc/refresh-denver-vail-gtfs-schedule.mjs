#!/usr/bin/env node
/**
 * Refresh script for the DEN -> Union Station -> Vail GTFS schedule dataset.
 *
 * Usage:
 *   # Download fresh ZIPs from RTD & regenerate lib/dcc/transit/denverVailGtfsScheduleData.ts
 *   node scripts/dcc/refresh-denver-vail-gtfs-schedule.mjs
 *
 *   # Or regenerate from an existing extracted directory containing rtd_pt_cr/ and bustang/
 *   node scripts/dcc/refresh-denver-vail-gtfs-schedule.mjs --from-dir <path>
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const OUTPUT_TS_PATH = path.join(
  REPO_ROOT,
  "lib/dcc/transit/denverVailGtfsScheduleData.ts",
);

const RTD_A_LINE_ZIP_URL =
  "https://www.rtd-denver.com/files/gtfs/RTD_Denver_Purchased_Transportation_Commuter_Rail_GTFS.zip";
const BUSTANG_ZIP_URL =
  "https://www.rtd-denver.com/files/gtfs/bustang-co-us.zip";

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .split("\n");
  if (!lines.length) return [];
  const parseLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]).map((h) => h.trim());
  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const vals = parseLine(line);
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (vals[idx] ?? "").trim();
      });
      return obj;
    });
}

function formatYyyyMmDd(compact) {
  if (!compact || compact.length !== 8) return compact;
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

function extractRouteBundle({
  dir,
  operatorId,
  operatorName,
  routeId,
  archiveUrl,
  originStopId,
  destStopId,
}) {
  const feedInfoRows = parseCsv(
    fs.readFileSync(path.join(dir, "feed_info.txt"), "utf8"),
  );
  const feedInfo = feedInfoRows[0] ?? {};

  const trips = parseCsv(
    fs.readFileSync(path.join(dir, "trips.txt"), "utf8"),
  ).filter((t) => t.route_id === routeId);
  const tripMap = new Map(trips.map((t) => [t.trip_id, t]));

  const stopTimes = parseCsv(
    fs.readFileSync(path.join(dir, "stop_times.txt"), "utf8"),
  );
  const byTrip = new Map();
  for (const r of stopTimes) {
    if (!tripMap.has(r.trip_id)) continue;
    if (r.stop_id === originStopId || r.stop_id === destStopId) {
      if (!byTrip.has(r.trip_id)) byTrip.set(r.trip_id, {});
      if (r.stop_id === originStopId) byTrip.get(r.trip_id).o = r;
      if (r.stop_id === destStopId) byTrip.get(r.trip_id).d = r;
    }
  }

  const tripsByService = {};
  const routeServiceIds = new Set();
  for (const [tid, v] of byTrip.entries()) {
    if (v.o && v.d && Number(v.o.stop_sequence) < Number(v.d.stop_sequence)) {
      const t = tripMap.get(tid);
      routeServiceIds.add(t.service_id);
      if (!tripsByService[t.service_id]) tripsByService[t.service_id] = [];
      tripsByService[t.service_id].push({
        tripId: tid,
        serviceId: t.service_id,
        dep: v.o.departure_time,
        arr: v.d.arrival_time,
      });
    }
  }

  for (const svc of Object.keys(tripsByService)) {
    tripsByService[svc].sort((a, b) => a.dep.localeCompare(b.dep));
  }

  const rawCalendar = parseCsv(
    fs.readFileSync(path.join(dir, "calendar.txt"), "utf8"),
  );
  const rawCalendarDatesPath = path.join(dir, "calendar_dates.txt");
  const rawCalendarDates = fs.existsSync(rawCalendarDatesPath)
    ? parseCsv(fs.readFileSync(rawCalendarDatesPath, "utf8"))
    : [];

  // Keep all calendar rows and calendar_dates rows for this feed (or used by this route/exceptions)
  const calendar = rawCalendar
    .filter((row) => routeServiceIds.has(row.service_id) || dir.includes("rtd"))
    .map((row) => ({
      serviceId: row.service_id,
      monday: row.monday === "1",
      tuesday: row.tuesday === "1",
      wednesday: row.wednesday === "1",
      thursday: row.thursday === "1",
      friday: row.friday === "1",
      saturday: row.saturday === "1",
      sunday: row.sunday === "1",
      startDate: formatYyyyMmDd(row.start_date),
      endDate: formatYyyyMmDd(row.end_date),
    }));

  const calendarServiceSet = new Set(calendar.map((c) => c.serviceId));
  const calendarDates = rawCalendarDates
    .filter(
      (row) =>
        calendarServiceSet.has(row.service_id) ||
        routeServiceIds.has(row.service_id),
    )
    .map((row) => ({
      serviceId: row.service_id,
      date: formatYyyyMmDd(row.date),
      exceptionType: Number(row.exception_type) === 1 ? 1 : 2,
    }));

  return {
    operatorId,
    operatorName,
    routeId,
    archiveUrl,
    feedVersion: feedInfo.feed_version || "unknown",
    feedStartDate: formatYyyyMmDd(feedInfo.feed_start_date),
    feedEndDate: formatYyyyMmDd(feedInfo.feed_end_date),
    calendar,
    calendarDates,
    tripsByService,
  };
}

function downloadAndExtractToTemp() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcc-vail-gtfs-"));
  const rtdZip = path.join(tmpRoot, "rtd_pt_cr.zip");
  const bustangZip = path.join(tmpRoot, "bustang.zip");
  const rtdDir = path.join(tmpRoot, "rtd_pt_cr");
  const bustangDir = path.join(tmpRoot, "bustang");
  fs.mkdirSync(rtdDir, { recursive: true });
  fs.mkdirSync(bustangDir, { recursive: true });

  console.log(`Downloading ${RTD_A_LINE_ZIP_URL}...`);
  execFileSync("curl.exe", ["-sSL", RTD_A_LINE_ZIP_URL, "-o", rtdZip]);
  console.log(`Downloading ${BUSTANG_ZIP_URL}...`);
  execFileSync("curl.exe", ["-sSL", BUSTANG_ZIP_URL, "-o", bustangZip]);

  execFileSync("tar.exe", ["-xf", rtdZip, "-C", rtdDir]);
  execFileSync("tar.exe", ["-xf", bustangZip, "-C", bustangDir]);
  return tmpRoot;
}

const args = process.argv.slice(2);
const fromDirIdx = args.indexOf("--from-dir");
const sourceBaseDir =
  fromDirIdx !== -1 && args[fromDirIdx + 1]
    ? path.resolve(args[fromDirIdx + 1])
    : downloadAndExtractToTemp();

const rtdBundle = extractRouteBundle({
  dir: path.join(sourceBaseDir, "rtd_pt_cr"),
  operatorId: "rtd_a_line",
  operatorName: "RTD University of Colorado A Line",
  routeId: "A",
  archiveUrl: RTD_A_LINE_ZIP_URL,
  originStopId: "34476",
  destStopId: "34667",
});

const bustangWestBundle = extractRouteBundle({
  dir: path.join(sourceBaseDir, "bustang"),
  operatorId: "cdot_bustang_west",
  operatorName: "CDOT Bustang West Line",
  routeId: "WEST",
  archiveUrl: BUSTANG_ZIP_URL,
  originStopId: "34316",
  destStopId: "35174",
});

const pegasusBundle = extractRouteBundle({
  dir: path.join(sourceBaseDir, "bustang"),
  operatorId: "cdot_pegasus",
  operatorName: "CDOT Bustang Pegasus Shuttle Van",
  routeId: "PEGA",
  archiveUrl: BUSTANG_ZIP_URL,
  originStopId: "34385",
  destStopId: "35174",
});

const effectiveStartDate = [
  rtdBundle.feedStartDate,
  bustangWestBundle.feedStartDate,
  pegasusBundle.feedStartDate,
]
  .sort()
  .pop();

const effectiveEndDate = [
  rtdBundle.feedEndDate,
  bustangWestBundle.feedEndDate,
  pegasusBundle.feedEndDate,
]
  .sort()
  .shift();

const outputLines = [
  "// Auto-generated by scripts/dcc/refresh-denver-vail-gtfs-schedule.mjs",
  `// RTD A Line feed_version: ${rtdBundle.feedVersion} (${rtdBundle.feedStartDate} to ${rtdBundle.feedEndDate})`,
  `// CDOT Bustang West Line feed_version: ${bustangWestBundle.feedVersion} (${bustangWestBundle.feedStartDate} to ${bustangWestBundle.feedEndDate})`,
  `// CDOT Pegasus feed_version: ${pegasusBundle.feedVersion} (${pegasusBundle.feedStartDate} to ${pegasusBundle.feedEndDate})`,
  "",
  "export interface GtfsCorridorTrip {",
  "  tripId: string;",
  "  serviceId: string;",
  "  dep: string; // HH:MM:SS",
  "  arr: string; // HH:MM:SS",
  "}",
  "",
  "export interface GtfsCalendarRow {",
  "  serviceId: string;",
  "  monday: boolean;",
  "  tuesday: boolean;",
  "  wednesday: boolean;",
  "  thursday: boolean;",
  "  friday: boolean;",
  "  saturday: boolean;",
  "  sunday: boolean;",
  "  startDate: string; // YYYY-MM-DD",
  "  endDate: string; // YYYY-MM-DD",
  "}",
  "",
  "export interface GtfsCalendarDateException {",
  "  serviceId: string;",
  "  date: string; // YYYY-MM-DD",
  "  exceptionType: 1 | 2; // 1 = added, 2 = removed",
  "}",
  "",
  "export interface OperatorRouteScheduleBundle {",
  "  operatorId: 'rtd_a_line' | 'cdot_bustang_west' | 'cdot_pegasus';",
  "  operatorName: string;",
  "  routeId: string;",
  "  archiveUrl: string;",
  "  feedVersion: string;",
  "  feedStartDate: string;",
  "  feedEndDate: string;",
  "  calendar: GtfsCalendarRow[];",
  "  calendarDates: GtfsCalendarDateException[];",
  "  tripsByService: Record<string, GtfsCorridorTrip[]>;",
  "}",
  "",
  "export const DENVER_VAIL_GTFS_METADATA = {",
  `  validStartDate: '${effectiveStartDate}',`,
  `  validEndDate: '${effectiveEndDate}',`,
  `  rtdALineFeedVersion: '${rtdBundle.feedVersion}',`,
  `  bustangFeedVersion: '${bustangWestBundle.feedVersion}',`,
  "  refreshCommand: 'node scripts/dcc/refresh-denver-vail-gtfs-schedule.mjs',",
  "  refreshRunbookPath: 'docs/dcc/denver-vail-gtfs-schedule-refresh.md',",
  "  stops: {",
  "    denAirportStation: {",
  "      stopId: '34476',",
  "      parentStationId: '34503',",
  "      stopName: 'Denver Airport Station',",
  "      platformLabel: 'DEN Transit Center Level 1 (Track 1/2)',",
  "    },",
  "    unionStationRail: {",
  "      stopId: '34667',",
  "      parentStationId: '33727',",
  "      stopName: 'Union Station Track 1',",
  "      platformLabel: 'Commuter Rail Track 1',",
  "    },",
  "    unionStationBustangGate: {",
  "      stopId: '34316',",
  "      stopName: 'Union Station Gate B19',",
  "      platformLabel: 'Underground Bus Concourse · Gate B19',",
  "    },",
  "    unionStationPegasusStop: {",
  "      stopId: '34385',",
  "      stopName: 'Wewatta St & 17th St',",
  "      platformLabel: 'Streetside Stop · Wewatta St & 17th St',",
  "    },",
  "    vailTransportationCenter: {",
  "      stopId: '35174',",
  "      stopName: 'Vail Transportation Center',",
  "      platformLabel: '241 S Frontage Rd E, Vail',",
  "    },",
  "  },",
  "} as const;",
  "",
  `export const RTD_A_LINE_SCHEDULE_BUNDLE: OperatorRouteScheduleBundle = ${JSON.stringify(rtdBundle, null, 2)};`,
  "",
  `export const BUSTANG_WEST_SCHEDULE_BUNDLE: OperatorRouteScheduleBundle = ${JSON.stringify(bustangWestBundle, null, 2)};`,
  "",
  `export const PEGASUS_SCHEDULE_BUNDLE: OperatorRouteScheduleBundle = ${JSON.stringify(pegasusBundle, null, 2)};`,
  "",
];

fs.writeFileSync(OUTPUT_TS_PATH, outputLines.join("\n"), "utf8");
console.log(
  `Updated ${OUTPUT_TS_PATH} (valid ${effectiveStartDate} -> ${effectiveEndDate})`,
);
