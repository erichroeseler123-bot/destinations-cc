import { unstable_cache } from "next/cache";

type FareHarborItem = {
  pk?: number;
  name?: string;
  headline?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
  currency?: string;
  hero_image_url?: string;
  image_cdn_url?: string;
  url?: string;
  slug?: string;
};

type FareHarborItemsResponse = {
  items?: FareHarborItem[];
};

export type VegasTourArea =
  | "las-vegas"
  | "grand-canyon"
  | "hoover-dam"
  | "red-rock"
  | "day-trips";

export type VegasTour = {
  id: string;
  itemPk: number;
  company: string;
  slug: string;
  name: string;
  headline: string | null;
  description: string | null;
  durationMinutes: number | null;
  durationLabel: string | null;
  fromPrice: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  area: VegasTourArea;
  areaLabel: string;
};

const BASE = "https://fareharbor.com/api/external/v1";

const AREA_LABELS: Record<VegasTourArea, string> = {
  "las-vegas": "Las Vegas",
  "grand-canyon": "Grand Canyon",
  "hoover-dam": "Hoover Dam",
  "red-rock": "Red Rock Canyon",
  "day-trips": "Other day trips",
};

function parseFareHarborApiEnv() {
  const raw = String(process.env.FAREHARBOR_API || "").trim();
  const defaultAppName = String(process.env.FAREHARBOR_APP_NAME || "saveonthestrip").trim();
  const envCompanies = String(
    process.env.FAREHARBOR_COMPANIES || process.env.FAREHARBOR_COMPANY_SHORTNAME || ""
  )
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!raw) {
    return { appName: defaultAppName, userKey: "", companies: envCompanies };
  }

  if (raw.startsWith("{")) {
    const parsed = JSON.parse(raw) as {
      appName?: string;
      appKey?: string;
      userKey?: string;
      apiKey?: string;
      companies?: string[];
      company?: string;
    };

    const companies = [
      ...(Array.isArray(parsed.companies) ? parsed.companies : []),
      ...(parsed.company ? [parsed.company] : []),
      ...envCompanies,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    return {
      appName: String(parsed.appName || parsed.appKey || defaultAppName).trim(),
      userKey: String(parsed.userKey || parsed.apiKey || "").trim(),
      companies,
    };
  }

  return {
    appName: defaultAppName,
    userKey: raw,
    companies: envCompanies,
  };
}

function cleanText(value: unknown) {
  const text = String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

function dollarsFromCents(value: unknown, currency?: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const resolvedCurrency = String(currency || "USD").toUpperCase();
  const dollars = amount / 100;
  return `${resolvedCurrency} ${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
}

function buildSlug(company: string, item: FareHarborItem) {
  const base = String(item.slug || item.name || item.pk || "tour")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${company}-${base}`;
}

function inferArea(item: FareHarborItem): VegasTourArea {
  const text = [item.name, item.headline, item.description].filter(Boolean).join(" ").toLowerCase();
  if (text.includes("grand canyon")) return "grand-canyon";
  if (text.includes("hoover")) return "hoover-dam";
  if (text.includes("red rock")) return "red-rock";
  if (
    text.includes("valley of fire")
    || text.includes("antelope canyon")
    || text.includes("bryce")
    || text.includes("zion")
    || text.includes("death valley")
    || text.includes("lake mead")
  ) {
    return "day-trips";
  }
  return "las-vegas";
}

function normalizeTour(company: string, item: FareHarborItem): VegasTour {
  const area = inferArea(item);
  const durationMinutes = Number.isFinite(Number(item.duration_minutes))
    ? Number(item.duration_minutes)
    : null;

  return {
    id: `${company}:${Number(item.pk || 0)}`,
    itemPk: Number(item.pk || 0),
    company,
    slug: buildSlug(company, item),
    name: String(item.name || `Tour ${item.pk || ""}`).trim(),
    headline: cleanText(item.headline),
    description: cleanText(item.description),
    durationMinutes,
    durationLabel: durationMinutes ? `${Math.round((durationMinutes / 60) * 10) / 10} hours` : null,
    fromPrice: dollarsFromCents(item.price, item.currency),
    imageUrl: item.hero_image_url || item.image_cdn_url || null,
    productUrl: item.url || null,
    area,
    areaLabel: AREA_LABELS[area],
  };
}

async function fetchCompanyItems(company: string, appName: string, userKey: string) {
  const url = `${BASE}/companies/${encodeURIComponent(company)}/items/?api-user=${encodeURIComponent(userKey)}`;
  const response = await fetch(url, {
    headers: {
      "X-FareHarbor-API-App": appName,
      "X-FareHarbor-API-User": userKey,
      Accept: "application/json",
      "User-Agent": "saveonthestrip/1.0 (+saveonthestrip.com)",
    },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`FareHarbor ${company} ${response.status}: ${body.slice(0, 200)}`);
  }

  return (await response.json()) as FareHarborItemsResponse;
}

async function loadVegasTours() {
  const { appName, userKey, companies } = parseFareHarborApiEnv();
  if (!userKey || !companies.length) {
    return { tours: [] as VegasTour[], companies, configured: Boolean(userKey && companies.length) };
  }

  const settled = await Promise.allSettled(
    companies.map(async (company) => {
      const data = await fetchCompanyItems(company, appName, userKey);
      return (data.items || []).map((item) => normalizeTour(company, item));
    })
  );

  const tours = settled
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((tour) => tour.itemPk > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { tours, companies, configured: true };
}

const getCachedVegasTours = unstable_cache(
  async () => loadVegasTours(),
  ["saveonthestrip-fareharbor-vegas-tours"],
  { revalidate: 900 }
);

export async function getVegasTours() {
  return getCachedVegasTours();
}

export function groupVegasToursByArea(tours: VegasTour[]) {
  return {
    lasVegas: tours.filter((tour) => tour.area === "las-vegas"),
    grandCanyon: tours.filter((tour) => tour.area === "grand-canyon"),
    hooverDam: tours.filter((tour) => tour.area === "hoover-dam"),
    redRock: tours.filter((tour) => tour.area === "red-rock"),
    dayTrips: tours.filter((tour) => tour.area === "day-trips"),
  };
}
