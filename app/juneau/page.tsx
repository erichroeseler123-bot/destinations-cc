import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import {
  juneauDecisionCards,
  juneauGuideLinks,
  juneauHelicopterHref,
  juneauTrustSignals,
  type JuneauDecisionCard,
  type JuneauProviderType,
} from "@/lib/dcc/juneauCommercialHub";

const PAGE_PATH = "/juneau";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Juneau Shore Excursions | Cruise-Safe Decision Hub",
  description:
    "Choose the strongest Juneau port-day move: helicopter glacier flight first when the day supports it, whale watching or Mendenhall when weather, timing, or comfort changes the plan.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: "Juneau Shore Excursions | Cruise-Safe Decision Hub",
    description:
      "A DCC decision hub for Juneau helicopter, whale watching, Mendenhall, weather backup, and short port-call planning.",
    url: PAGE_PATH,
    type: "website",
  },
};

const providerLabels: Record<JuneauProviderType, string> = {
  partner: "Partner/direct path",
  affiliate_fallback: "Affiliate fallback",
  internal: "DCC decision path",
};

const providerTone: Record<JuneauProviderType, string> = {
  partner: "border-cyan-300/[0.35] bg-cyan-300/[0.12] text-cyan-100",
  affiliate_fallback: "border-amber-300/[0.35] bg-amber-300/[0.12] text-amber-100",
  internal: "border-white/[0.15] bg-white/[0.06] text-white/72",
};

function JsonLdGraph() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          buildWebPageJsonLd({
            path: PAGE_PATH,
            name: "Juneau Shore Excursions Decision Hub",
            description:
              "Public-safe DCC commercial decision hub for Juneau shore excursion choices, routing users into helicopter, whale, Mendenhall, weather-backup, and cruise-timing paths.",
            dateModified: "2026-05-27",
            isPartOfPath: "/network",
          }),
          buildBreadcrumbJsonLd([
            { name: "DCC", item: "/" },
            { name: "Juneau", item: PAGE_PATH },
          ]),
          buildCollectionPageJsonLd({
            path: PAGE_PATH,
            name: "Juneau excursion decision paths",
            description:
              "DCC Juneau decision paths for helicopter, whale watching, Mendenhall, weather backup, and short port-call planning.",
            items: juneauDecisionCards.map((card) => ({
              name: card.title,
              url: card.cta_href,
              description: card.decision_reason,
            })),
          }),
        ],
      }}
    />
  );
}

