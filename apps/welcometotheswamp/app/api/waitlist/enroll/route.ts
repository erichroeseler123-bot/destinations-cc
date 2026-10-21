import { NextResponse } from "next/server";
import { saveWaitlistSubmission, getDb } from "../../../../lib/db";
import { getTodayNewOrleansDate } from "../../../../lib/timezone";
import { validateWaitlistRequest } from "../../../../lib/waitlistRequest";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ ok: false, error: "Please submit this request from our website." }, { status: 403 });
  let input;
  try {
    if (Number(request.headers.get("content-length") || 0) > 10000) throw new Error("Request is too large.");
    const raw = await request.text();
    if (raw.length > 10000) throw new Error("Request is too large.");
    input = validateWaitlistRequest(JSON.parse(raw), getTodayNewOrleansDate());
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof SyntaxError ? "Please complete the request form." : error instanceof Error ? error.message : "Invalid request." }, { status: 400 }); }
  try {
    const submission = await saveWaitlistSubmission(input);
    return NextResponse.json({ ok: true, submissionId: submission.id, unsubscribeUrl: `https://welcometotheswamp.com/api/waitlist/unsubscribe?token=${submission.unsubscribeToken}`, status: submission.status, message: "Your request is saved. Automated seat-opening alerts are not yet active.", details: { travelDate: submission.travelDate, partySize: submission.adults + submission.childrenCount, transportation: submission.transportation, boatType: submission.boatType, expiresAt: submission.expiresAt } }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ ok: false, error: "We couldn’t save your request right now. Please try again later or check departures directly." }, { status: 503 }); }
}

// Read-only readiness: do not create tables or expose queue/customer details.
export async function GET() {
  let requestStorageReady = false;
  try {
    const sql = getDb();
    if (sql) {
      const rows = await sql`SELECT to_regclass('public.wts_waitlist_submissions') IS NOT NULL AS ready`;
      requestStorageReady = rows[0]?.ready === true;
    }
  } catch { /* Report unavailable without exposing provider details. */ }
  return NextResponse.json({ requestStorageReady, automatedAlertsActive: false }, { headers: { "Cache-Control": "no-store" } });
}
