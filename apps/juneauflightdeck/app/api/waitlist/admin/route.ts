import { NextResponse } from "next/server";
import {
  getAllWaitlistEntries,
  execute10AmDailySweep,
  updateWaitlistStatus,
  type WaitlistEntry,
} from "../../../../lib/waitlistStore";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization")?.trim();
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token")?.trim();

  const validSecrets = [
    process.env.CRON_SECRET,
    process.env.ADMIN_SECRET,
    process.env.JFD_ADMIN_KEY,
    process.env.INTERNAL_API_SECRET,
  ]
    .filter(Boolean)
    .map((s) => String(s).trim());

  if (validSecrets.length === 0) {
    // If no secret configured in dev mode, allow localhost; otherwise reject in production
    if (process.env.NODE_ENV !== "production") {
      return true;
    }
    return false;
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (validSecrets.includes(token)) return true;
  }

  if (queryToken && validSecrets.includes(queryToken)) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized access. Valid Bearer token required." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    // Handle automated Vercel Cron sweep or manual GET trigger
    if (action === "sweep" || action === "run_sweep") {
      const sweepResult = await execute10AmDailySweep();
      return NextResponse.json({
        ok: true,
        message: `10:00 AM sweep completed for ${sweepResult.totalDatesSwept} active watch dates.`,
        sweepResult,
      });
    }

    const entries: WaitlistEntry[] = await getAllWaitlistEntries();
    const activeEntries = entries.filter((e: WaitlistEntry) => e.status === "active_scanning");
    const alertedEntries = entries.filter(
      (e: WaitlistEntry) => e.status === "contact_pending" || e.status === "opening_detected" || e.status === "held"
    );
    const confirmedEntries = entries.filter((e: WaitlistEntry) => e.status === "booking_confirmed");

    const uniqueDates = Array.from(new Set(activeEntries.map((e: WaitlistEntry) => e.portDate))).sort();

    const totalPotentialValue = entries.reduce((acc: number, curr: WaitlistEntry) => {
      const perSeat = curr.tourType === "dog_sledding" ? 649 : curr.tourType === "ice_trek" ? 599 : 449;
      return acc + (curr.estimatedValue || curr.partySize * perSeat);
    }, 0);

    const estimatedCommission = Math.round(totalPotentialValue * 0.18); // ~18% agent commission

    return NextResponse.json({
      ok: true,
      metrics: {
        totalWatches: entries.length,
        activeScanning: activeEntries.length,
        contactPending: alertedEntries.length,
        confirmedBookings: confirmedEntries.length,
        uniqueWatchDates: uniqueDates.length,
        totalPotentialValue,
        estimatedCommission,
      },
      activeDates: uniqueDates,
      entries,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to process admin request" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized access. Valid Bearer token required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    if (action === "run_sweep") {
      const sweepResult = await execute10AmDailySweep();
      return NextResponse.json({
        ok: true,
        message: `10:00 AM sweep completed for ${sweepResult.totalDatesSwept} active watch dates.`,
        sweepResult,
      });
    }

    if (action === "update_status") {
      const { id, status, matchedOperator, matchedSlotTime, fareharborCheckoutUrl } = body;
      const updated = await updateWaitlistStatus(id, status, {
        matchedOperator,
        matchedSlotTime,
        fareharborCheckoutUrl,
      });

      if (!updated) {
        return NextResponse.json({ ok: false, error: "Entry not found" }, { status: 404 });
      }

      return NextResponse.json({ ok: true, entry: updated });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Action failed" }, { status: 500 });
  }
}
