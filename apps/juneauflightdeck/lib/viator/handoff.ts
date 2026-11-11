const DCC_HANDOFF_ENDPOINT =
  "https://www.destinationcommandcenter.com/go/commerce/handoff";
const JFD_SITE = "juneauflightdeck.com";
const JFD_VIATOR_PID = "P00058396";
const JFD_VIATOR_MCID = "42383";

export interface BuildJfdViatorHandoffOptions {
  productCode?: string | null;
  campaign?: string | null;
  date?: string | null;
  partySize?: number | null;
  cruiseShip?: string | null;
  contextId?: string | null;
  handoffId?: string | null;
}

/**
 * Wraps an outbound Juneau Flight Deck Viator (`P00058396`) URL in DCC's
 * durable `/go/commerce/handoff` redirector while preserving all inner Viator
 * attribution and search parameters (`pid=P00058396`, `mcid=42383`, `startDate`,
 * `numTravelers`, `campaign`). Non-Viator URLs are returned unchanged.
 */
export function buildJfdViatorHandoffUrl(
  targetUrl: string,
  options?: BuildJfdViatorHandoffOptions,
): string {
  const trimmed = (targetUrl || "").trim();
  if (!trimmed) return trimmed;

  if (trimmed.includes("/go/commerce/handoff")) {
    if (!options?.handoffId) return trimmed;
    try {
      const existing = new URL(trimmed);
      existing.searchParams.set("dcc_handoff_id", options.handoffId);
      return existing.toString();
    } catch {
      return trimmed;
    }
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(trimmed);
  } catch {
    return trimmed;
  }

  const host = parsedTarget.hostname.toLowerCase();
  if (host !== "viator.com" && !host.endsWith(".viator.com")) {
    return trimmed;
  }

  if (!parsedTarget.searchParams.get("pid")) {
    parsedTarget.searchParams.set("pid", JFD_VIATOR_PID);
  }
  if (!parsedTarget.searchParams.get("mcid")) {
    parsedTarget.searchParams.set("mcid", JFD_VIATOR_MCID);
  }
  if (!parsedTarget.searchParams.get("medium")) {
    parsedTarget.searchParams.set("medium", "api");
  }

  const resolvedDate =
    (options?.date || parsedTarget.searchParams.get("startDate") || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(resolvedDate)) {
    parsedTarget.searchParams.set("startDate", resolvedDate);
  }

  const rawPartySize =
    options?.partySize ??
    (parsedTarget.searchParams.get("numTravelers")
      ? Number(parsedTarget.searchParams.get("numTravelers"))
      : null);
  const validPartySize =
    typeof rawPartySize === "number" &&
    Number.isInteger(rawPartySize) &&
    rawPartySize >= 1 &&
    rawPartySize <= 18
      ? rawPartySize
      : null;
  if (validPartySize !== null && validPartySize <= 15) {
    parsedTarget.searchParams.set("numTravelers", String(validPartySize));
  }

  const extractedCode =
    parsedTarget.pathname.match(/\/d\d+-([A-Za-z0-9_]+)/i)?.[1] || null;
  const resolvedProductCode =
    (options?.productCode || extractedCode || "juneau-helicopter-search").trim();

  const resolvedCampaign = (
    options?.campaign ||
    parsedTarget.searchParams.get("campaign") ||
    "jfd-viator-handoff"
  ).trim();
  if (!parsedTarget.searchParams.get("campaign")) {
    parsedTarget.searchParams.set("campaign", resolvedCampaign);
  }

  if (options?.handoffId) {
    parsedTarget.searchParams.set("dcc_handoff_id", options.handoffId);
  }

  const handoff = new URL(DCC_HANDOFF_ENDPOINT);
  handoff.searchParams.set("site", JFD_SITE);
  handoff.searchParams.set("provider", "viator");
  handoff.searchParams.set("account", JFD_VIATOR_PID);
  handoff.searchParams.set("product", resolvedProductCode);
  if (/^\d{4}-\d{2}-\d{2}$/.test(resolvedDate)) {
    handoff.searchParams.set("date", resolvedDate);
  }
  if (validPartySize !== null) {
    handoff.searchParams.set("partySize", String(validPartySize));
  }
  if (options?.cruiseShip?.trim()) {
    handoff.searchParams.set("cruiseShip", options.cruiseShip.trim());
  }
  if (options?.contextId?.trim()) {
    handoff.searchParams.set("ctx", options.contextId.trim());
  }
  if (options?.handoffId?.trim()) {
    handoff.searchParams.set("dcc_handoff_id", options.handoffId.trim());
  }
  handoff.searchParams.set("campaign", resolvedCampaign);
  handoff.searchParams.set("url", parsedTarget.toString());

  return handoff.toString();
}
