import { NextResponse } from "next/server";
import { getDb, ensureDbTables } from "../../../../lib/db";
import { CURATED_SWAMP_CATALOG } from "../../../../lib/providerAdapter";

export const dynamic = "force-dynamic";

/**
 * Diagnostic Health Endpoint: Inspects provider connections, database status,
 * and waitlist queue metrics without exposing secrets.
 */
export async function GET() {
  const sql = getDb();
  let dbStatus = "disconnected";
  let activeWaitlistCount = 0;
  let notificationsCount = 0;

  if (sql) {
    try {
      await ensureDbTables();
      const activeRows = await sql`
        SELECT count(*)::int as c 
        FROM wts_waitlist_submissions 
        WHERE status = 'enrolled' AND expires_at > now();
      `;
      activeWaitlistCount = activeRows[0]?.c || 0;

      const notifRows = await sql`
        SELECT count(*)::int as c 
        FROM wts_waitlist_notifications;
      `;
      notificationsCount = notifRows[0]?.c || 0;
      dbStatus = "connected";
    } catch {
      dbStatus = "table_error";
    }
  }

  const viatorKey = (process.env.VIATOR_API_KEY || "").trim();
  const viatorConfigured =
    Boolean(viatorKey) && viatorKey.length > 20 && !viatorKey.includes("[SENSITIVE]");

  const resendKey = (process.env.RESEND_API_KEY || "").trim();
  const emailConfigured =
    Boolean(resendKey) && resendKey.length > 20 && !resendKey.includes("[SENSITIVE]");

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      activeWaitlistSubmissions: activeWaitlistCount,
      totalNotificationsRecorded: notificationsCount,
    },
    providers: {
      viator: {
        configured: viatorConfigured,
        liveHandshakeReady: viatorConfigured,
        status: viatorConfigured ? "authenticated" : "unauthenticated_catalog_mode",
      },
      directOperators: {
        status: "active",
        catalogToursCount: CURATED_SWAMP_CATALOG.length,
        scheduleMode: "local_new_orleans_cutoffs",
      },
      emailAlerts: {
        configured: emailConfigured,
        channel: emailConfigured ? "resend_api" : "simulated_durable_log",
      },
    },
  });
}
