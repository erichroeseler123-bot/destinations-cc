import crypto from "node:crypto";
import type {
  DurableTourRecord,
  LocationPrecision,
  PickupFulfillmentType,
  TourProductOptionRecord,
  TransferTimeSource,
} from "./durableCatalogStore";
import {
  synchronizeReviewDeskToDurableStore,
  type RawResearchDeskFactRow,
  type ResearchClusterId,
} from "../research/approvedFactsFeed";

export type CatalogPickupExceptionCode =
  | "missing_pickup_mode"
  | "missing_meeting_point_identity"
  | "missing_meeting_point_coordinates"
  | "unverified_cruise_berth_transfer"
  | "option_pickup_unknown_or_ambiguous";

export interface CatalogPickupExceptionRecord {
  exceptionId: string;
  factId: string;
  tourId: string;
  provider: DurableTourRecord["primaryProvider"];
  providerProductCode: string;
  destinationSlug: string;
  portSlug: string | null;
  clusterId: ResearchClusterId | string;
  exceptionCode: CatalogPickupExceptionCode;
  optionCode: string | null;
  constraintType: "pickup_meeting";
  missingFields: string[];
  observedStateSummary: string;
  humanDecisionRequired: string;
  sourceUrl: string;
  reviewDeskStatus: "needs confirmation";
}

/**
 * Matches generic city-only or placeholder strings that must NEVER be treated
 * as a verified meeting point name or address.
 */
const GENERIC_CITY_OR_PLACEHOLDER_MEETING_POINT_RE =
  /^(?:tbd|unknown|n\/a|none|contact\s+operator|contact\s+local\s+operator|meet\s+on\s+location|varying\s+locations|multiple\s+locations|new\s+orleans(?:,\s*(?:la|louisiana)(?:,\s*usa)?)?|nassau(?:,\s*(?:bahamas|new\s+providence))?|st\.?\s*thomas(?:,\s*(?:usvi|u\.?s\.?\s*virgin\s+islands))?|charlotte\s+amalie(?:,\s*(?:st\.?\s*thomas|usvi))?|juneau(?:,\s*(?:ak|alaska))?|ketchikan(?:,\s*(?:ak|alaska))?|skagway(?:,\s*(?:ak|alaska))?|sitka(?:,\s*(?:ak|alaska))?|seward(?:,\s*(?:ak|alaska))?|denali(?:,\s*(?:ak|alaska))?|cozumel(?:,\s*(?:mexico|quintana\s+roo))?|roatan(?:,\s*honduras)?|grand\s+cayman(?:,\s*cayman\s+islands)?|george\s+town(?:,\s*grand\s+cayman)?|miami(?:,\s*(?:fl|florida))?|las\s+vegas(?:,\s*(?:nv|nevada))?|denver(?:,\s*(?:co|colorado))?)$/i;

export function isGenericOrPlaceholderMeetingPointText(
  value: string | null | undefined,
): boolean {
  if (!value || typeof value !== "string") return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return GENERIC_CITY_OR_PLACEHOLDER_MEETING_POINT_RE.test(trimmed);
}

export function mapDestinationToResearchCluster(
  destinationSlug: string,
  portSlug?: string | null,
): ResearchClusterId | string {
  const slug = (portSlug || destinationSlug || "").trim().toLowerCase();
  switch (slug) {
    case "new-orleans":
      return "new-orleans-swamp";
    case "st-thomas":
      return "usvi-st-thomas";
    case "nassau":
      return "bahamas-nassau";
    case "cozumel":
      return "mexico-cozumel";
    case "roatan":
      return "honduras-roatan";
    case "grand-cayman":
      return "cayman-grand-cayman";
    case "juneau":
      return "alaska-juneau";
    case "ketchikan":
      return "alaska-ketchikan";
    default:
      return `catalog-${slug || "general"}`;
  }
}

function hasValidCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

