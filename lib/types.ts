export type PlaceType = "city" | "venue" | "airport" | "cruise_port";

export type Source =
  | "ticketmaster"
  | "stubhub"
  | "viator"
  | "getyourguide"
  | "alaska_shore_excursions"
  | "official_provider"
  | "owner_config";

export type HandoffTargetType = "owned_booking" | "affiliate" | "partner_form";

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  lat: number;
  lng: number;
  parent_place_id: string | null;
  last_synced_at: string;
}

export interface Event {
  id: string;
  source: Extract<Source, "ticketmaster" | "stubhub">;
  source_event_id: string;
  source_attraction_id?: string | null;
  source_venue_id?: string | null;
  title: string;
  place_id: string;
  start_datetime: string;
  image_url: string;
  ticket_url: string;
  event_source_url?: string | null;
  performer_name?: string | null;
  performer_image_url?: string | null;
  performer_url?: string | null;
  performer_bio?: string | null;
  venue_name?: string | null;
  venue_url?: string | null;
  min_price: number | null;
  max_price: number | null;
}

export interface Experience {
  id: string;
  source: Extract<Source, "viator" | "getyourguide" | "alaska_shore_excursions" | "official_provider">;
  source_product_id: string;
  title: string;
  place_id: string;
  category: string;
  duration: string;
  meeting_point: string;
  price_from: number | null;
  booking_url: string;
  image_url: string;
}

export interface Route {
  id: string;
  origin_place_id: string;
  destination_place_id: string;
  service_name: string;
  price: number;
  rules_text: string;
  booking_url: string;
}

export interface Handoff {
  id: string;
  target_type: HandoffTargetType;
  target_url: string;
  button_text: string;
}

export interface SatelliteConfig {
  host: string;
  name: string;
  place_id: string;
  event_sources: Event["source"][];
  experience_sources: Experience["source"][];
  experience_category: string | null;
  route_ids: string[];
  handoff_id: string;
  official_transit_text: string;
  editorial_context: string[];
}

export interface SyncTarget {
  source: Source;
  place_ids: string[];
  mode:
    | "pull_upcoming_events"
    | "pull_regional_experiences"
    | "load_owner_data";
}

export interface OwnerData {
  places: Place[];
  routes: Route[];
  handoffs: Handoff[];
  satellites: SatelliteConfig[];
  sync_targets: SyncTarget[];
}

export interface LocalReport {
  id: string;
  placeId: string;
  department: "cruise" | "resort" | "places";
  user: {
    name: string;
    avatar: string;
    handle: string;
    provider: "google" | "twitter" | "apple";
    providerId: string;
  };
  mediaUrl?: string;
  mediaType?: "video" | "image";
  text: string;
  timestamp: string; // ISO 8601 string
}

