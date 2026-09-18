import { NextRequest, NextResponse } from "next/server";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";

export const dynamic = "force-dynamic";

function checkProductionLock(): NextResponse | null {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_OCTO_MOCK !== "true") {
    return NextResponse.json(
      {
        error: "MOCK_DISABLED_IN_PRODUCTION",
        message: "Mock OCTO endpoints are disabled in production environments.",
      },
      { status: 403 }
    );
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const lock = checkProductionLock();
  if (lock) return lock;

  const { slug } = await params;
  const path = slug.join("/");

  const simulate = req.headers.get("x-mock-simulate");
  if (simulate === "invalid_credentials") {
    return NextResponse.json(
      { error: "UNAUTHORIZED", errorMessage: "Invalid API key or token" },
      { status: 401 }
    );
  }

  // GET /suppliers
  if (path === "suppliers") {
    return NextResponse.json(MockOctoSupplierEngine.getSupplier());
  }

  // GET /products
  if (path === "products") {
    return NextResponse.json(MockOctoSupplierEngine.getProducts());
  }

  // GET /products/:id
  if (path.startsWith("products/")) {
    const productId = path.replace("products/", "");
    const product = MockOctoSupplierEngine.getProduct(productId);
    if (!product) {
      return NextResponse.json(
        { error: "NOT_FOUND", errorMessage: `Product ${productId} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(product);
  }

  // GET /bookings/:uuid
  if (path.startsWith("bookings/")) {
    const uuid = path.replace("bookings/", "");
    const booking = MockOctoSupplierEngine.getBooking(uuid);
    if (!booking) {
      return NextResponse.json(
        { error: "BOOKING_NOT_FOUND", errorMessage: `Booking ${uuid} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(booking);
  }

  return NextResponse.json({ error: "ENDPOINT_NOT_FOUND" }, { status: 404 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const lock = checkProductionLock();
  if (lock) return lock;

  const { slug } = await params;
  const path = slug.join("/");
  const body = await req.json().catch(() => ({}));

  const simulate = req.headers.get("x-mock-simulate");
  if (simulate === "invalid_credentials") {
    return NextResponse.json(
      { error: "UNAUTHORIZED", errorMessage: "Invalid API key or token" },
      { status: 401 }
    );
  }
  if (simulate === "timeout") {
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  // POST /availability/calendar
  if (path === "availability/calendar") {
    const slots = MockOctoSupplierEngine.getAvailabilityCalendar(
      body.productId,
      body.optionId,
      body.localDateStart,
      body.localDateEnd
    );
    return NextResponse.json(slots);
  }

  // POST /availability
  if (path === "availability") {
    if (simulate === "unavailable") {
      return NextResponse.json([]);
    }
    const slots = MockOctoSupplierEngine.checkAvailability(
      body.productId,
      body.optionId,
      body.localDate
    );
    return NextResponse.json(slots);
  }

  // POST /bookings
  if (path === "bookings") {
    try {
      const hold = MockOctoSupplierEngine.createHold(body);
      return NextResponse.json(hold, { status: 201 });
    } catch (err: any) {
      return NextResponse.json(
        { error: "HOLD_FAILED", errorMessage: err.message },
        { status: 400 }
      );
    }
  }

  // POST /bookings/:uuid/confirm
  if (path.startsWith("bookings/") && path.endsWith("/confirm")) {
    const uuid = path.split("/")[1];
    try {
      const confirmed = MockOctoSupplierEngine.confirmBooking(uuid, body);
      return NextResponse.json(confirmed);
    } catch (err: any) {
      const status = err.message.includes("EXPIRED_HOLD") ? 410 : 400;
      return NextResponse.json(
        { error: "CONFIRM_FAILED", errorMessage: err.message },
        { status }
      );
    }
  }

  // POST /bookings/:uuid/cancel
  if (path.startsWith("bookings/") && path.endsWith("/cancel")) {
    const uuid = path.split("/")[1];
    try {
      const cancelled = MockOctoSupplierEngine.cancelBooking(uuid, body.reason);
      return NextResponse.json(cancelled);
    } catch (err: any) {
      return NextResponse.json(
        { error: "CANCEL_FAILED", errorMessage: err.message },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: "ENDPOINT_NOT_FOUND" }, { status: 404 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const lock = checkProductionLock();
  if (lock) return lock;

  const { slug } = await params;
  const path = slug.join("/");
  const body = await req.json().catch(() => ({}));

  if (path.startsWith("bookings/")) {
    const uuid = path.replace("bookings/", "");
    try {
      const updated = MockOctoSupplierEngine.updateBooking(uuid, body);
      return NextResponse.json(updated);
    } catch (err: any) {
      return NextResponse.json(
        { error: "UPDATE_FAILED", errorMessage: err.message },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: "ENDPOINT_NOT_FOUND" }, { status: 404 });
}
