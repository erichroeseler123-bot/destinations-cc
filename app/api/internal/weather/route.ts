import { NextRequest, NextResponse } from "next/server";
import { resolveCentralizedWeatherSummary } from "@/lib/dcc/weatherGateway";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const label = searchParams.get("label") || "Today";
  const timezone = searchParams.get("tz") || searchParams.get("timezone") || null;

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const summary = await resolveCentralizedWeatherSummary({
      lat,
      lng,
      timezone,
      label,
    });

    return NextResponse.json(
      {
        label: summary.label,
        dataMode: summary.dataMode,
        isCurrentConditions: summary.isCurrentConditions,
        freshnessStatus: summary.freshnessStatus,
        freshnessLabel: summary.freshnessLabel,
        provider: summary.provider,
        attribution: summary.attribution,
        observedAt: summary.observedAt,
        checkedAt: summary.checkedAt,
        // Strictly null whenever serving seasonal climatology so callers can never confuse it with live temp
        temperatureF: summary.isCurrentConditions || summary.dataMode === "cached_snapshot"
          ? summary.temperatureF
          : null,
        windMph: summary.windMph,
        condition: summary.condition,
        rainChance: summary.rainChance ?? 0,
        icon: summary.icon,
        advisory: summary.advisory,
        climatology: summary.climatology,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
  }
}
