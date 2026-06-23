import { getEnvOptional } from "@/lib/dcc/config/env";

export type StCroixCalendarEvent = {
  id: string;
  title: string;
  dateLabel: string;
  venueName: string;
  city: string;
  source: "ticketmaster" | "seatgeek";
  url: string | null;
  priceLabel: string | null;
  startsAt: string | null;
};

type RawEvent = StCroixCalendarEvent & {
  startsAt: string | null;
  searchSlug: string;
};

export type StCroixVenueCalendarGroup = {
  slug: string;
  name: string;
  location: string;
  description: string;
  events: StCroixCalendarEvent[];
};

const EVENT_LIMIT = 12;
const VENUE_EVENT_LIMIT = 6;

const SEARCH_AREAS = [
  {
    slug: "somerset-rivers-edge",
    label: "Somerset / River's Edge",
    location: "Somerset, WI",
    description: "Apple River tubing weekends, campground live music, and Somerset-area summer event demand.",
    lat: 45.1244,
    lon: -92.6735,
    radiusMiles: 35,
    keyword: "River's Edge Apple River concert",
  },
  {
    slug: "hudson-stillwater",
    label: "Hudson-Stillwater riverfront",
    location: "Hudson, WI / Stillwater, MN",
    description: "St. Croix riverfront concerts, civic festivals, park shows, and ticketed regional music nights.",
    lat: 45.015,
    lon: -92.78,
    radiusMiles: 40,
    keyword: "Hudson Stillwater music",
  },
  {
    slug: "mystic-lake-amphitheater",
    label: "Mystic Lake Amphitheater",
    location: "Shakopee, MN",
    description: "Large outdoor casino amphitheater dates and national touring acts southwest of the Twin Cities.",
    lat: 44.731,
    lon: -93.474,
    radiusMiles: 8,
    keyword: "Mystic Lake Amphitheater",
  },
  {
    slug: "the-ledge-amphitheater",
    label: "The Ledge Amphitheater",
    location: "Waite Park, MN",
    description: "Granite-quarry amphitheater concerts and destination-night shows near St. Cloud.",
    lat: 45.557,
    lon: -94.224,
    radiusMiles: 8,
    keyword: "The Ledge Amphitheater",
  },
] as const;

type SearchArea = (typeof SEARCH_AREAS)[number];

function formatDateLabel(value: string | null) {
  if (!value) return "Date TBA";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date TBA";
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function eventKey(event: Pick<RawEvent, "title" | "venueName" | "startsAt">) {
  return [event.title, event.venueName, event.startsAt || "date-tba"]
    .join("|")
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, "");
}

async function fetchTicketmasterEvents(areas: readonly SearchArea[] = SEARCH_AREAS): Promise<RawEvent[]> {
  const apiKey = getEnvOptional("TICKETMASTER_API_KEY");
  if (!apiKey) return [];

  const results = await Promise.all(
    areas.map(async (area) => {
      try {
        const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
        url.searchParams.set("apikey", apiKey);
        url.searchParams.set("latlong", `${area.lat},${area.lon}`);
        url.searchParams.set("radius", String(area.radiusMiles));
        url.searchParams.set("unit", "miles");
        url.searchParams.set("keyword", area.keyword);
        url.searchParams.set("classificationName", "music");
        url.searchParams.set("countryCode", "US");
        url.searchParams.set("size", "10");
        url.searchParams.set("sort", "date,asc");

        const response = await fetch(url.toString(), {
          headers: { Accept: "application/json" },
          next: { revalidate: 3600 },
        });
        if (!response.ok) return [];

        const json = (await response.json()) as {
          _embedded?: {
            events?: Array<{
              id?: string;
              name?: string;
              url?: string;
              dates?: { start?: { dateTime?: string; localDate?: string; localTime?: string } };
              _embedded?: { venues?: Array<{ name?: string; city?: { name?: string } }> };
            }>;
          };
        };

        return (json._embedded?.events || []).map((event): RawEvent => {
          const localDateTime = event.dates?.start?.dateTime ||
            (event.dates?.start?.localDate
              ? `${event.dates.start.localDate}T${event.dates.start.localTime || "19:00:00"}`
              : null);
          const venue = event._embedded?.venues?.[0];

          return {
            id: `ticketmaster:${event.id || event.name || area.label}`,
            title: event.name || "Live music event",
            startsAt: localDateTime,
            searchSlug: area.slug,
            dateLabel: formatDateLabel(localDateTime),
            venueName: venue?.name || area.label,
            city: venue?.city?.name || area.label,
            source: "ticketmaster",
            url: event.url || null,
            priceLabel: null,
          };
        });
      } catch {
        return [];
      }
    })
  );

  return results.flat();
}

