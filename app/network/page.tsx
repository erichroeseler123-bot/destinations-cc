import Link from "next/link";
import type { Metadata } from "next";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildDccOrganizationJsonLd,
  buildDccWebSiteJsonLd,
  buildNetworkServiceJsonLd,
  DCC_ORGANIZATION_ID,
  DCC_WEBSITE_ID,
} from "@/lib/dcc/networkEntityJsonLd";
import { listDccCruisePortEntrypoints } from "@/lib/dcc/cruisePortAuthority";
import { NETWORK_GRAPH, SUITE_SITES } from "@/src/data/network-graph";

const ROLE_LABELS: Record<string, string> = {
  research_authority: "Research authority",
  specialist_commerce: "Specialist choice + commerce",
  specialist_experience: "Specialist experience",
  planning_tool: "Planning tool",
  marketplace: "Local marketplace",
  transportation_commerce: "Transportation execution",
};

const CRUISE_PORT_AUTHORITY_QUEUE = listDccCruisePortEntrypoints();
export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Destination Command Center Network | How the Travel Suite Fits Together",
  description: "See how Destination Command Center acts as the upstream research layer for a network of focused travel, cruise, tour, and transportation sites.",
  alternates: { canonical: "/network" },
};

export default function NetworkPage() {
  const itemList = {
    "@type": "ItemList",
    "@id": "https://www.destinationcommandcenter.com/network#network-domains",
    name: "Destination Command Center travel network",
    itemListElement: SUITE_SITES.map((item, index) => ({
      "@type": "ListItem", position: index + 1,
      item: { "@type": "WebSite", name: item.name, url: item.url, additionalType: item.role, isPartOf: item.id === "dcc" ? undefined : { "@id": DCC_WEBSITE_ID } },
    })),
  };
  const service = buildNetworkServiceJsonLd("https://www.destinationcommandcenter.com", {
    id: "https://www.destinationcommandcenter.com/network#service",
    name: "Travel research, decision, specialist, and execution network",
    description: "Destination Command Center answers upstream travel questions and hands travelers to focused specialist, booking, marketplace, transportation, or planning surfaces when the next action is clear.",
    providerId: DCC_ORGANIZATION_ID,
  });

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <JsonLd data={{ "@context": "https://schema.org", "@graph": [buildDccOrganizationJsonLd(), buildDccWebSiteJsonLd(), service, itemList] }} />
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 md:py-12">
        <section className="rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">The suite map</div>
          <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">One research layer. Many specialist destinations.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 md:text-lg">Destination Command Center sits before the transaction. It answers the question, compares the tradeoffs, and preserves the context. When the traveler is ready to choose, reserve, book, or plan, the relevant specialist site takes over.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link href="/guides" className="rounded-xl bg-white px-4 py-3 text-sm font-black text-black">Browse decision guides</Link><a href="/network/graph.json" className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/80 hover:text-white">Machine-readable network graph</a></div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[["1 · Understand", "DCC owns questions, research, comparisons, logistics, constraints, and pre-purchase decisions."],["2 · Choose", "Focused destination and excursion sites narrow the actual experience or route."],["3 · Buy / reserve", "Transaction and marketplace sites handle current price, availability, terms, and execution."],["4 · Plan", "Where useful, Cruise Promenade turns selected cruise choices into a shared group plan."]].map(([title, copy]) => <div key={title} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5"><h2 className="text-lg font-black uppercase tracking-[0.08em]">{title}</h2><p className="mt-3 text-sm leading-7 text-white/68">{copy}</p></div>)}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">Network contract</div>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.03em]">{NETWORK_GRAPH.principle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">A DCC page should solve the research problem on its own. Outbound links are the next action, not the reason the page exists. The specialist site owns its own commercial truth. We do not duplicate transaction pages across domains.</p>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">The {SUITE_SITES.length}-site suite</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">Each domain has one primary job. That separation is what lets the network become interconnected without becoming duplicate content.</p>
          <div className="mt-5 grid gap-3">{SUITE_SITES.map((item) => <a key={item.id} href={item.url} className="grid gap-2 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#f5b34b]/45 hover:bg-white/[0.06] md:grid-cols-[260px_240px_1fr]"><span className="font-black text-white">{item.name}</span><span className="text-sm font-semibold text-[#f5b34b]">{ROLE_LABELS[item.role] || item.role}</span><span className="text-sm leading-6 text-white/68">{item.url.replace(/^https?:\/\//, "")}</span></a>)}</div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">Live DCC → specialist handoffs</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">These edges are generated from the same registry that renders the decision-guide pages, so the public site and the machine-readable topology cannot quietly drift apart.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">{NETWORK_GRAPH.guideEdges.map((edge) => <Link key={edge.from} href={edge.from.replace("dcc:", "")} className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06]"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">{edge.category}</span><div className="mt-2 font-black text-white">{edge.title}</div><div className="mt-2 text-sm text-white/55">Research → {edge.to || edge.href}</div></Link>)}</div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em]">Cruise-port authority queue</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">These are upstream authority opportunities. They are not automatically booking pages: DCC earns the search visit first by answering the port-day decision.</p>
          <div className="mt-5 grid gap-3">{CRUISE_PORT_AUTHORITY_QUEUE.map((entrypoint) => <Link key={entrypoint.id} href={entrypoint.dccAuthorityPath} className="grid gap-2 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#f5b34b]/45 hover:bg-white/[0.06] md:grid-cols-[260px_180px_1fr]"><span className="font-black text-white">{entrypoint.portName}</span><span className="text-sm font-semibold text-[#f5b34b]">{entrypoint.providerMode}</span><span className="text-sm leading-6 text-white/68">{entrypoint.completionStatus} / {entrypoint.productLanes.slice(0, 3).join(", ")}</span></Link>)}</div>
        </section>
      </div>
    </main>
  );
}
