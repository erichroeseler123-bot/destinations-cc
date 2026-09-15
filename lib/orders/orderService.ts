import crypto from "crypto";
import { getDb } from "@/lib/db/client";
import { dccOrderItems, octoAuditLogs } from "@/lib/db/schema";
import { DccBookingService } from "@/lib/bookings";
import { DccPaymentService } from "@/lib/payments";
import { DccSettlementEngine } from "@/lib/settlement";
import { DccTravelerService } from "@/lib/travelers";
import {
  CancelOrderItemRequest,
  ConfirmOrderRequest,
  CreateOrderRequest,
  DccMasterOrder,
  DccOrderItem,
} from "./types";
import { OctoBookingResult } from "@/lib/octo/types";
import { eq } from "drizzle-orm";

const fallbackOrderStore = new Map<string, DccMasterOrder>();

export class DccOrderService {
  /**
   * Create a master multi-item DCC Order and initiate supplier booking holds
   */
  static async createOrder(params: CreateOrderRequest): Promise<DccMasterOrder> {
    const orderId = `dcc:ord:${crypto.randomUUID().slice(0, 12)}`;
    const items: DccOrderItem[] = [];
    const bookingIds: string[] = [];
    let totalPrice = 0;
    let earliestExpires: string | undefined;

    for (let i = 0; i < params.items.length; i++) {
      const item = params.items[i];
      const supplierConnectionId = await DccBookingService.resolveConnectionForProduct(item.productId);
      const itemId = `dcc:item:${crypto.randomUUID().slice(0, 12)}`;

      // Create booking hold via DccBookingService
      const hold = await DccBookingService.createHold({
        supplierConnectionId,
        productId: item.productId,
        optionId: item.optionId,
        availabilityId: item.availabilityId,
        unitItems: item.unitItems,
        notes: item.notes,
        idempotencyKey: params.idempotencyKey ? `${params.idempotencyKey}:item_${i}` : undefined,
        resellerId: params.resellerId,
        orderId,
      });

      totalPrice += hold.totalPrice;
      bookingIds.push(hold.dccBookingId);

      if (hold.utcHoldExpires) {
        if (!earliestExpires || new Date(hold.utcHoldExpires) < new Date(earliestExpires)) {
          earliestExpires = hold.utcHoldExpires;
        }
      }

      const orderItem: DccOrderItem = {
        itemId,
        productId: item.productId,
        optionId: item.optionId,
        availabilityId: item.availabilityId,
        supplierConnectionId,
        unitItems: item.unitItems,
        price: hold.totalPrice,
        currency: hold.currency,
        status: "ON_HOLD",
        bookingId: hold.dccBookingId,
        bookingUuid: hold.uuid,
        notes: item.notes,
      };

      items.push(orderItem);

      // Persist item to DB if available
      const db = getDb();
      if (db) {
        try {
          await db.insert(dccOrderItems).values({
            id: itemId,
            orderId,
            productId: item.productId,
            optionId: item.optionId,
            availabilityId: item.availabilityId,
            operatorSlug: orderItem.operatorSlug || "dcc-operator",
            operatorName: orderItem.operatorName || "Authorized Operator",
            price: hold.totalPrice.toFixed(2),
            currency: hold.currency,
            status: "ON_HOLD",
            bookingId: hold.dccBookingId,
            bookingUuid: hold.uuid,
            unitItems: item.unitItems as any,
          });
        } catch (err: any) {
          console.error("Database insert error on order item:", err.message);
        }
      }
    }

    const order: DccMasterOrder = {
      orderId,
      travelerId: params.travelerId,
      status: "ON_HOLD",
      resellerId: params.resellerId,
      customer: params.customer,
      currency: items[0]?.currency || "USD",
      totalPrice: Math.round(totalPrice * 100) / 100,
      items,
      bookingIds,
      utcHoldExpires: earliestExpires || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fallbackOrderStore.set(orderId, order);
    return order;
  }

  /**
   * Confirm master order:
   * 1. Collects or verifies single customer payment record for the DCC Order
   * 2. Confirms all underlying supplier bookings
   * 3. Attaches traveler profile (auto-creating if needed)
   * 4. Initializes settlement balances as pending fulfillment
   */
  static async confirmOrder(params: ConfirmOrderRequest): Promise<{
    order: DccMasterOrder;
    bookings: OctoBookingResult[];
  }> {
    const order = fallbackOrderStore.get(params.orderId);
    if (!order) {
      throw new Error(`Order ${params.orderId} not found`);
    }

    // 1. Process payment via DccPaymentService (One payment per master DCC order)
    const paymentResult = await DccPaymentService.processPayment({
      orderId: order.orderId,
      amount: order.totalPrice,
      currency: order.currency,
      paymentInfo: params.payment,
      customer: {
        fullName: params.contact.fullName,
        emailAddress: params.contact.emailAddress,
      },
    });

    if (!paymentResult.success) {
      order.status = "FAILED";
      order.updatedAt = new Date().toISOString();
      throw new Error("Payment authorization failed");
    }

    // 2. Associate or auto-create Traveler Profile
    let travelerId = params.travelerId || order.travelerId;
    if (!travelerId && params.contact.emailAddress) {
      try {
        const profile = await DccTravelerService.getOrCreateProfile(params.contact.emailAddress, {
          fullName: params.contact.fullName,
          phone: params.contact.phoneNumber,
          country: params.contact.country,
        });
        travelerId = profile.id;
      } catch (err: any) {
        console.error("Traveler profile linking error:", err.message);
      }
    }

    // 3. Confirm all underlying supplier bookings
    const confirmedBookings: OctoBookingResult[] = [];
    for (const item of order.items) {
      if (!item.bookingId) continue;

      const confirmed = await DccBookingService.confirmReservation({
        bookingId: item.bookingId,
        contact: params.contact,
        payment: {
          provider: paymentResult.provider,
          paymentId: paymentResult.paymentId,
          amount: item.price,
          currency: item.currency,
          status: paymentResult.status,
        },
        idempotencyKey: params.idempotencyKey,
        resellerId: params.resellerId,
        orderId: order.orderId,
      });

      item.status = "CONFIRMED";
      item.voucher = confirmed.voucher ? {
        code: confirmed.voucher.code,
        barcode: (confirmed.voucher as any).barcode || confirmed.voucher.barcodeUrl,
        url: (confirmed.voucher as any).url || confirmed.voucher.barcodeUrl,
      } : undefined;

      confirmedBookings.push(confirmed);

      // Update item status in DB
      const db = getDb();
      if (db) {
        try {
          await db
            .update(dccOrderItems)
            .set({
              status: "CONFIRMED",
              voucher: item.voucher as any,
              updatedAt: new Date(),
            })
            .where(eq(dccOrderItems.id, item.itemId));
        } catch (err: any) {
          console.error("Database update error on order item confirmation:", err.message);
        }
      }
    }

    order.status = "CONFIRMED";
    order.travelerId = travelerId;
    order.paymentId = paymentResult.paymentId;
    order.customer = params.contact;
    order.utcHoldExpires = null;
    order.updatedAt = new Date().toISOString();

    const db = getDb();
    if (db) {
      try {
        await db.insert(octoAuditLogs).values({
          action: "ORDER_CONFIRMED",
          entityType: "ORDER",
          entityId: order.orderId,
          status: "SUCCESS",
          payload: {
            travelerId,
            itemsCount: order.items.length,
            totalPrice: order.totalPrice,
          },
        });
      } catch (err: any) {
        console.error("Database audit log error on order confirmation:", err.message);
      }
    }

    return {
      order,
      bookings: confirmedBookings,
    };
  }

  /**
   * Cancel an individual item within a multi-supplier master order
   */
  static async cancelOrderItem(params: CancelOrderItemRequest): Promise<{
    order: DccMasterOrder;
    cancelledItem: DccOrderItem;
  }> {
    const order = fallbackOrderStore.get(params.orderId);
    if (!order) {
      throw new Error(`Order ${params.orderId} not found`);
    }

    const item = order.items.find((it) => it.itemId === params.itemId);
    if (!item) {
      throw new Error(`Order item ${params.itemId} not found in order ${params.orderId}`);
    }

    if (item.status === "CANCELLED") {
      return { order, cancelledItem: item };
    }

    // Cancel underlying supplier booking
    if (item.bookingId) {
      await DccBookingService.cancelBooking(item.bookingId, {
        reason: params.reason || "Customer item cancellation",
      });
    }

    item.status = "CANCELLED";

    // Process partial refund for item
    await DccPaymentService.processRefund({
      orderId: order.orderId,
      orderItemId: item.itemId,
      bookingId: item.bookingId,
      operatorSlug: item.operatorSlug || "unknown_operator",
      amount: item.price,
      currency: item.currency,
      reason: params.reason,
    });

    // If all items are cancelled, mark the entire master order as CANCELLED
    const allCancelled = order.items.every((it) => it.status === "CANCELLED");
    if (allCancelled) {
      order.status = "CANCELLED";
    }
    order.updatedAt = new Date().toISOString();

    const db = getDb();
    if (db) {
      try {
        await db
          .update(dccOrderItems)
          .set({ status: "CANCELLED", updatedAt: new Date() })
          .where(eq(dccOrderItems.id, item.itemId));
      } catch (err: any) {
        console.error("Database update error on cancelOrderItem:", err.message);
      }
    }

    return { order, cancelledItem: item };
  }

  /**
   * Get an order by ID
   */
  static async getOrder(orderId: string): Promise<DccMasterOrder | null> {
    return fallbackOrderStore.get(orderId) || null;
  }

  /**
   * List all master orders for a traveler ID or email address
   */
  static async getOrdersByTravelerOrEmail(
    travelerIdOrParams?: string | { travelerId?: string; email?: string },
    emailArg?: string
  ): Promise<DccMasterOrder[]> {
    let travelerId: string | undefined;
    let email: string | undefined;

    if (typeof travelerIdOrParams === "string") {
      travelerId = travelerIdOrParams;
      email = emailArg;
    } else if (travelerIdOrParams) {
      travelerId = travelerIdOrParams.travelerId;
      email = travelerIdOrParams.email;
    }

    const normalizedEmail = email?.trim().toLowerCase();
    const results: DccMasterOrder[] = [];

    for (const order of fallbackOrderStore.values()) {
      if (travelerId && order.travelerId === travelerId) {
        results.push(order);
        continue;
      }
      if (normalizedEmail && order.customer?.emailAddress?.toLowerCase() === normalizedEmail) {
        results.push(order);
        continue;
      }
    }

    return results;
  }
}
