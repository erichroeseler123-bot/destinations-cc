import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getMachineClaim,
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
  const record = getMachineClaim(decodedId);

  if (!record) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "CLAIM_NOT_FOUND",
          message: `Machine claim "${decodedId}" was not found.`,
        },
      },
      { status: 404, cacheControl: "no-store" },
    );
  }

  return buildMachineJsonResponse(
    {
      ok: true,
      claim: record.claim,
      versions: record.versions,
      conflicts: record.conflicts,
      retractions: record.retractions,
      references: {
        stableUri: record.claim.stableReferenceUri,
        immutableUri: record.claim.immutableReferenceUri,
      },
    },
    {
      etag: `"sha256-${record.claim.currentVersion.evidenceHash.slice(0, 32)}"`,
      cacheControl:
        record.claim.status === "withdrawn" || record.claim.hasOpenConflict
          ? "no-store"
          : "public, max-age=60, s-maxage=60",
    },
  );
}
