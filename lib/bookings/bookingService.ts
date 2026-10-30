import { getDb } from "@/lib/db/client";
import { octoBookings, octoAuditLogs, octoSupplierConnections } from "@/lib/db/schema";
import {
  getProviderAdapterForConnection,
  OctoProviderAdapter,
  OctoApiError,
} from "@/lib/providers";
import {
  DccBookingLifecycleStates,
  OctoBookingResult,
  OctoCustomBookingField,
  OctoParticipantField,
  OctoPickupLocation,
  OctoVerifiedPaymentEvidence,
  OctoVerifiedRefundEvidence,
} from "@/lib/octo/types";
import {
  DccSettlementEngine,
  validateVerifiedPaymentEvidence,
  validateVerifiedRefundEvidence,
} from "@/lib/settlement";
import { decryptCredential } from "@/lib/octo/security";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import {
  DccBookingCancelRequest,
  DccBookingConfirmRequest,
  DccBookingHoldRequest,
} from "./types";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { resolveGosnoRezdyProductMapping } from "@/lib/octo/adapters/rezdy";

const fallbackBookingUuidMap = new Map<string, string>();
const fallbackIdempotencyStore = new Map<string, { payloadHash: string; result: any }>();
const fallbackBookingRecordMap = new Map<string, any>();
const inFlightHoldLocks = new Map<
  string,
  { payloadHash: string; promise: Promise<OctoBookingResult & { dccBookingId: string }> }
>();
const registeredPilotConnections = new Map<
  string,
  {
    connection: any;
    adapter: OctoProviderAdapter;
  }
>();

let simulatePersistenceFailureForTests = false;
let customDurableStorePathForTests: string | null = null;

function hashPayload(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function getDurableBookingStorePath(): string | null {
  return customDurableStorePathForTests || process.env.DCC_BOOKING_STORE_PATH || null;
}

function readDurableStore(): {
  records: Record<string, any>;
  uuidMap: Record<string, string>;
  idempotency: Record<string, { payloadHash: string; result: any }>;
} {
  const storePath = getDurableBookingStorePath();
  if (!storePath || !fs.existsSync(storePath)) {
    return { records: {}, uuidMap: {}, idempotency: {} };
  }
  try {
    const raw = fs.readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      records: parsed.records || {},
      uuidMap: parsed.uuidMap || {},
      idempotency: parsed.idempotency || {},
    };
  } catch {
    return { records: {}, uuidMap: {}, idempotency: {} };
  }
}

function writeDurableStore(data: {
  records: Record<string, any>;
  uuidMap: Record<string, string>;
  idempotency: Record<string, { payloadHash: string; result: any }>;
}): void {
  const storePath = getDurableBookingStorePath();
  if (!storePath) return;
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2), "utf8");
}

function saveRecordToStores(
  dccBookingId: string,
  bookingUuid: string,
  record: any,
  idempotencyEntry?: { key: string; payloadHash: string; result: any }
): void {
  if (simulatePersistenceFailureForTests) {
    throw new Error("SIMULATED_LOCAL_BOOKING_PERSISTENCE_FAILURE");
  }
  fallbackBookingUuidMap.set(dccBookingId, bookingUuid);
  fallbackBookingUuidMap.set(bookingUuid, bookingUuid);
  if (record.supplierReference) {
    fallbackBookingUuidMap.set(record.supplierReference, bookingUuid);
  }
  fallbackBookingRecordMap.set(dccBookingId, record);
  fallbackBookingRecordMap.set(bookingUuid, record);
  if (record.supplierReference) {
    fallbackBookingRecordMap.set(record.supplierReference, record);
  }
  if (idempotencyEntry) {
    fallbackIdempotencyStore.set(idempotencyEntry.key, {
      payloadHash: idempotencyEntry.payloadHash,
      result: idempotencyEntry.result,
    });
  }

  const storePath = getDurableBookingStorePath();
  if (storePath) {
    const current = readDurableStore();
    current.uuidMap[dccBookingId] = bookingUuid;
    current.uuidMap[bookingUuid] = bookingUuid;
    if (record.supplierReference) {
      current.uuidMap[record.supplierReference] = bookingUuid;
    }
    current.records[dccBookingId] = record;
    current.records[bookingUuid] = record;
    if (record.supplierReference) {
      current.records[record.supplierReference] = record;
    }
    if (idempotencyEntry) {
      current.idempotency[idempotencyEntry.key] = {
        payloadHash: idempotencyEntry.payloadHash,
        result: idempotencyEntry.result,
      };
    }
    writeDurableStore(current);
  }
}

function loadRecordFromFallbackOrDurable(idOrUuid: string): any | null {
  const inMemory =
    fallbackBookingRecordMap.get(idOrUuid) ||
    fallbackBookingRecordMap.get(fallbackBookingUuidMap.get(idOrUuid) || "");
  if (inMemory) return inMemory;

  const storePath = getDurableBookingStorePath();
  if (storePath) {
    const current = readDurableStore();
    const mappedUuid = current.uuidMap[idOrUuid];
    const found =
      current.records[idOrUuid] || (mappedUuid ? current.records[mappedUuid] : null) || null;
    if (found) {
      fallbackBookingRecordMap.set(idOrUuid, found);
      if (found.id) fallbackBookingRecordMap.set(found.id, found);
      if (found.uuid) fallbackBookingRecordMap.set(found.uuid, found);
      return found;
    }
  }
  return null;
}

