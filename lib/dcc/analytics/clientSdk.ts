"use client";

export type ClientAnalyticsEventType =
  | "page_viewed"
  | "guide_engaged"
  | "printable_view_opened"
  | "cross_site_handoff_clicked"
  | "cross_site_handoff_arrived"
  | "planning_entry_selected"
  | "trip_draft_started"
  | "trip_persisted"
  | "trip_customized"
  | "confirmation_staged"
  | "confirmation_reviewed_edited"
  | "confirmation_applied"
  | "confirmation_rejected"
  | "confirmation_amended"
  | "confirmation_cancelled"
  | "invitation_shared"
  | "companion_participated"
  | "trip_returned_later"
  | "seller_handoff_initiated";

export interface ClientAnalyticsEventInput {
  logicalEventId?: string;
  eventType: ClientAnalyticsEventType;
  site: string;
  path?: string;
  navigationType?: "initial_load" | "spa_route_change" | "reload";
  contentFamily?: string;
  handoffId?: string;
  clickId?: string;
  contextTokenPresent?: boolean;
  targetSite?: string;
  provider?: string;
  productCode?: string;
  physicalSailingId?: string;
  hostedDepartureId?: string;
  journeyKind?: string;
  draftKey?: string;
  subMilestone?: string;
  isTemplateOrHydration?: boolean;
  isNoOpSave?: boolean;
  travelDateHint?: string;
  isTest?: boolean;
  isSyntheticSample?: boolean;
  props?: Record<string, string | number | boolean | null>;
}

const SEED_COOKIE = "_dcc_aid";
const SEED_STORAGE_KEY = "dcc_aid_v2";
const SESSION_STORAGE_KEY = "dcc_asess_v2";
const FIRST_TOUCH_KEY = "dcc_aft_v2";
const SEED_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const SESSION_IDLE_MS = 30 * 60 * 1000; // 30 minutes
const MAX_BATCH_SIZE = 10;
const MAX_BUFFER_LEN = 50;
const FLUSH_INTERVAL_MS = 2500;
const MAX_RETRIES = 2;
const CIRCUIT_COOLDOWN_MS = 60_000;

interface QueuedClientEvent {
  payload: Record<string, unknown>;
  retries: number;
}

let eventQueue: QueuedClientEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let inFlightFlush = false;
let consecutiveFailures = 0;
let circuitOpenUntilMs = 0;
let listenersAttached = false;
let collectorEndpoint = "/api/v2/analytics/collect";

function randomHexId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function scrubClientPath(rawPath?: string): string {
  const clean = (rawPath || (typeof window !== "undefined" ? window.location.pathname : "/") || "/")
    .split("?")[0]!
    .split("#")[0]!
    .trim();
  return clean
    .replace(/^\/(p|organizer|claim|recover)\/[^/]+(\/.*)?$/i, "/$1/[redacted]$2")
    .replace(/^\/(booking|pay|pay-balance|quote|manage|operator-offer)\/[^/]+(\/.*)?$/i, "/$1/[token]$2")
    .replace(/\b[A-Fa-f0-9]{24,64}\b/g, "[redacted]")
    .slice(0, 200);
}

