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
    // A caller-supplied x-vercel-cron header is not authorization.
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Expire past travel dates (safe hygiene)
    const expiredCount = await expireOutdatedWaitlistSubmissions();

    // 3. HARD GATE: Monitoring requires authenticated live inventory AND active email delivery
    const viatorKey = (process.env.VIATOR_API_KEY || "").trim();
    const liveInventoryReady =
      Boolean(viatorKey) && viatorKey.length > 20 && !viatorKey.includes("[SENSITIVE]");

    const resendKey = (process.env.RESEND_API_KEY || "").trim();
    const emailDeliveryReady =
      Boolean(resendKey) && resendKey.length > 20 && !resendKey.includes("[SENSITIVE]");

    const monitoringActive = liveInventoryReady && emailDeliveryReady;

    if (!monitoringActive) {
      return NextResponse.json({
        ok: true,
        sweepActive: false,
        message:
          "Automated seat-opening sweep is gated off while live inventory credentials and email delivery are inactive. No matches were evaluated and no deduplication records were written.",
        expiredCount,
        evaluatedCount: 0,
        alertsSent: 0,
        prerequisites: {
          liveInventoryReady,
          emailDeliveryReady,
        },
      });
    }

    // 4. Fetch active submissions (only if monitoring prerequisites are active)
    const activeSubmissions = await getActiveWaitlistSubmissions();
    if (activeSubmissions.length === 0) {
      return NextResponse.json({
        ok: true,
        sweepActive: true,
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
    const dispatchedList: Array<{ submissionId: string; departureId: string }> = [];

    // 5. Evaluate each travel date
    for (const [travelDate, submissions] of dateGroups.entries()) {
      // Live capacity checks are party-specific. Reuse only identical searches.
      const cache = new Map<string, Awaited<ReturnType<typeof searchNextAirboatDepartures>>>();
      for (const sub of submissions) {
        const key = JSON.stringify([sub.adults, sub.childrenAges, sub.transportation, sub.boatType]);
        let searchRes = cache.get(key);
        if (!searchRes) {
          searchRes = await searchNextAirboatDepartures({ travelDate, adults: sub.adults, childrenAges: sub.childrenAges, transportation: sub.transportation, boatType: sub.boatType });
          cache.set(key, searchRes);
        }
        if (!searchRes.allDepartures?.length) continue;
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

