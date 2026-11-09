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
  scheduledStartTimes?: string[];
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

export type ApprovedCatalogProductCode = "15200P6" | "15200P1" | "103974P5";
export type ApprovedCatalogPortSlug = "new-orleans" | "cozumel";
export type ApprovedCatalogTimeZone = "America/Chicago" | "America/Cancun";

export interface ProvenCatalogTourSpec {
  tourId: string;
  provider: "viator";
  providerAccount: string;
  mcid: string;
  productCode: ApprovedCatalogProductCode;
  title: string;
  operatorName: string;
  portSlug: ApprovedCatalogPortSlug;
  timeZone: ApprovedCatalogTimeZone;
  vesselCapacityPassengers: number;
  singleVesselPolicy: "requires_separate_operator_verification" | "standard_group_capacity";
  singleVesselNote: string;
  fromPriceUsd: number;
  canonicalProductUrl: string;
  checkoutLandingUrl?: string;
  expectedUrlPathToken?: string;
  defaultCampaign?: string;
  originatingPage?: string;
  approvedCheckoutOptionCodes?: string[];
  approvedDeparturesByOption?: Record<string, string[]>;
  requiresTravelerConfirmationFields?: string[];
  preparedCheckoutGatedByDefault?: boolean;
  preparedCheckoutGateEnvVar?: string;
  preparedCheckoutGateReason?: string;
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
    checkoutLandingUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-Boat-Adventure-With-Pickup/d675-15200P6",
    expectedUrlPathToken: "/d675-15200P6",
    defaultCampaign: "dcc_nola_tour",
    originatingPage: "/ports/new-orleans",
    approvedCheckoutOptionCodes: ["TG10"],
    approvedDeparturesByOption: {
      TG10: ["08:00"],
    },
    requiresTravelerConfirmationFields: [
      "date",
      "optionCode",
      "departureTime",
      "partySize",
      "pickup point",
    ],
    options: [
      {
        optionCode: "TG10",
        departureTime: "08:00",
        startTime: "08:00",
        scheduledStartTimes: ["08:00"],
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
        scheduledStartTimes: ["10:15"],
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
    checkoutLandingUrl:
      "https://www.viator.com/tours/New-Orleans/Large-Airboat-Swamp-Tour/d675-15200P1",
    expectedUrlPathToken: "/d675-15200P1",
    defaultCampaign: "dcc_nola_tour",
    originatingPage: "/ports/new-orleans",
    approvedCheckoutOptionCodes: ["TG9", "TG2", "TG6", "TG7"],
    approvedDeparturesByOption: {
      TG9: ["09:40"],
      TG2: ["12:10"],
      TG6: ["14:10"],
      TG7: ["16:15"],
    },
    requiresTravelerConfirmationFields: [
      "date",
      "optionCode",
      "departureTime",
      "partySize",
      "meeting point (9706 Barataria Blvd, Marrero)",
      "single-boat grouping with operator if group wants one boat",
    ],
    options: [
      {
        optionCode: "TG9",
        departureTime: "09:40",
        startTime: "09:40",
        scheduledStartTimes: ["09:40"],
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
        scheduledStartTimes: ["12:10"],
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
        scheduledStartTimes: ["14:10"],
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
        scheduledStartTimes: ["16:15"],
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

export const APPROVED_CATALOG_CHECKOUT_TOURS: Record<
  ApprovedCatalogProductCode,
  ProvenCatalogTourSpec
> = {
  ...PROVEN_NEW_ORLEANS_TOURS,
  "103974P5": {
    tourId: "dcc:tour:viator:103974P5",
    provider: "viator",
    providerAccount: "P00306962",
    mcid: "42383",
    productCode: "103974P5",
    title: "Cozumel Snorkeling Tour: Palancar, Columbia and El Cielo Reefs",
    operatorName: "Cozumel Tours and Excursions",
    portSlug: "cozumel",
    timeZone: "America/Cancun",
    vesselCapacityPassengers: 15,
    singleVesselPolicy: "standard_group_capacity",
    singleVesselNote:
      "Supplier: Cozumel Tours and Excursions (SUPPLIER-7gEFhAbRfACoB8LX7J7y1g==). Check-in is 10 minutes before departure (9:50 a.m. for the 10:00 a.m. TG1 tour in Cozumel local time, America/Cancun) at the Cozumel Tours office next to the tequila store at Marina ASIPONA Cozumel (formerly Marina Fonatur, Google Place ChIJhUJKipFXTo8RVdFGMuytpuI). The Maybe-Tours directions appear on a separate private-tour listing; ask the supplier for the exact office pin and expected return time for TG1. Mandatory $11 USD/pp marine fee ($88 for 8 guests) is excluded from the $520 quote; verify how it is collected before showing a combined trip total.",
    fromPriceUsd: 65,
    canonicalProductUrl:
      "https://www.viator.com/tours/Cozumel/Cozumel-Snorkel-tour-Palancar-reef-Columbia-reef-and-El-Cielo-Sandbar/d632-103974P5?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
    checkoutLandingUrl:
      "https://www.viator.com/tours/Cozumel/Cozumel-Snorkel-tour-Palancar-reef-Columbia-reef-and-El-Cielo-Sandbar/d632-103974P5",
    expectedUrlPathToken: "/d632-103974P5",
    defaultCampaign: "dcc_cozumel_tour",
    originatingPage: "/cruise-ships/symphony-of-the-seas/cozumel-shore-excursions",
    approvedCheckoutOptionCodes: ["TG1"],
    approvedDeparturesByOption: {
      TG1: ["10:00", "12:00", "14:00"],
    },
    requiresTravelerConfirmationFields: [
      "date",
      "optionCode",
      "departureTime",
      "partySize",
      "meeting point (Cozumel Tours office next to the tequila store at Marina ASIPONA Cozumel, 10 minutes before departure / 9:50 a.m. for 10:00 a.m. TG1)",
    ],
    preparedCheckoutGatedByDefault: true,
    preparedCheckoutGateEnvVar: "DCC_ENABLE_COZUMEL_103974P5_CHECKOUT",
    preparedCheckoutGateReason:
      "Cozumel 103974P5 / TG1 prepared checkout is gated while verifying: (1) Berth: APIQROO lists Symphony of the Seas at SSA International Pier on Nov. 6, 2026, while Jan. 8, 2027 terminal assignment is pending confirmation from APIQROO or Royal Caribbean; (2) Check-in & Return: Viator 103974P5 directs guests to the Cozumel Tours office next to the tequila store at MARINA ASIPONA COZUMEL (Google Place ChIJhUJKipFXTo8RVdFGMuytpuI) 10 minutes before departure (9:50 a.m. for the 10:00 a.m. tour; Maybe-Tours directions appear on a separate private-tour listing) — exact office pin and expected TG1 return time pending supplier confirmation; (3) All Aboard: Royal Caribbean publishes 8:00 a.m.–6:00 p.m. as the dock window and advises verifying all-aboard onboard (the 5:00 p.m. cutoff and 175-minute margin are test assumptions; record actual cutoff and whether in ship time or Cozumel local time); (4) Transfers: once berth, cutoff, and office pin are confirmed, calculate both transfers including taxi pickup and the walk back to the gangway, then rerun timing fit and live availability for eight; (5) Marine Fee: verify how the $11-per-person marine fee ($88 for 8) is collected alongside the $520 quote before showing a combined trip total.",
    options: [
      {
        optionCode: "TG1",
        departureTime: "10:00",
        startTime: "10:00",
        scheduledStartTimes: ["10:00", "12:00", "14:00"],
        displayTime: "10:00 a.m.",
        title: "Cozumel Snorkel Tour: Palancar, Columbia and Cielo Reefs",
        durationMinutes: 240,
        checkInCutoffMinutes: 10,
        pickupFulfillmentType: "self_drive_meeting_point",
        meetingPointName:
          "Cozumel Tours office next to the tequila store at Marina ASIPONA Cozumel (Formerly Known as Marina Fonatur, Google Place ChIJhUJKipFXTo8RVdFGMuytpuI)",
        meetingPointAddress:
          "Carretera Costera Sur Km 6.0, Marina ASIPONA Cozumel (ex-Marina Fonatur), 77600 Cozumel, Q.R., Mexico",
        pierToMeetingMinutes: 5,
        meetingToPierMinutes: 5,
        operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
    ],
  },
};

export function isCatalogTourPreparedCheckoutEnabled(
  productCodeOrTourId: string | null | undefined
): boolean {
  const spec = getApprovedCatalogTourSpec(productCodeOrTourId);
  if (!spec) return false;
  if (!spec.preparedCheckoutGatedByDefault) return true;
  if (spec.preparedCheckoutGateEnvVar) {
    const val = String(process.env[spec.preparedCheckoutGateEnvVar] || "")
      .trim()
      .toLowerCase();
    return val === "true" || val === "1";
  }
  return false;
}

export interface CatalogCheckoutApprovalResolution {
  productApproved: boolean;
  selectionApproved: boolean;
  preparedCheckoutEnabled: boolean;
  checkoutGateReason: string | null;
  spec: ProvenCatalogTourSpec | null;
  optionSpec: ApprovedTourOptionSpec | null;
  allowedOptionCodes: string[];
  allowedDeparturesForOption: string[];
  checkoutDestinationUrl: string | null;
  validationMessage: string;
  // Direct spec convenience fields when called with a productCode string:
  provider?: "viator";
  providerAccount?: string;
  mcid?: string;
  productCode?: ApprovedCatalogProductCode;
  portSlug?: ApprovedCatalogPortSlug;
  portTimezone?: ApprovedCatalogTimeZone;
  canonicalProductUrl?: string;
  defaultCampaign?: string;
  pickupLocationSummary?: string;
}

export function getApprovedCatalogTourSpec(
  productCodeOrTourId: string | null | undefined
): ProvenCatalogTourSpec | null {
  const raw = String(productCodeOrTourId || "").trim().toUpperCase();
  if (!raw) return null;
  const cleaned = raw.replace(/^DCC:TOUR:VIATOR:/, "") as ApprovedCatalogProductCode;
  return APPROVED_CATALOG_CHECKOUT_TOURS[cleaned] || null;
}

export function resolveApprovedCatalogCheckoutSpec(
  paramsOrProductCode:
    | string
    | null
    | undefined
    | {
        portSlug?: string | null;
        productCode?: string | null;
        optionCode?: string | null;
        departureTime?: string | null;
      }
): CatalogCheckoutApprovalResolution {
  if (typeof paramsOrProductCode === "string" || !paramsOrProductCode) {
    const spec = getApprovedCatalogTourSpec(paramsOrProductCode);
    if (!spec) {
      return {
        productApproved: false,
        selectionApproved: false,
        preparedCheckoutEnabled: false,
        checkoutGateReason: null,
        spec: null,
        optionSpec: null,
        allowedOptionCodes: [],
        allowedDeparturesForOption: [],
        checkoutDestinationUrl: null,
        validationMessage:
          "Checkout is available for catalog-approved tours: New Orleans 15200P6 / TG10, New Orleans 15200P1 (TG9, TG2, TG6, TG7), and Cozumel 103974P5 / TG1.",
      };
    }
    const allowedOptionCodes =
      spec.approvedCheckoutOptionCodes || spec.options.map((o) => o.optionCode);
    const preparedCheckoutEnabled = isCatalogTourPreparedCheckoutEnabled(spec.productCode);
    return {
      productApproved: true,
      selectionApproved: true,
      preparedCheckoutEnabled,
      checkoutGateReason: preparedCheckoutEnabled
        ? null
        : spec.preparedCheckoutGateReason || null,
      spec,
      optionSpec: spec.options[0] || null,
      allowedOptionCodes,
      allowedDeparturesForOption:
        (spec.options[0] &&
          (spec.approvedDeparturesByOption?.[spec.options[0].optionCode] ||
            spec.options[0].scheduledStartTimes || [spec.options[0].departureTime])) ||
        [],
      checkoutDestinationUrl: spec.checkoutLandingUrl || spec.canonicalProductUrl,
      validationMessage: `Approved catalog product ${spec.productCode} in ${spec.portSlug}.`,
      provider: spec.provider,
      providerAccount: spec.providerAccount,
      mcid: spec.mcid,
      productCode: spec.productCode,
      portSlug: spec.portSlug,
      portTimezone: spec.timeZone,
      canonicalProductUrl: spec.checkoutLandingUrl || spec.canonicalProductUrl,
      defaultCampaign: spec.defaultCampaign,
      pickupLocationSummary: spec.options[0]?.meetingPointName || "",
    };
  }

  const params = paramsOrProductCode;
  const normPort = String(params.portSlug || "").trim().toLowerCase();
  const spec = getApprovedCatalogTourSpec(params.productCode);
  const normCode = spec?.productCode;
  const normOption = String(params.optionCode || "").trim().toUpperCase();
  const normDep = params.departureTime ? String(params.departureTime).trim() : "";

  if (!spec || (normPort && spec.portSlug !== normPort)) {
    return {
      productApproved: false,
      selectionApproved: false,
      preparedCheckoutEnabled: false,
      checkoutGateReason: null,
      spec: null,
      optionSpec: null,
      allowedOptionCodes: [],
      allowedDeparturesForOption: [],
      checkoutDestinationUrl: null,
      validationMessage:
        "Checkout is available for catalog-approved tours: New Orleans 15200P6 / TG10, New Orleans 15200P1 (TG9, TG2, TG6, TG7), and Cozumel 103974P5 / TG1.",
    };
  }

  const preparedCheckoutEnabled = isCatalogTourPreparedCheckoutEnabled(spec.productCode);
  const checkoutGateReason = preparedCheckoutEnabled
    ? null
    : spec.preparedCheckoutGateReason || null;
  const allowedOptionCodes =
    spec.approvedCheckoutOptionCodes || spec.options.map((o) => o.optionCode);
  const allowedDeparturesByOption = spec.approvedDeparturesByOption || {};
  const allowedDeparturesForOption = normOption
    ? allowedDeparturesByOption[normOption] || []
    : [];
  const optionSpec =
    spec.options.find((o) => o.optionCode.toUpperCase() === normOption) || null;
  const isOptionAllowed = Boolean(
    normOption &&
      allowedOptionCodes.includes(normOption) &&
      optionSpec &&
      normDep &&
      allowedDeparturesForOption.includes(normDep),
  );

  if (!isOptionAllowed) {
    const invalidMsg =
      normCode === "15200P1"
        ? "Provide a verified 15200P1 option (TG9 at 09:40, TG2 at 12:10, TG6 at 14:10, or TG7 at 16:15), a valid port date, and 1 to 15 adult travelers."
        : normCode === "103974P5"
          ? "Provide verified Cozumel 103974P5 option TG1 (departure 10:00, 12:00, or 14:00), a valid port date, and 1 to 15 adult travelers."
          : "Provide TG10, a valid port date, the 08:00 departure, and 1 to 15 adult travelers.";
    return {
      productApproved: true,
      selectionApproved: false,
      preparedCheckoutEnabled,
      checkoutGateReason,
      spec,
      optionSpec,
      allowedOptionCodes,
      allowedDeparturesForOption,
      checkoutDestinationUrl: spec.checkoutLandingUrl || spec.canonicalProductUrl,
      validationMessage: invalidMsg,
      provider: spec.provider,
      providerAccount: spec.providerAccount,
      mcid: spec.mcid,
      productCode: spec.productCode,
      portSlug: spec.portSlug,
      portTimezone: spec.timeZone,
      canonicalProductUrl: spec.checkoutLandingUrl || spec.canonicalProductUrl,
      defaultCampaign: spec.defaultCampaign,
      pickupLocationSummary: optionSpec?.meetingPointName || spec.options[0]?.meetingPointName || "",
    };
  }

  return {
    productApproved: true,
    selectionApproved: true,
    preparedCheckoutEnabled,
    checkoutGateReason,
    spec,
    optionSpec,
    allowedOptionCodes,
    allowedDeparturesForOption,
    checkoutDestinationUrl: spec.checkoutLandingUrl || spec.canonicalProductUrl,
    validationMessage: `Approved catalog checkout selection ${spec.productCode} / ${normOption} at ${normDep} in ${spec.portSlug}.`,
    provider: spec.provider,
    providerAccount: spec.providerAccount,
    mcid: spec.mcid,
    productCode: spec.productCode,
    portSlug: spec.portSlug,
    portTimezone: spec.timeZone,
    canonicalProductUrl: spec.checkoutLandingUrl || spec.canonicalProductUrl,
    defaultCampaign: spec.defaultCampaign,
    pickupLocationSummary: optionSpec?.meetingPointName || spec.options[0]?.meetingPointName || "",
  };
}

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
  productCode: ApprovedCatalogProductCode;
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
  timeZone: ApprovedCatalogTimeZone;
  returnAtPierTime: string;
  returnAtPierDisplayTime: string;
  reason: string;
}

/**
 * Resolves the next eligible departure in the product's local timeZone for a given date (or today).
 * - If `date` is today in the local timeZone and no explicit option was pinned (or `autoAdvanceIfPast` is true),
 *   automatically skips departures that have already passed today (e.g. skipping 9:40 a.m. TG9 and 12:10 p.m. TG2
 *   at 12:18 p.m. CST and selecting 2:10 p.m. TG6).
 * - If no `date` is provided, defaults to today in the local timeZone when today still has an eligible future departure,
 *   or tomorrow if all of today's departures have passed.
 */
export function resolveNextEligibleTourOption(params: {
  productCode?: string | null;
  date?: string | null;
  explicitOptionCode?: string | null;
  autoAdvanceIfPast?: boolean;
  now?: Date;
}): NextEligibleDepartureResolution {
  const upperCode = String(params.productCode || "15200P1")
    .trim()
    .toUpperCase();
  const normalizedCode: ApprovedCatalogProductCode =
    upperCode === "15200P6"
      ? "15200P6"
      : upperCode === "103974P5"
        ? "103974P5"
        : "15200P1";
  const spec = APPROVED_CATALOG_CHECKOUT_TOURS[normalizedCode];
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
  approved: boolean;
  errorCode: "UNSUPPORTED_CHECKOUT_PRODUCT" | "INVALID_CHECKOUT_SELECTION" | null;
  reason: string | null;
  matchedOption: ApprovedTourOptionSpec | null;
  provider: "viator" | "fareharbor";
  providerAccount: string;
  productCode: string;
  optionCode: string | null;
  checkoutDestinationUrl: string;
  errors: string[];
}

/**
 * Validates that provider, providerAccount, productCode, optionCode, departureTime, and checkoutDestinationUrl
 * agree with the catalog-backed checkout approval before rendering or executing a checkout handoff.
 */
export function validateCatalogCheckoutBinding(params: {
  provider: "viator" | "fareharbor";
  providerAccount: string;
  mcid?: string | null;
  portSlug?: string | null;
  productCode: string;
  optionCode?: string | null;
  departureTime?: string | null;
  checkoutDestinationUrl: string;
}): CatalogCheckoutValidationResult {
  const errors: string[] = [];
  const url = String(params.checkoutDestinationUrl || "").trim();
  const code = String(params.productCode || "").trim();
  const codeUpper = code.toUpperCase();
  const optionUpper = params.optionCode ? String(params.optionCode).trim().toUpperCase() : null;
  const account = String(params.providerAccount || "").trim();
  let matchedOption: ApprovedTourOptionSpec | null = null;
  let errorCode: "UNSUPPORTED_CHECKOUT_PRODUCT" | "INVALID_CHECKOUT_SELECTION" | null = null;

  if (params.provider === "viator") {
    if (!url.includes("viator.com/")) {
      errors.push(
        `Provider 'viator' (${code}) cannot target non-Viator checkout URL: ${url}`
      );
      errorCode = "UNSUPPORTED_CHECKOUT_PRODUCT";
    }
    if (url.includes("fareharbor.com")) {
      errors.push(
        `Provider 'viator' (${code}) must never target a FareHarbor URL: ${url}`
      );
      errorCode = "UNSUPPORTED_CHECKOUT_PRODUCT";
    }
    if (code && !url.toUpperCase().includes(codeUpper)) {
      errors.push(
        `Viator checkout URL (${url}) does not contain productCode ${code}`
      );
      errorCode = "UNSUPPORTED_CHECKOUT_PRODUCT";
    }
    const approvedSpec =
      APPROVED_CATALOG_CHECKOUT_TOURS[codeUpper as ApprovedCatalogProductCode] || null;
    if (approvedSpec) {
      if (account && account !== approvedSpec.providerAccount) {
        errors.push(
          `Provider account '${account}' does not match approved Viator account '${approvedSpec.providerAccount}' for ${codeUpper}`
        );
        errorCode = errorCode || "UNSUPPORTED_CHECKOUT_PRODUCT";
      }
      if (params.mcid && String(params.mcid).trim() !== approvedSpec.mcid) {
        errors.push(
          `Viator mcid '${params.mcid}' does not match approved mcid '${approvedSpec.mcid}' for ${codeUpper}`
        );
        errorCode = errorCode || "UNSUPPORTED_CHECKOUT_PRODUCT";
      }
      if (
        params.portSlug &&
        String(params.portSlug).trim().toLowerCase() !== approvedSpec.portSlug
      ) {
        errors.push(
          `Port '${params.portSlug}' does not match approved catalog port '${approvedSpec.portSlug}' for ${codeUpper}`
        );
        errorCode = errorCode || "UNSUPPORTED_CHECKOUT_PRODUCT";
      }
      if (
        approvedSpec.expectedUrlPathToken &&
        !url.toUpperCase().includes(approvedSpec.expectedUrlPathToken.toUpperCase())
      ) {
        errors.push(
          `Viator checkout URL (${url}) does not contain canonical path token '${approvedSpec.expectedUrlPathToken}' for ${codeUpper}`
        );
        errorCode = errorCode || "UNSUPPORTED_CHECKOUT_PRODUCT";
      }
      if (optionUpper) {
        const allowedOptionCodes =
          approvedSpec.approvedCheckoutOptionCodes ||
          approvedSpec.options.map((o) => o.optionCode.toUpperCase());
        matchedOption =
          approvedSpec.options.find(
            (o) => o.optionCode.toUpperCase() === optionUpper
          ) || null;
        if (!allowedOptionCodes.includes(optionUpper) || !matchedOption) {
          errors.push(
            `Option '${optionUpper}' is not an approved catalog checkout option for ${codeUpper}`
          );
          errorCode = errorCode || "INVALID_CHECKOUT_SELECTION";
        }
        if (params.departureTime) {
          const allowedDeps =
            approvedSpec.approvedDeparturesByOption?.[optionUpper] ||
            approvedSpec.options
              .filter((o) => o.optionCode.toUpperCase() === optionUpper)
              .flatMap((o) => o.scheduledStartTimes || [o.departureTime]);
          if (!allowedDeps.includes(String(params.departureTime).trim())) {
            errors.push(
              `Departure time '${params.departureTime}' is not approved for ${codeUpper} / ${optionUpper}`
            );
            errorCode = errorCode || "INVALID_CHECKOUT_SELECTION";
          }
        }
      }
    }
  } else if (params.provider === "fareharbor") {
    if (!url.includes("fareharbor.com/")) {
      errors.push(
        `Provider 'fareharbor' (${code}) must target a fareharbor.com URL: ${url}`
      );
      errorCode = "UNSUPPORTED_CHECKOUT_PRODUCT";
    }
    if (code && /^\d+$/.test(code) && !url.includes(`/items/${code}`)) {
      errors.push(
        `FareHarbor checkout URL (${url}) does not match item ${code}`
      );
      errorCode = "UNSUPPORTED_CHECKOUT_PRODUCT";
    }
  }

  const valid = errors.length === 0;
  return {
    valid,
    approved: valid,
    errorCode: valid ? null : errorCode || "INVALID_CHECKOUT_SELECTION",
    reason: valid ? null : errors[0] || "Invalid checkout selection.",
    matchedOption,
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

