import { getRootRouteGovernanceEntries } from "@/src/data/route-governance";
import {
  USA_PROOF_INDEXABLE_SURFACES,
  USA_PROOF_LIVE_UNPROMOTED_SURFACES,
  USA_PROOF_MEASURE_FIRST_SURFACES,
  USA_PROOF_PROMOTED_SURFACES,
  type RolloutSurface,
} from "@/src/data/usa-proof-rollout";
import { getHomepageEntrySurfaces } from "@/src/data/entry-surfaces";
import { PROVIDERS } from "@/lib/dcc/providers/provider-registry";

import * as wtsGovernanceModule from "../../apps/welcometotheswamp/lib/route-governance";
import * as jfdGovernanceModule from "../../apps/juneauflightdeck/lib/route-governance";
import * as airport420GovernanceModule from "../../apps/420-airport-pickup/lib/route-governance";
import * as gosnoGovernanceModule from "../../apps/gosno/lib/route-governance";
import * as sotsGovernanceModule from "../../apps/saveonthestrip/lib/route-governance";
import * as lakeTahoeGovernanceModule from "../../apps/laketahoe/lib/route-governance";
import * as sedonaGovernanceModule from "../../apps/sedonajeep/lib/route-governance";
import * as redRocksFastPassGovernanceModule from "../../apps/redrocksfastpass/lib/route-governance";
import * as shuttleyaGovernanceModule from "../../apps/shuttleya/lib/route-governance";

const { getWtsRouteGovernanceEntries } =
  wtsGovernanceModule as typeof import("../../apps/welcometotheswamp/lib/route-governance");
const { getJfdRouteGovernanceEntries } =
  jfdGovernanceModule as typeof import("../../apps/juneauflightdeck/lib/route-governance");
const { getAirport420RouteGovernanceEntries } =
  airport420GovernanceModule as typeof import("../../apps/420-airport-pickup/lib/route-governance");
const { getGosnoRouteGovernanceEntries } =
  gosnoGovernanceModule as typeof import("../../apps/gosno/lib/route-governance");
const { getSotsRouteGovernanceEntries } =
  sotsGovernanceModule as typeof import("../../apps/saveonthestrip/lib/route-governance");
const { getLakeTahoeRouteGovernanceEntries } =
  lakeTahoeGovernanceModule as typeof import("../../apps/laketahoe/lib/route-governance");
const { getSedonaRouteGovernanceEntries } =
  sedonaGovernanceModule as typeof import("../../apps/sedonajeep/lib/route-governance");
const { getRrfpRouteGovernanceEntries } =
  redRocksFastPassGovernanceModule as typeof import("../../apps/redrocksfastpass/lib/route-governance");
const { getShuttleyaRouteGovernanceEntries } =
  shuttleyaGovernanceModule as typeof import("../../apps/shuttleya/lib/route-governance");
type InventoryPublishState = "draft" | "live_unpromoted" | "indexable" | "promoted";
type InventoryRole = "dcc" | "satellite" | "operator" | "utility";
type ExecutionAuthority = "shuttleya" | "dcc" | "external_operator";

export type SystemInventoryRoute = {
  id: string;
  scope: string;
  path: string;
  publishState: InventoryPublishState;
  role: InventoryRole;
  handoffPolicy: string;
  owner: string;
  active: boolean;
  corridor?: string;
  notes?: string;
};

export type SystemInventorySatellite = {
  id: string;
  label: string;
  domain: string;
  role: "satellite" | "operator" | "hybrid";
  active: boolean;
  promotedRoutes: string[];
  indexableRoutes: string[];
  liveUnpromotedRoutes: string[];
};

export type SystemInventoryOperator = {
  id: string;
  label: string;
  role: "execution";
  active: boolean;
  ownedFlowIds: string[];
  routeSlugs: string[];
  bookingTargets: string[];
};

export type SystemInventoryHybridLane = {
  id: string;
  owner: string;
  path: string;
  behavior: "intake" | "bridge" | "execution";
  executionAuthority?: ExecutionAuthority;
  notes?: string;
};

