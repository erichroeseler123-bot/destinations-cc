import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { resolveNetworkRecord } from "@/lib/dcc/networkRecordResolver";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const config = resolveNetworkRecord(resolvedParams.slug);
  if (!config) {
    return { title: "Not Found" };
  }

  return {
    title: `DCC Network Record: ${config.name}`,
    description: `Official DCC portfolio network profile, domain verification, and booking authority boundary for ${config.name}.`,
    robots: "index, follow",
  };
}

export default async function NetworkRecordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const config = resolveNetworkRecord(resolvedParams.slug);
  if (!config) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-20">
      <div className="bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              DCC Verified Network Record · {config.dccId}
            </span>
          </div>
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-sky-400 transition"
          >
            ← DCC Home
          </Link>
        </div>
      </div>

      <header className="max-w-5xl mx-auto px-6 pt-16 pb-10 space-y-6">
        <div className="inline-flex rounded-full bg-sky-500/10 border border-sky-400/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-400">
          Network Record
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
          {config.name}
        </h1>
        <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">{config.description}</p>

        <div className="flex flex-wrap gap-3 pt-2">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Status: {config.statusState}
          </span>
          <span className="inline-flex items-center gap-2 rounded-2xl bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 text-xs font-semibold text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Canonical Truth Linked
          </span>
          <span className="inline-flex items-center gap-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 text-xs font-semibold text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Booking Boundary Disclosed
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 grid gap-8 md:grid-cols-12 items-start">
        <div className="md:col-span-4 space-y-6 text-left">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-6 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">
              Primary Facts
            </h3>

            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 block">Verified Domain</span>
                <a
                  href={config.canonicalUrl}
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
                <span className="text-xs text-slate-500 block">Booking &amp; Payment Model</span>
                <span className="font-bold text-white">{config.providerModel}</span>
              </div>

              <div className="space-y-1 border-t border-slate-800/60 pt-3">
                <span className="text-xs text-slate-500 block">Machine Truth Feed</span>
                <a
                  href={`/api/public/truth-feed?id=${encodeURIComponent(config.dccId)}`}
                  className="font-bold text-emerald-400 hover:underline break-all"
                >
                  /api/public/truth-feed
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 space-y-8 text-left">
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-black text-white">1. Network Routing Verification</h2>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  ✓
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Canonical Truth Registry Linked</h4>
                  <p className="text-xs text-slate-400">
                    Derived dynamically from DCC_SITE_TRUTH ({config.dccId}) so machine feeds and
                    human verification records cannot drift.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-t border-slate-800/50 pt-4">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  ✓
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Explicit Merchant Boundary</h4>
                  <p className="text-xs text-slate-400">
                    DCC performs suitability evaluation, context-preserving routing, and disclosed
                    handoffs without autonomous booking or delegated payment capture.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-t border-slate-800/50 pt-4">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  ✓
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">PII-Free Context Handoffs</h4>
                  <p className="text-xs text-slate-400">
                    Cross-site transitions strip personal query parameters at the edge and exchange
                    opaque expiring context tokens only.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-white">2. Declared Scope &amp; Coverage</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              {config.activeItems.map((item) => (
                <div
                  key={item.name}
                  className="bg-slate-900 border border-slate-800/60 rounded-3xl p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm">{item.name}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      {config.statusState}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-sky-400 font-bold hover:underline"
                    >
                      View Surface →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">
              Network Context
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Destination Command Center organizes participating travel storefronts and operator
              surfaces around market scope, coordinate context, and disclosed booking boundaries.
              Terms, live pricing, cancellation rules, and fulfillment remain governed by the
              disclosed operating provider.
            </p>
          </section>

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
