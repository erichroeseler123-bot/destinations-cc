import { neon } from "@neondatabase/serverless";
import { resolveDatabaseUrl } from "@/lib/db/client";
import {
  FROZEN_AFFILIATE_IDENTIFIERS,
  HELD_COMMERCIAL_SKUS,
  PROTECTED_PARTNER_PROPERTIES,
  TRANSACTION_ROUTE_MODELS,
  listPartnerBoundaryReviewItems,
  type FrozenAffiliateIdentifierRecord,
  type HeldCommercialSkuRecord,
  type ProtectedPartnerPropertyRecord,
  type TransactionRouteModelDefinition,
  type TransactionRouteModelId,
} from "@/lib/dcc/commerce/affiliateOwnershipLedger";
import { buildUnifiedPortfolioFunnelReport } from "@/lib/dcc/commerce/portfolioFunnelReport";
import { getMemoryContextCount } from "@/lib/dcc/context/service";
import { getMachineStore } from "@/lib/dcc/machine";
import {
  getOperatorInboxSnapshot,
  type UnifiedOperatorInboxResult,
} from "@/lib/dcc/operatorInbox";

export type RemoteOwnerSummaryStatus = "live" | "pending_deploy" | "unconfigured" | "error";

export interface CruisePromenadeOwnerSummary {
  status: RemoteOwnerSummaryStatus;
  endpoint: string;
  needsAssistanceGuestsCount: number;
  plannersWithSplitsCount: number;
  sharedPlannersCount: number;
  trackedGuestsCount: number;
  note: string;
}

export interface DirectMorOwnerSummary {
  siteId: "gosno" | "partyatredrocks";
  siteName: string;
  endpoint: string;
  opsHref: string;
  status: RemoteOwnerSummaryStatus;
  provisioningExceptions: number;
  needsReviewOrders: number;
  paidOrders28d: number;
  grossRevenueUsd28d: number;
  note: string;
}

export interface RollCallBridgeStatus {
  modeBStatus: "beta_allowlist";
  moderationNotificationsOperational: boolean;
  moderationAlertEmailsConfigured: boolean;
  reminder: string | null;
}

export interface TriageActionItem {
  id: string;
  priority: "high" | "medium" | "info";
  title: string;
  countOrBadge: string;
  detail: string;
  actionHref?: string;
  actionLabel?: string;
  external?: boolean;
}

export interface ConnectedNetworkFunnelStage {
  stageNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  stageId:
    | "discovery"
    | "fit_evaluation"
    | "group_participation"
    | "booking_intent"
    | "completed_booking"
    | "attribution"
    | "revenue"
    | "post_booking_coordination";
  label: string;
  headlineMetric: string;
  subMetrics: string[];
  statusBadge: string;
}

export interface OwnedFleetProjectRow {
  projectNumber: number;
  projectId: string;
  name: string;
  canonicalDomain: string;
  role: string;
  ownershipModel: "owned_planning_hub" | "owned_specialist_storefront" | "owned_direct_mor" | "owned_hosted_community";
  primaryRouteModel: TransactionRouteModelId;
  deploySurface: string;
  rollbackTarget: string;
}

