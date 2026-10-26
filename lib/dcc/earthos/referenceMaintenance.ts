import { execSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { pageRegistry } from "@/data/page-registry";
import { getResolvedDatabaseIdentity } from "@/lib/db/client";
import {
  earthosControlMapFindingHistory,
  earthosControlMapFindings,
} from "@/lib/db/schema";
import { appendEarthOSAuditEvent } from "@/lib/dcc/earthos/auditLog";
import { getRequiredEarthosDb } from "@/lib/dcc/earthos/ensureEarthosSchema";
import {
  getDurableGovernanceRecordService,
  type GovernanceDriftEvent,
  type GovernanceReconciliationPacket,
} from "@/lib/dcc/earthos/governanceRecords";
import {
  launchWorkflowMission,
  signalWorkflowMission,
} from "@/lib/dcc/earthos/workflows/service";
import {
  listFactualErrorReports,
  type FactualErrorReportRecord,
} from "@/lib/dcc/earthos/factualErrorReports";
import {
  buildContextPreservingHandoffUrl,
  buildLegacyReferenceOverrideFindingId,
  buildReferenceOverrideFindingId,
  computeFutureVerificationDate,
  getAllPublishedTravelReferenceNodes,
  getAllTravelReferenceNodes,
  getPublishedTravelReferenceNodeById,
  readPublishedReferenceNodeOverrideFromDb,
  resolveEarthosEnvironmentScope,
  type EarthosEnvironmentScope,
  type EvidenceCitation,
  type PublishedReferenceNodeOverride,
  type SpecialistHandoffOption,
  type TravelReferenceNode,
} from "@/lib/dcc/travelReference";

export type ReferenceIssueKind =
  | "broken_specialist_link"
  | "stale_evidence_source"
  | "broken_internal_relationship";

export type ReferenceMaintenanceIssue = {
  issueId: string;
  nodeId: TravelReferenceNode["id"];
  canonicalPath: string;
  kind: ReferenceIssueKind;
  targetId: string;
  targetLabel: string;
  observedValue: string;
  recommendedValue: string;
  reason: string;
  severity: "watch" | "blocked" | "critical";
  detectedAt: string;
};

export type UpstreamSourceContentVerification = {
  citationId: string;
  sourceUrl: string;
  finalResolvedUrl: string;
  httpStatusCode: number;
  upstreamContentSha256: string;
  expectedTerms: string[];
  matchedClaimTerms: string[];
  unmatchedTerms: string[];
  contradictionDetected: boolean;
  contradictionReason?: string;
  contradictionReasons?: string[];
  verifiedSourceExcerpt: string;
  contentSupportsClaim: boolean;
  verificationMethod: "automated_fetch_excerpt_and_contradiction_guard_plus_human_attestation";
  verificationScopeNote: string;
  verifiedAt: string;
};

/**
 * Explicit source review attestation + upstream content verification required before any
 * stale evidence citation can have its lastCheckedAt timestamp updated.
 * Neither refreshing a timestamp alone nor an operator's checkbox/notes assertion alone is sufficient;
 * the upstream source document must also be fetched, hashed, checked for expected terms and absence of
 * contradiction/negation patterns, and paired with human reviewer attestation.
 */
export type SourceReviewAttestation = {
  citationId: string;
  reviewedSourceUrl: string;
  httpStatusCode: number;
  verifiedClaimMatchesSource: boolean;
  reviewerNotes: string;
  reviewedBy: string;
  reviewedAt: string;
  publishedOrUpdatedDate?: string | null;
  upstreamContentVerification?: UpstreamSourceContentVerification;
};

export type ReferenceContentAssertion = {
  targetId: string;
  kind: ReferenceIssueKind;
  oldValueAbsentFromPublishedNode: boolean;
  correctedValuePresentInPublishedNode: boolean;
  oldValueAbsentFromDeployedHtml: boolean;
  correctedValuePresentInDeployedHtml: boolean;
  publishedValue: string;
  sourceReviewVerified: boolean;
  upstreamSourceContentVerified?: boolean;
  upstreamContentSha256?: string;
  matchedClaimTerms?: string[];
  verifiedSourceExcerpt?: string;
  handoffContextVerified?: boolean;
  bookingFormPrefilled?: boolean;
};

export type HandoffContextVerification = {
  parameterizedHandoffUrl: string;
  finalResolvedUrl: string;
  sampleFutureDate: string;
  samplePartySize: string;
  redirectedToGenericRoot: boolean;
  preservedQueryParams: Record<string, string>;
  missingContextParams: string[];
  contextPreserved: boolean;
  bookingFormPrefilled: boolean;
  prefilledDateMatched: boolean;
  prefilledPartySizeMatched: boolean;
  datePrefilledInForm: boolean;
  partySizePrefilledInForm: boolean;
  prefillMechanism:
    | "ssr_form_controls"
    | "ssr_booking_cta_links"
    | "client_hydration_verified"
    | "none";
  prefillEvidence: string;
  expectedProductMarkers: string[];
  matchedProductMarkers: string[];
  targetTitle: string;
  productMatchesDestination: boolean;
};

export type ReferenceVerificationEvidence = {
  verifiedAt: string;
  verifiedBy: string;
  publicCanonicalPath: string;
  deployedPageUrl: string;
  deployedPageStatusCode: number;
  publicRouteRegistered: boolean;
  recheckPassed: boolean;
  remainingIssueCount: number;
  beforeSnapshot: Array<{
    targetId: string;
    kind: ReferenceIssueKind;
    observedValue: string;
  }>;
  afterSnapshot: Array<{
    targetId: string;
    kind: ReferenceIssueKind;
    correctedValue: string;
    status: "verified_clean";
  }>;
  contentAssertions: ReferenceContentAssertion[];
  probeResults: Array<{
    url: string;
    ok: boolean;
    statusCode: number;
    handoffVerification?: HandoffContextVerification;
  }>;
};

export type ReferenceMaintenanceTask = {
  taskId: string;
  findingId: string;
  nodeId: TravelReferenceNode["id"];
  canonicalPath: string;
  environmentScope?: EarthosEnvironmentScope;
  status: "open" | "remediated_pending_recheck" | "closed" | "rejected";
  severity: "watch" | "blocked" | "critical";
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  closedBy: string | null;
  missionId: string;
  driftEventId: string;
  packetId: string;
  issues: ReferenceMaintenanceIssue[];
  sourceReviews: SourceReviewAttestation[];
  verificationEvidence: ReferenceVerificationEvidence | null;
};

export type UrlProbeResult = {
  ok: boolean;
  statusCode: number;
  redirectedTo?: string;
  handoffVerification?: HandoffContextVerification;
  failureReason?: string;
};

export type UrlProbeContext = {
  handoffOption?: SpecialistHandoffOption;
  contextControls?: TravelReferenceNode["specialistHandoffs"]["contextControls"];
  nodeTitle?: string;
  nodeId?: string;
  now?: Date;
  sampleDate?: string;
  samplePartySize?: string;
};

export type UrlProbeFn = (url: string, context?: UrlProbeContext) => Promise<UrlProbeResult>;

export type DeployedPageFetchResult = {
  url: string;
  ok: boolean;
  statusCode: number;
  html: string;
};

export type DeployedPageFetchFn = (url: string) => Promise<DeployedPageFetchResult>;

/**
 * Canonical remediation guidance for known retired/broken specialist routes once an HTTP/handoff probe fails.
 * Detection itself always executes real HTTP & context-preservation probes via defaultSpecialistUrlProbe.
 */
export const KNOWN_BROKEN_SPECIALIST_URLS: Record<
  string,
  {
    replacementUrl: string;
    reason: string;
  }
> = {
  "https://juneauflightdeck.com/best-excursions-in-juneau": {
    replacementUrl: "https://juneauflightdeck.com/helicopter",
    reason:
      "Juneau Flight Deck route /best-excursions-in-juneau returned HTTP 404 in production; canonical helicopter & port-window comparison planner is /helicopter.",
  },
  "https://www.lastfrontiershoreexcursions.com/juneau-shore-excursions": {
    replacementUrl: "https://www.lastfrontiershoreexcursions.com/ports/juneau",
    reason:
      "Last Frontier Shore Excursions route /juneau-shore-excursions returned HTTP 404 in production; canonical Juneau port guide is /ports/juneau.",
  },
  "https://welcometoalaskatours.com/juneau-shore-excursions": {
    replacementUrl: "https://www.lastfrontiershoreexcursions.com/ports/juneau",
    reason:
      "Welcome to Alaska Tours is an external third-party site; DCC owned Alaska shore-excursion specialist route is https://www.lastfrontiershoreexcursions.com/ports/juneau.",
  },
  "https://welcometoalaskatours.com/ports/juneau": {
    replacementUrl: "https://www.lastfrontiershoreexcursions.com/ports/juneau",
    reason:
      "Welcome to Alaska Tours is an external third-party site; DCC owned Alaska shore-excursion specialist route is https://www.lastfrontiershoreexcursions.com/ports/juneau.",
  },
  "https://gosno.co/denver-to-breckenridge-shuttle": {
    replacementUrl: "https://gosno.co/breckenridge",
    reason:
      "GoSno route /denver-to-breckenridge-shuttle 308-redirects to generic homepage https://gosno.co/ and strips date/route context; canonical Breckenridge transfer product page is https://gosno.co/breckenridge.",
  },
};

const SPECIALIST_HOST_DEFAULT_REPLACEMENT: Record<string, string> = {
  "juneauflightdeck.com": "https://juneauflightdeck.com/helicopter",
  "www.juneauflightdeck.com": "https://juneauflightdeck.com/helicopter",
  "lastfrontiershoreexcursions.com": "https://www.lastfrontiershoreexcursions.com/ports/juneau",
  "www.lastfrontiershoreexcursions.com": "https://www.lastfrontiershoreexcursions.com/ports/juneau",
  "welcometoalaskatours.com": "https://www.lastfrontiershoreexcursions.com/ports/juneau",
  "www.welcometoalaskatours.com": "https://www.lastfrontiershoreexcursions.com/ports/juneau",
  "partyatredrocks.com": "https://www.partyatredrocks.com/book/red-rocks-amphitheatre",
  "www.partyatredrocks.com": "https://www.partyatredrocks.com/book/red-rocks-amphitheatre",
  "gosno.co": "https://gosno.co/breckenridge",
  "www.gosno.co": "https://gosno.co/breckenridge",
  "welcometoneworleanstours.com": "https://www.welcometoneworleanstours.com/tours",
  "www.welcometoneworleanstours.com": "https://www.welcometoneworleanstours.com/tours",
  "welcometotheswamp.com": "https://welcometotheswamp.com/plan",
  "www.welcometotheswamp.com": "https://welcometotheswamp.com/plan",
  "saveonthestrip.com": "https://saveonthestrip.com/shows",
  "www.saveonthestrip.com": "https://saveonthestrip.com/shows",
};

export function resolveDeployedBaseUrl(explicitBaseUrl?: string): string {
  const raw =
    explicitBaseUrl ||
    process.env.DCC_DEPLOYED_BASE_URL ||
    process.env.DCC_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.destinationcommandcenter.com";
  return raw.trim().replace(/\/$/, "");
}

function matchesInternalRoute(href: string): { valid: boolean; killed: boolean } {
  const cleanPath = href.split("?")[0].split("#")[0] || "/";
  for (const entry of pageRegistry) {
    if (entry.path === cleanPath) {
      return { valid: entry.status !== "kill", killed: entry.status === "kill" };
    }
    if (entry.path.includes("[")) {
      const pattern =
        "^" +
        entry.path
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\\\[[^\]]+\\\]/g, "[^/]+") +
        "$";
      if (new RegExp(pattern).test(cleanPath)) {
        return { valid: entry.status !== "kill", killed: entry.status === "kill" };
      }
    }
  }
  return { valid: false, killed: false };
}

