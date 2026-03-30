import { NextResponse } from "next/server";
import { createBookingToken, getBookingExpiresAt, saveBooking } from "@/lib/bookings";
import { emitDccEvent, getOrCreateHandoffId } from "@/lib/dcc";
import { getInventorySlot, reserveSeat } from "@/lib/inventoryStore";
import { sendSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (value.startsWith("+")) return value;
  return "";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const slotId = String(formData.get("slot") || "");
  const quantity = Number.parseInt(String(formData.get("quantity") || "1"), 10);
  const handoffId = getOrCreateHandoffId(String(formData.get("dcc_handoff_id") || ""));
  const dccReturn = String(formData.get("dcc_return") || "");
  const phone = normalizePhone(String(formData.get("phone") || ""));

  if (!slotId) {
    return NextResponse.redirect(new URL("/checkout?error=slot", request.url));
  }
  if (!phone) {
    return NextResponse.redirect(
      new URL(`/checkout?slot=${encodeURIComponent(slotId)}&quantity=${encodeURIComponent(String(quantity))}&error=phone`, request.url)
    );
  }

  const slot = await getInventorySlot(slotId);
  if (!slot) {
    return NextResponse.redirect(new URL("/checkout?error=slot", request.url));
  }

  const reserveResult = await reserveSeat(slotId, quantity);
  if (!reserveResult.ok) {
    const target =
      reserveResult.reason === "invalid_quantity"
        ? `/checkout?slot=${encodeURIComponent(slotId)}&error=quantity`
        : reserveResult.reason === "storage_error"
          ? `/checkout?slot=${encodeURIComponent(slotId)}&quantity=${encodeURIComponent(String(quantity))}&error=inventory`
          : `/checkout?slot=${encodeURIComponent(slotId)}&quantity=${encodeURIComponent(String(quantity))}&soldout=1`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  const token = createBookingToken();
  const createdAt = new Date().toISOString();
  await saveBooking({
    token,
    createdAt,
    status: "pending_payment",
    expiresAt: getBookingExpiresAt(createdAt),
    phone,
    slotId,
    dateLabel: slot.dateLabel,
    departLabel: slot.departLabel,
    quantity,
    amountUsd: 25 * quantity,
    handoffId,
    dccReturn,
    squarePaymentLinkId: null,
    squarePaymentLinkUrl: null,
    squareTransactionId: null,
    squareReferenceId: null,
    squareOrderId: null,
    squarePaymentStatus: "pending",
    smsPayLinkSentAt: new Date().toISOString(),
  });

  await sendSms(
    phone,
    [
      "Your Red Rocks Day Pass is ready!",
      "",
      `$25 round-trip • Union Station to Red Rocks Park`,
      `Departure: ${slot.dateLabel} at ${slot.departLabel}`,
      `Your spot is held for about ${20} minutes.`,
      "",
      `Tap here for ticket and payment: ${new URL(`/t/${token}`, new URL(request.url).origin).toString()}`,
      "",
      "GoSno LLC",
    ].join("\n")
  );

  await emitDccEvent({
    handoffId,
    satelliteId: "redrocksfastpass",
    eventType: "lead_captured",
    source: "redrocksfastpass",
    sourcePath: "/api/reserve",
    status: "pay_link_sent",
    stage: "sms_checkout",
    traveler: {
      phone,
      partySize: quantity,
    },
    booking: {
      citySlug: "denver",
      venueSlug: "red-rocks-park",
      productSlug: "red-rocks-day-pass",
      eventDate: slotId.split("-").slice(0, 3).join("-"),
      quantity,
      currency: "USD",
      amount: 25 * quantity,
    },
  });

  const target = `/checkout?slot=${encodeURIComponent(slotId)}&texted=1&quantity=${encodeURIComponent(String(quantity))}&dcc_handoff_id=${encodeURIComponent(handoffId)}${
    dccReturn ? `&dcc_return=${encodeURIComponent(dccReturn)}` : ""
  }`;
  return NextResponse.redirect(new URL(target, request.url));
}
