export type ViatorMedium = "link" | "widget" | "banner" | "api";

export type ViatorLocale =
  | "en"
  | "en-US"
  | "da"
  | "da-DK"
  | "nl"
  | "nl-NL"
  | "no"
  | "no-NO"
  | "es"
  | "es-ES"
  | "sv"
  | "sv-SE"
  | "fr"
  | "fr-FR"
  | "it"
  | "it-IT"
  | "de"
  | "de-DE"
  | "pt"
  | "pt-PT"
  | "ja"
  | "ja-JP"
  | "zh-TW"
  | "zh-CN"
  | "ko"
  | "ko-KR";

export type ViatorAccessTier =
  | "basic_access"
  | "full_access"
  | "booking_access"
  | "merchant";

export type ViatorPublicConfig = {
  pid: string;
  mcid: string;
  medium: ViatorMedium;
  locale: ViatorLocale;
  campaign: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  accessTier: ViatorAccessTier;
};

export type ViatorServerConfig = ViatorPublicConfig & {
  apiKey: string;
  apiBase: string;
  sourcePolicy: string;
};

const DEFAULT_CONFIG: ViatorPublicConfig = {
  pid: "P00281144",
  mcid: "42383",
  medium: "api",
  locale: "en-US",
  campaign: "dcc-destination-lanes",
  utmSource: "destinationcommandcenter",
  utmMedium: "affiliate",
  utmCampaign: "dcc-destination-lanes",
  accessTier: "basic_access",
};

export const VIATOR_SUPPORTED_CURRENCIES = [
  "AED",
  "ARS",
  "AUD",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "CNY",
  "COP",
  "DKK",
  "EUR",
  "FJD",
  "GBP",
  "HKD",
  "IDR",
  "ILS",
  "INR",
  "ISK",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NOK",
  "NZD",
  "PEN",
  "PHP",
  "PLN",
  "RUB",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "TWD",
  "USD",
  "VND",
  "ZAR",
] as const;

function pickString(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return "";
}

function normalizeMedium(value: string): ViatorMedium {
  if (value === "link" || value === "widget" || value === "banner" || value === "api") return value;
  return DEFAULT_CONFIG.medium;
}

function normalizeLocale(value: string): ViatorLocale {
  const normalized = value.trim();
  const supported = new Set<ViatorLocale>([
    "en",
    "en-US",
    "da",
    "da-DK",
    "nl",
    "nl-NL",
    "no",
    "no-NO",
    "es",
    "es-ES",
    "sv",
    "sv-SE",
    "fr",
    "fr-FR",
    "it",
    "it-IT",
    "de",
    "de-DE",
    "pt",
    "pt-PT",
    "ja",
    "ja-JP",
    "zh-TW",
    "zh-CN",
    "ko",
    "ko-KR",
  ]);
  return supported.has(normalized as ViatorLocale)
    ? (normalized as ViatorLocale)
    : DEFAULT_CONFIG.locale;
}

function normalizeAccessTier(value: string): ViatorAccessTier {
  if (
    value === "basic_access" ||
    value === "full_access" ||
    value === "booking_access" ||
    value === "merchant"
  ) {
    return value;
  }
  return DEFAULT_CONFIG.accessTier;
}

export function sanitizeViatorCampaignValue(value: string | null | undefined): string {
  const cleaned = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || DEFAULT_CONFIG.campaign;
}

export function buildViatorCampaignValue(parts: Array<string | null | undefined>): string {
  return sanitizeViatorCampaignValue(parts.filter(Boolean).join("-"));
}

export function getViatorPublicConfig(): ViatorPublicConfig {
  return {
    pid: pickString(process.env.NEXT_PUBLIC_VIATOR_PID, process.env.VIATOR_PID, DEFAULT_CONFIG.pid),
    mcid: pickString(process.env.NEXT_PUBLIC_VIATOR_MCID, process.env.VIATOR_MCID, DEFAULT_CONFIG.mcid),
    medium: normalizeMedium(
      pickString(process.env.NEXT_PUBLIC_VIATOR_MEDIUM, process.env.VIATOR_MEDIUM, DEFAULT_CONFIG.medium)
    ),
    locale: normalizeLocale(
      pickString(process.env.NEXT_PUBLIC_VIATOR_LOCALE, process.env.VIATOR_LOCALE, DEFAULT_CONFIG.locale)
    ),
    campaign: sanitizeViatorCampaignValue(
      pickString(process.env.NEXT_PUBLIC_VIATOR_CAMPAIGN, process.env.VIATOR_CAMPAIGN, DEFAULT_CONFIG.campaign)
    ),
    utmSource: pickString(
      process.env.NEXT_PUBLIC_VIATOR_UTM_SOURCE,
      process.env.VIATOR_UTM_SOURCE,
      DEFAULT_CONFIG.utmSource
    ),
    utmMedium: pickString(
      process.env.NEXT_PUBLIC_VIATOR_UTM_MEDIUM,
      process.env.VIATOR_UTM_MEDIUM,
      DEFAULT_CONFIG.utmMedium
    ),
    utmCampaign: pickString(
      process.env.NEXT_PUBLIC_VIATOR_UTM_CAMPAIGN,
      process.env.VIATOR_UTM_CAMPAIGN,
      DEFAULT_CONFIG.utmCampaign
    ),
    accessTier: normalizeAccessTier(
      pickString(process.env.NEXT_PUBLIC_VIATOR_ACCESS_TIER, process.env.VIATOR_ACCESS_TIER, DEFAULT_CONFIG.accessTier)
    ),
  };
}

export function getViatorServerConfig(): ViatorServerConfig {
  const publicConfig = getViatorPublicConfig();
  return {
    ...publicConfig,
    apiKey: pickString(process.env.VIATOR_API_KEY),
    apiBase: pickString(process.env.VIATOR_API_BASE, "https://api.viator.com/partner"),
    sourcePolicy: pickString(process.env.VIATOR_SOURCE_POLICY, "auto"),
  };
}

export function normalizeViatorCurrency(value: string | null | undefined): string {
  const currency = String(value || "USD").trim().toUpperCase();
  return (VIATOR_SUPPORTED_CURRENCIES as readonly string[]).includes(currency) ? currency : "USD";
}
