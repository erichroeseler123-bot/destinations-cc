/**
 * Shared Proven Tour Catalog & Next-Eligible Departure Resolver
 *
 * Consolidates the two proven New Orleans airboat excursions (`15200P6` and `15200P1`)
 * into a single canonical definition shared across DCC, Cruise Promenade, and
 * Welcome to New Orleans Tours (WNO), backed by the shared Neon catalog.
 *
 * Enforces:
 * 1. Next eligible departure resolution in `America/Chicago` (never defaults a customer
 *    to a departure time that has already passed today when a later departure is eligible).
 * 2. Strict separation between:
 *    - `catalogRecord` (approved static option & logistics from catalog)
 *    - `sourcedSailingSchedule` (ship dock window & all-aboard; return margin is shown ONLY when all-aboard is confirmed)
 *    - `liveProviderQuote` (real-time Viator Partner API v2 availability & group total)
 * 3. Joint validation of `(provider, providerAccount, productCode, optionCode, checkoutDestinationUrl)`.
 * 4. Explicit Viator carryover truth (especially that departure time must be selected/confirmed in Viator's web widget).
 */

export interface ApprovedTourOptionSpec {
  optionCode: string;
  departureTime: string; // HH:mm in local timeZone
  startTime: string; // alias for departureTime (HH:mm)
  displayTime: string; // e.g. "2:10 p.m."
  title: string;
  durationMinutes: number;
  checkInCutoffMinutes: number;
  pickupFulfillmentType: "hotel_pickup" | "self_drive_meeting_point";
  meetingPointName: string;
  meetingPointAddress: string;
  pierToMeetingMinutes: number;
  meetingToPierMinutes: number;
  operatingMonths: number[]; // 1..12
  seasonalNote?: string;
}

export interface ProvenCatalogTourSpec {
  tourId: string;
  provider: "viator";
  providerAccount: string;
  mcid: string;
  productCode: "15200P6" | "15200P1";
  title: string;
  operatorName: string;
  portSlug: "new-orleans";
  timeZone: "America/Chicago";
  vesselCapacityPassengers: number;
  singleVesselPolicy: "requires_separate_operator_verification";
  singleVesselNote: string;
  fromPriceUsd: number;
  canonicalProductUrl: string;
  options: ApprovedTourOptionSpec[];
}

