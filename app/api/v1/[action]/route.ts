import { buildMachineJsonResponse } from "@/lib/dcc/machine";
import { POST as handleEvaluationsBatch } from "../evaluations-batch/route";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params;
  const decoded = decodeURIComponent(action);

  if (decoded === "evaluations:batch" || action === "evaluations:batch") {
    return handleEvaluationsBatch(request);
  }

  return buildMachineJsonResponse(
    {
      ok: false,
      error: {
        code: "UNKNOWN_V1_ACTION",
        message: `Unknown /api/v1 action "${decoded}". Supported batch action: /api/v1/evaluations:batch`,
      },
    },
    { status: 404, cacheControl: "no-store" },
  );
}
