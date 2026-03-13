import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import ArgoStatusPanel from "./ArgoStatusPanel";
import ArgoLaunchAlertForm from "@/components/ArgoLaunchAlertForm";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";

const PAGE_URL = "https://destinationcommandcenter.com/mighty-argo-shuttle";
const ATTRACTION_URL = "https://destinationcommandcenter.com/mighty-argo";

export const metadata: Metadata = {
  title: "Argo Mine Shuttle from Denver | Argo Cable Car Shuttle Tickets",
  description:
    "Book a shuttle to the Argo Mine and Argo Cable Car from Denver. Compare seat and private SUV options, pickup anchors, timing buffers, and day-plan logistics.",
  alternates: { canonical: "/mighty-argo-shuttle" },
  openGraph: {
    title: "Mighty Argo Cable Car Shuttle | Denver to Idaho Springs",
    description:
      "Mobile-first booking page for shuttle tickets to the Argo Mine and cable car, with clear pickup flow, prices, and timing guidance.",
    url: "/mighty-argo-shuttle",
    type: "website",
  },
};

const TRUST_BADGES = ["4.9/5 rider score", "500+ mountain rides", "Licensed and insured"];

const VALUE_POINTS = [
  { label: "Denver pickup", text: "Three fixed anchors for a cleaner day start." },
  { label: "Timed drop-off", text: "Built around check-in and buffer-first arrival." },
  { label: "Return after Argo", text: "Simple round-trip flow without I-70 fatigue." },
  { label: "Group-ready", text: "Private SUV option for families, gear, or weekend crews." },
];

const OFFER_CARDS = [
  {
    title: "Seat Shuttle",
    price: "$59",
    detail: "Round trip from Denver",
    bullets: ["Best for 1-4 riders", "Fixed pickup window", "Fastest booking path"],
    href: "/book?route=argo&product=argo-seat",
    cta: "Book Your Seat",
    tone: "light" as const,
  },
  {
    title: "Private SUV",
    price: "$499",
    detail: "Vehicle price for your group",
    bullets: ["Flexible departure feel", "Gear-friendly", "Best for groups and families"],
    href: "/book?route=argo&product=argo-suv",
    cta: "Book Private SUV",
    tone: "warm" as const,
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Book online",
    text: "Choose seat shuttle or private SUV and lock in your date first.",
  },
  {
    step: "2",
    title: "Meet at your pickup",
    text: "Show up at your selected Denver anchor with a clean buffer window.",
  },
  {
    step: "3",
    title: "Ride, explore, return",
    text: "Enjoy Argo without building the day around parking, traffic, or the drive back.",
  },
];

const PICKUP_ANCHORS = [
  {
    name: "Union Station",
    meet: "Meet 30 min before departure",
    note: "Best for visitors, downtown stays, and rail links.",
  },
  {
    name: "Cherry Creek",
    meet: "Meet 25 min before departure",
    note: "Easy in-and-out pickup for central Denver riders.",
  },
  {
    name: "Federal Center",
    meet: "Meet 20 min before departure",
    note: "Fast westbound exit for locals and west-side groups.",
  },
];

const PLANNER_NOTES = [
  "Build 30 to 40 minutes of check-in buffer into the day.",
  "Mountain weather shifts quickly, so layers still matter in warm months.",
  "Do not chain a tight lunch or dinner reservation immediately after the ride.",
  "Private SUV is the safer choice if your day includes kids, gear, or multiple stops.",
];

const SOCIAL_PROOF = [
  {
    score: "5.0/5",
    quote: "Pickup was easy, timing was clean, and we never felt rushed.",
    rider: "Family of 4 from Denver",
  },
  {
    score: "4.9/5",
    quote: "Seat option was the simplest way to do Argo without driving I-70.",
    rider: "No-car visitors",
  },
  {
    score: "5.0/5",
    quote: "Private SUV made the whole day feel organized instead of stressful.",
    rider: "Weekend group of 6",
  },
];

