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
    source_excerpt: exc.observedStateSummary,
    value: `UNKNOWN (${exc.missingFields.join(", ")})`,
    conditions: exc.humanDecisionRequired,
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

export function deduplicatePickupExceptionsForReviewDesk(
  exceptions: CatalogPickupExceptionRecord[],
): CatalogPickupExceptionRecord[] {
  const byProductAndCode = new Map<
    string,
    {
      base: CatalogPickupExceptionRecord;
      optionCodes: string[];
    }
  >();
  const productCodesWithPrimaryPickupGap = new Set<string>();
  for (const exc of exceptions) {
    if (
      exc.exceptionCode === "missing_pickup_mode" ||
      exc.exceptionCode === "missing_meeting_point_identity"
    ) {
      productCodesWithPrimaryPickupGap.add(exc.providerProductCode);
    }
  }

  for (const exc of exceptions) {
    // If the entire tour is already flagged for missing_pickup_mode or missing_meeting_point_identity,
    // suppress redundant per-option unknown flags unless the tour-level mode is already known.
    if (
      exc.exceptionCode === "option_pickup_unknown_or_ambiguous" &&
      productCodesWithPrimaryPickupGap.has(exc.providerProductCode)
    ) {
      continue;
    }

    const key = `${exc.providerProductCode}::${exc.exceptionCode}`;
    const existing = byProductAndCode.get(key);
    if (!existing) {
      const factId = `cat-pickup-exc:${exc.providerProductCode}:${exc.exceptionCode}`;
      byProductAndCode.set(key, {
        base: {
          ...exc,
          exceptionId: factId,
          factId,
        },
        optionCodes: exc.optionCode ? [exc.optionCode] : [],
      });
    } else if (
      exc.optionCode &&
      !existing.optionCodes.includes(exc.optionCode)
    ) {
      existing.optionCodes.push(exc.optionCode);
    }
  }

  const deduplicated: CatalogPickupExceptionRecord[] = [];
  for (const { base, optionCodes } of byProductAndCode.values()) {
    if (optionCodes.length > 1) {
      deduplicated.push({
        ...base,
        optionCode: optionCodes.join(","),
        observedStateSummary: `${base.observedStateSummary} (Deduplicated across ${optionCodes.length} options: ${optionCodes.join(", ")})`,
        humanDecisionRequired: `Confirm option-specific pickup or meeting point rules for ${base.providerProductCode} across options: ${optionCodes.join(", ")}.`,
      });
    } else {
      deduplicated.push(base);
    }
  }

  return deduplicated;
}

export function extractViatorLocationRefsFromProductDetail(
  detail: Record<string, any> | null | undefined,
): string[] {
  if (!detail || typeof detail !== "object") return [];
  const refs = new Set<string>();
  const addRef = (candidate: unknown) => {
    if (typeof candidate === "string" && candidate.trim().startsWith("LOC-")) {
      refs.add(candidate.trim());
    }
  };

  const scanLogistics = (logistics: Record<string, any> | null | undefined) => {
    if (!logistics || typeof logistics !== "object") return;
    if (Array.isArray(logistics.start)) {
      for (const s of logistics.start) {
        addRef(s?.location?.ref);
      }
    }
    if (Array.isArray(logistics.end)) {
      for (const e of logistics.end) {
        addRef(e?.location?.ref);
      }
    }
    const tp = logistics.travelerPickup;
    if (tp && Array.isArray(tp.locations)) {
      for (const loc of tp.locations) {
        addRef(loc?.location?.ref);
      }
    }
  };

  scanLogistics(detail.logistics);
  if (Array.isArray(detail.productOptions)) {
    for (const opt of detail.productOptions) {
      scanLogistics(opt?.logistics);
    }
  }
  return Array.from(refs);
}

function formatResolvedViatorAddress(
  loc: Record<string, any> | null | undefined,
): string | null {
  if (!loc || typeof loc !== "object") return null;
  const addr = loc.address;
  if (!addr || typeof addr !== "object") return null;
  const parts = [
    addr.street,
    addr.administrativeArea || addr.city,
    addr.state,
    addr.postcode,
  ]
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .map((p) => p.trim());
  if (parts.length === 0) return null;
  const joined = parts.join(", ");
  return isGenericOrPlaceholderMeetingPointText(joined) ? null : joined;
}

/**
 * Enriches a catalog tour record with live Viator `/products/{code}` option-level logistics
 * and resolved `/locations/bulk` references (`LOC-...`).
 * Keeps any missing or Google-reference-only coordinates explicitly `unknown` (`null`).
 */
