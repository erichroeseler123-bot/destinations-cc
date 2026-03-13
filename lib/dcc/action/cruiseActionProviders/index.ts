import type { CruiseSailing } from "@/lib/dcc/cruise/schema";
import type {
  CruiseProviderAdapter,
  CruiseProviderFetchResult,
} from "@/lib/dcc/action/cruiseActionProviders/types";
import { carnivalProvider } from "@/lib/dcc/action/cruiseActionProviders/carnival";
import { royalCaribbeanProvider } from "@/lib/dcc/action/cruiseActionProviders/royalcaribbean";
import { norwegianProvider } from "@/lib/dcc/action/cruiseActionProviders/norwegian";

const PROVIDERS: CruiseProviderAdapter[] = [
  carnivalProvider,
  royalCaribbeanProvider,
  norwegianProvider,
];

export function getCruiseProviders(): CruiseProviderAdapter[] {
  return PROVIDERS;
}

export async function fetchLiveCruiseProviderSailings(timeoutMs = 5000): Promise<{
  sailings: CruiseSailing[];
  results: CruiseProviderFetchResult[];
}> {
  const enabled = PROVIDERS.filter((p) => p.isConfigured());
  const out: CruiseProviderFetchResult[] = [];
  const sailings: CruiseSailing[] = [];

  for (const provider of enabled) {
    try {
      const rows = await provider.fetchSailings({ timeout_ms: timeoutMs });
      out.push({ provider: provider.id, sailings: rows });
      sailings.push(...rows);
    } catch (error) {
      out.push({
        provider: provider.id,
        sailings: [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { sailings, results: out };
}
