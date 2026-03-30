import { NextRequest, NextResponse } from "next/server";
import { getBooking, updateBooking } from "@/lib/bookings";
import { canFinalizePaidBooking } from "@/lib/finalizeBooking";
import { createSquarePaymentLink } from "@/lib/payments";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = String(request.nextUrl.searchParams.get("token") || "").trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const booking = await getBooking(token);
  if (!booking) {
    return NextResponse.json({ ok: false, error: "booking_not_found" }, { status: 404 });
  }

  const validation = await canFinalizePaidBooking(booking);
  if (!validation.ok) {
    return NextResponse.redirect(new URL(`/t/${encodeURIComponent(token)}?soldout=1`, request.url));
  }

  if (booking.squarePaymentLinkUrl) {
    return NextResponse.redirect(booking.squarePaymentLinkUrl);
  }

  const paymentLink = await createSquarePaymentLink({
    origin: request.nextUrl.origin,
    token,
    slotId: booking.slotId,
    quantity: booking.quantity,
    amountUsd: booking.amountUsd,
    dateLabel: booking.dateLabel,
    departLabel: booking.departLabel,
    phone: booking.phone,
  });

  await updateBooking(token, {
    squarePaymentLinkId: paymentLink.id || null,
    squarePaymentLinkUrl: paymentLink.url || null,
    squareOrderId: paymentLink.orderId || null,
    squarePaymentStatus: "pending",
  });

  return NextResponse.redirect(paymentLink.url);
}
