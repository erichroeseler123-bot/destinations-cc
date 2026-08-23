import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ ok: true, site: "french-quarter-orientation", schema_version: "2026-08-23" }); }