export type SystemInventoryBookingEndpoint = {
  id: string;
  operator: string;
  flowId: string;
  rideType?: "private" | "shared";
  url: string;
  route?: string;
  executionAuthority: ExecutionAuthority;
};

export type SystemInventoryFlow = {
  id: string;
  type: "flow";
  owner: string;
  active: boolean;
  path: string;
  downstreamOperators: string[];
  executionAuthority?: ExecutionAuthority;
};

export type SystemInventoryProvider = {
  key: string;
  kind: string;
  tier: string;
  status: string;
  volatility: string;
  surfacePolicy: string;
  capabilities: readonly string[];
};

export type SystemInventoryCorridorExecution = {
  corridorId: string;
  label: string;
  executionAuthority: ExecutionAuthority;
  bookingSurface: string;
  operator: string;
  pattern: "owned_execution" | "operator_execution";
  notes?: string;
};

export type SystemInventory = {
  routes: SystemInventoryRoute[];
  satellites: SystemInventorySatellite[];
  operators: SystemInventoryOperator[];
  hybridLanes: SystemInventoryHybridLane[];
  providers: SystemInventoryProvider[];
  corridorExecutions: SystemInventoryCorridorExecution[];
  bookingEndpoints: SystemInventoryBookingEndpoint[];
  flows: SystemInventoryFlow[];
  promotedHomepageEntries: { label: string; path: string }[];
  rollout: {
    promoted: readonly RolloutSurface[];
    indexable: readonly RolloutSurface[];
    liveUnpromoted: readonly RolloutSurface[];
    measureFirst: readonly RolloutSurface[];
  };
};

type LocalAppSource = {
  id: string;
  label: string;
  domain: string;
  entries: readonly {
    path: string;
    publishState: InventoryPublishState;
    networkRole: InventoryRole;
    handoffPolicy: string;
    notes?: string;
  }[];
};

const localAppSources: readonly LocalAppSource[] = [
  {
    id: "welcometotheswamp",
    label: "Welcome To The Swamp",
    domain: "welcometotheswamp.com",
    entries: getWtsRouteGovernanceEntries(),
  },
  {
    id: "juneauflightdeck",
    label: "Juneau Flight Deck",
    domain: "juneauflightdeck.com",
    entries: getJfdRouteGovernanceEntries(),
  },
  {
    id: "saveonthestrip",
    label: "Save On The Strip",
    domain: "saveonthestrip.com",
    entries: getSotsRouteGovernanceEntries(),
  },
  {
    id: "420-airport-pickup",
    label: "420 Friendly Airport Pickup",
    domain: "420friendlyairportpickup.com",
    entries: getAirport420RouteGovernanceEntries(),
  },
  {
    id: "laketahoe",
    label: "Lake Tahoe",
    domain: "laketahoe.vercel.app",
    entries: getLakeTahoeRouteGovernanceEntries(),
  },
  {
    id: "sedonajeep",
    label: "Sedona Jeep",
    domain: "sedonajeep.vercel.app",
    entries: getSedonaRouteGovernanceEntries(),
  },
  {
    id: "redrocksfastpass",
    label: "Red Rocks Fast Pass",
    domain: "redrocksfastpass.com",
    entries: getRrfpRouteGovernanceEntries(),
  },
  {
    id: "shuttleya",
    label: "Shuttleya",
    domain: "shuttleya.com",
    entries: getShuttleyaRouteGovernanceEntries(),
  },
  {
    id: "gosno",
    label: "GoSno",
    domain: "gosno.co",
    entries: getGosnoRouteGovernanceEntries(),
  },
] as const;

const SATELLITE_ROLE_OVERRIDES: Partial<Record<LocalAppSource["id"], SystemInventorySatellite["role"]>> = {
  saveonthestrip: "hybrid",
  shuttleya: "operator",
  gosno: "operator",
};

