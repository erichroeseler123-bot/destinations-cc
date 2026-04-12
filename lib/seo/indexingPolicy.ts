import type { Metadata } from "next";

const ALLOWED_COUNTRY_CODES = new Set(["US"]);
const INDEXABLE_ROUTE_PREFIXES = [
  "/red-rocks",
  "/red-rocks-transportation",
  "/red-rocks-complete-guide",
  "/new-orleans/swamp-tours",
  "/juneau/helicopter-tours",
  "/denver",
  "/vegas",
  "/las-vegas",
  "/go/red-rocks",
  "/go/denver/420-airport-pickup",
  "/go/new-orleans/swamp-tours",
  "/go/juneau/helicopter-tours",
  "/go/vegas/deals",
] as const;

export function isIndexableCountryCode(countryCode?: string | null): boolean {
  const normalized = String(countryCode || "").trim().toUpperCase();
  if (!normalized) return true;
  return ALLOWED_COUNTRY_CODES.has(normalized);
}

export function isIndexableRouteFamily(pathname?: string | null): boolean {
  const normalized = String(pathname || "").trim();
  if (!normalized) return false;
  return INDEXABLE_ROUTE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

export function shouldIndexPath(input: {
  countryCode?: string | null;
  pathname?: string | null;
}): boolean {
  return isIndexableCountryCode(input.countryCode) || isIndexableRouteFamily(input.pathname);
}

export function buildNoindexRobots(): NonNullable<Metadata["robots"]> {
  return {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  };
}
