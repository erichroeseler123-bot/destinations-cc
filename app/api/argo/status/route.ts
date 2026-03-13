export async function GET() {
  // TODO: replace with your real dcc-router URL once deployed
  const ROUTER_URL = process.env.DCC_ROUTER_URL?.trim();

  // If router isn't set yet, return a safe stub so the UI works.
  if (!ROUTER_URL) {
    return Response.json({
      ok: true,
      source: "stub",
      departures: ["09:00", "11:00", "13:00", "15:00"],
      risk: "Low",
      note: "Set DCC_ROUTER_URL to use live data.",
    });
  }

  const upstream = await fetch(`${ROUTER_URL}/argo/status`, {
    headers: { "accept": "application/json" },
    cache: "no-store",
  });

  const data = await upstream.json();
  return Response.json(data, { status: upstream.status });
}
