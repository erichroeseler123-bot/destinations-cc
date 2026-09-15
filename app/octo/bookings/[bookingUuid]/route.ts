import { OctoBookingService } from "@/lib/octo/bookingService";
import {
  handleOctoRouteError,
  logOctoEvent,
  octoErrorResponse,
  octoJsonResponse,
  validateOctoBearerAuth,
} from "@/lib/octo/http";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  props: { params: Promise<{ bookingUuid: string }> }
) {
  const auth = validateOctoBearerAuth(req);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { bookingUuid } = await props.params;
    logOctoEvent("GET_BOOKING_BY_UUID", { bookingUuid });

    const booking = await OctoBookingService.getBooking(bookingUuid, {
      resellerId: auth.context?.resellerId,
    });

    if (!booking) {
      return octoErrorResponse("INVALID_BOOKING", `Booking ${bookingUuid} not found`, 404);
    }

    return octoJsonResponse(booking);
  } catch (err) {
    return handleOctoRouteError(err);
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ bookingUuid: string }> }
) {
  const auth = validateOctoBearerAuth(req);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { bookingUuid } = await props.params;
    let body: any;
    try {
      body = await req.json();
    } catch {
      return octoErrorResponse("BAD_PARSER", "Invalid JSON request body", 400);
    }

    logOctoEvent("PATCH_BOOKING_BY_UUID", { bookingUuid });

    const updated = await OctoBookingService.updateBooking(bookingUuid, body, {
      resellerId: auth.context?.resellerId,
    });

    return octoJsonResponse(updated);
  } catch (err) {
    return handleOctoRouteError(err);
  }
}
