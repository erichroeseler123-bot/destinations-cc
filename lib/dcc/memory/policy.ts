export type MemoryPromotionPolicy = {
  emit_improving: boolean;
  zscore_threshold: number;
  min_samples: number;
  dedupe_window_minutes: {
    risk_degradation: number;
    risk_abnormal: number;
    risk_improvement: number;
    transport_disruption: number;
    human_pressure: number;
  };
  max_events_per_place_per_hour: number;
};

export type MemoryPlanetaryPolicy = {
  window_days: number;
  max_events_per_hour_per_type: number;
};

export type MemoryPolicy = {
  promote: MemoryPromotionPolicy;
  planetary: MemoryPlanetaryPolicy;
};

export const DEFAULT_MEMORY_POLICY: MemoryPolicy = {
  promote: {
    emit_improving: false,
    zscore_threshold: 0.75,
    min_samples: 3,
    dedupe_window_minutes: {
      risk_degradation: 120,
      risk_abnormal: 120,
      risk_improvement: 360,
      transport_disruption: 90,
      human_pressure: 90,
    },
    max_events_per_place_per_hour: 4,
  },
  planetary: {
    window_days: 30,
    max_events_per_hour_per_type: 200,
  },
};
