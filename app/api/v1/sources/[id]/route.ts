import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getMachineSource,
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
  const record = getMachineSource(decodedId);

  if (!record) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "SOURCE_NOT_FOUND",
          message: `Machine source "${decodedId}" was not found.`,
        },
      },
      { status: 404, cacheControl: "no-store" },
    );
  }

  return buildMachineJsonResponse(
    {
      ok: true,
      source: record.source,
      snapshots: record.snapshots,
      fragments: record.fragments,
      references: {
        stableUri: record.source.stableReferenceUri,
        immutableUri: record.source.immutableReferenceUri,
      },
    },
    {
      etag: `"sha256-${record.source.contentHash.slice(0, 32)}"`,
      cacheControl: "public, max-age=60, s-maxage=60",
    },
  );
}
