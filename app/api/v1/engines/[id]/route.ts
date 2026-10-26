import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getMachineEngine,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);
  const record = getMachineEngine(decodedId);

  if (!record) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "ENGINE_NOT_FOUND",
          message: `Decision engine "${decodedId}" was not found.`,
        },
      },
      { status: 404, cacheControl: "no-store" },
    );
  }

  return buildMachineJsonResponse(
    {
      ok: true,
      engine: record.engine,
      versions: record.versions,
      activeManifest: record.activeBundle.manifest,
      inputSchema: record.activeBundle.inputSchema,
      candidateCount: record.activeBundle.candidates.length,
      ruleCount: record.activeBundle.rules.length,
      references: {
        stableUri: record.engine.stableReferenceUri,
        immutableUri: record.engine.immutableReferenceUri,
        activeBundleUri: record.engine.activeBundleUri,
      },
    },
    {
      etag: `"sha256-${record.activeBundle.bundleHash.slice(0, 32)}"`,
      cacheControl: "public, max-age=60, s-maxage=60",
    },
  );
}
