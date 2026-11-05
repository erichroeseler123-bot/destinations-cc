import {
  getGoSnoRouteSnapshotDisplayPricing,
  type ActiveGoSnoSnapshotState,
} from "./gosnoRouteFeedSnapshot";
import type { CorridorId } from "./contextModel";
import {
  issueOpaqueClickAttribution,
  type HandoffTripDetails,
  type OpaqueClickAttributionRecord,
} from "../commerce/opaqueAttributionLedger";

export interface SharedGoSnoHandoffInput {
  corridorId?: CorridorId;
  origin?: string | null;
  destination?: string | null;
  destinationSlug?: string | null;
  direction?: "OUTBOUND" | "RETURN" | "ROUND_TRIP" | null;
  tripType?: "ONE_WAY" | "ROUND_TRIP" | null;
  routeId?: string | null;
  offerId?: string | null;
  returnRouteId?: string | null;
  travelDate?: string | null;
  pickupTime?: string | null;
  returnDate?: string | null;
  returnPickupTime?: string | null;
  passengerCount?: number | null;
  standardBagCount?: number | null;
  skiOrOversizeBagCount?: number | null;
  rawLuggageSummary?: string | null;
  vehicleClass: "suv" | "van";
  originatingPage?: string | null;
  sourcePage?: string | null;
  handoffId?: string | null;
  explicitPartnerUrl?: string | null;
  incomingSearchParams?: URLSearchParams | null;
  useLegacyHandoffDccPath?: boolean;
  snapshotState?: ActiveGoSnoSnapshotState;
}

export interface SharedGoSnoHandoffBuildResult {
  targetUrl: string;
  tripDetails: HandoffTripDetails;
  effectiveDirection: "OUTBOUND" | "RETURN" | "ROUND_TRIP";
  effectiveTripType: "ONE_WAY" | "ROUND_TRIP";
  effectiveOrigin: string;
  effectiveDestination: string;
  effectiveRouteId: string | null;
  effectiveOfferId: string | null;
  effectiveReturnRouteId: string | null;
  productCode: string;
  isSnapshotExpired: boolean;
}

