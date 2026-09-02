import type { Metadata } from "next";
import Link from "next/link";
import ParrCtaLink from "@/app/components/dcc/ParrCtaLink";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { buildParrPrivateRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

export const metadata: Metadata = {
  title: "Red Rocks Transportation — Private Ride From Denver | Party at Red Rocks",
  description:
    "Compare driving and rideshare with private Red Rocks transportation. Party at Red Rocks currently offers a $399 Private Suburban and $599 private van option.",
  alternates: { canonical: "/red-rocks-transportation" },
  keywords: [
    "best way to get to red rocks",
    "red rocks transportation",
    "private red rocks transportation",
    "red rocks shuttle vs uber",
    "how to get back from red rocks",
  ],
  openGraph: {
    title: "Red Rocks Transportation — Private Ride From Denver",
    description:
      "Solve the ride before show night with private Party at Red Rocks transportation for your group.",
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
  const privateBookingHref = buildParrPrivateRedRocksUrl({
    sourcePage: PAGE_PATH,
    cta: "primary",
    qty: getFirstSearchParam(sp.qty),
    partySize: getFirstSearchParam(sp.partySize),
    date: getFirstSearchParam(sp.date),
    event: getFirstSearchParam(sp.event),
    artist: getFirstSearchParam(sp.artist),
    venue: getFirstSearchParam(sp.venue) || "red-rocks-amphitheatre",
    dcc_handoff_id: getFirstSearchParam(sp.dcc_handoff_id),
    decision_option: "private",
    decision_product: "parr-private",
    requested_lane: "private",
    resolved_lane: "parr-private",
    product_slug: "parr-private",
  });

  return (
    <RedRocksAuthorityPage
      eyebrow="Private ride plan"
      title="Red Rocks transportation — solve the whole night before the show starts"
      intro="Driving means parking and exit traffic. Uber can be easy on the way in and unpredictable after the encore. Party at Red Rocks currently offers private transportation only, so your group can reserve one vehicle for the concert night and stop improvising the ride home."
      sourcePath={PAGE_PATH}
      primaryCtaHref={privateBookingHref}
      primaryCtaLabel="Reserve Private Transportation"
      buyerIntentLabel="Private Red Rocks transportation"
      heroTrustBadges={[
        "$399 Private Suburban",
        "$599 private van option",
        "One group, one vehicle, one plan",
      ]}
      heroSummaryCards={[
        {
          label: "Current service",
          body: "Party at Red Rocks offers private transportation only. There are no shared shuttle seats.",
        },
        {
          label: "Best for",
          body: "Groups that want the ride home decided before the venue empties out.",
        },
        {
          label: "Booking path",
          body: "DCC hands your concert context directly into the Party at Red Rocks private booking flow.",
        },
      ]}
      hidePrimaryPathLinks
      hideSimpleFunnel
      notice={
        <div className="space-y-6">
          <section className="rounded-[1.9rem] border border-[#3df3ff]/20 bg-[linear-gradient(180deg,rgba(16,33,43,0.96),rgba(7,15,21,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Current Party at Red Rocks offer</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Private transportation, not shared seats.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
              The standard option is a $399 Private Suburban. Larger groups can choose the $599 private van. The point is simple: your group has one ride plan for the full concert night.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ParrCtaLink
                href={privateBookingHref}
                page={PAGE_PATH}
                cta="notice-primary"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
              >
                Reserve Your Private Ride
              </ParrCtaLink>
              <Link
                href="/red-rocks-shuttle-vs-uber"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                Compare With Uber
              </Link>
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#ffb07c]">Why this can sell better</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Search intent</div>
                <p className="mt-2 text-sm leading-6 text-zinc-300">DCC answers parking, shuttle, rideshare, and exit questions before the visitor reaches the operator.</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Product clarity</div>
                <p className="mt-2 text-sm leading-6 text-zinc-300">The visitor sees the real private-only product and prices before clicking into booking.</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Context handoff</div>
                <p className="mt-2 text-sm leading-6 text-zinc-300">Artist, event, date, party size, and DCC attribution can continue into Party at Red Rocks.</p>
              </div>
            </div>
          </section>
        </div>
      }
      sections={[
        {
          title: "Your options, simplified",
          body: "This is a friction decision. Driving gives you control but adds parking and exit work. Rideshare is flexible but can be hardest after the show. A private vehicle is the pre-booked option for groups that want one plan for the night.",
          bullets: [
            "Driving: workable if you accept parking, walking, and a slower exit.",
            "Uber or Lyft: flexible, but the return can be the least predictable part of the night.",
            "Private Party at Red Rocks ride: one vehicle for your group, with the return planned in advance.",
          ],
        },
        {
          title: "What the private service costs",
          body: "Party at Red Rocks currently lists a $399 Private Suburban and a $599 private van option. These are private group services, not per-person shared shuttle seats.",
        },
        {
          title: "Why the ride home matters",
          body: "Red Rocks transportation looks easy until the concert ends and thousands of people move at once. The value of pre-booking is having the return already settled before that moment arrives.",
          bullets: [
            "No new transportation decision after the encore.",
            "Your group stays together.",
            "You avoid turning the end of the night into another search for a ride.",
          ],
        },
        {
          title: "Already know the date?",
          body: "Move straight to the private booking flow. DCC preserves the useful context it has so Party at Red Rocks can receive the customer closer to the transaction instead of making them restart their planning.",
        },
      ]}
    />
  );
}