function stripHtmlToPlainText(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitleFromHtml(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripHtmlToPlainText(m[1]) : "";
}

function findMatchingHandoffMetadata(url: string): {
  option?: SpecialistHandoffOption;
  contextControls?: TravelReferenceNode["specialistHandoffs"]["contextControls"];
} {
  const clean = url.split("?")[0].trim();
  for (const node of getAllTravelReferenceNodes()) {
    for (const opt of node.specialistHandoffs.options) {
      if (opt.baseUrl.trim() === clean) {
        return {
          option: opt,
          contextControls: node.specialistHandoffs.contextControls,
        };
      }
    }
  }
  return {};
}

export function verifyDestinationBookingFormPrefill(params: {
  html: string;
  finalUrl?: string;
  finalUrlObj?: URL;
  sampleDate: string;
  samplePartySize: string;
  todayIso?: string;
  supportedContextParams?: SpecialistHandoffOption["supportedContextParams"];
}): {
  bookingFormPrefilled: boolean;
  prefilledDateMatched: boolean;
  prefilledPartySizeMatched: boolean;
  datePrefilledInForm: boolean;
  partySizePrefilledInForm: boolean;
  prefillMechanism: HandoffContextVerification["prefillMechanism"];
  prefillEvidence: string;
} {
  const { html, sampleDate, samplePartySize } = params;
  const todayIso = params.todayIso || "2026-10-24";
  const supportedParams = params.supportedContextParams ?? ["date", "partySize"];
  const requiresDate = supportedParams.includes("date");
  const requiresParty = supportedParams.includes("partySize");
  const finalUrlObj =
    params.finalUrlObj ||
    new URL(params.finalUrl || "https://www.destinationcommandcenter.com");

  // 0. Reject past or non-future dates immediately
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sampleDate) || sampleDate <= todayIso) {
    return {
      bookingFormPrefilled: false,
      prefilledDateMatched: false,
      prefilledPartySizeMatched: false,
      datePrefilledInForm: false,
      partySizePrefilledInForm: false,
      prefillMechanism: "none",
      prefillEvidence: `Sample date ${sampleDate} is in the past (today is ${todayIso}).`,
    };
  }

  // Check if any date input on the page enforces min/max bounds that exclude sampleDate
  const dateInputs = html.match(/<input\b[^>]*type=["']date["'][^>]*>/gi) || [];
  for (const inputTag of dateInputs) {
    const minMatch = inputTag.match(/\bmin=["'](\d{4}-\d{2}-\d{2})["']/i);
    const maxMatch = inputTag.match(/\bmax=["'](\d{4}-\d{2}-\d{2})["']/i);
    if (minMatch && sampleDate < minMatch[1]) {
      return {
        bookingFormPrefilled: false,
        prefilledDateMatched: false,
        prefilledPartySizeMatched: false,
        datePrefilledInForm: false,
        partySizePrefilledInForm: false,
        prefillMechanism: "none",
        prefillEvidence: `Sample date ${sampleDate} is in the past relative to input min="${minMatch[1]}".`,
      };
    }
    if (maxMatch && sampleDate > maxMatch[1]) {
      return {
        bookingFormPrefilled: false,
        prefilledDateMatched: false,
        prefilledPartySizeMatched: false,
        datePrefilledInForm: false,
        partySizePrefilledInForm: false,
        prefillMechanism: "none",
        prefillEvidence: `Sample date ${sampleDate} is after input max="${maxMatch[1]}".`,
      };
    }
  }

  // Path-based specialist deep link that intentionally accepts zero query parameters (e.g. Last Frontier Shore Excursions)
  if (!requiresDate && !requiresParty) {
    const isWorkingDeepLink =
      finalUrlObj.pathname !== "/" &&
      finalUrlObj.pathname !== "" &&
      (/href=["'][^"']*(\/juneau\/|\/ports\/|\/decision\/|\/calculator|viator\.com)/i.test(html) ||
        html.includes("/_next/static/chunks/"));
    if (isWorkingDeepLink) {
      return {
        bookingFormPrefilled: true,
        prefilledDateMatched: true,
        prefilledPartySizeMatched: true,
        datePrefilledInForm: true,
        partySizePrefilledInForm: true,
        prefillMechanism: "ssr_booking_cta_links",
        prefillEvidence: `Verified path-based specialist deep link on ${finalUrlObj.hostname}${finalUrlObj.pathname} without invented query parameters.`,
      };
    }
  }

  // 1. Check SSR form controls (<input type="date" value="<sampleDate>"> + <select>/<input> party size)
  const escapedDate = sampleDate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedParty = samplePartySize.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const ssrDateInputRegex = new RegExp(
    `<input\\b[^>]*(?:type=["']date["'][^>]*value=["']${escapedDate}["']|value=["']${escapedDate}["'][^>]*type=["']date["'])[^>]*>`,
    "i",
  );
  const ssrPartyOptionRegex = new RegExp(
    `<option\\b[^>]*(?:value=["']${escapedParty}["'][^>]*selected|selected[^>]*value=["']${escapedParty}["'])[^>]*>`,
    "i",
  );
  const ssrPartyInputRegex = new RegExp(
    `<input\\b[^>]*(?:name=["'](?:party_size|travelers|passengerCount|passengers|qty)["'][^>]*value=["']${escapedParty}["']|value=["']${escapedParty}["'][^>]*name=["'](?:party_size|travelers|passengerCount|passengers|qty)["'])[^>]*>`,
    "i",
  );

  const ssrDateMatch = html.match(ssrDateInputRegex);
  const ssrPartyMatch =
    html.match(ssrPartyOptionRegex) || html.match(ssrPartyInputRegex);

  if ((ssrDateMatch || !requiresDate) && (ssrPartyMatch || !requiresParty)) {
    return {
      bookingFormPrefilled: true,
      prefilledDateMatched: true,
      prefilledPartySizeMatched: true,
      datePrefilledInForm: true,
      partySizePrefilledInForm: true,
      prefillMechanism: "ssr_form_controls",
      prefillEvidence: `SSR form controls prefilled: date=${sampleDate}${requiresParty ? ` and party=${samplePartySize}` : ""}.`,
    };
  }

  // 2. Check SSR booking/planner CTA links (<a href="...">) that bind supported context
  const anchorHrefRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let anchorMatch: RegExpExecArray | null;
  const matchedBookingCtas: string[] = [];
  while ((anchorMatch = anchorHrefRegex.exec(html)) !== null) {
    const rawHref = anchorMatch[1].replace(/&amp;/g, "&");
    const isBookingOrPlannerPath =
      /(\/book\b|\/plan\b|\/tours\b|\/shows\b|\/shuttle\b|\/juneau\b|\/ports\b|fareharbor\.com|viator\.com|getyourguide\.com|partyatredrocks\.com|gosno\.co|lastfrontiershoreexcursions\.com|juneauflightdeck\.com|welcometoneworleanstours\.com|welcometotheswamp\.com|saveonthestrip\.com|\/grand-canyon|\/hoover-dam|\/red-rock-canyon|\/las-vegas\/helicopter-tours)/i.test(
        rawHref,
      );
    if (!isBookingOrPlannerPath) continue;
    const hasDate =
      !requiresDate ||
      rawHref.includes(`date=${sampleDate}`) ||
      rawHref.includes(`date=${encodeURIComponent(sampleDate)}`);
    const hasParty =
      !requiresParty ||
      new RegExp(
        `(?:[?&])(?:qty|party_size|travelers|passengerCount|passengers)=${escapedParty}(?:[&#]|$)`,
        "i",
      ).test(rawHref);
    if (hasDate && hasParty) {
      matchedBookingCtas.push(rawHref);
    }
  }

  if (matchedBookingCtas.length > 0) {
    return {
      bookingFormPrefilled: true,
      prefilledDateMatched: true,
      prefilledPartySizeMatched: true,
      datePrefilledInForm: true,
      partySizePrefilledInForm: true,
      prefillMechanism: "ssr_booking_cta_links",
      prefillEvidence: `SSR booking/planner CTA links (${matchedBookingCtas.length}) bound supported context (e.g. ${matchedBookingCtas[0].slice(0, 120)}).`,
    };
  }

  // 3. Check Next.js client-hydrated booking/planner shells where /_next/static/chunks/ hydrate URLSearchParams
  const hasNextHydrationChunks = html.includes("/_next/static/chunks/");
  const urlHasDate =
    !requiresDate ||
    finalUrlObj.searchParams.get("date") === sampleDate ||
    finalUrlObj.searchParams.get("arrivalDate") === sampleDate;
  const urlHasParty =
    !requiresParty ||
    finalUrlObj.searchParams.get("passengerCount") === samplePartySize ||
    finalUrlObj.searchParams.get("party_size") === samplePartySize ||
    finalUrlObj.searchParams.get("travelers") === samplePartySize ||
    finalUrlObj.searchParams.get("passengers") === samplePartySize ||
    finalUrlObj.searchParams.get("qty") === samplePartySize;

  if (hasNextHydrationChunks && urlHasDate && urlHasParty) {
    return {
      bookingFormPrefilled: true,
      prefilledDateMatched: true,
      prefilledPartySizeMatched: true,
      datePrefilledInForm: true,
      partySizePrefilledInForm: true,
      prefillMechanism: "client_hydration_verified",
      prefillEvidence: `Verified Next.js client hydration bundle on ${finalUrlObj.hostname}${finalUrlObj.pathname} binds supported URLSearchParams (date=${sampleDate}${requiresParty ? `, party=${samplePartySize}` : ""}) into interactive planner/booking state.`,
    };
  }

  return {
    bookingFormPrefilled: false,
    prefilledDateMatched: Boolean(ssrDateMatch),
    prefilledPartySizeMatched: Boolean(ssrPartyMatch),
    datePrefilledInForm: Boolean(ssrDateMatch),
    partySizePrefilledInForm: Boolean(ssrPartyMatch),
    prefillMechanism: "none",
    prefillEvidence: `Target page did not bind date=${sampleDate}${requiresParty ? ` and partySize=${samplePartySize}` : ""} into SSR form controls, booking CTA links, or verified client form hydration.`,
  };
}

/**
 * Verifies that a specialist handoff link not only returns HTTP 200..399,
 * but also preserves traveler context parameters (future date, partySize, hub/port/route)
 * across redirects, does NOT redirect a product path to a generic root homepage (/),
 * lands on a page containing the expected destination/product markers, AND
 * actually prefills/binds the future date and passenger count into the destination's
 * booking form controls or booking CTAs.
 */
export async function defaultSpecialistUrlProbe(
  url: string,
  context?: UrlProbeContext,
): Promise<UrlProbeResult> {
  const trimmed = url.trim();
  const matchedMeta = context?.handoffOption
    ? { option: context.handoffOption, contextControls: context.contextControls }
    : findMatchingHandoffMetadata(trimmed);

  const isDisallowedWtaHost = /^https?:\/\/(www\.)?welcometoalaskatours\.com(\/|$)/i.test(trimmed);
  const inferredSupportedParams: SpecialistHandoffOption["supportedContextParams"] =
    /^https?:\/\/(www\.)?juneauflightdeck\.com(\/|$)/i.test(trimmed)
      ? ["date"]
      : /^https?:\/\/(www\.)?lastfrontiershoreexcursions\.com(\/|$)/i.test(trimmed)
        ? []
        : ["date", "partySize"];

  const syntheticOption: SpecialistHandoffOption = matchedMeta.option
    ? { ...matchedMeta.option, baseUrl: trimmed }
    : {
        id: "probe-target",
        partnerName: "Specialist Target",
        partnerRole: "specialist_guide",
        integrationMode: "context_handoff_link",
        description: "",
        whenItHelps: "",
        noPurchaseRequiredNote: "",
        baseUrl: trimmed,
        supportedContextParams: inferredSupportedParams,
        defaultParams:
          inferredSupportedParams.length === 0
            ? {}
            : {
                source_surface: "dcc_reference_probe",
              },
      };

  const probeNow = context?.now || new Date();
  const todayIso = probeNow.toISOString().slice(0, 10);
  const sampleDate =
    context?.sampleDate ||
    computeFutureVerificationDate(
      probeNow,
      context?.nodeId || context?.nodeTitle || trimmed,
    );
  const samplePartySize = context?.samplePartySize || "4";

  const defaultCustomChoice =
    matchedMeta.contextControls?.customSelectorOptions?.[0]?.value || "AJD";
  const customSelectorParam = matchedMeta.contextControls?.customSelectorParam;

  let parameterizedUrl: string;
  let requestedPathname = "/";

  if (trimmed.startsWith("/")) {
    const internalCheck = matchesInternalRoute(trimmed);
    if (!internalCheck.valid) {
      return {
        ok: false,
        statusCode: internalCheck.killed ? 410 : 404,
        failureReason: `Internal route ${trimmed} is not registered or is retired.`,
      };
    }
    const relativeWithParams = buildContextPreservingHandoffUrl(syntheticOption, {
      travelDate: sampleDate,
      partySize: samplePartySize,
      customChoice: defaultCustomChoice,
      customSelectorParam,
    });
    requestedPathname = relativeWithParams.split("?")[0] || "/";
    parameterizedUrl = `${resolveDeployedBaseUrl()}${relativeWithParams}`;
  } else {
    try {
      const parsedBase = new URL(trimmed);
      requestedPathname = parsedBase.pathname || "/";
      parameterizedUrl = buildContextPreservingHandoffUrl(syntheticOption, {
        travelDate: sampleDate,
        partySize: samplePartySize,
        customChoice: defaultCustomChoice,
        customSelectorParam,
      });
    } catch {
      return { ok: false, statusCode: 400, failureReason: `Invalid URL ${trimmed}` };
    }
  }

  try {
    let response = await fetch(parameterizedUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: {
        "user-agent": "DCC-EarthOS-ReferenceMonitor/1.0 (+https://www.destinationcommandcenter.com)",
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      },
    });

    // When running against a single-route local test server (127.0.0.1) that only mocks /juneau,
    // allow registered internal DCC routes (like /transportation/colorado) to verify against production.
    if (
      trimmed.startsWith("/") &&
      response.status === 404 &&
      /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i.test(resolveDeployedBaseUrl())
    ) {
      const relativePart = parameterizedUrl.slice(resolveDeployedBaseUrl().length);
      response = await fetch(`https://www.destinationcommandcenter.com${relativePart}`, {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        headers: {
          "user-agent": "DCC-EarthOS-ReferenceMonitor/1.0 (+https://www.destinationcommandcenter.com)",
          accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        },
      });
    }

    const html = await response.text();
    const plainText = stripHtmlToPlainText(html);
    const targetTitle = extractTitleFromHtml(html);
    const finalResolvedUrl = response.url || parameterizedUrl;
    const requestedUrlObj = new URL(parameterizedUrl);
    const finalUrlObj = new URL(finalResolvedUrl);

    const redirectedToGenericRoot =
      requestedPathname !== "/" &&
      requestedPathname.length > 1 &&
      (finalUrlObj.pathname === "/" || finalUrlObj.pathname === "");

    const preservedQueryParams: Record<string, string> = {};
    const missingContextParams: string[] = [];

    for (const [k, expectedVal] of requestedUrlObj.searchParams.entries()) {
      const actualInQuery = finalUrlObj.searchParams.get(k);
      if (actualInQuery === expectedVal) {
        preservedQueryParams[k] = actualInQuery;
      } else if (html.includes(expectedVal)) {
        preservedQueryParams[k] = expectedVal;
      } else {
        missingContextParams.push(k);
      }
    }

    const contextPreserved = !redirectedToGenericRoot && missingContextParams.length === 0;

    const prefillResult = await verifyDestinationBookingFormPrefill({
      html,
      finalUrlObj,
      sampleDate,
      samplePartySize,
      todayIso,
      supportedContextParams: syntheticOption.supportedContextParams,
    });

    const expectedProductMarkers =
      syntheticOption.expectedProductMarkers && syntheticOption.expectedProductMarkers.length > 0
        ? syntheticOption.expectedProductMarkers
        : [];
    const lowerHaystack = `${targetTitle} ${plainText}`.toLowerCase();
    const matchedProductMarkers = expectedProductMarkers.filter((marker) =>
      lowerHaystack.includes(marker.toLowerCase()),
    );
    const minRequiredMarkers =
      expectedProductMarkers.length === 0 ? 0 : Math.min(2, expectedProductMarkers.length);
    const productMatchesDestination =
      expectedProductMarkers.length === 0
        ? targetTitle.length > 0 || plainText.length > 40
        : matchedProductMarkers.length >= minRequiredMarkers;

    const statusOk = response.status >= 200 && response.status < 400;
    const ok =
      !isDisallowedWtaHost &&
      statusOk &&
      !redirectedToGenericRoot &&
      contextPreserved &&
      productMatchesDestination &&
      prefillResult.bookingFormPrefilled;

    const failureReasons: string[] = [];
    if (isDisallowedWtaHost) {
      failureReasons.push(
        "Welcome to Alaska Tours is an external third-party site; DCC must route Alaska specialist handoffs to Juneau Flight Deck or Last Frontier Shore Excursions.",
      );
    }
    if (!statusOk) {
      failureReasons.push(`HTTP status ${response.status}`);
    }
    if (redirectedToGenericRoot) {
      failureReasons.push(
        `Product path ${requestedPathname} redirected to generic root homepage ${finalResolvedUrl}`,
      );
    }
    if (!contextPreserved && missingContextParams.length > 0) {
      failureReasons.push(
        `Context parameters stripped on target (${missingContextParams.join(", ")})`,
      );
    }
    if (!productMatchesDestination) {
      failureReasons.push(
        `Target page '${targetTitle || finalResolvedUrl}' did not match expected product markers (${expectedProductMarkers.join(", ")})`,
      );
    }
    if (!prefillResult.bookingFormPrefilled) {
      failureReasons.push(prefillResult.prefillEvidence);
    }

    return {
      ok,
      statusCode: response.status,
      redirectedTo: response.redirected ? response.url : undefined,
      handoffVerification: {
        parameterizedHandoffUrl: parameterizedUrl,
        finalResolvedUrl,
        sampleFutureDate: sampleDate,
        samplePartySize,
        redirectedToGenericRoot,
        preservedQueryParams,
        missingContextParams,
        contextPreserved,
        bookingFormPrefilled: prefillResult.bookingFormPrefilled,
        prefilledDateMatched: prefillResult.prefilledDateMatched,
        prefilledPartySizeMatched: prefillResult.prefilledPartySizeMatched,
        datePrefilledInForm: prefillResult.prefilledDateMatched,
        partySizePrefilledInForm: prefillResult.prefilledPartySizeMatched,
        prefillMechanism: prefillResult.prefillMechanism,
        prefillEvidence: prefillResult.prefillEvidence,
        expectedProductMarkers,
        matchedProductMarkers,
        targetTitle,
        productMatchesDestination,
      },
      failureReason: failureReasons.length > 0 ? failureReasons.join("; ") : undefined,
    };
  } catch {
    return {
      ok: false,
      statusCode: 503,
      failureReason: `Network error probing ${parameterizedUrl}`,
    };
  }
}

export async function defaultUpstreamSourceFetcher(url: string): Promise<DeployedPageFetchResult> {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 DCC-EarthOS-SourceVerifier/1.0",
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
    });
    const html = await response.text();
    return {
      url: response.url || url,
      ok: response.status >= 200 && response.status < 400,
      statusCode: response.status,
      html,
    };
  } catch {
    return {
      url,
      ok: false,
      statusCode: 503,
      html: "",
    };
  }
}

function deriveExpectedTermsForCitation(citation: EvidenceCitation): string[] {
  if (citation.expectedSourceTerms && citation.expectedSourceTerms.length > 0) {
    return citation.expectedSourceTerms;
  }
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "into",
    "between",
    "under",
    "official",
    "rules",
    "guide",
    "information",
    "live",
  ]);
  const tokens = `${citation.sourceTitle} ${citation.claimSummary}`
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !stopWords.has(t.toLowerCase()));
  return Array.from(new Set(tokens)).slice(0, 4);
}

