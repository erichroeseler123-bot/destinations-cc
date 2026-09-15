import crypto from "crypto";
import { DccBookingService } from "@/lib/bookings";
import { DccPaymentService } from "@/lib/payments";
import { DccSettlementEngine } from "@/lib/settlement";
import {
  ConfirmOrderRequest,
  CreateOrderRequest,
  DccMasterOrder,
  DccOrderItem,
} from "./types";
import { OctoBookingResult } from "@/lib/octo/types";

const orderStore = new Map<string, DccMasterOrder>();

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

      items.push({
        itemId: `item_${i + 1}`,
        productId: item.productId,
        optionId: item.optionId,
        availabilityId: item.availabilityId,
        supplierConnectionId,
        unitItems: item.unitItems,
        price: hold.totalPrice,
        currency: hold.currency,
        bookingId: hold.dccBookingId,
        bookingUuid: hold.uuid,
      });
    }

    const order: DccMasterOrder = {
      orderId,
      status: "ON_HOLD",
      resellerId: params.resellerId,
      currency: items[0]?.currency || "USD",
      totalPrice: Math.round(totalPrice * 100) / 100,
      items,
      bookingIds,
      utcHoldExpires: earliestExpires,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orderStore.set(orderId, order);
    return order;
  }

  /**
   * Confirm master order: processes payment, confirms all supplier bookings, and clears settlement
   */
  static async confirmOrder(params: ConfirmOrderRequest): Promise<{
    order: DccMasterOrder;
    bookings: OctoBookingResult[];
  }> {
    const order = orderStore.get(params.orderId);
    if (!order) {
      throw new Error(`Order ${params.orderId} not found`);
    }

    // Process payment via DccPaymentService
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

    // Confirm all underlying supplier bookings
    const confirmedBookings: OctoBookingResult[] = [];
    for (const bookingId of order.bookingIds) {
      const confirmed = await DccBookingService.confirmReservation({
        bookingId,
        contact: params.contact,
        payment: {
          provider: paymentResult.provider,
          paymentId: paymentResult.paymentId,
          amount: paymentResult.amount,
          currency: paymentResult.currency,
          status: paymentResult.status,
        },
        idempotencyKey: params.idempotencyKey,
        resellerId: params.resellerId,
        orderId: order.orderId,
      });
      confirmedBookings.push(confirmed);
    }

    order.status = "CONFIRMED";
    order.paymentId = paymentResult.paymentId;
    order.customer = params.contact;
    order.updatedAt = new Date().toISOString();

    return {
      order,
      bookings: confirmedBookings,
    };
  }

  /**
   * Get an order by ID
   */
  static async getOrder(orderId: string): Promise<DccMasterOrder | null> {
    return orderStore.get(orderId) || null;
  }
}
