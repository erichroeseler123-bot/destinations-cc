import { admitOperationalLedgerToDatabaseOnceV031 } from "../../lib/dcc/machine/v03/runtimeStoreV03";

async function main() {
  const snapshot = await admitOperationalLedgerToDatabaseOnceV031({
    writeSnapshotToDisk: true,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        schemaVersion: snapshot.schemaVersion,
        admittedTimestamps: snapshot.admittedTimestamps,
        persistedEventCount: snapshot.events.length,
        persistedEvidenceRefCount: snapshot.evidenceRefs.length,
        sampleEvents: snapshot.events.slice(0, 6).map((ev) => ({
          eventId: ev.eventId,
          claimId: ev.claimId,
          claimVersionId: ev.claimVersionId,
          eventType: ev.eventType,
          recordedAt: ev.recordedAt,
          recordedAtVerified: ev.recordedAtVerified,
          recordingTimeStatus: ev.recordingTimeStatus,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("Failed to admit operational ledger to database:", err);
  process.exit(1);
});
