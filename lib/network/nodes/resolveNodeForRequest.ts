import { NETWORK_NODE_BY_ID, NETWORK_NODE_REGISTRY } from "./registry";
import type { NetworkNodeConfig, NetworkNodeResolution, ResolveNodeRequestInput } from "./types";

function normalizeHost(host: string | null | undefined) {
  return (host || "").toLowerCase().trim().split(":")[0];
}

function normalizePathname(pathname: string | null | undefined) {
  const value = (pathname || "/").trim();
  if (!value || value === "*") return "/";
  const withoutQuery = value.split("?")[0].split("#")[0];
  const normalized = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : "/";
}

export function routePatternMatches(pattern: string, pathname: string) {
  const normalizedPattern = normalizePathname(pattern);
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPattern.endsWith("/*")) {
    const prefix = normalizedPattern.slice(0, -2);
    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
  }

  return normalizedPattern === normalizedPath;
}

function routePatternSpecificity(pattern: string) {
  const normalizedPattern = normalizePathname(pattern);
  return normalizedPattern.replace("*", "").length;
}

function findNodeByDomain(host: string) {
  if (!host) return null;

  for (const node of NETWORK_NODE_REGISTRY) {
    const matchedDomain = node.domains.find((domain) => normalizeHost(domain) === host);
    if (matchedDomain) return { node, matchedDomain };
  }

  return null;
}

function findNodeByRoute(pathname: string) {
  let match: { node: NetworkNodeConfig; pattern: string; specificity: number } | null = null;

  for (const node of NETWORK_NODE_REGISTRY) {
    for (const routePattern of node.routePatterns) {
      if (!routePatternMatches(routePattern.pattern, pathname)) continue;
      const specificity = routePatternSpecificity(routePattern.pattern);
      if (!match || specificity > match.specificity) {
        match = { node, pattern: routePattern.pattern, specificity };
      }
    }
  }

  return match;
}

export function resolveNodeForRequest(input: ResolveNodeRequestInput): NetworkNodeResolution {
  const host = normalizeHost(input.host);
  const pathname = normalizePathname(input.pathname);

  const domainMatch = findNodeByDomain(host);
  if (domainMatch) {
    return {
      node: domainMatch.node,
      nodeId: domainMatch.node.id,
      reason: "domain",
      matchedDomain: domainMatch.matchedDomain,
    };
  }

  const routeMatch = findNodeByRoute(pathname);
  if (routeMatch) {
    return {
      node: routeMatch.node,
      nodeId: routeMatch.node.id,
      reason: "route",
      matchedPattern: routeMatch.pattern,
    };
  }

  const fallback = NETWORK_NODE_BY_ID["marketplace-generic"];
  return {
    node: fallback,
    nodeId: fallback.id,
    reason: "fallback",
  };
}