const FAQ = [
  {
    q: "Is the shuttle to the Argo Mine worth it?",
    a: "Yes, if you want a structured half-day mountain plan without I-70 driving fatigue. It works best when paired with a simple Idaho Springs stop instead of an overpacked day.",
  },
  {
    q: "What if weather is bad on cable car day?",
    a: "Keep flexibility in your plan. If weather degrades, pivot into Idaho Springs instead of treating the whole trip as lost.",
  },
  {
    q: "What should I wear for Argo day?",
    a: "Bring layers in every season. Idaho Springs and higher elevation areas can feel cooler than Denver and conditions can shift fast.",
  },
  {
    q: "When should I choose the SUV instead of seats?",
    a: "Choose the SUV when you want a simpler group day, need more gear space, or do not want the fixed rhythm of shared seats.",
  },
  {
    q: "Is this good for families or no-car visitors?",
    a: "Yes. That is one of the cleanest use cases for the route because it removes the drive and parking problem.",
  },
];

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": PAGE_URL,
        name: "Mighty Argo Cable Car Shuttle",
        url: PAGE_URL,
        description:
          "Shuttle booking page for Denver to Idaho Springs, focused on Argo Mine and Argo Cable Car transportation.",
      },
      {
        "@type": "Service",
        "@id": `${PAGE_URL}#shuttle-service`,
        name: "Shuttle to the Argo Mine and Argo Cable Car",
        serviceType: "Shuttle transport",
        areaServed: ["Denver, CO", "Idaho Springs, CO"],
        url: PAGE_URL,
        offers: [
          {
            "@type": "Offer",
            name: "Seat-based shuttle",
            price: "59",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `${PAGE_URL}#book`,
          },
          {
            "@type": "Offer",
            name: "Private SUV",
            price: "499",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `${PAGE_URL}#book`,
          },
        ],
      },
      {
        "@type": "TouristAttraction",
        "@id": `${ATTRACTION_URL}#attraction`,
        name: "Argo Mill and Tunnel",
        url: ATTRACTION_URL,
        description: "Historic Idaho Springs attraction with mine tours, cable car access, and mountain views.",
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-6">
      {eyebrow ? <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400">{eyebrow}</p> : null}
      <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function MightyArgoShuttlePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 pb-28 text-white md:pb-0">
      <JsonLd />
      <CinematicBackdrop variant="argo" />

      <section className="relative">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14">
          <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.24),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.84),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="max-w-4xl">
              <p className="dcc-hero-enter dcc-hero-enter-2 text-[11px] uppercase tracking-[0.28em] text-amber-200/80">
                Colorado Micro-Route
              </p>
              <div className="mt-3">
                <RouteHeroMark eyebrow="Destination Command Center" title="ARGO SHUTTLE ROUTE" tone="amber" />
              </div>
              <h1 className="dcc-hero-enter dcc-hero-enter-3 mt-5 text-[clamp(2.35rem,9vw,5.5rem)] font-black leading-[0.92] tracking-tight">
                Denver to Argo.
                <br />
                Clean ride, simple day.
              </h1>
              <p className="dcc-hero-enter dcc-hero-enter-4 mt-4 max-w-2xl text-base leading-7 text-zinc-200 sm:text-lg">
                Shuttle seats and private SUV options for Argo Mine and Argo Cable Car days, with fixed pickup anchors,
                clear timing, and less I-70 friction.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {TRUST_BADGES.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-zinc-100"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div id="book" className="dcc-cta-enter mt-7 grid gap-3 sm:grid-cols-2">
                {OFFER_CARDS.map((offer) => (
                  <Link
                    key={offer.title}
                    href={offer.href}
                    className={
                      offer.tone === "light"
                        ? "dcc-btn-sheen rounded-[24px] bg-white p-5 text-black shadow-[0_18px_50px_rgba(255,255,255,0.08)]"
                        : "rounded-[24px] border border-amber-300/30 bg-amber-400/12 p-5 text-white shadow-[0_18px_50px_rgba(249,115,22,0.15)]"
                    }
                  >
                    <p className={offer.tone === "light" ? "text-[11px] uppercase tracking-[0.22em] text-zinc-600" : "text-[11px] uppercase tracking-[0.22em] text-amber-200"}>
                      {offer.title}
                    </p>
                    <p className="mt-2 text-4xl font-black leading-none">{offer.price}</p>
                    <p className={offer.tone === "light" ? "mt-2 text-sm text-zinc-700" : "mt-2 text-sm text-zinc-100"}>
                      {offer.detail}
                    </p>
                    <ul className={offer.tone === "light" ? "mt-4 space-y-1 text-sm text-zinc-700" : "mt-4 space-y-1 text-sm text-zinc-200"}>
                      {offer.bullets.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                    <p className="mt-5 text-sm font-bold">{offer.cta} →</p>
                  </Link>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-zinc-100">
                Weekend morning departures usually fill first. Book early and keep a 30 to 40 minute arrival buffer.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl space-y-6 px-5 pb-14 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {VALUE_POINTS.map((item) => (
            <div key={item.label} className="rounded-[24px] border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-zinc-100">{item.text}</p>
            </div>
          ))}
        </div>

        <Section title="What Riders Like" eyebrow="Social Proof">
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
            {SOCIAL_PROOF.map((item) => (
              <article
                key={`${item.score}-${item.rider}`}
                className="min-w-[260px] snap-start rounded-[24px] border border-white/10 bg-black/25 p-5"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-300">{item.score}</p>
                <p className="mt-3 text-base leading-7 text-zinc-100">&quot;{item.quote}&quot;</p>
                <p className="mt-4 text-sm text-zinc-400">{item.rider}</p>
              </article>
            ))}
          </div>
        </Section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Section title="How It Works" eyebrow="Three Steps">
              <div className="grid gap-3">
                {HOW_IT_WORKS.map((item) => (
                  <div key={item.step} className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-lg font-black text-black">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-zinc-300">{item.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Pickup Anchors" eyebrow="Meet Points">
              <div className="grid gap-3 sm:grid-cols-3">
                {PICKUP_ANCHORS.map((anchor) => (
                  <article key={anchor.name} className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                    <h3 className="text-lg font-bold text-white">{anchor.name}</h3>
                    <p className="mt-2 text-sm font-semibold text-amber-200">{anchor.meet}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">{anchor.note}</p>
                  </article>
                ))}
              </div>
            </Section>

            <Section title="Plan the Day Like a Local" eyebrow="Logistics">
              <div className="grid gap-3">
                {PLANNER_NOTES.map((item) => (
                  <div key={item} className="rounded-[22px] border border-white/10 bg-black/25 p-4 text-sm leading-7 text-zinc-300">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link href="/mighty-argo" className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 font-semibold text-cyan-100 hover:bg-cyan-400/15">
                  Open Argo guide
                </Link>
                <Link href="/regions/colorado/idaho-springs" className="rounded-full border border-white/15 px-4 py-2 font-semibold text-zinc-100 hover:bg-white/10">
                  Idaho Springs link
                </Link>
                <Link href="/denver" className="rounded-full border border-white/15 px-4 py-2 font-semibold text-zinc-100 hover:bg-white/10">
                  Denver hub
                </Link>
              </div>
            </Section>

            <Section title="Quick Answers" eyebrow="FAQ">
              <div className="space-y-3">
                {FAQ.map((item) => (
                  <details key={item.q} className="group rounded-[24px] border border-white/10 bg-black/25 p-4">
                    <summary className="cursor-pointer list-none text-base font-bold text-white">
                      {item.q}
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-zinc-300">{item.a}</p>
                  </details>
                ))}
              </div>
            </Section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
            <Section title="Route Conditions" eyebrow="Before You Go">
              <p className="text-sm leading-7 text-zinc-300">
                Check the route panel before departure so timing expectations stay realistic.
              </p>
              <div className="mt-4">
                <ArgoStatusPanel />
              </div>
            </Section>

            <Section title="Not Ready to Book?" eyebrow="Launch Alert">
              <p className="text-sm leading-7 text-zinc-300">
                Join the alert list if your preferred departure is not open yet or if you want first notice when new inventory appears.
              </p>
              <div className="mt-4">
                <ArgoLaunchAlertForm source="mighty-argo-shuttle-redesign" compact />
              </div>
            </Section>

            <Section title="Related Routes" eyebrow="Keep Exploring">
              <div className="grid gap-3">
                <Link href="/mighty-argo" className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-4 text-sm font-semibold text-zinc-100 hover:bg-white/10">
                  Mighty Argo guide →
                </Link>
                <Link href="/alaska" className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-4 text-sm font-semibold text-zinc-100 hover:bg-white/10">
                  Alaska layer →
                </Link>
                <Link href="/cruises" className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-4 text-sm font-semibold text-zinc-100 hover:bg-white/10">
                  Cruises layer →
                </Link>
                <Link href="/national-parks" className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-4 text-sm font-semibold text-zinc-100 hover:bg-white/10">
                  National parks map →
                </Link>
              </div>
            </Section>
          </aside>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Link
            href="/book?route=argo&product=argo-seat"
            className="dcc-btn-sheen inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-black text-black"
          >
            Book Seat • $59
          </Link>
          <Link
            href="/book?route=argo&product=argo-suv"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-xs font-bold text-amber-100"
          >
            SUV $499
          </Link>
        </div>
      </div>
    </main>
  );
}
