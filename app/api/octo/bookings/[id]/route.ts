import { NextRequest, NextResponse } from "next/server";
import { OctoBookingService } from "@/lib/octo/bookingService";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const booking = await OctoBookingService.getBooking(id);
    if (!booking) {
      return NextResponse.json(
        { error: "BOOKING_NOT_FOUND", message: `Booking ${id} was not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(booking);
  } catch (err: any) {
    return NextResponse.json(
      { error: "RETRIEVAL_ERROR", message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const cancelled = await OctoBookingService.cancelReservation(id, body.reason);
    return NextResponse.json(cancelled);
  } catch (err: any) {
    return NextResponse.json(
      { error: "CANCELLATION_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
