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

    const { productId, optionId, localDate, units, unitItems } = body || {};

    if (!productId) {
      return octoErrorResponse("INVALID_PRODUCT_ID", "productId is required", 400);
    }
    if (!optionId) {
      return octoErrorResponse("INVALID_OPTION_ID", "optionId is required", 400);
    }
    if (!localDate) {
      return octoErrorResponse("BAD_PARSER", "localDate is required (format: YYYY-MM-DD)", 400);
    }

    const isProd = process.env.NODE_ENV === "production";
    logOctoEvent("POST_AVAILABILITY", { productId, optionId, localDate, isProd });

    if (!isProd) {
      const items = unitItems || units;
      const slots = MockOctoSupplierEngine.checkAvailability(productId, optionId, localDate, items);
      return octoJsonResponse(slots);
    }

    // In production without verified bookable connection:
    return octoErrorResponse("SUPPLIER_NOT_BOOKABLE", "Live availability is not configured for this product", 400);
  } catch (err) {
    return handleOctoRouteError(err);
  }
}
