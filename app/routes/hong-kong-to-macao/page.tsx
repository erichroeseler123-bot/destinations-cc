import type { Metadata } from "next";
import Link from "next/link";
import SharedTripRecheckCard from "@/app/components/dcc/SharedTripRecheckCard";
import {
  HK_IMMD_CHECKPOINT_WAIT_SAMPLES,
  HK_MACAO_MOBILE_CHANNELS,
  HK_MACAO_SAMPLE_TRIP_FITS,
  HK_MACAO_SAMPLE_TRIP_NEEDS_VERIFICATION,
  HK_MACAO_SIX_FACTOR_ENTRY_MODEL,
  HZMB_TRANSPORT_OPTIONS,
  SHENZHEN_SEPARATE_ROUTE_NOTICE,
  evaluateHkMacaoTrip,
} from "@/lib/dcc/corridors/internationalCorridorQualifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Hong Kong to Macao HZMB Planning Guide: Golden Bus vs. Authorized Cross-Boundary Hire Car | Destination Command Center",
  description:
    "Compare the HZMB Bridge Shuttle ('Golden Bus') and authorized cross-boundary private hire cars (HK Transport Department Closed Road Permit). Shows timestamped HK ImmD checkpoint waits, verifies Macao CPSP entry and HK ImmD re-entry separately, confirms private hire still includes immigration clearance, and separates Shenzhen Mainland China rules.",
  alternates: { canonical: "/routes/hong-kong-to-macao" },
};