function normalizeSingleProductOptionPickup(
  option: TourProductOptionRecord,
): TourProductOptionRecord {
  const rawMeetingName = option.meetingPointName?.trim() || null;
  const cleanedMeetingName =
    rawMeetingName && !isGenericOrPlaceholderMeetingPointText(rawMeetingName)
      ? rawMeetingName
      : null;

  const coordsValid =
    cleanedMeetingName !== null &&
    hasValidCoordinates(option.meetingPointLat, option.meetingPointLng);

  const normalizedFulfillment: PickupFulfillmentType =
    option.pickupFulfillmentType &&
    [
      "pier_pickup",
      "hotel_pickup",
      "downtown_shuttle_departure",
      "self_drive",
      "walkable_from_pier",
      "unknown",
    ].includes(option.pickupFulfillmentType)
      ? option.pickupFulfillmentType
      : option.includesPickup === true
        ? "hotel_pickup"
        : option.includesPickup === false
          ? "self_drive"
          : "unknown";

  const hasVerifiedTransferEvidence =
    typeof option.transferBeforeMinutes === "number" &&
    Number.isFinite(option.transferBeforeMinutes) &&
    Boolean(option.transferEvidenceSource) &&
    Boolean(option.applicableBerthOrMeetingPoint);

  let normalizedTransferSource: TransferTimeSource =
    option.transferTimeSource || "unknown";
  if (
    (normalizedTransferSource === "verified_pier_pickup" ||
      normalizedTransferSource === "verified_meeting_point") &&
    !hasVerifiedTransferEvidence
  ) {
    normalizedTransferSource =
      option.planningEstimateTransferMinutes !== null &&
      option.planningEstimateTransferMinutes !== undefined
        ? "planning_estimate"
        : "unknown";
  }

  return {
    ...option,
    includesPickup:
      typeof option.includesPickup === "boolean" ? option.includesPickup : null,
    pickupFulfillmentType: normalizedFulfillment,
    meetingPointName: cleanedMeetingName,
    meetingPointLat: coordsValid ? option.meetingPointLat! : null,
    meetingPointLng: coordsValid ? option.meetingPointLng! : null,
    transferBeforeMinutes: hasVerifiedTransferEvidence
      ? option.transferBeforeMinutes!
      : null,
    transferAfterMinutes: hasVerifiedTransferEvidence
      ? (option.transferAfterMinutes ?? option.transferBeforeMinutes!)
      : null,
    transferTimeSource: normalizedTransferSource,
  };
}

/**
 * Normalizes provider pickup and meeting-point fields on a catalog tour record,
 * marks missing or unverified facts explicitly as `unknown` / `null`, and returns
 * structured exceptions for the Review Desk.
 */
