import type { Metadata } from "next";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import DccHydrationDemo from "./DccHydrationDemo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live DCC Endpoint Hydration Demo | Destination Command Center",
  description: "Live demonstration of DCC Core v2 direct endpoint hydration from GoSno LLC with zero secondary database duplication.",
  alternates: { canonical: "/demo" },
};

export default async function DemoPage() {
  const wellKnownEndpoint = "https://gosno.co/.well-known/dcc";
  const routesEndpoint = "https://gosno.co/api/dcc/routes";

  let wellKnownPayload: any = null;
  let routesPayload: any = null;
  let rawByteSha256 = "";
  const fetchedAt = new Date().toISOString();

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

    const wellKnownBytes = Buffer.from(await wellKnownRes.arrayBuffer());
    rawByteSha256 = crypto.createHash("sha256").update(wellKnownBytes).digest("hex");
    wellKnownPayload = JSON.parse(wellKnownBytes.toString("utf-8"));

    const routesBytes = Buffer.from(await routesRes.arrayBuffer());
    routesPayload = JSON.parse(routesBytes.toString("utf-8"));
  } catch (err: any) {
    console.error("Failed to hydrate demo from live GoSno endpoints:", err);
  }

  // Read ledger tip
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
    // Non-fatal fallback
  }

  return (
    <DccHydrationDemo
      wellKnownEndpoint={wellKnownEndpoint}
      routesEndpoint={routesEndpoint}
      wellKnownPayload={wellKnownPayload}
      routesPayload={routesPayload}
      rawByteSha256={rawByteSha256}
      ledgerTipHash={ledgerTipHash}
      ledgerRecordsCount={ledgerRecordsCount}
      fetchedAt={fetchedAt}
    />
  );
}
