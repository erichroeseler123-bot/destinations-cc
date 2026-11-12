import type { DccCorridorEventRow } from "@/lib/db/schema";

export const CRUISE_PROMENADE_FUNNEL_EVENTS = [
  "sailing_page_viewed",
  "start_board_selected",
  "board_created",
  "invite_link_copied_or_shared",
  "first_guest_joined",
  "first_activity_response",
  "charter_inquiry_opened",
  "charter_inquiry_submitted",
] as const;

export type CruisePromenadeFunnelEventName =
  (typeof CRUISE_PROMENADE_FUNNEL_EVENTS)[number];

export interface CruisePromenadeFunnelStageSummary {
  stageNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  eventName: CruisePromenadeFunnelEventName;
  label: string;
  eventCount: number;
  uniqueSessionsCount: number;
  conversionFromPriorPct: number | null;
}

export interface UninvitedBoardStartItem {
  key: string;
  shareCode: string | null;
  ship: string | null;
  sailDate: string | null;
  surface: string | null;
  createdAt: string;
}

export interface TopSailingDemandRow {
  sailingKey: string;
  shipSlug: string;
  sailDate: string;
  viewsCount: number;
  startBoardCount: number;
  boardsCreatedCount: number;
}

export const CRUISE_PROMENADE_LAUNCH_EPOCH_ISO = "2026-11-12T12:35:00.000Z";

export interface OutreachSourceAttributionRow {
  sourceLabel: string;
  sessionsCount: number;
  sailingViewsCount: number;
  startBoardCount: number;
  boardsCreatedCount: number;
  inquiriesSubmittedCount: number;
}

export interface CruisePromenadeConversionFunnelSummary {
  windowLabel: string;
  launchEpochIso: string;
  preLaunchHistoricalEventsExcluded: number;
  totalGenuineEvents28d: number;
  excludedSyntheticEvents28d: number;
  findMySailingSelectionsCount28d: number;
  findMySailingUniqueSessionsCount28d: number;
  sharedLinkVisitsCount28d: number;
  sharedLinkUniqueSessionsCount28d: number;
  stages: CruisePromenadeFunnelStageSummary[];
  startedWithoutInvitingCount: number;
  recentUninvitedStarts: UninvitedBoardStartItem[];
  topSailingsByDemand: TopSailingDemandRow[];
  outreachSourceBreakdown: OutreachSourceAttributionRow[];
}

const STAGE_LABELS: Record<CruisePromenadeFunnelEventName, string> = {
  sailing_page_viewed: "1. Sailing Page Viewed",
  start_board_selected: "2. Start Board Selected",
  board_created: "3. Board Created",
  invite_link_copied_or_shared: "4. Invite Link Copied / Shared",
  first_guest_joined: "5. First Guest Joined",
  first_activity_response: "6. First Activity Response",
  charter_inquiry_opened: "7. Private Group Inquiry Opened",
  charter_inquiry_submitted: "8. Private Group Inquiry Submitted",
};

const SYNTHETIC_TOKEN_RE =
  /\[prod-verification-test\]|\b(playwright|qa[-_\s]?probe|smoke[-_\s]?test|synthetic|e2e[-_\s]?audit|headlesschrome)\b/i;

function asRecord(val: unknown): Record<string, unknown> {
  return val && typeof val === "object" && !Array.isArray(val)
    ? (val as Record<string, unknown>)
    : {};
}

