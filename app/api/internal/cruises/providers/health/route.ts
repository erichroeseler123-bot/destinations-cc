import { NextResponse } from "next/server";
import { getCruiseProviders, fetchLiveCruiseProviderSailings } from "@/lib/dcc/action/cruiseActionProviders";
import { getEnvNumber } from "@/lib/dcc/config/env";

export const runtime = "nodejs";

export async function GET() {
  const timeoutMs = getEnvNumber("CRUISE_PROVIDER_TIMEOUT_MS", 5000, { min: 100, max: 60000 });
  const providers = getCruiseProviders();
  const configured = providers.filter((p) => p.isConfigured());

  const started = Date.now();
  const live = await fetchLiveCruiseProviderSailings(timeoutMs);
  const durationMs = Date.now() - started;

  const providerMap = new Map(live.results.map((r) => [r.provider, r]));
  const provider_status = providers.map((p) => {
    const r = providerMap.get(p.id);
    return {
      provider: p.id,
      configured: p.isConfigured(),
      live_rows: r?.sailings.length || 0,
      ok: p.isConfigured() ? !r?.error : false,
      error: r?.error || null,
    };
  });

  const payload = {
    generated_at: new Date().toISOString(),
    timeout_ms: timeoutMs,
    duration_ms: durationMs,
    totals: {
      providers_total: providers.length,
      providers_configured: configured.length,
      live_rows: live.sailings.length,
      provider_errors: provider_status.filter((p) => p.error).length,
    },
    provider_status,
    diagnostics: {
      source: "provider_health_live",
      cache_status: "bypass",
      stale: false,
      last_updated: new Date().toISOString(),
      stale_after: null,
      fallback_reason: null,
    },
  };

  return NextResponse.json(payload, { status: 200 });
}