export function enrichTourRecordFromViatorProductDetailAndLocations(
  record: DurableTourRecord,
  detail: Record<string, any>,
  locationsByRef: Map<string, Record<string, any>>,
): DurableTourRecord {
  const logistics = detail?.logistics ?? {};
  const travelerPickup = logistics?.travelerPickup ?? {};
  const pickupOptionType = String(
    travelerPickup?.pickupOptionType || "",
  ).toUpperCase();

  const rawPickupLocations = Array.isArray(travelerPickup?.locations)
    ? travelerPickup.locations
    : [];
  const hasPortPickupLocation = rawPickupLocations.some(
    (l: any) => String(l?.pickupType || "").toUpperCase() === "PORT",
  );
  const hasHotelPickupLocation = rawPickupLocations.some(
    (l: any) => String(l?.pickupType || "").toUpperCase() === "HOTEL",
  );
  const allowCustomPickup = Boolean(travelerPickup?.allowCustomTravelerPickup);

  // Resolve primary start location from logistics.start
  const startEntries = Array.isArray(logistics?.start) ? logistics.start : [];
  let resolvedStartName: string | null = record.meetingPointName;
  let resolvedStartAddress: string | null = record.meetingPointAddress;
  let resolvedStartLat: number | null = record.meetingPointLat;
  let resolvedStartLng: number | null = record.meetingPointLng;

  for (const startEntry of startEntries) {
    const ref =
      typeof startEntry?.location?.ref === "string"
        ? startEntry.location.ref.trim()
        : "";
    const locObj = ref ? locationsByRef.get(ref) : null;
    const candidateName =
      typeof locObj?.name === "string" &&
      !isGenericOrPlaceholderMeetingPointText(locObj.name)
        ? locObj.name.trim()
        : null;
    const candidateAddr = formatResolvedViatorAddress(locObj);
    const descText =
      typeof startEntry?.description === "string" &&
      startEntry.description.trim().length > 0 &&
      !isGenericOrPlaceholderMeetingPointText(startEntry.description)
        ? startEntry.description.trim().slice(0, 180)
        : null;

    if (candidateName && !resolvedStartName) {
      resolvedStartName = candidateName;
    }
    if (candidateAddr && !resolvedStartAddress) {
      resolvedStartAddress = candidateAddr;
    }
    if (!resolvedStartName && descText) {
      resolvedStartName = descText;
    }
    const lat = locObj?.center?.latitude;
    const lng = locObj?.center?.longitude;
    if (hasValidCoordinates(lat, lng)) {
      resolvedStartLat = lat;
      resolvedStartLng = lng;
    }
    if (resolvedStartName && hasValidCoordinates(resolvedStartLat, resolvedStartLng)) {
      break;
    }
  }

  // Also resolve pickup locations list
  const enrichedPickupLocations = [...(record.pickupLocations || [])];
  for (const pEntry of rawPickupLocations.slice(0, 40)) {
    const ref =
      typeof pEntry?.location?.ref === "string"
        ? pEntry.location.ref.trim()
        : "";
    if (!ref) continue;
    const locObj = locationsByRef.get(ref);
    const locName =
      typeof locObj?.name === "string" &&
      !isGenericOrPlaceholderMeetingPointText(locObj.name)
        ? locObj.name.trim()
        : null;
    if (!locName) continue;
    const lat = locObj?.center?.latitude;
    const lng = locObj?.center?.longitude;
    const addr = formatResolvedViatorAddress(locObj);
    if (!enrichedPickupLocations.some((existing) => existing.ref === ref)) {
      enrichedPickupLocations.push({
        ref,
        name: locName,
        address: addr,
        lat: hasValidCoordinates(lat, lng) ? lat : null,
        lng: hasValidCoordinates(lat, lng) ? lng : null,
        precision: hasValidCoordinates(lat, lng) ? "exact" : "unknown",
        pickupType: String(pEntry?.pickupType || "HOTEL").toUpperCase() as any,
      });
    }
    // If product is PICKUP_EVERYONE and lacks a start meeting point, use the first resolved pickup hub with coordinates as anchor only if no start point exists
    if (
      pickupOptionType === "PICKUP_EVERYONE" &&
      !resolvedStartName &&
      hasValidCoordinates(lat, lng)
    ) {
      resolvedStartName = locName;
      resolvedStartAddress = addr;
      resolvedStartLat = lat;
      resolvedStartLng = lng;
    }
  }

  let resolvedHasHotelPickup = record.hasHotelPickup;
  let resolvedPickupType = record.pickupType;
  let resolvedFulfillment = record.pickupFulfillmentType;

  if (pickupOptionType === "PICKUP_EVERYONE") {
    resolvedHasHotelPickup = true;
    if (hasPortPickupLocation && !hasHotelPickupLocation && record.portSlug) {
      resolvedPickupType = "CRUISE_PIER_PICKUP";
      resolvedFulfillment = "pier_pickup";
    } else {
      resolvedPickupType = "HOTEL_PICKUP";
      resolvedFulfillment = "hotel_pickup";
    }
  } else if (pickupOptionType === "PICKUP_AND_MEET_AT_START_POINT") {
    resolvedHasHotelPickup = true;
    resolvedPickupType = "HOTEL_OR_MEETING_POINT";
    resolvedFulfillment =
      resolvedFulfillment && resolvedFulfillment !== "unknown"
        ? resolvedFulfillment
        : "hotel_pickup";
  } else if (pickupOptionType === "MEET_EVERYONE_AT_START_POINT") {
    if (hasPortPickupLocation && record.portSlug) {
      resolvedHasHotelPickup = false;
      resolvedPickupType = "CRUISE_PIER_PICKUP";
      resolvedFulfillment = "pier_pickup";
    } else {
      resolvedHasHotelPickup = false;
      resolvedPickupType =
        resolvedPickupType === "DOWNTOWN_SHUTTLE_DEPARTURE"
          ? "DOWNTOWN_SHUTTLE_DEPARTURE"
          : "MEETING_POINT_ONLY";
      resolvedFulfillment =
        resolvedFulfillment === "downtown_shuttle_departure" ||
        resolvedFulfillment === "walkable_from_pier"
          ? resolvedFulfillment
          : "self_drive";
    }
  } else if (allowCustomPickup || hasHotelPickupLocation) {
    resolvedHasHotelPickup = true;
    resolvedPickupType =
      startEntries.length > 0 ? "HOTEL_OR_MEETING_POINT" : "HOTEL_PICKUP";
    resolvedFulfillment = "hotel_pickup";
  }

  // Enrich option-level pickup and meeting points from detail.productOptions
  const rawDetailOptions = Array.isArray(detail?.productOptions)
    ? detail.productOptions
    : [];
  const detailOptionByCode = new Map<string, Record<string, any>>();
  for (const dOpt of rawDetailOptions) {
    const code = String(dOpt?.productOptionCode || dOpt?.optionCode || "").trim();
    if (code) detailOptionByCode.set(code, dOpt);
  }

  const existingOptions =
    Array.isArray(record.productOptions) && record.productOptions.length > 0
      ? record.productOptions
      : rawDetailOptions.map((dOpt: any) => ({
          optionCode: String(dOpt?.productOptionCode || "DEFAULT"),
          title: String(dOpt?.title || record.title),
          description:
            typeof dOpt?.description === "string" ? dOpt.description : null,
          includesPickup: null,
          pickupFulfillmentType: "unknown" as PickupFulfillmentType,
          meetingPointName: null,
          meetingPointLat: null,
          meetingPointLng: null,
          durationMinutes: record.durationMinutes,
          fromPriceCents: record.fromPriceCents,
          priceBasis: record.priceBasis || "per_person",
          scheduledStartTimes: [],
        }));

  const enrichedOptions: TourProductOptionRecord[] = existingOptions.map(
    (opt) => {
      const dOpt = detailOptionByCode.get(opt.optionCode);
      const optTitleAndDesc = `${opt.title || ""} ${opt.description || ""} ${dOpt?.title || ""} ${dOpt?.description || ""}`.toLowerCase();

      let optMeetingName = opt.meetingPointName ?? resolvedStartName;
      let optLat = opt.meetingPointLat ?? resolvedStartLat;
      let optLng = opt.meetingPointLng ?? resolvedStartLng;

      const optStartEntries = Array.isArray(dOpt?.logistics?.start)
        ? dOpt.logistics.start
        : [];
      for (const sEntry of optStartEntries) {
        const ref =
          typeof sEntry?.location?.ref === "string"
            ? sEntry.location.ref.trim()
            : "";
        const locObj = ref ? locationsByRef.get(ref) : null;
        if (
          locObj?.name &&
          !isGenericOrPlaceholderMeetingPointText(locObj.name)
        ) {
          optMeetingName = String(locObj.name).trim();
        }
        if (
          locObj &&
          hasValidCoordinates(
            locObj?.center?.latitude,
            locObj?.center?.longitude,
          )
        ) {
          optLat = locObj.center.latitude;
          optLng = locObj.center.longitude;
        }
      }

      let optFulfillment: PickupFulfillmentType =
        opt.pickupFulfillmentType && opt.pickupFulfillmentType !== "unknown"
          ? opt.pickupFulfillmentType
          : "unknown";
      let optIncludesPickup = opt.includesPickup;

      if (optFulfillment === "unknown") {
        if (
          /\b(?:no\s+pickup|without\s+pickup|without\s+transportation|no\s+transportation|self[-\s]?drive|drive\s+yourself|meet\s+at)\b/i.test(
            optTitleAndDesc,
          )
        ) {
          optFulfillment = "self_drive";
          optIncludesPickup = false;
        } else if (
          /\b(?:with\s+(?:hotel\s+)?pickup|hotel\s+pickup|with\s+transportation|includes\s+pickup|pickup\s+included)\b/i.test(
            optTitleAndDesc,
          )
        ) {
          optFulfillment = "hotel_pickup";
          optIncludesPickup = true;
        } else if (
          /\b(?:pier\s+pickup|cruise\s+port\s+pickup|cruise\s+terminal\s+pickup)\b/i.test(
            optTitleAndDesc,
          )
        ) {
          optFulfillment = "pier_pickup";
          optIncludesPickup = true;
        } else if (
          resolvedFulfillment &&
          resolvedFulfillment !== "unknown" &&
          pickupOptionType !== "PICKUP_AND_MEET_AT_START_POINT"
        ) {
          optFulfillment = resolvedFulfillment;
          optIncludesPickup = resolvedHasHotelPickup;
        } else if (
          pickupOptionType === "PICKUP_AND_MEET_AT_START_POINT" &&
          optMeetingName !== null
        ) {
          optFulfillment = "hotel_pickup";
          optIncludesPickup = true;
        }
      }

      return {
        ...opt,
        includesPickup: optIncludesPickup,
        pickupFulfillmentType: optFulfillment,
        meetingPointName: optMeetingName,
        meetingPointLat: hasValidCoordinates(optLat, optLng) ? optLat : null,
        meetingPointLng: hasValidCoordinates(optLat, optLng) ? optLng : null,
      };
    },
  );

  return {
    ...record,
    hasHotelPickup: resolvedHasHotelPickup,
    pickupType: resolvedPickupType,
    pickupFulfillmentType: resolvedFulfillment,
    meetingPointName: resolvedStartName,
    meetingPointAddress: resolvedStartAddress,
    meetingPointLat: hasValidCoordinates(resolvedStartLat, resolvedStartLng)
      ? resolvedStartLat
      : null,
    meetingPointLng: hasValidCoordinates(resolvedStartLat, resolvedStartLng)
      ? resolvedStartLng
      : null,
    locationPrecision:
      resolvedStartName &&
      hasValidCoordinates(resolvedStartLat, resolvedStartLng)
        ? "exact"
        : "unknown",
    pickupLocations: enrichedPickupLocations,
    productOptions: enrichedOptions,
  };
}