export interface OwnerControlCenterSnapshot {
  ok: true;
  generatedAt: string;
  operatorName: "Erich";
  dailyOperatingBudgetMinutes: 15;
  triageQueue: {
    totalAttentionCount: number;
    untriagedInquiriesCount: number;
    genuineActionableInquiriesCount: number;
    failedNotificationDeliveriesCount: number;
    genuineFailedNotificationsCount: number;
    inboxHref: "/admin/inbox?view=genuine";
    cruisePromenade: CruisePromenadeOwnerSummary;
    rollCallBridge: RollCallBridgeStatus;
    gosnoOps: DirectMorOwnerSummary;
    parrOps: DirectMorOwnerSummary;
    heldSkusCount: number;
    heldSkus: readonly HeldCommercialSkuRecord[];
    partnerBoundaryReviewCount: number;
    partnerBoundaryReviews: readonly FrozenAffiliateIdentifierRecord[];
    items: TriageActionItem[];
  };
  connectedFunnel28d: {
    windowLabel: string;
    startIso: string;
    endIso: string;
    stages: ConnectedNetworkFunnelStage[];
    strictlySeparatedRevenue: {
      commissionTrack: {
        label: "Affiliate / Direct 10% / Machine 5% Commissions";
        reportedCommissionsEarnedUsd: number;
        confirmedSettledPayoutsUsd: number;
        outcomesStatus: "reported" | "awaiting_settlement_or_unknown";
        routesIncluded: readonly TransactionRouteModelId[];
      };
      directMorGrossTrack: {
        label: "GoSno + Party at Red Rocks Direct MoR Gross Revenue";
        portfolioOwnedGrossSalesUsd: number;
        pendingOwnedSettlementUsd: number;
        gosnoReportedGrossUsd28d: number;
        parrReportedGrossUsd28d: number;
        routesIncluded: readonly ["direct_mor"];
        isolationRule: string;
      };
    };
  };
  fleetHealthAndRollback: {
    ownedActiveProductionProjectsCount: 11;
    ownedProductionProjects: readonly OwnedFleetProjectRow[];
    protectedPartnerProperties: readonly ProtectedPartnerPropertyRecord[];
  };
  commercialLedger: {
    transactionRouteModels: readonly TransactionRouteModelDefinition[];
    frozenAffiliateIdentifiers: readonly FrozenAffiliateIdentifierRecord[];
    heldCommercialSkus: readonly HeldCommercialSkuRecord[];
  };
}

