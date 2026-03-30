import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getBooking } from "@/lib/bookings";
import { markBookingRefunded } from "@/lib/finalizeBooking";
import { refundSquarePayment } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function read(name: string) {
  return String(process.env[name] || "").trim();
}

function getAdminToken() {
  return read("REDROCKSFASTPASS_ADMIN_TOKEN");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const adminToken = String(formData.get("admin_token") || "").trim();
  const bookingToken = String(formData.get("booking_token") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const departure = String(formData.get("departure") || "").trim();

  const redirectUrl = new URL("/admin/manifests", request.url);
  if (date) redirectUrl.searchParams.set("date", date);
  if (departure) redirectUrl.searchParams.set("departure", departure);
  if (adminToken) redirectUrl.searchParams.set("token", adminToken);

  if (getAdminToken() && adminToken !== getAdminToken()) {
    redirectUrl.searchParams.set("error", "auth");
    return NextResponse.redirect(redirectUrl);
  }

  const booking = await getBooking(bookingToken);
  if (!booking) {
    redirectUrl.searchParams.set("error", "booking");
    return NextResponse.redirect(redirectUrl);
  }

  if (booking.status !== "needs_review" || !booking.squareTransactionId) {
    redirectUrl.searchParams.set("error", "refund_state");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const refund = await refundSquarePayment({
      paymentId: booking.squareTransactionId,
      amountUsd: booking.amountUsd,
      reason: booking.reviewReason || "booking_needs_review",
      idempotencyKey: `refund_${booking.token}_${randomUUID().slice(0, 8)}`,
    });

    await markBookingRefunded(booking, {
      refundId: refund.refund?.id || null,
      sourcePath: "/api/admin/refund",
    });

    redirectUrl.searchParams.set("refunded", booking.token);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    redirectUrl.searchParams.set("error", error instanceof Error ? error.message : "refund_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
