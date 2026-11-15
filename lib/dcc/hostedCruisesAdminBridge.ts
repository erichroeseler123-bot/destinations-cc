export interface HostedCruisesAdminBridgeSnapshot {
  generatedAt: string;
  environment: string;
  health: {
    cpStorageReady: boolean;
    dccServiceSecretConfigured: boolean;
    rollCallBridgeSecretConfigured: boolean;
    rollCallOps: {
      reachable: boolean;
      allAutomatedChecksGreen: boolean;
      databaseReady: boolean;
      bridgeSigningConfigured: boolean;
      emailProviderEnabled: boolean;
      resendApiKeyConfigured: boolean;
      emailFromConfigured: boolean;
      emailFromDomain: string | null;
      liveEmailDeliveryReady: boolean;
      resendConnectivityOk?: boolean;
      error?: string;
    };
  };
  organizers: Array<{
    organizerSlug: string;
    organizerName: string;
    officialDomain: string;
    reservationPortalDomain?: string;
    publicSummary: string;
    officialWebsiteUrl: string;
    claimedStatus: "unclaimed" | "pending_verification" | "verified";
    hasWorkspaceKey?: boolean;
    workspacePath?: string;
    suspended?: boolean;
    suspendedReason?: string;
    analytics?: {
      pageViews: number;
      officialBookingClicks: number;
      questionsAsked: number;
      officialAnswersPosted: number;
      communityJoins: number;
      reviewsSubmitted: number;
      officialReviewResponses: number;
    };
  }>;
  sailings: Array<{
    organizerSlug: string;
    organizerName: string;
    sailingSlug: string;
    sailingTitle: string;
    shipName: string;
    cruiseLine: string;
    dateRangeLabel: string;
    regionLabel: string;
    hostedSailingPath: string;
    canonicalSailingPath: string;
    isIndexable: boolean;
    claimedStatus: "unclaimed" | "pending_verification" | "verified";
    membershipMode:
      | "independent_sailing_community"
      | "open_private_link"
      | "organizer_approval"
      | "invitation_code"
      | "verified_member";
    membershipDescriptor: {
      mode: string;
      isOrganizerClaimedAndVerified: boolean;
      publicBadgeLabel: string;
      cardHeadline: string;
      cardBody: string;
      enrollButtonLabel: string;
      nonBookingTruthNote: string;
      requiresCodeField: "none" | "invitation_code" | "member_verification_code";
      queuesForOrganizerApproval: boolean;
    };
    hasInvitationCode: boolean;
    hasMemberVerificationCode: boolean;
    suspended: boolean;
    suspendedReason?: string;
    welcomeNote?: string;
    cabinAvailabilityNote: string;
    officialWebsiteUrl: string;
    officialSailingPageUrl: string;
    officialReservationFormUrl: string;
    boardProvisioned: boolean;
    shareCode: string | null;
    boardPath: string | null;
    membershipLedger: {
      selfReportedIndependentParties: number;
      selfReportedOpenLinkParties: number;
      organizerApprovedParties: number;
      invitationCodeParties: number;
      verifiedOrganizerMemberParties: number;
      verifiedCabinBookingsCount: 0;
    };
    joinRequests: Array<{
      requestId: string;
      organizerSlug: string;
      sailingSlug: string;
      displayName: string;
      partySize: number;
      groupLabel?: string;
      alertEmailRequested: boolean;
      status: "pending" | "approved" | "rejected";
      approvedTravelerId?: string;
      createdAt: string;
      updatedAt: string;
      decisionNote?: string;
    }>;
  }>;
  claims: Array<{
    claimId: string;
    organizerSlug: string;
    sailingSlug: string | null;
    status: "pending_verification" | "verified" | "rejected";
    claimantName: string;
    claimantRole: string;
    claimantEmailDomain: string;
    claimantEmailRedacted: string;
    domainMatchesOfficial: boolean;
    verificationNote: string;
    welcomeNoteDraft?: string;
    officialBookingUrlOverride?: string;
    createdAt: string;
    updatedAt: string;
    verifiedAt?: string;
    reviewDecisionNote?: string;
  }>;
  opsFailures: Array<{
    id: string;
    createdAt: string;
    severity: "warning" | "error";
    category: string;
    organizerSlug?: string;
    sailingSlug?: string;
    summary: string;
  }>;
  moderationQueue?: {
    pendingReviews: Array<{
      reviewId: string;
      primarySubjectType: "organizer" | "hosted_sailing" | "ship" | "cruise_line" | "tour";
      primarySubjectId: string;
      organizerSlug?: string;
      sailingSlug?: string;
      authorDisplayName: string;
      authorEmailRedacted: string;
      verificationBadge: "verified_sailing_member" | "verified_email_traveler";
      overallRating: number;
      headline: string;
      writtenExperience: string;
      createdAt: string;
    }>;
    approvedReviewsCount: number;
    pendingQuestions: Array<{
      questionId: string;
      targetType: "organizer" | "hosted_sailing";
      organizerSlug: string;
      sailingSlug?: string;
      authorDisplayName: string;
      authorEmailRedacted: string;
      questionText: string;
      createdAt: string;
    }>;
    safetyReports: Array<{
      reportId: string;
      organizerSlug: string;
      sailingSlug?: string;
      reporterEmailRedacted: string;
      category: string;
      summary: string;
      status: "open" | "reviewed";
      createdAt: string;
      reviewedAt?: string;
    }>;
  };
  auditLog?: Array<{
    auditId: string;
    occurredAt: string;
    actorType: "verified_organizer" | "dcc_owner";
    actorLabel: string;
    organizerSlug: string;
    sailingSlug?: string | null;
    action: string;
    changedFields: string[];
    summary: string;
    canRollback: boolean;
    rolledBackFromAuditId?: string;
  }>;
}

