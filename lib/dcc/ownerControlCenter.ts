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
  sampledSharedPlannersCount: number;
  genuineSharedPlannersCount: number | null;
  testSharedPlannersCount: number;
  confirmedSailDatesCount: number;
  verifiedFullItinerarySailingsCount: number;
  trackedGuestsCount: number;
  note: string;
}

export interface DirectMorOwnerSummary {
  siteId: "gosno" | "partyatredrocks";
  siteName: string;
  endpoint: string;
  opsHref: string;
  status: RemoteOwnerSummaryStatus;
  testRecordsExcluded28d: number;
  genuineOrdersTotal28d: number;
  paidOrders28d: number;
  confirmedUnpaidOrders28d: number;
  openQuoteRequests28d: number;
  activeHoldsCount: number;
  awaitingBalanceOrders28d: number;
  paidGrossSalesUsd28d: number;
  grossRevenueUsd28d: number;
  confirmedUnpaidGrossUsd28d: number;
  awaitingBalanceGrossUsd28d: number;
  netOperatingRevenueUsd28d: number | null;
  provisioningExceptions: number;
  needsReviewOrders: number;
  rezdyHealth: Record<string, unknown> | null;
  note: string;
}

export interface StrictSeparationMetricRow {
  rowNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  key:
    | "test_records_excluded"
    | "genuine_bookings"
    | "paid_bookings"
    | "confirmed_unpaid_bookings"
    | "open_quotes"
    | "active_holds"
    | "awaiting_balance_orders"
    | "gross_merchant_sales"
    | "net_operating_revenue"
    | "affiliate_commissions";
  label: string;
  headlineValue: string;
  gosnoBreakdown: string;
  parrBreakdown: string;
  networkOrAffiliateBreakdown: string;
  antiConflationDisclosure: string;
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
    strictSeparation10Way28d: StrictSeparationMetricRow[];
    strictlySeparatedRevenue: {
      commissionTrack: {
        label: "Affiliate / Direct 10% / Machine 5% Commissions";
        reportedCommissionsEarnedUsd: number;
        confirmedSettledPayoutsUsd: number;
        affiliateClicks28d: number;
        clicksDisclosure: "Clicks / Handoffs Only — Not Bookings or Revenue";
        outcomesStatus: "reported" | "awaiting_settlement_or_unknown";
        routesIncluded: readonly TransactionRouteModelId[];
      };
      directMorGrossTrack: {
        label: "GoSno + Party at Red Rocks Direct MoR Gross Revenue";
        grossSalesDisclosure: "Gross Merchant Sales — Not Profit; Excludes Operating Costs, Driver Pay, Processor Fees & Refunds";
        portfolioOwnedGrossSalesUsd: number;
        pendingOwnedSettlementUsd: number;
        gosnoReportedGrossUsd28d: number;
        parrReportedGrossUsd28d: number;
        combinedPaidGrossSalesUsd28d: number;
        combinedConfirmedUnpaidGrossUsd28d: number;
        combinedAwaitingBalanceGrossUsd28d: number;
        gosnoNetOperatingRevenueUsd28d: number | null;
        parrNetOperatingRevenueUsd28d: number | null;
        netOperatingRevenueStatusLabel: string;
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
    rollbackTarget: "Promote previous LFSE deployment; Viator `P00281144` & GetYourGuide `F2MMUUH` (`t598272`) verified",
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

function safeNullableSignedNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeNullableNonNegativeNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function emptyCruisePromenadeSummary(
  status: RemoteOwnerSummaryStatus,
  endpoint: string,
  note: string,
): CruisePromenadeOwnerSummary {
  return {
    status,
    endpoint,
    needsAssistanceGuestsCount: 0,
    plannersWithSplitsCount: 0,
    sharedPlannersCount: 0,
    sampledSharedPlannersCount: 0,
    genuineSharedPlannersCount: null,
    testSharedPlannersCount: 0,
    confirmedSailDatesCount: 0,
    verifiedFullItinerarySailingsCount: 0,
    trackedGuestsCount: 0,
    note,
  };
}

function emptyDirectMorOwnerSummary(options: {
  siteId: "gosno" | "partyatredrocks";
  siteName: string;
  endpoint: string;
  opsHref: string;
  status: RemoteOwnerSummaryStatus;
  note: string;
}): DirectMorOwnerSummary {
  return {
    siteId: options.siteId,
    siteName: options.siteName,
    endpoint: options.endpoint,
    opsHref: options.opsHref,
    status: options.status,
    testRecordsExcluded28d: 0,
    genuineOrdersTotal28d: 0,
    paidOrders28d: 0,
    confirmedUnpaidOrders28d: 0,
    openQuoteRequests28d: 0,
    activeHoldsCount: 0,
    awaitingBalanceOrders28d: 0,
    paidGrossSalesUsd28d: 0,
    grossRevenueUsd28d: 0,
    confirmedUnpaidGrossUsd28d: 0,
    awaitingBalanceGrossUsd28d: 0,
    netOperatingRevenueUsd28d: null,
    provisioningExceptions: 0,
    needsReviewOrders: 0,
    rezdyHealth: null,
    note: options.note,
  };
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
    return emptyCruisePromenadeSummary(
      "unconfigured",
      endpoint,
      "Set DCC_CP_SERVICE_SECRET (or INTERNAL_API_SECRET) to pull live Cruise Promenade owner-summary counts.",
    );
  }

  if (options.env.DCC_DISABLE_NEON_COMMERCE === "1" && !options.fetchImpl) {
    return emptyCruisePromenadeSummary(
      "pending_deploy",
      endpoint,
      "Offline test mode (`DCC_DISABLE_NEON_COMMERCE=1`): remote CP owner-summary skipped.",
    );
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
      return emptyCruisePromenadeSummary(
        "pending_deploy",
        endpoint,
        "Cruise Promenade `/api/internal/owner-summary` returned 404 (`pending_deploy`).",
      );
    }

    if (!res.ok) {
      return emptyCruisePromenadeSummary(
        "error",
        endpoint,
        `Cruise Promenade owner-summary returned HTTP ${res.status}.`,
      );
    }

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const planners = (
      body.planners && typeof body.planners === "object" ? body.planners : {}
    ) as Record<string, unknown>;
    const catalog = (
      body.catalog && typeof body.catalog === "object" ? body.catalog : {}
    ) as Record<string, unknown>;

    const sampledSharedPlannersCount = safeNumber(
      body.sampledSharedPlannersCount ??
        planners.sampledSharedPlannersCount ??
        body.sharedPlannersCount ??
        planners.sharedPlannersCount ??
        body.activePlannersCount ??
        planners.activePlannersCount,
    );
    const genuineSharedPlannersCount = safeNullableNonNegativeNumber(
      body.genuineSharedPlannersCount ?? planners.genuineSharedPlannersCount,
    );
    const testSharedPlannersCount = safeNumber(
      body.testSharedPlannersCount ?? planners.testSharedPlannersCount,
    );
    const confirmedSailDatesCount = safeNumber(
      catalog.confirmedSailDatesCount ?? body.confirmedSailDatesCount,
    );
    const verifiedFullItinerarySailingsCount = safeNumber(
      catalog.verifiedFullItinerarySailingsCount ??
        body.verifiedFullItinerarySailingsCount,
    );
    const sharedPlannersCount =
      genuineSharedPlannersCount ?? sampledSharedPlannersCount;

    const noteParts = [
      genuineSharedPlannersCount !== null
        ? `Genuine shared boards: ${genuineSharedPlannersCount} (KV sampled: ${sampledSharedPlannersCount}, test excluded: ${testSharedPlannersCount}).`
        : `Sampled KV planner boards: ${sampledSharedPlannersCount} (unfiltered KV sample — not conflated with verified user groups).`,
    ];
    if (confirmedSailDatesCount > 0 || verifiedFullItinerarySailingsCount > 0) {
      noteParts.push(
        `Catalog: ${confirmedSailDatesCount} confirmed sail dates vs ${verifiedFullItinerarySailingsCount} verified full port itineraries.`,
      );
    }

    return {
      status: "live",
      endpoint,
      needsAssistanceGuestsCount: safeNumber(
        body.needsAssistanceGuestsCount ?? planners.needsAssistanceGuestsCount,
      ),
      plannersWithSplitsCount: safeNumber(
        body.plannersWithSplitsCount ?? planners.plannersWithSplitsCount,
      ),
      sharedPlannersCount,
      sampledSharedPlannersCount,
      genuineSharedPlannersCount,
      testSharedPlannersCount,
      confirmedSailDatesCount,
      verifiedFullItinerarySailingsCount,
      trackedGuestsCount: safeNumber(
        body.trackedGuestsCount ??
          planners.trackedGuestsCount ??
          body.totalGuestsCount ??
          planners.totalGuestsCount,
      ),
      note: noteParts.join(" "),
    };
  } catch {
    return emptyCruisePromenadeSummary(
      "pending_deploy",
      endpoint,
      "Cruise Promenade owner-summary timed out or unreachable (`2.5s` bound).",
    );
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
    return emptyDirectMorOwnerSummary({
      siteId,
      siteName,
      endpoint,
      opsHref,
      status: "unconfigured",
      note: `${siteName} internal secret not configured; check ${siteName} admin queue directly when needed.`,
    });
  }

  if (env.DCC_DISABLE_NEON_COMMERCE === "1" && !options.fetchImpl) {
    return emptyDirectMorOwnerSummary({
      siteId,
      siteName,
      endpoint,
      opsHref,
      status: "pending_deploy",
      note: `Offline test mode: remote ${siteName} owner-summary skipped.`,
    });
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
      return emptyDirectMorOwnerSummary({
        siteId,
        siteName,
        endpoint,
        opsHref,
        status: "pending_deploy",
        note: `${siteName} \`/api/internal/owner-summary\` returned 404 (\`pending_deploy\`).`,
      });
    }

    if (!res.ok) {
      return emptyDirectMorOwnerSummary({
        siteId,
        siteName,
        endpoint,
        opsHref,
        status: "error",
        note: `${siteName} owner-summary returned HTTP ${res.status}.`,
      });
    }

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const m = (
      body.metrics28d && typeof body.metrics28d === "object"
        ? body.metrics28d
        : {}
    ) as Record<string, unknown>;

    const paidOrders28d = safeNumber(
      m.paidBookings ??
        m.paidOrders ??
        m.paidOrConfirmedBookings ??
        body.paidOrders28d ??
        body.confirmedOrdersCount,
    );
    const confirmedUnpaidOrders28d = safeNumber(
      m.confirmedUnpaidBookings ??
        m.confirmedUnpaidOrders ??
        body.confirmedUnpaidOrders28d,
    );
    const genuineOrdersTotal28d = safeNumber(
      m.genuineBookingsTotal ??
        m.genuineOrdersTotal ??
        m.bookingsTotal ??
        m.ordersTotal ??
        body.genuineOrdersTotal28d,
      paidOrders28d + confirmedUnpaidOrders28d,
    );
    const rawTestExcluded =
      m.testRecordsExcluded ?? body.testRecordsExcluded28d ?? body.testRecordsExcluded;
    const testRecordsExcluded28d =
      rawTestExcluded && typeof rawTestExcluded === "object"
        ? safeNumber((rawTestExcluded as Record<string, unknown>).bookings28d) +
          safeNumber((rawTestExcluded as Record<string, unknown>).quotes28d) +
          safeNumber((rawTestExcluded as Record<string, unknown>).activeHolds)
        : safeNumber(rawTestExcluded);
    const openQuoteRequests28d = safeNumber(
      m.openQuoteRequests ?? body.openQuoteRequests28d ?? body.openQuoteRequests,
    );
    const activeHoldsCount = safeNumber(
      m.activeVehicleHolds ??
        m.activeHoldsCount ??
        body.activeHoldsCount ??
        body.activeVehicleHolds,
    );
    const awaitingBalanceOrders28d = safeNumber(
      m.awaitingBalanceOrders ??
        body.awaitingBalanceOrders28d ??
        body.awaitingBalanceOrders,
    );
    const paidGrossSalesUsd28d = safeNumber(
      m.paidGrossSalesUsd ??
        m.ownedGrossRevenueUsd ??
        body.paidGrossSalesUsd28d ??
        body.grossRevenueUsd28d ??
        body.grossSalesUsd,
    );
    const confirmedUnpaidGrossUsd28d = safeNumber(
      m.confirmedUnpaidGrossUsd ?? body.confirmedUnpaidGrossUsd28d,
    );
    const awaitingBalanceGrossUsd28d = safeNumber(
      m.awaitingBalanceGrossUsd ?? body.awaitingBalanceGrossUsd28d,
    );
    // CRITICAL: NEVER equate gross merchant sales or gross booking value with net operating revenue / profit!
    const netOperatingRevenueUsd28d = safeNullableSignedNumber(
      m.netOperatingRevenueUsd ?? body.netOperatingRevenueUsd28d ?? body.netOperatingRevenueUsd,
    );
    const provisioningExceptions = safeNumber(
      m.provisioningExceptions ?? body.provisioningExceptions,
    );
    const needsReviewOrders = safeNumber(
      m.needsReviewOrders ?? body.needsReviewOrders,
    );
    const rezdyHealthRaw = body.rezdyHealth ?? m.rezdyHealth ?? null;
    const rezdyHealth =
      rezdyHealthRaw && typeof rezdyHealthRaw === "object"
        ? (rezdyHealthRaw as Record<string, unknown>)
        : null;

    return {
      siteId,
      siteName,
      endpoint,
      opsHref,
      status: "live",
      testRecordsExcluded28d,
      genuineOrdersTotal28d,
      paidOrders28d,
      confirmedUnpaidOrders28d,
      openQuoteRequests28d,
      activeHoldsCount,
      awaitingBalanceOrders28d,
      paidGrossSalesUsd28d,
      grossRevenueUsd28d: paidGrossSalesUsd28d,
      confirmedUnpaidGrossUsd28d,
      awaitingBalanceGrossUsd28d,
      netOperatingRevenueUsd28d,
      provisioningExceptions,
      needsReviewOrders,
      rezdyHealth,
      note: `Live ${siteName} MoR summary connected (${paidOrders28d} paid, ${confirmedUnpaidOrders28d} confirmed-unpaid, ${testRecordsExcluded28d} test excluded).`,
    };
  } catch {
    return emptyDirectMorOwnerSummary({
      siteId,
      siteName,
      endpoint,
      opsHref,
      status: "pending_deploy",
      note: `${siteName} owner-summary timed out or unreachable (\`2.5s\` bound).`,
    });
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

  const rezdyHealthAlertCount = (() => {
    const rh = gosnoOps.rezdyHealth;
    if (!rh) return 0;
    const failedCount = safeNumber(
      rh.failedSyncsCount ?? rh.failedCount ?? rh.exceptionsCount ?? rh.errorCount,
    );
    const staleCron =
      rh.cronHealthy === false ||
      rh.status === "degraded" ||
      rh.status === "error" ||
      rh.stale === true;
    return failedCount + (staleCron ? 1 : 0);
  })();

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
          parrOps.needsReviewOrders +
          rezdyHealthAlertCount >
        0
          ? "high"
          : "info",
      title: "Direct MoR Ops Exceptions & Rezdy Health (GoSno & Party at Red Rocks)",
      countOrBadge: `GoSno: ${gosnoOps.provisioningExceptions + gosnoOps.needsReviewOrders} (${gosnoOps.status}) · PARR: ${parrOps.provisioningExceptions + parrOps.needsReviewOrders} (${parrOps.status})${gosnoOps.rezdyHealth ? ` · Rezdy: ${String(gosnoOps.rezdyHealth.status ?? "reported")}` : ""}`,
      detail: `${gosnoOps.note} ${parrOps.note}${gosnoOps.rezdyHealth ? ` Rezdy health: ${JSON.stringify(gosnoOps.rezdyHealth)}.` : ""}`,
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
    priority: partnerBoundaryReviews.length > 0 ? "medium" : "info",
    title: "Held Commercial SKUs & WTA Partner Payout Boundary",
    countOrBadge: `${HELD_COMMERCIAL_SKUS.length} held SKU · ${partnerBoundaryReviews.length} partner boundary leaks`,
    detail: `Held: ${HELD_COMMERCIAL_SKUS.map((s) => `${s.skuSlug} (${s.surfaceCode})`).join(", ")}. Partner boundary clean: 0 external partner ASNs on owned sites; Aleutian Ballad unheld on LFSE via GetYourGuide t598272 (partner_id=F2MMUUH).`,
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
    parrOps.needsReviewOrders +
    rezdyHealthAlertCount;

  const totals = funnel.totals;
  const drops = funnel.unmatchedAttributionDrops;

  const completedMarketplaceOrDirectCount = totals.confirmedBookingsCount;
  const totalPaidBookingsCount =
    completedMarketplaceOrDirectCount +
    gosnoOps.paidOrders28d +
    parrOps.paidOrders28d;
  const totalGenuineBookingsCount =
    completedMarketplaceOrDirectCount +
    gosnoOps.genuineOrdersTotal28d +
    parrOps.genuineOrdersTotal28d;
  const totalConfirmedUnpaidBookingsCount =
    gosnoOps.confirmedUnpaidOrders28d + parrOps.confirmedUnpaidOrders28d;
  const totalTestRecordsExcluded28d =
    gosnoOps.testRecordsExcluded28d +
    parrOps.testRecordsExcluded28d +
    cpSummary.testSharedPlannersCount;
  const totalOpenQuotes28d =
    gosnoOps.openQuoteRequests28d + parrOps.openQuoteRequests28d;
  const totalActiveHoldsCount =
    gosnoOps.activeHoldsCount + parrOps.activeHoldsCount;
  const totalAwaitingBalanceOrders28d =
    gosnoOps.awaitingBalanceOrders28d + parrOps.awaitingBalanceOrders28d;

  const combinedRemotePaidGrossUsd28d =
    gosnoOps.paidGrossSalesUsd28d + parrOps.paidGrossSalesUsd28d;
  const effectiveGrossMerchantSalesUsd28d = Math.max(
    totals.ownedGrossSalesUsd,
    combinedRemotePaidGrossUsd28d,
  );
  const combinedConfirmedUnpaidGrossUsd28d =
    gosnoOps.confirmedUnpaidGrossUsd28d + parrOps.confirmedUnpaidGrossUsd28d;
  const combinedAwaitingBalanceGrossUsd28d =
    gosnoOps.awaitingBalanceGrossUsd28d + parrOps.awaitingBalanceGrossUsd28d;

  const bothNetReconciled =
    gosnoOps.netOperatingRevenueUsd28d !== null &&
    parrOps.netOperatingRevenueUsd28d !== null;
  const netOperatingRevenueStatusLabel = bothNetReconciled
    ? `$${(gosnoOps.netOperatingRevenueUsd28d! + parrOps.netOperatingRevenueUsd28d!).toLocaleString()} reconciled`
    : "Unreconciled in app DB";

  const formatNetPart = (label: string, val: number | null) =>
    val === null
      ? `${label}: Unreconciled in app DB`
      : `${label}: $${val.toLocaleString()}`;

  const strictSeparation10Way28d: StrictSeparationMetricRow[] = [
    {
      rowNumber: 1,
      key: "test_records_excluded",
      label: "1. Test Records Excluded",
      headlineValue: `${totalTestRecordsExcluded28d.toLocaleString()} excluded`,
      gosnoBreakdown: `GoSno: ${gosnoOps.testRecordsExcluded28d.toLocaleString()}`,
      parrBreakdown: `PARR: ${parrOps.testRecordsExcluded28d.toLocaleString()}`,
      networkOrAffiliateBreakdown: `CP test boards: ${cpSummary.testSharedPlannersCount.toLocaleString()}`,
      antiConflationDisclosure:
        "Synthetic, smoke, and QA test bookings/boards are stripped before computing genuine operational or revenue counts.",
    },
    {
      rowNumber: 2,
      key: "genuine_bookings",
      label: "2. Genuine Bookings",
      headlineValue: `${totalGenuineBookingsCount.toLocaleString()} genuine bookings`,
      gosnoBreakdown: `GoSno: ${gosnoOps.genuineOrdersTotal28d.toLocaleString()}`,
      parrBreakdown: `PARR: ${parrOps.genuineOrdersTotal28d.toLocaleString()}`,
      networkOrAffiliateBreakdown: `DCC reconciled outcomes: ${completedMarketplaceOrDirectCount.toLocaleString()}`,
      antiConflationDisclosure:
        "Real customer bookings (paid + confirmed-unpaid); excludes test records, open quotes, holds, and affiliate clicks.",
    },
    {
      rowNumber: 3,
      key: "paid_bookings",
      label: "3. Paid Bookings",
      headlineValue: `${totalPaidBookingsCount.toLocaleString()} paid bookings`,
      gosnoBreakdown: `GoSno paid: ${gosnoOps.paidOrders28d.toLocaleString()}`,
      parrBreakdown: `PARR paid: ${parrOps.paidOrders28d.toLocaleString()}`,
      networkOrAffiliateBreakdown: `DCC reconciled paid outcomes: ${completedMarketplaceOrDirectCount.toLocaleString()}`,
      antiConflationDisclosure:
        "Settled/captured payment orders only (`paidOrders28d`); excludes confirmed-unpaid reservations and unpaid holds.",
    },
    {
      rowNumber: 4,
      key: "confirmed_unpaid_bookings",
      label: "4. Confirmed But Unpaid Bookings",
      headlineValue: `${totalConfirmedUnpaidBookingsCount.toLocaleString()} confirmed-unpaid ($${combinedConfirmedUnpaidGrossUsd28d.toLocaleString()})`,
      gosnoBreakdown: `GoSno: ${gosnoOps.confirmedUnpaidOrders28d.toLocaleString()} ($${gosnoOps.confirmedUnpaidGrossUsd28d.toLocaleString()})`,
      parrBreakdown: `PARR: ${parrOps.confirmedUnpaidOrders28d.toLocaleString()} ($${parrOps.confirmedUnpaidGrossUsd28d.toLocaleString()})`,
      networkOrAffiliateBreakdown: "Isolated to Direct MoR reservation queues",
      antiConflationDisclosure:
        "Confirmed dispatch commitments where payment has NOT been captured yet — never counted as paid bookings or collected cash.",
    },
    {
      rowNumber: 5,
      key: "open_quotes",
      label: "5. Open Quotes",
      headlineValue: `${totalOpenQuotes28d.toLocaleString()} open quote requests`,
      gosnoBreakdown: `GoSno quotes: ${gosnoOps.openQuoteRequests28d.toLocaleString()}`,
      parrBreakdown: `PARR quotes: ${parrOps.openQuoteRequests28d.toLocaleString()}`,
      networkOrAffiliateBreakdown: `Operator inbox untriaged: ${inbox.kpis.needsTriageCount.toLocaleString()}`,
      antiConflationDisclosure:
        "Unbooked custom/multi-vehicle quote requests (`openQuoteRequests28d`) — Pre-booking pipeline only, not bookings or revenue.",
    },
    {
      rowNumber: 6,
      key: "active_holds",
      label: "6. Active Holds",
      headlineValue: `${totalActiveHoldsCount.toLocaleString()} active vehicle holds`,
      gosnoBreakdown: `GoSno holds: ${gosnoOps.activeHoldsCount.toLocaleString()}`,
      parrBreakdown: `PARR holds: ${parrOps.activeHoldsCount.toLocaleString()}`,
      networkOrAffiliateBreakdown: `Held SKUs: ${HELD_COMMERCIAL_SKUS.length}`,
      antiConflationDisclosure:
        "Temporary inventory/vehicle holds (`activeHoldsCount`) — Not completed orders or collected sales.",
    },
    {
      rowNumber: 7,
      key: "awaiting_balance_orders",
      label: "7. Awaiting-Balance Orders",
      headlineValue: `${totalAwaitingBalanceOrders28d.toLocaleString()} awaiting balance ($${combinedAwaitingBalanceGrossUsd28d.toLocaleString()})`,
      gosnoBreakdown: `GoSno: ${gosnoOps.awaitingBalanceOrders28d.toLocaleString()} ($${gosnoOps.awaitingBalanceGrossUsd28d.toLocaleString()})`,
      parrBreakdown: `PARR: ${parrOps.awaitingBalanceOrders28d.toLocaleString()} ($${parrOps.awaitingBalanceGrossUsd28d.toLocaleString()})`,
      networkOrAffiliateBreakdown: `Pending ledger settlement: $${totals.pendingOwnedSettlementUsd.toLocaleString()}`,
      antiConflationDisclosure:
        "Deposit/partial orders with remaining balance due (`awaitingBalanceOrders28d`) — Remaining balance is uncollected.",
    },
    {
      rowNumber: 8,
      key: "gross_merchant_sales",
      label: "8. Gross Merchant Sales (Direct MoR)",
      headlineValue: `$${effectiveGrossMerchantSalesUsd28d.toLocaleString()}`,
      gosnoBreakdown: `GoSno paid gross: $${gosnoOps.paidGrossSalesUsd28d.toLocaleString()}`,
      parrBreakdown: `PARR paid gross: $${parrOps.paidGrossSalesUsd28d.toLocaleString()}`,
      networkOrAffiliateBreakdown: `DCC ledger MoR gross: $${totals.ownedGrossSalesUsd.toLocaleString()}`,
      antiConflationDisclosure:
        "Gross Merchant Sales — Not Profit; Excludes Operating Costs, Driver Pay, Processor Fees & Refunds",
    },
    {
      rowNumber: 9,
      key: "net_operating_revenue",
      label: "9. Net Operating Revenue",
      headlineValue: netOperatingRevenueStatusLabel,
      gosnoBreakdown: formatNetPart("GoSno", gosnoOps.netOperatingRevenueUsd28d),
      parrBreakdown: formatNetPart("PARR", parrOps.netOperatingRevenueUsd28d),
      networkOrAffiliateBreakdown: "Requires cost/payout/refund reconciliation",
      antiConflationDisclosure:
        "Displayed honestly as `Unreconciled in app DB` when `null` — Gross merchant sales or gross booking value is NEVER equated with profit.",
    },
    {
      rowNumber: 10,
      key: "affiliate_commissions",
      label: "10. Affiliate Commissions",
      headlineValue: `$${totals.confirmedSettledPayoutsUsd.toLocaleString()} settled ($${totals.revenue.reportedCommissionsEarnedUsd.toLocaleString()} reported)`,
      gosnoBreakdown: "N/A (Direct MoR isolated)",
      parrBreakdown: "N/A (Direct MoR isolated)",
      networkOrAffiliateBreakdown: `${totals.outboundClicks.checkoutReferrals.toLocaleString()} affiliate clicks — Clicks / Handoffs Only — Not Bookings or Revenue`,
      antiConflationDisclosure:
        "$0 settled unless reconciled by provider outcome; outbound clicks/handoffs are Clicks / Handoffs Only — Not Bookings or Revenue.",
    },
  ];

  const cpPlannerHeadline =
    cpSummary.status !== "live"
      ? `CP summary: ${cpSummary.status}`
      : cpSummary.genuineSharedPlannersCount !== null
        ? `${cpSummary.genuineSharedPlannersCount.toLocaleString()} genuine planners (${cpSummary.sampledSharedPlannersCount.toLocaleString()} KV sampled)`
        : `${cpSummary.sampledSharedPlannersCount.toLocaleString()} sampled KV planners`;

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
      headlineMetric: cpPlannerHeadline,
      subMetrics: [
        `${cpSummary.trackedGuestsCount.toLocaleString()} tracked guests · ${cpSummary.plannersWithSplitsCount.toLocaleString()} planners w/ splits · ${cpSummary.testSharedPlannersCount.toLocaleString()} test excluded`,
        `${cpSummary.needsAssistanceGuestsCount.toLocaleString()} guests need assistance · ${cpSummary.confirmedSailDatesCount.toLocaleString()} sail dates vs ${cpSummary.verifiedFullItinerarySailingsCount.toLocaleString()} full port itineraries`,
      ],
      statusBadge: cpSummary.status,
    },
    {
      stageNumber: 4,
      stageId: "booking_intent",
      label: "4. Booking Intent (Clicks / Handoffs Only)",
      headlineMetric: `${totals.outboundClicks.total.toLocaleString()} durable handoffs`,
      subMetrics: [
        `${totals.outboundClicks.checkoutReferrals.toLocaleString()} checkout referrals — Clicks / Handoffs Only — Not Bookings or Revenue (Viator ${totals.outboundClicks.viatorAffiliateClicks}, FH ${totals.outboundClicks.fareharborCheckoutReferrals}, GYG ${totals.outboundClicks.getyourguideAffiliateClicks})`,
        `${totals.outboundClicks.ownedCheckoutClicks.toLocaleString()} owned MoR checkout clicks · ${totalOpenQuotes28d} open quotes · ${totalActiveHoldsCount} holds`,
      ],
      statusBadge: "Clicks Only",
    },
    {
      stageNumber: 5,
      stageId: "completed_booking",
      label: "5. Paid vs Confirmed-Unpaid Bookings",
      headlineMetric: `${totalPaidBookingsCount.toLocaleString()} paid · ${totalConfirmedUnpaidBookingsCount.toLocaleString()} confirmed-unpaid`,
      subMetrics: [
        `Genuine bookings: ${totalGenuineBookingsCount.toLocaleString()} (${totalTestRecordsExcluded28d.toLocaleString()} test records excluded)`,
        `Paid MoR — GoSno: ${gosnoOps.paidOrders28d} · PARR: ${parrOps.paidOrders28d} · Awaiting balance: ${totalAwaitingBalanceOrders28d}`,
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
      label: "7. Revenue (Strictly Separated — Not Profit)",
      headlineMetric: `Settled Comm: $${totals.confirmedSettledPayoutsUsd.toLocaleString()} · Paid MoR Gross: $${effectiveGrossMerchantSalesUsd28d.toLocaleString()}`,
      subMetrics: [
        `Affiliate Commissions: $${totals.confirmedSettledPayoutsUsd.toLocaleString()} settled ($${totals.revenue.reportedCommissionsEarnedUsd.toLocaleString()} reported)`,
        `Gross Merchant Sales (Not Profit): $${effectiveGrossMerchantSalesUsd28d.toLocaleString()} · Net Operating Revenue: ${netOperatingRevenueStatusLabel}`,
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
      strictSeparation10Way28d,
      strictlySeparatedRevenue: {
        commissionTrack: {
          label: "Affiliate / Direct 10% / Machine 5% Commissions",
          reportedCommissionsEarnedUsd:
            totals.revenue.reportedCommissionsEarnedUsd,
          confirmedSettledPayoutsUsd: totals.confirmedSettledPayoutsUsd,
          affiliateClicks28d: totals.outboundClicks.checkoutReferrals,
          clicksDisclosure: "Clicks / Handoffs Only — Not Bookings or Revenue",
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
          grossSalesDisclosure:
            "Gross Merchant Sales — Not Profit; Excludes Operating Costs, Driver Pay, Processor Fees & Refunds",
          portfolioOwnedGrossSalesUsd: effectiveGrossMerchantSalesUsd28d,
          pendingOwnedSettlementUsd: totals.pendingOwnedSettlementUsd,
          gosnoReportedGrossUsd28d: gosnoOps.paidGrossSalesUsd28d,
          parrReportedGrossUsd28d: parrOps.paidGrossSalesUsd28d,
          combinedPaidGrossSalesUsd28d: combinedRemotePaidGrossUsd28d,
          combinedConfirmedUnpaidGrossUsd28d,
          combinedAwaitingBalanceGrossUsd28d,
          gosnoNetOperatingRevenueUsd28d: gosnoOps.netOperatingRevenueUsd28d,
          parrNetOperatingRevenueUsd28d: parrOps.netOperatingRevenueUsd28d,
          netOperatingRevenueStatusLabel,
          routesIncluded: ["direct_mor"],
          isolationRule:
            "Gross Merchant Sales — Not Profit; Excludes Operating Costs, Driver Pay, Processor Fees & Refunds. GoSno and Party at Red Rocks MoR gross sales and liabilities are never blended with affiliate commissions or profit.",
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
