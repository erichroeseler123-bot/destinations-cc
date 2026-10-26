import {
  buildMachineJsonResponse,
  buildReferenceHttpResponse,
  recordSecurityAuditEvent,
  resolveMachineReference,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

function handleVersionedReferenceRequest(
  request: Request,
  id: string,
  version: string,
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
      endpointOrTarget: `/r/${id}/v/${version}`,
      reasonCode: "PRIVATE_EVIDENCE_RAW_CAPTURE_FORBIDDEN",
      details: { id, version, search: url.search },
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

  const resolved = resolveMachineReference(id, version);
  return buildReferenceHttpResponse(request, resolved, headOnly);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; version: string }> },
) {
  const { id, version } = await context.params;
  return handleVersionedReferenceRequest(request, id, version, false);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ id: string; version: string }> },
) {
  const { id, version } = await context.params;
  return handleVersionedReferenceRequest(request, id, version, true);
}