const GOSNO_ROUTE_URLS: Record<string, string> = {
  breckenridge: "https://gosno.co/denver-to-breckenridge",
  keystone: "https://gosno.co/keystone",
  vail: "https://gosno.co/vail",
  "beaver-creek": "https://gosno.co/beaver-creek",
  "winter-park": "https://gosno.co/winter-park",
  "copper-mountain": "https://gosno.co/copper-mountain",
  copper: "https://gosno.co/copper-mountain",
  aspen: "https://gosno.co/aspen",
  snowmass: "https://gosno.co/snowmass",
  "steamboat-springs": "https://gosno.co/steamboat-springs",
  steamboat: "https://gosno.co/steamboat-springs",
};

const OPERATOR_LABELS = {
  parr: "Party at Red Rocks",
  gosno: "GoSno",
  argo: "Argo Shuttle",
  "420": "420 Friendly Airport Pickup",
} as const;

const EXECUTION_OPERATORS = ["parr", "gosno", "argo", "420"] as const;

const rolloutByScopePath = new Map(
  [
    ...USA_PROOF_PROMOTED_SURFACES,
    ...USA_PROOF_INDEXABLE_SURFACES,
    ...USA_PROOF_LIVE_UNPROMOTED_SURFACES,
    ...USA_PROOF_MEASURE_FIRST_SURFACES,
  ].map((surface) => [`${surface.scope}:${surface.path}`, surface]),
);

function createRouteId(scope: string, pathname: string) {
  return `${scope}:${pathname}`;
}

function toSystemRoute(
  scope: string,
  owner: string,
  entry: {
    path: string;
    publishState: InventoryPublishState;
    networkRole: InventoryRole;
    handoffPolicy: string;
    notes?: string;
  },
): SystemInventoryRoute {
  const rolloutSurface = rolloutByScopePath.get(`${scope}:${entry.path}`);

  return {
    id: createRouteId(scope, entry.path),
    scope,
    path: entry.path,
    publishState: entry.publishState,
    role: entry.networkRole,
    handoffPolicy: entry.handoffPolicy,
    owner,
    active: entry.publishState !== "draft",
    corridor: rolloutSurface?.corridorId,
    notes: entry.notes ?? rolloutSurface?.notes,
  };
}

function summarizeSatellite(source: LocalAppSource): SystemInventorySatellite {
  const overrideRole = SATELLITE_ROLE_OVERRIDES[source.id];
  if (overrideRole) {
    return {
      id: source.id,
      label: source.label,
      domain: source.domain,
      role: overrideRole,
      active: true,
      promotedRoutes: source.entries.filter((entry) => entry.publishState === "promoted").map((entry) => entry.path),
      indexableRoutes: source.entries.filter((entry) => entry.publishState === "indexable").map((entry) => entry.path),
      liveUnpromotedRoutes: source.entries
        .filter((entry) => entry.publishState === "live_unpromoted")
        .map((entry) => entry.path),
    };
  }

  const homepageRole = source.entries.find((entry) => entry.path === "/")?.networkRole ?? "satellite";

  return {
    id: source.id,
    label: source.label,
    domain: source.domain,
    role: homepageRole === "satellite" ? "satellite" : homepageRole === "operator" ? "operator" : "hybrid",
    active: true,
    promotedRoutes: source.entries.filter((entry) => entry.publishState === "promoted").map((entry) => entry.path),
    indexableRoutes: source.entries.filter((entry) => entry.publishState === "indexable").map((entry) => entry.path),
    liveUnpromotedRoutes: source.entries
      .filter((entry) => entry.publishState === "live_unpromoted")
      .map((entry) => entry.path),
  };
}

const rootRoutes = getRootRouteGovernanceEntries().map((entry) => toSystemRoute("root", "destinations-cc", entry));
const localAppRoutes = localAppSources.flatMap((source) =>
  source.entries.map((entry) => toSystemRoute(source.id, source.id, entry)),
);

const flows: SystemInventoryFlow[] = [];

