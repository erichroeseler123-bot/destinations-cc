import { NextResponse } from "next/server";
import { sweepExpiredSignals } from "@/lib/dcc/livePulse/store";

export async function POST() {
  const result = sweepExpiredSignals(new Date());
  return NextResponse.json({ ok: true, ...result }, { status: 200 });
}
