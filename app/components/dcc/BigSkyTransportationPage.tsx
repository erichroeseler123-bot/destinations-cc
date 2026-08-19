import Link from "next/link";

export type BigSkyTransportationPageProps = {
  title: string;
  destination: string;
  eyebrow: string;
  description: string;
  driveTime: string;
  canonicalPath: string;
};

const GOSNO_HREF = "https://gosno.co/big-sky";
const PRICE = 299;

export default function BigSkyTransportationPage({
  title,
  destination,
  eyebrow,
  description,
  driveTime,
  canonicalPath,
}: BigSkyTransportationPageProps) {
  const handoffHref = `${GOSNO_HREF}?source=dcc&sourcePage=${encodeURIComponent(canonicalPath)}&destination=${encodeURIComponent(destination)}`;

  return (
    <main className="min-h-screen bg-[#07111d] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(61,243,255,.12),transparent_38%),linear-gradient(180deg,#10212b,#07111d)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:py-28">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">{description}</p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-200">
              <span className="rounded-full border border-white/12 bg-white/5 px-4 py-2">Private Suburban</span>
              <span className="rounded-full border border-white/12 bg-white/5 px-4 py-2">${PRICE} each way</span>
              <span className="rounded-full border border-white/12 bg-white/5 px-4 py-2">One stop included</span>
              <span className="rounded-full border border-white/12 bg-white/5 px-4 py-2">BZN airport</span>
            </div>
          </div>

          <aside className="rounded-[1.8rem] border border-cyan-300/20 bg-[#0b1822] p-7 shadow-[0_25px_80px_rgba(0,0,0,.35)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">DCC recommendation</p>
            <div className="mt-4 text-5xl font-black">${PRICE}</div>
            <p className="mt-1 text-sm text-zinc-400">one way · private Chevrolet Suburban</p>
            <div className="my-6 h-px bg-white/10" />
            <dl className="grid gap-4 text-sm">
              <div className="flex items-start justify-between gap-4"><dt className="text-zinc-500">Route</dt><dd className="text-right font-bold">BZN → {destination}</dd></div>
              <div className="flex items-start justify-between gap-4"><dt className="text-zinc-500">Typical drive</dt><dd className="text-right font-bold">{driveTime}</dd></div>
              <div className="flex items-start justify-between gap-4"><dt className="text-zinc-500">Vehicle</dt><dd className="text-right font-bold">Private Suburban</dd></div>
              <div className="flex items-start justify-between gap-4"><dt className="text-zinc-500">Optional stop</dt><dd className="text-right font-bold">Included</dd></div>
            </dl>
            <a href={handoffHref} className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#3df3ff] px-6 text-center text-sm font-black uppercase tracking-[0.14em] text-[#07111d] transition hover:bg-[#72f7ff]">
              Continue to GoSno
            </a>
            <p className="mt-4 text-xs leading-5 text-zinc-500">GoSno is the transportation execution surface. DCC helps narrow the route; final reservation availability is handled by GoSno.</p>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[.035] p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb07c]">Why private</p>
            <h2 className="mt-3 text-xl font-bold">One vehicle for your group.</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">No shared-seat schedule. The Suburban is reserved for the party traveling together, with luggage and ski gear handled as part of the trip.</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[.035] p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb07c]">The stop</p>
            <h2 className="mt-3 text-xl font-bold">A quick stop is already included.</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">Groceries, liquor, coffee, or another reasonable stop on the way can be handled during the trip. It does not need to be selected in advance.</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[.035] p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb07c]">The handoff</p>
            <h2 className="mt-3 text-xl font-bold">DCC decides. GoSno executes.</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">Once this route fits, there is no reason to keep comparing. Continue into GoSno for the actual transportation product and availability.</p>
          </article>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/15">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Other Big Sky-area destinations</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link className="rounded-full border border-white/12 px-4 py-2 hover:bg-white/5" href="/bozeman-airport-to-big-sky">Big Sky Resort</Link>
            <Link className="rounded-full border border-white/12 px-4 py-2 hover:bg-white/5" href="/bozeman-airport-to-yellowstone-club">Yellowstone Club</Link>
            <Link className="rounded-full border border-white/12 px-4 py-2 hover:bg-white/5" href="/bozeman-airport-to-montage-big-sky">Montage Big Sky</Link>
            <Link className="rounded-full border border-white/12 px-4 py-2 hover:bg-white/5" href="/bozeman-airport-to-spanish-peaks">Spanish Peaks</Link>
            <Link className="rounded-full border border-white/12 px-4 py-2 hover:bg-white/5" href="/bozeman-airport-to-moonlight-basin">Moonlight Basin</Link>
            <Link className="rounded-full border border-white/12 px-4 py-2 hover:bg-white/5" href="/bozeman-airport-to-oneandonly-moonlight-basin">One&Only Moonlight Basin</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