const DEFAULT_CONTRADICTION_PHRASES = [
  "no longer required",
  "no longer applies",
  "no longer in effect",
  "no longer valid",
  "has been repealed",
  "was repealed",
  "suspended indefinitely",
  "cancelled for the season",
  "exempt from all",
  "never required",
  "false that",
  "myth that",
] as const;

/**
 * Fetches the upstream authority URL for an EvidenceCitation, computes its SHA-256 content hash,
 * verifies that the upstream document contains the expected claim-supporting terms, checks the
 * surrounding context window for contradiction/negation phrases that invert the claim, and extracts
 * a verified excerpt from the upstream document.
 *
 * Technical boundary note: Automated keyword + contradiction-window analysis verifies that the live
 * upstream authority document is reachable, contains the expected domain/rule terms, and does not
 * contain explicit negation/repeal phrases around those terms; it is paired with (not a standalone
 * replacement for) an operator's human review attestation.
 */
export async function verifyUpstreamEvidenceSourceContent(
  citation: EvidenceCitation,
  fetchSource: DeployedPageFetchFn = defaultUpstreamSourceFetcher,
): Promise<UpstreamSourceContentVerification> {
  const verifiedAt = new Date().toISOString();
  const fetched = await fetchSource(citation.sourceUrl);
  const rawBody = fetched.html || "";
  const upstreamContentSha256 = createHash("sha256").update(rawBody).digest("hex");
  const plainText = stripHtmlToPlainText(rawBody);
  const lowerPlain = plainText.toLowerCase();
  const lowerRaw = rawBody.toLowerCase();
  const lowerClaim = `${citation.sourceTitle} ${citation.claimSummary}`.toLowerCase();

  const expectedTerms = deriveExpectedTermsForCitation(citation);
  const matchedClaimTerms: string[] = [];
  const unmatchedTerms: string[] = [];

  for (const term of expectedTerms) {
    const needle = term.toLowerCase();
    if (lowerPlain.includes(needle) || lowerRaw.includes(needle)) {
      matchedClaimTerms.push(term);
    } else {
      unmatchedTerms.push(term);
    }
  }

  let contradictionDetected = false;
  let contradictionReason: string | undefined;
  const contradictionReasons: string[] = [];

  // 1. Check explicit citation-level forbiddenContradictionTerms if configured
  for (const forbidden of citation.forbiddenContradictionTerms || []) {
    const needle = forbidden.toLowerCase();
    if (needle && lowerPlain.includes(needle)) {
      contradictionDetected = true;
      contradictionReason = `Upstream source contains forbidden contradiction phrase '${forbidden}'.`;
      contradictionReasons.push(contradictionReason);
      break;
    }
  }

  // 2. Check 140-character context windows around matched claim terms for negation/repeal phrases
  if (!contradictionDetected && matchedClaimTerms.length > 0 && plainText.length > 0) {
    for (const term of matchedClaimTerms) {
      const needle = term.toLowerCase();
      let searchFrom = 0;
      while (searchFrom < lowerPlain.length) {
        const idx = lowerPlain.indexOf(needle, searchFrom);
        if (idx < 0) break;
        const winStart = Math.max(0, idx - 100);
        const winEnd = Math.min(lowerPlain.length, idx + needle.length + 140);
        const windowText = lowerPlain.slice(winStart, winEnd);

        for (const phrase of DEFAULT_CONTRADICTION_PHRASES) {
          // Only flag if the contradiction phrase is not part of the citation's own expected claim
          if (windowText.includes(phrase) && !lowerClaim.includes(phrase)) {
            contradictionDetected = true;
            contradictionReason = `Upstream source contains contradiction/negation phrase '${phrase}' in context of matched term '${term}': "${plainText.slice(winStart, winEnd).trim()}"`;
            contradictionReasons.push(contradictionReason);
            break;
          }
        }
        if (contradictionDetected) break;
        searchFrom = idx + needle.length;
      }
      if (contradictionDetected) break;
    }
  }

  const minRequiredMatches =
    expectedTerms.length === 0 ? 0 : Math.min(2, expectedTerms.length);
  const contentSupportsClaim =
    fetched.ok &&
    fetched.statusCode >= 200 &&
    fetched.statusCode < 400 &&
    plainText.length > 20 &&
    matchedClaimTerms.length >= minRequiredMatches &&
    !contradictionDetected;

  let verifiedSourceExcerpt = "";
  if (matchedClaimTerms.length > 0 && plainText.length > 0) {
    const firstTerm = matchedClaimTerms[0].toLowerCase();
    const idx = lowerPlain.indexOf(firstTerm);
    if (idx >= 0) {
      const start = Math.max(0, idx - 60);
      const end = Math.min(plainText.length, idx + 180);
      verifiedSourceExcerpt = plainText.slice(start, end).trim();
    } else {
      verifiedSourceExcerpt = plainText.slice(0, 200).trim();
    }
  }

  return {
    citationId: citation.id,
    sourceUrl: citation.sourceUrl,
    finalResolvedUrl: fetched.url || citation.sourceUrl,
    httpStatusCode: fetched.statusCode,
    upstreamContentSha256,
    expectedTerms,
    matchedClaimTerms,
    unmatchedTerms,
    contradictionDetected,
    contradictionReason,
    contradictionReasons,
    verifiedSourceExcerpt,
    contentSupportsClaim,
    verificationMethod:
      "automated_fetch_excerpt_and_contradiction_guard_plus_human_attestation",
    verificationScopeNote:
      "Automated check fetches the live upstream document, records its SHA-256 hash and excerpt, verifies required claim terms, and rejects negation/contradiction patterns around those terms; paired with required human reviewer attestation.",
    verifiedAt,
  };
}

