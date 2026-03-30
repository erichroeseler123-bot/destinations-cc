import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | Destination Command Center",
  description: "Terms of use for Destination Command Center and connected routing across the Destination Command Network.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Legal</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Terms of Use</h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-300">
            Destination Command Center is a planning and routing platform. By using the site, you agree to use the content and tools responsibly and understand that some bookings and offers happen on connected external sites.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Planning content and availability</h2>
          <p>
            DCC publishes destination guides, planning tools, availability signals, and outbound booking routes. Prices, schedules, inventory, and offer details can change without notice. Travelers should confirm final details on the connected booking site before purchase.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">External sites and bookings</h2>
          <p>
            Some actions on DCC route into connected sites or third parties. Those sites may have their own terms, policies, and booking conditions. DCC is not responsible for third-party terms, availability changes, or provider-side booking outcomes.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Acceptable use</h2>
          <p>
            You may not misuse the site, attempt to interfere with services, scrape protected endpoints outside allowed public feeds, or use the content in a way that violates applicable law.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Contact</h2>
          <p>
            Questions about these terms can be sent through the <Link href="/contact" className="text-cyan-300 underline underline-offset-4">contact page</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
