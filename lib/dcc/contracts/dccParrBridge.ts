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

function withRedRocksTrackingParams(params?: SearchParamMap) {
  const next = { ...(params ?? {}) };
  const sourcePage = typeof next.sourcePage === "string" ? next.sourcePage : undefined;
  const allowed = new Set(RED_ROCKS_CORRIDOR.handoff.approvedParams);
  const filtered: SearchParamMap = {};

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

  if (!filtered.page && sourcePage) {
    filtered.page = getRedRocksPageParamAlias(sourcePage);
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
  return buildParrUrl(new URL(target.href).pathname, withRedRocksTrackingParams(params));
}
