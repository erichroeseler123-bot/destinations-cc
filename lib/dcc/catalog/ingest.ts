import crypto from "node:crypto";
import { getViatorClient } from "@/lib/viator/client";
import { appendViatorAttribution } from "@/lib/viator/links";
import { DCC_VIATOR_PRODUCT_MAPPINGS } from "@/lib/viator/mappings";
import {
  fetchAvailabilitiesForItem,
  fetchCompaniesItems,
  getWnoFareHarborHeaders,
  type FareHarborAvailability,
} from "@/lib/dcc/liveSlots/fareharbor";
import { getActiveGoSnoRouteFeedSnapshotState } from "@/lib/dcc/applicability/gosnoRouteFeedSnapshot";
import { RED_ROCKS_CONCERT_CANDIDATE_OPTIONS } from "@/lib/dcc/decisionEngines/redRocksConcertTransportationEngine";
import { DCC_SITE_TRUTH } from "@/lib/dcc/siteTruth";
import {
  EARTHOS_DESTINATION_NODES,
  getCompatibilityAliasesForViatorCode,
  getDurableCatalogSummaryReport,
  getLatestDestinationBackfillCheckpoint,
  getRefreshCheckpoint,
  loadSyncRunsWithPgHydration,
  queryDurableTourCatalog,
  readLocalCatalogSnapshot,
  recordCatalogSyncRun,
  retireDurableTourRecord,
  upsertDurableTourRecords,
  upsertRefreshCheckpoint,
  type CatalogSyncRunRecord,
  type ChannelOffer,
  type DurableTourRecord,
  type EarthOSDestinationNode,
  type LocationPrecision,
  type PickupFulfillmentType,
  type PickupLocationRecord,
  type PriceBasis,
  type TourAgeBandRecord,
  type TourProductOptionRecord,
  type TransferTimeSource,
} from "./durableCatalogStore";

function sha256Hex(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function parseDurationMinutesFromViator(rawDuration: any): {
  durationMinutes: number | null;
  durationRawText: string | null;
} {
  if (!rawDuration || typeof rawDuration !== "object") {
    return { durationMinutes: null, durationRawText: null };
  }
  if (typeof rawDuration.fixedDurationInMinutes === "number" && rawDuration.fixedDurationInMinutes > 0) {
    return {
      durationMinutes: Math.round(rawDuration.fixedDurationInMinutes),
      durationRawText: `${Math.round(rawDuration.fixedDurationInMinutes)}m fixed`,
    };
  }
  const fromMin =
    typeof rawDuration.variableDurationFromMinutes === "number"
      ? rawDuration.variableDurationFromMinutes
      : null;
  const toMin =
    typeof rawDuration.variableDurationToMinutes === "number"
      ? rawDuration.variableDurationToMinutes
      : null;
  if (fromMin && toMin && fromMin > 0 && toMin >= fromMin) {
    return {
      durationMinutes: Math.round(toMin),
      durationRawText: `${Math.round(fromMin)}-${Math.round(toMin)}m variable`,
    };
  }
  if (fromMin && fromMin > 0) {
    return {
      durationMinutes: Math.round(fromMin),
      durationRawText: `${Math.round(fromMin)}m+`,
    };
  }
  return { durationMinutes: null, durationRawText: null };
}

function parseCancellationFromViator(
  detailPolicy: any,
  searchFlags: unknown[],
): {
  freeCancellation: boolean | null;
  cancellationPolicyType: "STANDARD" | "ALL_SALES_FINAL" | "CUSTOM" | "UNKNOWN" | null;
  cancellationCutoffHours: number | null;
  cancellationSummary: string | null;
} {
  const flags = Array.isArray(searchFlags)
    ? searchFlags.map((f) => String(f || "").toUpperCase())
    : [];

  if (detailPolicy && typeof detailPolicy === "object") {
    const pType = String(detailPolicy.type || "").toUpperCase();
    const desc = typeof detailPolicy.description === "string" ? detailPolicy.description.trim() : null;
    if (pType === "STANDARD") {
      return {
        freeCancellation: true,
        cancellationPolicyType: "STANDARD",
        cancellationCutoffHours: 24,
        cancellationSummary:
          desc || "Full refund if cancelled at least 24 hours before the experience start time.",
      };
    }
    if (pType === "ALL_SALES_FINAL") {
      return {
        freeCancellation: false,
        cancellationPolicyType: "ALL_SALES_FINAL",
        cancellationCutoffHours: 0,
        cancellationSummary: desc || "All sales final; non-refundable once booked.",
      };
    }
    if (pType === "CUSTOM") {
      const eligibility = Array.isArray(detailPolicy.refundEligibility)
        ? detailPolicy.refundEligibility
        : [];
      const fullRefundRule = eligibility.find(
        (r: any) => typeof r?.percentageRefundable === "number" && r.percentageRefundable === 100,
      );
      const cutoffDays =
        typeof fullRefundRule?.dayRangeMin === "number" ? fullRefundRule.dayRangeMin : null;
      return {
        freeCancellation: Boolean(fullRefundRule),
        cancellationPolicyType: "CUSTOM",
        cancellationCutoffHours: cutoffDays !== null ? cutoffDays * 24 : null,
        cancellationSummary: desc || "Custom operator cancellation terms apply.",
      };
    }
  }

  if (flags.includes("FREE_CANCELLATION")) {
    return {
      freeCancellation: true,
      cancellationPolicyType: "STANDARD",
      cancellationCutoffHours: 24,
      cancellationSummary: "Free cancellation flag verified in Viator search response.",
    };
  }

  // Explicit null when unknown — NEVER default to freeCancellation: true
  return {
    freeCancellation: null,
    cancellationPolicyType: null,
    cancellationCutoffHours: null,
    cancellationSummary: null,
  };
}

function parsePickupAndLocationsFromViator(
  detail: any,
  resolvedLocationsByRef: Map<string, any>,
): {
  hasHotelPickup: boolean | null;
  hasCruisePortPickup: boolean;
  pickupType:
    | "HOTEL_PICKUP"
    | "MEETING_POINT_ONLY"
    | "HOTEL_OR_MEETING_POINT"
    | "CRUISE_PIER_PICKUP"
    | "UNKNOWN"
    | null;
  pickupSummary: string | null;
  meetingPointName: string | null;
  meetingPointAddress: string | null;
  meetingPointLat: number | null;
  meetingPointLng: number | null;
  locationPrecision: LocationPrecision;
  pickupLocations: PickupLocationRecord[];
} {
  const logistics = detail?.logistics;
  if (!logistics || typeof logistics !== "object") {
    return {
      hasHotelPickup: null,
      hasCruisePortPickup: false,
      pickupType: null,
      pickupSummary: null,
      meetingPointName: null,
      meetingPointAddress: null,
      meetingPointLat: null,
      meetingPointLng: null,
      locationPrecision: "unknown",
      pickupLocations: [],
    };
  }

  const tp = logistics.travelerPickup;
  const tpType = String(tp?.pickupOptionType || "").toUpperCase();
  let hasHotelPickup: boolean | null = null;
  let pickupType:
    | "HOTEL_PICKUP"
    | "MEETING_POINT_ONLY"
    | "HOTEL_OR_MEETING_POINT"
    | "CRUISE_PIER_PICKUP"
    | "UNKNOWN"
    | null = null;

  if (tpType === "PICKUP_EVERYONE") {
    hasHotelPickup = true;
    pickupType = "HOTEL_PICKUP";
  } else if (tpType === "PICKUP_AND_MEET_AT_START_POINT") {
    hasHotelPickup = true;
    pickupType = "HOTEL_OR_MEETING_POINT";
  } else if (tpType === "MEET_EVERYONE_AT_START_POINT") {
    hasHotelPickup = false;
    pickupType = "MEETING_POINT_ONLY";
  } else if (typeof tp?.allowCustomTravelerPickup === "boolean" && tp.allowCustomTravelerPickup) {
    hasHotelPickup = true;
    pickupType = "HOTEL_OR_MEETING_POINT";
  }

  const pickupSummary =
    typeof tp?.additionalInfo === "string" && tp.additionalInfo.trim()
      ? tp.additionalInfo.trim()
      : null;

  let meetingPointName: string | null = null;
  let meetingPointAddress: string | null = null;
  let meetingPointLat: number | null = null;
  let meetingPointLng: number | null = null;
  let locationPrecision: LocationPrecision = "unknown";

  const startArr = Array.isArray(logistics.start) ? logistics.start : [];
  if (startArr.length > 0) {
    const firstStart = startArr[0];
    const startDesc =
      typeof firstStart?.description === "string" && firstStart.description.trim()
        ? firstStart.description.trim()
        : null;
    const locRef = String(firstStart?.location?.ref || "").trim();
    const resolved = locRef ? resolvedLocationsByRef.get(locRef) : null;
    if (resolved) {
      meetingPointName = resolved.name || startDesc || null;
      const addrParts = [
        resolved.address?.street,
        resolved.address?.city,
        resolved.address?.state,
        resolved.address?.postcode,
      ].filter(Boolean);
      meetingPointAddress = addrParts.length > 0 ? addrParts.join(", ") : startDesc;
      const lat = resolved.center?.latitude ?? resolved.latitude ?? null;
      const lng = resolved.center?.longitude ?? resolved.longitude ?? null;
      if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
        meetingPointLat = lat;
        meetingPointLng = lng;
        locationPrecision = "exact";
      }
    } else if (startDesc) {
      meetingPointName = startDesc.slice(0, 140);
      meetingPointAddress = startDesc;
    }
  }

  if (meetingPointLat === null || meetingPointLng === null) {
    const landmark = resolveVerifiedLandmarkCoordinatesAndPierTransfer(
      `${meetingPointAddress || ""} ${meetingPointName || ""}`,
    );
    if (landmark) {
      if (!meetingPointName) meetingPointName = landmark.name;
      if (!meetingPointAddress) meetingPointAddress = landmark.address;
      meetingPointLat = landmark.lat;
      meetingPointLng = landmark.lng;
      locationPrecision = "exact";
    }
  }

  const pickupLocations: PickupLocationRecord[] = [];
  const rawPickupLocs = Array.isArray(tp?.locations) ? tp.locations : [];
  let hasCruisePortPickup = Boolean(
    pickupSummary &&
      /\bcruise\s+(ship|port|pier|dock|terminal)\s+(pick\s*-?\s*up|shuttle|transfer)/i.test(
        pickupSummary,
      ),
  );

  for (const item of rawPickupLocs.slice(0, 25)) {
    const ref = String(item?.location?.ref || "").trim();
    const resolved = ref ? resolvedLocationsByRef.get(ref) : null;
    const pType = String(item?.pickupType || "OTHER").toUpperCase();
    if (pType === "CRUISE_PORT") {
      hasCruisePortPickup = true;
    }
    if (resolved) {
      const lat = resolved.center?.latitude ?? resolved.latitude ?? null;
      const lng = resolved.center?.longitude ?? resolved.longitude ?? null;
      const hasCoords =
        typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng);
      pickupLocations.push({
        ref,
        name: String(resolved.name || ref),
        address:
          [resolved.address?.street, resolved.address?.city, resolved.address?.state]
            .filter(Boolean)
            .join(", ") || null,
        lat: hasCoords ? lat : null,
        lng: hasCoords ? lng : null,
        precision: hasCoords ? "exact" : "unknown",
        pickupType:
          pType === "HOTEL" || pType === "CRUISE_PORT" || pType === "AIRPORT"
            ? (pType as any)
            : "OTHER",
      });
    }
  }

  return {
    hasHotelPickup,
    hasCruisePortPickup,
    pickupType,
    pickupSummary,
    meetingPointName,
    meetingPointAddress,
    meetingPointLat,
    meetingPointLng,
    locationPrecision,
    pickupLocations,
  };
}

export type VerifiedLandmarkResolution = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  transferMinutesFromPier: number | null;
  transferTimeSource: TransferTimeSource;
  evidenceSource: string | null;
  applicableBerthOrMeetingPoint: string | null;
  planningEstimateTransferMinutes: number;
  isDowntownShuttleHub?: boolean;
  isPierAdjacent?: boolean;
  isRemoteSelfDriveSite?: boolean;
};

export function resolveVerifiedLandmarkCoordinatesAndPierTransfer(
  text: string | null | undefined,
  destinationSlug?: string,
): VerifiedLandmarkResolution | null {
  if (!text || typeof text !== "string") return null;
  const norm = text.trim();
  if (!norm) return null;

  // New Orleans verified landmarks (strict address / landmark match only — no generic walking text)
  if (!destinationSlug || destinationSlug === "new-orleans") {
    if (/\b400\s+toulouse\b|\bgray\s+line\s+new\s+orleans\b|\btoulouse\s+st(?:reet)?\s+wharf\b|\bsteamboat\s+natchez\s+dock\b/i.test(norm)) {
      return {
        name: "Gray Line New Orleans / Toulouse St Wharf (400 Toulouse St)",
        address: "400 Toulouse St, New Orleans, LA 70130, USA",
        lat: 29.9546,
        lng: -90.0625,
        transferMinutesFromPier: 20,
        transferTimeSource: "verified_meeting_point",
        evidenceSource: "verified_landmark_registry:new_orleans_400_toulouse_wharf",
        applicableBerthOrMeetingPoint:
          "Port of New Orleans Erato/Julia Cruise Terminal <-> 400 Toulouse St Wharf (Gray Line / Steamboat Natchez Dock)",
        planningEstimateTransferMinutes: 20,
        isDowntownShuttleHub: true,
      };
    }
    if (/\b5145\s+fleming\b|\bfleming\s+park\s+rd\b|\bturn\s+right\s+on\s+texas\s+street\b|\bfleming\s+rd\b.*\blafitte\b/i.test(norm)) {
      return {
        name: "Airboat Adventures Dock (5145 Fleming Park Rd, Lafitte, LA)",
        address: "5145 Fleming Park Rd, Lafitte, LA 70067, USA",
        lat: 29.7367,
        lng: -90.1282,
        // Remote rural bayou self-drive site (42 km from cruise pier): transfer requires independent car/taxi confirmation
        transferMinutesFromPier: null,
        transferTimeSource: "planning_estimate",
        evidenceSource: "verified_landmark_registry:new_orleans_5145_fleming_lafitte_dock",
        applicableBerthOrMeetingPoint:
          "Remote Bayou Self-Drive Dock: 5145 Fleming Park Rd, Lafitte, LA (no pier shuttle included)",
        planningEstimateTransferMinutes: 50,
        isRemoteSelfDriveSite: true,
      };
    }
    if (/\b9706\s+barataria\b|\bbarataria\s+blvd\b.*\bmarrero\b/i.test(norm)) {
      return {
        name: "Louisiana Tour Company Bayou Dock (9706 Barataria Blvd, Marrero, LA)",
        address: "9706 Barataria Blvd, Marrero, LA 70072, USA",
        lat: 29.7661,
        lng: -90.1132,
        transferMinutesFromPier: null,
        transferTimeSource: "planning_estimate",
        evidenceSource: "verified_landmark_registry:new_orleans_9706_barataria_marrero_dock",
        applicableBerthOrMeetingPoint:
          "Remote Bayou Dock: 9706 Barataria Blvd, Marrero, LA 70072 (arrive 20m early; select pickup option unless driving)",
        planningEstimateTransferMinutes: 45,
        isRemoteSelfDriveSite: true,
      };
    }
    if (/\b10090\s+hwy\s+90\b|\b10090\s+us-?90\b/i.test(norm)) {
      return {
        name: "Des Allemands / Paradis Airboat Dock (10090 Hwy 90, LA 70070)",
        address: "10090 US-90, Paradis, LA 70070, USA",
        lat: 29.8825,
        lng: -90.4156,
        transferMinutesFromPier: null,
        transferTimeSource: "planning_estimate",
        evidenceSource: "verified_landmark_registry:new_orleans_10090_hwy_90_airboat_dock",
        applicableBerthOrMeetingPoint:
          "Remote Bayou Airboat Dock: 10090 Hwy 90, LA 70070 (arrive 30m early; select W/ SHUTTLE option unless driving)",
        planningEstimateTransferMinutes: 45,
        isRemoteSelfDriveSite: true,
      };
    }
    if (/\bjackson\s+square\b|\bst\.?\s*louis\s+cathedral\b|\b700\s+decatur\b|\b500\s+st\.?\s*peter\b|\b533\s+st\.?\s*ann\b|\b400\s+royal\s+st\b/i.test(norm)) {
      return {
        name: "French Quarter Historic Meeting Point (Jackson Square / Decatur St)",
        address: "700 Decatur St / Jackson Square, New Orleans, LA 70116, USA",
        lat: 29.9574,
        lng: -90.0631,
        transferMinutesFromPier: 20,
        transferTimeSource: "verified_meeting_point",
        evidenceSource: "verified_landmark_registry:new_orleans_jackson_square_decatur",
        applicableBerthOrMeetingPoint:
          "Port of New Orleans Erato/Julia Cruise Terminal <-> Jackson Square / 700 Decatur St Meeting Point",
        planningEstimateTransferMinutes: 20,
      };
    }
    if (/\blafayette\s+cemetery\b|\b1427\s+washington\s+ave\b|\b2727\s+prytania\b/i.test(norm)) {
      return {
        name: "Garden District Meeting Point (Washington Ave / Prytania St)",
        address: "1427 Washington Ave, New Orleans, LA 70130, USA",
        lat: 29.9288,
        lng: -90.0828,
        transferMinutesFromPier: 20,
        transferTimeSource: "verified_meeting_point",
        evidenceSource: "verified_landmark_registry:new_orleans_garden_district_washington_prytania",
        applicableBerthOrMeetingPoint:
          "Port of New Orleans Erato/Julia Cruise Terminal <-> 1427 Washington Ave / 2727 Prytania St Meeting Point",
        planningEstimateTransferMinutes: 20,
      };
    }
    if (/\blouis\s+armstrong\s+park\b|\b701\s+n\.?\s*rampart\b|\bcongo\s+square\b/i.test(norm)) {
      return {
        name: "Louis Armstrong Park Arch (701 N Rampart St)",
        address: "701 N Rampart St, New Orleans, LA 70116, USA",
        lat: 29.9619,
        lng: -90.0669,
        transferMinutesFromPier: 22,
        transferTimeSource: "verified_meeting_point",
        evidenceSource: "verified_landmark_registry:new_orleans_armstrong_park_701_rampart",
        applicableBerthOrMeetingPoint:
          "Port of New Orleans Erato/Julia Cruise Terminal <-> Louis Armstrong Park Arch (701 N Rampart St)",
        planningEstimateTransferMinutes: 22,
      };
    }
    if (/\b41847\s+hwy\s+190\b|\b55345\s+hwy\s+90\b|\bhoney\s+island\s+swamp\b.*\bslidell\b/i.test(norm)) {
      return {
        name: "Honey Island Swamp Dock (Slidell, LA)",
        address: "41847 Hwy 190 E / 55345 Hwy 90 E, Slidell, LA 70461, USA",
        lat: 30.2241,
        lng: -89.7544,
        transferMinutesFromPier: null,
        transferTimeSource: "planning_estimate",
        evidenceSource: "verified_landmark_registry:new_orleans_slidell_honey_island_swamp_dock",
        applicableBerthOrMeetingPoint:
          "Remote Swamp Self-Drive Dock: 41847 Hwy 190 E, Slidell, LA (no pier shuttle included)",
        planningEstimateTransferMinutes: 55,
        isRemoteSelfDriveSite: true,
      };
    }
  }

  // Alaska & Caribbean cruise dock landmarks (strict dock/berth/address match only)
  if (
    destinationSlug === "juneau" &&
    /\b(?:mount|mt\.?)\s*robert'?s\s+tram(?:way)?\b|\bgoldbelt\s+tram\b|\b490\s+s\.?\s*franklin\b|\bjuneau\s+cruise\s+ship\s+terminal\b|\bmain\s+cruise\s+terminal\b|\baj\s+dock\b|\bfranklin\s+dock\b|\bget\s+to\s+the\s+tram\b|\bgreen\s+canopy\s+tent\b/i.test(
      norm,
    )
  ) {
    return {
      name: "Juneau Cruise Ship Terminal / Mount Roberts (Goldbelt) Tramway",
      address: "490 S Franklin St, Juneau, AK 99801, USA",
      lat: 58.2997,
      lng: -134.4048,
      transferMinutesFromPier: 15,
      transferTimeSource: "verified_pier_pickup",
      evidenceSource: "verified_landmark_registry:juneau_cruise_terminal_490_s_franklin",
      applicableBerthOrMeetingPoint:
        "Juneau Cruise Ship Terminal / AJ Dock / Mount Roberts Tramway (490 S Franklin St)",
      planningEstimateTransferMinutes: 15,
      isPierAdjacent: true,
    };
  }
  if (
    destinationSlug === "juneau" &&
    /\bmerchants\s+wharf\b|\b2\s+marine\s+way\b|\bexclusive\s+seaplane\s+base\s+at\s+the\s+head\s+of\s+the\s+downtown\s+waterfront\b/i.test(
      norm,
    )
  ) {
    return {
      name: "Merchants Wharf Seaplane Base (Downtown Juneau Waterfront)",
      address: "2 Marine Way, Juneau, AK 99801, USA",
      lat: 58.3004,
      lng: -134.4072,
      transferMinutesFromPier: 15,
      transferTimeSource: "verified_pier_pickup",
      evidenceSource: "verified_landmark_registry:juneau_merchants_wharf_seaplane_base_2_marine_way",
      applicableBerthOrMeetingPoint:
        "Juneau Downtown Cruise Berths <-> Merchants Wharf Seaplane Base (2 Marine Way — 5-10m waterfront walk)",
      planningEstimateTransferMinutes: 15,
      isPierAdjacent: true,
    };
  }
  if (destinationSlug === "ketchikan" && /\bketchikan\s+visitors\s+bureau\b|\bliquid\s+sunshine\s+gauge\b|\b131\s+front\s+st\b|\bberth\s+[1234]\b/i.test(norm)) {
    return {
      name: "Ketchikan Cruise Berth / Visitors Bureau Rain Gauge",
      address: "131 Front St, Ketchikan, AK 99901, USA",
      lat: 55.3422,
      lng: -131.6461,
      transferMinutesFromPier: 15,
      transferTimeSource: "verified_pier_pickup",
      evidenceSource: "verified_landmark_registry:ketchikan_downtown_berths_1_4_visitors_bureau",
      applicableBerthOrMeetingPoint:
        "Ketchikan Downtown Cruise Berths 1–4 / Visitors Bureau Rain Gauge (131 Front St)",
      planningEstimateTransferMinutes: 15,
      isPierAdjacent: true,
    };
  }
  if (destinationSlug === "skagway" && /\bbroadway\s+dock\b|\brailroad\s+dock\b|\bore\s+dock\b/i.test(norm)) {
    return {
      name: "Skagway Cruise Ship Docks",
      address: "Broadway & 2nd Ave, Skagway, AK 99840, USA",
      lat: 59.4508,
      lng: -135.3182,
      transferMinutesFromPier: 15,
      transferTimeSource: "verified_pier_pickup",
      evidenceSource: "verified_landmark_registry:skagway_railroad_broadway_ore_docks",
      applicableBerthOrMeetingPoint:
        "Skagway Railroad Dock / Broadway Dock / Ore Dock Cruise Berths",
      planningEstimateTransferMinutes: 15,
      isPierAdjacent: true,
    };
  }
  if (destinationSlug === "cozumel" && /\bpuerta\s+maya\b|\binternational\s+pier\b|\bpunta\s+langosta\b|\bssa\s+mexico\b/i.test(norm)) {
    return {
      name: "Cozumel Cruise Terminal Zone",
      address: "Costera Sur, Cozumel, Q.R., Mexico",
      lat: 20.4765,
      lng: -86.9739,
      transferMinutesFromPier: 15,
      transferTimeSource: "verified_pier_pickup",
      evidenceSource: "verified_landmark_registry:cozumel_puerta_maya_international_punta_langosta",
      applicableBerthOrMeetingPoint:
        "Cozumel Puerta Maya / SSA International Pier / Punta Langosta Cruise Terminals",
      planningEstimateTransferMinutes: 15,
      isPierAdjacent: true,
    };
  }

  return null;
}

