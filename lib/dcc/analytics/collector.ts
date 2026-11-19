import crypto from "node:crypto";
import {
  ANALYTICS_SCHEMA_VERSION,
  AnalyticsCollectBatchSchema,
  AnalyticsIngestEventSchema,
  classifyContentFamily,
  resolveCanonicalAnalyticsSite,
  resolveEventLayer,
  type AnalyticsEventType,
  type AnalyticsIngestEventInput,
} from "./contract";
import {
  bucketizeTravelDateHint,
  deriveAnalyticsTripKey,
  deriveDraftKeyHash,
  deriveParticipantAnalyticsKey,
  deriveReportingSessionKey,
  deriveReportingSubjectId,
  sanitizeAnalyticsPath,
  sanitizeAnalyticsProps,
  sanitizeCampaignToken,
  sanitizeReferrerDomain,
} from "./identityAndPrivacy";
import {
  classifyEventTraffic,
  resolveAuthoritativeEnvironment,
} from "./classification";
import {
  enqueueNormalizedAnalyticsBatch,
  getAnalyticsSqliteDb,
  incrementHealthCounter,
  type NormalizedAnalyticsRecord,
} from "./store";

export const MAX_COLLECT_BODY_BYTES = 32_768;
export const MAX_EVENTS_PER_BATCH = 25;

const RATE_WINDOW_MS = 60_000;
const VELOCITY_SUSPECT_PAGEVIEWS_PER_MIN = 45;
const HARD_RATE_LIMIT_REQUESTS_PER_MIN = 240;

interface VelocityBucket {
  requests: number;
  pageviews: number;
  resetAt: number;
}

const velocityMap = new Map<string, VelocityBucket>();

export function resetCollectorVelocityBucketsForTests(): void {
  velocityMap.clear();
}

function safeTimingEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function isAnalyticsKillSwitchEnabled(): boolean {
  const v = (process.env.DCC_ANALYTICS_KILL_SWITCH || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}

export function verifyCollectorServerAuth(headers: Headers): boolean {
  const candidate =
    headers.get("x-dcc-internal-secret")?.trim() ||
    headers.get("x-dcc-service-secret")?.trim() ||
    headers.get("x-internal-secret")?.trim() ||
    (() => {
      const auth = headers.get("authorization")?.trim() || "";
      const m = /^Bearer\s+(.+)$/i.exec(auth);
      return m?.[1]?.trim() || "";
    })();

  if (!candidate) return false;

  const secrets = [
    process.env.INTERNAL_API_SECRET?.trim(),
    process.env.DCC_CP_SERVICE_SECRET?.trim(),
    process.env.DCC_NETWORK_ATTRIBUTION_TOKEN?.trim(),
    process.env.DCC_ANALYTICS_COLLECTOR_SECRET?.trim(),
    process.env.DCC_ANALYTICS_INTERNAL_SECRET?.trim(),
  ].filter((s): s is string => Boolean(s && s.length > 0));

  if (process.env.VERCEL_ENV !== "production") {
    secrets.push("dcc-nonprod-internal-collector-v2");
  }

  for (const s of secrets) {
    if (safeTimingEqual(candidate, s)) return true;
  }
  return false;
}

function extractClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip")?.trim() || "unknown";
}

function evaluateVelocity(
  headers: Headers,
  pageviewIncrement: number,
  hasServerAuth: boolean,
): { hardRateLimited: boolean; isVelocityBurst: boolean } {
  if (hasServerAuth) {
    return { hardRateLimited: false, isVelocityBurst: false };
  }
  const now = Date.now();
  if (velocityMap.size > 4000) {
    for (const [k, b] of velocityMap.entries()) {
      if (b.resetAt <= now) velocityMap.delete(k);
    }
  }
  const ip = extractClientIp(headers);
  const ua = (headers.get("user-agent") || "").slice(0, 64);
  const key = `${ip}|${ua}`;
  const existing = velocityMap.get(key);
  if (!existing || existing.resetAt <= now) {
    velocityMap.set(key, {
      requests: 1,
      pageviews: pageviewIncrement,
      resetAt: now + RATE_WINDOW_MS,
    });
    return {
      hardRateLimited: false,
      isVelocityBurst: pageviewIncrement > VELOCITY_SUSPECT_PAGEVIEWS_PER_MIN,
    };
  }
  existing.requests += 1;
  existing.pageviews += pageviewIncrement;
  return {
    hardRateLimited: existing.requests > HARD_RATE_LIMIT_REQUESTS_PER_MIN,
    isVelocityBurst: existing.pageviews > VELOCITY_SUSPECT_PAGEVIEWS_PER_MIN,
  };
}

