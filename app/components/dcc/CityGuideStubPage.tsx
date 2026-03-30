import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";

type CityGuideStubPageProps = {
  cityName: string;
  path: string;
  cityHref: string;
  title: string;
  description: string;
  highlights: readonly string[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  tertiaryHref?: string;
  tertiaryLabel?: string;
};

export default function CityGuideStubPage({
  cityName,
  path,
  cityHref,
  title,
  description,
  highlights,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  tertiaryHref,
  tertiaryLabel,
}: CityGuideStubPageProps) {
  const tourHref = cityHref === secondaryHref ? primaryHref : primaryHref;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildArticleJsonLd({
              path,
              headline: title,
              description,
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: cityName, item: cityHref },
              { name: title, item: path },
            ]),
          ],
        }}
      />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(61,243,255,0.12),transparent_26%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <div className="inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">
            Destination execution page
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.24em] text-cyan-300">{cityName} guide</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-300">{description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={primaryHref} className="rounded-full bg-cyan-600 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-cyan-500">
              {primaryLabel}
            </Link>
            <Link href={secondaryHref} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-200 hover:bg-white/10">
              {secondaryLabel}
            </Link>
            {tertiaryHref && tertiaryLabel ? (
              <Link href={tertiaryHref} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-200 hover:bg-white/10">
                {tertiaryLabel}
              </Link>
            ) : null}
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">What to focus on</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-zinc-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">Why this page deserves its own search lane</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                This page exists because visitors often search for one specific slice of {cityName}, not just the city overall. A page like this should answer that narrower intent clearly, then connect the visitor into tours, shows, or the broader city guide when the plan expands.
              </p>
              <p>
                That internal-link path helps both users and crawlers understand how this topic fits inside the wider {cityName} cluster instead of leaving it as an isolated stub.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best next clicks</div>
              <div className="mt-4 grid gap-3">
                <Link href={cityHref} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">{cityName} hub</Link>
                <Link href={tourHref} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Browse tours</Link>
                <Link href={`${cityHref}/shows`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">{cityName} shows</Link>
                <Link href={`${cityHref}/attractions`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">{cityName} attractions</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">Keep exploring {cityName}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={cityHref} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200 hover:bg-white/10">
              {cityName} hub
            </Link>
            <Link href={primaryHref} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200 hover:bg-white/10">
              Browse tours
            </Link>
            <Link href={`${cityHref}/shows`} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200 hover:bg-white/10">
              {cityName} shows
            </Link>
            <Link href={secondaryHref} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200 hover:bg-white/10">
              What&apos;s happening now
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