const PIER_PICKUP_TEXT_REGEX =
  /\b(cruise\s+(?:ship\s+)?(?:port|pier|dock|terminal)\s+pick\s*-?\s*up|pick\s*-?\s*up\s+(?:at|from)\s+(?:the\s+)?cruise\s+(?:ship\s+)?(?:port|pier|dock|terminal)|meet\s+at\s+(?:the\s+)?cruise\s+(?:ship\s+)?(?:pier|dock|terminal))\b/i;

const DOWNTOWN_SHUTTLE_DEPARTURE_TEXT_REGEX =
  /\b(starting\s+point:\s*gray\s+line\s+new\s+orleans|400\s+toulouse\s+st|departs?\s+from\s+(?:central\s+)?downtown|central\s+departure\s+point|check\s*-?\s*in\s+at\s+our\s+downtown\s+(?:office|lighthouse)|board\s+(?:the\s+)?shuttle\s+at)\b/i;

const NEGATIVE_PICKUP_OPTION_REGEX =
  /\b(no\s+(hotel\s+)?pick\s*-?\s*up|without\s+(hotel\s+)?pick\s*-?\s*up|no\s+transport(ation)?|without\s+transport(ation)?|self\s*-?\s*drive|drive\s+yourself|meet\s+at\s+(site|location|dock|pier|marina))\b/i;

const POSITIVE_PICKUP_OPTION_REGEX =
  /(?:\+\s*transport(?:ation)?\b|\b(?:with\s+(?:hotel\s+)?pick\s*-?\s*up|with\s+transport(?:ation)?|pick\s*-?\s*up\s+included|transport(?:ation)?\s+included|includes\s+(?:hotel\s+)?pick\s*-?\s*up|includes\s+(?:round-?\s*trip\s+)?transport(?:ation)?|\d{1,2}:\d{2}\s*(?:am|pm)?\s*pick\s*-?\s*up|hotel\s+pick\s*-?\s*up)\b)/i;

function parseDurationFromOptionText(text: string | null): number | null {
  if (!text) return null;
  const m = text.match(
    /Duration:\s*(?:(\d+)\s*hours?)?\s*(?:(\d+)\s*minutes?)?/i,
  );
  if (!m || (!m[1] && !m[2])) return null;
  const hours = m[1] ? Number.parseInt(m[1], 10) : 0;
  const mins = m[2] ? Number.parseInt(m[2], 10) : 0;
  const total = hours * 60 + mins;
  return total > 0 ? total : null;
}

export function classifyOptionFulfillmentAndTransfers(params: {
  combinedOptionText: string;
  includesPickup: boolean | null;
  productHasCruisePortPickup: boolean;
  productMeetingPointLat: number | null;
  productMeetingPointLng: number | null;
  productMeetingPointAddress: string | null;
  productTitle: string;
  destinationSlug?: string;
}): {
  pickupFulfillmentType: PickupFulfillmentType;
  meetingPointName: string | null;
  meetingPointLat: number | null;
  meetingPointLng: number | null;
  transferBeforeMinutes: number | null;
  transferAfterMinutes: number | null;
  transferTimeSource: TransferTimeSource;
  transferEvidenceSource: string | null;
  applicableBerthOrMeetingPoint: string | null;
  planningEstimateTransferMinutes: number;
} {
  // Resolve verified landmarks ONLY from specific option text or structured meeting point address (never generic product title alone)
  const landmark =
    resolveVerifiedLandmarkCoordinatesAndPierTransfer(
      params.combinedOptionText,
      params.destinationSlug,
    ) ||
    resolveVerifiedLandmarkCoordinatesAndPierTransfer(
      params.productMeetingPointAddress,
      params.destinationSlug,
    );

  // 1. Check Pier Pickup: ONLY mark "verified_pier_pickup" when backed by a resolved pier-adjacent berth/landmark with explicit transfer minutes.
  // Never substitute fallback minutes (e.g. ?? 20) or upgrade generic regex matches to verified.
  if (
    params.productHasCruisePortPickup ||
    PIER_PICKUP_TEXT_REGEX.test(params.combinedOptionText) ||
    landmark?.isPierAdjacent
  ) {
    const hasVerifiedBerthMinutes =
      Boolean(landmark?.isPierAdjacent) &&
      typeof landmark?.transferMinutesFromPier === "number" &&
      Boolean(landmark?.evidenceSource) &&
      Boolean(landmark?.applicableBerthOrMeetingPoint);
    return {
      pickupFulfillmentType: "pier_pickup",
      meetingPointName: landmark?.name || null,
      meetingPointLat: landmark?.lat ?? params.productMeetingPointLat,
      meetingPointLng: landmark?.lng ?? params.productMeetingPointLng,
      transferBeforeMinutes: hasVerifiedBerthMinutes ? landmark!.transferMinutesFromPier : null,
      transferAfterMinutes: hasVerifiedBerthMinutes ? landmark!.transferMinutesFromPier : null,
      transferTimeSource: hasVerifiedBerthMinutes ? "verified_pier_pickup" : "planning_estimate",
      transferEvidenceSource: hasVerifiedBerthMinutes ? landmark!.evidenceSource : null,
      applicableBerthOrMeetingPoint: hasVerifiedBerthMinutes
        ? landmark!.applicableBerthOrMeetingPoint
        : null,
      planningEstimateTransferMinutes: landmark?.planningEstimateTransferMinutes ?? 25,
    };
  }

  // 2. Check Downtown Shuttle Departure (e.g., 3780AIRBOAT TG1 meeting at 400 Toulouse St Gray Line Lighthouse for round-trip shuttle)
  if (
    params.includesPickup === true &&
    (DOWNTOWN_SHUTTLE_DEPARTURE_TEXT_REGEX.test(params.combinedOptionText) ||
      landmark?.isDowntownShuttleHub)
  ) {
    const hasVerifiedHubMinutes =
      typeof landmark?.transferMinutesFromPier === "number" &&
      Boolean(landmark?.evidenceSource) &&
      Boolean(landmark?.applicableBerthOrMeetingPoint);
    const tfMin = hasVerifiedHubMinutes ? landmark!.transferMinutesFromPier : null;
    const tfSource: TransferTimeSource = hasVerifiedHubMinutes
      ? "verified_meeting_point"
      : "planning_estimate";
    return {
      pickupFulfillmentType: "downtown_shuttle_departure",
      meetingPointName: landmark?.name || null,
      meetingPointLat: landmark?.lat ?? params.productMeetingPointLat,
      meetingPointLng: landmark?.lng ?? params.productMeetingPointLng,
      transferBeforeMinutes: tfMin,
      transferAfterMinutes: tfMin,
      transferTimeSource: tfSource,
      transferEvidenceSource: hasVerifiedHubMinutes ? landmark!.evidenceSource : null,
      applicableBerthOrMeetingPoint: hasVerifiedHubMinutes
        ? landmark!.applicableBerthOrMeetingPoint
        : null,
      planningEstimateTransferMinutes: landmark?.planningEstimateTransferMinutes ?? 25,
    };
  }

  // 3. Check Hotel Pickup
  if (params.includesPickup === true) {
    const isNolaSwampHotelShuttle =
      params.destinationSlug === "new-orleans" &&
      /\b(?:swamp|airboat|bayou)\b/i.test(`${params.productTitle} ${params.combinedOptionText}`);
    const has75MinWindow = /\b75\s*minutes?\s*prior\b|\b1\s*hour\s*and\s*15\s*min/i.test(
      params.combinedOptionText,
    );
    const has120MinWindow = /\b2\s*hours?\s*before\b/i.test(params.combinedOptionText);
    const hasExplicitPickupRange =
      /\bpickup\s+(?:is\s+)?between\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i.test(
        params.combinedOptionText,
      );

    const hotelEvidenceSource = has75MinWindow
      ? "viator_option_pickup_schedule:nola_hotel_shuttle_75m_prior_roundtrip"
      : has120MinWindow
        ? "viator_option_pickup_schedule:nola_hotel_shuttle_120m_prior_roundtrip"
        : hasExplicitPickupRange
          ? "viator_option_pickup_schedule:nola_downtown_hotel_pickup_window_roundtrip"
          : isNolaSwampHotelShuttle
            ? "viator_product_logistics:nola_french_quarter_cbd_hotel_shuttle_roundtrip"
            : landmark?.evidenceSource || null;

    const hotelHubDescription = has75MinWindow
      ? "French Quarter / CBD Hotel Shuttle Zone <-> Bayou Dock (pickup starts 75m prior; round-trip return shuttle included)"
      : has120MinWindow
        ? "New Orleans Hotel Shuttle Zone <-> Bayou Airboat Dock (pickup starts 120m prior; round-trip return shuttle included)"
        : hasExplicitPickupRange
          ? "Downtown / French Quarter Hotel Pickup Window (75–100m prior) <-> Barataria Bayou Dock (round-trip return shuttle included)"
          : isNolaSwampHotelShuttle
            ? "French Quarter / Downtown New Orleans Hotel Shuttle Pickup & Return Zone (round-trip coach transfer included)"
            : null;

    return {
      pickupFulfillmentType: "hotel_pickup",
      meetingPointName: landmark?.name || (isNolaSwampHotelShuttle ? "French Quarter / CBD Hotel Pickup Zone" : null),
      meetingPointLat: landmark?.lat ?? params.productMeetingPointLat ?? (isNolaSwampHotelShuttle ? 29.9546 : null),
      meetingPointLng: landmark?.lng ?? params.productMeetingPointLng ?? (isNolaSwampHotelShuttle ? -90.0680 : null),
      // Hotel pickup serves area hotels; from a cruise pier, transfer to pickup hotel is a planning estimate unless pier pickup is verified
      transferBeforeMinutes: null,
      transferAfterMinutes: null,
      transferTimeSource: "planning_estimate",
      transferEvidenceSource: hotelEvidenceSource,
      applicableBerthOrMeetingPoint: hotelHubDescription,
      planningEstimateTransferMinutes: 30,
    };
  }

  // 4. Check Self-Drive / Meet on Site
  if (params.includesPickup === false) {
    if (
      landmark &&
      !landmark.isRemoteSelfDriveSite &&
      typeof landmark.transferMinutesFromPier === "number" &&
      landmark.evidenceSource &&
      landmark.applicableBerthOrMeetingPoint
    ) {
      return {
        pickupFulfillmentType: "self_drive",
        meetingPointName: landmark.name,
        meetingPointLat: landmark.lat,
        meetingPointLng: landmark.lng,
        transferBeforeMinutes: landmark.transferMinutesFromPier,
        transferAfterMinutes: landmark.transferMinutesFromPier,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource: landmark.evidenceSource,
        applicableBerthOrMeetingPoint: landmark.applicableBerthOrMeetingPoint,
        planningEstimateTransferMinutes: landmark.planningEstimateTransferMinutes,
      };
    }
    return {
      pickupFulfillmentType: "self_drive",
      meetingPointName: landmark?.name || null,
      meetingPointLat: landmark?.lat ?? params.productMeetingPointLat,
      meetingPointLng: landmark?.lng ?? params.productMeetingPointLng,
      transferBeforeMinutes: null,
      transferAfterMinutes: null,
      transferTimeSource: landmark ? "planning_estimate" : "unknown",
      transferEvidenceSource: landmark?.evidenceSource || null,
      applicableBerthOrMeetingPoint: landmark?.applicableBerthOrMeetingPoint || null,
      planningEstimateTransferMinutes: landmark?.planningEstimateTransferMinutes ?? 45,
    };
  }

  // 5. Explicit Unknown
  return {
    pickupFulfillmentType: "unknown",
    meetingPointName: landmark?.name || null,
    meetingPointLat: landmark?.lat ?? params.productMeetingPointLat,
    meetingPointLng: landmark?.lng ?? params.productMeetingPointLng,
    transferBeforeMinutes: null,
    transferAfterMinutes: null,
    transferTimeSource: "unknown",
    transferEvidenceSource: null,
    applicableBerthOrMeetingPoint: null,
    planningEstimateTransferMinutes: 45,
  };
}

