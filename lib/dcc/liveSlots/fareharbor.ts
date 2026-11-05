export type FareHarborItem = {
  pk?: string | number;
  name?: string;
  title?: string;
  headline?: string;
  description?: string;
  cancellation_policy_hours?: number | null;
  image_cdn_url?: string | null;
};

type FareHarborItemsResponse = {
  items?: FareHarborItem[];
};

export type FareHarborAvailability = {
  pk: string | number;
  start_at?: string;
  start?: string;
  capacity?: number;
  booked_count?: number;
  customer_type_rates?: Array<{ label?: string; price?: number }>;
};

type FareHarborAvailabilitiesResponse = {
  availabilities?: FareHarborAvailability[];
};

const BASE = "https://fareharbor.com/api/external/v1";

function getHeaders() {
  const appKey = String(
    process.env.FAREHARBOR_API_APP_KEY ||
      process.env.FAREHARBOR_APP_KEY ||
      process.env.FAREHARBOR_APP_NAME ||
      "destinationcommandcenter",
  ).trim();
  const userKey = String(
    process.env.FAREHARBOR_API_USER_KEY ||
      process.env.FAREHARBOR_USER_KEY ||
      process.env.DCC_FH_API ||
      "",
  ).trim();

  if (!userKey) {
    throw new Error("Missing FareHarbor API credentials");
  }

  return {
    "X-FareHarbor-API-App": appKey,
    "X-FareHarbor-API-User": userKey,
    Accept: "application/json",
    "User-Agent": "destinationcommandcenter/1.0 (+destinationcommandcenter.com)",
  };
}

export function formatPriceLabel(cents: number | null | undefined) {
  if (!Number.isFinite(cents) || !cents || cents <= 0) return undefined;
  const dollars = Number(cents) / 100;
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`;
}

export async function fetchItems(shortname: string): Promise<FareHarborItem[]> {
  const response = await fetch(
    `${BASE}/companies/${encodeURIComponent(shortname)}/items/`,
    {
      headers: getHeaders(),
      next: { revalidate: 300 },
    },
  );

  if (!response.ok) {
    throw new Error(`FareHarbor items request failed (${response.status})`);
  }

  const data = (await response.json()) as FareHarborItemsResponse;
  return data.items || [];
}

export const fetchCompaniesItems = fetchItems;

export async function fetchAvailabilitiesForItem(
  shortnameOrItemPk: string | number,
  itemPkOrStartDate: string | number,
  startDateOrEndDate: string,
  maybeEndDate?: string,
): Promise<FareHarborAvailability[]> {
  const url =
    typeof maybeEndDate === "string"
      ? `${BASE}/companies/${encodeURIComponent(String(shortnameOrItemPk))}/items/${encodeURIComponent(String(itemPkOrStartDate))}/minimal/availabilities/date-range/${encodeURIComponent(startDateOrEndDate)}/${encodeURIComponent(maybeEndDate)}/`
      : `${BASE}/items/${encodeURIComponent(String(shortnameOrItemPk))}/availabilities/date-range/?start=${encodeURIComponent(String(itemPkOrStartDate))}&end=${encodeURIComponent(startDateOrEndDate)}&detailed=yes`;

  const response = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 300 },
  });

  if (!response.ok) return [];

  const data = (await response.json()) as FareHarborAvailabilitiesResponse;
  return data.availabilities || [];
}

