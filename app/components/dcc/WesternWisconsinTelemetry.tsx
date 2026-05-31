"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

const CORRIDOR_ID = "western-wisconsin";

type CorridorEventName =
  | "landing_viewed"
  | "verdict_shown"
  | "handoff_viewed"
  | "shortlist_rendered"
  | "product_opened"
  | "cta_clicked_primary"
  | "cta_clicked_alternative";

type CorridorEventPayload = {
  corridor_id: string;
  event_name: CorridorEventName;
  source_page: string;
  target_path?: string;
  route_target?: string;
  default_card_slug?: string;
  fit_signal?: string;
  metadata?: Record<string, unknown>;
};

function postCorridorEvent(payload: CorridorEventPayload) {
  void fetch("/api/internal/corridor-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Analytics should never block navigation.
  });
}

export function trackWesternWisconsinClick(input: {
  sourcePage: string;
  targetPath: string;
  action: string;
  fitSignal?: string;
  metadata?: Record<string, unknown>;
}) {
  const isPrimaryStage = input.metadata?.stage === "recommended";
  const eventName =
    input.action === "product_opened"
      ? "product_opened"
      : isPrimaryStage
        ? "cta_clicked_primary"
        : "cta_clicked_alternative";

  trackEvent("dcc_exit_clicked", {
    surface: "western_wisconsin",
    page: input.sourcePage,
    corridor: CORRIDOR_ID,
    target_path: input.targetPath,
    action: input.action,
    fit_signal: input.fitSignal,
    ...(input.metadata ?? {}),
  });

  postCorridorEvent({
    corridor_id: CORRIDOR_ID,
    event_name: eventName,
    source_page: input.sourcePage,
    target_path: input.targetPath,
    route_target: input.targetPath,
    fit_signal: input.fitSignal,
    metadata: {
      action: input.action,
      ...(input.metadata ?? {}),
    },
  });
}

export default function WesternWisconsinTelemetry({
  page,
  pageRole,
  recommendationSlug,
}: {
  page: string;
  pageRole: "hub" | "feeder";
  recommendationSlug?: string;
}) {
  useEffect(() => {
    trackEvent("dcc_page_viewed", {
      surface: "western_wisconsin",
      page,
      corridor: CORRIDOR_ID,
      page_role: pageRole,
    });

    postCorridorEvent({
      corridor_id: CORRIDOR_ID,
      event_name: "landing_viewed",
      source_page: page,
      target_path: page,
      route_target: page,
      metadata: {
        page_role: pageRole,
        legacy_pair_event: "handoff_viewed",
      },
    });

    postCorridorEvent({
      corridor_id: CORRIDOR_ID,
      event_name: "handoff_viewed",
      source_page: page,
      target_path: page,
      route_target: page,
      metadata: {
        page_role: pageRole,
      },
    });
  }, [page, pageRole]);

  useEffect(() => {
    if (!recommendationSlug) return;

    postCorridorEvent({
      corridor_id: CORRIDOR_ID,
      event_name: "verdict_shown",
      source_page: page,
      target_path: page,
      route_target: page,
      default_card_slug: recommendationSlug,
      fit_signal: recommendationSlug,
      metadata: {
        page_role: pageRole,
        action: "recommendation_rendered",
        legacy_pair_event: "shortlist_rendered",
      },
    });

    postCorridorEvent({
      corridor_id: CORRIDOR_ID,
      event_name: "shortlist_rendered",
      source_page: page,
      target_path: page,
      route_target: page,
      default_card_slug: recommendationSlug,
      fit_signal: recommendationSlug,
      metadata: {
        page_role: pageRole,
        action: "recommendation_rendered",
      },
    });
  }, [page, pageRole, recommendationSlug]);

  return null;
}
