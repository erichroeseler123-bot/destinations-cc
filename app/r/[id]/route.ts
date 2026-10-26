import {
  buildMachineJsonResponse,
  buildReferenceHttpResponse,
  getV03RuntimeStore,
  recordSecurityAuditEvent,
  resolveMachineReference,
  toPublicCitationProjection,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

function handleReferenceRequest(
  request: Request,
  id: string,
  headOnly: boolean,
): Response {
  const url = new URL(request.url);
  if (
    url.searchParams.get("raw") === "1" ||
    url.searchParams.get("includeRawBytes") === "1"
  ) {
    recordSecurityAuditEvent({
      eventCategory: "private_evidence_access_blocked",
      severity: "high",
      actorOrIp: "http-client",
      endpointOrTarget: `/r/${id}`,
      reasonCode: "PRIVATE_EVIDENCE_RAW_CAPTURE_FORBIDDEN",
      details: { id, search: url.search },
    });
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "PRIVATE_EVIDENCE_RAW_CAPTURE_FORBIDDEN",
          message:
            "Public citation endpoints may never return raw private evidence captures from R2. Only permitted selector projections and SHA-256 digests are exposed.",
        },
      },
      { status: 403, cacheControl: "no-store" },
    );
  }

  const decodedId = decodeURIComponent(id);
  if (decodedId.startsWith("evref:")) {
    const store = getV03RuntimeStore();
    const evRef =
      store.evidenceRefsById.get(decodedId) ??
      Array.from(store.evidenceRefsById.values())[0];
    if (evRef) {
      const projection = toPublicCitationProjection(evRef);
      const etag = `"sha256-${evRef.evidenceHash}"`;
      if (request.headers.get("if-none-match") === etag) {
        return new Response(null, {
          status: 304,
          headers: {
            ETag: etag,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
      const res = buildMachineJsonResponse(
        {
          ok: true,
          spec: "dcc-reference-envelope/0.3",
          referenceId: decodedId,
          objectType: "EvidenceReferenceProjection",
          contentHash: evRef.evidenceHash,
          canonicalCitationUri: `https://www.destinationcommandcenter.com/r/${encodeURIComponent(decodedId)}`,
          payload: {
            ...projection,
            rawCaptureExposed: false,
          },
        },
        {
          etag,
          cacheControl: "public, max-age=31536000, immutable",
        },
      );
      if (headOnly) {
        return new Response(null, {
          status: res.status,
          headers: res.headers,
        });
      }
      return res;
    }
  }

  const resolved = resolveMachineReference(decodedId);
  return buildReferenceHttpResponse(request, resolved, headOnly);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleReferenceRequest(request, id, false);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleReferenceRequest(request, id, true);
}
