export type ProviderLayer = "layer0_reality" | "layer1_interpretation" | "layer2_action";

export type ProviderContract = {
  id: string;
  name: string;
  env_vars_required: string[];
  layer: ProviderLayer;
  primary_lanes: string[];
  live_cache_support: {
    live: boolean;
    cache: boolean;
    cache_source: string | null;
  };
  refresh_strategy: {
    mode: "request_time" | "scheduled_build" | "hybrid";
    cadence: string;
    commands: string[];
  };
  diagnostics_surface: {
    runtime_fields: string[];
    endpoints: string[];
  };
  rollout_policy: {
    strategy: "none" | "allowlist" | "percentage" | "policy_switch" | "mixed";
    env_controls: string[];
    default_behavior: string;
  };
};

export const DCC_PROVIDER_REGISTRY: ProviderContract[] = [
  {
    id: "viator",
    name: "Viator",
    env_vars_required: [
      "VIATOR_API_KEY",
      "VIATOR_SOURCE_POLICY",
      "VIATOR_CACHE_MAX_AGE_HOURS",
    ],
    layer: "layer2_action",
    primary_lanes: ["tours", "activities"],
    live_cache_support: {
      live: true,
      cache: true,
      cache_source: "data/action/viator.products.cache.json + local catalog fallback",
    },
    refresh_strategy: {
      mode: "scheduled_build",
      cadence: "on demand or scheduled via dcc action refresh",
      commands: ["npm run dcc:viator:cache", "npm run dcc:action:refresh"],
    },
    diagnostics_surface: {
      runtime_fields: ["source", "cache_status", "stale", "last_updated", "stale_after", "fallback_reason"],
      endpoints: ["/api/internal/[place]"],
    },
    rollout_policy: {
      strategy: "mixed",
      env_controls: [
        "VIATOR_SOURCE_POLICY",
        "VIATOR_LIVE_ALLOWLIST",
        "VIATOR_LIVE_PERCENT",
      ],
      default_behavior: "auto policy prefers cache unless allowlist/rollout triggers live",
    },
  },
  {
    id: "carnival_cruise_provider",
    name: "Carnival Cruise Feed",
    env_vars_required: ["CARNIVAL_CRUISE_FEED_URL", "CARNIVAL_CRUISE_API_KEY"],
    layer: "layer2_action",
    primary_lanes: ["cruises"],
    live_cache_support: {
      live: true,
      cache: true,
      cache_source: "data/action/cruise.sailings.cache.json",
    },
    refresh_strategy: {
      mode: "hybrid",
      cadence: "scheduled cache refresh; optional live at request time",
      commands: ["npm run dcc:cruise:build", "npm run dcc:cruise:cache"],
    },
    diagnostics_surface: {
      runtime_fields: ["source", "cache_status", "stale", "last_updated", "stale_after", "fallback_reason"],
      endpoints: [
        "/api/internal/cruises/[query]",
        "/api/internal/cruises/providers/health",
        "/api/internal/cruises/providers/health/cached",
      ],
    },
    rollout_policy: {
      strategy: "policy_switch",
      env_controls: ["CRUISE_SOURCE_POLICY", "CRUISE_PROVIDER_TIMEOUT_MS"],
      default_behavior: "cache",
    },
  },
  {
    id: "royal_caribbean_cruise_provider",
    name: "Royal Caribbean Cruise Feed",
    env_vars_required: ["ROYAL_CARIBBEAN_CRUISE_FEED_URL", "ROYAL_CARIBBEAN_CRUISE_API_KEY"],
    layer: "layer2_action",
    primary_lanes: ["cruises"],
    live_cache_support: {
      live: true,
      cache: true,
      cache_source: "data/action/cruise.sailings.cache.json",
    },
    refresh_strategy: {
      mode: "hybrid",
      cadence: "scheduled cache refresh; optional live at request time",
      commands: ["npm run dcc:cruise:build", "npm run dcc:cruise:cache"],
    },
    diagnostics_surface: {
      runtime_fields: ["source", "cache_status", "stale", "last_updated", "stale_after", "fallback_reason"],
      endpoints: [
        "/api/internal/cruises/[query]",
        "/api/internal/cruises/providers/health",
        "/api/internal/cruises/providers/health/cached",
      ],
    },
    rollout_policy: {
      strategy: "policy_switch",
      env_controls: ["CRUISE_SOURCE_POLICY", "CRUISE_PROVIDER_TIMEOUT_MS"],
      default_behavior: "cache",
    },
  },
  {
    id: "norwegian_cruise_provider",
    name: "Norwegian Cruise Feed",
    env_vars_required: ["NORWEGIAN_CRUISE_FEED_URL", "NORWEGIAN_CRUISE_API_KEY"],
    layer: "layer2_action",
    primary_lanes: ["cruises"],
    live_cache_support: {
      live: true,
      cache: true,
      cache_source: "data/action/cruise.sailings.cache.json",
    },
    refresh_strategy: {
      mode: "hybrid",
      cadence: "scheduled cache refresh; optional live at request time",
      commands: ["npm run dcc:cruise:build", "npm run dcc:cruise:cache"],
    },
    diagnostics_surface: {
      runtime_fields: ["source", "cache_status", "stale", "last_updated", "stale_after", "fallback_reason"],
      endpoints: [
        "/api/internal/cruises/[query]",
        "/api/internal/cruises/providers/health",
        "/api/internal/cruises/providers/health/cached",
      ],
    },
    rollout_policy: {
      strategy: "policy_switch",
      env_controls: ["CRUISE_SOURCE_POLICY", "CRUISE_PROVIDER_TIMEOUT_MS"],
      default_behavior: "cache",
    },
  },
  {
    id: "noaa_nws",
    name: "NOAA National Weather Service",
    env_vars_required: [],
    layer: "layer0_reality",
    primary_lanes: ["conditions", "weather", "risk"],
    live_cache_support: {
      live: true,
      cache: false,
      cache_source: null,
    },
    refresh_strategy: {
      mode: "request_time",
      cadence: "per user request",
      commands: [],
    },
    diagnostics_surface: {
      runtime_fields: ["available", "source", "fallback_reason"],
      endpoints: ["/api/internal/[place]/earth-signals"],
    },
    rollout_policy: {
      strategy: "none",
      env_controls: [],
      default_behavior: "always attempt live fetch; unavailable outside coverage areas",
    },
  },
  {
    id: "nasa_eonet",
    name: "NASA EONET",
    env_vars_required: [],
    layer: "layer0_reality",
    primary_lanes: ["conditions", "risk", "events"],
    live_cache_support: {
      live: true,
      cache: false,
      cache_source: null,
    },
    refresh_strategy: {
      mode: "request_time",
      cadence: "per user request with days/radius filters",
      commands: [],
    },
    diagnostics_surface: {
      runtime_fields: ["source", "days", "radius_km", "total_open_events"],
      endpoints: ["/api/internal/[place]/earth-signals"],
    },
    rollout_policy: {
      strategy: "none",
      env_controls: [],
      default_behavior: "always attempt live fetch",
    },
  },
  {
    id: "open_meteo",
    name: "Open-Meteo (client weather panel)",
    env_vars_required: [],
    layer: "layer0_reality",
    primary_lanes: ["conditions", "weather"],
    live_cache_support: {
      live: true,
      cache: false,
      cache_source: null,
    },
    refresh_strategy: {
      mode: "request_time",
      cadence: "client-side fetch on page load",
      commands: [],
    },
    diagnostics_surface: {
      runtime_fields: ["status", "tempF", "windMph", "code"],
      endpoints: ["client component: LocalTimeWeather"],
    },
    rollout_policy: {
      strategy: "none",
      env_controls: [],
      default_behavior: "always attempt live fetch",
    },
  },
  {
    id: "amadeus_flights",
    name: "Amadeus Flights API",
    env_vars_required: ["AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET"],
    layer: "layer2_action",
    primary_lanes: ["flights", "transport"],
    live_cache_support: {
      live: true,
      cache: false,
      cache_source: null,
    },
    refresh_strategy: {
      mode: "request_time",
      cadence: "per user search request",
      commands: [],
    },
    diagnostics_surface: {
      runtime_fields: ["source", "cache_status", "stale", "last_updated", "fallback_reason"],
      endpoints: ["/api/internal/flights/search", "/api/internal/providers/capability-matrix"],
    },
    rollout_policy: {
      strategy: "policy_switch",
      env_controls: ["AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET", "AMADEUS_API_BASE"],
      default_behavior: "disabled when credentials missing",
    },
  },
  {
    id: "opensky_flights",
    name: "OpenSky Live States API",
    env_vars_required: [],
    layer: "layer0_reality",
    primary_lanes: ["flights", "transport", "conditions"],
    live_cache_support: {
      live: true,
      cache: false,
      cache_source: null,
    },
    refresh_strategy: {
      mode: "request_time",
      cadence: "per status request",
      commands: [],
    },
    diagnostics_surface: {
      runtime_fields: ["source", "cache_status", "stale", "last_updated", "fallback_reason"],
      endpoints: ["/api/internal/flights/status", "/api/internal/providers/capability-matrix"],
    },
    rollout_policy: {
      strategy: "none",
      env_controls: ["OPENSKY_USERNAME", "OPENSKY_PASSWORD"],
      default_behavior: "works in anonymous mode; auth improves limits",
    },
  },
  {
    id: "foursquare_places",
    name: "Foursquare Places API",
    env_vars_required: ["FOURSQUARE_API_KEY"],
    layer: "layer2_action",
    primary_lanes: ["attractions", "food", "reference_points"],
    live_cache_support: {
      live: true,
      cache: false,
      cache_source: null,
    },
    refresh_strategy: {
      mode: "request_time",
      cadence: "per user request",
      commands: [],
    },
    diagnostics_surface: {
      runtime_fields: ["source", "cache_status", "stale", "last_updated", "fallback_reason"],
      endpoints: ["/api/internal/[place]/nearby", "/api/internal/providers/capability-matrix"],
    },
    rollout_policy: {
      strategy: "policy_switch",
      env_controls: ["FOURSQUARE_API_KEY"],
      default_behavior: "disabled when key missing",
    },
  },
  {
    id: "ticketmaster_discovery",
    name: "Ticketmaster Discovery API",
    env_vars_required: ["TICKETMASTER_API_KEY"],
    layer: "layer2_action",
    primary_lanes: ["events"],
    live_cache_support: {
      live: true,
      cache: false,
      cache_source: null,
    },
    refresh_strategy: {
      mode: "request_time",
      cadence: "per user request",
      commands: [],
    },
    diagnostics_surface: {
      runtime_fields: ["source", "cache_status", "stale", "last_updated", "fallback_reason"],
      endpoints: ["/api/internal/providers/capability-matrix"],
    },
    rollout_policy: {
      strategy: "policy_switch",
      env_controls: ["TICKETMASTER_API_KEY"],
      default_behavior: "disabled when key missing",
    },
  },
  {
    id: "rapidapi_airbnb",
    name: "RapidAPI Airbnb",
    env_vars_required: ["RAPID_API_KEY"],
    layer: "layer2_action",
    primary_lanes: ["lodging", "stays"],
    live_cache_support: {
      live: true,
      cache: true,
      cache_source: "next fetch revalidation via lib/rapidapi/airbnb.ts",
    },
    refresh_strategy: {
      mode: "hybrid",
      cadence: "request-time fetch with route-level revalidation",
      commands: [],
    },
    diagnostics_surface: {
      runtime_fields: ["source", "configured", "count", "error"],
      endpoints: [
        "/api/internal/lodging/airbnb/search",
        "/api/internal/lodging/airbnb/details",
        "/api/internal/providers/capability-matrix",
      ],
    },
    rollout_policy: {
      strategy: "policy_switch",
      env_controls: [
        "RAPID_API_KEY",
        "RAPIDAPI_AIRBNB_HOST",
        "RAPIDAPI_AIRBNB_BASE_URL",
        "RAPIDAPI_AIRBNB_REVALIDATE_SECONDS",
      ],
      default_behavior: "supplemental cached lodging source only; never canonical truth",
    },
  },
];

export function getProviderContract(providerId: string): ProviderContract | null {
  return DCC_PROVIDER_REGISTRY.find((p) => p.id === providerId) || null;
}
