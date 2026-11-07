import type { Metadata } from "next";
import Link from "next/link";
import {
  evaluateHongKongMacaoCorridorRecheck,
  getReviewDeskItemsForInternationalCorridor,
  HONG_KONG_MACAO_QUALIFIED_OPTIONS,
} from "@/lib/dcc/corridors/internationalCorridorQualifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Hong Kong → Macao Cross-Boundary Transfer & Ferry Qualification | Destination Command Center",
  description:
    "Compare HZMB 24/7 Gold Bus, Cotai Water Jet / TurboJET high-speed ferries, and dual-plate cross-boundary MPVs. Includes sample HK ImmD checkpoint waiting-time scenarios and Review Desk qualification status.",
  alternates: {
    canonical: "https://destinationcommandcenter.com/routes/hong-kong-to-macao",
  },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstStr(val: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(val)) return val[0] || fallback;
  return typeof val === "string" && val.trim() ? val.trim() : fallback;
}

export default async function HongKongToMacaoPage({ searchParams }: PageProps = {}) {
  const resolved = searchParams ? await searchParams : {};
  const rawScenario = firstStr(resolved.scenario, "normal_weekday");
  const scenario =
    rawScenario === "weekend_peak_hzmb_queue" ||
    rawScenario === "typhoon_signal_8"
      ? rawScenario
      : "normal_weekday";
  const rawOrigin = firstStr(resolved.origin, "CENTRAL_KOWLOON");
  const originArea =
    rawOrigin === "HKIA_LANTAU" ? "HKIA_LANTAU" : "CENTRAL_KOWLOON";
  const partySize = Math.max(
    1,
    Number.parseInt(firstStr(resolved.passengers, "4"), 10) || 4,
  );
  const largeBags = Math.max(
    0,
    Number.parseInt(firstStr(resolved.bags, "4"), 10) || 4,
  );

  const recheck = evaluateHongKongMacaoCorridorRecheck({
    scenario,
    originArea,
    partySize,
    largeBags,
  });
  const reviewDeskRows =
    getReviewDeskItemsForInternationalCorridor("china-hk-macao");

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
              Greater Bay Area Qualification: Hong Kong → Macao (HZMB &amp; Ferry)
            </span>
          </div>
          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 font-mono text-[11px] text-amber-200">
            Dated Source Gate Active · Checkpoint Examples Labeled as Samples
          </span>
        </div>

        {/* Hero */}
        <header className="rounded-2xl border border-white/15 bg-slate-900/85 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            International Corridor 3 — Hong Kong SAR ↔ Macao SAR (HZMB Bridge vs. Ferry)
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Hong Kong → Macao Cross-Boundary Transport Guide
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">
            Compare the <strong>HZMB 24/7 Shuttle Bus (&ldquo;Gold Bus&rdquo;)</strong>,{" "}
            <strong>Cotai Water Jet / TurboJET high-speed ferries</strong>, and{" "}
            <strong>dual-plate cross-boundary 6-passenger MPVs</strong>. Statutory
            Gold Bus and ferry fares are backed by dated official sources, while
            commercial private MPV HKD tariffs, CRP/DSAT permit numbers, and
            booking/WhatsApp links remain queued in the{" "}
            <a href="#review-desk" className="text-cyan-300 underline">
              DCC Review Desk
            </a>{" "}
            until operator confirmation is recorded.
          </p>
        </header>

        {/* Compact Shared Trip Recheck Card (Sample Scenario) */}
        <section
          aria-label="Hong Kong to Macao Shared Trip Recheck"
          data-testid="hk-macao-recheck-card"
          className="rounded-2xl border border-cyan-400/35 bg-cyan-950/20 p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                What Changed / What Still Fits / Next Step (HK → Macao)
              </span>
              <span
                data-testid="hk-macao-sample-badge"
                className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-200"
              >
                {recheck.sampleLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Link
                href="/routes/hong-kong-to-macao?scenario=normal_weekday"
                className={`rounded-lg border px-2.5 py-1 ${
                  scenario === "normal_weekday"
                    ? "border-cyan-300 bg-cyan-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Sample 1: Normal Weekday Clearance
              </Link>
              <Link
                href="/routes/hong-kong-to-macao?scenario=weekend_peak_hzmb_queue"
                className={`rounded-lg border px-2.5 py-1 ${
                  scenario === "weekend_peak_hzmb_queue"
                    ? "border-amber-300 bg-amber-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Sample 2: Weekend Peak HZMB Queue
              </Link>
              <Link
                href="/routes/hong-kong-to-macao?scenario=typhoon_signal_8"
                className={`rounded-lg border px-2.5 py-1 ${
                  scenario === "typhoon_signal_8"
                    ? "border-rose-300 bg-rose-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Sample 3: HKO Typhoon Signal No. 8
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                1. What Changed (Sample)
              </div>
              <p className="mt-1 text-zinc-100">{recheck.recheckCard.whatChanged}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                2. What Still Fits (Sample)
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
        </section>

        {/* Sample HK ImmD Checkpoint Waiting-Time Table */}
        <section
          aria-label="Sample Hong Kong Immigration Control Point Waiting Times"
          data-testid="hk-macao-sample-checkpoint-table"
          className="rounded-2xl border border-white/15 bg-slate-900/75 p-6 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                Boundary Control Point Clearance Comparison (HZMB Port vs. Sheung Wan Ferry)
              </h2>
              <span className="rounded border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                Sample Data
              </span>
            </div>
            <span className="text-xs text-zinc-400">
              Modeled on HK Immigration Department control-point bands (Illustrative Sample)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/15 text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="py-2 pr-3">Boundary Control Point (Sample)</th>
                  <th className="py-2 px-3">Visitor Hall Wait Band (Sample)</th>
                  <th className="py-2 px-3">HKO Tropical Cyclone Signal (Sample)</th>
                  <th className="py-2 pl-3">Operating Status (Sample)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recheck.checkpoints.map((cp) => (
                  <tr key={cp.controlPointId}>
                    <td className="py-3 pr-3">
                      <span className="mr-1.5 rounded border border-amber-400/35 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                        Sample
                      </span>
                      <strong className="text-white">{cp.controlPointName}</strong>
                      <div className="font-mono text-[11px] text-zinc-400">
                        {cp.controlPointId} · Sample timestamp: {cp.timestampHkt}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-200">
                      {cp.visitorClearanceWaitMinutes} min ({cp.waitBandLabel}) [Sample]
                    </td>
                    <td className="py-3 px-3 text-amber-200">
                      {cp.hkoTropicalCycloneSignal} (Sample)
                    </td>
                    <td className="py-3 pl-3 font-semibold text-zinc-200">
                      {cp.serviceOperatingStatus} (Sample)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cross-Boundary Options & Dated Source / Operator Confirmation Gate */}
        <section
          aria-label="Hong Kong to Macao Qualified Options"
          data-testid="hk-macao-options"
          className="rounded-2xl border border-white/15 bg-slate-900/75 p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-white">
            Cross-Boundary Transport Options &amp; Verification Gate
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {HONG_KONG_MACAO_QUALIFIED_OPTIONS.map((opt) => (
              <div
                key={opt.optionId}
                data-testid={`hk-macao-option-${opt.optionId}`}
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
                  <strong className="text-zinc-200">Operator:</strong>{" "}
                  {opt.licensedOperatorName}
                </div>
                <div>
                  <strong className="text-zinc-200">Price Gate (HKD):</strong>{" "}
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
                  <strong className="text-zinc-200">Luggage &amp; Seating:</strong>{" "}
                  {opt.luggageAndPassengerRules}
                </div>
                <div>
                  <strong className="text-zinc-200">Refund / Closure Gate:</strong>{" "}
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
          aria-label="Hong Kong to Macao Review Desk Open Items"
          data-testid="hk-macao-review-desk"
          className="rounded-2xl border border-amber-400/35 bg-amber-950/15 p-6 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-amber-200">
              DCC Review Desk — Open Qualification Items (Hong Kong → Macao)
            </h2>
            <span className="font-mono text-xs text-amber-200">
              {reviewDeskRows.length} open item(s) · status: needs confirmation
            </span>
          </div>
          <p className="text-xs text-zinc-300">
            Dual-plate private MPV HKD tariffs, CRP/DSAT permit numbers, and
            placeholder WhatsApp links are withheld from confirmed claims and
            tracked in{" "}
            <code>
              /api/internal/research/approved-facts?port=hong-kong-to-macao
            </code>
            :
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
