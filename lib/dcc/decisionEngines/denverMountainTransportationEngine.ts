import { z } from "zod";
import {
  getActiveGoSnoRouteFeedSnapshotState,
  getGoSnoRouteSnapshotDisplayPricing,
  type ActiveGoSnoSnapshotState,
  type GoSnoReconciledServiceOffer,
  type GoSnoRouteFeedOneWayOffer,
  type GoSnoRouteFeedRoundTripOffer,
  type GoSnoVehicleClass,
} from "@/lib/dcc/applicability/gosnoRouteFeedSnapshot";
import { evaluateDecisionEngine } from "@/lib/dcc/decisionEngines/evaluator";
import type {
  BookingDestination,
  CandidateOption,
  ComparisonDimension,
  DecisionEngineDefinition,
  DecisionEvaluateOptions,
  DecisionResult,
  EvidenceClaim,
  HardConstraintRule,
  PreferenceRule,
  QuestionDefinition,
  SourceRecord,
  TimingCalculationResult,
} from "@/lib/dcc/decisionEngines/types";

export type MountainDestinationCorridor =
  | "winter_park"
  | "keystone"
  | "copper"
  | "breckenridge"
  | "vail"
  | "beaver_creek"
  | "steamboat"
  | "aspen"
  | "snowmass"
  | "crested_butte"
  | "big_sky";

export type DenverDepartureHub = "den_airport" | "union_station_downtown";
export type DenverMountainTripDirection = "OUTBOUND" | "RETURN" | "ROUND_TRIP";

export interface DenverMountainTransportationInput {
  departureHub: DenverDepartureHub;
  destinationResort: MountainDestinationCorridor;
  tripDirection: DenverMountainTripDirection;
  travelDate: string | null;
  pickupTime: string | null;
  returnDate: string | null;
  returnPickupTime: string | null;
  travelMonth: number;
  groupSize: number;
  standardBagCount: number;
  skiAndLuggageBagCount: number;
  roofBoxConfirmed: boolean;
  youngestChildAgeYears: number | null;
  needsChildCarSeat: boolean;
  roadWeatherScenario:
    | "clear_dry"
    | "active_snow_code15_traction"
    | "severe_winter_storm_code16";
  mobilityLevel: "standard" | "limited_mobility" | "step_free_wheelchair";
  availableWindowMinutes: number;
  maxTotalGroupBudgetUsd: number | null;
  priorityMode:
    | "door_to_door_private"
    | "group_value_per_person"
    | "lowest_cost_public";
  originatingPage: string;
}

export const DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT: DenverMountainTransportationInput =
  {
    departureHub: "den_airport",
    destinationResort: "breckenridge",
    tripDirection: "OUTBOUND",
    travelDate: null,
    pickupTime: "14:30",
    returnDate: null,
    returnPickupTime: null,
    travelMonth: 1,
    groupSize: 5,
    standardBagCount: 4,
    skiAndLuggageBagCount: 4,
    roofBoxConfirmed: true,
    youngestChildAgeYears: null,
    needsChildCarSeat: false,
    roadWeatherScenario: "active_snow_code15_traction",
    mobilityLevel: "standard",
    availableWindowMinutes: 240,
    maxTotalGroupBudgetUsd: null,
    priorityMode: "door_to_door_private",
    originatingPage: "/transportation/colorado",
  };

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

const LEGACY_CORRIDOR_ALIASES: Record<string, MountainDestinationCorridor> = {
  vail_beaver_creek: "vail",
  keystone_copper: "keystone",
  copper_mountain: "copper",
  steamboat_springs: "steamboat",
};

export const MOUNTAIN_CORRIDOR_ROUTE_ID_MAP: Record<
  MountainDestinationCorridor,
  string
> = {
  winter_park: "DEN-WINTER-PARK",
  keystone: "DEN-KEYSTONE",
  copper: "DEN-COPPER",
  breckenridge: "DEN-BRECKENRIDGE",
  vail: "DEN-VAIL",
  beaver_creek: "DEN-BEAVER-CREEK",
  steamboat: "DEN-STEAMBOAT",
  aspen: "DEN-ASPEN",
  snowmass: "DEN-SNOWMASS",
  crested_butte: "DEN-CRESTED-BUTTE",
  big_sky: "BZN-BIG-SKY",
};

export const MOUNTAIN_CORRIDOR_RETURN_ROUTE_ID_MAP: Record<
  MountainDestinationCorridor,
  string
> = {
  winter_park: "WINTER-PARK-DEN",
  keystone: "KEYSTONE-DEN",
  copper: "COPPER-DEN",
  breckenridge: "BRECKENRIDGE-DEN",
  vail: "VAIL-DEN",
  beaver_creek: "BEAVER-CREEK-DEN",
  steamboat: "STEAMBOAT-DEN",
  aspen: "ASPEN-DEN",
  snowmass: "SNOWMASS-DEN",
  crested_butte: "CRESTED-BUTTE-DEN",
  big_sky: "BIG-SKY-BZN",
};

export interface ReconciledGoSnoEngineVehicleOffer {
  offerId: string;
  routeId: string;
  outboundRouteId: string;
  returnRouteId: string | null;
  tripDirection: DenverMountainTripDirection;
  tripType: "ONE_WAY" | "ROUND_TRIP";
  origin: string;
  destination: string;
  vehicleClass: GoSnoVehicleClass;
  vehicleLabel: string;
  seatingLimit: number | null;
  oneWayAmountUsd: number | null;
  publishedOneWayAmountUsd: number | null;
  roundTripAmountUsd: number | null;
  publishedRoundTripAmountUsd: number | null;
  effectiveTripAmountUsd: number | null;
  currency: string;
  feedStatus: string;
  feedNextStep: string;
  publishedBookingEligible: boolean;
  feedOnlineBookable: boolean;
  effectiveOnlineBookable: boolean;
  rezdyProductCode: string | null;
  outboundRezdyProductCode: string | null;
  returnRezdyProductCode: string | null;
  canonicalBookingUrl: string;
  quoteUrl: string;
  liveAvailabilityEndpoint: string | null;
  checkoutEndpoint: string | null;
  liveAvailabilityRequiresQuery: boolean;
  dccLiveAvailabilityQuoteOnlyForVan: boolean;
  gearPolicy: string;
  luggageNote: string;
  specificHardwareLayoutNote: string;
  specificHardwareVerificationState: string;
  sourceType: "route_feed_one_way" | "reconciled_service";
  notes: string | null;
}

export interface ReconciledGoSnoEngineRouteResolution {
  destinationResort: MountainDestinationCorridor;
  tripDirection: DenverMountainTripDirection;
  routeId: string;
  outboundRouteId: string;
  returnRouteId: string;
  snapshotVersionInfo: {
    snapshotId: string;
    sourceUrl: string;
    feedSpec: string;
    feedVersion: string;
    feedGeneratedAt: string;
    fetchedAt: string;
    expiresAt: string;
    contentHash: string;
    rawPayloadHash: string;
    freshnessStatus: string;
    isExpired: boolean;
    routeCount: number;
    roundTripCount: number;
    reconciledServiceCount: number;
  };
  suv: ReconciledGoSnoEngineVehicleOffer;
  van: ReconciledGoSnoEngineVehicleOffer;
}

const DEFAULT_GEAR_POLICY =
  "Skis, snowboards, boots, and standard luggage are included at no extra charge when they fit safely inside the reserved private vehicle or cargo carrier. Customers must provide accurate passenger, suitcase, ski-bag, snowboard, child-seat, and oversized-item counts so GoSno can confirm vehicle fit.";

const SUV_LUGGAGE_NOTE =
  "Private party up to 6 passengers; cargo capacity depends on ski bags and luggage size.";
const SUV_HARDWARE_NOTE =
  "Specific ski racks, roof cargo boxes, and tire models depend on physical vehicle assignment.";
const VAN_LUGGAGE_NOTE =
  "Private party up to 10 passengers; accommodates group luggage and ski equipment, subject to gear fit.";
const VAN_HARDWARE_NOTE =
  "Van seating rows, interior luggage barrier, and dedicated ski cargo racks depend on physical vehicle assignment.";

