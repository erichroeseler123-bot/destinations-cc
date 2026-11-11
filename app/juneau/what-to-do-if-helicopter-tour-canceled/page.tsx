import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import PartnerSharePlanningBar from "@/app/components/dcc/PartnerSharePlanningBar";
import PortableTripNetworkBar from "@/app/components/dcc/PortableTripNetworkBar";
import { evaluateJuneauBackupFlow } from "@/lib/dcc/dockRolloutContext";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";

export const metadata: Metadata = {
  title:
    "What to Do When a Juneau Helicopter Tour Is Canceled | Same-Day Whale Deck Backup | DCC",
  description:
    "When low cloud ceilings over the Juneau Icefield cancel glacier helicopter landings, use DCC's Same-Day Backup Flow with PAJN METAR context to pivot to Auke Bay whale watching or Mendenhall Glacier before your ship's all-aboard cutoff.",
  alternates: { canonical: "/juneau/what-to-do-if-helicopter-tour-canceled" },
};

export const dynamic = "force-dynamic";

export default async function DccJuneauHelicopterCanceledGuidePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const flightCanceledParam = firstStr(sp.flight_canceled) || "1";
  const cancelRefParam = firstStr(sp.cancel_ref);
  const partnerParam = firstStr(sp.partner);
  const partnerRoleParam = firstStr(sp.partner_role);

  const backupContext = evaluateJuneauBackupFlow({
    travelerSelectedCanceled: flightCanceledParam,
    operatorCancelRef: cancelRefParam,
  });

  const partnerSuffix = partnerParam
    ? `&partner=${encodeURIComponent(partnerParam)}&partner_role=${encodeURIComponent(partnerRoleParam || "flight_operator")}`
    : "";

  return (
    <main className="min-h-screen bg-[#050811] px-6 py-10 text-white md:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildWebPageJsonLd({
              path: "/juneau/what-to-do-if-helicopter-tour-canceled",
              name: "What to Do When a Juneau Helicopter Tour Is Canceled | DCC Backup Authority",
              description:
                "Same-day Juneau helicopter weather cancellation backup guide: why PAJN cloud ceilings ground icefield flights while Auke Bay whale watching and Mendenhall Express continue operating.",
              dateModified: "2026-11-07",
              isPartOfPath: "/juneau",
            }),
            buildBreadcrumbJsonLd([
              { name: "Juneau", item: "/juneau" },
              {
                name: "What to Do If Helicopter Tour Canceled",
                item: "/juneau/what-to-do-if-helicopter-tour-canceled",
              },
            ]),
          ],
        }}
      />

      <div className="mx-auto max-w-5xl space-y-7">
        <header className="overflow-hidden rounded-[2.2rem] border border-cyan-400/35 bg-[#0a1320] shadow-2xl">
          <img
            src="/images/travel-markets/juneau/mendenhall-glacier-aerial.jpg"
            alt="Mendenhall Glacier and Juneau mountain valley cloud ceiling view"
            width={1280}
            height={853}
            loading="eager"
            className="h-52 w-full object-cover object-center border-b border-white/10 sm:h-64"
          />
          <div className="p-8 md:p-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan-300">
              DCC Juneau Weather Recovery Authority · April 24 Dock Rollout
            </p>
            <span
              data-testid="dcc-flight-canceled-backup-badge"
              className="rounded-full border border-cyan-300/40 bg-cyan-500/15 px-3.5 py-1 text-xs font-bold text-cyan-200"
            >
              Backup Flow Active ({backupContext.cancellationSource})
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            What to Do When Your Juneau Helicopter Tour Is Canceled
          </h1>

          <p className="max-w-3xl text-base leading-7 text-white/80">
            Why did your flight cancel when it barely looks rainy downtown? FAA Part 135
            glacier helicopter operators (TEMSCO, Coastal, NorthStar) require VFR visual
            cloud-ceiling clearance over the elevated <strong>Juneau Icefield (3,500–5,000 ft MSL)</strong>.
            When <strong>PAJN (Juneau International Airport)</strong> reports low ceilings
            (MVFR/IFR), icefield landings stop —{" "}
            <strong>
              but enclosed surface whale-watching vessels in sheltered Auke Bay and
              Stephens Passage continue operating normally
            </strong>
            .
          </p>

          <div
            data-testid="dcc-canceled-guide-pajn-metar"
            className="rounded-2xl border border-white/15 bg-black/50 p-4 text-xs space-y-1.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black uppercase tracking-wider text-amber-300">
                Weather Context Only · {backupContext.pajnMetar.stationName}
              </span>
              <code className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-cyan-200">
                {backupContext.pajnMetar.rawMetar}
              </code>
            </div>
            <p className="text-white/80">
              Flight Category: <strong>{backupContext.pajnMetar.flightCategory}</strong> · Ceiling:{" "}
              <strong>{backupContext.pajnMetar.ceilingFeetAgl} ft AGL</strong> · Visibility:{" "}
              <strong>{backupContext.pajnMetar.visibilityStatuteMiles} SM</strong> ·{" "}
              <span className="text-amber-200">{backupContext.pajnMetar.contextNote}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={`https://juneauflightdeck.com/juneau-whale-watching-tours?flight_canceled=1${cancelRefParam ? `&cancel_ref=${encodeURIComponent(cancelRefParam)}` : ""}&src=dcc-juneau-flight-canceled${partnerSuffix}`}
              data-testid="dcc-canceled-to-jfd-whale-deck"
              data-dcc-next-step="juneauflightdeck"
              className="rounded-full bg-cyan-400 px-5 py-3 text-xs font-black uppercase tracking-[0.15em] text-[#041019] hover:bg-cyan-300 transition"
            >
              Open Juneau Flight Deck · Same-Day Whale Deck Backup ↗
            </a>
            <a
              href={`https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?flight_canceled=1&src=dcc-juneau-flight-canceled&offer=331813P1${partnerSuffix}`}
              data-testid="dcc-canceled-to-lfse-whale"
              data-dcc-next-step="lastfrontiershoreexcursions"
              className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-emerald-200 hover:bg-emerald-500/25 transition"
            >
              Book 3.5h Whale Watch (331813P1) on Alaska Storefront ↗
            </a>
            <Link
              href="/juneau/cruise-excursions-what-to-do"
              className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-bold text-white hover:bg-white/15 transition"
            >
              Check Short Port-Call All-Aboard Buffer →
            </Link>
          </div>
          </div>
        </header>

        <PortableTripNetworkBar
          marketId="juneau"
          searchParams={sp}
          defaultDate="2026-06-18"
          defaultPartySize={2}
          defaultShipName="Royal Princess"
          defaultBerthCode="FKL"
          defaultAllAboard="20:30"
        />

        {/* Step-by-Step Recovery Plan by Remaining Port Hours */}
        <section
          data-testid="dcc-flight-canceled-recovery-steps"
          className="rounded-3xl border border-white/10 bg-[#0b1018] p-6 md:p-8 space-y-5"
        >
          <h2 className="text-2xl font-black text-white">
            Choose Your Same-Day Backup Based on Remaining Hours Before Confirmed All-Aboard
          </h2>

          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <article className="rounded-2xl border border-emerald-400/35 bg-emerald-950/20 p-5 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Option 1 · 4.75+ Hours Left Before All-Aboard
              </span>
              <h3 className="text-lg font-bold text-white">
                3.5-Hour Auke Bay Whale Watching (331813P1 · $189)
              </h3>
              <p className="text-xs leading-6 text-white/80">
                Heated cabin cruiser in sheltered Auke Bay waters with humpback &amp; orca
                sightings. Runs reliably under marine visibility rules even when mountain
                ceilings ground helicopters.
              </p>
              <a
                href={`https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?flight_canceled=1&src=dcc-juneau-flight-canceled&offer=331813P1${partnerSuffix}`}
                className="inline-block rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#04120a]"
              >
                Book 3.5h Whale Backup (331813P1) ↗
              </a>
            </article>

            <article className="rounded-2xl border border-cyan-400/35 bg-cyan-950/20 p-5 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                Option 2 · 4.25+ Hours Left (Still See the Glacier)
              </span>
              <h3 className="text-lg font-bold text-white">
                3.0-Hour Mendenhall Glacier Express (5857SHUTTLE · $80)
              </h3>
              <p className="text-xs leading-6 text-white/80">
                If your flight over Mendenhall was grounded, see the glacier face and
                Nugget Falls from the ground via direct coach transfer without weather
                cancellation risk.
              </p>
              <a
                href={`https://www.lastfrontiershoreexcursions.com/juneau/mendenhall-glacier?flight_canceled=1&src=dcc-juneau-flight-canceled&offer=5857SHUTTLE${partnerSuffix}`}
                className="inline-block rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#041018]"
              >
                Book 3.0h Glacier Express (5857SHUTTLE) ↗
              </a>
            </article>

            <article className="rounded-2xl border border-amber-400/35 bg-amber-950/20 p-5 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Option 3 · 7.0+ Hours Left (Full Port Day)
              </span>
              <h3 className="text-lg font-bold text-white">
                5.5-Hour Waterfall &amp; Whale Combo (466119P3 · Dolphin Jet Boat Tours · $199–$225)
              </h3>
              <p className="text-xs leading-6 text-white/80">
                If your morning flight was canceled early on a long port call (e.g.,
                08:00–21:00), combine both Auke Bay whale watching and Mendenhall
                Glacier in one coordinated shore block operated by{" "}
                <strong>Dolphin Jet Boat Tours</strong> (Viator #466119P3).
              </p>
              <a
                href={`https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?flight_canceled=1&src=dcc-juneau-flight-canceled&offer=466119P3${partnerSuffix}`}
                className="inline-block rounded-xl bg-[#f5b34b] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#07111d]"
              >
                Book 5.5h Whale + Glacier Combo (466119P3) ↗
              </a>
            </article>
          </div>
        </section>

        <PartnerSharePlanningBar
          market="juneau"
          activePartnerParam={partnerParam}
          activePartnerRoleParam={partnerRoleParam}
          activeCancelRefParam={cancelRefParam}
          activeTrafficSourceParam={firstStr(sp.src)}
        />
      </div>
    </main>
  );
}
