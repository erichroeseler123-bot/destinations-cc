import type { Metadata } from "next";
import VegasHotelGridSection from "@/app/components/dcc/VegasHotelGridSection";
import { getVegasHotelsByTag } from "@/src/data/vegas-hotels-config";

export const metadata: Metadata = {
  title: "Luxury Hotels in Las Vegas | Strip Resorts, Spa Stays, and Premium Vegas Routing",
  description:
    "Luxury hotel overlay for Las Vegas across premium Strip resorts, spa stays, romantic routing, and show-adjacent flagship properties.",
  alternates: { canonical: "/luxury-hotels-las-vegas" },
};

export default function LuxuryHotelsLasVegasPage() {
  const hotels = getVegasHotelsByTag("luxury");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Overlay</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Luxury hotels in Las Vegas</h1>
          <p className="max-w-3xl text-zinc-300">
            This overlay pulls the luxury hotel layer out of the broader Vegas mesh so premium stays, romantic trips,
            spa buyers, and flagship resort searches have a direct landing surface.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <VegasHotelGridSection
          title="Luxury and romantic Vegas hotel nodes"
          intro="These properties anchor the premium side of the Vegas hotel mesh and cross-link back into the Strip, shows, and broader city routing."
          hotels={hotels}
        />
      </div>
    </main>
  );
}
