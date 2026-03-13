import Link from "next/link";
import { getAllCities } from "@/lib/data/locations";

export const dynamic = "force-static";

export default function UsaIndex() {
  const us = getAllCities()
    .filter((c) => c.admin?.country === "US")
    .sort((a, b) => (a.admin?.region_code || "").localeCompare(b.admin?.region_code || "") || a.name.localeCompare(b.name));

  const seeded = us.filter((c: any) => c.source_refs?.seed === "us_tourist_150.txt");
  const other = us.filter((c: any) => c.source_refs?.seed !== "us_tourist_150.txt");

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="text-4xl font-black">USA</h1>
          <p className="text-zinc-400">
            Seeded tourist cities: {seeded.length} • Other US cities: {other.length}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Tourist Top List</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {seeded.map((c) => (
              <Link key={c.id} href={`/${c.slug}`} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
                <div className="font-bold">{c.name}</div>
                <div className="text-sm text-zinc-400">{c.admin?.region_code}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Other US Cities</h2>
          <p className="text-zinc-500">Included automatically from global import; not part of the tourist seed list.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {other.slice(0, 200).map((c) => (
              <Link key={c.id} href={`/${c.slug}`} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
                <div className="font-bold">{c.name}</div>
                <div className="text-sm text-zinc-400">{c.admin?.region_code}</div>
              </Link>
            ))}
          </div>
          <p className="text-xs text-zinc-600">Showing first 200 to keep page lightweight.</p>
        </section>
      </div>
    </main>
  );
}
