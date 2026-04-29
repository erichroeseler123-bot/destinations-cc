"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { launchMissionAction } from "@/app/dashboard/actions";
import type { LaunchMissionInput, MissionEntity } from "@/lib/dcc/earthos/workflows/types";

const PRESETS: Record<MissionEntity, { region: string; missionType: string; objective: string }> = {
  gosno: {
    region: "Colorado Front Range",
    missionType: "transport-health",
    objective: "Scan snow, road, and demand signals for same-day mountain dispatch.",
  },
  alaska: {
    region: "Southeast Alaska",
    missionType: "port-dispatch",
    objective: "Assess port compression, flight delays, and shuttle reallocation risk.",
  },
  redrocks: {
    region: "Denver Metro",
    missionType: "show-ops",
    objective: "Check ticket velocity, shuttle load, and venue timing risk before doors.",
  },
  earthos: {
    region: "Global Ports",
    missionType: "global-synthesis",
    objective: "Synthesize active operating regions into a single cross-network brief.",
  },
};

type PanelState =
  | { tone: "idle"; message: string }
  | { tone: "error"; message: string };

export function LaunchMissionPanel() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<LaunchMissionInput>({
    entity: "gosno",
    ...PRESETS.gosno,
  });
  const [panelState, setPanelState] = useState<PanelState>({
    tone: "idle",
    message: "Launch a new mission directly from Mission Control.",
  });

  function applyPreset(entity: MissionEntity) {
    setForm({
      entity,
      ...PRESETS[entity],
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPanelState({
      tone: "idle",
      message: "Launching mission...",
    });

    try {
      const result = await launchMissionAction(form);

      if (!result.ok) {
        throw new Error(result.error);
      }

      startTransition(() => {
        router.push(`/dashboard/missions/${result.data.id}`);
        router.refresh();
      });
    } catch (error) {
      setPanelState({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to launch mission.",
      });
    }
  }

  return (
    <section className="rounded-[1.7rem] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(21,35,39,0.94),rgba(10,12,16,0.98))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">Launch Mission</div>
          <h2 className="mt-2 text-2xl font-black text-white">Start a new EarthOS run</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-300">
            Use entity presets for GoSno, Alaska, Red Rocks, or EarthOS, then push the run straight into the live adapter.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESETS) as MissionEntity[]).map((entity) => (
            <button
              key={entity}
              type="button"
              onClick={() => applyPreset(entity)}
              className={`inline-flex rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition ${
                form.entity === entity
                  ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              {entity}
            </button>
          ))}
        </div>
      </div>

      <form className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
        <label className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Entity</span>
          <select
            value={form.entity}
            onChange={(event) => applyPreset(event.target.value as MissionEntity)}
            className="min-h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-cyan-300/40"
          >
            <option value="gosno">GoSno</option>
            <option value="alaska">Alaska</option>
            <option value="redrocks">Red Rocks</option>
            <option value="earthos">EarthOS</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Region</span>
          <input
            value={form.region}
            onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
            className="min-h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-cyan-300/40"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Mission Type</span>
          <input
            value={form.missionType}
            onChange={(event) => setForm((current) => ({ ...current, missionType: event.target.value }))}
            className="min-h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-cyan-300/40"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Objective</span>
          <textarea
            rows={3}
            value={form.objective}
            onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
          />
        </label>

        <div className="lg:col-span-2">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              panelState.tone === "error"
                ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
                : "border-white/10 bg-black/20 text-zinc-300"
            }`}
          >
            {panelState.message}
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center rounded-full bg-[#21c6da] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#041216] transition hover:bg-[#54d7e6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Launch Mission
            </button>
            <div className="flex items-center text-xs uppercase tracking-[0.18em] text-zinc-500">
              Live adapter first, seeded fallback second
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
