export type MemoryRiskLevel = "low" | "moderate" | "high" | "severe" | "unknown";
export type MemoryTransportStatus = "normal" | "degraded" | "disrupted" | "unknown";
export type MemoryDeltaClass = "normal" | "abnormal" | "improving" | "degrading" | "insufficient_data";

export type PlaceSnapshot = {
  place_id: string;
  timestamp: string;
  class?: string;
  risk_level?: MemoryRiskLevel;
  risk_score?: number | null;
  flags?: string[];
  motion_allowed?: boolean;
  constraints_count?: number | null;
  human_signal?: {
    volume_level?: "low" | "normal" | "elevated" | "high" | "unknown";
    sentiment_direction?: "positive" | "neutral" | "negative" | "unknown";
  };
  transport_status?: MemoryTransportStatus;
  source?: string;
  meta?: Record<string, unknown>;
};

export type PlaceBaseline = {
  place_id: string;
  window_days: number;
  sample_count: number;
  computed_at: string;
  metrics: {
    risk_score_mean: number | null;
    risk_score_stddev: number | null;
    risk_score_p90: number | null;
    degraded_transport_rate: number | null;
    negative_human_signal_rate: number | null;
  };
  latest_snapshot_at?: string | null;
};

export type PlaceTrend = {
  place_id: string;
  window: "24h" | "7d" | "30d";
  direction: "improving" | "degrading" | "stable" | "insufficient_data";
  slope: number | null;
  sample_count: number;
};

export type PlaceDelta = {
  place_id: string;
  at: string;
  classification: MemoryDeltaClass;
  baseline_window_days: number;
  sample_count: number;
  risk_score_now: number | null;
  risk_score_baseline: number | null;
  z_score: number | null;
  reasons: string[];
  trend: PlaceTrend;
};

export type PlaceEventSeverity = "low" | "moderate" | "high" | "severe";

export type PlaceEvent = {
  place_id: string;
  timestamp: string;
  event_type:
    | "risk_degradation"
    | "risk_abnormal"
    | "risk_improvement"
    | "transport_disruption"
    | "human_pressure";
  severity: PlaceEventSeverity;
  title: string;
  signals: string[];
  confidence: "low" | "medium" | "high";
  source: string[];
  dedupe_key: string;
  state_ref?: {
    delta_at?: string;
    snapshot_at?: string;
  };
  meta?: Record<string, unknown>;
};

export type PlanetaryTimelineEntry = PlaceEvent & {
  id: string;
};