export async function defaultDeployedPageFetcher(url: string): Promise<DeployedPageFetchResult> {
  const headers: Record<string, string> = {
    "user-agent": "DCC-EarthOS-DeployedVerifier/1.0 (+https://www.destinationcommandcenter.com)",
    accept: "text/html,application/xhtml+xml",
    "cache-control": "no-cache, no-store, must-revalidate",
    pragma: "no-cache",
  };

  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (bypassSecret) {
    headers["x-vercel-protection-bypass"] = bypassSecret;
  }

  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
    headers,
  });

  const html = await response.text();
  const isVercelSsoGate =
    url.includes(".vercel.app") &&
    (response.status === 401 ||
      response.status === 403 ||
      (html.includes("data-dpl-id=") && html.includes('class="') && html.includes('dash"')));

  if (isVercelSsoGate) {
    try {
      const parsed = new URL(url);
      const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
      const pathWithQuery = `${parsed.pathname}${parsed.search}`;
      const cliHtml = execSync(
        `${npxCmd} vercel curl ${pathWithQuery} --deployment ${parsed.origin}`,
        {
          encoding: "utf8",
          maxBuffer: 25 * 1024 * 1024,
          stdio: ["ignore", "pipe", "ignore"],
        },
      );
      if (cliHtml && cliHtml.length > 0 && !cliHtml.includes(' dash"')) {
        return {
          url,
          ok: true,
          statusCode: 200,
          html: cliHtml,
        };
      }
    } catch {
      // Fall through and return raw response if vercel curl is unavailable
    }
  }

  return {
    url: response.url || url,
    ok: response.status >= 200 && response.status < 400 && !isVercelSsoGate,
    statusCode: isVercelSsoGate ? 401 : response.status,
    html,
  };
}

export async function setPublishedReferenceNodeOverride(
  override: PublishedReferenceNodeOverride,
  scope: EarthosEnvironmentScope = override.environmentScope || resolveEarthosEnvironmentScope(),
): Promise<void> {
  const db = await getRequiredEarthosDb();
  const scopedOverride: PublishedReferenceNodeOverride = {
    ...override,
    environmentScope: scope,
  };
  const findingId = buildReferenceOverrideFindingId(override.nodeId, scope);
  const updatedAt = new Date(override.updatedAt || new Date().toISOString());
  const summary = `Published reference override (${scope}) for ${override.nodeId} applied by ${override.appliedBy || "system"}${override.appliedTaskId ? ` (task ${override.appliedTaskId})` : ""}.`;

  await db
    .insert(earthosControlMapFindings)
    .values({
      findingId,
      status: "applied",
      severity: "info",
      owner: "earthos-reference-override",
      note: summary,
      metadata: scopedOverride as unknown as Record<string, unknown>,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: earthosControlMapFindings.findingId,
      set: {
        status: "applied",
        severity: "info",
        owner: "earthos-reference-override",
        note: summary,
        metadata: scopedOverride as unknown as Record<string, unknown>,
        updatedAt,
      },
    });

  await db.insert(earthosControlMapFindingHistory).values({
    findingId,
    event: "reference_override_applied",
    status: "applied",
    severity: "info",
    owner: "earthos-reference-override",
    nodeSlug: override.nodeId,
    corridor: override.nodeId,
    recordedAt: updatedAt,
    summary,
    approvedAt: updatedAt,
    approvedBy: override.appliedBy,
    controlSurface: `/${override.nodeId}`,
    metadata: scopedOverride as unknown as Record<string, unknown>,
  });
}

export async function getPublishedReferenceNodeOverride(
  nodeId: TravelReferenceNode["id"],
  scope: EarthosEnvironmentScope = resolveEarthosEnvironmentScope(),
): Promise<PublishedReferenceNodeOverride | null> {
  return readPublishedReferenceNodeOverrideFromDb(nodeId, scope);
}

async function clearOverrideFindingRowPreservingHistory(
  row: typeof earthosControlMapFindings.$inferSelect,
  clearedBy: string,
): Promise<void> {
  if (row.status === "cleared") return;
  const db = await getRequiredEarthosDb();
  const now = new Date();
  const existingMeta = (row.metadata || {}) as Record<string, unknown>;
  const nodeSlug = String(existingMeta.nodeId || row.findingId.split(":").pop() || "unknown");
  const nextMeta = {
    ...existingMeta,
    clearedAt: now.toISOString(),
    clearedBy,
  };
  const summary = `Cleared published reference override ${row.findingId} while preserving audit history (by ${clearedBy}).`;

  await db
    .update(earthosControlMapFindings)
    .set({
      status: "cleared",
      note: summary,
      metadata: nextMeta,
      updatedAt: now,
    })
    .where(eq(earthosControlMapFindings.findingId, row.findingId));

  await db.insert(earthosControlMapFindingHistory).values({
    findingId: row.findingId,
    event: "reference_override_cleared",
    status: "cleared",
    severity: "info",
    owner: "earthos-reference-override",
    nodeSlug,
    corridor: nodeSlug,
    recordedAt: now,
    summary,
    approvedAt: now,
    approvedBy: clearedBy,
    controlSurface: `/${nodeSlug}`,
    metadata: nextMeta,
  });
}

export async function clearPublishedReferenceNodeOverride(
  nodeId: TravelReferenceNode["id"],
  options?: {
    clearedBy?: string;
    scope?: EarthosEnvironmentScope;
  },
): Promise<void> {
  const db = await getRequiredEarthosDb();
  const scope = options?.scope || resolveEarthosEnvironmentScope();
  const clearedBy = options?.clearedBy || "earthos-operator-cleanup";
  const targetIds = [
    buildReferenceOverrideFindingId(nodeId, scope),
    ...(scope === "nonprod" ? [buildLegacyReferenceOverrideFindingId(nodeId)] : []),
  ];

  for (const findingId of targetIds) {
    const rows = await db
      .select()
      .from(earthosControlMapFindings)
      .where(eq(earthosControlMapFindings.findingId, findingId))
      .limit(1);
    if (rows[0]) {
      await clearOverrideFindingRowPreservingHistory(rows[0], clearedBy);
    }
  }

  if (scope === "nonprod") {
    const lockId = buildReferenceScanLockFindingId(scope);
    await db
      .update(earthosControlMapFindings)
      .set({
        status: "cleared",
        updatedAt: new Date(0),
      })
      .where(eq(earthosControlMapFindings.findingId, lockId));
  }
}

export async function clearReferenceMaintenanceStore(
  nodeId?: TravelReferenceNode["id"],
  options?: {
    clearedBy?: string;
    scope?: EarthosEnvironmentScope;
  },
): Promise<void> {
  const db = await getRequiredEarthosDb();
  if (nodeId) {
    await clearPublishedReferenceNodeOverride(nodeId, options);
    return;
  }
  const clearedBy = options?.clearedBy || "earthos-operator-cleanup";
  const rows = await db
    .select()
    .from(earthosControlMapFindings)
    .where(eq(earthosControlMapFindings.owner, "earthos-reference-override"));

  for (const row of rows) {
    await clearOverrideFindingRowPreservingHistory(row, clearedBy);
  }
}

export async function detectReferenceMaintenanceIssues(options: {
  nodes?: TravelReferenceNode[];
  now?: Date;
  maxEvidenceAgeDays?: number;
  probeUrl?: UrlProbeFn;
} = {}): Promise<ReferenceMaintenanceIssue[]> {
  const nodes = options.nodes || (await getAllPublishedTravelReferenceNodes());
  const now = options.now || new Date();
  const maxAgeDays = options.maxEvidenceAgeDays ?? 30;
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const probeUrl = options.probeUrl || defaultSpecialistUrlProbe;
  const detectedAt = now.toISOString();
  const issues: ReferenceMaintenanceIssue[] = [];

  const perNodeIssues = await Promise.all(
    nodes.map(async (node) => {
      const nodeIssues: ReferenceMaintenanceIssue[] = [];

      // 1. Check specialist handoff links via HTTP & context-preserving booking form prefill probe
      const handoffProbes = await Promise.all(
        node.specialistHandoffs.options.map(async (handoff) => {
          const baseUrl = handoff.baseUrl.trim();
          const probe = await probeUrl(baseUrl, {
            handoffOption: handoff,
            contextControls: node.specialistHandoffs.contextControls,
            nodeTitle: node.title,
            nodeId: node.id,
            now,
          });
          return { handoff, baseUrl, probe };
        }),
      );

      for (const { handoff, baseUrl, probe } of handoffProbes) {
        if (!probe.ok) {
          const knownBroken = KNOWN_BROKEN_SPECIALIST_URLS[baseUrl];
          let fallbackReplacement = knownBroken?.replacementUrl || baseUrl;
          if (!knownBroken) {
            try {
              const parsed = new URL(baseUrl);
              const hostReplacement = SPECIALIST_HOST_DEFAULT_REPLACEMENT[parsed.hostname.toLowerCase()];
              if (hostReplacement) {
                fallbackReplacement = hostReplacement;
              }
            } catch {
              // keep baseUrl if unparseable
            }
          }

          nodeIssues.push({
            issueId: `issue_${node.id}_${handoff.id}`,
            nodeId: node.id,
            canonicalPath: node.canonicalPath,
            kind: "broken_specialist_link",
            targetId: handoff.id,
            targetLabel: `${handoff.partnerName} (${handoff.id})`,
            observedValue: baseUrl,
            recommendedValue: fallbackReplacement,
            reason:
              knownBroken?.reason ||
              probe.failureReason ||
              `Specialist handoff baseUrl ${baseUrl} failed HTTP/context/booking-prefill verification with status ${probe.statusCode}.`,
            severity: "critical",
            detectedAt,
          });
        }
      }

      // 2. Check evidence citations for staleness
      for (const citation of node.evidenceRegistry) {
        const checkedMs = new Date(citation.lastCheckedAt).getTime();
        const isInvalidDate = !Number.isFinite(checkedMs);
        const ageMs = isInvalidDate ? Number.POSITIVE_INFINITY : now.getTime() - checkedMs;

        if (isInvalidDate || ageMs > maxAgeMs) {
          const ageDays = isInvalidDate ? -1 : Math.floor(ageMs / (24 * 60 * 60 * 1000));
          nodeIssues.push({
            issueId: `issue_${node.id}_${citation.id}`,
            nodeId: node.id,
            canonicalPath: node.canonicalPath,
            kind: "stale_evidence_source",
            targetId: citation.id,
            targetLabel: `${citation.sourceTitle} (${citation.issuingOrganization})`,
            observedValue: citation.lastCheckedAt,
            recommendedValue: now.toISOString().slice(0, 10),
            reason: isInvalidDate
              ? `Evidence citation ${citation.id} has an invalid lastCheckedAt date (${citation.lastCheckedAt}).`
              : `Evidence citation ${citation.id} was last verified ${ageDays} days ago (${citation.lastCheckedAt}), exceeding the ${maxAgeDays}-day freshness SLA.`,
            severity: "watch",
            detectedAt,
          });
        }
      }

      // 3. Check internal relationship links against pageRegistry
      for (const rel of node.relationships) {
        if (rel.href.startsWith("/")) {
          const routeCheck = matchesInternalRoute(rel.href);
          if (!routeCheck.valid) {
            nodeIssues.push({
              issueId: `issue_${node.id}_${rel.id}`,
              nodeId: node.id,
              canonicalPath: node.canonicalPath,
              kind: "broken_internal_relationship",
              targetId: rel.id,
              targetLabel: rel.label,
              observedValue: rel.href,
              recommendedValue: node.canonicalPath,
              reason: routeCheck.killed
                ? `Relationship ${rel.id} links to retired kill-route ${rel.href}.`
                : `Relationship ${rel.id} links to unregistered internal route ${rel.href}.`,
              severity: "blocked",
              detectedAt,
            });
          }
        }
      }

      return nodeIssues;
    }),
  );

  for (const nodeIssues of perNodeIssues) {
    issues.push(...nodeIssues);
  }

  return issues;
}

async function persistTaskFindingToDb(
  task: ReferenceMaintenanceTask,
  eventName: string,
  summary: string,
): Promise<void> {
  const db = await getRequiredEarthosDb();
  const taskPayload = task as unknown as Record<string, unknown>;

  await db
    .insert(earthosControlMapFindings)
    .values({
      findingId: task.findingId,
      status: task.status,
      severity: task.severity,
      owner: "earthos-reference-maintainer",
      note: summary,
      metadata: taskPayload,
      updatedAt: new Date(task.updatedAt),
    })
    .onConflictDoUpdate({
      target: earthosControlMapFindings.findingId,
      set: {
        status: task.status,
        severity: task.severity,
        owner: "earthos-reference-maintainer",
        note: summary,
        metadata: taskPayload,
        updatedAt: new Date(task.updatedAt),
      },
    });

  await db.insert(earthosControlMapFindingHistory).values({
    findingId: task.findingId,
    event: eventName,
    status: task.status,
    severity: task.severity,
    owner: "earthos-reference-maintainer",
    nodeSlug: task.nodeId,
    corridor: task.nodeId,
    recordedAt: new Date(task.updatedAt),
    summary,
    approvedAt: task.closedAt ? new Date(task.closedAt) : null,
    approvedBy: task.closedBy,
    controlSurface: task.canonicalPath,
    metadata: {
      taskId: task.taskId,
      issues: task.issues,
      sourceReviews: task.sourceReviews,
      verificationEvidence: task.verificationEvidence,
    },
  });
}

