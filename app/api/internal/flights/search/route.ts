import { NextResponse } from "next/server";
import { searchFlights } from "@/lib/dcc/internal/flightAction";

export const runtime = "nodejs";

function normalizeIata(raw: string | null): string {
  return String(raw || "")
    .trim()
    .toUpperCase();
}

function normalizeTravelClass(
  raw: string | null
): "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST" | undefined {
  const v = String(raw || "")
    .trim()
    .toUpperCase();
  if (v === "ECONOMY" || v === "PREMIUM_ECONOMY" || v === "BUSINESS" || v === "FIRST") {
    return v;
  }
  return undefined;
}

function asInt(raw: string | null, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function asNumber(raw: string | null): number | undefined {
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function csv(raw: string | null): string[] {
  return String(raw || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = normalizeIata(searchParams.get("origin"));
  const destination = normalizeIata(searchParams.get("destination"));
  const departureDate = String(searchParams.get("departureDate") || "").trim();
  const returnDate = String(searchParams.get("returnDate") || "").trim() || undefined;

  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      {
        error: "invalid_query",
        message: "origin, destination, and departureDate are required.",
      },
      { status: 400 }
    );
  }

  const payload = await searchFlights({
    origin,
    destination,
    departureDate,
    returnDate,
    adults: asInt(searchParams.get("adults"), 1),
    nonStop: String(searchParams.get("nonStop") || "").toLowerCase() === "true",
    currency: String(searchParams.get("currency") || "USD").toUpperCase(),
    max: asInt(searchParams.get("max"), 20),
    travelClass: normalizeTravelClass(searchParams.get("class")),
    flexibleDays: asInt(searchParams.get("flexible_days"), 0),
    priceMin: asNumber(searchParams.get("price_min")),
    priceMax: asNumber(searchParams.get("price_max")),
    airlineCodes: csv(searchParams.get("airline")),
  });

  return NextResponse.json(payload, { status: 200 });
}
