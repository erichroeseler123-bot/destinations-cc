"use client";

import { useEffect, useState } from "react";

type ArgoStatus = {
  ok?: boolean;
  source?: string;
  departures?: string[];
  risk?: string;
  note?: string;
};

export default function ArgoStatusPanel() {
  const [status, setStatus] = useState<ArgoStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/argo/status", { cache: "no-store" });
        if (!response.ok) throw new Error("status fetch failed");
        const data = (await response.json()) as ArgoStatus;
        if (active) setStatus(data);
      } catch {
        if (active) {
          setStatus({
            ok: false,
            source: "fallback",
            risk: "Unknown",
            note: "Live status temporarily unavailable. Use a wider travel buffer.",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStatus();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-white">Current Conditions Snapshot</h3>
        <span className="text-xs text-zinc-400">
          {loading ? "Loading" : status?.source === "stub" ? "Stub" : "Live"}
        </span>
      </div>

      <p className="mt-2 text-sm text-zinc-300">
        {loading ? "Checking departures and risk level..." : status?.note || "No additional note."}
      </p>

      <div className="mt-3 text-sm text-zinc-200">
        <span className="text-zinc-400">Risk: </span>
        <span>{status?.risk || "Unknown"}</span>
      </div>

      {!!status?.departures?.length && (
        <div className="mt-3">
          <div className="text-xs uppercase tracking-widest text-zinc-400">Departures</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {status.departures.map((time) => (
              <span
                key={time}
                className="rounded-full border border-white/10 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200"
              >
                {time}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
