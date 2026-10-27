import assert from "node:assert/strict";
import { admitOperationalLedgerAdditiveIdempotentV031 } from "../../lib/dcc/machine/v03/runtimeStoreV03";

async function main() {
  const firstRun = await admitOperationalLedgerAdditiveIdempotentV031({
    writeSnapshotToDisk: true,
  });

  const secondRun = await admitOperationalLedgerAdditiveIdempotentV031({
    writeSnapshotToDisk: false,
  });

  assert.equal(
    secondRun.newlyAppendedEventsCount,
    0,
    "Second admission run must be strictly idempotent and append 0 new events.",
  );
  assert.equal(secondRun.events.length, firstRun.events.length);
  assert.deepEqual(
    secondRun.events.map((e) => ({
      eventId: e.eventId,
      eventHash: e.eventHash,
      recordedAt: e.recordedAt,
      recordedAtVerified: e.recordedAtVerified,
      recordingTimeStatus: e.recordingTimeStatus,
    })),
    firstRun.events.map((e) => ({
      eventId: e.eventId,
      eventHash: e.eventHash,
      recordedAt: e.recordedAt,
      recordedAtVerified: e.recordedAtVerified,
      recordingTimeStatus: e.recordingTimeStatus,
    })),
    "Running admission twice must preserve all original records, hashes, and timestamps.",
  );
  assert.deepEqual(secondRun.admittedTimestamps, firstRun.admittedTimestamps);

  console.log(
    JSON.stringify(
      {
        ok: true,
        additiveIdempotentVerified: true,
        firstRunNewlyAppendedCount: firstRun.newlyAppendedEventsCount,
        secondRunNewlyAppendedCount: secondRun.newlyAppendedEventsCount,
        preservedExistingEventsCount: secondRun.preservedExistingEventsCount,
        preservedUnverifiedLegacyEventsCount:
          secondRun.preservedUnverifiedLegacyEventsCount,
        schemaVersion: firstRun.schemaVersion,
        admittedTimestamps: firstRun.admittedTimestamps,
        persistedEventCount: firstRun.events.length,
        persistedEvidenceRefCount: firstRun.evidenceRefs?.length ?? 0,
        sampleEvents: firstRun.events.slice(0, 6).map((ev) => ({
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
