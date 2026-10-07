export interface TelemetryEventPayload {
  site?: string;
  eventName?: string;
  sessionId?: string;
  sourcePage?: string;
  landingPath?: string;
  targetPath?: string;
  context?: Record<string, unknown> | null;
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
  outcome?: Record<string, unknown>;
}

// In-memory circular buffer for telemetry events (persists across requests during server runtime)
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
    outcome: payload.outcome,
  };

  events.push(record);
  if (events.length > MAX_TELEMETRY_RECORDS) {
    events.shift();
  }

  return record;
}

export function getRecentTelemetryEvents(limit = 50): TelemetryRecord[] {
  const events = globalTelemetryState.__jfd_telemetry_events__ || [];
  return [...events].slice(-limit).reverse();
}

export function getTelemetrySummary() {
  const events = globalTelemetryState.__jfd_telemetry_events__ || [];

  const summary = {
    totalEvents: events.length,
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