function normalizeOccurredAt(rawIso: string | undefined, receivedIso: string): string {
  if (!rawIso) return receivedIso;
  const parsedMs = Date.parse(rawIso);
  const receivedMs = Date.parse(receivedIso);
  if (!Number.isFinite(parsedMs)) return receivedIso;
  // Clamp future client clock skew (> 5 minutes ahead of server receipt) to receivedIso
  if (parsedMs > receivedMs + 5 * 60 * 1000) {
    return receivedIso;
  }
  return new Date(parsedMs).toISOString();
}

export interface CollectBatchResult {
  ok: boolean;
  status: number;
  accepted: boolean;
  queuedCount: number;
  deduplicatedCount: number;
  rejectedInvalidCount: number;
  rejectedUnauthorizedOutcomeCount: number;
  droppedBackpressureCount: number;
  error?: string;
  reason?: string;
}

export function collectAnalyticsRawPayload(params: {
  rawBodyText: string;
  headers: Headers;
  maxQueueDepth?: number;
}): CollectBatchResult {
  if (isAnalyticsKillSwitchEnabled()) {
    try {
      const db = getAnalyticsSqliteDb();
      incrementHealthCounter(db, "dropped_kill_switch_total", 1);
    } catch {
      // kill switch must never fail even if DB is down
    }
    return {
      ok: true,
      status: 202,
      accepted: false,
      queuedCount: 0,
      deduplicatedCount: 0,
      rejectedInvalidCount: 0,
      rejectedUnauthorizedOutcomeCount: 0,
      droppedBackpressureCount: 0,
      reason: "kill_switch_active",
    };
  }

  const byteLen = Buffer.byteLength(params.rawBodyText, "utf8");
  if (byteLen > MAX_COLLECT_BODY_BYTES) {
    return {
      ok: false,
      status: 413,
      accepted: false,
      queuedCount: 0,
      deduplicatedCount: 0,
      rejectedInvalidCount: 1,
      rejectedUnauthorizedOutcomeCount: 0,
      droppedBackpressureCount: 0,
      error: "payload_too_large",
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(params.rawBodyText);
  } catch {
    try {
      const db = getAnalyticsSqliteDb();
      incrementHealthCounter(db, "rejected_invalid_total", 1);
    } catch {
      // ignore
    }
    return {
      ok: false,
      status: 400,
      accepted: false,
      queuedCount: 0,
      deduplicatedCount: 0,
      rejectedInvalidCount: 1,
      rejectedUnauthorizedOutcomeCount: 0,
      droppedBackpressureCount: 0,
      error: "invalid_json",
    };
  }

  // Accept either `{ events: [...] }` batch or single event object
  let rawEvents: unknown[];
  let deliveryId: string | null = null;
  if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson) && "events" in parsedJson) {
    const batchCandidate = parsedJson as { deliveryId?: unknown; events?: unknown };
    if (!Array.isArray(batchCandidate.events) || batchCandidate.events.length === 0) {
      try {
        const db = getAnalyticsSqliteDb();
        incrementHealthCounter(db, "rejected_invalid_total", 1);
      } catch {
        // ignore
      }
      return {
        ok: false,
        status: 400,
        accepted: false,
        queuedCount: 0,
        deduplicatedCount: 0,
        rejectedInvalidCount: 1,
        rejectedUnauthorizedOutcomeCount: 0,
        droppedBackpressureCount: 0,
        error: "empty_or_invalid_batch",
      };
    }
    if (batchCandidate.events.length > MAX_EVENTS_PER_BATCH) {
      return {
        ok: false,
        status: 400,
        accepted: false,
        queuedCount: 0,
        deduplicatedCount: 0,
        rejectedInvalidCount: batchCandidate.events.length,
        rejectedUnauthorizedOutcomeCount: 0,
        droppedBackpressureCount: 0,
        error: "batch_exceeds_max_events",
      };
    }
    rawEvents = batchCandidate.events;
    deliveryId =
      typeof batchCandidate.deliveryId === "string"
        ? batchCandidate.deliveryId.trim().slice(0, 128)
        : null;
  } else {
    rawEvents = [parsedJson];
  }

  const hasServerAuth = verifyCollectorServerAuth(params.headers);
  const validInputs: AnalyticsIngestEventInput[] = [];
  let rejectedInvalidCount = 0;
  let rejectedUnauthorizedOutcomeCount = 0;

  for (const item of rawEvents) {
    const res = AnalyticsIngestEventSchema.safeParse(item);
    if (!res.success) {
      rejectedInvalidCount += 1;
      continue;
    }
    if (res.data.eventType === "booking_outcome_confirmed" && !hasServerAuth) {
      rejectedUnauthorizedOutcomeCount += 1;
      continue;
    }
    if (res.data.eventType === "trip_deleted" && !hasServerAuth) {
      rejectedUnauthorizedOutcomeCount += 1;
      continue;
    }
    validInputs.push(res.data);
  }

  const pageviewsInBatch = validInputs.filter((e) => e.eventType === "page_viewed").length;
  const velocity = evaluateVelocity(params.headers, pageviewsInBatch, hasServerAuth);
  if (velocity.hardRateLimited) {
    return {
      ok: false,
      status: 429,
      accepted: false,
      queuedCount: 0,
      deduplicatedCount: 0,
      rejectedInvalidCount,
      rejectedUnauthorizedOutcomeCount,
      droppedBackpressureCount: validInputs.length,
      error: "rate_limited",
    };
  }

  if (validInputs.length === 0) {
    try {
      const db = getAnalyticsSqliteDb();
      if (rejectedInvalidCount > 0) {
        incrementHealthCounter(db, "rejected_invalid_total", rejectedInvalidCount);
      }
      if (rejectedUnauthorizedOutcomeCount > 0) {
        incrementHealthCounter(
          db,
          "rejected_unauthorized_outcome_total",
          rejectedUnauthorizedOutcomeCount,
        );
      }
    } catch {
      // ignore if store unavailable on invalid payload
    }
    const status = rejectedUnauthorizedOutcomeCount > 0 ? 403 : 400;
    return {
      ok: false,
      status,
      accepted: false,
      queuedCount: 0,
      deduplicatedCount: 0,
      rejectedInvalidCount,
      rejectedUnauthorizedOutcomeCount,
      droppedBackpressureCount: 0,
      error:
        rejectedUnauthorizedOutcomeCount > 0
          ? "unauthorized_outcome_or_admin_event"
          : "invalid_event_schema",
    };
  }

  const receivedIso = new Date().toISOString();
  const originHeader = params.headers.get("origin");
  const refererHeader = params.headers.get("referer");
  const hostHeader = params.headers.get("x-forwarded-host") || params.headers.get("host");

  // Read first-party `_dcc_aid` cookie as fallback browserSeed when same-origin
  const cookieHeader = params.headers.get("cookie") || "";
  const cookieSeedMatch = cookieHeader.match(/(?:^|;\s*)_dcc_aid=([A-Za-z0-9_-]{8,96})/);
  const cookieBrowserSeed = cookieSeedMatch?.[1] || null;
  const hasRedeemedCtxCookie =
    /(?:^|;\s*)(?:dcc_trip_ctx|cp_trip_ctx|lfse_trip_ctx|jfd_checkout_session|wtno_trip_ctx|wts_trip_ctx|vat_trip_ctx|gosno_trip_ctx|parr_trip_ctx|feastly_trip_ctx|brinkberry_trip_ctx|ap420_trip_ctx)=[^;]+/.test(
      cookieHeader,
    );

  const normalizedRecords: NormalizedAnalyticsRecord[] = validInputs.map((ev) => {
    const { siteId, entry } = resolveCanonicalAnalyticsSite(ev.site);
    const environment = resolveAuthoritativeEnvironment({
      claimedEnvironment: ev.environment,
      originHeader,
      refererHeader,
      hostHeader,
    });

    const effectiveBrowserSeed = ev.browserSeed || cookieBrowserSeed;
    const classification = classifyEventTraffic({
      eventType: ev.eventType,
      environment,
      headers: params.headers,
      hasServerAuth,
      isTestFlag: ev.isTest,
      isSyntheticSample: ev.isSyntheticSample,
      rawPathOrUrl: ev.path || ev.landingPath,
      utmCampaign: ev.utmCampaign,
      utmSource: ev.utmSource,
      browserSeed: effectiveBrowserSeed,
      sessionId: ev.sessionId,
      handoffId: ev.handoffId,
      clickId: ev.clickId,
      tripIdentifier: ev.tripIdentifier,
      isVelocityBurst: velocity.isVelocityBurst,
    });

    const occurredAt = normalizeOccurredAt(ev.occurredAt, receivedIso);
    const canonicalPath = sanitizeAnalyticsPath(ev.path);
    const landingPath = sanitizeAnalyticsPath(ev.landingPath || ev.path);
    const referrerDomain = sanitizeReferrerDomain(
      ev.referrer || refererHeader,
      entry?.canonicalDomain || null,
    );

    const { reportingSubjectId, keyVersion } = deriveReportingSubjectId({
      siteId,
      browserSeed: effectiveBrowserSeed,
    });
    const sessionKey = deriveReportingSessionKey({
      siteId,
      sessionId: ev.sessionId || effectiveBrowserSeed,
      keyVersion,
    });

    const analyticsTripKey = deriveAnalyticsTripKey({
      rawTripIdentifier: ev.tripIdentifier,
      precomputedAnalyticsTripKey: ev.analyticsTripKey,
      keyVersion,
    });
    const draftKeyHash = deriveDraftKeyHash(ev.draftKey, keyVersion);
    const participantKey = deriveParticipantAnalyticsKey({
      analyticsTripKey,
      rawParticipantKey: ev.participantKey,
      keyVersion,
    });
    const mergedFromParticipantKey = deriveParticipantAnalyticsKey({
      analyticsTripKey,
      rawParticipantKey: ev.mergedFromParticipantKey,
      keyVersion,
    });

    const contentFamily = classifyContentFamily({
      siteId,
      canonicalPath,
      explicitFamily: ev.contentFamily,
      journeyKind: ev.journeyKind,
    });

    const continuityTier =
      ev.continuityTier ||
      (ev.contextTokenPresent || hasRedeemedCtxCookie
        ? "verified_dcc_ctx"
        : ev.handoffId || ev.utmSource
          ? "public_param_referral"
          : "none");

    const targetSiteResolved = ev.targetSite
      ? resolveCanonicalAnalyticsSite(ev.targetSite).siteId
      : null;

    const leadTimeBucket =
      ev.leadTimeBucket || bucketizeTravelDateHint(ev.travelDateHint, occurredAt);

    return {
      logicalEventId: ev.logicalEventId.trim(),
      deliveryId,
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      eventType: ev.eventType,
      layer: resolveEventLayer(ev.eventType),
      environment,
      siteId,
      rawSiteInput: ev.site.trim().slice(0, 80),
      trafficClass: classification.trafficClass,
      classificationReason: classification.classificationReason,
      occurredAt,
      receivedAt: receivedIso,
      reportingSubjectId,
      keyVersion,
      sessionKey,
      navigationType: ev.navigationType || null,
      canonicalPath,
      landingPath,
      referrerDomain,
      utmSource: sanitizeCampaignToken(ev.utmSource, 64),
      utmMedium: sanitizeCampaignToken(ev.utmMedium, 64),
      utmCampaign: sanitizeCampaignToken(ev.utmCampaign, 96),
      contentFamily,
      handoffId: sanitizeCampaignToken(ev.handoffId, 96),
      clickId: sanitizeCampaignToken(ev.clickId, 96),
      continuityTier,
      targetSiteId: targetSiteResolved,
      provider: sanitizeCampaignToken(ev.provider, 48),
      productCode: sanitizeCampaignToken(ev.productCode, 80),
      physicalSailingId: sanitizeCampaignToken(ev.physicalSailingId, 120),
      hostedDepartureId: sanitizeCampaignToken(ev.hostedDepartureId, 120),
      journeyKind: sanitizeCampaignToken(ev.journeyKind, 48),
      draftKeyHash,
      analyticsTripKey,
      participantRole: ev.participantRole || null,
      participantKey,
      mergedFromParticipantKey,
      partyHeadcountTotal: ev.partyHeadcountTotal ?? null,
      subMilestone: sanitizeCampaignToken(ev.subMilestone, 48),
      isTemplateOrHydration: Boolean(ev.isTemplateOrHydration),
      isNoOpSave: Boolean(ev.isNoOpSave),
      leadTimeBucket: leadTimeBucket || null,
      confirmationProvenance: ev.confirmationProvenance || null,
      outcomeType: ev.outcomeType || null,
      grossAmountUsd: typeof ev.grossAmountUsd === "number" ? ev.grossAmountUsd : null,
      commissionAmountUsd: typeof ev.commissionAmountUsd === "number" ? ev.commissionAmountUsd : null,
      props: sanitizeAnalyticsProps(ev.props),
    };
  });

  try {
    const db = getAnalyticsSqliteDb();
    if (rejectedInvalidCount > 0) {
      incrementHealthCounter(db, "rejected_invalid_total", rejectedInvalidCount, receivedIso);
    }
    if (rejectedUnauthorizedOutcomeCount > 0) {
      incrementHealthCounter(
        db,
        "rejected_unauthorized_outcome_total",
        rejectedUnauthorizedOutcomeCount,
        receivedIso,
      );
    }

    const enqueued = enqueueNormalizedAnalyticsBatch({
      records: normalizedRecords,
      maxQueueDepth: params.maxQueueDepth,
    });

    return {
      ok: true,
      status: 202,
      accepted: enqueued.queuedCount > 0 || enqueued.deduplicatedCount > 0,
      queuedCount: enqueued.queuedCount,
      deduplicatedCount: enqueued.deduplicatedCount,
      rejectedInvalidCount,
      rejectedUnauthorizedOutcomeCount,
      droppedBackpressureCount: enqueued.droppedBackpressureCount,
    };
  } catch (err) {
    return {
      ok: false,
      status: 503,
      accepted: false,
      queuedCount: 0,
      deduplicatedCount: 0,
      rejectedInvalidCount,
      rejectedUnauthorizedOutcomeCount,
      droppedBackpressureCount: 0,
      error: "ingestion_store_unavailable",
      reason: err instanceof Error ? err.message : "unknown_store_error",
    };
  }
}

