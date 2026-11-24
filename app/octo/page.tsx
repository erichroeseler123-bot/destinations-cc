import type { Metadata } from "next";
import Link from "next/link";
import { isParticipantLiveAuthorized, OctoRegistryService } from "@/lib/octo/registry";
import { OctoParticipant } from "@/lib/octo/types";

export const metadata: Metadata = {
  title: "OCTO Participant Registry & Connectivity Audit | Destination Command Center",
  description:
    "Audited OCTO (Open Connectivity for Tour Operators) participant and reservation-system reference registry. Unknown inventory and unsigned commercial terms are explicitly shown as unknown.",
  alternates: { canonical: "/octo" },
};

function renderInventoryLabel(p: OctoParticipant): string {
  if (p.inventoryStatus === "unknown" || p.productsAvailableCount == null) {
    return "unknown";
  }
  if (p.inventoryStatus === "sandbox_mock_only") {
    return `${p.productsAvailableCount} (sandbox mock only)`;
  }
  return String(p.productsAvailableCount);
}

function renderCommercialTermsLabel(p: OctoParticipant): string {
  if (
    p.commercialTermsStatus === "agreed" &&
    p.agreementReference &&
    p.agreedCommissionPercent != null
  ) {
    return `Agreed ${p.agreedCommissionPercent}% (Ref: ${p.agreementReference})`;
  }
  if (p.commercialTermsStatus === "sandbox_only") {
    return "sandbox_only (internal test fixture; unsigned)";
  }
  return "unknown";
}

