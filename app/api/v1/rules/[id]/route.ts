import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getMachineRule,
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
  const rule = getMachineRule(decodedId);

  if (!rule) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "RULE_NOT_FOUND",
          message: `Machine rule "${decodedId}" was not found.`,
        },
      },
      { status: 404, cacheControl: "no-store" },
    );
  }

  return buildMachineJsonResponse(
    {
      ok: true,
      rule,
      references: {
        stableUri: rule.stableReferenceUri,
        immutableUri: rule.immutableReferenceUri,
      },
    },
    {
      etag: `"sha256-${rule.contentHash.slice(0, 32)}"`,
      cacheControl: "public, max-age=60, s-maxage=60",
    },
  );
}
