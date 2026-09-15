import { OctoBookingService } from "@/lib/octo/bookingService";
import {
  handleOctoRouteError,
  logOctoEvent,
  octoErrorResponse,
  octoJsonResponse,
  validateOctoBearerAuth,
} from "@/lib/octo/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = validateOctoBearerAuth(req);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return octoErrorResponse("BAD_PARSER", "Invalid JSON request body", 400);
    }

    const {
      uuid,
      productId,
      optionId,
      availabilityId,
      expirationMinutes,
      unitItems,
      units,
      notes,
    } = body || {};

    if (!productId) {
      return octoErrorResponse("INVALID_PRODUCT_ID", "productId is required", 400);
    }
    if (!optionId) {
      return octoErrorResponse("INVALID_OPTION_ID", "optionId is required", 400);
    }
    if (!availabilityId) {
      return octoErrorResponse("INVALID_AVAILABILITY_ID", "availabilityId is required", 400);
    }

    const items = unitItems || units;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return octoErrorResponse("INVALID_UNIT_ID", "At least one unit item must be requested", 400);
    }

    const idempotencyKey = req.headers.get("idempotency-key") || undefined;
    const isProd = process.env.NODE_ENV === "production";

    logOctoEvent("POST_BOOKINGS_CREATE_HOLD", {
      productId,
      optionId,
      availabilityId,
      idempotencyKey,
      isProd,
    });

    const supplierConnectionId = await OctoBookingService.resolveConnectionForProduct(productId);

    const holdResult = await OctoBookingService.createHold({
      supplierConnectionId,
      productId,
      optionId,
      availabilityId,
      expirationMinutes: expirationMinutes || 15,
      unitItems: items.map((u: any) => ({
        unitId: u.unitId || u.id,
        quantity: u.quantity || 1,
      })),
      notes,
      idempotencyKey,
      resellerId: auth.context?.resellerId,
    });

    return octoJsonResponse(holdResult, 201);
  } catch (err) {
    return handleOctoRouteError(err);
  }
}

export async function GET(req: Request) {
  const auth = validateOctoBearerAuth(req);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined;

    logOctoEvent("GET_BOOKINGS_LIST", { status, limit });

    const bookings = await OctoBookingService.listBookings({
      resellerId: auth.context?.resellerId,
      status,
      limit,
    });

    return octoJsonResponse(bookings);
  } catch (err) {
    return handleOctoRouteError(err);
  }
}
