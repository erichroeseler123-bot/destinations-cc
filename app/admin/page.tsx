import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import {
  ADMIN_SESSION_COOKIE,
  isAdminAccessConfigured,
  isValidAdminSession,
} from "@/lib/adminAccess";
import { buildOwnerControlCenterSnapshot } from "@/lib/dcc/ownerControlCenter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Control Center | Destination Command Center",
  robots: { index: false, follow: false },
};

function priorityClasses(priority: "high" | "medium" | "info"): string {
  if (priority === "high") {
    return "border-rose-400/40 bg-rose-500/10 text-rose-100";
  }
  if (priority === "medium") {
    return "border-amber-400/35 bg-amber-500/10 text-amber-100";
  }
  return "border-white/10 bg-white/[0.04] text-zinc-100";
}

export default async function OwnerControlCenterPage() {
  // Defense-in-depth auth check alongside proxy.ts and app/admin/layout.tsx
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!isAdminAccessConfigured() || !isValidAdminSession(session)) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/15 bg-white/5 p-6">
          <h1 className="text-2xl font-black">Admin Session Required</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Unlock the Owner Control Center via <code>/admin</code> to view network triage and commercial ledgers.
          </p>
        </div>
      </main>
    );
  }

  const snapshot = await buildOwnerControlCenterSnapshot();
  const { triageQueue, connectedFunnel28d, fleetHealthAndRollback, commercialLedger } =
    snapshot;

  return (
    <main
      data-testid="dcc-owner-control-center"
      className="min-h-screen bg-zinc-950 text-white"
    >
      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
              Single-Administrator Command Surface · ≤{snapshot.dailyOperatingBudgetMinutes} Min/Day Cadence
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Owner Control Center
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-300">
              Exception-first daily cockpit across all 11 owned production properties, strictly separated commission vs. Direct MoR revenue tracks, and protected partner property boundaries.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <Link
              href={triageQueue.inboxHref}
              className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-2 font-bold text-[#f5c66c] hover:bg-amber-500/25"
            >
              Genuine Inbox ({triageQueue.untriagedInquiriesCount} untriaged) →
            </Link>
            <Link
              href="/admin/portfolio"
              className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3.5 py-2 font-bold text-cyan-200 hover:bg-cyan-500/20"
            >
              Portfolio Desktop →
            </Link>
            <a
              href="/api/admin/control-center"
              className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 font-mono text-zinc-200 hover:bg-white/10"
            >
              JSON Snapshot
            </a>
          </div>
        </header>

        {/* SECTION 1: Exception-First Triage Queue ("Needs Erich Today") */}
        <section aria-labelledby="needs-erich-heading" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                1 · Exception-First Triage Queue
              </div>
              <h2 id="needs-erich-heading" className="mt-1 text-2xl font-black">
                Needs Erich Today ({triageQueue.totalAttentionCount} live exception{triageQueue.totalAttentionCount === 1 ? "" : "s"})
              </h2>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              Generated {new Date(snapshot.generatedAt).toLocaleString()}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {triageQueue.items.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 ${priorityClasses(item.priority)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-black">{item.title}</span>
                  <span className="rounded-full border border-current/30 bg-black/30 px-2.5 py-0.5 font-mono text-[11px] font-semibold">
                    {item.countOrBadge}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-200">
                  {item.detail}
                </p>
                {item.actionHref && item.actionLabel ? (
                  <div className="mt-3">
                    {item.external ? (
                      <a
                        href={item.actionHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
                      >
                        {item.actionLabel}
                      </a>
                    ) : (
                      <Link
                        href={item.actionHref}
                        className="inline-flex items-center rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
                      >
                        {item.actionLabel}
                      </Link>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: 8-Stage Connected Network Funnel (28d) */}
        <section aria-labelledby="funnel-28d-heading" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                2 · 8-Stage Connected Network Funnel (28d)
              </div>
              <h2 id="funnel-28d-heading" className="mt-1 text-2xl font-black">
                Discovery → Fit → Group Plan → Intent → Booking → Attribution → Revenue → Post-Booking
              </h2>
            </div>
            <span className="text-xs text-zinc-400">
              Window: {connectedFunnel28d.windowLabel}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {connectedFunnel28d.stages.map((stage) => (
              <div
                key={stage.stageId}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      {stage.label}
                    </span>
                    <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-cyan-200">
                      {stage.statusBadge}
                    </span>
                  </div>
                  <div className="mt-2 text-lg font-black text-white">
                    {stage.headlineMetric}
                  </div>
                </div>
                <ul className="mt-3 space-y-1 border-t border-white/10 pt-2.5 text-[11px] leading-relaxed text-zinc-300">
                  {stage.subMetrics.map((line, idx) => (
                    <li key={idx}>• {line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Strictly Separated Revenue Tracks Callout */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-300">
                Track A · Commission Revenue (Affiliate / 10% Direct / 5% Machine)
              </div>
              <div className="mt-2 text-2xl font-black text-white">
                ${connectedFunnel28d.strictlySeparatedRevenue.commissionTrack.reportedCommissionsEarnedUsd.toLocaleString()} reported · $
                {connectedFunnel28d.strictlySeparatedRevenue.commissionTrack.confirmedSettledPayoutsUsd.toLocaleString()} settled
              </div>
              <p className="mt-1.5 text-xs text-emerald-100/90">
                Status: <code>{connectedFunnel28d.strictlySeparatedRevenue.commissionTrack.outcomesStatus}</code> · Routes:{" "}
                {connectedFunnel28d.strictlySeparatedRevenue.commissionTrack.routesIncluded.join(", ")}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-300">
                Track B · Isolated Direct MoR Operating Gross (GoSno + PARR)
              </div>
              <div className="mt-2 text-2xl font-black text-white">
                ${connectedFunnel28d.strictlySeparatedRevenue.directMorGrossTrack.portfolioOwnedGrossSalesUsd.toLocaleString()} confirmed gross ($
                {connectedFunnel28d.strictlySeparatedRevenue.directMorGrossTrack.pendingOwnedSettlementUsd.toLocaleString()} pending)
              </div>
              <p className="mt-1.5 text-xs text-indigo-100/90">
                {connectedFunnel28d.strictlySeparatedRevenue.directMorGrossTrack.isolationRule}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: Owned Fleet Health & Rollback Matrix (11 Active Projects) + Protected Partner Property Card */}
        <section aria-labelledby="fleet-matrix-heading" className="space-y-5">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              3 · Owned Fleet Health &amp; Rollback Matrix ({fleetHealthAndRollback.ownedActiveProductionProjectsCount} Active Owned Production Projects)
            </div>
            <h2 id="fleet-matrix-heading" className="mt-1 text-2xl font-black">
              Owned Production Fleet vs. Protected Partner Boundary
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 text-zinc-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Owned Property</th>
                  <th className="px-4 py-3 font-semibold">Domain</th>
                  <th className="px-4 py-3 font-semibold">Live Role</th>
                  <th className="px-4 py-3 font-semibold">Ownership / Money Route</th>
                  <th className="px-4 py-3 font-semibold">Deploy &amp; Rollback Playbook</th>
                </tr>
              </thead>
              <tbody>
                {fleetHealthAndRollback.ownedProductionProjects.map((proj) => (
                  <tr key={proj.projectId} className="border-b border-white/10">
                    <td className="px-4 py-3 font-mono text-zinc-400">{proj.projectNumber}</td>
                    <td className="px-4 py-3 font-bold text-white">{proj.name}</td>
                    <td className="px-4 py-3 font-mono text-cyan-200">{proj.canonicalDomain}</td>
                    <td className="px-4 py-3 text-zinc-300">{proj.role}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] text-emerald-200">{proj.ownershipModel}</div>
                      <div className="font-mono text-[10px] text-zinc-400">{proj.primaryRouteModel}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <div className="font-medium text-zinc-200">{proj.deploySurface}</div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">{proj.rollbackTarget}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visually Separated Protected Partner Property Card (Welcome to Alaska Tours) */}
          {fleetHealthAndRollback.protectedPartnerProperties.map((partner) => (
            <div
              key={partner.partnerId}
              data-testid="protected-partner-property-card"
              className="rounded-2xl border-2 border-amber-400/50 bg-amber-950/25 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-amber-300/50 bg-amber-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">
                  Protected Partner Property · Independent Ownership ({partner.ownership})
                </span>
                <span className="font-mono text-xs font-bold text-rose-200">
                  Checkout: {partner.checkoutStatus} · Consumer Linking Forbidden
                </span>
              </div>
              <h3 className="mt-3 text-xl font-black text-white">
                {partner.propertyName} ({partner.shortCode}) — <code>{partner.canonicalDomain}</code>
              </h3>
              <p className="mt-1.5 font-mono text-xs text-amber-100">
                {partner.guardrailSummary}
              </p>
              <div className="mt-3 grid gap-3 text-xs text-zinc-200 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/35 p-3">
                  <div className="font-bold text-amber-200">Deployment &amp; Containment Pin</div>
                  <div className="mt-1">
                    Active Containment: <code>{partner.activeContainmentDeployment}</code>
                  </div>
                  <div className="mt-0.5 text-zinc-400">
                    Staged Contingency (preview only): <code>{partner.stagedContingencyPreviewOnly}</code>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/35 p-3">
                  <div className="font-bold text-rose-200">Prohibited Without Explicit Partner Approval</div>
                  <div className="mt-1 font-mono text-[11px] text-zinc-200">
                    {partner.prohibitedWithoutPartnerApproval.join(" · ")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 4: 4-Route Money Model, Frozen Affiliate Ledger, & Held SKUs */}
        <section aria-labelledby="money-ledger-heading" className="space-y-6">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
              4 · 4-Route Commercial Model + 1 Neutral Route &amp; Frozen Affiliate Ledger
            </div>
            <h2 id="money-ledger-heading" className="mt-1 text-2xl font-black">
              Canonical Money Routes, 8 Frozen Affiliate IDs, &amp; Held SKUs
            </h2>
          </div>

          {/* Route Models */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 text-zinc-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Route ID</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Target Rate / Basis</th>
                  <th className="px-4 py-3 font-semibold">Fit Neutrality</th>
                  <th className="px-4 py-3 font-semibold">Governance &amp; Settlement Rule</th>
                </tr>
              </thead>
              <tbody>
                {commercialLedger.transactionRouteModels.map((route) => (
                  <tr key={route.id} className="border-b border-white/10">
                    <td className="px-4 py-3 font-mono font-bold text-amber-200">{route.id}</td>
                    <td className="px-4 py-3 font-mono text-zinc-300">{route.routeCategory}</td>
                    <td className="px-4 py-3 text-white">{route.targetTakeRateDisplay}</td>
                    <td className="px-4 py-3 font-mono text-emerald-300">
                      influencesFitOrRanking: false
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{route.liabilityAndSettlementRule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Frozen Affiliate IDs */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 text-zinc-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Frozen ID</th>
                  <th className="px-4 py-3 font-semibold">Provider / Param</th>
                  <th className="px-4 py-3 font-semibold">Assigned Surfaces</th>
                  <th className="px-4 py-3 font-semibold">Governance Status</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {commercialLedger.frozenAffiliateIdentifiers.map((item) => (
                  <tr key={`${item.provider}:${item.id}`} className="border-b border-white/10">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-200">{item.id}</td>
                    <td className="px-4 py-3 font-mono text-zinc-300">
                      {item.provider} (<code>{item.parameterName}</code>)
                    </td>
                    <td className="px-4 py-3 text-zinc-200">{item.assignedSurfaces.join(", ")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[11px] ${
                          item.governanceStatus === "partner_boundary_review_required"
                            ? "bg-amber-500/25 text-amber-200"
                            : "bg-emerald-500/15 text-emerald-200"
                        }`}
                      >
                        {item.governanceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Held Commercial SKUs */}
          <div className="grid gap-4 md:grid-cols-2">
            {commercialLedger.heldCommercialSkus.map((sku) => (
              <div
                key={sku.skuSlug}
                className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-rose-200">
                    HELD SKU · {sku.surfaceCode} ({sku.canonicalDomain})
                  </span>
                  <code className="text-[11px] text-zinc-200">{sku.skuSlug}</code>
                </div>
                <h3 className="mt-2 text-base font-bold text-white">{sku.title}</h3>
                <p className="mt-1 text-xs text-rose-100/90">{sku.holdReason}</p>
                <ul className="mt-2.5 space-y-1 text-[11px] text-zinc-200">
                  {sku.unholdPrerequisites.map((req, idx) => (
                    <li key={idx}>• {req}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
