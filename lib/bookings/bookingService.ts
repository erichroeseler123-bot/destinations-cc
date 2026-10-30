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
import { DccPaymentService } from "@/lib/payments/paymentService";
import { decryptCredential } from "@/lib/octo/security";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import {
  DccBookingCancelRequest,
  DccBookingConfirmRequest,
  DccBookingHoldRequest,
} from "./types";
import { eq, and, or } from "drizzle-orm";
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

function packContactWithDccMeta(
  contact: any,
  meta: {
    pickupLocation?: OctoPickupLocation;
    customFields?: OctoCustomBookingField[];
    participants?: OctoParticipantField[][];
    dccCheckoutDeadlineUtc?: string | null;
    lifecycleStates?: DccBookingLifecycleStates;
    verifiedPaymentEvidence?: OctoVerifiedPaymentEvidence;
    verifiedRefundEvidence?: OctoVerifiedRefundEvidence;
  }
): any {
  const baseContact = contact && typeof contact === "object" ? { ...contact } : {};
  delete (baseContact as any).__dccMeta;
  return {
    ...baseContact,
    __dccMeta: {
      pickupLocation: meta.pickupLocation,
      customFields: meta.customFields,
      participants: meta.participants,
      dccCheckoutDeadlineUtc: meta.dccCheckoutDeadlineUtc ?? null,
      lifecycleStates: meta.lifecycleStates,
      verifiedPaymentEvidence: meta.verifiedPaymentEvidence,
      verifiedRefundEvidence: meta.verifiedRefundEvidence,
    },
  };
}

function unpackDbBookingRow(r: any, settlementEntry?: any): any {
  const rawContact = r.contact && typeof r.contact === "object" ? { ...r.contact } : undefined;
  const dccMeta = rawContact?.__dccMeta || {};
  if (rawContact && "__dccMeta" in rawContact) {
    delete rawContact.__dccMeta;
  }
  const cleanContact =
    rawContact && Object.keys(rawContact).length > 0 ? rawContact : undefined;

  const utcHoldExpiresStr = r.utcHoldExpires
    ? r.utcHoldExpires.toISOString?.() || String(r.utcHoldExpires)
    : null;
  const dccCheckoutDeadlineUtc: string | null =
    dccMeta.dccCheckoutDeadlineUtc !== undefined
      ? dccMeta.dccCheckoutDeadlineUtc
      : r.createdAt && r.expirationMinutes
      ? new Date(
          new Date(r.createdAt).getTime() + Number(r.expirationMinutes) * 60 * 1000
        ).toISOString()
      : null;
  const dccCheckoutExpired =
    r.status === "ON_HOLD" && dccCheckoutDeadlineUtc
      ? Date.now() > new Date(dccCheckoutDeadlineUtc).getTime()
      : false;

  let lifecycleStates: DccBookingLifecycleStates | undefined = dccMeta.lifecycleStates;
  if (settlementEntry) {
    lifecycleStates = {
      bookingStatus: (r.status as any) || lifecycleStates?.bookingStatus || "CONFIRMED",
      paymentStatus: settlementEntry.paymentStatus,
      serviceCompletionStatus: settlementEntry.serviceCompletionStatus,
      commissionEligibilityStatus: settlementEntry.commissionEligibilityStatus,
      cancellationStatus: settlementEntry.cancellationStatus,
      refundStatus: settlementEntry.refundStatus,
    };
  } else if (!lifecycleStates) {
    lifecycleStates = {
      bookingStatus: r.status as any,
      paymentStatus: "unpaid",
      serviceCompletionStatus: r.status === "CANCELLED" ? "not_completed" : "scheduled",
      commissionEligibilityStatus:
        r.status === "CANCELLED"
          ? "ineligible_cancelled"
          : r.status === "CONFIRMED"
          ? "ineligible_unpaid"
          : "ineligible_unconfirmed",
      cancellationStatus: r.status === "CANCELLED" ? "cancelled" : "active",
      refundStatus: "none",
    };
  } else {
    lifecycleStates = {
      ...lifecycleStates,
      bookingStatus: r.status as any,
    };
  }

  return {
    id: r.id,
     dccBookingId: r.id,
    bookingUuid: r.bookingUuid,
    uuid: r.bookingUuid,
    idempotencyKey: r.idempotencyKey,
    idempotencyHash: r.idempotencyHash,
    supplierConnectionId: r.supplierConnectionId,
    resellerId: r.resellerId,
    status: r.status,
    productId: r.productId,
    optionId: r.optionId,
    availabilityId: r.availabilityId,
    expirationMinutes: r.expirationMinutes,
    totalPrice: Number(r.totalPrice),
    currency: r.currency,
    unitItems: (r.unitItems as any) || [],
    contact: cleanContact,
    pickupLocation: dccMeta.pickupLocation,
    customFields: dccMeta.customFields,
    participants: dccMeta.participants,
    voucher: r.voucher || undefined,
    utcHoldExpires: utcHoldExpiresStr,
    dccCheckoutDeadlineUtc,
    dccCheckoutExpired,
    confirmedAt: r.confirmedAt?.toISOString?.() || r.confirmedAt || undefined,
    cancelledAt: r.cancelledAt?.toISOString?.() || r.cancelledAt || undefined,
    cancellationReason: r.cancellationReason || undefined,
    supplierReference: r.supplierReference || undefined,
    resellerReference: r.resellerReference || undefined,
    checkoutUrl: r.checkoutUrl || undefined,
    lifecycleStates,
    verifiedPaymentEvidence:
      settlementEntry?.verifiedPaymentEvidence || dccMeta.verifiedPaymentEvidence,
    verifiedRefundEvidence:
      settlementEntry?.verifiedRefundEvidence || dccMeta.verifiedRefundEvidence,
  };
}

