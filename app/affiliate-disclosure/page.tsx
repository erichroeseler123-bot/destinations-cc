import type { Metadata } from "next";
import Link from "next/link";
import { PORTFOLIO_SITE_CONTRACTS } from "@/src/data/portfolio-site-contracts";
import { getPublicationManifestEntry } from "@/src/data/publication-manifest";

const manifestEntry = getPublicationManifestEntry("/affiliate-disclosure");
const isIndexable = manifestEntry?.indexingState === "index_follow";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Affiliate & Portfolio Ownership Disclosure | Destination Command Center",
  description:
    "How Destination Command Center handles portfolio property ownership, third-party booking commissions, and neutral decision-engine ranking.",
  alternates: {
    canonical: manifestEntry?.canonicalUrl || "https://destinationcommandcenter.com/affiliate-disclosure",
  },
  robots: {
    index: isIndexable,
    follow: isIndexable,
  },
};

export default function AffiliateDisclosurePage() {
  const activePortfolioSites = PORTFOLIO_SITE_CONTRACTS.filter(
    (contract) => contract.id !== "dcc" && Boolean(contract.canonicalUrl) && contract.strategy !== "review"
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Compliance &amp; Provenance</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Affiliate &amp; Portfolio Ownership Disclosure
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-300">
            Destination Command Center (DCC) is a source-backed travel decision tool. Our primary job is to help you make a clear, evidence-backed travel decision—including deciding to use public transit, free access, a direct operator, or not to buy at all.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Decision-Engine Neutrality Rule (commercialWeight = 0)</h2>
          <p>
            DCC’s recommendation and option-comparison logic evaluates travel choices strictly on practical fit: port-day timing, ship-return margins, group size, luggage constraints, weather sensitivity, mobility/age limits, and verified primary-source rules.
          </p>
          <p>
            Whether DCC owns a connected specialist site or earns a referral commission from a marketplace has <strong>zero weight</strong> (<code>commercialWeight = 0</code>) in how options are ordered or whether a &ldquo;do not book / use public transit&rdquo; outcome is recommended.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">DCC Portfolio &amp; Connected Specialist Properties</h2>
          <p>
            Some execution and specialist properties linked from DCC are owned or operated within the Destination Command Center portfolio. When DCC routes you to a portfolio property to complete a narrower task (such as private Red Rocks group transport, Colorado I-70 ski transfers, or curated New Orleans swamp-tour comparisons), we disclose that relationship inline on the corridor or guide page.
          </p>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            {activePortfolioSites.map((site) => (
              <div
                key={site.id}
                className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">{site.name}</span>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200">
                    {site.networkRole.replace(/_/g, " ")}
                  </span>
                </div>
                {site.canonicalUrl ? (
                  <p className="text-xs text-cyan-300 break-all">{site.canonicalUrl}</p>
                ) : null}
                <p className="text-xs leading-relaxed text-zinc-400">{site.job}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Third-Party Marketplaces &amp; Direct Operators</h2>
          <p>
            DCC also compares third-party marketplaces (such as Viator, GetYourGuide, and FareHarbor-powered operator calendars), direct operator booking pages, and public or free alternatives (such as Bustang, RTD, National Park Service trails, or municipal ferries).
          </p>
          <p>
            If you click a marketplace or affiliate link and complete a purchase, DCC or its connected specialist site may earn a commission at no additional cost to you. Direct operator links, public transit agencies, and government park sites are included whenever they are relevant to the traveler’s decision, regardless of whether an affiliate relationship exists.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Analytics &amp; Consent Controls</h2>
          <p>
            Optional analytics (Google Analytics 4) and partner attribution scripts (such as GetYourGuide partner analytics) are disabled by default and load only if you explicitly opt in via the Cookie &amp; Analytics Consent control. See our{" "}
            <Link href="/privacy" className="text-cyan-300 underline underline-offset-4">
              Privacy Policy
            </Link>{" "}
            for full details on data handling and how to change your consent choice at any time.
          </p>
        </section>
      </div>
    </main>
  );
}
