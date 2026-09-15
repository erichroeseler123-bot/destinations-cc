import {
  handleOctoRouteError,
  logOctoEvent,
  octoErrorResponse,
  octoJsonResponse,
  validateOctoBearerAuth,
} from "@/lib/octo/http";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";

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

    const { productId, optionId, localDateStart, localDateEnd } = body || {};

    if (!productId) {
      return octoErrorResponse("INVALID_PRODUCT_ID", "productId is required", 400);
    }
    if (!optionId) {
      return octoErrorResponse("INVALID_OPTION_ID", "optionId is required", 400);
    }
    if (!localDateStart || !localDateEnd) {
      return octoErrorResponse("BAD_PARSER", "localDateStart and localDateEnd are required", 400);
    }

    const isProd = process.env.NODE_ENV === "production";
    logOctoEvent("POST_AVAILABILITY_CALENDAR", { productId, optionId, localDateStart, localDateEnd, isProd });

    if (!isProd) {
      const slots = MockOctoSupplierEngine.checkAvailability(productId, optionId, localDateStart);
      const calendar = [
        {
          localDate: localDateStart,
          status: slots.length > 0 ? "AVAILABLE" : "SOLD_OUT",
          available: slots.length > 0,
          vacancies: slots.length > 0 ? slots[0].vacancies : 0,
        },
      ];
      return octoJsonResponse(calendar);
    }

    // In production without verified bookable connection:
    return octoErrorResponse("SUPPLIER_NOT_BOOKABLE", "Live availability calendar is not configured for this product", 400);
  } catch (err) {
    return handleOctoRouteError(err);
  }
}
