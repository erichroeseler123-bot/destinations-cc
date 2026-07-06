import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

type NetworkConfig = {
  slug: string;
  name: string;
  domain: string;
  marketScopeLabel: string;
  marketScope: string;
  activeItemsLabel: string;
  activeItemsList: string;
  description: string;
  providerModel: string;
  activeItems: { name: string; desc: string; url: string }[];
  linkBackTitle: string;
  linkBackDesc: string;
  linkBackUrl: string;
  linkBackCta: string;
};

const NETWORK_RECORDS: Record<string, NetworkConfig> = {
  "last-frontier-shore-excursions": {
    slug: "last-frontier-shore-excursions",
    name: "Last Frontier Shore Excursions",
    domain: "lastfrontiershoreexcursions.com",
    marketScopeLabel: "Market Scope",
    marketScope: "Alaska Cruise Ports",
    activeItemsLabel: "Active Ports",
    activeItemsList: "Juneau, Skagway, Ketchikan",
    description: "Last Frontier Shore Excursions is an active Alaska cruise-port storefront in the Destination Command Center network. This record confirms the domain, market scope, supported ports, public sitemap, and provider booking path currently associated with the site.",
    providerModel: "Partner / Affiliate booking exits",
    activeItems: [
      { name: "Juneau", desc: "Whale watching, Mendenhall Glacier, helicopter tours", url: "https://www.lastfrontiershoreexcursions.com/ports/juneau" },
      { name: "Skagway", desc: "White Pass railway, historic excursions, wilderness hikes", url: "https://www.lastfrontiershoreexcursions.com/ports/skagway" },
      { name: "Ketchikan", desc: "Floatplanes, rainforest fjord routes, totem parks", url: "https://www.lastfrontiershoreexcursions.com/ports/ketchikan" }
    ],
    linkBackTitle: "Last Frontier Shore Excursions",
    linkBackDesc: "Browse verified shore excursions for your upcoming Alaska cruise day.",
    linkBackUrl: "https://www.lastfrontiershoreexcursions.com/",
    linkBackCta: "Visit Last Frontier Shore Excursions"
  },
  "welcome-to-new-orleans-tours": {
    slug: "welcome-to-new-orleans-tours",
    name: "Welcome To New Orleans Tours",
    domain: "welcometoneworleanstours.com",
    marketScopeLabel: "Market Scope",
    marketScope: "New Orleans visitor tours",
    activeItemsLabel: "Active Categories",
    activeItemsList: "Swamp tours, airboat tours, French Quarter walks, food/cocktail, ghost/cemetery, riverboat cruises",
    description: "Welcome To New Orleans Tours is an active New Orleans travel storefront in the Destination Command Center network. This record confirms the domain, market scope, active categories, public sitemap, and provider booking path currently associated with the site.",
    providerModel: "Partner / Affiliate / Direct provider exits",
    activeItems: [
      { name: "Swamp Tours", desc: "Pontoon cruises through Lafitte and LaPlace bayous, perfect for families", url: "https://www.welcometoneworleanstours.com/categories/swamp-tours" },
      { name: "Airboat Tours", desc: "High-speed open-air airboat runs in Louisiana marshes and shallow bayous", url: "https://www.welcometoneworleanstours.com/categories/airboat-tours" },
      { name: "French Quarter Tours", desc: "Guided architectural walks, French Quarter history, and classic jazz walks", url: "https://www.welcometoneworleanstours.com/categories/french-quarter-tours" },
      { name: "Food & Cocktail Tours", desc: "Sample gumbo, jambalaya, and Sazerac cocktails in historic dining rooms", url: "https://www.welcometoneworleanstours.com/categories/food-and-cocktail-tours" },
      { name: "Ghost & Cemetery Tours", desc: "Nighttime candlelit walks through haunted gates and voodoo history sites", url: "https://www.welcometoneworleanstours.com/categories/ghost-and-cemetery-tours" },
      { name: "Mississippi Cruises", desc: "Authentic paddlewheel steamboat cruises and jazz dinner events on the river", url: "https://www.welcometoneworleanstours.com/categories/riverboat-cruises" }
    ],
    linkBackTitle: "Welcome To New Orleans Tours",
    linkBackDesc: "Browse verified swamp tours and walking excursions for your upcoming New Orleans trip.",
    linkBackUrl: "https://www.welcometoneworleanstours.com/",
    linkBackCta: "Visit Welcome To New Orleans Tours"
  }
};

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const resolvedParams = await params;
  const config = NETWORK_RECORDS[resolvedParams.slug];
  if (!config) {
    return { title: "Not Found" };
  }

  return {
    title: `DCC Network Record: ${config.name}`,
    description: `Official network profile, domain verification, and booking exit routing status for ${config.name}.`,
    robots: "index, follow",
  };
}

