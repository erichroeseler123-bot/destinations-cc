import Link from "next/link";
import type { Metadata } from "next";

const ARGO_BOOKING_URL = "https://shuttleya.com/book/argo-shuttle";

export const metadata: Metadata = {
  title: "Mighty Argo Cable Car Shuttle Status",
  description:
    "Current DCC status page for the $35 Mighty Argo Cable Car shuttle: opening timing, pickup and return plan, who should book, and the Shuttleya link.",
  alternates: { canonical: "/mighty-argo/status" },
};

export default function MightyArgoStatusPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
            DCC launch status
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
            Mighty Argo Cable Car Shuttle Status
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
            The useful decision is simple: if you want the Mighty Argo day without managing the return from Idaho Springs yourself, use the $35 Shuttleya Argo shuttle path.
          </p>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              DCC field note
            </p>
            <p className="mt-2 text-sm leading-7 text-zinc-200">
              Idaho Springs trips are easier when the return plan is decided before arrival.
            </p>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={ARGO_BOOKING_URL}
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-black"
            >
              Open the $35 Shuttleya Argo shuttle
            </a>
            <Link
              href="/mighty-argo"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/5"
            >
              Read the Mighty Argo overview
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 py-12 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Opening timing
          </p>
          <h2 className="mt-3 text-2xl font-bold">Spring 2026 messaging</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Public project messaging points to a spring 2026 opening window. DCC keeps this as status context, not a guarantee of daily operations.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Pickup and return
          </p>
          <h2 className="mt-3 text-2xl font-bold">Denver out, Idaho Springs back</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            The Shuttleya lane is built around a fixed Denver pickup and a planned return from Idaho Springs, so the ride is decided before arrival.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Who should book
          </p>
          <h2 className="mt-3 text-2xl font-bold">Travelers who want the day framed</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Book the $35 shuttle if you want the Argo visit without sorting rideshare, parking, or the return timing from Idaho Springs after you get there.
          </p>
        </article>
      </section>
    </main>
  );
}
