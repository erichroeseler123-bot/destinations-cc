import { unstable_cache } from "next/cache";

type SeatGeekVenue = {
  id?: number;
  name?: string;
  city?: string;
  state?: string;
};

type SeatGeekPerformer = {
  name?: string;
  image?: string;
};

type SeatGeekEvent = {
  id: number;
  title?: string;
  datetime_local?: string;
  url?: string;
  type?: string;
  short_title?: string;
  venue?: SeatGeekVenue;
  performers?: SeatGeekPerformer[];
  stats?: {
    lowest_price?: number | null;
    highest_price?: number | null;
  };
  taxonomies?: Array<{
    name?: string;
    parent?: { name?: string };
  }>;
};

type SeatGeekResponse = {
  events?: SeatGeekEvent[];
};

export type VegasMarketplaceShow = {
  id: string;
  source: "seatgeek";
  title: string;
  shortTitle: string | null;
  url: string | null;
  imageUrl: string | null;
  localDate: string | null;
  localTime: string | null;
  venueName: string | null;
  genre: string | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  performerNames: string[];
};

const SEATGEEK_BASE = "https://api.seatgeek.com/2/events";

function requireSeatGeekKey() {
  const key =
    process.env.SEATGEEK_CLIENT_ID
    || process.env.SEATGEEK_API_KEY
    || process.env.NEXT_PUBLIC_SEATGEEK_CLIENT_ID;
  if (!key) {
    throw new Error("Missing SeatGeek key. Set SEATGEEK_CLIENT_ID or SEATGEEK_API_KEY.");
  }
  return key;
}

function splitDateTime(value?: string | null) {
  if (!value) return { localDate: null, localTime: null };
  const [localDate, localTime] = value.split("T");
  return { localDate: localDate || null, localTime: localTime || null };
}

function normalizeSeatGeekEvent(event: SeatGeekEvent): VegasMarketplaceShow {
  const { localDate, localTime } = splitDateTime(event.datetime_local);
  const taxonomy = event.taxonomies?.[0];

  return {
    id: `seatgeek:${event.id}`,
    source: "seatgeek",
    title: event.title || "Untitled event",
    shortTitle: event.short_title || null,
    url: event.url || null,
    imageUrl: event.performers?.find((performer) => performer.image)?.image || null,
    localDate,
    localTime,
    venueName: event.venue?.name || null,
    genre: taxonomy?.parent?.name || taxonomy?.name || event.type || null,
    lowestPrice:
      typeof event.stats?.lowest_price === "number" ? event.stats.lowest_price : null,
    highestPrice:
      typeof event.stats?.highest_price === "number" ? event.stats.highest_price : null,
    performerNames: event.performers?.map((performer) => performer.name).filter(Boolean) as string[] || [],
  };
}

async function fetchSeatGeekVegasEvents() {
  const key = requireSeatGeekKey();
  const url = new URL(SEATGEEK_BASE);
  url.searchParams.set("client_id", key);
  url.searchParams.set("venue.city", "Las Vegas");
  url.searchParams.set("venue.state", "NV");
  url.searchParams.set("per_page", "100");
  url.searchParams.set("sort", "datetime_local.asc");
  url.searchParams.set("datetime_utc.gte", new Date().toISOString());

  const response = await fetch(url.toString(), {
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SeatGeek error ${response.status}: ${body.slice(0, 300)}`);
  }

  return (await response.json()) as SeatGeekResponse;
}

const getCachedSeatGeekVegasEvents = unstable_cache(
  async () => {
    const payload = await fetchSeatGeekVegasEvents();
    return (payload.events || [])
      .map(normalizeSeatGeekEvent)
      .filter((event, index, list) => list.findIndex((item) => item.id === event.id) === index);
  },
  ["saveonthestrip-seatgeek-vegas-events"],
  { revalidate: 900 }
);

export async function getSeatGeekVegasEvents() {
  return getCachedSeatGeekVegasEvents();
}
