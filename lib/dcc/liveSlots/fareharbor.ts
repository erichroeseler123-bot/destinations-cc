export type FareHarborItem = {
  pk?: string | number;
  name?: string;
  title?: string;
  headline?: string;
  description?: string;
  description_text?: string;
  booking_notes?: string;
  cancellation_notes?: string;
  cancellation_policy_hours?: number | null;
  image_cdn_url?: string | null;
};

type FareHarborItemsResponse = {
  items?: FareHarborItem[];
};

export type FareHarborCustomerTypeRate = {
  pk?: string | number;
  label?: string;
  display_name?: string;
  price?: number;
  total?: number | null;
  total_including_tax?: number | null;
  capacity?: number | null;
  minimum_party_size?: number | null;
  maximum_party_size?: number | null;
  minimum_age?: number | null;
  maximum_age?: number | null;
  customer_prototype?: {
    pk?: string | number;
    display_name?: string;
    note?: string;
    total?: number | null;
    total_including_tax?: number | null;
  };
  customer_type?: {
    pk?: string | number;
    singular?: string;
    plural?: string;
    note?: string;
  };
};

export type FareHarborAvailability = {
  pk: string | number;
  start_at?: string;
  end_at?: string;
  start?: string;
  headline?: string;
  capacity?: number;
  minimum_party_size?: number | null;
  maximum_party_size?: number | null;
  booked_count?: number;
  is_bookable?: boolean;
  is_sold_out?: boolean;
  status?: string;
  online_booking_fee_rate?: number | null;
  customer_type_rates?: FareHarborCustomerTypeRate[];
};

type FareHarborAvailabilitiesResponse = {
  availabilities?: FareHarborAvailability[];
};

const BASE = "https://fareharbor.com/api/external/v1";

/**
 * Returns headers strictly using ONLY the FareHarbor credentials authorized for the WNO account (`aktourcenter`).
 */
export function getWnoFareHarborHeaders() {
  const appKey = String(
    process.env.FAREHARBOR_WNO_APP_KEY ||
      process.env.FAREHARBOR_API_APP_KEY ||
      process.env.FAREHARBOR_APP_KEY ||
      "5e9c301c-ec01-4ee7-ac74-b5be2dc774d7",
  ).trim();
  const wnoUserKey = String(
    process.env.DCC_FH_API || process.env.FAREHARBOR_WNO_USER_KEY || "",
  ).trim();

  if (!wnoUserKey) {
    throw new Error("Missing WNO FareHarbor API user key (DCC_FH_API)");
  }

  return {
    "X-FareHarbor-API-App": appKey,
    "X-FareHarbor-API-User": wnoUserKey,
    Accept: "application/json",
    "User-Agent": "destinationcommandcenter/1.0 (+welcometoneworleanstours.com)",
  };
}

