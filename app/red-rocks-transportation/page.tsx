import type { Metadata } from "next";
import ParrCtaLink from "@/app/components/dcc/ParrCtaLink";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { buildParrSharedRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

export const metadata: Metadata = {
  title: "Best Way to Get to Red Rocks | Shuttle vs Uber vs Parking",
  description:
    "For most people, the cleanest Red Rocks transport plan is to book the ride before the show and stop improvising the trip home.",
  alternates: { canonical: "/red-rocks-transportation" },
  keywords: [
    "best way to get to red rocks",
    "red rocks transportation",
    "red rocks shuttle vs uber",
    "how to get back from red rocks",
    "red rocks parking vs shuttle",
  ],
  openGraph: {
    title: "Best Way to Get to Red Rocks | Shuttle vs Uber vs Parking",
    description:
      "If you do not want to deal with parking, surge pricing, or post-show pickup chaos, this is the Red Rocks transport decision page.",
    url: "/red-rocks-transportation",
    type: "article",
  },
};

const PAGE_PATH = "/red-rocks-transportation";

export default function RedRocksTransportationPage() {
  const sharedBookingHref = buildParrSharedRedRocksUrl({
    sourcePage: PAGE_PATH,
    cta: "primary",
  });

  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Decision Hub"
      title="For most people, the easiest Red Rocks move is to solve the ride before the show and stop worrying about the trip home."
      intro="Red Rocks gets messy when transportation is left to chance. Parking can mean a long uphill walk and a slow crawl out. Uber can work on the way in, but the ride home is where people get stuck. If you want the cleanest default, pre-book the shuttle and treat the return as solved."
      sourcePath={PAGE_PATH}
      primaryCtaHref={sharedBookingHref}
      primaryCtaLabel="Book Your Guaranteed Ride Home"
      buyerIntentLabel="Best way to get to Red Rocks"
      notice={
        <section className="rounded-[1.9rem] border border-[#3df3ff]/20 bg-[linear-gradient(180deg,rgba(16,33,43,0.96),rgba(7,15,21,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Short answer</p>
          <h2 className="mt-3 text-2xl font-bold text-white">If you do not want to deal with parking, surge pricing, or waiting around after the show, pre-booking the shuttle is usually the cleanest answer.</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Driving only feels simpler until you hit traffic, park farther out than expected, and walk uphill in and out. Uber can work on the front half of the night, but the exit is where that plan gets brittle. Shuttle wins when the goal is fewer moving parts and a defined ride home.
          </p>
          <div className="mt-5">
            <ParrCtaLink
              href={buildParrSharedRedRocksUrl({
                sourcePage: PAGE_PATH,
                cta: "notice-primary",
              })}
              page={PAGE_PATH}
              cta="notice-primary"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Secure The Shuttle Plan
            </ParrCtaLink>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Parking reality</div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Parking often turns into a long uphill walk in and a slow crawl out.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Uber risk</div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Rideshare is the most brittle option after the show, especially on sold-out nights.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Best fit</div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Staying in Denver, visiting for the first time, or just want the night to feel easier.</p>
            </div>
          </div>
        </section>
      }
      sections={[
        {
          title: "The real comparison",
          body: "Most people are not deciding between four equal options. They are deciding how much friction they want to absorb. Shuttle is usually the best choice for a clean round trip. Driving works if you are willing to trade convenience for parking strategy and a slower exit. Uber is the most fragile option on the way home.",
          bullets: [
            "Shuttle: best for most visitors who want the easiest reliable path.",
            "Driving: workable only if you accept parking strategy, walking, and exit friction.",
            "Uber or Lyft: most fragile option after the show ends.",
          ],
        },
        {
          title: "Why transport is the hardest part of Red Rocks",
          body: "Red Rocks is easy when the show is the only thing you have to think about. It gets messy when transportation is improvised. The venue sits outside downtown, there is no simple late-night public-transit fallback, and thousands of people try to leave at once. That makes the return plan more important than people expect.",
          bullets: [
            "No simple public-transit fallback after the show.",
            "Post-show pickup congestion makes rideshare slower and more expensive.",
            "Parking can add walking time before and after the concert.",
          ],
        },
        {
          title: "Our recommendation",
          body: "For most people, the simplest move is to book the shuttle in advance and treat transportation as solved. The mistake is waiting until the night of the show and hoping the exit works itself out.",
          bullets: [
            "Choose shared shuttle if you want the easiest reliable path.",
            "Use the feeder pages if the real constraint is Uber risk, parking friction, or the exit plan.",
            "Do not leave the ride home as a last-minute decision.",
          ],
        },
      ]}
    />
  );
}