/**
 * Maps legacy corridor / spoke event names truthfully into v2 AnalyticsEventType WITHOUT
 * the broken fallback that previously turned generic clicks/RSVPs into `page_viewed`.
 */
export function mapLegacyEventNameToV2(rawEventName: string): {
  eventType: AnalyticsEventType | null;
  subMilestone?: string;
} {
  const name = rawEventName.trim().toLowerCase();
  if (
    name === "page_viewed" ||
    name === "landing_viewed" ||
    name === "service_page_view" ||
    name === "planner_view" ||
    name === "planner_viewed" ||
    name === "sailing_page_viewed" ||
    name === "lfse_lodge_page_view"
  ) {
    return { eventType: "page_viewed" };
  }
  if (
    name === "start_board_selected" ||
    name === "cp_sailing_started" ||
    name === "entered_guided_flow"
  ) {
    return { eventType: "planning_entry_selected" };
  }
  if (
    name === "planner_saved" ||
    name === "board_created" ||
    name === "cp_board_created" ||
    name === "plan_accepted"
  ) {
    return { eventType: "trip_persisted" };
  }
  if (name === "activity_added" || name === "plan_modified") {
    return { eventType: "trip_customized", subMilestone: name };
  }
  if (
    name === "planner_shared" ||
    name === "plan_shared" ||
    name === "invite_link_copied_or_shared"
  ) {
    return { eventType: "invitation_shared" };
  }
  if (
    name === "passenger_responded" ||
    name === "passenger_identified" ||
    name === "first_guest_joined" ||
    name === "first_activity_response"
  ) {
    return { eventType: "companion_participated", subMilestone: name };
  }
  if (name === "shared_plan_viewed" || name === "shared_plan_visited") {
    return { eventType: "page_viewed", subMilestone: "shared_plan_open" };
  }
  if (
    name === "network_handoff" ||
    name === "handoff_created" ||
    name === "outbound_transport_clicked" ||
    name === "dcc_mapping_click" ||
    name === "port_excursion_bridge_clicked"
  ) {
    return { eventType: "cross_site_handoff_clicked" };
  }
  if (name === "handoff_received" || name === "handoff_viewed" || name === "dcc_plan_opened") {
    return { eventType: "cross_site_handoff_arrived" };
  }
  if (
    name === "booking_opened" ||
    name === "booking_clicked" ||
    name === "booking_link_opened" ||
    name === "passenger_opened_booking_link" ||
    name === "booking_handoff" ||
    name === "booking_handoff_initiated" ||
    name === "checkout_started" ||
    name === "operator_cta_clicked" ||
    name === "outbound_booking_click"
  ) {
    return { eventType: "seller_handoff_initiated" };
  }
  if (
    name === "guide_engaged" ||
    name === "lfse_guide_engagement" ||
    name === "tour_fit_interaction" ||
    name === "comparison_viewed" ||
    name === "activity_viewed" ||
    name === "recommendation_rendered" ||
    name === "shortlist_rendered" ||
    name === "verdict_shown"
  ) {
    return { eventType: "guide_engaged", subMilestone: name };
  }
  if (name === "printable_view_opened" || name === "print_clicked") {
    return { eventType: "printable_view_opened" };
  }
  // Never default unknown/generic events to `page_viewed`!
  return { eventType: null };
}