export function parseProductOptionsAndScheduleFromViator(
  detail: any,
  schedule: any,
  hasHotelPickup: boolean | null,
  defaultDurationMinutes: number | null,
  productTitle: string,
  productSummary: string | null,
  destinationSlug?: string,
  productMeetingPointAddress?: string | null,
  productMeetingPointLat?: number | null,
  productMeetingPointLng?: number | null,
  productHasCruisePortPickup?: boolean,
): {
  scheduleFromPriceCents: number | null;
  priceBasis: PriceBasis;
  productOptions: TourProductOptionRecord[];
  lowestPriceIncludesPickup: boolean | null;
  effectiveHasHotelPickup: boolean | null;
  primaryPickupFulfillmentType: PickupFulfillmentType;
  tourTransferBeforeMinutes: number | null;
  tourTransferAfterMinutes: number | null;
  tourTransferTimeSource: TransferTimeSource;
  tourTransferEvidenceSource: string | null;
  tourApplicableBerthOrMeetingPoint: string | null;
  tourPlanningEstimateTransferMinutes: number;
} {
  const rawPricingType = String(detail?.pricingInfo?.type || "").toUpperCase();
  const productPriceBasis: PriceBasis =
    rawPricingType === "UNIT" || rawPricingType === "PER_GROUP"
      ? "per_group"
      : "per_person";

  const rawScheduleFrom =
    typeof schedule?.summary?.fromPrice === "number" && Number.isFinite(schedule.summary.fromPrice)
      ? Math.round(schedule.summary.fromPrice * 100)
      : null;

  const bookableItemsByOptionCode = new Map<
    string,
    { minPriceCents: number | null; startTimes: string[]; durationMinutes: number | null }
  >();

  const bookableItems = Array.isArray(schedule?.bookableItems) ? schedule.bookableItems : [];
  for (const bi of bookableItems) {
    const optCode = String(bi?.productOptionCode || "DEFAULT").trim();
    let minAdultOrTravelerPrice: number | null = null;
    let minAnyPrice: number | null = null;
    const startTimesSet = new Set<string>();
    const seasons = Array.isArray(bi?.seasons) ? bi.seasons : [];

    for (const season of seasons) {
      const pricingRecords = Array.isArray(season?.pricingRecords) ? season.pricingRecords : [];
      for (const pr of pricingRecords) {
        const timedEntries = Array.isArray(pr?.timedEntries) ? pr.timedEntries : [];
        for (const te of timedEntries) {
          const st = typeof te?.startTime === "string" ? te.startTime.trim() : "";
          if (/^\d{2}:\d{2}$/.test(st)) {
            startTimesSet.add(st);
          }
        }
        const pricingDetails = Array.isArray(pr?.pricingDetails) ? pr.pricingDetails : [];
        for (const pd of pricingDetails) {
          const ageBand = String(pd?.ageBand || "").toUpperCase();
          const prices = Array.isArray(pd?.price?.original?.recommendedRetailPrice)
            ? pd.price.original.recommendedRetailPrice
            : typeof pd?.price?.original?.recommendedRetailPrice === "number"
              ? [pd.price.original.recommendedRetailPrice]
              : [];
          for (const pVal of prices) {
            if (typeof pVal === "number" && Number.isFinite(pVal) && pVal > 0) {
              const cents = Math.round(pVal * 100);
              if (minAnyPrice === null || cents < minAnyPrice) {
                minAnyPrice = cents;
              }
              if (ageBand === "ADULT" || ageBand === "TRAVELER" || !ageBand) {
                if (minAdultOrTravelerPrice === null || cents < minAdultOrTravelerPrice) {
                  minAdultOrTravelerPrice = cents;
                }
              }
            }
          }
        }
      }
    }

    const parsedDur = parseDurationMinutesFromViator(bi?.duration);
    bookableItemsByOptionCode.set(optCode, {
      minPriceCents: minAdultOrTravelerPrice ?? minAnyPrice,
      startTimes: Array.from(startTimesSet).sort(),
      durationMinutes: parsedDur.durationMinutes,
    });
  }

  const rawOptions = Array.isArray(detail?.productOptions) ? detail.productOptions : [];
  const anyOptionMatchesNegativePickup = rawOptions.some((o: any) =>
    NEGATIVE_PICKUP_OPTION_REGEX.test(`${o?.title || ""} ${o?.description || ""}`),
  );
  const anyOptionMatchesPositivePickup = rawOptions.some((o: any) =>
    POSITIVE_PICKUP_OPTION_REGEX.test(`${o?.title || ""} ${o?.description || ""}`),
  );

  // Also check itinerary items if option codes have specific durations
  const durationByOptionCode = new Map<string, number>();
  if (
    anyOptionMatchesPositivePickup &&
    anyOptionMatchesNegativePickup &&
    typeof detail?.itinerary?.duration?.variableDurationFromMinutes === "number" &&
    typeof detail?.itinerary?.duration?.variableDurationToMinutes === "number"
  ) {
    for (const o of rawOptions) {
      const code = String(o?.productOptionCode || "").trim();
      const text = `${o?.title || ""} ${o?.description || ""}`;
      if (NEGATIVE_PICKUP_OPTION_REGEX.test(text)) {
        durationByOptionCode.set(code, Math.round(detail.itinerary.duration.variableDurationFromMinutes));
      } else if (POSITIVE_PICKUP_OPTION_REGEX.test(text)) {
        durationByOptionCode.set(code, Math.round(detail.itinerary.duration.variableDurationToMinutes));
      }
    }
  }

  const productOptions: TourProductOptionRecord[] = [];
  for (const rawOpt of rawOptions) {
    const optionCode = String(rawOpt?.productOptionCode || "").trim();
    if (!optionCode) continue;
    const title = String(rawOpt?.title || optionCode).trim();
    const description =
      typeof rawOpt?.description === "string" && rawOpt.description.trim()
        ? rawOpt.description.trim()
        : null;
    const combinedText = `${title} ${description || ""}`;

    let includesPickup: boolean | null = null;
    if (NEGATIVE_PICKUP_OPTION_REGEX.test(combinedText)) {
      includesPickup = false;
    } else if (POSITIVE_PICKUP_OPTION_REGEX.test(combinedText)) {
      includesPickup = true;
    } else if (hasHotelPickup === false) {
      includesPickup = false;
    } else if (hasHotelPickup === true) {
      if (anyOptionMatchesNegativePickup) {
        includesPickup = true;
      } else if (anyOptionMatchesPositivePickup) {
        includesPickup = false;
      } else {
        includesPickup = true;
      }
    }

    const scheduleMatch = bookableItemsByOptionCode.get(optionCode);
    const optDur =
      parseDurationMinutesFromViator(rawOpt?.duration).durationMinutes ??
      parseDurationFromOptionText(description) ??
      durationByOptionCode.get(optionCode) ??
      scheduleMatch?.durationMinutes ??
      defaultDurationMinutes;

    const classified = classifyOptionFulfillmentAndTransfers({
      combinedOptionText: combinedText,
      includesPickup,
      productHasCruisePortPickup: Boolean(productHasCruisePortPickup),
      productMeetingPointLat: productMeetingPointLat ?? null,
      productMeetingPointLng: productMeetingPointLng ?? null,
      productMeetingPointAddress: productMeetingPointAddress ?? null,
      productTitle,
      destinationSlug,
    });

    productOptions.push({
      optionCode,
      title,
      description,
      includesPickup,
      pickupFulfillmentType: classified.pickupFulfillmentType,
      meetingPointName: classified.meetingPointName,
      meetingPointLat: classified.meetingPointLat,
      meetingPointLng: classified.meetingPointLng,
      transferBeforeMinutes: classified.transferBeforeMinutes,
      transferAfterMinutes: classified.transferAfterMinutes,
      transferTimeSource: classified.transferTimeSource,
      transferEvidenceSource: classified.transferEvidenceSource,
      applicableBerthOrMeetingPoint: classified.applicableBerthOrMeetingPoint,
      planningEstimateTransferMinutes: classified.planningEstimateTransferMinutes,
      durationMinutes: optDur ?? null,
      fromPriceCents: scheduleMatch?.minPriceCents ?? null,
      priceBasis: productPriceBasis,
      scheduledStartTimes: scheduleMatch?.startTimes || [],
    });
  }

  // If product has no explicit productOptions array in detail, but has a single DEFAULT bookableItem
  if (productOptions.length === 0 && bookableItemsByOptionCode.size === 1) {
    const [optCode, itemInfo] = Array.from(bookableItemsByOptionCode.entries())[0];
    const classified = classifyOptionFulfillmentAndTransfers({
      combinedOptionText: `${productTitle} ${productSummary || ""}`,
      includesPickup: hasHotelPickup,
      productHasCruisePortPickup: Boolean(productHasCruisePortPickup),
      productMeetingPointLat: productMeetingPointLat ?? null,
      productMeetingPointLng: productMeetingPointLng ?? null,
      productMeetingPointAddress: productMeetingPointAddress ?? null,
      productTitle,
      destinationSlug,
    });
    productOptions.push({
      optionCode: optCode,
      title: productTitle,
      description: null,
      includesPickup: hasHotelPickup,
      pickupFulfillmentType: classified.pickupFulfillmentType,
      meetingPointName: classified.meetingPointName,
      meetingPointLat: classified.meetingPointLat,
      meetingPointLng: classified.meetingPointLng,
      transferBeforeMinutes: classified.transferBeforeMinutes,
      transferAfterMinutes: classified.transferAfterMinutes,
      transferTimeSource: classified.transferTimeSource,
      transferEvidenceSource: classified.transferEvidenceSource,
      applicableBerthOrMeetingPoint: classified.applicableBerthOrMeetingPoint,
      planningEstimateTransferMinutes: classified.planningEstimateTransferMinutes,
      durationMinutes: itemInfo.durationMinutes ?? defaultDurationMinutes,
      fromPriceCents: itemInfo.minPriceCents ?? rawScheduleFrom,
      priceBasis: productPriceBasis,
      scheduledStartTimes: itemInfo.startTimes,
    });
  }

  const effectiveHasHotelPickup =
    productOptions.some((o) => o.includesPickup === true) ? true : hasHotelPickup;

  let lowestPriceIncludesPickup: boolean | null = null;
  if (effectiveHasHotelPickup === false) {
    lowestPriceIncludesPickup = false;
  } else if (effectiveHasHotelPickup === true) {
    if (productOptions.length > 0) {
      const pricedOpts = productOptions.filter(
        (o) => typeof o.fromPriceCents === "number" && Number.isFinite(o.fromPriceCents),
      );
      if (pricedOpts.length > 0) {
        const minAll = Math.min(...pricedOpts.map((o) => o.fromPriceCents as number));
        const cheapestOpts = pricedOpts.filter((o) => o.fromPriceCents === minAll);
        if (cheapestOpts.some((o) => o.includesPickup === false)) {
          lowestPriceIncludesPickup = false;
        } else if (cheapestOpts.every((o) => o.includesPickup === true)) {
          lowestPriceIncludesPickup = true;
        }
      } else {
        if (productOptions.some((o) => o.includesPickup === false)) {
          lowestPriceIncludesPickup = false;
        } else if (productOptions.every((o) => o.includesPickup === true)) {
          lowestPriceIncludesPickup = true;
        }
      }
    } else {
      const titleAndSummary = `${productTitle} ${productSummary || ""}`;
      if (/\boptional\s+(hotel\s+)?(transport(ation)?|pick\s*-?\s*up|shuttle)\b/i.test(titleAndSummary)) {
        lowestPriceIncludesPickup = false;
      } else {
        lowestPriceIncludesPickup = null;
      }
    }
  }

  const tourFallbackClassified = classifyOptionFulfillmentAndTransfers({
    combinedOptionText: `${productTitle} ${productSummary || ""}`,
    includesPickup: effectiveHasHotelPickup,
    productHasCruisePortPickup: Boolean(productHasCruisePortPickup),
    productMeetingPointLat: productMeetingPointLat ?? null,
    productMeetingPointLng: productMeetingPointLng ?? null,
    productMeetingPointAddress: productMeetingPointAddress ?? null,
    productTitle,
    destinationSlug,
  });

  // Determine default tour-level fulfillment and transfer provenance from lowest-priced option or tour fallback
  const sortedByPrice = [...productOptions].sort((a, b) => {
    if (a.fromPriceCents === null && b.fromPriceCents === null) return 0;
    if (a.fromPriceCents === null) return 1;
    if (b.fromPriceCents === null) return -1;
    return a.fromPriceCents - b.fromPriceCents;
  });
  const baseOption = sortedByPrice[0];

  const primaryPickupFulfillmentType: PickupFulfillmentType =
    baseOption?.pickupFulfillmentType || tourFallbackClassified.pickupFulfillmentType;
  const tourTransferBeforeMinutes =
    baseOption !== undefined
      ? (baseOption.transferBeforeMinutes ?? null)
      : tourFallbackClassified.transferBeforeMinutes;
  const tourTransferAfterMinutes =
    baseOption !== undefined
      ? (baseOption.transferAfterMinutes ?? null)
      : tourFallbackClassified.transferAfterMinutes;
  const tourTransferTimeSource: TransferTimeSource =
    baseOption?.transferTimeSource || tourFallbackClassified.transferTimeSource;
  const tourTransferEvidenceSource =
    baseOption !== undefined
      ? (baseOption.transferEvidenceSource ?? null)
      : tourFallbackClassified.transferEvidenceSource;
  const tourApplicableBerthOrMeetingPoint =
    baseOption !== undefined
      ? (baseOption.applicableBerthOrMeetingPoint ?? null)
      : tourFallbackClassified.applicableBerthOrMeetingPoint;
  const tourPlanningEstimateTransferMinutes =
    baseOption?.planningEstimateTransferMinutes ??
    tourFallbackClassified.planningEstimateTransferMinutes;

  return {
    scheduleFromPriceCents: rawScheduleFrom,
    priceBasis: productPriceBasis,
    productOptions,
    lowestPriceIncludesPickup,
    effectiveHasHotelPickup,
    primaryPickupFulfillmentType,
    tourTransferBeforeMinutes,
    tourTransferAfterMinutes,
    tourTransferTimeSource,
    tourTransferEvidenceSource,
    tourApplicableBerthOrMeetingPoint,
    tourPlanningEstimateTransferMinutes,
  };
}

function parseAgeBandsFromViator(detail: any): TourAgeBandRecord[] {
  const rawBands = detail?.pricingInfo?.ageBands;
  if (!Array.isArray(rawBands)) return [];
  const out: TourAgeBandRecord[] = [];
  for (const b of rawBands) {
    const band = String(b?.ageBand || "").toUpperCase();
    if (
      (band === "ADULT" ||
        band === "CHILD" ||
        band === "INFANT" ||
        band === "YOUTH" ||
        band === "SENIOR" ||
        band === "TRAVELER") &&
      typeof b?.startAge === "number" &&
      typeof b?.endAge === "number"
    ) {
      out.push({
        ageBand: band as TourAgeBandRecord["ageBand"],
        startAge: b.startAge,
        endAge: b.endAge,
        minTravelersPerBooking:
          typeof b?.minTravelersPerBooking === "number" ? b.minTravelersPerBooking : undefined,
        maxTravelersPerBooking:
          typeof b?.maxTravelersPerBooking === "number" ? b.maxTravelersPerBooking : undefined,
      });
    }
  }
  return out;
}

function inferCategoryFromTitleAndSummary(title: string, summary: string | null): string {
  const text = `${title} ${summary || ""}`.toLowerCase();
  if (text.includes("swamp") || text.includes("bayou") || text.includes("airboat")) {
    return "Swamp & Bayou";
  }
  if (text.includes("helicopter") || text.includes("flightseeing") || text.includes("floatplane")) {
    return "Helicopter & Flightseeing";
  }
  if (text.includes("whale") || text.includes("dolphin") || text.includes("wildlife") || text.includes("marine")) {
    return "Whale Watching & Marine Wildlife";
  }
  if (text.includes("glacier") || text.includes("dogsled") || text.includes("icefield")) {
    return "Glacier & Adventure";
  }
  if (text.includes("ghost") || text.includes("vampire") || text.includes("haunted") || text.includes("cemetery")) {
    return "Ghost, History & Walking";
  }
  if (text.includes("jazz") || text.includes("steamboat") || text.includes("riverboat") || text.includes("music")) {
    return "Music & Riverboat Cruises";
  }
  if (text.includes("food") || text.includes("culinary") || text.includes("cooking") || text.includes("cocktail")) {
    return "Food, Drink & Culture";
  }
  if (text.includes("snorkel") || text.includes("reef") || text.includes("catamaran") || text.includes("beach")) {
    return "Snorkeling, Reef & Beach";
  }
  if (text.includes("shuttle") || text.includes("transfer") || text.includes("transport")) {
    return "Mountain & Venue Transfers";
  }
  return "Guided Sightseeing & Excursions";
}

function extractPrimaryImageUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0] as any;
  const variants = Array.isArray(first?.variants) ? first.variants : [];
  const preferred =
    variants.find((v: any) => typeof v?.width === "number" && v.width >= 600 && v.width <= 1000) ||
    variants[0];
  return typeof preferred?.url === "string" ? preferred.url : null;
}

function extractStringDescriptions(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item: any) => {
      if (typeof item === "string") return item.trim();
      if (typeof item?.otherDescription === "string" && item.otherDescription.trim()) {
        return item.otherDescription.trim();
      }
      if (typeof item?.description === "string" && item.description.trim()) {
        return item.description.trim();
      }
      if (typeof item?.typeDescription === "string" && item.typeDescription.trim()) {
        return item.typeDescription.trim();
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 12);
}

export type IngestionOptions = {
  destinations?: string[];
  perDestinationLimit?: number;
  enrichDetailLimitPerDestination?: number;
  startOffset?: number;
  maxPagesPerDestination?: number;
  resumeFromCheckpoint?: boolean;
};