export interface HostedCruisesBridgeResponse {
  ok: boolean;
  cpBaseUrl: string;
  dccServiceSecretPresent: boolean;
  snapshot: HostedCruisesAdminBridgeSnapshot | null;
  error?: string;
  actionResult?: Record<string, unknown>;
}

const DEFAULT_PREVIEW_CP_BASE_URL =
  "https://cruisepromenade-53xym7oo3-erichroeseler123-bots-projects.vercel.app";
const DEFAULT_PREVIEW_RC_BASE_URL =
  "https://roll-call-usa-git-feat-ar-cf87e0-erichroeseler123-bots-projects.vercel.app";

function isAllowedNonProdCpBaseUrl(candidate: string): boolean {
  try {
    const parsed = new URL(candidate);
    if (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      return true;
    }
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === "cruisepromenade.com" ||
      host === "www.cruisepromenade.com" ||
      /^cruisepromenade(?:-[a-z0-9-]+)?\.vercel\.app$/.test(host)
    );
  } catch {
    return false;
  }
}

function isAllowedNonProdRollCallBaseUrl(candidate: string): boolean {
  try {
    const parsed = new URL(candidate);
    if (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      return true;
    }
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === "rollcallusa.com" ||
      host === "www.rollcallusa.com" ||
      /^roll-call(?:-[a-z0-9-]+)?\.vercel\.app$/.test(host)
    );
  } catch {
    return false;
  }
}

export function resolveCruisePromenadeAdminTarget(options: {
  cpBaseUrlOverride?: string | null;
  rollcallBaseUrlOverride?: string | null;
} = {}): {
  cpBaseUrl: string;
  rollcallBaseUrlOverride: string | null;
} {
  const isProd = process.env.VERCEL_ENV === "production";
  const envCp = (process.env.CRUISEPROMENADE_ADMIN_BASE_URL || "").trim();

  if (isProd) {
    return {
      cpBaseUrl: (envCp || "https://cruisepromenade.com").replace(/\/+$/, ""),
      rollcallBaseUrlOverride: null,
    };
  }

  const candidateCp = (options.cpBaseUrlOverride || "").trim();
  const chosenCp =
    candidateCp && isAllowedNonProdCpBaseUrl(candidateCp)
      ? candidateCp
      : envCp || DEFAULT_PREVIEW_CP_BASE_URL;

  const candidateRc = (options.rollcallBaseUrlOverride || "").trim();
  const chosenRc =
    candidateRc && isAllowedNonProdRollCallBaseUrl(candidateRc)
      ? candidateRc
      : DEFAULT_PREVIEW_RC_BASE_URL;

  return {
    cpBaseUrl: chosenCp.replace(/\/+$/, ""),
    rollcallBaseUrlOverride: chosenRc.replace(/\/+$/, ""),
  };
}

