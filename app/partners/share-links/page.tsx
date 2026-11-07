import type { Metadata } from "next";
import Link from "next/link";
import PartnerSharePlanningBar from "@/app/components/dcc/PartnerSharePlanningBar";

export const metadata: Metadata = {
  title:
    "Partner Shareable Planning Links | Hotel Concierges, Cruise Planners & Flight Operators | DCC",
  description:
    "Shareable Destination Command Center (DCC) planning links for hotel concierges, cruise planners, and flight operators across New Orleans, Juneau, Red Rocks, and Colorado mountain travel.",
  alternates: { canonical: "/partners/share-links" },
};

export const dynamic = "force-dynamic";

export default async function PartnerShareLinksPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  return (
    <main className="min-h-screen bg-[#060912] px-6 py-12 text-white md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[2rem] border border-indigo-400/30 bg-[#0b1120] p-8 md:p-10 space-y-4 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">
            Destination Command Center · Partner Referral Network
          </p>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Shareable DCC Planning Links for Hotel Concierges, Cruise Planners &amp; Flight Operators
          </h1>
          <p className="max-w-3xl text-base leading-7 text-white/80">
            Each link opens a direct, verified answer for your guest — such as which New Orleans swamp tour includes French Quarter hotel pickup, which Juneau excursion fits a short CLAA port call, what to do when a Juneau helicopter flight is canceled for low ceilings, or how to get back from Red Rocks and across I-70 — and attributes every visit, storefront referral, and confirmed booking to your partner ID.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-xs font-bold">
            <Link
              href="/new-orleans/tours?partner=nola-cruise-planner&partner_role=cruise_planner&src=dcc-partner-cruise-planner:nola-cruise-planner"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
            >
              New Orleans Partner Guide →
            </Link>
            <Link
              href="/juneau/cruise-excursions-what-to-do?partner=alaska-cruise-planner&partner_role=cruise_planner&src=dcc-partner-cruise-planner:alaska-cruise-planner"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
            >
              Juneau Short Port-Call Guide →
            </Link>
            <Link
              href="/juneau/what-to-do-if-helicopter-tour-canceled?partner=juneau-heli-dispatch&partner_role=flight_operator&flight_canceled=1&cancel_ref=wx-ceiling-hold&src=dcc-partner-flight-operator:juneau-heli-dispatch"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
            >
              Juneau Flight-Canceled Backup Guide →
            </Link>
            <Link
              href="/red-rocks-transportation?partner=denver-hotel-concierge&partner_role=hotel_concierge&src=dcc-partner-hotel-concierge:denver-hotel-concierge"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
            >
              Red Rocks Concierge Guide →
            </Link>
            <Link
              href="/transportation/colorado?partner=colorado-lodge-concierge&partner_role=hotel_concierge&src=dcc-partner-hotel-concierge:colorado-lodge-concierge"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
            >
              Colorado I-70 Concierge Guide →
            </Link>
          </div>
        </header>

        <PartnerSharePlanningBar
          activePartnerParam={firstStr(sp.partner)}
          activePartnerRoleParam={firstStr(sp.partner_role)}
          activeCancelRefParam={firstStr(sp.cancel_ref)}
          activeTrafficSourceParam={firstStr(sp.src)}
        />
      </div>
    </main>
  );
}
