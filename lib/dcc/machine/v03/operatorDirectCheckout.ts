import { rfc8785Canonicalize, sha256HexFull } from "./rfc8785AndJws";
import {
  evaluateCruiseTimingWindow,
  type CruiseTimingEvaluationResult,
} from "../../cruiseTimingGate";

export type DirectCheckoutBookingPath =
  | "REZGO_TRACKED_CHECKOUT"
  | "REZGO_RESELLER_API"
  | "RESERVED_SEAT_BLOCK_MANUAL_DISPATCH"
  | "FAREHARBOR_ASN_EMBED"
  | "FAREHARBOR_SUPPLIER_API"
  | "VIATOR_APPROVED_CHECKOUT";

export type SeatLockSource = "PROVIDER_CHECKOUT" | "RESERVED_SEAT_BLOCK";

export type DirectBookingDisplayStatus =
  | "Hold active (15m)"
  | "Booking requested"
  | "Confirmed"
  | "Sold out"
  | "Hold expired"
  | "Duplicate submission"
  | "Canceled";

export interface DccTripContextEnvelope {
  /** Must start with `dcc_ctx_` */
  contextId: string;
  portSlug: "juneau" | "new-orleans" | string;
  serviceDate: string; // YYYY-MM-DD
  partySize: number;
  shipName?: string | null;
  berthCode?: string | null;
  claaArrivalLocal?: string | null;
  claaDepartureLocal?: string | null;
  confirmedAllAboardLocal?: string | null;
  flightCanceled?: boolean;
  operatorCancelRef?: string | null;
}

export interface OperatorDirectDealConfig {
  operatorId: string;
  operatorName: string;
  market: "juneau" | "new-orleans";
  bookingPath: DirectCheckoutBookingPath;
  directCheckoutEnabled: boolean;
  pendingReason?: string;
  seatLockSource: SeatLockSource;
  supports15MinuteHold: boolean;
  manualDispatchRequired: boolean;
  /** Standard 10% direct deal rate (0.10) */
  commissionRateDecimal: number;
  commissionBasis: "BASE_FARE_EXCL_TAX_FEES" | "GROSS_RETAIL";
  paymentAndRefundHandler: "OPERATOR_MERCHANT_OF_RECORD" | "DCC_STRIPE_CONNECT" | "VIATOR_MERCHANT";
  credentialScope: "SERVER_SIDE_SCOPED_ONLY" | "PUBLIC_TRACKED_LINK";
  fareharborSupplierApproved?: boolean;
  providerConfirmedSeats: boolean;
  exclusiveSeatBlockCapacity?: number | null;
  unsoldSeatReleaseHoursBeforeDeparture?: number | null;
}

