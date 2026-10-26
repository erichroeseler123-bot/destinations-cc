import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getMachineCandidateUniverse,
  getV03CandidateUniverseWithFallback,
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

  if (
    versionParam === "0.3.0" ||
    decodedId.startsWith("univ:gosno-") ||
    decodedId.startsWith("univ:denver-") ||
    /^[0-9a-f]{64}$/i.test(decodedId)
  ) {
    const v03Universe = await getV03CandidateUniverseWithFallback(
      decodedId,
      versionParam ?? "0.3.0",
    );
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
    const v03Fallback = await getV03CandidateUniverseWithFallback(
      decodedId,
      versionParam ?? "0.3.0",
    );
    if (v03Fallback) {
      return buildMachineJsonResponse(
        {
          ok: true,
          protocolVersion: "0.3.0",
          objectType: "CandidateUniverseV03",
          candidateUniverse: v03Fallback,
        },
        {
          etag: `"sha256-${v03Fallback.universeHash}"`,
          cacheControl: "public, max-age=31536000, immutable",
        },
      );
    }
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
