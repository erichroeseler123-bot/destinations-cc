import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getDeploymentProvenanceV03,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET() {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const provenance = getDeploymentProvenanceV03();

  return buildMachineJsonResponse(provenance, {
    cacheControl: "no-store",
  });
}