export const OPERATOR_DIRECT_CHECKOUT_REGISTRY: Record<string, OperatorDirectDealConfig> = {
  "juneau-tours-whale-watch": {
    operatorId: "juneau-tours-whale-watch",
    operatorName: "Juneau Tours & Whale Watch",
    market: "juneau",
    bookingPath: "REZGO_TRACKED_CHECKOUT",
    directCheckoutEnabled: false,
    pendingReason:
      "Pending owner sign-off today on 10% direct deal (Choice 1: tracked Rezgo checkout link / Rezgo reseller connection; Choice 2: exclusive reserved seat block with manual dispatch confirmation).",
    seatLockSource: "RESERVED_SEAT_BLOCK",
    supports15MinuteHold: true,
    manualDispatchRequired: true,
    commissionRateDecimal: 0.1,
    commissionBasis: "BASE_FARE_EXCL_TAX_FEES",
    paymentAndRefundHandler: "OPERATOR_MERCHANT_OF_RECORD",
    credentialScope: "SERVER_SIDE_SCOPED_ONLY",
    providerConfirmedSeats: true,
    exclusiveSeatBlockCapacity: 12,
    unsoldSeatReleaseHoursBeforeDeparture: 2,
  },
  "alaska-galore-whale-331813P1": {
    operatorId: "alaska-galore-whale-331813P1",
    operatorName: "Alaska Galore Tours (Approved Viator #331813P1)",
    market: "juneau",
    bookingPath: "VIATOR_APPROVED_CHECKOUT",
    directCheckoutEnabled: true,
    seatLockSource: "PROVIDER_CHECKOUT",
    supports15MinuteHold: true,
    manualDispatchRequired: false,
    commissionRateDecimal: 0.08,
    commissionBasis: "GROSS_RETAIL",
    paymentAndRefundHandler: "VIATOR_MERCHANT",
    credentialScope: "PUBLIC_TRACKED_LINK",
    providerConfirmedSeats: false,
  },
  "gray-line-new-orleans": {
    operatorId: "gray-line-new-orleans",
    operatorName: "Gray Line / New Orleans Steamboat Company",
    market: "new-orleans",
    bookingPath: "FAREHARBOR_ASN_EMBED",
    directCheckoutEnabled: true,
    seatLockSource: "PROVIDER_CHECKOUT",
    supports15MinuteHold: true,
    manualDispatchRequired: false,
    commissionRateDecimal: 0.1,
    commissionBasis: "BASE_FARE_EXCL_TAX_FEES",
    paymentAndRefundHandler: "OPERATOR_MERCHANT_OF_RECORD",
    credentialScope: "PUBLIC_TRACKED_LINK",
    fareharborSupplierApproved: true,
    providerConfirmedSeats: false,
  },
  "ragin-cajun-tours": {
    operatorId: "ragin-cajun-tours",
    operatorName: "Ragin Cajun Tours",
    market: "new-orleans",
    bookingPath: "FAREHARBOR_ASN_EMBED",
    directCheckoutEnabled: true,
    seatLockSource: "PROVIDER_CHECKOUT",
    supports15MinuteHold: true,
    manualDispatchRequired: false,
    commissionRateDecimal: 0.1,
    commissionBasis: "BASE_FARE_EXCL_TAX_FEES",
    paymentAndRefundHandler: "OPERATOR_MERCHANT_OF_RECORD",
    credentialScope: "PUBLIC_TRACKED_LINK",
    fareharborSupplierApproved: true,
    providerConfirmedSeats: false,
  },
  "southern-style-tours": {
    operatorId: "southern-style-tours",
    operatorName: "Southern Style Tours",
    market: "new-orleans",
    bookingPath: "FAREHARBOR_ASN_EMBED",
    directCheckoutEnabled: true,
    seatLockSource: "PROVIDER_CHECKOUT",
    supports15MinuteHold: true,
    manualDispatchRequired: false,
    commissionRateDecimal: 0.1,
    commissionBasis: "BASE_FARE_EXCL_TAX_FEES",
    paymentAndRefundHandler: "OPERATOR_MERCHANT_OF_RECORD",
    credentialScope: "PUBLIC_TRACKED_LINK",
    fareharborSupplierApproved: true,
    providerConfirmedSeats: false,
  },
};

export interface DepartureInventoryRecord {
  departureId: string;
  operatorId: string;
  serviceDate: string;
  departureLocal: string; // HH:MM
  durationMinutes: number;
  baseFarePerSeatUsd: number;
  taxesAndFeesPerSeatUsd: number;
  seatLockSource: SeatLockSource;
  providerConfirmedSeats: boolean;
  totalConfirmedSeats: number;
  remainingSeats: number;
}

export interface DirectCheckoutReservationRecord {
  reservationId: string;
  idempotencyKey: string;
  dccContextId: string;
  tripContext: DccTripContextEnvelope;
  operatorId: string;
  departureId: string;
  partySize: number;
  seatLockSource: SeatLockSource;
  seatLockToken: string;
  supports15MinuteHold: boolean;
  createdAtIso: string;
  holdExpiresAtIso: string | null;
  displayStatus: DirectBookingDisplayStatus;
  cruiseTimingEvaluation: CruiseTimingEvaluationResult;
  baseFareTotalUsd: number;
  grossTotalUsd: number;
  expectedCommissionUsd: number;
  settledCommissionUsd: number;
  operatorDispatchConfirmationRef: string | null;
}

export interface DirectCheckoutAttemptOutcome {
  ok: boolean;
  code:
    | "HOLD_CREATED"
    | "BOOKING_REQUESTED"
    | "CONFIRMED"
    | "SOLD_OUT_DEPARTURE"
    | "HOLD_EXPIRED"
    | "DUPLICATE_SUBMISSION"
    | "CANCELED"
    | "SUPPLIER_APPROVAL_REQUIRED"
    | "INVALID_DCC_CTX";
  displayStatus: DirectBookingDisplayStatus;
  seatCountDisplay: string | null;
  reservation?: DirectCheckoutReservationRecord;
  reason: string;
}

