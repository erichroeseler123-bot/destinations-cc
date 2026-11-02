export type DiscoverableLocation = {
  name: string;
  lat: number;
  lng: number;
  type: "city" | "venue" | "resort" | "port" | "island";
  qualityScore: number;
  canonicalNamedPath: string | null;
  hasDistinctSearchValue: boolean;
};

export const DISCOVERABLE_LOCATIONS: readonly DiscoverableLocation[] = [
  { name: "Denver, Colorado", lat: 39.7392, lng: -104.9903, type: "city", qualityScore: 100, canonicalNamedPath: "/cities/denver", hasDistinctSearchValue: false },
  { name: "Red Rocks Amphitheatre", lat: 39.6654, lng: -105.2057, type: "venue", qualityScore: 100, canonicalNamedPath: "/red-rocks", hasDistinctSearchValue: false },
  { name: "Breckenridge, Colorado", lat: 39.4817, lng: -106.0384, type: "resort", qualityScore: 95, canonicalNamedPath: "/routes/denver-breckenridge", hasDistinctSearchValue: false },
  { name: "Big Sky, Montana", lat: 45.2618, lng: -111.308, type: "resort", qualityScore: 95, canonicalNamedPath: null, hasDistinctSearchValue: false },
  { name: "New Orleans, Louisiana", lat: 29.9511, lng: -90.0715, type: "city", qualityScore: 100, canonicalNamedPath: "/new-orleans", hasDistinctSearchValue: false },
  { name: "Port of New Orleans, Louisiana", lat: 29.9395, lng: -90.0617, type: "port", qualityScore: 100, canonicalNamedPath: "/ports/new-orleans", hasDistinctSearchValue: false },
  { name: "Las Vegas, Nevada", lat: 36.1147, lng: -115.1728, type: "city", qualityScore: 100, canonicalNamedPath: "/vegas", hasDistinctSearchValue: false },
  { name: "Red Rock Canyon, Nevada", lat: 36.1358, lng: -115.4275, type: "venue", qualityScore: 95, canonicalNamedPath: "/vegas", hasDistinctSearchValue: false },
  { name: "Hoover Dam, Nevada/Arizona", lat: 36.0161, lng: -114.7377, type: "venue", qualityScore: 95, canonicalNamedPath: null, hasDistinctSearchValue: false },
  { name: "Juneau, Alaska", lat: 58.3019, lng: -134.4197, type: "port", qualityScore: 100, canonicalNamedPath: "/juneau", hasDistinctSearchValue: false },
  { name: "Juneau Cruise Port, Alaska", lat: 58.2989, lng: -134.4053, type: "port", qualityScore: 100, canonicalNamedPath: "/ports/juneau", hasDistinctSearchValue: false },
  { name: "Eisenhower-Johnson Memorial Tunnel, Colorado", lat: 39.6779, lng: -105.9056, type: "venue", qualityScore: 95, canonicalNamedPath: "/routes/denver-breckenridge", hasDistinctSearchValue: false },
  { name: "Wisconsin Dells, Wisconsin", lat: 43.6275, lng: -89.7709, type: "city", qualityScore: 90, canonicalNamedPath: null, hasDistinctSearchValue: false },
  { name: "Charlotte Amalie, St. Thomas", lat: 18.3419, lng: -64.9307, type: "port", qualityScore: 100, canonicalNamedPath: null, hasDistinctSearchValue: false },
  { name: "Christiansted, St. Croix", lat: 17.7466, lng: -64.7032, type: "city", qualityScore: 95, canonicalNamedPath: null, hasDistinctSearchValue: false },
  { name: "Cruz Bay, St. John", lat: 18.3313, lng: -64.7937, type: "port", qualityScore: 95, canonicalNamedPath: null, hasDistinctSearchValue: false },
] as const;

export function canonicalCoordinate(value: number) {
  return value.toFixed(5);
}

export function coordinateKey(lat: number, lng: number) {
  return `${canonicalCoordinate(lat)},${canonicalCoordinate(lng)}`;
}

const DISCOVERY_INDEX = new Map(
  DISCOVERABLE_LOCATIONS.map((location) => [coordinateKey(location.lat, location.lng), location]),
);

export function getDiscoverableLocation(lat: number, lng: number) {
  return DISCOVERY_INDEX.get(coordinateKey(lat, lng)) || null;
}

/**
 * Raw /location/{lat}/{lng} URLs are coordinate telemetry views.
 * Named place pages (/juneau, /red-rocks, /new-orleans, /vegas, /cities/denver, etc.)
 * are the canonical search destinations unless a coordinate page carries genuinely
 * distinct curated search value not represented by a named place route.
 */
export function isIndexableCoordinate(lat: number, lng: number) {
  const location = getDiscoverableLocation(lat, lng);
  return Boolean(
    location &&
      location.qualityScore >= 90 &&
      location.hasDistinctSearchValue &&
      !location.canonicalNamedPath,
  );
}

export function listKnownCoordinatePaths() {
  return DISCOVERABLE_LOCATIONS.map(
    (location) => `/location/${canonicalCoordinate(location.lat)}/${canonicalCoordinate(location.lng)}`,
  );
}

export function discoverableLocationPaths() {
  return DISCOVERABLE_LOCATIONS.filter((location) =>
    isIndexableCoordinate(location.lat, location.lng),
  ).map(
    (location) => `/location/${canonicalCoordinate(location.lat)}/${canonicalCoordinate(location.lng)}`,
  );
}
