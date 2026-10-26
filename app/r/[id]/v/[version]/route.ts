import {
  buildReferenceHttpResponse,
  resolveMachineReference,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; version: string }> },
) {
  const { id, version } = await context.params;
  const resolved = resolveMachineReference(id, version);
  return buildReferenceHttpResponse(request, resolved, false);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ id: string; version: string }> },
) {
  const { id, version } = await context.params;
  const resolved = resolveMachineReference(id, version);
  return buildReferenceHttpResponse(request, resolved, true);
}
