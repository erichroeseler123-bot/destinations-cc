import { NextResponse } from "next/server";
import { searchTourFinder, type TourFinderSearchRequest } from "@/lib/tourFinder";

export const dynamic = "force-dynamic";

function isValidDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export async function POST(request: Request) {
  let body: TourFinderSearchRequest | null = null;

  try {
    body = (await request.json()) as TourFinderSearchRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body?.destination?.trim()) {
    return NextResponse.json({ ok: false, error: "missing_destination" }, { status: 400 });
  }

  if (!isValidDate(body.startDate)) {
    return NextResponse.json({ ok: false, error: "invalid_start_date" }, { status: 400 });
  }

  if (body.endDate && !isValidDate(body.endDate)) {
    return NextResponse.json({ ok: false, error: "invalid_end_date" }, { status: 400 });
  }

  const result = await searchTourFinder(body);

  return NextResponse.json({
    ok: true,
    destination: result.destination,
    results: result.results,
  });
}
