import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "@/app/components/dcc/JsonLd";
import ParrCtaLink from "@/app/components/dcc/ParrCtaLink";
import RedRocksFunnelTelemetry from "@/app/components/dcc/RedRocksFunnelTelemetry";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";

type RedRocksSection = {
  title: string;
  body: string;
  bullets?: string[];
};

type RedRocksOperatorAttribution = {
  name: string;
  summary: string;
  website: string;
  trustPoints: readonly string[];
  supportPhone: string;
  supportSmsUrl: string;
  supportEmail: string;
  supportEmailUrl: string;
  pickupHubs: readonly {
    id: string;
    businessName: string;
    address: string;
    mapsUrl: string;
    websiteUrl?: string;
    menuUrl?: string;
  }[];
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
  notice?: ReactNode;
  heroImageSrc?: string;
  heroImageAlt?: string;
  operatorAttribution?: RedRocksOperatorAttribution;
};

const RELATED_GUIDES = [
  { href: "/red-rocks-transportation", label: "Transportation hub" },
  { href: "/red-rocks-shuttle-vs-uber", label: "Shuttle vs Uber" },
  { href: "/how-to-get-to-red-rocks-without-parking-hassle", label: "No parking hassle" },
  { href: "/best-way-to-leave-red-rocks", label: "Best way to leave" },
];

const DECISION_CARDS = [
  {
    href: "/red-rocks-transportation",
    title: "Make the transport decision",
    body: "Use this when you want the parent answer on what usually works best before you book.",
    label: "Decision hub",
  },
  {
    href: "/red-rocks-shuttle-vs-uber",
    title: "Resolve the rideshare question",
    body: "Use this when the real comparison is shuttle versus the post-show pickup mess.",
    label: "Rideshare lane",
  },
  {
    href: "/how-to-get-to-red-rocks-without-parking-hassle",
    title: "Remove parking from the night",
    body: "Use this when parking is already the problem and you want the cleanest way around it.",
    label: "Parking lane",
  },
  {
    href: "/best-way-to-leave-red-rocks",
    title: "Solve the exit plan",
    body: "Use this when the real concern is how the night ends once everyone tries to leave at once.",
    label: "Exit lane",
  },
];

const HERO_TRUST_BADGES = [
  "Denver-focused ride planning",
  "Direct PARR booking handoff",
  "Built around the post-show return",
];

const NIGHT_FLOW = [
  "Spot the real friction before the night gets built around it.",
  "Use DCC to resolve the transport decision instead of comparing forever.",
  "Move into one clear booking action once the answer is obvious.",
  "Land on Party at Red Rocks with the booking path already decided.",
];

