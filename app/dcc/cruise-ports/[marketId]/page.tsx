import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  findDccCruisePortEntrypoint,
  listDccCruisePortEntrypoints,
} from "@/lib/dcc/cruisePortAuthority";
import { buildNoindexRobots } from "@/lib/seo/indexingPolicy";

type CruisePortAuthorityPageProps = {
  params: Promise<{
    marketId: string;
  }>;
};

export const dynamic = "force-static";

export function generateStaticParams() {
  return listDccCruisePortEntrypoints().map((entrypoint) => ({
    marketId: entrypoint.id,
  }));
}

export async function generateMetadata({
  params,
}: CruisePortAuthorityPageProps): Promise<Metadata> {
  const { marketId } = await params;
  const entrypoint = findDccCruisePortEntrypoint(marketId);

  if (!entrypoint) {
    return {
      title: "Cruise-Port Authority | Destination Command Center",
      robots: buildNoindexRobots(),
    };
  }

  return {
    title: `${entrypoint.portName} Cruise-Port Authority | Destination Command Center`,
    description: `${entrypoint.portName} DCC authority page for future TravelMarketTemplate implementation planning.`,
    alternates: { canonical: entrypoint.dccAuthorityPath },
    robots: buildNoindexRobots(),
  };
}

export default async function CruisePortAuthorityPage({
  params,
}: CruisePortAuthorityPageProps) {
  const { marketId } = await params;
  const entrypoint = findDccCruisePortEntrypoint(marketId);

  if (!entrypoint) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10 md:py-14">
        <header className="rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
            DCC cruise-port authority / TravelMarket queue
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">
            {entrypoint.portName}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            DCC classifies this as a high-volume cruise market. The public market surface
            is not activated until approved images, real provider inventory, real handoff
            URLs, working detail routes, and DCC URL routing are in place.
          </p>
          <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <span className="block text-white/45">Provider mode</span>
              <strong className="mt-1 block text-[#f5b34b]">{entrypoint.providerMode}</strong>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <span className="block text-white/45">Completion status</span>
              <strong className="mt-1 block text-[#f5b34b]">{entrypoint.completionStatus}</strong>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <span className="block text-white/45">Template status</span>
              <strong className="mt-1 block text-[#f5b34b]">
                {entrypoint.travelMarketTemplateStatus}
              </strong>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.5rem] border border-white/10 bg-[#0b1017] p-6">
            <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">Market role</h2>
            <dl className="mt-5 space-y-3 text-sm leading-6">
              <div>
                <dt className="font-semibold text-white/45">Market surface</dt>
                <dd>{entrypoint.marketName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-white/45">DCC authority path</dt>
                <dd>{entrypoint.dccAuthorityPath}</dd>
              </div>
              <div>
                <dt className="font-semibold text-white/45">Place ID / Market ID</dt>
                <dd>
                  {entrypoint.placeId} / {entrypoint.marketId}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-white/45">Suggested public host</dt>
                <dd>{entrypoint.suggestedPublicHost}</dd>
              </div>
              <div>
                <dt className="font-semibold text-white/45">Cruise market role</dt>
                <dd>{entrypoint.marketRoles.join(", ")}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-[#0b1017] p-6">
            <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">Why it matters</h2>
            <p className="mt-5 text-sm leading-7 text-white/70">{entrypoint.passengerRankBasis}</p>
            <p className="mt-4 text-sm leading-7 text-white/50">
              Source / {entrypoint.sourceLabel} / {entrypoint.sourceUrl}
            </p>
            <div className="mt-5 space-y-3">
              {entrypoint.dccNotes.map((note) => (
                <p key={note} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/70">
                  {note}
                </p>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">
            Product lanes to implement
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {entrypoint.productLanes.map((lane) => (
              <div key={lane} className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold text-white">{lane}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#f5b34b]/20 bg-[#f5b34b]/10 p-6 md:p-8">
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">Launch gate</h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/75">
            This market is not marked Juneau-standard complete. Public launch requires
            approved images, real provider inventory or real handoff URLs, working detail
            routes, no synthetic inventory, and live DCC URL verification. A standalone
            market domain is optional later.
          </p>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/75">
            Next required action: {entrypoint.nextRequiredAction}
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/45">
            Expected telemetry / {entrypoint.expectedTelemetryEvents.join(", ")}
          </p>
        </section>
      </div>
    </main>
  );
}
