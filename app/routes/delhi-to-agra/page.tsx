import type { Metadata } from "next";
import Link from "next/link";
import {
  DELHI_AGRA_QUALIFIED_OPTIONS,
  evaluateDelhiAgraCorridorRecheck,
  getReviewDeskItemsForInternationalCorridor,
  OFFICIAL_NTES_LIVE_TRAIN_LOOKUP,
  TAJ_MAHAL_VISITING_RULES,
} from "@/lib/dcc/corridors/internationalCorridorQualifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Delhi → Agra Rail & Private Car Qualification (DCC-412 Connection Recheck) | Destination Command Center",
  description:
    "Plan Delhi to Agra day trips: DCC-412 station exit readiness (travelerReadyAt in Asia/Kolkata & UTC ISO-8601), official NTES lookup, traveler-entered ETA, Taj entry gate cutoffs, and Review Desk verification.",
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
  const date = firstStr(resolved.date, "2026-12-10");
  const rawDelayStr = firstStr(resolved.delay, "42");
  const parsedDelay = Number.parseInt(rawDelayStr, 10);
  const trainDelayMinutes = Number.isFinite(parsedDelay)
    ? Math.max(0, parsedDelay)
    : 42;
  const scheduledArrivalLocal = firstStr(
    resolved.scheduled_arrival || resolved.arrival,
    "09:50",
  );
  const travelerEtaParam = firstStr(resolved.eta || resolved.absolute_eta, "");
  const destinationCutoffLocal = firstStr(resolved.cutoff, "16:30");
  const transferBufferMinutes = Math.max(
    0,
    Number.parseInt(firstStr(resolved.exit_buffer, "15"), 10) || 15,
  );
  const criticalUpdateMissing =
    firstStr(resolved.missing_update, "0") === "1" ||
    firstStr(resolved.missing_update, "false") === "true";
  const staleUpdate =
    firstStr(resolved.stale_update, "0") === "1" ||
    firstStr(resolved.stale_update, "false") === "true";
  const partySize = Math.max(
    1,
    Number.parseInt(firstStr(resolved.passengers, "2"), 10) || 2,
  );

  const recheck = evaluateDelhiAgraCorridorRecheck({
    date,
    trainDelayMinutes,
    scheduledArrivalLocal,
    absoluteEta: travelerEtaParam || null,
    destinationCutoffLocal,
    transferBufferMinutes,
    criticalUpdateMissing,
    staleUpdate,
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
        <header className="rounded-2xl border border-white/15 bg-slate-900/85 p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            International Corridor 2 — {dcc412.places.delhiRailStation.name} →{" "}
            {dcc412.places.agraCantt.name} → {dcc412.places.tajEntryGate.name}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Delhi → Agra Rail, Station Exit &amp; Taj Mahal Cutoff Guide
          </h1>
          <p className="max-w-3xl text-sm text-zinc-300">
            Powered by <code>DCC-412</code> inside <code>sharedTripRecheck</code>.
            Models the three distinct corridor places (
            <strong>{dcc412.places.delhiRailStation.name}</strong>,{" "}
            <strong>{dcc412.places.agraCantt.name}</strong>, and{" "}
            <strong>{dcc412.places.tajEntryGate.name}</strong>), resolves local
            times in <code>Asia/Kolkata</code> to UTC ISO-8601 timestamps, adds
            the station exit buffer <strong>once</strong> to compute{" "}
            <code>travelerReadyAt</code>, and checks onward departures (`10:30`
            and `11:00` a.m. + `25m` to gate) against the Taj entry gate cutoff.
            While official CRIS/NTES machine feed access is pending, use the{" "}
            <a
              href={OFFICIAL_NTES_LIVE_TRAIN_LOOKUP.officialMobileAndWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 underline font-semibold"
            >
              Official NTES Lookup ↗
            </a>{" "}
            and enter your revised ETA below. Commercial transfer checkout is
            enabled only once the operator, price, and booking link are verified
            in the{" "}
            <a href="#review-desk" className="text-cyan-300 underline">
              DCC Review Desk
            </a>
            .
          </p>

          {/* 3 Distinct Corridor Places Banner */}
          <div
            data-testid="delhi-agra-three-places"
            className="grid gap-2.5 sm:grid-cols-3 pt-1 text-xs"
          >
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-3">
              <div className="font-mono text-[10px] uppercase text-cyan-300">
                1. Origin Rail Station ({dcc412.places.delhiRailStation.placeId})
              </div>
              <div className="mt-0.5 font-bold text-white">
                {dcc412.places.delhiRailStation.name}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-3">
              <div className="font-mono text-[10px] uppercase text-cyan-300">
                2. Arrival &amp; Interchange ({dcc412.places.agraCantt.placeId})
              </div>
              <div className="mt-0.5 font-bold text-white">
                {dcc412.places.agraCantt.name} (+{dcc412.transferBufferMinutes}m exit)
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-3">
              <div className="font-mono text-[10px] uppercase text-cyan-300">
                3. Destination Gate ({dcc412.places.tajEntryGate.placeId})
              </div>
              <div className="mt-0.5 font-bold text-white">
                {dcc412.places.tajEntryGate.name} (+25m from AGC departure)
              </div>
            </div>
          </div>
        </header>

        {/* Official NTES Lookup + Labeled Traveler-Entered ETA Form */}
        <section
          aria-label="Official NTES Lookup and Labeled Traveler-Entered ETA"
          data-testid="delhi-agra-ntes-and-eta-form"
          className="rounded-2xl border border-white/15 bg-slate-900/80 p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                Official NTES Train Running Lookup &amp; Labeled Traveler-Entered ETA
              </h2>
              <p className="mt-0.5 text-xs text-zinc-300">
                Live CRIS/NTES API feed access is currently pending approval (
                <code>status: pending_approved_machine_access</code>). Check your
                train’s live running status on the official Indian Railways NTES
                portal, then enter your <strong>Traveler-Entered Revised ETA (IST)</strong>{" "}
                or delay minutes to recheck your Agra Cantt connection and Taj entry gate cutoff:
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href={OFFICIAL_NTES_LIVE_TRAIN_LOOKUP.officialMobileAndWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="official-ntes-lookup-link"
                className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 font-bold text-cyan-200 hover:bg-cyan-500/25"
              >
                Open Official NTES Live Lookup (enquiry.indianrail.gov.in) ↗
              </a>
              <a
                href={OFFICIAL_NTES_LIVE_TRAIN_LOOKUP.crisPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-zinc-300 hover:text-white"
              >
                CRIS proNTES Info ↗
              </a>
            </div>
          </div>

          <form
            method="get"
            action="/routes/delhi-to-agra"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 text-xs items-end"
          >
            <label className="space-y-1">
              <span className="block font-semibold text-zinc-200">
                Service Date (IST)
              </span>
              <input
                type="text"
                name="date"
                defaultValue={date}
                className="w-full rounded-lg border border-white/15 bg-slate-950 px-2.5 py-1.5 font-mono text-white"
              />
            </label>
            <label className="space-y-1">
              <span className="block font-semibold text-zinc-200">
                Scheduled AGC Arrival
              </span>
              <input
                type="text"
                name="scheduled_arrival"
                defaultValue={scheduledArrivalLocal}
                className="w-full rounded-lg border border-white/15 bg-slate-950 px-2.5 py-1.5 font-mono text-white"
              />
            </label>
            <label className="space-y-1">
              <span
                data-testid="traveler-entered-eta-label"
                className="block font-semibold text-cyan-300"
              >
                Traveler-Entered ETA (IST)
              </span>
              <input
                type="text"
                name="eta"
                placeholder="e.g. 10:32 (optional)"
                defaultValue={travelerEtaParam}
                aria-label="Traveler-Entered Revised ETA (IST — while official CRIS/NTES machine feed access is pending)"
                className="w-full rounded-lg border border-cyan-400/40 bg-slate-950 px-2.5 py-1.5 font-mono text-white"
              />
            </label>
            <label className="space-y-1">
              <span className="block font-semibold text-zinc-200">
                Or Delay (Minutes)
              </span>
              <input
                type="number"
                name="delay"
                defaultValue={String(trainDelayMinutes)}
                className="w-full rounded-lg border border-white/15 bg-slate-950 px-2.5 py-1.5 font-mono text-white"
              />
            </label>
            <label className="space-y-1">
              <span className="block font-semibold text-zinc-200">
                Taj Gate Cutoff (IST)
              </span>
              <input
                type="text"
                name="cutoff"
                defaultValue={destinationCutoffLocal}
                className="w-full rounded-lg border border-white/15 bg-slate-950 px-2.5 py-1.5 font-mono text-white"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 font-bold text-white hover:bg-cyan-500/30"
            >
              Recheck Connection →
            </button>
          </form>
        </section>

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
                <span
                  data-testid="dcc412-cutoff-verdict-badge"
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                    dcc412.fitsDestinationCutoff
                      ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                      : "border-rose-400/40 bg-rose-500/20 text-rose-200"
                  }`}
                >
                  Gate Arrival {dcc412.gateArrivalLocal || "—"} vs. Cutoff{" "}
                  {dcc412.destinationCutoffLocal || "16:30"}:{" "}
                  {dcc412.cutoffVerdictLabel}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-300">
                Scheduled arrival{" "}
                <strong>{dcc412.scheduledArrivalLocal} local</strong> (
                <code>{dcc412.scheduledArrivalUtc}</code>) +{" "}
                <strong>{dcc412.delayMinutesApplied} min delay</strong> (
                <code>etaResolutionMode={dcc412.etaResolutionMode}</code>) →
                effective arrival{" "}
                <strong>{dcc412.effectiveArrivalLocal} local</strong> (
                <code>{dcc412.effectiveArrivalUtcShort}</code>) +{" "}
                <strong>
                  {dcc412.transferBufferMinutes} min station exit buffer
                </strong>{" "}
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
                (
                <code data-testid="dcc412-traveler-ready-utc">
                  {dcc412.travelerReadyAt.utcIso}
                </code>
                ). Next service:{" "}
                <strong>
                  {dcc412.nextServiceAfterReady?.departureLocal || "—"}
                </strong>{" "}
                → reaches{" "}
                <strong>{dcc412.places.tajEntryGate.name}</strong> at{" "}
                <strong data-testid="dcc412-gate-arrival-local">
                  {dcc412.gateArrivalLocal || "—"}
                </strong>{" "}
                (
                <strong data-testid="dcc412-cutoff-verdict-text">
                  {dcc412.cutoffVerdictLabel}
                </strong>
                ).
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Link
                href="/routes/delhi-to-agra?date=2026-12-10&scheduled_arrival=09:50&delay=0&exit_buffer=15&cutoff=11:00"
                className={`rounded-lg border px-2.5 py-1 ${
                  date === "2026-12-10" &&
                  dcc412.delayMinutesApplied === 0 &&
                  destinationCutoffLocal === "11:00"
                    ? "border-emerald-300 bg-emerald-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Dec 10 Case 1: On Time + 11:00 Cutoff (Fits by 5m)
              </Link>
              <Link
                href="/routes/delhi-to-agra?date=2026-12-10&scheduled_arrival=09:50&delay=42&exit_buffer=15&cutoff=11:00"
                className={`rounded-lg border px-2.5 py-1 ${
                  date === "2026-12-10" &&
                  dcc412.delayMinutesApplied === 42 &&
                  destinationCutoffLocal === "11:00"
                    ? "border-rose-300 bg-rose-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Dec 10 Case 2: +42m Delay + 11:00 Cutoff (Misses by 25m)
              </Link>
              <Link
                href="/routes/delhi-to-agra?date=2026-12-10&scheduled_arrival=09:50&delay=42&exit_buffer=15&cutoff=11:30"
                className={`rounded-lg border px-2.5 py-1 ${
                  date === "2026-12-10" &&
                  dcc412.delayMinutesApplied === 42 &&
                  destinationCutoffLocal === "11:30"
                    ? "border-cyan-300 bg-cyan-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Dec 10 Case 3: +42m Delay + 11:30 Cutoff (Fits by 5m)
              </Link>
              <Link
                href="/routes/delhi-to-agra?date=2026-12-10&scheduled_arrival=09:50&eta=10:32&exit_buffer=15&cutoff=11:00"
                className={`rounded-lg border px-2.5 py-1 ${
                  Boolean(travelerEtaParam)
                    ? "border-cyan-300 bg-cyan-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Traveler ETA 10:32 (= +42m Delay)
              </Link>
              <Link
                href="/routes/delhi-to-agra?date=2026-12-10&scheduled_arrival=09:50&delay=42&exit_buffer=15&cutoff=11:30&missing_update=1"
                className={`rounded-lg border px-2.5 py-1 ${
                  criticalUpdateMissing || staleUpdate
                    ? "border-amber-300 bg-amber-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Missing/Stale Update (Needs Verification)
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
                  <th className="py-2 px-3">Departure &amp; Gate Arrival (Local / UTC)</th>
                  <th className="py-2 px-3">Connection &amp; Gate Cutoff Verdict</th>
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
                        Departs AGC: <strong>{cand.departureLocal}</strong> (
                        {cand.departureUtcShort})
                      </div>
                      <div>
                        Reaches Taj Gate:{" "}
                        <strong>{cand.arrivalAtDestinationLocal}</strong> (
                        {cand.arrivalAtDestinationUtc})
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
                          ? `Catchable (+${cand.slackToDepartureMinutes}m dep / +${cand.slackToDestinationCutoffMinutes ?? 0}m gate)`
                          : !cand.passesDepartureTime
                            ? `Missed Departure (${cand.slackToDepartureMinutes}m)`
                            : `Misses Gate Cutoff (${cand.slackToDestinationCutoffMinutes}m)`}
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