export function resolveGoSnoEngineRouteFromFeed(
  destinationResort: MountainDestinationCorridor,
  options?: {
    now?: Date;
    snapshotState?: ActiveGoSnoSnapshotState;
    direction?: DenverMountainTripDirection;
  },
): ReconciledGoSnoEngineRouteResolution {
  const snapshotState =
    options?.snapshotState ??
    getActiveGoSnoRouteFeedSnapshotState(
      options?.now ? { nowMs: options.now.getTime() } : undefined,
    );
  const { snapshot, isExpired, freshnessStatus } = snapshotState;
  const tripDirection: DenverMountainTripDirection =
    options?.direction ?? "OUTBOUND";
  const outboundRouteId = MOUNTAIN_CORRIDOR_ROUTE_ID_MAP[destinationResort];
  const returnRouteId = MOUNTAIN_CORRIDOR_RETURN_ROUTE_ID_MAP[destinationResort];
  const activeOneWayRouteId =
    tripDirection === "RETURN" ? returnRouteId : outboundRouteId;
  const activeRouteId =
    tripDirection === "ROUND_TRIP"
      ? `${outboundRouteId}-ROUND-TRIP`
      : activeOneWayRouteId;

  const buildVehicleOffer = (
    vehicleClass: GoSnoVehicleClass,
  ): ReconciledGoSnoEngineVehicleOffer => {
    const expectedOneWayOfferId = `${activeOneWayRouteId}-${vehicleClass.toUpperCase()}`;
    const routeOffer: GoSnoRouteFeedOneWayOffer | undefined =
      snapshot.feed.routes.find(
        (r) =>
          r.offer_id.toUpperCase() === expectedOneWayOfferId ||
          (r.route_id.toUpperCase() === activeOneWayRouteId &&
            r.vehicle_class === vehicleClass),
      ) ??
      snapshot.feed.routes.find(
        (r) =>
          r.route_id.toUpperCase() === outboundRouteId &&
          r.vehicle_class === vehicleClass,
      );

    if (routeOffer) {
      const roundTripOffer: GoSnoRouteFeedRoundTripOffer | undefined =
        snapshot.feed.round_trips.find(
          (rt) =>
            rt.outbound_route_id.toUpperCase() === outboundRouteId &&
            rt.vehicle_class === vehicleClass,
        );
      const publishedOneWay = routeOffer.pricing.amount_usd;
      const publishedRt = roundTripOffer?.pricing.total_amount_usd ?? null;
      const isRoundTrip = tripDirection === "ROUND_TRIP" && Boolean(roundTripOffer);
      const feedOnlineBookable = isRoundTrip
        ? Boolean(
            roundTripOffer?.booking_eligibility?.online_bookable ??
              routeOffer.booking_eligibility.online_bookable,
          )
        : Boolean(routeOffer.booking_eligibility.online_bookable);
      const publishedBookingEligible = isRoundTrip
        ? Boolean(
            roundTripOffer?.booking_eligibility?.published_booking_eligible ??
              routeOffer.booking_eligibility.published_booking_eligible,
          )
        : Boolean(routeOffer.booking_eligibility.published_booking_eligible);

      const oneWayAmountUsd = isExpired ? null : publishedOneWay;
      const roundTripAmountUsd = isExpired ? null : publishedRt;
      const effectiveTripAmountUsd = isRoundTrip
        ? roundTripAmountUsd
        : oneWayAmountUsd;

      const resolvedOfferId = isRoundTrip && roundTripOffer
        ? roundTripOffer.offer_id
        : routeOffer.offer_id;
      const resolvedRouteId = isRoundTrip && roundTripOffer
        ? roundTripOffer.route_id
        : routeOffer.route_id;
      const resolvedBookingUrl = isRoundTrip && roundTripOffer
        ? roundTripOffer.booking_eligibility?.booking_url ||
          roundTripOffer.canonical_booking_url
        : routeOffer.booking_eligibility.booking_url ||
          routeOffer.canonical_booking_url;
      const resolvedQuoteUrl = isRoundTrip && roundTripOffer
        ? roundTripOffer.booking_eligibility?.quote_url ||
          roundTripOffer.quote_url
        : routeOffer.booking_eligibility.quote_url || routeOffer.quote_url;

      const outboundRezdy =
        roundTripOffer?.booking_eligibility?.outbound_rezdy_product_code ??
        (tripDirection === "RETURN"
          ? null
          : routeOffer.booking_eligibility.rezdy_product_code ?? null);
      const returnRezdy =
        roundTripOffer?.booking_eligibility?.return_rezdy_product_code ??
        (tripDirection === "RETURN"
          ? routeOffer.booking_eligibility.rezdy_product_code ?? null
          : null);

      return {
        offerId: resolvedOfferId,
        routeId: resolvedRouteId,
        outboundRouteId,
        returnRouteId:
          roundTripOffer?.return_route_id ??
          (tripDirection === "RETURN" || tripDirection === "ROUND_TRIP"
            ? returnRouteId
            : null),
        tripDirection,
        tripType: isRoundTrip ? "ROUND_TRIP" : "ONE_WAY",
        origin: routeOffer.origin,
        destination: routeOffer.destination,
        vehicleClass,
        vehicleLabel:
          (isRoundTrip && roundTripOffer?.vehicle_label) ||
          routeOffer.vehicle_label,
        seatingLimit:
          (isRoundTrip && roundTripOffer?.seating_limit) ||
          routeOffer.seating_limit,
        oneWayAmountUsd,
        publishedOneWayAmountUsd: publishedOneWay,
        roundTripAmountUsd,
        publishedRoundTripAmountUsd: publishedRt,
        effectiveTripAmountUsd,
        currency: routeOffer.pricing.currency || "USD",
        feedStatus:
          (isRoundTrip && roundTripOffer?.status) || routeOffer.status,
        feedNextStep:
          (isRoundTrip && roundTripOffer?.next_step) || routeOffer.next_step,
        publishedBookingEligible,
        feedOnlineBookable,
        effectiveOnlineBookable: !isExpired && feedOnlineBookable,
        rezdyProductCode:
          routeOffer.booking_eligibility.rezdy_product_code ?? null,
        outboundRezdyProductCode: outboundRezdy,
        returnRezdyProductCode: returnRezdy,
        canonicalBookingUrl: resolvedBookingUrl,
        quoteUrl: resolvedQuoteUrl,
        liveAvailabilityEndpoint:
          routeOffer.booking_eligibility.live_availability
            ?.availability_endpoint ?? null,
        checkoutEndpoint:
          routeOffer.booking_eligibility.live_availability?.checkout_endpoint ??
          null,
        liveAvailabilityRequiresQuery: Boolean(
          routeOffer.booking_eligibility.live_availability?.requires_query,
        ),
        dccLiveAvailabilityQuoteOnlyForVan: vehicleClass === "van",
        gearPolicy: routeOffer.gear_policy || DEFAULT_GEAR_POLICY,
        luggageNote:
          vehicleClass === "suv" ? SUV_LUGGAGE_NOTE : VAN_LUGGAGE_NOTE,
        specificHardwareLayoutNote:
          vehicleClass === "suv" ? SUV_HARDWARE_NOTE : VAN_HARDWARE_NOTE,
        specificHardwareVerificationState: "requires_operator_confirmation",
        sourceType: "route_feed_one_way",
        notes:
          routeOffer.booking_eligibility.live_availability?.note ?? null,
      };
    }

    const expectedOutboundOfferId = `${outboundRouteId}-${vehicleClass.toUpperCase()}`;
    const reconciledOffer: GoSnoReconciledServiceOffer | undefined =
      snapshot.feed.reconciled_services.find(
        (svc) =>
          svc.vehicleClass === vehicleClass &&
          (svc.serviceId.toUpperCase() === expectedOutboundOfferId ||
            svc.destination.toLowerCase().replace(/\s+/g, "_") ===
              destinationResort),
      );

    if (reconciledOffer) {
      const publishedOneWay =
        typeof reconciledOffer.referencePriceUsd === "number"
          ? reconciledOffer.referencePriceUsd
          : null;
      const publishedRt =
        typeof reconciledOffer.roundTripReferencePriceUsd === "number"
          ? reconciledOffer.roundTripReferencePriceUsd
          : null;
      const oneWayAmountUsd = isExpired ? null : publishedOneWay;
      const roundTripAmountUsd = isExpired ? null : publishedRt;
      return {
        offerId: reconciledOffer.serviceId,
        routeId: activeRouteId,
        outboundRouteId,
        returnRouteId:
          tripDirection === "RETURN" || tripDirection === "ROUND_TRIP"
            ? returnRouteId
            : null,
        tripDirection,
        tripType: tripDirection === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY",
        origin:
          tripDirection === "RETURN"
            ? reconciledOffer.destination
            : reconciledOffer.origin,
        destination:
          tripDirection === "RETURN"
            ? reconciledOffer.origin
            : reconciledOffer.destination,
        vehicleClass,
        vehicleLabel:
          vehicleClass === "suv"
            ? "Private Full-Size SUV (Chevrolet Suburban or equivalent)"
            : "Private Passenger Van — Up to 10 Passengers",
        seatingLimit: reconciledOffer.seatingLimit,
        oneWayAmountUsd,
        publishedOneWayAmountUsd: publishedOneWay,
        roundTripAmountUsd,
        publishedRoundTripAmountUsd: publishedRt,
        effectiveTripAmountUsd:
          tripDirection === "ROUND_TRIP" ? roundTripAmountUsd : oneWayAmountUsd,
        currency: reconciledOffer.currency || "USD",
        feedStatus: reconciledOffer.status,
        feedNextStep: reconciledOffer.nextStep,
        publishedBookingEligible: false,
        feedOnlineBookable: false,
        effectiveOnlineBookable: false,
        rezdyProductCode: null,
        outboundRezdyProductCode: null,
        returnRezdyProductCode: null,
        canonicalBookingUrl: reconciledOffer.canonicalUrl,
        quoteUrl: reconciledOffer.actionUrl,
        liveAvailabilityEndpoint: null,
        checkoutEndpoint: null,
        liveAvailabilityRequiresQuery: false,
        dccLiveAvailabilityQuoteOnlyForVan: vehicleClass === "van",
        gearPolicy: reconciledOffer.gearPolicy || DEFAULT_GEAR_POLICY,
        luggageNote:
          vehicleClass === "suv" ? SUV_LUGGAGE_NOTE : VAN_LUGGAGE_NOTE,
        specificHardwareLayoutNote:
          vehicleClass === "suv" ? SUV_HARDWARE_NOTE : VAN_HARDWARE_NOTE,
        specificHardwareVerificationState: "requires_operator_confirmation",
        sourceType: "reconciled_service",
        notes: reconciledOffer.notes,
      };
    }

    return {
      offerId: expectedOneWayOfferId,
      routeId: activeRouteId,
      outboundRouteId,
      returnRouteId:
        tripDirection === "RETURN" || tripDirection === "ROUND_TRIP"
          ? returnRouteId
          : null,
      tripDirection,
      tripType: tripDirection === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY",
      origin: tripDirection === "RETURN" ? destinationResort : "DEN",
      destination: tripDirection === "RETURN" ? "DEN" : destinationResort,
      vehicleClass,
      vehicleLabel:
        vehicleClass === "suv"
          ? "Private Full-Size SUV"
          : "Private Passenger Van",
      seatingLimit: vehicleClass === "suv" ? 6 : 10,
      oneWayAmountUsd: null,
      publishedOneWayAmountUsd: null,
      roundTripAmountUsd: null,
      publishedRoundTripAmountUsd: null,
      effectiveTripAmountUsd: null,
      currency: "USD",
      feedStatus: "quote_only",
      feedNextStep: "request a quote",
      publishedBookingEligible: false,
      feedOnlineBookable: false,
      effectiveOnlineBookable: false,
      rezdyProductCode: null,
      outboundRezdyProductCode: null,
      returnRezdyProductCode: null,
      canonicalBookingUrl: "https://gosno.co/request-quote",
      quoteUrl: "https://gosno.co/request-quote",
      liveAvailabilityEndpoint: null,
      checkoutEndpoint: null,
      liveAvailabilityRequiresQuery: false,
      dccLiveAvailabilityQuoteOnlyForVan: vehicleClass === "van",
      gearPolicy: DEFAULT_GEAR_POLICY,
      luggageNote: vehicleClass === "suv" ? SUV_LUGGAGE_NOTE : VAN_LUGGAGE_NOTE,
      specificHardwareLayoutNote:
        vehicleClass === "suv" ? SUV_HARDWARE_NOTE : VAN_HARDWARE_NOTE,
      specificHardwareVerificationState: "requires_operator_confirmation",
      sourceType: "reconciled_service",
      notes: null,
    };
  };

  return {
    destinationResort,
    tripDirection,
    routeId: activeRouteId,
    outboundRouteId,
    returnRouteId,
    snapshotVersionInfo: {
      snapshotId: snapshot.snapshotId,
      sourceUrl: snapshot.sourceUrl,
      feedSpec: snapshot.feedSpec,
      feedVersion: snapshot.feedVersion,
      feedGeneratedAt: snapshot.feedGeneratedAt,
      fetchedAt: snapshot.fetchedAt,
      expiresAt: snapshot.expiresAt,
      contentHash: snapshot.contentHash,
      rawPayloadHash: snapshot.rawPayloadHash,
      freshnessStatus,
      isExpired,
      routeCount: snapshot.routeCount,
      roundTripCount: snapshot.roundTripCount,
      reconciledServiceCount: snapshot.reconciledServiceCount,
    },
    suv: buildVehicleOffer("suv"),
    van: buildVehicleOffer("van"),
  };
}

export const DENVER_MOUNTAIN_ANSWER_SCHEMA = z
  .object({
    departureHub: z
      .enum(["den_airport", "union_station_downtown"])
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.departureHub),
    destinationResort: z
      .preprocess(
        (val) =>
          typeof val === "string" && val in LEGACY_CORRIDOR_ALIASES
            ? LEGACY_CORRIDOR_ALIASES[val]
            : val,
        z.enum([
          "winter_park",
          "keystone",
          "copper",
          "breckenridge",
          "vail",
          "beaver_creek",
          "steamboat",
          "aspen",
          "snowmass",
          "crested_butte",
          "big_sky",
        ]),
      )
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.destinationResort),
    tripDirection: z
      .enum(["OUTBOUND", "RETURN", "ROUND_TRIP"])
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.tripDirection),
    travelDate: z
      .string()
      .regex(ymdRegex, "travelDate must be YYYY-MM-DD when provided")
      .nullable()
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.travelDate),
    pickupTime: z
      .string()
      .nullable()
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.pickupTime),
    returnDate: z
      .string()
      .regex(ymdRegex, "returnDate must be YYYY-MM-DD when provided")
      .nullable()
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.returnDate),
    returnPickupTime: z
      .string()
      .nullable()
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.returnPickupTime),
    travelMonth: z
      .number()
      .int()
      .min(1)
      .max(12)
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.travelMonth),
    groupSize: z
      .number()
      .int()
      .min(1)
      .max(14)
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.groupSize),
    standardBagCount: z
      .number()
      .int()
      .min(0)
      .max(25)
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.standardBagCount),
    skiAndLuggageBagCount: z
      .number()
      .int()
      .min(0)
      .max(20)
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.skiAndLuggageBagCount),
    roofBoxConfirmed: z
      .boolean()
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.roofBoxConfirmed),
    youngestChildAgeYears: z
      .number()
      .int()
      .min(0)
      .max(17)
      .nullable()
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.youngestChildAgeYears),
    needsChildCarSeat: z
      .boolean()
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.needsChildCarSeat),
    roadWeatherScenario: z
      .enum([
        "clear_dry",
        "active_snow_code15_traction",
        "severe_winter_storm_code16",
      ])
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.roadWeatherScenario),
    mobilityLevel: z
      .enum(["standard", "limited_mobility", "step_free_wheelchair"])
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.mobilityLevel),
    availableWindowMinutes: z
      .number()
      .int()
      .min(90)
      .max(600)
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.availableWindowMinutes),
    maxTotalGroupBudgetUsd: z
      .number()
      .int()
      .min(15)
      .max(2500)
      .nullable()
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.maxTotalGroupBudgetUsd),
    priorityMode: z
      .enum([
        "door_to_door_private",
        "group_value_per_person",
        "lowest_cost_public",
      ])
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.priorityMode),
    originatingPage: z
      .string()
      .default(DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.originatingPage),
  })
  .strict();

