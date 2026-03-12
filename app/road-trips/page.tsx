import Link from "next/link";
import { ROAD_TRIPS_REGISTRY } from "@/src/data/road-trips-registry";

export default function RoadTripsHubPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.14),_transparent_24%),radial-gradient(circle_at_88%_18%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#111217_0%,_#090a0d_100%)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Road Network</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Road trips</h1>
          <p className="max-w-4xl text-lg text-zinc-200">
            A first-class DCC vertical for drive routes, route segments, scenic pullouts, roadside food, truck-friendly stops, and utility links that make real trip planning easier.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ROAD_TRIPS_REGISTRY.map((route) => (
            <Link key={route.slug} href={`/road-trips/${route.slug}`} className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)] hover:bg-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Route hub</p>
              <h2 className="mt-2 text-2xl font-bold">{route.title}</h2>
              <p className="mt-3 text-zinc-300">{route.summary}</p>
              <p className="mt-4 text-sm text-zinc-400">{route.driveTimeNote}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
