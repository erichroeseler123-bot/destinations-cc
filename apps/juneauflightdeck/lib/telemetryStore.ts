import { getDb } from "./db";

export interface TelemetryEventPayload {
  site?: string;
  eventName?: string;
  sessionId?: string;
  sourcePage?: string;
  landingPath?: string;
  targetPath?: string;
  context?: Record<string, unknown> | null;
  isTest?: boolean;
  is_test?: boolean;
  outcome?: {
    provider?: string;
    tourSlug?: string;
    tourName?: string;
    targetUrl?: string;
    anchorText?: string;
    submissionId?: string;
    tourType?: string;
    partySize?: number | string;
    portDate?: string;
    shipName?: string;
    isTest?: boolean;
    is_test?: boolean;
    [key: string]: unknown;
  };
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TelemetryRecord {
  id: string;
  timestamp: string;
  site: string;
  eventName: string;
  sessionId: string;
  sourcePage: string;
  landingPath?: string;
  targetPath?: string;
  provider?: string;
  tourSlug?: string;
  tourName?: string;
  isTest: boolean;
  outcome?: Record<string, unknown>;
}

// In-memory circular buffer for telemetry events (fallback when database is disconnected)
const MAX_TELEMETRY_RECORDS = 500;
const globalTelemetryState = globalThis as unknown as {
  __jfd_telemetry_events__?: TelemetryRecord[];
};

if (!globalTelemetryState.__jfd_telemetry_events__) {
  globalTelemetryState.__jfd_telemetry_events__ = [];
}

export function recordTelemetryEvent(payload: TelemetryEventPayload): TelemetryRecord {
  const events = globalTelemetryState.__jfd_telemetry_events__!;

  const provider =
    payload.outcome?.provider ||
    (payload.targetPath?.includes("fareharbor.com")
      ? "fareharbor"
      : payload.targetPath?.includes("viator.com")
      ? "viator"
      : undefined);

  const tourSlug =
    payload.outcome?.tourSlug ||
    (typeof payload.outcome?.tourType === "string" ? payload.outcome.tourType : undefined);

  const tourName = payload.outcome?.tourName;

  const isTest = Boolean(
    payload.isTest ??
    payload.is_test ??
    payload.outcome?.isTest ??
    payload.outcome?.is_test ??
    (typeof payload.sessionId === "string" && payload.sessionId.includes("test")) ??
    false
  );

  const record: TelemetryRecord = {
    id: `jfd_evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    site: payload.site || "juneau-flight-deck",
    eventName: payload.eventName || "unknown_event",
    sessionId: payload.sessionId || "unknown_session",
    sourcePage: payload.sourcePage || payload.landingPath || "/",
    landingPath: payload.landingPath,
    targetPath: payload.targetPath,
    provider,
    tourSlug,
    tourName,
    isTest,
    outcome: payload.outcome,
  };

  events.push(record);
  if (events.length > MAX_TELEMETRY_RECORDS) {
    events.shift();
  }

  // Asynchronously persist to Neon PostgreSQL table jfd_telemetry_events
  const sql = getDb();
  if (sql) {
    sql`
      INSERT INTO jfd_telemetry_events (
        id, site, event_name, session_id, source_page, landing_path, target_path, provider, tour_slug, tour_name, is_test, payload
      ) VALUES (
        ${record.id}, ${record.site}, ${record.eventName}, ${record.sessionId},
        ${record.sourcePage}, ${record.landingPath || null}, ${record.targetPath || null},
        ${record.provider || null}, ${record.tourSlug || null}, ${record.tourName || null},
        ${record.isTest}, ${JSON.stringify(payload)}
      )
    `.catch((dbErr) => {
      console.warn("[TelemetryStore] DB insert error:", dbErr?.message || dbErr);
    });
  }

  return record;
}

export async function getRecentTelemetryEvents(limit = 50, includeTest = false): Promise<TelemetryRecord[]> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = includeTest
        ? await sql`
            SELECT id, created_at as timestamp, site, event_name, session_id, source_page, landing_path, target_path, provider, tour_slug, tour_name, is_test, payload
            FROM jfd_telemetry_events
            ORDER BY created_at DESC
            LIMIT ${limit}
          `
        : await sql`
            SELECT id, created_at as timestamp, site, event_name, session_id, source_page, landing_path, target_path, provider, tour_slug, tour_name, is_test, payload
            FROM jfd_telemetry_events
            WHERE is_test = false
            ORDER BY created_at DESC
            LIMIT ${limit}
          `;

      return rows.map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
        site: r.site,
        eventName: r.event_name,
        sessionId: r.session_id,
        sourcePage: r.source_page,
        landingPath: r.landing_path,
        targetPath: r.target_path,
        provider: r.provider,
        tourSlug: r.tour_slug,
        tourName: r.tour_name,
        isTest: Boolean(r.is_test),
        outcome: (r.payload as any)?.outcome,
      }));
    } catch (err) {
      console.warn("[TelemetryStore] DB query error, falling back to memory:", err);
    }
  }

  const events = globalTelemetryState.__jfd_telemetry_events__ || [];
  const filtered = includeTest ? events : events.filter((e) => !e.isTest);
  return [...filtered].slice(-limit).reverse();
}

export async function getTelemetrySummary(includeTest = false) {
  const sql = getDb();
  let events: TelemetryRecord[] = [];

  if (sql) {
    try {
      const rows = includeTest
        ? await sql`
            SELECT id, created_at as timestamp, site, event_name, session_id, source_page, landing_path, target_path, provider, tour_slug, tour_name, is_test, payload
            FROM jfd_telemetry_events
            ORDER BY created_at DESC
            LIMIT 1000
          `
        : await sql`
            SELECT id, created_at as timestamp, site, event_name, session_id, source_page, landing_path, target_path, provider, tour_slug, tour_name, is_test, payload
            FROM jfd_telemetry_events
            WHERE is_test = false
            ORDER BY created_at DESC
            LIMIT 1000
          `;

      events = rows.map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
        site: r.site,
        eventName: r.event_name,
        sessionId: r.session_id,
        sourcePage: r.source_page,
        landingPath: r.landing_path,
        targetPath: r.target_path,
        provider: r.provider,
        tourSlug: r.tour_slug,
        tourName: r.tour_name,
        isTest: Boolean(r.is_test),
        outcome: (r.payload as any)?.outcome,
      }));
    } catch (err) {
      console.warn("[TelemetryStore] DB summary error, falling back to memory:", err);
      const memEvents = globalTelemetryState.__jfd_telemetry_events__ || [];
      events = includeTest ? memEvents : memEvents.filter((e) => !e.isTest);
    }
  } else {
    const memEvents = globalTelemetryState.__jfd_telemetry_events__ || [];
    events = includeTest ? memEvents : memEvents.filter((e) => !e.isTest);
  }

  const summary = {
    totalEvents: events.length,
    includesTestTraffic: includeTest,
    byEventName: {} as Record<string, number>,
    bookingClicks: {
      total: 0,
      byTour: {} as Record<string, number>,
      byPage: {} as Record<string, number>,
      byProvider: {} as Record<string, number>,
    },
    waitlistSubmissions: {
      total: 0,
      byTourType: {} as Record<string, number>,
      byShip: {} as Record<string, number>,
      byPage: {} as Record<string, number>,
    },
    pageViews: {
      total: 0,
      byPage: {} as Record<string, number>,
    },
  };

  for (const evt of events) {
    // Count by eventName
    summary.byEventName[evt.eventName] = (summary.byEventName[evt.eventName] || 0) + 1;

    // Booking click breakdown
    if (evt.eventName === "booking_clicked" || evt.eventName === "widget_click" || evt.eventName.includes("booking")) {
      summary.bookingClicks.total += 1;

      const tour = String(evt.tourSlug || evt.outcome?.tourSlug || "unspecified_tour");
      summary.bookingClicks.byTour[tour] = (summary.bookingClicks.byTour[tour] || 0) + 1;

      const page = String(evt.sourcePage || "/");
      summary.bookingClicks.byPage[page] = (summary.bookingClicks.byPage[page] || 0) + 1;

      const provider = String(evt.provider || evt.outcome?.provider || "direct");
      summary.bookingClicks.byProvider[provider] = (summary.bookingClicks.byProvider[provider] || 0) + 1;
    }

    // Waitlist submission breakdown
    if (evt.eventName === "waitlist_submitted" || evt.eventName.includes("waitlist")) {
      summary.waitlistSubmissions.total += 1;

      const tourType = String(evt.outcome?.tourType || "any");
      summary.waitlistSubmissions.byTourType[tourType] = (summary.waitlistSubmissions.byTourType[tourType] || 0) + 1;

      const ship = String(evt.outcome?.shipName || "unspecified_ship");
      summary.waitlistSubmissions.byShip[ship] = (summary.waitlistSubmissions.byShip[ship] || 0) + 1;

      const page = String(evt.sourcePage || "/");
      summary.waitlistSubmissions.byPage[page] = (summary.waitlistSubmissions.byPage[page] || 0) + 1;
    }

    // Page view breakdown
    if (evt.eventName === "page_viewed" || evt.eventName === "handoff_received") {
      summary.pageViews.total += 1;
      const page = String(evt.sourcePage || "/");
      summary.pageViews.byPage[page] = (summary.pageViews.byPage[page] || 0) + 1;
    }
  }

  return summary;
}
