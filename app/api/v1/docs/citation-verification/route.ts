import {
  buildCitationVerificationDocumentation,
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const doc = buildCitationVerificationDocumentation(baseUrl);

  return buildMachineJsonResponse(doc, {
    cacheControl: "public, max-age=3600, s-maxage=3600",
  });
}
