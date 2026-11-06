import type { Metadata } from "next";
import Link from "next/link";
import {
  ALL_WINTER_SAILING_PORT_SLUGS,
  evaluateWinterSailingPlan,
} from "@/lib/dcc/winterExcursionPlanner";
import WinterExcursionPlannerClient from "./WinterExcursionPlannerClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Winter Excursion Sailing Planner · Independence of the Seas (Jan 24, 2027) | Destination Command Center",
  description:
    "Shareable whole-sailing winter excursion planner driven by verified port calls (Nassau, San Juan, and St. Thomas on INDY-2027-01-24) with live-checked Viator options, tender/transfer math, and verified total party pricing.",
  alternates: {
    canonical: "/cruises/winter-excursion-planner",
  },
};

function firstString(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0];
  return typeof val === "string" ? val : undefined;
}

export default async function WinterExcursionPlannerPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = (await searchParams) || {};
  const planCode = firstString(resolved.plan)?.trim() || "INDY-2027-01-24";
  const shipName = firstString(resolved.ship);
  const sailDate = firstString(resolved.sailDate);
  const adultsRaw = Number(firstString(resolved.adults) || "2");
  const adults =
    Number.isFinite(adultsRaw) && adultsRaw >= 1 ? Math.floor(adultsRaw) : 2;

  const missingAllAboardRaw = firstString(resolved.missingAllAboard) || "";
  const missingAllAboardPorts = missingAllAboardRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const missingLastTenderRaw = firstString(resolved.missingLastTender) || "";
  const missingLastTenderPorts = missingLastTenderRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const savedPortOverrides: Record<string, string | null> = {};
  for (const [key, rawVal] of Object.entries(resolved)) {
    const val = firstString(rawVal);
    if (val === undefined) continue;
    if (key.startsWith("tour_")) {
      const portSlug = key.slice("tour_".length).trim().toLowerCase();
      if (portSlug) {
        savedPortOverrides[portSlug] = val.trim() === "none" ? null : val.trim();
      }
    }
  }
  for (const portSlug of ALL_WINTER_SAILING_PORT_SLUGS) {
    const val = firstString(resolved[`tour_${portSlug}`]);
    if (val !== undefined) {
      savedPortOverrides[portSlug] = val.trim() === "none" ? null : val.trim();
    }
  }
  const savedParam = firstString(resolved.saved) || firstString(resolved.addTour);
  if (savedParam) {
    for (const pair of savedParam.split(",")) {
      const trimmed = pair.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 0) {
        const p = trimmed.slice(0, colonIdx).trim().toLowerCase();
        const t = trimmed.slice(colonIdx + 1).trim();
        if (p && t) savedPortOverrides[p] = t;
      } else {
        savedPortOverrides["__unscoped_tour__"] = trimmed;
      }
    }
  }

  const isOrganizerShare =
    firstString(resolved.utm_source) === "cruise_organizer_share" ||
    firstString(resolved.isTest) === "0";

  const initialData = await evaluateWinterSailingPlan({
    planCode,
    shipName,
    sailDate,
    adults,
    surface: "cruisepromenade",
    enableShortlistLiveCheck: true,
    savedPortOverrides:
      Object.keys(savedPortOverrides).length > 0 ? savedPortOverrides : undefined,
    missingAllAboardPorts,
    missingLastTenderPorts,
    isTest: !isOrganizerShare,
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
              Winter Excursion Sailing Planner ({initialData.plan.planCode})
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
