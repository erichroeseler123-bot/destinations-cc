import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Destination Command Center",
  description:
    "Privacy policy for Destination Command Center, including how trip-planning, routing, analytics, and handoff data are handled.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Legal</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Privacy Policy</h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-300">
            Destination Command Center helps travelers compare destinations and route into the right booking path. This page explains what information may be collected when you browse DCC or move into connected partner and satellite flows.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">What we collect</h2>
          <p>
            We may collect standard analytics data, page activity, device and browser information, search inputs, and routing context such as page source, handoff identifiers, and return paths when you move from DCC into a connected booking or guide experience.
          </p>
          <p>
            If you submit information through a form, we may collect details like name, email, phone number, trip context, and message content so we can respond or route the request correctly.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">How the data is used</h2>
          <p>
            DCC uses data to improve trip-planning pages, understand which destination paths perform well, maintain cross-site attribution across the Destination Command Network, and measure outcomes after a traveler leaves DCC for a connected site.
          </p>
          <p>
            Connected sites may send lifecycle events back to DCC, such as a handoff being viewed, a booking being started, or a booking being completed or failed.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Cookies and analytics</h2>
          <p>
            DCC may use cookies, local storage, and analytics tools to keep sessions stable, understand usage patterns, and preserve routing context between DCC and connected sites. You can control cookies through your browser settings.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">External bookings and partner sites</h2>
          <p>
            When you leave DCC for a connected site such as PartyAtRedRocks, Save On The Strip, or Welcome To Alaska Tours, that site may have its own privacy practices and terms. DCC may still receive attribution and lifecycle data tied to the handoff so the network can measure performance.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Contact</h2>
          <p>
            Questions about privacy or data handling can be sent through the <Link href="/contact" className="text-cyan-300 underline underline-offset-4">contact page</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