export function getOrCreateFirstPartyBrowserSeed(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)_dcc_aid=([A-Za-z0-9_-]{8,96})/);
    if (cookieMatch?.[1]) return cookieMatch[1];

    const rawStored = window.localStorage.getItem(SEED_STORAGE_KEY);
    if (rawStored) {
      const parsed = JSON.parse(rawStored) as { seed?: string; expiresAt?: number };
      if (parsed.seed && (parsed.expiresAt || 0) > Date.now()) {
        return parsed.seed;
      }
    }

    const fresh = randomHexId("bseed");
    const maxAgeSec = Math.floor(SEED_MAX_AGE_MS / 1000);
    const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${SEED_COOKIE}=${fresh}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax${secureFlag}`;
    window.localStorage.setItem(
      SEED_STORAGE_KEY,
      JSON.stringify({ seed: fresh, expiresAt: Date.now() + SEED_MAX_AGE_MS }),
    );
    return fresh;
  } catch {
    return randomHexId("bseed");
  }
}

export function getOrCreateRollingSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const now = Date.now();
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string; lastActiveAt?: number };
      if (parsed.id && now - (parsed.lastActiveAt || 0) <= SESSION_IDLE_MS) {
        window.sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({ id: parsed.id, lastActiveAt: now }),
        );
        return parsed.id;
      }
    }
    const fresh = randomHexId("sess");
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ id: fresh, lastActiveAt: now }),
    );
    return fresh;
  } catch {
    return randomHexId("sess");
  }
}

function readOrCaptureFirstTouch(): {
  landingPath: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  isQa?: boolean;
  hasCtx?: boolean;
} {
  if (typeof window === "undefined") return { landingPath: "/" };
  try {
    const qs = new URLSearchParams(window.location.search);
    const isQa =
      qs.get("qa") === "1" ||
      qs.get("qa_test") === "1" ||
      qs.get("is_test") === "1" ||
      qs.get("synthetic") === "1";
    const hasCtx = Boolean(qs.get("ctx") || qs.get("dcc_ctx") || qs.get("dcc_handoff_id"));

    const existingRaw = window.sessionStorage.getItem(FIRST_TOUCH_KEY);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as Record<string, string>;
      return {
        landingPath: existing.landingPath || scrubClientPath(),
        utmSource: qs.get("utm_source") || qs.get("source") || existing.utmSource || undefined,
        utmMedium: qs.get("utm_medium") || existing.utmMedium || undefined,
        utmCampaign: qs.get("utm_campaign") || existing.utmCampaign || undefined,
        referrer: existing.referrer || undefined,
        isQa,
        hasCtx,
      };
    }

    const landingPath = scrubClientPath(window.location.pathname);
    let referrerHost = "";
    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.hostname && refUrl.hostname !== window.location.hostname) {
          referrerHost = refUrl.hostname.toLowerCase();
        }
      } catch {
        referrerHost = "";
      }
    }
    const captured = {
      landingPath,
      utmSource: (qs.get("utm_source") || qs.get("source") || "").slice(0, 64),
      utmMedium: (qs.get("utm_medium") || "").slice(0, 64),
      utmCampaign: (qs.get("utm_campaign") || "").slice(0, 96),
      referrer: referrerHost,
    };
    window.sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(captured));
    return {
      landingPath,
      utmSource: captured.utmSource || undefined,
      utmMedium: captured.utmMedium || undefined,
      utmCampaign: captured.utmCampaign || undefined,
      referrer: referrerHost || undefined,
      isQa,
      hasCtx,
    };
  } catch {
    return { landingPath: scrubClientPath() };
  }
}

export function configureAnalyticsClient(options: { endpoint?: string }): void {
  if (options.endpoint) collectorEndpoint = options.endpoint;
}

function attachExitFlushListeners(): void {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;

  const flushOnExit = () => {
    flushAnalyticsQueue({ useBeacon: true });
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOnExit();
  });
  window.addEventListener("pagehide", flushOnExit);
}

function isTruthyClientDisableFlag(val?: string): boolean {
  const n = (val || "").trim().toLowerCase();
  return n === "1" || n === "true" || n === "yes" || n === "on";
}

function isClientAnalyticsDisabledForSite(site?: string): boolean {
  if (isTruthyClientDisableFlag(process.env.NEXT_PUBLIC_DCC_ANALYTICS_DISABLED)) return true;
  const s = (site || "").trim().toLowerCase();
  if (
    (s === "lfse" || s === "last-frontier-shore-excursions") &&
    isTruthyClientDisableFlag(process.env.NEXT_PUBLIC_LFSE_ANALYTICS_DISABLED)
  ) {
    return true;
  }
  if (
    (s === "juneauflightdeck" || s === "jfd" || s === "juneau-flight-deck") &&
    isTruthyClientDisableFlag(process.env.NEXT_PUBLIC_JFD_ANALYTICS_DISABLED)
  ) {
    return true;
  }
  return false;
}

export function enqueueClientAnalyticsEvent(input: ClientAnalyticsEventInput): string {
  const logicalEventId = input.logicalEventId || randomHexId("evt");
  if (typeof window === "undefined") return logicalEventId;
  if (isClientAnalyticsDisabledForSite(input.site)) return logicalEventId;
  if (Date.now() < circuitOpenUntilMs) return logicalEventId;

  attachExitFlushListeners();
  const browserSeed = getOrCreateFirstPartyBrowserSeed();
  const sessionId = getOrCreateRollingSessionId();
  const ft = readOrCaptureFirstTouch();
  const cleanPath = scrubClientPath(input.path);

  const payload: Record<string, unknown> = {
    schemaVersion: "dcc.analytics.event.v2",
    logicalEventId,
    eventType: input.eventType,
    occurredAt: new Date().toISOString(),
    site: input.site,
    browserSeed,
    sessionId,
    path: cleanPath,
    landingPath: ft.landingPath,
    ...(input.navigationType ? { navigationType: input.navigationType } : {}),
    ...(ft.referrer ? { referrer: ft.referrer } : {}),
    ...(ft.utmSource ? { utmSource: ft.utmSource } : {}),
    ...(ft.utmMedium ? { utmMedium: ft.utmMedium } : {}),
    ...(ft.utmCampaign ? { utmCampaign: ft.utmCampaign } : {}),
    ...(input.contentFamily ? { contentFamily: input.contentFamily } : {}),
    ...(input.handoffId ? { handoffId: input.handoffId } : {}),
    ...(input.clickId ? { clickId: input.clickId } : {}),
    ...(input.contextTokenPresent || ft.hasCtx ? { contextTokenPresent: true } : {}),
    ...(input.targetSite ? { targetSite: input.targetSite } : {}),
    ...(input.provider ? { provider: input.provider } : {}),
    ...(input.productCode ? { productCode: input.productCode } : {}),
    ...(input.physicalSailingId ? { physicalSailingId: input.physicalSailingId } : {}),
    ...(input.hostedDepartureId ? { hostedDepartureId: input.hostedDepartureId } : {}),
    ...(input.journeyKind ? { journeyKind: input.journeyKind } : {}),
    ...(input.draftKey ? { draftKey: input.draftKey } : {}),
    ...(input.subMilestone ? { subMilestone: input.subMilestone } : {}),
    ...(input.isTemplateOrHydration ? { isTemplateOrHydration: true } : {}),
    ...(input.isNoOpSave ? { isNoOpSave: true } : {}),
    ...(input.travelDateHint ? { travelDateHint: input.travelDateHint } : {}),
    ...(input.isTest || ft.isQa ? { isTest: true } : {}),
    ...(input.isSyntheticSample ? { isSyntheticSample: true } : {}),
    ...(input.props ? { props: input.props } : {}),
  };

  if (eventQueue.length >= MAX_BUFFER_LEN) {
    eventQueue.shift();
  }
  eventQueue.push({ payload, retries: 0 });

  if (
    eventQueue.length >= MAX_BATCH_SIZE ||
    input.eventType === "seller_handoff_initiated" ||
    input.eventType === "cross_site_handoff_clicked"
  ) {
    flushAnalyticsQueue({
      useBeacon:
        input.eventType === "seller_handoff_initiated" ||
        input.eventType === "cross_site_handoff_clicked",
    });
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushAnalyticsQueue({ useBeacon: false });
    }, FLUSH_INTERVAL_MS);
  }

  return logicalEventId;
}

export function flushAnalyticsQueue(opts?: { useBeacon?: boolean }): void {
  if (typeof window === "undefined" || eventQueue.length === 0) return;
  if (Date.now() < circuitOpenUntilMs) {
    eventQueue = [];
    return;
  }

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const batch = eventQueue.splice(0, MAX_BATCH_SIZE);
  const body = JSON.stringify({
    deliveryId: randomHexId("dlv"),
    sentAt: new Date().toISOString(),
    events: batch.map((b) => b.payload),
  });

  if (opts?.useBeacon && typeof navigator.sendBeacon === "function") {
    try {
      const ok = navigator.sendBeacon(
        collectorEndpoint,
        new Blob([body], { type: "text/plain;charset=UTF-8" }),
      );
      if (ok) return;
    } catch {
      // fall through to keepalive fetch
    }
  }

  if (inFlightFlush && !opts?.useBeacon) {
    eventQueue.unshift(...batch);
    return;
  }

  inFlightFlush = true;
  fetch(collectorEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "omit",
  })
    .then((res) => {
      inFlightFlush = false;
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        consecutiveFailures = 0;
        if (eventQueue.length > 0) {
          flushAnalyticsQueue({ useBeacon: false });
        }
        return;
      }
      throw new Error(`http_${res.status}`);
    })
    .catch(() => {
      inFlightFlush = false;
      consecutiveFailures += 1;
      if (consecutiveFailures >= 3) {
        circuitOpenUntilMs = Date.now() + CIRCUIT_COOLDOWN_MS;
        eventQueue = [];
        return;
      }
      // Preserve logicalEventId across bounded retries
      const retryable = batch
        .filter((item) => item.retries < MAX_RETRIES)
        .map((item) => ({ payload: item.payload, retries: item.retries + 1 }));
      if (retryable.length > 0) {
        eventQueue = [...retryable, ...eventQueue].slice(0, MAX_BUFFER_LEN);
        const backoffMs = 500 * Math.pow(2, consecutiveFailures);
        flushTimer = setTimeout(() => {
          flushTimer = null;
          flushAnalyticsQueue({ useBeacon: false });
        }, backoffMs);
      }
    });
}
