import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import {
  ADMIN_SESSION_COOKIE,
  isAdminAccessConfigured,
  isValidAdminSession,
} from "@/lib/adminAccess";
import { buildOwnerControlCenterSnapshot } from "@/lib/dcc/ownerControlCenter";
import CommissionReconcilePanel from "./CommissionReconcilePanel";
import DirectOperatorPitchPanel from "./DirectOperatorPitchPanel";

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
            Unlock the Owner Control Center via <code>/admin</code> to view daily business operations and commercial ledgers.
          </p>
        </div>
      </main>
    );
  }

  const snapshot = await buildOwnerControlCenterSnapshot();
  const {
    dailyBusinessCockpit,
    triageQueue,
    connectedFunnel28d,
    fleetHealthAndRollback,
    commercialLedger,
  } = snapshot;

  const fareharborAuthReady = Boolean(
    (process.env.FAREHARBOR_WEBHOOK_TOKEN || "").trim().length >= 16 ||
      (process.env.DCC_WTA_WEBHOOK_HMAC_SECRET || "").trim().length >= 16 ||
      (process.env.FAREHARBOR_USER_KEY || "").trim().length >= 16 ||
      ((process.env.FAREHARBOR_APP_KEY || "").trim() &&
        (process.env.FAREHARBOR_USER_KEY || "").trim()),
  );
  const cruisePromenadeSyncReady = Boolean(
    (process.env.DCC_CP_SERVICE_SECRET || "").trim(),
  );

  const q1 = dailyBusinessCockpit.didWeMakeMoney;
  const q2 = dailyBusinessCockpit.bookingsNeedingAttention;
  const q3 = dailyBusinessCockpit.automationHealth;
  const q4 = dailyBusinessCockpit.inquiriesNeedingReply;
  const q5 = dailyBusinessCockpit.linksProducingSales;
  const q6 = dailyBusinessCockpit.operatorAndOrganizerFollowUps;

  return (
    <main
      data-testid="dcc-owner-control-center"
      className="min-h-screen bg-zinc-950 text-white"
    >
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* Compact Daily Business Header */}
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
              Daily Business Screen · 6 Questions Only · Generated{" "}
              {new Date(snapshot.generatedAt).toLocaleString()}
            </div>
            <h1 className="mt-1.5 text-3xl font-black tracking-tight sm:text-4xl">
              Owner Control Center
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm text-zinc-300">
              Everything needed to run revenue, bookings, automations, inquiries, link conversions, and operator/organizer follow-ups in one glance. Reference architecture and reconciliation tools stay tucked below.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href={q4.inboxHref}
              className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-2 font-bold text-[#f5c66c] hover:bg-amber-500/25"
            >
              Genuine Inbox ({q4.untriagedGenuineCount}) →
            </Link>
            <Link
              href="/admin/portfolio"
              className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3.5 py-2 font-bold text-cyan-200 hover:bg-cyan-500/20"
            >
              Portfolio Audit →
            </Link>
            <a
              href="/api/admin/control-center"
              className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 font-mono text-zinc-200 hover:bg-white/10"
            >
              JSON
            </a>
          </div>
        </header>

        {/* PRIMARY SCREEN: THE 6 DAILY OPERATING QUESTIONS */}
        <section
          data-testid="daily-six-questions-cockpit"
          aria-label="Daily Operating Questions"
          className="space-y-5"
        >
          {/* Row 1: Questions 1, 2, 3, 4 */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Q1: Did we make money? */}
            <article
              data-testid="daily-q1-money"
              className="rounded-2xl border border-emerald-400/35 bg-emerald-500/[0.07] p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-emerald-200">
                  {q1.question}
                </h2>
                <span className="rounded-full bg-black/40 px-2.5 py-0.5 font-mono text-[11px] text-zinc-300">
                  28d Window
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    Settled Affiliate Commissions
                  </div>
                  <div className="mt-1 text-2xl font-black text-white">
                    ${q1.settledAffiliateCommissionsUsd28d.toLocaleString()}
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-300">
                    Reported pending: $
                    {q1.reportedPendingCommissionsUsd28d.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                    Direct MoR Paid Gross Sales
                  </div>
                  <div className="mt-1 text-2xl font-black text-white">
                    ${q1.paidMorGrossSalesUsd28d.toLocaleString()}
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-300">
                    {q1.paidBookingsCount28d} paid (GoSno {q1.gosnoPaidOrders28d} · PARR{" "}
                    {q1.parrPaidOrders28d})
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-amber-400/25 bg-black/35 px-3 py-2 text-[11px] text-amber-100">
                <strong>Net Operating Revenue:</strong>{" "}
                <code>{q1.netOperatingRevenueLabel}</code> · {q1.grossSalesNotProfitDisclosure}.
              </div>
            </article>

            {/* Q2: What bookings need attention? */}
            <article
              data-testid="daily-q2-bookings"
              className={`rounded-2xl border p-5 space-y-3 ${
                q2.gosnoNeedsReviewOrders + q2.parrNeedsReviewOrders > 0
                  ? "border-rose-400/45 bg-rose-500/10"
                  : "border-white/15 bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-white">
                  {q2.question}
                </h2>
                <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-200">
                  {q2.gosnoNeedsReviewOrders + q2.parrNeedsReviewOrders} manual review ·{" "}
                  {q2.confirmedUnpaidOrders28d} unpaid
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-black/35 p-2.5">
                  <div className="text-[10px] uppercase text-zinc-400">Needs Review</div>
                  <div className="mt-0.5 font-mono text-base font-black text-white">
                    {q2.gosnoNeedsReviewOrders + q2.parrNeedsReviewOrders}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    GoSno {q2.gosnoNeedsReviewOrders} · PARR {q2.parrNeedsReviewOrders}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/35 p-2.5">
                  <div className="text-[10px] uppercase text-zinc-400">Confirmed-Unpaid</div>
                  <div className="mt-0.5 font-mono text-base font-black text-amber-200">
                    {q2.confirmedUnpaidOrders28d}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    ${q2.confirmedUnpaidGrossUsd28d.toLocaleString()} uncollected
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/35 p-2.5">
                  <div className="text-[10px] uppercase text-zinc-400">Awaiting Balance</div>
                  <div className="mt-0.5 font-mono text-base font-black text-white">
                    {q2.awaitingBalanceOrders28d}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    ${q2.awaitingBalanceGrossUsd28d.toLocaleString()} balance
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/35 p-2.5">
                  <div className="text-[10px] uppercase text-zinc-400">Open Quotes</div>
                  <div className="mt-0.5 font-mono text-base font-black text-cyan-200">
                    {q2.openQuotes28d}
                  </div>
                  <div className="text-[10px] text-zinc-400">Pre-booking quotes</div>
                </div>
              </div>

              <div className="rounded-xl border border-cyan-400/25 bg-black/40 p-3 text-[11px] leading-relaxed text-zinc-200">
                <div className="font-bold text-cyan-200">
                  Complete Money Loop ({q2.completeMoneyLoop.property}):{" "}
                  <span className="font-normal text-white">
                    {q2.completeMoneyLoop.statusSummary}
                  </span>
                </div>
                <div className="mt-0.5 text-zinc-400">
                  {q2.completeMoneyLoop.marcosManualOrderIsolationRule}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <a
                  href={triageQueue.gosnoOps.opsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 font-bold text-white hover:bg-white/10"
                >
                  GoSno Queue ↗
                </a>
                <a
                  href={triageQueue.parrOps.opsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 font-bold text-white hover:bg-white/10"
                >
                  PARR Inventory ↗
                </a>
              </div>
            </article>

            {/* Q3: Did any automation fail? */}
            <article
              data-testid="daily-q3-automation"
              className={`rounded-2xl border p-5 space-y-3 ${
                q3.totalAutomationFailures > 0
                  ? "border-rose-400/45 bg-rose-500/10"
                  : "border-white/15 bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-white">
                  {q3.question}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                    q3.totalAutomationFailures > 0
                      ? "bg-rose-500/25 text-rose-200"
                      : "bg-emerald-500/20 text-emerald-200"
                  }`}
                >
                  {q3.statusBadge} ({q3.totalAutomationFailures} failure
                  {q3.totalAutomationFailures === 1 ? "" : "s"})
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-200">
                <li>
                  • <strong>GoSno → Rezdy Provisioning:</strong>{" "}
                  <code>{q3.gosnoProvisioningExceptions}</code> exception(s),{" "}
                  <code>{q3.rezdyFailedCount}</code> failed,{" "}
                  <code>{q3.rezdyUnknownResultCount}</code> unknown result,{" "}
                  <code>{q3.rezdyStaleClaimedCount}</code> stale claims (cron schedules:{" "}
                  <code>
                    {q3.rezdyCronSchedulesEnabled === null
                      ? triageQueue.gosnoOps.status
                      : q3.rezdyCronSchedulesEnabled
                        ? "enabled"
                        : "disabled"}
                  </code>
                  )
                </li>
                <li>
                  • <strong>Party at Red Rocks Sync:</strong>{" "}
                  <code>{q3.parrProvisioningExceptions}</code> exception(s) (
                  <code>{triageQueue.parrOps.status}</code>)
                </li>
                <li>
                  • <strong>Customer Notification Alerts:</strong>{" "}
                  <code>{q3.genuineFailedNotificationsCount}</code> genuine failed delivery alert(s) (all web submissions still saved durably in Postgres)
                </li>
              </ul>
            </article>

            {/* Q4: Which inquiries need a reply? */}
            <article
              data-testid="daily-q4-inquiries"
              className={`rounded-2xl border p-5 space-y-3 ${
                q4.untriagedGenuineCount > 0
                  ? "border-amber-400/45 bg-amber-500/10"
                  : "border-white/15 bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-white">
                  {q4.question}
                </h2>
                <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-200">
                  {q4.untriagedGenuineCount} untriaged
                </span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-200">
                <strong>{q4.untriagedGenuineCount}</strong> untriaged genuine customer inquiry item(s) ({q4.actionableGenuineCount} open actionable across specialist desks &amp; Cruise Promenade group concierge).
              </p>
              <p className="text-[11px] text-zinc-400">
                {q4.closedJfdPolicyNote}
              </p>
              <div>
                <Link
                  href={q4.inboxHref}
                  className="inline-flex items-center rounded-lg border border-amber-400/40 bg-amber-500/15 px-3.5 py-1.5 text-xs font-bold text-[#f5c66c] hover:bg-amber-500/25"
                >
                  Open Genuine Operator Inbox →
                </Link>
              </div>
            </article>
          </div>

          {/* Q5: Which links are producing sales? (Full-width conversion & WNO 100-click tracker) */}
          <article
            data-testid="daily-q5-links"
            className="rounded-2xl border border-cyan-400/30 bg-white/[0.03] p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">{q5.question}</h2>
                <p className="mt-0.5 text-xs text-zinc-300">
                  Qualified human clicks (bots &amp; QA excluded) → checkout provider → exact product selected → confirmed booking → commission → payout received.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                <span className="rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 text-zinc-200">
                  Human Clicks: <strong>{q5.qualifiedHumanProductClicks28d}</strong>
                </span>
                <span className="rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 text-emerald-200">
                  Confirmed Sales: <strong>{q5.confirmedBookingsFromLinks28d}</strong>
                </span>
                <span className="rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 text-cyan-200">
                  Commission: <strong>${q5.commissionAmountUsd28d.toLocaleString()}</strong>
                </span>
                <span className="rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 text-amber-200">
                  Payout Received: <strong>${q5.payoutReceivedUsd28d.toLocaleString()}</strong>
                </span>
              </div>
            </div>

            {/* WNO 100-Legitimate-Click Conversion Diagnostic Banner */}
            <div
              data-testid="wno-100-click-diagnostic"
              className={`rounded-xl border p-3.5 text-xs ${
                q5.wnoDiagnostic.status === "offer_page_price_or_audience_problem"
                  ? "border-rose-400/45 bg-rose-500/15 text-rose-100"
                  : q5.wnoDiagnostic.status === "converting"
                    ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-100"
                    : "border-cyan-400/30 bg-black/40 text-zinc-200"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white">
                  WNO Post-Generic-Fix Conversion Gauge (`welcometoneworleanstours.com` &amp; `/new-orleans`)
                </span>
                <span className="font-mono text-[11px] text-cyan-200">
                  {q5.wnoDiagnostic.qualifiedHumanProductClicks} /{" "}
                  {q5.wnoDiagnostic.diagnosticClickThreshold} qualified clicks ·{" "}
                  {q5.wnoDiagnostic.confirmedBookings} sales · $
                  {q5.wnoDiagnostic.commissionAmountUsd} comm · $
                  {q5.wnoDiagnostic.payoutReceivedUsd} paid
                </span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-300">
                {q5.wnoDiagnostic.summaryLabel}. Rule: if 100 legitimate exact-product clicks produce 0 bookings, diagnose offer, page, price, or audience — not tracking.
              </p>
            </div>

            {q5.topProductLinks.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-black/50 text-zinc-300">
                    <tr>
                      <th className="px-3.5 py-2 font-semibold">Originating Site / Page</th>
                      <th className="px-3.5 py-2 font-semibold">Provider</th>
                      <th className="px-3.5 py-2 font-semibold">Product Selected</th>
                      <th className="px-3.5 py-2 font-semibold">Qualified Clicks</th>
                      <th className="px-3.5 py-2 font-semibold">Confirmed Bookings</th>
                      <th className="px-3.5 py-2 font-semibold">Commission</th>
                      <th className="px-3.5 py-2 font-semibold">Payout Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q5.topProductLinks.map((row) => (
                      <tr key={row.rowKey} className="border-b border-white/10">
                        <td className="px-3.5 py-2">
                          <div className="font-bold text-white">{row.originatingSite}</div>
                          <div className="font-mono text-[11px] text-zinc-400">
                            {row.originatingPage}
                          </div>
                        </td>
                        <td className="px-3.5 py-2 font-mono uppercase text-cyan-200">
                          {row.provider}
                        </td>
                        <td className="px-3.5 py-2 font-mono text-zinc-100">
                          {row.productSelected}
                        </td>
                        <td className="px-3.5 py-2 font-mono font-bold text-white">
                          {row.qualifiedHumanClicks}
                        </td>
                        <td className="px-3.5 py-2 font-mono font-bold text-emerald-300">
                          {row.confirmedBookings}
                        </td>
                        <td className="px-3.5 py-2 font-mono text-zinc-200">
                          ${row.commissionAmountUsd.toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2 font-mono text-amber-200">
                          ${row.payoutReceivedUsd.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-xs text-zinc-300">
                0 qualified human product clicks recorded in the local durable window yet (Clicks / Handoffs Only — Not Bookings or Revenue). Reconcile provider CSV/JSON statements below when payouts post.
              </p>
            )}
          </article>

          {/* Q6: Which operator or organizer needs follow-up? */}
          <article
            data-testid="daily-q6-followups"
            className="rounded-2xl border border-emerald-400/30 bg-white/[0.03] p-5 space-y-4"
          >
            <h2 className="text-lg font-black text-white">{q6.question}</h2>

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Milestone 1: Cruise Promenade 3 Organizers / 50 Passengers */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    Cruise Promenade Launch Cohort
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    {q6.cruisePromenadeLaunch.organizersCount}/
                    {q6.cruisePromenadeLaunch.organizersTarget} organizers ·{" "}
                    {q6.cruisePromenadeLaunch.passengersCount}/
                    {q6.cruisePromenadeLaunch.passengersTarget} pax
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  Needs assistance:{" "}
                  <code>{q6.cruisePromenadeLaunch.needsAssistanceGuestsCount}</code> · Split alerts:{" "}
                  <code>{q6.cruisePromenadeLaunch.plannersWithSplitsCount}</code>
                </p>
                <p className="text-[11px] text-zinc-400">
                  Cohort epoch: <code>{q6.cruisePromenadeLaunch.launchCohortEpochIso}</code> ({q6.cruisePromenadeLaunch.preLaunchHistoricalBoardsExcludedCount} pre-launch system boards / {q6.cruisePromenadeLaunch.preLaunchHistoricalGuestsExcludedCount} pax frozen &amp; never counted as adoption).
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <a
                    href={q6.cruisePromenadeLaunch.groupsLaunchpadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 font-bold text-cyan-100 hover:bg-cyan-500/25"
                  >
                    /groups Launchpad ↗
                  </a>
                  <a
                    href="https://cruisepromenade.com/internal/dashboard/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-semibold text-zinc-200 hover:bg-white/10"
                  >
                    CP Internal Board ↗
                  </a>
                </div>
              </div>

              {/* Milestone 2: Serene's Isolated Rezgo Connection */}
              <div className="rounded-xl border border-amber-400/30 bg-black/40 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Serene · Rezgo (Isolated)
                  </span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-200">
                    {q6.sereneRezgoConnection.liveBookingAllowed
                      ? "LIVE (ISOLATED)"
                      : "LIVE BOOKING LOCKED"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white">
                  {q6.sereneRezgoConnection.operatorName} (Prefix{" "}
                  <code>{q6.sereneRezgoConnection.knownViatorSupplierPrefix}</code>:{" "}
                  {q6.sereneRezgoConnection.candidateSkusToReconcile.join(", ")})
                </p>
                <p className="text-[11px] leading-relaxed text-zinc-300">
                  {q6.sereneRezgoConnection.nextActionLabel}
                </p>
                <div className="font-mono text-[10px] text-zinc-400">
                  Gates: Env[{q6.sereneRezgoConnection.gates.credentialsStoredSecurelyInEnv ? "✓" : "·"}]{" "}
                  ReadOnly[{q6.sereneRezgoConnection.gates.readOnlyInventoryInspected ? "✓" : "·"}]{" "}
                  Mapped[{q6.sereneRezgoConnection.gates.dccProductMappingVerified ? "✓" : "·"}]{" "}
                  Written10%[{q6.sereneRezgoConnection.gates.writtenCommissionOwnershipConfirmed ? "✓" : "·"}]{" "}
                  TestFlow[{q6.sereneRezgoConnection.gates.nonCustomerTestBookingVerified ? "✓" : "·"}]
                </div>
                <div className="pt-1 text-xs">
                  <a
                    href="/api/admin/control-center?action=inspect_serene_rezgo&amp;rezgoDates=2027-05-15,2027-07-15"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 font-bold text-amber-100 hover:bg-amber-500/25"
                  >
                    Run Read-Only Rezgo Inspection ↗
                  </a>
                </div>
              </div>

              {/* Milestone 3: 3 Direct Operators (Juneau, New Orleans, Colorado) */}
              <div className="rounded-xl border border-emerald-400/30 bg-black/40 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    3 Direct Operators (10% API)
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    {q6.directOperators3Markets.marketsWithActiveApiBookableCount}/
                    {q6.directOperators3Markets.marketsTarget} active API ·{" "}
                    {q6.directOperators3Markets.pendingReviewApplicationsCount} in review
                  </span>
                </div>
                <ul className="space-y-1 text-[11px] text-zinc-200">
                  {q6.directOperators3Markets.markets.map((m) => (
                    <li key={m.marketId}>
                      <strong>{m.marketLabel}:</strong> {m.statusSummary}
                    </li>
                  ))}
                </ul>
                <div className="pt-1 text-xs">
                  <Link
                    href={q6.directOperators3Markets.onboardingPortalHref}
                    className="inline-flex items-center rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 font-bold text-emerald-100 hover:bg-emerald-500/25"
                  >
                    10% Direct Operator Portal →
                  </Link>
                </div>
              </div>
            </div>

            {/* Cruise Promenade 8-Stage Conversion Funnel & Uninvited Board Starts Watchpoint */}
            <div
              data-testid="cp-8stage-conversion-funnel"
              className="rounded-xl border border-cyan-400/25 bg-black/40 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    Cruise Promenade 8-Stage Conversion Funnel ({q6.cruisePromenadeLaunch.conversionFunnel28d.windowLabel})
                  </span>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    Post-<code>{q6.cruisePromenadeLaunch.conversionFunnel28d.launchEpochIso}</code> Launch Cohort only ({q6.cruisePromenadeLaunch.conversionFunnel28d.preLaunchHistoricalEventsExcluded} pre-launch historical events frozen · {q6.cruisePromenadeLaunch.conversionFunnel28d.excludedSyntheticEvents28d} QA/test events excluded).
                  </p>
                </div>
                <span
                  data-testid="cp-uninvited-starts-badge"
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                    q6.cruisePromenadeLaunch.conversionFunnel28d.startedWithoutInvitingCount > 0
                      ? "border-amber-400/45 bg-amber-500/15 text-amber-200"
                      : "border-white/15 bg-white/5 text-zinc-300"
                  }`}
                >
                  Started w/o inviting:{" "}
                  {q6.cruisePromenadeLaunch.conversionFunnel28d.startedWithoutInvitingCount}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                {q6.cruisePromenadeLaunch.conversionFunnel28d.stages.map((st) => (
                  <div
                    key={st.eventName}
                    data-testid={`cp-funnel-stage-${st.eventName}`}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 flex flex-col justify-between"
                  >
                    <div className="text-[10px] font-semibold leading-tight text-zinc-300">
                      {st.label}
                    </div>
                    <div className="mt-1.5">
                      <div className="font-mono text-base font-black text-white">
                        {st.uniqueSessionsCount}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-400">
                        {st.eventCount} evt
                        {st.conversionFromPriorPct !== null
                          ? ` · ${st.conversionFromPriorPct}%`
                          : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {q6.cruisePromenadeLaunch.conversionFunnel28d.recentUninvitedStarts.length > 0 ? (
                <div
                  data-testid="cp-uninvited-starts-list"
                  className="rounded-lg border border-amber-400/25 bg-amber-500/[0.07] px-3 py-2 text-[11px] text-amber-100"
                >
                  <strong>Interview Follow-Up Queue (Started board, 0 invites copied/shared):</strong>{" "}
                  {q6.cruisePromenadeLaunch.conversionFunnel28d.recentUninvitedStarts
                    .map(
                      (u) =>
                        `${u.shareCode || "draft"} (${u.ship || "ship-tbd"} ${u.sailDate || ""})`.trim(),
                    )
                    .join(" · ")}
                </div>
              ) : null}

              <div
                data-testid="cp-outreach-source-attribution"
                className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-zinc-300"
              >
                <strong className="text-cyan-200">Outreach Source Attribution:</strong>{" "}
                {q6.cruisePromenadeLaunch.conversionFunnel28d.outreachSourceBreakdown.length > 0
                  ? q6.cruisePromenadeLaunch.conversionFunnel28d.outreachSourceBreakdown
                      .map(
                        (src) =>
                          `${src.sourceLabel}: ${src.sessionsCount} sess (${src.sailingViewsCount} views · ${src.boardsCreatedCount} boards · ${src.inquiriesSubmittedCount} inq)`,
                      )
                      .join(" · ")
                  : "0 post-launch visits yet — awaiting first tagged outreach click (?utm_source=...)"}
              </div>
            </div>
          </article>
        </section>

        {/* COLLAPSIBLE DRAWER 1: Outreach Kits & Commission Reconciliation Tools */}
        <details className="group rounded-2xl border border-white/15 bg-white/[0.02]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-black text-white hover:bg-white/[0.04]">
            <span>
              Operator Outreach Kits (Juneau · New Orleans · Colorado) &amp; Provider CSV/JSON Commission Reconciler
            </span>
            <span className="font-mono text-xs text-emerald-300 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="space-y-6 border-t border-white/10 p-6">
            <DirectOperatorPitchPanel />
            <CommissionReconcilePanel
              fareharborAuthReady={fareharborAuthReady}
              cruisePromenadeSyncReady={cruisePromenadeSyncReady}
            />
          </div>
        </details>

        {/* COLLAPSIBLE DRAWER 2: Automated / Reference Ledgers, 10-Way Accounting, Fleet Rollback & Protected Boundaries */}
        <details className="group rounded-2xl border border-white/15 bg-white/[0.02]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-black text-zinc-200 hover:bg-white/[0.04]">
            <span>
              Reference Ledgers, 10-Way Strict Separation, 11-Project Rollback Matrix, Held SKUs &amp; WTA Boundary ({triageQueue.heldSkusCount} Held SKUs)
            </span>
            <span className="font-mono text-xs text-cyan-300 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>

          <div className="space-y-10 border-t border-white/10 p-6">
            {/* Exception Triage Detail Cards */}
            <section aria-labelledby="needs-erich-heading" className="space-y-4">
              <h2 id="needs-erich-heading" className="text-xl font-black">
                System Triage Detail ({triageQueue.totalAttentionCount} live exception
                {triageQueue.totalAttentionCount === 1 ? "" : "s"})
              </h2>
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
                  </div>
                ))}
              </div>
            </section>

            {/* 8-Stage Connected Network Funnel & Strict 10-Way Separation */}
            <section aria-labelledby="funnel-28d-heading" className="space-y-4">
              <h2 id="funnel-28d-heading" className="text-xl font-black">
                8-Stage Network Funnel &amp; 28-Day Strict 10-Way Accounting Separation
              </h2>

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

              <div
                data-testid="strict-10-way-separation-ledger"
                className="rounded-2xl border border-cyan-400/30 bg-white/[0.03] p-5 space-y-4"
              >
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-black/50 text-zinc-300">
                      <tr>
                        <th className="px-3.5 py-2.5 font-semibold">Separated Metric</th>
                        <th className="px-3.5 py-2.5 font-semibold">28d Value</th>
                        <th className="px-3.5 py-2.5 font-semibold">GoSno (MoR)</th>
                        <th className="px-3.5 py-2.5 font-semibold">PARR (MoR)</th>
                        <th className="px-3.5 py-2.5 font-semibold">Network / Affiliate</th>
                        <th className="px-3.5 py-2.5 font-semibold">Strict Accounting Rule</th>
                      </tr>
                    </thead>
                    <tbody>
                      {connectedFunnel28d.strictSeparation10Way28d.map((row) => (
                        <tr
                          key={row.key}
                          data-testid={`strict-row-${row.key}`}
                          className="border-b border-white/10 align-top"
                        >
                          <td className="px-3.5 py-2.5 font-bold text-white whitespace-nowrap">
                            {row.label}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono font-bold text-cyan-200 whitespace-nowrap">
                            {row.headlineValue}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-zinc-200">
                            {row.gosnoBreakdown}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-zinc-200">
                            {row.parrBreakdown}
                          </td>
                          <td className="px-3.5 py-2.5 text-zinc-200">
                            {row.networkOrAffiliateBreakdown}
                          </td>
                          <td className="px-3.5 py-2.5 text-zinc-300">
                            {row.antiConflationDisclosure}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 pt-1 md:grid-cols-2 text-xs">
                  <div
                    data-testid="cp-separation-card"
                    className="rounded-xl border border-white/10 bg-black/35 p-3.5 space-y-1"
                  >
                    <div className="font-bold text-emerald-200">
                      Cruise Promenade Launch Cohort vs. Frozen System History ({triageQueue.cruisePromenade.status})
                    </div>
                    <div className="text-zinc-200">
                      Launch Cohort Boards (post-<code>{triageQueue.cruisePromenade.launchCohortEpochIso ?? "2026-11-12T12:35:00.000Z"}</code>):{" "}
                      <code>{triageQueue.cruisePromenade.launchCohortBoardsCount ?? 0}</code> (
                      <code>{triageQueue.cruisePromenade.launchCohortGuestsCount ?? 0}</code> pax) · Frozen Pre-Launch System Boards:{" "}
                      <code>{triageQueue.cruisePromenade.preLaunchHistoricalBoardsCount}</code> · Test Boards Excluded:{" "}
                      <code>{triageQueue.cruisePromenade.testSharedPlannersCount}</code>
                    </div>
                  </div>

                  <div
                    data-testid="gosno-rezdy-health-card"
                    className="rounded-xl border border-white/10 bg-black/35 p-3.5 space-y-1"
                  >
                    <div className="font-bold text-cyan-200">
                      GoSno Rezdy Provisioning &amp; Cron Health
                    </div>
                    <div className="text-zinc-200 font-mono text-[11px] break-words">
                      {triageQueue.gosnoOps.rezdyHealth
                        ? JSON.stringify(triageQueue.gosnoOps.rezdyHealth)
                        : `No Rezdy health payload reported (${triageQueue.gosnoOps.status})`}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Fleet Matrix & Protected Partner Card */}
            <section aria-labelledby="fleet-matrix-heading" className="space-y-5">
              <h2 id="fleet-matrix-heading" className="text-xl font-black">
                Owned Production Fleet ({fleetHealthAndRollback.ownedActiveProductionProjectsCount}) &amp; Protected Partner Boundary
              </h2>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-black/40 text-zinc-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Owned Property</th>
                      <th className="px-4 py-3 font-semibold">Domain</th>
                      <th className="px-4 py-3 font-semibold">Ownership / Route</th>
                      <th className="px-4 py-3 font-semibold">Deploy &amp; Rollback Playbook</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleetHealthAndRollback.ownedProductionProjects.map((proj) => (
                      <tr key={proj.projectId} className="border-b border-white/10">
                        <td className="px-4 py-3 font-mono text-zinc-400">{proj.projectNumber}</td>
                        <td className="px-4 py-3 font-bold text-white">{proj.name}</td>
                        <td className="px-4 py-3 font-mono text-cyan-200">{proj.canonicalDomain}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-emerald-200">
                          {proj.ownershipModel} / {proj.primaryRouteModel}
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

              {fleetHealthAndRollback.protectedPartnerProperties.map((partner) => (
                <div
                  key={partner.partnerId}
                  data-testid="protected-partner-property-card"
                  className="rounded-2xl border-2 border-amber-400/50 bg-amber-950/25 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-amber-300/50 bg-amber-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">
                      Protected Partner Property · Independent Ownership ({partner.ownership})
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-200">
                      Checkout: {partner.checkoutStatus} · Consumer Linking Forbidden
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-black text-white">
                    {partner.propertyName} ({partner.shortCode}) — <code>{partner.canonicalDomain}</code>
                  </h3>
                  <p className="mt-1 font-mono text-xs text-amber-100">
                    {partner.guardrailSummary}
                  </p>
                </div>
              ))}
            </section>

            {/* Held SKUs & Frozen Affiliate IDs */}
            <section aria-labelledby="money-ledger-heading" className="space-y-4">
              <h2 id="money-ledger-heading" className="text-xl font-black">
                Held Commercial SKUs &amp; 8 Frozen Affiliate IDs
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {commercialLedger.heldCommercialSkus.map((sku) => (
                  <div
                    key={sku.skuSlug}
                    className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-rose-200">
                        HELD SKU · {sku.surfaceCode} ({sku.canonicalDomain})
                      </span>
                      <code className="text-[11px] text-zinc-200">{sku.skuSlug}</code>
                    </div>
                    <h3 className="mt-1.5 text-sm font-bold text-white">{sku.title}</h3>
                    <p className="mt-1 text-xs text-rose-100/90">{sku.holdReason}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </details>
      </div>
    </main>
  );
}
