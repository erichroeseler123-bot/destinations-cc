export type NetworkNodeId =
  | "dcc"
  | "wtonot"
  | "wts"
  | "wta"
  | "jfd"
  | "gosno"
  | "apex"
  | "somerset"
  | "blue-hills"
  | "dells"
  | "shuttleya"
  | "redrocksfastpass"
  | "saveonthestrip"
  | "sedona-jeep"
  | "lake-tahoe"
  | "marketplace-generic";

export type NetworkNodeBrandMode =
  | "dcc-core"
  | "tourism-storefront"
  | "decision-helper"
  | "transport-execution"
  | "operator-checkout"
  | "marketplace";

export type NetworkNodeSurfaceTone = "command" | "warm-dark" | "natural-dark" | "alpine-dark" | "premium-dark";

export type NetworkNodeHue = {
  name: string;
  primaryAccent: string;
  secondaryAccent: string;
  localAccent: string;
  surfaceTone: NetworkNodeSurfaceTone;
};

export type NetworkNodeRoutePattern = {
  pattern: string;
  intent?: string;
};

export type NetworkNodeConfig = {
  id: NetworkNodeId;
  displayName: string;
  domains: readonly string[];
  routePatterns: readonly NetworkNodeRoutePattern[];
  hue: NetworkNodeHue;
  brandMode: NetworkNodeBrandMode;
  navItems: readonly string[];
  primaryCta: string;
  footerTrustLine: string;
};

export type NetworkNodeResolutionReason = "domain" | "route" | "fallback";

export type NetworkNodeResolution = {
  node: NetworkNodeConfig;
  nodeId: NetworkNodeId;
  reason: NetworkNodeResolutionReason;
  matchedDomain?: string;
  matchedPattern?: string;
};

export type ResolveNodeRequestInput = {
  host?: string | null;
  pathname?: string | null;
};
