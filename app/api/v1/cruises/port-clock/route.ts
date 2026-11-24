import { NextResponse } from "next/server";
import {
  filterPortCallsByScope,
  getPortClockLedger,
  parsePortClockScope,
  summarizePortClockLedger,
  validatePortClockLedger,
} from "@/lib/dcc/cruise/portClockLedger";
import { RECOMMENDED_RETURN_BUFFER_MINUTES } from "@/lib/dcc/cruise/returnBufferVerdict";

/**
 * Read-only port-clock ledger for CP's future return checker.
 * Optional ?scope=upcoming|past filters portCalls by call date (UTC today); default "all".
 * summary and integrityErrors always describe the whole ledger.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sailingId = url.searchParams.get("sailingId")?.trim().toLowerCase() || null;
  const scope = parsePortClockScope(url.searchParams.get("scope"));
  const ledger = getPortClockLedger();
  const bySailing = sailingId
    ? ledger.portCalls.filter(
        (r) => r.sailingId.toLowerCase() === sailingId || (r.sailingAliases ?? []).some((a) => a.toLowerCase() === sailingId),
      )
    : ledger.portCalls;
  const portCalls = filterPortCallsByScope(bySailing, scope);
  return NextResponse.json(
    {
      version: ledger.version,
      recommendedReturnBufferMinutes: RECOMMENDED_RETURN_BUFFER_MINUTES,
      summary: summarizePortClockLedger(ledger),
      integrityErrors: validatePortClockLedger(ledger),
      rule: "A verdict other than Cannot verify requires a published all-aboard deadline, a known time basis, and a known return point. Modeled estimates are planning notes only.",
      scope,
      portCalls,
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