export interface DirectCheckoutLedgerSummary {
  /** Referrals tracked separately from confirmed bookings and commission */
  dccReferralsCount: number;
  activeHoldsCount: number;
  bookingRequestedCount: number;
  confirmedBookingsCount: number;
  canceledBookingsCount: number;
  expiredHoldsCount: number;
  duplicateSubmissionsBlocked: number;
  soldOutRejectionsCount: number;
  pendingCommissionUsd: number;
  settledCommissionUsd: number;
}

export const FIFTEEN_MINUTE_HOLD_SECONDS = 15 * 60; // 900 seconds

export class V03OperatorDirectCheckoutEngine {
  private readonly operators = new Map<string, OperatorDirectDealConfig>();
  private readonly departures = new Map<string, DepartureInventoryRecord>();
  private readonly reservationsById = new Map<string, DirectCheckoutReservationRecord>();
  private readonly reservationsByIdempotencyKey = new Map<string, string>();
  private readonly referralEvents: Array<{
    referralId: string;
    dccContextId: string;
    operatorId: string;
    departureId: string;
    recordedAtIso: string;
  }> = [];

  private duplicateSubmissionsBlocked = 0;
  private soldOutRejectionsCount = 0;
  private expiredHoldsCount = 0;

  constructor(initialOperators?: OperatorDirectDealConfig[]) {
    const ops = initialOperators ?? Object.values(OPERATOR_DIRECT_CHECKOUT_REGISTRY);
    for (const op of ops) {
      this.operators.set(op.operatorId, { ...op });
    }
  }

  public registerDeparture(departure: DepartureInventoryRecord): void {
    this.departures.set(departure.departureId, { ...departure });
  }

  public getDeparture(departureId: string): DepartureInventoryRecord | undefined {
    const d = this.departures.get(departureId);
    return d ? { ...d } : undefined;
  }

  /**
   * Returns a formatted seat count string ONLY when the provider explicitly confirms seat counts.
   */
  public getProviderConfirmedSeatDisplay(departureId: string): string | null {
    const dep = this.departures.get(departureId);
    if (!dep || !dep.providerConfirmedSeats) {
      return null;
    }
    return `${dep.remainingSeats} provider-confirmed ${
      dep.remainingSeats === 1 ? "seat" : "seats"
    } remaining`;
  }

  /**
   * Tracks a DCC outbound referral separately from confirmed bookings and commission.
   */
  public recordDccReferral(params: {
    dccContextId: string;
    operatorId: string;
    departureId: string;
    nowIso?: string;
  }): { referralId: string; dccReferralsCount: number } {
    if (!params.dccContextId.startsWith("dcc_ctx_")) {
      throw new Error(`dccContextId must start with "dcc_ctx_", got "${params.dccContextId}"`);
    }
    const nowIso = params.nowIso || new Date().toISOString();
    const referralId = `ref_${sha256HexFull(
      rfc8785Canonicalize({
        dccContextId: params.dccContextId,
        operatorId: params.operatorId,
        departureId: params.departureId,
        seq: this.referralEvents.length + 1,
      }),
    ).slice(0, 20)}`;

    this.referralEvents.push({
      referralId,
      dccContextId: params.dccContextId,
      operatorId: params.operatorId,
      departureId: params.departureId,
      recordedAtIso: nowIso,
    });

    return {
      referralId,
      dccReferralsCount: this.referralEvents.length,
    };
  }

