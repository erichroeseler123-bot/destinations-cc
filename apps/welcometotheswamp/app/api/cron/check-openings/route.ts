import { NextResponse } from "next/server";
import {
  expireOutdatedWaitlistSubmissions,
  getActiveWaitlistSubmissions,
  hasBeenNotified,
  hasBeenNotifiedForDate,
} from "../../../../lib/db";
import { evaluateDepartureMatch } from "../../../../lib/alertMatcher";
import { dispatchWaitlistAlert } from "../../../../lib/alertDispatcher";
import { searchNextAirboatDepartures } from "../../../../lib/searchEngine";

export const dynamic = "force-dynamic";

/**
 * Automated Cron Job: Sweeps active waitlist submissions, matches against open departures,
 * sends de-duplicated notifications, and auto-expires past travel dates.
 */
export async function GET(request: Request) {
  try {
    // 1. Authorization check
    const authHeader = request.headers.get("authorization");
    const cronSecret = (process.env.CRON_SECRET || "").trim();
    const isVercelCron = Boolean(request.headers.get("x-vercel-cron"));

    if (cronSecret && !isVercelCron) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Expire past travel dates
    const expiredCount = await expireOutdatedWaitlistSubmissions();

    // 3. Fetch active submissions
    const activeSubmissions = await getActiveWaitlistSubmissions();
    if (activeSubmissions.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No active waitlist submissions to evaluate.",
        expiredCount,
        evaluatedCount: 0,
        alertsSent: 0,
      });
    }

    // 4. Group by travel date to minimize redundant searches
    const dateGroups = new Map<string, typeof activeSubmissions>();
    for (const sub of activeSubmissions) {
      const list = dateGroups.get(sub.travelDate) || [];
      list.push(sub);
      dateGroups.set(sub.travelDate, list);
    }

    let alertsSent = 0;
    const dispatchedList: Array<{ submissionId: string; departureId: string; email: string }> = [];

    // 5. Evaluate each travel date
    for (const [travelDate, submissions] of dateGroups.entries()) {
      // Find candidate departures for this date
      const searchRes = await searchNextAirboatDepartures({
        travelDate,
        adults: 2, // baseline
        childrenAges: [],
        transportation: "either",
        boatType: "any",
      });

      if (!searchRes.allDepartures || searchRes.allDepartures.length === 0) {
        continue;
      }

      // Check each submission against departures
      for (const sub of submissions) {
        // Strict deduplication: If subscriber was already alerted for this requested date, skip
        const alreadyNotifiedForDate = await hasBeenNotifiedForDate(sub.id, travelDate);
        if (alreadyNotifiedForDate) {
          continue;
        }

        for (const dep of searchRes.allDepartures) {
          const matchResult = evaluateDepartureMatch(sub, dep);
          if (matchResult.matches) {
            const dispatchResult = await dispatchWaitlistAlert(sub, dep);
            if (dispatchResult.sent) {
              alertsSent++;
              dispatchedList.push({
                submissionId: sub.id,
                departureId: dep.id,
                email: sub.email,
              });
              // Send only the earliest match per subscriber
              break;
            }
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      expiredCount,
      evaluatedCount: activeSubmissions.length,
      alertsSent,
      dispatched: dispatchedList,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Waitlist sweep failed" },
      { status: 500 }
    );
  }
}
