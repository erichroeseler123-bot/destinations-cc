import { NextResponse } from "next/server";
import {
  getDecisionEngineById,
  listDecisionEngines,
  serializeDecisionEngineFullDefinition,
} from "@/lib/dcc/decisionEngines/registry";

export async function GET(
  _request: Request,
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
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const payload = serializeDecisionEngineFullDefinition(engine);
  const cacheControl =
    payload.defaultExampleEvaluation.evidenceHealth.recommendedCacheControl;

  return NextResponse.json(
    {
      ok: true,
      engine: payload,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": cacheControl,
      },
    },
  );
}
