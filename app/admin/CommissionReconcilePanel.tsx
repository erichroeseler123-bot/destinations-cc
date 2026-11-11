"use client";

import { useState } from "react";

const SAMPLE_CSV = [
  "booking_ref,provider,handoff_id,product_code,gross_usd,commission_usd,status,booked_date,party_size,share_code,traveler_id",
  "VIA-2027-991042,viator,hof_sample_jfd_01,6251SHOREXICEWALK,918.00,73.44,confirmed,2027-06-14,2,,ctx_jfd_01",
  "GYG-2027-558210,getyourguide,,t598272,896.00,71.68,settled,2027-07-08,4,CPPLAN27,",
].join("\n");

export interface CommissionReconcilePanelProps {
  fareharborWebhookEndpointUrl?: string;
  fareharborAuthReady?: boolean;
  cruisePromenadeSyncReady?: boolean;
}

interface ReconcileSummaryResponse {
  ok: boolean;
  error?: string;
  totalRows?: number;
  importedCount?: number;
  duplicateCount?: number;
  matchedHandoffCount?: number;
  unmatchedCount?: number;
  rejectedCount?: number;
  importedGrossUsd?: number;
  importedCommissionUsd?: number;
  cpSyncTriggeredCount?: number;
}

export default function CommissionReconcilePanel({
  fareharborWebhookEndpointUrl = "https://www.destinationcommandcenter.com/api/v1/commerce/webhooks/fareharbor",
  fareharborAuthReady = false,
  cruisePromenadeSyncReady = false,
}: CommissionReconcilePanelProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [defaultProvider, setDefaultProvider] = useState<
    "viator" | "getyourguide" | "fareharbor" | "direct"
  >("viator");
  const [payloadText, setPayloadText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ReconcileSummaryResponse | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const handleLoadSample = () => {
    setFormat("csv");
    setPayloadText(SAMPLE_CSV);
    setResult(null);
  };

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(fareharborWebhookEndpointUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleReconcile = async () => {
    if (!payloadText.trim()) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/commerce/reconcile-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          defaultProvider,
          payload: payloadText,
        }),
      });
      const data = (await res.json()) as ReconcileSummaryResponse;
      setResult(data);
    } catch (err) {
      setResult({
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to submit reconciliation payload.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      data-testid="commission-reconcile-panel"
      aria-labelledby="commission-reconcile-heading"
      className="space-y-4 rounded-2xl border border-cyan-400/30 bg-white/[0.03] p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            5 · 1-Click Commission CSV / JSON Reconcile Importer &amp; Webhook Readiness
          </div>
          <h2
            id="commission-reconcile-heading"
            className="mt-1 text-2xl font-black text-white"
          >
            Reconcile Partner Payout Exports (Viator · GetYourGuide · FareHarbor · Direct)
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-300">
            Paste partner CSV or JSON settlement exports to record authenticated commercial outcomes durably via{" "}
            <code>recordCommercialOutcome</code>. Deterministic{" "}
            <code>reconcile:&#123;provider&#125;:&#123;booking_ref&#125;</code> idempotency prevents double-counting on repeat imports, and rows carrying a{" "}
            <code>share_code</code> automatically trigger non-blocking Cruise Promenade planner sync.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/25"
        >
          Load Sample CSV Template
        </button>
      </div>

      {/* Webhook Endpoint & Auth Readiness Strip */}
      <div className="grid gap-3 rounded-xl border border-white/10 bg-black/40 p-4 text-xs md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-zinc-200">
              FareHarbor Booking Webhook Receiver
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                fareharborAuthReady
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-amber-500/20 text-amber-200"
              }`}
            >
              {fareharborAuthReady
                ? "Auth Ready (Token / FH Keys Set)"
                : "Pending Token / FH Keys"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className="block flex-1 truncate rounded bg-white/5 px-2.5 py-1.5 font-mono text-[11px] text-cyan-200">
              {fareharborWebhookEndpointUrl}
            </code>
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 font-semibold text-zinc-200 hover:bg-white/10"
            >
              {copiedWebhook ? "Copied" : "Copy URL"}
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-zinc-200">
              Cruise Promenade Post-Booking Sync
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                cruisePromenadeSyncReady
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-zinc-500/25 text-zinc-300"
              }`}
            >
              {cruisePromenadeSyncReady
                ? "DCC_CP_SERVICE_SECRET Configured"
                : "Optional (Set DCC_CP_SERVICE_SECRET)"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Supported headers: <code>booking_ref</code>/<code>order_id</code>,{" "}
            <code>handoff_id</code>/<code>sub_id</code>, <code>gross_usd</code>/<code>amount</code>,{" "}
            <code>commission_usd</code>/<code>payout</code>, <code>provider</code>,{" "}
            <code>product_code</code>, <code>status</code>, <code>share_code</code>.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-2 font-semibold text-zinc-300">
          <span>Format:</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "csv" | "json")}
            className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-1.5 text-white"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON Array</option>
          </select>
        </label>

        <label className="flex items-center gap-2 font-semibold text-zinc-300">
          <span>Default Provider:</span>
          <select
            value={defaultProvider}
            onChange={(e) =>
              setDefaultProvider(
                e.target.value as
                  | "viator"
                  | "getyourguide"
                  | "fareharbor"
                  | "direct",
              )
            }
            className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-1.5 text-white"
          >
            <option value="viator">Viator</option>
            <option value="getyourguide">GetYourGuide</option>
            <option value="fareharbor">FareHarbor</option>
            <option value="direct">Direct Operator (10%)</option>
          </select>
        </label>
      </div>

      <textarea
        value={payloadText}
        onChange={(e) => setPayloadText(e.target.value)}
        rows={5}
        placeholder="Paste partner commission CSV or JSON array here..."
        className="w-full rounded-xl border border-white/15 bg-black/50 p-3.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-500"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={submitting || !payloadText.trim()}
          onClick={handleReconcile}
          className="rounded-xl border border-emerald-400/50 bg-emerald-500/20 px-4 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50"
        >
          {submitting ? "Reconciling..." : "Reconcile Outcomes"}
        </button>
        {payloadText ? (
          <button
            type="button"
            onClick={() => {
              setPayloadText("");
              setResult(null);
            }}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10"
          >
            Clear
          </button>
        ) : null}
      </div>

      {result ? (
        <div
          role="status"
          className={`rounded-xl border p-4 text-xs ${
            result.ok
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
              : "border-rose-400/40 bg-rose-500/10 text-rose-100"
          }`}
        >
          {result.ok ? (
            <div className="space-y-1">
              <div className="font-black">
                Reconciliation Complete · {result.importedCount} new outcome
                {result.importedCount === 1 ? "" : "s"} recorded ·{" "}
                {result.duplicateCount} duplicate
                {result.duplicateCount === 1 ? "" : "s"} skipped idempotently
              </div>
              <div className="font-mono text-[11px] text-emerald-200/90">
                Gross: ${(result.importedGrossUsd ?? 0).toFixed(2)} · Confirmed
                Commission: ${(result.importedCommissionUsd ?? 0).toFixed(2)} ·
                Matched Handoffs: {result.matchedHandoffCount ?? 0} · Unmatched
                Preserved: {result.unmatchedCount ?? 0} · Rejected:{" "}
                {result.rejectedCount ?? 0} · CP Planner Syncs:{" "}
                {result.cpSyncTriggeredCount ?? 0}
              </div>
            </div>
          ) : (
            <div className="font-bold">
              Import Error: {result.error || "Unable to reconcile payload."}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