function loadIdempotencyFromFallbackOrDurable(
  idempotencyKey: string
): { payloadHash: string; result: any } | null {
  const inMemory = fallbackIdempotencyStore.get(idempotencyKey);
  if (inMemory) return inMemory;

  const storePath = getDurableBookingStorePath();
  if (storePath) {
    const current = readDurableStore();
    const entry = current.idempotency[idempotencyKey] || null;
    if (entry) {
      fallbackIdempotencyStore.set(idempotencyKey, entry);
      return entry;
    }
  }
  return null;
}

export class DccBookingService {
  /**
   * Registers a verified or pilot supplier connection (e.g., GoSno Rezdy v1 pilot)
   */
  static registerPilotSupplierConnection(config: {
    id: string;
    operatorSlug: string;
    operatorName: string;
    endpoint: string;
    reservationPlatform: "rezdy" | "fareharbor" | "bokun" | "ventrata" | "direct_octo";
    commissionPercent: number;
    apiKey?: string;
    bearerToken?: string;
    isSandbox?: boolean;
    connectionStatus?: string;
    adapter?: OctoProviderAdapter;
  }): OctoProviderAdapter {
    const connection = {
      id: config.id,
      operatorSlug: config.operatorSlug,
      operatorName: config.operatorName,
      endpoint: config.endpoint,
      reservationPlatform: config.reservationPlatform,
      commissionPercent: config.commissionPercent,
      connectionStatus: config.connectionStatus || "sandbox_verified",
      isSandbox: config.isSandbox ?? true,
    };
    const adapter =
      config.adapter ||
      getProviderAdapterForConnection(connection as any, {
        apiKey: config.apiKey,
        bearerToken: config.bearerToken,
      });
    registeredPilotConnections.set(config.id, { connection, adapter });
    return adapter;
  }

  static clearPilotSupplierConnections(): void {
    registeredPilotConnections.clear();
  }

  static setSimulatePersistenceFailureForTests(enabled: boolean): void {
    simulatePersistenceFailureForTests = enabled;
  }

  static setDurableBookingStorePathForTests(filePath: string | null): void {
    customDurableStorePathForTests = filePath;
  }

  static clearInMemoryStoresOnlyForTests(): void {
    fallbackBookingUuidMap.clear();
    fallbackIdempotencyStore.clear();
    fallbackBookingRecordMap.clear();
    inFlightHoldLocks.clear();
  }