async function fetchSeatGeekEvents(areas: readonly SearchArea[] = SEARCH_AREAS): Promise<RawEvent[]> {
  const clientId = getEnvOptional("SEATGEEK_CLIENT_ID");
  if (!clientId) return [];

  const results = await Promise.all(
    areas.map(async (area) => {
      try {
        const url = new URL("https://api.seatgeek.com/2/events");
        url.searchParams.set("client_id", clientId);
        url.searchParams.set("lat", String(area.lat));
        url.searchParams.set("lon", String(area.lon));
        url.searchParams.set("range", `${area.radiusMiles}mi`);
        url.searchParams.set("q", area.keyword);
        url.searchParams.set("taxonomies.name", "concert");
        url.searchParams.set("per_page", "10");
        url.searchParams.set("sort", "datetime_utc.asc");

        const response = await fetch(url.toString(), {
          headers: { Accept: "application/json" },
          next: { revalidate: 3600 },
        });
        if (!response.ok) return [];

        const json = (await response.json()) as {
          events?: Array<{
            id?: number | string;
            short_title?: string;
            title?: string;
            datetime_local?: string;
            url?: string;
            stats?: { lowest_price?: number | null };
            venue?: { name?: string; city?: string };
          }>;
        };

        return (json.events || []).map((event): RawEvent => {
          const startsAt = event.datetime_local || null;
          const price = typeof event.stats?.lowest_price === "number" ? event.stats.lowest_price : null;
          return {
            id: `seatgeek:${event.id || event.title || area.label}`,
            title: event.short_title || event.title || "Live music event",
            startsAt,
            searchSlug: area.slug,
            dateLabel: formatDateLabel(startsAt),
            venueName: event.venue?.name || area.label,
            city: event.venue?.city || area.label,
            source: "seatgeek",
            url: event.url || null,
            priceLabel: price ? `From $${Math.round(price)}` : null,
          };
        });
      } catch {
        return [];
      }
    })
  );

  return results.flat();
}

function normalizeEvents(events: RawEvent[], limit: number) {
  const sorted = events
    .filter((event) => event.title && event.venueName)
    .sort((a, b) => {
      if (!a.startsAt && !b.startsAt) return a.title.localeCompare(b.title);
      if (!a.startsAt) return 1;
      if (!b.startsAt) return -1;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });

  const deduped = new Map<string, StCroixCalendarEvent>();
  for (const event of sorted) {
    const key = eventKey(event);
    if (!deduped.has(key)) {
      const { searchSlug: _searchSlug, ...publicEvent } = event;
      deduped.set(key, publicEvent);
    }
  }

  return [...deduped.values()].slice(0, limit);
}

export async function getStCroixCalendarEvents(): Promise<StCroixCalendarEvent[]> {
  return normalizeEvents([...(await fetchTicketmasterEvents()), ...(await fetchSeatGeekEvents())], EVENT_LIMIT);
}

export async function getStCroixVenueCalendarGroups(): Promise<StCroixVenueCalendarGroup[]> {
  const events = [...(await fetchTicketmasterEvents()), ...(await fetchSeatGeekEvents())];

  return SEARCH_AREAS.map((area) => ({
    slug: area.slug,
    name: area.label,
    location: area.location,
    description: area.description,
    events: normalizeEvents(
      events.filter((event) => event.searchSlug === area.slug),
      VENUE_EVENT_LIMIT
    ),
  }));
}
