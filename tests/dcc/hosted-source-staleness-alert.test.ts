import test from "node:test";
import assert from "node:assert/strict";
import { getDccCanonicalHostedCatalogSnapshot } from "../../lib/dcc/cruise/hostedCatalogRegistry";
import { listDccFactVerificationQueue } from "../../lib/dcc/cruise/canonicalLocationsAndRoutePatterns";
import {
  computeHostedSailingSourceFingerprint,
  DCC_SOURCE_PROBE_STATUS_LEDGER,
  evaluateDccHostedCatalogStaleness,
  syncStaleOrChangedHostedRecordsToVerificationQueue,
} from "../../lib/dcc/cruise/hostedSourceStalenessMonitor";

test("DCC stale-source monitor reports 0 overdue alerts on 2026-11-23 while surfacing WAF/probe-blocked domains", () => {
  const snapshot = getDccCanonicalHostedCatalogSnapshot({ includeHeld: true });
  const evalToday = evaluateDccHostedCatalogStaleness({
    snapshot,
    now: "2026-11-23T12:00:00Z",
    includeProbeBlocked: true,
  });

  assert.equal(evalToday.counts.evaluatedSailings, snapshot.hostedSailings.length);
  assert.equal(evalToday.counts.evaluatedOrganizers, snapshot.organizers.length);
  assert.equal(
    evalToday.counts.evaluatedReleaseWatchItems,
    (snapshot.heldInsufficientEvidenceItems ?? []).length,
  );
  assert.equal(evalToday.counts.overdueCheckCount, 0);
  assert.equal(evalToday.counts.materialChangedCount, 0);
  assert.equal(
    evalToday.counts.probeBlockedCount,
    DCC_SOURCE_PROBE_STATUS_LEDGER.length,
  );
  assert.equal(evalToday.counts.probeBlockedCount, 5);
});

test("DCC stale-source monitor returns overdue and changed listings to listDccFactVerificationQueue and auto-clears once refreshed", () => {
  const snapshot = getDccCanonicalHostedCatalogSnapshot({ includeHeld: true });
  const baseline = evaluateDccHostedCatalogStaleness({
    snapshot,
    now: "2026-11-23T12:00:00Z",
    includeProbeBlocked: false,
  });
  assert.equal(baseline.counts.totalAlerts, 0);

  // 1. Imminent departure window (<= 60 days) and schedule_hold items enforce a 7-day max age:
  // On 2026-12-02 (8.9 days after 2026-11-23), Jan 2027 departures & schedule_hold items turn overdue,
  // while mid/late-2027 verified departures remain within their 14-day window.
  const syncImminent = syncStaleOrChangedHostedRecordsToVerificationQueue({
    snapshot,
    now: "2026-12-02T12:00:00Z",
    includeProbeBlocked: false,
    isSyntheticTest: true,
  });
  assert.ok(
    syncImminent.evaluation.counts.overdueCheckCount >= 10,
    `Expected imminent + hold overdue alerts, got ${syncImminent.evaluation.counts.overdueCheckCount}`,
  );
  assert.ok(
    syncImminent.evaluation.alerts.some(
      (a) =>
        a.entityId === "hosted-sailing:monteli-productions:ncl:norwegian-jewel:2027-01-25" &&
        a.maxAllowedAgeDays === 7,
    ),
  );
  assert.ok(
    !syncImminent.evaluation.alerts.some(
      (a) =>
        a.entityId === "hosted-sailing:debusk-travels:msc:msc-world-america:2027-07-10",
    ),
    "July 2027 verified sailing must not be overdue at 9 days",
  );

  const queueAfterImminent = listDccFactVerificationQueue({
    includeSyntheticTest: true,
  }).filter((q) => q.isSyntheticTest && q.state === "needs_review");
  assert.equal(
    queueAfterImminent.length,
    syncImminent.evaluation.counts.totalAlerts,
  );

  // 2. Material source change returns a fresh listing to the review queue immediately
  const debusk = snapshot.hostedSailings.find(
    (s) => s.hostedSailingId === "hosted-sailing:debusk-travels:msc:msc-world-america:2027-07-10",
  )!;
  const oldDeBuskFp = computeHostedSailingSourceFingerprint({
    ...debusk,
    cabinAvailabilityStatus: "available",
    verifiedStartingPriceUsd: 1599,
  });

  const syncChanged = syncStaleOrChangedHostedRecordsToVerificationQueue({
    snapshot,
    now: "2026-11-23T12:00:00Z",
    includeProbeBlocked: false,
    baselineFingerprints: {
      ...baseline.fingerprintsByEntityId,
      [debusk.hostedSailingId]: oldDeBuskFp,
    },
    isSyntheticTest: true,
  });

  assert.equal(syncChanged.evaluation.counts.materialChangedCount, 1);
  assert.equal(syncChanged.evaluation.counts.overdueCheckCount, 0);
  assert.ok(
    syncChanged.resolvedVerificationIds.length >= 10,
    "Previously overdue alerts must auto-clear when evaluated against fresh timestamps",
  );

  const activeSyntheticQueue = listDccFactVerificationQueue({
    includeSyntheticTest: true,
  }).filter((q) => q.isSyntheticTest && q.state === "needs_review");
  assert.equal(activeSyntheticQueue.length, 1);
  assert.equal(activeSyntheticQueue[0]?.entityId, debusk.hostedSailingId);

  // 3. Once baseline fingerprint matches current verified state, the changed alert clears too
  const syncCleared = syncStaleOrChangedHostedRecordsToVerificationQueue({
    snapshot,
    now: "2026-11-23T12:00:00Z",
    includeProbeBlocked: false,
    baselineFingerprints: baseline.fingerprintsByEntityId,
    isSyntheticTest: true,
  });
  assert.equal(syncCleared.evaluation.counts.totalAlerts, 0);
  const remainingNeedsReview = listDccFactVerificationQueue({
    includeSyntheticTest: true,
  }).filter((q) => q.isSyntheticTest && q.state === "needs_review");
  assert.equal(remainingNeedsReview.length, 0);
});

