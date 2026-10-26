import {
  buildReferenceHttpResponse,
  resolveMachineReference,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resolved = resolveMachineReference(id);
  return buildReferenceHttpResponse(request, resolved, false);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resolved = resolveMachineReference(id);
  return buildReferenceHttpResponse(request, resolved, true);
}
