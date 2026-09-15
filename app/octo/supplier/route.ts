import {
  handleOctoRouteError,
  logOctoEvent,
  octoJsonResponse,
  validateOctoBearerAuth,
} from "@/lib/octo/http";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import { OctoRegistryService } from "@/lib/octo/registry";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = validateOctoBearerAuth(req);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const isProd = process.env.NODE_ENV === "production";
    logOctoEvent("GET_SUPPLIER", { isProd });

    const authorizedConns = await OctoRegistryService.getAuthorizedConnections();
    const liveConnection = authorizedConns.find((c) => c.healthStatus === "healthy");

    if (liveConnection) {
      return octoJsonResponse({
        id: liveConnection.id,
        name: liveConnection.operatorName,
        endpoint: liveConnection.endpoint,
        contact: {
          website: `https://www.destinationcommandcenter.com/operators`,
          email: liveConnection.signatoryEmail || "connectivity@destinationcommandcenter.com",
        },
        capabilities: liveConnection.capabilities || ["octo/core"],
      });
    }

    if (!isProd) {
      // Reference mock supplier available only in non-production test/sandbox environments
      const mockSupplier = MockOctoSupplierEngine.getSupplier();
      return octoJsonResponse(mockSupplier);
    }

    // Production without verified bookable connection returns DCC connectivity layer info
    return octoJsonResponse({
      id: "dcc-connectivity-layer",
      name: "Destination Command Center Connectivity Layer",
      endpoint: "https://www.destinationcommandcenter.com/octo",
      contact: {
        website: "https://www.destinationcommandcenter.com",
        email: "partners@destinationcommandcenter.com",
      },
      capabilities: ["octo/core", "octo/pricing", "octo/content"],
    });
  } catch (err) {
    return handleOctoRouteError(err);
  }
}