export default function RedRocksAuthorityPage({
  eyebrow,
  title,
  intro,
  sections,
  sourcePath,
  primaryCtaHref = "/red-rocks-transportation",
  primaryCtaLabel = "Open Transport Decision Hub",
  secondaryCtaHref,
  secondaryCtaLabel,
  buyerIntentLabel = "High-intent transportation guide",
  notice,
  heroImageSrc,
  heroImageAlt = "Red Rocks proof-of-life image",
  operatorAttribution,
}: RedRocksAuthorityPageProps) {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <RedRocksFunnelTelemetry page={sourcePath} />
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
          <div className="mt-5 flex flex-wrap gap-2">
            {HERO_TRUST_BADGES.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold text-zinc-100"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <ParrCtaLink
              href={primaryCtaHref}
              page={sourcePath}
              cta="primary"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              {primaryCtaLabel}
            </ParrCtaLink>
            {secondaryCtaHref && secondaryCtaLabel ? (
              <Link
                href={secondaryCtaHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                {secondaryCtaLabel}
              </Link>
            ) : null}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-[#0b1224] p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb07c]">Problem query</div>
              <div className="mt-2 text-sm leading-6 text-white/80">Visitor already knows the night can break on parking, pickup, or the ride home.</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[#0b1224] p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb07c]">Decision path</div>
              <div className="mt-2 text-sm leading-6 text-white/80">Resolve the transport question, choose the cleanest path, then move straight into booking.</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[#0b1224] p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb07c]">Best fit</div>
              <div className="mt-2 text-sm leading-6 text-white/80">Visitors staying in Denver who want fewer moving parts after the show.</div>
            </div>
          </div>
          {heroImageSrc ? (
            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20">
              <img
                src={heroImageSrc}
                alt={heroImageAlt}
                className="h-[260px] w-full object-cover md:h-[340px]"
              />
            </div>
          ) : null}
          <section className="mt-6 rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffb07c]">Choose your next move</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {DECISION_CARDS.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`rounded-[1.4rem] border p-4 transition hover:bg-white/10 ${
                    card.href === sourcePath ? "border-cyan-300/40 bg-white/10" : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">{card.label}</div>
                  <h2 className="mt-2 text-lg font-bold text-white">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{card.body}</p>
                </Link>
              ))}
            </div>
          </section>
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
            {notice}
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

            {operatorAttribution ? (
              <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,32,0.96),rgba(6,9,18,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[#ffb07c]">Transportation operator</p>
                <h2 className="mt-3 text-2xl font-bold">{operatorAttribution.name}</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{operatorAttribution.summary}</p>
                <div className="mt-4 grid gap-2 text-sm text-zinc-200">
                  {operatorAttribution.trustPoints.map((point) => (
                    <div key={point}>• {point}</div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {operatorAttribution.pickupHubs.map((hub) => (
                    <div key={hub.id} className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                      <div className="text-sm font-bold text-white">{hub.businessName}</div>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">{hub.address}</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <a
                          href={hub.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-xs font-black uppercase tracking-[0.16em] text-cyan-200 no-underline"
                        >
                          Open in Maps
                        </a>
                        {hub.websiteUrl ? (
                          <a
                            href={hub.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex text-xs font-black uppercase tracking-[0.16em] text-zinc-200 no-underline"
                          >
                            Official hotel website
                          </a>
                        ) : null}
                        {hub.menuUrl ? (
                          <a
                            href={hub.menuUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex text-xs font-black uppercase tracking-[0.16em] text-zinc-200 no-underline"
                          >
                            Official menu
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
                  Questions about pickup, payment, or your ride? Text <a href={operatorAttribution.supportSmsUrl} className="text-cyan-200 no-underline">{operatorAttribution.supportPhone}</a> or email <a href={operatorAttribution.supportEmailUrl} className="text-cyan-200 no-underline">{operatorAttribution.supportEmail}</a>.
                </div>
              </section>
            ) : null}

            <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Simple funnel</p>
              <h2 className="mt-3 text-2xl font-bold">How a Red Rocks night usually gets decided</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {NIGHT_FLOW.map((item, index) => (
                  <div key={item} className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
                      Step {index + 1}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Recommended flow</p>
              <div className="mt-3 space-y-3 text-sm text-zinc-300">
                <p>User searches</p>
                <p>Destination Command Center guide</p>
                <p>Resolve the transport question</p>
                <p>Party at Red Rocks booking</p>
                <p>Ride home already handled</p>
              </div>
            </section>

            <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,11,18,0.96),rgba(10,9,20,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffb07c]">Fastest next step</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                If the visitor already knows the show date and wants the cleanest ride-home path, move them directly into booking instead of making them read more theory.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <ParrCtaLink
                  href={primaryCtaHref}
                  page={sourcePath}
                  cta="sidebar-primary"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#3df3ff] px-4 text-xs font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
                >
                  {primaryCtaLabel}
                </ParrCtaLink>
                {secondaryCtaHref && secondaryCtaLabel ? (
                  <Link
                    href={secondaryCtaHref}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                  >
                    {secondaryCtaLabel}
                  </Link>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
