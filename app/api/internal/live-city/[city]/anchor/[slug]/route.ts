import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getLiveCityAnchor,
  getLiveCityBundle,
  getSignalsNearAnchor,
  isLiveCityKey,
} from "@/lib/dcc/liveCity";

export const runtime = "nodejs";

const ParamsSchema = z.object({
  city: z.string(),
  slug: z.string(),
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
  const { city, slug } = parsedParams.data;

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

  const anchor = getLiveCityAnchor(city, slug);
  if (!anchor) {
    return NextResponse.json(
      {
        ok: false,
        error: "anchor_not_found",
        message: `Unknown anchor "${slug}" for city "${city}".`,
      },
      { status: 404 }
    );
  }

  const bundle = getLiveCityBundle(city);
  const districts = bundle.districts.districts.filter((district) => anchor.district_slugs.includes(district.slug));
  const venues = bundle.venues.venues.filter((venue) => anchor.nearby_venue_slugs.includes(venue.slug));
  const places = bundle.places.places.filter((place) => anchor.nearby_place_slugs.includes(place.slug));
  const signals = getSignalsNearAnchor(city, slug);

  return NextResponse.json(
    {
      ok: true,
      city,
      anchor,
      districts,
      venues,
      places,
      signals,
      freshness: {
        anchors: { as_of: bundle.anchors.as_of, stale_after: bundle.anchors.stale_after },
        signals: { as_of: bundle.signals.as_of, stale_after: bundle.signals.stale_after },
      },
    },
    { status: 200 }
  );
}
