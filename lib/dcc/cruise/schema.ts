export interface CruisePayload {
  payload_id: string;
  query: {
    type: "line" | "ship" | "destination" | "port" | "search" | "calendar";
    value: string;
    date_range?: {
      start: string;
      end?: string;
    };
  };
  cruises: CruiseSailing[];
  summary?: {
    total_results: number;
    sort_mode: CruiseSortMode;
    min_duration_days: number;
    max_duration_days: number;
    price_range?: {
      min: number;
      max: number;
      currency: string;
    };
    popular_lines: string[];
  };
  context: {
    risk_summary?: string;
    recent_observations?: string[];
    last_updated: string;
  };
  action?: {
    cruise_bookings?: CruiseBookingAction[];
  };
  diagnostics: {
    source: "cache" | "catalog_fallback" | "live_api" | "fallback" | "local-catalog";
    cache_status: "fresh" | "stale" | "miss" | "bypass";
    stale: boolean;
    last_updated: string | null;
    stale_after: string | null;
    fallback_reason: string | null;
  };
}

export type CruiseSortMode = "price" | "duration" | "departure" | "popular";

export interface CruiseSailing {
  sailing_id: string;
  line: string;
  line_slug?: string;
  ship: string;
  ship_slug?: string;
  ship_image_url?: string;

  departure_date: string;
  duration_days: number;
  itinerary_type: "roundtrip" | "oneway" | "cruise-only" | "fly-cruise";
  embark_port: PortCall;
  disembark_port: PortCall;

  ports: PortCall[];
  sea_days: number;

  starting_price?: {
    amount: number;
    currency: string;
    cabin_type: "inside" | "oceanview" | "balcony" | "suite" | "unknown";
  };
  availability_status?: "good" | "limited" | "sold-out" | "waitlist";

  amenities: {
    dining: string[];
    entertainment: string[];
    activities: string[];
    wellness: string[];
    other: string[];
  };

  events?: {
    date_offset_days: number;
    name: string;
    description?: string;
    type?: "dining" | "party" | "show" | "themed" | "holiday";
  }[];

  sailing_context?: {
    demand_level: "low" | "medium" | "high" | "very-high";
    notes?: string[];
  };

  source: string;
  external_booking_url?: string;
  external_provider?: CruiseBookingAction["provider"];
}

export interface PortCall {
  port_name: string;
  port_code?: string;
  arrival: string;
  departure: string;
  duration_hours?: number;
  is_overnight?: boolean;
  is_private_island?: boolean;
}

export interface CruiseBookingAction {
  provider: "direct-line" | "amadeus" | "traveltek" | "widgety" | "expedition-api" | "other";
  booking_url: string;
  price_snapshot?: number;
  currency: string;
  cabin_category?: string;
  deep_link_params?: Record<string, string>;
  disclaimer?: string;
  source?: "cache" | "catalog_fallback" | "live_api" | "fallback" | "local-catalog";
  cache_status?: "fresh" | "stale" | "miss" | "bypass";
}

export interface CruiseCacheFile {
  generated_at: string;
  source: string;
  sailings: CruiseSailing[];
}
