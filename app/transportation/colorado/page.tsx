import type { Metadata } from "next";
import Link from "next/link";
import CategoryDecisionEngineExperience from "@/app/components/dcc/CategoryDecisionEngineExperience";
import NextStepEngine from "@/app/components/dcc/NextStepEngine";
import TravelReferenceExperience from "@/app/components/dcc/TravelReferenceExperience";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import { DENVER_MOUNTAIN_DECISION_ENGINE } from "@/lib/dcc/decisionEngines/denverMountainTransportationEngine";
import type { DecisionResult } from "@/lib/dcc/decisionEngines/types";
import { getColoradoTransferRecommendationActions } from "@/lib/dcc/handoffAnalytics";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";
import { getTravelReferenceNodeById } from "@/lib/dcc/travelReference";
import { getTransportEntriesByRegion } from "@/src/data/transport-directory";

import { getPublicationManifestEntry } from "@/src/data/publication-manifest";
import PartnerSharePlanningBar from "@/app/components/dcc/PartnerSharePlanningBar";

export const dynamic = "force-dynamic";

const manifestEntry = getPublicationManifestEntry("/transportation/colorado");

export const metadata: Metadata = {
  title: "Colorado Transportation & I-70 Mountain Corridor Reference | Destination Command Center",
  description:
    "Colorado transportation reference across the Denver–Breckenridge I-70 corridor, Red Rocks Amphitheatre, Denver venues, Bustang/Pegasus transit, and CDOT traction laws.",
  alternates: { canonical: manifestEntry?.canonicalUrl || "/transportation/colorado" },
  robots: {
    index: manifestEntry?.indexingState === "index_follow",
    follow: manifestEntry?.indexingState === "index_follow",
  },
};

const GROUPS = [
  {
    title: "Red Rocks",
    slugs: ["red-rocks-amphitheatre"],
  },
  {
    title: "Major Denver venues",
    slugs: ["mission-ballroom", "ball-arena", "fiddlers-green-amphitheatre"],
  },
  {
    title: "Denver clubs and theatres",
    slugs: ["ogden-theatre", "gothic-theatre", "cervantes-masterpiece", "bluebird-theater", "summit-music-hall", "marquis-theater"],
  },
  {
    title: "Boulder",
    slugs: ["boulder-theater", "fox-theatre"],
  },
  {
    title: "Mountain and destination venues",
    slugs: ["mishawaka-amphitheatre"],
  },
];

