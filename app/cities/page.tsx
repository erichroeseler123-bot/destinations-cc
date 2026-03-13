import { getAllCities } from "@/lib/data/locations";
import CitiesSearchClient from "./CitiesSearchClient";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";

export const dynamic = "force-static";

export default function CitiesPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const cities = getAllCities()
    .slice()
    .sort((a, b) => (b.metrics?.population ?? 0) - (a.metrics?.population ?? 0));

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            All Cities
          </h1>
          <p className="text-zinc-400">
            Search across {cities.length.toLocaleString()} locations and use DCC to decide where to click deeper.
          </p>
        </header>

        <PoweredByViator
          compact
          disclosure
          body="DCC is the discovery and decision layer for tours and activities. When you want to book, you can book with DCC via Viator, a trusted global travel experiences platform."
        />

        <CitiesSearchClient cities={cities as any} initialQuery={searchParams?.q || ""} />
      </div>
    </main>
  );
}