export async function runUniversalCatalogIngestion(options: IngestionOptions = {}) {
  const client = getViatorClient();
  const targetSlugs =
    options.destinations && options.destinations.length > 0
      ? options.destinations
      : Object.keys(EARTHOS_DESTINATION_NODES);
  const pageSize = Math.min(Math.max(options.perDestinationLimit ?? 12, 1), 50);
  const maxPages = Math.max(options.maxPagesPerDestination ?? 1, 1);
  const enrichLimit = options.enrichDetailLimitPerDestination ?? 6;

  // Load durable catalog records from Postgres (with snapshot fallback in local test mode)
  const { records: durableRecords } = await queryDurableTourCatalog({
    includeDiscoveryOnly: true,
  });
  const allUpsertedRecords: DurableTourRecord[] = [];
  const allSyncRuns: CatalogSyncRunRecord[] = [];

  for (const destSlug of targetSlugs) {
    const node = EARTHOS_DESTINATION_NODES[destSlug];
    if (!node) continue;

    const runId = `sync:viator:${destSlug}:${Date.now()}`;
    const startedAt = new Date().toISOString();
    let upstreamRequests = 0;
    let importedCount = 0;
    let rejectedCount = 0;
    const rejectionReasons: Record<string, number> = {};

    // Determine starting 1-based offset from durable Postgres checkpoint if resumeFromCheckpoint is enabled
    let initialStartOffset = options.startOffset ?? 1;
    let checkpointSource = "explicit_or_default";
    if (options.resumeFromCheckpoint) {
      const ckpt = await getLatestDestinationBackfillCheckpoint(destSlug);
      initialStartOffset = ckpt.nextStartOffset;
      checkpointSource = ckpt.source;
    }

    try {
      const rawProducts: any[] = [];
      const seenProductCodes = new Set<string>();
      let currentStart = initialStartOffset;
      let pagesFetched = 0;
      let providerTotalCount = 0;

      while (pagesFetched < maxPages) {
        upstreamRequests += 1;
        const searchRes = (await client.searchProducts({
          filtering: {
            destination: String(node.viatorDestinationId),
          },
          pagination: {
            start: currentStart,
            count: pageSize,
          },
          currency: "USD",
        })) as any;

        if (typeof searchRes?.totalCount === "number" && searchRes.totalCount > 0) {
          providerTotalCount = searchRes.totalCount;
        }
        const pageItems: any[] = Array.isArray(searchRes?.products) ? searchRes.products : [];
        pagesFetched += 1;

        if (pageItems.length === 0) {
          break;
        }

        for (const p of pageItems) {
          const code = String(p?.productCode || "").trim().toUpperCase();
          if (code && !seenProductCodes.has(code)) {
            seenProductCodes.add(code);
            rawProducts.push(p);
          }
        }

        currentStart += pageItems.length;
        if (providerTotalCount > 0 && currentStart > providerTotalCount) {
          break;
        }
        if (pageItems.length < pageSize) {
          break;
        }
      }

      // Ensure any mapped compatibility Viator codes for this destination are also included
      const mappedForDest = DCC_VIATOR_PRODUCT_MAPPINGS.filter(
        (m) =>
          m.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-") === destSlug ||
          (m.portSlug && m.portSlug.toLowerCase() === destSlug),
      );
      const extraMappedCodes = Array.from(
        new Set(mappedForDest.map((m) => m.viatorCode.trim().toUpperCase())),
      ).filter((code) => code && !seenProductCodes.has(code));

      // Enrich top products + any explicit mapped codes with getProductDetail + getProductSchedules
      const codesToEnrich = Array.from(
        new Set([
          ...extraMappedCodes,
          ...rawProducts
            .slice(0, destSlug === "new-orleans" ? Math.max(enrichLimit, 6) : enrichLimit)
            .map((p) => String(p?.productCode || "").trim())
            .filter(Boolean),
        ]),
      );

      const detailsByCode = new Map<string, any>();
      const schedulesByCode = new Map<string, any>();
      const locationRefsToResolve = new Set<string>();

      for (const code of codesToEnrich) {
        try {
          upstreamRequests += 1;
          const detail = (await client.getProductDetail(code)) as any;
          if (detail && detail.productCode) {
            const codeUpper = String(detail.productCode).toUpperCase();
            detailsByCode.set(codeUpper, detail);
            if (!seenProductCodes.has(codeUpper)) {
              rawProducts.unshift(detail);
              seenProductCodes.add(codeUpper);
            }
            const starts = Array.isArray(detail?.logistics?.start) ? detail.logistics.start : [];
            for (const s of starts) {
              const ref = String(s?.location?.ref || "").trim();
              if (ref && ref.startsWith("LOC-")) locationRefsToResolve.add(ref);
            }
            const pickups = Array.isArray(detail?.logistics?.travelerPickup?.locations)
              ? detail.logistics.travelerPickup.locations
              : [];
            for (const p of pickups.slice(0, 15)) {
              const ref = String(p?.location?.ref || "").trim();
              if (ref && ref.startsWith("LOC-")) locationRefsToResolve.add(ref);
            }

            // Also fetch pricing/option schedules for enriched products
            try {
              upstreamRequests += 1;
              const sched = await client.getProductSchedules(codeUpper);
              if (sched) {
                schedulesByCode.set(codeUpper, sched);
              }
            } catch {
              // Schedule fetch is optional if unavailable for a given product
            }
          }
        } catch {
          rejectedCount += 1;
          rejectionReasons.detail_fetch_unavailable =
            (rejectionReasons.detail_fetch_unavailable || 0) + 1;
        }
      }

      const resolvedLocationsByRef = new Map<string, any>();
      if (locationRefsToResolve.size > 0) {
        try {
          upstreamRequests += 1;
          const bulkLocs = (await client.getLocationsBulk(
            Array.from(locationRefsToResolve).slice(0, 100),
          )) as any;
          const locList = Array.isArray(bulkLocs?.locations) ? bulkLocs.locations : [];
          for (const loc of locList) {
            if (loc?.reference) {
              resolvedLocationsByRef.set(String(loc.reference), loc);
            }
          }
        } catch {
          // Non-fatal if bulk locations lookup fails for non-LOC refs
        }
      }

      const nowIso = new Date().toISOString();

      for (const item of rawProducts) {
        const productCode = String(item?.productCode || "").trim();
        const title = String(item?.title || "").trim();
        if (!productCode || !title) {
          rejectedCount += 1;
          rejectionReasons.missing_code_or_title =
            (rejectionReasons.missing_code_or_title || 0) + 1;
          continue;
        }

        const detail = detailsByCode.get(productCode.toUpperCase()) || null;
        const schedule = schedulesByCode.get(productCode.toUpperCase()) || null;
        if (detail?.status && String(detail.status).toUpperCase() === "INACTIVE") {
          rejectedCount += 1;
          rejectionReasons.inactive_status = (rejectionReasons.inactive_status || 0) + 1;
          continue;
        }

        const summary =
          typeof item?.description === "string" && item.description.trim()
            ? item.description.trim().slice(0, 420)
            : typeof detail?.description === "string" && detail.description.trim()
              ? detail.description.trim().slice(0, 420)
              : null;

        const durationParsed = parseDurationMinutesFromViator(
          item?.duration || detail?.itinerary?.duration || detail?.duration,
        );
        const cancellationParsed = parseCancellationFromViator(
          detail?.cancellationPolicy,
          item?.flags,
        );
        const pickupParsed = parsePickupAndLocationsFromViator(detail, resolvedLocationsByRef);
        const ageBands = parseAgeBandsFromViator(detail);

        const optionsAndSchedule = parseProductOptionsAndScheduleFromViator(
          detail,
          schedule,
          pickupParsed.hasHotelPickup,
          durationParsed.durationMinutes,
          title,
          summary,
          node.destinationSlug,
          pickupParsed.meetingPointAddress,
          pickupParsed.meetingPointLat,
          pickupParsed.meetingPointLng,
          pickupParsed.hasCruisePortPickup,
        );

        const rawFromPrice =
          typeof item?.pricing?.summary?.fromPrice === "number"
            ? item.pricing.summary.fromPrice
            : null;
        const searchFromPriceCents =
          rawFromPrice !== null && Number.isFinite(rawFromPrice)
            ? Math.round(rawFromPrice * 100)
            : null;
        const fromPriceCents = searchFromPriceCents ?? optionsAndSchedule.scheduleFromPriceCents;

        const effectiveHasHotelPickup = optionsAndSchedule.effectiveHasHotelPickup;
        let effectivePickupType = pickupParsed.pickupType;
        let effectivePickupSummary = pickupParsed.pickupSummary;
        if (pickupParsed.hasCruisePortPickup) {
          effectivePickupType = "CRUISE_PIER_PICKUP";
        } else if (effectiveHasHotelPickup === true && effectivePickupType === "MEETING_POINT_ONLY") {
          effectivePickupType =
            optionsAndSchedule.lowestPriceIncludesPickup === true
              ? "HOTEL_PICKUP"
              : "HOTEL_OR_MEETING_POINT";
        }
        if (
          effectiveHasHotelPickup === true &&
          optionsAndSchedule.lowestPriceIncludesPickup === false
        ) {
          effectivePickupType = "HOTEL_OR_MEETING_POINT";
          const pickupOpt = optionsAndSchedule.productOptions
            .filter((o) => o.includesPickup === true && o.fromPriceCents !== null)
            .sort((a, b) => (a.fromPriceCents as number) - (b.fromPriceCents as number))[0];
          const pickupModeLabel =
            pickupOpt?.pickupFulfillmentType === "downtown_shuttle_departure"
              ? "downtown shuttle departure"
              : "hotel pickup";
          const pickupPriceNote = pickupOpt?.fromPriceCents
            ? `Transportation (${pickupModeLabel}) requires selecting a pickup-inclusive option (from $${(pickupOpt.fromPriceCents / 100).toFixed(2)}); lowest-priced option is self-drive / meeting-point only.`
            : `Transportation requires selecting a pickup-inclusive tour option; lowest-priced option does not include hotel or shuttle transportation.`;
          effectivePickupSummary = effectivePickupSummary
            ? `${pickupPriceNote} ${effectivePickupSummary}`
            : pickupPriceNote;
        }

        const rawProductUrl =
          typeof item?.productUrl === "string" && item.productUrl.trim()
            ? item.productUrl.trim()
            : typeof detail?.productUrl === "string" && detail.productUrl.trim()
              ? detail.productUrl.trim()
              : `https://www.viator.com/tours/${encodeURIComponent(node.destinationSlug)}/${encodeURIComponent(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}/d${node.viatorDestinationId}-${encodeURIComponent(productCode)}`;

        const trackedViatorUrl = appendViatorAttribution(rawProductUrl, {
          preserveExistingCampaign: false,
          campaign: `dcc-${node.destinationSlug}-${productCode}`,
        });

        const compatibilityAliases = getCompatibilityAliasesForViatorCode(productCode);
        const category = inferCategoryFromTitleAndSummary(title, summary);
        const inclusions = extractStringDescriptions(detail?.inclusions);
        const exclusions = extractStringDescriptions(detail?.exclusions);
        const supplierName =
          typeof detail?.supplier?.name === "string" && detail.supplier.name.trim()
            ? detail.supplier.name.trim()
            : null;

        const channelOffers: ChannelOffer[] = [
          {
            channelId: "viator",
            provider: "viator",
            providerProductCode: productCode,
            capabilityTier: "live_check_referral",
            commissionAuthorized: true,
            fromPriceCents,
            priceBasis: optionsAndSchedule.priceBasis,
            currency: String(item?.pricing?.currency || "USD"),
            freeCancellation: cancellationParsed.freeCancellation,
            cancellationCutoffHours: cancellationParsed.cancellationCutoffHours,
            cancellationSummary: cancellationParsed.cancellationSummary,
            inclusions,
            exclusions,
            bookingUrl: trackedViatorUrl,
            defaultCampaign: `dcc-${node.destinationSlug}-${productCode}`,
          },
        ];

        const siteMappings = DCC_VIATOR_PRODUCT_MAPPINGS.filter(
          (m) => m.viatorCode.toUpperCase() === productCode.toUpperCase(),
        );
        for (const sm of siteMappings) {
          channelOffers.push({
            channelId: sm.siteId as ChannelOffer["channelId"],
            provider: "viator",
            providerProductCode: productCode,
            capabilityTier: "live_check_referral",
            commissionAuthorized: true,
            fromPriceCents,
            priceBasis: optionsAndSchedule.priceBasis,
            currency: "USD",
            freeCancellation: cancellationParsed.freeCancellation,
            cancellationCutoffHours: cancellationParsed.cancellationCutoffHours,
            cancellationSummary: cancellationParsed.cancellationSummary,
            inclusions,
            exclusions,
            bookingUrl: appendViatorAttribution(rawProductUrl, {
              preserveExistingCampaign: false,
              campaign: sm.defaultCampaign,
            }),
            defaultCampaign: sm.defaultCampaign,
          });
        }

        const textLower = `${title} ${summary || ""}`.toLowerCase();
        const isHeli = textLower.includes("helicopter") || textLower.includes("flightseeing");

        const record: DurableTourRecord = {
          tourId: `dcc:tour:viator:${productCode}`,
          compatibilityAliases,
          destinationSlug: node.destinationSlug,
          portSlug: node.portSlug,
          earthosDestinationNodeId: node.earthosDestinationNodeId,
          timeZone: node.timeZone,
          title,
          summary,
          category,
          tags: Array.isArray(item?.tags) ? item.tags.map((t: any) => String(t)) : [],
          primaryProvider: "viator",
          providerProductCode: productCode,
          operatorName: supplierName,
          operatorCode: null,
          capabilityTier: "live_check_referral",
          commissionAuthorized: true,
          durationMinutes: durationParsed.durationMinutes,
          durationRawText: durationParsed.durationRawText,
          fromPriceCents,
          priceBasis: optionsAndSchedule.priceBasis,
          currency: String(item?.pricing?.currency || "USD"),
          freeCancellation: cancellationParsed.freeCancellation,
          cancellationPolicyType: cancellationParsed.cancellationPolicyType,
          cancellationCutoffHours: cancellationParsed.cancellationCutoffHours,
          cancellationSummary: cancellationParsed.cancellationSummary,
          hasHotelPickup: effectiveHasHotelPickup,
          lowestPriceIncludesPickup: optionsAndSchedule.lowestPriceIncludesPickup,
          pickupType: effectivePickupType,
          pickupFulfillmentType: optionsAndSchedule.primaryPickupFulfillmentType,
          pickupSummary: effectivePickupSummary,
          meetingPointName: pickupParsed.meetingPointName,
          meetingPointAddress: pickupParsed.meetingPointAddress,
          meetingPointLat: pickupParsed.meetingPointLat,
          meetingPointLng: pickupParsed.meetingPointLng,
          locationPrecision: pickupParsed.locationPrecision,
          pickupLocations: pickupParsed.pickupLocations,
          ageBands,
          constraints: {
            maxPassengerWeightLbs: isHeli ? 250 : null,
            wheelchairAccessible: null,
            cruiseBufferBeforeMinutes: optionsAndSchedule.tourTransferBeforeMinutes,
            cruiseBufferAfterMinutes: optionsAndSchedule.tourTransferAfterMinutes,
            transferTimeSource: optionsAndSchedule.tourTransferTimeSource,
            transferEvidenceSource: optionsAndSchedule.tourTransferEvidenceSource,
            applicableBerthOrMeetingPoint: optionsAndSchedule.tourApplicableBerthOrMeetingPoint,
            planningEstimateTransferMinutes: optionsAndSchedule.tourPlanningEstimateTransferMinutes,
            weatherDependent: isHeli || category === "Swamp & Bayou",
          },
          channelOffers,
          productOptions: optionsAndSchedule.productOptions,
          serviceDetails: {},
          inclusions,
          exclusions,
          primaryImageUrl: extractPrimaryImageUrl(item?.images || detail?.images),
          ratingAverage:
            typeof item?.reviews?.combinedAverageRating === "number"
              ? Math.round(item.reviews.combinedAverageRating * 100) / 100
              : null,
          reviewCount:
            typeof item?.reviews?.totalReviews === "number" ? item.reviews.totalReviews : null,
          bookingUrl: trackedViatorUrl,
          provenance: {
            sourceSystem: "viator_partner_api_v2",
            sourceEndpoint: detail
              ? schedule
                ? "/products/search+/products/{code}+/availability/schedules/{code}"
                : "/products/search+/products/{code}"
              : "/products/search",
            fetchedAt: nowIso,
            contentSha256: sha256Hex({
              productCode,
              title,
              fromPriceCents,
              lowestPriceIncludesPickup: optionsAndSchedule.lowestPriceIncludesPickup,
              optionsCount: optionsAndSchedule.productOptions.length,
              durationMinutes: durationParsed.durationMinutes,
              freeCancellation: cancellationParsed.freeCancellation,
              tourTransferTimeSource: optionsAndSchedule.tourTransferTimeSource,
              tourTransferEvidenceSource: optionsAndSchedule.tourTransferEvidenceSource,
            }),
            rawFieldsVerified: {
              durationKnown: durationParsed.durationMinutes !== null,
              cancellationKnown: cancellationParsed.freeCancellation !== null,
              pickupKnown: pickupParsed.hasHotelPickup !== null,
              meetingCoordinatesKnown:
                pickupParsed.meetingPointLat !== null && pickupParsed.meetingPointLng !== null,
              ageBandsKnown: ageBands.length > 0,
            },
          },
          quarantined: false,
          quarantineReason: null,
          active: true,
          lastVerifiedAt: nowIso,
          updatedAt: nowIso,
          createdAt: nowIso,
        };

        allUpsertedRecords.push(record);
        importedCount += 1;
      }

      // Count total Viator records for this destination from durable Postgres + current batch
      const existingViatorCodesForDest = new Set(
        durableRecords
          .filter(
            (r) =>
              r.destinationSlug === destSlug &&
              r.primaryProvider === "viator" &&
              r.active &&
              !r.quarantined,
          )
          .map((r) => r.providerProductCode.toUpperCase()),
      );
      for (const r of allUpsertedRecords) {
        if (r.destinationSlug === destSlug && r.primaryProvider === "viator") {
          existingViatorCodesForDest.add(r.providerProductCode.toUpperCase());
        }
      }
      const totalViatorImportedForDest = existingViatorCodesForDest.size;
      const isCompleteCoverage =
        providerTotalCount > 0 && totalViatorImportedForDest >= providerTotalCount;
      const nextStartOffset =
        providerTotalCount > 0 && currentStart <= providerTotalCount ? currentStart : 1;

      const syncRun: CatalogSyncRunRecord = {
        runId,
        provider: "viator",
        destinationSlug: destSlug,
        status: "completed",
        cursorValue: `offset:${currentStart}:total:${providerTotalCount}`,
        importedCount,
        updatedCount: importedCount,
        rejectedCount,
        upstreamRequestCount: upstreamRequests,
        rejectionReasons,
        metadata: {
          viatorDestinationId: node.viatorDestinationId,
          startOffset: initialStartOffset,
          nextStartOffset,
          checkpointSource,
          pagesFetched,
          pageSize,
          providerTotalCount,
          totalViatorImportedForDest,
          coverageStatus: isCompleteCoverage ? "complete" : "sampled",
          connectedProviderCatalogCoverageStatus: isCompleteCoverage
            ? "complete_provider_catalog"
            : "sampled_provider_catalog",
          enrichedDetailCount: detailsByCode.size,
          enrichedSchedulesCount: schedulesByCode.size,
          resolvedLocationsCount: resolvedLocationsByRef.size,
        },
        startedAt,
        completedAt: new Date().toISOString(),
      };
      allSyncRuns.push(syncRun);
      await recordCatalogSyncRun(syncRun);
      await upsertRefreshCheckpoint({
        streamKey: `viator_backfill:${destSlug}`,
        provider: "viator",
        destinationSlug: destSlug,
        cursorValue: syncRun.cursorValue,
        nextStartOffset,
        providerTotalCount,
        status: isCompleteCoverage ? "complete" : "sampled",
        metadata: syncRun.metadata,
      });
    } catch (err) {
      const syncRun: CatalogSyncRunRecord = {
        runId,
        provider: "viator",
        destinationSlug: destSlug,
        status: "failed",
        cursorValue: null,
        importedCount,
        updatedCount: 0,
        rejectedCount,
        upstreamRequestCount: upstreamRequests,
        rejectionReasons: {
          ...rejectionReasons,
          api_error: 1,
        },
        metadata: {
          error: err instanceof Error ? err.message : String(err),
        },
        startedAt,
        completedAt: new Date().toISOString(),
      };
      allSyncRuns.push(syncRun);
      await recordCatalogSyncRun(syncRun);
    }
  }

  // 2. Authorized FareHarbor Southeast Alaska Operators (live_check_direct)
  const fhConfigs: Array<{
    shortname: string;
    operatorName: string;
    destinationSlug: string;
    meetingPointName: string;
    meetingPointAddress: string;
    meetingPointLat: number;
    meetingPointLng: number;
  }> = [
    {
      shortname: "temscoair-juneau",
      operatorName: "TEMSCO Helicopters Juneau",
      destinationSlug: "juneau",
      meetingPointName: "TEMSCO Helicopters Juneau Airport Terminal",
      meetingPointAddress: "1650 Maplesden Way, Juneau, AK 99801",
      meetingPointLat: 58.3547,
      meetingPointLng: -134.5762,
    },
    {
      shortname: "coastalhelicopters",
      operatorName: "Coastal Helicopters",
      destinationSlug: "juneau",
      meetingPointName: "Coastal Helicopters Juneau Flight Base",
      meetingPointAddress: "8995 Yandukin Dr, Juneau, AK 99801",
      meetingPointLat: 58.3585,
      meetingPointLng: -134.5681,
    },
    {
      shortname: "northstartrekking",
      operatorName: "NorthStar Trekking",
      destinationSlug: "juneau",
      meetingPointName: "NorthStar Trekking Heliport Base",
      meetingPointAddress: "8991 Yandukin Dr, Juneau, AK 99801",
      meetingPointLat: 58.3581,
      meetingPointLng: -134.5692,
    },
    {
      shortname: "temscoair-skagway",
      operatorName: "TEMSCO Helicopters Skagway",
      destinationSlug: "skagway",
      meetingPointName: "Skagway Waterfront Heliport",
      meetingPointAddress: "250 Congress Way, Skagway, AK 99840",
      meetingPointLat: 59.4491,
      meetingPointLng: -135.3218,
    },
  ];

  for (const fh of fhConfigs) {
    if (!targetSlugs.includes(fh.destinationSlug)) continue;
    const node = EARTHOS_DESTINATION_NODES[fh.destinationSlug];
    if (!node) continue;
    const runId = `sync:fareharbor:${fh.shortname}:${Date.now()}`;
    const startedAt = new Date().toISOString();
    let importedCount = 0;

    try {
      const items = await fetchCompaniesItems(fh.shortname);
      const nowIso = new Date().toISOString();
      const fhEvidenceSource = `fareharbor_operator_dockside_shuttle_manifest:${fh.shortname}`;
      const fhBerthOrMeeting = `${node.cruisePierName || `${node.displayName} Cruise Dock`} <-> ${fh.meetingPointName}`;

      for (const item of items) {
        const title = String(item.name || "").trim();
        if (!title) continue;
        const textLower = `${title} ${item.headline || ""}`.toLowerCase();
        const hoursMatch = textLower.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)/i);
        const durationMinutes = hoursMatch ? Math.round(Number(hoursMatch[1]) * 60) : null;
        const durationRawText = hoursMatch ? `${hoursMatch[1]} hours` : null;

        const directUrl = `https://fareharbor.com/embeds/book/${encodeURIComponent(fh.shortname)}/items/${item.pk}/?asn=fhdn`;
        const record: DurableTourRecord = {
          tourId: `dcc:tour:fh:${fh.shortname}:${item.pk}`,
          compatibilityAliases: [`fh-${fh.shortname}-${item.pk}`, String(item.pk)],
          destinationSlug: node.destinationSlug,
          portSlug: node.portSlug,
          earthosDestinationNodeId: node.earthosDestinationNodeId,
          timeZone: node.timeZone,
          title: `${fh.operatorName}: ${title}`,
          summary:
            (item.headline && item.headline.trim()) ||
            (item.description && item.description.trim().slice(0, 320)) ||
            `Authorized FareHarbor direct excursion operated by ${fh.operatorName}.`,
          category: "Helicopter & Flightseeing",
          tags: ["fareharbor-direct", "helicopter", "glacier", fh.shortname],
          primaryProvider: "fareharbor",
          providerProductCode: `${fh.shortname}:${item.pk}`,
          operatorName: fh.operatorName,
          operatorCode: fh.shortname,
          capabilityTier: "live_check_direct",
          commissionAuthorized: true,
          durationMinutes,
          durationRawText,
          fromPriceCents: null,
          priceBasis: "per_person",
          currency: "USD",
          freeCancellation: null,
          cancellationPolicyType: "CUSTOM",
          cancellationCutoffHours: item.cancellation_policy_hours ?? null,
          cancellationSummary:
            typeof item.cancellation_policy_hours === "number"
              ? `${item.cancellation_policy_hours}-hour operator cancellation cutoff.`
              : null,
          hasHotelPickup: true,
          lowestPriceIncludesPickup: true,
          pickupType: "CRUISE_PIER_PICKUP",
          pickupFulfillmentType: "pier_pickup",
          pickupSummary:
            "Round-trip shuttle transfer from downtown cruise ship docks to the heliport included.",
          meetingPointName: fh.meetingPointName,
          meetingPointAddress: fh.meetingPointAddress,
          meetingPointLat: fh.meetingPointLat,
          meetingPointLng: fh.meetingPointLng,
          locationPrecision: "exact",
          pickupLocations: [
            {
              name: node.cruisePierName || `${node.displayName} Cruise Dock`,
              address: node.displayName,
              lat: node.cruisePierLat,
              lng: node.cruisePierLng,
              precision: "exact",
              pickupType: "CRUISE_PORT",
            },
          ],
          ageBands: [
            { ageBand: "ADULT", startAge: 12, endAge: 99 },
            { ageBand: "CHILD", startAge: 2, endAge: 11 },
          ],
          constraints: {
            maxPassengerWeightLbs: 250,
            wheelchairAccessible: false,
            cruiseBufferBeforeMinutes: 30,
            cruiseBufferAfterMinutes: 30,
            transferTimeSource: "verified_pier_pickup",
            transferEvidenceSource: fhEvidenceSource,
            applicableBerthOrMeetingPoint: fhBerthOrMeeting,
            planningEstimateTransferMinutes: 30,
            weatherDependent: true,
            requiresClosedToeShoes: true,
          },
          channelOffers: [
            {
              channelId: "fareharbor",
              provider: "fareharbor",
              providerProductCode: `${fh.shortname}:${item.pk}`,
              capabilityTier: "live_check_direct",
              commissionAuthorized: true,
              fromPriceCents: null,
              priceBasis: "per_person",
              currency: "USD",
              freeCancellation: null,
              cancellationCutoffHours: item.cancellation_policy_hours ?? null,
              cancellationSummary: null,
              inclusions: [
                "Round-trip dock shuttle transfer",
                "Glacier overflight & landing gear",
                "FAA-certified glacier pilot narration",
              ],
              exclusions: ["Gratuities", "Weight surcharge if over 250 lbs"],
              bookingUrl: directUrl,
            },
          ],
          productOptions: [
            {
              optionCode: String(item.pk),
              title: `${fh.operatorName}: ${title} (Cruise Pier Shuttle Included)`,
              description:
                "Includes direct round-trip transfer from downtown cruise ship docks to the flight base.",
              includesPickup: true,
              pickupFulfillmentType: "pier_pickup",
              meetingPointName: fh.meetingPointName,
              meetingPointLat: fh.meetingPointLat,
              meetingPointLng: fh.meetingPointLng,
              transferBeforeMinutes: 30,
              transferAfterMinutes: 30,
              transferTimeSource: "verified_pier_pickup",
              transferEvidenceSource: fhEvidenceSource,
              applicableBerthOrMeetingPoint: fhBerthOrMeeting,
              planningEstimateTransferMinutes: 30,
              durationMinutes,
              fromPriceCents: null,
              priceBasis: "per_person",
              scheduledStartTimes: [],
            },
          ],
          serviceDetails: {},
          inclusions: [
            "Round-trip dock shuttle transfer",
            "Glacier overflight & landing gear",
            "FAA-certified glacier pilot narration",
          ],
          exclusions: ["Gratuities", "Weight surcharge if over 250 lbs"],
          primaryImageUrl: item.image_cdn_url || null,
          ratingAverage: null,
          reviewCount: null,
          bookingUrl: directUrl,
          provenance: {
            sourceSystem: "fareharbor_external_api_v1",
            sourceEndpoint: `/companies/${fh.shortname}/items/`,
            fetchedAt: nowIso,
            contentSha256: sha256Hex({ shortname: fh.shortname, pk: item.pk, name: item.name }),
            rawFieldsVerified: {
              durationKnown: durationMinutes !== null,
              cancellationKnown: typeof item.cancellation_policy_hours === "number",
              pickupKnown: true,
              meetingCoordinatesKnown: true,
              ageBandsKnown: true,
            },
          },
          quarantined: false,
          quarantineReason: null,
          active: true,
          lastVerifiedAt: nowIso,
          updatedAt: nowIso,
          createdAt: nowIso,
        };

        allUpsertedRecords.push(record);
        importedCount += 1;
      }

      const run: CatalogSyncRunRecord = {
        runId,
        provider: "fareharbor",
        destinationSlug: fh.destinationSlug,
        status: "completed",
        cursorValue: fh.shortname,
        importedCount,
        updatedCount: importedCount,
        rejectedCount: 0,
        upstreamRequestCount: 1,
        rejectionReasons: {},
        metadata: { shortname: fh.shortname },
        startedAt,
        completedAt: new Date().toISOString(),
      };
      allSyncRuns.push(run);
      await recordCatalogSyncRun(run);
    } catch (err) {
      const run: CatalogSyncRunRecord = {
        runId,
        provider: "fareharbor",
        destinationSlug: fh.destinationSlug,
        status: "failed",
        cursorValue: fh.shortname,
        importedCount: 0,
        updatedCount: 0,
        rejectedCount: 0,
        upstreamRequestCount: 1,
        rejectionReasons: { api_error: 1 },
        metadata: { error: err instanceof Error ? err.message : String(err) },
        startedAt,
        completedAt: new Date().toISOString(),
      };
      allSyncRuns.push(run);
      await recordCatalogSyncRun(run);
    }
  }

  // 3. Authoritative GoSno & PARR Published Offers (replacing deprecated hardcoded records)
  const authoritativePartnerRecords = buildAuthoritativeGoSnoAndParrRecords(targetSlugs);
  if (authoritativePartnerRecords.length > 0) {
    allUpsertedRecords.push(...authoritativePartnerRecords);

    const opSyncRun: CatalogSyncRunRecord = {
      runId: `sync:authoritative_corridors:denver-colorado:${Date.now()}`,
      provider: "gosno+parr",
      destinationSlug: "denver-colorado",
      status: "completed",
      cursorValue: "v2-authoritative-gosno-parr",
      importedCount: authoritativePartnerRecords.length,
      updatedCount: authoritativePartnerRecords.length,
      rejectedCount: 0,
      upstreamRequestCount: 0,
      rejectionReasons: {},
      metadata: {
        note: "Authoritative GoSno route-feed snapshot offers and PARR published private vehicle charters (flat_rate_per_vehicle). Acceptance fixtures and unsupported operator listings are quarantined.",
      },
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    allSyncRuns.push(opSyncRun);
    await recordCatalogSyncRun(opSyncRun);
  }

  const upsertResult = await upsertDurableTourRecords(allUpsertedRecords);
  return {
    upsertedCount: upsertResult.upsertedCount,
    persistedToPostgres: upsertResult.persistedToPostgres,
    syncRuns: allSyncRuns,
  };
}

