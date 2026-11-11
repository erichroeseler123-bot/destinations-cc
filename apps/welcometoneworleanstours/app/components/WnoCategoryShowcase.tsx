"use client";

import { useState } from "react";
import Link from "next/link";

export type WnoCategoryKey =
  | "all"
  | "swamp"
  | "french-quarter"
  | "food"
  | "music"
  | "history";

export interface WnoHomeTourCard {
  id: string;
  categoryKey: Exclude<WnoCategoryKey, "all">;
  whatItIs: string;
  title: string;
  whereItGoes: string;
  availability: string;
  duration: string;
  pickupLocation: string;
  pickupBadge: string;
  price: string;
  priceSub: string;
  scheduleFit: string;
  checkoutProcessor: string;
  imageSrc: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  isExternal: boolean;
}

const CATEGORIES: { key: WnoCategoryKey; label: string }[] = [
  { key: "all", label: "All Featured" },
  { key: "swamp", label: "Swamp Tours" },
  { key: "french-quarter", label: "French Quarter" },
  { key: "food", label: "Food & Cocktails" },
  { key: "music", label: "Jazz & Music" },
  { key: "history", label: "History & Plantations" },
];

export default function WnoCategoryShowcase({
  tours,
}: {
  tours: WnoHomeTourCard[];
}) {
  const [activeCategory, setActiveCategory] = useState<WnoCategoryKey>("all");

  const visibleTours =
    activeCategory === "all"
      ? tours
      : tours.filter((t) => t.categoryKey === activeCategory);

  return (
    <div>
      <div
        className="wno-cat-tabs"
        role="tablist"
        aria-label="Filter New Orleans tours by category"
      >
        {CATEGORIES.map((cat) => {
          const selected = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveCategory(cat.key)}
              className={`wno-cat-tab ${selected ? "wno-cat-tab-active" : ""}`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="wno-tour-grid">
        {visibleTours.map((tour) => (
          <article key={tour.id} className="wno-tour-card">
            <div className="wno-tour-img-wrap">
              <img
                src={tour.imageSrc}
                alt={tour.imageAlt}
                loading="lazy"
                className="wno-tour-img"
              />
              <span className="wno-tour-cat-pill">{tour.whatItIs}</span>
              <span className="wno-tour-pickup-pill">{tour.pickupBadge}</span>
            </div>

            <div className="wno-tour-body">
              <p className="wno-tour-where">{tour.whereItGoes}</p>
              <h3 className="wno-tour-title">{tour.title}</h3>
              <div className="wno-tour-fit">{tour.scheduleFit}</div>

              <dl className="wno-details-list">
                <div>
                  <dt>Duration</dt>
                  <dd>{tour.duration}</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>{tour.availability}</dd>
                </div>
                <div>
                  <dt>Pickup / Meeting</dt>
                  <dd>{tour.pickupLocation}</dd>
                </div>
                <div>
                  <dt>Checkout</dt>
                  <dd>{tour.checkoutProcessor}</dd>
                </div>
              </dl>

              <div className="wno-tour-footer">
                <div>
                  <span className="wno-price-val">{tour.price}</span>
                  <span className="wno-price-sub">{tour.priceSub}</span>
                </div>
                {tour.isExternal ? (
                  <a
                    href={tour.ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wno-book-btn"
                    data-wno-event="booking_button_clicked"
                    data-wno-label={tour.title}
                    data-wno-product={tour.id}
                  >
                    {tour.ctaLabel}
                  </a>
                ) : (
                  <Link
                    href={tour.ctaHref}
                    className="wno-book-btn"
                    data-wno-event="booking_button_clicked"
                    data-wno-label={tour.title}
                    data-wno-product={tour.id}
                  >
                    {tour.ctaLabel}
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
