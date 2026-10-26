import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  getMachineChangesSince,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const url = new URL(request.url);
  const sinceRaw = url.searchParams.get("since");
  const limitRaw = url.searchParams.get("limit");

  const sinceCursor =
    sinceRaw && !Number.isNaN(Number(sinceRaw))
      ? Math.max(0, Math.floor(Number(sinceRaw)))
      : 0;
  const limit =
    limitRaw && !Number.isNaN(Number(limitRaw))
      ? Math.min(500, Math.max(1, Math.floor(Number(limitRaw))))
      : 100;

  const feed = getMachineChangesSince(sinceCursor, limit);

  return buildMachineJsonResponse(
    {
      ok: true,
      ...feed,
    },
    {
      cacheControl: "no-store",
    },
  );
}
