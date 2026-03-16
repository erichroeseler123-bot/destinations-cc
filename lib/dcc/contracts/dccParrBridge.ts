import bridgeContract from "@/data/contracts/dcc-parr-bridge.contract.v1.json";

type BridgeContract = typeof bridgeContract;

export const DCC_PARR_BRIDGE_CONTRACT: BridgeContract = bridgeContract;

export const DCC_ORIGIN = DCC_PARR_BRIDGE_CONTRACT.sites.dcc.origin;
export const PARR_ORIGIN = DCC_PARR_BRIDGE_CONTRACT.sites.parr.origin;
export const DCC_PARR_BRIDGE_ROUTES = DCC_PARR_BRIDGE_CONTRACT.dccBridgeRoutes;
export const DCC_PARR_FOOTER_BRIDGE = DCC_PARR_BRIDGE_CONTRACT.footerBridge;

export function buildParrUrl(pathname: string) {
  return new URL(pathname, PARR_ORIGIN).toString();
}

export function buildParrShuttlesUrl() {
  return buildParrUrl(DCC_PARR_BRIDGE_CONTRACT.handoffLinks.shuttles);
}

export function buildParrBookUrl(params?: Record<string, string | undefined>) {
  const url = new URL(DCC_PARR_BRIDGE_CONTRACT.handoffLinks.book, PARR_ORIGIN);
  const defaults = DCC_PARR_BRIDGE_CONTRACT.handoffLinks.bookDefaults;

  for (const [key, value] of Object.entries(defaults)) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}
