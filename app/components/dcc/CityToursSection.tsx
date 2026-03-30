import Link from "next/link";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
import { getCategoriesManifest } from "@/lib/dcc/manifests/cityExpansion";
import { buildViatorSearchLink } from "@/utils/affiliateLinks";
import type { ViatorActionProduct } from "@/lib/dcc/action/viator";

type CityTourFallback = {
  title: string;
  query: string;
};

type CityToursSectionProps = {
  cityKey: string;
  cityName: string;
  products: ViatorActionProduct[];
  fallbacks: CityTourFallback[];
};

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "Check duration";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} hours`;
  return `${hours.toFixed(1)} hours`;
}

function formatPrice(price: number | null, currency: string): string {
  if (typeof price !== "number" || !Number.isFinite(price)) return "See live price";
  return `From ${currency} ${price}`;
}

export default function CityToursSection({
  cityKey,
  cityName,
  products,
  fallbacks,
}: CityToursSectionProps) {
  const hasLiveProducts = products.length > 0;
  const categoryGuides = (getCategoriesManifest(cityKey)?.categories || []).slice(0, 4);
  const cards =
    hasLiveProducts
      ? products.slice(0, 6).map((product) => ({
          key: product.product_code,
          title: product.title,
          rating:
            typeof product.rating === "number"
              ? `${product.rating.toFixed(1)}${typeof product.review_count === "number" ? ` (${product.review_count.toLocaleString()} reviews)` : ""}`
              : "Reviews on partner page",
          duration: formatDuration(product.duration_minutes),
          price: formatPrice(product.price_from, product.currency || "USD"),
          href: product.url,
          external: true,
        }))
      : fallbacks.slice(0, 6).map((item) => ({
          key: item.query,
          title: item.title,
          rating: "Live ratings on partner page",
          duration: "Check live duration",
          price: "See live price",
          href: buildViatorSearchLink(item.query),
          external: true,
        }));

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Guided Experiences</p>
          <h2 className="text-2xl font-bold md:text-3xl">Popular ways to experience {cityName}</h2>
          <p className="max-w-3xl text-zinc-300">
            Browse local tours and activities in {cityName}, then check live pricing and availability with a booking partner when you&apos;re ready.
          </p>
        </div>

        <PoweredByViator
          compact
          disclosure
          body={`DCC helps you compare travel-ready experiences in ${cityName}. Availability, live pricing, and checkout are provided by Viator.`}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-3 text-zinc-300">
            <span className="font-medium text-white">{cards.length} featured options</span>
            <span className="text-zinc-500">•</span>
            <span>{hasLiveProducts ? "Live inventory" : "Partner search shortcuts"}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Tours</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Activities</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Availability on partner page</span>
          </div>
        </div>

        {categoryGuides.length ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Category guides</p>
            <p className="mt-2 max-w-3xl text-sm text-zinc-300">
              These are stronger organic entry points than a generic city tour page because they line up with specific search intent.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryGuides.map((item) => (
                <Link
                  key={item.slug}
                  href={`/${cityKey}/${item.slug}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.14em] text-zinc-200 hover:bg-white/10"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.key}
              className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 transition-colors hover:bg-white/[0.08]"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {hasLiveProducts ? "Featured experience" : "Search partner page"}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">⭐ {card.rating}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{card.duration}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{card.price}</span>
                </div>

                <a
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="inline-flex w-full items-center justify-between rounded-2xl bg-cyan-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-cyan-500"
                >
                  <span>{hasLiveProducts ? "View experience" : "Check availability"}</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            href={`/${encodeURIComponent(cityKey)}/tours`}
            className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-200 hover:bg-emerald-500/20"
          >
            Browse More Tours
          </Link>
          <p className="text-sm text-zinc-400">
            Browse on DCC, availability and checkout via Viator.
          </p>
        </div>
      </div>
    </section>
  );
}
