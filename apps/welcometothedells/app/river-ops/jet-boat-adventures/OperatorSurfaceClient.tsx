"use client";

import { useEffect, useMemo } from "react";
import type { OperatorSurfaceConfig } from "@/lib/operatorSurfaces";
import { trackDellsEvent, trackDellsLanding } from "@/lib/telemetry";

type OperatorSurfaceClientProps = {
  surface: OperatorSurfaceConfig;
};

const PRESERVED_QUERY_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "session_id",
  "dcc_handoff_id",
  "dcc_source",
  "dcc_corridor",
  "experience_type",
  "source_page",
  "cta",
  "decision_corridor",
  "decision_product",
  "decision_action",
  "decision_option",
  "decision_state",
  "decision_entry",
  "decision_cta",
] as const;

export default function OperatorSurfaceClient({ surface }: OperatorSurfaceClientProps) {
  const outboundHref = useMemo(() => buildContinuityHref(surface), [surface]);

  useEffect(() => {
    trackDellsLanding("operator-surface");
    trackDellsEvent("verdict_shown", {
      corridor: surface.associatedCorridor,
      decision_corridor: surface.associatedCorridor,
      decision_product: surface.decisionProduct,
      decision_state: "execution_confirmation",
      decision_action: "operator_surface_viewed",
      decision_option: surface.slug,
      execution_tier: surface.executionTier,
      route_target: surface.outboundHref,
      target_path: window.location.href,
    });
  }, [surface]);

  return (
    <div className="operator-actions" aria-label="Jet Boat execution actions">
      <a
        className="primary-button operator-primary-button"
        href={outboundHref}
        onClick={() =>
          trackDellsEvent("product_opened", {
            corridor: surface.associatedCorridor,
            decision_corridor: surface.associatedCorridor,
            decision_product: surface.decisionProduct,
            decision_state: "execution_confirmation",
            decision_action: "continue_to_ticket_hub",
            decision_option: surface.slug,
            decision_cta: surface.primaryCtaLabel,
            clicked_product_slug: surface.decisionProduct,
            execution_tier: surface.executionTier,
            route_target: surface.outboundHref,
            target_path: surface.outboundHref,
          })
        }
      >
        <span>{surface.primaryCtaLabel}</span>
        <small>{surface.secondaryCtaLabel}</small>
      </a>
      <div className="operator-escape-row">
        <a
          href={surface.upstreamEscapeRoute}
          onClick={() =>
            trackDellsEvent("product_opened", {
              corridor: surface.associatedCorridor,
              decision_corridor: surface.associatedCorridor,
              decision_product: surface.decisionProduct,
              decision_state: "wrong_lane",
              decision_action: "hub_selected",
              decision_option: "upstream_escape",
              decision_cta: "Back to location hubs",
              target_path: surface.upstreamEscapeRoute,
            })
          }
        >
          Wrong situation? Back to location hubs
        </a>
        <a
          href={surface.sidewaysEscapeRoute}
          onClick={() =>
            trackDellsEvent("product_opened", {
              corridor: surface.associatedCorridor,
              decision_corridor: surface.associatedCorridor,
              decision_product: surface.decisionProduct,
              decision_state: "sideways_lane",
              decision_action: "sideways_lane_selected",
              decision_option: "lounge",
              decision_cta: "Open the Lounge",
              target_path: surface.sidewaysEscapeRoute,
            })
          }
        >
          Open the Lounge
        </a>
      </div>
    </div>
  );
}

function buildContinuityHref(surface: OperatorSurfaceConfig) {
  if (typeof window === "undefined") return surface.outboundHref;

  const destination = new URL(surface.outboundHref);
  const inboundParams = new URLSearchParams(window.location.search);

  for (const key of PRESERVED_QUERY_KEYS) {
    const value = inboundParams.get(key);
    if (value) destination.searchParams.set(key, value);
  }

  destination.searchParams.set("decision_corridor", surface.associatedCorridor);
  destination.searchParams.set("decision_product", surface.decisionProduct);
  destination.searchParams.set("decision_action", "continue_to_ticket_hub");
  destination.searchParams.set("decision_option", surface.slug);
  destination.searchParams.set("decision_state", "execution_confirmation");
  destination.searchParams.set("decision_entry", "operator_surface");
  destination.searchParams.set("decision_cta", surface.primaryCtaLabel);
  destination.searchParams.set("dcc_corridor", surface.associatedCorridor);
  destination.searchParams.set("dcc_source", "welcometothedells");
  destination.searchParams.set("experience_type", "dells_operator_surface");
  destination.searchParams.set("source_page", surface.routePath);
  destination.searchParams.set("cta", "operator_surface_primary");

  return `${destination.pathname}${destination.search}`;
}
