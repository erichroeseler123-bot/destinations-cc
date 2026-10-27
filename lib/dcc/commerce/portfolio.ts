import { inspectTripContext, issueContext } from "../context/service";
import type { CommercialProvider } from "./index";

export interface PortfolioAssuranceSummary {
  engineId: string;
  engineVersion: string;
  evaluationRunId: string;
  receiptId: string;
  receiptVerifyUrl: string;
  resultHash: string;
  cacheStatus: "computed" | "reused";
  decisionOutcome: string;
  primaryClassification: "eligible" | "qualified" | "ineligible" | "indeterminate";
  candidates: Array<{
    candidateId: string;
    label: string;
    classification: "eligible" | "qualified" | "ineligible" | "indeterminate";
    unresolvedRequirements: string[];
  }>;
  unresolvedRequirements: string[];
  availabilityClaimPolicy: string;
}

export interface PortfolioCarriedContext {
  contextId: string | null;
  sourceSite: string | null;
  tripContextState: string | null;
  redemptionTokenState: string | null;
  payload: {
    date?: string;
    partySize?: number;
    shipSlug?: string;
    portSlug?: string;
  };
}

const DEFAULT_DCC_ORIGIN = "https://www.destinationcommandcenter.com";

export function evaluatePortfolioAssuranceSummary(params: {
  engineId:
    | "new-orleans-city-tours"
    | "new-orleans-swamp-tours"
    | "alaska-shore-excursions"
    | "juneau-helicopter-tours";
  inputs?: Record<string, unknown>;
  callerClientId?: string;
}): PortfolioAssuranceSummary {
  const defaultUnresolvedByEngine: Record<string, string[]> = {
    "new-orleans-city-tours": [
      "Live operator departure times, walking pace suitability, and exact meeting point rules remain confirmed at FareHarbor or Viator checkout.",
    ],
    "new-orleans-swamp-tours": [
      "Live airboat vs covered-boat seat availability, minimum child age (5+ for small airboats), and hotel pickup cutoffs remain confirmed at checkout.",
    ],
    "alaska-shore-excursions": [
      "45-minute all-aboard margin + pier shuttle transfer buffer required; live operator seat inventory and ship berth assignments remain confirmed at checkout.",
    ],
    "juneau-helicopter-tours": [
      "FAA PAJN ceiling/visibility weather dispatch (evaluated within 1 hour of flight), 4-passenger minimum flight load, and live seat inventory remain confirmed at checkout.",
    ],
  };

  return {
    engineId: params.engineId,
    engineVersion: "0.3.0",
    evaluationRunId: `evalrun:portfolio:${params.engineId}`,
    receiptId: `rcpt:sha256:portfolio_${params.engineId}`,
    receiptVerifyUrl: `${DEFAULT_DCC_ORIGIN}/api/v1/v03/engines/${params.engineId}/0.3.0`,
    resultHash: `sha256:portfolio:${params.engineId}`,
    cacheStatus: "reused",
    decisionOutcome: "qualified_recommendation",
    primaryClassification: "qualified",
    candidates: [],
    unresolvedRequirements: defaultUnresolvedByEngine[params.engineId] || [
      "Live operator departure inventory and seat confirmation remain verified at checkout.",
    ],
    availabilityClaimPolicy:
      "Evidence-bounded classification only; live date availability and prefilled provider selections are only claimed when verified by the provider integration.",
  };
}

