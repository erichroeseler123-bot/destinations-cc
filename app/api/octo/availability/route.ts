import { NextRequest, NextResponse } from "next/server";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import { OctoBookingService } from "@/lib/octo/bookingService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supplierConnectionId, productId, optionId, localDate, unitItems } = body;

    if (!productId || !optionId || !localDate) {
      return NextResponse.json(
        { error: "INVALID_PARAMS", message: "productId, optionId, and localDate are required" },
        { status: 400 }
      );
    }

    const connId = supplierConnectionId || "conn_mock_alaska";
    const { adapter, isMock } = await OctoBookingService.getAdapterForConnection(connId);

    let slots;
    if (isMock) {
      slots = MockOctoSupplierEngine.checkAvailability(productId, optionId, localDate);
    } else if (adapter) {
      slots = await adapter.checkAvailability(productId, optionId, localDate, unitItems);
    } else {
      return NextResponse.json(
        { error: "CONNECTION_FAILED", message: "Unable to establish OCTO adapter" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      productId,
      optionId,
      localDate,
      source: isMock ? "mock_reference_provider" : "live_upstream_octo",
      checkedAt: new Date().toISOString(),
      slots,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.name || "AVAILABILITY_ERROR", message: err.message },
      { status: err.status || 500 }
    );
  }
}
