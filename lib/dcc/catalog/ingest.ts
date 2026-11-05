import crypto from "node:crypto";
import { getViatorClient } from "@/lib/viator/client";
import { appendViatorAttribution } from "@/lib/viator/links";
import { DCC_VIATOR_PRODUCT_MAPPINGS } from "@/lib/viator/mappings";
import { fetchCompaniesItems } from "@/lib/dcc/liveSlots/fareharbor";
import { getActiveGoSnoRouteFeedSnapshotState } from "@/lib/dcc/applicability/gosnoRouteFeedSnapshot";
import { RED_ROCKS_CONCERT_CANDIDATE_OPTIONS } from "@/lib/dcc/decisionEngines/redRocksConcertTransportationEngine";
import { DCC_SITE_TRUTH } from "@/lib/dcc/siteTruth";
import {
  EARTHOS_DESTINATION_NODES,
  getCompatibilityAliasesForViatorCode,
  readLocalCatalogSnapshot,
  recordCatalogSyncRun,
  retireDurableTourRecord,
  upsertDurableTourRecords,
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

  // New Orleans verified landmarks
  if (!destinationSlug || destinationSlug === "new-orleans") {
    if (/\b400\s+toulouse\b|\bgray\s+line\s+new\s+orleans\b|\btoulouse\s+st(?:reet)?\s+wharf\b|\bsteamboat\s+natchez\s+dock\b/i.test(norm)) {
      return {
        name: "Gray Line New Orleans / Toulouse St Wharf (400 Toulouse St)",
        address: "400 Toulouse St, New Orleans, LA 70130, USA",
        lat: 29.9546,
        lng: -90.0625,
        transferMinutesFromPier: 20,
        transferTimeSource: "verified_meeting_point",
        planningEstimateTransferMinutes: 20,
        isDowntownShuttleHub: true,
      };
    }
    if (/\b5145\s+fleming\b|\bfleming\s+park\s+rd\b|\bfleming\s+rd\b.*\blafitte\b/i.test(norm)) {
      return {
        name: "Airboat Dock (5145 Fleming Rd, Lafitte, LA)",
        address: "5145 Fleming Park Rd, Lafitte, LA 70067, USA",
        lat: 29.7367,
        lng: -90.1282,
        // Remote rural bayou self-drive site (42 km from cruise pier): transfer requires independent car/taxi confirmation
        transferMinutesFromPier: null,
        transferTimeSource: "planning_estimate",
        planningEstimateTransferMinutes: 50,
        isRemoteSelfDriveSite: true,
      };
    }
    if (/\bjackson\s+square\b|\bst\.?\s*louis\s+cathedral\b|\b700\s+decatur\b|\b500\s+st\.?\s*peter\b|\b533\s+st\.?\s*ann\b|\b400\s+royal\s+st\b|\bfrench\s+quarter\s+walking\b/i.test(norm)) {
      return {
        name: "French Quarter Historic Meeting Point (Jackson Square / Decatur St)",
        address: "700 Decatur St / Jackson Square, New Orleans, LA 70116, USA",
        lat: 29.9574,
        lng: -90.0631,
        transferMinutesFromPier: 20,
        transferTimeSource: "verified_meeting_point",
        planningEstimateTransferMinutes: 20,
      };
    }
    if (/\blafayette\s+cemetery\b|\b1427\s+washington\s+ave\b|\b2727\s+prytania\b|\bgarden\s+district\s+walking\b/i.test(norm)) {
      return {
        name: "Garden District Meeting Point (Washington Ave / Prytania St)",
        address: "1427 Washington Ave, New Orleans, LA 70130, USA",
        lat: 29.9288,
        lng: -90.0828,
        transferMinutesFromPier: 20,
        transferTimeSource: "verified_meeting_point",
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
        planningEstimateTransferMinutes: 22,
      };
    }
    if (/\b41847\s+hwy\s+190\b|\bhoney\s+island\s+swamp\b.*\bslidell\b/i.test(norm)) {
      return {
        name: "Honey Island Swamp Dock (41847 Hwy 190 E, Slidell, LA)",
        address: "41847 Hwy 190 E, Slidell, LA 70461, USA",
        lat: 30.2241,
        lng: -89.7544,
        transferMinutesFromPier: null,
        transferTimeSource: "planning_estimate",
        planningEstimateTransferMinutes: 55,
        isRemoteSelfDriveSite: true,
      };
    }
  }

  // Alaska & Caribbean cruise dock landmarks
  if (destinationSlug === "juneau" && /\bmount\s+roberts\s+tramway\b|\b490\s+s\.?\s*franklin\b|\bjuneau\s+cruise\s+ship\s+terminal\b|\baj\s+dock\b|\bfranklin\s+dock\b/i.test(norm)) {
    return {
      name: "Juneau Cruise Ship Terminal / Mount Roberts Tramway",
      address: "490 S Franklin St, Juneau, AK 99801, USA",
      lat: 58.2997,
      lng: -134.4048,
      transferMinutesFromPier: 15,
      transferTimeSource: "verified_pier_pickup",
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
      planningEstimateTransferMinutes: 15,
      isPierAdjacent: true,
    };
  }
  if (destinationSlug === "skagway" && /\bbroadway\s+dock\b|\brailroad\s+dock\b|\bore\s+dock\b|\bskagway\s+cruise\b/i.test(norm)) {
    return {
      name: "Skagway Cruise Ship Docks",
      address: "Broadway & 2nd Ave, Skagway, AK 99840, USA",
      lat: 59.4508,
      lng: -135.3182,
      transferMinutesFromPier: 15,
      transferTimeSource: "verified_pier_pickup",
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
  planningEstimateTransferMinutes: number;
} {
  const landmark =
    resolveVerifiedLandmarkCoordinatesAndPierTransfer(
      params.combinedOptionText,
      params.destinationSlug,
    ) ||
    resolveVerifiedLandmarkCoordinatesAndPierTransfer(
      params.productMeetingPointAddress,
      params.destinationSlug,
    ) ||
    resolveVerifiedLandmarkCoordinatesAndPierTransfer(
      params.productTitle,
      params.destinationSlug,
    );

  // 1. Check Pier Pickup
  if (
    params.productHasCruisePortPickup ||
    PIER_PICKUP_TEXT_REGEX.test(params.combinedOptionText) ||
    landmark?.isPierAdjacent
  ) {
    return {
      pickupFulfillmentType: "pier_pickup",
      meetingPointName: landmark?.name || null,
      meetingPointLat: landmark?.lat ?? params.productMeetingPointLat,
      meetingPointLng: landmark?.lng ?? params.productMeetingPointLng,
      transferBeforeMinutes: landmark?.transferMinutesFromPier ?? 20,
      transferAfterMinutes: landmark?.transferMinutesFromPier ?? 20,
      transferTimeSource: "verified_pier_pickup",
      planningEstimateTransferMinutes: landmark?.transferMinutesFromPier ?? 20,
    };
  }

  // 2. Check Downtown Shuttle Departure (e.g., 3780AIRBOAT TG1 meeting at 400 Toulouse St Gray Line Lighthouse for round-trip shuttle)
  if (
    params.includesPickup === true &&
    (DOWNTOWN_SHUTTLE_DEPARTURE_TEXT_REGEX.test(params.combinedOptionText) ||
      landmark?.isDowntownShuttleHub)
  ) {
    const tfMin = landmark?.transferMinutesFromPier ?? null;
    const tfSource: TransferTimeSource =
      tfMin !== null ? "verified_meeting_point" : "planning_estimate";
    return {
      pickupFulfillmentType: "downtown_shuttle_departure",
      meetingPointName: landmark?.name || null,
      meetingPointLat: landmark?.lat ?? params.productMeetingPointLat,
      meetingPointLng: landmark?.lng ?? params.productMeetingPointLng,
      transferBeforeMinutes: tfMin,
      transferAfterMinutes: tfMin,
      transferTimeSource: tfSource,
      planningEstimateTransferMinutes: landmark?.planningEstimateTransferMinutes ?? 25,
    };
  }

  // 3. Check Hotel Pickup
  if (params.includesPickup === true) {
    return {
      pickupFulfillmentType: "hotel_pickup",
      meetingPointName: landmark?.name || null,
      meetingPointLat: landmark?.lat ?? params.productMeetingPointLat,
      meetingPointLng: landmark?.lng ?? params.productMeetingPointLng,
      // Hotel pickup serves area hotels; from a cruise pier, transfer to pickup hotel is a planning estimate unless pier pickup is verified
      transferBeforeMinutes: null,
      transferAfterMinutes: null,
      transferTimeSource: "planning_estimate",
      planningEstimateTransferMinutes: 30,
    };
  }

  // 4. Check Self-Drive / Meet on Site
  if (params.includesPickup === false) {
    if (landmark && !landmark.isRemoteSelfDriveSite && landmark.transferMinutesFromPier !== null) {
      return {
        pickupFulfillmentType: "self_drive",
        meetingPointName: landmark.name,
        meetingPointLat: landmark.lat,
        meetingPointLng: landmark.lng,
        transferBeforeMinutes: landmark.transferMinutesFromPier,
        transferAfterMinutes: landmark.transferMinutesFromPier,
        transferTimeSource: "verified_meeting_point",
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

  const existingSnapshot = readLocalCatalogSnapshot();
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

    // Determine starting 1-based offset from checkpoint if resumeFromCheckpoint is enabled
    let initialStartOffset = options.startOffset ?? 1;
    if (options.resumeFromCheckpoint) {
      const priorRun = existingSnapshot.syncRuns.find(
        (r) => r.provider === "viator" && r.destinationSlug === destSlug && r.status === "completed",
      );
      const savedNext = priorRun?.metadata?.nextStartOffset;
      if (typeof savedNext === "number" && Number.isFinite(savedNext) && savedNext >= 1) {
        initialStartOffset = savedNext;
      }
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

      // Completing 5 pages (or any partial pagination) does NOT mark a destination complete unless
      // total imported Viator records for this destination cover providerTotalCount.
      const existingViatorCodesForDest = new Set(
        existingSnapshot.records
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
          pagesFetched,
          pageSize,
          providerTotalCount,
          totalViatorImportedForDest,
          coverageStatus: isCompleteCoverage ? "complete" : "sampled",
          enrichedDetailCount: detailsByCode.size,
          enrichedSchedulesCount: schedulesByCode.size,
          resolvedLocationsCount: resolvedLocationsByRef.size,
        },
        startedAt,
        completedAt: new Date().toISOString(),
      };
      allSyncRuns.push(syncRun);
      await recordCatalogSyncRun(syncRun);
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
 * Incremental availability & pricing schedule refresh job (/availability/schedules/{code}).
 * Picks active Viator records ordered by oldest schedule refresh / verification timestamp,
 * refreshes their option pricing & start times with retry, and retires deactivated products.
 */
export async function runIncrementalScheduleAndPricingRefresh(options: {
  limit?: number;
  destinationSlug?: string;
} = {}) {
  const client = getViatorClient();
  const snapshot = readLocalCatalogSnapshot();
  const limit = Math.min(Math.max(options.limit ?? 15, 1), 100);

  const candidates = snapshot.records
    .filter(
      (r) =>
        r.primaryProvider === "viator" &&
        r.active &&
        !r.quarantined &&
        (!options.destinationSlug || r.destinationSlug === options.destinationSlug),
    )
    .sort((a, b) => {
      const tsA = Date.parse(
        (a.provenance as any)?.lastScheduleRefreshAt || a.lastVerifiedAt || a.updatedAt || "1970-01-01",
      );
      const tsB = Date.parse(
        (b.provenance as any)?.lastScheduleRefreshAt || b.lastVerifiedAt || b.updatedAt || "1970-01-01",
      );
      return tsA - tsB;
    })
    .slice(0, limit);

  const runId = `sync:viator:schedule_pricing_refresh:${Date.now()}`;
  const startedAt = new Date().toISOString();
  let upstreamRequests = 0;
  let updatedCount = 0;
  let retiredCount = 0;
  let rejectedCount = 0;
  let retryAttemptsTotal = 0;
  const updatedRecords: DurableTourRecord[] = [];
  const refreshedCodes: string[] = [];

  for (const existing of candidates) {
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
          planningEstimateTransferMinutes: optionsAndSchedule.tourPlanningEstimateTransferMinutes,
        },
        provenance: {
          ...existing.provenance,
          sourceEndpoint: "/products/{code}+/availability/schedules/{code}",
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

  const syncRun: CatalogSyncRunRecord = {
    runId,
    provider: "viator_schedule_pricing",
    destinationSlug: options.destinationSlug || "multi-destination",
    status: "completed",
    cursorValue: refreshedCodes[refreshedCodes.length - 1] || null,
    importedCount: 0,
    updatedCount,
    rejectedCount,
    upstreamRequestCount: upstreamRequests,
    rejectionReasons: rejectedCount > 0 ? { schedule_refresh_failed: rejectedCount } : {},
    metadata: {
      candidatesSelected: candidates.length,
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
 * Supports durable checkpoint resumption, exponential backoff retries, product retirement
 * handling (INACTIVE -> active: false), and optional schedule/pricing refresh.
 */
export async function runIncrementalViatorCatalogRefresh(options: IncrementalRefreshOptions = {}) {
  const client = getViatorClient();
  const snapshot = readLocalCatalogSnapshot();
  const existingByProviderCode = new Map<string, DurableTourRecord>();
  for (const rec of snapshot.records) {
    if (rec.primaryProvider === "viator") {
      existingByProviderCode.set(rec.providerProductCode.toUpperCase(), rec);
    }
  }

  // Resume from durable checkpoint cursor if no explicit cursor was passed
  let effectiveCursor = options.cursor;
  if (!effectiveCursor) {
    const priorIncremental = snapshot.syncRuns.find(
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
