import Link from "next/link";
import PageIntentRouter from "@/app/components/dcc/PageIntentRouter";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import WeatherPanel from "@/app/components/dcc/WeatherPanel";
import type { ViatorActionProduct } from "@/lib/dcc/action/viator";
import { getAttractionsManifest, getCategoriesManifest } from "@/lib/dcc/manifests/cityExpansion";
import { type DccPageIntent, type DccRouteOption } from "@/lib/dcc/pageIntents";
import { buildCategoryNarrative, buildLongTailKeywords } from "@/lib/dcc/seoCopy";

type TourCategoryGuidePageProps = {
  cityName: string;
  citySlug: string;
  title: string;
  description: string;
  intro: string;
  bullets: readonly string[];
  intents: ReadonlyArray<{ label: string; query: string; description: string }>;
  inventoryTitle?: string;
  filterTokens?: readonly string[];
  products: ViatorActionProduct[];
  weather?: {
    locationLabel: string;
    lat: number;
    lng: number;
  } | null;
  heroImage?: {
    src: string;
    alt: string;
  } | null;
  pageIntent?: DccPageIntent;
  routerTitle?: string;
  routerSummary?: string;
  routerOptions?: readonly DccRouteOption[];
};

function normalizeTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function filterProductsForCategory(
  products: ViatorActionProduct[],
  title: string,
  intents: ReadonlyArray<{ label: string; query: string; description: string }>,
  cityName: string,
  filterTokens: readonly string[] = []
): ViatorActionProduct[] {
  const stopwords = new Set([
    ...normalizeTokens(cityName),
    "tour",
    "tours",
    "new",
    "orleans",
    "las",
    "vegas",
    "boston",
    "show",
    "shows",
    "trip",
    "trips",
    "day",
    "best",
    "top",
    "the",
    "and",
    "for",
    "with",
    "from",
    "guide",
  ]);
  const explicitTokens = filterTokens
    .flatMap((token) => normalizeTokens(token))
    .filter((token) => token.length > 2 && !stopwords.has(token));

  const priorityTokens = new Set(
    (explicitTokens.length > 0 ? explicitTokens : normalizeTokens(title)).filter(
      (token) => token.length > 2 && !stopwords.has(token)
    )
  );

  const categoryTokens = Array.from(
    new Set(
      [title, ...filterTokens, ...intents.map((item) => `${item.label} ${item.query}`)]
        .flatMap((value) => normalizeTokens(value))
        .filter((token) => token.length > 2 && !stopwords.has(token))
    )
  );

  if (categoryTokens.length === 0) return products;

  const scored = products
    .map((product) => {
      const haystack = normalizeTokens(
        [
          product.title,
          product.short_description || "",
          product.supplier_name || "",
          ...(product.product_option_titles || []),
        ].join(" ")
      );
      const haystackSet = new Set(haystack);
      const score = categoryTokens.reduce(
        (sum, token) => sum + (haystackSet.has(token) ? 1 : 0),
        0
      );
      const priorityHits = Array.from(priorityTokens).filter((token) => haystackSet.has(token));
      return { product, score, priorityHits };
    })
    .filter((item) => item.score > 0 && item.priorityHits.length > 0)
    .sort((a, b) => b.priorityHits.length - a.priorityHits.length || b.score - a.score);

  return scored.length > 0 ? scored.map((item) => item.product) : [];
}

