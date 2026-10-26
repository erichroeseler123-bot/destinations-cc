import {
  buildApiCatalogDocument,
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const catalog = buildApiCatalogDocument(baseUrl);

  return buildMachineJsonResponse(catalog, {
    cacheControl: "public, max-age=300, s-maxage=300",
    extraHeaders: {
      "Content-Type": "application/linkset+json; charset=utf-8",
    },
  });
}
