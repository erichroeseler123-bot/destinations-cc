export type ProviderStatus = "active" | "optional" | "disabled" | "deprecated";
export type ProviderTier = "primary" | "secondary" | "experimental";
export type ProviderVolatility = "stable" | "live";
export type ProviderKind =
  | "tours"
  | "events"
  | "lodging"
  | "flights"
  | "transport"
  | "images"
  | "cruise"
  | "weather"
  | "affiliate_links"
  | "other";

export type SurfacePolicy =
  | "indexable_allowed"
  | "live_lane_only"
  | "internal_only"
  | "disabled";

export type BaseProviderEntry = {
  key: string;
  label: string;
  kind: ProviderKind;
  tier: ProviderTier;
  status: ProviderStatus;
  volatility: ProviderVolatility;
  surfacePolicy: SurfacePolicy;
  env: {
    required?: readonly string[];
    optional?: readonly string[];
  };
  capabilities?: readonly string[];
  notes?: string;
};

type ProviderIndex<T extends BaseProviderEntry> = {
  entries: readonly T[];
  byKey: ReadonlyMap<string, T>;
  activeKeys: readonly string[];
  primaryKeys: readonly string[];
  secondaryKeys: readonly string[];
  experimentalKeys: readonly string[];
  stableKeys: readonly string[];
  liveKeys: readonly string[];
  indexableAllowedKeys: readonly string[];
  liveLaneOnlyKeys: readonly string[];
  internalOnlyKeys: readonly string[];
  get: (key: string) => T | null;
  has: (key: string) => boolean;
  getByStatus: (...statuses: ProviderStatus[]) => T[];
  getByTier: (...tiers: ProviderTier[]) => T[];
  getByKind: (...kinds: ProviderKind[]) => T[];
  getByVolatility: (...volatilities: ProviderVolatility[]) => T[];
  getBySurfacePolicy: (...policies: SurfacePolicy[]) => T[];
  getConfiguredState: (
    env: Record<string, string | undefined>,
  ) => {
    configured: string[];
    partial: string[];
    missing: string[];
  };
};

function append<K extends string, T>(map: Map<K, T[]>, key: K, value: T) {
  const existing = map.get(key);
  if (existing) {
    existing.push(value);
    return;
  }
  map.set(key, [value]);
}

function getMany<K extends string, T>(map: Map<K, T[]>, keys: readonly K[]) {
  return keys.flatMap((key) => map.get(key) ?? []);
}

function isPresent(env: Record<string, string | undefined>, name: string): boolean {
  const value = env[name];
  return typeof value === "string" && value.trim().length > 0;
}

export function createProviderIndex<T extends BaseProviderEntry>(
  entries: readonly T[],
): ProviderIndex<T> {
  const sortedEntries = [...entries].sort((a, b) => a.key.localeCompare(b.key));
  const byKey = new Map<string, T>();

  const activeKeys: string[] = [];
  const primaryKeys: string[] = [];
  const secondaryKeys: string[] = [];
  const experimentalKeys: string[] = [];
  const stableKeys: string[] = [];
  const liveKeys: string[] = [];
  const indexableAllowedKeys: string[] = [];
  const liveLaneOnlyKeys: string[] = [];
  const internalOnlyKeys: string[] = [];

  const byStatus = new Map<ProviderStatus, T[]>();
  const byTier = new Map<ProviderTier, T[]>();
  const byKind = new Map<ProviderKind, T[]>();
  const byVolatility = new Map<ProviderVolatility, T[]>();
  const bySurfacePolicy = new Map<SurfacePolicy, T[]>();

  for (const entry of sortedEntries) {
    if (byKey.has(entry.key)) {
      throw new Error(`Duplicate provider key: ${entry.key}`);
    }

    byKey.set(entry.key, entry);
    append(byStatus, entry.status, entry);
    append(byTier, entry.tier, entry);
    append(byKind, entry.kind, entry);
    append(byVolatility, entry.volatility, entry);
    append(bySurfacePolicy, entry.surfacePolicy, entry);

    if (entry.status === "active") activeKeys.push(entry.key);
    if (entry.tier === "primary") primaryKeys.push(entry.key);
    if (entry.tier === "secondary") secondaryKeys.push(entry.key);
    if (entry.tier === "experimental") experimentalKeys.push(entry.key);
    if (entry.volatility === "stable") stableKeys.push(entry.key);
    if (entry.volatility === "live") liveKeys.push(entry.key);
    if (entry.surfacePolicy === "indexable_allowed") indexableAllowedKeys.push(entry.key);
    if (entry.surfacePolicy === "live_lane_only") liveLaneOnlyKeys.push(entry.key);
    if (entry.surfacePolicy === "internal_only") internalOnlyKeys.push(entry.key);
  }

  function getConfiguredState(env: Record<string, string | undefined>) {
    const configured: string[] = [];
    const partial: string[] = [];
    const missing: string[] = [];

    for (const entry of sortedEntries) {
      const required = entry.env.required ?? [];
      const optional = entry.env.optional ?? [];
      const allEnvKeys = [...required, ...optional];
      const missingRequired = required.filter((name) => !isPresent(env, name));
      const presentAny = allEnvKeys.some((name) => isPresent(env, name));

      if (allEnvKeys.length === 0) {
        configured.push(entry.key);
        continue;
      }

      if (required.length === 0) {
        if (presentAny) configured.push(entry.key);
        else missing.push(entry.key);
        continue;
      }

      if (missingRequired.length === 0) configured.push(entry.key);
      else if (presentAny) partial.push(entry.key);
      else missing.push(entry.key);
    }

    return { configured, partial, missing };
  }

  return {
    entries: sortedEntries,
    byKey,
    activeKeys,
    primaryKeys,
    secondaryKeys,
    experimentalKeys,
    stableKeys,
    liveKeys,
    indexableAllowedKeys,
    liveLaneOnlyKeys,
    internalOnlyKeys,
    get: (key) => byKey.get(key) ?? null,
    has: (key) => byKey.has(key),
    getByStatus: (...statuses) => getMany(byStatus, statuses),
    getByTier: (...tiers) => getMany(byTier, tiers),
    getByKind: (...kinds) => getMany(byKind, kinds),
    getByVolatility: (...volatilities) => getMany(byVolatility, volatilities),
    getBySurfacePolicy: (...policies) => getMany(bySurfacePolicy, policies),
    getConfiguredState,
  };
}