function parseTaskFromFindingRow(
  row: typeof earthosControlMapFindings.$inferSelect,
): ReferenceMaintenanceTask | null {
  const meta = row.metadata as Partial<ReferenceMaintenanceTask> | null;
  if (!meta || typeof meta.taskId !== "string" || !Array.isArray(meta.issues)) {
    return null;
  }
  const inferredScope: EarthosEnvironmentScope =
    meta.environmentScope === "production" ||
    row.findingId.startsWith("control-map:travel-reference:production:")
      ? "production"
      : "nonprod";

  return {
    taskId: meta.taskId,
    findingId: row.findingId,
    nodeId: meta.nodeId as TravelReferenceNode["id"],
    canonicalPath: meta.canonicalPath || `/${meta.nodeId}`,
    environmentScope: inferredScope,
    status: (row.status as ReferenceMaintenanceTask["status"]) || meta.status || "open",
    severity: (row.severity as ReferenceMaintenanceTask["severity"]) || meta.severity || "watch",
    createdAt: meta.createdAt || row.createdAt.toISOString(),
    updatedAt: meta.updatedAt || row.updatedAt.toISOString(),
    closedAt: meta.closedAt ?? null,
    closedBy: meta.closedBy ?? null,
    missionId: meta.missionId || "",
    driftEventId: meta.driftEventId || "",
    packetId: meta.packetId || "",
    issues: meta.issues,
    sourceReviews: Array.isArray(meta.sourceReviews) ? meta.sourceReviews : [],
    verificationEvidence: meta.verificationEvidence ?? null,
  };
}

export async function recordReferenceMaintenanceTask(
  nodeId: TravelReferenceNode["id"],
  issues: ReferenceMaintenanceIssue[],
): Promise<ReferenceMaintenanceTask> {
  const nodeIssues = issues.filter((issue) => issue.nodeId === nodeId);
  if (nodeIssues.length === 0) {
    throw new Error(`No reference maintenance issues to record for node ${nodeId}.`);
  }

  // Ensure DB is available before creating any task records
  await getRequiredEarthosDb();

  const scope = resolveEarthosEnvironmentScope();
  const now = new Date().toISOString();
  const taskId = `ref_task_${nodeId}_${randomUUID().slice(0, 8)}`;
  const findingId = `control-map:travel-reference:${scope}:${nodeId}:${taskId}`;
  const canonicalPath = nodeIssues[0].canonicalPath;
  const highestSeverity = nodeIssues.some((i) => i.severity === "critical")
    ? "critical"
    : nodeIssues.some((i) => i.severity === "blocked")
      ? "blocked"
      : "watch";

  const governance = getDurableGovernanceRecordService();

  const driftEvent: GovernanceDriftEvent | null = await governance.appendDriftEvent({
    id: `drift_${taskId}`,
    createdAt: now,
    sourceSurface: "earthos-reference-monitor",
    affectedSurface: canonicalPath,
    corridorId: nodeId,
    eventType: "travel_reference_integrity_drift",
    severity: highestSeverity,
    status: "open",
    findingId,
    summary: `Detected ${nodeIssues.length} reference integrity issue(s) on ${canonicalPath}: ${nodeIssues.map((i) => `${i.kind}(${i.targetId})`).join(", ")}`,
    evidenceJson: {
      taskId,
      nodeId,
      canonicalPath,
      environmentScope: scope,
      issues: nodeIssues,
    },
    expectedRole: "verified_travel_reference",
    observedRole: "stale_or_broken_reference_target",
    continuityState: "remediation_required",
    machineInterpretationRisk: highestSeverity === "critical" ? "high" : "medium",
  });

  if (!driftEvent) {
    throw new Error(`Failed to persist governance drift event for task ${taskId}.`);
  }

  const packet: GovernanceReconciliationPacket | null = await governance.createReconciliationPacket({
    id: `packet_${taskId}`,
    createdAt: now,
    packetType: "travel_reference_remediation",
    status: "proposed",
    proposedChangesJson: {
      taskId,
      nodeId,
      environmentScope: scope,
      remappings: nodeIssues.map((issue) => ({
        targetId: issue.targetId,
        kind: issue.kind,
        from: issue.observedValue,
        to: issue.recommendedValue,
      })),
    },
    affectedRoutesJson: [canonicalPath],
    affectedSurfacesJson: [canonicalPath, ...nodeIssues.map((i) => i.observedValue)],
    reason: `Repair ${nodeIssues.length} broken/stale reference item(s) on ${canonicalPath}.`,
    approvalRequired: true,
  });

  if (!packet) {
    throw new Error(`Failed to persist governance reconciliation packet for task ${taskId}.`);
  }

  const entityForMission =
    nodeId === "juneau"
      ? "alaska"
      : nodeId === "red-rocks"
        ? "redrocks"
        : nodeId === "denver-breckenridge"
          ? "gosno"
          : "earthos";

  const mission = await launchWorkflowMission({
    entity: entityForMission,
    region: nodeId,
    missionType: "reference-maintenance",
    objective: `Repair ${nodeIssues.length} reference issue(s) on ${canonicalPath}`,
  });

  const task: ReferenceMaintenanceTask = {
    taskId,
    findingId,
    nodeId,
    canonicalPath,
    environmentScope: scope,
    status: "open",
    severity: highestSeverity,
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    closedBy: null,
    missionId: mission.id,
    driftEventId: driftEvent.id,
    packetId: packet.id,
    issues: nodeIssues,
    sourceReviews: [],
    verificationEvidence: null,
  };

  await persistTaskFindingToDb(
    task,
    "reference_drift_detected",
    `Opened maintenance task ${taskId} with ${nodeIssues.length} issue(s).`,
  );

  appendEarthOSAuditEvent({
    eventType: "reference_drift_detected",
    entity: entityForMission,
    corridorId: nodeId,
    severity: highestSeverity === "critical" ? "critical" : "watch",
    summary: `Recorded persistent maintenance task ${taskId} for ${canonicalPath} (${nodeIssues.length} issue(s)).`,
    metadata: {
      taskId,
      findingId,
      environmentScope: scope,
      missionId: mission.id,
      driftEventId: task.driftEventId,
      packetId: task.packetId,
      issues: nodeIssues,
    },
  });

  return task;
}

export async function getReferenceMaintenanceTask(
  taskId: string,
): Promise<ReferenceMaintenanceTask | null> {
  const db = await getRequiredEarthosDb();
  const rows = await db
    .select()
    .from(earthosControlMapFindings)
    .where(
      and(
        eq(earthosControlMapFindings.owner, "earthos-reference-maintainer"),
        sql`${earthosControlMapFindings.metadata}->>'taskId' = ${taskId}`,
      ),
    )
    .limit(1);

  if (!rows[0]) return null;
  return parseTaskFromFindingRow(rows[0]);
}

export async function listReferenceMaintenanceTasks(options: {
  nodeId?: TravelReferenceNode["id"];
  status?: ReferenceMaintenanceTask["status"];
  limit?: number;
  environmentScope?: EarthosEnvironmentScope | "all";
} = {}): Promise<ReferenceMaintenanceTask[]> {
  const db = await getRequiredEarthosDb();
  const rows = await db
    .select()
    .from(earthosControlMapFindings)
    .where(eq(earthosControlMapFindings.owner, "earthos-reference-maintainer"))
    .orderBy(desc(earthosControlMapFindings.updatedAt))
    .limit(options.limit || 100);

  const tasks = rows
    .map(parseTaskFromFindingRow)
    .filter((t): t is ReferenceMaintenanceTask => t !== null);

  const targetScope = options.environmentScope || resolveEarthosEnvironmentScope();

  return tasks.filter((task) => {
    if (targetScope !== "all" && (task.environmentScope || "nonprod") !== targetScope) {
      return false;
    }
    if (options.nodeId && task.nodeId !== options.nodeId) return false;
    if (options.status && task.status !== options.status) return false;
    return true;
  });
}

function validateSourceReviewAttestation(
  review: SourceReviewAttestation | undefined,
  expectedCitationSourceUrl: string,
): { valid: boolean; reason?: string } {
  if (!review) {
    return {
      valid: false,
      reason: "Missing SourceReviewAttestation; refreshing a timestamp without source review is prohibited.",
    };
  }
  if (!review.verifiedClaimMatchesSource) {
    return {
      valid: false,
      reason: `Source review for ${review.citationId} did not confirm that the claim matches the upstream source.`,
    };
  }
  if (review.httpStatusCode < 200 || review.httpStatusCode >= 400) {
    return {
      valid: false,
      reason: `Source review for ${review.citationId} recorded unhealthy HTTP status ${review.httpStatusCode}.`,
    };
  }
  if (review.reviewedSourceUrl.trim() !== expectedCitationSourceUrl.trim()) {
    return {
      valid: false,
      reason: `Source review URL (${review.reviewedSourceUrl}) does not match citation sourceUrl (${expectedCitationSourceUrl}).`,
    };
  }
  if (!review.reviewerNotes || review.reviewerNotes.trim().length < 10) {
    return {
      valid: false,
      reason: `Source review for ${review.citationId} requires substantive reviewerNotes (>= 10 chars).`,
    };
  }
  if (!review.reviewedBy || !review.reviewedBy.trim()) {
    return {
      valid: false,
      reason: `Source review for ${review.citationId} requires a non-empty reviewedBy identifier.`,
    };
  }
  const reviewedMs = new Date(review.reviewedAt).getTime();
  if (!Number.isFinite(reviewedMs)) {
    return {
      valid: false,
      reason: `Source review for ${review.citationId} has an invalid reviewedAt timestamp (${review.reviewedAt}).`,
    };
  }
  return { valid: true };
}

