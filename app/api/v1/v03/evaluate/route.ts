import {
  buildMachineJsonResponse,
  checkDistributedRateLimitV03,
  ClientSuppliedKnownAtForbiddenError,
  enforceEvaluationRequestSizeLimit,
  enforceMachineLayerFeatureFlag,
  handleV03EvaluateRequest,
  MachineSecurityLimitError,
  recordSecurityAuditEvent,
  UnauthorizedAdminSimulationError,
  verifyEvaluationAuthAndRateLimit,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  let rawBody: string;
  try {
    rawBody = await request.text();
    enforceEvaluationRequestSizeLimit(rawBody);
    verifyEvaluationAuthAndRateLimit(request, "evaluate:single");
  } catch (err) {
    if (err instanceof MachineSecurityLimitError) {
      return buildMachineJsonResponse(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: err.statusCode, cacheControl: "no-store" },
      );
    }
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "INVALID_REQUEST_STREAM",
          message: err instanceof Error ? err.message : "Failed to read request body.",
        },
      },
      { status: 400, cacheControl: "no-store" },
    );
  }

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local-client";
  const rateDecision = await checkDistributedRateLimitV03({
    clientKey: clientIp,
    endpoint: "/api/v1/v03/evaluate",
  });
  if (!rateDecision.allowed) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Distributed evaluation rate limit exceeded.",
          coordinationBackend: rateDecision.coordinationBackend,
          resetAtEpochMs: rateDecision.resetAtEpochMs,
        },
      },
      { status: 429, cacheControl: "no-store" },
    );
  }

  let parsed: Record<string, unknown>;
  try {
    const json = JSON.parse(rawBody);
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      throw new Error("Request body must be a JSON object.");
    }
    parsed = json as Record<string, unknown>;
  } catch (err) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "INVALID_JSON_BODY",
          message: err instanceof Error ? err.message : "Invalid JSON request body.",
        },
      },
      { status: 400, cacheControl: "no-store" },
    );
  }

  const engineId = typeof parsed.engineId === "string" ? parsed.engineId : "";
  if (!engineId) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "MISSING_ENGINE_ID",
          message: "Field 'engineId' is required.",
        },
      },
      { status: 400, cacheControl: "no-store" },
    );
  }

  const adminToken =
    request.headers.get("x-dcc-admin-simulation-token") ??
    (typeof parsed.adminAuthToken === "string" ? parsed.adminAuthToken : undefined);
  const surfaceClass =
    parsed.mode === "admin_simulation"
      ? "privileged_simulation"
      : "authenticated_evaluation";

  try {
    const evalRes = await handleV03EvaluateRequest(parsed, { adminToken });

    return buildMachineJsonResponse(
      {
        ok: true,
        protocolVersion: "0.3.0",
        evaluation: evalRes,
      },
      {
        status: 200,
        etag: `"sha256-${evalRes.resultHash}"`,
        cacheControl: "no-store",
        extraHeaders: {
          "X-DCC-Protocol-Version": "0.3.0",
          "X-DCC-Surface-Class": surfaceClass,
          "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
          "X-DCC-RateLimit-Remaining": String(rateDecision.remaining),
          "X-DCC-Engine-Id": evalRes.engineId,
          "X-DCC-Engine-Version": evalRes.engineVersion,
          "X-DCC-Receipt-Id": evalRes.receiptId,
          "X-DCC-Evaluation-Run-Id": evalRes.evaluationRunId,
          "X-DCC-Evaluation-Fingerprint": evalRes.evaluationFingerprint,
          "X-DCC-Knowledge-Cutoff": evalRes.knowledgeCutoff,
          "X-DCC-Decision-State": evalRes.decisionState,
        },
      },
    );
  } catch (err) {
    if (err instanceof ClientSuppliedKnownAtForbiddenError) {
      recordSecurityAuditEvent({
        eventCategory: "client_known_at_rejected",
        severity: "warn",
        actorOrIp: clientIp,
        endpointOrTarget: "/api/v1/v03/evaluate",
        reasonCode: err.code,
        details: { engineId, message: err.message },
      });
      return buildMachineJsonResponse(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: 400, cacheControl: "no-store" },
      );
    }
    if (err instanceof UnauthorizedAdminSimulationError) {
      recordSecurityAuditEvent({
        eventCategory: "unauthorized_api_scope",
        severity: "high",
        actorOrIp: clientIp,
        endpointOrTarget: "/api/v1/v03/evaluate",
        reasonCode: err.code,
        details: { engineId },
      });
      return buildMachineJsonResponse(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: 403, cacheControl: "no-store" },
      );
    }
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "EVALUATION_FAILED",
          message: err instanceof Error ? err.message : "v0.3 evaluation failed.",
        },
      },
      { status: 404, cacheControl: "no-store" },
    );
  }
}
