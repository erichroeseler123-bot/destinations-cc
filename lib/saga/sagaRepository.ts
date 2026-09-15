import { getDb } from "@/lib/db/client";
import {
  dccOrders,
  dccOrderItems,
  dccSupplierBookings,
  dccSagaSteps,
  dccSagaAuditEvents,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { DccMasterOrder, DccOrderItem, DccOrderStatus } from "@/lib/orders/types";
import {
  DccSagaAuditEventRecord,
  DccSagaStepRecord,
  DccSupplierBookingRecord,
} from "./types";
import { sanitizeSagaPayload } from "./sanitizer";

// Fallback in-memory stores for deterministic unit testing and offline reliability
const memOrders = new Map<string, DccMasterOrder>();
const memOrderItems = new Map<string, DccOrderItem & { orderId: string }>();
const memSupplierBookings = new Map<string, DccSupplierBookingRecord>();
const memSagaSteps = new Map<string, DccSagaStepRecord>();
const memAuditEvents: DccSagaAuditEventRecord[] = [];
let auditCounter = 1;

export class DccSagaRepository {
  /**
   * Save or update master order
   */
  static async saveOrder(order: DccMasterOrder): Promise<void> {
    memOrders.set(order.orderId, { ...order });

    const db = getDb();
    if (db) {
      try {
        await db
          .insert(dccOrders)
          .values({
            id: order.orderId,
            travelerId: order.travelerId || null,
            resellerId: order.resellerId || null,
            status: order.status,
            currency: order.currency,
            totalPrice: order.totalPrice.toFixed(2),
            paymentId: order.paymentId || null,
            idempotencyKey: (order as any).idempotencyKey || null,
            idempotencyHash: (order as any).idempotencyHash || null,
            utcHoldExpires: order.utcHoldExpires ? new Date(order.utcHoldExpires) : null,
            customerFullName: order.customer?.fullName || null,
            customerEmail: order.customer?.emailAddress || null,
            customerPhone: order.customer?.phoneNumber || null,
            customerCountry: order.customer?.country || null,
            customerNotes: order.customer?.notes || null,
            sagaId: (order as any).sagaId || null,
            sagaStatus: (order as any).sagaStatus || "NOT_STARTED",
            metadata: (order as any).metadata || {},
          })
          .onConflictDoUpdate({
            target: dccOrders.id,
            set: {
              status: order.status,
              paymentId: order.paymentId || null,
              utcHoldExpires: order.utcHoldExpires ? new Date(order.utcHoldExpires) : null,
              sagaStatus: (order as any).sagaStatus || undefined,
              updatedAt: new Date(),
            },
          });
      } catch (err: any) {
        console.warn("Neon DB error saving order:", err.message);
      }
    }
  }

  /**
   * Get master order by ID
   */
  static async getOrder(orderId: string): Promise<DccMasterOrder | null> {
    const mem = memOrders.get(orderId);
    if (mem) return mem;

    const db = getDb();
    if (db) {
      try {
        const rows = await db.select().from(dccOrders).where(eq(dccOrders.id, orderId));
        if (rows.length > 0) {
          const r = rows[0];
          return {
            orderId: r.id,
            travelerId: r.travelerId || undefined,
            resellerId: r.resellerId || undefined,
            status: r.status as DccOrderStatus,
            currency: r.currency,
            totalPrice: Number(r.totalPrice),
            paymentId: r.paymentId || undefined,
            items: [],
            bookingIds: [],
            utcHoldExpires: r.utcHoldExpires?.toISOString() || null,
            customer: r.customerFullName
              ? {
                  fullName: r.customerFullName,
                  emailAddress: r.customerEmail || "",
                  phoneNumber: r.customerPhone || undefined,
                  country: r.customerCountry || undefined,
                  notes: r.customerNotes || undefined,
                }
              : undefined,
            createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: r.updatedAt?.toISOString() || new Date().toISOString(),
          };
        }
      } catch (err: any) {
        console.warn("Neon DB error fetching order:", err.message);
      }
    }

    return null;
  }

  /**
   * Get master order by idempotency key
   */
  static async getOrderByPendingIdempotencyKey(key: string): Promise<DccMasterOrder | null> {
    for (const ord of memOrders.values()) {
      if ((ord as any).idempotencyKey === key) {
        return ord;
      }
    }

    const db = getDb();
    if (db) {
      try {
        const rows = await db.select().from(dccOrders).where(eq(dccOrders.idempotencyKey, key));
        if (rows.length > 0) {
          return this.getOrder(rows[0].id);
        }
      } catch (err: any) {
        console.warn("Neon DB error fetching order by idempotency key:", err.message);
      }
    }

    return null;
  }

  /**
   * Save order item
   */
  static async saveOrderItem(item: DccOrderItem, orderId: string): Promise<void> {
    memOrderItems.set(item.itemId, { ...item, orderId });

    const db = getDb();
    if (db) {
      try {
        await db
          .insert(dccOrderItems)
          .values({
            id: item.itemId,
            orderId,
            bookingId: item.bookingId || null,
            bookingUuid: item.bookingUuid || null,
            productId: item.productId,
            optionId: item.optionId,
            availabilityId: item.availabilityId,
            supplierConnectionId: item.supplierConnectionId || null,
            operatorSlug: item.operatorSlug || "dcc-operator",
            operatorName: item.operatorName || "Authorized Operator",
            price: item.price.toFixed(2),
            currency: item.currency,
            unitItems: item.unitItems as any,
            status: item.status,
            eventDate: item.eventDate ? item.eventDate.slice(0, 10) : null,
            eventTime: item.eventTime || null,
            serviceCompleted: item.serviceCompleted || false,
            voucher: item.voucher as any,
          })
          .onConflictDoUpdate({
            target: dccOrderItems.id,
            set: {
              bookingId: item.bookingId || null,
              bookingUuid: item.bookingUuid || null,
              status: item.status,
              voucher: item.voucher as any,
              updatedAt: new Date(),
            },
          });
      } catch (err: any) {
        console.warn("Neon DB error saving order item:", err.message);
      }
    }
  }

  /**
   * Save supplier booking record
   */
  static async saveSupplierBooking(booking: DccSupplierBookingRecord): Promise<void> {
    memSupplierBookings.set(booking.id, { ...booking });
    if (booking.providerBookingUuid) {
      memSupplierBookings.set(booking.providerBookingUuid, { ...booking });
    }

    const db = getDb();
    if (db) {
      try {
        await db
          .insert(dccSupplierBookings)
          .values({
            id: booking.id,
            orderId: booking.orderId,
            orderItemId: booking.orderItemId,
            supplierConnectionId: booking.supplierConnectionId,
            operatorSlug: booking.operatorSlug,
            operatorName: booking.operatorName,
            productId: booking.productId,
            optionId: booking.optionId,
            availabilityId: booking.availabilityId,
            providerBookingId: booking.providerBookingId || null,
            providerBookingUuid: booking.providerBookingUuid || null,
            status: booking.status,
            holdExpiresAt: booking.holdExpiresAt ? new Date(booking.holdExpiresAt) : null,
            confirmedAt: booking.confirmedAt ? new Date(booking.confirmedAt) : null,
            cancelledAt: booking.cancelledAt ? new Date(booking.cancelledAt) : null,
            cancellationReason: booking.cancellationReason || null,
            price: booking.price.toFixed(2),
            currency: booking.currency,
            unitItems: booking.unitItems as any,
            idempotencyKey: booking.idempotencyKey || null,
            idempotencyHash: booking.idempotencyHash || null,
            externalRequestId: booking.externalRequestId || null,
            attemptCount: booking.attemptCount,
            lastErrorCode: booking.lastErrorCode || null,
            lastErrorMessage: booking.lastErrorMessage || null,
            voucherCode: booking.voucherCode || null,
            voucherUrl: booking.voucherUrl || null,
            voucherInstructions: booking.voucherInstructions || null,
          })
          .onConflictDoUpdate({
            target: dccSupplierBookings.id,
            set: {
              status: booking.status,
              confirmedAt: booking.confirmedAt ? new Date(booking.confirmedAt) : null,
              cancelledAt: booking.cancelledAt ? new Date(booking.cancelledAt) : null,
              cancellationReason: booking.cancellationReason || null,
              voucherCode: booking.voucherCode || null,
              voucherUrl: booking.voucherUrl || null,
              voucherInstructions: booking.voucherInstructions || null,
              attemptCount: booking.attemptCount,
              updatedAt: new Date(),
            },
          });
      } catch (err: any) {
        console.warn("Neon DB error saving supplier booking:", err.message);
      }
    }
  }

  /**
   * Get supplier bookings for order
   */
  static async getSupplierBookingsForOrder(orderId: string): Promise<DccSupplierBookingRecord[]> {
    const mem = Array.from(memSupplierBookings.values()).filter((b) => b.orderId === orderId);
    if (mem.length > 0) return mem;

    const db = getDb();
    if (db) {
      try {
        const rows = await db
          .select()
          .from(dccSupplierBookings)
          .where(eq(dccSupplierBookings.orderId, orderId));
        return rows.map((r) => ({
          id: r.id,
          orderId: r.orderId,
          orderItemId: r.orderItemId,
          supplierConnectionId: r.supplierConnectionId,
          operatorSlug: r.operatorSlug,
          operatorName: r.operatorName,
          productId: r.productId,
          optionId: r.optionId,
          availabilityId: r.availabilityId,
          providerBookingId: r.providerBookingId,
          providerBookingUuid: r.providerBookingUuid,
          status: r.status as any,
          holdExpiresAt: r.holdExpiresAt?.toISOString() || null,
          confirmedAt: r.confirmedAt?.toISOString() || null,
          cancelledAt: r.cancelledAt?.toISOString() || null,
          cancellationReason: r.cancellationReason,
          price: Number(r.price),
          currency: r.currency,
          unitItems: (r.unitItems as any) || [],
          idempotencyKey: r.idempotencyKey,
          idempotencyHash: r.idempotencyHash,
          externalRequestId: r.externalRequestId,
          attemptCount: r.attemptCount,
          lastErrorCode: r.lastErrorCode,
          lastErrorMessage: r.lastErrorMessage,
          voucherCode: r.voucherCode,
          voucherUrl: r.voucherUrl,
          voucherInstructions: r.voucherInstructions,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));
      } catch (err: any) {
        console.warn("Neon DB error fetching supplier bookings:", err.message);
      }
    }

    return [];
  }

  /**
   * Save or update a Saga Step execution record
   */
  static async recordSagaStep(step: DccSagaStepRecord): Promise<void> {
    const sanitizedStep = {
      ...step,
      inputPayload: sanitizeSagaPayload(step.inputPayload),
      outputPayload: step.outputPayload ? sanitizeSagaPayload(step.outputPayload) : undefined,
    };

    memSagaSteps.set(sanitizedStep.id, sanitizedStep);

    const db = getDb();
    if (db) {
      try {
        await db
          .insert(dccSagaSteps)
          .values({
            id: sanitizedStep.id,
            sagaId: sanitizedStep.sagaId,
            orderId: sanitizedStep.orderId,
            stepName: sanitizedStep.stepName,
            stepIndex: sanitizedStep.stepIndex,
            status: sanitizedStep.status,
            idempotencyKey: sanitizedStep.idempotencyKey,
            attemptCount: sanitizedStep.attemptCount,
            maxRetries: sanitizedStep.maxRetries,
            retryPolicy: sanitizedStep.retryPolicy as any,
            nextRetryAt: sanitizedStep.nextRetryAt ? new Date(sanitizedStep.nextRetryAt) : null,
            externalReferenceId: sanitizedStep.externalReferenceId || null,
            inputPayload: sanitizedStep.inputPayload,
            outputPayload: sanitizedStep.outputPayload || {},
            errorCode: sanitizedStep.errorCode || null,
            errorMessage: sanitizedStep.errorMessage || null,
            compensationStatus: sanitizedStep.compensationStatus,
            startedAt: sanitizedStep.startedAt ? new Date(sanitizedStep.startedAt) : null,
            completedAt: sanitizedStep.completedAt ? new Date(sanitizedStep.completedAt) : null,
          })
          .onConflictDoUpdate({
            target: dccSagaSteps.id,
            set: {
              status: sanitizedStep.status,
              attemptCount: sanitizedStep.attemptCount,
              nextRetryAt: sanitizedStep.nextRetryAt ? new Date(sanitizedStep.nextRetryAt) : null,
              externalReferenceId: sanitizedStep.externalReferenceId || null,
              outputPayload: sanitizedStep.outputPayload || {},
              errorCode: sanitizedStep.errorCode || null,
              errorMessage: sanitizedStep.errorMessage || null,
              compensationStatus: sanitizedStep.compensationStatus,
              completedAt: sanitizedStep.completedAt ? new Date(sanitizedStep.completedAt) : null,
              updatedAt: new Date(),
            },
          });
      } catch (err: any) {
        console.warn("Neon DB error saving saga step:", err.message);
      }
    }
  }

  /**
   * Get all Saga steps for a saga execution
   */
  static async getSagaSteps(sagaId: string): Promise<DccSagaStepRecord[]> {
    const mem = Array.from(memSagaSteps.values()).filter((s) => s.sagaId === sagaId);
    if (mem.length > 0) return mem.sort((a, b) => a.stepIndex - b.stepIndex);

    const db = getDb();
    if (db) {
      try {
        const rows = await db
          .select()
          .from(dccSagaSteps)
          .where(eq(dccSagaSteps.sagaId, sagaId));
        return rows
          .map((r) => ({
            id: r.id,
            sagaId: r.sagaId,
            orderId: r.orderId,
            stepName: r.stepName as any,
            stepIndex: r.stepIndex,
            status: r.status as any,
            idempotencyKey: r.idempotencyKey,
            attemptCount: r.attemptCount,
            maxRetries: r.maxRetries,
            retryPolicy: (r.retryPolicy as any) || {},
            nextRetryAt: r.nextRetryAt?.toISOString() || null,
            externalReferenceId: r.externalReferenceId,
            inputPayload: (r.inputPayload as any) || {},
            outputPayload: (r.outputPayload as any) || null,
            errorCode: r.errorCode,
            errorMessage: r.errorMessage,
            compensationStatus: r.compensationStatus as any,
            startedAt: r.startedAt?.toISOString() || null,
            completedAt: r.completedAt?.toISOString() || null,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          }))
          .sort((a, b) => a.stepIndex - b.stepIndex);
      } catch (err: any) {
        console.warn("Neon DB error fetching saga steps:", err.message);
      }
    }

    return [];
  }

  /**
   * Record a durable audit event for the Saga
   */
  static async recordAuditEvent(
    event: Omit<DccSagaAuditEventRecord, "id">
  ): Promise<DccSagaAuditEventRecord> {
    const sanitized = {
      ...event,
      id: auditCounter++,
      sanitizedDetails: sanitizeSagaPayload(event.sanitizedDetails),
    };

    memAuditEvents.push(sanitized);

    const db = getDb();
    if (db) {
      try {
        await db.insert(dccSagaAuditEvents).values({
          sagaId: sanitized.sagaId,
          orderId: sanitized.orderId,
          stepId: sanitized.stepId || null,
          eventType: sanitized.eventType,
          action: sanitized.action,
          entityType: sanitized.entityType,
          entityId: sanitized.entityId,
          idempotencyKey: sanitized.idempotencyKey || null,
          attemptNumber: sanitized.attemptNumber,
          status: sanitized.status,
          errorCode: sanitized.errorCode || null,
          errorMessage: sanitized.errorMessage || null,
          sanitizedDetails: sanitized.sanitizedDetails,
        });
      } catch (err: any) {
        console.warn("Neon DB error saving saga audit event:", err.message);
      }
    }

    return sanitized;
  }

  /**
   * Get all audit events for a saga
   */
  static async getAuditEvents(sagaId: string): Promise<DccSagaAuditEventRecord[]> {
    const mem = memAuditEvents.filter((e) => e.sagaId === sagaId);
    if (mem.length > 0) return mem;

    const db = getDb();
    if (db) {
      try {
        const rows = await db
          .select()
          .from(dccSagaAuditEvents)
          .where(eq(dccSagaAuditEvents.sagaId, sagaId));
        return rows.map((r) => ({
          id: r.id,
          sagaId: r.sagaId,
          orderId: r.orderId,
          stepId: r.stepId,
          eventType: r.eventType,
          action: r.action,
          entityType: r.entityType,
          entityId: r.entityId,
          idempotencyKey: r.idempotencyKey,
          attemptNumber: r.attemptNumber,
          status: r.status as any,
          errorCode: r.errorCode,
          errorMessage: r.errorMessage,
          sanitizedDetails: (r.sanitizedDetails as any) || {},
          occurredAt: r.occurredAt.toISOString(),
        }));
      } catch (err: any) {
        console.warn("Neon DB error fetching saga audit events:", err.message);
      }
    }

    return [];
  }

  /**
   * Alias for getAuditEvents
   */
  static async getAuditEventsForSaga(sagaId: string): Promise<DccSagaAuditEventRecord[]> {
    return this.getAuditEvents(sagaId);
  }

  /**
   * Reset in-memory stores (for testing)
   */
  static reset(): void {
    memOrders.clear();
    memOrderItems.clear();
    memSupplierBookings.clear();
    memSagaSteps.clear();
    memAuditEvents.length = 0;
    auditCounter = 1;
  }
}
