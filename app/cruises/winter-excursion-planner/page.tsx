import type { Metadata } from "next";
import Link from "next/link";
import { evaluateWinterSailingPlan } from "@/lib/dcc/winterExcursionPlanner";
import WinterExcursionPlannerClient from "./WinterExcursionPlannerClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Five-Port Winter Excursion Planner · Independence of the Seas (Jan 24, 2027) | Destination Command Center",
  description:
    "Shareable whole-sailing winter excursion planner across Nassau, St. Thomas, Cozumel, Roatán, and Grand Cayman with live-checked Viator options, tender/transfer math, and verified total party pricing.",
  alternates: {
    canonical: "/cruises/winter-excursion-planner",
  },
};

export default async function WinterExcursionPlannerPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = (await searchParams) || {};
  const planCode =
    typeof resolved.plan === "string" && resolved.plan.trim()
      ? resolved.plan.trim()
      : "INDY-2027-01-24";
  const shipName = typeof resolved.ship === "string" ? resolved.ship : undefined;
  const sailDate =
    typeof resolved.sailDate === "string" ? resolved.sailDate : undefined;
  const adultsRaw =
    typeof resolved.adults === "string" ? Number(resolved.adults) : 2;
  const adults =
    Number.isFinite(adultsRaw) && adultsRaw >= 1 ? Math.floor(adultsRaw) : 2;

  const initialData = await evaluateWinterSailingPlan({
    planCode,
    shipName,
    sailDate,
    adults,
    surface: "cruisepromenade",
    enableShortlistLiveCheck: true,
    isTest: true,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/cruises" className="hover:text-cyan-300">
              Cruises
            </Link>
            <span>/</span>
            <Link href="/ports" className="hover:text-cyan-300">
              Ports
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-semibold">
              Five-Port Winter Excursion Planner
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/ports/nassau" className="text-cyan-300 hover:underline">
              Nassau Guide
            </Link>
            <Link href="/ports/st-thomas" className="text-cyan-300 hover:underline">
              St. Thomas Guide
            </Link>
            <Link href="/ports/cozumel" className="text-cyan-300 hover:underline">
              Cozumel Guide
            </Link>
            <Link href="/ports/roatan" className="text-cyan-300 hover:underline">
              Roatán Guide
            </Link>
            <Link href="/ports/grand-cayman" className="text-cyan-300 hover:underline">
              Grand Cayman Guide
            </Link>
          </div>
        </div>

        <WinterExcursionPlannerClient initialData={initialData} />
      </div>
    </main>
  );
}
