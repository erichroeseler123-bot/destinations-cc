import type { Metadata } from "next";
import Link from "next/link";
import aliases from "@/data/city-aliases.json";
import cityIndex from "@/data/cities/index.json";
import portTourDestinations from "@/data/port-tour-destinations.json";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
import ToursSearchPanel from "@/app/components/dcc/ToursSearchPanel";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import { getGraphHealth } from "@/lib/dcc/graph/health";
import { listPlaceGraphSummaries } from "@/lib/dcc/graph/placeActionGraph";
import { normalizeSlug } from "@/lib/dcc/ids";
import { getNodeBySlugInClass } from "@/lib/dcc/registry";
import { resolveNode } from "@/lib/dcc/resolve";
import { serializeAliveFilter } from "@/lib/dcc/taxonomy/lanes";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import StatGrid from "@/app/components/StatGrid";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";
import { getViatorDestinationOptions } from "@/lib/viator/destinations";
import { getViatorFrontendCategoryTags } from "@/lib/viator/tags";
import { getViatorReviewContentNotice } from "@/lib/viator/reviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tours and Activities | Destination Command Center",
  description:
    "Discover tours, attractions, excursions, and activity planning with Destination Command Center, then continue into booking with trusted partners.",
  alternates: { canonical: "/tours" },
};

type ToursSearchParams = {
  city?: string;
  port?: string;
  q?: string;
  lane?: string;
  sort?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  minRating?: string;
  maxPrice?: string;
  maxDuration?: string;
  source_section?: string;
  intent_query?: string;
};

const CITY_ROUTE_KEYS = new Set(Object.keys(aliases));
const CITY_INDEX_BY_SLUG = new Map((cityIndex.cities || []).map((city) => [city.slug, city]));
const PORT_TOUR_DESTINATION_BY_SLUG = new Map(Object.entries(portTourDestinations || {}));
const FEATURED_TOUR_CATEGORIES = [
  { label: "Food Tours", query: "food tours", tone: "emerald" },
  { label: "Walking Tours", query: "walking tours", tone: "cyan" },
  { label: "Sightseeing Tours", query: "sightseeing tours", tone: "amber" },
  { label: "Day Trips", query: "day trips", tone: "emerald" },
  { label: "Private Tours", query: "private tours", tone: "cyan" },
  { label: "Night Tours", query: "night tours", tone: "amber" },
] as const;
const VIATOR_DESTINATION_OPTIONS = getViatorDestinationOptions();
const VIATOR_FRONTEND_TAGS = getViatorFrontendCategoryTags();

function stripStateSuffix(slug: string): string {
  return slug.replace(/-[a-z]{2}$/i, "");
}

function stripPortPrefix(slug: string): string {
  return slug.replace(/^port-?/i, "");
}

