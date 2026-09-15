import type { Metadata } from "next";
import Link from "next/link";
import { OctoRegistryService } from "@/lib/octo/registry";

export const metadata: Metadata = {
  title: "OCTO Participant Directory & Ecosystem Tracker | Destination Command Center",
  description:
    "Explore the authorized OCTO (Open Connectivity for Tour Operators) network. Neutral, machine-readable connectivity giving operators direct authority over their tours and bookings without platform lock-in.",
  alternates: { canonical: "/octo" },
};

export default async function OctoDirectoryPage() {
  const participants = await OctoRegistryService.getParticipants();

  const suppliers = participants.filter((p) => p.role === "supplier");
  const techPartners = participants.filter((p) => p.role !== "supplier");

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      {/* Hero Header */}
      <div className="border-b border-white/8 bg-gradient-to-b from-cyan-950/20 via-black/40 to-transparent">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
              Direct Tourism Connectivity
            </span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
              5% Fixed Commission Model
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl text-white">
            OCTO Participant Directory
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/70">
            Destination Command Center (DCC) provides a neutral, sovereign discovery and booking layer
            connected directly to OCTO-standard systems worldwide. Operators retain full authority over their
            pricing, schedules, cancellations, and customer relationships. Google Things to Do, TripAdvisor,
            Viator, and GetYourGuide remain optional channels—not mandatory gatekeepers.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/operators"
              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-400"
            >
              View Authorized Operators →
            </Link>
            <Link
              href="/tours"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Browse Tour Catalog
            </Link>
            <Link
              href="/api/octo/participants"
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Machine Endpoint (JSON)
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 space-y-16">
        {/* Core Principles Grid */}
        <section className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Zero Hostage Data</p>
            <h3 className="mt-2 text-xl font-bold text-white">Direct Operator Authority</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              Every booking is created directly against the operator’s authoritative reservation system. DCC
              never captures inventory to resell at marked-up rates.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Fair Economics</p>
            <h3 className="mt-2 text-xl font-bold text-white">Negotiated Commercial Terms</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              Transparent, double-entry settlement with terms agreed directly with each supplier—preserving
              operator margins and ensuring transparent auditability.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Universal Standard</p>
            <h3 className="mt-2 text-xl font-bold text-white">OCTO Core Standard</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              Built on Open Connectivity for Tour Operators specifications: standard availability checks,
              two-phase booking holds with explicit expiration, and direct ticket delivery.
            </p>
          </div>
        </section>

        {/* Authorized Suppliers */}
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Connected Operators & Suppliers</h2>
              <p className="mt-1 text-sm text-white/60">
                Operators with active OCTO connections or reference integration testing.
              </p>
            </div>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
              {suppliers.length} Registered
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-500/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-white">{s.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        s.outreachStatus === "live_authorized"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {s.outreachStatus.replace("_", " ")}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-white/50">
                    Destinations:{" "}
                    <span className="text-white/80">{s.destinations.join(", ")}</span>
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    Payment Model:{" "}
                    <span className="text-white/80">{s.bookingPaymentModel.replace("_", " ")}</span>
                  </p>
                  {s.notes && <p className="mt-3 text-xs text-white/60 italic">{s.notes}</p>}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs font-mono text-cyan-400">
                    {s.agreedCommissionPercent}% DCC Take-Rate
                  </span>
                  <Link
                    href={`/tours?q=${encodeURIComponent(s.name)}`}
                    className="text-xs font-bold text-white hover:text-cyan-300"
                  >
                    View Tours →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ecosystem Tech Partners & Res Systems */}
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Booking Systems & Technology Partners</h2>
              <p className="mt-1 text-sm text-white/60">
                Res systems, channel managers, and technology partners implementing the OCTO standard.
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
              {techPartners.length} Partners
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-bold uppercase text-white/50">
                <tr>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Coverage</th>
                  <th className="px-6 py-4">Integration Status</th>
                  <th className="px-6 py-4">Products</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {techPartners.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-bold text-white">
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-cyan-300"
                      >
                        {p.name} ↗
                      </a>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-white/70 uppercase">
                      {p.role.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60">
                      {p.destinations.join(", ")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-white/70">
                        {p.outreachStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-cyan-300">
                      ~{p.productsAvailableCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
