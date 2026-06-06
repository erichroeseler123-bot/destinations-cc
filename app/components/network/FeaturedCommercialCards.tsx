import type { CommercialCardConfig } from "./types";
import { CommercialCard } from "./CommercialCard";

export function FeaturedCommercialCards({ cards }: { cards?: CommercialCardConfig[] }) {
  if (!cards?.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6" id="bookable-tours">
      <div className="mb-5">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--destination-accent-2)]">
          Featured tour moves
        </div>
        <h2 className="mt-3 text-3xl font-black uppercase leading-[0.98] tracking-normal text-[var(--network-text)] sm:text-4xl">
          Pick the best-fit tour path.
        </h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, index) => (
          <div key={card.id} className={index === 0 ? "xl:col-span-2" : ""}>
            <CommercialCard card={card} featured={index === 0} />
          </div>
        ))}
      </div>
    </section>
  );
}
