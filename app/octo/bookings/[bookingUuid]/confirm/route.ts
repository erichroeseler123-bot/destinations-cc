import { OctoBookingService } from "@/lib/octo/bookingService";
import {
  handleOctoRouteError,
  logOctoEvent,
  octoErrorResponse,
  octoJsonResponse,
  validateOctoBearerAuth,
} from "@/lib/octo/http";

export const dynamic = "force-dynamic";

export async function POST(
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

    const { contact, payment, resellerReference } = body || {};

    if (!contact || !contact.fullName || !contact.emailAddress) {
      return octoErrorResponse(
        "INVALID_CONTACT",
        "Lead passenger contact with fullName and emailAddress is required",
        400
      );
    }

    const idempotencyKey = req.headers.get("idempotency-key") || undefined;
    logOctoEvent("POST_BOOKING_CONFIRM", { bookingUuid, idempotencyKey });

    const confirmed = await OctoBookingService.confirmReservation({
      bookingId: bookingUuid,
      contact,
      payment,
      idempotencyKey,
      resellerId: auth.context?.resellerId,
    });

    return octoJsonResponse(confirmed, 200);
  } catch (err) {
    return handleOctoRouteError(err);
  }
}
