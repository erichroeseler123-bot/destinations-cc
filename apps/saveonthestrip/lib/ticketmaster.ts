import { unstable_cache } from "next/cache";

type TicketmasterImage = {
  url?: string;
  width?: number;
  height?: number;
  ratio?: string;
};

type TicketmasterVenue = {
  id?: string;
  name?: string;
  city?: { name?: string };
  state?: { stateCode?: string; name?: string };
};

type TicketmasterAttraction = {
  id?: string;
  name?: string;
};

type TicketmasterEvent = {
  id: string;
  name?: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
  images?: TicketmasterImage[];
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
      dateTBA?: boolean;
      dateTBD?: boolean;
      timeTBA?: boolean;
      noSpecificTime?: boolean;
    };
    timezone?: string;
    status?: { code?: string };
  };
  priceRanges?: Array<{
    min?: number;
    max?: number;
    currency?: string;
  }>;
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
    primary?: boolean;
  }>;
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
};

type TicketmasterEventsResponse = {
  _embedded?: { events?: TicketmasterEvent[] };
  page?: {
    size?: number;
    totalElements?: number;
    totalPages?: number;
    number?: number;
  };
};

export type VegasShow = {
  id: string;
  name: string;
  url: string | null;
  imageUrl: string | null;
  venueName: string | null;
  cityName: string | null;
  localDate: string | null;
  localTime: string | null;
  dateTime: string | null;
  timezone: string | null;
  status: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  currency: string | null;
  segment: string | null;
  genre: string | null;
  subGenre: string | null;
  attractionNames: string[];
  summary: string | null;
};

export type VegasShowFilters = {
  genre?: string | null;
  venue?: string | null;
  q?: string | null;
};

const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";
const VEGAS_SEGMENTS = new Set(["Music", "Arts & Theatre", "Miscellaneous"]);

function requireTicketmasterKey() {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) {
    throw new Error("Missing TICKETMASTER_API_KEY");
  }
  return key;
}

function pickBestImage(images: TicketmasterImage[] | undefined) {
  if (!images?.length) return null;
  return [...images]
    .sort((a, b) => (b.width || 0) - (a.width || 0))
    .find((image) => image.url)?.url || null;
}

function normalizeVegasShow(event: TicketmasterEvent): VegasShow {
  const classification = event.classifications?.find((item) => item.primary) || event.classifications?.[0];
  const venue = event._embedded?.venues?.[0];
  const price = event.priceRanges?.[0];

  return {
    id: event.id,
    name: event.name || "Unnamed show",
    url: event.url || null,
    imageUrl: pickBestImage(event.images),
    venueName: venue?.name || null,
    cityName: venue?.city?.name || null,
    localDate: event.dates?.start?.localDate || null,
    localTime: event.dates?.start?.localTime || null,
    dateTime: event.dates?.start?.dateTime || null,
    timezone: event.dates?.timezone || null,
    status: event.dates?.status?.code || null,
    minPrice: typeof price?.min === "number" ? price.min : null,
    maxPrice: typeof price?.max === "number" ? price.max : null,
    currency: price?.currency || null,
    segment: classification?.segment?.name || null,
    genre: classification?.genre?.name || null,
    subGenre: classification?.subGenre?.name || null,
    attractionNames: event._embedded?.attractions?.map((item) => item.name).filter(Boolean) as string[] || [],
    summary: event.info || event.pleaseNote || null,
  };
}

async function fetchTicketmasterPage(page: number, size = 200) {
  const key = requireTicketmasterKey();
  const url = new URL(BASE_URL);
  url.searchParams.set("apikey", key);
  url.searchParams.set("source", "ticketmaster");
  url.searchParams.set("city", "Las Vegas");
  url.searchParams.set("stateCode", "NV");
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("size", String(size));
  url.searchParams.set("page", String(page));
  url.searchParams.set("includeTBA", "no");
  url.searchParams.set("includeTBD", "no");
  url.searchParams.set("includeTest", "no");
  url.searchParams.set("startDateTime", new Date().toISOString());

  const response = await fetch(url.toString(), {
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ticketmaster error ${response.status}: ${body.slice(0, 300)}`);
  }

  return (await response.json()) as TicketmasterEventsResponse;
}

async function loadVegasShows(limitPages = 4): Promise<VegasShow[]> {
  const firstPage = await fetchTicketmasterPage(0);
  const totalPages = Math.min(firstPage.page?.totalPages || 1, limitPages);
  const events = [...(firstPage._embedded?.events || [])];

  for (let page = 1; page < totalPages; page += 1) {
    const nextPage = await fetchTicketmasterPage(page);
    events.push(...(nextPage._embedded?.events || []));
  }

  return events
    .filter((event) => {
      const segment = event.classifications?.find((item) => item.primary)?.segment?.name
        || event.classifications?.[0]?.segment?.name
        || null;
      return !segment || VEGAS_SEGMENTS.has(segment);
    })
    .map(normalizeVegasShow)
    .filter((event, index, list) => list.findIndex((item) => item.id === event.id) === index)
    .sort((a, b) => {
      const left = a.dateTime || a.localDate || "";
      const right = b.dateTime || b.localDate || "";
      return left.localeCompare(right);
    });
}

const getCachedVegasShows = unstable_cache(
  async () => loadVegasShows(),
  ["saveonthestrip-ticketmaster-vegas-shows"],
  { revalidate: 900 }
);

function matchesText(show: VegasShow, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    show.name,
    show.venueName,
    show.genre,
    show.subGenre,
    ...show.attractionNames,
    show.summary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export async function getVegasShows(filters: VegasShowFilters = {}): Promise<VegasShow[]> {
  const shows = await getCachedVegasShows();
  const genre = filters.genre?.trim().toLowerCase();
  const venue = filters.venue?.trim().toLowerCase();
  const q = filters.q?.trim() || "";

  return shows.filter((show) => {
    if (genre && (show.genre || "").toLowerCase() !== genre) return false;
    if (venue && (show.venueName || "").toLowerCase() !== venue) return false;
    if (q && !matchesText(show, q)) return false;
    return true;
  });
}

export async function getVegasShowFilterOptions() {
  const shows = await getCachedVegasShows();
  const genres = Array.from(new Set(shows.map((show) => show.genre).filter(Boolean) as string[])).sort();
  const venues = Array.from(new Set(shows.map((show) => show.venueName).filter(Boolean) as string[])).sort();

  return { genres, venues, totalShows: shows.length };
}
