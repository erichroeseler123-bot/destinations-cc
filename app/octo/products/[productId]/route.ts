import { getDb } from "@/lib/db/client";
import { octoNormalizedProducts } from "@/lib/db/schema";
import {
  handleOctoRouteError,
  logOctoEvent,
  octoErrorResponse,
  octoJsonResponse,
  validateOctoBearerAuth,
} from "@/lib/octo/http";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import { OctoProduct } from "@/lib/octo/types";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  props: { params: Promise<{ productId: string }> }
) {
  const auth = validateOctoBearerAuth(req);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { productId } = await props.params;
    const isProd = process.env.NODE_ENV === "production";
    logOctoEvent("GET_PRODUCT_BY_ID", { productId, isProd });

    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(octoNormalizedProducts)
        .where(eq(octoNormalizedProducts.id, productId));

      if (rows.length > 0) {
        const r = rows[0];
        const product: OctoProduct = {
          id: r.id,
          internalName: r.title,
          reference: r.supplierProductReference,
          title: r.title,
          description: r.description || undefined,
          country: r.country || undefined,
          location: r.locationName || undefined,
          destinationSlug: r.destinationSlug,
          defaultCurrency: r.defaultCurrency,
          durationMinutes: r.durationMinutes || undefined,
          meetingPoint: r.meetingPoint || undefined,
          cancellationPolicy: r.cancellationPolicy || undefined,
          capabilities: (r.capabilities as any) || ["octo/core"],
          options: (r.options as any) || [],
        };
        return octoJsonResponse(product);
      }
    }

    if (!isProd) {
      const mockProduct = MockOctoSupplierEngine.getProduct(productId);
      if (mockProduct) {
        return octoJsonResponse(mockProduct);
      }
    }

    return octoErrorResponse("INVALID_PRODUCT_ID", `Product ${productId} not found`, 404);
  } catch (err) {
    return handleOctoRouteError(err);
  }
}
