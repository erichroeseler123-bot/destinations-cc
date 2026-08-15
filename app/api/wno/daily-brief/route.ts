import { NextResponse } from "next/server";
import { localHour, sendDailyBriefs } from "@/lib/wno/dailyBrief";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const hour = localHour();
  if (hour !== 7) {
    return NextResponse.json({ ok: true, skipped: true, reason: "outside_7am_local_window", localHour: hour });
  }

  try {
    const result = await sendDailyBriefs();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_daily_brief_error";
    console.error("WNO daily brief failed", { message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