const browserReviewNow = "2026-11-25T16:10:00Z";

function reviewedSailingsSnapshot() {
  const snapshot = getDccCanonicalHostedCatalogSnapshot({ includeHeld: true });
  const reviewedIds = new Set(DCC_SOURCE_PROBE_STATUS_LEDGER.map((entry) => entry.entityId));
  return {
    ...snapshot,
    organizers: [],
    heldInsufficientEvidenceItems: [],
    hostedSailings: snapshot.hostedSailings.filter((sailing) => reviewedIds.has(sailing.hostedSailingId)),
  };
}

test("dated browser evidence clears the five blocked reviews only after the catalog is refreshed", () => {
  const snapshot = reviewedSailingsSnapshot();
  const oldSnapshot = {
    ...snapshot,
    hostedSailings: snapshot.hostedSailings.map((sailing) => ({
      ...sailing,
      organizerSourceCheckedAt: DCC_SOURCE_PROBE_STATUS_LEDGER.find(
        (entry) => entry.entityId === sailing.hostedSailingId,
      )!.lastContentVerifiedAt,
    })),
  };
  const pending = syncStaleOrChangedHostedRecordsToVerificationQueue({
    snapshot: oldSnapshot,
    now: browserReviewNow,
    isSyntheticTest: true,
  });
  assert.equal(pending.evaluation.counts.probeBlockedCount, snapshot.hostedSailings.length);
  assert.equal(pending.evaluation.counts.overdueCheckCount, 1);

  for (const entry of DCC_SOURCE_PROBE_STATUS_LEDGER) {
    const sailing = snapshot.hostedSailings.find((item) => item.hostedSailingId === entry.entityId)!;
    assert.equal(entry.browserReview?.sourceFingerprint, computeHostedSailingSourceFingerprint(sailing));
    assert.equal(entry.browserReview?.checkedAt, sailing.organizerSourceCheckedAt);
    assert.ok(entry.browserReview?.sourceUrls.every((url) => url.startsWith("https://")));
  }
  const refreshed = syncStaleOrChangedHostedRecordsToVerificationQueue({
    snapshot,
    now: browserReviewNow,
    isSyntheticTest: true,
  });
  assert.equal(refreshed.evaluation.counts.totalAlerts, 0);
  assert.equal(refreshed.resolvedVerificationIds.length, snapshot.hostedSailings.length);
  const reviewedQueue = listDccFactVerificationQueue({ includeSyntheticTest: true }).filter(
    (item) => refreshed.resolvedVerificationIds.includes(item.verificationId),
  );
  assert.ok(reviewedQueue.every((item) => item.state === "approved_into_canonical"));
});

test("a future review, changed fact, or newer blocked probe cannot silently clear a source alert", () => {
  const snapshot = reviewedSailingsSnapshot();
  const first = snapshot.hostedSailings[0];
  const changed = evaluateDccHostedCatalogStaleness({
    snapshot: {
      ...snapshot,
      hostedSailings: [{ ...first, canonicalSailDate: "2027-08-25" }],
    },
    now: browserReviewNow,
  });
  assert.equal(changed.counts.probeBlockedCount, 1);

  const historical = evaluateDccHostedCatalogStaleness({
    snapshot,
    now: "2026-11-25T15:00:00Z",
  });
  assert.equal(historical.counts.probeBlockedCount, snapshot.hostedSailings.length);

  const reblocked = evaluateDccHostedCatalogStaleness({
    snapshot,
    now: "2026-11-26T12:00:00Z",
    probeLedger: DCC_SOURCE_PROBE_STATUS_LEDGER.map((entry) => ({
      ...entry,
      lastAttemptedAt: "2026-11-26T11:00:00Z",
    })),
  });
  assert.equal(reblocked.counts.probeBlockedCount, snapshot.hostedSailings.length);
});

test("browser review preserves the 7-day imminent and 14-day ordinary freshness deadlines", () => {
  const snapshot = reviewedSailingsSnapshot();
  const imminent = evaluateDccHostedCatalogStaleness({
    snapshot,
    now: "2026-12-03T16:10:00Z",
  });
  assert.equal(imminent.counts.probeBlockedCount, 0);
  assert.equal(imminent.counts.overdueCheckCount, 1);
  assert.equal(imminent.alerts[0].organizerSlug, "ultimate-music-cruises");
  const expired = evaluateDccHostedCatalogStaleness({
    snapshot,
    now: "2026-12-10T16:10:00Z",
  });
  assert.equal(expired.counts.overdueCheckCount, snapshot.hostedSailings.length);
});
