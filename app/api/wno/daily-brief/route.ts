import { NextRequest, NextResponse } from "next/server";
import { localHour, sendDailyBriefs, listActiveSubscribers } from "@/lib/wno/dailyBrief";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Rate limit: at most one forced send per 10 minutes
let lastForcedSendAt = 0;
const FORCE_COOLDOWN_MS = 10 * 60 * 1000;

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  return authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";
  const dryRun = url.searchParams.get("dry_run") === "true";

  // All send/query operations require CRON_SECRET authentication.
  // Vercel cron automatically sends Authorization: Bearer <CRON_SECRET>.
  if (!isAuthorized(request)) {
    // Unauthenticated callers only get the safe skip/status response
    const hour = localHour();
    return NextResponse.json({ ok: true, skipped: true, reason: "unauthorized_or_outside_window", localHour: hour }, { status: 401 });
  }

  // Dry-run: list current subscribers without sending anything
  if (dryRun) {
    try {
      const subscribers = await listActiveSubscribers();
      console.info("WNO daily brief dry_run", { subscriberCount: subscribers.length });
      return NextResponse.json({
        ok: true,
        dryRun: true,
        subscriberCount: subscribers.length,
        subscribers: subscribers.map((s) => ({
          email: s.email.replace(/(.{2}).*(@.*)/, "$1***$2"),
          signupSource: s.signupSource,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_dry_run_error";
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
  }

  // Normal cron path: only send at 7 AM Central, unless force=true
  const hour = localHour();
  if (!force && hour !== 7) {
    return NextResponse.json({ ok: true, skipped: true, reason: "outside_7am_local_window", localHour: hour });
  }

  // Rate limit forced sends
  if (force) {
    const now = Date.now();
    if (now - lastForcedSendAt < FORCE_COOLDOWN_MS) {
      const retryAfterSec = Math.ceil((FORCE_COOLDOWN_MS - (now - lastForcedSendAt)) / 1000);
      console.warn("WNO daily brief force rate-limited", { retryAfterSec });
      return NextResponse.json(
        { ok: false, error: "rate_limited", retryAfterSec },
        { status: 429 },
      );
    }
    lastForcedSendAt = now;
  }

  try {
    const result = await sendDailyBriefs();
    console.info("WNO daily brief completed", { forced: force, ...result });
    return NextResponse.json({ ok: true, forced: force, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_daily_brief_error";
    console.error("WNO daily brief failed", { message, forced: force });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

