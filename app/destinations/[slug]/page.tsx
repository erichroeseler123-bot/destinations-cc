import Link from "next/link";
import { notFound } from "next/navigation";
import CommercialActionPanel from "@/app/components/dcc/CommercialActionPanel";
import EqualizerExperience from "@/app/components/dcc/EqualizerExperience";
import { getDestinationConfig } from "@/src/data/destination-configs";
import { getCapabilityMap } from "@/src/data/live-registry";
import { resolveCommercialActions } from "@/src/lib/dcc/commercial-actions";

export default async function DestinationSystemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = getDestinationConfig(slug);
  if (!config) notFound();
  const capabilities = getCapabilityMap(config);
  const actions = resolveCommercialActions(config, { destinationId: config.id });

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">Destination Command Center</div>
        <h1 className="mt-3 max-w-4xl text-4xl font-black uppercase tracking-[-0.04em] sm:text-6xl">{config.name}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">See what is live, understand the place, then move into the right commercial action only when your intent changes.</p>

        {config.id === "st-thomas" ? (
          <EqualizerExperience
            destinationId={config.id}
            destinationName={config.name}
            lat={config.lat}
            lng={config.lng}
          />
        ) : null}

        <section className="mt-8 rounded-[30px] border border-white/10 bg-[#0b1224] p-6 sm:p-8">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">Live capabilities</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(capabilities).map(([name, enabled]) => enabled ? <span key={name} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/78">{name} ✓</span> : null)}
          </div>
        </section>

        {config.places.length ? (
          <section className="mt-8">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">Explore by place</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {config.places.map((place) => (
                <Link key={place.id} href={`/destinations/${config.slug}/places/${place.slug}`} className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6 transition hover:-translate-y-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/50">{place.kind}</div>
                  <div className="mt-2 text-xl font-black uppercase tracking-[-0.03em]">{place.name}</div>
                  {place.summary ? <p className="mt-3 text-sm leading-6 text-white/70">{place.summary}</p> : null}
                  <div className="mt-5 text-sm font-bold text-[#3df3ff]">Open destination intelligence →</div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8">
          <CommercialActionPanel actions={actions} />
        </div>
      </div>
    </main>
  );
}
