/**
 * FareHarbor External API Date-Range Query Utility
 * 
 * Uses FareHarbor External API v1:
 * GET /api/external/v1/companies/{company_shortname}/items/{item_pk}/minimal/availabilities/date-range/{start_date}/{end_date}/
 * 
 * Using `/minimal/` reduces response payloads by ~85% by stripping custom forms,
 * eliminating 504 Gateway Timeouts when scanning multi-week cruise availability.
 */

export interface FareHarborMinimalAvailability {
  pk: number;
  start_at: string; // ISO 8601 string, e.g. "2026-07-14T10:30:00-08:00"
  end_at: string;
  capacity: number; // Available spots
  spots_total: number;
  item: {
    pk: number;
    name?: string;
  };
  headline?: string;
  is_bookable?: boolean;
}

export interface FareHarborDateRangeResponse {
  availabilities: FareHarborMinimalAvailability[];
}

export const OPERATOR_ENDPOINTS = {
  temsco_juneau: {
    shortname: "temscoair-juneau",
    name: "TEMSCO Helicopters (Juneau)",
    items: {
      dog_sledding: 214810,
      glacier_landing: 214803,
      pilots_choice: 214807,
    },
  },
  temsco_skagway: {
    shortname: "temscoair-skagway",
    name: "TEMSCO Helicopters (Skagway)",
    items: {
      dog_sledding: 213556,
      glacier_landing: 213561,
    },
  },
  coastal: {
    shortname: "coastalhelicopters",
    name: "Coastal Helicopters",
    items: {
      icefield: 413056,
      dog_sledding: 413073,
    },
  },
  northstar: {
    shortname: "northstartrekking",
    name: "NorthStar Trekking",
    items: {
      ice_trek: 116035,
      dog_sledding: 115991,
    },
  },
};

export const JUNEAU_OPERATORS = {
  welcometoalaskatours: {
    shortname: "welcometoalaskatours",
    name: "Welcome to Alaska Tours (Merchant Pipe)",
    items: {
      temsco_dog_sledding: 214810,
      temsco_glacier_landing: 214803,
      coastal_icefield: 413056,
      northstar_ice_trek: 116035,
    },
  },
};

/**
 * Splits a date range into chunks not exceeding maxDays (default 14 days)
 * to comply with FareHarbor rate limits and prevent timeout on large sweeps.
 */
export function chunkDateRange(startDateStr: string, endDateStr: string, maxDays = 14): Array<{ start: string; end: string }> {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const chunks: Array<{ start: string; end: string }> = [];

  let current = new Date(start);

  while (current <= end) {
    const chunkEnd = new Date(current);
    chunkEnd.setDate(chunkEnd.getDate() + (maxDays - 1));

    const finalChunkEnd = chunkEnd < end ? chunkEnd : end;

    chunks.push({
      start: current.toISOString().slice(0, 10),
      end: finalChunkEnd.toISOString().slice(0, 10),
    });

    current = new Date(finalChunkEnd);
    current.setDate(current.getDate() + 1);
  }

  return chunks;
}

export interface FetchAvailabilitiesOptions {
  companyShortname?: string;
  itemPk: number | string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * Fetches minimal availabilities for an item across a date range.
 * If API credentials are not provided in environment variables, returns simulated
 * availability for testing/staging.
 */
export async function fetchFareHarborDateRange({
  companyShortname = "welcometoalaskatours",
  itemPk,
  startDate,
  endDate,
}: FetchAvailabilitiesOptions): Promise<FareHarborMinimalAvailability[]> {
  const appKey = process.env.FAREHARBOR_APP_KEY;
  const userKey = process.env.FAREHARBOR_USER_KEY;

  // In development/staging without credentials, simulate realistic availability responses
  if (!appKey || !userKey) {
    return simulateAvailabilities(itemPk, startDate, endDate);
  }

  const chunks = chunkDateRange(startDate, endDate, 14);
  const allAvailabilities: FareHarborMinimalAvailability[] = [];

  for (const chunk of chunks) {
    const url = `https://fareharbor.com/api/external/v1/companies/${companyShortname}/items/${itemPk}/minimal/availabilities/date-range/${chunk.start}/${chunk.end}/`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "X-FareHarbor-API-App": appKey,
          "X-FareHarbor-API-User": userKey,
          Accept: "application/json",
        },
        // Cache for 60 seconds to prevent rapid redundant calls
        next: { revalidate: 60 },
      });

      if (!res.ok) {
        console.warn(`[FareHarbor API] HTTP ${res.status} fetching ${url}`);
        continue;
      }

      const data: FareHarborDateRangeResponse = await res.json();
      if (Array.isArray(data.availabilities)) {
        allAvailabilities.push(...data.availabilities);
      }
    } catch (err) {
      console.error(`[FareHarbor API] Fetch error for chunk ${chunk.start}..${chunk.end}:`, err);
    }
  }

  return allAvailabilities;
}

/**
 * Filters out sold-out slots (capacity <= 0) and sorts by start time.
 */
export function filterOpenAvailabilities(
  availabilities: FareHarborMinimalAvailability[],
  minSeats = 1
): FareHarborMinimalAvailability[] {
  return availabilities
    .filter((a) => a.capacity >= minSeats)
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}

/**
 * Helper to generate a direct booking or checkout embed URL
 */
export function buildFareHarborDirectBookingUrl(
  companyShortname: string,
  itemPk: number | string,
  availabilityPk?: number | string
): string {
  const base = `https://fareharbor.com/embeds/book/${companyShortname}/items/${itemPk}/`;
  const params = new URLSearchParams({
    ref: "juneauflightdeck",
    asn: "welcometoalaskatours",
    full_items: "yes",
    flow: "waitlist_match",
  });
  if (availabilityPk) {
    params.set("availability", String(availabilityPk));
  }
  return `${base}?${params.toString()}`;
}

/**
 * Realistic local mock simulator when API keys are not present
 */
function simulateAvailabilities(
  itemPk: number | string,
  startDate: string,
  endDate: string
): FareHarborMinimalAvailability[] {
  const results: FareHarborMinimalAvailability[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const cur = new Date(start);
  let idCounter = 90000;

  while (cur <= end) {
    const dateStr = cur.toISOString().slice(0, 10);

    // Simulate occasional cancellation drops (e.g., on specific dates or Tuesdays/Thursdays)
    const dayOfWeek = cur.getDay();
    if (dayOfWeek === 2 || dayOfWeek === 4 || dateStr.endsWith("14") || dateStr.endsWith("22")) {
      results.push({
        pk: idCounter++,
        start_at: `${dateStr}T13:30:00-08:00`,
        end_at: `${dateStr}T15:45:00-08:00`,
        capacity: 4,
        spots_total: 6,
        item: {
          pk: typeof itemPk === "number" ? itemPk : parseInt(itemPk, 10) || 560825,
          name: "Glacier Helicopter Excursion",
        },
        is_bookable: true,
      });

      results.push({
        pk: idCounter++,
        start_at: `${dateStr}T15:00:00-08:00`,
        end_at: `${dateStr}T17:15:00-08:00`,
        capacity: 2,
        spots_total: 6,
        item: {
          pk: typeof itemPk === "number" ? itemPk : parseInt(itemPk, 10) || 560825,
          name: "Glacier Helicopter Excursion",
        },
        is_bookable: true,
      });
    }

    cur.setDate(cur.getDate() + 1);
  }

  return results;
}
