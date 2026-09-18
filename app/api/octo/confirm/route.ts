import { NextRequest, NextResponse } from "next/server";
import { OctoBookingService } from "@/lib/octo/bookingService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey = req.headers.get("idempotency-key") || req.headers.get("x-idempotency-key") || undefined;

    if (!body.bookingId || !body.contact?.fullName || !body.contact?.emailAddress) {
      return NextResponse.json(
        {
          error: "INVALID_CONFIRMATION_REQUEST",
          message: "bookingId and contact with fullName and emailAddress are required",
        },
        { status: 400 }
      );
    }

    const confirmed = await OctoBookingService.confirmReservation({
      bookingId: body.bookingId,
      contact: body.contact,
      payment: body.payment,
      idempotencyKey,
    });

    return NextResponse.json(confirmed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.octoError || err.name || "CONFIRMATION_FAILED", message: err.message },
      { status: err.status || 500 }
    );
  }
}
