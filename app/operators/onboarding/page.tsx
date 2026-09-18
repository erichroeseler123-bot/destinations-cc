import type { Metadata } from "next";
import Link from "next/link";
import { OctoOnboardingService } from "@/lib/octo/onboardingService";
import { getDb } from "@/lib/db/client";
import { octoSupplierConnections } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operator Onboarding & Verification Console | Destination Command Center",
  description:
    "Authoritative 8-stage technical onboarding, verification, and live promotion pipeline for sovereign OCTO tour operators.",
};

const ONBOARDING_STAGES = [
  { id: "discovered", label: "Discovered", desc: "Identified in OCTO network" },
  { id: "consented", label: "Consented", desc: "Terms & authority agreed" },
  { id: "credentials_configured", label: "Credentials", desc: "Encrypted API keys stored" },
  { id: "connection_verified", label: "Connection", desc: "Endpoint health verified" },
  { id: "catalog_synced", label: "Catalog Synced", desc: "Products normalized to DCC" },
  { id: "availability_verified", label: "Availability", desc: "Live availability confirmed" },
  { id: "booking_tested", label: "Booking Tested", desc: "Hold -> Confirm -> Cancel passed" },
  { id: "bookable", label: "Bookable", desc: "Promoted to live directory" },
];

export default async function OperatorOnboardingPage() {
  const db = getDb();
  let connections: any[] = [];
  if (db) {
    try {
      connections = await db.select().from(octoSupplierConnections);
    } catch {
      connections = [];
    }
  }

  const pilotChecklist = OctoOnboardingService.generatePilotChecklist("ventrata");

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 py-8 px-6 sm:px-10">
        <div className="mx-auto max-w-6xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-0.5 text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest">
              OCTO Pipeline
            </span>
            <span className="text-xs text-white/50 font-mono">Stage 1 through 8</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
            Operator Onboarding & Verification Console
          </h1>
          <p className="text-sm text-zinc-300 max-w-3xl">
            Neutral, sovereign onboarding path for OCTO tour operators. Operators maintain direct authority over
            inventory, fulfillment, cancellations, and customer relationships with zero mandatory OTA gatekeeping.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl py-10 px-6 sm:px-10 space-y-12">
        {/* 8-Stage Pipeline Visualizer */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-white">8-Stage Technical Verification Lifecycle</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {ONBOARDING_STAGES.map((s, idx) => (
              <div
                key={s.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2 relative overflow-hidden"
              >
                <span className="text-[10px] font-mono text-cyan-400 font-bold">Step {idx + 1}</span>
                <p className="text-xs font-bold text-white leading-tight">{s.label}</p>
                <p className="text-[10px] text-zinc-400 leading-normal">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Live Operator Connections in DB */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Registered Operator Connections</h2>
              <p className="text-xs text-zinc-400">Current state in Neon PostgreSQL</p>
            </div>
            <Link
              href="/octo"
              className="text-xs font-bold text-cyan-300 hover:text-cyan-200 transition"
            >
              OCTO Directory →
            </Link>
          </div>

          {connections.length > 0 ? (
            <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {connections.map((c) => (
                <div key={c.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{c.operatorName}</h3>
                        {c.isSandbox ? (
                          <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-400/20">
                            Sandbox
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-400/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-400/20">
                            Live Production
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-zinc-400">{c.endpoint}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
                        {c.onboardingStage || "discovered"}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-mono font-bold ${
                          c.healthStatus === "healthy"
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                            : "border-zinc-600 bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {c.healthStatus}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 pt-2 border-t border-white/5 text-zinc-400">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-500 block">Commission</span>
                      <span className="text-white font-mono">{c.commissionPercent}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-500 block">Signatory</span>
                      <span className="text-white font-mono">{c.signatoryName || "Pending"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-500 block">Catalog Status</span>
                      <span className="text-white font-mono">{c.catalogSyncStatus || "Unsynced"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-500 block">Booking Test</span>
                      <span className="text-white font-mono">{c.bookingTestStatus || "Untested"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No operator connections currently registered.</p>
          )}
        </section>

        {/* First Live Pilot Operator Checklist */}
        <section className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-black/40 to-emerald-950/20 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                Pilot Candidate Grounding
              </span>
              <h2 className="text-2xl font-black text-white">{pilotChecklist.candidate}</h2>
            </div>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
              5% Agreed Model
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">
                Required Credentials Checklist
              </h3>
              <ul className="space-y-3 text-xs">
                {pilotChecklist.requiredCredentials.map((c, idx) => (
                  <li key={idx} className="space-y-1">
                    <p className="font-bold text-white">{c.name}</p>
                    <p className="text-zinc-400">{c.purpose}</p>
                    {c.format && <p className="font-mono text-[11px] text-cyan-400">Format: {c.format}</p>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
              <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                Consent & Authority Agreement
              </h3>
              <div className="space-y-2 text-xs text-zinc-300">
                <p>
                  <strong className="text-white">Agreement Version:</strong> {pilotChecklist.requiredConsent.agreement}
                </p>
                <p>
                  <strong className="text-white">Platform Take-Rate:</strong> {pilotChecklist.requiredConsent.distributionShare}
                </p>
                <p>
                  <strong className="text-white">Provider Authority:</strong> {pilotChecklist.requiredConsent.operatorAuthority}
                </p>
                <p>
                  <strong className="text-white">Payment Model:</strong> {pilotChecklist.requiredConsent.paymentModel}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Verification Run Order
            </h3>
            <ol className="grid gap-2 sm:grid-cols-2 text-xs text-zinc-400 list-decimal list-inside">
              {pilotChecklist.technicalVerificationStages.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
