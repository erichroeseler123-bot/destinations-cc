import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getStandardJwksDocumentAsync,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET() {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const jwks = await getStandardJwksDocumentAsync();

  return buildMachineJsonResponse(jwks, {
    etag: `"jwks-v031-${jwks.activeKid ?? "none"}-${jwks.keys.length}"`,
    cacheControl: "public, max-age=60, s-maxage=60",
  });
}
