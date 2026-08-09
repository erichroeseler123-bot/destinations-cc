import type { CommandSiteNetworkModel } from "@/lib/dcc/command/types";

function badge(status: string) {
  if (status === "active") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  if (status === "review") return "border-amber-400/20 bg-amber-400/10 text-amber-200";
  return "border-white/10 bg-white/[0.04] text-white/60";
}

export function SiteNetworkControlPlane({ data }: { data: CommandSiteNetworkModel }) {
  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5c66c]">Suite control plane</div>
        <h2 className="text-2xl font-black uppercase text-white">Who owns the traveler next</h2>
        <p className="max-w-3xl text-sm text-[#f8f4ed]/70">
          Governed site roles, intent ownership, and handoff paths. This view is registry-backed and read-only.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Sites", data.siteCount],
          ["Owned intents", data.intentCount],
          ["Handoffs", data.handoffCount],
          ["Money endpoints", data.terminalCount],
          ["No inbound path", data.orphanedSiteCount],
          ["Weak endpoints", data.nonMonetizedEndpointCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{label}</div>
            <div className="mt-2 text-2xl font-black text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.sites.map((site) => (
          <article key={site.id} className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,21,18,0.84),rgba(12,11,10,0.92))] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f5c66c]">{site.role}</div>
                <h3 className="mt-2 text-lg font-black text-white">{site.name}</h3>
                <p className="mt-1 text-xs text-white/45">{site.domain}</p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${badge(site.promotionStatus)}`}>
                {site.promotionStatus}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">In</div>
                <div className="mt-1 font-black text-white">{site.inboundCount}</div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Out</div>
                <div className="mt-1 font-black text-white">{site.outboundCount}</div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">End</div>
                <div className="mt-1 font-black text-white">{site.terminal ? "Yes" : "No"}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Owned intent</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {site.ownedIntents.length > 0 ? site.ownedIntents.map((intent) => (
                  <span key={intent} className="rounded-full border border-[#f5c66c]/20 bg-[#f5c66c]/8 px-2.5 py-1 text-[11px] text-[#f5c66c]">
                    {intent}
                  </span>
                )) : <span className="text-xs text-white/35">No exact intent owned</span>}
              </div>
            </div>

            <div className="mt-4 text-xs text-white/45">Monetization: {site.monetizationMode}</div>
          </article>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f5c66c]">Canonical handoffs</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.handoffs.map((handoff) => (
            <div key={handoff.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm font-black text-white">
                <span>{handoff.fromName}</span>
                <span className="text-[#f5c66c]">→</span>
                <span>{handoff.toName}</span>
                {handoff.terminal ? <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-emerald-200">execute</span> : null}
              </div>
              <p className="mt-2 text-xs text-white/55">{handoff.reason}</p>
              <p className="mt-2 text-[11px] text-white/35">Carries: {handoff.context.join(" · ")}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
