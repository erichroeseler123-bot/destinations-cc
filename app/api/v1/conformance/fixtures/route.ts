import {
  buildLanguageNeutralConformanceFixtures,
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET() {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const fixtures = await buildLanguageNeutralConformanceFixtures();

  return buildMachineJsonResponse(fixtures, {
    cacheControl: "public, max-age=300, s-maxage=300",
  });
}