export const PROVEN_NEW_ORLEANS_TOURS: Record<"15200P6" | "15200P1", ProvenCatalogTourSpec> = {
  "15200P6": {
    tourId: "dcc:tour:viator:15200P6",
    provider: "viator",
    providerAccount: "P00306962",
    mcid: "42383",
    productCode: "15200P6",
    title: "New Orleans High Speed 16 Passenger Airboat Ride",
    operatorName: "Louisiana Tour Company",
    portSlug: "new-orleans",
    timeZone: "America/Chicago",
    vesselCapacityPassengers: 16,
    singleVesselPolicy: "requires_separate_operator_verification",
    singleVesselNote:
      "Operates 16-passenger high-speed airboats. Viator live availability confirms aggregate seats in the departure slot across boats; verify single-boat assignment separately with Louisiana Tour Company if your group wants one boat.",
    fromPriceUsd: 97,
    canonicalProductUrl:
      "https://www.viator.com/tours/New-Orleans/High-Speed-16-Passenger-Airboat-Ride/d675-15200P6?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
    options: [
      {
        optionCode: "TG10",
        departureTime: "08:00",
        startTime: "08:00",
        displayTime: "8:00 a.m.",
        title: "8:00 AM Tour with French Quarter Hotel Pickup (Hotel Monteleone — 214 Royal St)",
        durationMinutes: 240,
        checkInCutoffMinutes: 15,
        pickupFulfillmentType: "hotel_pickup",
        meetingPointName:
          "Hotel Monteleone — Royal Street Main Entrance (214 Royal St, New Orleans, LA 70130)",
        meetingPointAddress: "214 Royal St, New Orleans, LA 70130",
        pierToMeetingMinutes: 15,
        meetingToPierMinutes: 15,
        operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
      {
        optionCode: "TG1",
        departureTime: "10:15",
        startTime: "10:15",
        displayTime: "10:15 a.m.",
        title: "10:15 AM Airboat & Swamp Tour with Pickup",
        durationMinutes: 225,
        checkInCutoffMinutes: 15,
        pickupFulfillmentType: "hotel_pickup",
        meetingPointName:
          "Hotel Monteleone — Royal Street Main Entrance (214 Royal St, New Orleans, LA 70130)",
        meetingPointAddress: "214 Royal St, New Orleans, LA 70130",
        pierToMeetingMinutes: 15,
        meetingToPierMinutes: 15,
        operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
    ],
  },
  "15200P1": {
    tourId: "dcc:tour:viator:15200P1",
    provider: "viator",
    providerAccount: "P00306962",
    mcid: "42383",
    productCode: "15200P1",
    title: "New Orleans Large Airboat Swamp Tour",
    operatorName: "Louisiana Tour Company",
    portSlug: "new-orleans",
    timeZone: "America/Chicago",
    vesselCapacityPassengers: 16,
    singleVesselPolicy: "requires_separate_operator_verification",
    singleVesselNote:
      "15200P1 operates 16-passenger large airboats. Viator /availability/check confirms aggregate slot capacity across boats. To keep a group on a single boat, book all passengers on one reservation and verify single-boat assignment separately with Louisiana Tour Company.",
    fromPriceUsd: 65,
    canonicalProductUrl:
      "https://www.viator.com/tours/New-Orleans/Large-Airboat-Swamp-Tour/d675-15200P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
    options: [
      {
        optionCode: "TG9",
        departureTime: "09:40",
        startTime: "09:40",
        displayTime: "9:40 a.m.",
        title: "9:40 AM Large Airboat Swamp Tour (Self-Drive · 9706 Barataria Blvd)",
        durationMinutes: 100,
        checkInCutoffMinutes: 20,
        pickupFulfillmentType: "self_drive_meeting_point",
        meetingPointName:
          "Louisiana Tour Company Airboat Dock — 9706 Barataria Blvd, Marrero, LA 70072",
        meetingPointAddress: "9706 Barataria Blvd, Marrero, LA 70072",
        pierToMeetingMinutes: 25,
        meetingToPierMinutes: 25,
        operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
      {
        optionCode: "TG2",
        departureTime: "12:10",
        startTime: "12:10",
        displayTime: "12:10 p.m.",
        title: "12:10 PM Large Airboat Swamp Tour (Self-Drive · 9706 Barataria Blvd)",
        durationMinutes: 100,
        checkInCutoffMinutes: 20,
        pickupFulfillmentType: "self_drive_meeting_point",
        meetingPointName:
          "Louisiana Tour Company Airboat Dock — 9706 Barataria Blvd, Marrero, LA 70072",
        meetingPointAddress: "9706 Barataria Blvd, Marrero, LA 70072",
        pierToMeetingMinutes: 25,
        meetingToPierMinutes: 25,
        operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
      {
        optionCode: "TG6",
        departureTime: "14:10",
        startTime: "14:10",
        displayTime: "2:10 p.m.",
        title: "2:10 PM Large Airboat Swamp Tour (Self-Drive · 9706 Barataria Blvd)",
        durationMinutes: 100,
        checkInCutoffMinutes: 20,
        pickupFulfillmentType: "self_drive_meeting_point",
        meetingPointName:
          "Louisiana Tour Company Airboat Dock — 9706 Barataria Blvd, Marrero, LA 70072",
        meetingPointAddress: "9706 Barataria Blvd, Marrero, LA 70072",
        pierToMeetingMinutes: 25,
        meetingToPierMinutes: 25,
        operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
      {
        optionCode: "TG7",
        departureTime: "16:15",
        startTime: "16:15",
        displayTime: "4:15 p.m.",
        title: "4:15 PM Large Airboat Swamp Tour (Seasonal — Unavailable in Winter)",
        durationMinutes: 100,
        checkInCutoffMinutes: 20,
        pickupFulfillmentType: "self_drive_meeting_point",
        meetingPointName:
          "Louisiana Tour Company Airboat Dock — 9706 Barataria Blvd, Marrero, LA 70072",
        meetingPointAddress: "9706 Barataria Blvd, Marrero, LA 70072",
        pierToMeetingMinutes: 25,
        meetingToPierMinutes: 25,
        operatingMonths: [3, 4, 5, 6, 7, 8, 9, 10],
        seasonalNote:
          "Seasonal afternoon departure (unavailable Nov–Feb; returns TRAVELER_MISMATCH)",
      },
    ],
  },
};

export function parseHhMmToMinutes(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null;
  const m = String(hhmm).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function formatMinutesToHhMm(totalMinutes: number): string {
  const clamped = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatHhMmTo12Hour(hhmm: string): string {
  const mins = parseHhMmToMinutes(hhmm);
  if (mins === null) return hhmm;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? "p.m." : "a.m.";
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function getLocalNowInTimeZone(
  timeZone = "America/Chicago",
  now: Date = new Date()
): {
  dateStr: string;
  dateIso: string;
  timeStr: string;
  minutesSinceMidnight: number;
  tomorrowDateStr: string;
} {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "00";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;
  const minute = Number(get("minute"));
  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  const tomorrowUtc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + 1));
  const tomorrowDateStr = tomorrowUtc.toISOString().slice(0, 10);

  return {
    dateStr,
    dateIso: dateStr,
    timeStr,
    minutesSinceMidnight: hour * 60 + minute,
    tomorrowDateStr,
  };
}

export interface NextEligibleDepartureResolution {
  productCode: "15200P6" | "15200P1";
  resolvedDate: string;
  selectedOption: ApprovedTourOptionSpec;
  autoAdvancedFromPastOption: boolean;
  autoAdvancedFromPast: boolean;
  previousPastOptionsSkipped: string[];
  skippedPastOptions: string[];
  skippedSeasonalOptions: string[];
  eligibleOptionsForDate: ApprovedTourOptionSpec[];
  localNowDate: string;
  localNowTime: string;
  timeZone: "America/Chicago";
  returnAtPierTime: string;
  returnAtPierDisplayTime: string;
  reason: string;
}

/**
 * Resolves the next eligible departure in `America/Chicago` for a given date (or today).
 * - If `date` is today in `America/Chicago` and no explicit option was pinned (or `autoAdvanceIfPast` is true),
 *   automatically skips departures that have already passed today (e.g. skipping 9:40 a.m. TG9 and 12:10 p.m. TG2
 *   at 12:18 p.m. CST and selecting 2:10 p.m. TG6).
 * - If no `date` is provided, defaults to today in `America/Chicago` when today still has an eligible future departure,
 *   or tomorrow in `America/Chicago` if all of today's departures have passed.
 */
export function resolveNextEligibleTourOption(params: {
  productCode?: string | null;
  date?: string | null;
  explicitOptionCode?: string | null;
  autoAdvanceIfPast?: boolean;
  now?: Date;
}): NextEligibleDepartureResolution {
  const normalizedCode =
    String(params.productCode || "15200P1")
      .trim()
      .toUpperCase() === "15200P6"
      ? "15200P6"
      : "15200P1";
  const spec = PROVEN_NEW_ORLEANS_TOURS[normalizedCode];
  const localNow = getLocalNowInTimeZone(spec.timeZone, params.now);

  const rawDate = String(params.date || "").trim();
  const isExplicitToday = rawDate.toLowerCase() === "today";
  const hasValidExplicitDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate);

  const getEligibleOptionsForDateStr = (targetDate: string): ApprovedTourOptionSpec[] => {
    const monthNum = Number(targetDate.slice(5, 7)) || 1;
    const isToday = targetDate === localNow.dateStr;
    return spec.options.filter((opt) => {
      if (!opt.operatingMonths.includes(monthNum)) return false;
      if (isToday) {
        const depMins = parseHhMmToMinutes(opt.departureTime);
        if (depMins !== null && depMins <= localNow.minutesSinceMidnight) {
          return false;
        }
      }
      return true;
    });
  };

  let resolvedDate: string;
  if (hasValidExplicitDate) {
    resolvedDate = rawDate;
  } else if (isExplicitToday) {
    resolvedDate = localNow.dateStr;
  } else {
    const todayEligible = getEligibleOptionsForDateStr(localNow.dateStr);
    resolvedDate = todayEligible.length > 0 ? localNow.dateStr : localNow.tomorrowDateStr;
  }

  const eligibleForDate = getEligibleOptionsForDateStr(resolvedDate);
  const isToday = resolvedDate === localNow.dateStr;
  const monthNum = Number(resolvedDate.slice(5, 7)) || 1;
  const previousPastOptionsSkipped: string[] = [];
  const skippedSeasonalOptions: string[] = [];
  for (const opt of spec.options) {
    if (!opt.operatingMonths.includes(monthNum)) {
      skippedSeasonalOptions.push(`${opt.optionCode} (${opt.departureTime})`);
      continue;
    }
    if (isToday) {
      const depMins = parseHhMmToMinutes(opt.departureTime);
      if (depMins !== null && depMins <= localNow.minutesSinceMidnight) {
        previousPastOptionsSkipped.push(`${opt.optionCode} (${opt.departureTime})`);
      }
    }
  }

  const normalizedExplicitOpt = String(params.explicitOptionCode || "")
    .trim()
    .toUpperCase();
  const matchedExplicit = normalizedExplicitOpt
    ? spec.options.find((o) => o.optionCode.toUpperCase() === normalizedExplicitOpt) || null
    : null;

  let selectedOption: ApprovedTourOptionSpec;
  let autoAdvancedFromPastOption = false;

  if (matchedExplicit) {
    const depMins = parseHhMmToMinutes(matchedExplicit.departureTime);
    const isExplicitPastToday =
      isToday && depMins !== null && depMins <= localNow.minutesSinceMidnight;
    if (isExplicitPastToday && params.autoAdvanceIfPast && eligibleForDate.length > 0) {
      selectedOption = eligibleForDate[0];
      autoAdvancedFromPastOption = true;
    } else {
      selectedOption = matchedExplicit;
    }
  } else if (eligibleForDate.length > 0) {
    selectedOption = eligibleForDate[0];
    autoAdvancedFromPastOption = previousPastOptionsSkipped.length > 0;
  } else {
    selectedOption = spec.options[0];
  }

  const startMins = parseHhMmToMinutes(selectedOption.departureTime) ?? 580;
  const returnMins =
    startMins + selectedOption.durationMinutes + selectedOption.meetingToPierMinutes;
  const returnAtPierTime = formatMinutesToHhMm(returnMins);

  const reason = autoAdvancedFromPastOption
    ? `Skipped past today departure(s) [${previousPastOptionsSkipped.join(", ")}] at ${localNow.timeStr} ${spec.timeZone} and selected next eligible departure ${selectedOption.optionCode} (${selectedOption.displayTime}).`
    : `Selected ${selectedOption.optionCode} (${selectedOption.displayTime}) for ${resolvedDate} in ${spec.timeZone}.`;

  return {
    productCode: normalizedCode,
    resolvedDate,
    selectedOption,
    autoAdvancedFromPastOption,
    autoAdvancedFromPast: autoAdvancedFromPastOption,
    previousPastOptionsSkipped,
    skippedPastOptions: previousPastOptionsSkipped,
    skippedSeasonalOptions,
    eligibleOptionsForDate: eligibleForDate,
    localNowDate: localNow.dateStr,
    localNowTime: localNow.timeStr,
    timeZone: spec.timeZone,
    returnAtPierTime,
    returnAtPierDisplayTime: formatHhMmTo12Hour(returnAtPierTime),
    reason,
  };
}

export interface CatalogCheckoutValidationResult {
  valid: boolean;
  provider: "viator" | "fareharbor";
  providerAccount: string;
  productCode: string;
  optionCode: string | null;
  checkoutDestinationUrl: string;
  errors: string[];
}

/**
 * Validates that provider, providerAccount, productCode, optionCode, and checkoutDestinationUrl
 * agree before rendering or executing a checkout handoff.
 */
export function validateCatalogCheckoutBinding(params: {
  provider: "viator" | "fareharbor";
  providerAccount: string;
  productCode: string;
  optionCode?: string | null;
  checkoutDestinationUrl: string;
}): CatalogCheckoutValidationResult {
  const errors: string[] = [];
  const url = String(params.checkoutDestinationUrl || "").trim();
  const code = String(params.productCode || "").trim();

  if (params.provider === "viator") {
    if (!url.includes("viator.com/")) {
      errors.push(
        `Provider 'viator' (${code}) cannot target non-Viator checkout URL: ${url}`
      );
    }
    if (url.includes("fareharbor.com")) {
      errors.push(
        `Provider 'viator' (${code}) must never target a FareHarbor URL: ${url}`
      );
    }
    if (code && !url.toUpperCase().includes(code.toUpperCase())) {
      errors.push(
        `Viator checkout URL (${url}) does not contain productCode ${code}`
      );
    }
  } else if (params.provider === "fareharbor") {
    if (!url.includes("fareharbor.com/")) {
      errors.push(
        `Provider 'fareharbor' (${code}) must target a fareharbor.com URL: ${url}`
      );
    }
    if (code && /^\d+$/.test(code) && !url.includes(`/items/${code}`)) {
      errors.push(
        `FareHarbor checkout URL (${url}) does not match item ${code}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    provider: params.provider,
    providerAccount: params.providerAccount,
    productCode: code,
    optionCode: params.optionCode || null,
    checkoutDestinationUrl: url,
    errors,
  };
}

export interface ViatorCarryoverTruth {
  productCode: string;
  optionCode: string;
  departureTime: string;
  displayTime: string;
  date: string;
  partySize: number;
  groupTotalUsd: number | null;
  carriedInUrlAutomatically: string[];
  requiresManualSelectionOnViator: string[];
  departureTimeCarriesOverAutomatically: false;
  carriesOverAutomatically: {
    providerAccount: string;
    mcid: string;
    productCode: string;
    campaignAttribution: boolean;
    clickIdAttribution: boolean;
    departureTimeOptionPreselectedOnViatorWeb: false;
  };
  requiresTravelerConfirmationOnViator: {
    optionCode: string;
    optionTitle: string;
    startTime: string;
    displayTime: string;
    date: string;
    partySize: number;
  };
  travelerInstruction: string;
}

export function buildViatorCarryoverTruth(params: {
  productCode: string;
  optionCode: string;
  departureTime?: string;
  startTime?: string;
  optionTitle?: string;
  displayTime?: string;
  date: string;
  partySize: number;
  groupTotalUsd?: number | null;
}): ViatorCarryoverTruth {
  const resolvedDepTime = params.departureTime || params.startTime || "14:10";
  const dispTime = params.displayTime || formatHhMmTo12Hour(resolvedDepTime);
  const priceLabel =
    typeof params.groupTotalUsd === "number"
      ? ` ($${params.groupTotalUsd.toFixed(2)} total)`
      : "";
  return {
    productCode: params.productCode,
    optionCode: params.optionCode,
    departureTime: resolvedDepTime,
    displayTime: dispTime,
    date: params.date,
    partySize: params.partySize,
    groupTotalUsd: params.groupTotalUsd ?? null,
    carriedInUrlAutomatically: [
      `Exact Viator product (${params.productCode})`,
      "Affiliate attribution (pid=P00306962, mcid=42383, campaign, click_id)",
      `URL query parameters (startDate=${params.date}, numTravelers=${params.partySize})`,
    ],
    requiresManualSelectionOnViator: [
      `Departure time ${dispTime} (Option ${params.optionCode}) — Viator's public web widget does not pre-lock the departure time from URL query parameters`,
      `Date (${params.date}) and ${params.partySize} Adults${priceLabel} in the Viator availability box`,
    ],
    departureTimeCarriesOverAutomatically: false,
    carriesOverAutomatically: {
      providerAccount: "P00306962",
      mcid: "42383",
      productCode: params.productCode,
      campaignAttribution: true,
      clickIdAttribution: true,
      departureTimeOptionPreselectedOnViatorWeb: false,
    },
    requiresTravelerConfirmationOnViator: {
      optionCode: params.optionCode,
      optionTitle: params.optionTitle || `Option ${params.optionCode}`,
      startTime: resolvedDepTime,
      displayTime: dispTime,
      date: params.date,
      partySize: params.partySize,
    },
    travelerInstruction: `This link opens exact Viator product ${params.productCode} with affiliate tracking. Because Viator's web page does not auto-lock the departure time from the URL, confirm ${params.date}, ${params.partySize} travelers, and click the ${dispTime} (Option ${params.optionCode}) time slot on Viator${priceLabel}.`,
  };
}

