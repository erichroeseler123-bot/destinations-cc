import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runWatches } from "@/lib/helicopter-watch/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;
export async function GET(request: Request) {
  const key = process.env.CRON_SECRET?.trim(), supplied = Buffer.from(request.headers.get("authorization") || ""), expected = Buffer.from(`Bearer ${key || ""}`);
  if (!key || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ ok: true, ...await runWatches() }); } catch { return NextResponse.json({ error: "Watch infrastructure unavailable; saved requests retained." }, { status: 503 }); }
}
