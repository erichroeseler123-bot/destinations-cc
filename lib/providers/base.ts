import {
  OctoAvailabilitySlot,
  OctoBookingResult,
  OctoConfirmBookingParams,
  OctoCreateHoldParams,
  OctoProduct,
  OctoReservationPlatform,
  OctoUnitItemRequest,
} from "@/lib/octo/types";
import { OctoClientConfig, OctoProviderAdapter } from "./types";

export class OctoApiError extends Error {
  public status: number;
  public octoError: string;
  public details?: unknown;

  constructor(status: number, octoError: string, message: string, details?: unknown) {
    super(`OCTO Error [${status}] ${octoError}: ${message}`);
    this.name = "OctoApiError";
    this.status = status;
    this.octoError = octoError;
    this.details = details;
  }
}

export class BaseOctoAdapter implements OctoProviderAdapter {
  public platform: OctoReservationPlatform;
  protected endpoint: string;
  protected apiKey?: string;
  protected bearerToken?: string;
  protected timeoutMs: number;
  protected customHeaders: Record<string, string>;
  protected operatorSlug?: string;
  protected isSandbox: boolean;

  constructor(config: OctoClientConfig) {
    this.platform = config.platform || "direct_octo";
    this.endpoint = config.endpoint.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.bearerToken = config.bearerToken;
    this.timeoutMs = config.timeoutMs ?? 8000;
    this.customHeaders = config.headers ?? {};
    this.operatorSlug = config.operatorSlug;
    this.isSandbox = Boolean(config.isSandbox);
  }

  protected getAuthHeaders(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "DestinationCommandCenter-OCTO-Core/1.2",
      "Octo-Capabilities": "octo/core",
      "Octo-Env": this.isSandbox ? "test" : "live",
      ...this.customHeaders,
    };

    if (this.bearerToken) {
      headers["Authorization"] = `Bearer ${this.bearerToken}`;
    } else if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      headers["X-API-Key"] = this.apiKey;
    }

    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    return headers;
  }

  protected async request<T>(
    path: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: unknown,
    idempotencyKey?: string
  ): Promise<T> {
    const url = `${this.endpoint}${path.startsWith("/") ? path : `/${path}`}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers: this.getAuthHeaders(idempotencyKey),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        let errJson: any = null;
        try {
          errJson = await res.json();
        } catch {
          // ignore non-json
        }

        const octoError = errJson?.error || errJson?.code || `HTTP_${res.status}`;
        const message = errJson?.errorMessage || errJson?.message || res.statusText;
        throw new OctoApiError(res.status, octoError, message, errJson);
      }

      return (await res.json()) as T;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new OctoApiError(504, "PROVIDER_TIMEOUT", `Upstream OCTO endpoint timed out after ${this.timeoutMs}ms`);
      }
      if (err instanceof OctoApiError) {
        throw err;
      }
      throw new OctoApiError(502, "CONNECTION_FAILED", err.message || "Failed to communicate with OCTO supplier");
    } finally {
      clearTimeout(timer);
    }
  }

  // 1. Get Supplier Details (Official OCTO Core uses singular /supplier)
  async getSupplier(): Promise<Record<string, unknown>> {
    try {
      return await this.request<Record<string, unknown>>("/supplier");
    } catch (err: any) {
      if (err.status === 404) {
        // Fallback for legacy endpoints exposing plural /suppliers
        return await this.request<Record<string, unknown>>("/suppliers");
      }
      throw err;
    }
  }

  // 2. Get Product List
  async getProducts(): Promise<OctoProduct[]> {
    return this.request<OctoProduct[]>("/products");
  }

  // 3. Get Single Product
  async getProduct(productId: string): Promise<OctoProduct> {
    return this.request<OctoProduct>(`/products/${encodeURIComponent(productId)}`);
  }

  // 4. Availability Calendar
  async getAvailabilityCalendar(
    productId: string,
    optionId: string,
    localDateStart: string,
    localDateEnd: string
  ): Promise<OctoAvailabilitySlot[]> {
    return this.request<OctoAvailabilitySlot[]>("/availability/calendar", "POST", {
      productId,
      optionId,
      localDateStart,
      localDateEnd,
    });
  }

  // 5. Live Availability Check
  async checkAvailability(
    productId: string,
    optionId: string,
    localDate: string,
    unitItems?: OctoUnitItemRequest[]
  ): Promise<OctoAvailabilitySlot[]> {
    return this.request<OctoAvailabilitySlot[]>("/availability", "POST", {
      productId,
      optionId,
      localDate,
      unitItems,
    });
  }

  // 6. Create Booking Reservation Hold
  async createBookingHold(
    params: OctoCreateHoldParams,
    idempotencyKey?: string
  ): Promise<OctoBookingResult> {
    return this.request<OctoBookingResult>(
      "/bookings",
      "POST",
      {
        uuid: params.uuid,
        productId: params.productId,
        optionId: params.optionId,
        availabilityId: params.availabilityId,
        expirationMinutes: params.expirationMinutes,
        unitItems: params.unitItems,
        notes: params.notes,
      },
      idempotencyKey
    );
  }

  // 7. Confirm Booking
  async confirmBooking(
    uuid: string,
    params: OctoConfirmBookingParams,
    idempotencyKey?: string
  ): Promise<OctoBookingResult> {
    return this.request<OctoBookingResult>(
      `/bookings/${encodeURIComponent(uuid)}/confirm`,
      "POST",
      params,
      idempotencyKey
    );
  }

  // 8. Get Booking
  async getBooking(uuid: string): Promise<OctoBookingResult> {
    return this.request<OctoBookingResult>(`/bookings/${encodeURIComponent(uuid)}`);
  }

  // 9. Update Booking
  async updateBooking(
    uuid: string,
    patch: Partial<OctoBookingResult>,
    idempotencyKey?: string
  ): Promise<OctoBookingResult> {
    return this.request<OctoBookingResult>(
      `/bookings/${encodeURIComponent(uuid)}`,
      "PATCH",
      patch,
      idempotencyKey
    );
  }

  // 10. Cancel Booking
  async cancelBooking(
    uuid: string,
    reason?: string,
    idempotencyKey?: string
  ): Promise<OctoBookingResult> {
    return this.request<OctoBookingResult>(
      `/bookings/${encodeURIComponent(uuid)}/cancel`,
      "POST",
      { reason: reason || "Traveler requested cancellation via DCC" },
      idempotencyKey
    );
  }
}