  /**
   * Initiates a direct checkout seat lock / hold or manual dispatch request.
   * - Validates `dcc_ctx_` trip details.
   * - Enforces FareHarbor supplier approval when bookingPath === "FAREHARBOR_SUPPLIER_API".
   * - Detects and blocks duplicate submissions via `idempotencyKey`.
   * - Rejects sold-out departures when `remainingSeats < partySize`.
   * - Applies a 15-minute hold (`900` seconds) where supported.
   * - Sets displayStatus to `"Booking requested"` when `manualDispatchRequired === true`.
   */
  public submitDirectCheckout(params: {
    idempotencyKey: string;
    tripContext: DccTripContextEnvelope;
    operatorId: string;
    departureId: string;
    nowIso?: string;
  }): DirectCheckoutAttemptOutcome {
    const { idempotencyKey, tripContext, operatorId, departureId } = params;
    const nowIso = params.nowIso || new Date().toISOString();

    if (!tripContext.contextId || !tripContext.contextId.startsWith("dcc_ctx_")) {
      return {
        ok: false,
        code: "INVALID_DCC_CTX",
        displayStatus: "Canceled",
        seatCountDisplay: null,
        reason: "Trip context ID must carry the dcc_ctx_ prefix.",
      };
    }

    const operator = this.operators.get(operatorId);
    if (!operator) {
      throw new Error(`Unknown operatorId: ${operatorId}`);
    }

    if (
      operator.bookingPath === "FAREHARBOR_SUPPLIER_API" &&
      operator.fareharborSupplierApproved !== true
    ) {
      return {
        ok: false,
        code: "SUPPLIER_APPROVAL_REQUIRED",
        displayStatus: "Booking requested",
        seatCountDisplay: null,
        reason: "FareHarbor API bookings require explicit supplier approval.",
      };
    }

    // Duplicate submission check (idempotency)
    const existingReservationId = this.reservationsByIdempotencyKey.get(idempotencyKey);
    if (existingReservationId) {
      this.duplicateSubmissionsBlocked += 1;
      const existing = this.reservationsById.get(existingReservationId)!;
      return {
        ok: false,
        code: "DUPLICATE_SUBMISSION",
        displayStatus: "Duplicate submission",
        seatCountDisplay: this.getProviderConfirmedSeatDisplay(departureId),
        reservation: { ...existing },
        reason: `Duplicate submission blocked for idempotencyKey="${idempotencyKey}" (existing reservation ${existing.reservationId}).`,
      };
    }

    const departure = this.departures.get(departureId);
    if (!departure) {
      throw new Error(`Unknown departureId: ${departureId}`);
    }

    // Reap any expired holds on this departure before checking availability
    this.expireStaleHolds(nowIso);

    if (departure.remainingSeats <= 0 || departure.remainingSeats < tripContext.partySize) {
      this.soldOutRejectionsCount += 1;
      return {
        ok: false,
        code: "SOLD_OUT_DEPARTURE",
        displayStatus: "Sold out",
        seatCountDisplay: this.getProviderConfirmedSeatDisplay(departureId),
        reason: `Departure ${departureId} has ${departure.remainingSeats} seats remaining; cannot lock ${tripContext.partySize} seats.`,
      };
    }

    // Lock seats from provider checkout or reserved seat block
    departure.remainingSeats -= tripContext.partySize;

    const nowMs = Date.parse(nowIso);
    const holdExpiresAtIso = operator.supports15MinuteHold
      ? new Date(nowMs + FIFTEEN_MINUTE_HOLD_SECONDS * 1000).toISOString()
      : null;

    const timingEval = evaluateCruiseTimingWindow({
      claaArrivalLocal: tripContext.claaArrivalLocal,
      claaDepartureLocal: tripContext.claaDepartureLocal,
      confirmedAllAboardLocal: tripContext.confirmedAllAboardLocal,
      berthCode: tripContext.berthCode,
      tourDepartureLocal: departure.departureLocal,
      tourDurationMinutes: departure.durationMinutes,
      providerConfirmedSeats: departure.providerConfirmedSeats,
      providerSeatCount: departure.remainingSeats,
    });

    const baseFareTotalUsd = Number(
      (departure.baseFarePerSeatUsd * tripContext.partySize).toFixed(2),
    );
    const grossTotalUsd = Number(
      (
        (departure.baseFarePerSeatUsd + departure.taxesAndFeesPerSeatUsd) *
        tripContext.partySize
      ).toFixed(2),
    );
    const commissionableAmount =
      operator.commissionBasis === "BASE_FARE_EXCL_TAX_FEES"
        ? baseFareTotalUsd
        : grossTotalUsd;
    const expectedCommissionUsd = Number(
      (commissionableAmount * operator.commissionRateDecimal).toFixed(2),
    );

    const reservationId = `res_${sha256HexFull(
      rfc8785Canonicalize({
        idempotencyKey,
        dccContextId: tripContext.contextId,
        operatorId,
        departureId,
      }),
    ).slice(0, 20)}`;

    const seatLockToken = `lock_${operator.seatLockSource.toLowerCase()}_${reservationId.slice(4, 16)}`;

    const displayStatus: DirectBookingDisplayStatus = operator.manualDispatchRequired
      ? "Booking requested"
      : "Confirmed";

    const reservation: DirectCheckoutReservationRecord = {
      reservationId,
      idempotencyKey,
      dccContextId: tripContext.contextId,
      tripContext: { ...tripContext },
      operatorId,
      departureId,
      partySize: tripContext.partySize,
      seatLockSource: operator.seatLockSource,
      seatLockToken,
      supports15MinuteHold: operator.supports15MinuteHold,
      createdAtIso: nowIso,
      holdExpiresAtIso,
      displayStatus,
      cruiseTimingEvaluation: timingEval,
      baseFareTotalUsd,
      grossTotalUsd,
      expectedCommissionUsd,
      settledCommissionUsd: 0,
      operatorDispatchConfirmationRef: operator.manualDispatchRequired
        ? null
        : `AUTO-${reservationId.slice(4, 12).toUpperCase()}`,
    };

    this.reservationsById.set(reservationId, reservation);
    this.reservationsByIdempotencyKey.set(idempotencyKey, reservationId);

    return {
      ok: true,
      code: operator.manualDispatchRequired ? "BOOKING_REQUESTED" : "CONFIRMED",
      displayStatus,
      seatCountDisplay: this.getProviderConfirmedSeatDisplay(departureId),
      reservation: { ...reservation },
      reason: operator.manualDispatchRequired
        ? "Booking requested — 15-minute seat block hold active while awaiting operator dispatch confirmation."
        : "Direct checkout confirmed with provider seat lock.",
    };
  }