export default async function NetworkRecordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const config = NETWORK_RECORDS[resolvedParams.slug];
  if (!config) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-20">
      {/* Verification Header */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">DCC Verified Network Record</span>
          </div>
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-sky-400 transition">
            ← DCC Home
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-16 pb-10 space-y-6">
        <div className="inline-flex rounded-full bg-sky-500/10 border border-sky-400/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-400">
          Network Record
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
          {config.name}
        </h1>
        <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">
          {config.description}
        </p>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-3 pt-2">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active Storefront
          </span>
          <span className="inline-flex items-center gap-2 rounded-2xl bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 text-xs font-semibold text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Live Verified
          </span>
          <span className="inline-flex items-center gap-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 text-xs font-semibold text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Provider Exits Active
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="max-w-5xl mx-auto px-6 grid gap-8 md:grid-cols-12 items-start">
        
        {/* Left Column: Facts and Status */}
        <div className="md:col-span-4 space-y-6 text-left">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-6 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Primary Facts</h3>
            
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 block">Verified Domain</span>
                <a 
                  href={`https://www.${config.domain}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-bold text-sky-400 hover:underline break-all"
                >
                  {config.domain}
                </a>
              </div>

              <div className="space-y-1 border-t border-slate-800/60 pt-3">
                <span className="text-xs text-slate-500 block">{config.marketScopeLabel}</span>
                <span className="font-bold text-white">{config.marketScope}</span>
              </div>

              <div className="space-y-1 border-t border-slate-800/60 pt-3">
                <span className="text-xs text-slate-500 block">{config.activeItemsLabel}</span>
                <span className="font-bold text-white">{config.activeItemsList}</span>
              </div>

              <div className="space-y-1 border-t border-slate-800/60 pt-3">
                <span className="text-xs text-slate-500 block">Provider Model</span>
                <span className="font-bold text-white">{config.providerModel}</span>
              </div>

              <div className="space-y-1 border-t border-slate-800/60 pt-3">
                <span className="text-xs text-slate-500 block">Sitemap status</span>
                <span className="font-bold text-emerald-400">Live &amp; Scoped</span>
              </div>

              <div className="space-y-1 border-t border-slate-800/60 pt-3">
                <span className="text-xs text-slate-500 block">Robots.txt status</span>
                <span className="font-bold text-emerald-400">Live &amp; Crawl-verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: In-depth Verification Details */}
        <div className="md:col-span-8 space-y-8 text-left">
          
          {/* Network status checklists */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-black text-white">1. Network Routing Verification</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Public Storefront Live</h4>
                  <p className="text-xs text-slate-400">Storefront files serve the custom travel layouts, assets, and booking selectors under www canonical routing.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-t border-slate-800/50 pt-4">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Canonical Domain Verified</h4>
                  <p className="text-xs text-slate-400">Redirections from bare domains to www canonical hosts resolve with HTTP 308 permanent status.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-t border-slate-800/50 pt-4">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Sitemap Integrity Clean</h4>
                  <p className="text-xs text-slate-400">Dynamic sitemaps expose only public storefront routes; all developer tools and DCC dashboards are omitted.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-t border-slate-800/50 pt-4">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Internal Routes Blocked</h4>
                  <p className="text-xs text-slate-400 text-slate-400">Restricted admin, network feed, and operator tools return HTTP 404 with indexation protection tags on the storefront host.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Market Coverage Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-black text-white">2. Active Market Coverage</h2>
            
            <div className="grid gap-4 sm:grid-cols-3">
              {config.activeItems.map((item) => (
                <div key={item.name} className="bg-slate-900 border border-slate-800/60 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm">{item.name}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active</span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-400 font-bold hover:underline">View Page →</a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Booking Path Section */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-black text-white">3. Public Booking Path</h2>
            
            <div className="grid gap-4 sm:grid-cols-4 text-center">
              <div className="bg-slate-950 border border-slate-800/60 rounded-2xl p-4 space-y-1">
                <span className="text-sky-400 text-xs font-black uppercase tracking-widest block">Step 01</span>
                <h4 className="font-bold text-white text-sm">Search &amp; Compare</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Travelers browse tours by category and duration.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800/60 rounded-2xl p-4 space-y-1">
                <span className="text-sky-400 text-xs font-black uppercase tracking-widest block">Step 02</span>
                <h4 className="font-bold text-white text-sm">Trip Fit</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Check logistics, walking level, and hotel pickup.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800/60 rounded-2xl p-4 space-y-1">
                <span className="text-sky-400 text-xs font-black uppercase tracking-widest block">Step 03</span>
                <h4 className="font-bold text-white text-sm">Continue to Exit</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Redirect safely to the partner/provider checkout.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800/60 rounded-2xl p-4 space-y-1">
                <span className="text-sky-400 text-xs font-black uppercase tracking-widest block">Step 04</span>
                <h4 className="font-bold text-white text-sm">Confirm Booking</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Operator issues tickets and logistics details directly.</p>
              </div>
            </div>
          </section>

          {/* DCC Role Section */}
          <section className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Network Context</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Destination Command Center organizes public travel storefronts around market scope, routing clarity, provider exits, and crawlable public records. DCC does not replace the local tour provider; it helps structure the public discovery and booking path.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              DCC provides the public routing and verification layer behind participating travel storefronts. It tracks what each storefront covers, which pages are public, how booking exits are disclosed, and whether the site’s public scope matches the market it claims to serve.
            </p>
          </section>

          {/* Public Trust Notes */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-white">Public Trust Verification Details</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-slate-900 border border-slate-800/60 rounded-3xl p-5 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">No Fake Inventory</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">All listed tours map to active Viator actions or local catalogs. No placeholder products are loaded.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800/60 rounded-3xl p-5 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Provider Booking Disclosed</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Affiliate booking pathways and referral commissions are clearly labeled in compliance with network standards.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800/60 rounded-3xl p-5 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Unsupported Destinations Blocked</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Out-of-scope destinations are strictly restricted. Non-market pages redirect to error pages to preserve data integrity.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800/60 rounded-3xl p-5 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Terms Governed by Operator</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Cancellation guidelines, weather contingencies, and reservation policies are confirmed directly by the operating partner.</p>
              </div>
            </div>
          </section>

          {/* Link back to Storefront */}
          <section className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-800/60">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-bold text-white text-sm">{config.linkBackTitle}</h4>
              <p className="text-xs text-slate-400">{config.linkBackDesc}</p>
            </div>
            <div className="flex gap-3">
              <a 
                href={config.linkBackUrl}
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition"
              >
                {config.linkBackCta}
              </a>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