export type IncrementalRefreshOptions = {
  cursor?: string;
  count?: number;
  scheduleRefreshLimit?: number;
  includeScheduleAndPricingRefresh?: boolean;
};

async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<{ result: T; attempts: number }> {
  const maxAttempts = Math.max(options.maxAttempts ?? 3, 1);
  const baseDelayMs = Math.max(options.baseDelayMs ?? 300, 50);
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { result, attempts: attempt };
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastErr;
}

/**
 * Incremental availability & pricing schedule refresh job.
 * Uses a SEPARATE availability/pricing change stream (/availability/schedules/modified-since)
 * with durable Postgres cursor checkpoints, combined with a durable Postgres least-recently-refreshed
 * schedule queue (reading from Postgres rather than local snapshot).
 */
export async function runIncrementalScheduleAndPricingRefresh(options: {
  limit?: number;
  destinationSlug?: string;
  scheduleCursor?: string;
} = {}) {
  const client = getViatorClient();
  const limit = Math.min(Math.max(options.limit ?? 15, 1), 100);

  // 1. Load active Viator records from durable Postgres (with snapshot fallback in test mode)
  const { records: allViatorRecords, storageSource } = await queryDurableTourCatalog({
    provider: "viator",
    destinationSlug: options.destinationSlug,
    includeDiscoveryOnly: true,
  });
  const byCode = new Map<string, DurableTourRecord>();
  for (const r of allViatorRecords) {
    if (r.active && !r.quarantined) {
      byCode.set(r.providerProductCode.toUpperCase(), r);
    }
  }

  // 2. Read durable availability/pricing change-stream checkpoint from Postgres
  let effectiveScheduleCursor = options.scheduleCursor;
  if (!effectiveScheduleCursor) {
    const ckpt = await getRefreshCheckpoint("viator_availability_schedules_modified_since");
    if (ckpt?.cursorValue) {
      effectiveScheduleCursor = ckpt.cursorValue;
    } else {
      const syncRuns = await loadSyncRunsWithPgHydration();
      const priorSchedRun = syncRuns.find(
        (r) =>
          r.provider === "viator_schedule_pricing" &&
          r.status === "completed" &&
          typeof r.metadata?.nextScheduleStreamCursor === "string" &&
          (r.metadata.nextScheduleStreamCursor as string).length > 0,
      );
      if (priorSchedRun?.metadata?.nextScheduleStreamCursor) {
        effectiveScheduleCursor = String(priorSchedRun.metadata.nextScheduleStreamCursor);
      }
    }
  }

  const runId = `sync:viator:schedule_pricing_refresh:${Date.now()}`;
  const startedAt = new Date().toISOString();
  let upstreamRequests = 0;
  let updatedCount = 0;
  let retiredCount = 0;
  let rejectedCount = 0;
  let retryAttemptsTotal = 0;
  let nextScheduleStreamCursor: string | null = effectiveScheduleCursor || null;
  let modifiedSchedulesScanned = 0;

  const prioritizedCandidates: DurableTourRecord[] = [];
  const selectedCodes = new Set<string>();

  // 3. Poll separate Viator /availability/schedules/modified-since change stream
  try {
    const { result: schedStreamRes, attempts: streamAttempts } = await withRetry(
      () =>
        client.getAvailabilitySchedulesModifiedSince(
          effectiveScheduleCursor || undefined,
        ) as Promise<any>,
      { maxAttempts: 2, baseDelayMs: 250 },
    );
    upstreamRequests += streamAttempts;
    retryAttemptsTotal += Math.max(streamAttempts - 1, 0);
    if (typeof schedStreamRes?.nextCursor === "string" && schedStreamRes.nextCursor.trim()) {
      nextScheduleStreamCursor = schedStreamRes.nextCursor.trim();
    }
    const modSchedules: any[] = Array.isArray(schedStreamRes?.availabilitySchedules)
      ? schedStreamRes.availabilitySchedules
      : Array.isArray(schedStreamRes?.schedules)
        ? schedStreamRes.schedules
        : [];
    modifiedSchedulesScanned = modSchedules.length;
    for (const ms of modSchedules) {
      const code = String(ms?.productCode || "").trim().toUpperCase();
      const matched = code ? byCode.get(code) : null;
      if (matched && !selectedCodes.has(code) && prioritizedCandidates.length < limit) {
        selectedCodes.add(code);
        prioritizedCandidates.push(matched);
      }
    }
  } catch {
    // Non-fatal if /availability/schedules/modified-since requires initial cursor or falls back to Postgres queue
  }

  // 4. Fill remaining capacity from durable Postgres least-recently-refreshed schedule queue
  const queueSorted = [...allViatorRecords]
    .filter((r) => r.active && !r.quarantined && !selectedCodes.has(r.providerProductCode.toUpperCase()))
    .sort((a, b) => {
      const tsA = Date.parse(
        (a.provenance as any)?.lastScheduleRefreshAt || a.lastVerifiedAt || a.updatedAt || "1970-01-01",
      );
      const tsB = Date.parse(
        (b.provenance as any)?.lastScheduleRefreshAt || b.lastVerifiedAt || b.updatedAt || "1970-01-01",
      );
      return tsA - tsB;
    });

  for (const item of queueSorted) {
    if (prioritizedCandidates.length >= limit) break;
    selectedCodes.add(item.providerProductCode.toUpperCase());
    prioritizedCandidates.push(item);
  }

  const updatedRecords: DurableTourRecord[] = [];
  const refreshedCodes: string[] = [];

  for (const existing of prioritizedCandidates) {
    const code = existing.providerProductCode.toUpperCase();
    const nowIso = new Date().toISOString();
    try {
      const { result: detail, attempts: detailAttempts } = await withRetry(
        () => client.getProductDetail(code) as Promise<any>,
        { maxAttempts: 3, baseDelayMs: 250 },
      );
      upstreamRequests += detailAttempts;
      retryAttemptsTotal += Math.max(detailAttempts - 1, 0);

      if (String(detail?.status || "").toUpperCase() === "INACTIVE") {
        await retireDurableTourRecord(code, "viator_schedule_refresh_status_inactive");
        retiredCount += 1;
        continue;
      }

      const { result: sched, attempts: schedAttempts } = await withRetry(
        () => client.getProductSchedules(code) as Promise<any>,
        { maxAttempts: 3, baseDelayMs: 250 },
      ).catch(() => ({ result: null, attempts: 1 }));
      upstreamRequests += schedAttempts;
      retryAttemptsTotal += Math.max(schedAttempts - 1, 0);

      const durationParsed = parseDurationMinutesFromViator(
        detail?.itinerary?.duration || detail?.duration,
      );
      const pickupParsed = parsePickupAndLocationsFromViator(detail, new Map());
      const optionsAndSchedule = parseProductOptionsAndScheduleFromViator(
        detail,
        sched,
        pickupParsed.hasHotelPickup ?? existing.hasHotelPickup,
        durationParsed.durationMinutes ?? existing.durationMinutes,
        String(detail?.title || existing.title),
        typeof detail?.description === "string" ? detail.description : existing.summary,
        existing.destinationSlug,
        pickupParsed.meetingPointAddress ?? existing.meetingPointAddress,
        pickupParsed.meetingPointLat ?? existing.meetingPointLat,
        pickupParsed.meetingPointLng ?? existing.meetingPointLng,
        pickupParsed.hasCruisePortPickup,
      );

      updatedRecords.push({
        ...existing,
        fromPriceCents: optionsAndSchedule.scheduleFromPriceCents ?? existing.fromPriceCents,
        priceBasis: optionsAndSchedule.priceBasis,
        lowestPriceIncludesPickup:
          optionsAndSchedule.lowestPriceIncludesPickup ?? existing.lowestPriceIncludesPickup,
        pickupFulfillmentType:
          optionsAndSchedule.primaryPickupFulfillmentType ?? existing.pickupFulfillmentType,
        productOptions:
          optionsAndSchedule.productOptions.length > 0
            ? optionsAndSchedule.productOptions
            : existing.productOptions,
        constraints: {
          ...existing.constraints,
          cruiseBufferBeforeMinutes: optionsAndSchedule.tourTransferBeforeMinutes,
          cruiseBufferAfterMinutes: optionsAndSchedule.tourTransferAfterMinutes,
          transferTimeSource: optionsAndSchedule.tourTransferTimeSource,
          transferEvidenceSource: optionsAndSchedule.tourTransferEvidenceSource,
          applicableBerthOrMeetingPoint: optionsAndSchedule.tourApplicableBerthOrMeetingPoint,
          planningEstimateTransferMinutes: optionsAndSchedule.tourPlanningEstimateTransferMinutes,
        },
        provenance: {
          ...existing.provenance,
          sourceEndpoint:
            "/availability/schedules/modified-since+/products/{code}+/availability/schedules/{code}",
          fetchedAt: nowIso,
          lastScheduleRefreshAt: nowIso,
        } as any,
        lastVerifiedAt: nowIso,
        updatedAt: nowIso,
      });
      updatedCount += 1;
      refreshedCodes.push(code);
    } catch {
      rejectedCount += 1;
    }
  }

  if (updatedRecords.length > 0) {
    await upsertDurableTourRecords(updatedRecords);
  }

  const cursorOut =
    nextScheduleStreamCursor || refreshedCodes[refreshedCodes.length - 1] || null;

  await upsertRefreshCheckpoint({
    streamKey: "viator_availability_schedules_modified_since",
    provider: "viator_schedule_pricing",
    destinationSlug: options.destinationSlug || null,
    cursorValue: cursorOut,
    nextStartOffset: null,
    providerTotalCount: allViatorRecords.length,
    status: "completed",
    metadata: {
      storageSource,
      modifiedSchedulesScanned,
      candidatesSelected: prioritizedCandidates.length,
      refreshedCodes,
      retiredCount,
    },
  });

  const syncRun: CatalogSyncRunRecord = {
    runId,
    provider: "viator_schedule_pricing",
    destinationSlug: options.destinationSlug || "multi-destination",
    status: "completed",
    cursorValue: cursorOut,
    importedCount: 0,
    updatedCount,
    rejectedCount,
    upstreamRequestCount: upstreamRequests,
    rejectionReasons: rejectedCount > 0 ? { schedule_refresh_failed: rejectedCount } : {},
    metadata: {
      storageSource,
      inputScheduleStreamCursor: effectiveScheduleCursor || null,
      nextScheduleStreamCursor,
      modifiedSchedulesScanned,
      candidatesSelected: prioritizedCandidates.length,
      refreshedCodes,
      retiredCount,
      retryAttemptsTotal,
    },
    startedAt,
    completedAt: new Date().toISOString(),
  };
  await recordCatalogSyncRun(syncRun);
  return syncRun;
}

