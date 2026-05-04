import bridgeContract from "@/data/contracts/dcc-parr-bridge.contract.v1.json";
import {
  RED_ROCKS_CORRIDOR,
  getRedRocksHandoffTarget,
  getRedRocksPageParamAlias,
} from "@/lib/dcc/corridors/redRocks";

type BridgeContract = typeof bridgeContract;
type SearchParamValue = string | string[] | undefined;
type SearchParamMap = Record<string, SearchParamValue>;

export const DCC_PARR_BRIDGE_CONTRACT: BridgeContract = bridgeContract;

export const DCC_ORIGIN = DCC_PARR_BRIDGE_CONTRACT.sites.dcc.origin;
export const PARR_ORIGIN = DCC_PARR_BRIDGE_CONTRACT.sites.parr.origin;
export const DCC_PARR_BRIDGE_ROUTES = DCC_PARR_BRIDGE_CONTRACT.dccBridgeRoutes;
export const DCC_PARR_FOOTER_BRIDGE = DCC_PARR_BRIDGE_CONTRACT.footerBridge;

function appendSearchParams(url: URL, params?: Record<string, SearchParamValue>) {
  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.length > 0) {
          url.searchParams.append(key, item);
        }
      }
      continue;
    }

    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

function firstString(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value.find((item) => typeof item === "string" && item.length > 0);
  }
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function inferParrOption(value?: string) {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (
    normalized.includes("private")
    || normalized.includes("suburban")
    || normalized.includes("suv")
    || normalized.includes("sprinter")
  ) {
    return "private";
  }
  if (normalized.includes("shared") || normalized.includes("shuttle")) {
    return "shuttle";
  }
  return undefined;
}

function normalizePickupHub(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "golden" || normalized === "marriott-west" || normalized.includes("marriott")) {
    return "golden";
  }
  if (normalized === "denver" || normalized === "downtown") {
    return "denver";
  }
  return undefined;
}

function withRedRocksTrackingParams(targetId: "shared" | "private", params?: SearchParamMap) {
  const next = { ...(params ?? {}) };
  const sourcePage = typeof next.sourcePage === "string" ? next.sourcePage : undefined;
  const allowed = new Set(RED_ROCKS_CORRIDOR.handoff.approvedParams);
  const filtered: SearchParamMap = {};
  const pageAlias = sourcePage ? getRedRocksPageParamAlias(sourcePage) : undefined;

  const sourcePageParam = firstString(next.source_page) || sourcePage;
  const decisionCorridor = firstString(next.decision_corridor) || "red-rocks-transport";
  const decisionCta = firstString(next.decision_cta) || firstString(next.cta) || (targetId === "private" ? "secondary" : "primary");
  const decisionAction = firstString(next.decision_action)
    || (targetId === "private" ? "book_private_red_rocks_ride" : "book_shared_red_rocks_shuttle");
  const inferredOptionFromProduct = inferParrOption(firstString(next.decision_product) || firstString(next.product_slug));
  const decisionOption = firstString(next.decision_option)
    || inferredOptionFromProduct
    || (targetId === "private" ? "private" : "shuttle");
  const decisionProduct = firstString(next.decision_product)
    || firstString(next.product_slug)
    || (targetId === "private" ? "parr-private" : "shared-red-rocks-shuttle-seat");
  const requestedLane = firstString(next.requested_lane)
    || (decisionOption === "private" ? "private" : "transport");
  const resolvedLane = firstString(next.resolved_lane)
    || decisionProduct;
  const pickupLabel = firstString(next.pickupLabel) || firstString(next.pickup_label);
  const pickupHub = firstString(next.pickupHub)
    || normalizePickupHub(firstString(next.pickup))
    || normalizePickupHub(pickupLabel)
    || normalizePickupHub(requestedLane);

  delete next.sourcePage;
  for (const forbidden of RED_ROCKS_CORRIDOR.handoff.forbiddenLegacyParams) {
    delete next[forbidden];
  }

  for (const [key, value] of Object.entries(next)) {
    if (allowed.has(key)) {
      filtered[key] = value;
    }
  }

  if (!filtered.src) {
    filtered.src = "dcc";
  }

  if (!filtered.page && pageAlias) {
    filtered.page = pageAlias;
  }

  if (!filtered.source_page && sourcePageParam) {
    filtered.source_page = sourcePageParam;
  }

  if (!filtered.decision_corridor) {
    filtered.decision_corridor = decisionCorridor;
  }

  if (!filtered.decision_cta) {
    filtered.decision_cta = decisionCta;
  }

  if (!filtered.decision_action) {
    filtered.decision_action = decisionAction;
  }

  if (!filtered.decision_option) {
    filtered.decision_option = decisionOption;
  }

  if (!filtered.decision_product) {
    filtered.decision_product = decisionProduct;
  }

  if (!filtered.requested_lane) {
    filtered.requested_lane = requestedLane;
  }

  if (!filtered.resolved_lane) {
    filtered.resolved_lane = resolvedLane;
  }

  if (!filtered.product_slug) {
    filtered.product_slug = decisionProduct;
  }

  if (!filtered.pickupHub && pickupHub) {
    filtered.pickupHub = pickupHub;
  }

  if (!filtered.pickupLabel && pickupLabel) {
    filtered.pickupLabel = pickupLabel;
  }

  return filtered;
}

export function buildParrUrl(pathname: string, params?: Record<string, SearchParamValue>) {
  const url = new URL(pathname, PARR_ORIGIN);
  return appendSearchParams(url, params).toString();
}

export function buildParrShuttlesUrl(params?: Record<string, SearchParamValue>) {
  return buildParrUrl(DCC_PARR_BRIDGE_CONTRACT.handoffLinks.shuttles, params);
}

export function buildParrBookUrl(params?: Record<string, SearchParamValue>) {
  const url = new URL(DCC_PARR_BRIDGE_CONTRACT.handoffLinks.book, PARR_ORIGIN);
  const defaults = DCC_PARR_BRIDGE_CONTRACT.handoffLinks.bookDefaults;

  for (const [key, value] of Object.entries(defaults)) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return appendSearchParams(url, params).toString();
}

export function buildParrSharedRedRocksUrl(params?: Record<string, SearchParamValue>) {
  return buildRedRocksHandoffUrl("shared", params);
}

export function buildParrPrivateRedRocksUrl(params?: Record<string, SearchParamValue>) {
  return buildRedRocksHandoffUrl("private", params);
}

export function buildRedRocksHandoffUrl(targetId: "shared" | "private", params?: SearchParamMap) {
  const target = getRedRocksHandoffTarget(targetId);
  if (!target) {
    throw new Error(`Unknown Red Rocks handoff target: ${targetId}`);
  }
  return buildParrUrl(new URL(target.href).pathname, withRedRocksTrackingParams(targetId, params));
}
