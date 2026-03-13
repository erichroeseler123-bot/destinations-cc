import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getActiveSignals,
  getLiveCityBundle,
  getSignalsForDistrict,
  getSignalsNearAnchor,
  isLiveCityKey,
} from "@/lib/dcc/liveCity";

export const runtime = "nodejs";

const QuerySchema = z.object({
  active_only: z.enum(["0", "1", "true", "false"]).optional(),
  anchor: z.string().optional(),
  district: z.string().optional(),
  status: z.enum(["active", "scheduled", "expired", "suppressed"]).optional(),
});

const ParamsSchema = z.object({
  city: z.string(),
});

export async function GET(
  request: Request,
  context: { params: Promise<unknown> }
) {
  const parsedParams = ParamsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_params",
        details: parsedParams.error.flatten(),
      },
      { status: 400 }
    );
  }
  const { city } = parsedParams.data;

  if (!isLiveCityKey(city)) {
    return NextResponse.json(
      {
        ok: false,
        error: "city_not_found",
        message: `Unknown live city "${city}".`,
      },
      { status: 404 }
    );
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    active_only: url.searchParams.get("active_only") || undefined,
    anchor: url.searchParams.get("anchor") || undefined,
    district: url.searchParams.get("district") || undefined,
    status: url.searchParams.get("status") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_query",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const bundle = getLiveCityBundle(city);
  let signals = bundle.signals.signals;

  if (parsed.data.anchor) {
    signals = getSignalsNearAnchor(city, parsed.data.anchor);
  }

  if (parsed.data.district) {
    const districtSignals = getSignalsForDistrict(city, parsed.data.district);
    signals =
      parsed.data.anchor ?
        signals.filter((signal) => districtSignals.some((candidate) => candidate.id === signal.id))
      : districtSignals;
  }

  if (parsed.data.active_only === "1" || parsed.data.active_only === "true") {
    const active = new Set(getActiveSignals(city).map((signal) => signal.id));
    signals = signals.filter((signal) => active.has(signal.id));
  }

  if (parsed.data.status) {
    signals = signals.filter((signal) => signal.status === parsed.data.status);
  }

  return NextResponse.json(
    {
      ok: true,
      city,
      count: signals.length,
      filters: parsed.data,
      freshness: {
        as_of: bundle.signals.as_of,
        stale_after: bundle.signals.stale_after,
        ttl_seconds: bundle.signals.ttl_seconds,
      },
      signals,
    },
    { status: 200 }
  );
}
