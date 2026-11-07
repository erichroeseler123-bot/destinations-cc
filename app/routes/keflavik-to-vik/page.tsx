import type { Metadata } from "next";
import Link from "next/link";
import SharedTripRecheckCard from "@/app/components/dcc/SharedTripRecheckCard";
import {
  ICELAND_KEF_VIK_OPERATOR_PROFILES,
  ICELAND_OPERATOR_OUTREACH_DRAFT,
  KEF_TO_VIK_DATE_ROAD_SAMPLES,
  KEF_VIK_SAMPLE_TRIP_FITS,
  KEF_VIK_SAMPLE_TRIP_NEEDS_VERIFICATION,
  SEPARATED_ICELAND_TRIPS,
  evaluateKefToVikTrip,
} from "@/lib/dcc/corridors/internationalCorridorQualifications";

export const dynamic = "force-dynamic";

const BASE_URL = "https://destinationcommandcenter.com";

export const metadata: Metadata = {
  title:
    "Keflavík Airport (KEF) to Vík Transfer & Road Qualification | Destination Command Center",
  description:
    "KEF → Vík South Coast transfer guide along Route 41 and Route 1. Compares licensed Iceland operators (NorthTrip & Drive Reykjavík) in ISK, maps Vegagerðin DATEX II road closures and surface reports separately from Icelandic Met Office warnings, and separates RKV, Golden Circle, Blue Lagoon, and glacier trips.",
  alternates: { canonical: "/routes/keflavik-to-vik" },
};