export default async function ColoradoTransportationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  await syncDurableLedgerWithPostgres();
  const actions = getColoradoTransferRecommendationActions();
  const entries = getTransportEntriesByRegion("Colorado");
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const corridorRef = getTravelReferenceNodeById("denver-breckenridge");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Colorado coverage & reference</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Colorado transportation & corridor directory</h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            Colorado is DCC&apos;s flagship surface for venue and mountain-corridor transportation reference. Explore the full source-attributed{" "}
            <Link href="/routes/denver-breckenridge" className="text-cyan-300 underline hover:text-cyan-100">
              Denver–Breckenridge I-70 Mountain Corridor Reference
            </Link>{" "}
            and{" "}
            <Link href="/red-rocks" className="text-cyan-300 underline hover:text-cyan-100">
              Red Rocks Amphitheatre Reference
            </Link>
            , alongside staged Denver and Boulder venue pages.
          </p>
        </header>

        <section
          data-testid="dcc-colorado-authority-brief"
          data-dcc-authority-market="colorado"
          className="rounded-3xl border border-cyan-400/30 bg-[#0d141d] p-6 md:p-8 space-y-5 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                DCC Public Authority · Direct Answer &amp; Verified I-70 Evidence
              </p>
              <h2 className="mt-1 text-2xl md:text-3xl font-black text-white">
                DEN to Vail, Breckenridge &amp; I-70 Resorts: Which transfer fits your group and ski gear?
              </h2>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-200">
              Sources Checked: 2026-11-03 (CDOT · GoSno · Epic · Bustang)
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm">
            <article className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                1. 7–10 Pax (or 5–6 w/ Ski Bags) → Private Van
              </p>
              <p className="text-zinc-200 leading-6">
                Never conflate seats with ski-bag cargo: a 6-seat SUV holds only 4–5 passengers once 170–190 cm ski bags are loaded. On <strong>GoSno</strong>, private passenger vans carry <strong>up to 10 passengers (subject to luggage &amp; ski-gear fit; 11+ pax exceed a single GoSno van)</strong> door-to-door from DEN.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
                2. 1–4 Pax (or up to 6 Light) → Private SUV
              </p>
              <p className="text-zinc-200 leading-6">
                A 100% private AWD SUV on <strong>GoSno</strong> caps at <strong>6 passengers max</strong> ($499 DEN–Vail one-way baseline) with an experienced mountain driver and optional 20–30 min grocery stop on advance request.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                3. Staggered Flights → Shared Per-Seat Shuttle
              </p>
              <p className="text-zinc-200 leading-6">
                <strong>Epic Mountain Express</strong> ($59–$139/guest DEN–Vail by date) allows <strong>2 baggage items (including a ski/snowboard bag) + 1 personal item per guest</strong> and works best when travelers land on different flights.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-rose-300">
                4. Public Transit &amp; Statutory Traction Law
              </p>
              <p className="text-zinc-200 leading-6">
                <strong>C.R.S. § 42-4-106 (Code 15)</strong> requires AWD/4WD or winter tires (&ge; 3/16&quot; tread) on I-70 (MP 133–259) Sept 1–May 31. Budget alternative: <strong>RTD A-Line ($10.50) + CDOT Bustang ($17)</strong>, plus <strong>100% free in-town Vail &amp; Breck buses</strong>.
              </p>
            </article>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-950/30 p-4">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Next Step · Move From DCC Corridor Authority to GoSno Private Execution
              </p>
              <p className="text-xs text-zinc-300">
                When a private SUV (up to 6 pax) or private van (up to 10 pax, subject to gear fit) is the right fit, continue to GoSno with your route and party context prefilled.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a
                href="https://gosno.co/vail?origin=DEN&destination=Vail&passengers=7&passengerCount=7&vehicleClass=van&src=dcc-authority-colorado"
                data-testid="dcc-authority-to-gosno-vail"
                data-dcc-next-step="gosno"
                className="rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#04120a] hover:bg-emerald-300 transition"
              >
                Open GoSno Vail Private Van / SUV →
              </a>
              <a
                href="https://gosno.co/breckenridge?origin=DEN&destination=Breckenridge&passengers=6&passengerCount=6&vehicleClass=suv&src=dcc-authority-colorado"
                data-testid="dcc-authority-to-gosno-breck"
                data-dcc-next-step="gosno"
                className="rounded-xl border border-cyan-300/40 bg-cyan-500/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/25 transition"
              >
                Open GoSno Breckenridge Transfer →
              </a>
              <a
                href="https://gosno.co/request-quote?origin=DEN&destination=Vail&passengers=16&passengerCount=16&party_size=16&vehicleType=van&src=dcc-authority-colorado"
                data-testid="dcc-authority-to-gosno-group"
                data-dcc-next-step="gosno"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/15 transition"
              >
                GoSno 11+ Pax Multi-Vehicle Quote ↗
              </a>
              <a
                href="https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared?src=dcc-authority-colorado"
                data-testid="dcc-authority-to-parr-from-colorado"
                data-dcc-next-step="partyatredrocks"
                className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-200 hover:bg-amber-500/25 transition"
              >
                Open Party at Red Rocks Concert Shuttles ↗
              </a>
            </div>
          </div>
        </section>

        <PartnerSharePlanningBar
          market="colorado-mountain"
          activePartnerParam={firstStr(sp.partner)}
          activePartnerRoleParam={firstStr(sp.partner_role)}
          activeCancelRefParam={firstStr(sp.cancel_ref)}
          activeTrafficSourceParam={firstStr(sp.src)}
        />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Flagship Colorado Reference Guides</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/routes/denver-breckenridge" className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] p-4 hover:bg-cyan-400/[0.12]">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Mountain corridor reference</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Denver–Breckenridge (I-70 & CO-9)</h3>
              <p className="mt-3 text-sm text-zinc-300">Statutory CDOT traction laws, Bustang/Pegasus transit, GoSno 100% private transfers (up to 6 in SUV / up to 10 in van, subject to gear fit), and live divide telemetry.</p>
            </Link>
            <Link href="/red-rocks" className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] p-4 hover:bg-cyan-400/[0.12]">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Venue reference</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Red Rocks Park & Amphitheatre</h3>
              <p className="mt-3 text-sm text-zinc-300">Lot & step physics, lightning-hold boundaries, live Morrison telemetry, and shuttle handoffs.</p>
            </Link>
            <Link href="/red-rocks-shuttle-vs-uber" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Comparison page</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Red Rocks shuttle vs Uber</h3>
              <p className="mt-3 text-sm text-zinc-300">Narrow-intent authority page for post-show ride-home decisions.</p>
            </Link>
            <Link href="/transportation/colorado/denver-to-vail-shuttle-guide" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Ski corridor guide</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Denver to Vail shuttle guide</h3>
              <p className="mt-3 text-sm text-zinc-300">Authority-first transfer &amp; ski-gear capacity logic (up to 6 in SUV / up to 10 in GoSno van; 11+ pax ineligible for single van) before execution.</p>
            </Link>
          </div>
        </section>

        {corridorRef ? (
          <TravelReferenceExperience
            node={corridorRef}
            embedded
          />
        ) : null}

        <CategoryDecisionEngineExperience
          engineId="denver-to-mountain-transportation"
          initialResult={
            DENVER_MOUNTAIN_DECISION_ENGINE.evaluate(
              DENVER_MOUNTAIN_DECISION_ENGINE.defaultExampleInput,
            ) as unknown as DecisionResult<Record<string, unknown>>
          }
        />

        <RideOptionsCard
          venueSlug="red-rocks-amphitheatre"
          sourcePage="/transportation/colorado"
        />


        <NextStepEngine
          title="Colorado Transfer Next Step"
          eyebrow="Lane balancing"
          description="DCC can absorb ski-transfer demand when GOSNO is strained, then hand travelers back into execution once the lane recovers."
          actions={actions}
        />

        {GROUPS.map((group) => {
          const groupEntries = group.slugs
            .map((slug) => bySlug.get(slug))
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
          if (groupEntries.length === 0) return null;

          return (
            <section key={group.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-bold">{group.title}</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {groupEntries.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={entry.dccUrl}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                          {entry.city}, {entry.state}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{entry.name}</h3>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-cyan-200">
                        {entry.serviceStatus.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">{entry.notes}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
