import cityRegistryJson from "@/data/cities/index.json";
import austinAnchorsJson from "@/data/cities/austin/anchors.json";
import austinDistrictsJson from "@/data/cities/austin/districts.json";
import austinEventsJson from "@/data/cities/austin/events.current.json";
import austinPlacesJson from "@/data/cities/austin/places.json";
import austinSignalsJson from "@/data/cities/austin/signals.live.json";
import austinVenuesJson from "@/data/cities/austin/venues.json";
import chicagoAnchorsJson from "@/data/cities/chicago/anchors.json";
import chicagoDistrictsJson from "@/data/cities/chicago/districts.json";
import chicagoEventsJson from "@/data/cities/chicago/events.current.json";
import chicagoPlacesJson from "@/data/cities/chicago/places.json";
import chicagoSignalsJson from "@/data/cities/chicago/signals.live.json";
import chicagoVenuesJson from "@/data/cities/chicago/venues.json";
import denverAnchorsJson from "@/data/cities/denver/anchors.json";
import denverDistrictsJson from "@/data/cities/denver/districts.json";
import denverEventsJson from "@/data/cities/denver/events.current.json";
import denverPlacesJson from "@/data/cities/denver/places.json";
import denverSignalsJson from "@/data/cities/denver/signals.live.json";
import denverVenuesJson from "@/data/cities/denver/venues.json";
import miamiAnchorsJson from "@/data/cities/miami/anchors.json";
import miamiDistrictsJson from "@/data/cities/miami/districts.json";
import miamiEventsJson from "@/data/cities/miami/events.current.json";
import miamiPlacesJson from "@/data/cities/miami/places.json";
import miamiSignalsJson from "@/data/cities/miami/signals.live.json";
import miamiVenuesJson from "@/data/cities/miami/venues.json";
import nashvilleAnchorsJson from "@/data/cities/nashville/anchors.json";
import nashvilleDistrictsJson from "@/data/cities/nashville/districts.json";
import nashvilleEventsJson from "@/data/cities/nashville/events.current.json";
import nashvillePlacesJson from "@/data/cities/nashville/places.json";
import nashvilleSignalsJson from "@/data/cities/nashville/signals.live.json";
import nashvilleVenuesJson from "@/data/cities/nashville/venues.json";
import newYorkCityAnchorsJson from "@/data/cities/new-york-city/anchors.json";
import newYorkCityDistrictsJson from "@/data/cities/new-york-city/districts.json";
import newYorkCityEventsJson from "@/data/cities/new-york-city/events.current.json";
import newYorkCityPlacesJson from "@/data/cities/new-york-city/places.json";
import newYorkCitySignalsJson from "@/data/cities/new-york-city/signals.live.json";
import newYorkCityVenuesJson from "@/data/cities/new-york-city/venues.json";
import {
  LiveCityAnchorsFileSchema,
  LiveCityDistrictsFileSchema,
  LiveCityEventsFileSchema,
  LiveCityPlacesFileSchema,
  LiveCityRegistrySchema,
  LiveCitySignalsFileSchema,
  LiveCityVenuesFileSchema,
  type LiveCityAnchor,
  type LiveCityDistrict,
  type LiveCityEvent,
  type LiveCityPlace,
  type LiveCityRegistryEntry,
  type LiveCitySignal,
  type LiveCityVenue,
} from "@/lib/dcc/liveCity/schema";
import { scoreSignalForAnchor } from "@/lib/dcc/liveCity/relevance";

export const LIVE_CITY_REGISTRY = LiveCityRegistrySchema.parse(cityRegistryJson);