  /**
   * Confirms a manual-dispatch reservation (`Booking requested` -> `Confirmed`) if its 15-minute hold has not expired.
   */
  public confirmManualDispatchBooking(params: {
    reservationId: string;
    operatorDispatchConfirmationRef: string;
    nowIso?: string;
    settleCommissionImmediately?: boolean;
  }): DirectCheckoutAttemptOutcome {
    const nowIso = params.nowIso || new Date().toISOString();
    this.expireStaleHolds(nowIso);

    const reservation = this.reservationsById.get(params.reservationId);
    if (!reservation) {
      throw new Error(`Unknown reservationId: ${params.reservationId}`);
    }

    if (reservation.displayStatus === "Hold expired") {
      return {
        ok: false,
        code: "HOLD_EXPIRED",
        displayStatus: "Hold expired",
        seatCountDisplay: this.getProviderConfirmedSeatDisplay(reservation.departureId),
        reservation: { ...reservation },
        reason: `15-minute hold expired at ${reservation.holdExpiresAtIso}; seats were returned to inventory.`,
      };
    }

    if (reservation.displayStatus === "Canceled") {
      return {
        ok: false,
        code: "CANCELED",
        displayStatus: "Canceled",
        seatCountDisplay: this.getProviderConfirmedSeatDisplay(reservation.departureId),
        reservation: { ...reservation },
        reason: "Cannot confirm a canceled reservation.",
      };
    }

    reservation.displayStatus = "Confirmed";
    reservation.operatorDispatchConfirmationRef = params.operatorDispatchConfirmationRef;
    if (params.settleCommissionImmediately) {
      reservation.settledCommissionUsd = reservation.expectedCommissionUsd;
    }

    return {
      ok: true,
      code: "CONFIRMED",
      displayStatus: "Confirmed",
      seatCountDisplay: this.getProviderConfirmedSeatDisplay(reservation.departureId),
      reservation: { ...reservation },
      reason: `Operator dispatch confirmed booking (${params.operatorDispatchConfirmationRef}).`,
    };
  }

