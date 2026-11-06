import type { Metadata } from "next";
import Link from "next/link";
import { buildJanuary24SailingPreview } from "@/lib/dcc/winterPorts/january24SailingPreview";
import type { StThomasArrivalDock } from "@/lib/dcc/stThomasPortDayEngine";

export const metadata: Metadata = {
  title:
    "January 24 Sailing Preview — Nassau & St. Thomas Port-Day Options | Destination Command Center",
  description:
    "Shareable January 24 Eastern Caribbean sailing preview comparing Nassau (Prince George Wharf) and St. Thomas (Havensight WICO vs. Crown Bay) excursions, exact Viator listings (5199KSML vs. 5199P27), and St. John ferry leg fit.",
};

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function January24SailingPreviewPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : {};
  const getParam = (k: string): string | undefined => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const adults = Math.max(1, Number(getParam("adults") || 2) || 2);
  const nassauDock =
    getParam("nassauDock") === "prince_george_wharf_outer"
      ? "prince_george_wharf_outer"
      : "prince_george_wharf_ncp";
  const stThomasDockRaw = getParam("stThomasDock");
  const stThomasDock: StThomasArrivalDock =
    stThomasDockRaw === "crown_bay" ||
    stThomasDockRaw === "charlotte_amalie_tender" ||
    stThomasDockRaw === "unknown_dock" ||
    stThomasDockRaw === "havensight_wico"
      ? stThomasDockRaw
      : "havensight_wico";

  const preview = buildJanuary24SailingPreview({
    adults,
    nassauDock,
    stThomasDock,
    nassauArrivalTime: getParam("nassauArrival") || "08:00",
    nassauAllAboardTime: getParam("nassauAllAboard") || "16:30",
    stThomasArrivalTime: getParam("stThomasArrival") || "08:00",
    stThomasAllAboardTime: getParam("stThomasAllAboard") || "16:30",
  });

  const nassau = preview.calls.nassau.evaluation;
  const stThomas = preview.calls.stThomas.evaluation;
  const ferry = stThomas.stJohnDayTripChoice.ferryLegs;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-zinc-100">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
            Shareable Winter Release Preview • Draft PR #223
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white md:text-3xl">
            {preview.sailingTitle}
          </h1>
          <p className="mt-1 text-sm text-zinc-300">
            Departure:{" "}
            <strong className="text-white">
              Sunday, January 24, 2027 ({preview.sailingDepartureDate})
            </strong>{" "}
            • Party: <strong className="text-white">{adults} Adults</strong> •
            Shareable URL:{" "}
            <code className="rounded bg-black/40 px-2 py-0.5 text-xs text-cyan-300">
              {preview.shareableQueryExample}
            </code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/ports/nassau"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-semibold text-white hover:bg-white/10"
          >
            Open Nassau Port Guide →
          </Link>
          <Link
            href="/ports/st-thomas"
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 font-semibold text-cyan-200 hover:bg-cyan-500/25"
          >
            Open St. Thomas Port Guide →
          </Link>
        </div>
      </div>

      {/* Separate Preview vs. Production Status Banner */}
      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-950/25 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Preview Status (Branch: {preview.previewStatus.branch})
          </p>
          <p className="mt-2 text-sm text-zinc-200">
            <strong>Status:</strong> Ready for human review on{" "}
            <a
              href={preview.previewStatus.draftPrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-cyan-400"
            >
              Draft PR #{preview.previewStatus.draftPrNumber}
            </a>
            . All 5 winter ports (
            {preview.previewStatus.fiveWinterPortsReadyInPreview.join(", ")})
            are live in preview. Viator{" "}
            <code className="text-cyan-200">5199KSML</code> (150m, $89) and{" "}
            <code className="text-cyan-200">5199P27</code> (180m, $99) are
            strictly separated, and post-October 31 VIPA return ferry legs show{" "}
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-semibold text-amber-200">
              Needs confirmation
            </span>
            .
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/20 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Production Status (Branch: {preview.productionStatus.branch})
          </p>
          <p className="mt-2 text-sm text-zinc-200">
            <strong>Status:</strong>{" "}
            <code className="text-emerald-200">
              {preview.productionStatus.status}
            </code>
            . {preview.productionStatus.summary}
          </p>
        </div>
      </section>

      {/* Call 1: Nassau (Jan 25, 2027) */}
      <section className="mb-10 rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Port Call #1 • Monday, January 25, 2027 ({preview.calls.nassau.callDate})
            </span>
            <h2 className="mt-1 text-2xl font-black text-white">
              Nassau, Bahamas — Prince George Wharf (Nassau Cruise Port)
            </h2>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200">
            Ship Window: {nassau.evaluatedInput.shipArrivalTime}–
            {nassau.evaluatedInput.allAboardTime} EST (60m Return Buffer)
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          {nassau.publicAnswer.directAnswer}
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 text-xs uppercase tracking-wider text-zinc-400">
                <th className="py-2 pr-3">Option / Listing</th>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Duration</th>
                <th className="py-2 pr-3">Pickup / Meeting</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2 pr-3">Fit Status</th>
                <th className="py-2">Checkout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {nassau.allOptions.map((opt) => (
                <tr key={opt.optionId} className="align-top">
                  <td className="py-3 pr-3 font-semibold text-white">
                    {opt.title}
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-cyan-300">
                    {opt.productCode ?? "FREE / WALK"}
                  </td>
                  <td className="py-3 pr-3 text-zinc-200">
                    {opt.activityDurationMinutes} min
                  </td>
                  <td className="py-3 pr-3 text-xs text-zinc-300">
                    <span className="font-mono text-amber-200">
                      [{opt.pickupMode}]
                    </span>{" "}
                    {opt.pickupSummary}
                  </td>
                  <td className="py-3 pr-3 font-semibold text-white">
                    ${opt.listingPriceUsd.toFixed(2)}
                  </td>
                  <td className="py-3 pr-3">
                    <span className="inline-block rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-semibold text-cyan-200">
                      {opt.fitBadgeLabel} (+{opt.timing.netMarginMinutes}m)
                    </span>
                  </td>
                  <td className="py-3 text-xs">
                    {opt.checkoutUrl ? (
                      <a
                        href={opt.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-cyan-300 underline hover:text-cyan-200"
                      >
                        Exact Listing →
                      </a>
                    ) : (
                      <span className="text-zinc-400">No Booking Needed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Call 2: San Juan, Puerto Rico (Jan 27, 2027 — 0 Matched Catalog Tours) */}
      <section className="mb-10 rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Port Call #2 • Wednesday, January 27, 2027 ({preview.calls.sanJuan.callDate})
            </span>
            <h2 className="mt-1 text-2xl font-black text-white">
              San Juan, Puerto Rico — {preview.calls.sanJuan.dock}
            </h2>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200">
            Ship Window: {preview.calls.sanJuan.shipArrivalTime}–19:00 AST (All-Aboard{" "}
            {preview.calls.sanJuan.allAboardTime}) • 0 Matched Catalog Tours
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          {preview.calls.sanJuan.summary}
        </p>
      </section>

      {/* Call 3: St. Thomas (Jan 28, 2027) */}
      <section className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Port Call #3 • Thursday, January 28, 2027 ({preview.calls.stThomas.callDate}) • Main Destination: St. Thomas
            </span>
            <h2 className="mt-1 text-2xl font-black text-white">
              St. Thomas, USVI (Havensight WICO vs. Crown Bay) + St. John Day-Trip Choice
            </h2>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200">
            Ship Window: {stThomas.evaluatedInput.shipArrivalTime}–
            {stThomas.evaluatedInput.allAboardTime} AST (Dock:{" "}
            {stThomas.evaluatedInput.arrivalDock})
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          {stThomas.publicAnswer.directAnswer}
        </p>

        {/* St. John Day-Trip Ferry Leg Status Box */}
        <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-xs text-zinc-200">
          <p className="font-bold uppercase tracking-wider text-amber-300">
            St. John Day-Trip Ferry Leg Check (VIPA Notice Ended{" "}
            {ferry.temporaryVipaNoticeWindow.temporaryVipaNoticeEndedOn})
          </p>
          <p className="mt-1">
            <strong>Outbound Leg (Red Hook → Cruz Bay):</strong>{" "}
            {ferry.outboundLeg.selectedDepartureTime} AST (arrives Cruz Bay{" "}
            {ferry.outboundLeg.arrivalAtCruzBayTime} AST, 15m crossing) •{" "}
            <strong>Return Leg (Cruz Bay → Red Hook):</strong>{" "}
            {ferry.returnLeg.selectedReturnDepartureTime} AST (back at ship dock
            by {ferry.returnLeg.estimatedBackAtShipDockTime} AST) •{" "}
            <strong>Status:</strong>{" "}
            <span className="rounded bg-amber-500/30 px-2 py-0.5 font-bold text-amber-100">
              {ferry.statusLabel}
            </span>{" "}
            — {ferry.returnLeg.unresolvedReason}
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 text-xs uppercase tracking-wider text-zinc-400">
                <th className="py-2 pr-3">Option / Listing</th>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Duration</th>
                <th className="py-2 pr-3">Pickup / Meeting</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2 pr-3">Fit Status</th>
                <th className="py-2">Checkout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {stThomas.allOptions.map((opt) => (
                <tr key={opt.optionId} className="align-top">
                  <td className="py-3 pr-3 font-semibold text-white">
                    {opt.title}
                    {opt.isDayTripChoice ? (
                      <span className="ml-2 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[11px] font-bold text-cyan-200">
                        St. John Day-Trip Choice
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-cyan-300">
                    {opt.productCode ?? "FREE / PUBLIC"}
                  </td>
                  <td className="py-3 pr-3 text-zinc-200">
                    {opt.timing.activityDurationMinutes} min
                  </td>
                  <td className="py-3 pr-3 text-xs text-zinc-300">
                    <span className="font-mono text-amber-200">
                      [{opt.pickupMode}]
                    </span>{" "}
                    {opt.pickupSummary}
                  </td>
                  <td className="py-3 pr-3 font-semibold text-white">
                    ${opt.listingPriceUsd.toFixed(2)}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${
                        opt.fitBadgeLabel === "Needs confirmation"
                          ? "border-amber-400/40 bg-amber-500/20 text-amber-200"
                          : "border-white/15 bg-white/5 text-cyan-200"
                      }`}
                    >
                      {opt.fitBadgeLabel} (+{opt.timing.netMarginMinutes}m)
                    </span>
                  </td>
                  <td className="py-3 text-xs">
                    {opt.checkoutUrl ? (
                      <a
                        href={opt.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-cyan-300 underline hover:text-cyan-200"
                      >
                        Exact Listing →
                      </a>
                    ) : (
                      <span className="text-zinc-400">No Booking Needed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