function buildBridgeHeaders(): {
  headers: Record<string, string>;
  dccServiceSecretPresent: boolean;
} {
  const serviceSecret = (process.env.DCC_CP_SERVICE_SECRET || "").trim();
  const internalFallback = (process.env.INTERNAL_API_SECRET || "").trim();
  const effectiveSecret = serviceSecret || internalFallback;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (effectiveSecret) {
    headers["x-dcc-cp-service-secret"] = effectiveSecret;
  }
  const previewBypass = (process.env.CP_VERCEL_PROTECTION_BYPASS || "").trim();
  if (previewBypass) {
    headers["x-vercel-protection-bypass"] = previewBypass;
  }

  return {
    headers,
    dccServiceSecretPresent: Boolean(serviceSecret),
  };
}

export async function fetchHostedCruisesAdminSnapshotFromCp(options: {
  probeResend?: boolean;
  cpBaseUrlOverride?: string | null;
  rollcallBaseUrlOverride?: string | null;
} = {}): Promise<HostedCruisesBridgeResponse> {
  const { cpBaseUrl, rollcallBaseUrlOverride } =
    resolveCruisePromenadeAdminTarget(options);
  const { headers, dccServiceSecretPresent } = buildBridgeHeaders();

  if (!headers["x-dcc-cp-service-secret"]) {
    return {
      ok: false,
      cpBaseUrl,
      dccServiceSecretPresent,
      snapshot: null,
      error:
        "DCC_CP_SERVICE_SECRET is not configured in this environment. Set DCC_CP_SERVICE_SECRET on both DCC and Cruise Promenade.",
    };
  }

  const url = new URL(`${cpBaseUrl}/api/v2/hosted-cruises/admin`);
  url.searchParams.set("probeResend", options.probeResend === false ? "0" : "1");
  if (rollcallBaseUrlOverride) {
    url.searchParams.set("rollcallBaseUrlOverride", rollcallBaseUrlOverride);
  }

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const payload = (await res.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!res.ok || !payload || !payload.snapshot) {
      return {
        ok: false,
        cpBaseUrl,
        dccServiceSecretPresent,
        snapshot: null,
        error:
          (typeof payload?.error === "string" && payload.error) ||
          `Cruise Promenade returned HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      cpBaseUrl,
      dccServiceSecretPresent,
      snapshot: payload.snapshot as HostedCruisesAdminBridgeSnapshot,
    };
  } catch (err) {
    return {
      ok: false,
      cpBaseUrl,
      dccServiceSecretPresent,
      snapshot: null,
      error:
        err instanceof Error
          ? err.message
          : "Could not reach Cruise Promenade admin endpoint",
    };
  }
}

export async function sendHostedCruisesAdminActionToCp(
  body: Record<string, unknown>,
  options: {
    cpBaseUrlOverride?: string | null;
    rollcallBaseUrlOverride?: string | null;
  } = {},
): Promise<HostedCruisesBridgeResponse> {
  const { cpBaseUrl, rollcallBaseUrlOverride } =
    resolveCruisePromenadeAdminTarget(options);
  const { headers, dccServiceSecretPresent } = buildBridgeHeaders();

  if (!headers["x-dcc-cp-service-secret"]) {
    return {
      ok: false,
      cpBaseUrl,
      dccServiceSecretPresent,
      snapshot: null,
      error: "DCC_CP_SERVICE_SECRET is not configured in this environment.",
    };
  }

  const forwardPayload: Record<string, unknown> = {
    ...body,
    ...(rollcallBaseUrlOverride && !body.rollcallBaseUrlOverride
      ? { rollcallBaseUrlOverride }
      : {}),
  };

  try {
    const res = await fetch(`${cpBaseUrl}/api/v2/hosted-cruises/admin`, {
      method: "POST",
      headers,
      body: JSON.stringify(forwardPayload),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const payload = (await res.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!res.ok || !payload || !payload.ok) {
      return {
        ok: false,
        cpBaseUrl,
        dccServiceSecretPresent,
        snapshot:
          (payload?.snapshot as HostedCruisesAdminBridgeSnapshot | undefined) ||
          null,
        error:
          (typeof payload?.error === "string" && payload.error) ||
          `Action failed on Cruise Promenade (HTTP ${res.status})`,
      };
    }

    const { snapshot, ...rest } = payload;
    return {
      ok: true,
      cpBaseUrl,
      dccServiceSecretPresent,
      snapshot: (snapshot as HostedCruisesAdminBridgeSnapshot) || null,
      actionResult: rest,
    };
  } catch (err) {
    return {
      ok: false,
      cpBaseUrl,
      dccServiceSecretPresent,
      snapshot: null,
      error:
        err instanceof Error
          ? err.message
          : "Network error communicating with Cruise Promenade",
    };
  }
}
