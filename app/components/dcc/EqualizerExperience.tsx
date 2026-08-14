"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  calculateDeterministicMatch,
  calculateReturnRisk,
  explainMatch,
  type LocalImpactProfile,
  type StructuredIntent,
} from "@/src/lib/dcc/decision-contracts";

type LiveSnapshot = {
  checkedAt?: string;
  weather?: {
    available?: boolean;
    current?: {
      temperatureF?: number | null;
      apparentTemperatureF?: number | null;
      description?: string | null;
      windMph?: number | null;
    };
  };
  ticketmaster?: { available?: boolean; events?: Array<{ id?: string; name?: string; start?: string; venue?: string }> };
  providerSlots?: Record<string, { available?: boolean; liveItemCount?: number; mode?: string }>;
};

const LABELS = {
  informational: "INFORMATIONAL",
  matched: "ALGORITHMICALLY MATCHED",
  transactional: "TRANSACTIONAL",
};

function riskTone(status: string) {
  if (status === "LOW") return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  if (status === "TIGHT") return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  return "border-rose-300/30 bg-rose-300/10 text-rose-100";
}

export default function EqualizerExperience({
  destinationId,
  destinationName,
  lat,
  lng,
}: {
  destinationId: string;
  destinationName: string;
  lat: number;
  lng: number;
}) {
  const [live, setLive] = useState<LiveSnapshot | null>(null);
  const [liveError, setLiveError] = useState(false);
  const [partySize, setPartySize] = useState(6);
  const [port, setPort] = useState(destinationId === "st-thomas" ? "havensight" : "");
  const [arrival, setArrival] = useState("08:00");
  const [departure, setDeparture] = useState("17:00");
  const [planEnd, setPlanEnd] = useState("14:00");
  const [interests, setInterests] = useState("beach, lunch");
  const [constraints, setConstraints] = useState("short transit, easy walking");
  const [intent, setIntent] = useState<StructuredIntent | null>(null);
  const [operatorName, setOperatorName] = useState("");
  const [localOwner, setLocalOwner] = useState(false);
  const [licensed, setLicensed] = useState(false);
  const [directProvider, setDirectProvider] = useState(false);
  const [impact, setImpact] = useState<LocalImpactProfile | null>(null);

  useEffect(() => {
    let active = true;
    setLiveError(false);
    fetch(`/api/public/city-live?city=${encodeURIComponent(destinationId)}&lat=${lat}&lng=${lng}&timezone=auto`, {
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("live_snapshot_failed");
        return response.json();
      })
      .then((data) => {
        if (active) setLive(data);
      })
      .catch(() => {
        if (active) setLiveError(true);
      });
    return () => {
      active = false;
    };
  }, [destinationId, lat, lng]);

  const decision = useMemo(() => {
    if (!intent || !intent.windowEnd) return null;
    const today = new Date().toISOString().slice(0, 10);
    const shipDeparture = `${today}T${departure}:00`;
    const proposedPlanEnd = `${today}T${planEnd}:00`;
    const returnRisk = calculateReturnRisk({
      shipDeparture,
      planEnd: proposedPlanEnd,
      requiredBufferMinutes: 60,
      estimatedReturnTravelMinutes: 30,
      uncertaintyMinutes: 20,
      activityDurationMinutes: 180,
      evidence: [{ id: `${destinationId}/traveler-window`, source: "traveler-input", confidence: 1 }],
    });
    const match = calculateDeterministicMatch({
      subjectId: `${destinationId}/plan-candidate`,
      hardGates: [
        { id: "window", label: "Fits declared port window", passed: returnRisk.status !== "NOT_RECOMMENDED" },
        { id: "party", label: "Party size supplied", passed: Boolean(intent.partySize && intent.partySize > 0) },
      ],
      components: [
        {
          id: "window-fit",
          label: "Window fit",
          pointsAwarded: returnRisk.status === "LOW" ? 40 : returnRisk.status === "TIGHT" ? 24 : 0,
          pointsAvailable: 40,
          explanation: `Return-to-ship status is ${returnRisk.status}.`,
        },
        {
          id: "intent-completeness",
          label: "Intent completeness",
          pointsAwarded: intent.interests.length ? 30 : 0,
          pointsAvailable: 30,
          explanation: `${intent.interests.length} traveler interests were supplied.`,
        },
        {
          id: "constraint-clarity",
          label: "Constraint clarity",
          pointsAwarded: intent.constraints.length ? 30 : 0,
          pointsAvailable: 30,
          explanation: `${intent.constraints.length} traveler constraints were supplied.`,
        },
      ],
      returnRisk,
    });
    return { returnRisk, match, explanation: explainMatch(match) };
  }, [departure, destinationId, intent, planEnd]);

  function submitPlan(event: FormEvent) {
    event.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    setIntent({
      destinationId,
      portId: port ? `${destinationId}/${port}` : null,
      partySize,
      windowStart: `${today}T${arrival}:00`,
      windowEnd: `${today}T${departure}:00`,
      interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
      constraints: constraints.split(",").map((item) => item.trim()).filter(Boolean),
      preferences: [],
      rawText: `${partySize} people; ${interests}; ${constraints}`,
    });
  }

  function buildImpactProfile(event: FormEvent) {
    event.preventDefault();
    const now = new Date().toISOString();
    const subjectId = `${destinationId}/operator/${operatorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pending"}`;
    setImpact({
      subjectId,
      locallyOwned: { state: localOwner ? "reported" : "unknown", value: localOwner || null },
      locallyLicensed: { state: licensed ? "reported" : "unknown", value: licensed || null },
      independentOperator: { state: "reported", value: true },
      directServiceProvider: { state: directProvider ? "reported" : "unknown", value: directProvider || null },
      localEmployees: { state: "unknown", value: null },
      communityContribution: { state: "unknown", value: null },
      updatedAt: now,
    });
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-[30px] border border-cyan-300/15 bg-[#081426] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">Plan my port day</div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em]">Tell DCC the constraints</h2>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-white/60">{LABELS.informational}</span>
        </div>

        <form onSubmit={submitPlan} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-white/70">Port
            <select value={port} onChange={(event) => setPort(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white">
              {destinationId === "st-thomas" ? <><option value="havensight">Havensight</option><option value="crown-bay">Crown Bay</option></> : <option value="">Destination center</option>}
            </select>
          </label>
          <label className="text-xs font-bold text-white/70">Party size
            <input type="number" min={1} max={30} value={partySize} onChange={(event) => setPartySize(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" />
          </label>
          <label className="text-xs font-bold text-white/70">Arrival
            <input type="time" value={arrival} onChange={(event) => setArrival(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" />
          </label>
          <label className="text-xs font-bold text-white/70">Ship departure
            <input type="time" value={departure} onChange={(event) => setDeparture(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" />
          </label>
          <label className="text-xs font-bold text-white/70">Plan ends
            <input type="time" value={planEnd} onChange={(event) => setPlanEnd(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" />
          </label>
          <div />
          <label className="text-xs font-bold text-white/70 sm:col-span-2">What do you want?
            <input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="beach, lunch, scenic overlook" className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" />
          </label>
          <label className="text-xs font-bold text-white/70 sm:col-span-2">Constraints
            <input value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder="stroller friendly, short transit" className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" />
          </label>
          <button type="submit" className="sm:col-span-2 rounded-xl bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-[#050816]">Build decision</button>
        </form>

        {decision ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className={`rounded-2xl border p-5 ${riskTone(decision.returnRisk.status)}`}>
              <div className="text-[10px] font-black tracking-[0.2em]">RETURN TO SHIP</div>
              <div className="mt-2 text-2xl font-black">{decision.returnRisk.status.replace("_", " ")}</div>
              <div className="mt-2 text-sm opacity-80">{decision.returnRisk.returnBufferMinutes} min buffer after safeguards</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-3"><div className="text-[10px] font-black tracking-[0.2em] text-cyan-200">{LABELS.matched}</div><div className="text-3xl font-black">{decision.match.fitScore ?? "—"}{decision.match.fitScore != null ? "%" : ""}</div></div>
              <div className="mt-2 text-sm text-white/60">Commercial influence: {decision.match.commercialInfluencePoints} points</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-5 md:col-span-2">
              <div className="text-[11px] font-black tracking-[0.2em] text-[#ffb07c]">WHY THIS</div>
              <p className="mt-2 text-lg font-bold">{decision.explanation.summary}</p>
              <ul className="mt-3 space-y-2 text-sm text-white/70">{decision.explanation.reasons.map((reason) => <li key={reason}>• {reason}</li>)}</ul>
              {decision.explanation.caveats.length ? <div className="mt-4 text-sm text-amber-100">{decision.explanation.caveats.join(" ")}</div> : null}
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6">
        <section className="rounded-[30px] border border-white/10 bg-[#0b1224] p-6">
          <div className="flex items-center justify-between gap-3"><div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">Live destination intelligence</div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-white/60">{LABELS.informational}</span></div>
          {liveError ? <p className="mt-4 text-sm text-amber-100">Live snapshot is temporarily unavailable. DCC will not invent a replacement.</p> : !live ? <p className="mt-4 text-sm text-white/50">Loading live evidence…</p> : (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-black/20 p-4"><div className="text-white/50">Weather now</div><div className="mt-1 font-bold">{live.weather?.available ? `${live.weather.current?.temperatureF ?? "—"}°F · ${live.weather.current?.description ?? "Current conditions"}` : "Weather provider unavailable"}</div></div>
              <div className="rounded-xl bg-black/20 p-4"><div className="text-white/50">Events feed</div><div className="mt-1 font-bold">{live.ticketmaster?.available ? `${live.ticketmaster.events?.length ?? 0} live events returned` : "No connected live event result"}</div></div>
              <div className="rounded-xl bg-black/20 p-4"><div className="text-white/50">Checked</div><div className="mt-1 font-bold">{live.checkedAt ? new Date(live.checkedAt).toLocaleString() : "Just now"}</div></div>
            </div>
          )}
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#0b1224] p-6">
          <div className="flex items-center justify-between gap-3"><div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">Operator matching</div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-white/60">{LABELS.matched}</span></div>
          <p className="mt-3 text-sm leading-6 text-white/65">Live operator cards appear only when an operator is verified, available for the requested window, and passes the hard gates. DCC does not fabricate availability for this preview.</p>
          <div className="mt-4 rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/50">No verified live operator availability has been supplied to this DCC preview yet.</div>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#0b1224] p-6">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200">Operator onboarding contract preview</div>
          <form onSubmit={buildImpactProfile} className="mt-4 space-y-3 text-sm">
            <input value={operatorName} onChange={(event) => setOperatorName(event.target.value)} placeholder="Operator / driver name" className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" />
            <label className="flex gap-2"><input type="checkbox" checked={localOwner} onChange={(event) => setLocalOwner(event.target.checked)} /> Locally owned</label>
            <label className="flex gap-2"><input type="checkbox" checked={licensed} onChange={(event) => setLicensed(event.target.checked)} /> Locally licensed</label>
            <label className="flex gap-2"><input type="checkbox" checked={directProvider} onChange={(event) => setDirectProvider(event.target.checked)} /> Direct service provider</label>
            <button className="rounded-xl border border-white/15 px-4 py-3 font-black uppercase tracking-[0.1em]" type="submit">Build Local Impact Profile</button>
          </form>
          {impact ? <div className="mt-4 rounded-xl bg-black/20 p-4 text-xs text-white/70"><div className="font-black text-white">{impact.subjectId}</div><div className="mt-2">Local ownership: {impact.locallyOwned.state}</div><div>Local license: {impact.locallyLicensed.state}</div><div>Direct provider: {impact.directServiceProvider.state}</div><div className="mt-2 text-white/40">Preview only: produces the canonical contract shape; persistence/verification is not enabled yet.</div></div> : null}
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black/20 p-5">
          <div className="text-[10px] font-black tracking-[0.18em] text-white/50">LABELING CONTRACT</div>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black tracking-[0.12em]"><span className="rounded-full border border-cyan-300/20 px-3 py-2">{LABELS.informational}</span><span className="rounded-full border border-amber-300/20 px-3 py-2">{LABELS.matched}</span><span className="rounded-full border border-emerald-300/20 px-3 py-2">{LABELS.transactional}</span></div>
        </section>
      </div>
    </div>
  );
}
