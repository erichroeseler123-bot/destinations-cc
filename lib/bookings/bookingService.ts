import { getDb } from "@/lib/db/client";
import { octoBookings, octoAuditLogs, octoSupplierConnections } from "@/lib/db/schema";
import {
  getProviderAdapterForConnection,
  OctoProviderAdapter,
  OctoApiError,
} from "@/lib/providers";
import {
  OctoBookingResult,
  OctoConfirmBookingParams,
  OctoCreateHoldParams,
  OctoUnitItemRequest,
} from "@/lib/octo/types";
import { DccSettlementEngine } from "@/lib/settlement";
import { decryptCredential } from "@/lib/octo/security";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import {
  DccBookingConfirmRequest,
  DccBookingHoldRequest,
  DccBookingRecord,
  DccBookingStatus,
} from "./types";
import { eq, desc, and } from "drizzle-orm";
import crypto from "crypto";

const fallbackBookingUuidMap = new Map<string, string>();
const fallbackIdempotencyStore = new Map<string, { payloadHash: string; result: any }>();
const fallbackBookingRecordMap = new Map<string, any>();

function hashPayload(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export class DccBookingService {
  /**
   * Resolves the authoritative supplier connection ID for a given product
   */
  static async resolveConnectionForProduct(productId: string): Promise<string> {
    if (
      productId === "prod_alaska_whale_glacier" ||
      productId.startsWith("mock_") ||
      productId.startsWith("prod_mock_")
    ) {
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
   * Resolves the proper provider adapter for a given supplier connection
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
   * Check real-time availability for a product/option
   */
  static async checkAvailability(
    productId: string,
    optionId: string,
    availabilityId: string,
    unitItems: any[] = []
  ): Promise<{ available: boolean; id: string }> {
    const supplierConnId = await this.resolveConnectionForProduct(productId);
    const { adapter, isMock } = await this.getAdapterForConnection(supplierConnId);

    if (isMock) {
      const dateMatch = availabilityId.match(/\d{4}-\d{2}-\d{2}/);
      const checkDate = dateMatch ? dateMatch[0] : "2026-09-20";
      const slots = MockOctoSupplierEngine.checkAvailability(productId, optionId, checkDate, unitItems);
      const found = slots.find((s) => s.id === availabilityId || s.available);
      return {
        available: Boolean(found?.available && found.status !== "SOLD_OUT"),
        id: availabilityId,
      };
    }

    if (adapter) {
      const dateMatch = availabilityId.match(/\d{4}-\d{2}-\d{2}/);
      const checkDate = dateMatch ? dateMatch[0] : new Date().toISOString().slice(0, 10);
      const avail = await adapter.checkAvailability(productId, optionId, checkDate, unitItems);
      const found = avail.find((s: any) => s.id === availabilityId && s.available);
      return {
        available: Boolean(found),
        id: availabilityId,
      };
    }

    return { available: true, id: availabilityId };
  }

  /**
   * Step 1: Create a Booking Reservation Hold
   */
  static async createHold(
    params: DccBookingHoldRequest
  ): Promise<OctoBookingResult & { dccBookingId: string }> {
    const db = getDb();

    // Enforce Idempotency
    const payloadHash = hashPayload({
      productId: params.productId,
      optionId: params.optionId,
      availabilityId: params.availabilityId,
      unitItems: params.unitItems,
    });

    if (params.idempotencyKey) {
      if (db) {
        try {
          const existingHold = await db
            .select()
            .from(octoBookings)
            .where(eq(octoBookings.idempotencyKey, params.idempotencyKey));

          if (existingHold.length > 0) {
            const b = existingHold[0];
            if (b.idempotencyHash && b.idempotencyHash !== payloadHash) {
              throw new OctoApiError(
                400,
                "ALTERED_IDEMPOTENCY_REQUEST",
                "Idempotency key was previously used with a different booking request payload"
              );
            }
            return {
              id: b.id,
              uuid: b.bookingUuid,
              status: b.status as any,
              productId: b.productId,
              optionId: b.optionId,
              availabilityId: b.availabilityId,
              totalPrice: Number(b.totalPrice),
              currency: b.currency,
              unitItems: (b.unitItems as any) || [],
              utcHoldExpires: b.utcHoldExpires ? b.utcHoldExpires.toISOString() : null,
              supplierReference: b.supplierReference || undefined,
              resellerReference: b.resellerReference || undefined,
              checkoutUrl: b.checkoutUrl || undefined,
              dccBookingId: b.id,
            };
          }
        } catch (err: any) {
          if (err instanceof OctoApiError) throw err;
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

    if (connection?.connectionStatus === "authorization_pending" || (!isMock && !adapter)) {
      throw new OctoApiError(
        403,
        "UNAUTHORIZED_SUPPLIER",
        `Supplier ${connection?.operatorName || params.supplierConnectionId} is authorization_pending and non-bookable`
      );
    }

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
        (s: any) =>
          s.id === params.availabilityId || (params.availabilityId === "avail_slot_1" && s.available)
      );
      const totalUnitsRequested = params.unitItems.reduce(
        (acc, u) => acc + (u.quantity || 1),
        0
      );
      if (
        !slot ||
        slot.status === "SOLD_OUT" ||
        !slot.available ||
        (slot.vacancies != null && totalUnitsRequested > slot.vacancies)
      ) {
        throw new OctoApiError(
          400,
          "INSUFFICIENT_AVAILABILITY",
          "The requested availability slot is unavailable, sold out, or exceeds capacity"
        );
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
      id: dccBookingId,
      dccBookingId,
    };

    if (params.idempotencyKey) {
      fallbackIdempotencyStore.set(params.idempotencyKey, {
        payloadHash,
        result: fullResult,
      });
    }

    const record = {
      ...fullResult,
      id: dccBookingId,
      bookingUuid: holdResult.uuid,
      uuid: holdResult.uuid,
      idempotencyHash: payloadHash,
      resellerId: params.resellerId,
      supplierConnectionId: params.supplierConnectionId,
    };
    fallbackBookingRecordMap.set(dccBookingId, record);
    fallbackBookingRecordMap.set(holdResult.uuid, record);

    return fullResult;
  }

  /**
   * Step 2: Confirm a Booking Reservation
   */
  static async confirmReservation(params: DccBookingConfirmRequest): Promise<OctoBookingResult> {
    const db = getDb();
    let bookingRecord: any = null;

    if (db) {
      try {
        const rows = await db
          .select()
          .from(octoBookings)
          .where(
            params.bookingId.startsWith("dcc:bk:")
              ? eq(octoBookings.id, params.bookingId)
              : eq(octoBookings.bookingUuid, params.bookingId)
          );
        if (rows.length > 0) {
          bookingRecord = rows[0];
        }
      } catch (err: any) {
        console.error("Database query error on confirm reservation:", err.message);
      }
    }

    if (!bookingRecord) {
      bookingRecord =
        fallbackBookingRecordMap.get(params.bookingId) ||
        fallbackBookingRecordMap.get(fallbackBookingUuidMap.get(params.bookingId) || "");
    }

    // Verify ownership
    if (params.resellerId && bookingRecord?.resellerId && bookingRecord.resellerId !== params.resellerId) {
      throw new OctoApiError(
        403,
        "FORBIDDEN",
        "Reseller is not authorized to confirm bookings owned by another account"
      );
    }

    // Idempotent retry check: if already confirmed, return current confirmed result
    if (bookingRecord && bookingRecord.status === "CONFIRMED") {
      return {
        id: bookingRecord.id,
        uuid: bookingRecord.bookingUuid || bookingRecord.uuid,
        status: "CONFIRMED",
        productId: bookingRecord.productId,
        optionId: bookingRecord.optionId,
        availabilityId: bookingRecord.availabilityId,
        totalPrice: Number(bookingRecord.totalPrice),
        currency: bookingRecord.currency,
        unitItems: bookingRecord.unitItems || [],
        contact: bookingRecord.contact,
        voucher: bookingRecord.voucher,
        utcHoldExpires: null,
        confirmedAt: bookingRecord.confirmedAt?.toISOString?.() || bookingRecord.confirmedAt,
        supplierReference: bookingRecord.supplierReference,
        resellerReference: bookingRecord.resellerReference,
      };
    }

    // Expiration check
    if (bookingRecord?.utcHoldExpires) {
      const expiresAt = new Date(bookingRecord.utcHoldExpires).getTime();
      if (Date.now() > expiresAt) {
        if (db) {
          await db
            .update(octoBookings)
            .set({ status: "EXPIRED", updatedAt: new Date() })
            .where(eq(octoBookings.id, bookingRecord.id));
        }
        throw new OctoApiError(
          400,
          "EXPIRED_HOLD",
          "The reservation hold has expired. Please check current availability and initiate a new hold."
        );
      }
    }

    const supplierConnectionId = bookingRecord?.supplierConnectionId || "conn_mock_alaska";
    const bookingUuid =
      bookingRecord?.bookingUuid ||
      bookingRecord?.uuid ||
      fallbackBookingUuidMap.get(params.bookingId) ||
      params.bookingId;
    const dccBookingId =
      bookingRecord?.id ||
      (params.bookingId.startsWith("dcc:bk:")
        ? params.bookingId
        : `dcc:bk:${bookingUuid.replace(/^dcc:bk:/, "").slice(0, 12)}`);

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

        await db.insert(octoAuditLogs).values({
          action: "BOOKING_CONFIRMED",
          entityType: "BOOKING",
          entityId: dccBookingId,
          status: "SUCCESS",
          payload: {
            dccBookingId,
            voucher: confirmedResult.voucher?.code,
          },
        });
      } catch (err: any) {
        console.error("Database error updating booking to CONFIRMED:", err.message);
      }
    }

    // Record DCC Commission Settlement Ledger Entry (handles DB and memory fallback)
    const gross = Number(bookingRecord?.totalPrice || confirmedResult.totalPrice);
    await DccSettlementEngine.recordBookingSettlement({
      bookingId: dccBookingId,
      orderId: params.orderId,
      dccReference: dccBookingId,
      supplierReference: confirmedResult.supplierReference || bookingRecord?.supplierReference,
      operatorSlug: connection.operatorSlug,
      operatorName: connection.operatorName,
      currency: confirmedResult.currency,
      grossAmount: gross,
      commissionPercent:
        connection.commissionPercent != null ? Number(connection.commissionPercent) : undefined,
      paymentStatus: "captured",
      settlementStatus: "pending",
      metadata: {
        confirmedAt: confirmedResult.confirmedAt,
        voucherCode: confirmedResult.voucher?.code,
      },
    });

    const updated = {
      ...confirmedResult,
      id: dccBookingId,
    };
    const confirmedRecord = {
      ...bookingRecord,
      ...updated,
      status: "CONFIRMED",
    };
    fallbackBookingRecordMap.set(dccBookingId, confirmedRecord);
    if (confirmedResult.uuid) {
      fallbackBookingRecordMap.set(confirmedResult.uuid, confirmedRecord);
    }

    return updated;
  }

  /**
   * Step 3: Retrieve Booking by UUID or DCC reference ID
   */
  static async getBooking(
    bookingIdOrUuid: string,
    options?: { resellerId?: string }
  ): Promise<OctoBookingResult> {
    const db = getDb();
    let bookingRecord: any = null;

    if (db) {
      try {
        const rows = await db
          .select()
          .from(octoBookings)
          .where(
            bookingIdOrUuid.startsWith("dcc:bk:")
              ? eq(octoBookings.id, bookingIdOrUuid)
              : eq(octoBookings.bookingUuid, bookingIdOrUuid)
          );
        if (rows.length > 0) {
          bookingRecord = rows[0];
        }
      } catch (err: any) {
        console.error("Database query error on getBooking:", err.message);
      }
    }

    if (!bookingRecord) {
      bookingRecord =
        fallbackBookingRecordMap.get(bookingIdOrUuid) ||
        fallbackBookingRecordMap.get(fallbackBookingUuidMap.get(bookingIdOrUuid) || "");
    }

    if (!bookingRecord) {
      const mockResult = MockOctoSupplierEngine.getBooking(bookingIdOrUuid);
      if (mockResult) return mockResult;
      throw new OctoApiError(404, "BOOKING_NOT_FOUND", `Booking ${bookingIdOrUuid} does not exist`);
    }

    // Verify ownership
    if (
      options?.resellerId &&
      bookingRecord.resellerId &&
      bookingRecord.resellerId !== options.resellerId
    ) {
      throw new OctoApiError(
        403,
        "FORBIDDEN",
        "Reseller is not authorized to inspect bookings owned by another account"
      );
    }

    return {
      id: bookingRecord.id,
      uuid: bookingRecord.bookingUuid || bookingRecord.uuid,
      status: bookingRecord.status as any,
      productId: bookingRecord.productId,
      optionId: bookingRecord.optionId,
      availabilityId: bookingRecord.availabilityId,
      totalPrice: Number(bookingRecord.totalPrice),
      currency: bookingRecord.currency,
      unitItems: bookingRecord.unitItems || [],
      contact: bookingRecord.contact,
      voucher: bookingRecord.voucher,
      confirmedAt: bookingRecord.confirmedAt?.toISOString?.() || bookingRecord.confirmedAt,
      cancelledAt: bookingRecord.cancelledAt?.toISOString?.() || bookingRecord.cancelledAt,
      cancellationReason: bookingRecord.cancellationReason,
      supplierReference: bookingRecord.supplierReference,
      resellerReference: bookingRecord.resellerReference,
      utcHoldExpires: bookingRecord.utcHoldExpires ? (bookingRecord.utcHoldExpires.toISOString?.() || bookingRecord.utcHoldExpires) : null,
    };
  }

  /**
   * Step 4: List Bookings
   */
  static async listBookings(options?: { resellerId?: string; status?: string; limit?: number }): Promise<OctoBookingResult[]> {
    const db = getDb();
    if (db) {
      try {
        let query = db.select().from(octoBookings);
        const conditions = [];
        if (options?.resellerId) conditions.push(eq(octoBookings.resellerId, options.resellerId));
        if (options?.status) conditions.push(eq(octoBookings.status, options.status));
        const rows = conditions.length > 0
          ? await query.where(and(...conditions)).limit(options?.limit || 50)
          : await query.limit(options?.limit || 50);

        return rows.map((r) => ({
          id: r.id,
          uuid: r.bookingUuid,
          status: r.status as any,
          productId: r.productId,
          optionId: r.optionId,
          availabilityId: r.availabilityId,
          totalPrice: Number(r.totalPrice),
          currency: r.currency,
          unitItems: (r.unitItems as any) || [],
          contact: (r.contact as any) || undefined,
          voucher: (r.voucher as any) || undefined,
          utcHoldExpires: r.utcHoldExpires ? r.utcHoldExpires.toISOString() : null,
          confirmedAt: r.confirmedAt?.toISOString(),
          cancelledAt: r.cancelledAt?.toISOString(),
          supplierReference: r.supplierReference || undefined,
          resellerReference: r.resellerReference || undefined,
        }));
      } catch (err: any) {
        console.error("Database query error on listBookings:", err.message);
      }
    }

    let all = Array.from(fallbackBookingRecordMap.values());
    if (options?.resellerId) {
      all = all.filter((b) => b.resellerId === options.resellerId);
    }
    if (options?.status) {
      all = all.filter((b) => b.status === options.status);
    }
    return all;
  }

  /**
   * Step 5: Update Passenger Contact or Booking Notes
   */
  static async updateBooking(
    bookingIdOrUuid: string,
    patch: { contact?: any; notes?: string },
    options?: { resellerId?: string }
  ): Promise<OctoBookingResult> {
    const booking = await this.getBooking(bookingIdOrUuid, options);
    const db = getDb();
    const bookingKey = booking.id || bookingIdOrUuid;

    if (db) {
      try {
        await db
          .update(octoBookings)
          .set({
            contact: patch.contact ? (patch.contact as any) : undefined,
            updatedAt: new Date(),
          })
          .where(
            bookingIdOrUuid.startsWith("dcc:bk:")
              ? eq(octoBookings.id, bookingIdOrUuid)
              : eq(octoBookings.bookingUuid, bookingIdOrUuid)
          );
      } catch (err: any) {
        console.error("Database error updating booking:", err.message);
      }
    }

    const updated = {
      ...booking,
      contact: patch.contact ? { ...booking.contact, ...patch.contact } : booking.contact,
    };
    fallbackBookingRecordMap.set(bookingKey, updated);
    return updated;
  }

  /**
   * Step 6: Cancel a Booking
   */
  static async cancelBooking(
    bookingIdOrUuid: string,
    params?: { reason?: string } | string,
    options?: { resellerId?: string }
  ): Promise<OctoBookingResult> {
    const booking = await this.getBooking(bookingIdOrUuid, options);
    const db = getDb();
    const reasonText =
      typeof params === "string"
        ? params
        : params?.reason || "Cancelled by customer request";

    if (booking.status === "CANCELLED") {
      return booking;
    }

    const cancelledResult: OctoBookingResult = {
      ...booking,
      status: "CANCELLED",
      cancelledAt: new Date().toISOString(),
      cancellationReason: reasonText,
    };

    const bookingKey = booking.id || bookingIdOrUuid;

    if (db) {
      try {
        await db
          .update(octoBookings)
          .set({
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason: reasonText,
            updatedAt: new Date(),
          })
          .where(
            bookingIdOrUuid.startsWith("dcc:bk:")
              ? eq(octoBookings.id, bookingIdOrUuid)
              : eq(octoBookings.bookingUuid, bookingIdOrUuid)
          );

        await db.insert(octoAuditLogs).values({
          action: "BOOKING_CANCELLED",
          entityType: "BOOKING",
          entityId: bookingKey,
          status: "SUCCESS",
          payload: {
            reason: reasonText,
            bookingUuid: booking.uuid,
          },
        });
      } catch (err: any) {
        console.error("Database error on cancelBooking:", err.message);
      }
    }

    // Record cancellation settlement adjustment (handles DB and memory fallback)
    const ledgerId = `dcc:ledg:${bookingKey.replace(/^dcc:bk:/, "")}`;
    await DccSettlementEngine.recordCancellationSettlement({
      ledgerId,
      bookingId: bookingKey,
      refundType: "full",
      refundAmount: booking.totalPrice,
    });

    fallbackBookingRecordMap.set(bookingKey, cancelledResult);
    return cancelledResult;
  }

  static async cancelReservation(
    bookingIdOrUuid: string,
    params?: { reason?: string } | string,
    options?: { resellerId?: string }
  ): Promise<OctoBookingResult> {
    return this.cancelBooking(bookingIdOrUuid, params, options);
  }
}
