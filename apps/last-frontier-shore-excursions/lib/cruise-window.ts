import { CruiseWindowCalculation, PortSlug } from "./affiliate/types";

export interface DockTransferInfo {
  dockName: string;
  portSlug: PortSlug;
  transferMinutesEachWay: number;
  transferType: "dockside_walk" | "port_shuttle" | "tender_boat";
  logisticsNote: string;
}

export const DOCK_TRANSFERS: Record<string, DockTransferInfo> = {
  // Juneau
  "franklin-dock": {
    dockName: "Franklin Dock",
    portSlug: "juneau",
    transferMinutesEachWay: 10,
    transferType: "dockside_walk",
    logisticsNote: "Direct downtown walk or 5-min walk to Mt. Roberts Tram plaza.",
  },
  "marine-dock": {
    dockName: "Marine Dock",
    portSlug: "juneau",
    transferMinutesEachWay: 8,
    transferType: "dockside_walk",
    logisticsNote: "Center downtown waterfront; quick flat walk to all central meeting spots.",
  },
  "steamship-dock": {
    dockName: "Steamship Dock",
    portSlug: "juneau",
    transferMinutesEachWay: 8,
    transferType: "dockside_walk",
    logisticsNote: "Adjacent to Marine Park in downtown Juneau.",
  },
  "aj-dock": {
    dockName: "AJ Dock",
    portSlug: "juneau",
    transferMinutesEachWay: 20,
    transferType: "port_shuttle",
    logisticsNote: "Located 1 mile south of downtown. Requires 15-20 min dedicated port shuttle to Mt. Roberts Tram lot.",
  },

  // Skagway
  "railroad-dock": {
    dockName: "Railroad Dock",
    portSlug: "skagway",
    transferMinutesEachWay: 8,
    transferType: "dockside_walk",
    logisticsNote: "Direct train boarding alongside the ship. 10-min flat walk into Broadway.",
  },
  "broadway-dock": {
    dockName: "Broadway Dock",
    portSlug: "skagway",
    transferMinutesEachWay: 5,
    transferType: "dockside_walk",
    logisticsNote: "Steps from the foot of historic Broadway street.",
  },
  "ore-dock": {
    dockName: "Ore Dock",
    portSlug: "skagway",
    transferMinutesEachWay: 7,
    transferType: "dockside_walk",
    logisticsNote: "Short flat paved stroll into downtown Skagway.",
  },

  // Ketchikan
  "ketchikan-berths-1-4": {
    dockName: "Downtown Berths 1–4",
    portSlug: "ketchikan",
    transferMinutesEachWay: 5,
    transferType: "dockside_walk",
    logisticsNote: "Right on the downtown Ketchikan promenade; steps from Creek Street and tour kiosks.",
  },
  "ward-cove": {
    dockName: "Ward Cove Mill",
    portSlug: "ketchikan",
    transferMinutesEachWay: 35,
    transferType: "port_shuttle",
    logisticsNote: "7 miles north of town. Complimentary shuttle takes 20-30 mins each way plus loading queue.",
  },

  // Sitka
  "sitka-sound-terminal": {
    dockName: "Sitka Sound Cruise Terminal (Old Sitka)",
    portSlug: "sitka",
    transferMinutesEachWay: 25,
    transferType: "port_shuttle",
    logisticsNote: "5 miles north of town. Free continuous shuttle bus takes 10-15 mins each way plus line queue.",
  },
  "crescent-harbor-tender": {
    dockName: "Crescent Harbor / Tender Pier",
    portSlug: "sitka",
    transferMinutesEachWay: 35,
    transferType: "tender_boat",
    logisticsNote: "Used by boutique ships. Tendering requires 20-30 mins per transit plus boarding intervals.",
  },

  // Icy Strait Point
  "wilderness-dock": {
    dockName: "Wilderness Dock",
    portSlug: "icy-strait-point",
    transferMinutesEachWay: 10,
    transferType: "dockside_walk",
    logisticsNote: "Direct gangway access connected to the Welcome Center by short flat boardwalk.",
  },
  "ocean-raft-tender": {
    dockName: "Adventure Dock",
    portSlug: "icy-strait-point",
    transferMinutesEachWay: 15,
    transferType: "dockside_walk",
    logisticsNote: "Accessible via the free high-speed Transporter Gondola (4 mins).",
  },
};

export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toLowerCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3];

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function formatMinutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const paddedMins = mins < 10 ? `0${mins}` : mins;
  return `${hours12}:${paddedMins} ${meridiem}`;
}

