import {
  OctoAvailabilitySlot,
  OctoBookingResult,
  OctoConfirmBookingParams,
  OctoCreateHoldParams,
  OctoProduct,
  OctoReservationPlatform,
  OctoSupplierConnection,
  OctoUnitItemRequest,
} from "@/lib/octo/types";

export interface OctoClientConfig {
  endpoint: string;
  apiKey?: string;
  bearerToken?: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  platform?: OctoReservationPlatform;
  operatorSlug?: string;
  isSandbox?: boolean;
}

export interface OctoProviderAdapter {
  platform: OctoReservationPlatform;
  getSupplier(): Promise<Record<string, unknown>>;
  getProducts(): Promise<OctoProduct[]>;
  getProduct(productId: string): Promise<OctoProduct>;
  getAvailabilityCalendar(
    productId: string,
    optionId: string,
    localDateStart: string,
    localDateEnd: string
  ): Promise<OctoAvailabilitySlot[]>;
  checkAvailability(
    productId: string,
    optionId: string,
    localDate: string,
    unitItems?: OctoUnitItemRequest[]
  ): Promise<OctoAvailabilitySlot[]>;
  createBookingHold(
    params: OctoCreateHoldParams,
    idempotencyKey?: string
  ): Promise<OctoBookingResult>;
  confirmBooking(
    uuid: string,
    params: OctoConfirmBookingParams,
    idempotencyKey?: string
  ): Promise<OctoBookingResult>;
  getBooking(uuid: string): Promise<OctoBookingResult>;
  updateBooking(
    uuid: string,
    patch: Partial<OctoBookingResult>,
    idempotencyKey?: string
  ): Promise<OctoBookingResult>;
  cancelBooking(
    uuid: string,
    reason?: string,
    idempotencyKey?: string
  ): Promise<OctoBookingResult>;
}
