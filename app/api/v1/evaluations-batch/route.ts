import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  evaluateMachineEngineBatch,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  let body: unknown;
  try {
    body = await request.json();
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
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "EMPTY_BATCH_ITEMS",
          message: "Field 'items' must be a non-empty array of evaluation requests.",
        },
      },
      { status: 400, cacheControl: "no-store" },
    );
  }

  if (payload.items.length > 250) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "BATCH_SIZE_EXCEEDED",
          message: "Batch evaluation supports up to 250 items per request.",
        },
      },
      { status: 400, cacheControl: "no-store" },
    );
  }

  const normalizedItems = payload.items.map((raw, idx) => {
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
    };
  });

  const evaluatedAt =
    typeof payload.evaluatedAt === "string" ? payload.evaluatedAt : undefined;

  const batchResult = evaluateMachineEngineBatch({
    items: normalizedItems,
    evaluatedAt,
  });

  return buildMachineJsonResponse(batchResult, {
    cacheControl: "no-store",
  });
}