export function calculateCruiseWindow({
  arrivalTimeStr,
  allAboardTimeStr,
  meetingTimeStr,
  durationMinutes,
  dockKey,
  planningMarginMinutes = 45,
}: {
  arrivalTimeStr: string;
  allAboardTimeStr: string;
  meetingTimeStr: string;
  durationMinutes: number;
  dockKey?: string;
  planningMarginMinutes?: number;
}): CruiseWindowCalculation {
  const arrivalMinutes = parseTimeToMinutes(arrivalTimeStr);
  const allAboardMinutes = parseTimeToMinutes(allAboardTimeStr);
  const meetingMinutes = parseTimeToMinutes(meetingTimeStr);

  if (arrivalMinutes === null || allAboardMinutes === null || meetingMinutes === null || durationMinutes <= 0) {
    return {
      status: "unknown",
      statusLabel: "Timing Info Needed",
      safetyBufferMinutes: 0,
      tourEndTimeMinutes: 0,
      returnToPierMinutes: 0,
      allAboardMinutes: allAboardMinutes || 0,
      summary: "Enter your ship's arrival time, all-aboard time, and tour departure time to compute feasibility.",
      reasons: ["Ship arrival or all-aboard time is missing or unparseable."],
    };
  }

  const dock = dockKey ? DOCK_TRANSFERS[dockKey] : undefined;
  const transferMinutesOneWay = dock ? dock.transferMinutesEachWay : 15;
  const totalTransferReturnMinutes = transferMinutesOneWay;

  const tourEndTimeMinutes = meetingMinutes + durationMinutes;
  const returnToPierMinutes = tourEndTimeMinutes + totalTransferReturnMinutes;
  const safetyBufferMinutes = allAboardMinutes - returnToPierMinutes;

  const reasons: string[] = [];

  // Check if meeting time is too close to ship arrival
  const disembarkBuffer = meetingMinutes - arrivalMinutes;
  if (disembarkBuffer < 45) {
    reasons.push(
      `Tour meeting at ${formatMinutesToTime(meetingMinutes)} is only ${disembarkBuffer} mins after arrival at ${formatMinutesToTime(arrivalMinutes)}. Ship clearance typically requires at least 45 mins.`
    );
  }

  if (dock && dock.transferType !== "dockside_walk") {
    reasons.push(`${dock.dockName} requires ${dock.transferMinutesEachWay} min transit buffer (${dock.logisticsNote})`);
  }

  if (safetyBufferMinutes < 45) {
    reasons.push(
      `Calculated return to pier is ${formatMinutesToTime(returnToPierMinutes)}, leaving only ${safetyBufferMinutes} mins before ${formatMinutesToTime(allAboardMinutes)} all-aboard (minimum safe standard is ${planningMarginMinutes} mins).`
    );
    return {
      status: "does_not_fit",
      statusLabel: "Does Not Fit",
      safetyBufferMinutes,
      tourEndTimeMinutes,
      returnToPierMinutes,
      allAboardMinutes,
      summary: `Violates 45-minute safety rule: Return to gangway at ${formatMinutesToTime(returnToPierMinutes)} is too close to ${formatMinutesToTime(allAboardMinutes)} all-aboard.`,
      reasons,
    };
  }

  if (safetyBufferMinutes < 90) {
    reasons.push(
      `Calculated pier arrival is ${formatMinutesToTime(returnToPierMinutes)}, providing a ${safetyBufferMinutes}-minute margin before all-aboard.`
    );
    return {
      status: "tight_fit",
      statusLabel: "Tight Fit (Meets 45-Min Rule)",
      safetyBufferMinutes,
      tourEndTimeMinutes,
      returnToPierMinutes,
      allAboardMinutes,
      summary: `Tight but feasible: ${safetyBufferMinutes} minutes remaining between dock return and all-aboard. Avoid unexpected delays.`,
      reasons,
    };
  }

  reasons.push(
    `Generous buffer: ${safetyBufferMinutes} minutes between dock return at ${formatMinutesToTime(returnToPierMinutes)} and all-aboard at ${formatMinutesToTime(allAboardMinutes)}.`
  );

  return {
    status: "strong_fit",
    statusLabel: "Strong Fit",
    safetyBufferMinutes,
    tourEndTimeMinutes,
    returnToPierMinutes,
    allAboardMinutes,
    summary: `Excellent cruise day fit. Arrives back at the pier with ${safetyBufferMinutes} minutes to spare.`,
    reasons,
  };
}
