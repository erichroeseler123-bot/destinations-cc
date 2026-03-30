"use client";

import { FormEvent, useState } from "react";

type Props = {
  source?: string;
  compact?: boolean;
};

export default function ArgoLaunchAlertForm({ source = "argo-page", compact = false }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preferredMonth, setPreferredMonth] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDone(false);

    try {
      const resp = await fetch("/api/argo/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, source, preferredMonth, partySize }),
      });
      const data = (await resp.json()) as { ok: boolean; error?: string };
      if (!resp.ok || !data.ok) {
        setError(data.error || "Could not join the launch alert list.");
        return;
      }

      setDone(true);
      setName("");
      setEmail("");
      setPreferredMonth("");
      setPartySize(2);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-2" : "space-y-3"}>
      {!compact ? (
        <p className="text-sm text-zinc-300">
          Get an email when transport options for the Mighty Argo Cable Car officially open.
        </p>
      ) : null}

      <div className={compact ? "grid gap-2" : "grid gap-3 sm:grid-cols-2"}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="min-h-11 rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email for launch alerts"
          className="min-h-11 rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
        />
      </div>

      <div className={compact ? "grid gap-2" : "grid gap-3 sm:grid-cols-2"}>
        <select
          value={preferredMonth}
          onChange={(e) => setPreferredMonth(e.target.value)}
          className="min-h-11 rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="">Preferred month (optional)</option>
          <option>April 2026</option>
          <option>May 2026</option>
          <option>June 2026</option>
          <option>July 2026</option>
          <option>August 2026</option>
          <option>September 2026</option>
          <option>October 2026</option>
        </select>
        <input
          type="number"
          min={1}
          max={20}
          value={partySize}
          onChange={(e) => setPartySize(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          placeholder="Party size"
          className="min-h-11 rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="min-h-11 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        {busy ? "Saving..." : "Notify Me When Options Open"}
      </button>

      {done ? (
        <p className="text-sm text-emerald-300">You are on the list. We will email you at launch.</p>
      ) : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}
