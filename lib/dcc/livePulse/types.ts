export type LivePulseEntityType = "city" | "port" | "venue" | "event";

export type LivePulseTrustTier =
  | "dcc-verified"
  | "partner"
  | "trusted-local"
  | "community"
  | "unverified";

export type LivePulseSignalType =
  | "packed"
  | "long_lines"
  | "easy_entry"
  | "good_vibe"
  | "great_right_now"
  | "meh"
  | "sold_out_closed"
  | "weather_issue"
  | "traffic_parking";

export type LivePulseCategory = "operational" | "vibe";

export type LivePulseVisibilityScope =
  | "entity-only"
  | "city-feed"
  | "next48-overlay";

export type LivePulseStatus = "active" | "expired" | "hidden" | "flagged";

export type LivePulseSourcePoster = "dcc-verified" | "partner" | "trusted-local";

export type LivePulseSignal = {
  id: string;
  entityType: LivePulseEntityType;
  entitySlug: string;
  title: string;
  signalType: LivePulseSignalType;
  category: LivePulseCategory;
  location: string;
  startTime: string;
  endTime: string;
  description: string;
  note?: string;
  imageUrl?: string;
  linkUrl?: string;
  visibilityScope: LivePulseVisibilityScope;
  actionHint: string;
  trustTier: LivePulseTrustTier;
  sourceName: string;
  reporterId: string;
  corroborationKey: string;
  createdAt: string;
  expiresAt: string;
  status: LivePulseStatus;
};

export type LivePulseConfidence = "low" | "medium" | "high";

export type LivePulseFeedItem = {
  id: string;
  entityType: LivePulseEntityType;
  entitySlug: string;
  title: string;
  signalType: LivePulseSignalType;
  category: LivePulseCategory;
  location: string;
  startTime: string;
  endTime: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  visibilityScope: LivePulseVisibilityScope;
  actionHint: string;
  trustTier: LivePulseTrustTier;
  sourceName: string;
  score: number;
  confidence: LivePulseConfidence;
  corroborationCount: number;
  lastUpdated: string;
  expiresAt: string;
};

export type LivePulseFeed = {
  entityType: LivePulseEntityType;
  entitySlug: string;
  generatedAt: string;
  totalSignals: number;
  items: LivePulseFeedItem[];
  diagnostics: {
    activeSignals: number;
    groupedSignals: number;
  };
};

export type LivePulseQueryTarget = "entity" | "city-feed" | "next48-overlay";

export type LivePulseQuery = {
  entityType: LivePulseEntityType;
  entitySlug: string;
  target: LivePulseQueryTarget;
  limit?: number;
};

export type LivePulseCreateInput = {
  entityType: LivePulseEntityType;
  entitySlug: string;
  signalType: LivePulseSignalType;
  location: string;
  visibilityScope: LivePulseVisibilityScope;
  trustTier: LivePulseSourcePoster;
  sourceName: string;
  reporterId: string;
  note?: string;
  imageUrl?: string;
  linkUrl?: string;
  actionHint?: string;
};

export type LivePulseSignalCatalogItem = {
  signalType: LivePulseSignalType;
  label: string;
  category: LivePulseCategory;
  defaultDurationMinutes: number;
  defaultActionHint: string;
  severityWeight: number;
};

export const LIVE_PULSE_SIGNAL_CATALOG: Record<LivePulseSignalType, LivePulseSignalCatalogItem> = {
  packed: {
    signalType: "packed",
    label: "Packed",
    category: "operational",
    defaultDurationMinutes: 120,
    defaultActionHint: "Shift to an alternate nearby lane or delay arrival by 30 to 45 minutes.",
    severityWeight: 0.92,
  },
  long_lines: {
    signalType: "long_lines",
    label: "Long lines",
    category: "operational",
    defaultDurationMinutes: 120,
    defaultActionHint: "Use a lower-friction entry lane or adjust arrival timing.",
    severityWeight: 0.86,
  },
  easy_entry: {
    signalType: "easy_entry",
    label: "Easy entry",
    category: "operational",
    defaultDurationMinutes: 120,
    defaultActionHint: "This is a favorable low-friction arrival window now.",
    severityWeight: 0.64,
  },
  good_vibe: {
    signalType: "good_vibe",
    label: "Good vibe",
    category: "vibe",
    defaultDurationMinutes: 60,
    defaultActionHint: "If this lane fits your plan, move now while energy is stable.",
    severityWeight: 0.56,
  },
  great_right_now: {
    signalType: "great_right_now",
    label: "Great right now",
    category: "vibe",
    defaultDurationMinutes: 60,
    defaultActionHint: "Prioritize this lane now before local energy rotates.",
    severityWeight: 0.72,
  },
  meh: {
    signalType: "meh",
    label: "Meh",
    category: "vibe",
    defaultDurationMinutes: 60,
    defaultActionHint: "Keep this lane as a fallback and favor stronger local signals nearby.",
    severityWeight: 0.35,
  },
  sold_out_closed: {
    signalType: "sold_out_closed",
    label: "Sold out or closed",
    category: "operational",
    defaultDurationMinutes: 120,
    defaultActionHint: "Switch immediately to alternate venues or nearby options.",
    severityWeight: 1,
  },
  weather_issue: {
    signalType: "weather_issue",
    label: "Weather issue",
    category: "operational",
    defaultDurationMinutes: 120,
    defaultActionHint: "Use weather-safe alternatives and add transfer buffer before committing.",
    severityWeight: 0.95,
  },
  traffic_parking: {
    signalType: "traffic_parking",
    label: "Traffic or parking problem",
    category: "operational",
    defaultDurationMinutes: 120,
    defaultActionHint: "Adjust route now and use alternative drop-off or transit options.",
    severityWeight: 0.9,
  },
};

export const LIVE_PULSE_TRUST_WEIGHTS: Record<LivePulseTrustTier, number> = {
  "dcc-verified": 1,
  partner: 0.85,
  "trusted-local": 0.7,
  community: 0.45,
  unverified: 0.25,
};
