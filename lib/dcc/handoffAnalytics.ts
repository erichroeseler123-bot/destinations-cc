import {
  SATELLITE_IDS,
  listAllSatelliteHandoffSummaries,
  type DccSatelliteId,
  type SatelliteHandoffSummary,
} from "@/lib/dcc/satelliteHandoffs";

export type HandoffAnalyticsSnapshot = {
  totalHandoffs: number;
  completed: number;
  started: number;
  leads: number;
  failed: number;
  degraded: number;
  forwardedToPartner: number;
  acceptedFromPartner: number;
  partnerCompleted: number;
  partnerFailed: number;
  grossRevenue: number;
  partnerRevenue: number;
  bySatellite: Record<DccSatelliteId, number>;
  bySourcePage: Array<{ key: string; count: number }>;
  bySourceSlug: Array<{ key: string; count: number }>;
  byTopicSlug: Array<{ key: string; count: number }>;
  byProductSlug: Array<{ key: string; count: number }>;
  byPartnerReason: Array<{ key: string; count: number }>;
  byPartySizeBucket: Array<{ key: string; count: number }>;
  byVenueSlug: Array<{ key: string; count: number }>;
  byPortSlug: Array<{ key: string; count: number }>;
  byLifecycleState: Array<{ key: string; count: number }>;
  byArtist: Array<{ key: string; count: number }>;
  byEventLabel: Array<{ key: string; count: number }>;
  byEmbedDomain: Array<{ key: string; count: number }>;
  byEmbedPath: Array<{ key: string; count: number }>;
  byWidgetPlacement: Array<{ key: string; count: number }>;
  byWidgetId: Array<{ key: string; count: number }>;
  degradedContexts: Array<{ key: string; count: number }>;
  byPartnerRoute: Array<{ key: string; count: number }>;
  topOriginPages: Array<{
    key: string;
    viewed: number;
    started: number;
    completions: number;
    revenue: number;
    score: number;
  }>;
  topConvertingEmbedDomains: Array<{
    key: string;
    viewed: number;
    started: number;
    completions: number;
    revenue: number;
    conversionRate: number;
    score: number;
  }>;
  topPlacements: Array<{
    key: string;
    domain: string | null;
    viewed: number;
    started: number;
    completions: number;
    revenue: number;
    score: number;
  }>;
  weakestEmbeds: Array<{
    key: string;
    domain: string | null;
    viewed: number;
    starts: number;
    completions: number;
    leakageRate: number;
    score: number;
  }>;
  productPortWinners: Array<{
    key: string;
    productSlug: string | null;
    portSlug: string | null;
    completions: number;
    partnerCompletions: number;
    revenue: number;
    score: number;
  }>;
  leakagePoints: Array<{
    key: string;
    viewed: number;
    leads: number;
    started: number;
    completions: number;
    failed: number;
    leakageRate: number;
    score: number;
  }>;
  operatorWinningPages: Array<{
    key: string;
    completions: number;
    partnerCompletions: number;
    revenue: number;
    score: number;
  }>;
  operatorLeakingLanes: Array<{
    key: string;
    failures: number;
    degraded: number;
    brokenLoops: number;
    score: number;
  }>;
  partnerScorecards: Array<{
    satelliteId: DccSatelliteId;
    completions: number;
    partnerCompletions: number;
    failures: number;
    degraded: number;
    forwarded: number;
    accepted: number;
    revenue: number;
    score: number;
  }>;
  urgentAlerts: Array<{
    id: string;
    severity: "high" | "medium";
    kind: "broken_loop" | "missing_outcome" | "degraded_lane";
    label: string;
    detail: string;
    handoffId?: string;
  }>;
  brokenPartnerLoops: Array<{
    handoffId: string;
    route: string;
    sourcePage: string | null;
    lastEventAt: string;
  }>;
  expansionPriorityPages: Array<{
    key: string;
    score: number;
    completions: number;
    partnerCompletions: number;
    failures: number;
    revenue: number;
  }>;
  seoSourceSlugOpportunities: Array<{
    key: string;
    score: number;
    completions: number;
    partnerCompletions: number;
    failures: number;
  }>;
  seoTopicOpportunities: Array<{
    key: string;
    score: number;
    completions: number;
    partnerCompletions: number;
    failures: number;
  }>;
  seoProductOpportunities: Array<{
    key: string;
    score: number;
    completions: number;
    partnerCompletions: number;
  }>;
  seoHubOpportunities: Array<{
    key: string;
    score: number;
    type: "port" | "venue";
    completions: number;
    partnerCompletions: number;
    failures: number;
  }>;
  highValuePages: Array<{
    key: string;
    revenue: number;
    bookings: number;
    partnerBookings: number;
  }>;
  revenueByProduct: Array<{
    key: string;
    revenue: number;
    bookings: number;
    partnerBookings: number;
  }>;
  revenueByPartnerReason: Array<{
    key: string;
    revenue: number;
    bookings: number;
    partnerBookings: number;
  }>;
  revenueByPartySizeBucket: Array<{
    key: string;
    revenue: number;
    bookings: number;
    averageOrderValue: number;
  }>;
  highRevenueHubs: Array<{
    key: string;
    type: "port" | "venue";
    revenue: number;
    bookings: number;
    partnerBookings: number;
  }>;
  premiumGroupPages: Array<{
    key: string;
    revenue: number;
    bookings: number;
    averagePartySize: number;
  }>;
  updatedAt: string;
};

export type RecommendationAction = {
  id: string;
  label: string;
  href: string;
  kind: "internal" | "external";
  score: number;
  reason: string;
  laneState?: "healthy" | "degraded" | "fallback";
};

