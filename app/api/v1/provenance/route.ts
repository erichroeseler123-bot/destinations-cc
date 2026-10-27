import { NextResponse } from "next/server";
import { getDeploymentProvenanceV03 } from "@/lib/dcc/machine/v03/discoveryAndMcp";
import {
  ensureRuntimeStoreHydratedFromNeon,
  getV03RuntimeStore,
} from "@/lib/dcc/machine/v03/runtimeStoreV03";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const provenance = getDeploymentProvenanceV03();
  const store = getV03RuntimeStore();
  await ensureRuntimeStoreHydratedFromNeon(store);
  const events = store.knowledgeLedger.getAllEvents();
  const preservedUnverifiedLegacyEvents = events
    .filter((e) => !e.recordedAtVerified)
    .map((e) => ({
      eventSeq: e.eventSeq,
      eventId: e.eventId,
      eventType: e.eventType,
      claimId: e.claimId,
      claimVersionId: e.claimVersionId,
      recordedAt: e.recordedAt,
      recordedAtVerified: Boolean(e.recordedAtVerified),
      recordingTimeStatus: e.recordingTimeStatus ?? "unverified_legacy_recording_time",
    }));
  const verifiedDatabaseAdmissionEvents = events
    .filter((e) => e.recordedAtVerified === true)
    .map((e) => ({
      eventSeq: e.eventSeq,
      eventId: e.eventId,
      eventType: e.eventType,
      claimId: e.claimId,
      claimVersionId: e.claimVersionId,
      targetPreviousVersionId: e.targetPreviousVersionId,
      recordedAt: e.recordedAt,
      recordedAtVerified: true,
      recordingTimeStatus: e.recordingTimeStatus ?? "verified_database_admission",
    }));

  return NextResponse.json(
    {
      ...provenance,
      databaseLedgerAdmission: {
        hydratedFromNeon: store.hydratedFromNeon,
        admittedTimestamps: store.admittedTimestamps,
        totalEventsCount: events.length,
        preservedUnverifiedLegacyEventsCount: preservedUnverifiedLegacyEvents.length,
        verifiedDatabaseAdmissionEventsCount: verifiedDatabaseAdmissionEvents.length,
        preservedUnverifiedLegacyEvents,
        verifiedDatabaseAdmissionEvents,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
