import type { ReactNode } from "react";
import Link from "next/link";
import AuthorityMediaStrip from "@/app/components/dcc/AuthorityMediaStrip";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";

export type AttractionPillarConfig = {
  slug: string;
  pageUrl: string;
  eyebrow: string;
  title: string;
  description: string;
  placeName: string;
  gridTitle: string;
  gridDescription: string;
  schemaType: "TouristAttraction" | "LandmarksOrHistoricalBuildings" | "CollectionPage";
  heroImage?: { src: string; alt: string };
  gallery?: Array<{ src: string; alt: string }>;
  highlights: Array<{ title: string; body: string }>;
  tourFallbacks: Array<{ label: string; query: string }>;
  sections: Array<{ title: string; body: string }>;
  faq: Array<{ q: string; a: string }>;
  relatedLinks: Array<{ href: string; title: string; body: string }>;
  lastModified: string;
};

function JsonLd({ config }: { config: AttractionPillarConfig }) {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", config.schemaType],
        "@id": config.pageUrl,
        url: config.pageUrl,
        name: config.title,
        description: config.description,
        dateModified: config.lastModified,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://destinationcommandcenter.com/" },
          { "@type": "ListItem", position: 2, name: config.title, item: config.pageUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: config.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function AttractionPillarTemplate({ config }: { config: AttractionPillarConfig }) {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd config={config} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">{config.eyebrow}</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{config.title}</h1>
          <p className="max-w-3xl text-zinc-300">{config.description}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        {config.heroImage && config.gallery?.length ? (
          <AuthorityMediaStrip hero={config.heroImage} gallery={config.gallery} />
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {config.highlights.map((highlight) => (
            <article key={highlight.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">{highlight.title}</h2>
              <p className="mt-2 text-sm text-zinc-300">{highlight.body}</p>
            </article>
          ))}
        </section>

        <ViatorTourGrid
          placeName={config.placeName}
          title={config.gridTitle}
          description={config.gridDescription}
          products={[]}
          fallbacks={config.tourFallbacks}
          ctaLabel="Browse with DCC via Viator"
        />

        <section className="grid gap-4 md:grid-cols-2">
          {config.sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <p className="mt-3 text-zinc-300">{section.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Related routes</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {config.relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                <h3 className="font-semibold">{link.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">{link.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="mt-4 space-y-3">
            {config.faq.map((item) => (
              <article key={item.q} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-zinc-300">{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
