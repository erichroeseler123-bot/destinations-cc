import {
  DccBookingService,
  DccBookingHoldRequest,
  DccBookingConfirmRequest,
} from "@/lib/bookings";
import {
  OctoBookingResult,
  OctoConfirmBookingParams,
  OctoCreateHoldParams,
  OctoUnitItemRequest,
} from "./types";

export type InitiateHoldRequest = DccBookingHoldRequest;
export type ConfirmReservationRequest = DccBookingConfirmRequest;

/**
 * OctoBookingService acts as the inbound OCTO protocol gateway,
 * delegating domain execution to DccBookingService and DccOrderService.
 */
export class OctoBookingService {
  static resolveConnectionForProduct(productId: string): Promise<string> {
    return DccBookingService.resolveConnectionForProduct(productId);
  }

  static getAdapterForConnection(connectionId: string) {
    return DccBookingService.getAdapterForConnection(connectionId);
  }

  static createHold(params: DccBookingHoldRequest): Promise<OctoBookingResult & { dccBookingId: string }> {
    return DccBookingService.createHold(params);
  }

  static confirmReservation(params: DccBookingConfirmRequest): Promise<OctoBookingResult> {
    return DccBookingService.confirmReservation(params);
  }

  static getBooking(bookingIdOrUuid: string, options?: { resellerId?: string }): Promise<OctoBookingResult> {
    return DccBookingService.getBooking(bookingIdOrUuid, options);
  }

  static listBookings(options?: { resellerId?: string; status?: string; limit?: number }): Promise<OctoBookingResult[]> {
    return DccBookingService.listBookings(options);
  }

  static updateBooking(
    bookingIdOrUuid: string,
    patch: { contact?: any; notes?: string },
    options?: { resellerId?: string }
  ): Promise<OctoBookingResult> {
    return DccBookingService.updateBooking(bookingIdOrUuid, patch, options);
  }

  static cancelBooking(
    bookingIdOrUuid: string,
    params?: { reason?: string } | string,
    options?: { resellerId?: string }
  ): Promise<OctoBookingResult> {
    return DccBookingService.cancelBooking(bookingIdOrUuid, params, options);
  }

  static cancelReservation(
    bookingIdOrUuid: string,
    params?: { reason?: string } | string,
    options?: { resellerId?: string }
  ): Promise<OctoBookingResult> {
    return DccBookingService.cancelBooking(bookingIdOrUuid, params, options);
  }
}