function cleanStr(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isSyntheticCruisePromenadeEvent(event: Partial<DccCorridorEventRow>): boolean {
  const meta = asRecord(event.metadata);
  const ctx = asRecord(meta.context);
  const sessionId = cleanStr(event.sessionId) || "";
  const shareCode = (cleanStr(ctx.shareCode) || "").toUpperCase();
  const ship = (cleanStr(ctx.ship) || cleanStr(ctx.shipSlug) || "").toLowerCase();
  const sailDate = cleanStr(ctx.sailDate) || "";

  if (
    meta.test === true ||
    meta.is_test === true ||
    meta.synthetic === true ||
    ctx.isTest === true
  ) {
    return true;
  }

  if (/^(smoke_|test_|qa_|e2e_|pw_)/i.test(sessionId)) {
    return true;
  }

  if (
    shareCode === "DEMO-2027" ||
    shareCode === "WHALE-SPLIT-2027" ||
    /^(DEMO-|QA-|TEST-|E2E-|SMOKE-|PILOT-)/.test(shareCode)
  ) {
    return true;
  }

  if (
    (ship === "norwegian jewel" || ship === "norwegian-jewel") &&
    sailDate === "2026-10-15"
  ) {
    return true;
  }

  const combined = `${sessionId} ${shareCode} ${ship} ${cleanStr(event.sourcePage) || ""} ${cleanStr(ctx.inquiryId) || ""}`;
  return SYNTHETIC_TOKEN_RE.test(combined);
}

function normalizeLegacyOrCurrentEventName(
  rawName: string,
): CruisePromenadeFunnelEventName | null {
  if ((CRUISE_PROMENADE_FUNNEL_EVENTS as readonly string[]).includes(rawName)) {
    return rawName as CruisePromenadeFunnelEventName;
  }
  if (rawName === "plan_shared" || rawName === "planner_shared") {
    return "invite_link_copied_or_shared";
  }
  if (rawName === "group_inquiry_submitted") {
    return "charter_inquiry_submitted";
  }
  return null;
}

export type CorridorEventInput = Partial<DccCorridorEventRow> & {
  createdAt?: Date | string | null;
};

function extractOutreachSourceLabel(
  event: CorridorEventInput,
  ctx: Record<string, unknown>,
): string {
  const explicit =
    cleanStr(ctx.utmSource) ||
    cleanStr(ctx.utm_source) ||
    cleanStr(ctx.src) ||
    cleanStr(ctx.sourceLabel);
  if (explicit) {
    return explicit.toLowerCase().replace(/[^a-z0-9_.-]+/g, "-").slice(0, 64);
  }
  const sourcePage = cleanStr(event.sourcePage) || cleanStr(event.landingPath) || "";
  if (sourcePage.includes("?")) {
    try {
      const qs = new URLSearchParams(sourcePage.slice(sourcePage.indexOf("?") + 1));
      const qSrc = (qs.get("utm_source") || qs.get("src") || qs.get("ref") || "").trim();
      if (qSrc) {
        return qSrc.toLowerCase().replace(/[^a-z0-9_.-]+/g, "-").slice(0, 64);
      }
    } catch {
      // ignore malformed query
    }
  }
  const refHost = cleanStr(ctx.referrerHost);
  if (refHost) {
    return `ref:${refHost.toLowerCase().slice(0, 60)}`;
  }
  return "direct_or_unlabeled";
}

export function buildCruisePromenadeConversionFunnelSummary(params: {
  events: ReadonlyArray<CorridorEventInput>;
  startIso: string;
  endIso: string;
  windowLabel?: string;
  launchEpochIso?: string | null;
}): CruisePromenadeConversionFunnelSummary {
  const startMs = Date.parse(params.startIso);
  const endMs = Date.parse(params.endIso);
  const launchEpochIso =
    params.launchEpochIso === undefined
      ? CRUISE_PROMENADE_LAUNCH_EPOCH_ISO
      : params.launchEpochIso || "";
  const launchEpochMs = launchEpochIso ? Date.parse(launchEpochIso) : Number.NaN;
  const windowLabel =
    params.windowLabel ||
    (Number.isFinite(launchEpochMs)
      ? "Launch Cohort (Since Nov 12, 2026)"
      : "Last 28 Days");

  const countsByStage = new Map<CruisePromenadeFunnelEventName, number>();
  const sessionsByStage = new Map<CruisePromenadeFunnelEventName, Set<string>>();
  for (const name of CRUISE_PROMENADE_FUNNEL_EVENTS) {
    countsByStage.set(name, 0);
    sessionsByStage.set(name, new Set<string>());
  }

  const boardCreatedItems = new Map<string, UninvitedBoardStartItem>();
  const invitedSessions = new Set<string>();
  const invitedShareCodes = new Set<string>();
  const sailingDemand = new Map<string, TopSailingDemandRow>();
  const sourceStats = new Map<
    string,
    {
      sessions: Set<string>;
      sailingViewsCount: number;
      startBoardCount: number;
      boardsCreatedCount: number;
      inquiriesSubmittedCount: number;
    }
  >();

  let totalGenuineEvents28d = 0;
  let excludedSyntheticEvents28d = 0;
  let preLaunchHistoricalEventsExcluded = 0;
  let findMySailingSelectionsCount28d = 0;
  const findMySailingSessions = new Set<string>();
  const sharedLinkVisitDedupeKeys = new Set<string>();
  const sharedLinkUniqueSessions = new Set<string>();

  for (const event of params.events) {
    const meta = asRecord(event.metadata);
    const site = cleanStr(meta.site);
    if (site !== "cruise-promenade") continue;

    const rawTime =
      (event.occurredAt instanceof Date
        ? event.occurredAt.toISOString()
        : cleanStr(event.occurredAt)) ||
      (event.createdAt instanceof Date
        ? event.createdAt.toISOString()
        : cleanStr(event.createdAt));

    if (rawTime) {
      const ms = Date.parse(rawTime);
      if (Number.isFinite(startMs) && Number.isFinite(endMs) && Number.isFinite(ms)) {
        if (ms < startMs || ms > endMs) continue;
      }
      if (isSyntheticCruisePromenadeEvent(event)) {
        excludedSyntheticEvents28d += 1;
        continue;
      }
      if (Number.isFinite(launchEpochMs) && Number.isFinite(ms) && ms < launchEpochMs) {
        preLaunchHistoricalEventsExcluded += 1;
        continue;
      }
    } else if (isSyntheticCruisePromenadeEvent(event)) {
      excludedSyntheticEvents28d += 1;
      continue;
    }

    totalGenuineEvents28d += 1;

    const rawOriginal = cleanStr(meta.original_event_name) || cleanStr(event.eventName) || "";
    const ctx = asRecord(meta.context);
    const sessionKey =
      cleanStr(event.sessionId) ||
      cleanStr(event.handoffId) ||
      cleanStr(event.eventId) ||
      `anon_${totalGenuineEvents28d}`;

    if (rawOriginal === "shared_plan_visited" || rawOriginal === "shared_plan_viewed") {
      const shareCodeOrPlan =
        cleanStr(ctx.shareCode)?.toUpperCase() ||
        cleanStr(ctx.plannerId)?.toLowerCase() ||
        cleanStr(event.sourcePage) ||
        "shared";
      sharedLinkVisitDedupeKeys.add(`${sessionKey}::${shareCodeOrPlan}`);
      sharedLinkUniqueSessions.add(sessionKey);
      continue;
    }

    const mappedStage = normalizeLegacyOrCurrentEventName(rawOriginal);
    if (!mappedStage) continue;

    if (mappedStage === "start_board_selected" && cleanStr(ctx.surface) === "cruise_finder") {
      findMySailingSelectionsCount28d += 1;
      findMySailingSessions.add(sessionKey);
    }

    // Avoid double-counting if both `group_inquiry_submitted` and `charter_inquiry_submitted` fire in the same session for the same inquiryId

    if (
      rawOriginal === "group_inquiry_submitted" &&
      sessionsByStage.get("charter_inquiry_submitted")?.has(sessionKey)
    ) {
      continue;
    }
    if (
      (rawOriginal === "plan_shared" || rawOriginal === "planner_shared") &&
      sessionsByStage.get("invite_link_copied_or_shared")?.has(sessionKey)
    ) {
      continue;
    }

    countsByStage.set(mappedStage, (countsByStage.get(mappedStage) || 0) + 1);
    sessionsByStage.get(mappedStage)?.add(sessionKey);

    const sourceLabel = extractOutreachSourceLabel(event, ctx);
    const srcBucket = sourceStats.get(sourceLabel) || {
      sessions: new Set<string>(),
      sailingViewsCount: 0,
      startBoardCount: 0,
      boardsCreatedCount: 0,
      inquiriesSubmittedCount: 0,
    };
    srcBucket.sessions.add(sessionKey);
    if (mappedStage === "sailing_page_viewed") srcBucket.sailingViewsCount += 1;
    if (mappedStage === "start_board_selected") srcBucket.startBoardCount += 1;
    if (mappedStage === "board_created") srcBucket.boardsCreatedCount += 1;
    if (mappedStage === "charter_inquiry_submitted") srcBucket.inquiriesSubmittedCount += 1;
    sourceStats.set(sourceLabel, srcBucket);

    const shareCode = cleanStr(ctx.shareCode)?.toUpperCase() || null;
    const shipSlug =
      cleanStr(ctx.shipSlug) ||
      (cleanStr(ctx.ship)
        ? cleanStr(ctx.ship)!
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
        : null);
    const sailDate = cleanStr(ctx.sailDate);

    if (shipSlug && sailDate && /^\d{4}-\d{2}-\d{2}$/.test(sailDate)) {
      const sKey = `${shipSlug}:${sailDate}`;
      const existing = sailingDemand.get(sKey) || {
        sailingKey: sKey,
        shipSlug,
        sailDate,
        viewsCount: 0,
        startBoardCount: 0,
        boardsCreatedCount: 0,
      };
      if (mappedStage === "sailing_page_viewed") existing.viewsCount += 1;
      if (mappedStage === "start_board_selected") existing.startBoardCount += 1;
      if (mappedStage === "board_created") existing.boardsCreatedCount += 1;
      sailingDemand.set(sKey, existing);
    }

    if (mappedStage === "board_created") {
      const boardKey = shareCode ? `code:${shareCode}` : `sess:${sessionKey}`;
      if (!boardCreatedItems.has(boardKey)) {
        boardCreatedItems.set(boardKey, {
          key: boardKey,
          shareCode,
          ship: cleanStr(ctx.ship) || shipSlug,
          sailDate,
          surface: cleanStr(ctx.surface),
          createdAt: rawTime || new Date().toISOString(),
        });
      }
    }

    if (
      mappedStage === "invite_link_copied_or_shared" ||
      mappedStage === "first_guest_joined" ||
      mappedStage === "first_activity_response"
    ) {
      invitedSessions.add(sessionKey);
      if (shareCode) invitedShareCodes.add(shareCode);
    }
  }

  const uninvitedStarts: UninvitedBoardStartItem[] = [];
  for (const item of boardCreatedItems.values()) {
    const sessKey = item.key.startsWith("sess:") ? item.key.slice(5) : null;
    const wasInvited =
      (item.shareCode && invitedShareCodes.has(item.shareCode)) ||
      (sessKey && invitedSessions.has(sessKey));
    if (!wasInvited) {
      uninvitedStarts.push(item);
    }
  }
  uninvitedStarts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const stages: CruisePromenadeFunnelStageSummary[] =
    CRUISE_PROMENADE_FUNNEL_EVENTS.map((eventName, idx) => {
      const uniqueSessionsCount = sessionsByStage.get(eventName)?.size || 0;
      const eventCount = countsByStage.get(eventName) || 0;
      let priorSessions = 0;
      if (idx > 0) {
        // Stage 7 (`charter_inquiry_opened`) measures against `sailing_page_viewed` + `board_created` union or prior stage;
        // Stage 8 (`charter_inquiry_submitted`) measures directly against Stage 7 (`charter_inquiry_opened`).
        const priorEvent =
          eventName === "charter_inquiry_opened"
            ? "board_created"
            : CRUISE_PROMENADE_FUNNEL_EVENTS[idx - 1];
        priorSessions = sessionsByStage.get(priorEvent)?.size || 0;
      }
      const conversionFromPriorPct =
        idx === 0 || priorSessions === 0
          ? null
          : Math.min(100, Math.round((uniqueSessionsCount / priorSessions) * 100));

      return {
        stageNumber: (idx + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        eventName,
        label: STAGE_LABELS[eventName],
        eventCount,
        uniqueSessionsCount,
        conversionFromPriorPct,
      };
    });

  const topSailingsByDemand = Array.from(sailingDemand.values())
    .filter(
      (row) =>
        row.viewsCount > 0 || row.startBoardCount > 0 || row.boardsCreatedCount > 0,
    )
    .sort(
      (a, b) =>
        b.boardsCreatedCount - a.boardsCreatedCount ||
        b.startBoardCount - a.startBoardCount ||
        b.viewsCount - a.viewsCount,
    )
    .slice(0, 53);

  const outreachSourceBreakdown: OutreachSourceAttributionRow[] = Array.from(
    sourceStats.entries(),
  )
    .map(([sourceLabel, val]) => ({
      sourceLabel,
      sessionsCount: val.sessions.size,
      sailingViewsCount: val.sailingViewsCount,
      startBoardCount: val.startBoardCount,
      boardsCreatedCount: val.boardsCreatedCount,
      inquiriesSubmittedCount: val.inquiriesSubmittedCount,
    }))
    .sort(
      (a, b) =>
        b.boardsCreatedCount - a.boardsCreatedCount ||
        b.startBoardCount - a.startBoardCount ||
        b.sessionsCount - a.sessionsCount,
    );

  return {
    windowLabel,
    launchEpochIso,
    preLaunchHistoricalEventsExcluded,
    totalGenuineEvents28d,
    excludedSyntheticEvents28d,
    findMySailingSelectionsCount28d,
    findMySailingUniqueSessionsCount28d: findMySailingSessions.size,
    sharedLinkVisitsCount28d: sharedLinkVisitDedupeKeys.size,
    sharedLinkUniqueSessionsCount28d: sharedLinkUniqueSessions.size,
    stages,
    startedWithoutInvitingCount: uninvitedStarts.length,
    recentUninvitedStarts: uninvitedStarts.slice(0, 8),
    topSailingsByDemand,
    outreachSourceBreakdown,
  };
}
