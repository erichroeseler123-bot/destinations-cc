import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getStandardJwksDocument,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET() {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const jwks = getStandardJwksDocument();

  return buildMachineJsonResponse(jwks, {
    etag: `"jwks-v03-${jwks.activeKid ?? "none"}"`,
    cacheControl: "public, max-age=300, s-maxage=300",
  });
}
