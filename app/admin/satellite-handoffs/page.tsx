import Link from "next/link";
import StatGrid from "@/app/components/StatGrid";
import { getHandoffAnalyticsSnapshot } from "@/lib/dcc/handoffAnalytics";
import {
  SATELLITE_IDS,
  listAllSatelliteHandoffSummaries,
  listRecentSatelliteEvents,
  listSatelliteHandoffSummaries,
  type DccSatelliteId,
} from "@/lib/dcc/satelliteHandoffs";

export const dynamic = "force-dynamic";

type SearchParams = {
  satellite?: string;
};

function isSatelliteId(value: string | undefined): value is DccSatelliteId {
  return SATELLITE_IDS.includes(value as DccSatelliteId);
}

export default async function SatelliteHandoffsAdminPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) || {};
  const activeSatellite = isSatelliteId(sp.satellite) ? sp.satellite : null;
  const summaries = activeSatellite
    ? listSatelliteHandoffSummaries(activeSatellite, 100)
    : listAllSatelliteHandoffSummaries(100);
  const recentEvents = activeSatellite ? listRecentSatelliteEvents(activeSatellite, 20) : [];
  const snapshot = getHandoffAnalyticsSnapshot(300);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Satellite Handoffs</h1>
            <p className="mt-2 text-zinc-300">
              Recent two-way handoff state across PARR, GOSNO, WTA, and Save On The Strip.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/argo-waitlist"
              className="inline-flex items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Argo Waitlist
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/admin/satellite-handoffs"
            className={`rounded-full border px-4 py-2 text-sm ${activeSatellite ? "border-white/10 bg-black/30 text-zinc-300" : "border-cyan-300/40 bg-cyan-400/10 text-cyan-100"}`}
          >
            All satellites
          </Link>
          {SATELLITE_IDS.map((satelliteId) => (
            <Link
              key={satelliteId}
              href={`/admin/satellite-handoffs?satellite=${encodeURIComponent(satelliteId)}`}
              className={`rounded-full border px-4 py-2 text-sm ${activeSatellite === satelliteId ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-black/30 text-zinc-300"}`}
            >
              {satelliteId}
            </Link>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <StatGrid
            items={[
              { label: "Tracked handoffs", value: snapshot.totalHandoffs },
              { label: "Bookings completed", value: snapshot.completed },
              { label: "Bookings started", value: snapshot.started },
              { label: "Leads captured", value: snapshot.leads },
              { label: "Failures", value: snapshot.failed },
              { label: "Degraded lanes", value: snapshot.degraded },
              { label: "Gross revenue", value: `$${snapshot.grossRevenue.toLocaleString()}` },
              { label: "Partner revenue", value: `$${snapshot.partnerRevenue.toLocaleString()}` },
              { label: "Forwards / accepts", value: `${snapshot.forwardedToPartner} / ${snapshot.acceptedFromPartner}` },
              { label: "Partner outcomes", value: `${snapshot.partnerCompleted} / ${snapshot.partnerFailed}` },
              { label: "PARR / WTA / GOSNO / SOTS", value: `${snapshot.bySatellite.partyatredrocks} / ${snapshot.bySatellite["welcome-to-alaska"]} / ${snapshot.bySatellite.gosno} / ${snapshot.bySatellite.saveonthestrip}` },
              { label: "Urgent alerts", value: snapshot.urgentAlerts.length },
              { label: "Embed domains", value: snapshot.byEmbedDomain.length },
              { label: "Widget placements", value: snapshot.byWidgetPlacement.length },
            ]}
          />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-black/30 text-zinc-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Satellite</th>
                  <th className="px-4 py-3 font-semibold">Handoff</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Topic / Route</th>
                  <th className="px-4 py-3 font-semibold">Venue / Port</th>
                  <th className="px-4 py-3 font-semibold">Latest Event</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Count</th>
                  <th className="px-4 py-3 font-semibold">Last Update</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => (
                  <tr key={`${summary.satelliteId}:${summary.handoffId}`} className="border-b border-white/10">
                    <td className="px-4 py-3 text-zinc-300">{summary.satelliteId}</td>
                    <td className="px-4 py-3 font-mono text-xs text-cyan-200">{summary.handoffId}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      <div className="max-w-[240px] truncate">{summary.attribution.sourcePage || "—"}</div>
                      <div className="mt-1 text-xs text-zinc-500">{summary.attribution.sourceSlug || "No source slug"}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <div>{summary.attribution.topicSlug || "—"}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {summary.partner?.fromSite && summary.partner?.toSite
                          ? `${summary.partner.fromSite} → ${summary.partner.toSite}`
                          : "No partner route"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <div>{summary.booking.venueSlug || summary.booking.portSlug || "—"}</div>
                      <div className="mt-1 text-xs text-zinc-500">{summary.booking.eventDate || "No event date"}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-100">{summary.latestEventType}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      {[summary.latestStatus, summary.latestStage].filter(Boolean).join(" • ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{summary.eventCount}</td>
                    <td className="px-4 py-3 text-zinc-300">{new Date(summary.lastEventAt).toLocaleString()}</td>
                  </tr>
                ))}
                {summaries.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-zinc-400" colSpan={9}>
                      No satellite handoff events have been recorded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Callback target</div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Satellites should POST lifecycle events to <code>/api/internal/satellite-handoffs/events</code> with
                <code> x-dcc-satellite-token</code> and a stable <code>handoffId</code>.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Urgent Alerts</div>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                {snapshot.urgentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-3 ${alert.severity === "high" ? "border-rose-400/30 bg-rose-500/10" : "border-amber-300/20 bg-amber-400/10"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-zinc-100">{alert.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-300">
                        {alert.kind.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-1 text-zinc-300">{alert.detail}</div>
                    {alert.handoffId ? (
                      <div className="mt-2 font-mono text-[11px] text-cyan-200">{alert.handoffId}</div>
                    ) : null}
                  </div>
                ))}
                {snapshot.urgentAlerts.length === 0 ? (
                  <p className="text-zinc-400">No urgent loop or degradation alerts right now.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Top Origin Pages</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.topOriginPages.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {row.completions} / ${row.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
                {snapshot.topOriginPages.length === 0 ? (
                  <p className="text-zinc-400">No origin-page performance data yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Top DCC Sources</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.bySourcePage.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">{row.count}</span>
                  </div>
                ))}
                {snapshot.bySourcePage.length === 0 ? <p className="text-zinc-400">No source-page data yet.</p> : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Top Converting Embed Domains</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.topConvertingEmbedDomains.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {row.completions} / {(row.conversionRate * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
                {snapshot.topConvertingEmbedDomains.length === 0 ? (
                  <p className="text-zinc-400">No embed-domain conversion data yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Top Placements</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.topPlacements.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {row.completions} / ${row.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
                {snapshot.topPlacements.length === 0 ? (
                  <p className="text-zinc-400">No placement-level widget data yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Weakest Embeds</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.weakestEmbeds.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {(row.leakageRate * 100).toFixed(0)}% leak
                    </span>
                  </div>
                ))}
                {snapshot.weakestEmbeds.length === 0 ? (
                  <p className="text-zinc-400">No weak embeds surfaced yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">SEO Source Slugs</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.seoSourceSlugOpportunities.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {row.score} ({row.completions}/{row.partnerCompletions}/{row.failures})
                    </span>
                  </div>
                ))}
                {snapshot.seoSourceSlugOpportunities.length === 0 ? (
                  <p className="text-zinc-400">No source-slug SEO signals yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Product / Port Winners</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.productPortWinners.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {row.completions + row.partnerCompletions} / ${row.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
                {snapshot.productPortWinners.length === 0 ? (
                  <p className="text-zinc-400">No product/port winners yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Leakage Points</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.leakagePoints.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {(row.leakageRate * 100).toFixed(0)}% / {row.failed} fail
                    </span>
                  </div>
                ))}
                {snapshot.leakagePoints.length === 0 ? (
                  <p className="text-zinc-400">No leakage points yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Partner Scorecards</div>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                {snapshot.partnerScorecards.map((row) => (
                  <div key={row.satelliteId} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-zinc-100">{row.satelliteId}</span>
                      <span className="text-zinc-100">Score {row.score}</span>
                    </div>
                    <div className="mt-2 text-xs text-zinc-400">
                      {row.completions} direct / {row.partnerCompletions} partner completions / {row.failures} failures
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {row.forwarded} forwards / {row.accepted} accepts / {row.degraded} degraded / ${row.revenue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Top Topics</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.byTopicSlug.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">{row.count}</span>
                  </div>
                ))}
                {snapshot.byTopicSlug.length === 0 ? <p className="text-zinc-400">No topic data yet.</p> : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">SEO Topic Clusters</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.seoTopicOpportunities.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {row.score} ({row.completions}/{row.partnerCompletions}/{row.failures})
                    </span>
                  </div>
                ))}
                {snapshot.seoTopicOpportunities.length === 0 ? (
                  <p className="text-zinc-400">No topic-cluster SEO signals yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Operator Winning Pages</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.operatorWinningPages.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {row.score} / ${row.revenue.toLocaleString()} ({row.completions}/{row.partnerCompletions})
                    </span>
                  </div>
                ))}
                {snapshot.operatorWinningPages.length === 0 ? (
                  <p className="text-zinc-400">No clear winning pages yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Operator Leaking Lanes</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.operatorLeakingLanes.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {row.score} ({row.failures} fail / {row.degraded} degraded / {row.brokenLoops} loops)
                    </span>
                  </div>
                ))}
                {snapshot.operatorLeakingLanes.length === 0 ? (
                  <p className="text-zinc-400">No obvious leaking lanes yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Top Products</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.byProductSlug.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">{row.count}</span>
                  </div>
                ))}
                {snapshot.byProductSlug.length === 0 ? <p className="text-zinc-400">No product data yet.</p> : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">SEO Product Intents</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.seoProductOpportunities.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {row.score} ({row.completions}/{row.partnerCompletions})
                    </span>
                  </div>
                ))}
                {snapshot.seoProductOpportunities.length === 0 ? (
                  <p className="text-zinc-400">No product-intent SEO signals yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Group Size Signals</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.byPartySizeBucket.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">{row.count}</span>
                  </div>
                ))}
                {snapshot.byPartySizeBucket.length === 0 ? (
                  <p className="text-zinc-400">No party-size or quantity data yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Lifecycle States</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.byLifecycleState.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">{row.count}</span>
                  </div>
                ))}
                {snapshot.byLifecycleState.length === 0 ? (
                  <p className="text-zinc-400">No lifecycle-state data yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Partner Reasons</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.byPartnerReason.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">{row.count}</span>
                  </div>
                ))}
                {snapshot.byPartnerReason.length === 0 ? (
                  <p className="text-zinc-400">No partner-forward reason data yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Ports / Venues</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 text-sm text-zinc-300">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Ports</div>
                  {snapshot.byPortSlug.slice(0, 5).map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-3">
                      <span className="truncate">{row.key}</span>
                      <span className="text-zinc-100">{row.count}</span>
                    </div>
                  ))}
                  {snapshot.byPortSlug.length === 0 ? <p className="text-zinc-400">No port data yet.</p> : null}
                </div>
                <div className="space-y-2 text-sm text-zinc-300">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Venues</div>
                  {snapshot.byVenueSlug.slice(0, 5).map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-3">
                      <span className="truncate">{row.key}</span>
                      <span className="text-zinc-100">{row.count}</span>
                    </div>
                  ))}
                  {snapshot.byVenueSlug.length === 0 ? <p className="text-zinc-400">No venue data yet.</p> : null}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">SEO Hub Opportunities</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.seoHubOpportunities.slice(0, 5).map((row) => (
                  <div key={`${row.type}:${row.key}`} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.type}:{row.key}</span>
                    <span className="text-zinc-100">
                      {row.score} ({row.completions}/{row.partnerCompletions}/{row.failures})
                    </span>
                  </div>
                ))}
                {snapshot.seoHubOpportunities.length === 0 ? (
                  <p className="text-zinc-400">No port/venue SEO hub signals yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Revenue Priority Pages</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.highValuePages.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      ${row.revenue.toLocaleString()} ({row.bookings}/{row.partnerBookings})
                    </span>
                  </div>
                ))}
                {snapshot.highValuePages.length === 0 ? (
                  <p className="text-zinc-400">No revenue-weighted page data yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Revenue by Product</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.revenueByProduct.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      ${row.revenue.toLocaleString()} ({row.bookings}/{row.partnerBookings})
                    </span>
                  </div>
                ))}
                {snapshot.revenueByProduct.length === 0 ? (
                  <p className="text-zinc-400">No product revenue data yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Revenue by Partner Reason</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.revenueByPartnerReason.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      ${row.revenue.toLocaleString()} ({row.bookings}/{row.partnerBookings})
                    </span>
                  </div>
                ))}
                {snapshot.revenueByPartnerReason.length === 0 ? (
                  <p className="text-zinc-400">No partner-reason revenue data yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Revenue by Group Size</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.revenueByPartySizeBucket.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      ${row.revenue.toLocaleString()} ({row.bookings}, AOV ${row.averageOrderValue.toLocaleString()})
                    </span>
                  </div>
                ))}
                {snapshot.revenueByPartySizeBucket.length === 0 ? (
                  <p className="text-zinc-400">No group-size revenue data yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">High Revenue Hubs</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.highRevenueHubs.slice(0, 5).map((row) => (
                  <div key={`${row.type}:${row.key}`} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.type}:{row.key}</span>
                    <span className="text-zinc-100">
                      ${row.revenue.toLocaleString()} ({row.bookings}/{row.partnerBookings})
                    </span>
                  </div>
                ))}
                {snapshot.highRevenueHubs.length === 0 ? (
                  <p className="text-zinc-400">No hub revenue data yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Premium Group Pages</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.premiumGroupPages.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      ${row.revenue.toLocaleString()} ({row.bookings}, avg party {row.averagePartySize})
                    </span>
                  </div>
                ))}
                {snapshot.premiumGroupPages.length === 0 ? (
                  <p className="text-zinc-400">No premium-group page signals yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Artist / Event Metadata</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 text-sm text-zinc-300">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Artists</div>
                  {snapshot.byArtist.slice(0, 5).map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-3">
                      <span className="truncate">{row.key}</span>
                      <span className="text-zinc-100">{row.count}</span>
                    </div>
                  ))}
                  {snapshot.byArtist.length === 0 ? <p className="text-zinc-400">No artist metadata yet.</p> : null}
                </div>
                <div className="space-y-2 text-sm text-zinc-300">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Events</div>
                  {snapshot.byEventLabel.slice(0, 5).map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-3">
                      <span className="truncate">{row.key}</span>
                      <span className="text-zinc-100">{row.count}</span>
                    </div>
                  ))}
                  {snapshot.byEventLabel.length === 0 ? <p className="text-zinc-400">No event metadata yet.</p> : null}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Top Bottlenecks</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.degradedContexts.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">{row.count}</span>
                  </div>
                ))}
                {snapshot.degradedContexts.length === 0 ? (
                  <p className="text-zinc-400">No degraded partner lanes logged yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Partner Routes</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.byPartnerRoute.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">{row.count}</span>
                  </div>
                ))}
                {snapshot.byPartnerRoute.length === 0 ? (
                  <p className="text-zinc-400">No cross-network partner routes recorded yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Broken Partner Loops</div>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                {snapshot.brokenPartnerLoops.slice(0, 5).map((loop) => (
                  <div key={loop.handoffId} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="font-mono text-[11px] text-cyan-200">{loop.handoffId}</div>
                    <div className="mt-1 text-zinc-100">{loop.route}</div>
                    <div className="mt-1 text-zinc-400">{loop.sourcePage || "No source page"}</div>
                  </div>
                ))}
                {snapshot.brokenPartnerLoops.length === 0 ? (
                  <p className="text-zinc-400">No unresolved partner forwards detected.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Expansion Priority</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.expansionPriorityPages.slice(0, 5).map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3">
                    <span className="truncate">{row.key}</span>
                    <span className="text-zinc-100">
                      {row.score} ({row.completions}/{row.partnerCompletions}/{row.failures})
                    </span>
                  </div>
                ))}
                {snapshot.expansionPriorityPages.length === 0 ? (
                  <p className="text-zinc-400">No page-priority signals yet.</p>
                ) : null}
              </div>
            </section>

            {activeSatellite ? (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent Raw Events</div>
                <div className="mt-4 space-y-3">
                  {recentEvents.map((event) => (
                    <div key={event.eventId} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                      <div className="font-mono text-[11px] text-cyan-200">{event.handoffId}</div>
                      <div className="mt-1 text-zinc-100">{event.eventType}</div>
                      <div className="mt-1 text-zinc-400">{new Date(event.receivedAt).toLocaleString()}</div>
                    </div>
                  ))}
                  {recentEvents.length === 0 ? (
                    <p className="text-sm text-zinc-400">No raw events logged yet for this satellite.</p>
                  ) : null}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
