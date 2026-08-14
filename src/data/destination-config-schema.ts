export type DestinationCapability = "weather" | "webcams" | "streetView" | "transit" | "marine" | "events" | "cruiseCalls" | "roads";

export type DestinationEntityKind =
  | "Destination"
  | "Neighborhood"
  | "Place"
  | "Port"
  | "Airport"
  | "Venue"
  | "LiveSource"
  | "CruiseCall"
  | "Driver"
  | "Vehicle"
  | "TransportationService";

export type DestinationRelation =
  | "locatedIn"
  | "contains"
  | "servesArea"
  | "accessibleFrom"
  | "arrivesAt"
  | "departsFrom"
  | "operatesVehicle";

export type DestinationPlaceConfig = {
  id: string;
  slug: string;
  name: string;
  kind: "Neighborhood" | "Beach" | "Viewpoint" | "Port" | "Airport" | "Landmark" | "Venue" | "District" | "Other";
  summary?: string;
  lat?: number;
  lng?: number;
  relatedIds?: string[];
};

export type LiveSourceConfig = {
  id: string;
  type: "weather" | "webcam" | "events" | "marine" | "transit" | "roads" | "cruise_calls";
  provider: string;
  url?: string;
  cacheMinutes?: number;
  enabled?: boolean;
};

export type CommercialActionConfig = {
  id: string;
  intent: string;
  label: string;
  description?: string;
  href: string;
  provider: string;
  pageKinds?: string[];
  placeIds?: string[];
  destinationIds?: string[];
  priority?: number;
};

export type DestinationConfig = {
  id: string;
  slug: string;
  name: string;
  type: "TouristDestination";
  timezone: string;
  lat?: number;
  lng?: number;
  capabilities: DestinationCapability[];
  places: DestinationPlaceConfig[];
  liveSources: LiveSourceConfig[];
  eventProviders?: string[];
  commercialActions: CommercialActionConfig[];
};

export function assertCanonicalEntityId(destinationId: string, entityId: string) {
  if (entityId === destinationId) return entityId;
  if (!entityId.startsWith(`${destinationId}/`)) {
    throw new Error(`Entity id ${entityId} must be namespaced under ${destinationId}`);
  }
  return entityId;
}

export function validateDestinationConfig(config: DestinationConfig) {
  if (config.id !== config.slug) throw new Error(`Destination id and slug must match: ${config.id}`);
  for (const place of config.places) assertCanonicalEntityId(config.id, place.id);
  const duplicateIds = config.places.map((place) => place.id).filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicateIds.length) throw new Error(`Duplicate place ids in ${config.id}: ${duplicateIds.join(", ")}`);
  return config;
}
