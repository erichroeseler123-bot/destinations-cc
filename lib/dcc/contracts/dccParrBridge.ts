import bridgeContract from "@/data/contracts/dcc-parr-bridge.contract.v1.json";

type BridgeContract = typeof bridgeContract;
type SearchParamValue = string | string[] | undefined;

const RED_ROCKS_PAGE_PARAM_MAP: Record<string, string> = {
  "/red-rocks-transportation": "rr-transportation",
  "/red-rocks-shuttle-vs-uber": "rr-shuttle-vs-uber",
  "/how-to-get-to-red-rocks-without-parking-hassle": "rr-no-parking",
  "/best-way-to-leave-red-rocks": "rr-leave",
};

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

function withRedRocksTrackingParams(params?: Record<string, SearchParamValue>) {
  const next = { ...(params ?? {}) };
  const sourcePage = typeof next.sourcePage === "string" ? next.sourcePage : undefined;

  delete next.sourcePage;
  delete next.source;
  delete next.source_page;
  delete next.intent;
  delete next.topic;
  delete next.subtype;
  delete next.product;

  if (!next.src) {
    next.src = "dcc";
  }

  if (!next.page && sourcePage) {
    next.page = RED_ROCKS_PAGE_PARAM_MAP[sourcePage] ?? sourcePage.replace(/^\/+/, "");
  }

  return next;
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
  return buildParrUrl(
    "/book/red-rocks-amphitheatre/custom/shared",
    withRedRocksTrackingParams(params)
  );
}

export function buildParrPrivateRedRocksUrl(params?: Record<string, SearchParamValue>) {
  return buildParrUrl(
    "/book/red-rocks-amphitheatre/private",
    withRedRocksTrackingParams(params)
  );
}
