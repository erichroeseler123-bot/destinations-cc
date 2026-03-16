import { buildViatorSearchLink } from "@/utils/affiliateLinks";
import type { ViatorActionProduct } from "@/lib/dcc/action/viator";
import TravelerTakeaways from "@/app/components/dcc/TravelerTakeaways";
import { summarizeGuestFeedback } from "@/lib/dcc/guestFeedback";

type FallbackIntent = {
  label: string;
  query: string;
};

type CardLinkBuilder = (input: {
  href: string;
  intentQuery: string;
  categoryLabel?: string;
}) => string;

type ViatorTourGridProps = {
  placeName: string;
  title: string;
  description: string;
  products: ViatorActionProduct[];
  fallbacks: FallbackIntent[];
  ctaLabel?: string;
  linkBuilder?: CardLinkBuilder;
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

function formatConfirmationType(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value === "Instant Then Manual") return "Mixed confirmation";
  return value;
}

export default function ViatorTourGrid({
  placeName,
  title,
  description,
  products,
  fallbacks,
  ctaLabel = "Book with DCC via Viator",
  linkBuilder,
}: ViatorTourGridProps) {
  const cards =
    products.length > 0
      ? products.slice(0, 6).map((product) => ({
          key: product.product_code,
          title: product.title,
          shortDescription: product.short_description || null,
          imageUrl: product.image_url || null,
          rating:
            typeof product.rating === "number"
              ? `${product.rating.toFixed(1)}${typeof product.review_count === "number" ? ` (${product.review_count.toLocaleString()} reviews)` : ""}`
              : "Reviews on partner page",
          duration: formatDuration(product.duration_minutes),
          price: formatPrice(product.price_from, product.currency || "USD"),
          supplierName: product.supplier_name || null,
          itineraryType: product.itinerary_type || null,
          confirmationType: formatConfirmationType(product.booking_confirmation_type),
          productOptionCount: product.product_option_count ?? null,
          productOptionTitles: product.product_option_titles || null,
          href: product.url,
          intentQuery: `${placeName} ${product.title}`.trim(),
          categoryLabel: product.title,
          takeaways: summarizeGuestFeedback({
            title: product.title,
            description: product.short_description,
            durationMinutes: product.duration_minutes,
            rating: product.rating,
            reviewCount: product.review_count,
          }),
        }))
      : fallbacks.slice(0, 6).map((item) => ({
          key: item.query,
          title: item.label,
          shortDescription: null,
          imageUrl: null,
          rating: "Live ratings on partner page",
          duration: "Check live duration",
          price: "See live price",
          supplierName: null,
          itineraryType: null,
          confirmationType: null,
          productOptionCount: null,
          productOptionTitles: null,
          href: buildViatorSearchLink(item.query),
          intentQuery: item.query,
          categoryLabel: item.label,
          takeaways: null,
        }));

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)]">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Live Viator Picks</p>
          <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
          <p className="max-w-3xl text-zinc-300">{description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const href = linkBuilder
              ? linkBuilder({
                  href: card.href,
                  intentQuery: card.intentQuery,
                  categoryLabel: card.categoryLabel,
                })
              : card.href;

            return (
              <article
                key={card.key}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              >
                {card.imageUrl ? (
                  <div className="aspect-[4/3] w-full overflow-hidden border-b border-white/10">
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : null}
                <div className="space-y-3 p-5">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                    {card.shortDescription ? (
                      <p className="mt-2 text-sm text-zinc-300">{card.shortDescription}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-zinc-300">⭐ {card.rating}</p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
                    <span>{card.duration}</span>
                    <span>{card.price}</span>
                  </div>

                  {card.supplierName || card.itineraryType || card.confirmationType || card.productOptionCount ? (
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                      {card.supplierName ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                          {card.supplierName}
                        </span>
                      ) : null}
                      {card.itineraryType ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                          {card.itineraryType}
                        </span>
                      ) : null}
                      {card.confirmationType ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                          {card.confirmationType}
                        </span>
                      ) : null}
                      {card.productOptionCount && card.productOptionCount > 1 ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                          {card.productOptionCount} options
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {card.productOptionTitles && card.productOptionTitles.length > 0 ? (
                    <p className="text-xs leading-6 text-zinc-400">
                      Options: {card.productOptionTitles.slice(0, 2).join(" • ")}
                      {card.productOptionTitles.length > 2 ? " • more" : ""}
                    </p>
                  ) : null}

                  {card.takeaways ? <TravelerTakeaways summary={card.takeaways} compact /> : null}

                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer sponsored nofollow"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-500"
                  >
                    {ctaLabel}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