function toTitle(input: string): string {
  return input
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toPluralTours(label: string): string {
  if (label.endsWith(" tour")) return `${toTitle(label.slice(0, -5))} Tours`;
  if (label.endsWith(" tours")) return toTitle(label);
  return `${toTitle(label)} Tours`;
}

function resolveCityRouteSlug(input: string): string | null {
  const slug = normalizeSlug(input || "");
  if (!slug) return null;
  if (CITY_ROUTE_KEYS.has(slug)) return slug;

  const directPlace = getNodeBySlugInClass(slug, "place");
  const placeNode =
    directPlace ||
    (() => {
      const resolved = resolveNode(slug);
      return resolved?.class === "place" ? resolved : null;
    })();

  if (!placeNode) {
    const stripped = stripStateSuffix(slug);
    return CITY_ROUTE_KEYS.has(stripped) ? stripped : null;
  }

  const candidates = new Set<string>([
    placeNode.slug,
    stripStateSuffix(placeNode.slug),
    ...((placeNode.aliases || []).map((alias) => normalizeSlug(alias))),
    normalizeSlug(placeNode.display_name || placeNode.name || ""),
  ]);

  for (const candidate of candidates) {
    if (CITY_ROUTE_KEYS.has(candidate)) return candidate;
  }

  return null;
}

function resolvePortToCityRouteSlug(portInput: string): string | null {
  const slug = normalizeSlug(portInput || "");
  if (!slug) return null;
  const portNode =
    getNodeBySlugInClass(slug, "port") ||
    getNodeBySlugInClass(`port-${slug}`, "port") ||
    getNodeBySlugInClass(`port${slug}`, "port");
  if (!portNode) return null;

  const mappedDestination =
    PORT_TOUR_DESTINATION_BY_SLUG.get(portNode.slug) ||
    PORT_TOUR_DESTINATION_BY_SLUG.get(stripPortPrefix(portNode.slug));
  if (mappedDestination) {
    const mappedCityRoute = resolveCityRouteSlug(mappedDestination);
    if (mappedCityRoute) return mappedCityRoute;
  }

  const candidates = new Set<string>([
    portNode.slug,
    stripPortPrefix(portNode.slug),
    ...((portNode.aliases || []).map((alias) => normalizeSlug(alias))),
    normalizeSlug(portNode.display_name || portNode.name || ""),
    stripPortPrefix(normalizeSlug(portNode.display_name || portNode.name || "")),
  ]);

  for (const candidate of candidates) {
    const cityRoute = resolveCityRouteSlug(candidate);
    if (cityRoute) return cityRoute;
  }

  return null;
}

function getCityName(cityRouteSlug: string | null): string | null {
  if (!cityRouteSlug) return null;
  return CITY_INDEX_BY_SLUG.get(cityRouteSlug)?.name || toTitle(cityRouteSlug);
}

function tokenizeQuery(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function filterProductsByQuery(products: Awaited<ReturnType<typeof getViatorActionForPlace>>["products"], query: string) {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return products;

  const matches = products.filter((product) => {
    const haystack = [
      product.title,
      product.short_description || "",
      product.supplier_name || "",
      product.itinerary_type || "",
      product.booking_confirmation_type || "",
      ...(product.product_option_titles || []),
    ]
      .join(" ")
      .toLowerCase();
    return tokens.some((token) => haystack.includes(token));
  });

  return matches.length > 0 ? matches : products;
}

function sortProducts(
  products: Awaited<ReturnType<typeof getViatorActionForPlace>>["products"],
  sort: string
) {
  const rows = [...products];
  if (sort === "price-low") {
    return rows.sort((a, b) => (a.price_from ?? Number.MAX_SAFE_INTEGER) - (b.price_from ?? Number.MAX_SAFE_INTEGER));
  }
  if (sort === "price-high") {
    return rows.sort((a, b) => (b.price_from ?? -1) - (a.price_from ?? -1));
  }
  if (sort === "rating") {
    return rows.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || (b.review_count ?? -1) - (a.review_count ?? -1));
  }
  if (sort === "reviews") {
    return rows.sort((a, b) => (b.review_count ?? -1) - (a.review_count ?? -1) || (b.rating ?? -1) - (a.rating ?? -1));
  }
  if (sort === "duration-short") {
    return rows.sort((a, b) => (a.duration_minutes ?? Number.MAX_SAFE_INTEGER) - (b.duration_minutes ?? Number.MAX_SAFE_INTEGER));
  }
  return rows;
}

function filterProductsByTravelerControls(
  products: Awaited<ReturnType<typeof getViatorActionForPlace>>["products"],
  controls: { minRating: number | null; maxPrice: number | null; maxDuration: number | null }
) {
  return products.filter((product) => {
    if (controls.minRating !== null && (product.rating ?? -1) < controls.minRating) return false;
    if (controls.maxPrice !== null && typeof product.price_from === "number" && product.price_from > controls.maxPrice) return false;
    if (controls.maxDuration !== null && typeof product.duration_minutes === "number" && product.duration_minutes > controls.maxDuration) return false;
    return true;
  });
}

function buildTourContextSummary(input: {
  cityName: string | null;
  query: string | null;
  lane: string | null;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  sourceSection: string | null;
}) {
  const parts = [];
  if (input.cityName) parts.push(`Showing tours for ${input.cityName}.`);
  if (input.query) parts.push(`Search intent: ${input.query}.`);
  if (input.lane) parts.push(`Lane: ${input.lane}.`);
  if (input.currency) parts.push(`Pricing currency: ${input.currency}.`);
  if (input.startDate || input.endDate) {
    parts.push(`Travel window: ${input.startDate || "flexible"} to ${input.endDate || "flexible"}.`);
  }
  if (input.sourceSection) parts.push(`Source section: ${input.sourceSection}.`);
  return parts.join(" ");
}

function deriveResultsHeading(input: { cityName: string | null; query: string; lane: string | null }) {
  const trimmedQuery = input.query.trim();
  if (!trimmedQuery) {
    return input.cityName ? `Tours in ${input.cityName}` : "Tours";
  }

  const normalizedQuery = trimmedQuery.toLowerCase();
  const normalizedCity = (input.cityName || "").toLowerCase();
  let categoryPart = trimmedQuery;

  if (normalizedCity && normalizedQuery.includes(normalizedCity)) {
    const pattern = new RegExp(normalizedCity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
    categoryPart = trimmedQuery.replace(pattern, "").replace(/\s+/g, " ").trim();
  }

  if (!categoryPart && input.lane) {
    categoryPart = `${input.lane} tours`;
  }

  const readableCategory = categoryPart ? toPluralTours(categoryPart.toLowerCase()) : "Tours";
  if (input.cityName) return `${readableCategory} in ${input.cityName}`;
  return readableCategory;
}

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<ToursSearchParams>;
}) {
  const resolvedSearch = await searchParams;
  const portRouteSlug = resolvedSearch.port ? resolvePortToCityRouteSlug(resolvedSearch.port) : null;
  const cityRouteSlug = portRouteSlug || (resolvedSearch.city ? resolveCityRouteSlug(resolvedSearch.city) : null);
  const cityName = getCityName(cityRouteSlug);
  const query = (resolvedSearch.q || resolvedSearch.intent_query || "").trim();
  const sort = (resolvedSearch.sort || "recommended").trim().toLowerCase();
  const currency = String(resolvedSearch.currency || "USD").trim().toUpperCase() || "USD";
  const startDate = (resolvedSearch.startDate || "").trim() || null;
  const endDate = (resolvedSearch.endDate || "").trim() || null;
  const minRating = resolvedSearch.minRating ? Number(resolvedSearch.minRating) : null;
  const maxPrice = resolvedSearch.maxPrice ? Number(resolvedSearch.maxPrice) : null;
  const maxDuration = resolvedSearch.maxDuration ? Number(resolvedSearch.maxDuration) : null;
  const sourceSection = (resolvedSearch.source_section || "").trim() || null;
  const lane = (resolvedSearch.lane || "").trim() || null;

  const viatorAction = cityRouteSlug
      ? await getViatorActionForPlace({
        slug: cityRouteSlug,
        name: cityName || toTitle(cityRouteSlug),
        citySlug: cityRouteSlug,
        currency,
      })
    : null;

  const products = viatorAction
    ? sortProducts(
        filterProductsByTravelerControls(filterProductsByQuery(viatorAction.products, query), {
          minRating: Number.isFinite(minRating as number) ? minRating : null,
          maxPrice: Number.isFinite(maxPrice as number) ? maxPrice : null,
          maxDuration: Number.isFinite(maxDuration as number) ? maxDuration : null,
        }),
        sort
      )
    : [];
  const isResultsMode = Boolean(cityRouteSlug || query);
  const fallbackQueries = [
    query || null,
    cityName ? `${cityName} tours and activities` : null,
    cityName && lane ? `${cityName} ${lane} tours` : null,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ label: value, query: value }));

  const health = getGraphHealth();
  const rows =
    !isResultsMode
      ? listPlaceGraphSummaries(200)
          .filter((r) => r.action_counts.tours > 0)
          .sort((a, b) => {
            const scoreA = a.action_counts.tours + a.action_counts.cruises;
            const scoreB = b.action_counts.tours + b.action_counts.cruises;
            return scoreB - scoreA || a.title.localeCompare(b.title);
          })
          .slice(0, 48)
      : [];
  const featuredDestinations = (cityIndex.cities || [])
    .filter((city) => Array.isArray(city.modes) && city.modes.includes("tourism-heavy"))
    .slice(0, 12)
    .map((city) => ({
      slug: city.slug,
      name: city.name,
      state: city.state || "",
      prompt: `${city.name} tours`,
      modes: (city.modes || []).slice(0, 3),
    }));
  const compliantCategoryLabels = VIATOR_FRONTEND_TAGS.slice(0, 6).map((tag) => tag.label);
  const featuredViatorDestinationCount = VIATOR_DESTINATION_OPTIONS.length;

  const heading = isResultsMode
    ? deriveResultsHeading({ cityName, query, lane })
    : "Tours and activities";
  const description = isResultsMode
    ? cityName
      ? `Helpful guided experiences, excursions, and bookable tours in ${cityName}.`
      : "Helpful guided experiences and activity options based on your search."
    : "Browse destination-led tours, activity categories, and popular experience paths across the DCC network.";
  const tourContextSummary = buildTourContextSummary({
    cityName,
    query: query || null,
    lane,
    currency,
    startDate,
    endDate,
    sourceSection,
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <CinematicBackdrop />
      <div className="relative max-w-6xl mx-auto px-6 py-16 space-y-8">
      <header className="space-y-3 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.1),transparent_24%),linear-gradient(180deg,rgba(18,18,22,0.92),rgba(9,9,11,0.96))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.34)]">
        <RouteHeroMark eyebrow="Destination Command Center" title="TOURS" tone="cyan" />
        <p className="text-xs uppercase tracking-wider text-zinc-500">Things to do vertical</p>
        <h1 className="text-4xl font-black tracking-tight">{heading}</h1>
        <p className="text-zinc-300 max-w-3xl">{description}</p>
        <p className="max-w-3xl text-sm text-zinc-500">
          {SITE_IDENTITY.name} helps travelers find what is happening in a place and how to get there.
        </p>
        {tourContextSummary ? <p className="max-w-3xl text-sm text-zinc-400">{tourContextSummary}</p> : null}
        <p className="text-xs text-zinc-500">
          graph_places={health.places} • graph_edges={health.edges} • stale={health.stale ? "yes" : "no"}
        </p>
        <p className="max-w-3xl text-xs text-zinc-500">
          {getViatorReviewContentNotice()}
        </p>
        <PoweredByViator
          compact
          disclosure
          body="DCC helps you discover the right experience in the right destination context. When you're ready to book, you can book with DCC via Viator, a trusted global tours and activities partner with secure checkout and broad inventory."
        />
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href="/cities"
            className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
          >
            Browse destinations →
          </Link>
          {cityRouteSlug ? (
            <Link
              href={`/${cityRouteSlug}`}
              className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              Back to {cityName}
            </Link>
          ) : null}
          {!isResultsMode ? (
            <Link
              href="/ports"
              className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
            >
              Explore port tours →
            </Link>
          ) : null}
        </div>
      </header>

      <ToursSearchPanel
        title={cityName ? `${cityName} tours destination page` : "Search tours by destination"}
        description={
          cityName
            ? `Update destination, tour type, or sort order without leaving the results page. This is the main activity-search surface for ${cityName}.`
            : "Search by destination first, then narrow by activity type and sort order the way travelers expect on a things-to-do page."
        }
        defaultCity={cityName || cityRouteSlug || ""}
        defaultQuery={query}
        defaultSort={sort}
        defaultCurrency={currency}
        defaultStartDate={startDate || ""}
        defaultEndDate={endDate || ""}
        defaultMinRating={resolvedSearch.minRating || ""}
        defaultMaxPrice={resolvedSearch.maxPrice || ""}
        defaultMaxDuration={resolvedSearch.maxDuration || ""}
        sourceSection="tours-search-panel"
        suggestions={
          cityName
            ? [
                `${cityName} sightseeing tours`,
                `${cityName} food tours`,
                `${cityName} walking tours`,
                `${cityName} day trips`,
              ]
            : FEATURED_TOUR_CATEGORIES.map((item) => item.label)
        }
      />

      <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Trip Planning Snapshot</p>
          <h2 className="text-2xl font-bold">What this hub helps you decide quickly</h2>
          <p className="text-sm text-zinc-200">
            {isResultsMode
              ? "Which tours best match the destination, search intent, and activity style you are actually planning for."
              : "Where to start when you are browsing broadly for tours, attractions, excursions, and destination-led activity ideas."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Best for</p>
            <p className="mt-2 text-sm font-medium text-zinc-100">
              {isResultsMode
                ? "Travelers narrowing down activities, excursions, sightseeing, and bookable experiences by destination."
                : "Travelers comparing destinations, activity categories, and tour styles before drilling into a specific results page."}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Typical use</p>
            <p className="mt-2 text-sm font-medium text-zinc-100">
              {isResultsMode
                ? "Start here after a city, attraction, or port page sends you into a specific tours search or activity lane."
                : "Use this as the global starting point for tours when you know the type of experience you want but not yet the exact city page."}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Good companion pages</p>
            <p className="mt-2 text-sm font-medium text-zinc-100">
              Cities • Attractions • Ports • Alerts & Trends
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Tours snapshot</h2>
          <p className="text-sm text-zinc-400">
            A quick read on what this search is doing and whether you are in a destination-specific results state or the broader tours hub.
          </p>
        </div>
          <StatGrid
          items={[
            { label: "Destination", value: cityName || "All destinations" },
            { label: "Query intent", value: query || "Browse tours" },
            { label: "Matching products", value: products.length },
            { label: "Graph places", value: health.places },
          ]}
        />
        {isResultsMode && fallbackQueries.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {fallbackQueries.map((item) => (
              <span
                key={item.query}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300"
              >
                {item.label}
              </span>
            ))}
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">{currency}</span>
            {startDate ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">from {startDate}</span> : null}
            {endDate ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">to {endDate}</span> : null}
            {minRating ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">rating {minRating}+</span> : null}
            {maxPrice ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">under {currency} {maxPrice}</span> : null}
            {maxDuration ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">under {Math.round(maxDuration / 60)}h</span> : null}
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">
              review content non-indexed
            </span>
          </div>
        ) : null}
      </section>

      {isResultsMode ? (
        <>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Product preview</p>
                <p className="mt-2 text-sm text-zinc-200">Each card is intended to show title, image, description, reviews, and pricing before the Viator handoff.</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Sort order</p>
                <p className="mt-2 text-sm text-zinc-200">{sort.replace(/-/g, " ")}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Destination page</p>
                <p className="mt-2 text-sm text-zinc-200">{cityName || "Cross-destination search"}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Pricing currency</p>
                <p className="mt-2 text-sm text-zinc-200">{currency}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Travel window</p>
                <p className="mt-2 text-sm text-zinc-200">{startDate || endDate ? `${startDate || "Flexible"} → ${endDate || "Flexible"}` : "Flexible dates"}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Compliant categories</p>
                <p className="mt-2 text-sm text-zinc-200">{compliantCategoryLabels.slice(0, 3).join(" • ")}</p>
              </article>
            </div>
          </section>

          <ViatorTourGrid
            placeName={cityName || query || "Tours"}
            title={heading}
            description={description}
            products={products}
            fallbacks={fallbackQueries}
            ctaLabel="View experience"
          />
        </>
      ) : null}

      {!isResultsMode ? (
        <>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Featured Destinations</p>
              <h2 className="text-2xl font-bold">Browse tours by city</h2>
              <p className="text-sm text-zinc-400">
                Jump into destination-led tour discovery across the cities where travelers most often start planning.
              </p>
              <p className="text-xs text-zinc-500">
                Canonical Viator-linked destinations available in DCC: {featuredViatorDestinationCount}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredDestinations.map((city) => (
                <Link
                  key={city.slug}
                  href={`/tours?city=${encodeURIComponent(city.slug)}&q=${encodeURIComponent(city.prompt)}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/10"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {city.state || "Destination"} · Tours
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{city.name}</h3>
                  <p className="mt-2 text-sm text-zinc-300">
                    Start with city tours, sightseeing, and activity ideas that fit a broader trip plan.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {city.modes.map((mode) => (
                      <span
                        key={`${city.slug}-${mode}`}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-300"
                      >
                        {mode.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.16em] text-cyan-300">Open city tours →</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Popular Categories</p>
              <h2 className="text-2xl font-bold">Browse by tour type</h2>
              <p className="text-sm text-zinc-400">
                Use these paths when the experience type matters more than the destination.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {FEATURED_TOUR_CATEGORIES.map((category) => (
                <Link
                  key={category.query}
                  href={`/tours?q=${encodeURIComponent(category.query)}`}
                  className={`rounded-2xl p-5 transition ${
                    category.tone === "amber"
                      ? "border border-amber-400/20 bg-amber-500/10 hover:bg-amber-500/20"
                      : category.tone === "emerald"
                        ? "border border-emerald-400/20 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "border border-cyan-400/20 bg-cyan-500/10 hover:bg-cyan-500/20"
                  }`}
                >
                  <h3 className={`text-lg font-semibold ${
                    category.tone === "amber"
                      ? "text-amber-100"
                      : category.tone === "emerald"
                        ? "text-emerald-100"
                        : "text-cyan-100"
                  }`}>{category.label}</h3>
                  <p className="mt-2 text-sm text-zinc-300">
                    See destinations and booking paths that fit this kind of outing.
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-[0.16em] text-zinc-400">Browse category →</p>
                </Link>
              ))}
            </div>
          </section>

          {rows.length === 0 ? (
            <section className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-zinc-500">No graph-backed tours entries available yet.</p>
            </section>
          ) : (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Planning Paths</p>
                <h2 className="text-2xl font-bold">Graph-backed tour guides</h2>
                <p className="text-sm text-zinc-400">
                  Additional guide surfaces where DCC already sees tours or cruise-linked activity demand.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rows.slice(0, 12).map((row) => (
                  <Link
                    key={row.place_id}
                    href={`/nodes/${row.place_slug}?alive=${encodeURIComponent(serializeAliveFilter(["tours"]))}`}
                    className="rounded-xl border border-white/10 bg-black/20 hover:bg-white/10 transition p-4"
                  >
                    <div className="text-zinc-100 font-medium">{row.title}</div>
                    <div className="text-xs text-zinc-400 mt-1">
                      tours {row.action_counts.tours} • cruises {row.action_counts.cruises} • trend {row.trend}
                    </div>
                    <div className="text-xs text-cyan-300 mt-3">Open tour guide →</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/cities" className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 hover:bg-emerald-500/20">
          <div className="font-semibold text-emerald-100">Cities</div>
          <p className="mt-2 text-sm text-zinc-300">
            Move back into city discovery if you need destination context before narrowing down the right experience.
          </p>
        </Link>
        <Link href="/ports" className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 hover:bg-cyan-500/20">
          <div className="font-semibold text-cyan-100">Ports</div>
          <p className="mt-2 text-sm text-zinc-300">
            Jump into embarkation and shore-day planning when the activity question is tied to a cruise day.
          </p>
        </Link>
        <Link href="/alerts" className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 hover:bg-amber-500/20">
          <div className="font-semibold text-amber-100">Alerts & Trends</div>
          <p className="mt-2 text-sm text-zinc-300">
            Check current planning pressure before you book a weather-sensitive or timing-sensitive outing.
          </p>
        </Link>
      </section>
      </div>
    </main>
  );
}