  static resetFallbackStoresForTests(): void {
    fallbackBookingUuidMap.clear();
    fallbackIdempotencyStore.clear();
    fallbackBookingRecordMap.clear();
    inFlightHoldLocks.clear();
    simulatePersistenceFailureForTests = false;
    if (customDurableStorePathForTests && fs.existsSync(customDurableStorePathForTests)) {
      try {
        fs.unlinkSync(customDurableStorePathForTests);
      } catch {
        // ignore cleanup error
      }
    }
  }

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
    if (resolveGosnoRezdyProductMapping(productId)) {
      return "conn_gosno_rezdy";
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

    const pilotRegistered = registeredPilotConnections.get(connectionId);
    if (pilotRegistered) {
      if (isProd && pilotRegistered.connection.connectionStatus !== "bookable") {
        throw new OctoApiError(
          403,
          "SUPPLIER_NOT_BOOKABLE",
          `Supplier ${pilotRegistered.connection.operatorName} is in ${pilotRegistered.connection.connectionStatus} state and cannot accept production bookings`
        );
      }
      return {
        adapter: pilotRegistered.adapter,
        isMock: false,
        connection: pilotRegistered.connection,
      };
    }

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
   * Check real-time availability for a product/option.
   * Preserves truthful availability states:
   * - Quote-only products return status: "QUOTE_ONLY", available: false, bookable: false, localDateTimeStart: null
   * - Dates with 0 returned sessions return status: "NO_SESSIONS", available: false, bookable: false, localDateTimeStart: null
   * - Never fabricates "SOLD_OUT" or an invented "10:00:00" departure time for missing sessions or quote-only items.
   */
  static async checkAvailability(
    productId: string,
    optionId: string,
    availabilityId: string,
    unitItems: any[] = []
  ): Promise<{
    available: boolean;
    bookable?: boolean;
    id: string;
    status?: string;
    vacancies?: number | null;
    quoteOnly?: boolean;
    reason?: string;
    localDateTimeStart?: string | null;
  }> {
    const gosnoMapped = resolveGosnoRezdyProductMapping(productId);
    const supplierConnId = await this.resolveConnectionForProduct(productId);
    const { adapter, isMock } = await this.getAdapterForConnection(supplierConnId);

    if (isMock) {
      const dateMatch = availabilityId.match(/\d{4}-\d{2}-\d{2}/);
      const checkDate = dateMatch ? dateMatch[0] : "2026-09-20";
      const slots = MockOctoSupplierEngine.checkAvailability(productId, optionId, checkDate, unitItems);
      const found = slots.find((s) => s.id === availabilityId || s.available);
      const isAvail = Boolean(found?.available && found.status !== "SOLD_OUT");
      return {
        available: isAvail,
        bookable: isAvail,
        id: availabilityId,
        status: found?.status || (slots.length === 0 ? "NO_SESSIONS" : "SOLD_OUT"),
        vacancies: found?.vacancies ?? null,
        localDateTimeStart: found?.localDateTimeStart ?? null,
      };
    }

    if (adapter) {
      const dateMatch = availabilityId.match(/\d{4}-\d{2}-\d{2}/);
      if (!dateMatch) {
        throw new OctoApiError(
          400,
          "MISSING_AVAILABILITY_DATE",
          `Availability query "${availabilityId}" must include an explicit YYYY-MM-DD date.`
        );
      }
      const checkDate = dateMatch[0];

      if (gosnoMapped && (gosnoMapped.quoteOnly || !gosnoMapped.onlineBookable)) {
        // Still allow adapter call if needed for audit, which returns []
        await adapter.checkAvailability(productId, optionId, checkDate, unitItems);
        return {
          available: false,
          bookable: false,
          id: availabilityId,
          status: "QUOTE_ONLY",
          vacancies: null,
          quoteOnly: true,
          reason: `QUOTE_ONLY_PRODUCT: ${gosnoMapped.title} (${gosnoMapped.rezdyProductCode}) requires a custom quote and is non-bookable online`,
          localDateTimeStart: null,
        };
      }

      const avail = await adapter.checkAvailability(productId, optionId, checkDate, unitItems);
      if (avail.length === 0) {
        return {
          available: false,
          bookable: false,
          id: availabilityId,
          status: "NO_SESSIONS",
          vacancies: null,
          quoteOnly: false,
          reason: `NO_SESSIONS_RETURNED: Provider returned 0 sessions for ${productId} on ${checkDate}`,
          localDateTimeStart: null,
        };
      }

      const isDateOnlyQuery = /^\d{4}-\d{2}-\d{2}$/.test(availabilityId.trim());
      const exactSlot = isDateOnlyQuery
        ? avail.find((s: any) => s.available && s.status === "AVAILABLE") || avail[0]
        : avail.find((s: any) => s.id === availabilityId) ||
          avail.find((s: any) => s.localDateTimeStart === availabilityId);

      if (!exactSlot) {
        return {
          available: false,
          bookable: false,
          id: availabilityId,
          status: "NO_SESSIONS",
          vacancies: null,
          quoteOnly: false,
          reason: `REQUESTED_SESSION_NOT_FOUND: Session "${availabilityId}" was not returned by provider on ${checkDate}`,
          localDateTimeStart: null,
        };
      }

      const isAvailable = Boolean(
        exactSlot.available &&
          exactSlot.status === "AVAILABLE" &&
          !(exactSlot as any).quoteOnly
      );
      return {
        available: isAvailable,
        bookable: isAvailable,
        id: exactSlot.id,
        status: exactSlot.status,
        vacancies: exactSlot.vacancies ?? null,
        quoteOnly: Boolean((exactSlot as any).quoteOnly),
        reason: (exactSlot as any).reason,
        localDateTimeStart: exactSlot.localDateTimeStart || null,
      };
    }

    return { available: true, bookable: true, id: availabilityId };
  }

  /**
   * Step 1: Create a Booking Reservation Hold
   * Includes concurrent duplicate request protection and local persistence rollback compensation.
   */
  static async createHold(
    params: DccBookingHoldRequest
  ): Promise<OctoBookingResult & { dccBookingId: string }> {
    const db = getDb();

    // Enforce Idempotency (persisted + in-flight concurrent lock)
    const payloadHash = hashPayload({
      productId: params.productId,
      optionId: params.optionId,
      availabilityId: params.availabilityId,
      unitItems: params.unitItems,
    });

    if (params.idempotencyKey) {
      // 1. Check in-flight lock for concurrent duplicate requests
      const inFlight = inFlightHoldLocks.get(params.idempotencyKey);
      if (inFlight) {
        if (inFlight.payloadHash !== payloadHash) {
          throw new OctoApiError(
            400,
            "ALTERED_IDEMPOTENCY_REQUEST",
            "Idempotency key is currently in flight with a different booking request payload"
          );
        }
        return inFlight.promise;
      }

      // 2. Check DB or local/durable idempotency store
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
        const existing = loadIdempotencyFromFallbackOrDurable(params.idempotencyKey);
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

    const executeHoldCreation = async (): Promise<OctoBookingResult & { dccBookingId: string }> => {
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
            s.id === params.availabilityId ||
            (params.availabilityId === "avail_slot_1" && s.available)
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
          contact: params.contact,
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
            contact: params.contact,
            pickupLocation: params.pickupLocation,
            customFields: params.customFields,
            participants: params.participants,
            notes: params.notes,
          },
          params.idempotencyKey
        );
      } else {
        throw new Error("ADAPTER_INITIALIZATION_FAILED");
      }

      const lifecycleStates: DccBookingLifecycleStates = {
        bookingStatus: holdResult.status,
        paymentStatus: "unpaid",
        serviceCompletionStatus: "scheduled",
        commissionEligibilityStatus: "ineligible_unconfirmed",
        cancellationStatus: "active",
        refundStatus: "none",
      };

      const fullResult: OctoBookingResult & { dccBookingId: string } = {
        ...holdResult,
        id: dccBookingId,
        dccBookingId,
        lifecycleStates,
      };

      const record = {
        ...fullResult,
        id: dccBookingId,
        bookingUuid: holdResult.uuid,
        uuid: holdResult.uuid,
        idempotencyHash: payloadHash,
        resellerId: params.resellerId,
        supplierConnectionId: params.supplierConnectionId,
        lifecycleStates,
      };

      try {
        if (simulatePersistenceFailureForTests) {
          throw new Error("SIMULATED_LOCAL_BOOKING_PERSISTENCE_FAILURE");
        }

        // Persist hold in Neon if configured
        if (db) {
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
        }

        saveRecordToStores(
          dccBookingId,
          holdResult.uuid,
          record,
          params.idempotencyKey
            ? {
                key: params.idempotencyKey,
                payloadHash,
                result: fullResult,
              }
            : undefined
        );
      } catch (persistErr: any) {
        // Compensating action: cancel the upstream hold so no orphaned hold remains in Rezdy
        try {
          if (isMock) {
            MockOctoSupplierEngine.cancelBooking(
              holdResult.uuid,
              "Automatic rollback due to local DCC booking persistence failure"
            );
          } else if (adapter) {
            await adapter.cancelBooking(
              holdResult.supplierReference || holdResult.uuid,
              "Automatic rollback due to local DCC booking persistence failure"
            );
          }
        } catch {
          // Best-effort upstream rollback
        }

        throw new OctoApiError(
          503,
          "BOOKING_PERSISTENCE_FAILED",
          `Failed to persist booking hold locally (${persistErr.message}); upstream supplier hold ${holdResult.supplierReference || holdResult.uuid} was rolled back.`
        );
      }

      return fullResult;
    };