export const OWNED_ACTIVE_PRODUCTION_PROJECTS: readonly OwnedFleetProjectRow[] = [
  {
    projectNumber: 1,
    projectId: "destinations-cc",
    name: "Destination Command Center",
    canonicalDomain: "destinationcommandcenter.com",
    role: "Travel reference, 629-port fit engine, machine graph, & Single-Operator Control Center",
    ownershipModel: "owned_planning_hub",
    primaryRouteModel: "marketplace_affiliate",
    deploySurface: "Vercel Root (`prj_pqvFn6jtJbbVgv1UsAsg3KtMl26s`)",
    rollbackTarget: "Instant Vercel promote of prior production deployment; zero schema drop",
  },
  {
    projectNumber: 2,
    projectId: "cruisepromenade",
    name: "Cruise Promenade",
    canonicalDomain: "cruisepromenade.com",
    role: "Commission-neutral group cruise itinerary board, split tracking, & guest RSVP organizer",
    ownershipModel: "owned_planning_hub",
    primaryRouteModel: "commission_neutral_planning",
    deploySurface: "Dedicated Vercel repo (`cruisepromenade`)",
    rollbackTarget: "Instant Vercel alias rollback; Upstash shared-plan state preserved",
  },
  {
    projectNumber: 3,
    projectId: "rollcallusa",
    name: "RollCallUSA",
    canonicalDomain: "rollcallusa.com",
    role: "Post-booking Hosted Cruise Mode B community & sailing updates (`beta_allowlist`)",
    ownershipModel: "owned_hosted_community",
    primaryRouteModel: "commission_neutral_planning",
    deploySurface: "Dedicated Vercel project (`rollcallusa`)",
    rollbackTarget: "Keep Mode B gated in `beta_allowlist` until `MODERATION_ALERT_EMAILS` is verified",
  },
  {
    projectNumber: 4,
    projectId: "last-frontier-shore-excursions",
    name: "Last Frontier Shore Excursions",
    canonicalDomain: "lastfrontiershoreexcursions.com",
    role: "Owned 5-port Alaska cruise excursion storefront (`P00281144` / `F2MMUUH`)",
    ownershipModel: "owned_specialist_storefront",
    primaryRouteModel: "marketplace_affiliate",
    deploySurface: "Monorepo Sub-App (`prj_yDpBslt3bvKrvqNnzuQn684rLhAy`)",
    rollbackTarget: "Promote previous LFSE deployment; keep `aleutian-ballad` held",
  },
  {
    projectNumber: 5,
    projectId: "juneauflightdeck",
    name: "Juneau Flight Deck",
    canonicalDomain: "juneauflightdeck.com",
    role: "Juneau glacier helicopter & dog-sled timing/weight specialist desk (`P00058396`)",
    ownershipModel: "owned_specialist_storefront",
    primaryRouteModel: "marketplace_affiliate",
    deploySurface: "Monorepo Sub-App (`prj_7nY8notLHK8Fh5TkSwli9qXUDhxA`)",
    rollbackTarget: "Promote previous JFD deployment; waitlist falls back to DCC inbox",
  },
  {
    projectNumber: 6,
    projectId: "welcometoneworleanstours",
    name: "Welcome to New Orleans Tours",
    canonicalDomain: "welcometoneworleanstours.com",
    role: "New Orleans tour storefront & Port NOLA turnaround desk (`P00058396` / `aktourcenter`)",
    ownershipModel: "owned_specialist_storefront",
    primaryRouteModel: "marketplace_affiliate",
    deploySurface: "Monorepo Sub-App (`prj_G4aMmGzfGoWKyVZ9wTgUPf5D7rrS`)",
    rollbackTarget: "Promote previous WNO deployment; keep `jeanlafitte-swamp-tour-with-hotel-pickup` held",
  },
  {
    projectNumber: 7,
    projectId: "welcometotheswamp",
    name: "Welcome to the Swamp",
    canonicalDomain: "welcometotheswamp.com",
    role: "Airboat vs. covered swamp boat fit specialist (`P00058396` / `aktourcenter`)",
    ownershipModel: "owned_specialist_storefront",
    primaryRouteModel: "marketplace_affiliate",
    deploySurface: "Monorepo Sub-App (`prj_ZY5kkB2QvuIkvJWSGD9IZ0mvhBxx`)",
    rollbackTarget: "Promote previous WTS deployment; edge context cookie degrades fail-open",
  },
  {
    projectNumber: 8,
    projectId: "welcometothedells",
    name: "Welcome to the Dells",
    canonicalDomain: "welcometothedells.com",
    role: "Wisconsin Dells river-ops & Ducks/boat handoff specialist",
    ownershipModel: "owned_specialist_storefront",
    primaryRouteModel: "dcc_sourced_direct_10pct",
    deploySurface: "Monorepo Sub-App (`prj_I9q7K5y6J7jbHWJ7QFVCE2GQW5T3`)",
    rollbackTarget: "Promote previous Dells deployment; `/out/wisconsin-dells/[slug]` fails open to 302",
  },
  {
    projectNumber: 9,
    projectId: "saveonthestrip",
    name: "Save On The Strip",
    canonicalDomain: "saveonthestrip.com",
    role: "Las Vegas show, Sphere, & Grand Canyon helicopter specialist desk",
    ownershipModel: "owned_specialist_storefront",
    primaryRouteModel: "marketplace_affiliate",
    deploySurface: "Monorepo Sub-App (`prj_0JZvBdAanNlt4Xqj06SeSe8r2Kr5`)",
    rollbackTarget: "Promote previous SOTS deployment; concierge requests route to DCC inbox",
  },
  {
    projectNumber: 10,
    projectId: "gosno",
    name: "GoSno",
    canonicalDomain: "gosno.co",
    role: "Owned Merchant-of-Record Denver/mountain private & shuttle transfers",
    ownershipModel: "owned_direct_mor",
    primaryRouteModel: "direct_mor",
    deploySurface: "Dedicated Vercel repo (`gosno`)",
    rollbackTarget: "Use GoSno Operations Queue (`/admin/operations-queue`); MoR orders stay isolated",
  },
  {
    projectNumber: 11,
    projectId: "partyatredrocks",
    name: "Party at Red Rocks",
    canonicalDomain: "partyatredrocks.com",
    role: "Owned Merchant-of-Record Red Rocks concert shuttle & private SUV fleet",
    ownershipModel: "owned_direct_mor",
    primaryRouteModel: "direct_mor",
    deploySurface: "Dedicated Vercel repo (`partyatredrocks`)",
    rollbackTarget: "Use PARR Inventory (`/admin/parr-inventory`); MoR liabilities stay isolated",
  },
] as const;

function safeNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

