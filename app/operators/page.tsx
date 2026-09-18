import type { Metadata } from "next";
import Link from "next/link";
import { OctoRegistryService } from "@/lib/octo/registry";

export const metadata: Metadata = {
  title: "Authorized Tourism & Transportation Operators | Destination Command Center",
  description:
    "Directory of authorized tourism and transportation operators on Destination Command Center. Direct provider authority, verified safety credentials, and open OCTO booking connections.",
  alternates: { canonical: "/operators" },
};

export default async function OperatorsDirectoryPage() {
  const connections = await OctoRegistryService.getAuthorizedConnections();
  const participants = await OctoRegistryService.getParticipants("supplier");

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      <div className="border-b border-white/8 bg-gradient-to-b from-emerald-950/20 via-black/40 to-transparent">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
            Authoritative Provider Network
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl text-white">
            Authorized Operators
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/70">
            DCC does not hide the operator behind private gatekeeper walls. Every operator listed here maintains
            direct legal and operational authority over their fleet, tours, cancellations, and guest communication.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 space-y-12">
        <div className="grid gap-6 md:grid-cols-2">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{conn.operatorName}</h3>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-300 uppercase">
                  {conn.healthStatus}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-white/60">
                <p>
                  Sovereign Slug: <span className="font-mono text-white/80">{conn.operatorSlug}</span>
                </p>
                <p>
                  Capabilities:{" "}
                  <span className="font-mono text-cyan-300">
                    {conn.capabilities.join(", ")}
                  </span>
                </p>
                <p>
                  Platform Share:{" "}
                  <span className="font-bold text-emerald-400">{conn.commissionPercent}% Fixed DCC Share</span>
                </p>
                <p>
                  Agreement Version:{" "}
                  <span className="text-white/80">{conn.consentAgreementVersion}</span>
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <Link
                  href={`/operators/${conn.operatorSlug}`}
                  className="text-xs font-bold text-cyan-300 hover:text-cyan-200"
                >
                  Operator Dossier →
                </Link>
                <Link
                  href={`/tours?q=${encodeURIComponent(conn.operatorName)}`}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition"
                >
                  Book Direct Tours
                </Link>
              </div>
            </div>
          ))}

          {/* Additional verified operator placeholders */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Party At Red Rocks (PARR)</h3>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-300 uppercase">
                Verified Direct
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-white/60">
              <p>Sovereign Slug: <span className="font-mono text-white/80">partyatredrocks</span></p>
              <p>Focus: <span className="text-white/80">Concert transportation & Morrison amphitheatre tours</span></p>
              <p>Platform Share: <span className="font-bold text-emerald-400">5.0% Fixed DCC Share</span></p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <Link href="/operators/partyatredrocks" className="text-xs font-bold text-cyan-300 hover:text-cyan-200">
                Operator Dossier →
              </Link>
              <Link href="/book/red-rocks" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition">
                Book Red Rocks Shuttles
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 text-sm text-white/70">
          <p className="font-bold text-white">Are you a tour operator or transportation provider?</p>
          <p className="mt-1">
            Connect your OCTO-compatible reservation system (Ventrata, Bókun, Rezdy, FareHarbor, TourCMS, or custom) to
            Destination Command Center with direct operator authority and zero listing fees.
          </p>
          <div className="mt-4">
            <Link href="/octo" className="font-bold text-cyan-300 hover:underline">
              Review OCTO Participant Registry & Onboarding Standards →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
