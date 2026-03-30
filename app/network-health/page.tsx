import type { Metadata } from "next";
import { getNetworkLanes } from "@/lib/dcc/networkFeeds";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Network Health | Destination Command Center",
  description: "Live status for the active Destination Command Network lanes.",
  alternates: { canonical: "/network-health" },
};

function formatStatus(label: string, ok: boolean, timestamp?: string) {
  return {
    label,
    status: ok ? "connected" : "fallback",
    timestamp: timestamp ?? null,
  };
}

export default async function NetworkHealthPage() {
  const network = await getNetworkLanes();
  const parrLive = network.parr?.status === "ok";
  const sotsLive = network.sots?.status === "ok";
  const pulseHealthy = parrLive || sotsLive;
  const parrStatus = formatStatus(
    "PartyAtRedRocks",
    parrLive,
    network.parr?.refreshedAt,
  );
  const sotsStatus = formatStatus(
    "Save On The Strip",
    sotsLive,
    network.sots?.refreshedAt,
  );

  return (
    <main className="min-h-screen bg-[#0c0b0a] text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 md:py-16">
        <header className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5c66c]">
            Destination Command Network
          </p>
          <h1 className="text-4xl font-black uppercase tracking-[-0.03em] md:text-5xl">
            Network Health
          </h1>
          <p className="max-w-3xl text-sm text-[#f8f4ed]/72 md:text-base">
            Read-only feed visibility for the active execution lanes. If a feed fails, DCC falls back
            to static lane copy instead of showing broken live data.
          </p>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#f8f4ed]/72">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                pulseHealthy ? "animate-pulse bg-[#4ade80]" : "bg-[#d29a3a]"
              }`}
            />
            <span>Network pulse</span>
            <span className="text-[#f8f4ed]/46">Updated {network.refreshedAt.slice(11, 16)} UTC</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            parrStatus,
            sotsStatus,
            {
              label: "Welcome To Alaska Tours",
              status: "static",
              timestamp: null,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
            >
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5c66c]">
                {item.label}
              </div>
              <div className="mt-3 text-2xl font-black uppercase">{item.status}</div>
              <p className="mt-2 text-sm text-[#f8f4ed]/66">
                {item.timestamp ? `Source refreshed at ${item.timestamp}` : "No live endpoint configured yet."}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5c66c]">
            DCC refresh
          </div>
          <div className="mt-3 text-2xl font-black uppercase">{network.refreshedAt}</div>
          <p className="mt-2 text-sm text-[#f8f4ed]/66">
            Homepage lane cards revalidate every five minutes and downgrade safely to fallback copy if a source is unavailable.
          </p>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5c66c]">
            Raw feed snapshot
          </div>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-[#efe5d3]">
            {JSON.stringify(network, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
