import { getDb } from "@/lib/db/client";
import { octoBookings, octoAuditLogs, octoSupplierConnections } from "@/lib/db/schema";
import { OctoAdapter, OctoApiError, getProviderAdapterForConnection, OctoProviderAdapter } from "./adapter";
import {
  OctoBookingResult,
  OctoConfirmBookingParams,
  OctoCreateHoldParams,
  OctoUnitItemRequest,
} from "./types";
import { OctoSettlementEngine } from "./settlement";
import { decryptCredential } from "./security";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { MockOctoSupplierEngine } from "./mockServer";

export interface InitiateHoldRequest {
  supplierConnectionId: string;
  productId: string;
  optionId: string;
  availabilityId: string;
  expirationMinutes?: number; // Defaults to 15 per OCTO Core specification
  unitItems: OctoUnitItemRequest[];
  notes?: string;
  idempotencyKey?: string;
  resellerId?: string;
}

export interface ConfirmReservationRequest {
  bookingId: string; // DCC booking ID or UUID
  contact: {
    fullName: string;
    emailAddress: string;
    phoneNumber?: string;
    country?: string;
    notes?: string;
  };
  payment?: {
    provider?: string;
    paymentId?: string;
    currency?: string;
    amount?: number;
    status?: string;
  };
  idempotencyKey?: string;
  resellerId?: string;
}

const fallbackBookingUuidMap = new Map<string, string>();
const fallbackIdempotencyStore = new Map<string, { payloadHash: string; result: any }>();
const fallbackBookingRecordMap = new Map<string, any>();