export function buildSharedGoSnoHandoffUrlAndDetails(
  input: SharedGoSnoHandoffInput,
): SharedGoSnoHandoffBuildResult {
  const isRoundTrip =
    input.direction === "ROUND_TRIP" || input.tripType === "ROUND_TRIP";
  const lookupDirection: "OUTBOUND" | "RETURN" =
    input.direction === "RETURN" ? "RETURN" : "OUTBOUND";

  const corridorId: CorridorId =
    input.corridorId ||
    (input.destinationSlug === "breckenridge" ||
    input.destination?.toLowerCase() === "breckenridge"
      ? "corridor:denver-breckenridge-i70"
      : "corridor:denver-vail-i70");

  const pricing = getGoSnoRouteSnapshotDisplayPricing({
    routeId: input.routeId || undefined,
    origin: input.origin || undefined,
    destination: input.destination || undefined,
    direction: lookupDirection,
    corridorId,
    snapshotState: input.snapshotState,
  });

  const isSnapshotExpired = Boolean(pricing.snapshotState.isExpired);
  const isSuv = input.vehicleClass === "suv";
  const matchedOneWayOffer = isSuv ? pricing.suvFare : pricing.vanFare;
  const matchedRoundTripOffer = isSuv
    ? pricing.roundTripSuvFare
    : pricing.roundTripVanFare;

  const effectiveDirection: "OUTBOUND" | "RETURN" | "ROUND_TRIP" = isRoundTrip
    ? "ROUND_TRIP"
    : matchedOneWayOffer.direction === "RETURN" || input.direction === "RETURN"
      ? "RETURN"
      : "OUTBOUND";
  const effectiveTripType: "ONE_WAY" | "ROUND_TRIP" = isRoundTrip
    ? "ROUND_TRIP"
    : "ONE_WAY";

  const effectiveOrigin =
    matchedOneWayOffer.origin || input.origin?.trim() || "DEN";
  const effectiveDestination =
    matchedOneWayOffer.destination ||
    input.destination?.trim() ||
    (corridorId === "corridor:denver-breckenridge-i70"
      ? "Breckenridge"
      : "Vail");

  const effectiveRouteId =
    (isRoundTrip && matchedRoundTripOffer.routeId) ||
    matchedOneWayOffer.routeId ||
    input.routeId?.trim() ||
    null;
  const effectiveOfferId =
    (isRoundTrip && matchedRoundTripOffer.offerId) ||
    matchedOneWayOffer.offerId ||
    input.offerId?.trim() ||
    null;
  const effectiveReturnRouteId = isRoundTrip
    ? matchedRoundTripOffer.returnRouteId ||
      input.returnRouteId?.trim() ||
      (effectiveDestination
        ? `${effectiveDestination.toUpperCase().replace(/\s+/g, "-")}-${effectiveOrigin}`
        : null)
    : null;

  const fallbackGoSnoBase =
    corridorId === "corridor:denver-breckenridge-i70"
      ? "https://gosno.co/breckenridge"
      : "https://gosno.co/vail";

  const canonicalOrQuoteBase = isSnapshotExpired
    ? (isRoundTrip
        ? matchedRoundTripOffer.quoteUrl
        : matchedOneWayOffer.quoteUrl) || "https://gosno.co/request-quote"
    : (isRoundTrip
        ? matchedRoundTripOffer.canonicalBookingUrl
        : matchedOneWayOffer.canonicalBookingUrl) || fallbackGoSnoBase;

  const hasCustomRouteOrDest = Boolean(
    input.routeId ||
      input.offerId ||
      isRoundTrip ||
      input.direction === "RETURN" ||
      (input.destination &&
        input.destination !== "Vail" &&
        input.destination !== "Breckenridge"),
  );

  const explicitPartnerUrl = input.explicitPartnerUrl?.trim() || null;

  const baseUrlString = input.useLegacyHandoffDccPath
    ? "https://gosno.co/handoff/dcc"
    : !isSnapshotExpired &&
        !hasCustomRouteOrDest &&
        explicitPartnerUrl &&
        explicitPartnerUrl.includes("gosno.co")
      ? explicitPartnerUrl
      : canonicalOrQuoteBase;

  const parsed = new URL(baseUrlString);

  // Carry over any non-structural query parameters from explicitPartnerUrl or incomingSearchParams
  // so sanitizeOutboundPartnerUrlWithOpaqueClickId filters and logs any PII/leak parameters consistently.
  if (explicitPartnerUrl) {
    try {
      const explicitParsed = new URL(explicitPartnerUrl);
      for (const [k, v] of explicitParsed.searchParams.entries()) {
        if (!parsed.searchParams.has(k)) {
          parsed.searchParams.set(k, v);
        }
      }
    } catch {
      // ignore malformed explicit URL
    }
  }

  if (input.incomingSearchParams) {
    const structuralSkip = new Set([
      "destination",
      "airport",
      "origin",
      "direction",
      "triptype",
      "trip_type",
      "routeid",
      "route_id",
      "offerid",
      "offer_id",
      "date",
      "outbounddate",
      "pickuptime",
      "pickup_time",
      "passengers",
      "passengercount",
      "party_size",
      "standardbags",
      "skibags",
      "luggage",
      "vehicleclass",
      "vehicle_type",
      "vehicletype",
      "returndate",
      "return_date",
      "returnpickuptime",
      "return_pickup_time",
      "returnrouteid",
      "return_route_id",
      "originatingpage",
      "sourcepage",
      "source_page",
      "mode",
      "prefer_private",
      "operator_id",
      "operatorid",
      "istest",
      "is_test",
    ]);
    for (const [k, v] of input.incomingSearchParams.entries()) {
      if (!structuralSkip.has(k.toLowerCase()) && !parsed.searchParams.has(k)) {
        parsed.searchParams.set(k, v);
      }
    }
  }

  parsed.searchParams.set("origin", effectiveOrigin);
  if (input.useLegacyHandoffDccPath && input.destinationSlug) {
    parsed.searchParams.set("destination", input.destinationSlug);
    parsed.searchParams.set("airport", effectiveOrigin);
  } else {
    parsed.searchParams.set("destination", effectiveDestination);
    if (input.origin) {
      parsed.searchParams.set("airport", effectiveOrigin);
    }
  }

  parsed.searchParams.set("direction", effectiveDirection);
  parsed.searchParams.set("tripType", isRoundTrip ? "round_trip" : "one_way");

  if (effectiveRouteId) {
    parsed.searchParams.set("routeId", effectiveRouteId);
  }
  if (effectiveOfferId) {
    parsed.searchParams.set("offerId", effectiveOfferId);
  }
  if (input.travelDate && /^\d{4}-\d{2}-\d{2}$/.test(input.travelDate)) {
    parsed.searchParams.set("date", input.travelDate);
  }
  if (input.pickupTime) {
    parsed.searchParams.set("pickupTime", input.pickupTime);
  }

  const pax =
    typeof input.passengerCount === "number" &&
    Number.isFinite(input.passengerCount) &&
    input.passengerCount > 0
      ? input.passengerCount
      : null;

  if (pax !== null) {
    parsed.searchParams.set("passengers", String(pax));
    parsed.searchParams.set("passengerCount", String(pax));
    parsed.searchParams.set("party_size", String(pax));
    if (pax >= 7) {
      parsed.searchParams.set(
        "fit_note",
        "subject_to_luggage_and_ski_gear_fit_and_availability",
      );
    }
  }

  const stdBags =
    typeof input.standardBagCount === "number" &&
    Number.isFinite(input.standardBagCount)
      ? input.standardBagCount
      : null;
  const skiBags =
    typeof input.skiOrOversizeBagCount === "number" &&
    Number.isFinite(input.skiOrOversizeBagCount)
      ? input.skiOrOversizeBagCount
      : null;

  if (stdBags !== null) {
    parsed.searchParams.set("standardBags", String(stdBags));
  }
  if (skiBags !== null) {
    parsed.searchParams.set("skiBags", String(skiBags));
  }
  if (input.rawLuggageSummary) {
    parsed.searchParams.set("luggage", input.rawLuggageSummary);
  } else if (stdBags !== null || skiBags !== null) {
    parsed.searchParams.set("luggage", String((stdBags ?? 0) + (skiBags ?? 0)));
  }

  parsed.searchParams.set("vehicleClass", input.vehicleClass);
  parsed.searchParams.set("vehicle_type", input.vehicleClass);

  if (input.returnDate) {
    parsed.searchParams.set("returnDate", input.returnDate);
  }
  if (input.returnPickupTime) {
    parsed.searchParams.set("returnPickupTime", input.returnPickupTime);
  }
  if (effectiveReturnRouteId) {
    parsed.searchParams.set("returnRouteId", effectiveReturnRouteId);
  }

  const originatingPage =
    input.originatingPage?.trim() ||
    input.sourcePage?.trim() ||
    "/transportation/colorado";
  const sourcePage = input.sourcePage?.trim() || originatingPage;

  parsed.searchParams.set("originatingPage", originatingPage);
  parsed.searchParams.set("sourcePage", originatingPage);
  parsed.searchParams.set("source_page", sourcePage);

  if (input.handoffId) {
    parsed.searchParams.set("dcc_handoff_id", input.handoffId);
  }

  if (isSnapshotExpired) {
    parsed.searchParams.delete("publishedPrice");
    if (input.travelDate && /^\d{4}-\d{2}-\d{2}$/.test(input.travelDate)) {
      parsed.searchParams.set("outboundDate", input.travelDate);
    }
    parsed.searchParams.set("vehicleType", input.vehicleClass);
  }

  const tripDetails: HandoffTripDetails = {
    direction: effectiveDirection,
    tripType: effectiveTripType,
    origin: effectiveOrigin,
    destination: effectiveDestination,
    routeId: effectiveRouteId,
    offerId: effectiveOfferId,
    travelDate: input.travelDate || null,
    pickupTime: input.pickupTime || null,
    passengerCount: pax,
    standardBagCount: stdBags,
    skiOrOversizeBagCount: skiBags,
    returnDate: input.returnDate || null,
    returnPickupTime: input.returnPickupTime || null,
    returnRouteId: effectiveReturnRouteId,
    originatingPage,
  };

  const productCode =
    effectiveOfferId ||
    effectiveRouteId ||
    (input.destinationSlug ? `gosno-${input.destinationSlug}` : "op:gosno");

  return {
    targetUrl: parsed.toString(),
    tripDetails,
    effectiveDirection,
    effectiveTripType,
    effectiveOrigin,
    effectiveDestination,
    effectiveRouteId,
    effectiveOfferId,
    effectiveReturnRouteId,
    productCode,
    isSnapshotExpired,
  };
}

