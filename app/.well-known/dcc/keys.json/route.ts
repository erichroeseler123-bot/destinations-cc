import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getPublicSigningKeyManifest,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET() {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const manifest = getPublicSigningKeyManifest();

  return buildMachineJsonResponse(manifest, {
    etag: `"ed25519-${manifest.activeKeyId}"`,
    cacheControl: "public, max-age=300, s-maxage=300",
  });
}
