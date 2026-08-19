import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Montana Ski Transportation from Bozeman Airport | DCC",
  description: "BZN to Big Sky-area transportation guidance for Big Sky Resort, Yellowstone Club, Montage, Spanish Peaks, Moonlight Basin, and One&Only, with GoSno execution.",
  alternates: { canonical: "/transportation/montana" },
};

const routes = [
  ["Big Sky Resort", "/bozeman-airport-to-big-sky", "About 1 hour"],
  ["Yellowstone Club", "/bozeman-airport-to-yellowstone-club", "About 1 hr 10–20 min"],
  ["Montage Big Sky", "/bozeman-airport-to-montage-big-sky", "About 1 hr 5–10 min"],
  ["Spanish Peaks", "/bozeman-airport-to-spanish-peaks", "About 1 hr 5–10 min"],
  ["Moonlight Basin", "/bozeman-airport-to-moonlight-basin", "About 1 hr 15 min"],
  ["One&Only Moonlight Basin", "/bozeman-airport-to-oneandonly-moonlight-basin", "About 1 hr 15 min"],
] as const;

export default function Page() {
  return (
    <main className="min-h-screen bg-[#07111d] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(61,243,255,.12),transparent_28%),linear-gradient(180deg,#10212b,#07111d)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Montana transportation</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Bozeman Airport to the Big Sky area</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">DCC narrows the route. GoSno handles the transportation product. The core Big Sky-area destinations below use the same published GoSno rate: $399 each way for a private Chevrolet Suburban.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-200">
            <span className="rounded-full border border-white/12 bg-white/5 px-4 py-2">BZN origin</span>
            <span className="rounded-full border border-white/12 bg-white/5 px-4 py-2">$399 each way</span>
            <span className="rounded-full border border-white/12 bg-white/5 px-4 py-2">Private Suburban</span>
            <span className="rounded-full border border-white/12 bg-white/5 px-4 py-2">One stop included</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {routes.map(([name, href, duration]) => (
            <Link key={href} href={href} className="rounded-[1.6rem] border border-white/10 bg-white/[.04] p-6 transition hover:border-cyan-300/30 hover:bg-white/[.07]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">BZN → destination</p>
              <h2 className="mt-3 text-2xl font-bold">{name}</h2>
              <p className="mt-3 text-sm text-zinc-400">{duration}</p>
              <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                <strong>$399 one way</strong>
                <span className="text-sm text-cyan-200">Open route →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/15">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Execution</p>
          <h2 className="mt-3 text-3xl font-black">Already know you want the private Suburban?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-400">Skip the DCC route pages and continue directly to GoSno's Big Sky transportation storefront.</p>
          <a href="https://gosno.co/big-sky?source=dcc&sourcePage=%2Ftransportation%2Fmontana" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-7 text-sm font-black uppercase tracking-[0.14em] text-[#07111d]">Continue to GoSno</a>
        </div>
      </section>
    </main>
  );
}
