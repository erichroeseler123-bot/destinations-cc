import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StationLinksSection from "@/app/components/dcc/StationLinksSection";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import SubtleAffiliateModules from "@/app/components/dcc/SubtleAffiliateModules";
import { getStationsByVenueSlug } from "@/lib/dcc/stations";
import { getTransportDirectoryEntry, TRANSPORT_DIRECTORY } from "@/src/data/transport-directory";

type Params = { slug: string };

export function generateStaticParams() {
  return TRANSPORT_DIRECTORY.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getTransportDirectoryEntry(slug);
  if (!entry) return { title: "Transportation coverage" };

  return {
    title: `${entry.name} Transportation | Destination Command Center`,
    description: `${entry.name} transportation coverage, service status, ride options, and guide links.`,
    alternates: { canonical: entry.dccUrl },
  };
}

export default async function TransportationVenuePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const entry = getTransportDirectoryEntry(slug);
  if (!entry) notFound();
  const nearbyStations = getStationsByVenueSlug(entry.slug);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Transportation coverage</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{entry.name}</h1>
          <p className="mt-3 text-sm uppercase tracking-[0.18em] text-zinc-500">
            {entry.city}, {entry.state} • {entry.region}
          </p>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">{entry.notes}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</p>
            <p className="mt-2 text-lg font-semibold">{entry.serviceStatus.replace("_", " ")}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Operator</p>
            <p className="mt-2 text-lg font-semibold">{entry.operatorName ?? "Coverage planned"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Service types</p>
            <p className="mt-2 text-lg font-semibold">{entry.serviceTypes.join(" • ")}</p>
          </div>
        </section>

        <RideOptionsCard venueSlug={entry.slug} sourcePage={entry.dccUrl} />

        <StationLinksSection
          title={`Nearby train and bus stations for ${entry.name}`}
          intro={`Use station pages when the traveler is arriving by rail or bus and still needs to solve the final move into ${entry.name} without guessing at the route shape.`}
          stations={nearbyStations}
        />

        <SubtleAffiliateModules
          context={{ surface: "transport", priority: 75 }}
          hrefs={{
            stays_nearby: entry.city.toLowerCase() === "las vegas" ? "/las-vegas/hotels" : undefined,
          }}
          title="Quiet trip-support links"
          intro={`Transportation pages stay routing-first. If a traveler still needs a place to stay, keep that as a secondary move after the transport plan is clear.`}
        />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">How DCC treats this venue</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            DCC uses transportation pages as routing and planning surfaces. If coverage is active, the execution link
            points to the operating node. If coverage is limited or coming soon, DCC stays guide-first and avoids
            pretending that a live ride network already exists.
          </p>
          <div className="mt-5">
            <Link
              href="/transportation/colorado"
              className="inline-flex rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
            >
              Back to Colorado directory
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