/**
 * Best-effort legacy bridge so existing GoSno, PARR, FeastlySpread, WTNO, WTS, and legacy spoke
 * beacons are captured cleanly in the v2 durable queue without blocking or throwing.
 */
export function bridgeLegacyEventToV2Collector(params: {
  rawSite: string;
  rawEventName: string;
  eventId?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
  journeyId?: string | null;
  handoffId?: string | null;
  sourcePage?: string | null;
  landingPath?: string | null;
  targetPath?: string | null;
  occurredAt?: string | null;
  isTest?: boolean;
  travelDateHint?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  metadata?: Record<string, unknown>;
  headers: Headers;
  hasServerAuth?: boolean;
}): void {
  try {
    const mapped = mapLegacyEventNameToV2(params.rawEventName);
    if (!mapped.eventType) return;

    const logicalEventId =
      (params.eventId && params.eventId.trim().slice(0, 120)) ||
      `leg_${crypto.randomUUID().replace(/-/g, "")}`;

    const syntheticHeaders = new Headers(params.headers);
    if (params.hasServerAuth) {
      syntheticHeaders.set("x-dcc-internal-secret", "dcc-nonprod-internal-collector-v2");
    }

    const browserSeedCandidate = params.visitorId || params.sessionId || undefined;
    const safeProps: Record<string, string | number | boolean | null> = {};
    if (params.targetPath) safeProps.targetPath = params.targetPath.slice(0, 160);
    if (params.metadata) {
      for (const [k, v] of Object.entries(params.metadata)) {
        if (Object.keys(safeProps).length >= 16) break;
        if (typeof v === "string") safeProps[k.slice(0, 48)] = v.slice(0, 160);
        else if (typeof v === "number" && Number.isFinite(v)) safeProps[k.slice(0, 48)] = v;
        else if (typeof v === "boolean") safeProps[k.slice(0, 48)] = v;
      }
    }

    const singleEvent: AnalyticsIngestEventInput = {
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      logicalEventId,
      eventType: mapped.eventType,
      ...(params.occurredAt ? { occurredAt: params.occurredAt } : {}),
      site: params.rawSite,
      ...(browserSeedCandidate ? { browserSeed: browserSeedCandidate } : {}),
      ...(params.sessionId ? { sessionId: params.sessionId } : {}),
      ...(params.sourcePage ? { path: params.sourcePage } : {}),
      ...(params.landingPath ? { landingPath: params.landingPath } : {}),
      ...(params.handoffId || params.journeyId
        ? { handoffId: (params.handoffId || params.journeyId)! }
        : {}),
      ...(params.utmSource ? { utmSource: params.utmSource } : {}),
      ...(params.utmCampaign ? { utmCampaign: params.utmCampaign } : {}),
      ...(params.travelDateHint ? { travelDateHint: params.travelDateHint } : {}),
      ...(mapped.subMilestone ? { subMilestone: mapped.subMilestone } : {}),
      ...(params.isTest ? { isTest: true } : {}),
      ...(Object.keys(safeProps).length > 0 ? { props: safeProps } : {}),
    };

    collectAnalyticsRawPayload({
      rawBodyText: JSON.stringify(singleEvent),
      headers: syntheticHeaders,
    });
  } catch {
    // Non-blocking legacy bridge
  }
}
