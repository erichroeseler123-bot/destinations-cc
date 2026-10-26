import {
  buildMachineJsonResponse,
  buildMcpDiscoveryDocument,
  enforceMachineLayerFeatureFlag,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const mcpDoc = buildMcpDiscoveryDocument(baseUrl);

  return buildMachineJsonResponse(mcpDoc, {
    cacheControl: "public, max-age=300, s-maxage=300",
  });
}
