import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const ORIGIN = "https://www.destinationcommandcenter.com";
const VIBE_ORIGIN = "https://vibearoundtown.com";

type SearchParams = Record<string, string | string[] | undefined>;
type IslandNode = { slug: string; name: string; eyebrow: string; intro: string; prompts: string[] };

const ISLANDS: Record<string, IslandNode> = {
  "st-thomas": { slug: "st-thomas", name: "St. Thomas", eyebrow: "St. Thomas port-day decisions", intro: "Use the ship clock, your group, and the kind of day you want to decide how much structure you actually need before choosing a local driver.", prompts: ["How much should we try to fit?", "Private local driver or fixed excursion?", "Should we keep the day open?"] },
  "st-croix": { slug: "st-croix", name: "St. Croix", eyebrow: "St. Croix port-day decisions", intro: "Decide what deserves a hard commitment and what can stay flexible before you choose the local person who will show you around.", prompts: ["What is the one anchor for the day?", "How much movement is worth it?", "Should different people in the group split up?"] },
  "st-john": { slug: "st-john", name: "St. John", eyebrow: "St. John port-day decisions", intro: "Start with the experience your group wants, then use timing and flexibility to decide whether a local-driver day is the right format.", prompts: ["Do we want a planned route or a flexible day?", "What can we comfortably fit?", "What should remain optional?"] },
};

const GUIDE_CARDS = [
  { slug: "independent-cruise-port-driver-vs-bus-tour", label: "Format", title: "Private local driver or bus tour?" },
  { slug: "what-can-you-do-in-an-8-hour-cruise-port-day", label: "Timing", title: "What realistically fits before all-aboard?" },
  { slug: "can-you-do-two-excursions-in-one-cruise-port-day", label: "Ambition", title: "Can two activities really fit?" },
  { slug: "when-is-it-better-not-to-book-a-cruise-excursion", label: "Flexibility", title: "When is a loose local day better than another excursion?" },
  { slug: "should-a-cruise-group-split-up-for-different-excursions", label: "Group", title: "Should the group split up?" },
] as const;

function one(value: string | string[] | undefined) { return typeof value === "string" ? value : undefined; }
function carry(params: SearchParams, island: string) {
  const query = new URLSearchParams(); query.set("from", "vibe"); query.set("island", island);
  for (const key of ["cruiseCallId", "groupSize", "shipName", "entry", "driverSlug"] as const) { const value = one(params[key]); if (value) query.set(key, value); }
  return query;
}
function returnHref(params: SearchParams, island: string) {
  const query = new URLSearchParams(); query.set("island", island);
  for (const key of ["cruiseCallId", "groupSize", "shipName"] as const) { const value = one(params[key]); if (value) query.set(key, value); }
  query.set("dccAssisted", "1"); query.set("dccEntry", one(params.entry) || "island-decision-center");
  const driverSlug = one(params.driverSlug);
  if (driverSlug) { query.set("dccDriver", driverSlug); return `${VIBE_ORIGIN}/drivers/${encodeURIComponent(driverSlug)}?${query.toString()}`; }
  return `${VIBE_ORIGIN}/search?${query.toString()}`;
}

export function generateStaticParams() { return Object.keys(ISLANDS).map((island) => ({ island })); }
export async function generateMetadata({ params }: { params: Promise<{ island: string }> }): Promise<Metadata> {
  const { island } = await params; const node = ISLANDS[island]; if (!node) return {};
  return { title: `${node.name} Vibe Around Decision Center | Destination Command Center`, description: `Pre-booking cruise-port decisions for ${node.name} before choosing a local Vibe Around driver.`, alternates: { canonical: `${ORIGIN}/vibe-around/${node.slug}` } };
}

export default async function IslandVibeDecisionCenter({ params, searchParams }: { params: Promise<{ island: string }>; searchParams: Promise<SearchParams> }) {
  const { island } = await params; const queryParams = await searchParams; const node = ISLANDS[island]; if (!node) notFound();
  const context = carry(queryParams, node.slug); const backToVibe = returnHref(queryParams, node.slug); const driverSlug = one(queryParams.driverSlug);
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "@id": `${ORIGIN}/vibe-around/${node.slug}#collection`, name: `${node.name} Vibe Around Decision Center`, description: node.intro, url: `${ORIGIN}/vibe-around/${node.slug}`, isPartOf: { "@id": `${ORIGIN}/#website` } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Destination Command Center", item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "Vibe Around Decision Center", item: `${ORIGIN}/vibe-around` },
      { "@type": "ListItem", position: 3, name: node.name, item: `${ORIGIN}/vibe-around/${node.slug}` },
    ] },
  ] };

  return <main className="min-h-screen bg-[#090d13] text-slate-100">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <nav className="mb-10 text-sm text-slate-400" aria-label="Breadcrumb"><Link href="/" className="hover:text-white">DCC</Link><span className="mx-2">/</span><Link href={`/vibe-around?${context.toString()}`} className="hover:text-white">Vibe Around</Link><span className="mx-2">/</span><span className="text-slate-300">{node.name}</span></nav>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <header><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{node.eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">Figure out your {node.name} day before you commit to the format.</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{node.intro}</p></header>
        <aside className="rounded-3xl border border-emerald-900/70 bg-[#0d1815] p-6 sm:p-7"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Return path is saved</p><h2 className="mt-3 text-2xl font-black text-white">{driverSlug ? "You can return to the same driver." : "You can return to the matching driver search."}</h2><p className="mt-4 text-sm leading-6 text-slate-400">DCC handles the uncertainty. Vibe Around remains the place to choose the person and submit the reservation request.</p><a href={backToVibe} className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200">I’m ready — back to Vibe Around ↗</a></aside>
      </div>
      <section className="mt-14 grid gap-5 md:grid-cols-3">{node.prompts.map((prompt, index) => <div key={prompt} className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5"><span className="text-xs font-black text-cyan-300">0{index + 1}</span><p className="mt-3 text-sm font-bold leading-6 text-white">{prompt}</p></div>)}</section>
      <section className="mt-14"><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Decision endpoints</p><h2 className="mt-3 text-3xl font-black tracking-tight text-white">Choose the uncertainty that is actually stopping you.</h2><div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{GUIDE_CARDS.map((guide) => <Link key={guide.slug} href={`/guides/${guide.slug}?${context.toString()}`} className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6 transition hover:-translate-y-1 hover:border-cyan-800"><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">{guide.label}</p><h3 className="mt-3 text-xl font-black leading-7 text-white">{guide.title}</h3><span className="mt-5 inline-block text-sm font-bold text-cyan-200">Resolve this decision →</span></Link>)}</div></section>
    </section>
  </main>;
}