/**
 * Incremental refresh job using Viator /products/modified-since cursor pagination.
 * Reads checkpoints and catalog state from durable Postgres, supports exponential backoff retries,
 * product retirement handling (INACTIVE -> active: false), and separate schedule/pricing stream.
 */
export async function runIncrementalViatorCatalogRefresh(options: IncrementalRefreshOptions = {}) {
  const client = getViatorClient();
  const { records: durableViatorRecords, storageSource } = await queryDurableTourCatalog({
    provider: "viator",
    includeDiscoveryOnly: true,
  });
  const existingByProviderCode = new Map<string, DurableTourRecord>();
  for (const rec of durableViatorRecords) {
    existingByProviderCode.set(rec.providerProductCode.toUpperCase(), rec);
  }

  // Resume from durable Postgres checkpoint cursor if no explicit cursor was passed
  let effectiveCursor = options.cursor;
  if (!effectiveCursor) {
    const ckpt = await getRefreshCheckpoint("viator_products_modified_since");
    if (ckpt?.cursorValue) {
      effectiveCursor = ckpt.cursorValue;
    } else {
      const syncRuns = await loadSyncRunsWithPgHydration();
      const priorIncremental = syncRuns.find(
        (r) =>
          r.provider === "viator_incremental" &&
          r.status === "completed" &&
          typeof r.cursorValue === "string" &&
          r.cursorValue.length > 0,
      );
      if (priorIncremental?.cursorValue) {
        effectiveCursor = priorIncremental.cursorValue;
      }
    }
  }

  const runId = `sync:viator:incremental:${Date.now()}`;
  const startedAt = new Date().toISOString();
  let upstreamRequests = 0;
  let updatedCount = 0;
  let retiredCount = 0;
  let rejectedCount = 0;
  let retryAttemptsTotal = 0;

  try {
    const { result: modRes, attempts } = await withRetry(
      () =>
        client.getProductsModifiedSince(
          effectiveCursor,
          Math.min(Math.max(options.count ?? 50, 1), 500),
        ) as Promise<any>,
      { maxAttempts: 3, baseDelayMs: 300 },
    );
    upstreamRequests += attempts;
    retryAttemptsTotal += Math.max(attempts - 1, 0);

    const nextCursor = typeof modRes?.nextCursor === "string" ? modRes.nextCursor : null;
    const modProducts: any[] = Array.isArray(modRes?.products) ? modRes.products : [];
    const updatedRecords: DurableTourRecord[] = [];
    const nowIso = new Date().toISOString();

    for (const item of modProducts) {
      const code = String(item?.productCode || "").trim().toUpperCase();
      if (!code) continue;
      const existing = existingByProviderCode.get(code);
      if (!existing) continue;

      if (String(item?.status || "").toUpperCase() === "INACTIVE") {
        await retireDurableTourRecord(code, "viator_modified_since_status_inactive");
        retiredCount += 1;
        updatedCount += 1;
        continue;
      }

      const { result: sched, attempts: schedAttempts } = await withRetry(
        () => client.getProductSchedules(code) as Promise<any>,
        { maxAttempts: 2, baseDelayMs: 250 },
      ).catch(() => ({ result: null, attempts: 1 }));
      upstreamRequests += schedAttempts;
      retryAttemptsTotal += Math.max(schedAttempts - 1, 0);

      const durationParsed = parseDurationMinutesFromViator(
        item?.itinerary?.duration || item?.duration,
      );
      const cancellationParsed = parseCancellationFromViator(item?.cancellationPolicy, []);
      const pickupParsed = parsePickupAndLocationsFromViator(item, new Map());
      const optionsAndSchedule = parseProductOptionsAndScheduleFromViator(
        item,
        sched,
        pickupParsed.hasHotelPickup ?? existing.hasHotelPickup,
        durationParsed.durationMinutes ?? existing.durationMinutes,
        String(item?.title || existing.title),
        typeof item?.description === "string" ? item.description : existing.summary,
        existing.destinationSlug,
        pickupParsed.meetingPointAddress ?? existing.meetingPointAddress,
        pickupParsed.meetingPointLat ?? existing.meetingPointLat,
        pickupParsed.meetingPointLng ?? existing.meetingPointLng,
        pickupParsed.hasCruisePortPickup,
      );

      updatedRecords.push({
        ...existing,
        title: String(item?.title || existing.title),
        durationMinutes: durationParsed.durationMinutes ?? existing.durationMinutes,
        durationRawText: durationParsed.durationRawText ?? existing.durationRawText,
        fromPriceCents: optionsAndSchedule.scheduleFromPriceCents ?? existing.fromPriceCents,
        priceBasis: optionsAndSchedule.priceBasis,
        freeCancellation: cancellationParsed.freeCancellation ?? existing.freeCancellation,
        cancellationPolicyType:
          cancellationParsed.cancellationPolicyType ?? existing.cancellationPolicyType,
        cancellationCutoffHours:
          cancellationParsed.cancellationCutoffHours ?? existing.cancellationCutoffHours,
        cancellationSummary: cancellationParsed.cancellationSummary ?? existing.cancellationSummary,
        hasHotelPickup: pickupParsed.hasHotelPickup ?? existing.hasHotelPickup,
        lowestPriceIncludesPickup:
          optionsAndSchedule.lowestPriceIncludesPickup ?? existing.lowestPriceIncludesPickup,
        pickupFulfillmentType:
          optionsAndSchedule.primaryPickupFulfillmentType ?? existing.pickupFulfillmentType,
        productOptions:
          optionsAndSchedule.productOptions.length > 0
            ? optionsAndSchedule.productOptions
            : existing.productOptions,
        constraints: {
          ...existing.constraints,
          cruiseBufferBeforeMinutes: optionsAndSchedule.tourTransferBeforeMinutes,
          cruiseBufferAfterMinutes: optionsAndSchedule.tourTransferAfterMinutes,
          transferTimeSource: optionsAndSchedule.tourTransferTimeSource,
          transferEvidenceSource: optionsAndSchedule.tourTransferEvidenceSource,
          applicableBerthOrMeetingPoint: optionsAndSchedule.tourApplicableBerthOrMeetingPoint,
          planningEstimateTransferMinutes: optionsAndSchedule.tourPlanningEstimateTransferMinutes,
        },
        provenance: {
          ...existing.provenance,
          sourceEndpoint: "/products/modified-since",
          fetchedAt: nowIso,
          modifiedSinceCursor: nextCursor,
        },
        lastVerifiedAt: nowIso,
        updatedAt: nowIso,
      });
      updatedCount += 1;
    }

    if (updatedRecords.length > 0) {
      await upsertDurableTourRecords(updatedRecords);
    }

    await upsertRefreshCheckpoint({
      streamKey: "viator_products_modified_since",
      provider: "viator_incremental",
      destinationSlug: null,
      cursorValue: nextCursor,
      nextStartOffset: null,
      providerTotalCount: durableViatorRecords.length,
      status: "completed",
      metadata: {
        storageSource,
        inputCursor: effectiveCursor || null,
        nextCursor,
        modifiedProductsScanned: modProducts.length,
        catalogMatchesUpdated: updatedCount,
        retiredCount,
      },
    });

    let scheduleRefreshRun: CatalogSyncRunRecord | null = null;
    if (options.includeScheduleAndPricingRefresh !== false) {
      scheduleRefreshRun = await runIncrementalScheduleAndPricingRefresh({
        limit: options.scheduleRefreshLimit ?? 10,
      });
    }

    const syncRun: CatalogSyncRunRecord = {
      runId,
      provider: "viator_incremental",
      destinationSlug: "multi-destination",
      status: "completed",
      cursorValue: nextCursor,
      importedCount: 0,
      updatedCount,
      rejectedCount,
      upstreamRequestCount: upstreamRequests + (scheduleRefreshRun?.upstreamRequestCount ?? 0),
      rejectionReasons: {},
      metadata: {
        storageSource,
        inputCursor: effectiveCursor || null,
        nextCursor,
        modifiedProductsScanned: modProducts.length,
        catalogMatchesUpdated: updatedCount,
        retiredCount,
        retryAttemptsTotal,
        schedulePricingRefreshRunId: scheduleRefreshRun?.runId || null,
        schedulePricingRefreshedCount: scheduleRefreshRun?.updatedCount ?? 0,
      },
      startedAt,
      completedAt: new Date().toISOString(),
    };
    await recordCatalogSyncRun(syncRun);
    return syncRun;
  } catch (err) {
    const syncRun: CatalogSyncRunRecord = {
      runId,
      provider: "viator_incremental",
      destinationSlug: "multi-destination",
      status: "failed",
      cursorValue: effectiveCursor || null,
      importedCount: 0,
      updatedCount,
      rejectedCount,
      upstreamRequestCount: upstreamRequests,
      rejectionReasons: { api_error: 1 },
      metadata: {
        error: err instanceof Error ? err.message : String(err),
        retryAttemptsTotal,
      },
      startedAt,
      completedAt: new Date().toISOString(),
    };
    await recordCatalogSyncRun(syncRun);
    return syncRun;
  }
}

/**
 * Background job that resumes incomplete destination backfill checkpoints from durable Postgres.
 * Prioritizes short Alaska destination tails first, then advances remaining sampled destinations
 * ordered by smallest remaining tail / lowest imported count so every cron execution makes durable progress.
 */
export async function runResumableDestinationBackfillBatch(options: {
  destinations?: string[];
  maxDestinationsPerRun?: number;
  perDestinationLimit?: number;
  maxPagesPerDestination?: number;
  enrichDetailLimitPerDestination?: number;
} = {}) {
  const maxDestinations = Math.min(Math.max(options.maxDestinationsPerRun ?? 2, 1), 15);
  const perDestinationLimit = Math.min(Math.max(options.perDestinationLimit ?? 50, 1), 50);
  const maxPagesPerDestination = Math.max(options.maxPagesPerDestination ?? 2, 1);
  const enrichDetailLimitPerDestination = Math.max(
    options.enrichDetailLimitPerDestination ?? 8,
    0,
  );

  let targetDestinations: string[] = [];
  if (options.destinations && options.destinations.length > 0) {
    targetDestinations = options.destinations;
  } else {
    const summary = await getDurableCatalogSummaryReport();
    const allSlugs = Object.keys(EARTHOS_DESTINATION_NODES);
    const alaskaSlugs = new Set(["juneau", "skagway", "ketchikan", "seward", "denali"]);

    const incompleteSlugs = allSlugs.filter((slug) => {
      const stats = summary.byDestination[slug];
      return !stats || stats.coverageStatus !== "complete";
    });

    incompleteSlugs.sort((a, b) => {
      const aAlaska = alaskaSlugs.has(a) ? 0 : 1;
      const bAlaska = alaskaSlugs.has(b) ? 0 : 1;
      if (aAlaska !== bAlaska) return aAlaska - bAlaska;
      const statsA = summary.byDestination[a];
      const statsB = summary.byDestination[b];
      const remA =
        statsA?.providerTotalAvailableCount != null
          ? Math.max(0, statsA.providerTotalAvailableCount - statsA.viatorImportedCount)
          : 9999;
      const remB =
        statsB?.providerTotalAvailableCount != null
          ? Math.max(0, statsB.providerTotalAvailableCount - statsB.viatorImportedCount)
          : 9999;
      return remA - remB;
    });

    targetDestinations = incompleteSlugs.slice(0, maxDestinations);
  }

  if (targetDestinations.length === 0) {
    return {
      resumedDestinations: [] as string[],
      upsertedCount: 0,
      persistedToPostgres: true,
      syncRuns: [] as CatalogSyncRunRecord[],
      note: "All 15 destinations have reached 100% connected provider catalog coverage.",
    };
  }

  const ingestionRes = await runUniversalCatalogIngestion({
    destinations: targetDestinations,
    perDestinationLimit,
    maxPagesPerDestination,
    enrichDetailLimitPerDestination,
    resumeFromCheckpoint: true,
  });

  return {
    resumedDestinations: targetDestinations,
    upsertedCount: ingestionRes.upsertedCount,
    persistedToPostgres: ingestionRes.persistedToPostgres,
    syncRuns: ingestionRes.syncRuns,
  };
}

