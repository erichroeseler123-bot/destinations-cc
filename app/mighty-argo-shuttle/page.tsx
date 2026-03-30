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
  title: "Shuttle to the Mighty Argo Cable Car | Denver Transport Options",
  description:
    "Plan a Denver to Idaho Springs Argo day with live route context, pickup anchors, timing buffers, and shuttle seat or private SUV options when the ride fits your outing.",
  alternates: { canonical: "/mighty-argo-shuttle" },
  openGraph: {
    title: "Shuttle to the Mighty Argo Cable Car | Denver to Idaho Springs",
    description:
      "Planning-first Argo shuttle page with route context, pickup flow, current conditions, and a clear transport option if the ride fits your day.",
    url: "/mighty-argo-shuttle",
    type: "website",
  },
};

const TRUST_BADGES = ["4.9/5 rider score", "500+ mountain rides", "Licensed and insured"];

const FIT_POINTS = [
  {
    label: "No-car day",
    text: "Strongest fit for visitors, airport arrivals, and anyone avoiding I-70 driving or parking.",
  },
  {
    label: "Buffer-first timing",
    text: "Best when you want clean pickup anchors and enough margin around check-in and return.",
  },
  {
    label: "Group simplicity",
    text: "Private SUV works better for families, gear, or days that feel messy in separate cars.",
  },
  {
    label: "Half-day mountain plan",
    text: "Works best when Argo is the centerpiece, not one stop inside an overpacked itinerary.",
  },
];

const VALUE_POINTS = [
  { label: "Denver pickup", text: "Three fixed anchors for a cleaner day start." },
  { label: "Timed drop-off", text: "Built around check-in and buffer-first arrival." },
  { label: "Return after Argo", text: "Simple round-trip flow without I-70 fatigue." },
  { label: "Group-ready", text: "Private SUV option for families, gear, or weekend crews." },
];