export const DENVER_MOUNTAIN_SOURCE_RECORDS: SourceRecord[] = [
  {
    sourceId: "src-cdot-i70-traction-law-2026",
    sourceOrganization: "Colorado Department of Transportation (CDOT)",
    sourceTitle:
      "C.R.S. § 42-4-106 Passenger Vehicle Traction (Code 15) & Chain Laws (Code 16) — Sept 1 to May 31 (Dotsero MP 133 to Morrison MP 259)",
    sourceUrl: "https://www.codot.gov/travel/winter-driving/tractionlaw",
    claimsSupported: ["claim-co-i70-traction-law-statutory"],
    retrievedAt: "2026-10-15T00:00:00.000Z",
    verifiedAt: "2026-10-15T00:00:00.000Z",
    expiresAt: "2027-06-01T00:00:00.000Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
  {
    sourceId: "src-gosno-colorado-tariff-2026",
    sourceOrganization: "GoSno LLC (CO PUC LL-03577)",
    sourceTitle:
      "GoSno Public Route Feed Snapshot v1.0 (evsnap:gosno-route-feed:v1.0:295ccba41219) — DEN One-Way Fares: $349 SUV / $499 Van (Winter Park, Keystone), $349 SUV / $599 Van (Copper), $399 SUV / $599 Van (Breckenridge), $499 SUV / $599 Van (Vail), $549 SUV / $649 Van (Beaver Creek), $599 SUV / $899 Van (Steamboat), $699 SUV / $899 Van (Aspen, Snowmass); Reconciled Services: Crested Butte ($699 SUV quote_only / Van quote_only), Big Sky ($299 SUV quote_only / Van currently_unavailable)",
    sourceUrl: "https://gosno.co/api/public/route-feed",
    claimsSupported: [
      "claim-co-gosno-suv-capacity-and-gear",
      "claim-co-gosno-van-capacity-and-quote",
    ],
    retrievedAt: "2026-11-04T14:05:00.000Z",
    verifiedAt: "2026-11-04T14:05:00.000Z",
    expiresAt: "2027-05-31T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-epic-mountain-express-rates-2026",
    sourceOrganization: "Epic Mountain Express",
    sourceTitle:
      "DEN Shared Mountain Shuttle Rates ($59–$129 Transfer Center / $69–$139 Door-to-Door) & Baggage Policy (2 Bags + 1 Personal Item per Guest)",
    sourceUrl: "https://www.epicmountainexpress.com/shuttle-rates",
    claimsSupported: ["claim-co-eme-shared-shuttle-rates-and-baggage"],
    retrievedAt: "2026-10-20T00:00:00.000Z",
    verifiedAt: "2026-10-20T00:00:00.000Z",
    expiresAt: "2027-05-31T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-cdot-bustang-and-rtd-2026",
    sourceOrganization:
      "CDOT Bustang / RTD Denver / Summit Stage / Town of Vail Transit",
    sourceTitle:
      "RTD A-Line ($10.50, 37m DEN–Union Station) + CDOT Bustang West Line ($12–$22 to Frisco / $17 to Vail = $27.50 DEN–Vail Total) + $0 Summit Stage",
    sourceUrl: "https://www.codot.gov/travel/bustang",
    claimsSupported: ["claim-co-bustang-union-station-transfer"],
    retrievedAt: "2026-10-18T00:00:00.000Z",
    verifiedAt: "2026-10-18T00:00:00.000Z",
    expiresAt: "2027-05-31T00:00:00.000Z",
    freshnessCategory: "seasonal_schedule",
    status: "current",
  },
];

export const DENVER_MOUNTAIN_EVIDENCE_CLAIMS: EvidenceClaim[] = [
  {
    claimId: "claim-co-i70-traction-law-statutory",
    classification: "official_rule",
    statement:
      "Under C.R.S. § 42-4-106, from September 1 through May 31 on I-70 between Dotsero (MP 133) and Morrison (MP 259), all motorists must have 4WD/AWD or winter/all-weather (M+S/3PMSF) tires with at least 3/16-inch tread depth, or carry chains/AutoSock (Code 15); Code 16 requires physical chains/AutoSock on all passenger vehicles.",
    fieldsSupported: ["roadWeatherScenario", "tradeoffs"],
    sourceIds: ["src-cdot-i70-traction-law-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against C.R.S. § 42-4-106 and CDOT Traction Law enforcement rules.",
  },
  {
    claimId: "claim-co-gosno-suv-capacity-and-gear",
    classification: "operator_published_fact",
    statement:
      "GoSno LLC (CO PUC LL-03577) operates 100% private door-to-door mountain transfers (never shared per-seat shuttles). Full-size AWD/4WD SUVs have a verified seating_limit of 6 passengers. Published DEN one-way SUV fares in route-feed.snapshot.json (v1.0) are $349 for Winter Park (DEN-WINTER-PARK-SUV, Rezdy P360K5), Keystone (DEN-KEYSTONE-SUV, Rezdy P9PQRN), and Copper Mountain (DEN-COPPER-SUV, Rezdy PHCYQL); $399 for Breckenridge (DEN-BRECKENRIDGE-SUV, Rezdy P7477S); $499 for Vail (DEN-VAIL-SUV, Rezdy PXFGPP); $549 for Beaver Creek (DEN-BEAVER-CREEK-SUV, Rezdy P9AP71); $599 for Steamboat Springs (DEN-STEAMBOAT-SUV, Rezdy PEZN8V); and $699 for Aspen (DEN-ASPEN-SUV, Rezdy P11TWN) and Snowmass (DEN-SNOWMASS-SUV, Rezdy PP1A72)—all with status 'available_for_online_booking' and online_bookable: true—while Crested Butte ($699 SUV) and Big Sky ($299 SUV from BZN) are status 'quote_only' (online_bookable: false). Under GoSno's gear_policy and equipment.specific_hardware_layout (verification_state: 'requires_operator_confirmation'), skis, snowboards, boots, and standard luggage are included at no extra charge when they fit safely inside the reserved private vehicle or cargo carrier, and specific ski racks or roof cargo boxes depend on physical vehicle assignment; customers provide accurate passenger, suitcase, and ski-bag counts so GoSno can confirm vehicle fit.",
    fieldsSupported: [
      "groupCapacityRange",
      "skiAndLuggageBagCount",
      "indicativePriceUsd",
    ],
    sourceIds: ["src-gosno-colorado-tariff-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against data/network/audit/satellite/gosno/route-feed.snapshot.json (evsnap:gosno-route-feed:v1.0:295ccba41219).",
  },
  {
    claimId: "claim-co-gosno-van-capacity-and-quote",
    classification: "operator_published_fact",
    statement:
      "GoSno private passenger vans have a verified seating_limit of 10 passengers (groups of 11+ passengers exceed a single van and require multi-vehicle coordination via https://gosno.co/request-quote). Published DEN one-way van fares in route-feed.snapshot.json (v1.0) are $499 for Winter Park (DEN-WINTER-PARK-VAN, Rezdy PDU6A0) and Keystone (DEN-KEYSTONE-VAN, Rezdy PMXKMU); $599 for Copper Mountain (DEN-COPPER-VAN, Rezdy PL1Q5B), Breckenridge (DEN-BRECKENRIDGE-VAN, Rezdy PKQDPG), and Vail (DEN-VAIL-VAN, Rezdy P71R37); $649 for Beaver Creek (DEN-BEAVER-CREEK-VAN, Rezdy PL6NBQ); and $899 for Steamboat Springs (DEN-STEAMBOAT-VAN, Rezdy P5BRTS), Aspen (DEN-ASPEN-VAN, Rezdy PALHVX), and Snowmass (DEN-SNOWMASS-VAN, Rezdy PU8KPD)—all with feed status 'available_for_online_booking' and online_bookable: true (with live slot/gear confirmation via /api/availability)—whereas Crested Butte Van (DEN-CRESTED-BUTTE-VAN) is 'quote_only' (referencePriceUsd: null, online_bookable: false) and Big Sky Van (BZN-BIG-SKY-VAN) is 'currently_unavailable'. Van interior luggage barriers and ski cargo racks depend on physical vehicle assignment (verification_state: 'requires_operator_confirmation').",
    fieldsSupported: ["groupCapacityRange", "indicativePriceUsd"],
    sourceIds: ["src-gosno-colorado-tariff-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against data/network/audit/satellite/gosno/route-feed.snapshot.json (evsnap:gosno-route-feed:v1.0:295ccba41219).",
  },
  {
    claimId: "claim-co-eme-shared-shuttle-rates-and-baggage",
    classification: "operator_published_fact",
    statement:
      "Epic Mountain Express operates per-seat shared airport shuttles from DEN to Summit and Eagle County resorts with published rates varying by date and peak periods from $59–$129/guest (transfer center) to $69–$139/guest (door-to-door) before 20% Epic Mountain Rewards on non-blackout dates, allowing 2 baggage items (including a ski/snowboard bag) plus 1 small personal item per guest ($10 extra bag fee).",
    fieldsSupported: ["indicativePriceUsd", "skiAndLuggageBagCount"],
    sourceIds: ["src-epic-mountain-express-rates-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against Epic Mountain Express published shuttle rates and FAQ.",
  },
  {
    claimId: "claim-co-bustang-union-station-transfer",
    classification: "official_rule",
    statement:
      "Public transit from DEN Airport requires the RTD A-Line commuter train ($10.50/person, 37 minutes) to Denver Union Station, connecting to the CDOT Bustang West Line ($12–$22/person to Frisco Transfer Center + $0 free Summit Stage bus to Breckenridge/Keystone/Copper, or $17/person to Vail Transportation Center = $27.50 total DEN–Vail one-way).",
    fieldsSupported: ["departureHub", "durationMinutes", "indicativePriceUsd"],
    sourceIds: ["src-cdot-bustang-and-rtd-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against RTD A-Line and CDOT Bustang West Line published fares.",
  },
];

export const DENVER_MOUNTAIN_CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    optionId: "co-mtn-gosno-private-suv",
    title:
      "GoSno Private Full-Size AWD/4WD SUV ($349 Winter Park / Keystone / Copper, $399 Breckenridge, $499 Vail, Up to 6 Pax)",
    shortLabel: "GoSno Private SUV (1–6 Pax)",
    optionKind: "owned_specialist_comparison",
    actualOperators: ["GoSno LLC (CO PUC LL-03577)"],
    islandsOrRegions: [
      "winter_park",
      "keystone",
      "copper",
      "breckenridge",
      "vail",
      "beaver_creek",
      "steamboat",
      "aspen",
      "snowmass",
      "crested_butte",
      "big_sky",
    ],
    departureAreas: ["den_airport", "union_station_downtown"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2027-05-31",
    vesselOrVehicleType:
      "100% Private Full-Size AWD/4WD SUV (Chevrolet Suburban or equivalent)",
    groupCapacityRange: {
      min: 1,
      max: 6,
      label:
        "Private party up to 6 passengers (verified seating_limit: 6); cargo capacity depends on ski bags and luggage size (specific ski racks/roof cargo boxes require operator confirmation)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "100% private door-to-door SUV transfer for your group only (never shared per-seat) from DEN curbside or downtown Denver directly to your resort lodging.",
    durationMinutes: {
      activity: 115,
      checkInLead: 15,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 110, max: 145 },
      label: "1.8–2.4 hours direct door-to-door",
    },
    minimumAgeYears: 0,
    minimumAgeNote:
      "All ages welcome; child/booster seats available when requested in advance (C.R.S. § 42-4-236).",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Curbside terminal pickup; requires stepping into SUV cabin (collapsible manual wheelchair stows in rear cargo subject to luggage fit).",
      confirmationStatus: "operator_confirmation_required",
      note: "Collapsible manual wheelchair stows in cargo bay; fixed ramp lift not available on SUV.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Direct lodge drop-off; eliminates nightly resort parking fees and I-70 rental car traction-law liability.",
    },
    cancellationTerms:
      "Published private charter terms and flight-tracking delay adjustments on gosno.co.",
    whaleSightingOrReRidePolicy:
      "Dedicated driver tracks arriving flights at DEN and dispatches only for your party.",
    indicativePriceUsd: {
      min: 349,
      max: 699,
      basisLabel:
        "per private SUV one-way from DEN ($349 Winter Park/Keystone/Copper, $399 Breckenridge, $499 Vail, $549 Beaver Creek, $599 Steamboat, $699 Aspen/Snowmass/Crested Butte; $299 BZN–Big Sky)",
    },
    comparisonValues: {
      vehicleFormat: "100% Private Full-Size AWD/4WD SUV (1–6 Pax)",
      routingType: "Direct Door-to-Door (Zero Transfers)",
      winterTractionCompliance:
        "Commercial AWD/4WD + Winter Tires (Code 15/16 Compliant)",
      gearAndSeatRules:
        "Verified 6-Pax Limit; Skis & Luggage Included When Fitting Safely (Roof Box / Ski Rack Layout Requires Operator Confirmation)",
    },
    tradeoffs: {
      strengths: [
        "100% private door-to-door transfer from DEN curbside or downtown straight to your mountain lodging",
        "At 4–6 passengers ($58.17–$87.25/person at $349 for Winter Park/Keystone/Copper or $66.50–$99.75/person at $399 for Breckenridge), per-person cost matches or beats door-to-door shared shuttles while saving 60–90 minutes of airport staging",
        "Fully compliant with statutory C.R.S. § 42-4-106 Code 15/16 winter traction requirements",
      ],
      limitations: [
        "Higher total cost than public transit or single shared-shuttle seats for solo travelers or couples",
        "Specific ski racks and roof cargo boxes depend on physical vehicle assignment (verification_state: requires_operator_confirmation); customers must provide accurate passenger, suitcase, and ski-bag counts so GoSno can confirm vehicle fit",
      ],
    },
    claimIds: [
      "claim-co-i70-traction-law-statutory",
      "claim-co-gosno-suv-capacity-and-gear",
    ],
    sourceIds: [
      "src-cdot-i70-traction-law-2026",
      "src-gosno-colorado-tariff-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-gosno-suv-direct",
        optionId: "co-mtn-gosno-private-suv",
        sellerType: "dcc_owned_specialist",
        sellerName: "GoSno",
        actualOperatorName: "GoSno LLC (CO PUC LL-03577)",
        label: "Book Private SUV Online on GoSno",
        url: "https://gosno.co/breckenridge",
        supportedContextParams: ["date", "partySize"],
        relationshipDisclosure:
          "GoSno (gosno.co) is a DCC portfolio private mountain transportation operator; traveler confirms final pricing and completes checkout on gosno.co.",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "co-mtn-gosno-private-van",
    title:
      "GoSno Private 10-Passenger Mountain Van ($499 Winter Park / Keystone, $599 Copper / Breck / Vail, $649 Beaver Creek, Up to 10 Pax)",
    shortLabel: "GoSno Private Van (Up to 10 Pax)",
    optionKind: "private_charter",
    actualOperators: ["GoSno LLC (CO PUC LL-03577)"],
    islandsOrRegions: [
      "winter_park",
      "keystone",
      "copper",
      "breckenridge",
      "vail",
      "beaver_creek",
      "steamboat",
      "aspen",
      "snowmass",
      "crested_butte",
      "big_sky",
    ],
    departureAreas: ["den_airport", "union_station_downtown"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2027-05-31",
    vesselOrVehicleType:
      "100% Private AWD/Winter-Equipped Passenger Van (Up to 10 Passengers)",
    groupCapacityRange: {
      min: 1,
      max: 10,
      label:
        "Private party up to 10 passengers (verified seating_limit: 10; 11+ pax require multi-vehicle quote); accommodates group luggage and ski equipment subject to gear fit",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Private group van keeping up to 10 passengers and ski gear together in one door-to-door vehicle.",
    durationMinutes: {
      activity: 120,
      checkInLead: 15,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 115, max: 150 },
      label: "2.0–2.5 hours direct door-to-door",
    },
    minimumAgeYears: 0,
    minimumAgeNote:
      "All ages welcome; child safety seats available when requested.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Curbside step-in boarding; contact operator in advance for collapsible wheelchair stowage.",
      confirmationStatus: "operator_confirmation_required",
      note: "Contact GoSno in advance to confirm cargo fit and dispatch availability.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Avoids renting two separate AWD SUVs and paying double resort parking.",
    },
    cancellationTerms:
      "Published group charter terms via GoSno (online_bookable: true on 9 Colorado resort routes; live /api/availability confirms date/time slot and gear fit).",
    whaleSightingOrReRidePolicy:
      "Dedicated driver tracks arriving flights at DEN; groups of 11+ use multi-vehicle quote flow.",
    indicativePriceUsd: {
      min: 499,
      max: 899,
      basisLabel:
        "per private van one-way from DEN ($499 Winter Park/Keystone, $599 Copper/Breck/Vail, $649 Beaver Creek, $899 Steamboat/Aspen/Snowmass; Crested Butte quote_only; Big Sky van currently_unavailable)",
    },
    comparisonValues: {
      vehicleFormat: "100% Private 10-Pax Mountain Van",
      routingType: "Direct Door-to-Door (Single Group Vehicle)",
      winterTractionCompliance:
        "Commercial Winter Fleet (Code 15/16 Compliant)",
      gearAndSeatRules:
        "Verified 10-Pax Limit (11+ Pax Multi-Vehicle Quote); Group Luggage & Ski Gear Subject to Fit (Interior Barrier / Ski Racks Require Operator Confirmation)",
    },
    tradeoffs: {
      strengths: [
        "Keeps groups of 7–10 together in a single private door-to-door vehicle ($49.90–$71.29/person at $499 for Winter Park/Keystone or $59.90–$85.57/person at $599 for Copper/Breckenridge/Vail)",
        "Safer and often cheaper than renting two separate AWD SUVs during I-70 winter storms",
      ],
      limitations: [
        "Van seating rows, interior luggage barrier, and dedicated ski cargo racks depend on physical vehicle assignment (verification_state: requires_operator_confirmation); live slot/cargo fit confirmed at booking or via quote",
        "Strict 10-passenger single-van ceiling (groups of 11+ passengers require multi-vehicle coordination at https://gosno.co/request-quote); unavailable on Big Sky routes",
      ],
    },
    claimIds: [
      "claim-co-i70-traction-law-statutory",
      "claim-co-gosno-van-capacity-and-quote",
    ],
    sourceIds: [
      "src-cdot-i70-traction-law-2026",
      "src-gosno-colorado-tariff-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-gosno-van-direct",
        optionId: "co-mtn-gosno-private-van",
        sellerType: "dcc_owned_specialist",
        sellerName: "GoSno",
        actualOperatorName: "GoSno LLC (CO PUC LL-03577)",
        label: "Book Private 10-Pax Van Online on GoSno",
        url: "https://gosno.co/breckenridge",
        supportedContextParams: ["date", "partySize"],
        relationshipDisclosure:
          "GoSno (gosno.co) is a DCC portfolio private mountain transportation operator.",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "co-mtn-shared-airport-shuttle",
    title:
      "Epic Mountain Express Shared Airport Shuttle ($59–$139/Guest Per-Seat)",
    shortLabel: "Epic Mountain Express Shared Shuttle",
    optionKind: "guided_commercial",
    actualOperators: ["Epic Mountain Express"],
    islandsOrRegions: [
      "breckenridge",
      "keystone",
      "copper",
      "vail",
      "beaver_creek",
    ],
    departureAreas: ["den_airport"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2027-05-31",
    vesselOrVehicleType:
      "Per-Seat Shared 10–12 Passenger Mountain Shuttle Van",
    groupCapacityRange: {
      min: 1,
      max: 12,
      label:
        "Booked per seat (2 bags incl. ski bag + 1 personal item per guest)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Scheduled shared airport shuttle departing DEN with transfer-center or multi-stop lodge drop-offs in Summit and Eagle Counties.",
    durationMinutes: {
      activity: 150,
      checkInLead: 35,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 170, max: 230 },
      label: "2.8–3.8 hours including DEN staging & multi-stop drop-offs",
    },
    minimumAgeYears: 0,
    minimumAgeNote:
      "Children require parent-supplied child restraint seat on shared vans under CO law.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "ADA wheelchair-accessible vehicles available with advance notice.",
      confirmationStatus: "confirmed_accessible",
      note: "Request ADA lift vehicle in advance when booking.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Drops at resort transfer centers ($59–$129/guest) or lodge doors ($69–$139/guest).",
    },
    cancellationTerms:
      "Published per-seat tariff terms via Epic Mountain Express (20% Epic Mountain Rewards discount on non-blackout dates).",
    whaleSightingOrReRidePolicy:
      "Accommodates delayed DEN arrivals on next available scheduled shuttle.",
    indicativePriceUsd: {
      min: 59,
      max: 139,
      basisLabel:
        "per guest one-way ($59–$129 transfer center / $69–$139 door-to-door, varies by date & peak period)",
    },
    comparisonValues: {
      vehicleFormat: "Shared Per-Seat Shuttle Van",
      routingType: "Scheduled Multi-Stop from DEN Airport",
      winterTractionCompliance: "Commercial Fleet Included",
      gearAndSeatRules:
        "2 Bags (Incl. Ski Bag) + 1 Personal Item/Guest ($10 Extra Bag Fee)",
    },
    tradeoffs: {
      strengths: [
        "Cost-effective commercial option for 1–2 travelers flying directly into DEN ($59–$139/guest; 20% off with Epic Pass on non-blackout dates)",
        "Includes 2 baggage items (including a ski/snowboard bag) + 1 personal item per passenger",
      ],
      limitations: [
        "For 4–6 travelers ($276–$834 total door-to-door), total per-seat cost approaches or exceeds a private GoSno SUV ($349–$549) while adding airport hold times and multi-hotel stops",
        "Does not serve Winter Park, Steamboat Springs, Aspen, Snowmass, Crested Butte, or Big Sky on Summit/Eagle County shared routes",
      ],
    },
    claimIds: [
      "claim-co-i70-traction-law-statutory",
      "claim-co-eme-shared-shuttle-rates-and-baggage",
    ],
    sourceIds: [
      "src-cdot-i70-traction-law-2026",
      "src-epic-mountain-express-rates-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-epic-mountain-express-direct",
        optionId: "co-mtn-shared-airport-shuttle",
        sellerType: "direct_operator",
        sellerName: "Epic Mountain Express (Direct)",
        actualOperatorName: "Epic Mountain Express",
        label: "Check Shared Shuttle Rates on Epic Mountain Express",
        url: "https://www.epicmountainexpress.com/shuttle-rates",
        supportedContextParams: [],
        relationshipDisclosure:
          "Independent direct operator link provided for complete corridor comparison; zero commission influence.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "co-mtn-cdot-bustang-pegasus-public",
    title:
      "RTD A-Line ($10.50) + CDOT Bustang West Line ($12–$22) + Free Summit Stage / Vail Bus",
    shortLabel: "CDOT Bustang + RTD A-Line ($12–$27.50 Public)",
    optionKind: "public_or_diy",
    actualOperators: [
      "Colorado Department of Transportation (Bustang / Pegasus)",
      "RTD Denver",
      "Summit Stage",
    ],
    islandsOrRegions: [
      "breckenridge",
      "keystone",
      "copper",
      "vail",
      "beaver_creek",
    ],
    departureAreas: ["den_airport", "union_station_downtown"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2027-05-31",
    vesselOrVehicleType:
      "Public Commuter Rail (RTD A-Line) + Highway Coach (CDOT Bustang) + Free Municipal Bus",
    groupCapacityRange: {
      min: 1,
      max: 14,
      label:
        "Public transit seats ($12–$22 Bustang + $10.50 RTD A-Line from DEN)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Public motorcoach with under-bus ski bay, Wi-Fi, and restroom from Denver Union Station to Frisco Transfer Center ($0 Summit Stage) or Vail Transportation Center ($17 Bustang fare; $27.50 total from DEN).",
    durationMinutes: {
      activity: 135,
      checkInLead: 20,
      typicalTransferEachWay: 55,
      totalDockOrHotelRange: { min: 180, max: 250 },
      label:
        "3.0–4.2 hours (includes 37m RTD A-Line from DEN + Union Station & Frisco/Vail transfers)",
    },
    minimumAgeYears: 0,
    minimumAgeNote: "All ages welcome on public transit.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "ADA wheelchair lifts on Bustang coaches and Summit Stage buses; requires navigating Union Station and transfer centers with luggage.",
      confirmationStatus: "confirmed_accessible",
      note: "Pegasus vans require advance reservation for ADA wheelchair boarding.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Departs Denver Union Station Underground Bus Concourse; arrives Frisco Transfer Center or Vail Transportation Center.",
    },
    cancellationTerms: "Public transit tickets via RideBustang / RTD.",
    whaleSightingOrReRidePolicy: "Fixed public timetable departures.",
    indicativePriceUsd: {
      min: 12,
      max: 28,
      basisLabel:
        "per person one-way ($12–$22 Bustang from Union Station; $27.50 total DEN–Vail including $10.50 RTD A-Line)",
    },
    comparisonValues: {
      vehicleFormat: "Public Highway Coach + Rail + Free Local Bus",
      routingType: "Hub-to-Hub (2–3 Transfers Carrying Gear)",
      winterTractionCompliance: "Commercial CDOT Fleet",
      gearAndSeatRules:
        "Traveler Must Carry All Bags & Skis Across Rail/Bus Transfers",
    },
    tradeoffs: {
      strengths: [
        "Lowest-cost way to reach Summit County or Vail ($12–$22 Bustang from Union Station, or $27.50 total DEN–Vail with the $10.50 RTD A-Line + $0 local resort buses)",
        "Under-coach luggage bay and onboard restroom on full-size Bustang West Line coaches",
      ],
      limitations: [
        "Requires hauling ski bags and suitcases across RTD A-Line -> Denver Union Station -> Frisco/Vail Transfer Center -> local municipal bus",
        "No door-to-door lodge pickup and difficult with young children or heavy group ski gear",
      ],
    },
    claimIds: ["claim-co-bustang-union-station-transfer"],
    sourceIds: ["src-cdot-bustang-and-rtd-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-cdot-bustang-official",
        optionId: "co-mtn-cdot-bustang-pegasus-public",
        sellerType: "public_or_diy",
        sellerName: "CDOT Bustang (Official Public Transit)",
        actualOperatorName: "Colorado Department of Transportation",
        label: "View Official CDOT Bustang West Line Schedules & Fares",
        url: "https://www.codot.gov/travel/bustang",
        supportedContextParams: [],
        relationshipDisclosure:
          "Official noncommercial public transit agency link included for unbiased comparison.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
];

export const DENVER_MOUNTAIN_QUESTIONS: QuestionDefinition[] = [
  {
    questionId: "destinationResort",
    label: "Destination mountain corridor",
    helpText: "Select your target resort from GoSno's route feed.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Determines exact GoSno route-feed pricing and online-booking eligibility ($349 SUV / $499 Van for Winter Park & Keystone; $349 SUV / $599 Van for Copper; $399 SUV / $599 Van for Breckenridge; $499 SUV / $599 Van for Vail; $549 SUV / $649 Van for Beaver Creek; $599 SUV / $899 Van for Steamboat; $699 SUV / $899 Van for Aspen & Snowmass; quote_only for Crested Butte & Big Sky SUV; currently_unavailable for Big Sky Van).",
    drivenByClaimIds: [
      "claim-co-gosno-suv-capacity-and-gear",
      "claim-co-gosno-van-capacity-and-quote",
      "claim-co-bustang-union-station-transfer",
    ],
    options: [
      {
        value: "winter_park",
        label:
          "Winter Park ($349 GoSno SUV / $499 Van — Online Bookable)",
      },
      {
        value: "keystone",
        label: "Keystone ($349 GoSno SUV / $499 Van — Online Bookable)",
      },
      {
        value: "copper",
        label:
          "Copper Mountain ($349 GoSno SUV / $599 Van — Online Bookable)",
      },
      {
        value: "breckenridge",
        label: "Breckenridge ($399 GoSno SUV / $599 Van — Online Bookable)",
      },
      {
        value: "vail",
        label: "Vail ($499 GoSno SUV / $599 Van — Online Bookable)",
      },
      {
        value: "beaver_creek",
        label: "Beaver Creek ($549 GoSno SUV / $649 Van — Online Bookable)",
      },
      {
        value: "steamboat",
        label:
          "Steamboat Springs ($599 GoSno SUV / $899 Van — Online Bookable)",
      },
      {
        value: "aspen",
        label: "Aspen ($699 GoSno SUV / $899 Van — Online Bookable)",
      },
      {
        value: "snowmass",
        label: "Snowmass ($699 GoSno SUV / $899 Van — Online Bookable)",
      },
      {
        value: "crested_butte",
        label:
          "Crested Butte ($699 GoSno SUV Quote-Only / Van Quote-Only)",
      },
      {
        value: "big_sky",
        label:
          "Big Sky via BZN ($299 GoSno SUV Quote-Only / Van Unavailable)",
      },
    ],
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.destinationResort,
  },
  {
    questionId: "departureHub",
    label: "Starting hub in Denver",
    helpText:
      "Are you departing straight from DEN Airport or downtown Denver Union Station?",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "CDOT Bustang departs from Denver Union Station (requiring a 37-minute, $10.50 RTD A-Line transfer if starting at DEN), whereas Epic Mountain Express shared shuttles depart from DEN Airport.",
    drivenByClaimIds: ["claim-co-bustang-union-station-transfer"],
    options: [
      { value: "den_airport", label: "Denver International Airport (DEN)" },
      {
        value: "union_station_downtown",
        label: "Denver Union Station / Downtown",
      },
    ],
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.departureHub,
  },
  {
    questionId: "tripDirection",
    label: "Trip direction (Outbound, Return, or Round-Trip)",
    helpText:
      "Select Outbound (DEN -> Resort), Return (Resort -> DEN), or Round-Trip (DEN <-> Resort).",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Resolves direction-specific GoSno route offers (e.g., DEN-WINTER-PARK vs. WINTER-PARK-DEN vs. DEN-WINTER-PARK-ROUND-TRIP) and preserves direction, return details, and booking flow URL on the GoSno handoff.",
    drivenByClaimIds: [
      "claim-co-gosno-suv-capacity-and-gear",
      "claim-co-gosno-van-capacity-and-quote",
    ],
    options: [
      { value: "OUTBOUND", label: "Outbound (Airport -> Mountain Resort)" },
      { value: "RETURN", label: "Return (Mountain Resort -> Airport)" },
      { value: "ROUND_TRIP", label: "Round-Trip (Both Directions)" },
    ],
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.tripDirection,
  },
  {
    questionId: "pickupTime",
    label: "Requested pickup time",
    helpText:
      "Preserved into the GoSno booking handoff (e.g., 10:30 or 14:30).",
    inputType: "time",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Passed directly into GoSno's booking flow so you do not need to re-enter your pickup time.",
    drivenByClaimIds: ["claim-co-gosno-suv-capacity-and-gear"],
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.pickupTime,
  },
  {
    questionId: "returnDate",
    label: "Return date (for Round-Trip)",
    helpText:
      "Optional return date (YYYY-MM-DD) preserved on Round-Trip GoSno handoffs.",
    inputType: "date",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Preserves your return leg date into GoSno's round-trip booking flow.",
    drivenByClaimIds: ["claim-co-gosno-suv-capacity-and-gear"],
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.returnDate,
  },
  {
    questionId: "returnPickupTime",
    label: "Return pickup time (for Round-Trip)",
    helpText:
      "Optional return pickup time (e.g., 08:00) preserved on Round-Trip GoSno handoffs.",
    inputType: "time",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Preserves your return leg pickup time into GoSno's round-trip booking flow.",
    drivenByClaimIds: ["claim-co-gosno-suv-capacity-and-gear"],
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.returnPickupTime,
  },
  {
    questionId: "groupSize",
    label: "Total passengers in your group",
    helpText:
      "GoSno Private SUVs have a verified 6-passenger limit; GoSno Private Vans have a verified 10-passenger limit (11+ require multi-vehicle quote).",
    inputType: "number",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Eliminates single-vehicle options only when passenger count exceeds operator-verified seating_limit (6 for SUV, 10 for single van) and compares per-seat shared shuttle total vs. flat private vehicle rates.",
    drivenByClaimIds: [
      "claim-co-gosno-suv-capacity-and-gear",
      "claim-co-gosno-van-capacity-and-quote",
    ],
    min: 1,
    max: 14,
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.groupSize,
  },
  {
    questionId: "standardBagCount",
    label: "Standard suitcases / checked bags in group",
    helpText:
      "Preserved into the GoSno booking handoff alongside ski/snowboard bags for cargo-fit confirmation.",
    inputType: "number",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Preserves your group's standard suitcase count into the GoSno handoff so GoSno can confirm vehicle cargo fit.",
    drivenByClaimIds: [
      "claim-co-gosno-suv-capacity-and-gear",
      "claim-co-gosno-van-capacity-and-quote",
    ],
    min: 0,
    max: 25,
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.standardBagCount,
  },
  {
    questionId: "skiAndLuggageBagCount",
    label: "Full-length ski/snowboard bags in group",
    helpText:
      "GoSno includes skis, snowboards, boots, and standard luggage at no extra charge when they fit safely inside the vehicle or cargo carrier.",
    inputType: "number",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Flags when passenger + ski-bag combinations require operator cargo-fit confirmation under GoSno's gear_policy and equipment.specific_hardware_layout (verification_state: requires_operator_confirmation) without hard-eliminating viable private vehicles.",
    drivenByClaimIds: [
      "claim-co-gosno-suv-capacity-and-gear",
      "claim-co-gosno-van-capacity-and-quote",
    ],
    min: 0,
    max: 20,
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.skiAndLuggageBagCount,
  },
  {
    questionId: "roofBoxConfirmed",
    label: "Roof cargo box / ski rack confirmed with operator (for 5–6 pax SUV)?",
    helpText:
      "GoSno's specific ski racks and roof cargo boxes depend on physical vehicle assignment (verification_state: requires_operator_confirmation).",
    inputType: "boolean",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "When false with 5–6 passengers and ski bags in an SUV, attaches an operator_confirmation_required qualification reminding the traveler to provide exact passenger, suitcase, and ski-bag counts so GoSno can confirm vehicle/cargo-carrier fit.",
    drivenByClaimIds: ["claim-co-gosno-suv-capacity-and-gear"],
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.roofBoxConfirmed,
  },
  {
    questionId: "roadWeatherScenario",
    label: "I-70 road & traction scenario",
    helpText:
      "C.R.S. § 42-4-106 Traction Law (Code 15) applies Sept 1 – May 31 on I-70.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Applies winter storm travel buffers and highlights statutory Code 15/16 traction compliance.",
    drivenByClaimIds: ["claim-co-i70-traction-law-statutory"],
    options: [
      { value: "clear_dry", label: "Clear / dry pavement" },
      {
        value: "active_snow_code15_traction",
        label: "Winter snow / CDOT Code 15 Traction Law active",
      },
      {
        value: "severe_winter_storm_code16",
        label: "Heavy blizzard / CDOT Code 16 or Eisenhower Tunnel holds",
      },
    ],
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.roadWeatherScenario,
  },
  {
    questionId: "priorityMode",
    label: "Primary decision priority",
    helpText: "What matters most for your mountain transfer?",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Ranks viable options by direct door-to-door convenience, group per-person value, or lowest public transit fare.",
    drivenByClaimIds: ["claim-co-gosno-suv-capacity-and-gear"],
    options: [
      {
        value: "door_to_door_private",
        label: "100% private door-to-door transfer (zero airport waiting)",
      },
      {
        value: "group_value_per_person",
        label: "Best per-person value for our group size",
      },
      {
        value: "lowest_cost_public",
        label: "Lowest cash fare (willing to transfer with luggage)",
      },
    ],
    defaultValue: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT.priorityMode,
  },
];

export const DENVER_MOUNTAIN_COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  {
    dimensionId: "vehicleFormat",
    label: "Vehicle & Service Model",
    description:
      "100% private SUV/van vs. per-seat shared shuttle vs. public rail/coach.",
  },
  {
    dimensionId: "routingType",
    label: "Routing & Transfers",
    description:
      "Direct door-to-door vs. multi-stop lodge loop vs. Union Station / Frisco transfers.",
  },
  {
    dimensionId: "winterTractionCompliance",
    label: "C.R.S. § 42-4-106 Winter Compliance",
    description:
      "Compliance with I-70 Code 15 Traction Law and Code 16 Chain Law.",
  },
  {
    dimensionId: "gearAndSeatRules",
    label: "Ski Gear & Capacity Rules",
    description:
      "Verified passenger seating limits and operator-confirmed ski/luggage cargo policy.",
  },
];

function computeDenverMountainTiming(
  option: CandidateOption,
  input: DenverMountainTransportationInput,
): TimingCalculationResult {
  const weatherPenalty =
    input.roadWeatherScenario === "severe_winter_storm_code16"
      ? 45
      : input.roadWeatherScenario === "active_snow_code15_traction"
        ? 20
        : 0;
  const hubAdjustment =
    option.optionId === "co-mtn-cdot-bustang-pegasus-public" &&
    input.departureHub === "union_station_downtown"
      ? -40
      : 0;

  const transferMinutesRoundTrip = Math.max(
    0,
    option.durationMinutes.typicalTransferEachWay + hubAdjustment,
  );
  const activityMinutes = option.durationMinutes.activity + weatherPenalty;
  const requiredTotalMinutes =
    activityMinutes +
    option.durationMinutes.checkInLead +
    transferMinutesRoundTrip;
  const netSlackMinutes = input.availableWindowMinutes - requiredTotalMinutes;

  return {
    availableWindowMinutes: input.availableWindowMinutes,
    requiredTotalMinutes,
    checkInLeadMinutes: option.durationMinutes.checkInLead,
    transferMinutesRoundTrip,
    activityMinutes,
    returnBufferMinutes: 0,
    netSlackMinutes,
    summary: `Estimated one-way door-to-door time: ${requiredTotalMinutes}m (${activityMinutes}m highway transit incl. +${weatherPenalty}m weather buffer, ${option.durationMinutes.checkInLead}m staging, ${transferMinutesRoundTrip}m connection time).`,
  };
}

export const DENVER_MOUNTAIN_HARD_CONSTRAINT_RULES: HardConstraintRule<DenverMountainTransportationInput>[] =
  [
    {
      ruleId: "hc-co-corridor-coverage",
      label: "Resort Corridor & Route Feed Availability",
      description:
        "Eliminates operators that do not serve the selected mountain corridor or whose vehicle class has status 'currently_unavailable' in the GoSno route feed, and flags quote_only routes.",
      sourceIds: [
        "src-gosno-colorado-tariff-2026",
        "src-epic-mountain-express-rates-2026",
        "src-cdot-bustang-and-rtd-2026",
      ],
      evaluate: (option, input, context) => {
        const gosnoResolution = resolveGoSnoEngineRouteFromFeed(
          input.destinationResort,
          { now: context.now },
        );

        if (
          option.optionId === "co-mtn-gosno-private-suv" ||
          option.optionId === "co-mtn-gosno-private-van"
        ) {
          const vehicleOffer =
            option.optionId === "co-mtn-gosno-private-suv"
              ? gosnoResolution.suv
              : gosnoResolution.van;

          if (vehicleOffer.feedStatus === "currently_unavailable") {
            return {
              passed: false,
              eliminationReason: `${option.shortLabel} has status 'currently_unavailable' on ${vehicleOffer.routeId} (${vehicleOffer.notes || "vehicle class unavailable on this route"}).`,
              whatInputChangeWouldAlterResult:
                "Select GoSno Private SUV (up to 6 passengers per Suburban; groups over 6 use multiple Suburbans on Big Sky routes via https://gosno.co/request-quote).",
            };
          }

          if (
            !vehicleOffer.effectiveOnlineBookable ||
            vehicleOffer.feedStatus === "quote_only"
          ) {
            return {
              passed: true,
              unknownOrStaleWarning: {
                factId: `gosno-route-quote-only-${vehicleOffer.offerId}`,
                optionId: option.optionId,
                category: "operator_confirmation_required",
                summary: `GoSno offer ${vehicleOffer.offerId} has status '${vehicleOffer.feedStatus}' (online_bookable: ${vehicleOffer.feedOnlineBookable}, next_step: '${vehicleOffer.feedNextStep}').`,
                impactOnDecision:
                  vehicleOffer.notes ||
                  `Route ${vehicleOffer.routeId} requires direct quote confirmation via ${vehicleOffer.quoteUrl}.`,
                sourceIds: ["src-gosno-colorado-tariff-2026"],
              },
              decisionChangingWarning: `Route-specific booking eligibility (${vehicleOffer.offerId}): status is '${vehicleOffer.feedStatus}' (online_bookable: false, next_step: '${vehicleOffer.feedNextStep}'); use ${vehicleOffer.quoteUrl} to request a quote.`,
            };
          }

          return { passed: true };
        }

        if (!option.islandsOrRegions.includes(input.destinationResort)) {
          const suvPriceText =
            gosnoResolution.suv.oneWayAmountUsd !== null
              ? `$${gosnoResolution.suv.oneWayAmountUsd}`
              : "quote-confirmed";
          const vanPriceText =
            gosnoResolution.van.oneWayAmountUsd !== null
              ? `$${gosnoResolution.van.oneWayAmountUsd}`
              : "quote-confirmed";
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} does not operate scheduled routes to ${gosnoResolution.suv.destination}.`,
            whatInputChangeWouldAlterResult: `Select a private GoSno SUV (${suvPriceText}) or Van (${vanPriceText}) for direct door-to-door service to ${gosnoResolution.suv.destination}, or choose a Summit/Eagle County corridor.`,
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-co-passenger-and-ski-cargo-capacity",
      label: "Operator-Verified Seating Limit & Cargo Fit Confirmation Policy",
      description:
        "Enforces GoSno's verified passenger seating limits (max 6 pax in SUV, max 10 pax in single van) as hard eliminations, while treating roof-box and ski/luggage bag fit as operator_confirmation_required per GoSno's gear_policy and equipment.specific_hardware_layout (never hard-eliminating an option on unverified bag or roof-box cutoffs).",
      sourceIds: ["src-gosno-colorado-tariff-2026"],
      evaluate: (option, input, context) => {
        const gosnoResolution = resolveGoSnoEngineRouteFromFeed(
          input.destinationResort,
          { now: context.now },
        );

        if (input.groupSize > option.groupCapacityRange.max) {
          const vanPriceStr =
            gosnoResolution.van.oneWayAmountUsd !== null
              ? `$${gosnoResolution.van.oneWayAmountUsd}`
              : "quote-confirmed";
          return {
            passed: false,
            eliminationReason: `Group of ${input.groupSize} passengers exceeds ${option.shortLabel} operator-verified maximum seating_limit of ${option.groupCapacityRange.max} passengers.`,
            whatInputChangeWouldAlterResult:
              input.groupSize <= 10
                ? `Select the GoSno Private 10-Passenger Van (${vanPriceStr} one-way on ${gosnoResolution.routeId}) for groups of 7–10.`
                : "Groups of 11+ passengers exceed a single 10-passenger GoSno van and require multi-vehicle coordination via https://gosno.co/request-quote.",
          };
        }

        if (option.optionId === "co-mtn-gosno-private-suv") {
          const needsCargoOrRoofBoxConfirmation =
            (input.groupSize >= 5 &&
              input.skiAndLuggageBagCount > 0 &&
              !input.roofBoxConfirmed) ||
            input.skiAndLuggageBagCount > 4;

          if (needsCargoOrRoofBoxConfirmation) {
            return {
              passed: true,
              decisionChangingWarning: `Operator cargo-fit confirmation required (verification_state: requires_operator_confirmation): GoSno does not eliminate SUVs on fixed bag or roof-box cutoffs (${gosnoResolution.suv.specificHardwareLayoutNote}). For ${input.groupSize} passenger(s) with ${input.skiAndLuggageBagCount} ski/snowboard bag(s)${!input.roofBoxConfirmed ? " without a pre-confirmed roof box" : ""}, customers must provide accurate passenger, suitcase, and ski-bag counts so GoSno can confirm vehicle fit—or select the 10-passenger Van.`,
            };
          }

          if (input.skiAndLuggageBagCount > 0) {
            return {
              passed: true,
              decisionChangingWarning: `GoSno gear_policy: ${gosnoResolution.suv.gearPolicy}`,
            };
          }

          return { passed: true };
        }

        if (option.optionId === "co-mtn-gosno-private-van") {
          if (input.skiAndLuggageBagCount > 8) {
            return {
              passed: true,
              decisionChangingWarning: `Operator cargo-fit confirmation required (verification_state: requires_operator_confirmation): GoSno does not eliminate vans on a fixed 8-bag cutoff (${gosnoResolution.van.specificHardwareLayoutNote}). With ${input.skiAndLuggageBagCount} ski/snowboard bags for ${input.groupSize} passenger(s), provide accurate passenger, suitcase, and ski-bag counts so GoSno can confirm single-van cargo fit.`,
            };
          }

          const vanOffer = gosnoResolution.van;
          const priceNote =
            vanOffer.oneWayAmountUsd !== null
              ? `$${vanOffer.oneWayAmountUsd} one-way`
              : "quote-only";
          return {
            passed: true,
            decisionChangingWarning: `GoSno ${vanOffer.offerId} (${priceNote}): feed status is '${vanOffer.feedStatus}' (online_bookable: ${vanOffer.feedOnlineBookable}, next_step: '${vanOffer.feedNextStep}'); live date/time slot and ski-gear fit are confirmed at booking (${vanOffer.liveAvailabilityEndpoint || vanOffer.quoteUrl}).`,
          };
        }

        return { passed: true };
      },
    },
    {
      ruleId: "hc-co-departure-hub-compatibility",
      label: "Departure Hub Compatibility",
      description:
        "Eliminates DEN-only airport shuttles when departing from Downtown Denver Union Station.",
      sourceIds: ["src-epic-mountain-express-rates-2026"],
      evaluate: (option, input) => {
        if (!option.departureAreas.includes(input.departureHub)) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} stages at DEN Airport and does not pick up at Downtown Denver Union Station.`,
            whatInputChangeWouldAlterResult:
              "Choose a GoSno private transfer (picks up anywhere in Downtown Denver or DEN) or CDOT Bustang from Union Station.",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-co-wheelchair-accessibility",
      label: "Step-Free Wheelchair Lift Requirement",
      description:
        "Eliminates vehicles without step-free lift capability when step_free_wheelchair is selected.",
      sourceIds: [
        "src-epic-mountain-express-rates-2026",
        "src-cdot-bustang-and-rtd-2026",
      ],
      evaluate: (option, input) => {
        if (
          input.mobilityLevel === "step_free_wheelchair" &&
          !option.accessibilityProfile.stepFreeWheelchairSupported
        ) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} does not have a step-free wheelchair lift (${option.accessibilityProfile.note}).`,
            whatInputChangeWouldAlterResult:
              "Select Epic Mountain Express (with advance ADA lift request) or CDOT Bustang (equipped with wheelchair lifts), or choose limited_mobility if using a collapsible manual chair.",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-co-group-budget-ceiling",
      label: "Total Group One-Way Budget Ceiling",
      description:
        "Eliminates options whose minimum total cost for the group exceeds maxTotalGroupBudgetUsd using the route-specific GoSno feed fare.",
      sourceIds: [
        "src-gosno-colorado-tariff-2026",
        "src-epic-mountain-express-rates-2026",
        "src-cdot-bustang-and-rtd-2026",
      ],
      evaluate: (option, input, context) => {
        if (input.maxTotalGroupBudgetUsd === null) {
          return { passed: true };
        }
        const gosnoResolution = resolveGoSnoEngineRouteFromFeed(
          input.destinationResort,
          { now: context.now },
        );
        const isFlatVehicle =
          option.optionId === "co-mtn-gosno-private-suv" ||
          option.optionId === "co-mtn-gosno-private-van";

        const flatFareUsd =
          option.optionId === "co-mtn-gosno-private-suv"
            ? gosnoResolution.suv.oneWayAmountUsd ??
              gosnoResolution.suv.publishedOneWayAmountUsd
            : option.optionId === "co-mtn-gosno-private-van"
              ? gosnoResolution.van.oneWayAmountUsd ??
                gosnoResolution.van.publishedOneWayAmountUsd
              : null;

        if (isFlatVehicle && flatFareUsd === null) {
          return { passed: true };
        }

        const estGroupMinUsd = isFlatVehicle
          ? (flatFareUsd as number)
          : option.indicativePriceUsd.min * input.groupSize;

        if (estGroupMinUsd > input.maxTotalGroupBudgetUsd) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} costs $${estGroupMinUsd} one-way on ${gosnoResolution.routeId} for ${input.groupSize} traveler(s), exceeding your $${input.maxTotalGroupBudgetUsd} total group budget.`,
            whatInputChangeWouldAlterResult: `Increase maxTotalGroupBudgetUsd to at least $${estGroupMinUsd} or use CDOT Bustang public transit.`,
          };
        }
        return { passed: true };
      },
    },
  ];

export const DENVER_MOUNTAIN_PREFERENCE_RULES: PreferenceRule<DenverMountainTransportationInput>[] =
  [
    {
      ruleId: "pref-co-priority-mode-match",
      label: "Primary Priority Alignment",
      maxPoints: 45,
      evaluate: (option, input, context) => {
        const gosnoResolution = resolveGoSnoEngineRouteFromFeed(
          input.destinationResort,
          { now: context.now },
        );
        const suvUsd = gosnoResolution.suv.oneWayAmountUsd ?? 399;
        const vanUsd = gosnoResolution.van.oneWayAmountUsd ?? 599;

        if (input.priorityMode === "door_to_door_private") {
          if (
            option.optionId === "co-mtn-gosno-private-suv" ||
            option.optionId === "co-mtn-gosno-private-van"
          ) {
            return {
              points: 45,
              reason:
                "Delivers 100% private door-to-door transfer with zero terminal waiting or intermediate hotel stops.",
            };
          }
          return { points: 10, reason: "Shared or multi-transfer routing." };
        }

        if (input.priorityMode === "group_value_per_person") {
          if (
            input.groupSize >= 4 &&
            input.groupSize <= 6 &&
            option.optionId === "co-mtn-gosno-private-suv"
          ) {
            return {
              points: 45,
              reason: `For ${input.groupSize} travelers on ${gosnoResolution.routeId}, a private GoSno SUV ($${suvUsd} flat) costs ~$${(suvUsd / input.groupSize).toFixed(2)}/person—matching or beating door-to-door shared shuttles ($69–$139/guest).`,
            };
          }
          if (
            input.groupSize >= 7 &&
            option.optionId === "co-mtn-gosno-private-van"
          ) {
            return {
              points: 45,
              reason: `For ${input.groupSize} travelers on ${gosnoResolution.routeId}, a single $${vanUsd} private van (~$${(vanUsd / input.groupSize).toFixed(2)}/person) beats booking multiple SUVs or per-seat shuttles.`,
            };
          }
          if (
            input.groupSize <= 2 &&
            option.optionId === "co-mtn-shared-airport-shuttle"
          ) {
            return {
              points: 42,
              reason:
                "Per-seat shared shuttle ($59–$139/guest) keeps total cost lower than a private charter for 1–2 travelers.",
            };
          }
          return { points: 20, reason: "Viable group option." };
        }

        if (
          input.priorityMode === "lowest_cost_public" &&
          option.optionId === "co-mtn-cdot-bustang-pegasus-public"
        ) {
          return {
            points: 45,
            reason:
              "Lowest cash fare on the I-70 corridor ($12–$22 Bustang + $10.50 RTD A-Line + $0 local resort transit).",
          };
        }

        return { points: 15, reason: "Viable corridor option." };
      },
    },
    {
      ruleId: "pref-co-group-size-vehicle-fit",
      label: "Right-Sized Vehicle & Child Seat Convenience",
      maxPoints: 35,
      evaluate: (option, input) => {
        if (
          input.groupSize <= 6 &&
          option.optionId === "co-mtn-gosno-private-suv"
        ) {
          return {
            points: 35,
            reason: `Right-sized 3-row AWD/4WD SUV for ${input.groupSize} passenger(s)${input.needsChildCarSeat ? " with child seat support" : ""}.`,
          };
        }
        if (
          input.groupSize >= 7 &&
          option.optionId === "co-mtn-gosno-private-van"
        ) {
          return {
            points: 35,
            reason: `Keeps all ${input.groupSize} travelers and ski bags in one private vehicle.`,
          };
        }
        if (
          input.groupSize <= 2 &&
          option.optionId === "co-mtn-shared-airport-shuttle"
        ) {
          return {
            points: 30,
            reason: "Economical per-seat shuttle for solo or couple travel.",
          };
        }
        return { points: 15, reason: "Accommodates your party size." };
      },
    },
    {
      ruleId: "pref-co-winter-storm-resilience",
      label: "Winter Storm & Zero-Transfer Reliability",
      maxPoints: 20,
      evaluate: (option, input) => {
        if (
          input.roadWeatherScenario !== "clear_dry" &&
          (option.optionId === "co-mtn-gosno-private-suv" ||
            option.optionId === "co-mtn-gosno-private-van")
        ) {
          return {
            points: 20,
            reason:
              "Direct door-to-door AWD/4WD commercial transfer avoids outdoor transit transfers in snow.",
          };
        }
        return {
          points: 12,
          reason:
            "Operated by commercial winter drivers compliant with C.R.S. § 42-4-106.",
        };
      },
    },
  ];

function appendGoSnoHandoffTripParams(
  rawUrl: string,
  offer: ReconciledGoSnoEngineVehicleOffer,
  input?: DenverMountainTransportationInput,
): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.set("origin", offer.origin);
    parsed.searchParams.set("destination", offer.destination);
    parsed.searchParams.set("direction", offer.tripDirection);
    parsed.searchParams.set(
      "tripType",
      offer.tripType === "ROUND_TRIP" ? "round_trip" : "one_way",
    );
    parsed.searchParams.set("routeId", offer.routeId);
    parsed.searchParams.set("offerId", offer.offerId);
    parsed.searchParams.set("vehicleClass", offer.vehicleClass);
    if (input) {
      if (input.travelDate) {
        parsed.searchParams.set("date", input.travelDate);
      }
      if (input.pickupTime) {
        parsed.searchParams.set("pickupTime", input.pickupTime);
      }
      parsed.searchParams.set("passengers", String(input.groupSize));
      parsed.searchParams.set("passengerCount", String(input.groupSize));
      parsed.searchParams.set("party_size", String(input.groupSize));
      parsed.searchParams.set("standardBags", String(input.standardBagCount));
      parsed.searchParams.set("skiBags", String(input.skiAndLuggageBagCount));
      parsed.searchParams.set(
        "luggage",
        String(input.standardBagCount + input.skiAndLuggageBagCount),
      );
      if (input.returnDate) {
        parsed.searchParams.set("returnDate", input.returnDate);
      }
      if (input.returnPickupTime) {
        parsed.searchParams.set("returnPickupTime", input.returnPickupTime);
      }
    }
    if (offer.returnRouteId) {
      parsed.searchParams.set("returnRouteId", offer.returnRouteId);
    }
    const origPage = input?.originatingPage || "/transportation/colorado";
    parsed.searchParams.set("originatingPage", origPage);
    parsed.searchParams.set("sourcePage", origPage);
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

const GOSNO_SUPPORTED_CONTEXT_PARAMS = [
  "date",
  "partySize",
  "direction",
  "tripType",
  "pickupTime",
  "standardBags",
  "skiBags",
  "luggage",
  "returnDate",
  "returnPickupTime",
  "returnRouteId",
  "originatingPage",
];

function buildRouteSpecificGoSnoBookingDestinations(
  optionId: string,
  offer: ReconciledGoSnoEngineVehicleOffer,
  input?: DenverMountainTransportationInput,
): BookingDestination[] {
  const oneWayText =
    offer.oneWayAmountUsd !== null ? `$${offer.oneWayAmountUsd} One-Way` : "Quote-Only";
  const rtText =
    offer.roundTripAmountUsd !== null
      ? ` / $${offer.roundTripAmountUsd} Round-Trip`
      : "";

  const bookingUrlWithContext = appendGoSnoHandoffTripParams(
    offer.canonicalBookingUrl,
    offer,
    input,
  );
  const quoteUrlWithContext = appendGoSnoHandoffTripParams(
    offer.quoteUrl,
    offer,
    input,
  );

  if (offer.effectiveOnlineBookable) {
    return [
      {
        destinationId: `dest-gosno-${offer.vehicleClass}-online-${offer.routeId.toLowerCase()}`,
        optionId,
        sellerType: "dcc_owned_specialist",
        sellerName: "GoSno",
        actualOperatorName: "GoSno LLC (CO PUC LL-03577)",
        label: `Book ${offer.vehicleClass.toUpperCase()} Online on GoSno (${oneWayText}${rtText})`,
        url: bookingUrlWithContext,
        supportedContextParams: GOSNO_SUPPORTED_CONTEXT_PARAMS,
        relationshipDisclosure: `GoSno (gosno.co) is a DCC portfolio private mountain transportation operator; ${offer.offerId} has status '${offer.feedStatus}' (online_bookable: true, Rezdy ${offer.rezdyProductCode}).`,
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
      {
        destinationId: `dest-gosno-${offer.vehicleClass}-quote-${offer.routeId.toLowerCase()}`,
        optionId,
        sellerType: "dcc_owned_specialist",
        sellerName: "GoSno",
        actualOperatorName: "GoSno LLC (CO PUC LL-03577)",
        label: `Request Custom / Gear-Fit Quote on GoSno (${offer.offerId})`,
        url: quoteUrlWithContext,
        supportedContextParams: GOSNO_SUPPORTED_CONTEXT_PARAMS,
        relationshipDisclosure:
          "Direct GoSno route-specific quote link for custom gear fit or dispatch inquiries.",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ];
  }

  return [
    {
      destinationId: `dest-gosno-${offer.vehicleClass}-quote-${offer.routeId.toLowerCase()}`,
      optionId,
      sellerType: "dcc_owned_specialist",
      sellerName: "GoSno",
      actualOperatorName: "GoSno LLC (CO PUC LL-03577)",
      label: `Request Quote on GoSno (${offer.offerId} — ${oneWayText})`,
      url: quoteUrlWithContext,
      supportedContextParams: GOSNO_SUPPORTED_CONTEXT_PARAMS,
      relationshipDisclosure: `GoSno (gosno.co) is a DCC portfolio private mountain transportation operator; ${offer.offerId} has status '${offer.feedStatus}' (online_bookable: false, next_step: '${offer.feedNextStep}').`,
      isCommercialPartner: true,
      commissionInfluenceOnRanking: 0,
    },
  ];
}

export const DENVER_MOUNTAIN_DECISION_ENGINE: DecisionEngineDefinition<DenverMountainTransportationInput> =
  {
    engineId: "denver-to-mountain-transportation",
    version: "1.1.0",
    slug: "denver-to-mountain-transportation",
    canonicalPath: "/transportation/colorado",
    canonicalUrl: "https://destinationcommandcenter.com/transportation/colorado",
    title: "Denver to Colorado Mountain Resort Transportation Decision Engine",
    destinationName:
      "Denver (DEN / Union Station) to Winter Park, Keystone, Copper, Breckenridge, Vail, Beaver Creek, Steamboat, Aspen, Snowmass & Crested Butte",
    categoryName: "Mountain Corridor Transportation",
    heroQuestion:
      "Should your group book a 100% private GoSno SUV ($349–$699 from DEN) or 10-passenger Van ($499–$899 from DEN), per-seat Epic Mountain Express shuttle ($59–$139/guest), or RTD A-Line + CDOT Bustang public transit ($27.50 DEN–Vail)?",
    summaryDescription:
      "Deterministic I-70 & US-40 mountain transfer evaluator reconciled against GoSno's route-feed snapshot (v1.0), enforcing statutory C.R.S. § 42-4-106 traction rules, verified seating limits (6 SUV / 10 Van), operator-confirmed roof-box/luggage policies, Epic Mountain Express per-seat rates, and RTD A-Line + Bustang public transit math.",
    referenceGuide: {
      importantDecisionFactors: [
        {
          title:
            "Per-Seat Shared Shuttle vs. Flat Private SUV Economics at 4–6 Travelers",
          detail:
            "Epic Mountain Express shared shuttles charge $59–$129/guest (transfer center) or $69–$139/guest (door-to-door). Once a group reaches 4–6 travelers ($276–$834 total), a 100% private GoSno SUV ($349 Winter Park/Keystone/Copper, $399 Breckenridge, $499 Vail, $549 Beaver Creek) often costs less or the same while saving 60–90 minutes of airport holding and hotel stops.",
          sourceIds: [
            "src-gosno-colorado-tariff-2026",
            "src-epic-mountain-express-rates-2026",
          ],
        },
        {
          title:
            "Operator-Verified Passenger Limits (6 SUV / 10 Van) & Cargo-Fit Confirmation Rules",
          detail:
            "GoSno full-size SUVs have a verified seating_limit of 6 passengers and passenger vans have a verified seating_limit of 10 passengers (groups of 11+ require multi-vehicle coordination via https://gosno.co/request-quote). Under GoSno's gear_policy and equipment.specific_hardware_layout (verification_state: 'requires_operator_confirmation'), skis, snowboards, boots, and standard luggage are included at no extra charge when they fit safely inside the vehicle or cargo carrier, and specific ski racks or roof cargo boxes depend on physical vehicle assignment.",
          sourceIds: ["src-gosno-colorado-tariff-2026"],
        },
        {
          title: "Statutory I-70 Traction (Code 15) & Chain (Code 16) Laws",
          detail:
            "Under C.R.S. § 42-4-106, from Sept 1 to May 31 between Dotsero (MP 133) and Morrison (MP 259), all vehicles must have 4WD/AWD or winter/all-weather tires with >= 3/16-inch tread depth (Code 15) or physical chains/AutoSock (Code 16). Standard 2WD airport rental cars frequently fail compliance.",
          sourceIds: ["src-cdot-i70-traction-law-2026"],
        },
      ],
      experienceAndVesselTypes: [
        {
          typeName: "GoSno Private Full-Size AWD/4WD SUV (1–6 Passengers)",
          capacityAndStability:
            "1–6 passengers (verified seating_limit: 6); commercial AWD/4WD with winter tires ($349 Winter Park/Keystone/Copper, $399 Breckenridge, $499 Vail, $549 Beaver Creek, $599 Steamboat, $699 Aspen/Snowmass/Crested Butte)",
          bestFor:
            "Families and groups of 3–6 wanting direct DEN curbside pickup straight to their lodge door",
          limitations:
            "Specific ski racks and roof cargo boxes depend on physical vehicle assignment (verification_state: requires_operator_confirmation); customers provide accurate passenger, suitcase, and ski-bag counts so GoSno can confirm fit",
          sourceIds: ["src-gosno-colorado-tariff-2026"],
        },
        {
          typeName: "GoSno Private 10-Passenger Mountain Van (Up to 10 Pax)",
          capacityAndStability:
            "Up to 10 passengers (verified seating_limit: 10); $499 Winter Park/Keystone, $599 Copper/Breckenridge/Vail, $649 Beaver Creek, $899 Steamboat/Aspen/Snowmass (online_bookable: true on 9 Colorado routes; Crested Butte quote_only; Big Sky unavailable)",
          bestFor:
            "Groups of 7–10 wanting a single private vehicle instead of splitting into two SUVs",
          limitations:
            "Groups of 11+ exceed a single van and require a multi-vehicle quote at https://gosno.co/request-quote; van interior barrier and ski racks depend on physical vehicle assignment",
          sourceIds: ["src-gosno-colorado-tariff-2026"],
        },
        {
          typeName: "Epic Mountain Express Shared Airport Shuttle (Per-Seat)",
          capacityAndStability:
            "10–12 passenger shared van ($59–$139/guest one-way; 2 bags + 1 personal item/guest)",
          bestFor:
            "Solo travelers and couples flying into DEN who want commercial winter driving without paying for a private charter",
          limitations:
            "Airport staging wait + multi-stop lodge loop; does not serve Winter Park, Steamboat, Aspen/Snowmass, Crested Butte, or Big Sky",
          sourceIds: ["src-epic-mountain-express-rates-2026"],
        },
        {
          typeName:
            "Public Transit: RTD A-Line + CDOT Bustang West Line + Free Local Buses",
          capacityAndStability:
            "RTD commuter rail ($10.50) + highway coach ($12–$22) + $0 Summit Stage / Town of Vail bus",
          bestFor:
            "Budget-focused solo travelers ($27.50 total DEN–Vail) comfortable carrying their own gear across transfers",
          limitations:
            "Requires 2–3 transfers between DEN, Union Station, and Frisco/Vail transfer centers",
          sourceIds: ["src-cdot-bustang-and-rtd-2026"],
        },
      ],
      departureLocations: [
        {
          islandOrRegion: "Denver International Airport (DEN)",
          harborOrArea: "Jeppesen Terminal & DEN Transit Center",
          logisticsNote:
            "GoSno private SUVs/vans pick up curbside; Epic Mountain Express stages from DEN commercial lanes; RTD A-Line ($10.50, 37m) departs DEN Transit Center for Union Station.",
          sourceIds: [
            "src-gosno-colorado-tariff-2026",
            "src-epic-mountain-express-rates-2026",
            "src-cdot-bustang-and-rtd-2026",
          ],
        },
        {
          islandOrRegion: "Downtown Denver",
          harborOrArea: "Denver Union Station Underground Bus Concourse",
          logisticsNote:
            "Origin hub for CDOT Bustang West Line ($12–$22 to Frisco / $17 to Vail).",
          sourceIds: ["src-cdot-bustang-and-rtd-2026"],
        },
      ],
      commonTradeoffs: [
        {
          tradeoff: "Shared Per-Seat Shuttle vs. Private GoSno SUV",
          explanation:
            "Shared shuttles save money for 1–2 guests ($59–$139/guest), but at 4–6 guests a private GoSno SUV ($349–$549 flat on I-70/US-40) costs roughly the same per person and leaves immediately for your condo door.",
        },
        {
          tradeoff: "CDOT Bustang Public Transit vs. Door-to-Door Transfer",
          explanation:
            "RTD A-Line + Bustang costs ~$22.50–$27.50 from DEN, but requires carrying ski bags across three transit connections.",
        },
      ],
      operationalDependencies: [
        {
          dependency:
            "C.R.S. § 42-4-106 Traction Law (Code 15) & Chain Law (Code 16)",
          impact:
            "Active Sept 1 – May 31 on I-70 between Dotsero and Morrison; Eisenhower Tunnel holds and Vail Pass safety closures can add 20–60+ minutes during winter storms.",
          sourceIds: ["src-cdot-i70-traction-law-2026"],
        },
      ],
      methodologySteps: [
        "Resolve exact route-specific fares and booking_eligibility from GoSno's route-feed snapshot (v1.0).",
        "Enforce operator-verified passenger seating limits (max 6 pax in SUV, max 10 pax in single van) as hard constraints while surfacing operator_confirmation_required warnings for roof-box and heavy ski-luggage loads per GoSno's gear_policy.",
        "Compare flat-rate private vehicle pricing ($349–$699 SUV, $499–$899 Van) against per-seat Epic Mountain Express ($59–$139/guest) and public transit ($12–$27.50) with zero commercial bias.",
      ],
    },
    questions: DENVER_MOUNTAIN_QUESTIONS,
    answerSchema: DENVER_MOUNTAIN_ANSWER_SCHEMA,
    defaultExampleInput: DENVER_MOUNTAIN_DEFAULT_EXAMPLE_INPUT,
    comparisonDimensions: DENVER_MOUNTAIN_COMPARISON_DIMENSIONS,
    candidateOptions: DENVER_MOUNTAIN_CANDIDATE_OPTIONS,
    hardConstraintRules: DENVER_MOUNTAIN_HARD_CONSTRAINT_RULES,
    preferenceRules: DENVER_MOUNTAIN_PREFERENCE_RULES,
    evidenceClaims: DENVER_MOUNTAIN_EVIDENCE_CLAIMS,
    sourceRecords: DENVER_MOUNTAIN_SOURCE_RECORDS,
    computeTimingForOption: computeDenverMountainTiming,
    customizeBookingDestinations: (option, input) => {
      if (
        option.optionId !== "co-mtn-gosno-private-suv" &&
        option.optionId !== "co-mtn-gosno-private-van"
      ) {
        return option.bookingDestinations;
      }
      const gosnoResolution = resolveGoSnoEngineRouteFromFeed(
        input.destinationResort,
        { direction: input.tripDirection },
      );
      const offer =
        option.optionId === "co-mtn-gosno-private-suv"
          ? gosnoResolution.suv
          : gosnoResolution.van;
      return buildRouteSpecificGoSnoBookingDestinations(
        option.optionId,
        offer,
        input,
      );
    },
    isExampleScenarioDetector: (rawInput, normalized) => {
      const isExample =
        rawInput === undefined ||
        rawInput === null ||
        normalized.travelDate === null;
      return {
        isExample,
        banner: isExample
          ? "Example Scenario Shown: 5 travelers with 4 ski bags (rooftop box confirmed) from DEN Airport to Breckenridge during winter Code 15 traction conditions. Enter your travel date and party size for a personalized verdict."
          : null,
        missingInputFacts:
          normalized.travelDate === null
            ? [
                {
                  factId: "missing-co-mtn-date",
                  optionId: null,
                  category: "missing_traveler_input",
                  summary: "Exact travel date not provided.",
                  impactOnDecision:
                    "Peak/holiday shared shuttle rates and live GoSno date/time slot availability depend on your exact travel date.",
                  sourceIds: ["src-gosno-colorado-tariff-2026"],
                },
              ]
            : [],
      };
    },
    evaluate: (rawInput: unknown, options?: DecisionEvaluateOptions) => {
      const baseResult = evaluateDecisionEngine(
        DENVER_MOUNTAIN_DECISION_ENGINE,
        rawInput,
        options,
      );
      const snapshotState = getActiveGoSnoRouteFeedSnapshotState(
        options?.now ? { nowMs: options.now.getTime() } : undefined,
      );
      const gosnoRouteResolution = resolveGoSnoEngineRouteFromFeed(
        baseResult.normalizedAnswers.destinationResort,
        {
          snapshotState,
          direction: baseResult.normalizedAnswers.tripDirection,
        },
      );
      const gosnoDisplayPricing = getGoSnoRouteSnapshotDisplayPricing({
        routeId: gosnoRouteResolution.outboundRouteId,
        direction:
          baseResult.normalizedAnswers.tripDirection === "RETURN"
            ? "RETURN"
            : "OUTBOUND",
        snapshotState,
      });

      const enrichViableOption = (
        opt: DecisionResult<DenverMountainTransportationInput>["viableOptions"][number],
      ) => {
        if (
          opt.optionId !== "co-mtn-gosno-private-suv" &&
          opt.optionId !== "co-mtn-gosno-private-van"
        ) {
          return opt;
        }
        const offer =
          opt.optionId === "co-mtn-gosno-private-suv"
            ? gosnoRouteResolution.suv
            : gosnoRouteResolution.van;

        const oneWayUsd =
          offer.oneWayAmountUsd ?? offer.publishedOneWayAmountUsd;
        const rtUsd =
          offer.roundTripAmountUsd ?? offer.publishedRoundTripAmountUsd;
        const activeTripUsd =
          offer.tripType === "ROUND_TRIP" && rtUsd !== null ? rtUsd : oneWayUsd;
        const priceSummary =
          oneWayUsd !== null
            ? `$${oneWayUsd} One-Way${rtUsd !== null ? ` / $${rtUsd} Round-Trip` : ""}`
            : "Quote-Only";
        const routeArrow = offer.tripType === "ROUND_TRIP" ? "↔" : "to";

        const dynamicTitle =
          opt.optionId === "co-mtn-gosno-private-suv"
            ? `GoSno Private Full-Size AWD/4WD SUV — ${offer.origin} ${routeArrow} ${offer.destination} (${priceSummary}, Up to ${offer.seatingLimit ?? 6} Pax)`
            : `GoSno Private 10-Passenger Mountain Van — ${offer.origin} ${routeArrow} ${offer.destination} (${priceSummary}, Up to ${offer.seatingLimit ?? 10} Pax)`;

        const dynamicIndicativePrice =
          activeTripUsd !== null
            ? {
                min: activeTripUsd,
                max: activeTripUsd,
                basisLabel: `per private ${offer.vehicleClass.toUpperCase()} ${offer.tripType === "ROUND_TRIP" ? "round-trip" : "one-way"} on ${offer.offerId} (${priceSummary}; status: ${offer.feedStatus}, online_bookable: ${offer.feedOnlineBookable}, next_step: ${offer.feedNextStep}${offer.rezdyProductCode ? `, Rezdy ${offer.rezdyProductCode}` : ""})`,
              }
            : {
                min: 0,
                max: 0,
                basisLabel: `quote-only on ${offer.offerId} (status: ${offer.feedStatus}, online_bookable: ${offer.feedOnlineBookable}, next_step: ${offer.feedNextStep})`,
              };

        const dynamicBookings = buildRouteSpecificGoSnoBookingDestinations(
          opt.optionId,
          offer,
          baseResult.normalizedAnswers,
        );

        return {
          ...opt,
          title: dynamicTitle,
          indicativePriceUsd: dynamicIndicativePrice,
          comparisonValues: {
            ...opt.comparisonValues,
            routingType: `Direct Door-to-Door (${offer.origin} ${offer.tripType === "ROUND_TRIP" ? "<->" : "->"} ${offer.destination}, ${offer.feedStatus}, online_bookable: ${offer.feedOnlineBookable})`,
            gearAndSeatRules:
              opt.optionId === "co-mtn-gosno-private-suv"
                ? `Verified ${offer.seatingLimit ?? 6}-Pax Limit; Skis & Standard Luggage Included When Fitting Safely (Roof Box / Ski Racks: ${offer.specificHardwareVerificationState})`
                : `Verified ${offer.seatingLimit ?? 10}-Pax Limit (11+ Pax Multi-Vehicle Quote); Group Luggage & Ski Gear Subject to Fit (${offer.specificHardwareVerificationState})`,
          },
          bookingDestinations: dynamicBookings,
        };
      };

      const enrichedViableOptions =
        baseResult.viableOptions.map(enrichViableOption);
      const enrichedTourOptions = enrichedViableOptions.filter(
        (o) => o.optionKind !== "public_or_diy",
      );
      const enrichedBestFitOption =
        enrichedTourOptions.length > 0 ? enrichedTourOptions[0] : null;
      const enrichedAlternatives = enrichedViableOptions.filter(
        (o) => o.optionId !== enrichedBestFitOption?.optionId,
      );
      const enrichedAllBookingDestinations = enrichedViableOptions.flatMap(
        (o) => o.bookingDestinations,
      );

      const prefix = baseResult.isExampleScenario
        ? "Example Scenario (enter your travel date and specifics above for a personalized verdict): "
        : "";
      const enrichedConciseVerdict = !enrichedBestFitOption
        ? baseResult.conciseVerdict
        : enrichedBestFitOption.qualificationStatus ===
            "qualified_stale_or_unknown"
          ? `${prefix}No unqualified positive recommendation can be issued because required schedule, route quote, or operator cargo-fit confirmation is required. Top qualified option requiring direct confirmation: ${enrichedBestFitOption.title} (preference score ${enrichedBestFitOption.preferenceScore}; ${enrichedBestFitOption.timingCalculation.summary}).`
          : `${prefix}Best fit is ${enrichedBestFitOption.title} (preference score ${enrichedBestFitOption.preferenceScore}; ${enrichedBestFitOption.timingCalculation.summary}). ${enrichedTourOptions.length} tour option(s) passed all hard constraints and ${baseResult.eliminatedOptions.length} incompatible option(s) were eliminated.`;

      return {
        ...baseResult,
        conciseVerdict: enrichedConciseVerdict,
        bestFitOption: enrichedBestFitOption,
        viableOptions: enrichedViableOptions,
        alternatives: enrichedAlternatives,
        bookingDestinations: enrichedAllBookingDestinations,
        categorySpecificMeta: {
          gosnoRouteSnapshot: gosnoDisplayPricing,
          gosnoReconciledRouteResolution: gosnoRouteResolution,
          exceedsSingleGoSnoVan: baseResult.normalizedAnswers.groupSize > 10,
          multiVehicleQuoteUrl:
            baseResult.normalizedAnswers.groupSize > 10
              ? "https://gosno.co/request-quote"
              : null,
        },
      };
    },
  };
