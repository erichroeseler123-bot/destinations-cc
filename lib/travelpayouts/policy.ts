const DEFAULT_DRIVE_BLOCKED_PREFIXES = [
  "/admin",
  "/api",
  "/book",
  "/checkout",
  "/internal",
  "/tours",
];

function clean(value: string | undefined | null): string {
  return String(value || "").trim();
}

function parsePrefixList(value: string | undefined | null): string[] {
  return clean(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("/") ? item : `/${item}`));
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getTravelpayoutsDrivePolicy() {
  const enabled = clean(process.env.TRAVELPAYOUTS_DRIVE_ENABLED) === "true";
  const src = clean(process.env.TRAVELPAYOUTS_DRIVE_SRC);
  const allowedPrefixes = parsePrefixList(process.env.TRAVELPAYOUTS_DRIVE_ALLOWED_PREFIXES);
  const blockedPrefixes = [
    ...DEFAULT_DRIVE_BLOCKED_PREFIXES,
    ...parsePrefixList(process.env.TRAVELPAYOUTS_DRIVE_BLOCKED_PREFIXES),
  ];

  return {
    enabled,
    src,
    allowedPrefixes,
    blockedPrefixes: Array.from(new Set(blockedPrefixes)),
  };
}

export function shouldLoadTravelpayoutsDriveForPath(
  pathname: string,
  policy = getTravelpayoutsDrivePolicy()
) {
  if (!policy.enabled || !policy.src) return false;
  if (!pathname || pathname.startsWith("/_next")) return false;
  if (policy.blockedPrefixes.some((prefix) => matchesPrefix(pathname, prefix))) return false;
  if (!policy.allowedPrefixes.length) return true;
  return policy.allowedPrefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

export const DCC_TRAVELPAYOUTS_DRIVE_RECOMMENDATIONS = {
  showTargetedOffers: false,
  linkRelevantKeywords: false,
  switchLinksToTravelpayouts: true,
  displaySmartPreviews: true,
  insertRecommendations: true,
  monetizationBoost: "moderate",
} as const;
