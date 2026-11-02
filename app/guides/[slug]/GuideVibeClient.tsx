"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const VIBE_ORIGIN = "https://vibearoundtown.com";

function buildVibeReturnHref(searchParams: URLSearchParams) {
  const query = new URLSearchParams();
  for (const key of ["island", "cruiseCallId", "groupSize", "shipName"] as const) {
    const value = searchParams.get(key);
    if (value) query.set(key, value);
  }
  const suffix = query.toString();
  return suffix ? `${VIBE_ORIGIN}/search?${suffix}` : `${VIBE_ORIGIN}/`;
}

function buildVibeCarryQuery(searchParams: URLSearchParams) {
  const query = new URLSearchParams();
  query.set("from", "vibe");
  for (const key of ["island", "cruiseCallId", "groupSize", "shipName"] as const) {
    const value = searchParams.get(key);
    if (value) query.set(key, value);
  }
  return query.toString();
}

export function GuideVibeTopBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "vibe") return null;

  const returnToVibe = buildVibeReturnHref(searchParams);

  return (
    <section className="mb-10 rounded-3xl border border-emerald-900/70 bg-[#0d1815] p-5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
        Vibe Around research bridge
      </p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-white">
            You came here to answer one question, not restart the trip.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Your Vibe context is being carried through these research pages. When you have the answer, return to the matching driver search.
          </p>
        </div>
        <a
          href={returnToVibe}
          className="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200"
        >
          Back to Vibe drivers ↗
        </a>
      </div>
    </section>
  );
}

export function GuideVibeNextStep({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "vibe") {
    return <>{children}</>;
  }

  const returnToVibe = buildVibeReturnHref(searchParams);
  const carryQuery = buildVibeCarryQuery(searchParams);

  return (
    <section className="mt-14 rounded-3xl border border-emerald-900/70 bg-[#0d1815] p-7 sm:p-9">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
        Decision made?
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
        Go back to the people who can make the day happen.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
        DCC handled the research. Vibe Around handles the local-driver choice and reservation request.
      </p>
      <a
        href={returnToVibe}
        className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200"
      >
        I’m ready — show me local drivers ↗
      </a>
      <div className="mt-5">
        <Link
          href={`/vibe-around?${carryQuery}`}
          className="text-sm font-bold text-emerald-200 hover:text-white"
        >
          Back to the Vibe decision center
        </Link>
      </div>
    </section>
  );
}
