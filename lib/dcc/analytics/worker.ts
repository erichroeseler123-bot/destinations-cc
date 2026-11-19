import crypto from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  getAnalyticsSqliteDb,
  incrementHealthCounter,
  type NormalizedAnalyticsRecord,
} from "./store";

export const WORKER_DEFAULT_BATCH_SIZE = 250;
export const WORKER_MAX_BATCHES_PER_RUN = 8;
export const WORKER_MAX_ATTEMPTS = 3;
export const WORKER_LEASE_TTL_MS = 15_000;

function minIso(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b || null;
  if (!b) return a || null;
  return Date.parse(a) <= Date.parse(b) ? a : b;
}

function maxIso(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b || null;
  if (!b) return a || null;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

function toHourBucketIso(iso: string): { hourStartIso: string; hourEndIso: string; dayBucket: string } {
  const d = new Date(Date.parse(iso));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const hourStartIso = `${y}-${m}-${day}T${h}:00:00.000Z`;
  const hourEndIso = new Date(Date.parse(hourStartIso) + 3600_000).toISOString();
  return { hourStartIso, hourEndIso, dayBucket: `${y}-${m}-${day}` };
}

export interface AnalyticsWorkerRunResult {
  ok: boolean;
  leased: boolean;
  batchesRun: number;
  claimedCount: number;
  processedCount: number;
  deduplicatedWorkerCount: number;
  lateEventsReconciledCount: number;
  retriedCount: number;
  deadLetteredCount: number;
  watermarkIso: string | null;
  durationMs: number;
  reason?: string;
}

export function runAnalyticsWorker(options?: {
  batchSize?: number;
  maxBatches?: number;
  workerId?: string;
  nowMs?: number;
}): AnalyticsWorkerRunResult {
  const t0 = performance.now();
  const db = getAnalyticsSqliteDb();
  const batchSize = Math.min(Math.max(1, options?.batchSize ?? WORKER_DEFAULT_BATCH_SIZE), 500);
  const maxBatches = Math.min(Math.max(1, options?.maxBatches ?? WORKER_MAX_BATCHES_PER_RUN), 20);
  const workerId = options?.workerId || `wrk_${crypto.randomUUID().slice(0, 12)}`;
  const nowMs = options?.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();

  // 1. Acquire non-overlapping worker lease (`MAX_CONCURRENT_WORKERS = 1`)
  const existingLease = db
    .prepare("SELECT worker_id, leased_until_ms FROM dcc_analytics_worker_lease WHERE lease_name = 'primary'")
    .get();
  if (
    existingLease &&
    Number(existingLease.leased_until_ms) > nowMs &&
    String(existingLease.worker_id) !== workerId
  ) {
    return {
      ok: true,
      leased: false,
      batchesRun: 0,
      claimedCount: 0,
      processedCount: 0,
      deduplicatedWorkerCount: 0,
      lateEventsReconciledCount: 0,
      retriedCount: 0,
      deadLetteredCount: 0,
      watermarkIso: null,
      durationMs: Number((performance.now() - t0).toFixed(2)),
      reason: "lease_busy",
    };
  }

  db.prepare(
    `INSERT INTO dcc_analytics_worker_lease (lease_name, worker_id, leased_until_ms, updated_at)
     VALUES ('primary', ?, ?, ?)
     ON CONFLICT(lease_name) DO UPDATE SET
       worker_id = excluded.worker_id,
       leased_until_ms = excluded.leased_until_ms,
       updated_at = excluded.updated_at`,
  ).run(workerId, nowMs + WORKER_LEASE_TTL_MS, nowIso);

  let batchesRun = 0;
  let claimedCount = 0;
  let processedCount = 0;
  let deduplicatedWorkerCount = 0;
  let lateEventsReconciledCount = 0;
  let retriedCount = 0;
  let deadLetteredCount = 0;
  let latestWatermarkIso: string | null = null;
  let lastQueueSeq = 0;

  try {
    const currentWmRow = db
      .prepare("SELECT processed_through_iso, last_queue_seq FROM dcc_analytics_watermarks WHERE scope_key = 'primary'")
      .get();
    latestWatermarkIso = currentWmRow?.processed_through_iso
      ? String(currentWmRow.processed_through_iso)
      : null;
    lastQueueSeq = Number(currentWmRow?.last_queue_seq || 0);

    let minQueueSeqCursor = 0;

    for (let b = 0; b < maxBatches; b++) {
      const queueRows = db
        .prepare(
          `SELECT queue_seq, logical_event_id, attempts, payload_json
           FROM dcc_analytics_ingest_queue
           WHERE status IN ('queued', 'processing') AND attempts < ? AND queue_seq > ?
           ORDER BY queue_seq ASC
           LIMIT ?`,
        )
        .all(WORKER_MAX_ATTEMPTS, minQueueSeqCursor, batchSize);

      if (queueRows.length === 0) break;
      batchesRun += 1;
      claimedCount += queueRows.length;

      let batchProcessedCount = 0;
      let batchDeduplicatedCount = 0;
      let batchLateCount = 0;
      let batchRetriedCount = 0;
      let batchDeadLetteredCount = 0;

      const dirtyHourSlices = new Map<
        string,
        { environment: string; hourStartIso: string; hourEndIso: string; siteId: string }
      >();
      const dirtySubjects = new Set<string>();

      db.exec("BEGIN IMMEDIATE TRANSACTION;");
      try {
        for (const qRow of queueRows) {
          const qSeq = Number(qRow.queue_seq);
          minQueueSeqCursor = Math.max(minQueueSeqCursor, qSeq);
          const attempts = Number(qRow.attempts || 0);

          try {
            const rec = JSON.parse(String(qRow.payload_json)) as NormalizedAnalyticsRecord;

            // Handle explicit privacy / user trip deletion first
            if (rec.eventType === "trip_deleted" && rec.analyticsTripKey) {
              db.prepare(
                `INSERT INTO dcc_analytics_tombstones (environment, target_type, target_key, deleted_at, reason)
                 VALUES (?, 'trip', ?, ?, 'trip_deleted')
                 ON CONFLICT(environment, target_type, target_key) DO UPDATE SET deleted_at = excluded.deleted_at`,
              ).run(rec.environment, rec.analyticsTripKey, rec.occurredAt);

              db.prepare(
                "DELETE FROM dcc_analytics_trip_state WHERE environment = ? AND (trip_unit_key = ? OR analytics_trip_key = ?)",
              ).run(rec.environment, rec.analyticsTripKey, rec.analyticsTripKey);
              db.prepare(
                "DELETE FROM dcc_analytics_trip_links WHERE environment = ? AND analytics_trip_key = ?",
              ).run(rec.environment, rec.analyticsTripKey);
              db.prepare(
                "UPDATE dcc_analytics_events SET analytics_trip_key = NULL, draft_key_hash = NULL, participant_key = NULL WHERE environment = ? AND analytics_trip_key = ?",
              ).run(rec.environment, rec.analyticsTripKey);

              incrementHealthCounter(db, "tombstoned_trips_total", 1, nowIso);
              db.prepare(
                "UPDATE dcc_analytics_ingest_queue SET status = 'processed', attempts = ? WHERE queue_seq = ?",
              ).run(attempts + 1, qSeq);
              batchProcessedCount += 1;
              lastQueueSeq = Math.max(lastQueueSeq, qSeq);
              latestWatermarkIso = maxIso(latestWatermarkIso, rec.occurredAt);
              continue;
            }

            // Detect late arrival relative to prior watermark
            const isLate = Boolean(
              latestWatermarkIso && Date.parse(rec.occurredAt) < Date.parse(latestWatermarkIso) - 1000,
            );

            // Check if trip is tombstoned
            const effectiveTripCheckKey = rec.analyticsTripKey;
            const isTombstoned = effectiveTripCheckKey
              ? Boolean(
                  db
                    .prepare(
                      "SELECT 1 FROM dcc_analytics_tombstones WHERE environment = ? AND target_type = 'trip' AND target_key = ?",
                    )
                    .get(rec.environment, effectiveTripCheckKey),
                )
              : false;

            const safeTripKey = isTombstoned ? null : rec.analyticsTripKey;
            const safeDraftHash = isTombstoned ? null : rec.draftKeyHash;

            // Insert into append-only `dcc_analytics_events` idempotently
            const insertRes = db
              .prepare(
                `INSERT INTO dcc_analytics_events (
                   logical_event_id, delivery_id, schema_version, event_type, layer,
                   environment, site_id, traffic_class, classification_reason,
                   occurred_at, received_at, processed_at, reporting_subject_id, key_version,
                   session_key, canonical_path, landing_path, referrer_domain,
                   utm_source, utm_medium, utm_campaign, content_family,
                   handoff_id, click_id, continuity_tier, target_site_id, provider, product_code,
                   physical_sailing_id, hosted_departure_id, journey_kind,
                   draft_key_hash, analytics_trip_key, participant_role, participant_key,
                   party_headcount_total, sub_milestone, is_template_or_hydration, is_noop_save,
                   lead_time_bucket, confirmation_provenance_json,
                   outcome_type, gross_amount_usd, commission_amount_usd, props_json
                 ) VALUES (
                   ?, ?, ?, ?, ?,
                   ?, ?, ?, ?,
                   ?, ?, ?, ?, ?,
                   ?, ?, ?, ?,
                   ?, ?, ?, ?,
                   ?, ?, ?, ?, ?, ?,
                   ?, ?, ?,
                   ?, ?, ?, ?,
                   ?, ?, ?, ?,
                   ?, ?,
                   ?, ?, ?, ?
                 )
                 ON CONFLICT(logical_event_id) DO NOTHING`,
              )
              .run(
                rec.logicalEventId,
                rec.deliveryId,
                rec.schemaVersion,
                rec.eventType,
                rec.layer,
                rec.environment,
                rec.siteId,
                rec.trafficClass,
                rec.classificationReason,
                rec.occurredAt,
                rec.receivedAt,
                nowIso,
                rec.reportingSubjectId,
                rec.keyVersion,
                rec.sessionKey,
                rec.canonicalPath,
                rec.landingPath,
                rec.referrerDomain,
                rec.utmSource,
                rec.utmMedium,
                rec.utmCampaign,
                rec.contentFamily,
                rec.handoffId,
                rec.clickId,
                rec.continuityTier,
                rec.targetSiteId,
                rec.provider,
                rec.productCode,
                rec.physicalSailingId,
                rec.hostedDepartureId,
                rec.journeyKind,
                safeDraftHash,
                safeTripKey,
                rec.participantRole,
                isTombstoned ? null : rec.participantKey,
                rec.partyHeadcountTotal,
                rec.subMilestone,
                rec.isTemplateOrHydration ? 1 : 0,
                rec.isNoOpSave ? 1 : 0,
                rec.leadTimeBucket,
                rec.confirmationProvenance ? JSON.stringify(rec.confirmationProvenance) : null,
                rec.outcomeType,
                rec.grossAmountUsd,
                rec.commissionAmountUsd,
                JSON.stringify(rec.props || {}),
              );

            if (insertRes.changes === 0) {
              batchDeduplicatedCount += 1;
            } else {
              if (isLate) {
                batchLateCount += 1;
              }
              const { hourStartIso, hourEndIso } = toHourBucketIso(rec.occurredAt);
              const sliceKey = `${rec.environment}|${hourStartIso}|${rec.siteId}`;
              dirtyHourSlices.set(sliceKey, {
                environment: rec.environment,
                hourStartIso,
                hourEndIso,
                siteId: rec.siteId,
              });

              if (
                rec.eventType === "page_viewed" &&
                rec.trafficClass === "observed_browser" &&
                (rec.reportingSubjectId || rec.sessionKey)
              ) {
                dirtySubjects.add(`${rec.environment}|${rec.siteId}|${rec.reportingSubjectId || ""}|${rec.sessionKey || ""}|${rec.occurredAt.slice(0, 10)}`);
              }

              // Project Trip Lifecycle State (only for non-bot, non-QA-in-prod or matching env observed/server events)
              if (
                !isTombstoned &&
                rec.trafficClass !== "known_bot" &&
                rec.trafficClass !== "suspected_automation" &&
                (safeTripKey || safeDraftHash)
              ) {
                projectEventIntoTripState(db, rec, safeTripKey, safeDraftHash, nowIso);
              }
            }

            db.prepare(
              "UPDATE dcc_analytics_ingest_queue SET status = 'processed', attempts = ?, last_error = NULL WHERE queue_seq = ?",
            ).run(attempts + 1, qSeq);
            batchProcessedCount += 1;
            lastQueueSeq = Math.max(lastQueueSeq, qSeq);
            latestWatermarkIso = maxIso(latestWatermarkIso, rec.occurredAt);
          } catch (rowErr) {
            const nextAttempts = attempts + 1;
            const errMsg = rowErr instanceof Error ? rowErr.message.slice(0, 240) : "worker_row_error";
            if (nextAttempts >= WORKER_MAX_ATTEMPTS) {
              db.prepare(
                "UPDATE dcc_analytics_ingest_queue SET status = 'dead_letter', attempts = ?, last_error = ? WHERE queue_seq = ?",
              ).run(nextAttempts, errMsg, qSeq);
              batchDeadLetteredCount += 1;
            } else {
              db.prepare(
                "UPDATE dcc_analytics_ingest_queue SET status = 'queued', attempts = ?, last_error = ? WHERE queue_seq = ?",
              ).run(nextAttempts, errMsg, qSeq);
              batchRetriedCount += 1;
            }
          }
        }

        processedCount += batchProcessedCount;
        deduplicatedWorkerCount += batchDeduplicatedCount;
        lateEventsReconciledCount += batchLateCount;
        retriedCount += batchRetriedCount;
        deadLetteredCount += batchDeadLetteredCount;

        // Recompute exact hourly rollups for all dirty slices (supports late-event correction automatically!)
        for (const slice of dirtyHourSlices.values()) {
          recomputeHourlyRollupSlice(db, slice, nowIso);
        }

        // Recompute dirty subject/session daily rollups
        if (dirtySubjects.size > 0) {
          recomputeSubjectAndSessionRollups(db, dirtySubjects);
        }

        const runElapsedMs = Math.round(performance.now() - t0);
        db.prepare(
          `INSERT INTO dcc_analytics_watermarks (
             scope_key, processed_through_iso, last_queue_seq,
             last_worker_success_at, last_worker_duration_ms, updated_at
           ) VALUES ('primary', ?, ?, ?, ?, ?)
           ON CONFLICT(scope_key) DO UPDATE SET
             processed_through_iso = COALESCE(excluded.processed_through_iso, dcc_analytics_watermarks.processed_through_iso),
             last_queue_seq = MAX(dcc_analytics_watermarks.last_queue_seq, excluded.last_queue_seq),
             last_worker_success_at = excluded.last_worker_success_at,
             last_worker_duration_ms = excluded.last_worker_duration_ms,
             updated_at = excluded.updated_at`,
        ).run(latestWatermarkIso, lastQueueSeq, nowIso, runElapsedMs, nowIso);

        incrementHealthCounter(db, "processed_total", batchProcessedCount, nowIso);
        incrementHealthCounter(db, "deduplicated_worker_total", batchDeduplicatedCount, nowIso);
        incrementHealthCounter(db, "late_events_reconciled_total", batchLateCount, nowIso);
        incrementHealthCounter(db, "retried_total", batchRetriedCount, nowIso);
        incrementHealthCounter(db, "dead_letter_total", batchDeadLetteredCount, nowIso);

        // Invalidate stale report cache entries when data changes so next report read refreshes cleanly
        if (dirtyHourSlices.size > 0 || batchProcessedCount > 0) {
          db.prepare("DELETE FROM dcc_analytics_report_cache").run();
        }

        db.exec("COMMIT;");
      } catch (txErr) {
        try {
          db.exec("ROLLBACK;");
        } catch {
          // ignore
        }
        throw txErr;
      }
    }
  } finally {
    // Release lease cleanly
    try {
      db.prepare(
        "UPDATE dcc_analytics_worker_lease SET leased_until_ms = 0, updated_at = ? WHERE lease_name = 'primary' AND worker_id = ?",
      ).run(new Date().toISOString(), workerId);
    } catch {
      // ignore
    }
  }

  return {
    ok: true,
    leased: true,
    batchesRun,
    claimedCount,
    processedCount,
    deduplicatedWorkerCount,
    lateEventsReconciledCount,
    retriedCount,
    deadLetteredCount,
    watermarkIso: latestWatermarkIso,
    durationMs: Number((performance.now() - t0).toFixed(2)),
  };
}

function recomputeHourlyRollupSlice(
  db: ReturnType<typeof getAnalyticsSqliteDb>,
  slice: { environment: string; hourStartIso: string; hourEndIso: string; siteId: string },
  nowIso: string,
): void {
  db.prepare(
    `DELETE FROM dcc_analytics_hourly_rollups
     WHERE environment = ? AND hour_bucket_iso = ? AND site_id = ?`,
  ).run(slice.environment, slice.hourStartIso, slice.siteId);

  const grouped = db
    .prepare(
      `SELECT
         content_family,
         traffic_class,
         SUM(CASE WHEN event_type = 'page_viewed' THEN 1 ELSE 0 END) AS pageviews_count,
         SUM(CASE WHEN event_type = 'guide_engaged' THEN 1 ELSE 0 END) AS guide_engagements_count,
         SUM(CASE WHEN event_type = 'printable_view_opened' THEN 1 ELSE 0 END) AS printable_opens_count,
         SUM(CASE WHEN event_type = 'cross_site_handoff_clicked' THEN 1 ELSE 0 END) AS cross_site_clicks_count,
         SUM(CASE WHEN event_type = 'cross_site_handoff_arrived' THEN 1 ELSE 0 END) AS cross_site_arrivals_count,
         SUM(CASE WHEN event_type = 'cross_site_handoff_arrived' AND continuity_tier = 'verified_dcc_ctx' THEN 1 ELSE 0 END) AS verified_ctx_arrivals_count,
         SUM(CASE WHEN event_type = 'seller_handoff_initiated' THEN 1 ELSE 0 END) AS seller_handoffs_count,
         SUM(CASE WHEN event_type = 'seller_handoff_initiated' AND reporting_subject_id IS NULL THEN 1 ELSE 0 END) AS unidentified_outbound_count
       FROM dcc_analytics_events
       WHERE environment = ? AND site_id = ? AND occurred_at >= ? AND occurred_at < ?
       GROUP BY content_family, traffic_class`,
    )
    .all(slice.environment, slice.siteId, slice.hourStartIso, slice.hourEndIso);

  const insertRollup = db.prepare(
    `INSERT INTO dcc_analytics_hourly_rollups (
       environment, hour_bucket_iso, site_id, content_family, traffic_class,
       pageviews_count, guide_engagements_count, printable_opens_count,
       cross_site_clicks_count, cross_site_arrivals_count, verified_ctx_arrivals_count,
       seller_handoffs_count, unidentified_outbound_count, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const row of grouped) {
    insertRollup.run(
      slice.environment,
      slice.hourStartIso,
      slice.siteId,
      String(row.content_family),
      String(row.traffic_class),
      Number(row.pageviews_count || 0),
      Number(row.guide_engagements_count || 0),
      Number(row.printable_opens_count || 0),
      Number(row.cross_site_clicks_count || 0),
      Number(row.cross_site_arrivals_count || 0),
      Number(row.verified_ctx_arrivals_count || 0),
      Number(row.seller_handoffs_count || 0),
      Number(row.unidentified_outbound_count || 0),
      nowIso,
    );
  }
}

function recomputeSubjectAndSessionRollups(
  db: ReturnType<typeof getAnalyticsSqliteDb>,
  dirtyKeys: Set<string>,
): void {
  const uniqueEnvSiteSubjects = new Set<string>();
  const uniqueEnvSiteDays = new Set<string>();

  for (const raw of dirtyKeys) {
    const [env, siteId, subjectId, , dayBucket] = raw.split("|");
    if (env && siteId && subjectId) {
      uniqueEnvSiteSubjects.add(`${env}|${siteId}|${subjectId}`);
    }
    if (env && siteId && dayBucket) {
      uniqueEnvSiteDays.add(`${env}|${siteId}|${dayBucket}`);
    }
  }

  for (const key of uniqueEnvSiteSubjects) {
    const [env, siteId, subjectId] = key.split("|") as [string, string, string];
    const events = db
      .prepare(
        `SELECT occurred_at, session_key, landing_path, utm_source, utm_campaign, referrer_domain
         FROM dcc_analytics_events
         WHERE environment = ? AND site_id = ? AND reporting_subject_id = ?
           AND event_type = 'page_viewed' AND traffic_class = 'observed_browser'
         ORDER BY occurred_at ASC`,
      )
      .all(env, siteId, subjectId);

    if (events.length === 0) continue;
    const first = events[0]!;
    const last = events[events.length - 1]!;
    const sessions = new Set<string>();
    const days = new Set<string>();
    for (const e of events) {
      if (e.session_key) sessions.add(String(e.session_key));
      days.add(String(e.occurred_at).slice(0, 10));
    }

    db.prepare(
      `INSERT INTO dcc_analytics_subject_activity (
         environment, site_id, subject_id, first_pageview_at, last_pageview_at,
         total_pageviews, distinct_session_count, distinct_day_count,
         last_session_key, last_day_bucket, first_landing_path,
         first_utm_source, first_utm_campaign, first_referrer_domain
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(environment, site_id, subject_id) DO UPDATE SET
         first_pageview_at = excluded.first_pageview_at,
         last_pageview_at = excluded.last_pageview_at,
         total_pageviews = excluded.total_pageviews,
         distinct_session_count = excluded.distinct_session_count,
         distinct_day_count = excluded.distinct_day_count,
         last_session_key = excluded.last_session_key,
         last_day_bucket = excluded.last_day_bucket,
         first_landing_path = excluded.first_landing_path,
         first_utm_source = excluded.first_utm_source,
         first_utm_campaign = excluded.first_utm_campaign,
         first_referrer_domain = excluded.first_referrer_domain`,
    ).run(
      env,
      siteId,
      subjectId,
      String(first.occurred_at),
      String(last.occurred_at),
      events.length,
      Math.max(1, sessions.size),
      days.size,
      last.session_key ? String(last.session_key) : null,
      String(last.occurred_at).slice(0, 10),
      String(first.landing_path || "/"),
      first.utm_source ? String(first.utm_source) : null,
      first.utm_campaign ? String(first.utm_campaign) : null,
      first.referrer_domain ? String(first.referrer_domain) : null,
    );
  }

  for (const dayKey of uniqueEnvSiteDays) {
    const [env, siteId, dayBucket] = dayKey.split("|") as [string, string, string];
    const dayStart = `${dayBucket}T00:00:00.000Z`;
    const dayEnd = `${dayBucket}T23:59:59.999Z`;

    db.prepare(
      "DELETE FROM dcc_analytics_daily_subjects WHERE environment = ? AND site_id = ? AND day_bucket = ?",
    ).run(env, siteId, dayBucket);
    db.prepare(
      "DELETE FROM dcc_analytics_daily_sessions WHERE environment = ? AND site_id = ? AND day_bucket = ?",
    ).run(env, siteId, dayBucket);

    const dayEvents = db
      .prepare(
        `SELECT occurred_at, content_family, reporting_subject_id, session_key,
                landing_path, utm_source, utm_campaign, referrer_domain
         FROM dcc_analytics_events
         WHERE environment = ? AND site_id = ? AND occurred_at >= ? AND occurred_at <= ?
           AND event_type = 'page_viewed' AND traffic_class = 'observed_browser'
         ORDER BY occurred_at ASC`,
      )
      .all(env, siteId, dayStart, dayEnd);

    const subjMap = new Map<
      string,
      {
        contentFamily: string;
        subjectId: string;
        sessions: Set<string>;
        pageviews: number;
        firstAt: string;
        lastAt: string;
        landingPath: string;
        utmSource: string | null;
        utmCampaign: string | null;
        referrerDomain: string | null;
      }
    >();
    const sessMap = new Map<
      string,
      {
        contentFamily: string;
        sessionKey: string;
        subjectId: string | null;
        pageviews: number;
        firstAt: string;
        lastAt: string;
        landingPath: string;
        utmSource: string | null;
        utmCampaign: string | null;
        referrerDomain: string | null;
      }
    >();

    for (const ev of dayEvents) {
      const cf = String(ev.content_family);
      const occurredAt = String(ev.occurred_at);
      const subj = ev.reporting_subject_id ? String(ev.reporting_subject_id) : null;
      const sess = ev.session_key ? String(ev.session_key) : subj;

      if (subj) {
        const sKey = `${cf}|${subj}`;
        const cur = subjMap.get(sKey);
        if (!cur) {
          const sSet = new Set<string>();
          if (sess) sSet.add(sess);
          subjMap.set(sKey, {
            contentFamily: cf,
            subjectId: subj,
            sessions: sSet,
            pageviews: 1,
            firstAt: occurredAt,
            lastAt: occurredAt,
            landingPath: String(ev.landing_path || "/"),
            utmSource: ev.utm_source ? String(ev.utm_source) : null,
            utmCampaign: ev.utm_campaign ? String(ev.utm_campaign) : null,
            referrerDomain: ev.referrer_domain ? String(ev.referrer_domain) : null,
          });
        } else {
          if (sess) cur.sessions.add(sess);
          cur.pageviews += 1;
          cur.lastAt = occurredAt;
        }
      }

      if (sess) {
        const k = `${cf}|${sess}`;
        const cur = sessMap.get(k);
        if (!cur) {
          sessMap.set(k, {
            contentFamily: cf,
            sessionKey: sess,
            subjectId: subj,
            pageviews: 1,
            firstAt: occurredAt,
            lastAt: occurredAt,
            landingPath: String(ev.landing_path || "/"),
            utmSource: ev.utm_source ? String(ev.utm_source) : null,
            utmCampaign: ev.utm_campaign ? String(ev.utm_campaign) : null,
            referrerDomain: ev.referrer_domain ? String(ev.referrer_domain) : null,
          });
        } else {
          cur.pageviews += 1;
          cur.lastAt = occurredAt;
        }
      }
    }

    const insertSubj = db.prepare(
      `INSERT INTO dcc_analytics_daily_subjects (
         environment, day_bucket, site_id, content_family, subject_id,
         session_count, pageview_count, first_seen_in_day_at, last_seen_in_day_at,
         is_returning_subject, landing_path, utm_source, utm_campaign, referrer_domain
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (const item of subjMap.values()) {
      const lifetime = db
        .prepare(
          "SELECT first_pageview_at, distinct_session_count FROM dcc_analytics_subject_activity WHERE environment = ? AND site_id = ? AND subject_id = ?",
        )
        .get(env, siteId, item.subjectId);
      const lifetimeFirst = lifetime?.first_pageview_at ? String(lifetime.first_pageview_at) : item.firstAt;
      const isReturning =
        lifetimeFirst.slice(0, 10) < dayBucket ||
        item.sessions.size > 1 ||
        Date.parse(item.lastAt) - Date.parse(lifetimeFirst) >= 30 * 60 * 1000
          ? 1
          : 0;

      insertSubj.run(
        env,
        dayBucket,
        siteId,
        item.contentFamily,
        item.subjectId,
        Math.max(1, item.sessions.size),
        item.pageviews,
        item.firstAt,
        item.lastAt,
        isReturning,
        item.landingPath,
        item.utmSource,
        item.utmCampaign,
        item.referrerDomain,
      );
    }

    const insertSess = db.prepare(
      `INSERT INTO dcc_analytics_daily_sessions (
         environment, day_bucket, site_id, content_family, session_key, subject_id,
         first_pageview_at, last_pageview_at, pageview_count,
         landing_path, utm_source, utm_campaign, referrer_domain
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (const s of sessMap.values()) {
      insertSess.run(
        env,
        dayBucket,
        siteId,
        s.contentFamily,
        s.sessionKey,
        s.subjectId,
        s.firstAt,
        s.lastAt,
        s.pageviews,
        s.landingPath,
        s.utmSource,
        s.utmCampaign,
        s.referrerDomain,
      );
    }
  }
}

function projectEventIntoTripState(
  db: ReturnType<typeof getAnalyticsSqliteDb>,
  rec: NormalizedAnalyticsRecord,
  analyticsTripKey: string | null,
  draftKeyHash: string | null,
  nowIso: string,
): void {
  // 1. Resolve canonical trip_unit_key via dcc_analytics_trip_links so drafts becoming saved trips NEVER double-count
  let resolvedAtk = analyticsTripKey;
  if (!resolvedAtk && draftKeyHash) {
    const linkRow = db
      .prepare(
        "SELECT analytics_trip_key FROM dcc_analytics_trip_links WHERE environment = ? AND draft_key_hash = ?",
      )
      .get(rec.environment, draftKeyHash);
    if (linkRow?.analytics_trip_key) {
      resolvedAtk = String(linkRow.analytics_trip_key);
    }
  }

  if (resolvedAtk && draftKeyHash) {
    db.prepare(
      `INSERT INTO dcc_analytics_trip_links (environment, draft_key_hash, analytics_trip_key, linked_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(environment, draft_key_hash) DO UPDATE SET analytics_trip_key = excluded.analytics_trip_key`,
    ).run(rec.environment, draftKeyHash, resolvedAtk, nowIso);
  }

  const tripUnitKey = resolvedAtk || draftKeyHash;
  if (!tripUnitKey) return;

  // Check if an unlinked draft state row exists under `draftKeyHash` that needs to merge into `resolvedAtk`
  let draftStateToMerge: Record<string, unknown> | undefined;
  if (resolvedAtk && draftKeyHash && resolvedAtk !== draftKeyHash) {
    draftStateToMerge = db
      .prepare(
        "SELECT * FROM dcc_analytics_trip_state WHERE environment = ? AND trip_unit_key = ?",
      )
      .get(rec.environment, draftKeyHash);
    if (draftStateToMerge) {
      db.prepare(
        "DELETE FROM dcc_analytics_trip_state WHERE environment = ? AND trip_unit_key = ?",
      ).run(rec.environment, draftKeyHash);
    }
  }

  const existing = db
    .prepare(
      "SELECT * FROM dcc_analytics_trip_state WHERE environment = ? AND trip_unit_key = ?",
    )
    .get(rec.environment, tripUnitKey);

  const strOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
  const numOrZero = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

  let entrySelectedAt = minIso(
    strOrNull(existing?.entry_selected_at),
    strOrNull(draftStateToMerge?.entry_selected_at),
  );
  let draftStartedAt = minIso(
    strOrNull(existing?.draft_started_at),
    strOrNull(draftStateToMerge?.draft_started_at),
  );
  let persistedAt = minIso(
    strOrNull(existing?.persisted_at),
    strOrNull(draftStateToMerge?.persisted_at),
  );
  let firstCustomizedAt = minIso(
    strOrNull(existing?.first_customized_at),
    strOrNull(draftStateToMerge?.first_customized_at),
  );
  let customizationCount =
    numOrZero(existing?.customization_count) + numOrZero(draftStateToMerge?.customization_count);

  let confStagedAt = minIso(
    strOrNull(existing?.confirmation_staged_at),
    strOrNull(draftStateToMerge?.confirmation_staged_at),
  );
  let confReviewedAt = minIso(
    strOrNull(existing?.confirmation_reviewed_at),
    strOrNull(draftStateToMerge?.confirmation_reviewed_at),
  );
  let confAppliedAt = minIso(
    strOrNull(existing?.confirmation_applied_at),
    strOrNull(draftStateToMerge?.confirmation_applied_at),
  );
  let confRejectedAt = minIso(
    strOrNull(existing?.confirmation_rejected_at),
    strOrNull(draftStateToMerge?.confirmation_rejected_at),
  );
  let confAmendedAt = minIso(
    strOrNull(existing?.confirmation_amended_at),
    strOrNull(draftStateToMerge?.confirmation_amended_at),
  );
  let confCancelledAt = minIso(
    strOrNull(existing?.confirmation_cancelled_at),
    strOrNull(draftStateToMerge?.confirmation_cancelled_at),
  );
  let latestConfProvJson =
    strOrNull(existing?.latest_confirmation_provenance_json) ||
    strOrNull(draftStateToMerge?.latest_confirmation_provenance_json);

  let invitationSharedAt = minIso(
    strOrNull(existing?.invitation_shared_at),
    strOrNull(draftStateToMerge?.invitation_shared_at),
  );
  let invitationShareCount =
    numOrZero(existing?.invitation_share_count) + numOrZero(draftStateToMerge?.invitation_share_count);

  let companionFirstOpenedAt = minIso(
    strOrNull(existing?.companion_first_opened_at),
    strOrNull(draftStateToMerge?.companion_first_opened_at),
  );
  let companionFirstContributedAt = minIso(
    strOrNull(existing?.companion_first_contributed_at),
    strOrNull(draftStateToMerge?.companion_first_contributed_at),
  );

  const companionKeysSet = new Set<string>();
  for (const rawJson of [
    strOrNull(existing?.companion_keys_json),
    strOrNull(draftStateToMerge?.companion_keys_json),
  ]) {
    if (rawJson) {
      try {
        for (const k of JSON.parse(rawJson) as string[]) {
          if (k) companionKeysSet.add(k);
        }
      } catch {
        // ignore
      }
    }
  }

  const mergedCompanionMap: Record<string, string> = {};
  for (const rawJson of [
    strOrNull(existing?.merged_companion_map_json),
    strOrNull(draftStateToMerge?.merged_companion_map_json),
  ]) {
    if (rawJson) {
      try {
        Object.assign(mergedCompanionMap, JSON.parse(rawJson));
      } catch {
        // ignore
      }
    }
  }

  let latestPartyHeadcount: number | null =
    typeof existing?.latest_party_headcount === "number"
      ? Number(existing.latest_party_headcount)
      : typeof draftStateToMerge?.latest_party_headcount === "number"
        ? Number(draftStateToMerge.latest_party_headcount)
        : null;

  let laterSessionReturnAt = minIso(
    strOrNull(existing?.later_session_return_at),
    strOrNull(draftStateToMerge?.later_session_return_at),
  );
  let laterDayD1ReturnAt = minIso(
    strOrNull(existing?.later_day_d1_return_at),
    strOrNull(draftStateToMerge?.later_day_d1_return_at),
  );
  let laterDayD7ReturnAt = minIso(
    strOrNull(existing?.later_day_d7_return_at),
    strOrNull(draftStateToMerge?.later_day_d7_return_at),
  );

  let sellerHandoffAt = minIso(
    strOrNull(existing?.seller_handoff_at),
    strOrNull(draftStateToMerge?.seller_handoff_at),
  );
  let sellerHandoffCount =
    numOrZero(existing?.seller_handoff_count) + numOrZero(draftStateToMerge?.seller_handoff_count);

  let confirmedOutcomeAt = minIso(
    strOrNull(existing?.confirmed_outcome_at),
    strOrNull(draftStateToMerge?.confirmed_outcome_at),
  );
  let confirmedOutcomeType =
    strOrNull(existing?.confirmed_outcome_type) || strOrNull(draftStateToMerge?.confirmed_outcome_type);
  let confirmedGrossUsd =
    numOrZero(existing?.confirmed_gross_usd) + numOrZero(draftStateToMerge?.confirmed_gross_usd);
  let confirmedCommissionUsd =
    numOrZero(existing?.confirmed_commission_usd) +
    numOrZero(draftStateToMerge?.confirmed_commission_usd);

  const organizerSubjectId =
    strOrNull(existing?.organizer_subject_id) ||
    strOrNull(draftStateToMerge?.organizer_subject_id) ||
    (rec.participantRole !== "companion_claimed_slot" &&
    rec.participantRole !== "companion_self_joined"
      ? rec.reportingSubjectId
      : null);

  const organizerFirstSessionKey =
    strOrNull(existing?.organizer_first_session_key) ||
    strOrNull(draftStateToMerge?.organizer_first_session_key) ||
    rec.sessionKey;

  if (typeof rec.partyHeadcountTotal === "number" && rec.partyHeadcountTotal >= 1) {
    latestPartyHeadcount = rec.partyHeadcountTotal;
  }

  // Apply current milestone
  switch (rec.eventType) {
    case "planning_entry_selected":
      entrySelectedAt = minIso(entrySelectedAt, rec.occurredAt);
      break;
    case "trip_draft_started":
      draftStartedAt = minIso(draftStartedAt, rec.occurredAt);
      break;
    case "trip_persisted":
      persistedAt = minIso(persistedAt, rec.occurredAt);
      break;
    case "trip_customized":
      if (!rec.isTemplateOrHydration && !rec.isNoOpSave) {
        firstCustomizedAt = minIso(firstCustomizedAt, rec.occurredAt);
        customizationCount += 1;
      }
      break;
    case "confirmation_staged":
      confStagedAt = minIso(confStagedAt, rec.occurredAt);
      if (rec.confirmationProvenance) latestConfProvJson = JSON.stringify(rec.confirmationProvenance);
      break;
    case "confirmation_reviewed_edited":
      confReviewedAt = minIso(confReviewedAt, rec.occurredAt);
      if (rec.confirmationProvenance) latestConfProvJson = JSON.stringify(rec.confirmationProvenance);
      break;
    case "confirmation_applied":
      confReviewedAt = minIso(confReviewedAt, rec.occurredAt);
      confAppliedAt = minIso(confAppliedAt, rec.occurredAt);
      if (rec.confirmationProvenance) latestConfProvJson = JSON.stringify(rec.confirmationProvenance);
      break;
    case "confirmation_rejected":
      confReviewedAt = minIso(confReviewedAt, rec.occurredAt);
      confRejectedAt = minIso(confRejectedAt, rec.occurredAt);
      if (rec.confirmationProvenance) latestConfProvJson = JSON.stringify(rec.confirmationProvenance);
      break;
    case "confirmation_amended":
      confReviewedAt = minIso(confReviewedAt, rec.occurredAt);
      confAmendedAt = minIso(confAmendedAt, rec.occurredAt);
      if (rec.confirmationProvenance) latestConfProvJson = JSON.stringify(rec.confirmationProvenance);
      break;
    case "confirmation_cancelled":
      confCancelledAt = minIso(confCancelledAt, rec.occurredAt);
      if (rec.confirmationProvenance) latestConfProvJson = JSON.stringify(rec.confirmationProvenance);
      break;
    case "invitation_shared":
      // Explicitly distinct from companion collaboration!
      invitationSharedAt = minIso(invitationSharedAt, rec.occurredAt);
      invitationShareCount += 1;
      break;
    case "companion_participated": {
      if (rec.participantRole !== "organizer" && rec.participantRole !== "viewer") {
        companionFirstOpenedAt = minIso(companionFirstOpenedAt, rec.occurredAt);
        if (rec.subMilestone !== "opened_authenticated") {
          companionFirstContributedAt = minIso(companionFirstContributedAt, rec.occurredAt);
        }
        if (rec.participantKey) {
          const canonicalCompanion = mergedCompanionMap[rec.participantKey] || rec.participantKey;
          companionKeysSet.add(canonicalCompanion);
        }
      }
      break;
    }
    case "participant_merged": {
      if (rec.mergedFromParticipantKey && rec.participantKey) {
        mergedCompanionMap[rec.mergedFromParticipantKey] = rec.participantKey;
        if (companionKeysSet.has(rec.mergedFromParticipantKey)) {
          companionKeysSet.delete(rec.mergedFromParticipantKey);
          companionKeysSet.add(rec.participantKey);
        }
      }
      break;
    }
    case "trip_returned_later":
      laterSessionReturnAt = minIso(laterSessionReturnAt, rec.occurredAt);
      if (persistedAt) {
        const deltaMs = Date.parse(rec.occurredAt) - Date.parse(persistedAt);
        if (deltaMs >= 24 * 3600_000) {
          laterDayD1ReturnAt = minIso(laterDayD1ReturnAt, rec.occurredAt);
        }
        if (deltaMs >= 7 * 24 * 3600_000) {
          laterDayD7ReturnAt = minIso(laterDayD7ReturnAt, rec.occurredAt);
        }
      }
      break;
    case "seller_handoff_initiated":
      sellerHandoffAt = minIso(sellerHandoffAt, rec.occurredAt);
      sellerHandoffCount += 1;
      break;
    case "booking_outcome_confirmed":
      if (rec.outcomeType === "cancelled" || rec.outcomeType === "refunded") {
        confirmedOutcomeType = rec.outcomeType;
        confirmedGrossUsd = 0;
        confirmedCommissionUsd = 0;
      } else {
        confirmedOutcomeAt = minIso(confirmedOutcomeAt, rec.occurredAt);
        confirmedOutcomeType = rec.outcomeType || "confirmed_paid";
        if (typeof rec.grossAmountUsd === "number") confirmedGrossUsd += rec.grossAmountUsd;
        if (typeof rec.commissionAmountUsd === "number") {
          confirmedCommissionUsd += rec.commissionAmountUsd;
        }
      }
      break;
    default:
      break;
  }

  // Automatic return detection on any real traveler interaction after `persistedAt`
  if (
    persistedAt &&
    rec.participantRole !== "system" &&
    rec.eventType !== "trip_persisted" &&
    rec.eventType !== "booking_outcome_confirmed"
  ) {
    const deltaMs = Date.parse(rec.occurredAt) - Date.parse(persistedAt);
    if (
      deltaMs >= 30 * 60 * 1000 &&
      (!rec.sessionKey || rec.sessionKey !== organizerFirstSessionKey)
    ) {
      laterSessionReturnAt = minIso(laterSessionReturnAt, rec.occurredAt);
    }
    if (deltaMs >= 24 * 3600_000) {
      laterDayD1ReturnAt = minIso(laterDayD1ReturnAt, rec.occurredAt);
    }
    if (deltaMs >= 7 * 24 * 3600_000) {
      laterDayD7ReturnAt = minIso(laterDayD7ReturnAt, rec.occurredAt);
    }
  }

  const originSiteId =
    strOrNull(existing?.origin_site_id) ||
    strOrNull(draftStateToMerge?.origin_site_id) ||
    rec.siteId;
  const journeyKind =
    rec.journeyKind ||
    strOrNull(existing?.journey_kind) ||
    strOrNull(draftStateToMerge?.journey_kind) ||
    "cruise_sailing";
  const contentFamily =
    strOrNull(existing?.content_family) ||
    strOrNull(draftStateToMerge?.content_family) ||
    rec.contentFamily;
  const physicalSailingId =
    rec.physicalSailingId ||
    strOrNull(existing?.physical_sailing_id) ||
    strOrNull(draftStateToMerge?.physical_sailing_id);
  const hostedDepartureId =
    rec.hostedDepartureId ||
    strOrNull(existing?.hosted_departure_id) ||
    strOrNull(draftStateToMerge?.hosted_departure_id);
  const firstTouchUtmSource =
    strOrNull(existing?.first_touch_utm_source) ||
    strOrNull(draftStateToMerge?.first_touch_utm_source) ||
    rec.utmSource;
  const firstTouchReferrer =
    strOrNull(existing?.first_touch_referrer_domain) ||
    strOrNull(draftStateToMerge?.first_touch_referrer_domain) ||
    rec.referrerDomain;

  db.prepare(
    `INSERT INTO dcc_analytics_trip_state (
       environment, trip_unit_key, analytics_trip_key, draft_key_hash,
       origin_site_id, journey_kind, content_family, physical_sailing_id, hosted_departure_id,
       organizer_subject_id, organizer_first_session_key,
       entry_selected_at, draft_started_at, persisted_at,
       first_customized_at, customization_count,
       confirmation_staged_at, confirmation_reviewed_at, confirmation_applied_at,
       confirmation_rejected_at, confirmation_amended_at, confirmation_cancelled_at,
       latest_confirmation_provenance_json,
       invitation_shared_at, invitation_share_count,
       companion_first_opened_at, companion_first_contributed_at,
       companion_keys_json, merged_companion_map_json, latest_party_headcount,
       later_session_return_at, later_day_d1_return_at, later_day_d7_return_at,
       seller_handoff_at, seller_handoff_count,
       confirmed_outcome_at, confirmed_outcome_type, confirmed_gross_usd, confirmed_commission_usd,
       first_touch_utm_source, first_touch_referrer_domain, updated_at
     ) VALUES (
       ?, ?, ?, ?,
       ?, ?, ?, ?, ?,
       ?, ?,
       ?, ?, ?,
       ?, ?,
       ?, ?, ?,
       ?, ?, ?,
       ?,
       ?, ?,
       ?, ?,
       ?, ?, ?,
       ?, ?, ?,
       ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?
     )
     ON CONFLICT(environment, trip_unit_key) DO UPDATE SET
       analytics_trip_key = COALESCE(excluded.analytics_trip_key, dcc_analytics_trip_state.analytics_trip_key),
       draft_key_hash = COALESCE(excluded.draft_key_hash, dcc_analytics_trip_state.draft_key_hash),
       journey_kind = excluded.journey_kind,
       physical_sailing_id = COALESCE(excluded.physical_sailing_id, dcc_analytics_trip_state.physical_sailing_id),
       hosted_departure_id = COALESCE(excluded.hosted_departure_id, dcc_analytics_trip_state.hosted_departure_id),
       organizer_subject_id = COALESCE(dcc_analytics_trip_state.organizer_subject_id, excluded.organizer_subject_id),
       organizer_first_session_key = COALESCE(dcc_analytics_trip_state.organizer_first_session_key, excluded.organizer_first_session_key),
       entry_selected_at = excluded.entry_selected_at,
       draft_started_at = excluded.draft_started_at,
       persisted_at = excluded.persisted_at,
       first_customized_at = excluded.first_customized_at,
       customization_count = excluded.customization_count,
       confirmation_staged_at = excluded.confirmation_staged_at,
       confirmation_reviewed_at = excluded.confirmation_reviewed_at,
       confirmation_applied_at = excluded.confirmation_applied_at,
       confirmation_rejected_at = excluded.confirmation_rejected_at,
       confirmation_amended_at = excluded.confirmation_amended_at,
       confirmation_cancelled_at = excluded.confirmation_cancelled_at,
       latest_confirmation_provenance_json = excluded.latest_confirmation_provenance_json,
       invitation_shared_at = excluded.invitation_shared_at,
       invitation_share_count = excluded.invitation_share_count,
       companion_first_opened_at = excluded.companion_first_opened_at,
       companion_first_contributed_at = excluded.companion_first_contributed_at,
       companion_keys_json = excluded.companion_keys_json,
       merged_companion_map_json = excluded.merged_companion_map_json,
       latest_party_headcount = excluded.latest_party_headcount,
       later_session_return_at = excluded.later_session_return_at,
       later_day_d1_return_at = excluded.later_day_d1_return_at,
       later_day_d7_return_at = excluded.later_day_d7_return_at,
       seller_handoff_at = excluded.seller_handoff_at,
       seller_handoff_count = excluded.seller_handoff_count,
       confirmed_outcome_at = excluded.confirmed_outcome_at,
       confirmed_outcome_type = excluded.confirmed_outcome_type,
       confirmed_gross_usd = excluded.confirmed_gross_usd,
       confirmed_commission_usd = excluded.confirmed_commission_usd,
       first_touch_utm_source = COALESCE(dcc_analytics_trip_state.first_touch_utm_source, excluded.first_touch_utm_source),
       first_touch_referrer_domain = COALESCE(dcc_analytics_trip_state.first_touch_referrer_domain, excluded.first_touch_referrer_domain),
       updated_at = excluded.updated_at`,
  ).run(
    rec.environment,
    tripUnitKey,
    resolvedAtk,
    draftKeyHash,
    originSiteId,
    journeyKind,
    contentFamily,
    physicalSailingId,
    hostedDepartureId,
    organizerSubjectId,
    organizerFirstSessionKey,
    entrySelectedAt,
    draftStartedAt,
    persistedAt,
    firstCustomizedAt,
    customizationCount,
    confStagedAt,
    confReviewedAt,
    confAppliedAt,
    confRejectedAt,
    confAmendedAt,
    confCancelledAt,
    latestConfProvJson,
    invitationSharedAt,
    invitationShareCount,
    companionFirstOpenedAt,
    companionFirstContributedAt,
    JSON.stringify(Array.from(companionKeysSet)),
    JSON.stringify(mergedCompanionMap),
    latestPartyHeadcount,
    laterSessionReturnAt,
    laterDayD1ReturnAt,
    laterDayD7ReturnAt,
    sellerHandoffAt,
    sellerHandoffCount,
    confirmedOutcomeAt,
    confirmedOutcomeType,
    confirmedGrossUsd,
    confirmedCommissionUsd,
    firstTouchUtmSource,
    firstTouchReferrer,
    nowIso,
  );
}

/**
 * Purges or archives synthetic/expired records cleanly by flag or retention cutoff.
 */
export function purgeSyntheticOrExpiredAnalyticsRecords(params: {
  environment?: string;
  onlyQaOrSynthetic?: boolean;
  olderThanIso?: string;
}): { deletedEventsCount: number; deletedQueueCount: number; deletedTripsCount: number } {
  const db = getAnalyticsSqliteDb();
  let deletedEventsCount = 0;
  let deletedQueueCount = 0;
  let deletedTripsCount = 0;

  db.exec("BEGIN IMMEDIATE TRANSACTION;");
  try {
    if (params.onlyQaOrSynthetic) {
      const envFilter = params.environment || "preview";
      deletedEventsCount = db
        .prepare(
          "DELETE FROM dcc_analytics_events WHERE environment = ? AND traffic_class = 'qa_or_synthetic'",
        )
        .run(envFilter).changes;
      deletedQueueCount = db
        .prepare(
          "DELETE FROM dcc_analytics_ingest_queue WHERE environment = ? AND traffic_class = 'qa_or_synthetic'",
        )
        .run(envFilter).changes;
      db.prepare(
        "DELETE FROM dcc_analytics_hourly_rollups WHERE environment = ? AND traffic_class = 'qa_or_synthetic'",
      ).run(envFilter);
      db.prepare("DELETE FROM dcc_analytics_report_cache WHERE environment = ?").run(envFilter);
    } else if (params.olderThanIso) {
      deletedEventsCount = db
        .prepare("DELETE FROM dcc_analytics_events WHERE occurred_at < ?")
        .run(params.olderThanIso).changes;
      deletedQueueCount = db
        .prepare(
          "DELETE FROM dcc_analytics_ingest_queue WHERE status = 'processed' AND received_at < ?",
        )
        .run(params.olderThanIso).changes;
      deletedTripsCount = db
        .prepare("DELETE FROM dcc_analytics_trip_state WHERE updated_at < ?")
        .run(params.olderThanIso).changes;
      db.prepare("DELETE FROM dcc_analytics_report_cache").run();
    }
    db.exec("COMMIT;");
  } catch (err) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // ignore
    }
    throw err;
  }

  return { deletedEventsCount, deletedQueueCount, deletedTripsCount };
}