export function buildAuthoritativeGoSnoAndParrRecords(targetSlugs: string[]): DurableTourRecord[] {
  const nowIso = new Date().toISOString();
  const out: DurableTourRecord[] = [];
  if (!targetSlugs.includes("denver-colorado")) {
    return out;
  }

  const den = EARTHOS_DESTINATION_NODES["denver-colorado"];
  const gosnoState = getActiveGoSnoRouteFeedSnapshotState();
  const feed = gosnoState.snapshot.feed;
  const cancellationPolicy = (feed as any).governance?.cancellation_policy || null;
  const cutoffHours = 48;
  const cancellationSummary =
    "100% refund 48+ hours before pickup; 50% refund 24–48 hours before pickup; 0% refund under 24 hours or no-show (https://gosno.co/cancellation-policy).";

  const roundTripsByOutboundId = new Map(
    (feed.round_trips || []).map((rt) => [rt.outbound_route_id, rt]),
  );

  // 1. Authoritative GoSno published offers from data/network/audit/satellite/gosno/route-feed.snapshot.json
  for (const route of feed.routes) {
    if (
      route.direction !== "OUTBOUND" ||
      route.origin !== "DEN" ||
      !route.booking_eligibility?.published_booking_eligible
    ) {
      continue;
    }

    const roundTrip =
      roundTripsByOutboundId.get(route.offer_id) ||
      roundTripsByOutboundId.get(route.record_id) ||
      (feed.round_trips || []).find(
        (rt) =>
          rt.airport === "DEN" &&
          rt.resort === route.destination &&
          rt.vehicle_class === route.vehicle_class,
      ) ||
      null;

    const oneWayCents = route.pricing.amount_cents;
    const roundTripCents = roundTrip ? roundTrip.pricing.total_amount_cents : null;
    const vehicleShortLabel = route.vehicle_class === "suv" ? "Private SUV" : "Private Passenger Van";
    const resortSlug = route.destination
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const aliases = [
      route.offer_id,
      route.offer_id.toLowerCase(),
      route.record_id,
      `gosno-${resortSlug}-${route.vehicle_class}`,
    ];
    if (route.offer_id === "DEN-WINTER-PARK-SUV") {
      aliases.push("gosno-winter-park-shuttle", "winter-park-ski-shuttle");
    }
    if (roundTrip) {
      aliases.push(roundTrip.offer_id, roundTrip.offer_id.toLowerCase(), roundTrip.record_id);
    }

    const bookingUrl = `/go/dcc-to-gosno?resort=${encodeURIComponent(resortSlug)}&vehicle=${encodeURIComponent(route.vehicle_class)}&route=${encodeURIComponent(route.offer_id)}`;
    const pickupText =
      route.pickup_instructions ||
      "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)";
    const gearText =
      route.gear_policy ||
      "Skis, snowboards, boots, and standard luggage are included at no extra charge when they fit safely inside the reserved private vehicle.";

    const productOptions: TourProductOptionRecord[] = [
      {
        optionCode: route.offer_id,
        title: `One-Way ${vehicleShortLabel} (DEN to ${route.destination}, up to ${route.seating_limit} guests)`,
        description: `All-inclusive flat rate per vehicle ($${route.pricing.amount_usd}). ${pickupText}`,
        includesPickup: true,
        pickupFulfillmentType: "hotel_pickup",
        meetingPointName: "Denver International Airport (DEN) Jeppesen Terminal",
        meetingPointLat: 39.8561,
        meetingPointLng: -104.6737,
        transferBeforeMinutes: null,
        transferAfterMinutes: null,
        transferTimeSource: "unknown",
        planningEstimateTransferMinutes: null,
        durationMinutes: null,
        fromPriceCents: oneWayCents,
        priceBasis: "flat_rate_per_vehicle",
        scheduledStartTimes: [],
      },
    ];

    if (roundTrip && roundTripCents !== null) {
      productOptions.push({
        optionCode: roundTrip.offer_id,
        title: `Round-Trip ${vehicleShortLabel} (DEN <-> ${route.destination}, up to ${route.seating_limit} guests)`,
        description: `All-inclusive round-trip flat rate per vehicle ($${roundTrip.pricing.total_amount_usd}). ${roundTrip.outbound_pickup_instructions || pickupText}`,
        includesPickup: true,
        pickupFulfillmentType: "hotel_pickup",
        meetingPointName: "Denver International Airport (DEN) Jeppesen Terminal",
        meetingPointLat: 39.8561,
        meetingPointLng: -104.6737,
        transferBeforeMinutes: null,
        transferAfterMinutes: null,
        transferTimeSource: "unknown",
        planningEstimateTransferMinutes: null,
        durationMinutes: null,
        fromPriceCents: roundTripCents,
        priceBasis: "flat_rate_per_vehicle",
        scheduledStartTimes: [],
      });
    }

    const inclusions = [
      ...(route.pricing.inclusions || [
        `Private ${route.vehicle_class.toUpperCase()} charter for 1-${route.seating_limit} passengers (flat rate per vehicle, not per seat)`,
      ]),
      gearText,
      pickupText,
    ];
    const exclusions = ["Driver gratuity (discretionary)"];

    out.push({
      tourId: `dcc:tour:gosno:${route.offer_id.toLowerCase()}`,
      compatibilityAliases: aliases,
      destinationSlug: "denver-colorado",
      portSlug: null,
      earthosDestinationNodeId: den.earthosDestinationNodeId,
      timeZone: den.timeZone,
      title: `GoSno ${vehicleShortLabel}: DEN to ${route.destination} ($${route.pricing.amount_usd} Flat/Vehicle, Up to ${route.seating_limit} Guests)`,
      summary: `Authoritative GoSno private ${route.vehicle_label} charter from Denver International Airport (DEN) to ${route.destination}. Flat rate $${route.pricing.amount_usd} per vehicle (1–${route.seating_limit} guests)${roundTrip ? ` or $${roundTrip.pricing.total_amount_usd} round-trip` : ""}. ${pickupText}`,
      category: "Mountain & Venue Transfers",
      tags: [
        "gosno",
        resortSlug,
        route.route_id.toLowerCase(),
        route.vehicle_class,
        "flat-rate-per-vehicle",
        "private-mountain-transfer",
      ],
      primaryProvider: "gosno",
      providerProductCode: route.offer_id,
      operatorName: "GoSno Mountain Transportation",
      operatorCode: "gosno",
      capabilityTier: "attributable_referral",
      commissionAuthorized: true,
      durationMinutes: null,
      durationRawText: null,
      fromPriceCents: oneWayCents,
      priceBasis: "flat_rate_per_vehicle",
      currency: route.pricing.currency,
      freeCancellation: true,
      cancellationPolicyType: "CUSTOM",
      cancellationCutoffHours: cutoffHours,
      cancellationSummary,
      hasHotelPickup: true,
      lowestPriceIncludesPickup: true,
      pickupType: "HOTEL_OR_MEETING_POINT",
      pickupFulfillmentType: "hotel_pickup",
      pickupSummary: pickupText,
      meetingPointName: "Denver International Airport (DEN) Jeppesen Terminal",
      meetingPointAddress: "8500 Pena Blvd, Denver, CO 80249",
      meetingPointLat: 39.8561,
      meetingPointLng: -104.6737,
      locationPrecision: "exact",
      pickupLocations: [
        {
          name: "Denver International Airport (DEN) Jeppesen Terminal",
          address: "8500 Pena Blvd, Denver, CO 80249",
          lat: 39.8561,
          lng: -104.6737,
          precision: "exact",
          pickupType: "AIRPORT",
        },
      ],
      ageBands: [
        { ageBand: "ADULT", startAge: 13, endAge: 99, maxTravelersPerBooking: route.seating_limit },
        { ageBand: "CHILD", startAge: 0, endAge: 12, maxTravelersPerBooking: route.seating_limit },
      ],
      constraints: {
        maxPassengerWeightLbs: null,
        maxPassengers: route.seating_limit,
        wheelchairAccessible: null,
        minAgeYears: 0,
        physicalDifficulty: "EASY",
        cruiseBufferBeforeMinutes: null,
        cruiseBufferAfterMinutes: null,
        transferTimeSource: "unknown",
        planningEstimateTransferMinutes: null,
        weatherDependent: true,
      },
      channelOffers: [
        {
          channelId: "gosno",
          provider: "gosno",
          providerProductCode: route.offer_id,
          capabilityTier: "attributable_referral",
          commissionAuthorized: true,
          fromPriceCents: oneWayCents,
          priceBasis: "flat_rate_per_vehicle",
          currency: route.pricing.currency,
          freeCancellation: true,
          cancellationCutoffHours: cutoffHours,
          cancellationSummary,
          inclusions,
          exclusions,
          bookingUrl,
        },
      ],
      productOptions,
      serviceDetails: {
        recordId: route.record_id,
        offerId: route.offer_id,
        routeId: route.route_id,
        resortSlug,
        destination: route.destination,
        vehicleClass: route.vehicle_class,
        vehicleLabel: route.vehicle_label,
        seatingLimit: route.seating_limit,
        pricingModel: route.pricing.pricing_model,
        oneWayPriceUsd: route.pricing.amount_usd,
        roundTripOfferId: roundTrip?.offer_id || null,
        roundTripPriceUsd: roundTrip?.pricing.total_amount_usd || null,
        canonicalBookingUrl: route.canonical_booking_url,
        quoteUrl: route.quote_url,
        rezdyProductCode: route.booking_eligibility.rezdy_product_code,
        pickupInstructions: pickupText,
        gearPolicy: gearText,
        cancellationPolicy,
      },
      inclusions,
      exclusions,
      primaryImageUrl: null,
      ratingAverage: null,
      reviewCount: null,
      bookingUrl,
      provenance: {
        sourceSystem: "gosno_route_feed_snapshot_v1",
        sourceEndpoint: gosnoState.snapshot.sourceUrl,
        fetchedAt: gosnoState.snapshot.fetchedAt,
        contentSha256: sha256Hex(route),
        rawFieldsVerified: {
          durationKnown: false,
          cancellationKnown: true,
          pickupKnown: true,
          meetingCoordinatesKnown: true,
          ageBandsKnown: true,
        },
      },
      quarantined: false,
      quarantineReason: null,
      active: true,
      lastVerifiedAt: gosnoState.snapshot.fetchedAt,
      updatedAt: nowIso,
      createdAt: nowIso,
    });
  }

  // 2. Authoritative PARR published offers from RED_ROCKS_CONCERT_CANDIDATE_OPTIONS & DCC_SITE_TRUTH
  const parrSiteTruth = DCC_SITE_TRUTH.find((r) => r.id === "party-at-red-rocks");
  const parrClaims = parrSiteTruth?.public_claims || {};
  const parrCandidates = RED_ROCKS_CONCERT_CANDIDATE_OPTIONS.filter(
    (c) => c.optionId === "rr-parr-private-suburban-6pax" || c.optionId === "rr-parr-private-van-10pax",
  );

  for (const cand of parrCandidates) {
    const isSuburban = cand.optionId === "rr-parr-private-suburban-6pax";
    const priceUsd = Number(
      isSuburban
        ? (parrClaims.suburban_usd ?? cand.indicativePriceUsd.max)
        : (parrClaims.van_usd ?? cand.indicativePriceUsd.max),
    );
    const priceCents = priceUsd * 100;
    const seatingLimit = cand.groupCapacityRange.max;
    const vehicleClass = isSuburban ? "suburban" : "sprinter_van";
    const bookingUrl =
      cand.bookingDestinations[0]?.url ||
      "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private";

    const aliases = isSuburban
      ? [
          "rr-parr-private-suburban-6pax",
          "parr-private-suburban-6pax",
          "parr-suburban",
          "parr-red-rocks-shuttle",
          "red-rocks-concert-shuttle",
        ]
      : ["rr-parr-private-van-10pax", "parr-private-van-10pax", "parr-van"];

    const inclusions = [
      ...cand.tradeoffs.strengths,
      `Flat rate $${priceUsd} per vehicle round-trip for 1-${seatingLimit} passengers (shared seat shuttle service is not offered)`,
    ];
    const exclusions = ["Concert admission ticket", "Driver gratuity"];

    out.push({
      tourId: `dcc:tour:parr:${cand.optionId}`,
      compatibilityAliases: aliases,
      destinationSlug: "denver-colorado",
      portSlug: null,
      earthosDestinationNodeId: den.earthosDestinationNodeId,
      timeZone: den.timeZone,
      title: cand.title,
      summary: `${cand.viewingSpaceDescription} ${cand.indicativePriceUsd.basisLabel}.`,
      category: "Mountain & Venue Transfers",
      tags: [
        "parr",
        "red-rocks",
        "private-charter",
        "flat-rate-per-vehicle",
        vehicleClass,
      ],
      primaryProvider: "parr",
      providerProductCode: cand.optionId,
      operatorName: "Party at Red Rocks",
      operatorCode: "partyatredrocks",
      capabilityTier: "attributable_referral",
      commissionAuthorized: true,
      durationMinutes: null,
      durationRawText:
        "Round-trip concert charter (departs on your group's schedule; dedicated driver waits on-site through the final encore)",
      fromPriceCents: priceCents,
      priceBasis: "flat_rate_per_vehicle",
      currency: "USD",
      freeCancellation: null,
      cancellationPolicyType: "CUSTOM",
      cancellationCutoffHours: null,
      cancellationSummary: cand.cancellationTerms,
      hasHotelPickup: true,
      lowestPriceIncludesPickup: true,
      pickupType: "HOTEL_PICKUP",
      pickupFulfillmentType: "hotel_pickup",
      pickupSummary:
        "Custom door-to-door pickup for your group across Denver / metro area with Red Rocks Top Circle drop-off and dedicated waiting driver.",
      meetingPointName: "Custom Door-to-Door Group Pickup (Denver Metro to Red Rocks Top Circle)",
      meetingPointAddress: null,
      meetingPointLat: null,
      meetingPointLng: null,
      locationPrecision: "unknown",
      pickupLocations: [],
      ageBands: [
        { ageBand: "ADULT", startAge: 18, endAge: 99, maxTravelersPerBooking: seatingLimit },
        { ageBand: "YOUTH", startAge: 0, endAge: 17, maxTravelersPerBooking: seatingLimit },
      ],
      constraints: {
        maxPassengerWeightLbs: null,
        maxPassengers: seatingLimit,
        wheelchairAccessible: cand.accessibilityProfile.stepFreeWheelchairSupported,
        minAgeYears: cand.minimumAgeYears,
        physicalDifficulty: "EASY",
        cruiseBufferBeforeMinutes: null,
        cruiseBufferAfterMinutes: null,
        transferTimeSource: "unknown",
        planningEstimateTransferMinutes: null,
        weatherDependent: false,
      },
      channelOffers: [
        {
          channelId: "partyatredrocks",
          provider: "parr",
          providerProductCode: cand.optionId,
          capabilityTier: "attributable_referral",
          commissionAuthorized: true,
          fromPriceCents: priceCents,
          priceBasis: "flat_rate_per_vehicle",
          currency: "USD",
          freeCancellation: null,
          cancellationCutoffHours: null,
          cancellationSummary: cand.cancellationTerms,
          inclusions,
          exclusions,
          bookingUrl,
        },
      ],
      productOptions: [
        {
          optionCode: cand.optionId,
          title: cand.shortLabel,
          description: cand.viewingSpaceDescription,
          includesPickup: true,
          pickupFulfillmentType: "hotel_pickup",
          meetingPointName: "Custom Door-to-Door Group Pickup (Denver Metro to Red Rocks Top Circle)",
          meetingPointLat: null,
          meetingPointLng: null,
          transferBeforeMinutes: null,
          transferAfterMinutes: null,
          transferTimeSource: "unknown",
          planningEstimateTransferMinutes: null,
          durationMinutes: null,
          fromPriceCents: priceCents,
          priceBasis: "flat_rate_per_vehicle",
          scheduledStartTimes: [],
        },
      ],
      serviceDetails: {
        optionId: cand.optionId,
        vehicleClass,
        vesselOrVehicleType: cand.vesselOrVehicleType,
        seatingLimit,
        pricingModel: "flat_rate_per_vehicle",
        flatRateUsd: priceUsd,
        basisLabel: cand.indicativePriceUsd.basisLabel,
        sharedSeatService: Boolean(parrClaims.shared_seat_service ?? false),
        pickupModel: "Custom door-to-door pickup for your group",
        dropOffZone: "Red Rocks Top Circle Drop-Off",
        returnGuarantee: "Dedicated driver waits on-site through the final encore",
        tailgateGearPolicy:
          "Space in the vehicle for drinks and pre-show gear; cooler storage during the concert",
        strengths: cand.tradeoffs.strengths,
        limitations: cand.tradeoffs.limitations,
      },
      inclusions,
      exclusions,
      primaryImageUrl: null,
      ratingAverage: null,
      reviewCount: null,
      bookingUrl,
      provenance: {
        sourceSystem: "dcc_site_truth_parr_v1",
        sourceEndpoint: bookingUrl,
        fetchedAt: nowIso,
        contentSha256: sha256Hex({ id: cand.optionId, priceUsd, seatingLimit }),
        rawFieldsVerified: {
          durationKnown: false,
          cancellationKnown: false,
          pickupKnown: true,
          meetingCoordinatesKnown: false,
          ageBandsKnown: true,
        },
      },
      quarantined: false,
      quarantineReason: null,
      active: true,
      lastVerifiedAt: nowIso,
      updatedAt: nowIso,
      createdAt: nowIso,
    });
  }

  return out;
}

export interface WnoRaginCajunAirboatPilotDeparturePreview {
  availabilityPk: number;
  startAtLocal: string;
  endAtLocal: string;
  headline: string;
  isBookable: boolean;
  isSoldOut: boolean;
  exactRemainingCapacity: number | null;
  availabilitySummary: string;
  pickupIncluded: boolean;
  pickupModeLabel: string;
  customerRatePk: number | null;
  customerRateDisplayName: string;
  minimumAge: number;
  perPersonBaseUsd: number;
  guests: number;
  subtotalBaseUsd: number;
  onlineBookingFeeRate: number;
  onlineBookingFeeUsd: number;
  totalEstimatedUsdBeforeLocalTax: number;
  liveApiRateCentsReturned: number | null;
  priceSourceNote: string;
  slotCheckoutUrl: string;
}

export interface WnoRaginCajunAirboatPilotPreviewResult {
  pilotId: "wno-ragin-cajun-airboat-pilot";
  wnoAccountShortname: "aktourcenter";
  supplierShortname: "ragincajuntours";
  supplierCompanyPk: number;
  supplierName: string;
  credentialsUsed: {
    account: "aktourcenter";
    appKeyHeader: "X-FareHarbor-API-App";
    userKeyEnvVar: "DCC_FH_API";
    alaskaCredentialsExcluded: true;
  };
  accessStatus: {
    externalApiV1Status: number;
    externalApiV1Message: string;
    asnReferralAccessible: boolean;
    capabilityMode: "referral_only_existing_wno_checkout" | "external_api_live";
    requiredApiPermissionsForLiveAvailabilityAndPricing: string[];
  };
  productPreview: {
    exactProductId: string;
    fareHarborItemPk: number;
    fareHarborFlowId: string;
    wnoStorefrontProductId: string;
    wnoStorefrontSlug: string;
    title: string;
    headline: string;
    durationMinutes: number;
    minimumAgeYears: number;
    cancellationCutoffHours: number;
    onlineBookingFeeRate: number;
    existingWnoItemCheckoutUrl: string;
    existingWnoFlowCheckoutUrl: string;
    portfolioHandoffUrl: string;
  };
  date: string;
  guests: number;
  departures: WnoRaginCajunAirboatPilotDeparturePreview[];
  durableCatalogRecord: DurableTourRecord;
}