export async function resolvePortfolioTripContext(params: {
  searchParams?: Record<string, string | string[] | undefined>;
  claimingOwner: string;
  issueIfParamsPresent?: boolean;
  defaultPortSlug?: string;
}): Promise<PortfolioCarriedContext> {
  const sp = params.searchParams || {};
  const rawCtx =
    (typeof sp.ctx === "string" ? sp.ctx : undefined) ||
    (typeof sp.dcc_ctx === "string" ? sp.dcc_ctx : undefined);

  if (rawCtx && rawCtx.startsWith("dcc_ctx_")) {
    const inspected = await inspectTripContext(rawCtx);
    if (inspected.success) {
      return {
        contextId: inspected.contextId,
        sourceSite: inspected.sourceSite,
        tripContextState: inspected.tripContextState,
        redemptionTokenState: inspected.redemptionTokenState,
        payload: {
          date: inspected.schedule.date,
          partySize: inspected.schedule.travelers,
          shipSlug: inspected.schedule.shipOrVenue || undefined,
          portSlug: inspected.destination,
        },
      };
    }
  }

  const date = typeof sp.date === "string" ? sp.date : undefined;
  const partyRaw =
    (typeof sp.partySize === "string" ? sp.partySize : undefined) ||
    (typeof sp.guests === "string" ? sp.guests : undefined) ||
    (typeof sp.pax === "string" ? sp.pax : undefined);
  const partySize = partyRaw && Number.isFinite(Number(partyRaw)) ? Number(partyRaw) : undefined;
  const shipSlug = typeof sp.ship === "string" ? sp.ship : undefined;
  const portSlug =
    (typeof sp.port === "string" ? sp.port : undefined) || params.defaultPortSlug || "juneau";

  const payload = {
    ...(date ? { date } : {}),
    ...(partySize ? { partySize } : {}),
    ...(shipSlug ? { shipSlug } : {}),
    ...(portSlug ? { portSlug } : {}),
  };

  if (params.issueIfParamsPresent && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    try {
      const issued = await issueContext({
        sourceSite: params.claimingOwner,
        destination: portSlug === "new-orleans" ? "new-orleans" : "juneau",
        targetOwner: params.claimingOwner,
        schedule: {
          date,
          travelers: partySize && partySize >= 1 ? partySize : 2,
          shipOrVenue: shipSlug || undefined,
        },
      });
      if (issued.success) {
        return {
          contextId: issued.contextId,
          sourceSite: params.claimingOwner,
          tripContextState: "active",
          redemptionTokenState: "issued",
          payload,
        };
      }
    } catch {
      // Non-fatal fallback
    }
  }

  return {
    contextId: rawCtx && rawCtx.startsWith("dcc_ctx_") ? rawCtx : null,
    sourceSite: null,
    tripContextState: null,
    redemptionTokenState: null,
    payload,
  };
}

export function buildPortfolioHandoffUrl(params: {
  originatingSite: string;
  provider: CommercialProvider | "direct_operator";
  providerAccount?: string;
  productCode?: string;
  destinationUrl: string;
  campaign?: string;
  contextId?: string | null;
  evaluationRunId?: string | null;
  receiptId?: string | null;
  intendedDate?: string | null;
  optionCode?: string | null;
  partySize?: number | null;
  useRelativePath?: boolean;
}): string {
  const base = params.useRelativePath
    ? "/go/commerce/handoff"
    : `${DEFAULT_DCC_ORIGIN}/go/commerce/handoff`;
  const qs = new URLSearchParams();
  qs.set("site", params.originatingSite);
  qs.set("provider", params.provider === "direct_operator" ? "direct" : params.provider);
  if (params.providerAccount) qs.set("account", params.providerAccount);
  if (params.productCode) qs.set("product", params.productCode);
  qs.set("url", params.destinationUrl);
  if (params.campaign) qs.set("campaign", params.campaign);
  if (params.contextId) qs.set("ctx", params.contextId);
  if (params.evaluationRunId) qs.set("evaluationRunId", params.evaluationRunId);
  if (params.receiptId) qs.set("receiptId", params.receiptId);
  if (params.intendedDate) qs.set("date", params.intendedDate);
  if (params.optionCode) qs.set("option", params.optionCode);
  if (params.partySize && params.partySize > 0) qs.set("partySize", String(params.partySize));

  return `${base}?${qs.toString()}`;
}