  /**
   * Cancels an active hold or confirmed reservation and returns seats to the departure inventory.
   */
  public cancelReservation(params: {
    reservationId: string;
    reason: string;
    nowIso?: string;
  }): DirectCheckoutAttemptOutcome {
    const reservation = this.reservationsById.get(params.reservationId);
    if (!reservation) {
      throw new Error(`Unknown reservationId: ${params.reservationId}`);
    }

    if (
      reservation.displayStatus !== "Canceled" &&
      reservation.displayStatus !== "Hold expired"
    ) {
      const departure = this.departures.get(reservation.departureId);
      if (departure) {
        departure.remainingSeats = Math.min(
          departure.totalConfirmedSeats,
          departure.remainingSeats + reservation.partySize,
        );
      }
    }

    reservation.displayStatus = "Canceled";
    reservation.settledCommissionUsd = 0;

    return {
      ok: true,
      code: "CANCELED",
      displayStatus: "Canceled",
      seatCountDisplay: this.getProviderConfirmedSeatDisplay(reservation.departureId),
      reservation: { ...reservation },
      reason: `Reservation ${reservation.reservationId} canceled (${params.reason}); locked seats returned to inventory.`,
    };
  }

  /**
   * Expires any `Booking requested` / `Hold active (15m)` reservations whose 15-minute hold window has elapsed.
   */
  public expireStaleHolds(nowIso?: string): number {
    const nowMs = Date.parse(nowIso || new Date().toISOString());
    let expiredCount = 0;

    for (const reservation of this.reservationsById.values()) {
      if (
        (reservation.displayStatus === "Booking requested" ||
          reservation.displayStatus === "Hold active (15m)") &&
        reservation.holdExpiresAtIso
      ) {
        const expMs = Date.parse(reservation.holdExpiresAtIso);
        if (Number.isFinite(expMs) && nowMs > expMs) {
          reservation.displayStatus = "Hold expired";
          this.expiredHoldsCount += 1;
          expiredCount += 1;
          const departure = this.departures.get(reservation.departureId);
          if (departure) {
            departure.remainingSeats = Math.min(
              departure.totalConfirmedSeats,
              departure.remainingSeats + reservation.partySize,
            );
          }
        }
      }
    }

    return expiredCount;
  }

  /**
   * Settles commission on a confirmed reservation after fulfillment.
   */
  public settleConfirmedCommission(reservationId: string): number {
    const reservation = this.reservationsById.get(reservationId);
    if (!reservation || reservation.displayStatus !== "Confirmed") {
      throw new Error(`Reservation ${reservationId} must be in Confirmed status before settling commission.`);
    }
    reservation.settledCommissionUsd = reservation.expectedCommissionUsd;
    return reservation.settledCommissionUsd;
  }

  /**
   * Returns the separated ledger metrics:
   * - DCC referrals tracked separately from
   * - Booking requested (manual dispatch pending)
   * - Confirmed bookings
   * - Pending vs. settled commission
   */
  public getDirectCheckoutLedgerSummary(): DirectCheckoutLedgerSummary {
    let activeHoldsCount = 0;
    let bookingRequestedCount = 0;
    let confirmedBookingsCount = 0;
    let canceledBookingsCount = 0;
    let pendingCommissionUsd = 0;
    let settledCommissionUsd = 0;

    for (const res of this.reservationsById.values()) {
      if (res.displayStatus === "Hold active (15m)") {
        activeHoldsCount += 1;
      } else if (res.displayStatus === "Booking requested") {
        bookingRequestedCount += 1;
        pendingCommissionUsd += res.expectedCommissionUsd;
      } else if (res.displayStatus === "Confirmed") {
        confirmedBookingsCount += 1;
        if (res.settledCommissionUsd > 0) {
          settledCommissionUsd += res.settledCommissionUsd;
        } else {
          pendingCommissionUsd += res.expectedCommissionUsd;
        }
      } else if (res.displayStatus === "Canceled") {
        canceledBookingsCount += 1;
      }
    }

    return {
      dccReferralsCount: this.referralEvents.length,
      activeHoldsCount,
      bookingRequestedCount,
      confirmedBookingsCount,
      canceledBookingsCount,
      expiredHoldsCount: this.expiredHoldsCount,
      duplicateSubmissionsBlocked: this.duplicateSubmissionsBlocked,
      soldOutRejectionsCount: this.soldOutRejectionsCount,
      pendingCommissionUsd: Number(pendingCommissionUsd.toFixed(2)),
      settledCommissionUsd: Number(settledCommissionUsd.toFixed(2)),
    };
  }
}
