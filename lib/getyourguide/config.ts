export type GetYourGuidePublicConfig = {
  partnerId: string;
};

export type GetYourGuideServerConfig = GetYourGuidePublicConfig & {
  accessToken: string;
  apiBase: string;
  apiVersion: string;
  localeCode: string;
  currency: string;
};

const DEFAULT_CONFIG: GetYourGuidePublicConfig = {
  partnerId: "F2MMUUH",
};

const DEFAULT_SERVER_CONFIG = {
  accessToken: "",
  apiBase: "https://api.getyourguide.com",
  apiVersion: "1",
  localeCode: "en-US",
  currency: "USD",
} as const;

function pickString(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return "";
}

export function getGetYourGuidePublicConfig(): GetYourGuidePublicConfig {
  return {
    partnerId: pickString(
      process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID,
      process.env.GETYOURGUIDE_PARTNER_ID,
      DEFAULT_CONFIG.partnerId
    ),
  };
}

export function hasGetYourGuidePartnerId(): boolean {
  return getGetYourGuidePublicConfig().partnerId.length > 0;
}

export function getGetYourGuideServerConfig(): GetYourGuideServerConfig {
  const publicConfig = getGetYourGuidePublicConfig();

  return {
    ...publicConfig,
    accessToken: pickString(process.env.GETYOURGUIDE_ACCESS_TOKEN, process.env.GETYOURGUIDE_API_KEY),
    apiBase: pickString(process.env.GETYOURGUIDE_API_BASE, DEFAULT_SERVER_CONFIG.apiBase),
    apiVersion: pickString(process.env.GETYOURGUIDE_API_VERSION, DEFAULT_SERVER_CONFIG.apiVersion),
    localeCode: pickString(process.env.GETYOURGUIDE_LOCALE_CODE, DEFAULT_SERVER_CONFIG.localeCode),
    currency: pickString(process.env.GETYOURGUIDE_CURRENCY, DEFAULT_SERVER_CONFIG.currency),
  };
}

export function hasGetYourGuideApiAccess(): boolean {
  return getGetYourGuideServerConfig().accessToken.length > 0;
}
