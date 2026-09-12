import type { Metadata } from "next";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import DccHydrationDemo from "./DccHydrationDemo";
import { validateCoreV2, evaluateFreshness } from "@/validate.mjs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live DCC Endpoint Hydration Demo | Destination Command Center",
  description: "Live demonstration of DCC Core v2 direct endpoint hydration from GoSno LLC with zero secondary database duplication.",
  alternates: { canonical: "/demo" },
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ simulate?: string; operator?: string }>;
}) {
  const { simulate, operator } = (await searchParams) || {};
  const isVibe = operator === "vibe-around-town" || operator === "vat";

  const wellKnownEndpoint = isVibe
    ? "https://vibearoundtown.com/.well-known/dcc"
    : "https://gosno.co/.well-known/dcc";
  const routesEndpoint = isVibe
    ? "https://vibearoundtown.com/api/dcc/packages"
    : "https://gosno.co/api/dcc/routes";
  const currentOperator = isVibe ? "vibe-around-town" : "gosno";

  let wellKnownPayload: any = null;
  let routesPayload: any = null;
  let rawByteSha256 = "";
  let fetchError: string | null = null;
  let httpStatus = 200;
  const fetchedAt = new Date().toISOString();

  // 1. Simulation Modes for Auditing Failure, Stale, and Malformed States
  if (simulate === "failure") {
    fetchError = `HTTP 503 Service Unavailable: Simulated upstream operator gateway timeout (${currentOperator})`;
    httpStatus = 503;
  } else if (simulate === "stale") {
    wellKnownPayload = isVibe
      ? {
          protocol: "dcc",
          core: "2",
          self: wellKnownEndpoint,
          id: "vibearoundtown.com:org/vibe-around-town",
          profile: "tourism/private-excursions-v1",
          claims: [
            { predicate: "legal_name", value: "Vibing Around Tour Co.", as_of: "2024-01-01T00:00:00Z", evidence: [] },
            { predicate: "brand_name", value: "Vibe Around Town", as_of: "2024-01-01T00:00:00Z", evidence: [] },
            { predicate: "operating_authority", value: "USVI Licensed Commercial Passenger Transportation", as_of: "2024-01-01T00:00:00Z", evidence: [] }
          ],
          state: [
            {
              predicate: "service_status",
              value: "operational",
              as_of: "2026-09-10T12:00:00Z",
              fresh_until: "2026-09-10T13:00:00Z", // Past timestamp = STALE
              evidence: []
            }
          ],
          actions: [
            { action_id: "request_reservation", method: "GET", target: "https://vibearoundtown.com/reserve", input: {}, auth: "none" }
          ],
          links: []
        }
      : {
          protocol: "dcc",
          core: "2",
          self: wellKnownEndpoint,
          id: "gosno.co:org/gosno",
          claims: [
            { predicate: "legal_name", value: "GoSno LLC", as_of: "2024-01-01T00:00:00Z", evidence: [] },
            { predicate: "operating_authority", value: "CO PUC LL-03577", as_of: "2024-01-01T00:00:00Z", evidence: [] }
          ],
          state: [
            {
              predicate: "service_status",
              value: "operational",
              as_of: "2026-09-10T12:00:00Z",
              fresh_until: "2026-09-10T13:00:00Z", // Past timestamp = STALE
              evidence: []
            }
          ],
          actions: [
            { action_id: "check_availability", method: "GET", target: "https://gosno.co/api/availability", input: {}, auth: "none" }
          ],
          links: []
        };
    rawByteSha256 = crypto.createHash("sha256").update(Buffer.from(JSON.stringify(wellKnownPayload))).digest("hex");
  } else if (simulate === "malformed") {
    // Malformed: Missing protocol and core envelope fields, and forbidden field names
    wellKnownPayload = {
      self: wellKnownEndpoint,
      id: isVibe ? "vibearoundtown.com:org/vibe-around-town" : "gosno.co:org/gosno",
      claims: "not-an-array", // Malformed container
      actions: [
        { name: "bad_action", href: "http://insecure.example" } // Forbidden names
      ]
    };
    rawByteSha256 = crypto.createHash("sha256").update(Buffer.from(JSON.stringify(wellKnownPayload))).digest("hex");
  } else {
    // 2. Normal Live Production Hydration
    try {
      const [wellKnownRes, routesRes] = await Promise.all([
        fetch(wellKnownEndpoint, {
          headers: { Accept: "application/json", "User-Agent": "DCC-Demo-Viewer/2.0" },
          cache: "no-store",
        }),
        fetch(routesEndpoint, {
          headers: { Accept: "application/json", "User-Agent": "DCC-Demo-Viewer/2.0" },
          cache: "no-store",
        }),
      ]);

      httpStatus = wellKnownRes.status;

      if (!wellKnownRes.ok) {
        fetchError = `HTTP ${wellKnownRes.status} ${wellKnownRes.statusText} from ${wellKnownEndpoint}`;
      } else {
        const wellKnownBytes = Buffer.from(await wellKnownRes.arrayBuffer());
        rawByteSha256 = crypto.createHash("sha256").update(wellKnownBytes).digest("hex");
        wellKnownPayload = JSON.parse(wellKnownBytes.toString("utf-8"));
      }

      if (routesRes.ok) {
        const routesBytes = Buffer.from(await routesRes.arrayBuffer());
        routesPayload = JSON.parse(routesBytes.toString("utf-8"));
      }
    } catch (err: any) {
      fetchError = err.message || `Failed to fetch live ${currentOperator} endpoints`;
      httpStatus = 500;
    }
  }

  // 3. Validation & Freshness Evaluation
  const validation = wellKnownPayload ? validateCoreV2(wellKnownPayload) : null;
  const freshness = (wellKnownPayload && Array.isArray(wellKnownPayload.state))
    ? evaluateFreshness(wellKnownPayload.state)
    : null;

  // 4. Ledger Tip
  let ledgerTipHash = "0000000000000000000000000000000000000000000000000000000000000000";
  let ledgerRecordsCount = 0;
  try {
    const ledgerPath = path.join(process.cwd(), "ledger", "observations.jsonl");
    if (fs.existsSync(ledgerPath)) {
      const lines = fs.readFileSync(ledgerPath, "utf-8").trim().split("\n").filter((l) => l.trim().length > 0);
      ledgerRecordsCount = lines.length;
      if (lines.length > 0) {
        const lastRecord = JSON.parse(lines[lines.length - 1]);
        ledgerTipHash = lastRecord.record_hash || ledgerTipHash;
      }
    }
  } catch {
    // Non-fatal
  }

  return (
    <DccHydrationDemo
      currentOperator={currentOperator}
      wellKnownEndpoint={wellKnownEndpoint}
      routesEndpoint={routesEndpoint}
      wellKnownPayload={wellKnownPayload}
      routesPayload={routesPayload}
      rawByteSha256={rawByteSha256}
      ledgerTipHash={ledgerTipHash}
      ledgerRecordsCount={ledgerRecordsCount}
      fetchedAt={fetchedAt}
      fetchError={fetchError}
      httpStatus={httpStatus}
      validation={validation}
      freshness={freshness}
      simulateMode={simulate || null}
    />
  );
}