export default async function HongKongToMacaoPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const customEval = evaluateHkMacaoTrip({
    date: firstStr(sp.date) || "2026-11-18",
    departureTimeHkt: firstStr(sp.departure) || "10:30",
    direction:
      firstStr(sp.direction) === "MACAO_TO_HK" ? "MACAO_TO_HK" : "HK_TO_MACAO",
    travelerCategory:
      firstStr(sp.category) === "hk_residents" ? "hk_residents" : "visitors",
    partySize: Number(firstStr(sp.party_size)) || 2,
    standardSuitcases: Number(firstStr(sp.suitcases)) || 2,
    macaoEntryVerified: firstStr(sp.macao_entry) !== "0",
    hongKongReentryVerified: firstStr(sp.hk_reentry) !== "0",
    hireCarPermitVerifiedWithHktd: firstStr(sp.permit_verified) !== "0",
    checkpointSampleKey:
      firstStr(sp.wait_sample) === "peak_weekend_visitor"
        ? "peak_weekend_visitor"
        : "normal_weekday_visitor",
  });

  return (
    <main
      data-testid="dcc-hk-macao-corridor-page"
      className="min-h-screen bg-slate-950 text-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
        <header className="rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-6 md:p-8 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              DCC Cross-Boundary Planning Guide · Hong Kong ↔ Macao (HZMB)
            </span>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">
              Plain-Text Mobile + Amap · WhatsApp · WeChat Ready
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Hong Kong → Macao Bridge (HZMB): Golden Bus vs. Authorized
            Cross-Boundary Hire Car
          </h1>
          <p className="max-w-4xl text-sm leading-relaxed text-slate-300">
            Compares the 24/7{" "}
            <strong>HZMB Bridge Shuttle (&ldquo;Golden Bus&rdquo;)</strong> and{" "}
            <strong>
              HK Transport Department–permitted Cross-Boundary Private Hire Cars
            </strong>
            . Displays timestamped{" "}
            <strong>HK ImmD checkpoint waiting-time estimates</strong> by
            direction and traveler category, verifies{" "}
            <strong>
              Macao entry (CPSP / FSM) and Hong Kong re-entry (HK ImmD)
              separately
            </strong>
            , and reminds travelers that{" "}
            <strong>
              a private hire car trip still includes mandatory immigration
              clearance at both boundary control points
            </strong>
            .
          </p>
        </header>

        {/* Active Trip Recheck Card */}
        <SharedTripRecheckCard
          card={customEval.recheckCard}
          testId="dcc-hk-macao-active-recheck-card"
        />

        {/* Explicit Shenzhen Separation Banner */}
        <section
          data-testid="dcc-hk-macao-shenzhen-separation"
          className="rounded-2xl border border-amber-400/40 bg-amber-950/30 p-5 space-y-1.5 text-xs"
        >
          <div className="font-black uppercase tracking-wider text-amber-300">
            {SHENZHEN_SEPARATE_ROUTE_NOTICE.headline}
          </div>
          <p className="leading-relaxed text-amber-100">
            {SHENZHEN_SEPARATE_ROUTE_NOTICE.explanation}
          </p>
        </section>

        {/* Comparison: HZMB Golden Bus vs. Authorized Cross-Boundary Private Hire Car */}
        <section
          data-testid="dcc-hk-macao-mode-comparison"
          className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-6 space-y-4"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Cross-Boundary Transport Comparison
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              HZMB Bridge Shuttle (&ldquo;Golden Bus&rdquo;) vs. Authorized
              Cross-Boundary Private Hire Car
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {HZMB_TRANSPORT_OPTIONS.map((opt) => (
              <article
                key={opt.optionId}
                className="rounded-2xl border border-white/15 bg-black/35 p-5 space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <h3 className="text-base font-black text-white">
                    {opt.name}
                  </h3>
                  <a
                    href={opt.regulatorySourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline font-semibold"
                  >
                    Official Authority Source ↗
                  </a>
                </div>
                <div>
                  <strong className="text-emerald-300">Published Fare:</strong>{" "}
                  <span className="text-slate-200">
                    {opt.publishedFareSummary}
                  </span>
                </div>
                <div>
                  <strong className="text-cyan-200">
                    Boarding &amp; Drop-Off:
                  </strong>{" "}
                  <span className="text-slate-200">
                    {opt.pickupAndDropoffModel}
                  </span>
                </div>
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-2.5 text-amber-100">
                  <strong>Immigration Clearance Rule:</strong>{" "}
                  {opt.immigrationClearanceRule}
                </div>
                <div>
                  <strong className="text-slate-300">Luggage &amp; Group:</strong>{" "}
                  <span className="text-slate-300">
                    {opt.luggageAndGroupRule}
                  </span>
                </div>
                <div>
                  <strong className="text-slate-300">
                    Permit Verification:
                  </strong>{" "}
                  <span className="text-slate-300">
                    {opt.permitVerificationRequirement}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Timestamped HK ImmD Checkpoint Wait Estimates */}
        <section
          data-testid="dcc-hk-macao-checkpoint-waits"
          className="rounded-2xl border border-white/15 bg-slate-900/80 p-6 space-y-4 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                HK Immigration Department (ImmD) Open Data · Set 28
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                Published Land Boundary Control Point Waiting-Time Estimates
                (Timestamped by Direction &amp; Category)
              </h2>
            </div>
            <a
              href="https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 font-semibold text-cyan-200 underline"
            >
              data.gov.hk ImmD Dataset ↗
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.values(HK_IMMD_CHECKPOINT_WAIT_SAMPLES).map((sample) => (
              <div
                key={sample.timestampHkt}
                className="rounded-xl border border-white/10 bg-black/35 p-4 space-y-1"
              >
                <div className="flex items-center justify-between gap-2 font-bold text-white">
                  <span>{sample.controlPointName}</span>
                  <span className="font-mono text-emerald-300">
                    ~{sample.estimatedClearanceMinutes} min
                  </span>
                </div>
                <div className="text-slate-300">
                  Direction: <code>{sample.direction}</code> · Category:{" "}
                  <code>{sample.travelerCategory}</code> · Status:{" "}
                  <code>{sample.publishedWaitLevelCode}</code>
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  Timestamp (HKT): {sample.timestampHkt}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6-Factor Entry Dependency Model (Macao Entry vs. HK Re-Entry Verified Separately) */}
        <section
          data-testid="dcc-hk-macao-six-factor-entry"
          className="rounded-2xl border border-white/15 bg-slate-900/80 p-6 space-y-4"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              6-Factor Cross-Boundary Entry Dependency Model
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Verify Macao SAR Entry (CPSP) and Hong Kong SAR Re-Entry (ImmD)
              Separately
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {HK_MACAO_SIX_FACTOR_ENTRY_MODEL.map((factor) => (
              <div
                key={factor.factorKey}
                className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs space-y-2"
              >
                <div className="font-bold text-white">{factor.title}</div>
                <div className="text-slate-300">
                  <strong className="text-cyan-200">
                    Macao Authority (CPSP/Customs):
                  </strong>{" "}
                  {factor.macaoAuthorityRule}{" "}
                  <a
                    href={factor.macaoAuthorityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline"
                  >
                    [Source]
                  </a>
                </div>
                <div className="text-slate-300">
                  <strong className="text-emerald-200">
                    Hong Kong Authority (ImmD/HKTD):
                  </strong>{" "}
                  {factor.hongKongAuthorityRule}{" "}
                  <a
                    href={factor.hongKongAuthorityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-300 underline"
                  >
                    [Source]
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mobile Plain-Text Summary + Amap / WhatsApp / WeChat Support */}
        <section
          data-testid="dcc-hk-macao-mobile-channels"
          className="rounded-2xl border border-white/15 bg-slate-900/80 p-5 space-y-3 text-xs"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Low-Bandwidth Mobile Text &amp; Regional Messaging Channels
          </div>
          <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/50 p-3.5 font-mono text-slate-200">
            {HK_MACAO_MOBILE_CHANNELS.plainTextSmsSummary}
          </pre>
          <div className="flex flex-wrap gap-3">
            <a
              href={HK_MACAO_MOBILE_CHANNELS.amapRouteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-cyan-500 px-3.5 py-2 font-black text-slate-950"
            >
              Open in Amap (Gaode Navigation)
            </a>
            <a
              href={HK_MACAO_MOBILE_CHANNELS.whatsappConciergeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-2 font-bold text-emerald-200"
            >
              WhatsApp Cross-Boundary Check
            </a>
            <span className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-slate-200">
              {HK_MACAO_MOBILE_CHANNELS.wechatIdAndInstruction}
            </span>
          </div>
        </section>

        {/* 1 Trip That Fits vs. 1 Trip That Needs Verification */}
        <section
          data-testid="dcc-hk-macao-sample-comparisons"
          className="grid gap-5 lg:grid-cols-2"
        >
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Sample 1 · Trip That Fits (Macao Entry + HK Re-Entry Verified ·
              Golden Bus)
            </div>
            <SharedTripRecheckCard
              card={HK_MACAO_SAMPLE_TRIP_FITS.recheckCard}
              testId="dcc-hk-macao-sample-fits"
            />
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Sample 2 · Trip That Needs Verification (Single-Entry HK Re-Entry
              &amp; Hire Car Permit Unverified)
            </div>
            <SharedTripRecheckCard
              card={HK_MACAO_SAMPLE_TRIP_NEEDS_VERIFICATION.recheckCard}
              testId="dcc-hk-macao-sample-needs-verification"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
