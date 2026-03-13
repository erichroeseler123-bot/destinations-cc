export type DccNodeClass =
  | "world"
  | "continent"
  | "country"
  | "region"
  | "place"
  | "district"
  | "neighborhood"
  | "port"
  | "transport_hub"
  | "venue"
  | "attraction"
  | "lodging"
  | "pickup_zone"
  | "route"
  | "operator"
  | "product"
  | "service_area"
  | "article"
  | "faq"
  | "signal"
  | "collection"
  | "virtual";

export type DccStatus =
  | "active"
  | "draft"
  | "planned"
  | "seasonal"
  | "temporary"
  | "archived"
  | "deprecated";

export type DccVisibility = "public" | "internal" | "private";

export type DccSourceSystem =
  | "geonames"
  | "wikidata"
  | "osm"
  | "iata"
  | "icao"
  | "unlocode"
  | "viator"
  | "fareharbor"
  | "seatgeek"
  | "manual"
  | "internal";

export type DccSourceRef = {
  system: DccSourceSystem;
  id: string;
  label?: string;
  url?: string;
  confidence?: number;
  updated_at?: string | null;
};

export type DccEdgeType =
  | "parent_of"
  | "child_of"
  | "contains"
  | "contained_in"
  | "near"
  | "served_by"
  | "serves"
  | "connects_to"
  | "route_from"
  | "route_to"
  | "operated_by"
  | "offers"
  | "belongs_to"
  | "has_intent"
  | "has_theme"
  | "featured_in"
  | "related_to"
  | "same_as"
  | "alias_of"
  | "gateway_to"
  | "departure_for"
  | "arrival_for"
  | "covers"
  | "explains";

export type DccEdge = {
  type: DccEdgeType;
  to: string;
  weight?: number | null;
  meta?: Record<string, unknown>;
};

export type DccNode = {
  id: string;
  class: DccNodeClass;
  subclass?: string | null;
  slug: string;
  name: string;
  display_name?: string | null;
  status: DccStatus;
  visibility: DccVisibility;
  is_physical: boolean;
  aliases: string[];
  tags: string[];
  reference_code?: string | null;
  names?: {
    primary: string;
    ascii?: string | null;
    local?: string[];
    alternate?: string[];
    historic?: string[];
  };
  geo?: {
    lat?: number | null;
    lon?: number | null;
    elevation_m?: number | null;
    bbox?: [number, number, number, number] | null;
    geohash?: string | null;
  };
  map?: {
    geometry?:
      | { type: "Point"; coordinates: [number, number] }
      | { type: "Polygon"; coordinates: number[][][] }
      | { type: "MultiPolygon"; coordinates: number[][][][] }
      | null;
    bbox?: [number, number, number, number] | null;
    label_priority?: number | null;
    min_zoom?: number | null;
    max_zoom?: number | null;
    marker_style?: string | null;
    cluster_key?: string | null;
  };
  admin?: {
    continent_code?: string | null;
    continent_name?: string | null;
    country_code?: string | null;
    country_name?: string | null;
    admin1_code?: string | null;
    admin1_name?: string | null;
    admin2_code?: string | null;
    admin2_name?: string | null;
    locality?: string | null;
  };
  hierarchy?: {
    parent_ids: string[];
    ancestor_ids: string[];
    child_ids: string[];
  };
  links?: {
    canonical_path?: string | null;
    legacy_paths?: string[];
    authority_paths?: string[];
    outbound_urls?: { label: string; url: string }[];
  };
  source_refs: DccSourceRef[];
  metrics?: {
    population?: number | null;
    population_year?: number | null;
    passenger_volume?: number | null;
    annual_visitors?: number | null;
    review_count?: number | null;
    rating?: number | null;
  };
  travel?: {
    airports?: string[];
    ports?: string[];
    stations?: string[];
    roads?: string[];
    routes?: string[];
    operators?: string[];
    products?: string[];
  };
  content?: {
    summary?: string | null;
    long_description_md?: string | null;
    known_for?: string[];
    faq_refs?: string[];
    article_refs?: string[];
    trust_notes?: string[];
  };
  commerce?: {
    bookable?: boolean;
    operator_ids?: string[];
    product_ids?: string[];
    affiliate_ids?: string[];
  };
  edges: DccEdge[];
  meta: {
    version: number;
    created_at: string;
    updated_at: string;
    provenance: string[];
    quality_score?: number | null;
  };
};

export type DccRegistryPointer = {
  id: string;
  class: DccNodeClass;
  slug: string;
  file: string;
  line: number;
};
