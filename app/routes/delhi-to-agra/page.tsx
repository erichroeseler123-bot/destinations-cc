import type { Metadata } from "next";
import Link from "next/link";
import {
  DELHI_AGRA_QUALIFIED_OPTIONS,
  evaluateDelhiAgraCorridorRecheck,
  getReviewDeskItemsForInternationalCorridor,
  TAJ_MAHAL_VISITING_RULES,
} from "@/lib/dcc/corridors/internationalCorridorQualifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Delhi → Agra Rail & Private Car Qualification (DCC-412 Connection Recheck) | Destination Command Center",
  description:
    "Plan Delhi to Agra day trips: DCC-412 station exit readiness (travelerReadyAt in Asia/Kolkata & UTC ISO-8601), missed 10:30 connection vs. catchable 11:00 cohort, Taj Mahal Friday closure rules, and Review Desk verification.",
  alternates: {
    canonical: "https://destinationcommandcenter.com/routes/delhi-to-agra",
  },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstStr(val: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(val)) return val[0] || fallback;
  return typeof val === "string" && val.trim() ? val.trim() : fallback;
}

export default async function DelhiToAgraPage({ searchParams }: PageProps = {}) {
  const resolved = searchParams ? await searchParams : {};
  const date = firstStr(resolved.date, "2026-11-18");
  const trainDelayMinutes = Math.max(
    0,
    Number.parseInt(firstStr(resolved.delay, "42"), 10) || 0,
  );
  const scheduledArrivalLocal = firstStr(resolved.scheduled_arrival, "09:50");
  const transferBufferMinutes = Math.max(
    0,
    Number.parseInt(firstStr(resolved.exit_buffer, "15"), 10) || 15,
  );
  const criticalUpdateMissing =
    firstStr(resolved.missing_update, "0") === "1" ||
    firstStr(resolved.missing_update, "false") === "true";
  const partySize = Math.max(
    1,
    Number.parseInt(firstStr(resolved.passengers, "2"), 10) || 2,
  );

  const recheck = evaluateDelhiAgraCorridorRecheck({
    date,
    trainDelayMinutes,
    scheduledArrivalLocal,
    transferBufferMinutes,
    criticalUpdateMissing,
    partySize,
  });
  const dcc412 = recheck.dcc412Recheck;
  const reviewDeskRows =
    getReviewDeskItemsForInternationalCorridor("india-delhi-agra");

  return (
    <main className="min-h-screen bg-[#070b12] text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-cyan-300 hover:underline">
              DCC Home
            </Link>
            <span>/</span>
            <span className="text-zinc-200 font-semibold">
              India Qualification: Delhi → Agra (DCC-412 Readiness &amp; Cutoff Engine)
            </span>
          </div>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 font-mono text-[11px] text-cyan-200">
            DCC-412 Active · Timezone: {dcc412.ianaTimeZone} → UTC ISO-8601
          </span>
        </div>

        {/* Hero */}
        <header className="rounded-2xl border border-white/15 bg-slate-900/85 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            International Corridor 2 — New Delhi (NZM / DEL) → Agra Cantt (AGC) &amp; Taj Mahal
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Delhi → Agra Rail, Station Exit &amp; Taj Mahal Cutoff Guide
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">
            Powered by <code>DCC-412</code> inside <code>sharedTripRecheck</code>.
            Resolves local times in <code>Asia/Kolkata</code> to UTC ISO-8601
            timestamps, adds the station exit buffer <strong>once</strong> to compute{" "}
            <code>travelerReadyAt</code>, carries <code>travelerReadyAt</code>{" "}
            through every candidate connection, and enforces dated official sources
            while keeping unconfirmed private-car tariffs and WhatsApp links in the{" "}
            <a href="#review-desk" className="text-cyan-300 underline">
              DCC Review Desk
            </a>
            .
          </p>
        </header>

        {/* DCC-412 Readiness & Connection Recheck Panel */}
        <section
          id="connection-recheck"
          aria-label="DCC-412 Delhi to Agra Readiness and Connection Recheck"
          data-testid="delhi-agra-dcc412-panel"
          className="rounded-2xl border border-cyan-400/35 bg-cyan-950/20 p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  DCC-412 Multi-Leg Readiness &amp; Cutoff Recheck (sharedTripRecheck)
                </span>
                <span
                  data-testid="dcc412-schedule-baseline-badge"
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                    dcc412.scheduleBaselineStatus === "Needs verification"
                      ? "border-amber-400/40 bg-amber-500/20 text-amber-200"
                      : "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                  }`}
                >
                  Schedule Baseline: {dcc412.scheduleBaselineStatus}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-300">
                Scheduled arrival{" "}
                <strong>{dcc412.scheduledArrivalLocal} local</strong> (
                <code>{dcc412.scheduledArrivalUtc}</code>) +{" "}
                <strong>{dcc412.delayMinutesApplied} min delay</strong> → effective
                arrival <strong>{dcc412.effectiveArrivalLocal} local</strong> (
                <code>{dcc412.effectiveArrivalUtcShort}</code>) +{" "}
                <strong>{dcc412.transferBufferMinutes} min station exit buffer</strong>{" "}
                (added once:{" "}
                <code>
                  transferBufferAddedOnce={String(dcc412.transferBufferAddedOnce)}
                </code>
                ) ={" "}
                <strong
                  data-testid="dcc412-traveler-ready-summary"
                  className="text-cyan-200"
                >
                  travelerReadyAt {dcc412.travelerReadyAt.formattedSummary}
                </strong>{" "}
                (<code data-testid="dcc412-traveler-ready-utc">{dcc412.travelerReadyAt.utcIso}</code>).
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Link
                href="/routes/delhi-to-agra?date=2026-11-18&scheduled_arrival=09:50&delay=42&exit_buffer=15"
                className={`rounded-lg border px-2.5 py-1 ${
                  !recheck.isFridayTajClosed &&
                  trainDelayMinutes === 42 &&
                  !criticalUpdateMissing
                    ? "border-cyan-300 bg-cyan-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Synthetic Test: 9:50 + 42m Delay + 15m Exit → 10:47 (05:17Z)
              </Link>
              <Link
                href="/routes/delhi-to-agra?date=2026-11-18&scheduled_arrival=09:50&delay=42&exit_buffer=15&missing_update=1"
                className={`rounded-lg border px-2.5 py-1 ${
                  criticalUpdateMissing
                    ? "border-amber-300 bg-amber-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Missing Live Update (Needs Verification)
              </Link>
              <Link
                href="/routes/delhi-to-agra?date=2026-11-20&delay=0"
                className={`rounded-lg border px-2.5 py-1 ${
                  recheck.isFridayTajClosed
                    ? "border-rose-300 bg-rose-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Friday Closure Test (2026-11-20)
              </Link>
            </div>
          </div>

          {/* Compact What Changed / What Still Fits / Next Step */}
          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                1. What Changed
              </div>
              <p className="mt-1 text-zinc-100">{recheck.recheckCard.whatChanged}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                2. What Still Fits
              </div>
              <p className="mt-1 text-zinc-100">
                {recheck.recheckCard.whatStillFits}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                3. Next Step
              </div>
              <p className="mt-1 text-zinc-100">{recheck.recheckCard.nextStep}</p>
            </div>
          </div>

          {/* Candidate Connections Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/15 text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="py-2 pr-3">Candidate Itinerary</th>
                  <th className="py-2 px-3">Carried travelerReadyAt</th>
                  <th className="py-2 px-3">Departure &amp; Cutoffs (Local / UTC)</th>
                  <th className="py-2 px-3">Connection Verdict</th>
                  <th className="py-2 pl-3">Leg Receipt Provenance (Source / Timestamp / Expiry)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {dcc412.candidates.map((cand) => (
                  <tr
                    key={cand.candidateId}
                    data-testid={`dcc412-candidate-${cand.candidateId}`}
                    data-catchable={String(cand.catchable)}
                  >
                    <td className="py-3 pr-3 align-top">
                      <div className="font-bold text-white">{cand.title}</div>
                      <div className="text-[11px] text-zinc-400">
                        {cand.operatorName} · Schedule baseline:{" "}
                        <strong>{cand.scheduleBaselineStatus}</strong>
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top font-mono text-[11px] text-cyan-200">
                      <div>{cand.travelerReadyAt.formattedSummary}</div>
                      <div className="text-zinc-400">{cand.travelerReadyAt.utcIso}</div>
                    </td>
                    <td className="py-3 px-3 align-top font-mono text-[11px] text-zinc-200">
                      <div>
                        Departs: <strong>{cand.departureLocal}</strong> (
                        {cand.departureUtcShort})
                      </div>
                      <div>
                        Ticket cutoff: <strong>{cand.ticketCutoffLocal}</strong> (
                        {cand.ticketCutoffUtcShort})
                      </div>
                      <div>
                        Taj entry cutoff:{" "}
                        <strong>{cand.destinationCutoffLocal || "16:30"}</strong>
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                          cand.catchable
                            ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                            : "border border-rose-400/40 bg-rose-500/20 text-rose-200"
                        }`}
                      >
                        {cand.catchable
                          ? `Catchable (+${cand.slackToDepartureMinutes}m)`
                          : `Missed (${cand.slackToDepartureMinutes}m)`}
                      </span>
                      <div className="mt-1 text-[11px] text-zinc-300">
                        {cand.reasonSummary}
                      </div>
                    </td>
                    <td className="py-3 pl-3 align-top font-mono text-[11px] text-zinc-300">
                      <div>
                        Source: <strong>{cand.legProvenance.source}</strong>
                      </div>
                      <div>Timestamp: {cand.legProvenance.timestamp}</div>
                      <div>Expiry: {cand.legProvenance.expiry}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Taj Mahal Official Visiting Rules (Dated Official Source) */}
        <section
          aria-label="Taj Mahal Official Visiting Rules"
          className="rounded-2xl border border-white/15 bg-slate-900/75 p-6 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">
              Taj Mahal Official Entry Rules &amp; Friday Closure Gate (Dated Source:{" "}
              {TAJ_MAHAL_VISITING_RULES.verifiedOnDate})
            </h2>
            <a
              href={TAJ_MAHAL_VISITING_RULES.officialWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-cyan-300 underline"
            >
              Official ASI Portal ({TAJ_MAHAL_VISITING_RULES.officialWebsiteUrl}) ↗
            </a>
          </div>
          <div className="grid gap-3 md:grid-cols-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 space-y-1.5">
              <div>
                <strong className="text-amber-300">Weekly Friday Closure:</strong>{" "}
                {TAJ_MAHAL_VISITING_RULES.weeklyClosureDetail}
              </div>
              <div>
                <strong className="text-zinc-200">Sunrise–Sunset Window:</strong>{" "}
                {TAJ_MAHAL_VISITING_RULES.sunriseToSunsetWindowNote}
              </div>
              <div>
                <strong className="text-zinc-200">Statutory Entry Fee:</strong>{" "}
                {TAJ_MAHAL_VISITING_RULES.foreignerEntryFeeInr} +{" "}
                {TAJ_MAHAL_VISITING_RULES.mausoleumAddonInr}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 space-y-1.5">
              <div>
                <strong className="text-cyan-300">
                  TTZ 500m Electric Golf-Cart Rule:
                </strong>{" "}
                {TAJ_MAHAL_VISITING_RULES.eastAndWestGateElectricShuttleRule}
              </div>
              <div>
                <strong className="text-rose-300">CISF Prohibited Items:</strong>{" "}
                {TAJ_MAHAL_VISITING_RULES.strictProhibitedItems.join("; ")}.
              </div>
            </div>
          </div>
        </section>

        {/* Transport Options (Dated Official Rail vs. Pending Private Car Items in Review Desk) */}
        <section
          aria-label="Delhi to Agra Transport Options"
          data-testid="delhi-agra-options"
          className="rounded-2xl border border-white/15 bg-slate-900/75 p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-white">
            Transport Options &amp; Dated Source / Operator Confirmation Gate
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {DELHI_AGRA_QUALIFIED_OPTIONS.map((opt) => (
              <div
                key={opt.optionId}
                data-testid={`delhi-agra-option-${opt.optionId}`}
                className="rounded-xl border border-white/10 bg-slate-950/75 p-4 text-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase text-cyan-300">
                    {opt.mode.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      opt.pricingVerificationGate.verified
                        ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                        : "border border-amber-400/30 bg-amber-500/15 text-amber-200"
                    }`}
                  >
                    {opt.pricingVerificationGate.statusLabel}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{opt.title}</h3>
                <div>
                  <strong className="text-zinc-200">Schedule:</strong>{" "}
                  {opt.scheduleAndDuration}
                </div>
                <div>
                  <strong className="text-zinc-200">Price Gate:</strong>{" "}
                  <span
                    className={
                      opt.pricingVerificationGate.verified
                        ? "text-emerald-200"
                        : "text-amber-200"
                    }
                  >
                    {opt.pricingVerificationGate.publicDisplayValue}
                  </span>
                </div>
                <div>
                  <strong className="text-zinc-200">Permit Gate:</strong>{" "}
                  <span
                    className={
                      opt.permitVerificationGate.verified
                        ? "text-zinc-200"
                        : "text-amber-200"
                    }
                  >
                    {opt.permitVerificationGate.publicDisplayValue}
                  </span>
                </div>
                <div>
                  <strong className="text-zinc-200">Refund / Delay Gate:</strong>{" "}
                  <span
                    className={
                      opt.refundTermsVerificationGate.verified
                        ? "text-zinc-200"
                        : "text-amber-200"
                    }
                  >
                    {opt.refundTermsVerificationGate.publicDisplayValue}
                  </span>
                </div>
                <div className="pt-1">
                  {opt.bookingOrWhatsappHref ? (
                    <a
                      href={opt.bookingOrWhatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 font-bold text-cyan-200 hover:bg-cyan-500/25"
                    >
                      {opt.bookingOrWhatsappChannelLabel} ↗
                    </a>
                  ) : (
                    <a
                      href="#review-desk"
                      className="inline-block rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 font-bold text-amber-200"
                    >
                      {opt.bookingOrWhatsappChannelLabel}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Review Desk Open Items */}
        <section
          id="review-desk"
          aria-label="Delhi to Agra Review Desk Open Items"
          data-testid="delhi-agra-review-desk"
          className="rounded-2xl border border-amber-400/35 bg-amber-950/15 p-6 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-amber-200">
              DCC Review Desk — Open Qualification Items (Delhi → Agra)
            </h2>
            <span className="font-mono text-xs text-amber-200">
              {reviewDeskRows.length} open item(s) · status: needs confirmation
            </span>
          </div>
          <p className="text-xs text-zinc-300">
            Unverified commercial car tariffs, AITP permit numbers, and placeholder
            WhatsApp links are withheld from confirmed claims and tracked in{" "}
            <code>/api/internal/research/approved-facts?port=delhi-to-agra</code>:
          </p>
          <div className="space-y-2.5">
            {reviewDeskRows.map((row) => (
              <div
                key={row.fact_id}
                data-testid={`review-desk-row-${row.fact_id}`}
                className="rounded-xl border border-white/10 bg-slate-950/80 p-3.5 text-xs space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-bold text-cyan-300">
                    {row.fact_id}
                  </span>
                  <span className="rounded border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                    {row.status}
                  </span>
                </div>
                <div className="font-semibold text-white">{row.value}</div>
                <div className="text-zinc-300">{row.source_excerpt}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