/**
 * Queues normalized catalog pickup and meeting-point exceptions into the existing
 * DCC Research Review Desk (`synchronizeReviewDeskToDurableStore`) with
 * `status: "needs confirmation"`, `verified_on: null`, `verified_by: null`.
 * Automatically deduplicates exceptions by `(providerProductCode, exceptionCode)` so only
 * unique cases needing human judgment are sent to the Review Desk.
 */
export async function queueCatalogPickupExceptionsToReviewDesk(
  exceptions: CatalogPickupExceptionRecord[],
  options?: { maxRowsToQueue?: number; deduplicate?: boolean },
): Promise<{
  queuedCount: number;
  deduplicatedFromCount: number;
  persistedToDurableStore: boolean;
  reviewDeskCandidateRows: RawResearchDeskFactRow[];
}> {
  const limit = options?.maxRowsToQueue ?? 250;
  const deduped =
    options?.deduplicate === false
      ? exceptions
      : deduplicatePickupExceptionsForReviewDesk(exceptions);
  const slice = deduped.slice(0, limit);
  const nowIso = new Date().toISOString();
  const rows = slice.map((exc) =>
    convertPickupExceptionToReviewDeskRow(exc, nowIso),
  );

  if (rows.length === 0) {
    return {
      queuedCount: 0,
      deduplicatedFromCount: exceptions.length,
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
    deduplicatedFromCount: exceptions.length,
    persistedToDurableStore: syncResult.persisted,
    reviewDeskCandidateRows: rows,
  };
}