async function fetchCruisePromenadeOwnerSummary(options: {
  env: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}): Promise<CruisePromenadeOwnerSummary> {
  const endpoint = "https://cruisepromenade.com/api/internal/owner-summary";
  const secret = (
    options.env.DCC_CP_SERVICE_SECRET ||
    options.env.INTERNAL_API_SECRET ||
    ""
  ).trim();

  if (!secret && !options.fetchImpl) {
    return {
      status: "unconfigured",
      endpoint,
      needsAssistanceGuestsCount: 0,
      plannersWithSplitsCount: 0,
      sharedPlannersCount: 0,
      trackedGuestsCount: 0,
      note: "Set DCC_CP_SERVICE_SECRET (or INTERNAL_API_SECRET) to pull live Cruise Promenade owner-summary counts.",
    };
  }

  if (options.env.DCC_DISABLE_NEON_COMMERCE === "1" && !options.fetchImpl) {
    return {
      status: "pending_deploy",
      endpoint,
      needsAssistanceGuestsCount: 0,
      plannersWithSplitsCount: 0,
      sharedPlannersCount: 0,
      trackedGuestsCount: 0,
      note: "Offline test mode (`DCC_DISABLE_NEON_COMMERCE=1`): remote CP owner-summary skipped.",
    };
  }

  const fetchFn = options.fetchImpl ?? fetch;
  try {
    const res = await fetchFn(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-dcc-internal-secret": secret,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (res.status === 404) {
      return {
        status: "pending_deploy",
        endpoint,
        needsAssistanceGuestsCount: 0,
        plannersWithSplitsCount: 0,
        sharedPlannersCount: 0,
        trackedGuestsCount: 0,
        note: "Cruise Promenade `/api/internal/owner-summary` returned 404 (`pending_deploy`).",
      };
    }

    if (!res.ok) {
      return {
        status: "error",
        endpoint,
        needsAssistanceGuestsCount: 0,
        plannersWithSplitsCount: 0,
        sharedPlannersCount: 0,
        trackedGuestsCount: 0,
        note: `Cruise Promenade owner-summary returned HTTP ${res.status}.`,
      };
    }

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      status: "live",
      endpoint,
      needsAssistanceGuestsCount: safeNumber(body.needsAssistanceGuestsCount),
      plannersWithSplitsCount: safeNumber(body.plannersWithSplitsCount),
      sharedPlannersCount: safeNumber(
        body.sharedPlannersCount ?? body.activePlannersCount,
      ),
      trackedGuestsCount: safeNumber(
        body.trackedGuestsCount ?? body.totalGuestsCount,
      ),
      note: "Live Cruise Promenade owner summary connected.",
    };
  } catch {
    return {
      status: "pending_deploy",
      endpoint,
      needsAssistanceGuestsCount: 0,
      plannersWithSplitsCount: 0,
      sharedPlannersCount: 0,
      trackedGuestsCount: 0,
      note: "Cruise Promenade owner-summary timed out or unreachable (`2.5s` bound).",
    };
  }
}

async function fetchDirectMorOwnerSummary(options: {
  siteId: "gosno" | "partyatredrocks";
  siteName: string;
  endpoint: string;
  opsHref: string;
  secret: string;
  env: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}): Promise<DirectMorOwnerSummary> {
  const { siteId, siteName, endpoint, opsHref, secret, env } = options;

  if (!secret && !options.fetchImpl) {
    return {
      siteId,
      siteName,
      endpoint,
      opsHref,
      status: "unconfigured",
      provisioningExceptions: 0,
      needsReviewOrders: 0,
      paidOrders28d: 0,
      grossRevenueUsd28d: 0,
      note: `${siteName} internal secret not configured; check ${siteName} admin queue directly when needed.`,
    };
  }

  if (env.DCC_DISABLE_NEON_COMMERCE === "1" && !options.fetchImpl) {
    return {
      siteId,
      siteName,
      endpoint,
      opsHref,
      status: "pending_deploy",
      provisioningExceptions: 0,
      needsReviewOrders: 0,
      paidOrders28d: 0,
      grossRevenueUsd28d: 0,
      note: `Offline test mode: remote ${siteName} owner-summary skipped.`,
    };
  }

  const fetchFn = options.fetchImpl ?? fetch;
  try {
    const res = await fetchFn(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-dcc-internal-secret": secret,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (res.status === 404) {
      return {
        siteId,
        siteName,
        endpoint,
        opsHref,
        status: "pending_deploy",
        provisioningExceptions: 0,
        needsReviewOrders: 0,
        paidOrders28d: 0,
        grossRevenueUsd28d: 0,
        note: `${siteName} \`/api/internal/owner-summary\` returned 404 (\`pending_deploy\`).`,
      };
    }

    if (!res.ok) {
      return {
        siteId,
        siteName,
        endpoint,
        opsHref,
        status: "error",
        provisioningExceptions: 0,
        needsReviewOrders: 0,
        paidOrders28d: 0,
        grossRevenueUsd28d: 0,
        note: `${siteName} owner-summary returned HTTP ${res.status}.`,
      };
    }

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      siteId,
      siteName,
      endpoint,
      opsHref,
      status: "live",
      provisioningExceptions: safeNumber(body.provisioningExceptions),
      needsReviewOrders: safeNumber(body.needsReviewOrders),
      paidOrders28d: safeNumber(body.paidOrders28d ?? body.confirmedOrdersCount),
      grossRevenueUsd28d: safeNumber(body.grossRevenueUsd28d ?? body.grossSalesUsd),
      note: `Live ${siteName} MoR summary connected.`,
    };
  } catch {
    return {
      siteId,
      siteName,
      endpoint,
      opsHref,
      status: "pending_deploy",
      provisioningExceptions: 0,
      needsReviewOrders: 0,
      paidOrders28d: 0,
      grossRevenueUsd28d: 0,
      note: `${siteName} owner-summary timed out or unreachable (\`2.5s\` bound).`,
    };
  }
}

