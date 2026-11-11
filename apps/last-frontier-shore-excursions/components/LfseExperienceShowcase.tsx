"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trackAffiliateEvent } from "@/lib/analytics";
import styles from "../app/home.module.css";

export type LfseBookingCategory = "bookable" | "inquiry" | "held";

export interface LfseStandardizedCardItem {
  id: string;
  category: LfseBookingCategory;
  statusBadge: string;
  portName: string;
  portSlug: string;
  activitySlug?: string;
  productId?: string;
  attributionCampaign?: string;
  image: string;
  imageAlt: string;
  whatItIs: string;
  whereItGoes: string;
  dateAvailability: string;
  duration: string;
  pickupLocation: string;
  priceLabel: string;
  priceSubtext: string;
  scheduleFit: string;
  checkoutProcessor: string;
  ctaLabel: string;
  ctaHref?: string;
  ctaExternal?: boolean;
  ctaSponsored?: boolean;
  providerName?: string;
  addToCpHref?: string;
}

const FILTER_TABS: Array<{ id: "all" | LfseBookingCategory; label: string }> = [
  { id: "all", label: "All Highlighted Options" },
  { id: "bookable", label: "Bookable Now (Direct Partner)" },
  { id: "inquiry", label: "Inquiry-Only (Concierge)" },
  { id: "held", label: "Commercially Held" },
];

export function LfseExperienceShowcase({
  items,
}: {
  items: LfseStandardizedCardItem[];
}) {
  const [activeFilter, setActiveFilter] = useState<"all" | LfseBookingCategory>("all");

  const visibleItems =
    activeFilter === "all"
      ? items
      : items.filter((item) => item.category === activeFilter);

  const handlePartnerClick = (item: LfseStandardizedCardItem) => {
    if (item.category !== "bookable" || !item.ctaHref) return;
    trackAffiliateEvent({
      event: "affiliate_link_click",
      port: item.portSlug as "juneau" | "skagway" | "ketchikan" | "sitka" | "icy-strait-point",
      category: item.activitySlug || "shore-excursions",
      provider: item.providerName || item.checkoutProcessor,
      productId: item.productId,
      tourTitle: item.whatItIs,
      destinationUrl: item.ctaHref,
      placement: "card",
      isExactProduct: true,
      campaign: item.attributionCampaign || "last-frontier-home-card",
      status: "available",
    });
  };

  return (
    <div>
      <div className={styles.filterTabs} role="tablist" aria-label="Filter shore excursions by booking status">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(tab.id)}
              className={`${styles.filterTab} ${isActive ? styles.filterTabActive : ""}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={styles.cardGrid}>
        {visibleItems.map((item) => {
          const badgeClass =
            item.category === "bookable"
              ? styles.statusBadgeBookable
              : item.category === "inquiry"
              ? styles.statusBadgeInquiry
              : styles.statusBadgeHeld;

          return (
            <article key={item.id} className={styles.tourCard}>
              <div className={styles.tourImgWrap}>
                <img
                  src={item.image}
                  alt={item.imageAlt}
                  width={600}
                  height={375}
                  loading="lazy"
                  className={styles.tourImg}
                />
                <span className={styles.portBadge}>{item.portName}</span>
                <span className={badgeClass}>{item.statusBadge}</span>
              </div>

              <div className={styles.tourBody}>
                {/* 2. Where it goes */}
                <p className={styles.tourWhere}>{item.whereItGoes}</p>

                {/* 1. What it is */}
                <h3 className={styles.tourTitle}>{item.whatItIs}</h3>

                {/* 7. Whether it fits the traveler's schedule */}
                <div
                  className={
                    item.category === "held" ? styles.fitCalloutHeld : styles.fitCallout
                  }
                >
                  {item.scheduleFit}
                </div>

                {/* 3, 4, 5, 8: Date/availability, Duration, Pickup location, Checkout processor */}
                <dl className={styles.detailsList}>
                  <div>
                    <dt>Availability</dt>
                    <dd>{item.dateAvailability}</dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{item.duration}</dd>
                  </div>
                  <div>
                    <dt>Meeting / Pickup</dt>
                    <dd>{item.pickupLocation}</dd>
                  </div>
                  <div>
                    <dt>Checkout</dt>
                    <dd>{item.checkoutProcessor}</dd>
                  </div>
                </dl>

                {/* 6. Price & 9. One clear booking or inquiry button */}
                <div className={styles.tourFooter}>
                  <div className={styles.priceRow}>
                    <strong className={styles.priceVal}>{item.priceLabel}</strong>
                    <span className={styles.priceNote}>{item.priceSubtext}</span>
                  </div>

                  {item.category === "bookable" && item.ctaHref ? (
                    <a
                      href={item.ctaHref}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      onClick={() => handlePartnerClick(item)}
                      className={styles.bookBtn}
                    >
                      {item.ctaLabel}
                    </a>
                  ) : item.category === "inquiry" && item.ctaHref ? (
                    item.ctaExternal ? (
                      <a
                        href={item.ctaHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.inquiryBtn}
                      >
                        {item.ctaLabel}
                      </a>
                    ) : (
                      <Link href={item.ctaHref} className={styles.inquiryBtn}>
                        {item.ctaLabel}
                      </Link>
                    )
                  ) : (
                    <Link href="/contact" className={styles.heldNoticeBtn}>
                      {item.ctaLabel}
                    </Link>
                  )}

                  {item.addToCpHref ? (
                    <a
                      href={item.addToCpHref}
                      data-testid="lfse-add-to-cp-plan"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.cpPlanLink}
                    >
                      + Add to Cruise Promenade Plan
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