const OFFER_CARDS = [
  {
    title: "Seat Shuttle",
    price: "$35",
    detail: "Round trip from Denver",
    bullets: ["Best for 1-4 riders", "Fixed pickup window", "Simplest transport plan"],
    href: "/book?route=argo&product=argo-seat",
    cta: "Choose Seat Shuttle",
    tone: "light" as const,
  },
  {
    title: "Private SUV",
    price: "$200",
    detail: "Vehicle price for your group",
    bullets: ["Flexible departure feel", "Gear-friendly", "Best for groups and families"],
    href: "/book?route=argo&product=argo-suv",
    cta: "Choose Private SUV",
    tone: "warm" as const,
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Check fit first",
    text: "Use the route context, pickup anchors, and timing notes to decide whether shuttle is the cleanest way to do Argo that day.",
  },
  {
    step: "2",
    title: "Book the right ride",
    text: "Choose a shared seat for the simplest booking path or the SUV when your group needs more flexibility.",
  },
  {
    step: "3",
    title: "Ride, explore, return",
    text: "Show up at your pickup anchor, enjoy Argo, and head back without building the whole day around the drive.",
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
  {
    q: "Can I take the shuttle one way?",
    a: "No. This is a round-trip service. We do not offer ride-up-only bookings, and a later return would still be treated as a full round-trip booking.",
  },
  {
    q: "Can I Uber or Lyft back later?",
    a: "Ride share options are very limited at the site, especially later in the day. If you are not driving yourself, it is usually best to plan your return in advance instead of assuming a ride back will be easy.",
  },
];

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": PAGE_URL,
        name: "Shuttle to the Mighty Argo Cable Car",
        url: PAGE_URL,
        description:
          "Planning-first shuttle page for Denver to Idaho Springs, focused on Argo Mine and Argo Cable Car transportation.",
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
            price: "35",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `${PAGE_URL}#book`,
          },
          {
            "@type": "Offer",
            name: "Private SUV",
            price: "200",
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

function OfferCard({
  title,
  price,
  detail,
  bullets,
  href,
  cta,
  tone,
}: (typeof OFFER_CARDS)[number]) {
  return (
    <Link
      href={href}
      className={
        tone === "light"
          ? "dcc-btn-sheen rounded-[24px] bg-white p-5 text-black shadow-[0_18px_50px_rgba(255,255,255,0.08)]"
          : "rounded-[24px] border border-amber-300/30 bg-amber-400/12 p-5 text-white shadow-[0_18px_50px_rgba(249,115,22,0.15)]"
      }
    >
      <p
        className={
          tone === "light"
            ? "text-[11px] uppercase tracking-[0.22em] text-zinc-600"
            : "text-[11px] uppercase tracking-[0.22em] text-amber-200"
        }
      >
        {title}
      </p>
      <p className="mt-2 text-4xl font-black leading-none">{price}</p>
      <p className={tone === "light" ? "mt-2 text-sm text-zinc-700" : "mt-2 text-sm text-zinc-100"}>{detail}</p>
      <ul className={tone === "light" ? "mt-4 space-y-1 text-sm text-zinc-700" : "mt-4 space-y-1 text-sm text-zinc-200"}>
        {bullets.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
      <p className="mt-5 text-sm font-bold">{cta} →</p>
    </Link>
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
            <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
              <div className="max-w-4xl">
                <p className="dcc-hero-enter dcc-hero-enter-2 text-[11px] uppercase tracking-[0.28em] text-amber-200/80">
                  Colorado Micro-Route
                </p>
                <div className="mt-3">
                  <RouteHeroMark eyebrow="Destination Command Center" title="MIGHTY ARGO CABLE CAR" tone="amber" />
                </div>
                <h1 className="dcc-hero-enter dcc-hero-enter-3 mt-5 text-[clamp(2.35rem,9vw,5.5rem)] font-black leading-[0.92] tracking-tight">
                  Shuttle to the Mighty Argo Cable Car.
                </h1>
                <p className="dcc-hero-enter dcc-hero-enter-4 mt-4 max-w-2xl text-base leading-7 text-zinc-200 sm:text-lg">
                  Plan the outing first, then choose the transport option that fits your day. Use the route context, pickup anchors, and current conditions to decide whether shuttle is the cleanest way to get there from Denver.
                </p>
                <p className="mt-3 text-sm font-medium text-amber-100">Transport options from $35.</p>

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

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {FIT_POINTS.map((item) => (
                    <div key={item.label} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-200">{item.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  <Link
                    href="#book"
                    className="rounded-full border border-amber-300/25 bg-amber-400/12 px-4 py-2 font-semibold text-amber-100 hover:bg-amber-400/18"
                  >
                    Review shuttle options
                  </Link>
                  <Link
                    href="/mighty-argo"
                    className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 font-semibold text-cyan-100 hover:bg-cyan-400/15"
                  >
                    Open Argo guide
                  </Link>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Current Route Context</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Check the day before you lock the ride.</h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    Argo works best when weather, timing, and pickup expectations all line up. Start with the conditions snapshot, then use the shuttle only if it keeps the day simpler.
                  </p>
                  <div className="mt-4">
                    <ArgoStatusPanel />
                  </div>
                </div>

                <div id="book" className="rounded-[28px] border border-amber-300/20 bg-amber-400/10 p-5 shadow-[0_18px_50px_rgba(249,115,22,0.12)]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200">Transport Options</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">If the ride fits your plan, choose the right option.</h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-100">
                    Seat shuttle works best for straightforward Argo days. Private SUV is the better fit for groups, gear, or a more flexible rhythm.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {OFFER_CARDS.map((offer) => (
                      <OfferCard key={offer.title} {...offer} />
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-zinc-100">
                    Weekend morning departures usually fill first. Plan ahead and keep a 30 to 40 minute arrival buffer.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl space-y-6 px-5 pb-14 sm:px-6">
        <Section title="When the Shuttle Makes Sense" eyebrow="Fit Check">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {VALUE_POINTS.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-zinc-100">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Getting Back Matters" eyebrow="Return Planning">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <h3 className="text-lg font-bold text-white">Ride share is limited up there.</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                Uber and Lyft options are very limited at the site, especially later in the day. Many visitors find it difficult or expensive to get a ride back once they are up there.
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                If you are not driving yourself, it is usually best to plan your return in advance.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <h3 className="text-lg font-bold text-white">This is a round-trip service.</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                We do not offer one-way rides up only. If you take a shuttle up and later need a ride back, it would still be treated as a full round-trip booking.
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                That is why most visitors choose to plan both directions ahead of time.
              </p>
            </div>
          </div>
        </Section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Section title="How the Day Flows" eyebrow="Three Steps">
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
            <Section title="What Riders Like" eyebrow="Social Proof">
              <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 lg:block lg:space-y-3 lg:overflow-visible lg:px-0 lg:pb-0">
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
            Seat Shuttle • $35
          </Link>
          <Link
            href="/book?route=argo&product=argo-suv"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-xs font-bold text-amber-100"
          >
            Private SUV • $200
          </Link>
        </div>
      </div>
    </main>
  );
}
