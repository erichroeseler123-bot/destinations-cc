import {
  MachineSecurityLimitError,
  buildMachineJsonResponse,
  enforceBatchItemCountLimit,
  enforceEvaluationRequestSizeLimit,
  enforceMachineLayerFeatureFlag,
  evaluateMachineEngineBatch,
  verifyEvaluationAuthAndRateLimit,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  let rawText: string;
  try {
    rawText = await request.text();
    enforceEvaluationRequestSizeLimit(rawText);
    verifyEvaluationAuthAndRateLimit(request, "evaluate:batch");
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
          code: "INVALID_BATCH_REQUEST",
          message: "Request body must be an object containing an 'items' array.",
        },
      },
      { status: 400, cacheControl: "no-store" },
    );
  }

  const payload = body as Record<string, unknown>;
  try {
    enforceBatchItemCountLimit(payload.items as unknown[]);
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
  }

  const itemsArray = payload.items as unknown[];
  const normalizedItems = itemsArray.map((raw, idx) => {
    const obj =
      typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
    return {
      requestId: typeof obj.requestId === "string" ? obj.requestId : `req_${idx + 1}`,
      engineId: typeof obj.engineId === "string" ? obj.engineId : "",
      engineVersion:
        typeof obj.engineVersion === "string" ? obj.engineVersion : undefined,
      inputs:
        typeof obj.inputs === "object" &&
        obj.inputs !== null &&
        !Array.isArray(obj.inputs)
          ? (obj.inputs as Record<string, unknown>)
          : {},
      mode:
        obj.mode === "expanded" || obj.mode === "compact"
          ? (obj.mode as "compact" | "expanded")
          : ("compact" as const),
      validAt: typeof obj.validAt === "string" ? obj.validAt : undefined,
      knownAt: typeof obj.knownAt === "string" ? obj.knownAt : undefined,
    };
  });

  const evaluatedAt =
    typeof payload.evaluatedAt === "string" ? payload.evaluatedAt : undefined;
  const validAt =
    typeof payload.validAt === "string" ? payload.validAt : undefined;
  const knownAt =
    typeof payload.knownAt === "string" ? payload.knownAt : undefined;

  const batchResult = evaluateMachineEngineBatch({
    items: normalizedItems,
    evaluatedAt,
    validAt,
    knownAt,
  });

  return buildMachineJsonResponse(batchResult, {
    cacheControl: "no-store",
  });
}
