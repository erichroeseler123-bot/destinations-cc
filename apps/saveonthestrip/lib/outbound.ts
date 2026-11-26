import { buildAffiliateTarget } from "./affiliates";

const ALLOWED_TOUR_HOST_SUFFIXES = ["fareharbor.com"] as const;

const ALLOWED_TICKET_HOST_SUFFIXES = [
  "ticketmaster.com",
  "livenation.com",
  "universe.com",
  "frontgatetickets.com",
  "ticketweb.com",
  "seatgeek.com",
] as const;

export type TicketAffiliateProvider = "ticketmaster" | "seatgeek";

export const PARTNER_DISCLOSURE_TEXT =
  "Partner disclosure: Outbound ticket and tour links route to third-party providers (such as FareHarbor operators, Ticketmaster, or SeatGeek) and may earn Save On The Strip a partner or affiliate commission at no extra cost to you when partner tracking is active. Prices, taxes, fees, schedules, and availability can change—confirm final terms on the provider site before purchase.";

function hostMatchesAllowlist(hostname: string, suffixes: readonly string[]): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return false;
  return suffixes.some(
    (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`),
  );
}

export function validateAllowedHttpsTarget(
  rawTarget: string | null | undefined,
  allowedSuffixes: readonly string[],
): URL | null {
  const trimmed = String(rawTarget || "").trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;
    if (!hostMatchesAllowlist(parsed.hostname, allowedSuffixes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function resolveTourOutboundDestination(
  rawTarget: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): { ok: true; destination: string; affiliateWrapped: boolean } | { ok: false; error: string } {
  const parsed = validateAllowedHttpsTarget(rawTarget, ALLOWED_TOUR_HOST_SUFFIXES);
  if (!parsed) {
    return { ok: false, error: "invalid_or_untrusted_tour_target" };
  }

  const asn = String(env.FAREHARBOR_ASN || env.FAREHARBOR_AFFILIATE_ASN || "").trim();
  let affiliateWrapped = Boolean(parsed.searchParams.get("asn"));
  if (asn && !parsed.searchParams.has("asn")) {
    parsed.searchParams.set("asn", asn);
    affiliateWrapped = true;
  }

  return {
    ok: true,
    destination: parsed.toString(),
    affiliateWrapped,
  };
}

export function resolveTicketOutboundDestination(
  rawTarget: string | null | undefined,
  affiliateTarget: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
):
  | {
      ok: true;
      destination: string;
      provider: TicketAffiliateProvider;
      affiliateWrapped: boolean;
    }
  | { ok: false; error: string } {
  const parsed = validateAllowedHttpsTarget(rawTarget, ALLOWED_TICKET_HOST_SUFFIXES);
  if (!parsed) {
    return { ok: false, error: "invalid_or_untrusted_ticket_target" };
  }

  const normalizedProvider: TicketAffiliateProvider =
    affiliateTarget === "seatgeek" || parsed.hostname.toLowerCase().endsWith("seatgeek.com")
      ? "seatgeek"
      : "ticketmaster";

  const cleanTarget = parsed.toString();
  const hasTemplate =
    normalizedProvider === "seatgeek"
      ? Boolean(String(env.SEATGEEK_AFFILIATE_DEEPLINK_BASE || "").trim())
      : Boolean(String(env.TICKETMASTER_AFFILIATE_DEEPLINK_BASE || "").trim());

  const wrapped = hasTemplate
    ? buildAffiliateTarget(cleanTarget, normalizedProvider)
    : cleanTarget;

  try {
    const finalUrl = new URL(wrapped);
    if (finalUrl.protocol !== "https:") {
      return {
        ok: true,
        destination: cleanTarget,
        provider: normalizedProvider,
        affiliateWrapped: false,
      };
    }
    return {
      ok: true,
      destination: finalUrl.toString(),
      provider: normalizedProvider,
      affiliateWrapped: hasTemplate && finalUrl.toString() !== cleanTarget,
    };
  } catch {
    return {
      ok: true,
      destination: cleanTarget,
      provider: normalizedProvider,
      affiliateWrapped: false,
    };
  }
}

export type OutboundAttributionContext = {
  sourcePath: string;
  sourceSlug: string;
  sourcePage: string;
  topicSlug: string;
  handoffId?: string | null;
  eventDate?: string | null;
  partySize?: number | null;
};

export function buildTourOutHref(params: {
  target: string | null | undefined;
  productSlug: string;
  company: string;
  itemPk: number | string;
  area: string;
  attribution: OutboundAttributionContext;
}): string | null {
  if (!validateAllowedHttpsTarget(params.target, ALLOWED_TOUR_HOST_SUFFIXES)) {
    return null;
  }

  const url = new URL("/api/tours/out", "https://saveonthestrip.com");
  url.searchParams.set("target", String(params.target).trim());
  url.searchParams.set("sourcePath", params.attribution.sourcePath);
  url.searchParams.set("sourceSlug", params.attribution.sourceSlug);
  url.searchParams.set("sourcePage", params.attribution.sourcePage);
  url.searchParams.set("topicSlug", params.attribution.topicSlug);
  url.searchParams.set("productSlug", params.productSlug);
  url.searchParams.set("company", params.company);
  url.searchParams.set("itemPk", String(params.itemPk));
  url.searchParams.set("area", params.area);
  if (params.attribution.eventDate) {
    url.searchParams.set("eventDate", params.attribution.eventDate);
  }
  if (params.attribution.partySize && params.attribution.partySize > 0) {
    url.searchParams.set("partySize", String(params.attribution.partySize));
  }
  if (params.attribution.handoffId) {
    url.searchParams.set("dcc_handoff_id", params.attribution.handoffId);
  }
  return `${url.pathname}${url.search}`;
}

export function buildTicketOutHref(params: {
  target: string | null | undefined;
  affiliateTarget: TicketAffiliateProvider;
  eventId: string;
  eventName: string;
  eventDate?: string | null;
  attribution: OutboundAttributionContext;
}): string | null {
  if (!validateAllowedHttpsTarget(params.target, ALLOWED_TICKET_HOST_SUFFIXES)) {
    return null;
  }

  const url = new URL("/api/tickets/out", "https://saveonthestrip.com");
  url.searchParams.set("target", String(params.target).trim());
  url.searchParams.set("affiliateTarget", params.affiliateTarget);
  url.searchParams.set("sourcePath", params.attribution.sourcePath);
  url.searchParams.set("sourceSlug", params.attribution.sourceSlug);
  url.searchParams.set("sourcePage", params.attribution.sourcePage);
  url.searchParams.set("topicSlug", params.attribution.topicSlug);
  url.searchParams.set("eventId", params.eventId);
  url.searchParams.set("eventName", params.eventName);
  const resolvedDate = params.eventDate || params.attribution.eventDate;
  if (resolvedDate) {
    url.searchParams.set("eventDate", resolvedDate);
  }
  if (params.attribution.partySize && params.attribution.partySize > 0) {
    url.searchParams.set("partySize", String(params.attribution.partySize));
  }
  if (params.attribution.handoffId) {
    url.searchParams.set("dcc_handoff_id", params.attribution.handoffId);
  }
  return `${url.pathname}${url.search}`;
}

export function getPartnerSetupSnapshot(env: NodeJS.ProcessEnv = process.env) {
  const fareHarborRaw = String(env.FAREHARBOR_API || "").trim();
  const fareHarborCompanies = String(
    env.FAREHARBOR_COMPANIES || env.FAREHARBOR_COMPANY_SHORTNAME || "",
  ).trim();
  const hasFareHarborFeed = Boolean(
    fareHarborRaw && (fareHarborRaw.startsWith("{") || fareHarborCompanies),
  );
  const hasTicketmasterFeed = Boolean(String(env.TICKETMASTER_API_KEY || "").trim());
  const hasSeatGeekFeed = Boolean(
    String(
      env.SEATGEEK_CLIENT_ID ||
        env.SEATGEEK_API_KEY ||
        env.NEXT_PUBLIC_SEATGEEK_CLIENT_ID ||
        "",
    ).trim(),
  );
  const hasTicketmasterAffiliate = Boolean(
    String(env.TICKETMASTER_AFFILIATE_DEEPLINK_BASE || "").trim(),
  );
  const hasSeatGeekAffiliate = Boolean(
    String(env.SEATGEEK_AFFILIATE_DEEPLINK_BASE || "").trim(),
  );
  const hasFareHarborAffiliateAsn = Boolean(
    String(env.FAREHARBOR_ASN || env.FAREHARBOR_AFFILIATE_ASN || "").trim(),
  );

  return {
    hasFareHarborFeed,
    hasTicketmasterFeed,
    hasSeatGeekFeed,
    hasTicketmasterAffiliate,
    hasSeatGeekAffiliate,
    hasFareHarborAffiliateAsn,
  };
}
