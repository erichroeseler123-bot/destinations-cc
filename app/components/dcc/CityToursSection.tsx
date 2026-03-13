import Link from "next/link";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
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
  const cards =
    products.length > 0
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
    <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)]">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Book Tours & Activities</p>
          <h2 className="text-2xl font-bold md:text-3xl">Book {cityName} tours on this page</h2>
          <p className="max-w-3xl text-zinc-300">
            Use DCC to discover the best things to do in {cityName}. When you&apos;re ready to book, complete your reservation securely via Viator.
          </p>
        </div>

        <PoweredByViator
          compact
          disclosure
          body={`DCC helps you find the right experiences faster in ${cityName}. When you're ready to book, you can book with DCC via Viator, a trusted tours and activities partner with secure checkout.`}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.key}
              className="rounded-2xl border border-white/10 bg-black/20 p-5"
            >
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">⭐ {card.rating}</p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
                  <span>{card.duration}</span>
                  <span>{card.price}</span>
                </div>

                <a
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-500"
                >
                  Book with DCC via Viator
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
            Browse All Tours
          </Link>
          <p className="text-sm text-zinc-400">
            Discovery on DCC, booking via Viator.
          </p>
        </div>
      </div>
    </section>
  );
}
