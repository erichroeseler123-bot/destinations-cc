import type { Metadata } from "next";
import Link from "next/link";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";

export const metadata: Metadata = {
  title: "Denver Concert Transportation | Destination Command Center",
  description: "Concert transportation planning for Denver including Red Rocks, Mission Ballroom, Fiddler's Green, and Ball Arena.",
  alternates: { canonical: "/denver/concert-transportation" },
};

const VENUES = [
  {
    name: "Red Rocks Amphitheatre",
    href: "/red-rocks-shuttle",
    description: "The highest-friction venue move in the Denver stack and the strongest shuttle recommendation lane.",
  },
  {
    name: "Mission Ballroom",
    href: "/venues",
    description: "Lower transfer complexity, but event timing and nearby parking still matter on headline nights.",
  },
  {
    name: "Fiddler's Green",
    href: "/cities/denver",
    description: "Suburban venue routing, parking load, and post-show pickup quality shape the experience.",
  },
  {
    name: "Ball Arena",
    href: "/sports",
    description: "Downtown event routing where traffic, parking, and train or rideshare choices all affect the night.",
  },
];

export default function DenverConcertTransportationPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">DCC Transportation Hub</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Denver concert transportation</h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            Denver concert transportation is not one lane. Red Rocks, Mission Ballroom, Fiddler&apos;s Green, and Ball Arena each have different route behavior, parking pressure, and pickup dynamics. DCC should recommend the cleanest venue-specific transport option, then hand off ride execution where it belongs.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {VENUES.map((venue) => (
            <Link key={venue.name} href={venue.href} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] hover:bg-white/10">
              <h2 className="text-lg font-semibold">{venue.name}</h2>
              <p className="mt-2 text-sm text-zinc-300">{venue.description}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Why Red Rocks gets the transport page first</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Red Rocks is the strongest Denver concert transportation intent because the venue is outside the city core and the post-show pickup problem is more visible. That makes Red Rocks the cleanest authority-to-execution bridge: DCC explains the route and Party At Red Rocks executes the ride.
          </p>
          <div className="mt-4">
            <Link
              href="/transportation"
              className="inline-flex rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
            >
              Open transportation directory
            </Link>
          </div>
        </section>

        <RideOptionsCard venueSlug="red-rocks-amphitheatre" sourcePage="/denver/concert-transportation" />
      </div>
    </main>
  );
}