const LIVE_CITY_DATA = {
  austin: {
    anchors: LiveCityAnchorsFileSchema.parse(austinAnchorsJson),
    districts: LiveCityDistrictsFileSchema.parse(austinDistrictsJson),
    venues: LiveCityVenuesFileSchema.parse(austinVenuesJson),
    places: LiveCityPlacesFileSchema.parse(austinPlacesJson),
    events: LiveCityEventsFileSchema.parse(austinEventsJson),
    signals: LiveCitySignalsFileSchema.parse(austinSignalsJson),
  },
  chicago: {
    anchors: LiveCityAnchorsFileSchema.parse(chicagoAnchorsJson),
    districts: LiveCityDistrictsFileSchema.parse(chicagoDistrictsJson),
    venues: LiveCityVenuesFileSchema.parse(chicagoVenuesJson),
    places: LiveCityPlacesFileSchema.parse(chicagoPlacesJson),
    events: LiveCityEventsFileSchema.parse(chicagoEventsJson),
    signals: LiveCitySignalsFileSchema.parse(chicagoSignalsJson),
  },
  denver: {
    anchors: LiveCityAnchorsFileSchema.parse(denverAnchorsJson),
    districts: LiveCityDistrictsFileSchema.parse(denverDistrictsJson),
    venues: LiveCityVenuesFileSchema.parse(denverVenuesJson),
    places: LiveCityPlacesFileSchema.parse(denverPlacesJson),
    events: LiveCityEventsFileSchema.parse(denverEventsJson),
    signals: LiveCitySignalsFileSchema.parse(denverSignalsJson),
  },
  miami: {
    anchors: LiveCityAnchorsFileSchema.parse(miamiAnchorsJson),
    districts: LiveCityDistrictsFileSchema.parse(miamiDistrictsJson),
    venues: LiveCityVenuesFileSchema.parse(miamiVenuesJson),
    places: LiveCityPlacesFileSchema.parse(miamiPlacesJson),
    events: LiveCityEventsFileSchema.parse(miamiEventsJson),
    signals: LiveCitySignalsFileSchema.parse(miamiSignalsJson),
  },
  nashville: {
    anchors: LiveCityAnchorsFileSchema.parse(nashvilleAnchorsJson),
    districts: LiveCityDistrictsFileSchema.parse(nashvilleDistrictsJson),
    venues: LiveCityVenuesFileSchema.parse(nashvilleVenuesJson),
    places: LiveCityPlacesFileSchema.parse(nashvillePlacesJson),
    events: LiveCityEventsFileSchema.parse(nashvilleEventsJson),
    signals: LiveCitySignalsFileSchema.parse(nashvilleSignalsJson),
  },
  "new-york-city": {
    anchors: LiveCityAnchorsFileSchema.parse(newYorkCityAnchorsJson),
    districts: LiveCityDistrictsFileSchema.parse(newYorkCityDistrictsJson),
    venues: LiveCityVenuesFileSchema.parse(newYorkCityVenuesJson),
    places: LiveCityPlacesFileSchema.parse(newYorkCityPlacesJson),
    events: LiveCityEventsFileSchema.parse(newYorkCityEventsJson),
    signals: LiveCitySignalsFileSchema.parse(newYorkCitySignalsJson),
  },
} as const;

export { LIVE_CITY_DATA };
export type LiveCityKey = keyof typeof LIVE_CITY_DATA;

export function listLiveCityKeys(): LiveCityKey[] {
  return Object.keys(LIVE_CITY_DATA) as LiveCityKey[];
}

export function isLiveCityKey(value: string): value is LiveCityKey {
  return value in LIVE_CITY_DATA;
}

export function getLiveCityRegistryEntry(city: LiveCityKey): LiveCityRegistryEntry | null {
  return LIVE_CITY_REGISTRY.cities.find((entry) => entry.slug === city) ?? null;
}

export function getLiveCityBundle(city: LiveCityKey) {
  return LIVE_CITY_DATA[city];
}

export function getLiveCityAnchor(city: LiveCityKey, slug: string): LiveCityAnchor | null {
  return LIVE_CITY_DATA[city].anchors.anchors.find((anchor) => anchor.slug === slug) ?? null;
}

export function getLiveCityDistrict(city: LiveCityKey, slug: string): LiveCityDistrict | null {
  return LIVE_CITY_DATA[city].districts.districts.find((district) => district.slug === slug) ?? null;
}

export function getLiveCityVenue(city: LiveCityKey, slug: string): LiveCityVenue | null {
  return LIVE_CITY_DATA[city].venues.venues.find((venue) => venue.slug === slug) ?? null;
}

export function getLiveCityPlace(city: LiveCityKey, slug: string): LiveCityPlace | null {
  return LIVE_CITY_DATA[city].places.places.find((place) => place.slug === slug) ?? null;
}

export function getLiveCityEvent(city: LiveCityKey, id: string): LiveCityEvent | null {
  return LIVE_CITY_DATA[city].events.events.find((event) => event.id === id) ?? null;
}

export function getSignalsNearAnchor(city: LiveCityKey, anchorSlug: string): LiveCitySignal[] {
  return LIVE_CITY_DATA[city].signals.signals.filter((signal) => signal.near_anchor_slugs.includes(anchorSlug));
}

export function getScoredSignalsNearAnchor(city: LiveCityKey, anchorSlug: string) {
  const anchor = getLiveCityAnchor(city, anchorSlug);
  if (!anchor) {
    return [];
  }

  const venuesBySlug = new Map(LIVE_CITY_DATA[city].venues.venues.map((venue) => [venue.slug, venue]));
  const placesBySlug = new Map(LIVE_CITY_DATA[city].places.places.map((place) => [place.slug, place]));
  const districtsBySlug = new Map(LIVE_CITY_DATA[city].districts.districts.map((district) => [district.slug, district]));

  return LIVE_CITY_DATA[city].signals.signals
    .map((signal) =>
      scoreSignalForAnchor({
        anchor,
        signal,
        venuesBySlug,
        placesBySlug,
        districtsBySlug,
      })
    )
    .sort((a, b) => b.score - a.score);
}

export function getSignalsForDistrict(city: LiveCityKey, districtSlug: string): LiveCitySignal[] {
  return LIVE_CITY_DATA[city].signals.signals.filter((signal) => signal.affected_district_slugs?.includes(districtSlug));
}

export function getActiveSignals(city: LiveCityKey, at = new Date()): LiveCitySignal[] {
  return LIVE_CITY_DATA[city].signals.signals.filter((signal) => {
    const startsAt = new Date(signal.starts_at).getTime();
    const expiresAt = new Date(signal.expires_at).getTime();
    const current = at.getTime();
    return current >= startsAt && current <= expiresAt && signal.status !== "expired";
  });
}
