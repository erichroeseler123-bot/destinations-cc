import {
  CanonicalIntentRouteSchema,
  CanonicalLiveSignalSchema,
  CanonicalOperatorSchema,
  CanonicalProductSchema,
  EdgeSignalMapSchema,
  type CanonicalIntentRoute,
  type CanonicalLiveSignal,
  type CanonicalOperator,
  type CanonicalProduct,
  type EdgeSignalMap,
} from "@/lib/dcc/routing/schema";

export type ResolvedIntentPathStatus = "available" | "warning" | "fallback" | "unavailable";

export type ResolvedIntentPath = {
  status: ResolvedIntentPathStatus;
  ctaText: string;
  targetRoute: CanonicalIntentRoute | null;
  activeSignals: CanonicalLiveSignal[];
  reasons: string[];
};

const BLOCKING_SIGNAL_TYPES = new Set<CanonicalLiveSignal["signalType"]>([
  "sold_out",
  "temporarily_paused",
]);

const DEGRADE_SIGNAL_TYPES = new Set<CanonicalLiveSignal["signalType"]>([
  "response_degraded",
  "booking_failure_rate_high",
]);

const WARNING_SIGNAL_TYPES = new Set<CanonicalLiveSignal["signalType"]>([
  "inventory_low",
  "availability_limited",
  "pickup_changed",
  "price_changed",
]);

function isSignalActive(signal: CanonicalLiveSignal, nowIso: string): boolean {
  const now = Date.parse(nowIso);
  const effectiveAt = Date.parse(signal.effectiveAt);
  const expiresAt = signal.expiresAt ? Date.parse(signal.expiresAt) : Number.POSITIVE_INFINITY;
  return effectiveAt <= now && now <= expiresAt;
}

function signalPriority(signal: CanonicalLiveSignal): number {
  if (BLOCKING_SIGNAL_TYPES.has(signal.signalType)) return 300;
  if (DEGRADE_SIGNAL_TYPES.has(signal.signalType)) return 200;
  if (WARNING_SIGNAL_TYPES.has(signal.signalType)) return 100;
  return 10;
}

export function toEdgeSignalKey(subjectId: string): `live_signals:${string}` {
  return `live_signals:${subjectId}`;
}

export function buildEdgeSignalMap(signals: CanonicalLiveSignal[]): EdgeSignalMap {
  const parsedSignals = signals.map((signal) => CanonicalLiveSignalSchema.parse(signal));
  const map: EdgeSignalMap = {};
  for (const signal of parsedSignals) {
    const key = toEdgeSignalKey(signal.subjectId);
    map[key] ||= [];
    map[key].push(signal);
  }
  return EdgeSignalMapSchema.parse(map);
}

export function collectActiveSignals(
  signalMap: EdgeSignalMap,
  subjectIds: string[],
  nowIso = new Date().toISOString()
): CanonicalLiveSignal[] {
  const parsedMap = EdgeSignalMapSchema.parse(signalMap);
  return subjectIds
    .flatMap((subjectId) => parsedMap[toEdgeSignalKey(subjectId)] || [])
    .filter((signal) => isSignalActive(signal, nowIso))
    .sort((a, b) => signalPriority(b) - signalPriority(a));
}

function pickPrimaryRoute(routes: CanonicalIntentRoute[]): CanonicalIntentRoute | null {
  return routes.find((route) => route.routeRole === "primary") || routes[0] || null;
}

function pickFallbackRoute(routes: CanonicalIntentRoute[]): CanonicalIntentRoute | null {
  return (
    routes.find((route) => route.routeRole === "fallback") ||
    routes.find((route) => route.routeRole === "partner_overflow") ||
    null
  );
}

function buildInventoryLowCta(product: CanonicalProduct, signal: CanonicalLiveSignal): string {
  const remaining = typeof signal.payload?.remaining === "number" ? signal.payload.remaining : null;
  if (remaining && product.pricing?.pricingModel === "per_person") {
    return `Only ${remaining} seats left`;
  }
  return `Check ${product.name} availability`;
}

export function resolveIntentPath(input: {
  product: CanonicalProduct;
  operator: CanonicalOperator;
  intentRoutes: CanonicalIntentRoute[];
  signalMap: EdgeSignalMap;
  nowIso?: string;
}): ResolvedIntentPath {
  const product = CanonicalProductSchema.parse(input.product);
  const operator = CanonicalOperatorSchema.parse(input.operator);
  const intentRoutes = input.intentRoutes.map((route) => CanonicalIntentRouteSchema.parse(route));
  const nowIso = input.nowIso || new Date().toISOString();

  const activeSignals = collectActiveSignals(input.signalMap, [product.id, operator.id], nowIso);
  const reasons: string[] = [];
  let status: ResolvedIntentPathStatus = "available";
  let targetRoute = pickPrimaryRoute(intentRoutes);
  let ctaText = `View ${product.name}`;

  for (const signal of activeSignals) {
    if (signal.subjectType === "product" && signal.signalType === "sold_out") {
      status = "fallback";
      targetRoute = pickFallbackRoute(intentRoutes) || targetRoute;
      ctaText = "See alternate live options";
      reasons.push(`${product.slug} is sold out`);
      break;
    }

    if (signal.subjectType === "operator" && signal.signalType === "temporarily_paused") {
      status = "fallback";
      targetRoute = pickFallbackRoute(intentRoutes) || targetRoute;
      ctaText = "Use the backup lane";
      reasons.push(`${operator.slug} is temporarily paused`);
      break;
    }

    if (signal.subjectType === "operator" && DEGRADE_SIGNAL_TYPES.has(signal.signalType)) {
      status = "fallback";
      targetRoute = pickFallbackRoute(intentRoutes) || targetRoute;
      ctaText = "View the cleanest live route";
      reasons.push(`${operator.slug} is degraded`);
      continue;
    }

    if (signal.subjectType === "product" && signal.signalType === "inventory_low") {
      if (status === "available") status = "warning";
      ctaText = buildInventoryLowCta(product, signal);
      reasons.push(`${product.slug} inventory is low`);
      continue;
    }

    if (signal.subjectType === "product" && WARNING_SIGNAL_TYPES.has(signal.signalType)) {
      if (status === "available") status = "warning";
      reasons.push(`${product.slug} has a live warning: ${signal.signalType}`);
    }
  }

  if (!targetRoute) {
    status = "unavailable";
    ctaText = "No eligible route is live right now";
    reasons.push("No intent route matched");
  }

  return {
    status,
    ctaText,
    targetRoute,
    activeSignals,
    reasons,
  };
}
