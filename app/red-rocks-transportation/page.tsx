import type { Metadata } from "next";
import Link from "next/link";
import ParrCtaLink from "@/app/components/dcc/ParrCtaLink";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { getEdgeSignalMapForSubjects } from "@/lib/dcc/routing/edge-signals";
import {
  buildDccRedRocksSharedGoUrl,
  RED_ROCKS_SHARED_GO_PATH,
  RED_ROCKS_SHARED_SIGNAL_SUBJECT_IDS,
  resolveGoRedirect,
} from "@/lib/dcc/routing/middleware";
import { buildDecisionContinuationParams } from "@/lib/dcc/contracts/decisionContinuation";
import { mapDecisionToDestination } from "@/lib/dcc/mapping";

export const metadata: Metadata = {
  title: "Red Rocks Transportation — Solved | Easiest Way To Get There And Back",
  description:
    "Parking fills early, Uber gets brittle after the show, and the easiest Red Rocks move is usually to solve the ride before the night starts.",
  alternates: { canonical: "/red-rocks-transportation" },
  keywords: [
    "best way to get to red rocks",
    "red rocks transportation",
    "red rocks shuttle vs uber",
    "how to get back from red rocks",
    "red rocks parking vs shuttle",
  ],
  openGraph: {
    title: "Red Rocks Transportation — Solved | Easiest Way To Get There And Back",
    description:
      "If you want the easiest, most reliable Red Rocks ride plan, solve the ride before the show and stop improvising the way home.",
    url: "/red-rocks-transportation",
    type: "article",
  },
};

const PAGE_PATH = "/red-rocks-transportation";

function getFirstSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RedRocksTransportationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const baseRouteParams = {
    qty: getFirstSearchParam(sp.qty),
    partySize: getFirstSearchParam(sp.partySize),
    date: getFirstSearchParam(sp.date),
    event: getFirstSearchParam(sp.event),
    artist: getFirstSearchParam(sp.artist),
    venue: getFirstSearchParam(sp.venue),
    dcc_handoff_id: getFirstSearchParam(sp.dcc_handoff_id),
  };
  const sharedDecisionParams = buildDecisionContinuationParams({
    sourcePage: PAGE_PATH,
    corridor: "red-rocks-transport",
    cta: "entry-ready-primary",
    action: "book_shared_red_rocks_shuttle",
    option: "shuttle",
    product: "shared-red-rocks-shuttle-seat",
    entryMode: "dcc-first",
    destinationSurface: "flow",
  });
  const sharedBookingHref = buildDccRedRocksSharedGoUrl({
    sourcePage: PAGE_PATH,
    cta: "primary",
    ...sharedDecisionParams,
    ...baseRouteParams,
  });
  const signalMap = await getEdgeSignalMapForSubjects([...RED_ROCKS_SHARED_SIGNAL_SUBJECT_IDS]);
  const mappedReadyToAct = mapDecisionToDestination({
    sourcePage: PAGE_PATH,
    corridor: "red-rocks-transport",
    cta: "entry-ready-primary",
    action: "book_shared_red_rocks_shuttle",
    option: "shuttle",
    product: "shared-red-rocks-shuttle-seat",
    entryMode: "dcc-first",
    state: "chosen",
    destinationSurface: "operator",
  });
  const resolvedPrimary = resolveGoRedirect({
    pathname: RED_ROCKS_SHARED_GO_PATH,
    searchParams: new URLSearchParams(
      Object.entries({
        sourcePage: PAGE_PATH,
        cta: "primary",
        ...sharedDecisionParams,
        ...baseRouteParams,
      }).flatMap(([key, value]) =>
        typeof value === "string" && value.length > 0 ? [[key, value]] : []
      )
    ),
    signalMap,
  });
  const primaryCtaLabel = resolvedPrimary?.ctaText || "Book Your Guaranteed Ride Home";
  const urgencyCopy =
    resolvedPrimary?.status === "warning"
      ? "High-demand nights tighten shared inventory first. If the date is set, lock the ride in early."
      : resolvedPrimary?.status === "fallback"
        ? "Shared seats are not the cleanest live path right now, so availability may tighten or shift faster than usual."
        : "The cleanest nights are the ones where the ride home is solved before the show starts.";

  return (
    <RedRocksAuthorityPage
      eyebrow="Ride plan"
      title="Red Rocks transportation — solved"
      intro="Parking is limited. Uber works better getting there than leaving. If you want the easiest, most reliable way to get there and back without stress, solve the ride before the show and stop improvising the trip home."
      sourcePath={PAGE_PATH}
      primaryCtaHref={sharedBookingHref}
      primaryCtaLabel="See shuttle options"
      buyerIntentLabel="Red Rocks transportation"
      heroTrustBadges={[
        "Round-trip planned before the show",
        "No parking strategy required",
        "Built around the ride home",
      ]}
      heroSummaryCards={[
        {
          label: "What breaks",
          body: "Parking and the ride home cause most of the stress, not getting in.",
        },
        {
          label: "Best default",
          body: "For most visitors, shuttle is the easiest, most reliable move.",
        },
        {
          label: "Best fit",
          body: "Visitors staying in Denver who do not want to gamble on post-show pickup chaos.",
        },
      ]}
      hidePrimaryPathLinks
      hideSupportReading
      hideSimpleFunnel
      hideRecommendedFlow
      notice={
        <div className="space-y-6">
          <section className="rounded-[1.9rem] border border-[#3df3ff]/20 bg-[linear-gradient(180deg,rgba(16,33,43,0.96),rgba(7,15,21,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Choose your entry point</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Need help deciding, or already know you want the shuttle?</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb07c]">Still deciding</p>
                <p className="mt-3 text-sm leading-7 text-zinc-300">
                  Use a narrow feeder only when you need to eliminate one specific mistake first. Otherwise go straight into the main transportation lane.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link href="/red-rocks-shuttle" className="rounded-full border border-white/14 bg-white/6 px-4 py-2 font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10">
                    Shuttle fit
                  </Link>
                  <Link href="/red-rocks-parking" className="rounded-full border border-white/14 bg-white/6 px-4 py-2 font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10">
                    Parking reality
                  </Link>
                  <Link href="/command" className="rounded-full border border-white/14 bg-white/6 px-4 py-2 font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10">
                    Command view
                  </Link>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-cyan-300/20 bg-[#08141d] p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Ready to act</p>
                <p className="mt-3 text-sm leading-7 text-zinc-300">
                  If you already know you want the cleanest ride-home plan, skip the comparison step and go straight into shuttle availability.
                </p>
                <div className="mt-4">
                  <ParrCtaLink
                    href={mappedReadyToAct?.url || buildDccRedRocksSharedGoUrl({
                      sourcePage: PAGE_PATH,
                      cta: "entry-ready-primary",
                      ...sharedDecisionParams,
                      ...baseRouteParams,
                    })}
                    page={PAGE_PATH}
                    cta="entry-ready-primary"
                    mapperMeta={
                      mappedReadyToAct
                        ? {
                            corridor: "red-rocks-transport",
                            routeKey: mappedReadyToAct.routeKey,
                            provider: mappedReadyToAct.provider,
                            targetKind: mappedReadyToAct.targetKind,
                            operatorId: mappedReadyToAct.operatorId,
                          }
                        : undefined
                    }
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
                  >
                    {primaryCtaLabel}
                  </ParrCtaLink>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-[#3df3ff]/20 bg-[linear-gradient(180deg,rgba(16,33,43,0.96),rgba(7,15,21,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">What most people get wrong</p>
            <h2 className="mt-3 text-2xl font-bold text-white">The hard part is not getting there. It is ending the night cleanly when everyone tries to leave at once.</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Driving feels easier until parking pushes you farther out than expected and the exit drags. Uber can work on the way in, but the ride home is where that plan gets brittle. If you want the easiest option, take the shuttle and treat the return as solved.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#ffb07c]">{urgencyCopy}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Parking</div>
                <p className="mt-2 text-sm leading-6 text-zinc-300">Full control, but it often becomes a long uphill walk in and a slow crawl out.</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Uber / Lyft</div>
                <p className="mt-2 text-sm leading-6 text-zinc-300">Usually easier on the way in than the way out. Pickup friction hits after the encore.</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Shuttle (recommended)</div>
                <p className="mt-2 text-sm leading-6 text-zinc-300">Round-trip planned, no parking strategy, and no need to gamble on the ride home.</p>
              </div>
            </div>
          </section>
        </div>
      }
      sections={[
        {
          title: "Your options, simplified",
          body: "This is a friction decision, not a research project. Driving adds parking and exit stress. Uber is weakest after the show. Shuttle is the cleanest default when you want the whole night to feel easier.",
          bullets: [
            "Uber or Lyft: easiest to imagine, least reliable after the show.",
            "Driving yourself: workable only if you accept parking, walking, and a slower exit.",
            "Shuttle: recommended for the easiest reliable round trip.",
          ],
        },
        {
          title: "Why shuttle usually wins",
          body: "Most people choose shuttle because it solves the part of the night that breaks most often: the return. You are not paying for more theory. You are paying to avoid parking friction, surge pricing, long uphill walks, and the scramble that starts once the crowd moves at the same time.",
          bullets: [
            "Round-trip is planned before the show starts.",
            "No parking strategy or lot exit stress.",
            "No relying on spotty cell service and surge-priced pickup luck after the encore.",
          ],
        },
        {
          title: "If you still need help deciding",
          body: "Use the narrower decision pages when your question is more specific than transportation in general. They are built to answer one thing fast, not make you read a giant guide.",
          bullets: [
            "Use shuttle vs Uber if your real question is reliability.",
            "Use the exit page if your real question is leaving after the encore.",
            "Use the Denver page if you are starting from the city and want the cleanest default.",
          ],
        },
        {
          title: "If you already know you want the shuttle",
          body: "Skip the decision loop and go straight into availability. That is the right move when the recommendation is already clear in your head and you are ready to act.",
          bullets: [
            "Use the booking flow for live availability and pickup details.",
            "Treat the ride home as solved before the first song starts.",
            "Do not leave the return as a last-minute decision.",
          ],
        },
      ]}
    />
  );
}
