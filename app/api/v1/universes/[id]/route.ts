import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getMachineCandidateUniverse,
  getV03RuntimeStore,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);
  const url = new URL(request.url);
  const versionParam = url.searchParams.get("version") ?? undefined;

  if (versionParam === "0.3.0" || decodedId.startsWith("univ:v03:")) {
    const store = getV03RuntimeStore();
    const v03Universe =
      store.universesByIdAndVersion.get(`${decodedId}@${versionParam ?? "0.3.0"}`) ??
      store.universesByIdAndVersion.get(decodedId);
    if (v03Universe) {
      return buildMachineJsonResponse(
        {
          ok: true,
          protocolVersion: "0.3.0",
          objectType: "CandidateUniverseV03",
          candidateUniverse: v03Universe,
        },
        {
          etag: `"sha256-${v03Universe.universeHash}"`,
          cacheControl: "public, max-age=31536000, immutable",
        },
      );
    }
  }

  const universe = getMachineCandidateUniverse(decodedId, versionParam);
  if (!universe) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "CANDIDATE_UNIVERSE_NOT_FOUND",
          message: `CandidateUniverse "${decodedId}"${versionParam ? ` version "${versionParam}"` : ""} was not found.`,
        },
      },
      { status: 404, cacheControl: "no-store" },
    );
  }

  return buildMachineJsonResponse(
    {
      ok: true,
      objectType: "CandidateUniverse",
      candidateUniverse: universe,
    },
    {
      etag: `"sha256-${universe.canonicalHash.slice(0, 32)}"`,
      cacheControl:
        versionParam && versionParam !== "active"
          ? "public, max-age=31536000, immutable"
          : "public, max-age=60, must-revalidate",
    },
  );
}
