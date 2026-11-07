import type { Metadata } from "next";
import Link from "next/link";
import {
  evaluateIcelandKefVikCorridorRecheck,
  getReviewDeskItemsForInternationalCorridor,
  ICELAND_KEF_VIK_OPERATOR_PROFILES,
  ICELAND_SEPARATE_TRIP_BOUNDARIES,
} from "@/lib/dcc/corridors/internationalCorridorQualifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Keflavík Airport (KEF) → Vík Transfer & Route 1 Qualification | Destination Command Center",
  description:
    "Compare Keflavík International Airport (KEF) to Vík South Coast transfers, Drive Reykjavík FAQ pickup reconciliation, sample Vegagerðin DATEX II road segments & Icelandic Met Office warnings, and open Review Desk qualification items.",
  alternates: {
    canonical: "https://destinationcommandcenter.com/routes/keflavik-to-vik",
  },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstStr(val: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(val)) return val[0] || fallback;
  return typeof val === "string" && val.trim() ? val.trim() : fallback;
}

export default async function KeflavikToVikPage({ searchParams }: PageProps = {}) {
  const resolved = searchParams ? await searchParams : {};
  const rawScenario = firstStr(resolved.scenario, "normal_winter_patches");
  const scenario =
    rawScenario === "hellisheidi_closed_rengsli_diversion" ||
    rawScenario === "eyjafjoll_full_closure"
      ? rawScenario
      : "normal_winter_patches";
  const partySize = Math.max(
    1,
    Number.parseInt(firstStr(resolved.passengers, "4"), 10) || 4,
  );
  const checkedBags = Math.max(
    0,
    Number.parseInt(firstStr(resolved.bags, "4"), 10) || 4,
  );
  const flightEtaLocal = firstStr(resolved.eta, "06:45");

  const recheck = evaluateIcelandKefVikCorridorRecheck({
    scenario,
    partySize,
    checkedBags,
    flightEtaLocal,
  });
  const reviewDeskRows =
    getReviewDeskItemsForInternationalCorridor("iceland-kef-vik");

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
              Iceland Qualification: Keflavík Airport (KEF) → Vík (Route 1)
            </span>
          </div>
          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 font-mono text-[11px] text-amber-200">
            Qualification Gate Active · Dated Source or Operator Confirmation Required
          </span>
        </div>

        {/* Hero */}
        <header className="rounded-2xl border border-white/15 bg-slate-900/85 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            International Corridor 1 — South Iceland Ring Road (Route 41 → Route 1)
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Keflavík International Airport (KEF) → Vík í Mýrdal Transfer Guide
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">
            225 km (~2h 45m in clear conditions; 3h 30m+ in winter ice/wind) across{" "}
            <strong>Reykjanesbraut (Route 41)</strong>,{" "}
            <strong>Hellisheiði Mountain Pass (Route 1)</strong>, and{" "}
            <strong>Under Eyjafjöllum to Vík</strong>. DCC requires a{" "}
            <strong>dated official source or written operator confirmation</strong>{" "}
            before publishing ISK tariffs, commercial permit numbers, closure refund
            terms, or direct booking links. Open items remain queued in the{" "}
            <a href="#review-desk" className="text-cyan-300 underline">
              DCC Review Desk
            </a>{" "}
            while this guide provides route planning, vehicle fit, and pickup policy
            reconciliation.
          </p>
        </header>

        {/* Compact Shared Trip Recheck Card (Sample Scenario) */}
        <section
          aria-label="KEF to Vík Shared Trip Recheck"
          data-testid="kef-vik-recheck-card"
          className="rounded-2xl border border-cyan-400/35 bg-cyan-950/20 p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                What Changed / What Still Fits / Next Step (KEF → Vík)
              </span>
              <span
                data-testid="kef-vik-sample-badge"
                className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-200"
              >
                {recheck.sampleLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Link
                href="/routes/keflavik-to-vik?scenario=normal_winter_patches"
                className={`rounded-lg border px-2.5 py-1 ${
                  scenario === "normal_winter_patches"
                    ? "border-cyan-300 bg-cyan-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Sample 1: Normal Winter Ice Patches
              </Link>
              <Link
                href="/routes/keflavik-to-vik?scenario=hellisheidi_closed_rengsli_diversion"
                className={`rounded-lg border px-2.5 py-1 ${
                  scenario === "hellisheidi_closed_rengsli_diversion"
                    ? "border-amber-300 bg-amber-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Sample 2: Hellisheiði Closed (Þrengsli Route 39 Bypass)
              </Link>
              <Link
                href="/routes/keflavik-to-vik?scenario=eyjafjoll_full_closure"
                className={`rounded-lg border px-2.5 py-1 ${
                  scenario === "eyjafjoll_full_closure"
                    ? "border-rose-300 bg-rose-500/20 text-white font-bold"
                    : "border-white/15 bg-slate-900 text-zinc-300"
                }`}
              >
                Sample 3: Eyjafjöll Closed (Blocks Departure)
              </Link>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs">
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                1. What Changed (Sample)
              </div>
              <p className="mt-1 text-zinc-100">{recheck.recheckCard.whatChanged}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                2. What Still Fits (Sample)
              </div>
              <p className="mt-1 text-zinc-100">
                {recheck.recheckCard.whatStillFits}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  3. Next Step
                </div>
                <p className="mt-1 text-zinc-100">{recheck.recheckCard.nextStep}</p>
              </div>
              <a
                href={recheck.recheckCard.primaryNextActionHref}
                className="mt-3 inline-block rounded-lg bg-cyan-400 px-3 py-2 text-center text-xs font-black text-slate-950 hover:bg-cyan-300"
              >
                {recheck.recheckCard.primaryNextActionLabel}
              </a>
            </div>
          </div>
        </section>

        {/* Sample Vegagerðin DATEX II & IMO Separation Table */}
        <section
          aria-label="Sample Vegagerðin DATEX II Road Segments and IMO Warnings"
          data-testid="kef-vik-sample-road-table"
          className="rounded-2xl border border-white/15 bg-slate-900/75 p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Vegagerðin DATEX II Segments &amp; Icelandic Met Office Warnings (KEF → Vík)
                </h2>
                <span className="rounded border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                  Sample Data
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Illustrates how DCC maps official segments while keeping{" "}
                <strong>(1) Road Closures</strong>,{" "}
                <strong>(2) Road-Surface Reports</strong>, and{" "}
                <strong>(3) Met Office Warnings</strong> strictly separate. All rows
                below are labeled <strong>Sample</strong> scenarios.
              </p>
            </div>
            <span className="font-mono text-[11px] text-zinc-400">
              Sample Timestamp: {recheck.telemetry.checkedAtUtc}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/15 text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="py-2 pr-3">DATEX II Segment &amp; Direction (Sample)</th>
                  <th className="py-2 px-3">1. Closure Status (Sample)</th>
                  <th className="py-2 px-3">2. Road-Surface Report (Sample)</th>
                  <th className="py-2 pl-3">3. IMO Weather Warning (Sample)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recheck.telemetry.segments.map((seg) => (
                  <tr key={seg.segmentId}>
                    <td className="py-3 pr-3 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded border border-amber-400/35 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                          Sample
                        </span>
                        <span className="font-mono font-bold text-cyan-300">
                          {seg.segmentId} ({seg.routeCode})
                        </span>
                      </div>
                      <div className="mt-0.5 font-semibold text-white">
                        {seg.segmentName}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {seg.direction} · {seg.timestampUtc}
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                          seg.closureStatus === "open"
                            ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                            : "bg-rose-500/20 text-rose-200 border border-rose-400/30"
                        }`}
                      >
                        {seg.closureStatus.replace(/_/g, " ")} (Sample)
                      </span>
                      <div className="mt-1 text-zinc-300">{seg.closureSummary}</div>
                    </td>
                    <td className="py-3 px-3 align-top">
                      <span className="font-mono text-[11px] font-semibold text-amber-200">
                        {seg.roadSurfaceCondition} (Sample)
                      </span>
                      <div className="mt-1 text-zinc-300">
                        {seg.roadSurfaceSummary}
                      </div>
                    </td>
                    <td className="py-3 pl-3 align-top">
                      <span className="font-semibold text-sky-200">
                        {seg.imoForecastRegion} — IMO {seg.imoWarningLevel.toUpperCase()} (Sample)
                      </span>
                      <div className="mt-1 text-zinc-300">
                        {seg.imoWarningSummary}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-[11px] text-zinc-400">
            <strong>Attribution &amp; Data-Use Terms:</strong>{" "}
            {recheck.telemetry.vegagerdinAttribution} ·{" "}
            {recheck.telemetry.imoAttribution} (
            <a
              href={recheck.telemetry.imoTermsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 underline"
            >
              IMO Terms of Use
            </a>
            ).
          </div>
        </section>

        {/* Operator Profiles + Drive Reykjavík FAQ Pickup Reconciliation */}
        <section
          aria-label="KEF to Vík Operator Qualification & Drive Reykjavík FAQ Reconciliation"
          data-testid="kef-vik-operator-profiles"
          className="rounded-2xl border border-white/15 bg-slate-900/75 p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-white">
            Operator Qualification &amp; Published FAQ Pickup Reconciliation
          </h2>
          <p className="text-xs text-zinc-300">
            DCC requires a <strong>dated source</strong> or{" "}
            <strong>written operator confirmation</strong> before publishing ISK
            tariffs, commercial permit numbers, road-closure refund policies, or
            direct checkout links. Unconfirmed fields are withheld below and tracked
            in the Review Desk.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {ICELAND_KEF_VIK_OPERATOR_PROFILES.map((op) => (
              <div
                key={op.operatorId}
                data-testid={`operator-card-${op.operatorId}`}
                className="rounded-xl border border-white/10 bg-slate-950/75 p-4 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white">
                    {op.brandName}
                  </h3>
                  <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                    Queued in Review Desk
                  </span>
                </div>
                <div>
                  <strong className="text-zinc-200">Licensed Business:</strong>{" "}
                  {op.licensedLegalEntity}
                </div>
                <div>
                  <strong className="text-zinc-200">Permit / Registration Gate:</strong>{" "}
                  <span className="text-amber-200">
                    {op.permitVerificationGate.publicDisplayValue}
                  </span>
                </div>
                <div>
                  <strong className="text-zinc-200">Price in ISK Gate:</strong>{" "}
                  <span className="text-amber-200">
                    {op.pricingVerificationGate.publicDisplayValue}
                  </span>
                </div>
                <div className="rounded-lg border border-cyan-400/30 bg-cyan-950/25 p-3 space-y-1">
                  <div className="font-bold text-cyan-200">
                    Pickup Policy Reconciled with Published FAQ (Checked{" "}
                    {op.faqPickupPolicyReconciliation.faqVerifiedOnDate}):
                  </div>
                  <p className="text-zinc-200">
                    {op.faqPickupPolicyReconciliation.publishedFaqRuleSummary}
                  </p>
                  <p className="text-amber-200">
                    {op.faqPickupPolicyReconciliation.reconciledSummary}
                  </p>
                  <a
                    href={op.faqPickupPolicyReconciliation.faqSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[11px] font-semibold text-cyan-300 underline"
                  >
                    View Source ({op.faqPickupPolicyReconciliation.faqSourceUrl}) ↗
                  </a>
                </div>
                <div>
                  <strong className="text-zinc-200">Vehicle &amp; Luggage Fit:</strong>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5 text-zinc-300">
                    {op.vehicleClasses.map((vc) => (
                      <li key={vc.classId}>
                        <strong>{vc.name}:</strong> max {vc.maxPassengers} pax,{" "}
                        {vc.maxCheckedBags} checked bags + {vc.maxCarryOnBags}{" "}
                        carry-ons (studded winter tires:{" "}
                        {vc.winterStuddedTiresIncluded ? "Yes" : "Verify"})
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong className="text-zinc-200">
                    Closure &amp; Refund Terms Gate:
                  </strong>{" "}
                  <span className="text-amber-200">
                    {op.refundTermsVerificationGate.publicDisplayValue}
                  </span>
                </div>
                <div>
                  <strong className="text-zinc-200">
                    Direct Booking / Quote Link Gate:
                  </strong>{" "}
                  {op.confirmedBookingOrQuoteUrl ? (
                    <a
                      href={op.confirmedBookingOrQuoteUrl}
                      className="text-cyan-300 underline"
                    >
                      {op.confirmedBookingOrQuoteUrl}
                    </a>
                  ) : (
                    <span className="text-amber-200">
                      {op.bookingLinkVerificationGate.publicDisplayValue} (Official
                      domain:{" "}
                      <a
                        href={op.officialWebsiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-300 underline"
                      >
                        {op.officialWebsiteUrl}
                      </a>
                      )
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Review Desk Section */}
        <section
          id="review-desk"
          aria-label="Iceland KEF to Vík Review Desk Open Items"
          data-testid="kef-vik-review-desk"
          className="rounded-2xl border border-amber-400/35 bg-amber-950/15 p-6 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-amber-200">
              DCC Review Desk — Open Qualification Items (KEF → Vík)
            </h2>
            <span className="font-mono text-xs text-amber-200">
              {reviewDeskRows.length} open item(s) · status: needs confirmation
            </span>
          </div>
          <p className="text-xs text-zinc-300">
            These items are registered in the DCC Review Desk (
            <code>/api/internal/research/approved-facts?port=keflavik-to-vik</code>
            ) and remain withheld from confirmed public claims until a dated source
            or written operator confirmation is recorded.
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
                <div className="text-[11px] text-zinc-400">
                  Product: <code>{row.product_id}</code> · Source:{" "}
                  <a
                    href={row.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline"
                  >
                    {row.source_url}
                  </a>{" "}
                  · Checked: {row.checked_at}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Strict Separation of Other Iceland Trips */}
        <section
          aria-label="Separate Iceland Trips"
          className="rounded-2xl border border-white/15 bg-slate-900/75 p-6 space-y-3"
        >
          <h2 className="text-lg font-bold text-white">
            Separate Iceland Trips (Not Mixed with KEF → Vík)
          </h2>
          <p className="text-xs text-zinc-400">
            Reykjavík Domestic Airport (RKV), the Golden Circle, the Blue Lagoon,
            and Sólheimajökull/Katla glacier excursions are evaluated as separate
            corridors with distinct road and hazard rules:
          </p>
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            {ICELAND_SEPARATE_TRIP_BOUNDARIES.map((b) => (
              <div
                key={b.tripSlug}
                className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5"
              >
                <div className="font-bold text-white">{b.title}</div>
                <p className="mt-1 text-zinc-300">{b.corridorDistinctReason}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
