import { NextRequest, NextResponse } from "next/server";
import { DccOrderService } from "@/lib/orders";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await DccOrderService.checkoutOrderWithSquare({
      orderId: body.orderId,
      items: body.items,
      sourceId: body.sourceId,
      travelerId: body.travelerId,
      contact: body.contact || {
        fullName: body.customerName || "Traveler",
        emailAddress: body.customerEmail || "",
        phoneNumber: body.customerPhone,
      },
      idempotencyKey: body.idempotencyKey || req.headers.get("Idempotency-Key") || undefined,
      resellerId: body.resellerId,
    });

    return NextResponse.json({
      success: true,
      orderId: result.order.orderId,
      status: result.order.status,
      paymentId: result.paymentId,
      order: result.order,
      alreadyCompleted: result.alreadyCompleted,
    });
  } catch (err: any) {
    console.error("DCC Square Checkout Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "CHECKOUT_FAILED",
        message: err.message || "Checkout failed",
      },
      { status: 400 }
    );
  }
}
