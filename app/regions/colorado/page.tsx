import Link from "next/link";

export default function ColoradoRegion() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">Colorado</h1>
        <p className="mt-4 text-zinc-300 max-w-2xl">
          Regional hubs and route intelligence.
        </p>

        <div className="mt-10 grid gap-4">
          <Link
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10 transition"
            href="/regions/colorado/idaho-springs"
          >
            <div className="font-semibold">Idaho Springs</div>
            <div className="text-sm text-zinc-300">Corridor staging + Mighty Argo access →</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