export function normalizeCatalogTourPickupAndMeeting(
  record: DurableTourRecord,
): {
  normalizedRecord: DurableTourRecord;
  exceptions: CatalogPickupExceptionRecord[];
} {
  const normalizedOptions = Array.isArray(record.productOptions)
    ? record.productOptions.map(normalizeSingleProductOptionPickup)
    : undefined;

  const rawMeetingName = record.meetingPointName?.trim() || null;
  const rawMeetingAddress = record.meetingPointAddress?.trim() || null;

  const meetingNameIsPlaceholder =
    isGenericOrPlaceholderMeetingPointText(rawMeetingName);
  const meetingAddressIsPlaceholder =
    isGenericOrPlaceholderMeetingPointText(rawMeetingAddress);

  const normalizedMeetingName = meetingNameIsPlaceholder ? null : rawMeetingName;
  const normalizedMeetingAddress = meetingAddressIsPlaceholder
    ? null
    : rawMeetingAddress;

  // Coordinates are only valid if not paired with a placeholder/missing meeting point
  // (unless verified pickup locations exist)
  const hasConcreteMeetingIdentity =
    normalizedMeetingName !== null || normalizedMeetingAddress !== null;
  const validCoords =
    hasConcreteMeetingIdentity &&
    hasValidCoordinates(record.meetingPointLat, record.meetingPointLng);

  const normalizedLat = validCoords ? record.meetingPointLat : null;
  const normalizedLng = validCoords ? record.meetingPointLng : null;
  const normalizedPrecision: LocationPrecision = validCoords
    ? record.locationPrecision === "approximate"
      ? "approximate"
      : "exact"
    : "unknown";

  const normalizedHasHotelPickup =
    typeof record.hasHotelPickup === "boolean" ? record.hasHotelPickup : null;

  let normalizedPickupType: DurableTourRecord["pickupType"] =
    record.pickupType ?? "UNKNOWN";
  if (
    !normalizedPickupType ||
    ![
      "HOTEL_PICKUP",
      "MEETING_POINT_ONLY",
      "HOTEL_OR_MEETING_POINT",
      "CRUISE_PIER_PICKUP",
      "DOWNTOWN_SHUTTLE_DEPARTURE",
      "UNKNOWN",
    ].includes(normalizedPickupType)
  ) {
    normalizedPickupType =
      normalizedHasHotelPickup === true
        ? "HOTEL_PICKUP"
        : normalizedHasHotelPickup === false
          ? "MEETING_POINT_ONLY"
          : "UNKNOWN";
  }

  let normalizedFulfillment: PickupFulfillmentType =
    record.pickupFulfillmentType ?? "unknown";
  if (
    !normalizedFulfillment ||
    ![
      "pier_pickup",
      "hotel_pickup",
      "downtown_shuttle_departure",
      "self_drive",
      "walkable_from_pier",
      "unknown",
    ].includes(normalizedFulfillment)
  ) {
    if (normalizedPickupType === "CRUISE_PIER_PICKUP") {
      normalizedFulfillment = "pier_pickup";
    } else if (normalizedPickupType === "DOWNTOWN_SHUTTLE_DEPARTURE") {
      normalizedFulfillment = "downtown_shuttle_departure";
    } else if (normalizedHasHotelPickup === true) {
      normalizedFulfillment = "hotel_pickup";
    } else if (normalizedHasHotelPickup === false) {
      normalizedFulfillment = "self_drive";
    } else {
      normalizedFulfillment = "unknown";
    }
  }

  // Normalize constraints transfer provenance
  const hasVerifiedTourTransfer =
    typeof record.constraints?.cruiseBufferBeforeMinutes === "number" &&
    Number.isFinite(record.constraints.cruiseBufferBeforeMinutes) &&
    Boolean(record.constraints?.transferEvidenceSource) &&
    Boolean(record.constraints?.applicableBerthOrMeetingPoint);

  let normalizedTourTransferSource: TransferTimeSource =
    record.constraints?.transferTimeSource || "unknown";
  if (
    (normalizedTourTransferSource === "verified_pier_pickup" ||
      normalizedTourTransferSource === "verified_meeting_point") &&
    !hasVerifiedTourTransfer
  ) {
    normalizedTourTransferSource =
      record.constraints?.planningEstimateTransferMinutes !== null &&
      record.constraints?.planningEstimateTransferMinutes !== undefined
        ? "planning_estimate"
        : "unknown";
  }

  const pickupKnown =
    normalizedHasHotelPickup !== null &&
    normalizedPickupType !== "UNKNOWN" &&
    normalizedFulfillment !== "unknown";
  const meetingCoordinatesKnown =
    normalizedPrecision === "exact" &&
    normalizedLat !== null &&
    normalizedLng !== null;

  const normalizedRecord: DurableTourRecord = {
    ...record,
    hasHotelPickup: normalizedHasHotelPickup,
    pickupType: normalizedPickupType,
    pickupFulfillmentType: normalizedFulfillment,
    meetingPointName: normalizedMeetingName,
    meetingPointAddress: normalizedMeetingAddress,
    meetingPointLat: normalizedLat,
    meetingPointLng: normalizedLng,
    locationPrecision: normalizedPrecision,
    productOptions: normalizedOptions,
    constraints: {
      ...record.constraints,
      cruiseBufferBeforeMinutes: hasVerifiedTourTransfer
        ? record.constraints.cruiseBufferBeforeMinutes
        : null,
      cruiseBufferAfterMinutes: hasVerifiedTourTransfer
        ? (record.constraints.cruiseBufferAfterMinutes ??
          record.constraints.cruiseBufferBeforeMinutes)
        : null,
      transferTimeSource: normalizedTourTransferSource,
    },
    provenance: {
      ...record.provenance,
      rawFieldsVerified: {
        ...record.provenance.rawFieldsVerified,
        pickupKnown,
        meetingCoordinatesKnown,
      },
    },
  };

  const exceptions: CatalogPickupExceptionRecord[] = [];
  const clusterId = mapDestinationToResearchCluster(
    normalizedRecord.destinationSlug,
    normalizedRecord.portSlug,
  );

  const pushException = (
    exceptionCode: CatalogPickupExceptionCode,
    optionCode: string | null,
    missingFields: string[],
    observedStateSummary: string,
    humanDecisionRequired: string,
  ) => {
    const suffix = optionCode ? `${exceptionCode}:${optionCode}` : exceptionCode;
    const factId = `cat-pickup-exc:${normalizedRecord.providerProductCode}:${suffix}`;
    exceptions.push({
      exceptionId: factId,
      factId,
      tourId: normalizedRecord.tourId,
      provider: normalizedRecord.primaryProvider,
      providerProductCode: normalizedRecord.providerProductCode,
      destinationSlug: normalizedRecord.destinationSlug,
      portSlug: normalizedRecord.portSlug,
      clusterId,
      exceptionCode,
      optionCode,
      constraintType: "pickup_meeting",
      missingFields,
      observedStateSummary,
      humanDecisionRequired,
      sourceUrl: normalizedRecord.bookingUrl,
      reviewDeskStatus: "needs confirmation",
    });
  };

  // 1. Missing pickup mode
  if (!pickupKnown) {
    pushException(
      "missing_pickup_mode",
      null,
      ["hasHotelPickup", "pickupType", "pickupFulfillmentType"],
      `Provider ${normalizedRecord.primaryProvider} product ${normalizedRecord.providerProductCode} ("${normalizedRecord.title}") does not specify whether hotel/pier pickup is included or meet-on-location is required (pickupType=${normalizedPickupType}, pickupFulfillmentType=${normalizedFulfillment}).`,
      `Confirm with operator or official listing whether ${normalizedRecord.providerProductCode} includes hotel/pier pickup or requires independent arrival at a meeting point.`,
    );
  }

  // 2. Missing meeting point identity when meet-on-location / self-drive / shuttle hub is used
  const requiresMeetingPoint =
    normalizedPickupType === "MEETING_POINT_ONLY" ||
    normalizedPickupType === "HOTEL_OR_MEETING_POINT" ||
    normalizedPickupType === "DOWNTOWN_SHUTTLE_DEPARTURE" ||
    normalizedFulfillment === "self_drive" ||
    normalizedFulfillment === "downtown_shuttle_departure";

  if (requiresMeetingPoint && normalizedMeetingName === null) {
    pushException(
      "missing_meeting_point_identity",
      null,
      ["meetingPointName", "meetingPointAddress"],
      `Product ${normalizedRecord.providerProductCode} ("${normalizedRecord.title}") uses ${normalizedFulfillment} (${normalizedPickupType}) but has no verified meeting point name or street/dock address.`,
      `Verify the exact check-in dock, curb, or meeting address for ${normalizedRecord.providerProductCode} before removing the unknown meeting-point status.`,
    );
  }

  // 3. Missing meeting point coordinates
  if (
    (requiresMeetingPoint || normalizedMeetingName !== null) &&
    !meetingCoordinatesKnown
  ) {
    pushException(
      "missing_meeting_point_coordinates",
      null,
      ["meetingPointLat", "meetingPointLng", "locationPrecision"],
      `Product ${normalizedRecord.providerProductCode} ("${normalizedRecord.title}") meeting point "${normalizedMeetingName ?? "unknown"}" lacks exact coordinates (locationPrecision=${normalizedPrecision}).`,
      `Confirm exact coordinates and landmark match for ${normalizedRecord.providerProductCode} (${normalizedMeetingName ?? "unnamed meeting point"}).`,
    );
  }

  // 4. Cruise port tour lacking verified berth transfer timing
  if (
    normalizedRecord.portSlug !== null &&
    normalizedTourTransferSource !== "verified_pier_pickup" &&
    normalizedTourTransferSource !== "verified_meeting_point"
  ) {
    pushException(
      "unverified_cruise_berth_transfer",
      null,
      [
        "constraints.cruiseBufferBeforeMinutes",
        "constraints.transferEvidenceSource",
        "constraints.applicableBerthOrMeetingPoint",
      ],
      `Cruise-port tour ${normalizedRecord.providerProductCode} in ${normalizedRecord.portSlug} has transferTimeSource="${normalizedTourTransferSource}" without verified berth-to-meeting transfer minutes.`,
      `Confirm cruise berth pickup or round-trip transfer minutes between the ${normalizedRecord.portSlug} cruise pier and "${normalizedMeetingName ?? "tour meeting point"}" for ${normalizedRecord.providerProductCode}.`,
    );
  }

  // 5. Option-level pickup ambiguity
  if (Array.isArray(normalizedOptions) && normalizedOptions.length > 0) {
    for (const opt of normalizedOptions) {
      if (
        opt.pickupFulfillmentType === "unknown" ||
        (opt.pickupFulfillmentType === "self_drive" &&
          opt.meetingPointName === null &&
          normalizedMeetingName === null)
      ) {
        pushException(
          "option_pickup_unknown_or_ambiguous",
          opt.optionCode,
          ["productOptions.pickupFulfillmentType", "productOptions.meetingPointName"],
          `Option ${opt.optionCode} ("${opt.title}") on ${normalizedRecord.providerProductCode} has pickupFulfillmentType="${opt.pickupFulfillmentType}" and meetingPointName=${opt.meetingPointName ?? "null"}.`,
          `Confirm option-specific pickup or meeting point rules for ${normalizedRecord.providerProductCode} option ${opt.optionCode}.`,
        );
      }
    }
  }

  return { normalizedRecord, exceptions };
}