export default async function KeflavikToVikPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const customEval = evaluateKefToVikTrip({
    date: firstStr(sp.date) || "2026-11-18",
    kefFlightNumber: firstStr(sp.flight) || "FI 614",
    scheduledArrivalLocal: firstStr(sp.arrival) || "06:30",
    revisedArrivalLocal: firstStr(sp.revised_eta),
    partySize: Number(firstStr(sp.party_size)) || 4,
    standardSuitcases: Number(firstStr(sp.suitcases)) || 4,
    oversizedBags: Number(firstStr(sp.oversized)) || 0,
    roadSampleKey:
      firstStr(sp.road_sample) === "closed_eyjafjoll_wind_siege"
        ? "closed_eyjafjoll_wind_siege"
        : "open_winter_spots_of_ice",
  });

  const openSample = KEF_TO_VIK_DATE_ROAD_SAMPLES.open_winter_spots_of_ice;
  const closedSample = KEF_TO_VIK_DATE_ROAD_SAMPLES.closed_eyjafjoll_wind_siege;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Keflavík Airport (KEF) to Vík Transfer & Road Qualification Reference",
    url: `${BASE_URL}/routes/keflavik-to-vik`,
    description:
      "Official Vegagerðin DATEX II road mapping, Icelandic Met Office warning separation, and licensed operator qualification (NorthTrip & Drive Reykjavík) for Keflavík Airport (KEF) → Vík.",
  };

  return (
    <main
      data-testid="dcc-kef-vik-corridor-page"
      className="min-h-screen bg-slate-950 text-white"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
        <header className="rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-6 md:p-8 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              DCC International Booking Qualification · Primary Iceland Corridor
            </span>
            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200">
              Direct Checkout Gated Pending 10% Operator Link Confirmation
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Keflavík Airport (KEF) → Vík í Mýrdal Transfer &amp; Road Reference
          </h1>
          <p className="max-w-4xl text-sm leading-relaxed text-slate-300">
            Covers point-to-point international arrivals from{" "}
            <strong>Keflavík International Airport (KEF)</strong> to{" "}
            <strong>Vík í Mýrdal</strong> (~225 km / 2h55m–3h30m via{" "}
            <strong>Route 41 Reykjanesbraut</strong> and{" "}
            <strong>
              Route 1 Ring Road over Hellisheiði, Selfoss, Hvolsvöllur, and
              Under Eyjafjöll
            </strong>
            ). Road closures, road-surface reports, and Icelandic Met Office
            warnings are evaluated as three separate layers.{" "}
            <strong>A road closure blocks the affected departure.</strong>
          </p>
        </header>

        {/* Active Trip Recheck Card */}
        <SharedTripRecheckCard
          card={customEval.recheckCard}
          testId="dcc-kef-vik-active-recheck-card"
        />

        {/* Explicit Separation of Separate Iceland Trips */}
        <section
          data-testid="dcc-kef-vik-separated-trips"
          className="rounded-2xl border border-white/15 bg-slate-900/75 p-6 space-y-4"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Strict Corridor Scope Boundary
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Separate Trips Not Bundled into KEF → Vík Point-to-Point Transfers
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Reykjavík Domestic Airport (RKV), the Golden Circle, the Blue
              Lagoon, and glacier excursions are evaluated as separate trips with
              their own routing and hazard rules:
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {SEPARATED_ICELAND_TRIPS.map((trip) => (
              <div
                key={trip.tripId}
                className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">
                    {trip.title}
                  </span>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-mono text-cyan-200">
                    {trip.routeOrHubCode}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  {trip.whySeparateFromKefToVik}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Qualified Operator Profiles: NorthTrip & Drive Reykjavík */}
        <section
          data-testid="dcc-kef-vik-operator-profiles"
          className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-6 space-y-5"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Licensed Iceland Operator Qualification (Priced in ISK)
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Qualified Operators: NorthTrip &amp; Drive Reykjavík
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {ICELAND_KEF_VIK_OPERATOR_PROFILES.map((op) => (
              <article
                key={op.operatorId}
                data-testid={`dcc-iceland-operator-${op.operatorId}`}
                className="rounded-2xl border border-white/15 bg-black/35 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {op.brandName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {op.legalBusinessName}
                    </p>
                  </div>
                  <a
                    href={op.regulatoryAuthorityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 underline"
                  >
                    Ferðamálastofa Licensed
                  </a>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    ISK Vehicle Rate &amp; Luggage Schedule (KEF → Vík One-Way)
                  </div>
                  {op.publishedPriceScheduleIsk.map((tier) => (
                    <div
                      key={tier.vehicleClass}
                      className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs space-y-1"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-white">
                        <span>{tier.vehicleClass}</span>
                        <span className="font-mono text-emerald-300">
                          {tier.oneWayKefToVikIsk.toLocaleString()} ISK
                        </span>
                      </div>
                      <div className="text-slate-300">
                        Max {tier.maxPassengers} passengers · Max{" "}
                        {tier.maxStandardSuitcases} standard suitcases +{" "}
                        {tier.maxCarryOnBags} carry-ons
                      </div>
                      <div className="text-slate-400">{tier.notes}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs space-y-1.5">
                  <div>
                    <strong className="text-cyan-200">
                      Delayed KEF Flight Pickup Policy:
                    </strong>{" "}
                    {op.delayedFlightPickupPolicy.extendedDelayPolicy}
                  </div>
                  <div>
                    <strong className="text-amber-200">
                      Road-Closure &amp; Refund Terms:
                    </strong>{" "}
                    {op.roadClosureAndRefundTerms.vegagerdinClosureTrigger}{" "}
                    {op.roadClosureAndRefundTerms.refundPolicyOnImpassableRoad}
                  </div>
                  <div>
                    <strong className="text-slate-300">
                      Accepted Handoff Fields:
                    </strong>{" "}
                    <code className="text-cyan-200">
                      {op.acceptedHandoffFields.join(", ")}
                    </code>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Vegagerðin DATEX II + IMO Separated Road Data Sample Mapped to KEF → Vík */}
        <section
          data-testid="dcc-kef-vik-datex-road-mapping"
          className="rounded-2xl border border-white/15 bg-slate-900/80 p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Official Road &amp; Weather Separation · Vegagerðin DATEX II +
                Veðurstofa Íslands
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                KEF → Vík Segment Mapping: Road Closures vs. Road Surface vs.
                IMO Warnings
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href="https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 font-semibold text-cyan-200 underline"
              >
                Vegagerðin DATEX II Feed
              </a>
              <a
                href="https://en.vedur.is/about-imo/the-web/conditions/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 font-semibold text-cyan-200 underline"
              >
                Icelandic Met Office Conditions
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/15 text-slate-300 uppercase">
                  <th className="py-2.5 pr-3">DATEX Segment &amp; Direction</th>
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">1. Closure Status (Gate)</th>
                  <th className="py-2.5 px-3">2. Road Surface Report</th>
                  <th className="py-2.5 pl-3">3. IMO Weather Warning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {openSample.segments.map((seg) => (
                  <tr key={seg.segmentId}>
                    <td className="py-3 pr-3 font-semibold text-white">
                      <div>
                        {seg.routeNumber} · {seg.segmentName}
                      </div>
                      <div className="text-[11px] font-normal text-slate-400">
                        {seg.direction} ({seg.kilometerMarkers}) · ID:{" "}
                        <code>{seg.segmentId}</code>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {seg.timestampUtc}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 font-bold uppercase text-emerald-200">
                        {seg.roadClosureStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {seg.roadSurfaceSummaryEn} ({seg.observedWindSpeedMs} m/s,
                      gusts {seg.observedGustMs} m/s)
                    </td>
                    <td className="py-3 pl-3 text-amber-200">
                      [{seg.imoWeatherWarning.alertLevel.toUpperCase()}]{" "}
                      {seg.imoWeatherWarning.headline}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-rose-400/30 bg-rose-950/30 p-3.5 text-xs text-rose-100">
            <strong>Closure Block Sample ({closedSample.sampleId}):</strong>{" "}
            {closedSample.description}
          </div>
        </section>

        {/* 1 Trip That Fits vs. 1 Trip That Needs Verification */}
        <section
          data-testid="dcc-kef-vik-sample-comparisons"
          className="grid gap-5 lg:grid-cols-2"
        >
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Sample 1 · Trip That Fits (Open Road + Confirmed Vehicle Fit)
            </div>
            <SharedTripRecheckCard
              card={KEF_VIK_SAMPLE_TRIP_FITS.recheckCard}
              testId="dcc-kef-vik-sample-fits"
            />
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Sample 2 · Trip That Needs Verification (Closure Block Under
              Eyjafjöll + Heavy Bags)
            </div>
            <SharedTripRecheckCard
              card={KEF_VIK_SAMPLE_TRIP_NEEDS_VERIFICATION.recheckCard}
              testId="dcc-kef-vik-sample-needs-verification"
            />
          </div>
        </section>

        {/* 10% Referral Commission Outreach Draft */}
        <section
          data-testid="dcc-kef-vik-outreach-draft"
          className="rounded-2xl border border-white/15 bg-slate-900/80 p-6 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Pre-Direct-Checkout Deliverable · 10% Referral Partner Ask
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                Outreach Draft for NorthTrip &amp; Drive Reykjavík (10% Confirmed
                Referred Bookings)
              </h2>
            </div>
            <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-200">
              Proposed Commission: 10%
            </span>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs leading-relaxed text-slate-200">
            {ICELAND_OPERATOR_OUTREACH_DRAFT.emailBodyText}
          </pre>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-slate-400">
          <div>
            Also see:{" "}
            <Link
              href="/routes/delhi-to-agra"
              className="text-cyan-300 underline hover:text-cyan-100"
            >
              Delhi → Agra Taj Mahal Timing &amp; Transfer Qualification
            </Link>{" "}
            ·{" "}
            <Link
              href="/routes/hong-kong-to-macao"
              className="text-cyan-300 underline hover:text-cyan-100"
            >
              Hong Kong → Macao HZMB Cross-Boundary Planning Guide
            </Link>
          </div>
          <Link href="/llms.txt" className="text-slate-400 underline">
            /llms.txt Machine Manifest
          </Link>
        </footer>
      </div>
    </main>
  );
}
