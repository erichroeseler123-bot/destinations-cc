import { getRapidApiAirbnbConfig } from "@/lib/rapidapi/config";

export type AirbnbSearchListing = {
  id: string;
  title: string;
  location: string | null;
  residentType: string | null;
  superHost: boolean | null;
  beds: string | null;
  baths: string | null;
  bedrooms: string | null;
  guests: string | null;
  priceCurrency: string | null;
  pricePerNight: string | null;
  rating: string | null;
  reviewCount: string | null;
  samplePhotoUrl: string | null;
  listingUrl: string | null;
};

export type AirbnbPropertyDetail = AirbnbSearchListing & {
  amenities: string[];
  originalUrl: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function readAccommodation(value: unknown, key: string): string | null {
  const record = asRecord(value);
  return firstString(record?.[key]);
}

function readCosts(value: unknown, key: string): string | null {
  const record = asRecord(value);
  return firstString(record?.[key]);
}

function buildAirbnbSearchUrl(city: string): string {
  const normalized = city.trim().replace(/\s+/g, "-");
  return `https://www.airbnb.com/s/${encodeURIComponent(normalized)}/homes`;
}

async function rapidApiRequest(endpoint: string, params: Record<string, string>) {
  const config = getRapidApiAirbnbConfig();
  if (!config.apiKey) {
    throw new Error("missing_rapidapi_key");
  }

  const url = new URL(`${config.baseUrl}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-rapidapi-host": config.host,
      "x-rapidapi-key": config.apiKey,
    },
    next: { revalidate: config.revalidateSeconds },
  });

  if (!response.ok) {
    const message = (await response.text()).slice(0, 200);
    throw new Error(`rapidapi_airbnb_http_${response.status}:${message}`);
  }

  return response.json();
}

function normalizeSearchRows(payload: unknown): AirbnbSearchListing[] {
  const root = asRecord(payload);
  const body = asRecord(root?.body);
  const rows = Array.isArray(body?.residents) ? body.residents : [];

  return rows.flatMap((row, index) => {
    const record = asRecord(row);
    if (!record) return [];
    const accommodation = asRecord(record.accommodation);
    const costs = asRecord(record.costs);
    const listingUrl =
      firstString(record.url, record.listingUrl) ||
      (firstString(record.id) ? `https://www.airbnb.com/rooms/${firstString(record.id)}` : null);

    return [
      {
        id: firstString(record.id, record.listingId, record.position) || String(index + 1),
        title: firstString(record.title) || "Airbnb listing",
        location: firstString(record.location),
        residentType: firstString(record.residentType),
        superHost: typeof record.superHost === "boolean" ? record.superHost : null,
        beds: firstString(accommodation?.beds),
        baths: firstString(accommodation?.baths),
        bedrooms: firstString(accommodation?.bedrooms),
        guests: firstString(accommodation?.guests),
        priceCurrency: firstString(costs?.priceCurrency),
        pricePerNight: firstString(costs?.pricePerNight),
        rating: firstString(record.rating),
        reviewCount: firstString(record.personReviewed, record.reviewCount),
        samplePhotoUrl: firstString(record.samplePhotoUrl),
        listingUrl,
      } satisfies AirbnbSearchListing,
    ];
  });
}

function normalizePropertyDetail(payload: unknown, originalUrl: string): AirbnbPropertyDetail | null {
  const root = asRecord(payload);
  const body = asRecord(root?.body);
  if (!body) return null;

  const accommodation = asRecord(body.accommodation);
  const costs = asRecord(body.costs);
  const amenities = Array.isArray(body.amenities)
    ? body.amenities.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  return {
    id: firstString(body.id, body.listingId) || originalUrl,
    title: firstString(body.title) || "Airbnb listing",
    location: firstString(body.location),
    residentType: firstString(body.residentType),
    superHost: typeof body.superHost === "boolean" ? body.superHost : null,
    beds: firstString(accommodation?.beds),
    baths: firstString(accommodation?.baths),
    bedrooms: firstString(accommodation?.bedrooms),
    guests: firstString(accommodation?.guests),
    priceCurrency: firstString(costs?.priceCurrency),
    pricePerNight: firstString(costs?.pricePerNight),
    rating: firstString(body.rating),
    reviewCount: firstString(body.personReviewed, body.reviewCount),
    samplePhotoUrl: firstString(body.samplePhotoUrl),
    listingUrl: originalUrl,
    amenities,
    originalUrl,
  };
}

export async function searchAirbnbListingsByCity(city: string) {
  const url = buildAirbnbSearchUrl(city);
  const payload = await rapidApiRequest("search", { url });
  const listings = normalizeSearchRows(payload);
  return {
    source: "rapidapi_airbnb",
    city,
    queryUrl: url,
    listings,
  };
}

export async function getAirbnbPropertyDetails(listingUrl: string) {
  const payload = await rapidApiRequest("details", { url: listingUrl });
  return {
    source: "rapidapi_airbnb",
    detail: normalizePropertyDetail(payload, listingUrl),
  };
}
