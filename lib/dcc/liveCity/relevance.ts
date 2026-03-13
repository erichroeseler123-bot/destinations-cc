import type {
  LiveCityAnchor,
  LiveCityDistrict,
  LiveCityPlace,
  LiveCitySignal,
  LiveCityVenue,
} from "@/lib/dcc/liveCity/schema";

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusM = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusM * Math.asin(Math.sqrt(a));
}

function impactWeight(level: LiveCitySignal["impact_level"]) {
  switch (level) {
    case "high":
      return 1;
    case "medium-high":
      return 0.8;
    case "medium":
      return 0.6;
    default:
      return 0.35;
  }
}

function distanceWeight(distanceM: number, walkRadiusM: number) {
  if (!Number.isFinite(distanceM)) {
    return 0;
  }

  const clamped = Math.max(0, 1 - distanceM / Math.max(walkRadiusM, 1));
  return clamped;
}

type ScoringContext = {
  anchor: LiveCityAnchor;
  signal: LiveCitySignal;
  venuesBySlug: Map<string, LiveCityVenue>;
  placesBySlug: Map<string, LiveCityPlace>;
  districtsBySlug: Map<string, LiveCityDistrict>;
};

export function scoreSignalForAnchor({
  anchor,
  signal,
  venuesBySlug,
  placesBySlug,
  districtsBySlug,
}: ScoringContext) {
  const districtOverlapCount =
    signal.affected_district_slugs?.filter((district) => anchor.district_slugs.includes(district)).length ?? 0;
  const districtOverlap = districtOverlapCount > 0 ? Math.min(1, districtOverlapCount / anchor.district_slugs.length) : 0;

  let distanceM = Number.POSITIVE_INFINITY;
  if (signal.linked_venue_slug) {
    const venue = venuesBySlug.get(signal.linked_venue_slug);
    if (venue) {
      distanceM = haversineMeters(anchor.lat, anchor.lng, venue.lat, venue.lng);
    }
  } else if (signal.linked_place_slug) {
    const place = placesBySlug.get(signal.linked_place_slug);
    if (place) {
      distanceM = haversineMeters(anchor.lat, anchor.lng, place.lat, place.lng);
    }
  } else if (signal.affected_district_slugs?.[0]) {
    const district = districtsBySlug.get(signal.affected_district_slugs[0]);
    if (district) {
      distanceM = haversineMeters(anchor.lat, anchor.lng, district.center.lat, district.center.lng);
    }
  }

  const score =
    (signal.near_anchor_slugs.includes(anchor.slug) ? 0.35 : 0) +
    districtOverlap * 0.25 +
    distanceWeight(distanceM, anchor.default_walk_radius_m) * 0.2 +
    impactWeight(signal.impact_level) * 0.15 +
    signal.rank_weight * 0.05;

  return {
    signal,
    score,
    distance_m: Number.isFinite(distanceM) ? Math.round(distanceM) : null,
    district_overlap: districtOverlapCount,
  };
}
