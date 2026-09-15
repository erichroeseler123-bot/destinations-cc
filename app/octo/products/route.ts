import { getDb } from "@/lib/db/client";
import { octoNormalizedProducts } from "@/lib/db/schema";
import {
  handleOctoRouteError,
  logOctoEvent,
  octoJsonResponse,
  validateOctoBearerAuth,
} from "@/lib/octo/http";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import { OctoRegistryService } from "@/lib/octo/registry";
import { OctoProduct } from "@/lib/octo/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = validateOctoBearerAuth(req);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const isProd = process.env.NODE_ENV === "production";
    logOctoEvent("GET_PRODUCTS", { isProd });

    const db = getDb();
    if (db) {
      const authorizedConns = await OctoRegistryService.getAuthorizedConnections();
      const authorizedIds = authorizedConns.map((c) => c.id);

      if (authorizedIds.length > 0) {
        const rows = await db.select().from(octoNormalizedProducts);
        const filtered = rows.filter((r) => authorizedIds.includes(r.supplierConnectionId));

        if (filtered.length > 0) {
          const products: OctoProduct[] = filtered.map((r) => ({
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
          }));
          return octoJsonResponse(products);
        }
      }
    }

    if (!isProd) {
      // Return reference sandbox mock products only in non-production environments
      const mockProducts = MockOctoSupplierEngine.getProducts();
      return octoJsonResponse(mockProducts);
    }

    // In production without verified bookable connections, do not leak mock inventory
    return octoJsonResponse([]);
  } catch (err) {
    return handleOctoRouteError(err);
  }
}