function ProviderBadge({ type }: { type: JuneauProviderType }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${providerTone[type]}`}>
      {providerLabels[type]}
    </span>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/[0.18] p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/[0.38]">{label}</div>
      <div className="mt-1 text-sm font-black text-white">{value}</div>
    </div>
  );
}

function DecisionCard({ card, featured = false }: { card: JuneauDecisionCard; featured?: boolean }) {
  return (
    <article
      className={`rounded-[1.6rem] border p-5 shadow-[0_22px_70px_rgba(0,0,0,0.24)] ${
        featured
          ? "border-cyan-300/[0.24] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.15),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ProviderBadge type={card.provider_type} />
        <span className="rounded-full border border-white/10 bg-black/[0.22] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/[0.48]">
          {card.category}
        </span>
      </div>

      <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">{card.title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/[0.70]">{card.decision_reason}</p>

      {card.fallback_reason ? (
        <p className="mt-3 rounded-2xl border border-white/10 bg-black/[0.18] p-3 text-xs leading-6 text-white/[0.52]">
          {card.fallback_reason}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <InfoPill label="Cruise fit" value={card.cruise_safe} />
        <InfoPill label="Weather risk" value={card.weather_risk} />
        <InfoPill label="Ship return" value={card.return_to_ship_confidence} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {card.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/[0.56]">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-5 text-white/[0.42]">
          Prices, ratings, review counts, and live availability are shown only inside supported provider paths.
        </p>
        <Link
          href={card.cta_href}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-xs font-black uppercase tracking-[0.15em] text-[#06121d] transition hover:bg-cyan-200"
        >
          {card.cta_label}
        </Link>
      </div>
    </article>
  );
}

export default function JuneauCommercialHubPage() {
  const [primaryCard, ...secondaryCards] = juneauDecisionCards;

  return (
    <main className="min-h-screen overflow-hidden bg-[#041018] text-white">
      <JsonLdGraph />

      <section className="relative border-b border-white/10 bg-[radial-gradient(circle_at_20%_12%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_72%_18%,rgba(245,179,75,0.16),transparent_28%),linear-gradient(180deg,#06131e,#031018)]">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#041018] to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-20">
          <div className="flex flex-col justify-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-200">
              Juneau shore excursion command
            </p>
            <h1 className="mt-4 text-[clamp(3.2rem,8vw,6.8rem)] font-black uppercase leading-[0.86] tracking-[-0.06em]">
              Choose the Juneau move once.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/[0.76]">
              Start with the helicopter glacier lane when your port time, weather tolerance, and budget support it.
              Shift to whale watching, Mendenhall, or a short port-call plan only when the day actually needs it.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={juneauHelicopterHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06121d] transition hover:bg-cyan-200"
              >
                Open helicopter lane
              </Link>
              <Link
                href="/juneau/helicopter-vs-whale-watching"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] px-6 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.1]"
              >
                Compare helicopter vs whale
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {juneauTrustSignals.map((signal) => (
                <span key={signal} className="rounded-full border border-white/[0.12] bg-white/[0.05] px-4 py-2 text-xs font-bold text-white/[0.68]">
                  {signal}
                </span>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_28px_110px_rgba(0,0,0,0.42)] backdrop-blur-md">
            <div className="relative overflow-hidden rounded-[1.55rem] border border-cyan-200/[0.20] bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.22),transparent_34%),linear-gradient(180deg,rgba(11,28,42,0.96),rgba(4,12,20,0.98))] p-5">
              <div className="absolute -right-12 top-8 h-44 w-44 rounded-full border border-cyan-200/[0.20] bg-cyan-200/[0.10] blur-sm" />
              <div className="relative">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">Cruise/date planner shell</p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em]">
                  Port day first. Catalog second.
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/[0.68]">
                  This shell does not claim live availability. It preserves the date into the existing helicopter lane so supported provider paths can show real booking details.
                </p>

                <form action="/juneau/helicopter-tours" className="mt-5 grid gap-3">
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/[0.42]">Juneau port date</span>
                    <input
                      name="date"
                      type="date"
                      className="min-h-12 rounded-2xl border border-white/[0.12] bg-black/[0.26] px-4 text-sm text-white outline-none [color-scheme:dark]"
                    />
                  </label>
                  <input type="hidden" name="port" value="juneau" />
                  <input type="hidden" name="decision_corridor" value="alaska-juneau" />
                  <input type="hidden" name="sourcePage" value={PAGE_PATH} />
                  <button
                    type="submit"
                    className="min-h-12 rounded-full bg-[#f5b34b] px-5 text-xs font-black uppercase tracking-[0.16em] text-[#120f0b] transition hover:bg-[#ffd27a]"
                  >
                    Check the date-first lane
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f5b34b]">What should I book?</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em]">
              The default answer is helicopter, with a clean backup.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/[0.68]">
              Juneau is not a place where every visitor should browse forever. The best commercial path is to make the premium choice clear, then provide honest exits for weather, budget, comfort, and ship timing.
            </p>
            <div className="mt-5 rounded-2xl border border-cyan-300/[0.18] bg-cyan-300/[0.10] p-4 text-sm leading-7 text-cyan-50/[0.78]">
              Partner/direct execution comes first where supported. Viator and GetYourGuide remain fallback inventory, not owned execution proof.
            </div>
          </article>

          {primaryCard ? <DecisionCard card={primaryCard} featured /> : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">Decision paths</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em]">
              Change lanes only when the day requires it.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/[0.54]">
            Cards intentionally avoid invented pricing, reviews, guarantees, and live availability. Those details belong inside supported provider or partner surfaces.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {secondaryCards.map((card) => (
            <DecisionCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-12 lg:grid-cols-2">
        <article className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f5b34b]">Weather-aware fallback</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em]">Do not let flight weather restart the whole search.</h2>
          <p className="mt-4 text-sm leading-7 text-white/[0.68]">
            If the helicopter lane looks fragile, move to whale watching or a Mendenhall land plan instead of opening a generic excursion directory. The point is recovery speed, not more browsing.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/juneau/what-to-do-if-helicopter-tour-canceled" className="rounded-full border border-white/[0.12] bg-white/[0.05] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/[0.78]">
              Weather backup
            </Link>
            <Link href="/juneau/mendenhall" className="rounded-full border border-white/[0.12] bg-white/[0.05] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/[0.78]">
              Mendenhall plan
            </Link>
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">Short port-call block</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em]">When time is tight, timing beats spectacle.</h2>
          <p className="mt-4 text-sm leading-7 text-white/[0.68]">
            A short port call changes the answer. The best move is the option that leaves the cleanest ship-return margin, not necessarily the most dramatic listing.
          </p>
          <div className="mt-5">
            <Link href="/juneau/cruise-excursions-what-to-do" className="rounded-full border border-white/[0.12] bg-white/[0.05] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/[0.78]">
              Open port-day guide
            </Link>
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-[1.8rem] border border-white/10 bg-black/[0.24] p-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f5b34b]">FAQ and guide links</p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em]">Keep planning, but do not reopen the decision.</h2>
              <p className="mt-4 text-sm leading-7 text-white/[0.62]">
                Use these guides to confirm risk and fit. Once the fit is clear, continue into the relevant lane instead of comparing every marketplace card.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {juneauGuideLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-white/74 transition hover:border-cyan-200/[0.30] hover:bg-cyan-200/[0.10] hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs leading-6 text-white/48">
            Disclosure: DCC is the decision and routing layer. Booking, live availability, pricing, reviews, and provider terms continue inside the relevant partner, operator, or fallback marketplace path. Fallback marketplaces are not treated as owned execution.
          </div>
        </div>
      </section>
    </main>
  );
}
