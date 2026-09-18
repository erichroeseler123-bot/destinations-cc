import { NextRequest, NextResponse } from "next/server";
import { OctoBookingService } from "@/lib/octo/bookingService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey = req.headers.get("idempotency-key") || req.headers.get("x-idempotency-key") || undefined;

    if (!body.productId || !body.optionId || !body.availabilityId || !body.unitItems?.length) {
      return NextResponse.json(
        {
          error: "INVALID_HOLD_REQUEST",
          message: "productId, optionId, availabilityId, and unitItems are required",
        },
        { status: 400 }
      );
    }

    const holdResult = await OctoBookingService.createHold({
      supplierConnectionId: body.supplierConnectionId || "conn_mock_alaska",
      productId: body.productId,
      optionId: body.optionId,
      availabilityId: body.availabilityId,
      expirationMinutes: body.expirationMinutes || 15,
      unitItems: body.unitItems,
      notes: body.notes,
      idempotencyKey,
    });

    return NextResponse.json(holdResult, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.octoError || err.name || "HOLD_FAILED", message: err.message },
      { status: err.status || 500 }
    );
  }
}
