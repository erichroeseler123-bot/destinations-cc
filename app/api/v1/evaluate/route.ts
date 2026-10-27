import {
  MachineSecurityLimitError,
  buildMachineJsonResponse,
  enforceEvaluationRequestSizeLimit,
  enforceMachineLayerFeatureFlag,
  evaluateMachineEngine,
  resolveOrGenerateW3cTraceparent,
  sanitizeEvaluationRequestForAssurance,
  verifyEvaluationAuthAndRateLimit,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  let rawText: string;
  let authResult: ReturnType<typeof verifyEvaluationAuthAndRateLimit>;
  const traceparent = resolveOrGenerateW3cTraceparent(request.headers.get("traceparent"));
  try {
    rawText = await request.text();
    enforceEvaluationRequestSizeLimit(rawText);
    authResult = verifyEvaluationAuthAndRateLimit(request, "evaluate:single");
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

  let body: unknown;
  try {
    body = JSON.parse(rawText);
  } catch {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "INVALID_JSON_BODY",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400, cacheControl: "no-store" },
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "INVALID_EVALUATION_REQUEST",
          message:
            "Request body must be an object with engineId (string), inputs (object), and optional engineVersion, mode ('compact' | 'expanded'), validAt, and knownAt.",
        },
      },
      { status: 400, cacheControl: "no-store" },
    );
  }

  const { sanitizedBody } = sanitizeEvaluationRequestForAssurance(
    body as Record<string, unknown>,
  );
  const payload = sanitizedBody;
  const engineId = typeof payload.engineId === "string" ? payload.engineId : "";
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

  const inputs =
    typeof payload.inputs === "object" &&
    payload.inputs !== null &&
    !Array.isArray(payload.inputs)
      ? (payload.inputs as Record<string, unknown>)
      : {};

  const engineVersion =
    typeof payload.engineVersion === "string" ? payload.engineVersion : undefined;
  const mode =
    payload.mode === "expanded" || payload.mode === "compact"
      ? payload.mode
      : "compact";
  const evaluatedAt =
    typeof payload.evaluatedAt === "string" ? payload.evaluatedAt : undefined;
  const validAt =
    typeof payload.validAt === "string" ? payload.validAt : undefined;
  const knownAt =
    typeof payload.knownAt === "string" ? payload.knownAt : undefined;

  const result = evaluateMachineEngine({
    engineId,
    engineVersion,
    inputs,
    mode,
    evaluatedAt,
    validAt,
    knownAt,
  });

  if (!result.ok) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: result.code,
          message: result.error,
        },
      },
      { status: result.status, cacheControl: "no-store" },
    );
  }

  const hasWithdrawnOrConflicted =
    result.response.withdrawnClaimVersionIds.length > 0 ||
    result.response.conflictIds.length > 0;

  return buildMachineJsonResponse(
    {
      ...result.response,
      callerClientId: authResult.clientId,
      traceparent,
    },
    {
      etag: `"sha256-${result.response.resultHash.slice(0, 32)}"`,
      cacheControl: hasWithdrawnOrConflicted
        ? "no-store"
        : "public, max-age=60, s-maxage=60",
      extraHeaders: {
        "X-DCC-Engine-Id": result.response.engineId,
        "X-DCC-Engine-Version": result.response.engineVersion,
        "X-DCC-Bundle-Hash": result.response.bundleHash,
        "X-DCC-Result-Hash": result.response.resultHash,
        "X-DCC-Trace-Hash": result.response.traceHash,
        "X-DCC-Decision-State": result.response.decisionState,
        "X-DCC-Client-Id": authResult.clientId,
        traceparent,
        ...(result.response.receiptId
          ? { "X-DCC-Receipt-Id": result.response.receiptId }
          : {}),
        ...(result.response.evaluationRunId
          ? { "X-DCC-Evaluation-Run-Id": result.response.evaluationRunId }
          : {}),
        ...(result.response.evaluationFingerprint
          ? { "X-DCC-Evaluation-Fingerprint": result.response.evaluationFingerprint }
          : {}),
      },
    },
  );
}
