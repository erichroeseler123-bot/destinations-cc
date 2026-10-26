import { NextResponse } from "next/server";
import { DecisionEngineInputValidationError } from "@/lib/dcc/decisionEngines/evaluator";
import {
  getDecisionEngineById,
  listDecisionEngines,
} from "@/lib/dcc/decisionEngines/registry";

function coerceQuerySearchParamsToInput(
  url: URL,
  questionTypes: Map<string, "select" | "date" | "number" | "boolean" | "time">,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, rawValue] of url.searchParams.entries()) {
    const qType = questionTypes.get(key);
    if (rawValue === "null" || rawValue === "") {
      output[key] = null;
      continue;
    }
    if (qType === "number" || (!qType && /^-?\d+(\.\d+)?$/.test(rawValue))) {
      const parsed = Number(rawValue);
      output[key] = Number.isNaN(parsed) ? rawValue : parsed;
      continue;
    }
    if (qType === "boolean" || rawValue === "true" || rawValue === "false") {
      if (rawValue === "true") {
        output[key] = true;
      } else if (rawValue === "false") {
        output[key] = false;
      } else {
        output[key] = rawValue;
      }
      continue;
    }
    output[key] = rawValue;
  }
  return output;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ engineId: string }> },
) {
  const resolvedParams = await Promise.resolve(context.params);
  const engine = getDecisionEngineById(resolvedParams.engineId);

  if (!engine) {
    return NextResponse.json(
      {
        ok: false,
        error: "unknown_decision_engine",
        message: `No DCC category decision engine found for "${resolvedParams.engineId}".`,
        availableEngineIds: listDecisionEngines().map((item) => item.engineId),
      },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const questionTypes = new Map(
    engine.questions.map((q) => [q.questionId, q.inputType]),
  );
  const rawInput = coerceQuerySearchParamsToInput(
    new URL(request.url),
    questionTypes,
  );

  try {
    const result = engine.evaluate(rawInput);
    return NextResponse.json(
      {
        ok: true,
        result,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": result.evidenceHealth.recommendedCacheControl,
        },
      },
    );
  } catch (err) {
    if (err instanceof DecisionEngineInputValidationError) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_decision_engine_input",
          engineId: engine.engineId,
          issues: err.issues,
          message: err.message,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "evaluation_error",
        message: err instanceof Error ? err.message : "Unexpected error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ engineId: string }> },
) {
  const resolvedParams = await Promise.resolve(context.params);
  const engine = getDecisionEngineById(resolvedParams.engineId);

  if (!engine) {
    return NextResponse.json(
      {
        ok: false,
        error: "unknown_decision_engine",
        message: `No DCC category decision engine found for "${resolvedParams.engineId}".`,
        availableEngineIds: listDecisionEngines().map((item) => item.engineId),
      },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    const text = await request.text();
    body = text.trim().length === 0 ? {} : JSON.parse(text);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_json_body",
        message: "Request body must be valid JSON.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_decision_engine_input",
        message: "Request JSON body must be an object containing question answers.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rawBody = body as Record<string, unknown>;
  const rawAnswers =
    "answers" in rawBody &&
    typeof rawBody.answers === "object" &&
    rawBody.answers !== null &&
    !Array.isArray(rawBody.answers)
      ? rawBody.answers
      : rawBody;

  try {
    const result = engine.evaluate(rawAnswers);
    return NextResponse.json(
      {
        ok: true,
        result,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": result.evidenceHealth.recommendedCacheControl,
        },
      },
    );
  } catch (err) {
    if (err instanceof DecisionEngineInputValidationError) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_decision_engine_input",
          engineId: engine.engineId,
          issues: err.issues,
          message: err.message,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "evaluation_error",
        message: err instanceof Error ? err.message : "Unexpected error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