function buildBookingWhereClause(bookingIdOrUuid: string) {
  if (bookingIdOrUuid.startsWith("dcc:bk:")) {
    return eq(octoBookings.id, bookingIdOrUuid);
  }
  return or(
    eq(octoBookings.bookingUuid, bookingIdOrUuid),
    eq(octoBookings.supplierReference, bookingIdOrUuid)
  );
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

    // Enforce Idempotency (persisted + in-flight concurrent lock + cross-process DB lock)
    const payloadHash = hashPayload({
      productId: params.productId,
      optionId: params.optionId,
      availabilityId: params.availabilityId,
      unitItems: params.unitItems,
    });

    const waitForOrAcquireDbIdempotencyLock = async (
      idempotencyKey: string,
      dccBookingId: string,
      bookingUuid: string,
      expirationMinutes: number
    ): Promise<{
      completedResult?: OctoBookingResult & { dccBookingId: string };
      acquiredLock: boolean;
    }> => {
      if (!db || simulatePersistenceFailureForTests) {
        return { acquiredLock: false };
      }

      for (let attempt = 0; attempt < 120; attempt++) {
        const existingRows = await db
          .select()
          .from(octoBookings)
          .where(eq(octoBookings.idempotencyKey, idempotencyKey));

        if (existingRows.length > 0) {
          const b = existingRows[0];
          if (b.idempotencyHash && b.idempotencyHash !== payloadHash) {
            throw new OctoApiError(
              400,
              "ALTERED_IDEMPOTENCY_REQUEST",
              "Idempotency key was previously used with a different booking request payload"
            );
          }
          if (b.status !== "HOLD_IN_PROGRESS") {
            const settlementEntry = await DccSettlementEngine.getSettlementEntry(b.id).catch(
              () => null
            );
            const unpacked = unpackDbBookingRow(b, settlementEntry);
            return {
              completedResult: {
                ...unpacked,
                dccBookingId: b.id,
              },
              acquiredLock: false,
            };
          }
          // Another worker process is currently holding HOLD_IN_PROGRESS; wait and poll
          await new Promise((r) => setTimeout(r, 40));
          continue;
        }

        // Try to atomically insert the HOLD_IN_PROGRESS lock row
        try {
          await db.insert(octoBookings).values({
            id: dccBookingId,
            bookingUuid,
            idempotencyKey,
            idempotencyHash: payloadHash,
            supplierConnectionId: params.supplierConnectionId,
            resellerId: params.resellerId || null,
            productId: params.productId,
            optionId: params.optionId,
            availabilityId: params.availabilityId,
            status: "HOLD_IN_PROGRESS",
            expirationMinutes,
            utcHoldExpires: null,
            totalPrice: "0.00",
            currency: "USD",
            unitItems: params.unitItems as any,
            contact: packContactWithDccMeta(params.contact, {
              pickupLocation: params.pickupLocation,
              customFields: params.customFields,
              participants: params.participants,
            }),
            supplierReference: null,
            resellerReference: dccBookingId,
            checkoutUrl: null,
          });
          return { acquiredLock: true };
        } catch (insertErr: any) {
          const errCode = insertErr?.code || insertErr?.cause?.code || insertErr?.cause?.cause?.code;
          const errMsg = `${insertErr?.message || ""} ${insertErr?.cause?.message || ""} ${insertErr?.cause?.cause?.message || ""}`;
          const isUniqueViolation =
            errCode === "23505" ||
            errMsg.includes("UNIQUE constraint failed") ||
            errMsg.includes("duplicate key");
          if (isUniqueViolation) {
            await new Promise((r) => setTimeout(r, 25));
            continue;
          }
          throw insertErr;
        }
      }

      // Stale HOLD_IN_PROGRESS lock after timeout: take over lock so worker can reconcile upstream
      await db
        .delete(octoBookings)
        .where(
          and(
            eq(octoBookings.idempotencyKey, idempotencyKey),
            eq(octoBookings.status, "HOLD_IN_PROGRESS")
          )
        )
        .catch(() => {});
      return { acquiredLock: false };
    };

    if (params.idempotencyKey) {
      // 1. Check in-process lock for concurrent duplicate requests in the same worker
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

      // 2. When DB is not active, check local/durable idempotency store
      if (!db) {
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
      const deterministicSeed = params.idempotencyKey
        ? crypto.createHash("sha256").update(params.idempotencyKey).digest("hex")
        : null;
      const bookingUuid = deterministicSeed
        ? `${deterministicSeed.slice(0, 8)}-${deterministicSeed.slice(8, 12)}-4${deterministicSeed.slice(13, 16)}-a${deterministicSeed.slice(17, 20)}-${deterministicSeed.slice(20, 32)}`
        : crypto.randomUUID();
      const dccBookingId = `dcc:bk:${bookingUuid.slice(0, 12)}`;

      let acquiredDbLock = false;
      if (db && params.idempotencyKey) {
        const lockOutcome = await waitForOrAcquireDbIdempotencyLock(
          params.idempotencyKey,
          dccBookingId,
          bookingUuid,
          expirationMinutes
        );
        if (lockOutcome.completedResult) {
          return lockOutcome.completedResult;
        }
        acquiredDbLock = lockOutcome.acquiredLock;
      }

      const releaseDbLockOnError = async () => {
        if (acquiredDbLock && db) {
          await db
            .delete(octoBookings)
            .where(
              and(
                eq(octoBookings.id, dccBookingId),
                eq(octoBookings.status, "HOLD_IN_PROGRESS")
              )
            )
            .catch(() => {});
        }
      };

      let adapter: OctoProviderAdapter | null = null;
      let isMock = false;
      let connection: any = null;

      try {
        const resolved = await this.getAdapterForConnection(params.supplierConnectionId);
        adapter = resolved.adapter;
        isMock = resolved.isMock;
        connection = resolved.connection;

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
      } catch (preHoldErr) {
        await releaseDbLockOnError();
        throw preHoldErr;
      }

      let holdResult: OctoBookingResult;

      try {
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
      } catch (upstreamErr) {
        await releaseDbLockOnError();
        throw upstreamErr;
      }

      const dccCheckoutDeadlineUtc =
        holdResult.dccCheckoutDeadlineUtc ??
        new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();
      const dccCheckoutExpired =
        holdResult.dccCheckoutExpired ??
        Date.now() > new Date(dccCheckoutDeadlineUtc).getTime();

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
        dccCheckoutDeadlineUtc,
        dccCheckoutExpired,
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
        dccCheckoutDeadlineUtc,
        dccCheckoutExpired,
        lifecycleStates,
      };

      try {
        if (simulatePersistenceFailureForTests) {
          throw new Error("SIMULATED_LOCAL_BOOKING_PERSISTENCE_FAILURE");
        }

        const packedContact = packContactWithDccMeta(
          holdResult.contact || params.contact,
          {
            pickupLocation: holdResult.pickupLocation || params.pickupLocation,
            customFields: holdResult.customFields || params.customFields,
            participants: holdResult.participants || params.participants,
            dccCheckoutDeadlineUtc,
            lifecycleStates,
          }
        );

        if (db) {
          if (acquiredDbLock) {
            await db
              .update(octoBookings)
              .set({
                bookingUuid: holdResult.uuid,
                status: "ON_HOLD",
                expirationMinutes,
                utcHoldExpires: holdResult.utcHoldExpires
                  ? new Date(holdResult.utcHoldExpires)
                  : null,
                totalPrice: holdResult.totalPrice.toFixed(2),
                currency: holdResult.currency,
                unitItems: holdResult.unitItems as any,
                contact: packedContact,
                supplierReference: holdResult.supplierReference || null,
                resellerReference: holdResult.resellerReference || dccBookingId,
                checkoutUrl: holdResult.checkoutUrl || null,
                updatedAt: new Date(),
              })
              .where(eq(octoBookings.id, dccBookingId));
          } else {
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
              utcHoldExpires: holdResult.utcHoldExpires
                ? new Date(holdResult.utcHoldExpires)
                : null,
              totalPrice: holdResult.totalPrice.toFixed(2),
              currency: holdResult.currency,
              unitItems: holdResult.unitItems as any,
              contact: packedContact,
              supplierReference: holdResult.supplierReference || null,
              resellerReference: holdResult.resellerReference || dccBookingId,
              checkoutUrl: holdResult.checkoutUrl || null,
            });
          }

          await db.insert(octoAuditLogs).values({
            action: "BOOKING_HOLD_CREATED",
            entityType: "BOOKING",
            entityId: dccBookingId,
            status: "SUCCESS",
            payload: {
              bookingUuid: holdResult.uuid,
              expirationMinutes,
              utcHoldExpires: holdResult.utcHoldExpires,
              dccCheckoutDeadlineUtc,
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
        await releaseDbLockOnError();
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
   * Requires verifiedPaymentEvidence traced to an authoritative provider response or authenticated webhook before recording paymentStatus: "captured".
   */
  static async confirmReservation(
    params: DccBookingConfirmRequest & { supplierConnectionId?: string }
  ): Promise<OctoBookingResult> {
    const db = getDb();
    let bookingRecord: any = null;

    if (db) {
      const rows = await db
        .select()
        .from(octoBookings)
        .where(buildBookingWhereClause(params.bookingId));
      if (rows.length > 0) {
        const settlementEntry = await DccSettlementEngine.getSettlementEntry(rows[0].id).catch(
          () => null
        );
        bookingRecord = unpackDbBookingRow(rows[0], settlementEntry);
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

    // Validate verifiedPaymentEvidence and trace provenance to a real provider response or authenticated webhook
    let verifiedPaymentEvidence: OctoVerifiedPaymentEvidence | undefined;
    if (params.verifiedPaymentEvidence) {
      verifiedPaymentEvidence = validateVerifiedPaymentEvidence(
        params.verifiedPaymentEvidence,
        bookingRecord ? Number(bookingRecord.totalPrice) : undefined
      );
      verifiedPaymentEvidence = await DccPaymentService.assertTraceablePaymentEvidence(
        verifiedPaymentEvidence,
        bookingRecord ? Number(bookingRecord.totalPrice) : undefined
      );
    } else if (params.requireVerifiedPayment || params.payment?.status === "captured") {
      throw new OctoApiError(
        422,
        "UNVERIFIED_PAYMENT_EVIDENCE",
        "Cannot record paymentStatus 'captured' on confirmation without verifiedPaymentEvidence traced to a provider response or authenticated webhook."
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
        dccCheckoutDeadlineUtc: bookingRecord.dccCheckoutDeadlineUtc ?? null,
        dccCheckoutExpired: false,
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

    // 1. Authoritative Provider Hold Expiration Check (utcHoldExpires)
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

    // 2. Separate DCC Checkout Deadline Check (does NOT falsely mark the provider booking EXPIRED on Rezdy)
    if (bookingRecord?.dccCheckoutDeadlineUtc) {
      const dccDeadlineMs = new Date(bookingRecord.dccCheckoutDeadlineUtc).getTime();
      if (Date.now() > dccDeadlineMs) {
        bookingRecord.dccCheckoutExpired = true;
        throw new OctoApiError(
          400,
          "DCC_CHECKOUT_DEADLINE_EXPIRED",
          "The DCC checkout deadline has elapsed. Authoritative provider hold expiry was not reported by Rezdy, so confirmation is blocked by DCC checkout policy without falsely marking the provider booking EXPIRED."
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

    const mergedContact = confirmedResult.contact || params.contact || bookingRecord?.contact;
    const mergedPickup =
      confirmedResult.pickupLocation || params.pickupLocation || bookingRecord?.pickupLocation;
    const mergedCustomFields =
      confirmedResult.customFields || params.customFields || bookingRecord?.customFields;
    const mergedParticipants =
      confirmedResult.participants || params.participants || bookingRecord?.participants;

    // Update DB status to CONFIRMED without swallowing persistence failures
    try {
      if (simulatePersistenceFailureForTests) {
        throw new Error("SIMULATED_LOCAL_BOOKING_PERSISTENCE_FAILURE");
      }
      if (db) {
        await db
          .update(octoBookings)
          .set({
            status: "CONFIRMED",
            contact: packContactWithDccMeta(mergedContact, {
              pickupLocation: mergedPickup,
              customFields: mergedCustomFields,
              participants: mergedParticipants,
              dccCheckoutDeadlineUtc: bookingRecord?.dccCheckoutDeadlineUtc ?? null,
              lifecycleStates,
              verifiedPaymentEvidence,
            }),
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
      }
    } catch (err: any) {
      throw new OctoApiError(
        503,
        "BOOKING_PERSISTENCE_FAILED",
        `Failed to persist booking confirmation to database: ${err.message}`
      );
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
      contact: mergedContact,
      pickupLocation: mergedPickup,
      customFields: mergedCustomFields,
      participants: mergedParticipants,
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
   * Transitions a booking's paymentStatus to "captured" after verified payment evidence is supplied and traced.
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
    const traceableEvidence = await DccPaymentService.assertTraceablePaymentEvidence(
      validatedEvidence,
      booking.totalPrice
    );
    const bookingKey = booking.id || bookingIdOrUuid;
    const rawRecord = loadRecordFromFallbackOrDurable(bookingKey) || booking;

    const currentLifecycle: DccBookingLifecycleStates =
      booking.lifecycleStates ||
      rawRecord.lifecycleStates || {
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
      verifiedPaymentEvidence: traceableEvidence,
    });

    const db = getDb();
    try {
      if (simulatePersistenceFailureForTests) {
        throw new Error("SIMULATED_LOCAL_BOOKING_PERSISTENCE_FAILURE");
      }
      if (db) {
        await db
          .update(octoBookings)
          .set({
            contact: packContactWithDccMeta(booking.contact, {
              pickupLocation: booking.pickupLocation,
              customFields: booking.customFields,
              participants: booking.participants,
              dccCheckoutDeadlineUtc: booking.dccCheckoutDeadlineUtc ?? null,
              lifecycleStates: updatedLifecycle,
              verifiedPaymentEvidence: traceableEvidence,
              verifiedRefundEvidence: booking.verifiedRefundEvidence,
            }),
            updatedAt: new Date(),
          })
          .where(buildBookingWhereClause(bookingKey));
      }
    } catch (err: any) {
      throw new OctoApiError(
        503,
        "BOOKING_PERSISTENCE_FAILED",
        `Failed to persist verified payment capture to database: ${err.message}`
      );
    }

    const updatedRecord = {
      ...rawRecord,
      ...booking,
      lifecycleStates: updatedLifecycle,
      verifiedPaymentEvidence: traceableEvidence,
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
    const currentLifecycle: DccBookingLifecycleStates =
      booking.lifecycleStates ||
      rawRecord.lifecycleStates || {
        bookingStatus: booking.status,
        paymentStatus: "unpaid",
        serviceCompletionStatus: "scheduled",
        commissionEligibilityStatus: "ineligible_unpaid",
        cancellationStatus: "active",
        refundStatus: "none",
      };

    const ledgerEntry = await DccSettlementEngine.markServiceCompleted(bookingKey, completedAt);
    const effectivePaymentStatus =
      ledgerEntry?.paymentStatus || currentLifecycle.paymentStatus;
    const updatedLifecycle: DccBookingLifecycleStates = {
      ...currentLifecycle,
      paymentStatus: effectivePaymentStatus,
      serviceCompletionStatus: "completed",
      commissionEligibilityStatus:
        ledgerEntry?.commissionEligibilityStatus ||
        (effectivePaymentStatus === "captured" ||
        effectivePaymentStatus === "partially_refunded"
          ? "eligible"
          : "ineligible_unpaid"),
    };

    const db = getDb();
    try {
      if (simulatePersistenceFailureForTests) {
        throw new Error("SIMULATED_LOCAL_BOOKING_PERSISTENCE_FAILURE");
      }
      if (db) {
        await db
          .update(octoBookings)
          .set({
            contact: packContactWithDccMeta(booking.contact, {
              pickupLocation: booking.pickupLocation,
              customFields: booking.customFields,
              participants: booking.participants,
              dccCheckoutDeadlineUtc: booking.dccCheckoutDeadlineUtc ?? null,
              lifecycleStates: updatedLifecycle,
              verifiedPaymentEvidence: booking.verifiedPaymentEvidence,
              verifiedRefundEvidence: booking.verifiedRefundEvidence,
            }),
            updatedAt: new Date(),
          })
          .where(buildBookingWhereClause(bookingKey));
      }
    } catch (err: any) {
      throw new OctoApiError(
        503,
        "BOOKING_PERSISTENCE_FAILED",
        `Failed to persist service completion state to database: ${err.message}`
      );
    }

    const updatedRecord = {
      ...rawRecord,
      ...booking,
      lifecycleStates: updatedLifecycle,
    };
    saveRecordToStores(bookingKey, booking.uuid, updatedRecord);
    return updatedRecord;
  }

  /**
   * Records a verified full or partial refund against a booking with explicit traceable refund evidence.
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
    const traceableRefund = await DccPaymentService.assertTraceableRefundEvidence(
      validatedRefund,
      booking.totalPrice
    );
    const bookingKey = booking.id || bookingIdOrUuid;
    const rawRecord = loadRecordFromFallbackOrDurable(bookingKey) || booking;
    const ledgerId = `dcc:ledg:${bookingKey.replace(/^dcc:bk:/, "")}`;

    await DccSettlementEngine.recordCancellationSettlement({
      ledgerId,
      bookingId: bookingKey,
      refundType: traceableRefund.refundType || "full",
      refundAmount: traceableRefund.refundedAmount,
      verifiedRefundEvidence: traceableRefund,
    });

    const currentLifecycle: DccBookingLifecycleStates =
      booking.lifecycleStates ||
      rawRecord.lifecycleStates || {
        bookingStatus: booking.status,
        paymentStatus: "captured",
        serviceCompletionStatus: "scheduled",
        commissionEligibilityStatus: "pending_service_completion",
        cancellationStatus: booking.status === "CANCELLED" ? "cancelled" : "active",
        refundStatus: "none",
      };

    const updatedLifecycle: DccBookingLifecycleStates = {
      ...currentLifecycle,
      paymentStatus: traceableRefund.refundType === "full" ? "refunded" : "partially_refunded",
      refundStatus: traceableRefund.refundType === "full" ? "full_refund" : "partial_refund",
      commissionEligibilityStatus:
        traceableRefund.refundType === "full"
          ? "ineligible_cancelled"
          : currentLifecycle.commissionEligibilityStatus,
    };

    const db = getDb();
    try {
      if (simulatePersistenceFailureForTests) {
        throw new Error("SIMULATED_LOCAL_BOOKING_PERSISTENCE_FAILURE");
      }
      if (db) {
        await db
          .update(octoBookings)
          .set({
            contact: packContactWithDccMeta(booking.contact, {
              pickupLocation: booking.pickupLocation,
              customFields: booking.customFields,
              participants: booking.participants,
              dccCheckoutDeadlineUtc: booking.dccCheckoutDeadlineUtc ?? null,
              lifecycleStates: updatedLifecycle,
              verifiedPaymentEvidence: booking.verifiedPaymentEvidence,
              verifiedRefundEvidence: traceableRefund,
            }),
            updatedAt: new Date(),
          })
          .where(buildBookingWhereClause(bookingKey));
      }
    } catch (err: any) {
      throw new OctoApiError(
        503,
        "BOOKING_PERSISTENCE_FAILED",
        `Failed to persist verified refund state to database: ${err.message}`
      );
    }

    const updatedRecord = {
      ...rawRecord,
      ...booking,
      lifecycleStates: updatedLifecycle,
      verifiedRefundEvidence: traceableRefund,
    };
    saveRecordToStores(bookingKey, booking.uuid, updatedRecord);
    return updatedRecord;
  }

  /**
   * Step 3: Retrieve Booking by UUID or DCC reference ID
   * Preserves deterministic hold expiry and never marks a provider booking EXPIRED solely from the 15-minute DCC checkout deadline.
   */
  static async getBooking(
    bookingIdOrUuid: string,
    options?: { resellerId?: string; supplierConnectionId?: string }
  ): Promise<OctoBookingResult> {
    const db = getDb();
    let bookingRecord: any = null;

    if (db) {
      const rows = await db
        .select()
        .from(octoBookings)
        .where(buildBookingWhereClause(bookingIdOrUuid));
      if (rows.length > 0 && rows[0].status !== "HOLD_IN_PROGRESS") {
        const settlementEntry = await DccSettlementEngine.getSettlementEntry(rows[0].id).catch(
          () => null
        );
        bookingRecord = unpackDbBookingRow(rows[0], settlementEntry);
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

    // Authoritative Provider Hold Expiry Evaluation (only when utcHoldExpires is explicitly set)
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
        if (db && bookingRecord.id) {
          await db
            .update(octoBookings)
            .set({ status: "EXPIRED", updatedAt: new Date() })
            .where(eq(octoBookings.id, bookingRecord.id))
            .catch(() => {});
        }
        saveRecordToStores(
          bookingRecord.id || bookingIdOrUuid,
          bookingRecord.bookingUuid || bookingRecord.uuid || bookingIdOrUuid,
          bookingRecord
        );
      }
    }

    // Separate DCC checkout deadline evaluation (never marks the provider booking status EXPIRED)
    const dccCheckoutDeadlineUtc: string | null =
      bookingRecord.dccCheckoutDeadlineUtc ?? null;
    const dccCheckoutExpired =
      bookingRecord.status === "ON_HOLD" && dccCheckoutDeadlineUtc
        ? Date.now() > new Date(dccCheckoutDeadlineUtc).getTime()
        : Boolean(bookingRecord.dccCheckoutExpired);

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
      dccCheckoutDeadlineUtc,
      dccCheckoutExpired,
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
      const query = db.select().from(octoBookings);
      const conditions = [];
      if (options?.resellerId) conditions.push(eq(octoBookings.resellerId, options.resellerId));
      if (options?.status) conditions.push(eq(octoBookings.status, options.status));
      const rows =
        conditions.length > 0
          ? await query.where(and(...conditions)).limit(options?.limit || 50)
          : await query.limit(options?.limit || 50);

      const results: OctoBookingResult[] = [];
      for (const r of rows) {
        if (r.status === "HOLD_IN_PROGRESS") continue;
        const settlementEntry = await DccSettlementEngine.getSettlementEntry(r.id).catch(
          () => null
        );
        results.push(unpackDbBookingRow(r, settlementEntry));
      }
      return results;
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
      lifecycleStates: booking.lifecycleStates || rawRecord?.lifecycleStates,
    };

    try {
      if (simulatePersistenceFailureForTests) {
        throw new Error("SIMULATED_LOCAL_BOOKING_PERSISTENCE_FAILURE");
      }
      if (db) {
        await db
          .update(octoBookings)
          .set({
            contact: packContactWithDccMeta(updated.contact, {
              pickupLocation: updated.pickupLocation,
              customFields: updated.customFields,
              participants: updated.participants,
              dccCheckoutDeadlineUtc: updated.dccCheckoutDeadlineUtc ?? null,
              lifecycleStates: updated.lifecycleStates,
              verifiedPaymentEvidence: updated.verifiedPaymentEvidence,
              verifiedRefundEvidence: updated.verifiedRefundEvidence,
            }),
            updatedAt: new Date(),
          })
          .where(buildBookingWhereClause(bookingKey));
      }
    } catch (err: any) {
      throw new OctoApiError(
        503,
        "BOOKING_PERSISTENCE_FAILED",
        `Failed to persist booking update to database: ${err.message}`
      );
    }

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
      validatedRefundEvidence = await DccPaymentService.assertTraceableRefundEvidence(
        validatedRefundEvidence,
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
      booking.lifecycleStates?.paymentStatus ||
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

    try {
      if (simulatePersistenceFailureForTests) {
        throw new Error("SIMULATED_LOCAL_BOOKING_PERSISTENCE_FAILURE");
      }
      if (db) {
        await db
          .update(octoBookings)
          .set({
            status: "CANCELLED",
            contact: packContactWithDccMeta(cancelledResult.contact, {
              pickupLocation: cancelledResult.pickupLocation,
              customFields: cancelledResult.customFields,
              participants: cancelledResult.participants,
              dccCheckoutDeadlineUtc: cancelledResult.dccCheckoutDeadlineUtc ?? null,
              lifecycleStates: updatedLifecycle,
              verifiedPaymentEvidence: cancelledResult.verifiedPaymentEvidence,
              verifiedRefundEvidence: cancelledResult.verifiedRefundEvidence,
            }),
            cancelledAt: new Date(),
            cancellationReason: reasonText,
            updatedAt: new Date(),
          })
          .where(buildBookingWhereClause(bookingKey));

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
      }
    } catch (err: any) {
      throw new OctoApiError(
        503,
        "BOOKING_PERSISTENCE_FAILED",
        `Failed to persist booking cancellation to database: ${err.message}`
      );
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

