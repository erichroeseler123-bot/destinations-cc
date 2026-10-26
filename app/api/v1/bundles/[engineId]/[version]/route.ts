import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getMachineBundle,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ engineId: string; version: string }> },
) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const { engineId, version } = await context.params;
  const decodedEngineId = decodeURIComponent(engineId);
  const decodedVersion = decodeURIComponent(version);
  const bundle = getMachineBundle(decodedEngineId, decodedVersion);

  if (!bundle) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "BUNDLE_NOT_FOUND",
          message: `Compiled Decision IR bundle for engine "${decodedEngineId}" version "${decodedVersion}" was not found.`,
        },
      },
      { status: 404, cacheControl: "no-store" },
    );
  }

  const isImmutable = decodedVersion !== "active";

  return buildMachineJsonResponse(
    {
      ok: true,
      bundle,
    },
    {
      etag: `"sha256-${bundle.bundleHash.slice(0, 32)}"`,
      cacheControl: isImmutable
        ? "public, max-age=31536000, immutable"
        : "public, max-age=60, must-revalidate",
    },
  );
}
