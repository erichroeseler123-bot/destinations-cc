import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Destination Command Center",
  description: "Contact Destination Command Center about trip-planning help, network questions, or business issues.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Contact</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">How to reach DCC</h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-300">
            Destination Command Center is the authority layer for city guides, media, and live planning feeds across the network.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-zinc-300">
            <h2 className="text-2xl font-bold text-white">Business</h2>
            <p>Denver, Colorado</p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-zinc-300">
            <h2 className="text-2xl font-bold text-white">Best use of this page</h2>
            <p className="mt-4">
              Use this page for network questions, legal or privacy requests, or issues tied to planning flows across DCC and connected sites.
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Connected sites</h2>
          <p className="mt-4">
            Booking-specific questions may be best handled on the site where the booking or request is taking place, including PartyAtRedRocks, Save On The Strip, or Welcome To Alaska Tours.
          </p>
        </section>
      </div>
    </main>
  );
}
