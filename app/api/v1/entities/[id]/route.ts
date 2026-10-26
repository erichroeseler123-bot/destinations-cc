import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getMachineEntity,
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
  const entity = getMachineEntity(decodedId);

  if (!entity) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "ENTITY_NOT_FOUND",
          message: `Machine entity "${decodedId}" was not found.`,
        },
      },
      { status: 404, cacheControl: "no-store" },
    );
  }

  return buildMachineJsonResponse(
    {
      ok: true,
      entity,
      references: {
        stableUri: entity.stableReferenceUri,
        immutableUri: entity.immutableReferenceUri,
      },
    },
    {
      etag: `"sha256-${entity.contentHash.slice(0, 32)}"`,
      cacheControl: "public, max-age=60, s-maxage=60",
    },
  );
}
