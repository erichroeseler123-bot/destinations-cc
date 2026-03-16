import { NextRequest, NextResponse } from "next/server";

const WEATHER_CODE_MAP: Record<number, { label: string; icon: "sun" | "cloud" | "rain" | "storm" | "snow" | "fog" }> = {
  0: { label: "Clear", icon: "sun" },
  1: { label: "Mostly Clear", icon: "sun" },
  2: { label: "Partly Cloudy", icon: "cloud" },
  3: { label: "Overcast", icon: "cloud" },
  45: { label: "Fog", icon: "fog" },
  48: { label: "Fog", icon: "fog" },
  51: { label: "Light Drizzle", icon: "rain" },
  53: { label: "Drizzle", icon: "rain" },
  55: { label: "Heavy Drizzle", icon: "rain" },
  61: { label: "Light Rain", icon: "rain" },
  63: { label: "Rain", icon: "rain" },
  65: { label: "Heavy Rain", icon: "rain" },
  66: { label: "Freezing Rain", icon: "snow" },
  67: { label: "Freezing Rain", icon: "snow" },
  71: { label: "Light Snow", icon: "snow" },
  73: { label: "Snow", icon: "snow" },
  75: { label: "Heavy Snow", icon: "snow" },
  77: { label: "Snow Grains", icon: "snow" },
  80: { label: "Rain Showers", icon: "rain" },
  81: { label: "Showers", icon: "rain" },
  82: { label: "Heavy Showers", icon: "rain" },
  85: { label: "Snow Showers", icon: "snow" },
  86: { label: "Snow Showers", icon: "snow" },
  95: { label: "Thunderstorm", icon: "storm" },
  96: { label: "Thunderstorm", icon: "storm" },
  99: { label: "Severe Thunderstorm", icon: "storm" },
};

function advisoryForWeather(condition: string, rainChance: number) {
  if (condition.includes("Thunderstorm")) return "Weather may disrupt outdoor plans.";
  if (condition.includes("Snow")) return "Cold conditions may slow outdoor plans.";
  if (rainChance >= 60) return "Plan for wet conditions outdoors.";
  if (rainChance >= 35) return "Outdoor plans may need a rain backup.";
  if (condition.includes("Clear") || condition.includes("Partly")) return "Good conditions for outdoor activities.";
  return "Check conditions before longer outdoor plans.";
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const label = searchParams.get("label") || "Today";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(lat))}` +
      `&longitude=${encodeURIComponent(String(lng))}` +
      `&current=temperature_2m,weather_code` +
      `&daily=precipitation_probability_max` +
      `&forecast_days=1&timezone=auto`;

    const response = await fetch(url, {
      next: { revalidate: 900 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
    }

    const payload = await response.json();
    const weatherCode = Number(payload?.current?.weather_code ?? 0);
    const mapping = WEATHER_CODE_MAP[weatherCode] || { label: "Current Conditions", icon: "cloud" as const };
    const rainChance = Number(payload?.daily?.precipitation_probability_max?.[0] ?? 0);

    return NextResponse.json({
      label,
      temperatureF: Math.round((Number(payload?.current?.temperature_2m ?? 0) * 9) / 5 + 32),
      condition: mapping.label,
      rainChance,
      icon: mapping.icon,
      advisory: advisoryForWeather(mapping.label, rainChance),
    });
  } catch {
    return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
  }
}