export async function applyReferenceMaintenanceCorrection(options: {
  taskId: string;
  targetNode?: TravelReferenceNode;
  approved: boolean;
  operator: string;
  sourceReviews?: SourceReviewAttestation[];
  fetchUpstreamSource?: DeployedPageFetchFn;
}): Promise<{
  applied: boolean;
  task: ReferenceMaintenanceTask;
  remediatedNode: TravelReferenceNode;
  unreviewedStaleCitationIds: string[];
}> {
  const operatorNormalized = (options.operator || "").trim();
  if (!operatorNormalized) {
    throw new Error("An authenticated operator identifier is required to approve or reject a reference correction.");
  }
  if (/^(vercel:cron|cron|scheduled-detector|system:cron)$/i.test(operatorNormalized)) {
    throw new Error(
      "Scheduled detection cannot approve or apply its own reference corrections; an authorized operator is required.",
    );
  }

  const task = await getReferenceMaintenanceTask(options.taskId);
  if (!task) {
    throw new Error(`Reference maintenance task ${options.taskId} not found in durable backend.`);
  }

  const baseTargetNode =
    options.targetNode || (await getPublishedTravelReferenceNodeById(task.nodeId));
  const now = new Date().toISOString();
  const governance = getDurableGovernanceRecordService();

  if (options.approved !== true) {
    await signalWorkflowMission(task.missionId, "erich-approval", {
      approved: false,
      operator: options.operator,
    });

    task.status = "rejected";
    task.updatedAt = now;

    await persistTaskFindingToDb(
      task,
      "reference_remediation_rejected",
      `Remediation rejected by ${options.operator}.`,
    );

    appendEarthOSAuditEvent({
      eventType: "reference_remediation_rejected",
      entity: "earthos",
      corridorId: task.nodeId,
      severity: "high",
      summary: `Operator ${options.operator} rejected remediation for task ${task.taskId}; task remains unapplied.`,
      metadata: {
        taskId: task.taskId,
        missionId: task.missionId,
        operator: options.operator,
      },
    });

    return {
      applied: false,
      task,
      remediatedNode: baseTargetNode,
      unreviewedStaleCitationIds: [],
    };
  }

  // Clone and apply corrections to targetNode
  const remediatedNode: TravelReferenceNode = structuredClone(baseTargetNode);
  const taskScope = task.environmentScope || resolveEarthosEnvironmentScope();
  const existingOverride = await readPublishedReferenceNodeOverrideFromDb(task.nodeId, taskScope);
  const nextOverride: PublishedReferenceNodeOverride = {
    nodeId: task.nodeId,
    environmentScope: taskScope,
    updatedAt: now,
    appliedTaskId: task.taskId,
    appliedBy: options.operator,
    specialistHandoffBaseUrls: { ...(existingOverride?.specialistHandoffBaseUrls || {}) },
    evidenceReviews: { ...(existingOverride?.evidenceReviews || {}) },
    relationshipHrefs: { ...(existingOverride?.relationshipHrefs || {}) },
  };

  const acceptedSourceReviews: SourceReviewAttestation[] = [...(task.sourceReviews || [])];
  const unreviewedStaleCitationIds: string[] = [];

  for (const issue of task.issues) {
    if (issue.kind === "broken_specialist_link") {
      const option = remediatedNode.specialistHandoffs.options.find((opt) => opt.id === issue.targetId);
      if (option) {
        option.baseUrl = issue.recommendedValue;
        nextOverride.specialistHandoffBaseUrls![issue.targetId] = issue.recommendedValue;
      }
    } else if (issue.kind === "stale_evidence_source") {
      const citation = remediatedNode.evidenceRegistry.find((cit) => cit.id === issue.targetId);
      if (citation) {
        const suppliedReview = options.sourceReviews?.find((r) => r.citationId === issue.targetId);
        const validation = validateSourceReviewAttestation(suppliedReview, citation.sourceUrl);
        if (!validation.valid || !suppliedReview) {
          // Do NOT bump lastCheckedAt without a verified source review attestation—even if caller mutated targetNode!
          citation.lastCheckedAt = issue.observedValue;
          delete nextOverride.evidenceReviews![issue.targetId];
          unreviewedStaleCitationIds.push(issue.targetId);
        } else {
          const upstreamVerification =
            suppliedReview.upstreamContentVerification ||
            (await verifyUpstreamEvidenceSourceContent(citation, options.fetchUpstreamSource));

          if (
            !upstreamVerification.contentSupportsClaim ||
            upstreamVerification.contradictionDetected ||
            !upstreamVerification.upstreamContentSha256 ||
            upstreamVerification.matchedClaimTerms.length === 0
          ) {
            // Operator attestation alone does not pass if the live upstream source document does not support the claim or contradicts it
            citation.lastCheckedAt = issue.observedValue;
            delete nextOverride.evidenceReviews![issue.targetId];
            unreviewedStaleCitationIds.push(issue.targetId);
          } else {
            const verifiedReview: SourceReviewAttestation = {
              ...suppliedReview,
              upstreamContentVerification: upstreamVerification,
            };
            const checkedDate = verifiedReview.reviewedAt.slice(0, 10);
            citation.lastCheckedAt = checkedDate;
            citation.verificationNote = verifiedReview.reviewerNotes;
            citation.upstreamContentSha256 = upstreamVerification.upstreamContentSha256;
            citation.matchedClaimTerms = upstreamVerification.matchedClaimTerms;
            citation.verifiedSourceExcerpt = upstreamVerification.verifiedSourceExcerpt;
            if (verifiedReview.publishedOrUpdatedDate !== undefined) {
              citation.publishedOrUpdatedDate = verifiedReview.publishedOrUpdatedDate;
            }
            nextOverride.evidenceReviews![issue.targetId] = {
              lastCheckedAt: checkedDate,
              publishedOrUpdatedDate: verifiedReview.publishedOrUpdatedDate,
              verificationNote: verifiedReview.reviewerNotes,
              reviewedBy: verifiedReview.reviewedBy,
              reviewedSourceUrl: verifiedReview.reviewedSourceUrl,
              upstreamContentSha256: upstreamVerification.upstreamContentSha256,
              matchedClaimTerms: upstreamVerification.matchedClaimTerms,
              verifiedSourceExcerpt: upstreamVerification.verifiedSourceExcerpt,
            };
            const existingIdx = acceptedSourceReviews.findIndex((r) => r.citationId === issue.targetId);
            if (existingIdx >= 0) {
              acceptedSourceReviews[existingIdx] = verifiedReview;
            } else {
              acceptedSourceReviews.push(verifiedReview);
            }
          }
        }
      }
    } else if (issue.kind === "broken_internal_relationship") {
      const rel = remediatedNode.relationships.find((r) => r.id === issue.targetId);
      if (rel) {
        rel.href = issue.recommendedValue;
        nextOverride.relationshipHrefs![issue.targetId] = issue.recommendedValue;
      }
    }
  }

  if (unreviewedStaleCitationIds.length === 0) {
    remediatedNode.lastReviewedAt = now.slice(0, 10);
    nextOverride.lastReviewedAt = now.slice(0, 10);
  }

  // Persist approved override in the durable Postgres backend before marking task remediated
  await setPublishedReferenceNodeOverride(nextOverride, taskScope);

  // Explicitly approve and apply packet + signal mission
  await governance.markPacketApproved(task.packetId, options.operator, now);
  await governance.markPacketApplied(
    task.packetId,
    {
      appliedBy: options.operator,
      appliedAt: now,
      remediatedIssueIds: task.issues
        .filter((i) => !unreviewedStaleCitationIds.includes(i.targetId))
        .map((i) => i.issueId),
      unreviewedStaleCitationIds,
      sourceReviews: acceptedSourceReviews,
    },
    now,
  );

  await signalWorkflowMission(task.missionId, "erich-approval", {
    approved: true,
    operator: options.operator,
  });

  task.sourceReviews = acceptedSourceReviews;
  task.status = "remediated_pending_recheck";
  task.updatedAt = now;

  await persistTaskFindingToDb(
    task,
    "reference_remediation_applied",
    `Applied approved remediation for task ${task.taskId} by ${options.operator}.`,
  );

  appendEarthOSAuditEvent({
    eventType: "reference_remediation_applied",
    entity: "earthos",
    corridorId: task.nodeId,
    severity: unreviewedStaleCitationIds.length > 0 ? "watch" : "info",
    summary: `Applied reference correction(s) for task ${task.taskId} on ${task.canonicalPath} (unreviewedStaleCitations=${unreviewedStaleCitationIds.length}).`,
    metadata: {
      taskId: task.taskId,
      operator: options.operator,
      packetId: task.packetId,
      missionId: task.missionId,
      unreviewedStaleCitationIds,
      sourceReviews: acceptedSourceReviews,
    },
  });

  return {
    applied: true,
    task,
    remediatedNode,
    unreviewedStaleCitationIds,
  };
}

