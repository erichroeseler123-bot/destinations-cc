import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getActiveSignals,
  getLiveCityBundle,
  getLiveCityRegistryEntry,
  isLiveCityKey,
} from "@/lib/dcc/liveCity";

export const runtime = "nodejs";

const ParamsSchema = z.object({
  city: z.string(),
});

export async function GET(
  _request: Request,
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

  const registry = getLiveCityRegistryEntry(city);
  const bundle = getLiveCityBundle(city);
  const activeSignals = getActiveSignals(city);

  return NextResponse.json(
    {
      ok: true,
      city,
      registry,
      freshness: {
        anchors: { as_of: bundle.anchors.as_of, stale_after: bundle.anchors.stale_after, ttl_seconds: bundle.anchors.ttl_seconds },
        districts: { as_of: bundle.districts.as_of, stale_after: bundle.districts.stale_after, ttl_seconds: bundle.districts.ttl_seconds },
        venues: { as_of: bundle.venues.as_of, stale_after: bundle.venues.stale_after, ttl_seconds: bundle.venues.ttl_seconds },
        places: { as_of: bundle.places.as_of, stale_after: bundle.places.stale_after, ttl_seconds: bundle.places.ttl_seconds },
        events: { as_of: bundle.events.as_of, stale_after: bundle.events.stale_after, ttl_seconds: bundle.events.ttl_seconds },
        signals: { as_of: bundle.signals.as_of, stale_after: bundle.signals.stale_after, ttl_seconds: bundle.signals.ttl_seconds },
      },
      counts: {
        anchors: bundle.anchors.anchors.length,
        districts: bundle.districts.districts.length,
        venues: bundle.venues.venues.length,
        places: bundle.places.places.length,
        events: bundle.events.events.length,
        signals: bundle.signals.signals.length,
        active_signals: activeSignals.length,
      },
      bundle,
    },
    { status: 200 }
  );
}