function countByKey(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function getMetadataString(
  summary: SatelliteHandoffSummary,
  key: string
): string | null {
  const value = summary.metadata?.[key];
  return typeof value === "string" && value.trim().length ? value.trim() : null;
}

function groupByHandoffId(summaries: SatelliteHandoffSummary[]) {
  const grouped = new Map<string, SatelliteHandoffSummary[]>();
  for (const summary of summaries) {
    const existing = grouped.get(summary.handoffId);
    if (existing) existing.push(summary);
    else grouped.set(summary.handoffId, [summary]);
  }
  return grouped;
}

function getBrokenPartnerLoops(summaries: SatelliteHandoffSummary[]) {
  return Array.from(groupByHandoffId(summaries).entries())
    .flatMap(([handoffId, group]) => {
      const forwarded = group.find((summary) => summary.latestEventType === "forwarded_to_partner");
      const accepted = group.find((summary) => summary.latestEventType === "accepted_from_partner");
      const outcome = group.find(
        (summary) =>
          summary.latestEventType === "partner_booking_completed" ||
          summary.latestEventType === "partner_booking_failed"
      );

      if (!forwarded || accepted || outcome) return [];

      return [
        {
          handoffId,
          route: `${forwarded.partner?.fromSite || "unknown"}->${forwarded.partner?.toSite || "unknown"}`,
          sourcePage: forwarded.attribution.sourcePage,
          lastEventAt: forwarded.lastEventAt,
        },
      ];
    })
    .sort((a, b) => new Date(b.lastEventAt).getTime() - new Date(a.lastEventAt).getTime());
}

function getMissingOutcomeLoops(summaries: SatelliteHandoffSummary[]) {
  return Array.from(groupByHandoffId(summaries).entries())
    .flatMap(([handoffId, group]) => {
      const accepted = group.find((summary) => summary.latestEventType === "accepted_from_partner");
      const outcome = group.find(
        (summary) =>
          summary.latestEventType === "partner_booking_completed" ||
          summary.latestEventType === "partner_booking_failed"
      );

      if (!accepted || outcome) return [];

      return [
        {
          handoffId,
          route: `${accepted.partner?.fromSite || "unknown"}->${accepted.partner?.toSite || "unknown"}`,
          sourcePage: accepted.attribution.sourcePage,
          lastEventAt: accepted.lastEventAt,
        },
      ];
    })
    .sort((a, b) => new Date(b.lastEventAt).getTime() - new Date(a.lastEventAt).getTime());
}

function getExpansionPriorityPages(summaries: SatelliteHandoffSummary[]) {
  const rows = new Map<
    string,
    { score: number; completions: number; partnerCompletions: number; failures: number; revenue: number }
  >();

  for (const summary of summaries) {
    const key = summary.attribution.sourcePage || summary.attribution.sourceSlug || null;
    if (!key) continue;

    const row = rows.get(key) || {
      score: 0,
      completions: 0,
      partnerCompletions: 0,
      failures: 0,
      revenue: 0,
    };
    const amount = summary.booking.amount || 0;
    const revenueWeight = Math.min(10, Math.round(amount / 100));

    if (summary.latestEventType === "booking_completed") {
      row.score += 5 + revenueWeight;
      row.completions += 1;
      row.revenue += amount;
    } else if (summary.latestEventType === "partner_booking_completed") {
      row.score += 7 + revenueWeight;
      row.partnerCompletions += 1;
      row.revenue += amount;
    } else if (
      summary.latestEventType === "booking_failed" ||
      summary.latestEventType === "partner_booking_failed"
    ) {
      row.score -= 3;
      row.failures += 1;
    } else if (summary.latestEventType === "booking_started") {
      row.score += 2;
    } else if (summary.latestEventType === "lead_captured") {
      row.score += 1;
    }

    rows.set(key, row);
  }

  return Array.from(rows.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getSeoOpportunityRows(
  summaries: SatelliteHandoffSummary[],
  keyFn: (summary: SatelliteHandoffSummary) => string | null,
  opts?: { slice?: number }
) {
  const rows = new Map<
    string,
    { score: number; completions: number; partnerCompletions: number; failures: number }
  >();

  for (const summary of summaries) {
    const key = keyFn(summary);
    if (!key) continue;

    const row = rows.get(key) || {
      score: 0,
      completions: 0,
      partnerCompletions: 0,
      failures: 0,
    };

    if (summary.latestEventType === "booking_completed") {
      row.score += 5;
      row.completions += 1;
    } else if (summary.latestEventType === "partner_booking_completed") {
      row.score += 7;
      row.partnerCompletions += 1;
    } else if (summary.latestEventType === "booking_started") {
      row.score += 2;
    } else if (summary.latestEventType === "lead_captured") {
      row.score += 1;
    } else if (
      summary.latestEventType === "booking_failed" ||
      summary.latestEventType === "partner_booking_failed"
    ) {
      row.score -= 3;
      row.failures += 1;
    }

    rows.set(key, row);
  }

  return Array.from(rows.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.score - a.score)
    .slice(0, opts?.slice || 10);
}

function getSeoHubOpportunities(summaries: SatelliteHandoffSummary[]) {
  const venueRows = getSeoOpportunityRows(
    summaries,
    (summary) => summary.booking.venueSlug,
    { slice: 10 }
  ).map((row) => ({ ...row, type: "venue" as const }));

  const portRows = getSeoOpportunityRows(
    summaries,
    (summary) => summary.booking.portSlug,
    { slice: 10 }
  ).map((row) => ({ ...row, type: "port" as const }));

  return [...venueRows, ...portRows].sort((a, b) => b.score - a.score).slice(0, 10);
}

function getHighValuePages(summaries: SatelliteHandoffSummary[]) {
  const rows = new Map<string, { revenue: number; bookings: number; partnerBookings: number }>();

  for (const summary of summaries) {
    const key = summary.attribution.sourcePage || summary.attribution.sourceSlug || null;
    if (!key) continue;
    const amount = summary.booking.amount || 0;
    if (
      summary.latestEventType !== "booking_completed" &&
      summary.latestEventType !== "partner_booking_completed"
    ) {
      continue;
    }

    const row = rows.get(key) || { revenue: 0, bookings: 0, partnerBookings: 0 };
    row.revenue += amount;
    if (summary.latestEventType === "partner_booking_completed") row.partnerBookings += 1;
    else row.bookings += 1;
    rows.set(key, row);
  }

  return Array.from(rows.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

function getRevenueRows(
  summaries: SatelliteHandoffSummary[],
  keyFn: (summary: SatelliteHandoffSummary) => string | null,
  opts?: { slice?: number }
) {
  const rows = new Map<string, { revenue: number; bookings: number; partnerBookings: number }>();

  for (const summary of summaries) {
    const key = keyFn(summary);
    if (!key) continue;
    if (
      summary.latestEventType !== "booking_completed" &&
      summary.latestEventType !== "partner_booking_completed"
    ) {
      continue;
    }

    const row = rows.get(key) || { revenue: 0, bookings: 0, partnerBookings: 0 };
    row.revenue += summary.booking.amount || 0;
    if (summary.latestEventType === "partner_booking_completed") row.partnerBookings += 1;
    else row.bookings += 1;
    rows.set(key, row);
  }

  return Array.from(rows.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, opts?.slice || 10);
}

function getPartySizeBucket(summary: SatelliteHandoffSummary) {
  const size = summary.traveler.partySize || summary.booking.quantity || null;
  if (!size) return null;
  if (size === 1) return "solo";
  if (size === 2) return "couple";
  if (size <= 4) return "small-group";
  return "group";
}

function getRevenueByPartySizeBucket(summaries: SatelliteHandoffSummary[]) {
  const rows = new Map<string, { revenue: number; bookings: number }>();

  for (const summary of summaries) {
    const key = getPartySizeBucket(summary);
    if (!key) continue;
    if (
      summary.latestEventType !== "booking_completed" &&
      summary.latestEventType !== "partner_booking_completed"
    ) {
      continue;
    }

    const row = rows.get(key) || { revenue: 0, bookings: 0 };
    row.revenue += summary.booking.amount || 0;
    row.bookings += 1;
    rows.set(key, row);
  }

  return Array.from(rows.entries())
    .map(([key, value]) => ({
      key,
      revenue: value.revenue,
      bookings: value.bookings,
      averageOrderValue: value.bookings ? Math.round(value.revenue / value.bookings) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

function getHighRevenueHubs(summaries: SatelliteHandoffSummary[]) {
  const venueRows = getRevenueRows(summaries, (summary) => summary.booking.venueSlug, { slice: 10 }).map(
    (row) => ({ ...row, type: "venue" as const })
  );
  const portRows = getRevenueRows(summaries, (summary) => summary.booking.portSlug, { slice: 10 }).map(
    (row) => ({ ...row, type: "port" as const })
  );
  return [...venueRows, ...portRows].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
}

function getPremiumGroupPages(summaries: SatelliteHandoffSummary[]) {
  const rows = new Map<string, { revenue: number; bookings: number; totalPartySize: number }>();

  for (const summary of summaries) {
    const key = summary.attribution.sourcePage || summary.attribution.sourceSlug || null;
    if (!key) continue;
    if (
      summary.latestEventType !== "booking_completed" &&
      summary.latestEventType !== "partner_booking_completed"
    ) {
      continue;
    }

    const size = summary.traveler.partySize || summary.booking.quantity || 0;
    if (size < 3) continue;

    const row = rows.get(key) || { revenue: 0, bookings: 0, totalPartySize: 0 };
    row.revenue += summary.booking.amount || 0;
    row.bookings += 1;
    row.totalPartySize += size;
    rows.set(key, row);
  }

  return Array.from(rows.entries())
    .map(([key, value]) => ({
      key,
      revenue: value.revenue,
      bookings: value.bookings,
      averagePartySize: value.bookings ? Number((value.totalPartySize / value.bookings).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

function getOperatorWinningPages(summaries: SatelliteHandoffSummary[]) {
  return getExpansionPriorityPages(summaries)
    .map((row) => ({
      key: row.key,
      completions: row.completions,
      partnerCompletions: row.partnerCompletions,
      revenue: row.revenue,
      score: row.score,
    }))
    .sort((a, b) => {
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      return b.score - a.score;
    })
    .slice(0, 10);
}

function summarizeFunnelRows(
  summaries: SatelliteHandoffSummary[],
  keyFn: (summary: SatelliteHandoffSummary) => string | null
) {
  const rows = new Map<
    string,
    {
      viewed: number;
      leads: number;
      started: number;
      completions: number;
      partnerCompletions: number;
      failed: number;
      revenue: number;
    }
  >();

  for (const summary of summaries) {
    const key = keyFn(summary);
    if (!key) continue;

    const row = rows.get(key) || {
      viewed: 0,
      leads: 0,
      started: 0,
      completions: 0,
      partnerCompletions: 0,
      failed: 0,
      revenue: 0,
    };

    if (summary.latestEventType === "handoff_viewed") row.viewed += 1;
    if (summary.latestEventType === "lead_captured") row.leads += 1;
    if (summary.latestEventType === "booking_started") row.started += 1;
    if (summary.latestEventType === "booking_completed") {
      row.completions += 1;
      row.revenue += summary.booking.amount || 0;
    }
    if (summary.latestEventType === "partner_booking_completed") {
      row.partnerCompletions += 1;
      row.revenue += summary.booking.amount || 0;
    }
    if (
      summary.latestEventType === "booking_failed" ||
      summary.latestEventType === "partner_booking_failed"
    ) {
      row.failed += 1;
    }

    rows.set(key, row);
  }

  return rows;
}

function getTopOriginPages(summaries: SatelliteHandoffSummary[]) {
  return Array.from(
    summarizeFunnelRows(
      summaries,
      (summary) => summary.attribution.sourcePage || summary.attribution.sourceSlug
    ).entries()
  )
    .map(([key, value]) => ({
      key,
      viewed: value.viewed,
      started: value.started,
      completions: value.completions + value.partnerCompletions,
      revenue: value.revenue,
      score:
        value.revenue +
        value.completions * 200 +
        value.partnerCompletions * 250 +
        value.started * 25 +
        value.viewed * 5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getTopConvertingEmbedDomains(summaries: SatelliteHandoffSummary[]) {
  return Array.from(
    summarizeFunnelRows(summaries, (summary) => getMetadataString(summary, "embedDomain")).entries()
  )
    .map(([key, value]) => {
      const totalCompletions = value.completions + value.partnerCompletions;
      const denominator = value.started || value.viewed || 1;
      return {
        key,
        viewed: value.viewed,
        started: value.started,
        completions: totalCompletions,
        revenue: value.revenue,
        conversionRate: Number((totalCompletions / denominator).toFixed(3)),
        score:
          value.revenue +
          totalCompletions * 200 +
          value.started * 25 +
          value.viewed * 2,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getTopPlacements(summaries: SatelliteHandoffSummary[]) {
  const rows = summarizeFunnelRows(summaries, (summary) => {
    const embedPath = getMetadataString(summary, "embedPath");
    if (!embedPath) return null;
    const domain = getMetadataString(summary, "embedDomain");
    const placement = getMetadataString(summary, "widgetPlacement");
    return [domain || "unknown-domain", embedPath, placement || "default"].join(" | ");
  });

  return Array.from(rows.entries())
    .map(([key, value]) => {
      const [domain] = key.split(" | ");
      const completions = value.completions + value.partnerCompletions;
      return {
        key,
        domain: domain || null,
        viewed: value.viewed,
        started: value.started,
        completions,
        revenue: value.revenue,
        score:
          value.revenue +
          completions * 220 +
          value.started * 20 +
          value.viewed * 3,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getWeakestEmbeds(summaries: SatelliteHandoffSummary[]) {
  const rows = summarizeFunnelRows(summaries, (summary) => {
    const domain = getMetadataString(summary, "embedDomain");
    if (!domain) return null;
    const embedPath = getMetadataString(summary, "embedPath") || "/";
    const placement = getMetadataString(summary, "widgetPlacement") || "default";
    return [domain, embedPath, placement].join(" | ");
  });

  return Array.from(rows.entries())
    .map(([key, value]) => {
      const [domain] = key.split(" | ");
      const starts = value.started;
      const completions = value.completions + value.partnerCompletions;
      const base = Math.max(value.viewed, starts, 1);
      const leakageRate = Number(((base - completions) / base).toFixed(3));
      return {
        key,
        domain: domain || null,
        viewed: value.viewed,
        starts,
        completions,
        leakageRate,
        score: value.viewed * 4 + starts * 5 - completions * 12 + value.failed * 10,
      };
    })
    .filter((row) => row.viewed > 0 || row.starts > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getProductPortWinners(summaries: SatelliteHandoffSummary[]) {
  const rows = new Map<
    string,
    {
      productSlug: string | null;
      portSlug: string | null;
      completions: number;
      partnerCompletions: number;
      revenue: number;
    }
  >();

  for (const summary of summaries) {
    const productSlug = summary.booking.productSlug || null;
    const portSlug = summary.booking.portSlug || null;
    if (!productSlug && !portSlug) continue;
    if (
      summary.latestEventType !== "booking_completed" &&
      summary.latestEventType !== "partner_booking_completed"
    ) {
      continue;
    }

    const key = `${productSlug || "unknown-product"} | ${portSlug || "unknown-port"}`;
    const row = rows.get(key) || {
      productSlug,
      portSlug,
      completions: 0,
      partnerCompletions: 0,
      revenue: 0,
    };
    if (summary.latestEventType === "partner_booking_completed") row.partnerCompletions += 1;
    else row.completions += 1;
    row.revenue += summary.booking.amount || 0;
    rows.set(key, row);
  }

  return Array.from(rows.entries())
    .map(([key, value]) => ({
      key,
      ...value,
      score: value.revenue + value.completions * 180 + value.partnerCompletions * 220,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getLeakagePoints(summaries: SatelliteHandoffSummary[]) {
  return Array.from(
    summarizeFunnelRows(summaries, (summary) => {
      const domain = getMetadataString(summary, "embedDomain");
      const path = getMetadataString(summary, "embedPath");
      if (domain || path) return [domain || "unknown-domain", path || "/"].join(" | ");
      return summary.attribution.sourcePage || summary.attribution.sourceSlug;
    }).entries()
  )
    .map(([key, value]) => {
      const denominator = Math.max(value.viewed, value.leads, value.started, 1);
      const completions = value.completions + value.partnerCompletions;
      const leakageRate = Number(((denominator - completions) / denominator).toFixed(3));
      return {
        key,
        viewed: value.viewed,
        leads: value.leads,
        started: value.started,
        completions,
        failed: value.failed,
        leakageRate,
        score: value.failed * 12 + (value.started - completions) * 6 + (value.viewed - value.started) * 2,
      };
    })
    .filter((row) => row.viewed > 0 || row.started > 0 || row.leads > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getOperatorLeakingLanes(
  summaries: SatelliteHandoffSummary[],
  brokenPartnerLoops: Array<{ handoffId: string; route: string }>
) {
  const rows = new Map<string, { failures: number; degraded: number; brokenLoops: number; score: number }>();

  for (const summary of summaries) {
    const key =
      summary.booking.venueSlug ||
      summary.booking.portSlug ||
      summary.booking.citySlug ||
      summary.attribution.sourcePage ||
      summary.satelliteId;
    const row = rows.get(key) || { failures: 0, degraded: 0, brokenLoops: 0, score: 0 };

    if (
      summary.latestEventType === "booking_failed" ||
      summary.latestEventType === "partner_booking_failed"
    ) {
      row.failures += 1;
      row.score += 3;
    }
    if (summary.degraded) {
      row.degraded += 1;
      row.score += 2;
    }

    rows.set(key, row);
  }

  for (const loop of brokenPartnerLoops) {
    const key = loop.route;
    const row = rows.get(key) || { failures: 0, degraded: 0, brokenLoops: 0, score: 0 };
    row.brokenLoops += 1;
    row.score += 4;
    rows.set(key, row);
  }

  return Array.from(rows.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getPartnerScorecards(summaries: SatelliteHandoffSummary[]) {
  const rows = new Map<
    DccSatelliteId,
    {
      completions: number;
      partnerCompletions: number;
      failures: number;
      degraded: number;
      forwarded: number;
      accepted: number;
      revenue: number;
      score: number;
    }
  >();

  for (const satelliteId of SATELLITE_IDS) {
    rows.set(satelliteId, {
      completions: 0,
      partnerCompletions: 0,
      failures: 0,
      degraded: 0,
      forwarded: 0,
      accepted: 0,
      revenue: 0,
      score: 0,
    });
  }

  for (const summary of summaries) {
    const row = rows.get(summary.satelliteId)!;
    if (summary.latestEventType === "booking_completed") {
      row.completions += 1;
      row.revenue += summary.booking.amount || 0;
      row.score += 5;
    }
    if (summary.latestEventType === "partner_booking_completed") {
      row.partnerCompletions += 1;
      row.revenue += summary.booking.amount || 0;
      row.score += 7;
    }
    if (
      summary.latestEventType === "booking_failed" ||
      summary.latestEventType === "partner_booking_failed"
    ) {
      row.failures += 1;
      row.score -= 4;
    }
    if (summary.latestEventType === "forwarded_to_partner") {
      row.forwarded += 1;
      row.score += 1;
    }
    if (summary.latestEventType === "accepted_from_partner") {
      row.accepted += 1;
      row.score += 2;
    }
    if (summary.degraded) {
      row.degraded += 1;
      row.score -= 2;
    }
  }

  return Array.from(rows.entries())
    .map(([satelliteId, value]) => ({ satelliteId, ...value }))
    .sort((a, b) => b.score - a.score);
}

function getUrgentAlerts(
  summaries: SatelliteHandoffSummary[],
  brokenPartnerLoops: Array<{ handoffId: string; route: string; sourcePage: string | null }>,
  missingOutcomeLoops: Array<{ handoffId: string; route: string; sourcePage: string | null }>
) {
  const alerts: HandoffAnalyticsSnapshot["urgentAlerts"] = [];

  for (const loop of brokenPartnerLoops.slice(0, 5)) {
    alerts.push({
      id: `broken:${loop.handoffId}`,
      severity: "high",
      kind: "broken_loop",
      label: loop.route,
      detail: `Forwarded traffic from ${loop.route} has no downstream acceptance yet.`,
      handoffId: loop.handoffId,
    });
  }

  for (const loop of missingOutcomeLoops.slice(0, 5)) {
    alerts.push({
      id: `missing:${loop.handoffId}`,
      severity: "medium",
      kind: "missing_outcome",
      label: loop.route,
      detail: `Accepted partner traffic from ${loop.route} still has no final booking outcome.`,
      handoffId: loop.handoffId,
    });
  }

  const degradedRows = countByKey(
    summaries
      .filter((summary) => summary.degraded)
      .map((summary) => summary.booking.venueSlug || summary.booking.portSlug || summary.satelliteId)
  );
  for (const row of degradedRows.slice(0, 3)) {
    alerts.push({
      id: `degraded:${row.key}`,
      severity: "medium",
      kind: "degraded_lane",
      label: row.key,
      detail: `Degradation signals are clustering on ${row.key}.`,
    });
  }

  return alerts.slice(0, 8);
}

function summarizeStatuses(summaries: SatelliteHandoffSummary[]) {
  let completed = 0;
  let started = 0;
  let leads = 0;
  let failed = 0;
  let degraded = 0;
  let forwardedToPartner = 0;
  let acceptedFromPartner = 0;
  let partnerCompleted = 0;
  let partnerFailed = 0;
  let grossRevenue = 0;
  let partnerRevenue = 0;

  for (const summary of summaries) {
    if (summary.latestEventType === "booking_completed") completed += 1;
    if (summary.latestEventType === "booking_started") started += 1;
    if (summary.latestEventType === "lead_captured") leads += 1;
    if (summary.latestEventType === "booking_failed") failed += 1;
    if (summary.degraded) degraded += 1;
    if (summary.latestEventType === "forwarded_to_partner") forwardedToPartner += 1;
    if (summary.latestEventType === "accepted_from_partner") acceptedFromPartner += 1;
    if (summary.latestEventType === "partner_booking_completed") partnerCompleted += 1;
    if (summary.latestEventType === "partner_booking_failed") partnerFailed += 1;
    if (summary.latestEventType === "booking_completed") grossRevenue += summary.booking.amount || 0;
    if (summary.latestEventType === "partner_booking_completed") {
      grossRevenue += summary.booking.amount || 0;
      partnerRevenue += summary.booking.amount || 0;
    }
  }

  return {
    completed,
    started,
    leads,
    failed,
    degraded,
    forwardedToPartner,
    acceptedFromPartner,
    partnerCompleted,
    partnerFailed,
    grossRevenue,
    partnerRevenue,
  };
}

export function getHandoffAnalyticsSnapshot(limit = 300): HandoffAnalyticsSnapshot {
  const summaries = listAllSatelliteHandoffSummaries(limit);
  const bySatellite = Object.fromEntries(SATELLITE_IDS.map((satelliteId) => [satelliteId, 0])) as Record<
    DccSatelliteId,
    number
  >;

  for (const summary of summaries) {
    bySatellite[summary.satelliteId] += 1;
  }

  const statusCounts = summarizeStatuses(summaries);
  const brokenPartnerLoops = getBrokenPartnerLoops(summaries);
  const missingOutcomeLoops = getMissingOutcomeLoops(summaries);

  return {
    totalHandoffs: summaries.length,
    ...statusCounts,
    bySatellite,
    bySourcePage: countByKey(summaries.map((summary) => summary.attribution.sourcePage)),
    bySourceSlug: countByKey(summaries.map((summary) => summary.attribution.sourceSlug)),
    byTopicSlug: countByKey(summaries.map((summary) => summary.attribution.topicSlug)),
    byProductSlug: countByKey(summaries.map((summary) => summary.booking.productSlug)),
    byPartnerReason: countByKey(summaries.map((summary) => summary.partner?.reason)),
    byPartySizeBucket: countByKey(summaries.map((summary) => getPartySizeBucket(summary))),
    byVenueSlug: countByKey(summaries.map((summary) => summary.booking.venueSlug)),
    byPortSlug: countByKey(summaries.map((summary) => summary.booking.portSlug)),
    byLifecycleState: countByKey(
      summaries.map((summary) => {
        const parts = [summary.latestEventType, summary.latestStatus, summary.latestStage].filter(Boolean);
        return parts.length ? parts.join(" | ") : null;
      })
    ),
    byArtist: countByKey(
      summaries.map((summary) => {
        if (!summary.metadata) return null;
        const artist = summary.metadata.artist;
        return typeof artist === "string" ? artist : null;
      })
    ),
    byEventLabel: countByKey(
      summaries.map((summary) => {
        if (!summary.metadata) return null;
        const event = summary.metadata.event;
        return typeof event === "string" ? event : null;
      })
    ),
    byEmbedDomain: countByKey(
      summaries.map((summary) => getMetadataString(summary, "embedDomain"))
    ),
    byEmbedPath: countByKey(
      summaries.map((summary) => getMetadataString(summary, "embedPath"))
    ),
    byWidgetPlacement: countByKey(
      summaries.map((summary) => getMetadataString(summary, "widgetPlacement"))
    ),
    byWidgetId: countByKey(
      summaries.map((summary) => getMetadataString(summary, "widgetId"))
    ),
    degradedContexts: countByKey(
      summaries
        .filter((summary) => summary.degraded)
        .map((summary) => {
          if (summary.booking.venueSlug) return `venue:${summary.booking.venueSlug}`;
          if (summary.booking.portSlug) return `port:${summary.booking.portSlug}`;
          if (summary.booking.citySlug) return `city:${summary.booking.citySlug}`;
          if (summary.attribution.sourcePage) return `page:${summary.attribution.sourcePage}`;
          return summary.satelliteId;
        })
    ),
    byPartnerRoute: countByKey(
      summaries.map((summary) => {
        const fromSite = summary.partner?.fromSite || null;
        const toSite = summary.partner?.toSite || null;
        if (!fromSite || !toSite) return null;
        return `${fromSite}->${toSite}`;
      })
    ),
    topOriginPages: getTopOriginPages(summaries),
    topConvertingEmbedDomains: getTopConvertingEmbedDomains(summaries),
    topPlacements: getTopPlacements(summaries),
    weakestEmbeds: getWeakestEmbeds(summaries),
    productPortWinners: getProductPortWinners(summaries),
    leakagePoints: getLeakagePoints(summaries),
    operatorWinningPages: getOperatorWinningPages(summaries),
    operatorLeakingLanes: getOperatorLeakingLanes(summaries, brokenPartnerLoops),
    partnerScorecards: getPartnerScorecards(summaries),
    urgentAlerts: getUrgentAlerts(summaries, brokenPartnerLoops, missingOutcomeLoops),
    brokenPartnerLoops,
    expansionPriorityPages: getExpansionPriorityPages(summaries),
    seoSourceSlugOpportunities: getSeoOpportunityRows(
      summaries,
      (summary) => summary.attribution.sourceSlug
    ),
    seoTopicOpportunities: getSeoOpportunityRows(
      summaries,
      (summary) => summary.attribution.topicSlug
    ),
    seoProductOpportunities: getSeoOpportunityRows(
      summaries,
      (summary) => summary.booking.productSlug
    ).map((row) => ({
      key: row.key,
      score: row.score,
      completions: row.completions,
      partnerCompletions: row.partnerCompletions,
    })),
    seoHubOpportunities: getSeoHubOpportunities(summaries),
    highValuePages: getHighValuePages(summaries),
    revenueByProduct: getRevenueRows(summaries, (summary) => summary.booking.productSlug),
    revenueByPartnerReason: getRevenueRows(summaries, (summary) => summary.partner?.reason),
    revenueByPartySizeBucket: getRevenueByPartySizeBucket(summaries),
    highRevenueHubs: getHighRevenueHubs(summaries),
    premiumGroupPages: getPremiumGroupPages(summaries),
    updatedAt: new Date().toISOString(),
  };
}

function scorePartnerLoop(
  summaries: SatelliteHandoffSummary[],
  matcher: (summary: SatelliteHandoffSummary) => boolean
) {
  return summaries
    .filter(matcher)
    .reduce((acc, summary) => {
      if (summary.latestEventType === "partner_booking_completed") return acc + 6;
      if (summary.latestEventType === "accepted_from_partner") return acc + 3;
      if (summary.latestEventType === "forwarded_to_partner") return acc + 1;
      if (summary.latestEventType === "partner_booking_failed") return acc - 4;
      return acc;
    }, 0);
}

function countBrokenPartnerLoopsForContext(
  summaries: SatelliteHandoffSummary[],
  matcher: (summary: SatelliteHandoffSummary) => boolean
) {
  return getBrokenPartnerLoops(summaries).filter((loop) =>
    summaries.some((summary) => summary.handoffId === loop.handoffId && matcher(summary))
  ).length;
}

function scoreSummary(summary: SatelliteHandoffSummary) {
  const revenueWeight =
    summary.latestEventType === "booking_completed" || summary.latestEventType === "partner_booking_completed"
      ? Math.min(4, Math.round((summary.booking.amount || 0) / 250))
      : 0;
  if (summary.latestEventType === "temporarily_paused") return -8;
  if (summary.latestEventType === "inventory_unavailable") return -6;
  if (summary.latestEventType === "booking_failure_rate_high") return -5;
  if (summary.latestEventType === "response_degraded") return -4;
  if (summary.latestEventType === "inventory_low") return -3;
  if (summary.latestEventType === "partner_booking_failed") return -3;
  if (summary.latestEventType === "partner_booking_completed") return 4 + revenueWeight;
  if (summary.latestEventType === "accepted_from_partner") return 1;
  if (summary.latestEventType === "forwarded_to_partner") return 0;
  if (summary.latestEventType === "booking_completed") return 5 + revenueWeight;
  if (summary.latestEventType === "booking_started") return 3;
  if (summary.latestEventType === "lead_captured") return 2;
  if (summary.latestEventType === "traveler_returned") return 1;
  if (summary.latestEventType === "booking_failed") return -2;
  return 0;
}

function penaltyForDegradedContext(
  summaries: SatelliteHandoffSummary[],
  matcher: (summary: SatelliteHandoffSummary) => boolean
) {
  return summaries
    .filter((summary) => matcher(summary) && summary.degraded)
    .reduce((acc, summary) => acc + Math.abs(Math.min(scoreSummary(summary), 0)), 0);
}

function scoreContext(
  summaries: SatelliteHandoffSummary[],
  matcher: (summary: SatelliteHandoffSummary) => boolean
) {
  return summaries.filter(matcher).reduce((acc, summary) => acc + scoreSummary(summary), 0);
}

export function getRedRocksRecommendationActions(): RecommendationAction[] {
  const summaries = listAllSatelliteHandoffSummaries(400);
  const shuttleScore = scoreContext(
    summaries,
    (summary) =>
      summary.booking.venueSlug === "red-rocks-amphitheatre" ||
      summary.attribution.sourcePage === "/red-rocks-shuttle"
  );
  const compareScore = scoreContext(
    summaries,
    (summary) => summary.attribution.sourcePage === "/red-rocks-transportation"
  );
  const parkingScore = scoreContext(
    summaries,
    (summary) => summary.attribution.sourcePage === "/red-rocks-parking"
  );
  const parrPenalty = penaltyForDegradedContext(
    summaries,
    (summary) =>
      summary.satelliteId === "partyatredrocks" &&
      (summary.booking.venueSlug === "red-rocks-amphitheatre" ||
        summary.attribution.sourcePage === "/red-rocks-shuttle")
  );

  const actions: RecommendationAction[] = [
    {
      id: "book-shuttle",
      label: "Book Red Rocks Shuttle",
      href: "/red-rocks-shuttle",
      kind: "internal",
      score: shuttleScore - parrPenalty,
      laneState: parrPenalty > 0 ? "degraded" : "healthy",
      reason:
        parrPenalty > 0
          ? "Partner degradation signals are active, so compare this lane carefully before sending more demand."
          : "Best direct path when ride-home certainty wins.",
    },
    {
      id: "compare-rides",
      label: "Compare Ride Options",
      href: "/red-rocks-transportation",
      kind: "internal",
      score: compareScore + (parrPenalty > 0 ? 2 : 0),
      laneState: parrPenalty > 0 ? "fallback" : "healthy",
      reason:
        parrPenalty > 0
          ? "Best fallback while the direct partner lane is strained."
          : "Best when the traveler is still choosing among shuttle, parking, and rideshare.",
    },
    {
      id: "parking",
      label: "Check Parking Strategy",
      href: "/red-rocks-parking",
      kind: "internal",
      score: parkingScore + (parrPenalty > 0 ? 1 : 0),
      laneState: parrPenalty > 0 ? "fallback" : "healthy",
      reason:
        parrPenalty > 0
          ? "Useful fallback when shuttle capacity or response quality is degraded."
          : "Best when driving is still on the table and exit friction matters.",
    },
  ];
  return actions.sort((a, b) => b.score - a.score);
}

export function getPortRecommendationActions(portSlug: string): RecommendationAction[] {
  const summaries = listAllSatelliteHandoffSummaries(400);
  const wtaScore = scoreContext(
    summaries,
    (summary) =>
      summary.satelliteId === "welcome-to-alaska" && summary.booking.portSlug === portSlug
  );
  const wtaPenalty = penaltyForDegradedContext(
    summaries,
    (summary) =>
      summary.satelliteId === "welcome-to-alaska" && summary.booking.portSlug === portSlug
  );
  const downstreamParrLoopScore = scorePartnerLoop(
    summaries,
    (summary) =>
      summary.partner?.fromSite === "welcome-to-alaska" &&
      summary.partner?.toSite === "partyatredrocks" &&
      summary.booking.portSlug === portSlug
  );
  const brokenDownstreamLoops = countBrokenPartnerLoopsForContext(
    summaries,
    (summary) =>
      summary.partner?.fromSite === "welcome-to-alaska" &&
      summary.partner?.toSite === "partyatredrocks" &&
      summary.booking.portSlug === portSlug
  );
  const actions: RecommendationAction[] = [
    {
      id: "port-guide",
      label: "Cruise Port Guide",
      href: `/cruises/port/${portSlug}`,
      kind: "internal",
      score: 1 + (wtaPenalty > 0 ? 3 : 0),
      laneState: wtaPenalty > 0 ? "fallback" : "healthy",
      reason:
        wtaPenalty > 0
          ? "Best fallback while WTA lane health is degraded for this port."
          : "Keep the traveler on the authority layer until the shore-day decision is clear.",
    },
    {
      id: "shore-excursions",
      label: "Browse Shore Excursions",
      href: "/cruises/shore-excursions",
      kind: "internal",
      score: 1 + (wtaPenalty > 0 ? 2 : 0),
      laneState: wtaPenalty > 0 ? "fallback" : "healthy",
      reason:
        wtaPenalty > 0
          ? "Best fallback when this port needs broader option coverage before a partner handoff."
          : "Best when the traveler wants broader excursion fit before committing.",
    },
    {
      id: "wta-execution",
      label: "Continue to WTA Execution",
      href: `/cruises/port/${portSlug}`,
      kind: "internal",
      score: wtaScore + downstreamParrLoopScore - wtaPenalty - brokenDownstreamLoops * 3,
      laneState: wtaPenalty > 0 || brokenDownstreamLoops > 0 ? "degraded" : "healthy",
      reason:
        wtaPenalty > 0
          ? "Execution is still available, but recent partner health signals suggest staying on the authority layer longer."
          : brokenDownstreamLoops > 0
            ? "Recent WTA to PARR forwards are not being fully accepted downstream, so keep travelers in DCC longer."
          : downstreamParrLoopScore > 0
            ? "Recent WTA to PARR downstream outcomes say this port lane is producing usable cross-network demand."
          : "Recent partner outcomes say this is the strongest execution lane.",
    },
  ];
  return actions.sort((a, b) => b.score - a.score);
}

export function getColoradoTransferRecommendationActions(): RecommendationAction[] {
  const summaries = listAllSatelliteHandoffSummaries(400);
  const gosnoCorridorScore = scoreContext(
    summaries,
    (summary) =>
      summary.satelliteId === "gosno" &&
      (summary.attribution.sourcePage === "/transportation/colorado/denver-to-vail-shuttle-guide" ||
        summary.booking.citySlug === "vail" ||
        summary.attribution.topicSlug === "ski-transfers")
  );
  const gosnoPenalty = penaltyForDegradedContext(
    summaries,
    (summary) =>
      summary.satelliteId === "gosno" &&
      (summary.attribution.sourcePage === "/transportation/colorado/denver-to-vail-shuttle-guide" ||
        summary.booking.citySlug === "vail" ||
        summary.attribution.topicSlug === "ski-transfers")
  );

  const actions: RecommendationAction[] = [
    {
      id: "corridor-guide",
      label: "Use The Corridor Guide",
      href: "/transportation/colorado/denver-to-vail-shuttle-guide",
      kind: "internal",
      score: 2 + (gosnoPenalty > 0 ? 3 : 0),
      laneState: gosnoPenalty > 0 ? "fallback" : "healthy",
      reason:
        gosnoPenalty > 0
          ? "Best fallback while the ski-transfer execution lane is strained."
          : "Best when the traveler still needs timing, weather, and pickup-context guidance.",
    },
    {
      id: "colorado-hub",
      label: "Stay In Colorado Planning",
      href: "/transportation/colorado",
      kind: "internal",
      score: 1 + (gosnoPenalty > 0 ? 2 : 0),
      laneState: gosnoPenalty > 0 ? "fallback" : "healthy",
      reason:
        gosnoPenalty > 0
          ? "Useful fallback when corridor execution is degraded and DCC should absorb demand."
          : "Best when the traveler may pivot across Red Rocks, Denver, and mountain transport options.",
    },
    {
      id: "gosno-execution",
      label: "Move Into Ski Transfer Execution",
      href: "/transportation/colorado/denver-to-vail-shuttle-guide",
      kind: "internal",
      score: gosnoCorridorScore - gosnoPenalty,
      laneState: gosnoPenalty > 0 ? "degraded" : "healthy",
      reason:
        gosnoPenalty > 0
          ? "Recent GOSNO health signals suggest holding travelers in DCC until the lane stabilizes."
          : "Best when corridor demand is clear and partner execution is healthy.",
    },
  ];

  return actions.sort((a, b) => b.score - a.score);
}