export function normalizeCatalogBatchPickupAndMeeting(
  records: DurableTourRecord[],
): {
  normalizedRecords: DurableTourRecord[];
  exceptions: CatalogPickupExceptionRecord[];
  summary: {
    totalRecordsEvaluated: number;
    fullyVerifiedPickupAndMeetingCount: number;
    recordsWithUnknownPickupOrMeetingCount: number;
    totalExceptionsCount: number;
    byExceptionCode: Record<CatalogPickupExceptionCode, number>;
  };
} {
  const normalizedRecords: DurableTourRecord[] = [];
  const exceptions: CatalogPickupExceptionRecord[] = [];
  const byExceptionCode: Record<CatalogPickupExceptionCode, number> = {
    missing_pickup_mode: 0,
    missing_meeting_point_identity: 0,
    missing_meeting_point_coordinates: 0,
    unverified_cruise_berth_transfer: 0,
    option_pickup_unknown_or_ambiguous: 0,
  };
  let fullyVerifiedCount = 0;
  let recordsWithUnknownCount = 0;

  for (const rec of records) {
    const { normalizedRecord, exceptions: recExceptions } =
      normalizeCatalogTourPickupAndMeeting(rec);
    normalizedRecords.push(normalizedRecord);
    if (recExceptions.length === 0) {
      fullyVerifiedCount += 1;
    } else {
      recordsWithUnknownCount += 1;
      for (const exc of recExceptions) {
        exceptions.push(exc);
        byExceptionCode[exc.exceptionCode] =
          (byExceptionCode[exc.exceptionCode] || 0) + 1;
      }
    }
  }

  return {
    normalizedRecords,
    exceptions,
    summary: {
      totalRecordsEvaluated: records.length,
      fullyVerifiedPickupAndMeetingCount: fullyVerifiedCount,
      recordsWithUnknownPickupOrMeetingCount: recordsWithUnknownCount,
      totalExceptionsCount: exceptions.length,
      byExceptionCode,
    },
  };
}