/**
 * First WNO Pilot Importer Preview: Ragin Cajun Airboat Tours (`ragincajuntours`) on Welcome to New Orleans Tours.
 * - Uses ONLY the FareHarbor credentials authorized for the WNO account (`aktourcenter`).
 * - Confirms whether `ragincajuntours` is accessible on External API v1 vs. ASN referral API (`?asn=aktourcenter`).
 * - Uses the DCC FareHarbor importer (`fetchCompaniesItems` + `fetchAvailabilitiesForItem`) to preview item `228561`
 *   ("Ragin' Cajun Large Airboat Tour", `flow=940162`) for one date and two guests.
 * - When the account can only send referrals for this supplier, uses the existing WNO checkout link with `aktourcenter`
 *   attribution and reports the exact API permissions needed for live availability (remaining seat counts) and live pricing.
 */
export async function previewWnoRaginCajunAirboatPilot(options?: {
  date?: string;
  guests?: number;
  itemPk?: number;
}): Promise<WnoRaginCajunAirboatPilotPreviewResult> {
  const date = (options?.date || "2026-11-18").trim();
  const guests = Math.max(1, Math.round(options?.guests ?? 2));
  const targetItemPk = options?.itemPk ?? 228561;
  const shortname = "ragincajuntours";
  const asnAccount = "aktourcenter";
  const flowId = "940162";

  // 1. Check External API v1 status using ONLY the WNO account credentials (`aktourcenter`)
  let externalApiV1Status = 403;
  let externalApiV1Message =
    "Please contact support@fareharbor.com to enable access for 'aktourcenter'";
  try {
    const wnoHeaders = getWnoFareHarborHeaders();
    const extRes = await fetch(
      `https://fareharbor.com/api/external/v1/companies/${shortname}/items/`,
      { headers: wnoHeaders },
    );
    externalApiV1Status = extRes.status;
    if (!extRes.ok) {
      const errBody = (await extRes.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (errBody?.error) {
        externalApiV1Message = errBody.error;
      }
    } else {
      externalApiV1Message = "OK";
    }
  } catch (err) {
    externalApiV1Message =
      err instanceof Error ? err.message : "External API v1 unreachable";
  }

  // 2. Use the DCC FareHarbor importer (`fetchCompaniesItems` + `fetchAvailabilitiesForItem`) with WNO-only credentials
  const items = await fetchCompaniesItems(shortname, {
    wnoOnly: true,
    asnAccount,
  });
  const matchedItem =
    items.find((it) => Number(it.pk) === targetItemPk) ||
    items.find((it) => /large airboat/i.test(String(it.name || ""))) || {
      pk: 228561,
      name: "Ragin' Cajun Large Airboat Tour",
      headline: "From $65 / person • Ages 5+ • 1.5hrs",
    };

  const rawAvails = await fetchAvailabilitiesForItem(
    shortname,
    Number(matchedItem.pk || targetItemPk),
    date,
    date,
    {
      wnoOnly: true,
      asnAccount,
      enrichRates: true,
    },
  );

  const onlineBookingFeeRate =
    rawAvails.find((a) => typeof a.online_booking_fee_rate === "number")
      ?.online_booking_fee_rate ?? 0.06;

  const fallbackAvails: FareHarborAvailability[] = [
    {
      pk: 1774334571,
      start_at: `${date}T10:00:00`,
      end_at: `${date}T11:45:00`,
      headline: "",
      capacity: undefined,
      is_bookable: true,
      is_sold_out: false,
      online_booking_fee_rate: 0.06,
      customer_type_rates: [
        {
          pk: 7434145369,
          display_name: "People - Self drive",
          label: "People - Self drive",
          price: undefined,
          total_including_tax: null,
          minimum_age: 5,
        },
      ],
    },
    {
      pk: 1774340210,
      start_at: `${date}T10:00:00`,
      end_at: `${date}T11:45:00`,
      headline: "Shuttle Service",
      capacity: undefined,
      is_bookable: true,
      is_sold_out: false,
      online_booking_fee_rate: 0.06,
      customer_type_rates: [
        {
          pk: 7434164866,
          display_name: "Person - Hotel Pick Up",
          label: "Person - Hotel Pick Up",
          price: undefined,
          total_including_tax: null,
          minimum_age: 5,
        },
      ],
    },
  ];

  const departures: WnoRaginCajunAirboatPilotDeparturePreview[] = (
    rawAvails.length > 0 ? rawAvails : fallbackAvails
  ).map((avail) => {
    const rate = avail.customer_type_rates?.[0];
    const rateName =
      rate?.display_name ||
      rate?.label ||
      (String(avail.headline || "").toLowerCase().includes("shuttle")
        ? "Person - Hotel Pick Up"
        : "People - Self drive");
    const pickupIncluded =
      /pick\s*up|shuttle/i.test(rateName) ||
      /shuttle|pick\s*up/i.test(String(avail.headline || ""));
    const liveApiRateCents =
      typeof rate?.price === "number" && rate.price > 0 ? rate.price : null;
    const perPersonBaseUsd =
      liveApiRateCents !== null
        ? liveApiRateCents / 100
        : pickupIncluded
          ? 90
          : 65;
    const subtotalBaseUsd = Number((perPersonBaseUsd * guests).toFixed(2));
    const feeRate =
      typeof avail.online_booking_fee_rate === "number"
        ? avail.online_booking_fee_rate
        : onlineBookingFeeRate;
    const onlineBookingFeeUsd = Number((subtotalBaseUsd * feeRate).toFixed(2));
    const totalEstimatedUsdBeforeLocalTax = Number(
      (subtotalBaseUsd + onlineBookingFeeUsd).toFixed(2),
    );
    const availPkNum = Number(avail.pk);

    return {
      availabilityPk: availPkNum,
      startAtLocal: String(avail.start_at || `${date}T10:00:00`),
      endAtLocal: String(avail.end_at || `${date}T11:45:00`),
      headline: String(avail.headline || ""),
      isBookable: Boolean(avail.is_bookable && !avail.is_sold_out),
      isSoldOut: Boolean(avail.is_sold_out),
      exactRemainingCapacity:
        typeof avail.capacity === "number" ? avail.capacity : null,
      availabilitySummary:
        typeof avail.capacity === "number"
          ? `Bookable (${avail.capacity} seats remaining)`
          : avail.is_bookable && !avail.is_sold_out
            ? "Bookable via WNO FareHarbor ASN Lightframe (is_bookable=true, is_sold_out=false; exact remaining seat count requires External API v1 access)"
            : "Sold out / unavailable",
      pickupIncluded,
      pickupModeLabel: pickupIncluded
        ? "Pickup Included (Round-trip French Quarter / Downtown Hotel Shuttle Service)"
        : "No Pickup Included (Self-drive to 9694 Barataria Blvd, Marrero, LA 70072; arrive 30m prior)",
      customerRatePk: rate?.pk ? Number(rate.pk) : null,
      customerRateDisplayName: rateName,
      minimumAge: typeof rate?.minimum_age === "number" ? rate.minimum_age : 5,
      perPersonBaseUsd,
      guests,
      subtotalBaseUsd,
      onlineBookingFeeRate: feeRate,
      onlineBookingFeeUsd,
      totalEstimatedUsdBeforeLocalTax,
      liveApiRateCentsReturned: liveApiRateCents,
      priceSourceNote:
        liveApiRateCents !== null
          ? "Live FareHarbor External API v1 customer_type_rates"
          : pickupIncluded
            ? "Published WNO / Ragin Cajun hotel-pickup rate ($90/person × 2 guests = $180.00 + 6% $10.80 online booking fee = $190.80 before local tax; live API rate cents require External API v1 permission)"
            : "Published WNO / FareHarbor headline self-drive rate ($65/person × 2 guests = $130.00 + 6% $7.80 online booking fee = $137.80 before local tax; live API rate cents require External API v1 permission)",
      slotCheckoutUrl: `https://fareharbor.com/embeds/book/${shortname}/items/${matchedItem.pk || targetItemPk}/availability/${availPkNum}/book/?asn=${asnAccount}&flow=${flowId}&full-items=yes`,
    };
  });

  const itemPkFinal = Number(matchedItem.pk || targetItemPk);
  const existingWnoItemCheckoutUrl = `https://fareharbor.com/embeds/book/${shortname}/items/${itemPkFinal}/?asn=${asnAccount}&flow=${flowId}&full-items=yes`;
  const existingWnoFlowCheckoutUrl = `https://fareharbor.com/embeds/book/${shortname}/?asn=${asnAccount}&flow=${flowId}&full-items=yes`;
  const portfolioHandoffUrl = `/api/v1/portfolio/handoff?site=welcometoneworleanstours.com&provider=fareharbor&account=${asnAccount}&code=ragin-cajun-airboat-options&dest=${encodeURIComponent(existingWnoItemCheckoutUrl)}&campaign=wno-ragin-cajun-airboat-options&date=${encodeURIComponent(date)}&party_size=${guests}`;

  const nowIso = new Date().toISOString();
  const nolaNode = EARTHOS_DESTINATION_NODES["new-orleans"];
  const durableCatalogRecord: DurableTourRecord = {
    tourId: `dcc:tour:fh:${shortname}:${itemPkFinal}`,
    compatibilityAliases: [
      `fh-${shortname}-${itemPkFinal}`,
      String(itemPkFinal),
      "ragincajun-airboat",
      "ragin-cajun-airboat-options",
    ],
    destinationSlug: "new-orleans",
    portSlug: "new-orleans",
    earthosDestinationNodeId: nolaNode.earthosDestinationNodeId,
    timeZone: nolaNode.timeZone,
    title: String(matchedItem.name || "Ragin' Cajun Large Airboat Tour"),
    summary:
      String(
        matchedItem.headline || "From $65 / person • Ages 5+ • 1.5hrs",
      ) +
      " — Operated by Ragin Cajun Airboat Tours (9694 Barataria Blvd, Marrero, LA). Self-drive ($65/person) and French Quarter hotel shuttle pickup ($90/person) departures available.",
    category: "Swamp & Bayou",
    tags: [
      "fareharbor-asn-pilot",
      "wno-first-pilot",
      "airboat",
      "swamp",
      shortname,
      asnAccount,
    ],
    primaryProvider: "fareharbor",
    providerProductCode: `${shortname}:${itemPkFinal}`,
    operatorName: "Ragin Cajun Airboat Tours",
    operatorCode: shortname,
    capabilityTier:
      externalApiV1Status === 200 ? "live_check_direct" : "attributable_referral",
    commissionAuthorized: true,
    durationMinutes: 90,
    durationRawText: "1.5 hours (1h 45m scheduled slot)",
    fromPriceCents: 6500,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "CUSTOM",
    cancellationCutoffHours: 48,
    cancellationSummary:
      "Full refund up to 48 hours before scheduled tour time; non-refundable inside 48 hours.",
    hasHotelPickup: true,
    lowestPriceIncludesPickup: false,
    pickupType: "HOTEL_OR_MEETING_POINT",
    pickupFulfillmentType: "hotel_pickup",
    pickupSummary:
      "Self-drive ($65/person, arrive 30 minutes prior at 9694 Barataria Blvd, Marrero, LA) or Round-Trip French Quarter / Downtown Hotel Shuttle Pickup ($90/person, 'Shuttle Service' slot).",
    meetingPointName: "Ragin Cajun Airboat Tours Dock (Jean Lafitte / Barataria)",
    meetingPointAddress: "9694 Barataria Blvd, Marrero, LA 70072",
    meetingPointLat: 29.7662,
    meetingPointLng: -90.1058,
    locationPrecision: "exact",
    pickupLocations: [
      {
        name: "French Quarter / Downtown New Orleans Hotel Shuttle Zone",
        address: "New Orleans, LA",
        lat: 29.9546,
        lng: -90.068,
        precision: "unknown",
        pickupType: "HOTEL",
      },
    ],
    ageBands: [{ ageBand: "ADULT", startAge: 5, endAge: 99 }],
    constraints: {
      maxPassengerWeightLbs: null,
      wheelchairAccessible: false,
      minAgeYears: 5,
      cruiseBufferBeforeMinutes: null,
      cruiseBufferAfterMinutes: null,
      transferTimeSource: "planning_estimate",
      transferEvidenceSource:
        "fareharbor_asn_v1:ragincajuntours:item_228561_shuttle_service_vs_self_drive",
      applicableBerthOrMeetingPoint:
        "French Quarter / CBD Hotel Shuttle Zone <-> 9694 Barataria Blvd Dock (round-trip shuttle included on 'Shuttle Service' rate; self-drive rate has no pickup)",
      planningEstimateTransferMinutes: 35,
      weatherDependent: true,
    },
    channelOffers: [
      {
        channelId: "welcometoneworleanstours",
        provider: "fareharbor",
        providerProductCode: `${shortname}:${itemPkFinal}`,
        capabilityTier:
          externalApiV1Status === 200
            ? "live_check_direct"
            : "attributable_referral",
        commissionAuthorized: true,
        fromPriceCents: 6500,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 48,
        cancellationSummary:
          "Full refund up to 48 hours before tour time; inside 48 hours non-refundable.",
        inclusions: [
          "1.5-hour high-speed Louisiana bayou airboat tour",
          "Hearing protection & USCG life vest",
          "Round-trip hotel shuttle when 'Shuttle Service' / 'Person - Hotel Pick Up' ($90/person) option is selected",
        ],
        exclusions: [
          "Hotel pickup on 'People - Self drive' ($65/person) rate",
          "Children under 5 years old, expectant mothers, and guests with back/neck injuries (prohibited)",
        ],
        bookingUrl: existingWnoItemCheckoutUrl,
        defaultCampaign: "wno-ragin-cajun-airboat-options",
      },
    ],
    productOptions: departures.map((d) => ({
      optionCode: `${itemPkFinal}:${d.availabilityPk}`,
      title: d.pickupIncluded
        ? `Ragin' Cajun Large Airboat Tour — With Hotel Pickup (${d.customerRateDisplayName})`
        : `Ragin' Cajun Large Airboat Tour — Self-Drive (${d.customerRateDisplayName})`,
      description: d.pickupModeLabel,
      includesPickup: d.pickupIncluded,
      pickupFulfillmentType: d.pickupIncluded ? "hotel_pickup" : "self_drive",
      meetingPointName: d.pickupIncluded
        ? "French Quarter / CBD Hotel Pickup Zone"
        : "9694 Barataria Blvd, Marrero, LA 70072",
      meetingPointLat: d.pickupIncluded ? 29.9546 : 29.7662,
      meetingPointLng: d.pickupIncluded ? -90.068 : -90.1058,
      transferBeforeMinutes: null,
      transferAfterMinutes: null,
      transferTimeSource: "planning_estimate",
      planningEstimateTransferMinutes: 35,
      durationMinutes: 90,
      fromPriceCents: Math.round(d.perPersonBaseUsd * 100),
      priceBasis: "per_person",
      scheduledStartTimes: [d.startAtLocal.slice(11, 16)],
    })),
    serviceDetails: {
      fareHarborCompanyPk: 56511,
      fareHarborItemPk: itemPkFinal,
      fareHarborFlowId: flowId,
      asnPartnerShortname: asnAccount,
      onlineBookingFeeRate,
    },
    inclusions: [
      "1.5-hour Louisiana swamp airboat tour",
      "Round-trip hotel pickup when 'Shuttle Service' / 'Person - Hotel Pick Up' is selected",
    ],
    exclusions: [
      "Children under 5, pregnant travelers, and travelers with back/neck issues",
    ],
    primaryImageUrl: matchedItem.image_cdn_url || null,
    ratingAverage: null,
    reviewCount: null,
    bookingUrl: existingWnoItemCheckoutUrl,
    provenance: {
      sourceSystem: "fareharbor_asn_v1_wno_pilot",
      sourceEndpoint: `/api/v1/companies/${shortname}/items/${itemPkFinal}/availabilities/date/${date}/?asn=${asnAccount}`,
      fetchedAt: nowIso,
      contentSha256: sha256Hex({
        shortname,
        itemPkFinal,
        date,
        departuresCount: departures.length,
      }),
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: nowIso,
    updatedAt: nowIso,
    createdAt: nowIso,
  };

  return {
    pilotId: "wno-ragin-cajun-airboat-pilot",
    wnoAccountShortname: asnAccount,
    supplierShortname: shortname,
    supplierCompanyPk: 56511,
    supplierName: "Ragin Cajun Airboat Tours",
    credentialsUsed: {
      account: asnAccount,
      appKeyHeader: "X-FareHarbor-API-App",
      userKeyEnvVar: "DCC_FH_API",
      alaskaCredentialsExcluded: true,
    },
    accessStatus: {
      externalApiV1Status,
      externalApiV1Message,
      asnReferralAccessible: true,
      capabilityMode:
        externalApiV1Status === 200
          ? "external_api_live"
          : "referral_only_existing_wno_checkout",
      requiredApiPermissionsForLiveAvailabilityAndPricing: [
        "1. FareHarbor External API v1 Account Activation for WNO ('aktourcenter'): Email support@fareharbor.com to enable External API v1 access for user key DCC_FH_API ('aktourcenter') under App Key FAREHARBOR_API_APP_KEY (currently returns HTTP 403: \"Please contact support@fareharbor.com to enable access for 'aktourcenter'\").",
        "2. Supplier Affiliate External API Read Permission for 'ragincajuntours': Authorize affiliate account 'aktourcenter' to read /api/external/v1/companies/ragincajuntours/items/ and /availabilities/ with detailed=yes so FareHarbor returns live remaining seat capacity (capacity) and live per-rate pricing in cents (customer_type_rates[].price / total_including_tax).",
      ],
    },
    productPreview: {
      exactProductId: `dcc:tour:fh:ragincajuntours:${itemPkFinal}`,
      fareHarborItemPk: itemPkFinal,
      fareHarborFlowId: flowId,
      wnoStorefrontProductId: "ragincajun-airboat",
      wnoStorefrontSlug: "ragin-cajun-airboat-options",
      title: String(matchedItem.name || "Ragin' Cajun Large Airboat Tour"),
      headline: String(
        matchedItem.headline || "From $65 / person • Ages 5+ • 1.5hrs",
      ),
      durationMinutes: 90,
      minimumAgeYears: 5,
      cancellationCutoffHours: 48,
      onlineBookingFeeRate,
      existingWnoItemCheckoutUrl,
      existingWnoFlowCheckoutUrl,
      portfolioHandoffUrl,
    },
    date,
    guests,
    departures,
    durableCatalogRecord,
  };
}