const bookingEndpoints: SystemInventoryBookingEndpoint[] = [
  {
    id: "parr-shared-red-rocks",
    operator: "parr",
    flowId: "event-transport",
    rideType: "shared",
    url: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared",
    route: "red-rocks-amphitheatre",
    executionAuthority: "external_operator",
  },
  {
    id: "parr-private-red-rocks",
    operator: "parr",
    flowId: "red-rocks-private",
    rideType: "private",
    url: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private",
    route: "red-rocks-amphitheatre",
    executionAuthority: "external_operator",
  },
  {
    id: "argo-seat",
    operator: "argo",
    flowId: "argo-shuttle",
    rideType: "shared",
    url: "https://shuttleya.com/book/argo-shuttle?route=argo&product=argo-seat",
    route: "argo",
    executionAuthority: "external_operator",
  },
  {
    id: "argo-suv",
    operator: "argo",
    flowId: "argo-shuttle",
    rideType: "private",
    url: "https://shuttleya.com/book/argo-shuttle?route=argo&product=argo-suv",
    route: "argo",
    executionAuthority: "external_operator",
  },
  {
    id: "420-airport-pickup",
    operator: "420",
    flowId: "denver-airport-pickup",
    rideType: "private",
    url: "https://420friendlyairportpickup.com/?route=airport-420-pickup&product=airport-pickup",
    route: "airport-pickup",
    executionAuthority: "external_operator",
  },
  {
    id: "420-airport-dispensary",
    operator: "420",
    flowId: "denver-airport-pickup",
    rideType: "shared",
    url: "https://420friendlyairportpickup.com/?route=airport-420-pickup&product=airport-dispensary",
    route: "airport-dispensary",
    executionAuthority: "external_operator",
  },
  ...Object.entries(GOSNO_ROUTE_URLS).map(([route, url]) => ({
    id: `gosno-${route}`,
    operator: "gosno",
    flowId: "event-transport",
    url,
    route,
    executionAuthority: "external_operator" as const,
  })),
];

const corridorExecutions: SystemInventoryCorridorExecution[] = [
  {
    corridorId: "argo-day-transport",
    label: "Mighty Argo Shuttle",
    executionAuthority: "external_operator",
    bookingSurface: "https://shuttleya.com/book/argo-shuttle",
    operator: "argo",
    pattern: "operator_execution",
    notes: "DCC decides, then hands to the standalone Shuttleya operator surface. The embedded apps/shuttleya copy is quarantined and is not a production inventory source.",
  },
  {
    corridorId: "airport-420-pickup",
    label: "Denver Airport Pickup",
    executionAuthority: "external_operator",
    bookingSurface: "https://420friendlyairportpickup.com/",
    operator: "420",
    pattern: "operator_execution",
    notes: "DCC decides, then hands directly into the 420 Friendly Airport Pickup operator surface.",
  },
  {
    corridorId: "partyatredrocks-private",
    label: "Red Rocks Private",
    executionAuthority: "external_operator",
    bookingSurface: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private",
    operator: "parr",
    pattern: "operator_execution",
    notes: "DCC decides, then hands directly into the Party At Red Rocks private booking surface.",
  },
  {
    corridorId: "denver-to-breckenridge",
    label: "Denver to Breckenridge",
    executionAuthority: "external_operator",
    bookingSurface: GOSNO_ROUTE_URLS.breckenridge,
    operator: "gosno",
    pattern: "operator_execution",
    notes: "GoSno remains the user-facing execution surface for this mountain corridor.",
  },
  {
    corridorId: "denver-to-vail",
    label: "Denver to Vail",
    executionAuthority: "external_operator",
    bookingSurface: GOSNO_ROUTE_URLS.vail,
    operator: "gosno",
    pattern: "operator_execution",
    notes: "GoSno remains the user-facing execution surface for this mountain corridor.",
  },
  {
    corridorId: "denver-to-keystone",
    label: "Denver to Keystone",
    executionAuthority: "external_operator",
    bookingSurface: GOSNO_ROUTE_URLS.keystone,
    operator: "gosno",
    pattern: "operator_execution",
    notes: "GoSno remains the user-facing execution surface for this mountain corridor.",
  },
  {
    corridorId: "denver-to-copper",
    label: "Denver to Copper Mountain",
    executionAuthority: "external_operator",
    bookingSurface: GOSNO_ROUTE_URLS.copper,
    operator: "gosno",
    pattern: "operator_execution",
    notes: "GoSno remains the user-facing execution surface for this mountain corridor.",
  },
  {
    corridorId: "denver-to-aspen",
    label: "Denver to Aspen",
    executionAuthority: "external_operator",
    bookingSurface: GOSNO_ROUTE_URLS.aspen,
    operator: "gosno",
    pattern: "operator_execution",
    notes: "GoSno remains the user-facing execution surface for this mountain corridor.",
  },
  {
    corridorId: "denver-to-steamboat",
    label: "Denver to Steamboat",
    executionAuthority: "external_operator",
    bookingSurface: GOSNO_ROUTE_URLS.steamboat,
    operator: "gosno",
    pattern: "operator_execution",
    notes: "GoSno remains the user-facing execution surface for this mountain corridor.",
  },
];

