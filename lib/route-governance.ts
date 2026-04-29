export type PublishState = "draft" | "live_unpromoted" | "indexable" | "promoted";
export type NetworkRole = "dcc" | "satellite" | "operator" | "utility";
export type HandoffPolicy =
  | "none"
  | "inbound_only"
  | "outbound_only"
  | "bidirectional"
  | "conditional";

export type BaseRouteGovernanceEntry = {
  path: string;
  publishState: PublishState;
  networkRole: NetworkRole;
  handoffPolicy: HandoffPolicy;
};

function appendPath<K extends string>(map: Map<K, string[]>, key: K, path: string) {
  const existing = map.get(key);
  if (existing) {
    existing.push(path);
    return;
  }
  map.set(key, [path]);
}

export function createRouteGovernanceIndex<T extends BaseRouteGovernanceEntry>(
  entries: readonly T[],
) {
  const sortedEntries = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  const byPath = new Map<string, T>();
  const publishStatePaths = new Map<PublishState, string[]>();
  const rolePaths = new Map<NetworkRole, string[]>();
  const indexablePaths: string[] = [];
  const visiblePaths: string[] = [];

  for (const entry of sortedEntries) {
    byPath.set(entry.path, entry);
    appendPath(publishStatePaths, entry.publishState, entry.path);
    appendPath(rolePaths, entry.networkRole, entry.path);

    if (entry.publishState === "indexable" || entry.publishState === "promoted") {
      indexablePaths.push(entry.path);
    }

    if (entry.networkRole !== "utility" && entry.publishState !== "draft") {
      visiblePaths.push(entry.path);
    }
  }

  function getPathsByPublishState(...states: PublishState[]) {
    return states.flatMap((state) => publishStatePaths.get(state) ?? []);
  }

  function getPathsByRole(...roles: NetworkRole[]) {
    return roles.flatMap((role) => rolePaths.get(role) ?? []);
  }

  return {
    entries: sortedEntries as readonly T[],
    indexablePaths,
    visiblePaths,
    get: (pathname: string) => byPath.get(pathname) ?? null,
    has: (pathname: string) => byPath.has(pathname),
    getPathsByPublishState,
    getPathsByRole,
  };
}
