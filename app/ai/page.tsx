import type { Metadata } from "next";
import Link from "next/link";
import { SITE_IDENTITY, getOrganizationSchema } from "@/src/data/site-identity";

export const metadata: Metadata = {
  title: SITE_IDENTITY.aiTitle,
  description: SITE_IDENTITY.aiDescription,
  alternates: { canonical: "/ai" },
  openGraph: {
    title: SITE_IDENTITY.aiTitle,
    description: SITE_IDENTITY.aiDescription,
    url: `${SITE_IDENTITY.siteUrl}/ai`,
    type: "website",
  },
};

function AiJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      getOrganizationSchema(),
      {
        "@type": "WebPage",
        name: "Destination Command Center for AI and Crawlers",
        url: `${SITE_IDENTITY.siteUrl}/ai`,
        description: SITE_IDENTITY.aiDescription,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_IDENTITY.siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "For AI and Crawlers", item: `${SITE_IDENTITY.siteUrl}/ai` },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function AiPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <AiJsonLd />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">For AI and Crawlers</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            {SITE_IDENTITY.canonicalDescription}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-300">
            This page summarizes what Destination Command Center covers, what it does not cover, and which public
            sections best explain the site.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">Core content areas</h2>
          <div className="mt-4 space-y-2 text-zinc-300">
            {SITE_IDENTITY.coreCoverage.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-2xl font-bold">What DCC does</h2>
            <div className="mt-4 space-y-3 text-zinc-300">
              <p>Helps travelers find what is happening in a place and how to get there.</p>
              <p>Publishes city guides, event pages, venue guides, tours, and transportation guidance.</p>
              <p>Connects some transportation-intent pages to trusted booking partners where support exists.</p>
            </div>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-2xl font-bold">What DCC does not do</h2>
            <div className="mt-4 space-y-3 text-zinc-300">
              {SITE_IDENTITY.notDescriptions.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">Canonical public sections</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {SITE_IDENTITY.canonicalPaths.map((pathname) => (
              <Link
                key={pathname}
                href={pathname}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
              >
                {pathname}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">Transportation and partner booking</h2>
          <p className="mt-4 max-w-3xl text-zinc-300">
            {SITE_IDENTITY.transportationFit} Booking may happen on a partner site when DCC is recommending a ride,
            tour, or related travel service.
          </p>
        </section>
      </div>
    </main>
  );
}