const operators: SystemInventoryOperator[] = EXECUTION_OPERATORS.map((operatorId) => ({
  id: operatorId,
  label: OPERATOR_LABELS[operatorId],
  role: "execution",
  active: true,
  ownedFlowIds: flows.filter((flow) => flow.downstreamOperators.includes(operatorId)).map((flow) => flow.id),
  routeSlugs: bookingEndpoints
    .filter((endpoint) => endpoint.operator === operatorId)
    .map((endpoint) => endpoint.route)
    .filter((route): route is string => Boolean(route)),
  bookingTargets: bookingEndpoints
    .filter((endpoint) => endpoint.operator === operatorId)
    .map((endpoint) => endpoint.url),
}));

const hybridLanes: SystemInventoryHybridLane[] = [];

export const SYSTEM_INVENTORY: SystemInventory = {
  routes: [...rootRoutes, ...localAppRoutes],
  satellites: localAppSources.map(summarizeSatellite),
  operators,
  hybridLanes,
  providers: PROVIDERS.map((provider) => ({
    key: provider.key,
    kind: provider.kind,
    tier: provider.tier,
    status: provider.status,
    volatility: provider.volatility,
    surfacePolicy: provider.surfacePolicy,
    capabilities: provider.capabilities,
  })),
  corridorExecutions,
  bookingEndpoints,
  flows,
  promotedHomepageEntries: getHomepageEntrySurfaces().map((entry) => ({
    label: entry.label,
    path: entry.path,
  })),
  rollout: {
    promoted: USA_PROOF_PROMOTED_SURFACES,
    indexable: USA_PROOF_INDEXABLE_SURFACES,
    liveUnpromoted: USA_PROOF_LIVE_UNPROMOTED_SURFACES,
    measureFirst: USA_PROOF_MEASURE_FIRST_SURFACES,
  },
};

export function getSystemInventoryRoutesByOwner(owner: string) {
  return SYSTEM_INVENTORY.routes.filter((route) => route.owner === owner);
}

export function getSystemInventoryRoutesByPublishState(publishState: InventoryPublishState) {
  return SYSTEM_INVENTORY.routes.filter((route) => route.publishState === publishState);
}

export function getSystemInventoryOperator(operatorId: string) {
  return SYSTEM_INVENTORY.operators.find((operator) => operator.id === operatorId) ?? null;
}

export function getSystemInventorySatellite(satelliteId: string) {
  return SYSTEM_INVENTORY.satellites.find((satellite) => satellite.id === satelliteId) ?? null;
}

export function getSystemInventoryHybridLane(owner: string, pathname: string) {
  return SYSTEM_INVENTORY.hybridLanes.find((lane) => lane.owner === owner && lane.path === pathname) ?? null;
}

export function getSystemInventoryCorridorExecution(corridorId: string) {
  return SYSTEM_INVENTORY.corridorExecutions.find((corridor) => corridor.corridorId === corridorId) ?? null;
}

export function getSystemInventoryFlow(flowId: string) {
  return SYSTEM_INVENTORY.flows.find((flow) => flow.id === flowId) ?? null;
}
