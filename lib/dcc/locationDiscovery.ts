export type DiscoverableLocation = {
  name: string;
  lat: number;
  lng: number;
  type: "city" | "venue" | "resort" | "port" | "island";
  qualityScore: number;
};

export const DISCOVERABLE_LOCATIONS: readonly DiscoverableLocation[] = [
  { name: "Denver, Colorado", lat: 39.7392, lng: -104.9903, type: "city", qualityScore: 100 },
  { name: "Red Rocks Amphitheatre", lat: 39.6654, lng: -105.2057, type: "venue", qualityScore: 100 },
  { name: "Breckenridge, Colorado", lat: 39.4817, lng: -106.0384, type: "resort", qualityScore: 95 },
  { name: "Big Sky, Montana", lat: 45.2618, lng: -111.308, type: "resort", qualityScore: 95 },
  { name: "New Orleans, Louisiana", lat: 29.9511, lng: -90.0715, type: "city", qualityScore: 100 },
  { name: "Juneau, Alaska", lat: 58.3019, lng: -134.4197, type: "port", qualityScore: 100 },
  { name: "Wisconsin Dells, Wisconsin", lat: 43.6275, lng: -89.7709, type: "city", qualityScore: 90 },
  { name: "Charlotte Amalie, St. Thomas", lat: 18.3419, lng: -64.9307, type: "port", qualityScore: 100 },
  { name: "Christiansted, St. Croix", lat: 17.7466, lng: -64.7032, type: "city", qualityScore: 95 },
  { name: "Cruz Bay, St. John", lat: 18.3313, lng: -64.7937, type: "port", qualityScore: 95 },
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

export function isIndexableCoordinate(lat: number, lng: number) {
  const location = getDiscoverableLocation(lat, lng);
  return Boolean(location && location.qualityScore >= 90);
}

export function discoverableLocationPaths() {
  return DISCOVERABLE_LOCATIONS.filter((location) => location.qualityScore >= 90).map(
    (location) => `/location/${canonicalCoordinate(location.lat)}/${canonicalCoordinate(location.lng)}`,
  );
}
