import Link from "next/link";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";

type RedRocksSection = {
  title: string;
  body: string;
  bullets?: string[];
};

type RedRocksAuthorityPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: RedRocksSection[];
  sourcePath: string;
  primaryCtaHref?: string;
  primaryCtaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
  buyerIntentLabel?: string;
};

const RELATED_GUIDES = [
  { href: "/red-rocks", label: "Red Rocks guide" },
  { href: "/red-rocks-concert-guide", label: "Concert guide" },
  { href: "/red-rocks-transportation", label: "Transportation" },
  { href: "/red-rocks-parking", label: "Parking" },
  { href: "/red-rocks-events", label: "Events" },
  { href: "/red-rocks-shuttle", label: "Red Rocks shuttle" },
  { href: "/red-rocks-complete-guide", label: "Complete guide" },
  { href: "/denver/concert-transportation", label: "Denver concert transportation" },
];

export default function RedRocksAuthorityPage({
  eyebrow,
  title,
  intro,
  sections,
  sourcePath,
  primaryCtaHref = "/book",
  primaryCtaLabel = "Book Red Rocks Ride",
  secondaryCtaHref = "/red-rocks-events",
  secondaryCtaLabel = "See Red Rocks Events",
  buyerIntentLabel = "High-intent transportation guide",
}: RedRocksAuthorityPageProps) {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildArticleJsonLd({
              path: sourcePath,
              headline: title,
              description: intro,
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Red Rocks", item: "/red-rocks" },
              { name: title, item: sourcePath },
            ]),
          ],
        }}
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(61,243,255,0.12),transparent_26%),linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <div className="inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">
            {buyerIntentLabel}
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">{intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={primaryCtaHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href={secondaryCtaHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-[#0b1224] p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb07c]">Problem query</div>
              <div className="mt-2 text-sm leading-6 text-white/80">Visitor already knows they need a ride, parking answer, or post-show plan.</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[#0b1224] p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb07c]">Conversion path</div>
              <div className="mt-2 text-sm leading-6 text-white/80">Guide page, compare ride options, then book shared or private transport.</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[#0b1224] p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb07c]">Best fit</div>
              <div className="mt-2 text-sm leading-6 text-white/80">Visitors staying in Denver who want fewer moving parts after the encore.</div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {RELATED_GUIDES.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200 hover:bg-white/10 ${
                  item.href === sourcePath ? "bg-white/10" : "bg-black/30"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]"
              >
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{section.body}</p>
                {section.bullets?.length ? (
                  <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>• {bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <RideOptionsCard venueSlug="red-rocks-amphitheatre" sourcePage={sourcePath} />
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Recommended flow</p>
              <div className="mt-3 space-y-3 text-sm text-zinc-300">
                <p>User searches</p>
                <p>Destination Command Center guide</p>
                <p>Red Rocks and Denver transport context</p>
                <p>Party At Red Rocks ride recommendation</p>
                <p>Booking on PARR</p>
              </div>
            </section>

            <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,11,18,0.96),rgba(10,9,20,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffb07c]">Fastest next step</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                If the visitor already knows the show date and wants the cleanest ride-home path, move them directly into booking instead of making them read more theory.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={primaryCtaHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#3df3ff] px-4 text-xs font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
                >
                  {primaryCtaLabel}
                </Link>
                <Link
                  href="/red-rocks-parking"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                >
                  Compare parking first
                </Link>
              </div>
            </section>

            <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Related DCC pages</p>
              <div className="mt-4 grid gap-3">
                <Link href="/venues/red-rocks-amphitheatre" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                  Red Rocks venue node
                </Link>
                <Link href="/routes/denver-red-rocks" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                  Denver to Red Rocks route guide
                </Link>
                <Link href="/cities/denver" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                  Denver decision engine
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
