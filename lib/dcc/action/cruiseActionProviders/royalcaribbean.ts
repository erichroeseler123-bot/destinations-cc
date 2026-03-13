import type { CruiseSailing } from "@/lib/dcc/cruise/schema";
import type { CruiseProviderAdapter } from "@/lib/dcc/action/cruiseActionProviders/types";
import {
  extractRows,
  fetchProviderJson,
  normalizeCruiseRow,
} from "@/lib/dcc/action/cruiseActionProviders/shared";
import { getEnvOptional } from "@/lib/dcc/config/env";

export const royalCaribbeanProvider: CruiseProviderAdapter = {
  id: "royalcaribbean",
  isConfigured: () => Boolean(getEnvOptional("ROYAL_CARIBBEAN_CRUISE_FEED_URL")),
  fetchSailings: async (ctx) => {
    const FEED_URL = getEnvOptional("ROYAL_CARIBBEAN_CRUISE_FEED_URL");
    const API_KEY = getEnvOptional("ROYAL_CARIBBEAN_CRUISE_API_KEY");
    if (!FEED_URL) return [];
    const json = await fetchProviderJson(FEED_URL, API_KEY, ctx.timeout_ms);
    return extractRows(json)
      .map((row) => normalizeCruiseRow(row, "royalcaribbean"))
      .filter((row): row is CruiseSailing => Boolean(row));
  },
};
