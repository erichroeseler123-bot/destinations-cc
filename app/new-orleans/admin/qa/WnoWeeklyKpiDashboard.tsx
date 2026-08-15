import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";

type EventRow = Awaited<ReturnType<typeof listRecentProductionCorridorEvents>>[number];

type Metric = {
  label: string;
  value: string;
  target?: string;
  note?: string;
  status?: "good" | "watch" | "neutral";
};

const TARGETS = {
  chooserCompletion: 0.5,
  primaryClick: 0.4,
  bundleClick: 0.15,
  chooserToFareHarbor: 0.35,
  recommendationMatch: 0.6,
  emailOptIn: 0.02,
};

function metadata(event: EventRow) {
  return (event.metadata || {}) as Record<string, unknown>;
}

function originalName(event: EventRow) {
  const value = metadata(event).original_event_name;
  return typeof value === "string" ? value : event.eventName;
}

function metaString(event: EventRow, key: string) {
  const value = metadata(event)[key];
  return typeof value === "string" && value ? value : null;
}

function metaBoolean(event: EventRow, key: string) {
  const value = metadata(event)[key];
  return typeof value === "boolean" ? value : null;
}

function pct(value: number | null) {
  return value == null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

function statusFor(value: number | null, target: number): Metric["status"] {
  if (value == null) return "neutral";
  return value >= target ? "good" : "watch";
}

function within(event: EventRow, start: Date, end: Date) {
  const occurred = new Date(event.occurredAt).getTime();
  return occurred >= start.getTime() && occurred < end.getTime();
}

function countBy(events: EventRow[], field: (event: EventRow) => string | null) {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = field(event);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function uniqueSessions(events: EventRow[]) {
  return new Set(events.map((event) => event.sessionId).filter(Boolean)).size;
}

function computeWindow(events: EventRow[]) {
  const landingEvents = events.filter((event) => originalName(event) === "landing_viewed");
  const uniqueVisitors = uniqueSessions(landingEvents);
  const optIns = events.filter((event) => originalName(event) === "lead_captured");
  const chooserStarts = events.filter((event) => originalName(event) === "chooser_started");
  const chooserCompletes = events.filter((event) => originalName(event) === "chooser_completed");
  const primaryClicks = events.filter((event) => originalName(event) === "chooser_recommendation_clicked" && metaString(event, "recommendation_rank") === "primary");
  const bundleShown = events.filter((event) => originalName(event) === "chooser_bundle_shown");
  const bundleClicks = events.filter((event) => originalName(event) === "chooser_bundle_product_clicked");
  const bookingOpens = events.filter((event) => originalName(event) === "booking_opened");
  const chooserConversions = events.filter((event) => originalName(event) === "chooser_to_fareharbor_conversion");
  const matchKnown = chooserConversions.filter((event) => metaBoolean(event, "recommendation_match") !== null);
  const matches = matchKnown.filter((event) => metaBoolean(event, "recommendation_match") === true);

  return {
    uniqueVisitors,
    optIns,
    chooserStarts,
    chooserCompletes,
    primaryClicks,
    bundleShown,
    bundleClicks,
    bookingOpens,
    chooserConversions,
    matchKnown,
    matches,
    signupSources: countBy(optIns, (event) => metaString(event, "signup_source") || "unknown"),
    bundlesShown: countBy(bundleShown, (event) => metaString(event, "bundle_id") || "unclassified"),
    bundlesClicked: countBy(bundleClicks, (event) => metaString(event, "bundle_id") || "unclassified"),
    mobileDesktop: countBy(chooserCompletes, (event) => metaString(event, "device_type")),
  };
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (!previous) return <span className="text-white/40">new</span>;
  const change = (current - previous) / previous;
  const prefix = change > 0 ? "+" : "";
  return <span className={change >= 0 ? "text-emerald-300" : "text-amber-300"}>{prefix}{(change * 100).toFixed(0)}% vs prior week</span>;
}

function MetricCard({ metric }: { metric: Metric }) {
  const border = metric.status === "good" ? "border-emerald-500/40" : metric.status === "watch" ? "border-amber-500/40" : "border-white/10";
  return (
    <div className={`border ${border} bg-white/[0.03] p-5`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4af37]">{metric.label}</p>
      <div className="mt-3 text-3xl font-semibold text-white">{metric.value}</div>
      {metric.target && <p className="mt-2 text-xs text-white/45">Target: {metric.target}</p>}
      {metric.note && <p className="mt-2 text-xs leading-5 text-white/55">{metric.note}</p>}
    </div>
  );
}

export default async function WnoWeeklyKpiDashboard() {
  const all = (await listRecentProductionCorridorEvents(20000)).filter((event) => event.corridorId === "wno-commerce");
  const now = new Date();
  const currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const current = computeWindow(all.filter((event) => within(event, currentStart, now)));
  const previous = computeWindow(all.filter((event) => within(event, previousStart, currentStart)));

  const chooserCompletionRate = ratio(current.chooserCompletes.length, current.chooserStarts.length);
  const primaryClickRate = ratio(current.primaryClicks.length, current.chooserCompletes.length);
  const bundleShownRate = ratio(current.bundleShown.length, current.chooserCompletes.length);
  const bundleClickRate = ratio(current.bundleClicks.length, current.bundleShown.length);
  const chooserToFareHarborRate = ratio(current.chooserConversions.length, current.chooserCompletes.length);
  const matchRate = ratio(current.matches.length, current.matchKnown.length);
  const optInRate = ratio(current.optIns.length, current.uniqueVisitors);

  const metrics: Metric[] = [
    { label: "Unique visitors", value: current.uniqueVisitors.toLocaleString(), note: "Distinct WNO landing sessions in the last 7 days." },
    { label: "48-hour brief opt-ins", value: current.optIns.length.toLocaleString(), note: `${current.signupSources.length} captured source${current.signupSources.length === 1 ? "" : "s"}.` },
    { label: "Email opt-in rate", value: pct(optInRate), target: "≥ 2%", status: statusFor(optInRate, TARGETS.emailOptIn) },
    { label: "Chooser starts", value: current.chooserStarts.length.toLocaleString() },
    { label: "Chooser completion", value: pct(chooserCompletionRate), target: "≥ 50%", status: statusFor(chooserCompletionRate, TARGETS.chooserCompletion) },
    { label: "Primary recommendation CTR", value: pct(primaryClickRate), target: "≥ 40%", status: statusFor(primaryClickRate, TARGETS.primaryClick), note: current.primaryClicks.length ? undefined : "Rank-level telemetry begins with the hardened telemetry contract." },
    { label: "Bundle shown rate", value: pct(bundleShownRate), note: `${current.bundleShown.length} bundle offers shown.` },
    { label: "Bundle click rate", value: pct(bundleClickRate), target: "≥ 15%", status: statusFor(bundleClickRate, TARGETS.bundleClick) },
    { label: "FareHarbor outbound clicks", value: current.bookingOpens.length.toLocaleString(), note: "Counts only the canonical booking_opened event, avoiding chooser-conversion double counting." },
    { label: "Chooser → FareHarbor", value: pct(chooserToFareHarborRate), target: "≥ 35%", status: statusFor(chooserToFareHarborRate, TARGETS.chooserToFareHarbor) },
    { label: "Recommendation match", value: pct(matchRate), target: "≥ 60%", status: statusFor(matchRate, TARGETS.recommendationMatch), note: current.matchKnown.length ? `${current.matches.length}/${current.matchKnown.length} known conversions matched the primary recommendation.` : "Match telemetry begins with the hardened telemetry contract." },
    { label: "Blended AOV", value: "Not connected", note: "Do not estimate revenue from clicks. This becomes real when FareHarbor booking/postback revenue is available." },
  ];

  const bundleIds = Array.from(new Set([...current.bundlesShown.map(([id]) => id), ...current.bundlesClicked.map(([id]) => id)]));
  const bundleRows = bundleIds.map((id) => {
    const shown = current.bundlesShown.find(([key]) => key === id)?.[1] || 0;
    const clicked = current.bundlesClicked.find(([key]) => key === id)?.[1] || 0;
    return { id, shown, clicked, ctr: ratio(clicked, shown) };
  }).sort((a, b) => b.shown - a.shown);

  return (
    <section className="bg-[#0e0c10] px-6 py-12 text-[#fdfbf7]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d4af37]">Internal · rolling 7 days</p>
            <h1 className="mt-2 font-serif text-4xl">WNO weekly KPI dashboard</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Decision dashboard for capture, chooser quality, bundle performance, and FareHarbor handoff. Revenue/AOV stays intentionally blank until a real booking-value feed exists.</p>
          </div>
          <div className="text-xs text-white/45">Updated {now.toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })} CT</div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-serif text-2xl">Capture source quality</h2>
            <p className="mt-2 text-sm text-white/55">New 48-hour brief opt-ins by signup surface.</p>
            <div className="mt-5 space-y-3">
              {current.signupSources.length ? current.signupSources.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between border-b border-white/10 pb-3 text-sm"><span>{source}</span><span className="font-bold text-[#d4af37]">{count}</span></div>
              )) : <p className="text-sm text-white/45">No opt-ins in this window yet.</p>}
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-serif text-2xl">Bundle performance</h2>
            <p className="mt-2 text-sm text-white/55">Offer rate and click-through by governed pairing.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm"><thead className="text-[10px] uppercase tracking-widest text-white/40"><tr><th className="pb-3">Pairing</th><th className="pb-3">Shown</th><th className="pb-3">Clicked</th><th className="pb-3">CTR</th></tr></thead><tbody>
                {bundleRows.length ? bundleRows.map((row) => <tr key={row.id} className="border-t border-white/10"><td className="py-3">{row.id}</td><td>{row.shown}</td><td>{row.clicked}</td><td className={row.ctr != null && row.ctr >= TARGETS.bundleClick ? "text-emerald-300" : "text-white"}>{pct(row.ctr)}</td></tr>) : <tr><td colSpan={4} className="py-5 text-white/45">No classified bundle events yet. Bundle IDs begin persisting with the hardened telemetry contract.</td></tr>}
              </tbody></table>
            </div>
          </section>
        </div>

        <section className="mt-6 border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-serif text-2xl">Week-over-week pulse</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><div className="text-sm text-white/55">Visitors</div><div className="mt-1 text-xl">{current.uniqueVisitors}</div><div className="mt-1 text-xs"><Delta current={current.uniqueVisitors} previous={previous.uniqueVisitors} /></div></div>
            <div><div className="text-sm text-white/55">Opt-ins</div><div className="mt-1 text-xl">{current.optIns.length}</div><div className="mt-1 text-xs"><Delta current={current.optIns.length} previous={previous.optIns.length} /></div></div>
            <div><div className="text-sm text-white/55">Chooser completes</div><div className="mt-1 text-xl">{current.chooserCompletes.length}</div><div className="mt-1 text-xs"><Delta current={current.chooserCompletes.length} previous={previous.chooserCompletes.length} /></div></div>
            <div><div className="text-sm text-white/55">FareHarbor clicks</div><div className="mt-1 text-xl">{current.bookingOpens.length}</div><div className="mt-1 text-xs"><Delta current={current.bookingOpens.length} previous={previous.bookingOpens.length} /></div></div>
          </div>
        </section>

        <section className="mt-6 border border-[#d4af37]/30 bg-[#d4af37]/[0.05] p-6">
          <h2 className="font-serif text-2xl">Decision rules</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-white/65 md:grid-cols-2">
            <p><strong className="text-white">Chooser completion under 50%:</strong> shorten or simplify questions before adding more traffic.</p>
            <p><strong className="text-white">Bundle CTR under 15%:</strong> test “Make more of the day” copy or placement before adding pairings.</p>
            <p><strong className="text-white">Recommendation match under 60%:</strong> tune chooser scoring rather than forcing more CTAs.</p>
            <p><strong className="text-white">Opt-in rate under 2%:</strong> compare source performance and concentrate the brief CTA on the winning surface.</p>
          </div>
        </section>
      </div>
    </section>
  );
}