export function convertPickupExceptionToReviewDeskRow(
  exc: CatalogPickupExceptionRecord,
  evaluatedAtIso: string = new Date().toISOString(),
): RawResearchDeskFactRow {
  const sourceHash = crypto
    .createHash("sha256")
    .update(`${exc.factId}:${exc.observedStateSummary}`)
    .digest("hex");

  return {
    id: exc.factId,
    fact_id: exc.factId,
    product_id: exc.providerProductCode,
    cluster: exc.clusterId,
    constraint_type: "pickup_meeting",
    claim_summary: exc.observedStateSummary,
    fact_value: `UNKNOWN (${exc.missingFields.join(", ")}) — ${exc.humanDecisionRequired}`,
    status: "needs confirmation",
    active: 1,
    revision: 1,
    source_url: exc.sourceUrl,
    source_hash: sourceHash,
    current_source_hash: sourceHash,
    healthy: 1,
    verified_on: null,
    verified_by: null,
    review_due_on: evaluatedAtIso.slice(0, 10),
  };
}

/**
 * Queues normalized catalog pickup and meeting-point exceptions into the existing
 * DCC Research Review Desk (`synchronizeReviewDeskToDurableStore`) with
 * `status: "needs confirmation"`, `verified_on: null`, `verified_by: null`.
 */
export async function queueCatalogPickupExceptionsToReviewDesk(
  exceptions: CatalogPickupExceptionRecord[],
  options?: { maxRowsToQueue?: number },
): Promise<{
  queuedCount: number;
  persistedToDurableStore: boolean;
  reviewDeskCandidateRows: RawResearchDeskFactRow[];
}> {
  const limit = options?.maxRowsToQueue ?? 250;
  const slice = exceptions.slice(0, limit);
  const nowIso = new Date().toISOString();
  const rows = slice.map((exc) =>
    convertPickupExceptionToReviewDeskRow(exc, nowIso),
  );

  if (rows.length === 0) {
    return {
      queuedCount: 0,
      persistedToDurableStore: false,
      reviewDeskCandidateRows: [],
    };
  }

  const syncResult = await synchronizeReviewDeskToDurableStore({
    action: "upsert_facts",
    sync_origin: "catalog_pickup_normalizer_exception_queue",
    candidates: rows,
  });

  return {
    queuedCount: rows.length,
    persistedToDurableStore: syncResult.persisted,
    reviewDeskCandidateRows: rows,
  };
}
