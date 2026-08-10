import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";

export const dynamic = "force-dynamic";

function pct(n: number, d: number) {
  return d ? `${Math.round((n / d) * 100)}%` : "—";
}

function countBy<T extends string>(values: T[]) {
  const map = new Map<string, number>();
  for (const value of values) map.set(value || "unknown", (map.get(value || "unknown") || 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function WnoRevenueOpportunityPage() {
  const all = await listRecentProductionCorridorEvents(10000);
  const events = all.filter((event: any) => event.corridorId === "wno-commerce");
  const landing = events.filter((event: any) => event.eventName === "landing_viewed");
  const product = events.filter((event: any) => event.eventName === "product_opened");
  const booking = events.filter((event: any) => event.eventName === "booking_opened");

  const sources = countBy(landing.map((event: any) => event.sourcePage || "unknown"));
  const entryPaths = countBy(landing.map((event: any) => event.landingPath || "unknown"));
  const products = countBy(booking.map((event: any) => event.clickedProductSlug || "unknown"));

  return (
    <main className="min-h-screen bg-[#0e0e10] px-6 py-14 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">DCC · WNO commerce intelligence</p>
        <h1 className="mt-3 text-4xl font-black">New Orleans booking-intent dashboard</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300">This measures entry sessions, tour-detail opens, and FareHarbor checkout opens. A checkout open is booking intent, not a confirmed booking or confirmed revenue.</p>

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          <Metric label="Entry sessions" value={landing.length} />
          <Metric label="Tour-detail opens" value={product.length} />
          <Metric label="FareHarbor opens" value={booking.length} />
          <Metric label="Entry → FareHarbor" value={pct(booking.length, landing.length)} />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <Rank title="Top entry sources" rows={sources.slice(0, 12)} />
          <Rank title="Top entry pages" rows={entryPaths.slice(0, 12)} />
          <Rank title="Products opening checkout" rows={products.slice(0, 12)} />
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-bold">Funnel ratios</h2>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <div>Entry → product: <strong>{pct(product.length, landing.length)}</strong></div>
            <div>Product → FareHarbor: <strong>{pct(booking.length, product.length)}</strong></div>
            <div>Entry → FareHarbor: <strong>{pct(booking.length, landing.length)}</strong></div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="text-xs uppercase tracking-wider text-zinc-400">{label}</div><div className="mt-2 text-3xl font-black">{value}</div></div>;
}

function Rank({ title, rows }: { title: string; rows: [string, number][] }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><h2 className="font-bold">{title}</h2><ol className="mt-4 space-y-3 text-sm">{rows.length ? rows.map(([label, count]) => <li key={label} className="flex justify-between gap-4"><span className="break-all text-zinc-300">{label}</span><strong>{count}</strong></li>) : <li className="text-zinc-500">No production events yet.</li>}</ol></div>;
}
