import { NextResponse } from "next/server";
import { emitDccEvent } from "@/lib/dcc";

export async function POST() {
  const handoffId = `saveonthestrip_probe_${Date.now()}`;
  const result = await emitDccEvent({
    handoffId,
    satelliteId: "saveonthestrip",
    eventType: "lead_captured",
    source: "saveonthestrip",
    sourcePath: "/api/admin/dcc-probe",
    externalReference: `probe:${handoffId}`,
    status: "probe",
    stage: "admin_diagnostic",
    message: "Save On The Strip DCC probe",
    attribution: {
      sourceSlug: "saveonthestrip-admin",
      sourcePage: "/",
      topicSlug: "ops",
    },
    booking: { citySlug: "las-vegas" },
  });

  return NextResponse.json({ success: result.ok, result, handoffId }, { status: result.ok ? 200 : 500 });
}
