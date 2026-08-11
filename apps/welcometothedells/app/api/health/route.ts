import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "welcometothedells",
    canonicalHost: "welcometothedells.com",
  });
}