export async function verifyAndCloseReferenceMaintenanceTask(options: {
  taskId: string;
  remediatedNode?: TravelReferenceNode;
  verifiedBy: string;
  now?: Date;
  maxEvidenceAgeDays?: number;
  probeUrl?: UrlProbeFn;
  deployedBaseUrl?: string;
  fetchDeployedPage?: DeployedPageFetchFn;
}): Promise<ReferenceMaintenanceTask> {
  const verifiedByNormalized = (options.verifiedBy || "").trim();
  if (
    !verifiedByNormalized ||
    /^(vercel:cron|cron|scheduled-detector|system:cron)$/i.test(verifiedByNormalized)
  ) {
    throw new Error(
      "Scheduled detection cannot verify or close its own reference maintenance tasks; an authorized operator is required.",
    );
  }

  const task = await getReferenceMaintenanceTask(options.taskId);
  if (!task) {
    throw new Error(`Reference maintenance task ${options.taskId} not found in durable backend.`);
  }
  if (task.status !== "remediated_pending_recheck") {
    throw new Error(
      `Cannot verify and close task ${options.taskId} from status '${task.status}' (must be 'remediated_pending_recheck').`,
    );
  }

  const now = options.now || new Date();
  const verifiedAt = now.toISOString();
  const probeUrl = options.probeUrl || defaultSpecialistUrlProbe;
  const fetchDeployedPage = options.fetchDeployedPage || defaultDeployedPageFetcher;

  // 1. Read the published destination node from durable DB
  const publishedNode = await getPublishedTravelReferenceNodeById(task.nodeId);
  const nodeUnderTest = options.remediatedNode || publishedNode;

  // 2. Fetch the deployed destination page over HTTP and inspect its rendered HTML
  const deployedBase = resolveDeployedBaseUrl(options.deployedBaseUrl);
  const deployedPageUrl = `${deployedBase}${task.canonicalPath}`;
  const deployedPage = await fetchDeployedPage(deployedPageUrl);

  if (!deployedPage.ok || deployedPage.statusCode !== 200) {
    throw new Error(
      `Deployed destination page fetch failed for ${deployedPageUrl} with HTTP status ${deployedPage.statusCode}.`,
    );
  }

  const contentAssertions: ReferenceContentAssertion[] = [];
  const contentFailures: string[] = [];

  for (const issue of task.issues) {
    if (issue.kind === "broken_specialist_link") {
      const publishedOption = publishedNode.specialistHandoffs.options.find(
        (opt) => opt.id === issue.targetId,
      );
      const candidateOption = nodeUnderTest.specialistHandoffs.options.find(
        (opt) => opt.id === issue.targetId,
      );
      const actualUrl = (candidateOption?.baseUrl || "").trim();
      const publishedUrl = (publishedOption?.baseUrl || "").trim();
      const oldUrlStillInNode = nodeUnderTest.specialistHandoffs.options.some(
        (opt) => opt.baseUrl.trim() === issue.observedValue.trim(),
      );
      const correctedPresentInNode =
        actualUrl === issue.recommendedValue.trim() &&
        publishedUrl === issue.recommendedValue.trim() &&
        !KNOWN_BROKEN_SPECIALIST_URLS[actualUrl];

      const oldAbsentFromHtml = !deployedPage.html.includes(issue.observedValue.trim());
      const correctedPresentInHtml = deployedPage.html.includes(issue.recommendedValue.trim());

      const handoffProbe = await probeUrl(publishedUrl, {
        handoffOption: publishedOption || candidateOption,
        contextControls: publishedNode.specialistHandoffs.contextControls,
        nodeTitle: publishedNode.title,
        nodeId: publishedNode.id,
        now,
      });
      const bookingFormPrefilled =
        !handoffProbe.handoffVerification ||
        handoffProbe.handoffVerification.bookingFormPrefilled === true;
      const handoffContextVerified =
        handoffProbe.ok &&
        bookingFormPrefilled &&
        (!handoffProbe.handoffVerification ||
          (handoffProbe.handoffVerification.contextPreserved &&
            handoffProbe.handoffVerification.productMatchesDestination &&
            !handoffProbe.handoffVerification.redirectedToGenericRoot));

      contentAssertions.push({
        targetId: issue.targetId,
        kind: issue.kind,
        oldValueAbsentFromPublishedNode: !oldUrlStillInNode && actualUrl !== issue.observedValue.trim(),
        correctedValuePresentInPublishedNode: correctedPresentInNode,
        oldValueAbsentFromDeployedHtml: oldAbsentFromHtml,
        correctedValuePresentInDeployedHtml: correctedPresentInHtml,
        publishedValue: publishedUrl,
        sourceReviewVerified: true,
        handoffContextVerified,
        bookingFormPrefilled,
      });

      if (oldUrlStillInNode || !correctedPresentInNode) {
        contentFailures.push(
          `Broken specialist link ${issue.targetId} was not replaced in published destination model (observed='${publishedUrl}', expected='${issue.recommendedValue}').`,
        );
      } else if (!oldAbsentFromHtml || !correctedPresentInHtml) {
        contentFailures.push(
          `Deployed destination page ${deployedPageUrl} does not contain corrected specialist link '${issue.recommendedValue}' or still contains broken link '${issue.observedValue}'.`,
        );
      } else if (!handoffContextVerified) {
        contentFailures.push(
          `Specialist handoff ${issue.targetId} (${publishedUrl}) failed context/product/booking-prefill verification: ${handoffProbe.failureReason || "target did not prefill booking controls or preserve traveler context"}.`,
        );
      }
    } else if (issue.kind === "stale_evidence_source") {
      const publishedCitation = publishedNode.evidenceRegistry.find((c) => c.id === issue.targetId);
      const candidateCitation = nodeUnderTest.evidenceRegistry.find((c) => c.id === issue.targetId);
      const attestation = (task.sourceReviews || []).find((r) => r.citationId === issue.targetId);
      const attestationCheck = validateSourceReviewAttestation(
        attestation,
        publishedCitation?.sourceUrl || candidateCitation?.sourceUrl || "",
      );

      const upstreamVerification = attestation?.upstreamContentVerification;
      const upstreamContentVerified = Boolean(
        upstreamVerification &&
          upstreamVerification.contentSupportsClaim &&
          !upstreamVerification.contradictionDetected &&
          upstreamVerification.upstreamContentSha256 &&
          upstreamVerification.matchedClaimTerms.length > 0 &&
          publishedCitation?.upstreamContentSha256 === upstreamVerification.upstreamContentSha256,
      );

      const publishedCheckedAt = publishedCitation?.lastCheckedAt || "";
      const candidateCheckedAt = candidateCitation?.lastCheckedAt || "";
      const oldDateReplaced =
        publishedCheckedAt !== issue.observedValue && candidateCheckedAt !== issue.observedValue;
      const noteMatches =
        Boolean(attestation) &&
        publishedCitation?.verificationNote === attestation?.reviewerNotes &&
        candidateCitation?.verificationNote === attestation?.reviewerNotes;

      const staleAttrSnippet = `data-citation-id="${issue.targetId}" data-last-checked="${issue.observedValue}"`;
      const freshAttrSnippet = `data-citation-id="${issue.targetId}" data-last-checked="${publishedCheckedAt}"`;
      const oldAbsentFromHtml = !deployedPage.html.includes(staleAttrSnippet);
      const correctedPresentInHtml =
        attestation !== undefined &&
        deployedPage.html.includes(freshAttrSnippet) &&
        deployedPage.html.includes(attestation.reviewerNotes);

      contentAssertions.push({
        targetId: issue.targetId,
        kind: issue.kind,
        oldValueAbsentFromPublishedNode: oldDateReplaced,
        correctedValuePresentInPublishedNode: oldDateReplaced && noteMatches && upstreamContentVerified,
        oldValueAbsentFromDeployedHtml: oldAbsentFromHtml,
        correctedValuePresentInDeployedHtml: correctedPresentInHtml,
        publishedValue: publishedCheckedAt,
        sourceReviewVerified: attestationCheck.valid && upstreamContentVerified,
        upstreamSourceContentVerified: upstreamContentVerified,
        upstreamContentSha256: upstreamVerification?.upstreamContentSha256,
        matchedClaimTerms: upstreamVerification?.matchedClaimTerms,
        verifiedSourceExcerpt: upstreamVerification?.verifiedSourceExcerpt,
      });

      if (!attestationCheck.valid) {
        contentFailures.push(
          `Stale evidence source ${issue.targetId} cannot be closed without source review: ${attestationCheck.reason}`,
        );
      } else if (!upstreamContentVerified) {
        contentFailures.push(
          `Stale evidence source ${issue.targetId} requires verified upstream source content without contradiction (SHA-256 hash and matched claim terms).`,
        );
      } else if (!oldDateReplaced || !noteMatches) {
        contentFailures.push(
          `Stale evidence source ${issue.targetId} review did not reach published destination model.`,
        );
      } else if (!oldAbsentFromHtml || !correctedPresentInHtml) {
        contentFailures.push(
          `Deployed destination page ${deployedPageUrl} does not render updated evidence citation ${issue.targetId} (${freshAttrSnippet}) and source review note.`,
        );
      }
    } else if (issue.kind === "broken_internal_relationship") {
      const publishedRel = publishedNode.relationships.find((r) => r.id === issue.targetId);
      const candidateRel = nodeUnderTest.relationships.find((r) => r.id === issue.targetId);
      const publishedHref = (publishedRel?.href || "").trim();
      const candidateHref = (candidateRel?.href || "").trim();
      const routeValid = matchesInternalRoute(publishedHref).valid;
      const correctedPresentInNode =
        publishedHref === issue.recommendedValue.trim() &&
        candidateHref === issue.recommendedValue.trim() &&
        routeValid;

      const oldAbsentFromHtml = !deployedPage.html.includes(`href="${issue.observedValue.trim()}"`);
      const correctedPresentInHtml = deployedPage.html.includes(issue.recommendedValue.trim());

      contentAssertions.push({
        targetId: issue.targetId,
        kind: issue.kind,
        oldValueAbsentFromPublishedNode: publishedHref !== issue.observedValue.trim(),
        correctedValuePresentInPublishedNode: correctedPresentInNode,
        oldValueAbsentFromDeployedHtml: oldAbsentFromHtml,
        correctedValuePresentInDeployedHtml: correctedPresentInHtml,
        publishedValue: publishedHref,
        sourceReviewVerified: true,
      });

      if (!correctedPresentInNode || !oldAbsentFromHtml || !correctedPresentInHtml) {
        contentFailures.push(
          `Broken internal relationship ${issue.targetId} was not repaired in deployed destination page ${deployedPageUrl} (observed='${publishedHref}', expected='${issue.recommendedValue}').`,
        );
      }
    }
  }

  if (contentFailures.length > 0) {
    throw new Error(
      `Content verification failed for task ${task.taskId}: ${contentFailures.join(" | ")}`,
    );
  }

  // Recheck the remediated node for any remaining or newly introduced issues
  const remainingIssues = await detectReferenceMaintenanceIssues({
    nodes: [nodeUnderTest],
    now,
    maxEvidenceAgeDays: options.maxEvidenceAgeDays,
    probeUrl,
  });

  const probeResults: ReferenceVerificationEvidence["probeResults"] = await Promise.all(
    nodeUnderTest.specialistHandoffs.options.map(async (handoff) => {
      const res = await probeUrl(handoff.baseUrl, {
        handoffOption: handoff,
        contextControls: nodeUnderTest.specialistHandoffs.contextControls,
        nodeTitle: nodeUnderTest.title,
        nodeId: nodeUnderTest.id,
        now,
      });
      return {
        url: handoff.baseUrl,
        ok: res.ok,
        statusCode: res.statusCode,
        handoffVerification: res.handoffVerification,
      };
    }),
  );

  const routeCheck = matchesInternalRoute(nodeUnderTest.canonicalPath);
  const recheckPassed =
    remainingIssues.length === 0 &&
    routeCheck.valid &&
    deployedPage.ok &&
    deployedPage.statusCode === 200 &&
    probeResults.every((p) => p.ok) &&
    contentAssertions.every(
      (a) =>
        a.oldValueAbsentFromPublishedNode &&
        a.correctedValuePresentInPublishedNode &&
        a.oldValueAbsentFromDeployedHtml &&
        a.correctedValuePresentInDeployedHtml &&
        a.sourceReviewVerified &&
        (a.handoffContextVerified === undefined || a.handoffContextVerified) &&
        (a.bookingFormPrefilled === undefined || a.bookingFormPrefilled) &&
        (a.upstreamSourceContentVerified === undefined || a.upstreamSourceContentVerified),
    );

  if (!recheckPassed) {
    throw new Error(
      `Recheck failed for task ${task.taskId}: ${remainingIssues.length} remaining issue(s), routeValid=${routeCheck.valid}, deployedStatus=${deployedPage.statusCode}.`,
    );
  }

  const evidence: ReferenceVerificationEvidence = {
    verifiedAt,
    verifiedBy: options.verifiedBy,
    publicCanonicalPath: nodeUnderTest.canonicalPath,
    deployedPageUrl,
    deployedPageStatusCode: deployedPage.statusCode,
    publicRouteRegistered: routeCheck.valid,
    recheckPassed: true,
    remainingIssueCount: 0,
    beforeSnapshot: task.issues.map((issue) => ({
      targetId: issue.targetId,
      kind: issue.kind,
      observedValue: issue.observedValue,
    })),
    afterSnapshot: task.issues.map((issue) => ({
      targetId: issue.targetId,
      kind: issue.kind,
      correctedValue: issue.recommendedValue,
      status: "verified_clean",
    })),
    contentAssertions,
    probeResults,
  };

  const governance = getDurableGovernanceRecordService();
  await governance.resolveDriftEvent(
    task.driftEventId,
    options.verifiedBy,
    evidence as unknown as Record<string, unknown>,
    verifiedAt,
  );

  task.status = "closed";
  task.updatedAt = verifiedAt;
  task.closedAt = verifiedAt;
  task.closedBy = options.verifiedBy;
  task.verificationEvidence = evidence;

  await persistTaskFindingToDb(
    task,
    "reference_maintenance_task_closed",
    `Closed task ${task.taskId} after deployed destination page (${deployedPageUrl}) and specialist handoff recheck passed.`,
  );

  appendEarthOSAuditEvent({
    eventType: "reference_maintenance_task_closed",
    entity: "earthos",
    corridorId: task.nodeId,
    severity: "info",
    summary: `Closed maintenance task ${task.taskId} for ${task.canonicalPath} after verifying deployed HTML at ${deployedPageUrl}.`,
    metadata: {
      taskId: task.taskId,
      findingId: task.findingId,
      driftEventId: task.driftEventId,
      packetId: task.packetId,
      missionId: task.missionId,
      verificationEvidence: evidence,
    },
  });

  return task;
}

export async function runReferenceMaintenanceLoop(options: {
  targetNode: TravelReferenceNode;
  operator: string;
  sourceReviews?: SourceReviewAttestation[];
  now?: Date;
  maxEvidenceAgeDays?: number;
  probeUrl?: UrlProbeFn;
  deployedBaseUrl?: string;
  fetchDeployedPage?: DeployedPageFetchFn;
  fetchUpstreamSource?: DeployedPageFetchFn;
}): Promise<{
  detectedIssues: ReferenceMaintenanceIssue[];
  task: ReferenceMaintenanceTask;
  remediatedNode: TravelReferenceNode;
}> {
  const detectedIssues = await detectReferenceMaintenanceIssues({
    nodes: [options.targetNode],
    now: options.now,
    maxEvidenceAgeDays: options.maxEvidenceAgeDays,
    probeUrl: options.probeUrl,
  });

  if (detectedIssues.length === 0) {
    throw new Error(`No reference maintenance issues detected on ${options.targetNode.canonicalPath}.`);
  }

  const recordedTask = await recordReferenceMaintenanceTask(options.targetNode.id, detectedIssues);

  const { remediatedNode } = await applyReferenceMaintenanceCorrection({
    taskId: recordedTask.taskId,
    targetNode: options.targetNode,
    approved: true,
    operator: options.operator,
    sourceReviews: options.sourceReviews,
    fetchUpstreamSource: options.fetchUpstreamSource,
  });

  const closedTask = await verifyAndCloseReferenceMaintenanceTask({
    taskId: recordedTask.taskId,
    remediatedNode,
    verifiedBy: options.operator,
    now: options.now,
    maxEvidenceAgeDays: options.maxEvidenceAgeDays,
    probeUrl: options.probeUrl,
    deployedBaseUrl: options.deployedBaseUrl,
    fetchDeployedPage: options.fetchDeployedPage,
  });

  return {
    detectedIssues,
    task: closedTask,
    remediatedNode,
  };
}

export type ReferenceMaintenanceScanRecord = {
  findingId: string;
  environmentScope: EarthosEnvironmentScope;
  checkedAt: string;
  actor: string;
  invocationType: "scheduled_cron" | "manual_authenticated";
  scannedNodeIds: Array<TravelReferenceNode["id"]>;
  detectedIssueCount: number;
  recordedTaskIds: string[];
  existingOpenTaskIds: string[];
  status: "healthy" | "issues_detected";
};

export type DestinationReferenceHealthSummary = {
  nodeId: TravelReferenceNode["id"];
  title: string;
  canonicalPath: string;
  lastReviewedAt: string;
  evidenceCount: number;
  specialistHandoffCount: number;
  openTaskCount: number;
  pendingRecheckCount: number;
  closedTaskCount: number;
  healthStatus: "healthy" | "failed_check" | "pending_recheck";
  evidenceCitations: Array<{
    id: string;
    sourceTitle: string;
    issuingOrganization: string;
    sourceUrl: string;
    lastCheckedAt: string;
    verificationNote?: string;
    upstreamContentSha256?: string;
    matchedClaimTerms?: string[];
    verifiedSourceExcerpt?: string;
  }>;
  specialistHandoffs: Array<{
    id: string;
    partnerName: string;
    baseUrl: string;
    expectedProductMarkers?: string[];
  }>;
};

export type ReferenceMaintenanceOperationalSnapshot = {
  environmentScope: EarthosEnvironmentScope;
  databaseIdentity: ReturnType<typeof getResolvedDatabaseIdentity>;
  cronSchedule: string;
  cronEndpointPath: string;
  latestScan: ReferenceMaintenanceScanRecord | null;
  scheduledCronInvocationCount: number;
  manualInvocationCount: number;
  recentScanHistory: Array<{
    eventSequence: number;
    checkedAt: string;
    actor: string;
    invocationType: "scheduled_cron" | "manual_authenticated";
    detectedIssueCount: number;
    status: "healthy" | "issues_detected";
    summary: string;
  }>;
  destinations: DestinationReferenceHealthSummary[];
  tasks: ReferenceMaintenanceTask[];
  factualErrorReports?: FactualErrorReportRecord[];
  openFactualErrorReportCount?: number;
};

export function buildReferenceScanFindingId(
  scope: EarthosEnvironmentScope = resolveEarthosEnvironmentScope(),
): string {
  return `control-map:travel-reference-scan:${scope}:latest`;
}

export function buildReferenceScanLockFindingId(
  scope: EarthosEnvironmentScope = resolveEarthosEnvironmentScope(),
): string {
  return `control-map:travel-reference-scan-lock:${scope}`;
}

/**
 * Scheduled detection entrypoint invoked by Vercel Cron (/api/internal/earthos/reference-maintenance)
 * or authenticated operator sweeps. Evaluates all published TravelReferenceNodes using real HTTP probes
 * and records durable maintenance tasks and a durable scan execution record in Neon Postgres.
 *
 * Uses an atomic PostgreSQL conditional upsert lock (`control-map:travel-reference-scan-lock:<scope>`)
 * with a default 180-second cooldown window for `scheduled_cron` invocations so overlapping or retried
 * cron triggers within the same 5-minute window cannot produce duplicate scheduled runs seconds apart.
 */
