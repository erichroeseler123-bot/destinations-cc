import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "last-frontier-shore-excursions",
    canonicalHost: "lastfrontiershoreexcursions.com",
  });
}
