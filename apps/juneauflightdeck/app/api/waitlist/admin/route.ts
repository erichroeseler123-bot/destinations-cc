import { NextResponse } from "next/server";
import {
  getAllWaitlistEntries,
  execute10AmDailySweep,
  updateWaitlistStatus,
  purgeTestWaitlistEntries,
  type WaitlistEntry,
} from "../../../../lib/waitlistStore";
import {
  fetchFareHarborDateRangeDetailed,
  OPERATOR_ENDPOINTS,
} from "../../../../lib/fareharborRange";

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

function getAlaskaLocalHour(): number {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Juneau",
      hour: "numeric",
      hour12: false,
    }).format(new Date());
    return parseInt(formatted, 10);
  } catch {
    return (new Date().getUTCHours() - 8 + 24) % 24;
  }
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

    // 1. Live Operator Inventory Diagnostic Pre-Flight Check
    if (action === "diagnose_fareharbor") {
      const results = [];
      // Use upcoming summer 2027 cruise season dates for schedule inspection
      const testStart = url.searchParams.get("start") || "2027-07-01";
      const testEnd = url.searchParams.get("end") || "2027-07-14";

      const targets = [
        { operator: "TEMSCO Helicopters (Juneau)", shortname: OPERATOR_ENDPOINTS.temsco_juneau.shortname, itemPk: OPERATOR_ENDPOINTS.temsco_juneau.items.glacier_landing, itemName: "Mendenhall Glacier and Guided Walk" },
        { operator: "TEMSCO Helicopters (Skagway)", shortname: OPERATOR_ENDPOINTS.temsco_skagway.shortname, itemPk: OPERATOR_ENDPOINTS.temsco_skagway.items.glacier_landing, itemName: "Meade Glacier Landing" },
        { operator: "Coastal Helicopters", shortname: OPERATOR_ENDPOINTS.coastal.shortname, itemPk: OPERATOR_ENDPOINTS.coastal.items.icefield, itemName: "Icefield Excursion" },
        { operator: "NorthStar Trekking", shortname: OPERATOR_ENDPOINTS.northstar.shortname, itemPk: OPERATOR_ENDPOINTS.northstar.items.ice_trek, itemName: "Helicopter Glacier Trek" },
      ];

      for (const target of targets) {
        const fetchRes = await fetchFareHarborDateRangeDetailed({
          companyShortname: target.shortname,
          itemPk: target.itemPk,
          startDate: testStart,
          endDate: testEnd,
        });

        results.push({
          operator: target.operator,
          shortname: target.shortname,
          itemPk: target.itemPk,
          itemName: target.itemName,
          status: fetchRes.success ? "success" : "access_error",
          httpStatus: fetchRes.httpStatus || (fetchRes.success ? 200 : 500),
          error: fetchRes.error || null,
          openSlotsFound: fetchRes.availabilities.length,
          queryWindow: `${testStart} to ${testEnd}`,
        });
      }

      const allSuccess = results.every((r) => r.status === "success");

      return NextResponse.json({
        ok: true,
        allOperatorsConnected: allSuccess,
        timestamp: new Date().toISOString(),
        operators: results,
      });
    }

    // 2. Resend Live Email Delivery Verification
    if (action === "verify_email") {
      const resendApiKey = process.env.RESEND_API_KEY || process.env.DCC_RESEND_API_KEY;
      const isKeyPresent = Boolean(
        resendApiKey && resendApiKey.startsWith("re_") && resendApiKey.length > 20
      );
      const to = url.searchParams.get("to") || process.env.DEPLOY_TEST_EMAIL_TO || "erichroeseler123@gmail.com";
      const from = process.env.DEPLOY_TEST_EMAIL_FROM || "alerts@juneauflightdeck.com";

      if (!isKeyPresent) {
        return NextResponse.json(
          {
            ok: false,
            configured: false,
            error: "RESEND_API_KEY not configured on Vercel environment.",
          },
          { status: 400 }
        );
      }

      try {
        const { Resend } = await import("resend");
        const resend = new Resend(resendApiKey);
        const result = await resend.emails.send({
          from,
          to,
          subject: `[Juneau Flight Deck] Live Provider Verification - ${new Date().toISOString()}`,
          html: `
            <div style="font-family: sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-top: 0;">Juneau Flight Deck Notification Service</h2>
              <p style="color: #334155; font-size: 15px;">This email verifies that the Resend email delivery pipeline is active and accepting requests for <strong>juneauflightdeck.com</strong>.</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
                <tr><td style="padding: 8px 0; color: #64748b;">Dispatched At:</td><td style="font-family: monospace;">${new Date().toISOString()}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Sender:</td><td style="font-family: monospace;">${from}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Recipient:</td><td style="font-family: monospace;">${to}</td></tr>
              </table>
            </div>
          `,
          text: `Juneau Flight Deck delivery pipeline verified. Sent to ${to} from ${from} at ${new Date().toISOString()}.`,
        });

        if (result.error) {
          return NextResponse.json(
            {
              ok: false,
              configured: true,
              provider: "resend",
              error: result.error,
            },
            { status: 502 }
          );
        }

        return NextResponse.json({
          ok: true,
          configured: true,
          provider: "resend",
          providerMessageId: result.data?.id,
          from,
          to,
          dispatchedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        return NextResponse.json(
          {
            ok: false,
            configured: true,
            provider: "resend",
            error: err?.message || String(err),
          },
          { status: 500 }
        );
      }
    }

    // 3. Purge marked test entries from database
    if (action === "purge_tests") {
      const purgeResult = await purgeTestWaitlistEntries();
      return NextResponse.json({
        ok: true,
        message: `Purged ${purgeResult.deletedSubmissions} test submissions and ${purgeResult.deletedNotifications} test notifications.`,
        purgeResult,
      });
    }

    // 4. Handle automated Vercel Cron sweep or manual GET trigger
    if (action === "sweep" || action === "run_sweep") {
      const force = url.searchParams.get("force") === "true";
      const includeTest = url.searchParams.get("include_test") === "true";
      const testMatch = url.searchParams.get("test_match") === "true";
      const alaskaHour = getAlaskaLocalHour();

      // Enforce 10:00 AM Alaska local time year-round (handles AKDT UTC-8 in summer and AKST UTC-9 in winter)
      if (!force && alaskaHour !== 10) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          message: `Sweep skipped: Current Alaska local hour is ${alaskaHour}:00 (not 10:00 AM). Year-round daylight saving guard active.`,
          alaskaHour,
        });
      }

      const sweepResult = await execute10AmDailySweep({
        includeTests: includeTest || testMatch,
        testMatch,
      });
      return NextResponse.json({
        ok: true,
        message: `Sweep completed for ${sweepResult.totalDatesSwept} active watch dates. Openings: ${sweepResult.openingsFound}, Access Failures: ${sweepResult.accessFailuresCount}.`,
        sweepResult,
      });
    }

    const allEntries: WaitlistEntry[] = await getAllWaitlistEntries();
    const productionEntries = allEntries.filter((e: WaitlistEntry) => !e.isTest && e.status !== "test_excluded");
    const testEntries = allEntries.filter((e: WaitlistEntry) => Boolean(e.isTest || e.status === "test_excluded"));

    const activeEntries = productionEntries.filter((e: WaitlistEntry) => e.status === "active_scanning");
    const alertedEntries = productionEntries.filter(
      (e: WaitlistEntry) => e.status === "contact_pending" || e.status === "opening_detected" || e.status === "held"
    );
    const confirmedEntries = productionEntries.filter((e: WaitlistEntry) => e.status === "booking_confirmed");

    const uniqueDates = Array.from(new Set(activeEntries.map((e: WaitlistEntry) => e.portDate))).sort();

    const totalPotentialValue = productionEntries.reduce((acc: number, curr: WaitlistEntry) => {
      const perSeat = curr.tourType === "dog_sledding" ? 649 : curr.tourType === "ice_trek" ? 599 : 449;
      return acc + (curr.estimatedValue || curr.partySize * perSeat);
    }, 0);

    const estimatedCommission = Math.round(totalPotentialValue * 0.18); // ~18% agent commission

    return NextResponse.json({
      ok: true,
      metrics: {
        totalWatches: productionEntries.length,
        activeScanning: activeEntries.length,
        contactPending: alertedEntries.length,
        confirmedBookings: confirmedEntries.length,
        uniqueWatchDates: uniqueDates.length,
        totalPotentialValue,
        estimatedCommission,
        testExcludedCount: testEntries.length,
      },
      activeDates: uniqueDates,
      entries: productionEntries,
      testEntries,
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