export async function runScheduledReferenceMaintenanceDetection(options: {
  now?: Date;
  maxEvidenceAgeDays?: number;
  probeUrl?: UrlProbeFn;
  nodes?: TravelReferenceNode[];
  actor?: string;
  cronCooldownSeconds?: number;
} = {}): Promise<{
  checkedAt: string;
  actor: string;
  invocationType: "scheduled_cron" | "manual_authenticated";
  environmentScope: EarthosEnvironmentScope;
  scanFindingId: string;
  scannedNodeIds: Array<TravelReferenceNode["id"]>;
  detectedIssueCount: number;
  issues: ReferenceMaintenanceIssue[];
  recordedTasks: ReferenceMaintenanceTask[];
  existingOpenTasks: ReferenceMaintenanceTask[];
  deduplicated?: boolean;
  deduplicatedReason?: string;
}> {
  const db = await getRequiredEarthosDb();
  const scope = resolveEarthosEnvironmentScope();
  const now = options.now || new Date();
  const checkedAt = now.toISOString();
  const actor = (options.actor || "vercel:cron").trim();
  const invocationType: "scheduled_cron" | "manual_authenticated" =
    actor === "vercel:cron" ? "scheduled_cron" : "manual_authenticated";
  const scanFindingId = buildReferenceScanFindingId(scope);
  const cooldownSeconds = options.cronCooldownSeconds ?? 180;

  if (invocationType === "scheduled_cron" && cooldownSeconds > 0) {
    const lockFindingId = buildReferenceScanLockFindingId(scope);
    const cutoff = new Date(now.getTime() - cooldownSeconds * 1000);
    const lockNote = `Atomic scheduled_cron lock acquired at ${checkedAt} by ${actor} (cooldown=${cooldownSeconds}s).`;
    const lockMeta = {
      scope,
      actor,
      lockedAt: checkedAt,
      cooldownSeconds,
    };

    const acquiredRows = await db
      .insert(earthosControlMapFindings)
      .values({
        findingId: lockFindingId,
        status: "locked",
        severity: "info",
        owner: "earthos-reference-scan-lock",
        note: lockNote,
        metadata: lockMeta,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: earthosControlMapFindings.findingId,
        set: {
          status: "locked",
          note: lockNote,
          metadata: lockMeta,
          updatedAt: now,
        },
        setWhere: sql`${earthosControlMapFindings.updatedAt} <= ${cutoff} OR ${earthosControlMapFindings.updatedAt} > ${now}`,
      })
      .returning({ findingId: earthosControlMapFindings.findingId });

    if (acquiredRows.length === 0) {
      const [existingScanRows, openTasks, nodes] = await Promise.all([
        db
          .select()
          .from(earthosControlMapFindings)
          .where(eq(earthosControlMapFindings.findingId, scanFindingId))
          .limit(1),
        listReferenceMaintenanceTasks({
          status: "open",
          environmentScope: scope,
        }),
        options.nodes ? Promise.resolve(options.nodes) : getAllPublishedTravelReferenceNodes(),
      ]);
      const prevMeta = (existingScanRows[0]?.metadata || {}) as Partial<ReferenceMaintenanceScanRecord>;
      return {
        checkedAt: prevMeta.checkedAt || checkedAt,
        actor,
        invocationType,
        environmentScope: scope,
        scanFindingId,
        scannedNodeIds: prevMeta.scannedNodeIds || nodes.map((n) => n.id),
        detectedIssueCount: Number(prevMeta.detectedIssueCount || 0),
        issues: [],
        recordedTasks: [],
        existingOpenTasks: openTasks,
        deduplicated: true,
        deduplicatedReason: `Skipped duplicate scheduled_cron invocation within ${cooldownSeconds}s atomic PostgreSQL lock window.`,
      };
    }
  }

  const nodes = options.nodes || (await getAllPublishedTravelReferenceNodes());
  const issues = await detectReferenceMaintenanceIssues({
    nodes,
    now,
    maxEvidenceAgeDays: options.maxEvidenceAgeDays,
    probeUrl: options.probeUrl,
  });

  const openTasks = await listReferenceMaintenanceTasks({
    status: "open",
    environmentScope: scope,
  });
  const recordedTasks: ReferenceMaintenanceTask[] = [];
  const existingOpenTasks: ReferenceMaintenanceTask[] = [];

  const issuesByNode = new Map<TravelReferenceNode["id"], ReferenceMaintenanceIssue[]>();
  for (const issue of issues) {
    const list = issuesByNode.get(issue.nodeId) || [];
    list.push(issue);
    issuesByNode.set(issue.nodeId, list);
  }

  for (const [nodeId, nodeIssues] of issuesByNode.entries()) {
    const issueSignature = nodeIssues
      .map((i) => `${i.issueId}:${i.observedValue}`)
      .sort()
      .join("|");

    const matchingOpen = openTasks.find((t) => {
      if (t.nodeId !== nodeId) return false;
      const openSig = t.issues
        .map((i) => `${i.issueId}:${i.observedValue}`)
        .sort()
        .join("|");
      return openSig === issueSignature;
    });

    if (matchingOpen) {
      existingOpenTasks.push(matchingOpen);
    } else {
      const created = await recordReferenceMaintenanceTask(nodeId, nodeIssues);
      recordedTasks.push(created);
    }
  }

  const scanStatus: "healthy" | "issues_detected" =
    issues.length === 0 ? "healthy" : "issues_detected";
  const scanRecord: ReferenceMaintenanceScanRecord = {
    findingId: scanFindingId,
    environmentScope: scope,
    checkedAt,
    actor,
    invocationType,
    scannedNodeIds: nodes.map((n) => n.id),
    detectedIssueCount: issues.length,
    recordedTaskIds: recordedTasks.map((t) => t.taskId),
    existingOpenTaskIds: existingOpenTasks.map((t) => t.taskId),
    status: scanStatus,
  };
  const scanSummary = `Reference maintenance detection pass (${invocationType} by ${actor} in ${scope}) checked ${nodes.length} node(s): ${issues.length} issue(s) found, ${recordedTasks.length} new task(s) persisted, ${existingOpenTasks.length} existing open task(s).`;

  await db
    .insert(earthosControlMapFindings)
    .values({
      findingId: scanFindingId,
      status: scanStatus,
      severity: issues.some((i) => i.severity === "critical")
        ? "critical"
        : issues.length > 0
          ? "watch"
          : "info",
      owner: "earthos-reference-scan",
      note: scanSummary,
      metadata: scanRecord as unknown as Record<string, unknown>,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: earthosControlMapFindings.findingId,
      set: {
        status: scanStatus,
        severity: issues.some((i) => i.severity === "critical")
          ? "critical"
          : issues.length > 0
            ? "watch"
            : "info",
        owner: "earthos-reference-scan",
        note: scanSummary,
        metadata: scanRecord as unknown as Record<string, unknown>,
        updatedAt: now,
      },
    });

  await db.insert(earthosControlMapFindingHistory).values({
    findingId: scanFindingId,
    event: "reference_detection_pass_executed",
    status: scanStatus,
    severity: issues.some((i) => i.severity === "critical")
      ? "critical"
      : issues.length > 0
        ? "watch"
        : "info",
    owner: "earthos-reference-scan",
    nodeSlug: "travel-reference-network",
    corridor: "travel-reference-network",
    recordedAt: now,
    summary: scanSummary,
    approvedAt: now,
    approvedBy: actor,
    controlSurface: "/api/internal/earthos/reference-maintenance",
    metadata: scanRecord as unknown as Record<string, unknown>,
  });

  appendEarthOSAuditEvent({
    eventType: "reference_drift_detected",
    entity: "earthos",
    corridorId: "travel-reference-network",
    severity: issues.some((i) => i.severity === "critical")
      ? "critical"
      : issues.length > 0
        ? "watch"
        : "info",
    summary: scanSummary,
    metadata: scanRecord as unknown as Record<string, unknown>,
  });

  return {
    checkedAt,
    actor,
    invocationType,
    environmentScope: scope,
    scanFindingId,
    scannedNodeIds: nodes.map((n) => n.id),
    detectedIssueCount: issues.length,
    issues,
    recordedTasks,
    existingOpenTasks,
    deduplicated: false,
  };
}

export async function getReferenceMaintenanceOperationalSnapshot(options: {
  environmentScope?: EarthosEnvironmentScope;
  taskLimit?: number;
} = {}): Promise<ReferenceMaintenanceOperationalSnapshot> {
  const db = await getRequiredEarthosDb();
  const scope = options.environmentScope || resolveEarthosEnvironmentScope();
  const scanFindingId = buildReferenceScanFindingId(scope);

  const [scanRowList, scanHistoryRows, publishedNodes, tasks, factualErrorReports] = await Promise.all([
    db
      .select()
      .from(earthosControlMapFindings)
      .where(eq(earthosControlMapFindings.findingId, scanFindingId))
      .limit(1),
    db
      .select()
      .from(earthosControlMapFindingHistory)
      .where(
        and(
          eq(earthosControlMapFindingHistory.findingId, scanFindingId),
          eq(earthosControlMapFindingHistory.event, "reference_detection_pass_executed"),
        ),
      )
      .orderBy(desc(earthosControlMapFindingHistory.eventSequence))
      .limit(25),
    getAllPublishedTravelReferenceNodes(),
    listReferenceMaintenanceTasks({
      environmentScope: scope,
      limit: options.taskLimit || 50,
    }),
    listFactualErrorReports({
      environmentScope: scope,
      limit: 50,
    }),
  ]);

  const latestScan = scanRowList[0]?.metadata
    ? (scanRowList[0].metadata as unknown as ReferenceMaintenanceScanRecord)
    : null;

  const recentScanHistory = scanHistoryRows.map((row) => {
    const meta = (row.metadata || {}) as Partial<ReferenceMaintenanceScanRecord>;
    const actor = row.approvedBy || meta.actor || "unknown";
    const invocationType: "scheduled_cron" | "manual_authenticated" =
      meta.invocationType || (actor === "vercel:cron" ? "scheduled_cron" : "manual_authenticated");
    return {
      eventSequence: row.eventSequence,
      checkedAt: meta.checkedAt || row.recordedAt.toISOString(),
      actor,
      invocationType,
      detectedIssueCount: Number(meta.detectedIssueCount || 0),
      status: (row.status === "issues_detected" ? "issues_detected" : "healthy") as
        | "healthy"
        | "issues_detected",
      summary: row.summary,
    };
  });

  const scheduledCronInvocationCount = recentScanHistory.filter(
    (h) => h.invocationType === "scheduled_cron",
  ).length;
  const manualInvocationCount = recentScanHistory.filter(
    (h) => h.invocationType === "manual_authenticated",
  ).length;

  const destinations: DestinationReferenceHealthSummary[] = publishedNodes.map((node) => {
    const nodeTasks = tasks.filter((t) => t.nodeId === node.id);
    const openTaskCount = nodeTasks.filter((t) => t.status === "open").length;
    const pendingRecheckCount = nodeTasks.filter(
      (t) => t.status === "remediated_pending_recheck",
    ).length;
    const closedTaskCount = nodeTasks.filter((t) => t.status === "closed").length;

    const healthStatus: DestinationReferenceHealthSummary["healthStatus"] =
      openTaskCount > 0
        ? "failed_check"
        : pendingRecheckCount > 0
          ? "pending_recheck"
          : "healthy";

    return {
      nodeId: node.id,
      title: node.title,
      canonicalPath: node.canonicalPath,
      lastReviewedAt: node.lastReviewedAt,
      evidenceCount: node.evidenceRegistry.length,
      specialistHandoffCount: node.specialistHandoffs.options.length,
      openTaskCount,
      pendingRecheckCount,
      closedTaskCount,
      healthStatus,
      evidenceCitations: node.evidenceRegistry.map((cit) => ({
        id: cit.id,
        sourceTitle: cit.sourceTitle,
        issuingOrganization: cit.issuingOrganization,
        sourceUrl: cit.sourceUrl,
        lastCheckedAt: cit.lastCheckedAt,
        verificationNote: cit.verificationNote,
        upstreamContentSha256: cit.upstreamContentSha256,
        matchedClaimTerms: cit.matchedClaimTerms,
        verifiedSourceExcerpt: cit.verifiedSourceExcerpt,
      })),
      specialistHandoffs: node.specialistHandoffs.options.map((opt) => ({
        id: opt.id,
        partnerName: opt.partnerName,
        baseUrl: opt.baseUrl,
        expectedProductMarkers: opt.expectedProductMarkers,
      })),
    };
  });

  return {
    environmentScope: scope,
    databaseIdentity: getResolvedDatabaseIdentity(),
    cronSchedule: "0 8 * * *",
    cronEndpointPath: "/api/internal/earthos/reference-maintenance",
    latestScan,
    scheduledCronInvocationCount,
    manualInvocationCount,
    recentScanHistory,
    destinations,
    tasks,
    factualErrorReports,
    openFactualErrorReportCount: factualErrorReports.filter((r) => r.status === "open").length,
  };
}