export function issueSharedGoSnoHandoffAttribution(params: {
  handoffBuild: SharedGoSnoHandoffBuildResult;
  handoffId?: string | null;
  decisionReceiptId: string;
  recommendedOperatorId: string;
  recommendedOperatorName?: string | null;
  recommendedVehicleClassId?: string | null;
  evidenceVersion: string;
  applicabilityModelVersion?: string | null;
  applicabilityOutcomeHash?: string | null;
  originatingSite?: string | null;
  originatingPage?: string | null;
  isTest?: boolean;
  productCodeOverride?: string | null;
}): OpaqueClickAttributionRecord {
  return issueOpaqueClickAttribution({
    handoffId: params.handoffId || null,
    decisionReceiptId: params.decisionReceiptId,
    recommendedOperatorId: params.recommendedOperatorId,
    recommendedOperatorName:
      params.recommendedOperatorName ||
      `GoSno Mountain Transfer (${params.handoffBuild.effectiveDestination})`,
    recommendedVehicleClassId: params.recommendedVehicleClassId || null,
    evidenceVersion: params.evidenceVersion,
    applicabilityModelVersion: params.applicabilityModelVersion || null,
    applicabilityOutcomeHash: params.applicabilityOutcomeHash || null,
    originatingSite: params.originatingSite || "destinationcommandcenter.com",
    originatingPage:
      params.originatingPage ||
      params.handoffBuild.tripDetails.originatingPage ||
      "/transportation/colorado",
    tripDetails: params.handoffBuild.tripDetails,
    isTest: params.isTest,
    provider: "direct",
    productCode:
      params.productCodeOverride || params.handoffBuild.productCode,
    productDestinationUrl: params.handoffBuild.targetUrl,
  });
}
