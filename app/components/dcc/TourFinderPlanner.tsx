"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { TourFinderResult, TourFinderSearchRequest } from "@/lib/tourFinder";

type DestinationOption = {
  routeSlug: string;
  cityName: string;
  state?: string;
};

const INTENT_OPTIONS = [
  { key: "concerts-nightlife", label: "Concerts & nightlife" },
  { key: "tours-sightseeing", label: "Tours & sightseeing" },
  { key: "adventure-excursions", label: "Adventure / excursions" },
  { key: "private-group-transport", label: "Private / group transport" },
] as const;

const GROUP_OPTIONS = [2, 4, 6, 8] as const;

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function TourFinderPlanner({
  destinationOptions,
  initialDestination = "Las Vegas",
  initialStartDate = "",
  initialEndDate = "",
  initialIntent = "tours-sightseeing",
  initialGroupSize = 2,
}: {
  destinationOptions: DestinationOption[];
  initialDestination?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialIntent?: (typeof INTENT_OPTIONS)[number]["key"];
  initialGroupSize?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [destination, setDestination] = useState(initialDestination);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [intent, setIntent] = useState<(typeof INTENT_OPTIONS)[number]["key"]>(initialIntent);
  const [groupSize, setGroupSize] = useState<number>(initialGroupSize);
  const [results, setResults] = useState<TourFinderResult[]>([]);
  const [resolvedDestination, setResolvedDestination] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const query = new URLSearchParams();
    if (destination.trim()) query.set("destination", destination.trim());
    if (startDate) query.set("startDate", startDate);
    if (endDate) query.set("endDate", endDate);
    if (intent) query.set("intent", intent);
    if (groupSize) query.set("groupSize", String(groupSize));
    router.replace(query.toString() ? `${pathname}?${query.toString()}` : pathname, { scroll: false });
  }, [destination, startDate, endDate, intent, groupSize, pathname, router]);

  async function runSearch(payload: TourFinderSearchRequest) {
    const response = await fetch("/api/internal/tour-finder/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      setResults([]);
      setResolvedDestination("");
      setError("No tour matches came back from the current destination and date combination.");
      return;
    }

    setResolvedDestination(data.destination?.cityName || payload.destination);
    setResults(data.results || []);
  }

  async function handleSearch() {
    setError("");
    startTransition(async () => {
      const payload: TourFinderSearchRequest = {
        destination,
        startDate,
        endDate: endDate || undefined,
        intent,
        groupSize,
      };
      await runSearch(payload);
    });
  }

  useEffect(() => {
    if (!initialStartDate || !initialDestination) return;
    const payload: TourFinderSearchRequest = {
      destination: initialDestination,
      startDate: initialStartDate,
      endDate: initialEndDate || undefined,
      intent: initialIntent,
      groupSize: initialGroupSize,
    };
    startTransition(async () => {
      await runSearch(payload);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary =
    startDate && resolvedDestination
      ? `${formatDate(startDate)}${endDate ? ` - ${formatDate(endDate)}` : ""} • ${resolvedDestination} • ${groupSize}${groupSize === 8 ? "+" : ""} people`
      : "";
  const bestMatch = results[0];
  const remainingResults = results.slice(1);

  function askHref(result: TourFinderResult) {
    const query = new URLSearchParams({
      subject: `Ask about this tour: ${result.title}`,
      topic: "tour-finder",
      destination: resolvedDestination || destination,
      item: result.title,
      detailUrl: result.detailUrl,
    });
    return `/contact?${query.toString()}`;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,198,108,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.08),transparent_24%),linear-gradient(180deg,rgba(17,18,24,0.96),rgba(7,8,12,0.98))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">
          <span aria-hidden="true">◎</span>
          Tour finder
        </div>
        <h1 className="mt-5 text-4xl font-black uppercase tracking-[-0.05em] text-white md:text-6xl">
          Find the best tours
          <span className="block text-[#f5c66c]">for your trip</span>
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
          Start with the destination, dates, trip intent, and group size. DCC ranks the strongest Viator-backed options
          instead of dumping a generic tours grid on you.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-black/25 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="text-cyan-300">◎</span>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Step 1</div>
                  <h2 className="text-xl font-bold text-white">Where are you going?</h2>
                </div>
              </div>
              <input
                list="tour-finder-destinations"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="mt-4 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/34"
                placeholder="Las Vegas, Seattle, Nashville"
              />
              <datalist id="tour-finder-destinations">
                {destinationOptions.map((option) => (
                  <option key={option.routeSlug} value={option.cityName} />
                ))}
              </datalist>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="text-cyan-300">◎</span>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Step 2</div>
                  <h2 className="text-xl font-bold text-white">When are you going?</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white"
                />
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="text-cyan-300">◎</span>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Step 3</div>
                  <h2 className="text-xl font-bold text-white">What do you want to do?</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {INTENT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setIntent(option.key)}
                    className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${
                      intent === option.key
                        ? "border-[#f5c66c]/30 bg-[#f5c66c]/10 text-white"
                        : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="text-cyan-300">◎</span>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Step 4</div>
                  <h2 className="text-xl font-bold text-white">How many people?</h2>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {GROUP_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGroupSize(value)}
                    className={`rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition ${
                      groupSize === value
                        ? "border-[#f5c66c]/30 bg-[#f5c66c]/10 text-white"
                        : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20"
                    }`}
                  >
                    {value === 8 ? "7+" : value}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={isPending || !destination.trim() || !startDate}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#f5c66c] px-6 text-sm font-black uppercase tracking-[0.14em] text-[#120f0b] transition hover:bg-[#ffd989] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="animate-pulse">…</span>
                  Checking available tours for your trip...
                </span>
              ) : (
                "Find Tours"
              )}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/25 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f5c66c]">Results</div>
          <h2 className="mt-3 text-2xl font-bold text-white">Available for your trip</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            {summary || "Pick the destination, dates, intent, and group size to get ranked tour options."}
          </p>

          {error ? <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}

          <div className="mt-6 space-y-4">
            {bestMatch ? (
              <article
                key={bestMatch.id}
                className="overflow-hidden rounded-[1.5rem] border border-[#f5c66c]/25 bg-[#f5c66c]/[0.06]"
              >
                {bestMatch.image ? (
                  <div className="aspect-[16/9] w-full overflow-hidden border-b border-white/10">
                    <img src={bestMatch.image} alt={bestMatch.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ) : null}
                <div className="space-y-4 p-5">
                  <div className="inline-flex rounded-full border border-[#f5c66c]/30 bg-[#f5c66c]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#fff0c4]">
                    Best match for your trip
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{bestMatch.title}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{bestMatch.location}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
                    {typeof bestMatch.priceFrom === "number" ? <span>From USD {bestMatch.priceFrom}</span> : null}
                    {bestMatch.duration ? <span>{bestMatch.duration}</span> : null}
                    <span>Check availability for your dates</span>
                    {typeof bestMatch.rating === "number" ? (
                      <span>
                        {bestMatch.rating.toFixed(1)}{typeof bestMatch.reviewCount === "number" ? ` • ${bestMatch.reviewCount.toLocaleString()} reviews` : ""}
                      </span>
                    ) : null}
                    {bestMatch.category ? <span>{bestMatch.category}</span> : null}
                  </div>
                  {bestMatch.whyItMatches?.length ? (
                    <ul className="space-y-2 text-sm text-zinc-200">
                      {bestMatch.whyItMatches.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Link
                      href={bestMatch.detailUrl}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500"
                    >
                      View Details
                    </Link>
                    {bestMatch.bookingUrl ? (
                      <a
                        href={bestMatch.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored nofollow"
                        className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-white hover:bg-white/[0.08]"
                      >
                        Check Availability
                      </a>
                    ) : null}
                    <Link
                      href={askHref(bestMatch)}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-white hover:bg-white/[0.08]"
                    >
                      Ask about this
                    </Link>
                  </div>
                </div>
              </article>
            ) : null}

            {remainingResults.map((result) => (
              <article
                key={result.id}
                className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04]"
              >
                {result.image ? (
                  <div className="aspect-[16/9] w-full overflow-hidden border-b border-white/10">
                    <img src={result.image} alt={result.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ) : null}
                <div className="space-y-4 p-5">
                  <div>
                    <h3 className="text-lg font-bold text-white">{result.title}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{result.location}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
                    {typeof result.priceFrom === "number" ? <span>From USD {result.priceFrom}</span> : null}
                    {result.duration ? <span>{result.duration}</span> : null}
                    <span>Check availability for your dates</span>
                    {typeof result.rating === "number" ? (
                      <span>
                        {result.rating.toFixed(1)}{typeof result.reviewCount === "number" ? ` • ${result.reviewCount.toLocaleString()} reviews` : ""}
                      </span>
                    ) : null}
                  </div>
                  {result.whyItMatches?.length ? (
                    <ul className="space-y-2 text-sm text-zinc-200">
                      {result.whyItMatches.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Link
                      href={result.detailUrl}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500"
                    >
                      View Details
                    </Link>
                    {result.bookingUrl ? (
                      <a
                        href={result.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored nofollow"
                        className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-white hover:bg-white/[0.08]"
                      >
                        Check Availability
                      </a>
                    ) : null}
                    <Link
                      href={askHref(result)}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-white hover:bg-white/[0.08]"
                    >
                      Ask about this
                    </Link>
                  </div>
                </div>
              </article>
            ))}

            {results.length === 0 && !isPending ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-5 text-sm text-zinc-300">
                <p className="font-semibold text-white">No clean match yet.</p>
                <p className="mt-2 text-zinc-400">
                  Broaden your dates, try a different intent, or open the main tours page for this destination.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setEndDate("")}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white"
                  >
                    Broaden dates
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntent("tours-sightseeing")}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white"
                  >
                    Try sightseeing
                  </button>
                  <Link
                    href={`/tours?city=${encodeURIComponent(resolvedDestination || destination)}`}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white"
                  >
                    View all tours
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
