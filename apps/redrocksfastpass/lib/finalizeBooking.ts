import { DayPassBooking, updateBooking } from "@/lib/bookings";
import { emitDccEvent } from "@/lib/dcc";
import { getInventorySlot } from "@/lib/inventoryStore";
import { sendSms } from "@/lib/sms";

export async function canFinalizePaidBooking(booking: DayPassBooking) {
  const slot = await getInventorySlot(booking.slotId);
  if (!slot) {
    return { ok: false as const, reason: "slot_not_found" as const };
  }

  if (booking.status === "pending_payment") {
    return { ok: true as const };
  }

  if (slot.seatsLeft < booking.quantity) {
    return { ok: false as const, reason: "sold_out" as const };
  }

  return { ok: true as const };
}

export async function markBookingNeedsReview(
  booking: DayPassBooking,
  input: {
    reason: string;
    payerName?: string | null;
    squareTransactionId?: string | null;
    squareReferenceId?: string | null;
    squareOrderId?: string | null;
    sourcePath: string;
  }
) {
  const next =
    (await updateBooking(booking.token, {
      status: "needs_review",
      reviewReason: input.reason,
      squareTransactionId: input.squareTransactionId || booking.squareTransactionId || null,
      squareReferenceId: input.squareReferenceId || booking.squareReferenceId || null,
      squareOrderId: input.squareOrderId || booking.squareOrderId || null,
      squarePaymentStatus: "paid_unconfirmed",
      payerName: input.payerName || booking.payerName || null,
      paidAt: booking.paidAt || new Date().toISOString(),
    })) || booking;

  await emitDccEvent({
    handoffId: next.handoffId,
    satelliteId: "redrocksfastpass",
    eventType: "booking_failed",
    source: "redrocksfastpass",
    sourcePath: input.sourcePath,
    status: "needs_review",
    stage: "paid_unconfirmed",
    message: input.reason,
    traveler: {
      phone: next.phone,
      name: next.payerName || undefined,
      partySize: next.quantity,
    },
    booking: {
      citySlug: "denver",
      venueSlug: "red-rocks-park",
      productSlug: "red-rocks-day-pass",
      eventDate: next.slotId.split("-").slice(0, 3).join("-"),
      quantity: next.quantity,
      currency: "USD",
      amount: next.amountUsd,
    },
  });

  return next;
}

export async function markBookingRefunded(
  booking: DayPassBooking,
  input: {
    refundId?: string | null;
    sourcePath: string;
  }
) {
  const next =
    (await updateBooking(booking.token, {
      status: "refunded",
      squareRefundId: input.refundId || booking.squareRefundId || null,
      squarePaymentStatus: "refunded",
      refundedAt: new Date().toISOString(),
    })) || booking;

  await emitDccEvent({
    handoffId: next.handoffId,
    satelliteId: "redrocksfastpass",
    eventType: "booking_cancelled",
    source: "redrocksfastpass",
    sourcePath: input.sourcePath,
    status: "refunded",
    stage: "refund_completed",
    traveler: {
      phone: next.phone,
      name: next.payerName || undefined,
      partySize: next.quantity,
    },
    booking: {
      citySlug: "denver",
      venueSlug: "red-rocks-park",
      productSlug: "red-rocks-day-pass",
      eventDate: next.slotId.split("-").slice(0, 3).join("-"),
      quantity: next.quantity,
      currency: "USD",
      amount: next.amountUsd,
    },
  });

  return next;
}

export async function finalizePaidBooking(
  booking: DayPassBooking,
  input: {
    payerName?: string | null;
    squareTransactionId?: string | null;
    squareReferenceId?: string | null;
    squareOrderId?: string | null;
    sourcePath: string;
  }
) {
  if (booking.status === "paid") return booking;

  const validation = await canFinalizePaidBooking(booking);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  const hadTicketSms = Boolean(booking.smsTicketSentAt);
  const next =
    (await updateBooking(booking.token, {
      status: "paid",
      squareTransactionId: input.squareTransactionId || booking.squareTransactionId || null,
      squareReferenceId: input.squareReferenceId || booking.squareReferenceId || null,
      squareOrderId: input.squareOrderId || booking.squareOrderId || null,
      squarePaymentStatus: "paid",
      payerName: input.payerName || booking.payerName || null,
      paidAt: booking.paidAt || new Date().toISOString(),
      smsTicketSentAt: booking.smsTicketSentAt || new Date().toISOString(),
    })) || booking;

  if (!hadTicketSms) {
    await sendSms(
      next.phone,
      [
        "Payment received — thank you!",
        "",
        `Your Red Rocks Day Pass ticket: ${new URL(`/t/${next.token}`, "https://redrocksfastpass.com").toString()}`,
        "",
        `Departure: Union Station ${next.departLabel}`,
        "Return: any shuttle after 2:00 PM",
        "",
        "Show QR to driver.",
      ].join("\n")
    );
  }

  await emitDccEvent({
    handoffId: next.handoffId,
    satelliteId: "redrocksfastpass",
    eventType: "booking_completed",
    source: "redrocksfastpass",
    sourcePath: input.sourcePath,
    status: "booked",
    stage: "paid",
    traveler: {
      phone: next.phone,
      name: next.payerName || undefined,
      partySize: next.quantity,
    },
    booking: {
      citySlug: "denver",
      venueSlug: "red-rocks-park",
      productSlug: "red-rocks-day-pass",
      eventDate: next.slotId.split("-").slice(0, 3).join("-"),
      quantity: next.quantity,
      currency: "USD",
      amount: next.amountUsd,
    },
  });

  return next;
}
