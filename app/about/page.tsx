import type { Metadata } from "next";
import Link from "next/link";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildAboutPageJsonLd,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
} from "@/lib/dcc/jsonld";

export const metadata: Metadata = {
  title: SITE_IDENTITY.aboutTitle,
  description: SITE_IDENTITY.canonicalDescription,
  alternates: { canonical: "/about" },
  openGraph: {
    title: SITE_IDENTITY.aboutTitle,
    description: SITE_IDENTITY.aboutDescription,
    url: `${SITE_IDENTITY.siteUrl}/about`,
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildOrganizationJsonLd(),
            buildAboutPageJsonLd({
              path: "/about",
              name: SITE_IDENTITY.aboutTitle,
              description: SITE_IDENTITY.aboutDescription,
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "About", item: "/about" },
            ]),
          ],
        }}
      />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">About Destination Command Center</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            {SITE_IDENTITY.aboutHeroTitle}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-300">
            {SITE_IDENTITY.aboutHeroSummary}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-2xl font-bold">What DCC covers</h2>
            <div className="mt-4 space-y-2 text-zinc-300">
              {SITE_IDENTITY.coreCoverage.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-2xl font-bold">Who it is for</h2>
            <div className="mt-4 space-y-3 text-zinc-300">
              {SITE_IDENTITY.audience.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">How transportation fits</h2>
          <p className="mt-4 max-w-3xl text-zinc-300">
            {SITE_IDENTITY.transportationFit} For Red Rocks, Party At Red Rocks handles the ride and booking side.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">What DCC is not</h2>
          <p className="mt-4 max-w-3xl text-zinc-300">
            Destination Command Center is built to help travelers compare destination options, understand timing and context,
            and move toward the right booking path when needed. It is {SITE_IDENTITY.notDescriptions.join(", ")}.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">Start Exploring</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/cities" className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500">
              Browse cities
            </Link>
            <Link href="/transportation" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200 hover:bg-white/10">
              Transportation guides
            </Link>
            <Link href="/vegas" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200 hover:bg-white/10">
              Las Vegas guide
            </Link>
            <Link href="/denver/shows" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200 hover:bg-white/10">
              Denver shows
            </Link>
            <Link href="/ai" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200 hover:bg-white/10">
              For AI and crawlers
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