    if (params.idempotencyKey) {
      const promise = executeHoldCreation();
      inFlightHoldLocks.set(params.idempotencyKey, { payloadHash, promise });
      try {
        return await promise;
      } finally {
        inFlightHoldLocks.delete(params.idempotencyKey);
      }
    }

    return executeHoldCreation();
  }

  /**
   * Step 2: Confirm a Booking Reservation
   * Separates booking confirmation from payment capture, service completion, and commission eligibility.
   * Requires verifiedPaymentEvidence before recording paymentStatus: "captured".
   */
  static async confirmReservation(
    params: DccBookingConfirmRequest & { supplierConnectionId?: string }
  ): Promise<OctoBookingResult> {
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
      bookingRecord = loadRecordFromFallbackOrDurable(params.bookingId);
    }

    // Stateless cross-instance recovery: if not in local memory, query upstream adapter if connection is known
    if (!bookingRecord && params.supplierConnectionId) {
      const { adapter } = await this.getAdapterForConnection(params.supplierConnectionId);
      if (adapter) {
        const remoteBooking = await adapter.getBooking(params.bookingId);
        bookingRecord = {
          ...remoteBooking,
          id: remoteBooking.resellerReference || remoteBooking.id,
          bookingUuid: remoteBooking.uuid,
          uuid: remoteBooking.uuid,
          supplierConnectionId: params.supplierConnectionId,
        };
      }
    }

    // Verify ownership
    if (
      params.resellerId &&
      bookingRecord?.resellerId &&
      bookingRecord.resellerId !== params.resellerId
    ) {
      throw new OctoApiError(
        403,
        "FORBIDDEN",
        "Reseller is not authorized to confirm bookings owned by another account"
      );
    }

    // Validate verifiedPaymentEvidence if provided or if caller claims payment is captured
    let verifiedPaymentEvidence: OctoVerifiedPaymentEvidence | undefined;
    if (params.verifiedPaymentEvidence) {
      verifiedPaymentEvidence = validateVerifiedPaymentEvidence(
        params.verifiedPaymentEvidence,
        bookingRecord ? Number(bookingRecord.totalPrice) : undefined
      );
    } else if (params.requireVerifiedPayment || params.payment?.status === "captured") {
      throw new OctoApiError(
        422,
        "UNVERIFIED_PAYMENT_EVIDENCE",
        "Cannot record paymentStatus 'captured' on confirmation without verifiedPaymentEvidence (verified: true, provider, transactionId, capturedAmount, currency, capturedAt)."
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
        pickupLocation: bookingRecord.pickupLocation,
        customFields: bookingRecord.customFields,
        participants: bookingRecord.participants,
        voucher: bookingRecord.voucher,
        utcHoldExpires: null,
        confirmedAt: bookingRecord.confirmedAt?.toISOString?.() || bookingRecord.confirmedAt,
        supplierReference: bookingRecord.supplierReference,
        resellerReference: bookingRecord.resellerReference,
        lifecycleStates: bookingRecord.lifecycleStates,
        verifiedPaymentEvidence: bookingRecord.verifiedPaymentEvidence,
      };
    }

    const supplierConnectionId =
      bookingRecord?.supplierConnectionId ||
      params.supplierConnectionId ||
      "conn_mock_alaska";
    const { adapter, isMock, connection } = await this.getAdapterForConnection(supplierConnectionId);

    // Deterministic Hold Expiration Check
    if (bookingRecord?.utcHoldExpires) {
      const expiresAt = new Date(bookingRecord.utcHoldExpires).getTime();
      if (Date.now() > expiresAt) {
        bookingRecord.status = "EXPIRED";
        if (bookingRecord.lifecycleStates) {
          bookingRecord.lifecycleStates.bookingStatus = "EXPIRED";
        }
        if (db) {
          await db
            .update(octoBookings)
            .set({ status: "EXPIRED", updatedAt: new Date() })
            .where(eq(octoBookings.id, bookingRecord.id));
        }
        saveRecordToStores(
          bookingRecord.id,
          bookingRecord.bookingUuid || bookingRecord.uuid,
          bookingRecord
        );
        // Best-effort upstream hold release when hold is expired
        if (adapter && (bookingRecord.supplierReference || bookingRecord.uuid)) {
          try {
            await adapter.cancelBooking(
              bookingRecord.supplierReference || bookingRecord.uuid,
              "Hold expired before confirmation"
            );
          } catch {
            // ignore upstream error on expired hold cleanup
          }
        }
        throw new OctoApiError(
          400,
          "EXPIRED_HOLD",
          "The reservation hold has expired. Please check current availability and initiate a new hold."
        );
      }
    }

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

    let confirmedResult: OctoBookingResult;

    const supplierPayment = connection?.requiresPaymentDetails
      ? params.payment
      : params.payment
      ? {
          isPrepaid: params.payment.isPrepaid ?? Boolean(verifiedPaymentEvidence),
          ...(params.payment.currency ? { currency: params.payment.currency } : {}),
          ...(params.payment.amount != null ? { amount: params.payment.amount } : {}),
        }
      : { isPrepaid: Boolean(verifiedPaymentEvidence) };

    if (isMock) {
      confirmedResult = MockOctoSupplierEngine.confirmBooking(bookingUuid, {
        contact: params.contact,
        resellerReference: dccBookingId,
        payment: supplierPayment,
      });
    } else if (adapter) {
      confirmedResult = await adapter.confirmBooking(
        bookingRecord?.supplierReference || bookingUuid,
        {
          contact: params.contact,
          resellerReference: dccBookingId,
          payment: supplierPayment,
          verifiedPaymentEvidence,
          pickupLocation: params.pickupLocation,
          customFields: params.customFields,
          participants: params.participants,
          notes: params.notes,
        },
        params.idempotencyKey
      );
    } else {
      throw new Error("ADAPTER_INITIALIZATION_FAILED");
    }

    // Determine distinct payment, service completion, and commission eligibility states
    const paymentStatus: DccBookingLifecycleStates["paymentStatus"] = verifiedPaymentEvidence
      ? "captured"
      : params.payment?.status === "authorized"
      ? "authorized"
      : "unpaid";

    const lifecycleStates: DccBookingLifecycleStates = {
      bookingStatus: "CONFIRMED",
      paymentStatus,
      serviceCompletionStatus: "scheduled",
      commissionEligibilityStatus: verifiedPaymentEvidence
        ? "pending_service_completion"
        : "ineligible_unpaid",
      cancellationStatus: "active",
      refundStatus: "none",
    };

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
            paymentStatus,
            commissionEligibilityStatus: lifecycleStates.commissionEligibilityStatus,
          },
        });
      } catch (err: any) {
        console.error("Database error updating booking to CONFIRMED:", err.message);
      }
    }

    // Record DCC Commission Settlement Ledger Entry with strict payment & lifecycle states
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
      paymentStatus,
      verifiedPaymentEvidence,
      serviceCompletionStatus: lifecycleStates.serviceCompletionStatus,
      commissionEligibilityStatus: lifecycleStates.commissionEligibilityStatus,
      cancellationStatus: lifecycleStates.cancellationStatus,
      refundStatus: lifecycleStates.refundStatus,
      settlementStatus: verifiedPaymentEvidence ? "pending" : "awaiting_payment",
      metadata: {
        confirmedAt: confirmedResult.confirmedAt,
        voucherCode: confirmedResult.voucher?.code,
      },
    });

    const updated: OctoBookingResult = {
      ...confirmedResult,
      id: dccBookingId,
      lifecycleStates,
      verifiedPaymentEvidence,
    };
    const confirmedRecord = {
      ...bookingRecord,
      ...updated,
      id: dccBookingId,
      bookingUuid: confirmedResult.uuid || bookingUuid,
      uuid: confirmedResult.uuid || bookingUuid,
      supplierConnectionId,
      status: "CONFIRMED",
      lifecycleStates,
      verifiedPaymentEvidence,
    };
    saveRecordToStores(
      dccBookingId,
      confirmedRecord.uuid,
      confirmedRecord
    );

    return updated;
  }

  /**
   * Transitions a booking's paymentStatus to "captured" after verified payment evidence is supplied.
   */
  static async recordVerifiedPaymentCapture(
    bookingIdOrUuid: string,
    verifiedPaymentEvidence: OctoVerifiedPaymentEvidence,
    options?: { supplierConnectionId?: string }
  ): Promise<OctoBookingResult> {
    const booking = await this.getBooking(bookingIdOrUuid, options);
    const validatedEvidence = validateVerifiedPaymentEvidence(
      verifiedPaymentEvidence,
      booking.totalPrice
    );
    const bookingKey = booking.id || bookingIdOrUuid;
    const rawRecord = loadRecordFromFallbackOrDurable(bookingKey) || booking;

    const currentLifecycle: DccBookingLifecycleStates = rawRecord.lifecycleStates || {
      bookingStatus: booking.status,
      paymentStatus: "unpaid",
      serviceCompletionStatus: "scheduled",
      commissionEligibilityStatus: "ineligible_unpaid",
      cancellationStatus: booking.status === "CANCELLED" ? "cancelled" : "active",
      refundStatus: "none",
    };

    const nextCommissionEligibility: DccBookingLifecycleStates["commissionEligibilityStatus"] =
      currentLifecycle.cancellationStatus === "cancelled"
        ? "ineligible_cancelled"
        : currentLifecycle.serviceCompletionStatus === "completed"
        ? "eligible"
        : "pending_service_completion";

    const updatedLifecycle: DccBookingLifecycleStates = {
      ...currentLifecycle,
      paymentStatus: "captured",
      commissionEligibilityStatus: nextCommissionEligibility,
    };

    await DccSettlementEngine.recordVerifiedPaymentCapture({
      bookingId: bookingKey,
      verifiedPaymentEvidence: validatedEvidence,
    });

    const updatedRecord = {
      ...rawRecord,
      ...booking,
      lifecycleStates: updatedLifecycle,
      verifiedPaymentEvidence: validatedEvidence,
    };
    saveRecordToStores(bookingKey, booking.uuid, updatedRecord);
    return updatedRecord;
  }

  /**
   * Marks the physical tour/transfer service as completed.
   * Commission only transitions to "eligible" if service is completed AND payment is captured.
   */
  static async markServiceCompleted(
    bookingIdOrUuid: string,
    completedAt?: string,
    options?: { supplierConnectionId?: string }
  ): Promise<OctoBookingResult> {
    const booking = await this.getBooking(bookingIdOrUuid, options);
    if (booking.status !== "CONFIRMED") {
      throw new OctoApiError(
        409,
        "BOOKING_NOT_CONFIRMED",
        `Cannot mark service completed for booking ${bookingIdOrUuid} in status ${booking.status}`
      );
    }

    const bookingKey = booking.id || bookingIdOrUuid;
    const rawRecord = loadRecordFromFallbackOrDurable(bookingKey) || booking;
    const currentLifecycle: DccBookingLifecycleStates = rawRecord.lifecycleStates || {
      bookingStatus: booking.status,
      paymentStatus: "unpaid",
      serviceCompletionStatus: "scheduled",
      commissionEligibilityStatus: "ineligible_unpaid",
      cancellationStatus: "active",
      refundStatus: "none",
    };

    const ledgerEntry = await DccSettlementEngine.markServiceCompleted(bookingKey, completedAt);
    const updatedLifecycle: DccBookingLifecycleStates = {
      ...currentLifecycle,
      serviceCompletionStatus: "completed",
      commissionEligibilityStatus:
        ledgerEntry?.commissionEligibilityStatus ||
        (currentLifecycle.paymentStatus === "captured" ||
        currentLifecycle.paymentStatus === "partially_refunded"
          ? "eligible"
          : "ineligible_unpaid"),
    };

    const updatedRecord = {
      ...rawRecord,
      ...booking,
      lifecycleStates: updatedLifecycle,
    };
    saveRecordToStores(bookingKey, booking.uuid, updatedRecord);
    return updatedRecord;
  }

  /**
   * Records a verified full or partial refund against a booking with explicit refund evidence.
   */
  static async recordVerifiedRefund(
    bookingIdOrUuid: string,
    verifiedRefundEvidence: OctoVerifiedRefundEvidence,
    options?: { supplierConnectionId?: string }
  ): Promise<OctoBookingResult> {
    const booking = await this.getBooking(bookingIdOrUuid, options);
    const validatedRefund = validateVerifiedRefundEvidence(
      verifiedRefundEvidence,
      booking.totalPrice
    );
    const bookingKey = booking.id || bookingIdOrUuid;
    const rawRecord = loadRecordFromFallbackOrDurable(bookingKey) || booking;
    const ledgerId = `dcc:ledg:${bookingKey.replace(/^dcc:bk:/, "")}`;

    await DccSettlementEngine.recordCancellationSettlement({
      ledgerId,
      bookingId: bookingKey,
      refundType: validatedRefund.refundType,
      refundAmount: validatedRefund.refundedAmount,
      verifiedRefundEvidence: validatedRefund,
    });

    const currentLifecycle: DccBookingLifecycleStates = rawRecord.lifecycleStates || {
      bookingStatus: booking.status,
      paymentStatus: "captured",
      serviceCompletionStatus: "scheduled",
      commissionEligibilityStatus: "pending_service_completion",
      cancellationStatus: booking.status === "CANCELLED" ? "cancelled" : "active",
      refundStatus: "none",
    };

    const updatedLifecycle: DccBookingLifecycleStates = {
      ...currentLifecycle,
      paymentStatus: validatedRefund.refundType === "full" ? "refunded" : "partially_refunded",
      refundStatus: validatedRefund.refundType === "full" ? "full_refund" : "partial_refund",
      commissionEligibilityStatus:
        validatedRefund.refundType === "full"
          ? "ineligible_cancelled"
          : currentLifecycle.commissionEligibilityStatus,
    };

    const updatedRecord = {
      ...rawRecord,
      ...booking,
      lifecycleStates: updatedLifecycle,
      verifiedRefundEvidence: validatedRefund,
    };
    saveRecordToStores(bookingKey, booking.uuid, updatedRecord);
    return updatedRecord;
  }

  /**
   * Step 3: Retrieve Booking by UUID or DCC reference ID
   * Preserves deterministic hold expiry and never generates a fresh 15-minute expiry on retrieval.
   */
  static async getBooking(
    bookingIdOrUuid: string,
    options?: { resellerId?: string; supplierConnectionId?: string }
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
      bookingRecord = loadRecordFromFallbackOrDurable(bookingIdOrUuid);
    }

    if (!bookingRecord && options?.supplierConnectionId) {
      const { adapter } = await this.getAdapterForConnection(options.supplierConnectionId);
      if (adapter) {
        const remote = await adapter.getBooking(bookingIdOrUuid);
        return remote;
      }
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

    // Deterministic Hold Expiry Evaluation (never refreshes utcHoldExpires)
    const utcHoldExpiresStr = bookingRecord.utcHoldExpires
      ? bookingRecord.utcHoldExpires.toISOString?.() || bookingRecord.utcHoldExpires
      : null;

    if (bookingRecord.status === "ON_HOLD" && utcHoldExpiresStr) {
      const expiresMs = new Date(utcHoldExpiresStr).getTime();
      if (Date.now() > expiresMs) {
        bookingRecord.status = "EXPIRED";
        if (bookingRecord.lifecycleStates) {
          bookingRecord.lifecycleStates.bookingStatus = "EXPIRED";
        }
        saveRecordToStores(
          bookingRecord.id || bookingIdOrUuid,
          bookingRecord.bookingUuid || bookingRecord.uuid || bookingIdOrUuid,
          bookingRecord
        );
      }
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
      pickupLocation: bookingRecord.pickupLocation,
      customFields: bookingRecord.customFields,
      participants: bookingRecord.participants,
      voucher: bookingRecord.voucher,
      confirmedAt: bookingRecord.confirmedAt?.toISOString?.() || bookingRecord.confirmedAt,
      cancelledAt: bookingRecord.cancelledAt?.toISOString?.() || bookingRecord.cancelledAt,
      cancellationReason: bookingRecord.cancellationReason,
      supplierReference: bookingRecord.supplierReference,
      resellerReference: bookingRecord.resellerReference,
      utcHoldExpires: utcHoldExpiresStr,
      lifecycleStates: bookingRecord.lifecycleStates,
      verifiedPaymentEvidence: bookingRecord.verifiedPaymentEvidence,
      verifiedRefundEvidence: bookingRecord.verifiedRefundEvidence,
    };
  }

  /**
   * Step 4: List Bookings
   */
  static async listBookings(options?: {
    resellerId?: string;
    status?: string;
    limit?: number;
  }): Promise<OctoBookingResult[]> {
    const db = getDb();
    if (db) {
      try {
        const query = db.select().from(octoBookings);
        const conditions = [];
        if (options?.resellerId) conditions.push(eq(octoBookings.resellerId, options.resellerId));
        if (options?.status) conditions.push(eq(octoBookings.status, options.status));
        const rows =
          conditions.length > 0
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

    // Deduplicate records stored by both DCC ID and UUID
    const uniqueById = new Map<string, any>();
    for (const b of fallbackBookingRecordMap.values()) {
      const key = b.id || b.uuid;
      if (key) uniqueById.set(key, b);
    }
    let all = Array.from(uniqueById.values());
    if (options?.resellerId) {
      all = all.filter((b) => b.resellerId === options.resellerId);
    }
    if (options?.status) {
      all = all.filter((b) => b.status === options.status);
    }
    return all;
  }

  /**
   * Step 5: Update Booking (delegates to full-object GET + preserve + PUT on upstream adapter)
   */
  static async updateBooking(
    bookingIdOrUuid: string,
    patch: {
      contact?: any;
      notes?: string;
      internalNotes?: string;
      pickupLocation?: OctoPickupLocation;
      customFields?: OctoCustomBookingField[];
      participants?: OctoParticipantField[][];
      verifiedPaymentEvidence?: OctoVerifiedPaymentEvidence;
    },
    options?: { resellerId?: string; supplierConnectionId?: string }
  ): Promise<OctoBookingResult> {
    const booking = await this.getBooking(bookingIdOrUuid, options);
    const db = getDb();
    const bookingKey = booking.id || bookingIdOrUuid;
    const rawRecord = loadRecordFromFallbackOrDurable(bookingKey) || booking;
    const supplierConnectionId =
      rawRecord?.supplierConnectionId ||
      options?.supplierConnectionId ||
      (await this.resolveConnectionForProduct(booking.productId));

    let upstreamUpdated: Partial<OctoBookingResult> = {};
    const { adapter, isMock } = await this.getAdapterForConnection(supplierConnectionId);
    if (!isMock && adapter) {
      upstreamUpdated = await adapter.updateBooking(
        booking.supplierReference || booking.uuid,
        patch
      );
    }

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

    const updated: OctoBookingResult = {
      ...booking,
      ...upstreamUpdated,
      id: bookingKey,
      uuid: booking.uuid,
      contact:
        upstreamUpdated.contact ||
        (patch.contact ? { ...booking.contact, ...patch.contact } : booking.contact),
      pickupLocation: upstreamUpdated.pickupLocation || patch.pickupLocation || booking.pickupLocation,
      customFields: upstreamUpdated.customFields || patch.customFields || booking.customFields,
      participants: upstreamUpdated.participants || patch.participants || booking.participants,
      lifecycleStates: rawRecord?.lifecycleStates,
    };

    const mergedRecord = {
      ...rawRecord,
      ...updated,
      id: bookingKey,
      bookingUuid: booking.uuid,
      uuid: booking.uuid,
      supplierConnectionId,
    };
    saveRecordToStores(bookingKey, booking.uuid, mergedRecord);
    return updated;
  }

  /**
   * Step 6: Cancel a Booking
   * A cancellation does NOT automatically mean a full refund occurred.
   * Refund state depends on current payment state and verifiedRefundEvidence.
   */
  static async cancelBooking(
    bookingIdOrUuid: string,
    params?: DccBookingCancelRequest | string,
    options?: { resellerId?: string; supplierConnectionId?: string }
  ): Promise<OctoBookingResult> {
    const booking = await this.getBooking(bookingIdOrUuid, options);
    const db = getDb();
    const cancelOpts: DccBookingCancelRequest =
      typeof params === "string" ? { reason: params } : params || {};
    const reasonText = cancelOpts.reason || "Cancelled by customer request";

    if (booking.status === "CANCELLED") {
      return booking;
    }

    const bookingKey = booking.id || bookingIdOrUuid;
    const rawRecord = loadRecordFromFallbackOrDurable(bookingKey) || booking;
    const supplierConnectionId =
      rawRecord?.supplierConnectionId ||
      options?.supplierConnectionId ||
      (await this.resolveConnectionForProduct(booking.productId));

    let validatedRefundEvidence: OctoVerifiedRefundEvidence | undefined;
    if (cancelOpts.verifiedRefundEvidence) {
      validatedRefundEvidence = validateVerifiedRefundEvidence(
        cancelOpts.verifiedRefundEvidence,
        booking.totalPrice
      );
    }

    let upstreamCancelResult: Partial<OctoBookingResult> = {};
    try {
      const { adapter, isMock } = await this.getAdapterForConnection(supplierConnectionId);
      if (isMock) {
        upstreamCancelResult = MockOctoSupplierEngine.cancelBooking(booking.uuid, reasonText);
      } else if (adapter) {
        upstreamCancelResult = await adapter.cancelBooking(
          booking.supplierReference || booking.uuid,
          reasonText
        );
      }
    } catch (err: any) {
      if (err instanceof OctoApiError && err.status !== 404) {
        throw err;
      }
    }

    // Determine current payment state before cancellation
    const existingSettlement = await DccSettlementEngine.getSettlementEntry(bookingKey);
    const currentPaymentStatus: DccBookingLifecycleStates["paymentStatus"] =
      rawRecord?.lifecycleStates?.paymentStatus ||
      existingSettlement?.paymentStatus ||
      "unpaid";

    let refundType: "unpaid" | "none" | "pending" | "partial" | "full";
    let refundAmount = 0;
    let nextPaymentStatus: DccBookingLifecycleStates["paymentStatus"] = currentPaymentStatus;
    let nextRefundStatus: DccBookingLifecycleStates["refundStatus"];

    if (validatedRefundEvidence) {
      refundType = validatedRefundEvidence.refundType || "partial";
      refundAmount = validatedRefundEvidence.refundedAmount;
      nextPaymentStatus =
        refundType === "full" ? "refunded" : "partially_refunded";
      nextRefundStatus =
        refundType === "full" ? "full_refund" : "partial_refund";
    } else if (currentPaymentStatus === "unpaid") {
      refundType = "unpaid";
      refundAmount = 0;
      nextPaymentStatus = "unpaid";
      nextRefundStatus = "not_applicable_unpaid";
    } else if (cancelOpts.refundPolicyOutcome === "no_refund") {
      refundType = "none";
      refundAmount = 0;
      nextPaymentStatus = currentPaymentStatus;
      nextRefundStatus = "no_refund";
    } else {
      // Payment was captured or authorized, but no verified refund has been executed yet
      refundType = "pending";
      refundAmount = 0;
      nextPaymentStatus = currentPaymentStatus;
      nextRefundStatus = "pending_refund";
    }

    const updatedLifecycle: DccBookingLifecycleStates = {
      bookingStatus: "CANCELLED",
      paymentStatus: nextPaymentStatus,
      serviceCompletionStatus: "not_completed",
      commissionEligibilityStatus: "ineligible_cancelled",
      cancellationStatus: "cancelled",
      refundStatus: nextRefundStatus,
    };

    const cancelledResult: OctoBookingResult = {
      ...booking,
      ...upstreamCancelResult,
      id: bookingKey,
      uuid: booking.uuid,
      status: "CANCELLED",
      cancelledAt: upstreamCancelResult.cancelledAt || new Date().toISOString(),
      cancellationReason: reasonText,
      lifecycleStates: updatedLifecycle,
      verifiedRefundEvidence: validatedRefundEvidence || booking.verifiedRefundEvidence,
    };

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
            paymentStatus: nextPaymentStatus,
            refundStatus: nextRefundStatus,
          },
        });
      } catch (err: any) {
        console.error("Database error on cancelBooking:", err.message);
      }
    }

    // Record cancellation settlement adjustment without assuming automatic full refund
    const ledgerId = `dcc:ledg:${bookingKey.replace(/^dcc:bk:/, "")}`;
    await DccSettlementEngine.recordCancellationSettlement({
      ledgerId,
      bookingId: bookingKey,
      refundType,
      refundAmount,
      verifiedRefundEvidence: validatedRefundEvidence,
    });

    const updatedRecord = {
      ...rawRecord,
      ...cancelledResult,
      status: "CANCELLED",
      lifecycleStates: updatedLifecycle,
      verifiedRefundEvidence: validatedRefundEvidence || rawRecord?.verifiedRefundEvidence,
    };
    saveRecordToStores(bookingKey, booking.uuid, updatedRecord);
    return cancelledResult;
  }

  static async cancelReservation(
    bookingIdOrUuid: string,
    params?: DccBookingCancelRequest | string,
    options?: { resellerId?: string; supplierConnectionId?: string }
  ): Promise<OctoBookingResult> {
    return this.cancelBooking(bookingIdOrUuid, params, options);
  }
}