function getHeaders(options?: { wnoOnly?: boolean }) {
  if (options?.wnoOnly) {
    return getWnoFareHarborHeaders();
  }
  const appKey = String(
    process.env.FAREHARBOR_API_APP_KEY ||
      process.env.FAREHARBOR_APP_KEY ||
      process.env.FAREHARBOR_APP_NAME ||
      "destinationcommandcenter",
  ).trim();
  const userKey = String(
    process.env.DCC_FH_API ||
      process.env.FAREHARBOR_API_USER_KEY ||
      process.env.FAREHARBOR_USER_KEY ||
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

export async function fetchItems(
  shortname: string,
  options?: { wnoOnly?: boolean; asnAccount?: string },
): Promise<FareHarborItem[]> {
  try {
    const response = await fetch(
      `${BASE}/companies/${encodeURIComponent(shortname)}/items/`,
      {
        headers: getHeaders({ wnoOnly: options?.wnoOnly }),
        next: { revalidate: 300 },
      },
    );

    if (response.ok) {
      const data = (await response.json()) as FareHarborItemsResponse;
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items;
      }
    }
  } catch {
    // Fall through to ASN referral endpoint when External API v1 is not enabled for this account/supplier
  }

  const asnAccount = options?.asnAccount || "aktourcenter";
  const asnResponse = await fetch(
    `https://fareharbor.com/api/v1/companies/${encodeURIComponent(shortname)}/items/?asn=${encodeURIComponent(asnAccount)}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "destinationcommandcenter/1.0 (+welcometoneworleanstours.com)",
      },
      next: { revalidate: 300 },
    },
  );

  if (!asnResponse.ok) {
    throw new Error(`FareHarbor items request failed (${asnResponse.status})`);
  }

  const asnData = (await asnResponse.json()) as FareHarborItemsResponse;
  return asnData.items || [];
}

export const fetchCompaniesItems = fetchItems;

export async function fetchAvailabilitiesForItem(
  shortnameOrItemPk: string | number,
  itemPkOrStartDate: string | number,
  startDateOrEndDate: string,
  maybeEndDate?: string,
  options?: { wnoOnly?: boolean; asnAccount?: string; enrichRates?: boolean },
): Promise<FareHarborAvailability[]> {
  try {
    const url =
      typeof maybeEndDate === "string"
        ? `${BASE}/companies/${encodeURIComponent(String(shortnameOrItemPk))}/items/${encodeURIComponent(String(itemPkOrStartDate))}/minimal/availabilities/date-range/${encodeURIComponent(startDateOrEndDate)}/${encodeURIComponent(maybeEndDate)}/`
        : `${BASE}/items/${encodeURIComponent(String(shortnameOrItemPk))}/availabilities/date-range/?start=${encodeURIComponent(String(itemPkOrStartDate))}&end=${encodeURIComponent(startDateOrEndDate)}&detailed=yes`;

    const response = await fetch(url, {
      headers: getHeaders({ wnoOnly: options?.wnoOnly }),
      next: { revalidate: 300 },
    });

    if (response.ok) {
      const data = (await response.json()) as FareHarborAvailabilitiesResponse;
      if (Array.isArray(data.availabilities) && data.availabilities.length > 0) {
        return data.availabilities;
      }
    }
  } catch {
    // Fall through to ASN public embed availability endpoint when External API is unavailable for this shortname
  }

  if (typeof maybeEndDate === "string") {
    try {
      const shortname = String(shortnameOrItemPk);
      const itemPk = String(itemPkOrStartDate);
      const dateStr = String(startDateOrEndDate);
      const asnAccount = options?.asnAccount || "aktourcenter";
      const asnUrl = `https://fareharbor.com/api/v1/companies/${encodeURIComponent(shortname)}/items/${encodeURIComponent(itemPk)}/availabilities/date/${encodeURIComponent(dateStr)}/?asn=${encodeURIComponent(asnAccount)}`;
      const companyUrl = `https://fareharbor.com/api/v1/companies/${encodeURIComponent(shortname)}/?asn=${encodeURIComponent(asnAccount)}`;

      const [asnRes, companyRes] = await Promise.all([
        fetch(asnUrl, {
          headers: {
            Accept: "application/json",
            "User-Agent": "destinationcommandcenter/1.0 (+welcometoneworleanstours.com)",
          },
          next: { revalidate: 300 },
        }),
        fetch(companyUrl, {
          headers: {
            Accept: "application/json",
            "User-Agent": "destinationcommandcenter/1.0 (+welcometoneworleanstours.com)",
          },
          next: { revalidate: 3600 },
        }).catch(() => null),
      ]);

      let onlineBookingFeeRate: number | null = null;
      if (companyRes && companyRes.ok) {
        const compJson = (await companyRes.json().catch(() => null)) as {
          company?: {
            online_booking_fee_rate?: number | null;
            percentage_fee_rate?: number | null;
          };
        } | null;
        const rawRate =
          compJson?.company?.online_booking_fee_rate ??
          compJson?.company?.percentage_fee_rate ??
          null;
        if (typeof rawRate === "number" && Number.isFinite(rawRate) && rawRate >= 0) {
          onlineBookingFeeRate = rawRate;
        }
      }

      if (asnRes.ok) {
        const asnData = (await asnRes.json()) as {
          availabilities?: Array<
            FareHarborAvailability & {
              is_bookable?: boolean;
              is_sold_out?: boolean;
              status?: string;
              approximate_available_capacity?: number;
            }
          >;
        };
        if (Array.isArray(asnData.availabilities)) {
          const mapped = await Promise.all(
            asnData.availabilities.map(async (a) => {
              const confirmedCapacity =
                typeof a.capacity === "number" && a.capacity > 0
                  ? a.capacity
                  : typeof a.approximate_available_capacity === "number" &&
                      a.approximate_available_capacity > 0 &&
                      a.is_bookable !== false
                    ? a.approximate_available_capacity
                    : undefined;

              let customerTypeRates = a.customer_type_rates;
              if (options?.enrichRates && (!customerTypeRates || customerTypeRates.length === 0)) {
                try {
                  const detailUrl = `https://fareharbor.com/api/v1/companies/${encodeURIComponent(shortname)}/items/${encodeURIComponent(itemPk)}/availabilities/${encodeURIComponent(String(a.pk))}/?asn=${encodeURIComponent(asnAccount)}`;
                  const detailRes = await fetch(detailUrl, {
                    headers: {
                      Accept: "application/json",
                      "User-Agent": "destinationcommandcenter/1.0 (+welcometoneworleanstours.com)",
                    },
                    next: { revalidate: 300 },
                  });
                  if (detailRes.ok) {
                    const detailJson = (await detailRes.json()) as {
                      availability?: {
                        customer_type_rates?: Array<{
                          pk?: number;
                          display_name?: string;
                          price?: number | null;
                          total_including_tax?: number | null;
                          minimum_age?: number | null;
                          maximum_age?: number | null;
                          customer_type?: {
                            singular?: string;
                            note?: string;
                          };
                        }>;
                      };
                    };
                    if (Array.isArray(detailJson.availability?.customer_type_rates)) {
                      customerTypeRates = detailJson.availability.customer_type_rates.map((r) => ({
                        pk: r.pk,
                        label: r.display_name || r.customer_type?.singular || "Guest",
                        display_name: r.display_name,
                        price: typeof r.price === "number" ? r.price : undefined,
                        total_including_tax: r.total_including_tax ?? null,
                        minimum_age: r.minimum_age ?? null,
                        maximum_age: r.maximum_age ?? null,
                      }));
                    }
                  }
                } catch {
                  // Ignore rate enrichment failure
                }
              }

              return {
                ...a,
                capacity: confirmedCapacity,
                is_bookable: Boolean(a.is_bookable && !a.is_sold_out),
                is_sold_out: Boolean(a.is_sold_out),
                status: a.status,
                online_booking_fee_rate: onlineBookingFeeRate,
                customer_type_rates: customerTypeRates,
              };
            }),
          );
          return mapped;
        }
      }
    } catch {
      // Return empty below
    }
  }

  return [];
}



