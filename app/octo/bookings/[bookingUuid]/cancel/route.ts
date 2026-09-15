import { OctoBookingService } from "@/lib/octo/bookingService";
import {
  handleOctoRouteError,
  logOctoEvent,
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
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is allowed for cancellation
      body = {};
    }

    const { reason } = body || {};
    const idempotencyKey = req.headers.get("idempotency-key") || undefined;
    logOctoEvent("POST_BOOKING_CANCEL", { bookingUuid, reason, idempotencyKey });

    const cancelled = await OctoBookingService.cancelReservation(
      bookingUuid,
      reason || "Traveler requested cancellation via OCTO Core API"
    );

    return octoJsonResponse(cancelled, 200);
  } catch (err) {
    return handleOctoRouteError(err);
  }
}
