"use client";

import { useState } from "react";

type ViatorAvailabilityCheckCardProps = {
  productCode: string | null;
  currency?: string | null;
};

type AvailabilityState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; summary: string; raw: unknown };

function buildSummary(payload: unknown): string {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const bookableItems = Array.isArray(record?.bookableItems)
    ? record?.bookableItems
    : Array.isArray(record?.items)
      ? record?.items
      : [];
  const total = bookableItems.length;

  const firstPrice =
    typeof record?.totalPrice === "number"
      ? record.totalPrice
      : typeof record?.price === "number"
        ? record.price
        : typeof record?.fromPrice === "number"
          ? record.fromPrice
          : null;

  if (total > 0 && typeof firstPrice === "number") {
    return `${total} bookable option${total === 1 ? "" : "s"} found. Live price starts at ${firstPrice}.`;
  }

  if (total > 0) {
    return `${total} bookable option${total === 1 ? "" : "s"} found.`;
  }

  return "Availability check completed. Review the raw response for exact bookable items and pricing.";
}

export default function ViatorAvailabilityCheckCard({
  productCode,
  currency = "USD",
}: ViatorAvailabilityCheckCardProps) {
  const [travelDate, setTravelDate] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [state, setState] = useState<AvailabilityState>({ status: "idle" });

  if (!productCode) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/internal/viator/availability-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode,
          travelDate,
          adults,
          children,
          currency,
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        payload?: unknown;
      };

      if (!response.ok || !json.ok) {
        setState({ status: "error", message: json.error || "Availability check failed." });
        return;
      }

      setState({
        status: "success",
        summary: buildSummary(json.payload),
        raw: json.payload,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Availability check failed.",
      });
    }
  }

  return (
    <section className="mb-16 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h3 className="text-cyan-400">Check live availability</h3>
      <p className="mt-2 text-sm text-zinc-300">
        This uses Viator&apos;s real-time availability check with a selected travel date and passenger mix.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-4 md:items-end">
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Travel date</span>
          <input
            type="date"
            value={travelDate}
            onChange={(event) => setTravelDate(event.target.value)}
            className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Adults</span>
          <input
            type="number"
            min="1"
            step="1"
            value={adults}
            onChange={(event) => setAdults(event.target.value)}
            className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Children</span>
          <input
            type="number"
            min="0"
            step="1"
            value={children}
            onChange={(event) => setChildren(event.target.value)}
            className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === "loading" ? "Checking..." : "Run availability check"}
        </button>
      </form>

      <div className="mt-4 text-sm text-zinc-400">Currency: {currency || "USD"}</div>

      {state.status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {state.message}
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p>{state.summary}</p>
          <details className="mt-3">
            <summary className="cursor-pointer text-emerald-200">Show raw response</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-emerald-100/90">
              {JSON.stringify(state.raw, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </section>
  );
}