function hashPayload(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export class OctoBookingService {
  /**
   * Resolves the authoritative supplier connection ID for a given product
   */
  static async resolveConnectionForProduct(productId: string): Promise<string> {
    if (productId === "prod_alaska_whale_glacier" || productId.startsWith("mock_") || productId.startsWith("prod_mock_")) {
      return "conn_mock_alaska";
    }
    const db = getDb();
    if (db) {
      try {
        const { octoNormalizedProducts } = await import("@/lib/db/schema");
        const rows = await db
          .select({ supplierConnectionId: octoNormalizedProducts.supplierConnectionId })
          .from(octoNormalizedProducts)
          .where(eq(octoNormalizedProducts.id, productId));
        if (rows.length && rows[0].supplierConnectionId) {
          return rows[0].supplierConnectionId;
        }
      } catch {
        // Fallback to pattern matching
      }
    }
    if (productId === "prod_vibe_st_thomas_tour" || productId.includes("vibe")) {
      return "conn_vibe_around_town";
    }
    return productId;
  }

  /**
   * Resolves the proper adapter for a given supplier connection
   */
  static async getAdapterForConnection(connectionId: string): Promise<{
    adapter: OctoProviderAdapter | null;
    isMock: boolean;
    connection: any;
  }> {
    const isProd = process.env.NODE_ENV === "production";

    if (connectionId === "conn_mock_alaska" || connectionId.startsWith("mock_")) {
      if (isProd) {
        throw new OctoApiError(
          403,
          "MOCK_QUARANTINED",
          "Mock suppliers are strictly quarantined from production operations"
        );
      }

      return {
        adapter: null,
        isMock: true,
        connection: {
          id: connectionId,
          operatorSlug: "alaska-premier-expeditions",
          operatorName: "Alaska Premier Expeditions",
          endpoint: "https://mock-alaska-expeditions.dcc.internal",
          commissionPercent: 5.0,
          connectionStatus: "sandbox_verified",
          isSandbox: true,
        },
      };
    }

    const db = getDb();
    if (!db) {
      if (connectionId === "conn_vibe_around_town") {
        return {
          adapter: null,
          isMock: false,
          connection: {
            id: "conn_vibe_around_town",
            operatorSlug: "vibe-around-town",
            operatorName: "Vibe Around Town",
            connectionStatus: "authorization_pending",
          },
        };
      }
      throw new OctoApiError(404, "SUPPLIER_NOT_FOUND", `Connection ${connectionId} not configured`);
    }

    const conns = await db
      .select()
      .from(octoSupplierConnections)
      .where(eq(octoSupplierConnections.id, connectionId));

    if (!conns.length) {
      throw new OctoApiError(404, "SUPPLIER_NOT_FOUND", `Connection ${connectionId} not configured`);
    }

    const conn = conns[0];

    // Enforce authorization boundary
    if (isProd && conn.connectionStatus !== "bookable") {
      throw new OctoApiError(
        403,
        "SUPPLIER_NOT_BOOKABLE",
        `Supplier ${conn.operatorName} is in ${conn.connectionStatus} state and cannot accept bookings until production-verified`
      );
    }

    let apiKey: string | undefined;
    let bearerToken: string | undefined;

    if (conn.encryptedApiKey) {
      try {
        apiKey = decryptCredential(conn.encryptedApiKey);
      } catch {
        apiKey = undefined;
      }
    }
    if (conn.encryptedBearerToken) {
      try {
        bearerToken = decryptCredential(conn.encryptedBearerToken);
      } catch {
        bearerToken = undefined;
      }
    }

    const adapter = getProviderAdapterForConnection(conn as any, { apiKey, bearerToken });

    return {
      adapter,
      isMock: false,
      connection: conn,
    };
  }

  /**
   * Step 1: Create a Booking Reservation Hold
   * Enforces live availability check, altered idempotency rejection, and expirationMinutes
   */
  static async createHold(params: InitiateHoldRequest): Promise<OctoBookingResult & { dccBookingId: string }> {
    const db = getDb();
    const payloadHash = hashPayload({
      productId: params.productId,
      optionId: params.optionId,
      availabilityId: params.availabilityId,
      unitItems: params.unitItems,
    });

    // Idempotency check: if an existing booking hold exists with the same idempotency key, return it or reject if altered
    if (params.idempotencyKey) {
      if (db) {
        const existing = await db
          .select()
          .from(octoBookings)
          .where(eq(octoBookings.idempotencyKey, params.idempotencyKey));
        if (existing.length > 0) {
          const rec = existing[0];
          // Check for altered payload
          if (rec.idempotencyHash && rec.idempotencyHash !== payloadHash) {
            throw new OctoApiError(
              400,
              "ALTERED_IDEMPOTENCY_REQUEST",
              "Idempotency key was previously used with a different booking request payload"
            );
          }
          return {
            uuid: rec.bookingUuid,
            dccBookingId: rec.id,
            status: rec.status as any,
            utcHoldExpires: rec.utcHoldExpires ? rec.utcHoldExpires.toISOString() : null,
            productId: rec.productId,
            optionId: rec.optionId,
            availabilityId: rec.availabilityId,
            totalPrice: Number(rec.totalPrice),
            currency: rec.currency,
            unitItems: (rec.unitItems as any) || [],
            supplierReference: rec.supplierReference || undefined,
            resellerReference: rec.resellerReference || undefined,
            checkoutUrl: rec.checkoutUrl || undefined,
          };
        }
      } else {
        const existing = fallbackIdempotencyStore.get(params.idempotencyKey);
        if (existing) {
          if (existing.payloadHash !== payloadHash) {
            throw new OctoApiError(
              400,
              "ALTERED_IDEMPOTENCY_REQUEST",
              "Idempotency key was previously used with a different booking request payload"
            );
          }
          return existing.result;
        }
      }
    }

    const expirationMinutes = params.expirationMinutes || 15;
    const bookingUuid = crypto.randomUUID();
    const dccBookingId = `dcc:bk:${bookingUuid.slice(0, 12)}`;

    const { adapter, isMock, connection } = await this.getAdapterForConnection(
      params.supplierConnectionId
    );

    // Final availability recheck before creating hold
    if (isMock) {
      const dateMatch = params.availabilityId.match(/\d{4}-\d{2}-\d{2}/);
      const checkDate = dateMatch ? dateMatch[0] : "2026-09-20";
      const liveCheck = MockOctoSupplierEngine.checkAvailability(
        params.productId,
        params.optionId,
        checkDate,
        params.unitItems
      );
      const slot = liveCheck.find(
        (s) => s.id === params.availabilityId || (params.availabilityId === "avail_slot_1" && s.available)
      );
      const totalUnitsRequested = params.unitItems.reduce((acc, u) => acc + (u.quantity || 1), 0);
      if (!slot || slot.status === "SOLD_OUT" || !slot.available || (slot.vacancies != null && totalUnitsRequested > slot.vacancies)) {
        throw new OctoApiError(400, "INSUFFICIENT_AVAILABILITY", "The requested availability slot is unavailable, sold out, or exceeds capacity");
      }
    }

    let holdResult: OctoBookingResult;

    if (isMock) {
      holdResult = MockOctoSupplierEngine.createHold({
        uuid: bookingUuid,
        productId: params.productId,
        optionId: params.optionId,
        availabilityId: params.availabilityId,
        expirationMinutes,
        unitItems: params.unitItems,
        notes: params.notes,
      });
    } else if (adapter) {
      holdResult = await adapter.createBookingHold(
        {
          uuid: bookingUuid,
          productId: params.productId,
          optionId: params.optionId,
          availabilityId: params.availabilityId,
          expirationMinutes,
          unitItems: params.unitItems,
          notes: params.notes,
        },
        params.idempotencyKey
      );
    } else {
      throw new Error("ADAPTER_INITIALIZATION_FAILED");
    }

    // Persist hold in Neon
    if (db) {
      try {
        await db.insert(octoBookings).values({
          id: dccBookingId,
          bookingUuid: holdResult.uuid,
          idempotencyKey: params.idempotencyKey || null,
          idempotencyHash: payloadHash,
          supplierConnectionId: params.supplierConnectionId,
          resellerId: params.resellerId || null,
          productId: params.productId,
          optionId: params.optionId,
          availabilityId: params.availabilityId,
          status: "ON_HOLD",
          expirationMinutes,
          utcHoldExpires: holdResult.utcHoldExpires ? new Date(holdResult.utcHoldExpires) : null,
          totalPrice: holdResult.totalPrice.toFixed(2),
          currency: holdResult.currency,
          unitItems: holdResult.unitItems as any,
          supplierReference: holdResult.supplierReference || null,
          resellerReference: dccBookingId,
          checkoutUrl: holdResult.checkoutUrl || null,
        });

        await db.insert(octoAuditLogs).values({
          action: "BOOKING_HOLD_CREATED",
          entityType: "BOOKING",
          entityId: dccBookingId,
          status: "SUCCESS",
          payload: {
            bookingUuid: holdResult.uuid,
            expirationMinutes,
            utcHoldExpires: holdResult.utcHoldExpires,
            totalPrice: holdResult.totalPrice,
          },
        });
      } catch (err: any) {
        console.error("Database insert error on booking hold:", err.message);
      }
    }

    fallbackBookingUuidMap.set(dccBookingId, holdResult.uuid);
    fallbackBookingUuidMap.set(holdResult.uuid, holdResult.uuid);

    const fullResult = {
      ...holdResult,
      dccBookingId,
    };

    if (params.idempotencyKey) {
      fallbackIdempotencyStore.set(params.idempotencyKey, {
        payloadHash,
        result: fullResult,
      });
    }

    fallbackBookingRecordMap.set(dccBookingId, {
      ...fullResult,
      bookingUuid: holdResult.uuid,
      id: dccBookingId,
      resellerId: params.resellerId,
      supplierConnectionId: params.supplierConnectionId,
    });
    fallbackBookingRecordMap.set(holdResult.uuid, {
      ...fullResult,
      bookingUuid: holdResult.uuid,
      id: dccBookingId,
      resellerId: params.resellerId,
      supplierConnectionId: params.supplierConnectionId,
    });

    return fullResult;
  }

  /**
   * Step 2: Confirm Reservation & Trigger 5% Settlement Ledger
   */
  static async confirmReservation(params: ConfirmReservationRequest): Promise<OctoBookingResult> {
    const db = getDb();
    let bookingRecord: any = null;

    if (db) {
      const records = await db
        .select()
        .from(octoBookings)
        .where(
          params.bookingId.startsWith("dcc:bk:")
            ? eq(octoBookings.id, params.bookingId)
            : eq(octoBookings.bookingUuid, params.bookingId)
        );
      if (records.length) {
        bookingRecord = records[0];
      }
    }

    // If already confirmed (idempotency), return existing confirmation
    if (bookingRecord && bookingRecord.status === "CONFIRMED") {
      return {
        uuid: bookingRecord.bookingUuid,
        status: "CONFIRMED",
        utcHoldExpires: bookingRecord.utcHoldExpires ? bookingRecord.utcHoldExpires.toISOString() : null,
        productId: bookingRecord.productId,
        optionId: bookingRecord.optionId,
        availabilityId: bookingRecord.availabilityId,
        totalPrice: Number(bookingRecord.totalPrice),
        currency: bookingRecord.currency,
        unitItems: (bookingRecord.unitItems as any) || [],
        contact: (bookingRecord.contact as any) || params.contact,
        supplierReference: bookingRecord.supplierReference || undefined,
        resellerReference: bookingRecord.resellerReference || bookingRecord.id,
        checkoutUrl: bookingRecord.checkoutUrl || undefined,
        voucher: (bookingRecord.voucher as any) || undefined,
        confirmedAt: bookingRecord.confirmedAt?.toISOString(),
      };
    }

    // Check expiration before proceeding
    if (bookingRecord && bookingRecord.utcHoldExpires) {
      const expires = new Date(bookingRecord.utcHoldExpires).getTime();
      if (Date.now() > expires) {
        if (db) {
          await db
            .update(octoBookings)
            .set({ status: "EXPIRED", updatedAt: new Date() })
            .where(eq(octoBookings.id, bookingRecord.id));
        }
        throw new OctoApiError(410, "EXPIRED_HOLD", "This booking hold has expired. Please refresh live availability.");
      }
    }

    const supplierConnectionId = bookingRecord?.supplierConnectionId || "conn_mock_alaska";
    const bookingUuid = bookingRecord?.bookingUuid || fallbackBookingUuidMap.get(params.bookingId) || params.bookingId;
    const dccBookingId = bookingRecord?.id || (params.bookingId.startsWith("dcc:bk:") ? params.bookingId : `dcc:bk:${bookingUuid.slice(0, 12)}`);

    const { adapter, isMock, connection } = await this.getAdapterForConnection(supplierConnectionId);

    let confirmedResult: OctoBookingResult;

    if (isMock) {
      confirmedResult = MockOctoSupplierEngine.confirmBooking(bookingUuid, {
        contact: params.contact,
        resellerReference: dccBookingId,
        payment: params.payment,
      });
    } else if (adapter) {
      confirmedResult = await adapter.confirmBooking(
        bookingUuid,
        {
          contact: params.contact,
          resellerReference: dccBookingId,
          payment: params.payment,
        },
        params.idempotencyKey
      );
    } else {
      throw new Error("ADAPTER_INITIALIZATION_FAILED");
    }

    // Update DB status to CONFIRMED
    if (db) {
      try {
        await db
          .update(octoBookings)
          .set({
            status: "CONFIRMED",
            contact: params.contact as any,
            voucher: confirmedResult.voucher as any,
            confirmedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(octoBookings.id, dccBookingId));

        // Create 5% DCC Commission Settlement Ledger Entry
        const gross = Number(bookingRecord?.totalPrice || confirmedResult.totalPrice);
        await OctoSettlementEngine.recordBookingSettlement({
          bookingId: dccBookingId,
          dccReference: dccBookingId,
          supplierReference: confirmedResult.supplierReference || bookingRecord?.supplierReference,
          operatorSlug: connection.operatorSlug,
          operatorName: connection.operatorName,
          currency: confirmedResult.currency,
          grossAmount: gross,
          commissionPercent: connection.commissionPercent != null ? Number(connection.commissionPercent) : undefined,
          paymentStatus: "captured",
          settlementStatus: "pending",
          metadata: {
            confirmedAt: confirmedResult.confirmedAt,
            voucherCode: confirmedResult.voucher?.code,
          },
        });

        await db.insert(octoAuditLogs).values({
          action: "BOOKING_CONFIRMED",
          entityType: "BOOKING",
          entityId: dccBookingId,
          status: "SUCCESS",
          payload: {
            dccBookingId,
            voucher: confirmedResult.voucher?.code,
            gross,
          },
        });
      } catch (err: any) {
        console.error("Database error on booking confirmation:", err.message);
      }
    }

    return confirmedResult;
  }

  /**
   * Step 3: Cancel Booking & Refund Settlement
   */
  static async cancelReservation(
    bookingId: string,
    reason: string = "Traveler requested cancellation via DCC"
  ): Promise<OctoBookingResult> {
    const db = getDb();
    let bookingRecord: any = null;

    if (db) {
      const records = await db
        .select()
        .from(octoBookings)
        .where(
          bookingId.startsWith("dcc:bk:")
            ? eq(octoBookings.id, bookingId)
            : eq(octoBookings.bookingUuid, bookingId)
        );
      if (records.length) {
        bookingRecord = records[0];
      }
    }

    const supplierConnectionId = bookingRecord?.supplierConnectionId || "conn_mock_alaska";
    const bookingUuid = bookingRecord?.bookingUuid || fallbackBookingUuidMap.get(bookingId) || bookingId;
    const dccBookingId = bookingRecord?.id || (bookingId.startsWith("dcc:bk:") ? bookingId : `dcc:bk:${bookingUuid.slice(0, 12)}`);

    const { adapter, isMock } = await this.getAdapterForConnection(supplierConnectionId);

    let cancelResult: OctoBookingResult;

    if (isMock) {
      cancelResult = MockOctoSupplierEngine.cancelBooking(bookingUuid, reason);
    } else if (adapter) {
      cancelResult = await adapter.cancelBooking(bookingUuid, reason);
    } else {
      throw new Error("ADAPTER_INITIALIZATION_FAILED");
    }

    if (db) {
      try {
        await db
          .update(octoBookings)
          .set({
            status: "CANCELLED",
            cancellationReason: reason,
            cancelledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(octoBookings.id, dccBookingId));

        await OctoSettlementEngine.handleBookingCancellation(dccBookingId, "full");

        await db.insert(octoAuditLogs).values({
          action: "BOOKING_CANCELLED",
          entityType: "BOOKING",
          entityId: dccBookingId,
          status: "SUCCESS",
          payload: { reason },
        });
      } catch (err: any) {
        console.error("Database error on cancellation:", err.message);
      }
    }

    return cancelResult;
  }

  /**
   * Step 4: Get Current Booking Status
   */
  static async getBooking(
    bookingId: string,
    authContext?: { resellerId?: string; supplierConnectionId?: string }
  ): Promise<OctoBookingResult | null> {
    const db = getDb();
    let bookingRecord: any = null;

    if (db) {
      const records = await db
        .select()
        .from(octoBookings)
        .where(
          bookingId.startsWith("dcc:bk:")
            ? eq(octoBookings.id, bookingId)
            : eq(octoBookings.bookingUuid, bookingId)
        );
      if (records.length) {
        bookingRecord = records[0];
      }
    } else {
      bookingRecord = fallbackBookingRecordMap.get(bookingId);
    }

    if (bookingRecord) {
      // Ownership check: if auth context is present and resellerId does not match
      if (authContext?.resellerId && bookingRecord.resellerId && bookingRecord.resellerId !== authContext.resellerId) {
        throw new OctoApiError(403, "FORBIDDEN", "Unauthorized access to booking from another reseller");
      }
      if (authContext?.supplierConnectionId && bookingRecord.supplierConnectionId !== authContext.supplierConnectionId) {
        throw new OctoApiError(403, "FORBIDDEN", "Unauthorized access to booking from another supplier");
      }
    }

    const supplierConnectionId = bookingRecord?.supplierConnectionId || "conn_mock_alaska";
    const bookingUuid = bookingRecord?.bookingUuid || fallbackBookingUuidMap.get(bookingId) || bookingId;

    const { adapter, isMock } = await this.getAdapterForConnection(supplierConnectionId);

    if (isMock) {
      return MockOctoSupplierEngine.getBooking(bookingUuid);
    }
    if (adapter) {
      return adapter.getBooking(bookingUuid);
    }
    return null;
  }

  /**
   * Step 5: Update Booking (PATCH /octo/bookings/{bookingUuid})
   */
  static async updateBooking(
    bookingId: string,
    patch: Partial<OctoBookingResult>,
    authContext?: { resellerId?: string; supplierConnectionId?: string }
  ): Promise<OctoBookingResult> {
    const db = getDb();
    let bookingRecord: any = null;

    if (db) {
      const records = await db
        .select()
        .from(octoBookings)
        .where(
          bookingId.startsWith("dcc:bk:")
            ? eq(octoBookings.id, bookingId)
            : eq(octoBookings.bookingUuid, bookingId)
        );
      if (records.length) {
        bookingRecord = records[0];
      }
    }

    if (bookingRecord) {
      if (authContext?.resellerId && bookingRecord.resellerId && bookingRecord.resellerId !== authContext.resellerId) {
        throw new OctoApiError(403, "FORBIDDEN", "Unauthorized access to booking from another reseller");
      }
      if (authContext?.supplierConnectionId && bookingRecord.supplierConnectionId !== authContext.supplierConnectionId) {
        throw new OctoApiError(403, "FORBIDDEN", "Unauthorized access to booking from another supplier");
      }
    }

    const supplierConnectionId = bookingRecord?.supplierConnectionId || "conn_mock_alaska";
    const bookingUuid = bookingRecord?.bookingUuid || fallbackBookingUuidMap.get(bookingId) || bookingId;
    const dccBookingId = bookingRecord?.id || (bookingId.startsWith("dcc:bk:") ? bookingId : `dcc:bk:${bookingUuid.slice(0, 12)}`);

    const { adapter, isMock } = await this.getAdapterForConnection(supplierConnectionId);

    let updated: OctoBookingResult;
    if (isMock) {
      const current = MockOctoSupplierEngine.getBooking(bookingUuid);
      if (!current) {
        throw new OctoApiError(404, "INVALID_BOOKING", `Booking ${bookingUuid} not found`);
      }
      if (patch.contact) current.contact = { ...current.contact, ...patch.contact };
      updated = current;
    } else if (adapter) {
      updated = await adapter.updateBooking(bookingUuid, patch);
    } else {
      throw new Error("ADAPTER_INITIALIZATION_FAILED");
    }

    if (db) {
      try {
        await db
          .update(octoBookings)
          .set({
            contact: (updated.contact as any) || (patch.contact as any) || bookingRecord?.contact,
            updatedAt: new Date(),
          })
          .where(eq(octoBookings.id, dccBookingId));
      } catch (err: any) {
        console.error("Database update error on booking update:", err.message);
      }
    }

    return updated;
  }

  /**
   * Step 6: List Bookings (GET /octo/bookings)
   */
  static async listBookings(filter?: {
    resellerId?: string;
    supplierConnectionId?: string;
    status?: string;
    limit?: number;
  }): Promise<OctoBookingResult[]> {
    const db = getDb();
    if (!db) {
      // In mock fallback mode, return mock bookings
      const mock = MockOctoSupplierEngine.getBooking("b103e670-8b1e-4cb8-b21a-28a6f3b0e111");
      return mock ? [mock] : [];
    }

    try {
      let query = db.select().from(octoBookings);
      if (filter?.supplierConnectionId) {
        query = query.where(eq(octoBookings.supplierConnectionId, filter.supplierConnectionId)) as any;
      }
      if (filter?.status) {
        query = query.where(eq(octoBookings.status, filter.status)) as any;
      }

      const rows = await query.orderBy(desc(octoBookings.createdAt)).limit(filter?.limit || 50);

      return rows.map((rec) => ({
        uuid: rec.bookingUuid,
        status: rec.status as any,
        utcHoldExpires: rec.utcHoldExpires ? rec.utcHoldExpires.toISOString() : null,
        productId: rec.productId,
        optionId: rec.optionId,
        availabilityId: rec.availabilityId,
        totalPrice: Number(rec.totalPrice),
        currency: rec.currency,
        unitItems: (rec.unitItems as any) || [],
        contact: (rec.contact as any) || undefined,
        supplierReference: rec.supplierReference || undefined,
        resellerReference: rec.resellerReference || undefined,
        checkoutUrl: rec.checkoutUrl || undefined,
        voucher: (rec.voucher as any) || undefined,
        confirmedAt: rec.confirmedAt ? rec.confirmedAt.toISOString() : undefined,
        cancelledAt: rec.cancelledAt ? rec.cancelledAt.toISOString() : undefined,
      }));
    } catch {
      return [];
    }
  }
}
