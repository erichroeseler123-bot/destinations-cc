import { getEnvOptional } from "@/lib/dcc/config/env";
import { DCC_PROVIDER_REGISTRY } from "@/lib/dcc/providers/registry";

export type ProviderCapabilityRow = {
  id: string;
  name: string;
  layer: string;
  lanes: string[];
  live: boolean;
  cache: boolean;
  refresh_mode: string;
  rollout: string;
  env_required: string[];
  env_present: string[];
  configured: boolean;
  operational: boolean;
  diagnostics_endpoints: string[];
};

export function listProviderCapabilityMatrix(): ProviderCapabilityRow[] {
  return DCC_PROVIDER_REGISTRY.map((p) => {
    const envPresent = p.env_vars_required.filter((k) => Boolean(getEnvOptional(k)));
    const configured = p.env_vars_required.length === 0 || envPresent.length === p.env_vars_required.length;
    const operational =
      p.id === "travelpayouts_partner_links"
        ? configured && getEnvOptional("TRAVELPAYOUTS_DEFAULT_BRANDS_APPROVED") === "true"
        : configured;
    return {
      id: p.id,
      name: p.name,
      layer: p.layer,
      lanes: p.primary_lanes,
      live: p.live_cache_support.live,
      cache: p.live_cache_support.cache,
      refresh_mode: p.refresh_strategy.mode,
      rollout: p.rollout_policy.strategy,
      env_required: p.env_vars_required,
      env_present: envPresent,
      configured,
      operational,
      diagnostics_endpoints: p.diagnostics_surface.endpoints,
    };
  });
}

export function getProviderCapabilitySummary() {
  const rows = listProviderCapabilityMatrix();
  const byLayer: Record<string, number> = {};
  for (const row of rows) {
    byLayer[row.layer] = (byLayer[row.layer] || 0) + 1;
  }
  return {
    total: rows.length,
    configured: rows.filter((r) => r.configured).length,
    operational: rows.filter((r) => r.operational).length,
    live_enabled: rows.filter((r) => r.live).length,
    cache_enabled: rows.filter((r) => r.cache).length,
    by_layer: byLayer,
  };
}