export default function TourCategoryGuidePage({
  cityName,
  citySlug,
  title,
  description,
  intro,
  bullets,
  intents,
  inventoryTitle,
  filterTokens,
  products,
  weather,
  heroImage,
  pageIntent = "compare",
  routerTitle,
  routerSummary,
  routerOptions,
}: TourCategoryGuidePageProps) {
  const relatedCategories = (getCategoriesManifest(citySlug)?.categories || [])
    .filter((item) => item.title !== title)
    .slice(0, 4);
  const relatedAttractions = (getAttractionsManifest(citySlug)?.attractions || []).slice(0, 4);
  const filteredProducts = filterProductsForCategory(products, title, intents, cityName, filterTokens);
  const searchPhrases = buildLongTailKeywords(
    cityName,
    title,
    relatedCategories.slice(0, 2).map((item) => item.title.toLowerCase())
  );
  const defaultRouterOptions: DccRouteOption[] = [
    {
      title: `Compare live ${title.replace(new RegExp(`^${cityName}\\s+`, "i"), "").trim().toLowerCase()}`,
      description: filteredProducts.length > 0
        ? "Stay on this page and use the matched live inventory first if you are already in compare mode."
        : "Use the category inventory block first to see the closest live matches or fallback searches."
      ,
      href: "#live-inventory",
      kind: "internal",
      emphasis: "primary",
    },
    {
      title: `Browse all ${cityName} tours`,
      description: "Broaden out if this category is too narrow and you need the wider tour set.",
      href: `/${citySlug}/tours`,
      kind: "internal",
    },
    {
      title: relatedCategories[0] ? `Compare ${relatedCategories[0].title.toLowerCase()}` : `Explore ${cityName} attractions`,
      description: relatedCategories[0]
        ? `Use the adjacent category if your real question is whether this is the right tour type at all.`
        : `Move into attraction context if you are drifting out of compare mode and back into exploration.`,
      href: relatedCategories[0] ? `/${citySlug}/${relatedCategories[0].slug}` : `/${citySlug}/attractions`,
      kind: "internal",
    },
    {
      title: `Go back to ${cityName}`,
      description: "Use the city authority page if you need broader context before choosing any specific category.",
      href: `/${citySlug}`,
      kind: "internal",
    },
  ];

  return (
    <main className="min-h-screen bg-[#050816] text-white" data-page-intent={pageIntent}>
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.10),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,11,25,0.98))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          {heroImage ? (
            <>
              <div className="absolute inset-0">
                <img
                  src={heroImage.src}
                  alt={heroImage.alt}
                  className="h-full w-full object-cover opacity-30"
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.30),rgba(5,8,22,0.88))]" />
            </>
          ) : null}
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-[#ffb07c]">{cityName} tour guide</p>
              <div className="rounded-full border border-cyan-300/20 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
                Intent: {pageIntent}
              </div>
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">{description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/${citySlug}/tours`} className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
                Browse more tours
              </Link>
              <Link href={`/${citySlug}`} className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
                Back to {cityName}
              </Link>
            </div>
            {weather ? (
              <div className="mt-6 max-w-sm">
                <WeatherPanel locationLabel={weather.locationLabel} lat={weather.lat} lng={weather.lng} />
              </div>
            ) : null}
          </div>
        </header>

        <section id="live-inventory">
          <ViatorTourGrid
            placeName={`${cityName} ${title}`}
            title={
              inventoryTitle || `Top ${title.replace(new RegExp(`^${cityName}\\s+`, "i"), "").trim()} Right Now`
            }
            description={
              filteredProducts.length > 0
                ? "These are the most relevant live tour options we could match to this specific category, surfaced before the planning copy because that is usually the user intent."
                : "Live category-matched inventory is thin right now, so these fallback searches keep the page useful without pretending unrelated products belong here."
            }
            products={filteredProducts}
            fallbacks={intents.map((item) => ({ label: item.label, query: item.query }))}
            ctaLabel="View live options"
          />
        </section>

        <PageIntentRouter
          intent={pageIntent}
          title={routerTitle || `What is the best next step after ${title.toLowerCase()}?`}
          summary={routerSummary || `This page should help visitors either stay in compare mode, broaden back to city tours, or move into city context without hitting a dead end.`}
          options={routerOptions || defaultRouterOptions}
        />

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Overview</p>
            <h2 className="mt-2 text-3xl font-bold">How this category fits a trip</h2>
            <p className="mt-4 text-base leading-8 text-white/78">{intro}</p>
            <p className="mt-4 text-sm leading-7 text-white/68">
              Searchers landing here usually want a narrower answer than a general &quot;{cityName} tours&quot; page. Keeping this page focused on {title.toLowerCase()} in {cityName} gives Google a cleaner match for that intent.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/62">{buildCategoryNarrative(cityName, title)}</p>
          </article>
          <aside className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Good to know</p>
            <div className="mt-4 space-y-3">
              {bullets.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/74">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Types of tours</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {intents.map((item) => (
              <article key={item.query} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-semibold text-white">{item.label}</h3>
                <p className="mt-3 text-sm leading-7 text-white/74">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Related tour guides</p>
            <h2 className="mt-2 text-3xl font-bold">Keep the search specific</h2>
            <p className="mt-4 text-sm leading-7 text-white/74">
              Internal links between category pages help search engines understand the wider {cityName} experience cluster while still preserving a clear page-level topic.
            </p>
            <div className="mt-5 grid gap-3">
              <Link href={`/${citySlug}/tours`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/82 hover:bg-white/10">
                All {cityName} tours
              </Link>
              {relatedCategories.map((item) => (
                <Link key={item.slug} href={`/${citySlug}/${item.slug}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/82 hover:bg-white/10">
                  {item.title} in {cityName}
                </Link>
              ))}
            </div>
            {searchPhrases.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {searchPhrases.map((phrase) => (
                  <span key={phrase} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
                    {phrase}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Nearby attractions</p>
            <h2 className="mt-2 text-3xl font-bold">Connect the tour type to real places</h2>
            <p className="mt-4 text-sm leading-7 text-white/74">
              Category pages work better when they point into named attractions, landmarks, and districts that travelers also search for directly.
            </p>
            <div className="mt-5 grid gap-3">
              <Link href={`/${citySlug}/attractions`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/82 hover:bg-white/10">
                {cityName} attractions
              </Link>
              {relatedAttractions.map((item) => (
                <Link key={item.slug} href={`/${citySlug}/${item.slug}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/82 hover:bg-white/10">
                  {item.name}
                </Link>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