export default async function OctoDirectoryPage() {
  const { participants, liveAuthorizedOperatorCount } = await OctoRegistryService.getSummary();

  const suppliers = participants.filter((p) => p.role === "supplier");
  const techPartners = participants.filter((p) => p.role !== "supplier");
  const effectiveLiveCount = liveAuthorizedOperatorCount;

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      {/* Hero Header */}
      <div className="border-b border-white/8 bg-gradient-to-b from-cyan-950/20 via-black/40 to-transparent">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
              Audited Connectivity Registry
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                effectiveLiveCount > 0
                  ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border border-amber-400/30 bg-amber-400/10 text-amber-300"
              }`}
            >
              {effectiveLiveCount === 0
                ? "Direct Production Sales Disabled (0 Live Authorized)"
                : `${effectiveLiveCount} Live Authorized Operator${effectiveLiveCount === 1 ? "" : "s"}`}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-white/80">
              Unsigned Commercial Terms: unknown
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl text-white">
            OCTO &amp; Reservation System Registry
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/70">
            Destination Command Center (DCC) documents reservation system protocols and operator connectivity
            status from verified records. Unverified API endpoints, product inventory counts, and unsigned
            commercial terms are shown as <code className="text-cyan-300">unknown</code>. Live operator counts
            are derived strictly from documented authorizations.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/operators"
              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-400"
            >
              View Verified Operator Channels →
            </Link>
            <Link
              href="/tours"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Browse Tours &amp; Excursions
            </Link>
            <a
              href="/api/octo/participants"
              className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-5 py-3 text-sm font-mono text-cyan-300 transition hover:bg-cyan-950/60"
            >
              GET /api/octo/participants
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 space-y-16">
        {/* Governance & Protocol Distinctions */}
        <section className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Documented Authorizations
            </p>
            <h3 className="mt-2 text-xl font-bold text-white">
              Live Booking Requires Signed Authority
            </h3>
            <p className="mt-2 text-sm text-white/65 leading-relaxed">
              An operator is counted as live-authorized only when verified OCTO credentials, health checks,
              and a documented agreement reference are on file. Unauthorized operators cannot create live holds
              or confirm bookings.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Protocol Accuracy
            </p>
            <h3 className="mt-2 text-xl font-bold text-white">
              FareHarbor Affiliate ≠ OCTO Authorized
            </h3>
            <p className="mt-2 text-sm text-white/65 leading-relaxed">
              FareHarbor uses its proprietary External API v1 and Lightframe embeds rather than OCTO. FareHarbor
              affiliate access or partner links on DCC or spoke sites never mark an operator as OCTO-authorized.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Epistemic Honesty
            </p>
            <h3 className="mt-2 text-xl font-bold text-white">
              Unknown Inventory &amp; Terms Shown as Unknown
            </h3>
            <p className="mt-2 text-sm text-white/65 leading-relaxed">
              Where DCC lacks verified API credentials, synced product catalogs, or signed operator contracts,
              inventory (<code className="text-cyan-300">inventoryStatus</code>) and commercial terms (
              <code className="text-cyan-300">commercialTermsStatus</code>) are represented as{" "}
              <code className="text-cyan-300">unknown</code>.
            </p>
          </div>
        </section>

        {/* Supplier Candidates & Reference Sandbox */}
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">
                Operator Entries &amp; Internal Reference Sandbox
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Directory-only operator candidates, documented live connections (if any), and non-production test
                fixtures.
              </p>
            </div>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
              {suppliers.length} Entries ({effectiveLiveCount} Live Authorized)
            </span>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((s) => {
              const isLive = isParticipantLiveAuthorized(s);
              return (
                <div
                  key={s.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-500/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-white">{s.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isLive
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        {isLive ? "live authorized" : s.partnershipStatus.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-xs text-white/60">
                      <strong>Native Protocol:</strong>{" "}
                      <span className="font-mono text-cyan-200">{s.nativeProtocol}</span>
                    </p>
                    <p className="text-xs text-white/60">
                      <strong>API Access:</strong>{" "}
                      <span className="font-mono text-white/85">{s.apiAccessStatus}</span> ·{" "}
                      <strong>Endpoint:</strong>{" "}
                      <span className="font-mono text-white/85">{s.endpoint ?? "unknown"}</span>
                    </p>
                    <p className="text-xs text-white/60">
                      <strong>Inventory:</strong>{" "}
                      <span className="font-mono text-white/85">{renderInventoryLabel(s)}</span> ·{" "}
                      <strong>Certification:</strong>{" "}
                      <span className="font-mono text-white/85">{s.certificationStatus}</span>
                    </p>
                    <p className="text-xs text-white/60">
                      <strong>Outreach / Consent:</strong>{" "}
                      <span className="font-mono text-white/85">
                        {s.outreachStatus} / {s.consentStatus}
                      </span>
                    </p>
                    <p className="text-xs text-white/60">
                      <strong>Commercial Terms:</strong>{" "}
                      <span className="font-mono text-amber-200">{renderCommercialTermsLabel(s)}</span>
                    </p>
                    {s.notes && <p className="pt-1 text-xs text-white/65">{s.notes}</p>}

                    <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 space-y-1">
                      <p className="text-[11px] font-mono font-bold uppercase text-cyan-300">
                        Evidence Trace
                      </p>
                      {s.evidence.map((ev, idx) => (
                        <p key={idx} className="text-[11px] text-white/70 leading-relaxed">
                          • <span className="font-mono uppercase text-amber-300">[{ev.verificationStatus}]</span>{" "}
                          {ev.claim} — <code className="text-cyan-200">{ev.source}</code>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                    <span className="font-mono text-white/60">
                      Agreement Ref: {s.agreementReference ?? "unknown"}
                    </span>
                    <Link href="/operators" className="font-bold text-cyan-300 hover:underline">
                      Operator Channels →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Booking Systems & Channel Managers */}
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">
                Reservation Systems &amp; Channel Managers (Reference Profiles)
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Technical protocol profiles for reservation platforms. Unverified endpoints, inventory counts, and
                commercial arrangements are listed as unknown.
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
              {techPartners.length} Reference Systems
            </span>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-bold uppercase text-white/50">
                <tr>
                  <th className="px-5 py-4">System</th>
                  <th className="px-5 py-4">Native Protocol &amp; Docs</th>
                  <th className="px-5 py-4">DCC API Access &amp; Endpoint</th>
                  <th className="px-5 py-4">Inventory</th>
                  <th className="px-5 py-4">Commercial Terms</th>
                  <th className="px-5 py-4">Evidence Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 align-top">
                {techPartners.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4 font-bold text-white">
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-cyan-300 transition"
                      >
                        {p.name} ↗
                      </a>
                      <div className="mt-1 text-[11px] font-mono uppercase text-white/50">
                        {p.role.replace(/_/g, " ")} · partnership: {p.partnershipStatus}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-white/75">
                      <div>{p.nativeProtocol}</div>
                      {p.documentationUrl && (
                        <a
                          href={p.documentationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block font-mono text-[11px] text-cyan-300 underline"
                        >
                          {p.documentationUrl}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-amber-200">
                      <div>access: {p.apiAccessStatus}</div>
                      <div className="text-white/50">endpoint: {p.endpoint ?? "unknown"}</div>
                      <div className="text-white/50">cert: {p.certificationStatus}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-white/75">
                      {renderInventoryLabel(p)}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-white/75">
                      <div>terms: {renderCommercialTermsLabel(p)}</div>
                      <div className="text-white/50">
                        agreementRef: {p.agreementReference ?? "unknown"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-white/70 space-y-1">
                      {p.evidence.map((ev, idx) => (
                        <div key={idx} className="text-[11px] leading-relaxed">
                          <span className="font-mono uppercase text-cyan-300">
                            [{ev.verificationStatus}]
                          </span>{" "}
                          {ev.claim} (<code className="text-white/80">{ev.source}</code>)
                        </div>
                      ))}
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
