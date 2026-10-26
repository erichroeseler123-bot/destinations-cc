import { NextResponse } from "next/server";
import {
  listDecisionEngines,
  NEXT_DCC_CATEGORY_ONBOARDING_RANKING,
  PHASE_1_REFERENCE_IMPLEMENTATION_AUDIT,
  serializeDecisionEngineSummary,
} from "@/lib/dcc/decisionEngines/registry";

export async function GET() {
  const engines = listDecisionEngines().map(serializeDecisionEngineSummary);
  return NextResponse.json(
    {
      ok: true,
      frameworkVersion: "1.0.0",
      governingModel:
        "Destination Command Center reusable category decision engine framework (hard constraints first, zero-commercial-weight preference ranking, explicit unknown/stale qualification).",
      registeredCount: engines.length,
      engines,
      nextCategoryOnboardingQueue: NEXT_DCC_CATEGORY_ONBOARDING_RANKING,
      referenceImplementationAudit: PHASE_1_REFERENCE_IMPLEMENTATION_AUDIT,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600",
      },
    },
  );
}
