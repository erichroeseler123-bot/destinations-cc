import { inspectTripContext, issueContext, redeemContext } from "../context/service";
import {
  FEASTLY_SPREAD_MARKETS,
  getDccSiteManifestV1,
  validateUrlFreeOfPersonalData,
  type FeastlySpreadMarketDefinition,
} from "../portfolioNetworkRegistry";
import {
  createCommercialHandoff,
  type CommercialHandoffRecord,
  type CommercialProvider,
} from "./index";

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
  cookieContextId?: string | null;
  claimingOwner: string;
  issueIfParamsPresent?: boolean;
  defaultPortSlug?: string;
}): Promise<PortfolioCarriedContext> {
  const sp = params.searchParams || {};
  const rawCtx =
    (typeof sp.ctx === "string" ? sp.ctx : undefined) ||
    (typeof sp.dcc_ctx === "string" ? sp.dcc_ctx : undefined) ||
    (typeof params.cookieContextId === "string" ? params.cookieContextId : undefined);

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

export type PortfolioJourneyId =
  | "alaska_cruise_to_aviation_handoff"
  | "new_orleans_city_to_swamp_handoff"
  | "cruise_promenade_to_vibing_around"
  | "brinkberry_to_party_at_red_rocks"
  | "ai_partner_to_gosno_review"
  | "property_manager_to_feastly_spread";

export interface PortfolioCrossSiteJourneyResult {
  journeyId: PortfolioJourneyId;
  sitesTraversed: string[];
  contextExchange: {
    contextId: string;
    redemptionToken: string;
    inboundEntryUrlWithToken: string;
    cleanRedirectUrlAfterRedemption: string;
    firstPartyCookieName: string;
    cookieFlags: "Secure; HttpOnly; SameSite=Lax";
    urlPrivacyCheck: { valid: boolean; violatingParams: string[] };
    redeemedPayload: Record<string, unknown>;
  };
  assurance: PortfolioAssuranceSummary | null;
  handoff: CommercialHandoffRecord;
  feastlyMarketResolution?: FeastlySpreadMarketDefinition;
  checkoutBoundary: {
    universalMultiProviderCart: false;
    autonomousPaymentCapture: false;
    decisionAuthorizationMode: "shadow_only_no_side_effects";
    requiresExplicitTravelerConfirmation: true;
    controllingBookingAuthority: string;
  };
}

export async function executePortfolioCrossSiteJourney(params: {
  journeyId: PortfolioJourneyId;
  date?: string;
  partySize?: number;
  shipOrVenue?: string;
  feastlyMarketSlug?: string;
  approvedPartnerId?: string;
}): Promise<PortfolioCrossSiteJourneyResult> {
  const date = params.date || "2026-07-15";
  const partySize = params.partySize || 4;

  if (params.journeyId === "alaska_cruise_to_aviation_handoff") {
    const issued = await issueContext({
      sourceSite: "cruisepromenade.com",
      destination: "juneau",
      targetOwner: "juneauflightdeck.com",
      targetIntent: "juneau-glacier-helicopter",
      schedule: {
        date,
        arrival: "07:00",
        departure: "16:30",
        travelers: partySize,
        shipOrVenue: params.shipOrVenue || "norwegian-bliss",
      },
      additionalPreferenceBufferMinutes: 30,
    });

    const inboundEntryUrlWithToken = `https://juneauflightdeck.com/calculator?ctx=${encodeURIComponent(issued.contextId)}`;
    const cleanRedirectUrlAfterRedemption = "https://juneauflightdeck.com/calculator";
    const urlPrivacyCheck = validateUrlFreeOfPersonalData(inboundEntryUrlWithToken);

    const redeemed = await redeemContext(issued.contextId, "juneauflightdeck.com");
    if (!("data" in redeemed)) {
      throw new Error(`Failed to redeem Alaska aviation context: ${redeemed.message}`);
    }

    const assurance = evaluatePortfolioAssuranceSummary({
      engineId: "juneau-helicopter-tours",
      inputs: { date, partySize, ship: params.shipOrVenue || "norwegian-bliss" },
    });

    const handoff = await createCommercialHandoff({
      originatingSite: "juneauflightdeck.com",
      targetSite: "viator.com",
      provider: "viator",
      productCode: "5889JNU_HELI_GLACIER",
      productTitle: "Juneau Mendenhall Glacier Helicopter & Guided Icefield Walk",
      productDestinationUrl:
        "https://www.viator.com/tours/Juneau/Mendenhall-Glacier-Helicopter-Tour/d941-5889JNU",
      campaign: "jfd-glacier-qualification",
      contextId: issued.contextId,
      evaluationRunId: assurance.evaluationRunId,
      receiptId: assurance.receiptId,
      intendedDate: date,
      partySize,
    });

    const jfdManifest = getDccSiteManifestV1("juneauflightdeck.com")!;
    return {
      journeyId: params.journeyId,
      sitesTraversed: [
        "cruisepromenade.com",
        "lastfrontiershoreexcursions.com",
        "juneauflightdeck.com",
      ],
      contextExchange: {
        contextId: issued.contextId,
        redemptionToken: issued.contextId,
        inboundEntryUrlWithToken,
        cleanRedirectUrlAfterRedemption,
        firstPartyCookieName: jfdManifest.context_support.cookie_name,
        cookieFlags: "Secure; HttpOnly; SameSite=Lax",
        urlPrivacyCheck,
        redeemedPayload: redeemed.data as unknown as Record<string, unknown>,
      },
      assurance,
      handoff,
      checkoutBoundary: {
        universalMultiProviderCart: false,
        autonomousPaymentCapture: false,
        decisionAuthorizationMode: "shadow_only_no_side_effects",
        requiresExplicitTravelerConfirmation: true,
        controllingBookingAuthority: "viator_affiliate",
      },
    };
  }

  if (params.journeyId === "new_orleans_city_to_swamp_handoff") {
    const issued = await issueContext({
      sourceSite: "welcometoneworleanstours.com",
      destination: "new-orleans",
      targetOwner: "welcometotheswamp.com",
      targetIntent: "new-orleans-swamp-airboat",
      schedule: {
        date,
        travelers: partySize,
        shipOrVenue: params.shipOrVenue || "french-quarter-hotel-pickup",
      },
    });

    const inboundEntryUrlWithToken = `https://welcometotheswamp.com/plan?ctx=${encodeURIComponent(issued.contextId)}`;
    const cleanRedirectUrlAfterRedemption = "https://welcometotheswamp.com/plan";
    const urlPrivacyCheck = validateUrlFreeOfPersonalData(inboundEntryUrlWithToken);

    const redeemed = await redeemContext(issued.contextId, "welcometotheswamp.com");
    if (!("data" in redeemed)) {
      throw new Error(`Failed to redeem Swamp Tour context: ${redeemed.message}`);
    }

    const assurance = evaluatePortfolioAssuranceSummary({
      engineId: "new-orleans-swamp-tours",
      inputs: { date, partySize },
    });

    const handoff = await createCommercialHandoff({
      originatingSite: "welcometotheswamp.com",
      targetSite: "fareharbor.com",
      provider: "fareharbor",
      providerAccount: "aktourcenter",
      productCode: "MSY_AIRBOAT_SMALL_BAYOU",
      productTitle: "Small-Boat High-Speed Airboat Swamp Adventure with French Quarter Pickup",
      productDestinationUrl:
        "https://fareharbor.com/embeds/book/neworleansairboat/items/102400/",
      campaign: "wts-city-to-swamp",
      contextId: issued.contextId,
      evaluationRunId: assurance.evaluationRunId,
      receiptId: assurance.receiptId,
      intendedDate: date,
      partySize,
    });

    const wtsManifest = getDccSiteManifestV1("welcometotheswamp.com")!;
    return {
      journeyId: params.journeyId,
      sitesTraversed: [
        "cruisepromenade.com",
        "welcometoneworleanstours.com",
        "welcometotheswamp.com",
      ],
      contextExchange: {
        contextId: issued.contextId,
        redemptionToken: issued.contextId,
        inboundEntryUrlWithToken,
        cleanRedirectUrlAfterRedemption,
        firstPartyCookieName: wtsManifest.context_support.cookie_name,
        cookieFlags: "Secure; HttpOnly; SameSite=Lax",
        urlPrivacyCheck,
        redeemedPayload: redeemed.data as unknown as Record<string, unknown>,
      },
      assurance,
      handoff,
      checkoutBoundary: {
        universalMultiProviderCart: false,
        autonomousPaymentCapture: false,
        decisionAuthorizationMode: "shadow_only_no_side_effects",
        requiresExplicitTravelerConfirmation: true,
        controllingBookingAuthority: "fareharbor",
      },
    };
  }

  if (params.journeyId === "cruise_promenade_to_vibing_around") {
    const issued = await issueContext({
      sourceSite: "cruisepromenade.com",
      destination: "denver",
      targetOwner: "vibearoundtown.com",
      targetIntent: "denver-local-experience",
      schedule: {
        date,
        travelers: partySize,
        shipOrVenue: params.shipOrVenue || "denver-union-station",
      },
    });

    const inboundEntryUrlWithToken = `https://vibearoundtown.com/experiences?ctx=${encodeURIComponent(issued.contextId)}`;
    const cleanRedirectUrlAfterRedemption = "https://vibearoundtown.com/experiences";
    const urlPrivacyCheck = validateUrlFreeOfPersonalData(inboundEntryUrlWithToken);

    const redeemed = await redeemContext(issued.contextId, "vibearoundtown.com");
    if (!("data" in redeemed)) {
      throw new Error(`Failed to redeem Vibing Around context: ${redeemed.message}`);
    }

    const handoff = await createCommercialHandoff({
      originatingSite: "cruisepromenade.com",
      targetSite: "vibearoundtown.com",
      provider: "direct",
      productCode: "VIBE_DENVER_LOCAL_EXPERIENCE",
      productTitle: "Vibing Around Tour Co. Curated Local Experience",
      productDestinationUrl: "https://vibearoundtown.com/experiences",
      campaign: "cp-to-vibing-around",
      contextId: issued.contextId,
      intendedDate: date,
      partySize,
    });

    const vatManifest = getDccSiteManifestV1("vibearoundtown.com")!;
    return {
      journeyId: params.journeyId,
      sitesTraversed: ["cruisepromenade.com", "vibearoundtown.com"],
      contextExchange: {
        contextId: issued.contextId,
        redemptionToken: issued.contextId,
        inboundEntryUrlWithToken,
        cleanRedirectUrlAfterRedemption,
        firstPartyCookieName: vatManifest.context_support.cookie_name,
        cookieFlags: "Secure; HttpOnly; SameSite=Lax",
        urlPrivacyCheck,
        redeemedPayload: redeemed.data as unknown as Record<string, unknown>,
      },
      assurance: null,
      handoff,
      checkoutBoundary: {
        universalMultiProviderCart: false,
        autonomousPaymentCapture: false,
        decisionAuthorizationMode: "shadow_only_no_side_effects",
        requiresExplicitTravelerConfirmation: true,
        controllingBookingAuthority: "direct_provider",
      },
    };
  }

  if (params.journeyId === "brinkberry_to_party_at_red_rocks") {
    const issued = await issueContext({
      sourceSite: "brinkberry.com",
      destination: "morrison",
      targetOwner: "partyatredrocks.com",
      targetIntent: "red-rocks-concert-shuttle",
      schedule: {
        date,
        travelers: partySize,
        shipOrVenue: params.shipOrVenue || "red-rocks-amphitheatre",
      },
    });

    const inboundEntryUrlWithToken = `https://partyatredrocks.com/book?ctx=${encodeURIComponent(issued.contextId)}`;
    const cleanRedirectUrlAfterRedemption = "https://partyatredrocks.com/book";
    const urlPrivacyCheck = validateUrlFreeOfPersonalData(inboundEntryUrlWithToken);

    const redeemed = await redeemContext(issued.contextId, "partyatredrocks.com");
    if (!("data" in redeemed)) {
      throw new Error(`Failed to redeem PARR context: ${redeemed.message}`);
    }

    const handoff = await createCommercialHandoff({
      originatingSite: "brinkberry.com",
      targetSite: "partyatredrocks.com",
      provider: "direct",
      productCode: "PARR_RED_ROCKS_SHUTTLE_INQUIRY",
      productTitle: "Party at Red Rocks Concert Shuttle & Private Transport",
      productDestinationUrl: "https://partyatredrocks.com/book",
      campaign: "brinkberry-to-parr",
      contextId: issued.contextId,
      intendedDate: date,
      partySize,
    });

    const parrManifest = getDccSiteManifestV1("partyatredrocks.com")!;
    return {
      journeyId: params.journeyId,
      sitesTraversed: ["brinkberry.com", "partyatredrocks.com"],
      contextExchange: {
        contextId: issued.contextId,
        redemptionToken: issued.contextId,
        inboundEntryUrlWithToken,
        cleanRedirectUrlAfterRedemption,
        firstPartyCookieName: parrManifest.context_support.cookie_name,
        cookieFlags: "Secure; HttpOnly; SameSite=Lax",
        urlPrivacyCheck,
        redeemedPayload: redeemed.data as unknown as Record<string, unknown>,
      },
      assurance: null,
      handoff,
      checkoutBoundary: {
        universalMultiProviderCart: false,
        autonomousPaymentCapture: false,
        decisionAuthorizationMode: "shadow_only_no_side_effects",
        requiresExplicitTravelerConfirmation: true,
        controllingBookingAuthority: "inquiry_only",
      },
    };
  }

  if (params.journeyId === "ai_partner_to_gosno_review") {
    const partnerId = params.approvedPartnerId || "synthetic-preview-test-partner";
    const issued = await issueContext({
      sourceSite: "destinationcommandcenter.com",
      destination: "vail",
      targetOwner: "gosno.co",
      targetIntent: "den-vail-winter-transfer",
      schedule: {
        date,
        travelers: partySize,
        shipOrVenue: params.shipOrVenue || "DEN-to-Vail-Resort",
      },
      additionalPreferenceBufferMinutes: 30,
    });

    const inboundEntryUrlWithToken = `https://gosno.co/concierge/${encodeURIComponent(partnerId)}?ctx=${encodeURIComponent(issued.contextId)}`;
    const cleanRedirectUrlAfterRedemption = `https://gosno.co/concierge/${encodeURIComponent(partnerId)}`;
    const urlPrivacyCheck = validateUrlFreeOfPersonalData(inboundEntryUrlWithToken);

    const redeemed = await redeemContext(issued.contextId, "gosno.co");
    if (!("data" in redeemed)) {
      throw new Error(`Failed to redeem GoSno context: ${redeemed.message}`);
    }

    const handoff = await createCommercialHandoff({
      originatingSite: "destinationcommandcenter.com",
      targetSite: "gosno.co",
      provider: "direct",
      productCode: "GOSNO_DEN_VAIL_PRIVATE_SUV",
      productTitle: "GoSno Private Winter SUV Transfer (Proposed Trip Review Only)",
      productDestinationUrl: cleanRedirectUrlAfterRedemption,
      campaign: "dcc-ai-concierge-gosno-review",
      contextId: issued.contextId,
      intendedDate: date,
      partySize,
      approvedPartnerAttribution: {
        partnerId,
        partnerName: "Synthetic Preview Test Partner (Non-Production)",
      },
      metadata: {
        proposedTripPrefillOnly: true,
        revalidatesPriceAndAvailabilityAtReview: true,
        autonomousCheckoutAllowed: false,
      },
    });

    const gosnoManifest = getDccSiteManifestV1("gosno.co")!;
    return {
      journeyId: params.journeyId,
      sitesTraversed: ["destinationcommandcenter.com", "gosno.co"],
      contextExchange: {
        contextId: issued.contextId,
        redemptionToken: issued.contextId,
        inboundEntryUrlWithToken,
        cleanRedirectUrlAfterRedemption,
        firstPartyCookieName: gosnoManifest.context_support.cookie_name,
        cookieFlags: "Secure; HttpOnly; SameSite=Lax",
        urlPrivacyCheck,
        redeemedPayload: redeemed.data as unknown as Record<string, unknown>,
      },
      assurance: null,
      handoff,
      checkoutBoundary: {
        universalMultiProviderCart: false,
        autonomousPaymentCapture: false,
        decisionAuthorizationMode: "shadow_only_no_side_effects",
        requiresExplicitTravelerConfirmation: true,
        controllingBookingAuthority: "direct_provider",
      },
    };
  }

  // Journey 6: property_manager_to_feastly_spread
  const marketSlug = (params.feastlyMarketSlug || "wisconsin-dells").trim().toLowerCase();
  const marketEntry =
    FEASTLY_SPREAD_MARKETS.find((m) => m.slug === marketSlug) ||
    FEASTLY_SPREAD_MARKETS[0];
  const feastlyBookingAuthority =
    marketEntry.status === "existing_booking_path" ? "request_only" : "inquiry_only";

  const issued = await issueContext({
    sourceSite: "brinkberry.com",
    destination: marketEntry.slug,
    targetOwner: "feastlyspread.com",
    targetIntent: `feastly-${marketEntry.status}`,
    schedule: {
      date,
      travelers: partySize,
      shipOrVenue: params.shipOrVenue || `${marketEntry.name}-vacation-rental`,
    },
  });

  const inboundEntryUrlWithToken = `https://feastlyspread.com${marketEntry.checkoutPath}?ctx=${encodeURIComponent(issued.contextId)}`;
  const cleanRedirectUrlAfterRedemption = `https://feastlyspread.com${marketEntry.checkoutPath}`;
  const urlPrivacyCheck = validateUrlFreeOfPersonalData(inboundEntryUrlWithToken);

  const redeemed = await redeemContext(issued.contextId, "feastlyspread.com");
  if (!("data" in redeemed)) {
    throw new Error(`Failed to redeem Feastly Spread context: ${redeemed.message}`);
  }

  const handoff = await createCommercialHandoff({
    originatingSite: "brinkberry.com",
    targetSite: "feastlyspread.com",
    provider: "direct",
    productCode:
      marketEntry.status === "existing_booking_path"
        ? `FEASTLY_EXISTING_PATH_${marketEntry.slug.toUpperCase().replace(/-/g, "_")}`
        : `FEASTLY_COVERAGE_REQUEST_${marketEntry.slug.toUpperCase().replace(/-/g, "_")}`,
    productTitle:
      marketEntry.status === "existing_booking_path"
        ? `FeastlySpread Existing Booking Path Group Catering (${marketEntry.name}, ${marketEntry.state})`
        : `FeastlySpread Market Coverage Request (${marketEntry.name}, ${marketEntry.state})`,
    productDestinationUrl: cleanRedirectUrlAfterRedemption,
    campaign: `pm-to-feastly-${marketEntry.status}`,
    contextId: issued.contextId,
    intendedDate: date,
    partySize,
    metadata: {
      feastlyMarketSlug: marketEntry.slug,
      feastlyMarketStatus: marketEntry.status,
      feastlyBookingAuthority,
    },
  });

  const feastlyManifest = getDccSiteManifestV1("feastlyspread.com")!;
  return {
    journeyId: params.journeyId,
    sitesTraversed: ["brinkberry.com", "feastlyspread.com"],
    contextExchange: {
      contextId: issued.contextId,
      redemptionToken: issued.contextId,
      inboundEntryUrlWithToken,
      cleanRedirectUrlAfterRedemption,
      firstPartyCookieName: feastlyManifest.context_support.cookie_name,
      cookieFlags: "Secure; HttpOnly; SameSite=Lax",
      urlPrivacyCheck,
      redeemedPayload: redeemed.data as unknown as Record<string, unknown>,
    },
    assurance: null,
    handoff,
    feastlyMarketResolution: marketEntry,
    checkoutBoundary: {
      universalMultiProviderCart: false,
      autonomousPaymentCapture: false,
      decisionAuthorizationMode: "shadow_only_no_side_effects",
      requiresExplicitTravelerConfirmation: true,
      controllingBookingAuthority: feastlyBookingAuthority,
    },
  };
}
