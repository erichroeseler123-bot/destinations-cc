"use client";

import TrackedExternalAnchor from "@/app/components/analytics/TrackedExternalAnchor";
import type { ViatorLaneConfig, ViatorLaneProduct } from "@/lib/dcc/corridors/types";
import { appendViatorAttribution, buildViatorSearchUrl } from "@/lib/viator/links";

type ViatorCTAProps = {
  lane: ViatorLaneConfig;
  product: ViatorLaneProduct;
  className?: string;
  children: React.ReactNode;
  date?: string;
  eventProps?: Record<string, unknown>;
  urlParams?: Record<string, string | null | undefined>;
  target?: string;
  rel?: string;
};

function appendUrlParams(href: string, params?: Record<string, string | null | undefined>): string {
  if (!params) return href;

  const normalized = new URL(href);
  for (const [key, value] of Object.entries(params)) {
    if (value) normalized.searchParams.set(key, value);
  }

  return normalized.toString();
}

function buildViatorHref(
  lane: ViatorLaneConfig,
  product: ViatorLaneProduct,
  urlParams?: Record<string, string | null | undefined>
): string {
  const campaign = product.campaign;
  const currency = "USD";

  if (product.productUrl) {
    return appendUrlParams(
      appendViatorAttribution(product.productUrl, {
        campaign,
        currency,
        preserveExistingCampaign: false,
      }),
      urlParams
    );
  }

  return appendUrlParams(
    buildViatorSearchUrl(
      product.searchQuery ||
        product.fallbackSearchQuery ||
        `${lane.destination} ${lane.primaryIntent} tours`,
      { campaign, currency }
    ),
    urlParams
  );
}

export default function ViatorCTA({
  lane,
  product,
  className,
  children,
  date,
  eventProps,
  urlParams,
  target,
  rel,
}: ViatorCTAProps) {
  if (!product.campaign || !product.slot) return null;

  const isSearchFallback = !product.productUrl;
  const fallbackEventProps = {
    ...eventProps,
    surface: lane.corridorId,
    corridor: lane.corridorId,
    source_page: lane.sourcePage,
    destination: lane.destination,
    entry_type: lane.entryType,
    role: lane.role,
    primary_intent: lane.primaryIntent,
    intent: product.intent,
    decision_option: product.decisionOption,
    product_slot: product.slot,
    product_code: product.productCode,
    product_title: product.title,
    campaign: product.campaign,
    vendor: "viator",
    fallback_provider: "viator",
    fallback_inventory_viewed: true,
    fallback_mode: isSearchFallback,
    date,
  };

  return (
    <TrackedExternalAnchor
      href={buildViatorHref(lane, product, urlParams)}
      className={className}
      shownEvents={[
        {
          name: "fallback_inventory_viewed",
          props: fallbackEventProps,
        },
      ]}
      clickEvents={[
        {
          name: "product_opened",
          props: {
            ...fallbackEventProps,
            fallback_event_name: "marketplace_fallback_clicked",
          },
        },
        {
          name: "marketplace_fallback_clicked",
          props: fallbackEventProps,
        },
        {
          name: "viator_fallback_handoff",
          props: fallbackEventProps,
        },
      ]}
      eventProps={fallbackEventProps}
      target={target}
      rel={rel}
    >
      {children}
    </TrackedExternalAnchor>
  );
}