async function countRecentDccContexts(
  env: Record<string, string | undefined>,
): Promise<number> {
  const memCount = getMemoryContextCount();
  if (env.DCC_DISABLE_NEON_COMMERCE === "1") {
    return memCount;
  }
  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) {
    return memCount;
  }
  try {
    const sql = neon(dbUrl);
    const rows = (await sql`
      SELECT COUNT(*)::int AS cnt
      FROM dcc_contexts
      WHERE issued_at >= NOW() - INTERVAL '28 days'
    `) as Array<{ cnt?: number }>;
    const dbCount = safeNumber(rows[0]?.cnt, 0);
    return Math.max(memCount, dbCount);
  } catch {
    return memCount;
  }
}

export interface BuildOwnerControlCenterOptions {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  inboxSnapshotOverride?: UnifiedOperatorInboxResult;
}

export async function buildOwnerControlCenterSnapshot(
  options?: BuildOwnerControlCenterOptions,
): Promise<OwnerControlCenterSnapshot> {
  const env = options?.env ?? process.env;
  const generatedAt = new Date().toISOString();

  const gosnoSecret = (
    env.DCC_INTERNAL_API_SECRET ||
    env.INTERNAL_API_SECRET ||
    ""
  ).trim();
  const parrSecret = (
    env.DCC_PARR_WEBHOOK_TOKEN ||
    env.INTERNAL_API_SECRET ||
    ""
  ).trim();

  const [inbox, funnel, cpSummary, gosnoOps, parrOps, dccContextsCount] =
    await Promise.all([
      options?.inboxSnapshotOverride
        ? Promise.resolve(options.inboxSnapshotOverride)
        : getOperatorInboxSnapshot({ view: "genuine" }),
      buildUnifiedPortfolioFunnelReport({ windowPreset: "28d" }),
      fetchCruisePromenadeOwnerSummary({ env, fetchImpl: options?.fetchImpl }),
      fetchDirectMorOwnerSummary({
        siteId: "gosno",
        siteName: "GoSno",
        endpoint: "https://gosno.co/api/internal/owner-summary",
        opsHref: "https://gosno.co/admin/operations-queue",
        secret: gosnoSecret,
        env,
        fetchImpl: options?.fetchImpl,
      }),
      fetchDirectMorOwnerSummary({
        siteId: "partyatredrocks",
        siteName: "Party at Red Rocks",
        endpoint: "https://www.partyatredrocks.com/api/internal/owner-summary",
        opsHref: "https://www.partyatredrocks.com/admin/parr-inventory",
        secret: parrSecret,
        env,
        fetchImpl: options?.fetchImpl,
      }),
      countRecentDccContexts(env),
    ]);

  const moderationAlertEmailsConfigured = Boolean(
    env.MODERATION_ALERT_EMAILS?.trim(),
  );
  const rollCallBridge: RollCallBridgeStatus = {
    modeBStatus: "beta_allowlist",
    moderationNotificationsOperational: moderationAlertEmailsConfigured,
    moderationAlertEmailsConfigured,
    reminder: moderationAlertEmailsConfigured
      ? null
      : "Set `MODERATION_ALERT_EMAILS` before opening RollCallUSA Hosted Mode B beyond `beta_allowlist`.",
  };

  const partnerBoundaryReviews = listPartnerBoundaryReviewItems();
  const machineStore = getMachineStore();
  const decisionEvaluationsCount =
    dccContextsCount + machineStore.changeEvents.length;

  const triageItems: TriageActionItem[] = [
    {
      id: "operator-inbox-triage",
      priority:
        inbox.kpis.needsTriageCount > 0 ||
        inbox.kpis.genuineFailedNotificationsCount > 0
          ? "high"
          : "info",
      title: "Unified Operator Inbox (Genuine Inquiries & Notifications)",
      countOrBadge: `${inbox.kpis.needsTriageCount} untriaged · ${inbox.kpis.failedNotificationsCount} failed alerts`,
      detail: `${inbox.kpis.genuineActionableCount} actionable genuine inquiry item(s) across 8 specialist channels (${inbox.kpis.genuineFailedNotificationsCount} genuine failed email/SMS delivery alerts).`,
      actionHref: "/admin/inbox?view=genuine",
      actionLabel: "Open Genuine Inbox →",
    },
    {
      id: "cruise-promenade-splits",
      priority: cpSummary.needsAssistanceGuestsCount > 0 ? "high" : "info",
      title: "Cruise Promenade Group Assistance & Party Splits",
      countOrBadge:
        cpSummary.status === "live"
          ? `${cpSummary.needsAssistanceGuestsCount} need assistance · ${cpSummary.plannersWithSplitsCount} split plans`
          : cpSummary.status,
      detail: cpSummary.note,
      actionHref: "https://cruisepromenade.com/internal/dashboard/",
      actionLabel: "Inspect CP Board ↗",
      external: true,
    },
    {
      id: "gosno-parr-mor-exceptions",
      priority:
        gosnoOps.provisioningExceptions +
          gosnoOps.needsReviewOrders +
          parrOps.provisioningExceptions +
          parrOps.needsReviewOrders >
        0
          ? "high"
          : "info",
      title: "Direct MoR Ops Exceptions (GoSno & Party at Red Rocks)",
      countOrBadge: `GoSno: ${gosnoOps.provisioningExceptions + gosnoOps.needsReviewOrders} (${gosnoOps.status}) · PARR: ${parrOps.provisioningExceptions + parrOps.needsReviewOrders} (${parrOps.status})`,
      detail: `${gosnoOps.note} ${parrOps.note}`,
      actionHref: gosnoOps.opsHref,
      actionLabel: "GoSno Queue ↗",
      external: true,
    },
  ];

  if (!rollCallBridge.moderationNotificationsOperational) {
    triageItems.push({
      id: "rollcall-moderation-env",
      priority: "medium",
      title: "RollCallUSA Hosted Mode B Moderation Alert Readiness",
      countOrBadge: "Mode B: beta_allowlist",
      detail:
        rollCallBridge.reminder ||
        "Configure MODERATION_ALERT_EMAILS while Mode B remains safely gated.",
    });
  }

  triageItems.push({
    id: "held-skus-and-partner-boundary",
    priority: "medium",
    title: "Held Commercial SKUs & WTA Partner Payout Boundary",
    countOrBadge: `${HELD_COMMERCIAL_SKUS.length} held SKUs · ${partnerBoundaryReviews.length} partner boundary check`,
    detail: `Held: ${HELD_COMMERCIAL_SKUS.map((s) => `${s.skuSlug} (${s.surfaceCode})`).join(", ")}. Review item: FareHarbor asn=welcometoalaskatours on LFSE Allen Marine comparison link (do NOT alter without owner + WTA partner review).`,
    actionHref: "/admin/portfolio",
    actionLabel: "Supplier & Funnel Audit →",
  });

  const totalAttentionCount =
    inbox.kpis.needsTriageCount +
    inbox.kpis.genuineFailedNotificationsCount +
    cpSummary.needsAssistanceGuestsCount +
    gosnoOps.provisioningExceptions +
    gosnoOps.needsReviewOrders +
    parrOps.provisioningExceptions +
    parrOps.needsReviewOrders;

  const totals = funnel.totals;
  const drops = funnel.unmatchedAttributionDrops;

  const completedMarketplaceOrDirectCount = totals.confirmedBookingsCount;
  const totalCompletedBookingsCount =
    completedMarketplaceOrDirectCount +
    gosnoOps.paidOrders28d +
    parrOps.paidOrders28d;

  const stages: ConnectedNetworkFunnelStage[] = [
    {
      stageNumber: 1,
      stageId: "discovery",
      label: "1. Discovery",
      headlineMetric: `${totals.uniqueVisitors.toLocaleString()} unique visitors`,
      subMetrics: [
        `${totals.rawPageviewEvents.toLocaleString()} pageviews across ${totals.activeSpokesCount} active spokes`,
        `${totals.storefrontArrivals.toLocaleString()} specialist storefront arrivals`,
      ],
      statusBadge: "Active",
    },
    {
      stageNumber: 2,
      stageId: "fit_evaluation",
      label: "2. Fit Evaluation",
      headlineMetric: `${dccContextsCount.toLocaleString()} dcc_ctx_ tokens`,
      subMetrics: [
        `${decisionEvaluationsCount.toLocaleString()} decision receipts & graph events`,
        "100% commission-neutral 5-state fit vocabulary",
      ],
      statusBadge: "Commission-Neutral",
    },
    {
      stageNumber: 3,
      stageId: "group_participation",
      label: "3. Group Participation",
      headlineMetric:
        cpSummary.status === "live"
          ? `${cpSummary.sharedPlannersCount.toLocaleString()} shared planners`
          : `CP summary: ${cpSummary.status}`,
      subMetrics: [
        `${cpSummary.trackedGuestsCount.toLocaleString()} tracked guests · ${cpSummary.plannersWithSplitsCount.toLocaleString()} planners w/ splits`,
        `${cpSummary.needsAssistanceGuestsCount.toLocaleString()} guests flagged needs-assistance`,
      ],
      statusBadge: cpSummary.status,
    },
    {
      stageNumber: 4,
      stageId: "booking_intent",
      label: "4. Booking Intent",
      headlineMetric: `${totals.outboundClicks.total.toLocaleString()} durable handoffs`,
      subMetrics: [
        `${totals.outboundClicks.checkoutReferrals.toLocaleString()} checkout referrals (Viator ${totals.outboundClicks.viatorAffiliateClicks}, FH ${totals.outboundClicks.fareharborCheckoutReferrals}, GYG ${totals.outboundClicks.getyourguideAffiliateClicks})`,
        `${totals.outboundClicks.ownedCheckoutClicks.toLocaleString()} owned MoR checkout clicks`,
      ],
      statusBadge: "Tracked",
    },
    {
      stageNumber: 5,
      stageId: "completed_booking",
      label: "5. Completed Booking",
      headlineMetric: `${totalCompletedBookingsCount.toLocaleString()} confirmed outcomes`,
      subMetrics: [
        `DCC reconciled outcomes: ${completedMarketplaceOrDirectCount.toLocaleString()}`,
        `Remote MoR 28d orders — GoSno: ${gosnoOps.paidOrders28d} · PARR: ${parrOps.paidOrders28d}`,
      ],
      statusBadge:
        totals.affiliateOutcomesStatus === "reported"
          ? "Verified"
          : "Provider Poller + MoR",
    },
    {
      stageNumber: 6,
      stageId: "attribution",
      label: "6. Attribution",
      headlineMetric: `${totals.confirmedSettlementRecordsCount.toLocaleString()} settled · ${drops.checkoutReferralsWithoutProviderOutcome.pendingOnActiveFeed.toLocaleString()} awaiting poller`,
      subMetrics: [
        `${drops.checkoutReferralsWithoutProviderOutcome.unreportedProviderUnknown.toLocaleString()} click-level referrals without provider webhook`,
        `${drops.unmatchedProviderOutcomes.count.toLocaleString()} unmatched provider outcome records`,
      ],
      statusBadge: "Honest Reconciliation",
    },
    {
      stageNumber: 7,
      stageId: "revenue",
      label: "7. Revenue (Strictly Separated)",
      headlineMetric: `Commissions: $${totals.revenue.reportedCommissionsEarnedUsd.toLocaleString()} · MoR Gross: $${totals.ownedGrossSalesUsd.toLocaleString()}`,
      subMetrics: [
        `Commission Track (Affiliate / 10% Direct / 5% Machine): $${totals.confirmedSettledPayoutsUsd.toLocaleString()} settled`,
        `Direct MoR Gross (GoSno + PARR isolated): $${totals.ownedGrossSalesUsd.toLocaleString()} ($${totals.pendingOwnedSettlementUsd.toLocaleString()} pending)`,
      ],
      statusBadge: "Isolated Tracks",
    },
    {
      stageNumber: 8,
      stageId: "post_booking_coordination",
      label: "8. Post-Booking Coordination",
      headlineMetric: `RollCallUSA Mode B: ${rollCallBridge.modeBStatus}`,
      subMetrics: [
        `Moderation alerts: ${rollCallBridge.moderationNotificationsOperational ? "operational" : "needs MODERATION_ALERT_EMAILS"}`,
        "Calendar export & port-window schedule recheck active",
      ],
      statusBadge: rollCallBridge.modeBStatus,
    },
  ];

  return {
    ok: true,
    generatedAt,
    operatorName: "Erich",
    dailyOperatingBudgetMinutes: 15,
    triageQueue: {
      totalAttentionCount,
      untriagedInquiriesCount: inbox.kpis.needsTriageCount,
      genuineActionableInquiriesCount: inbox.kpis.genuineActionableCount,
      failedNotificationDeliveriesCount: inbox.kpis.failedNotificationsCount,
      genuineFailedNotificationsCount:
        inbox.kpis.genuineFailedNotificationsCount,
      inboxHref: "/admin/inbox?view=genuine",
      cruisePromenade: cpSummary,
      rollCallBridge,
      gosnoOps,
      parrOps,
      heldSkusCount: HELD_COMMERCIAL_SKUS.length,
      heldSkus: HELD_COMMERCIAL_SKUS,
      partnerBoundaryReviewCount: partnerBoundaryReviews.length,
      partnerBoundaryReviews,
      items: triageItems,
    },
    connectedFunnel28d: {
      windowLabel: funnel.reportingWindow.label,
      startIso: funnel.reportingWindow.startIso,
      endIso: funnel.reportingWindow.endIso,
      stages,
      strictlySeparatedRevenue: {
        commissionTrack: {
          label: "Affiliate / Direct 10% / Machine 5% Commissions",
          reportedCommissionsEarnedUsd:
            totals.revenue.reportedCommissionsEarnedUsd,
          confirmedSettledPayoutsUsd: totals.confirmedSettledPayoutsUsd,
          outcomesStatus:
            totals.commissionsEarnedUsd === "unknown"
              ? "awaiting_settlement_or_unknown"
              : "reported",
          routesIncluded: [
            "marketplace_affiliate",
            "dcc_sourced_direct_10pct",
            "machine_distributed_5pct",
          ],
        },
        directMorGrossTrack: {
          label: "GoSno + Party at Red Rocks Direct MoR Gross Revenue",
          portfolioOwnedGrossSalesUsd: totals.ownedGrossSalesUsd,
          pendingOwnedSettlementUsd: totals.pendingOwnedSettlementUsd,
          gosnoReportedGrossUsd28d: gosnoOps.grossRevenueUsd28d,
          parrReportedGrossUsd28d: parrOps.grossRevenueUsd28d,
          routesIncluded: ["direct_mor"],
          isolationRule:
            "GoSno and Party at Red Rocks earn direct operating margin as Merchant of Record; MoR gross sales and customer liabilities are never blended with affiliate/10%/5% commissions.",
        },
      },
    },
    fleetHealthAndRollback: {
      ownedActiveProductionProjectsCount: 11,
      ownedProductionProjects: OWNED_ACTIVE_PRODUCTION_PROJECTS,
      protectedPartnerProperties: PROTECTED_PARTNER_PROPERTIES,
    },
    commercialLedger: {
      transactionRouteModels: TRANSACTION_ROUTE_MODELS,
      frozenAffiliateIdentifiers: FROZEN_AFFILIATE_IDENTIFIERS,
      heldCommercialSkus: HELD_COMMERCIAL_SKUS,
    },
  };
}
